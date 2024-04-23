"use strict";
import os from "os";
import crypto from "crypto";
import QboxImap from "qboxmail-imap";
import async from "async";
import axios from "axios";
import mailparser from "mailparser";
import _ from "lodash";
import path from "path";
import MailComposer from "nodemailer/lib/mail-composer/index.js";
import nodemailer from "nodemailer";
import nodemailHtmlToText from "nodemailer-html-to-text";
import crc from "crc";
import tnef from "node-tnef";
import moment from "moment-timezone";
import * as cheerio from "cheerio";
import {v1 as uuidv1} from "uuid";
import he from "he";
import {convert} from "html-to-text";
import utf7 from "utf7";
import JSZip from "jszip";
import utils from "../helpers/utils.js";
import config from "../../config.js";
// import messageParser from "./messageParser.js";

function checkUids(uids) {
  if (typeof uids === "undefined" || uids === null) return false;
  if (uids === "*" || uids === "*:*") return true;
  if (typeof uids === "number") {
    if (uids <= 0) {
      return false;
    }
    return true;
  }
  if (typeof uids === "object") {
    if (uids.length === 0) {
      return false;
    }
  }
  for (let i in uids) {
    if (uids[i] === null || uids[i] === undefined || isNaN(uids[i]) || parseInt(uids[i], 10) <= 0) {
      return false;
    }
  }
  return true;
}

export default function (app, socket = null) {
  let imapmodule = {};
  // const parser = messageParser(app);

  /******************** LOCAL CONN SCHELETON ****************/
  imapmodule.local_work = function (data, do_something, callback) {
    if (!data.action) {
      app.logger.error(
        `${
          data && data.connection_data && data.connection_data.user
        } LOCAL WORK DOES NOT HAVE ACTION FIELD!!!! ${do_something.toString()}`
      );
      return callback("LOCAL WORK DOES NOT HAVE ACTION FIELD!!!!");
    }
    app.logger.debug(
      `${data && data.connection_data && data.connection_data.user} LOCAL WORK ${
        data.action
      } CALLED`
    );

    let result = null;
    async.series(
      [
        function (cb) {
          let conn = new QboxImap(data.connection_data);
          let callback_called = false;

          conn.once("ready", function () {
            /*  console.time(
              `${data && data.connection_data && data.connection_data.user} - ${data.action}`
            ); */

            let client_ip = data.client_ip || null;
            // imapmodule.send_imap_id(conn, client_ip);
            if (data.params.folder) {
              conn.openBox(data.params.folder, function (err, box) {
                if (err) {
                  conn.end();
                  callback_called = true;
                  return cb(err);
                }
                data.params.box = box;
                do_something(conn, data.params, function (err, res) {
                  conn.end();
                  result = res;
                  callback_called = true;
                  return cb(err);
                });
              });
            } else {
              do_something(conn, data.params, function (err, res) {
                conn.end();
                result = res;
                callback_called = true;
                return cb(err);
              });
            }
          });

          conn.once("error", function (err) {
            conn.end();
            if (!callback_called) {
              return cb(err);
            }
          });

          conn.once("end", function () {});

          conn.connect();
        },
      ],
      function (err) {
        /* console.timeEnd(
          `${data && data.connection_data && data.connection_data.user} - ${data.action}`
        ); */
        return callback(err, result);
      }
    );
  };
  /*****************************************************/

  imapmodule.getMessage = function (data, callback) {
    let saveMessage = false;
    let message = null;
    let rawMessage = null;
    let isHuge = 0;

    async.series(
      [
        function (cb) {
          const params = {
            params: {
              folder: data.params.folder,
              uid: data.params.uid,
            },
            connection_data: data.connection_data,
            action: "get_message",
            client_ip: data.client_ip,
          };

          imapmodule.local_work(params, imapmodule.fetch_message, function (err, res) {
            if (err) {
              return cb(err);
            }
            if (Object.keys(res.message).length === 0) {
              return cb(
                `USER ${data.params.user} - FOLDER ${data.params.folder} - UID ${data.params.uid} FETCHING ERROR`
              );
            }

            message = res.message;
            rawMessage = res.message;
            isHuge = res.isHuge;
            return cb();
          });
        },
      ],
      (err) => {
        if (err) {
          app.logger.error(
            `getMessage ERROR FOR USER ${data.params.user} - ${JSON.stringify(err)}`
          );
          return callback(err);
        }

        return callback(null, message);
      }
    );
  };

  imapmodule.fetch_message = function (conn, data, callback) {
    if (!conn || conn.state !== "authenticated") {
      app.logger.error(`IMAP connection not available`);
      return callback({err: "IMAP connection not available"});
    }

    if (!conn._box) {
      return callback({err: "Folder not selected"});
    }
    if (!data.uid) {
      return callback({err: "fetch_message: No uid provided"});
    }
    if (!checkUids(parseInt(data.uid, 10))) {
      return callback({err: `fetch_message: Wrong uid ${data.uid} provided`});
    }

    let filters = {bodies: "", struct: true, extensions: ["X-MAILBOX", "X-REAL-UID"], size: true};
    let msg_obj = {};
    let folderName = "";

    msg_obj.originalData = {};

    let f = conn.fetch(parseInt(data.uid, 10), filters);

    f.on("message", function (msg, seqno) {
      msg.on("body", function (stream, info) {
        let chunks = [];
        stream.on("data", function (chunk) {
          chunks.push(chunk);
        });
        stream.once("end", function () {
          msg_obj["body"] = Buffer.concat(chunks);
        });
      });
      msg.once("attributes", function (attrs) {
        msg_obj.attrs = attrs;
        msg_obj["uid"] = attrs["uid"];
        msg_obj["flags"] = attrs["flags"];
        msg_obj["size"] = attrs["size"];
        let text_size = 0;
        let struct = _.flattenDeep(attrs["struct"]);
        for (let i = 0; i < struct.length; i++) {
          if (struct[i].type === "text" && struct[i].subtype === "plain") {
            text_size += struct[i].size;
          }
        }
        msg_obj["text_size"] = text_size;

        try {
          folderName = utf7.imap.decode(msg_obj.attrs["x-mailbox"].toString());
        } catch (e) {
          app.logger.error(`Error decoding folder ${msg_obj.attrs["x-mailbox"]}`);
          folderName = msg_obj.attrs["x-mailbox"].toString();
        }
      });
      msg.once("end", function () {
        msg_obj.originalData = {
          uid: msg_obj.attrs["x-real-uid"],
          folder: folderName,
        };
      });
    });
    f.once("error", function (err) {
      conn.end();
      return callback(err);
    });
    f.once("end", function () {
      let isHuge = msg_obj["text_size"] > config.imap_text_message_max_size ? 1 : 0;
      return callback(null, {message: msg_obj, isHuge: isHuge});
    });
  };

  // imapmodule.updateParentFlags = function (conn, data, callback) {
  //   if (!conn || conn.state !== "authenticated") {
  //     app.logger.error(`IMAP connection not available`);
  //     return callback({err: "IMAP connection not available"});
  //   }

  //   async.series(
  //     [
  //       function (cb) {
  //         if (!data.msg.headers.hasOwnProperty("parent_uid")) {
  //           return cb();
  //         }
  //         if (data.msg.headers.parent_flag !== "Answered") {
  //           return cb();
  //         }
  //         const params = {
  //           params: {
  //             uids: [{folder: data.msg.headers.parent_folder, uid: data.msg.headers.parent_uid}],
  //             action: true,
  //             flag: data.msg.headers.parent_flag,
  //           },
  //           connection_data: data.imap_data,
  //           action: "toggle_flags",
  //           client_ip: data.msg.headers["X-Sender-IP"],
  //         };
  //         imapmodule.local_work(params, imapmodule.toggle_flags, function (err) {
  //           return cb(err);
  //         });
  //       },
  //       function (cb) {
  //         if (!data.msg.headers.hasOwnProperty("parent_uid")) {
  //           return cb();
  //         }
  //         if (data.msg.headers.parent_flag !== "$forwarded") {
  //           return cb();
  //         }
  //         const params = {
  //           params: {
  //             uids: [{folder: data.msg.headers.parent_folder, uid: data.msg.headers.parent_uid}],
  //             action: true,
  //             flag: data.msg.headers.parent_flag,
  //           },
  //           connection_data: data.imap_data,
  //           action: "toggle_keywords",
  //           client_ip: data.msg.headers["X-Sender-IP"],
  //         };
  //         imapmodule.local_work(params, imapmodule.toggle_keywords, function (err) {
  //           return cb(err);
  //         });
  //       },
  //     ],
  //     function (err) {
  //       return callback(err);
  //     }
  //   );
  // };

  imapmodule.get_message_uids = function (conn, data, callback) {
    if (!conn || conn.state !== "authenticated") {
      app.logger.error(`IMAP connection not available`);
      return callback({err: "IMAP connection not available"});
    }

    let criteria = data.criteria;

    conn.sort(criteria.sort, criteria.search, function (err, res) {
      if (err) return callback(err);
      if (!res || res.length === 0) {
        app.logger.error(`Fetch error: empty sort result`);
        return callback(`Fetch error: empty sort result`);
      }

      let originalData = {};

      let f = conn.fetch(res, {
        extensions: ["X-MAILBOX", "X-REAL-UID"],
      });

      f.on("message", function (msg, seqno) {
        let msg_obj = {};
        let folderName = null;
        msg.once("attributes", function (attrs) {
          msg_obj.attrs = attrs;
          try {
            folderName = utf7.imap.decode(msg_obj.attrs["x-mailbox"].toString());
          } catch (e) {
            app.logger.error(`Error decoding folder ${msg_obj.attrs["x-mailbox"]}`);
            folderName = msg_obj.attrs["x-mailbox"].toString();
          }
        });
        msg.once("end", function () {
          originalData[msg_obj.attrs.uid] = {
            uid: msg_obj.attrs["x-real-uid"],
            folder: folderName,
          };
        });
      });
      f.once("error", function (err) {
        app.logger.error(`Fetch error: ${JSON.stringify(err)}`);
        return callback(err);
      });
      f.once("end", function () {
        return callback(null, originalData);
      });
    });
  };

  imapmodule.get_messages_list = function (conn, data, callback) {
    if (!conn || conn.state !== "authenticated") {
      app.logger.error(`IMAP connection not available`);
      return callback({err: "IMAP connection not available"});
    }

    if (!conn._box) {
      return callback({err: "Folder not selected"});
    }

    let found_messages_number = 0;
    let needed_uids = null;
    let sort_uids = [];
    let thread_uids = [];
    let thread_relations = {};
    let messages = {};
    let parsed_messages = [];
    let flippedChildren = {};
    let searchInRedis = false;
    let messageCounters = data.box && data.box.messages;

    const key = (
      conn._config.user +
      ":mail:" +
      Buffer.from(data.folder).toString("base64") +
      ":search:" +
      Buffer.from(JSON.stringify(data.criteria)).toString("base64")
    ).replace(" ", "_");

    async.series(
      [
        // make IMAP search to get the list of messages
        function (cb) {
          conn.search(["UNSEEN"], function (err, results) {
            if (err) {
              return cb(err);
            }
            messageCounters.unseen = results.length;
            return cb();
          });
        },
        function (cb) {
          // sort the results
          conn.sort(data.criteria.sort, data.criteria.search, function (err, res) {
            if (err) return cb(err);
            sort_uids = res;
            found_messages_number = res.length;
            if (!data.showThreads) {
              if (data.last_uid < 0) {
                needed_uids = sort_uids.slice(0, data.numMsgs);
              } else {
                let idx = sort_uids.indexOf(data.last_uid) + 1;
                needed_uids = sort_uids.slice(idx, idx + data.numMsgs);
              }
            }
            return cb();
          });
        },
        function (cb) {
          // get threads info
          imapmodule.getThreadedUids(conn, data.criteria, sort_uids, function (err, res) {
            if (err) return cb(err);
            thread_uids = res.uids;
            thread_relations = res.obj_threads;
            if (data.last_uid < 0) {
              needed_uids = thread_uids.slice(0, data.numMsgs);
            } else {
              let idx = thread_uids.indexOf(data.last_uid) + 1;
              needed_uids = thread_uids.slice(idx, idx + data.numMsgs);
            }
            let relatedUIDS = [];
            for (let i in needed_uids) {
              let c = thread_relations[needed_uids[i].toString()];
              relatedUIDS = relatedUIDS.concat(c);
              for (let u of c) {
                flippedChildren[u] = needed_uids[i];
              }
            }
            needed_uids = needed_uids.concat(relatedUIDS);
            return cb();
          });
        },
        function (cb) {
          if (!needed_uids || needed_uids.length === 0) {
            return cb();
          }

          let f = null;

          // get the needed fields to send them to the UI
          f = conn.fetch(needed_uids, {
            bodies: "HEADER.FIELDS (FROM TO SUBJECT DATE PRIORITY)",
            extensions: ["X-MAILBOX", "X-REAL-UID"],
            preview: true,
            size: true,
          });

          f.on("message", function (msg, seqno) {
            let msg_obj = {};
            msg.once("attributes", function (attrs) {
              msg_obj.attrs = attrs;
            });
            msg.on("body", function (stream, info) {
              let chunks = [];
              stream.on("data", function (chunk) {
                chunks.push(chunk);
              });
              stream.once("end", function () {
                msg_obj["body"] = Buffer.concat(chunks);
              });
              msg_obj["size"] = info.size;
            });
            msg.once("end", function () {
              messages[msg_obj.attrs.uid] = msg_obj;
            });
          });
          f.once("error", function (err) {
            app.logger.error(`Fetch error: ${JSON.stringify(err)}`);
          });
          f.once("end", function () {
            return cb();
          });
        },
        function (cb) {
          if (!needed_uids || needed_uids.length === 0) {
            return cb();
          }
          async.forEachSeries(
            needed_uids.reverse(),
            function (uid, cb1) {
              let msg = messages[uid];
              if (!msg) {
                // in case the message has been deleted from other clients in the meanwhile
                return cb1();
              }
              try {
                // parse the messages' body
                mailparser.simpleParser(msg.body, (err, mail) => {
                  if (err) return cb1(err);
                  let folderName = null;
                  try {
                    folderName = utf7.imap.decode(msg.attrs["x-mailbox"].toString());
                  } catch (e) {
                    app.logger.error(`Error decoding folder ${msg.attrs["x-mailbox"]}`);
                    folderName = msg.attrs["x-mailbox"].toString();
                  }
                  let preview = "";
                  if (msg.attrs.preview && msg.attrs.preview.length > 0) {
                    if (typeof msg.attrs.preview === "object") {
                      preview = msg.attrs.preview[1];
                    } else {
                      preview = msg.attrs.preview;
                    }
                  }

                  let m = {
                    attachmentsMetaData: [],
                    bcc: mail.bcc || "",
                    cc: mail.cc || "",
                    date: mail.date,
                    flags: msg.attrs.flags,
                    from: mail.from ? utils.unpackFrom(mail.from) : "",
                    fullMessage: true,
                    headers: Object.fromEntries(mail.headers),
                    html: "",
                    imagesData: {},
                    isHuge: 0,
                    originalData: {
                      uid: msg.attrs["x-real-uid"],
                      folder: folderName,
                    },
                    preview: preview,
                    size: msg.attrs.size,
                    subject: mail.subject,
                    text: "",
                    textAsHtml: "",
                    threadMessageFlagged: false,
                    threadUnreaded: false,
                    to: mail.to || "",
                    uid: msg.attrs.uid,
                  };
                  parsed_messages.push(m);
                  return cb1();
                });
              } catch (e) {
                app.logger.error("get_messages_list simpleparser error");
                app.logger.error(e);
                return cb1(e);
              }
            },
            function (err) {
              return cb(err);
            }
          );
        },
      ],
      function (err) {
        if (err) {
          return callback(err);
        }

        let parentMessages = [];
        let childrenMessages = {};
        if (data.showThreads) {
          let parentUIDS = Object.keys(thread_relations);
          for (let msg of parsed_messages) {
            if (parentUIDS.indexOf(msg.uid.toString()) >= 0) {
              parentMessages.push(msg);
            } else {
              let pu = flippedChildren[msg.uid];
              if (!childrenMessages[pu]) {
                childrenMessages[pu] = [];
              }
              childrenMessages[pu].push({
                uid: msg.uid,
                from: msg.from,
                to: msg.to,
                date: msg.date,
                subject: msg.subject,
                flags: msg.flags,
                attachments: msg.attachments ? msg.attachments.length : 0,
                fullMessage: msg.fullMessage,
                preview: msg.preview,
                originalData: msg.originalData,
              });
            }
          }
        } else {
          parentMessages = parsed_messages;
        }
        return callback(null, {
          found_messages_number: found_messages_number,
          msgsData: parentMessages.reverse(),
          msgsRelated: childrenMessages,
          messageCounters: messageCounters,
          highestmodseq:
            conn._box && conn._box.name !== "Virtual/All" ? conn._box.highestmodseq : null,
        });
      }
    );
  };

  imapmodule.getThreadedUids = function (conn, criteria, all_uids, callback) {
    if (!conn || conn.state !== "authenticated") {
      return callback({
        err: `${
          conn && conn._config && conn._config.user ? conn._config.user : "unknown"
        } No imap connection`,
      });
    }
    let user = conn._config.user || "unknown";
    let obj_threads = {};
    let uids = [];

    let algorithm = "REFERENCES";
    if (conn.serverSupports("THREAD=REFS")) algorithm = "REFS";

    conn.thread(algorithm, criteria.search, function (err, threaduids) {
      if (err) return callback(err);
      let cleaned_threads = [];

      for (let i = 0; i < threaduids.length; i++) {
        if (typeof threaduids[i][0] === "number") {
          cleaned_threads.push(_.flattenDeep(threaduids[i]));
        } else {
          for (let j = 0; j < threaduids[i].length; j++) {
            cleaned_threads.push(_.flattenDeep(threaduids[i][j]));
          }
        }
      }

      for (let i = 0; i < cleaned_threads.length; i++) {
        let last = Math.max(...cleaned_threads[i]);
        cleaned_threads[i].splice(cleaned_threads[i].indexOf(last), 1);
        obj_threads[last] = cleaned_threads[i];
      }

      for (let j = 0; j < all_uids.length; j++) {
        if (obj_threads.hasOwnProperty(all_uids[j].toString())) {
          uids.push(all_uids[j]);
        }
      }
      return callback(null, {uids: uids, obj_threads: obj_threads});
    });
  };

  return imapmodule;
}
