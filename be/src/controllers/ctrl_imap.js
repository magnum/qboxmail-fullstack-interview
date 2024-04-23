"use strict";
import async from "async";
import _ from "lodash";
import {v1 as uuidv1} from "uuid";
import imapFiltersParser from "../helpers/imapFiltersParser.js";
import qbimap from "../libs/qbimap.js";
import email_validator from "email-validator";
import lang from "../langs/check.js";
import nodemailer from "nodemailer";
import crc from "crc";
import fs from "fs";
import {convert} from "html-to-text";
import axios from "axios";
import https from "https";
import mailParser from "mailparser";

export default function (app, socket) {
  const imap = new qbimap(app, socket);
  let imapmodule = {};

  // close all imap connections passed
  function close_imap_connections(connections, interval, callback) {
    if (interval) {
      clearInterval(interval);
    }
    async.forEach(
      connections,
      function (conn, cb) {
        if (!conn) {
          return cb();
        }
        imap.close_imap(conn, function (err) {
          if (err) return cb(err);
          conn = null;
          return cb();
        });
      },
      function (err) {
        if (err) return callback(err);
        return callback();
      }
    );
  }

  function startIdle(idle_data) {
    let conn = imap.idle(idle_data, function (err, type, info, highestmodseq) {
      if (err) {
        //app.logger.error(`${socket.qboxmail.imap_connection_params.user} ERROR FROM IDLE`);
        //app.logger.error(err);
        if (err === "idle_closed") {
          app.logger.debug(`RESTART IDLE FOR FOLDER ${type}`);
          if (socket.connected) {
            imapmodule.handleIdle(type);
          }
          return;
        }
        socket.emit("imap_error_idle", err);
        return;
      }

      if (type === "open_idle") {
        delete socket.qboxmail.imap_new_open_folder;
        imapmodule.handleIdle(info);

        return;
      }

      if (type === "mail") {
        socket.emit("imap_idle_request", idle_data.folder, type, info, highestmodseq);
        return;
      }

      // IDLE triggered: expunge / update / uidvalidity
      if (idle_data.folder === "INBOX") {
        if (imapmodule.active_timer_inbox) {
          clearTimeout(imapmodule.active_timer_inbox);
        }
        imapmodule.active_timer_inbox = setTimeout(() => {
          socket.emit("imap_idle_request", idle_data.folder, type, info);
        }, 5000);
        return;
      }

      if (imapmodule.active_timer) {
        clearTimeout(imapmodule.active_timer);
      }
      imapmodule.active_timer = setTimeout(() => {
        socket.emit("imap_idle_request", idle_data.folder, type, info);
      }, 5000);
    });
    if (idle_data.folder === "INBOX") {
      socket.qboxmail.imap_inbox_idle_conn = conn;
    } else {
      socket.qboxmail.imap_idle_conn = conn;
    }
  }

  imapmodule.stop_connection = function (callback) {
    close_imap_connections(
      [socket.qboxmail.imap_idle_conn, socket.qboxmail.imap_inbox_idle_conn],
      socket.qboxmail.imap_folders_interval,
      function (err) {
        if (err) {
          app.logger.error(
            `${socket.qboxmail.imap_connection_params.user} Error closing connections`
          );
        } else {
          app.logger.debug(
            `${socket.qboxmail.imap_connection_params.user} IMAP connections closed`
          );
        }
        if (callback) return callback(err);
      }
    );
  };

  imapmodule.handleIdle = function (folder) {
    if (app.get("isMtm")) {
      return;
    }

    let conn_params = _.cloneDeep(socket.qboxmail.imap_connection_params);
    conn_params.keepalive.forceNoop = false; // IDLE CONNECTION

    let idle_data = {
      folder: folder,
      connection_data: conn_params,
    };

    if (folder === "INBOX" && !socket.qboxmail.imap_inbox_idle_conn) {
      startIdle(idle_data);
      return;
    }

    if (folder === "INBOX" && socket.qboxmail.imap_inbox_idle_conn) {
      if (socket.qboxmail.imap_idle_conn) {
        socket.qboxmail.imap_new_open_folder = folder;
        imap.close_imap(socket.qboxmail.imap_idle_conn, function (err) {
          if (err) {
            app.logger.error(
              `ERROR CLOSING IDLE FOR ${socket.qboxmail.imap_idle_conn._box.name}: ${err}`
            );
          }
          socket.qboxmail.imap_idle_conn = null;
        });
      }
      return;
    }

    if (folder === "search_all_folders") {
      if (socket.qboxmail.imap_idle_conn) {
        socket.qboxmail.imap_new_open_folder = folder;
        imap.close_imap(socket.qboxmail.imap_idle_conn, function (err) {
          if (err) {
            app.logger.error(
              `ERROR CLOSING IDLE FOR ${socket.qboxmail.imap_idle_conn._box.name}: ${err}`
            );
          }
        });
      }
      app.logger.debug(`Current folder is search_all_folders - idle not needed`);
      return;
    }

    if (
      socket.qboxmail.imap_idle_conn &&
      socket.qboxmail.imap_idle_conn._box &&
      folder === socket.qboxmail.imap_idle_conn._box.name
    ) {
      app.logger.debug(`Current folder is the same as new folder - idle not needed`);
      return;
    }

    // close current idle connection
    if (socket.qboxmail.imap_idle_conn) {
      socket.qboxmail.imap_new_open_folder = folder;
      imap.close_imap(socket.qboxmail.imap_idle_conn, function (err) {
        if (err) {
          app.logger.error(
            `ERROR CLOSING IDLE FOR ${socket.qboxmail.imap_idle_conn._box.name}: ${err}`
          );
        }
      });
      return;
    }
    startIdle(idle_data);
    if (socket && socket.qboxmail && socket.qboxmail.imap_new_open_folder) {
      socket.qboxmail.imap_new_open_folder = null;
    }
    return;
  };

  imapmodule.start_connection = function () {
    let already_starting_connection = false;
    async.series(
      [
        function (cb) {
          if (socket.qboxmail.imap_is_starting_connection) {
            app.logger.debug(
              `${socket.qboxmail.imap_connection_params.user} Connection is already started... exit`
            );
            already_starting_connection = true;
            return cb();
          }
          app.logger.info(
            `${socket.qboxmail.imap_connection_params.user} starting connection from ${
              socket && socket.client_address
            }`
          );
          socket.qboxmail.imap_is_starting_connection = true;

          return cb();
        },
        function (cb) {
          if (already_starting_connection) {
            return cb();
          }
          // create idle connection for INBOX
          imapmodule.handleIdle("INBOX");
          // create a connections for folders status
          // and start a timer to check folder status every few minutes
          imapmodule.update_folders();

          if (!socket.qboxmail.imap_folders_interval && !app.get("isMtm")) {
            socket.qboxmail.imap_folders_interval = setInterval(function () {
              imapmodule.update_folders();
            }, app.get("config").update_folders_interval);
          }
          return cb();
        },
      ],
      function (err, res) {
        if (err) {
          app.logger.error(
            `${socket.qboxmail.imap_connection_params.user} ERROR ON OPEN_CONNECTION`
          );
          app.logger.error(err);
          socket.emit("force_disconnect", {"ERROR ON OPEN_CONNECTION": err});
          return;
        }
        if (!already_starting_connection) {
          socket.emit("imap_start_connection_answer", {});
          socket.qboxmail.imap_is_starting_connection = false;
        }
      }
    );
  };

  imapmodule.open_folder = function (msg) {
    let changeFolder = true;
    if (socket.qboxmail.imap_current_folder === msg.folder && !msg.forceOpen) {
      changeFolder = false;
    }
    if (changeFolder) {
      app.logger.debug(
        `${socket.qboxmail.imap_connection_params.user} changing folder to ${msg.folder}`
      );
    } else {
      app.logger.debug(
        `${socket.qboxmail.imap_connection_params.user} Current folder is the same as new folder (${msg.folder})`
      );
    }
    let requestParams = Object.assign(msg);

    socket.qboxmail.imap_current_folder = requestParams.folder;
    imapmodule.get_messages_list({
      folder: socket.qboxmail.imap_current_folder,
      connection_data: socket.qboxmail.imap_connection_params,
      criteria: requestParams.filters,
      numMsgs: app.get("config").numberOfMessages,
      showThreads: requestParams.showThreads,
      showRecentMessages: socket.qboxmail.imap_current_folder === "INBOX",
    });

    imapmodule.handleIdle(requestParams.folder);
  };

  imapmodule.get_messages_list = function (msg) {
    let response = null;
    let criteria = null;
    let full_text = app.get("config").enable_fulltext_search;

    if (msg.criteria) {
      if (msg.criteria.hasOwnProperty("limited")) {
        full_text = app.get("config").enable_fulltext_search && !msg.criteria.limited;
      }

      if (msg.criteria.query) {
        msg.criteria.query = msg.criteria.query.replace(/\s+/gm, " ");
      }

      if (msg.criteria.to) {
        msg.criteria.to = msg.criteria.to.replace(/\s+/gm, " ");
      }

      if (msg.criteria.from) {
        msg.criteria.from = msg.criteria.from.replace(/\s+/gm, " ");
      }

      if (msg.criteria.subject) {
        msg.criteria.subject = msg.criteria.subject.replace(/\s+/gm, " ");
      }
    }

    async.series(
      [
        function (cb) {
          if (!full_text || app.get("isMtm")) {
            return cb();
          }

          if (
            msg.fts_autoindex === true ||
            msg.folder !== "search_all_folders" ||
            !msg.criteria ||
            !msg.criteria.hasOwnProperty("query") ||
            (msg.criteria && msg.criteria.last_uid && msg.criteria.last_uid !== -1)
          ) {
            return cb();
          }

          let sql = `UPDATE vpopmail.vpopmail
          SET fts_autoindex = "yes"
          WHERE concat(pw_name,'@',pw_domain) = ${app.mariasqlconn.escape(
            socket.qboxmail.imap_connection_params.user
          )}`;

          app.mariasqlconn.query(sql, function (err) {
            return cb(err);
          });
        },
        function (cb) {
          //fake call to start index in solr
          if (!full_text || app.get("isMtm")) {
            return cb();
          }

          if (
            msg.fts_autoindex === true ||
            msg.folder !== "search_all_folders" ||
            !msg.criteria ||
            !msg.criteria.hasOwnProperty("query") ||
            (msg.criteria && msg.criteria.last_uid && msg.criteria.last_uid !== -1)
          ) {
            return cb();
          }

          criteria = imapFiltersParser.parse(msg.criteria, true);

          const data = {
            params: {
              folder: "Virtual/All",
              criteria: criteria,
              full_text: true,
              last_uid: -1,
              numMsgs: app.get("config").numberOfMessages,
              showThreads: false,
              type: msg.type,
              curMessageUid: null,
              showRecentMessages: false,
            },
            connection_data: socket.qboxmail.imap_connection_params,
            action: "get_messages_list",
            client_ip: socket && socket.client_address,
          };

          imap.local_work(data, imap.get_messages_list, function (err, res) {});
          return cb();
        },
        function (cb) {
          // force index in dovecot for Virtual/All

          if (app.get("isMtm")) {
            return cb();
          }

          if (
            msg.fts_autoindex === false &&
            msg.folder === "search_all_folders" &&
            msg.criteria &&
            msg.criteria.hasOwnProperty("query")
          ) {
            axios
              .post(
                app.get("config").doveadm_url,
                [
                  [
                    "index",
                    {user: socket.qboxmail.imap_connection_params.user, mailboxMask: "*"},
                    "tag1",
                  ],
                ],
                {
                  headers: {
                    "Content-Type": "application/json",
                    "X-API-Key": app.get("config").doveadm_token,
                    Authorization: `X-Dovecot-API ${app.get("config").doveadm_token}`,
                  },
                  timeout: 5 * 1000, // 5 seconds
                }
              )
              .then((response) => {
                return cb();
              })
              .catch((error) => {
                app.logger.error(
                  `Problem indexing Virtual/All for user ${socket.qboxmail.imap_connection_params.user} with doveadm API`
                );
                app.logger.error(error);
                return cb();
              });
          } else {
            return cb();
          }
        },
        function (cb) {
          let requestParams = Object.assign(msg);
          criteria = imapFiltersParser.parse(requestParams.criteria, full_text);
          let searchFolder =
            requestParams.folder === "search_all_folders" ? "Virtual/All" : requestParams.folder;

          socket.qboxmail.imap_current_folder = requestParams.folder;

          const data = {
            params: {
              folder: searchFolder,
              criteria: criteria,
              full_text: full_text,
              last_uid: (requestParams.criteria && requestParams.criteria.last_uid) || -1,
              numMsgs: requestParams.numMsgs || app.get("config").numberOfMessages,
              showThreads:
                requestParams.folder === "search_all_folders" ? false : requestParams.showThreads,
              type: requestParams.type,
              curMessageUid: requestParams.curMessageUid
                ? parseInt(requestParams.curMessageUid)
                : null,
              showRecentMessages: requestParams.folder === "INBOX" && msg.type === "mail",
            },
            connection_data: socket.qboxmail.imap_connection_params,
            action: "get_messages_list",
            client_ip: socket && socket.client_address,
          };

          imap.local_work(data, imap.get_messages_list, function (err, res) {
            if (err) {
              if (err.textCode === "SERVERBUG" || err.textCode === "INUSE") {
                if (full_text) {
                  err.limited = true;
                } else {
                  err.unavailable = true;
                }
                return cb(err);
              }
              return cb(err);
            }
            if (!res) {
              app.logger.error(
                `${socket.qboxmail.imap_connection_params.user} Unreadable messages`
              );
              return cb("Unreadable messages");
            }

            response = {
              folder: requestParams.folder,
              is_last_page: res.msgsData.length < app.get("config").numberOfMessages,
              other_data: {},
              found_messages_number: res.found_messages_number,
              msgsData: res.msgsData,
              msgsRelated: res.msgsRelated,
              messageCounters: res.messageCounters,
              limited: !full_text,
              highestmodseq: res.highestmodseq,
            };
            return cb();
          });
        },
      ],
      function (err) {
        if (err) {
          return socket.emit("imap_error_get_messages_list", err);
        }
        return socket.emit("imap_message_list_answer", response);
      }
    );
  };

  imapmodule.update_folders = function () {
    const data = {
      params: {
        user: socket.qboxmail.imap_connection_params.user,
      },
      connection_data: socket.qboxmail.imap_connection_params,
      action: "update_folders",
      client_ip: socket && socket.client_address,
    };

    imap.local_work(data, imap.update_folders, async function (err, res) {
      if (err) {
        app.logger.error(
          `${socket.qboxmail.imap_connection_params.user} Error in update_folders ${JSON.stringify(
            err
          )}`
        );

        if (err.textCode === "AUTHENTICATIONFAILED") {
          app.logger.error(`${socket.qboxmail.imap_connection_params.user} - Removing session`);
          await app.redisconn_sessions.DEL(socket.qboxmail.sessionid);
          imapmodule.stop_connection();
        }
      }
    });
  };

  imapmodule.select_messages = function (msg) {
    app.logger.debug(
      `${socket.qboxmail.imap_connection_params.user} search messages for selection in folder ${msg.folder}`
    );

    let folder = msg.folder ? msg.folder : socket.qboxmail.imap_current_folder;
    let full_text = app.get("config").enable_fulltext_search;

    const data = {
      params: {
        folder: folder === "search_all_folders" ? "Virtual/All" : folder,
        criteria:
          msg.criteria !== null
            ? msg.criteria
            : msg.filters !== null
            ? imapFiltersParser.parse(msg.filters, full_text)
            : imapFiltersParser.parse({sort: ["-DATE"], search: ["ALL"]}, full_text),
      },
      connection_data: socket.qboxmail.imap_connection_params,
      action: "get_message_uids",
      client_ip: socket && socket.client_address,
    };

    imap.local_work(data, imap.get_message_uids, function (err, res) {
      if (err) {
        return socket.emit("imap_error_get_message_uids", err);
      }
      if (!res) {
        app.logger.error(`${socket.qboxmail.imap_connection_params.user} Unreadable message`);
        return;
      }
      socket.emit("imap_selected_messages", res);
    });
  };

  imapmodule.get_message = function (msg) {
    if (!msg.uid) {
      app.logger.error(
        `${socket.qboxmail.imap_connection_params.user} Missing UID: ${JSON.stringify(msg)}`
      );
      return socket.emit("imap_error_get_message", "Missing UID");
    }
    app.logger.debug(
      `${socket.qboxmail.imap_connection_params.user} UID ${msg.uid} REQUESTED IN ${msg.folder}`
    );

    let folder = msg.folder ? msg.folder : socket.qboxmail.imap_current_folder;

    const data = {
      params: {
        folder: folder === "search_all_folders" ? "Virtual/All" : folder,
        uid: msg.uid,
        user: socket.qboxmail.imap_connection_params.user,
        markSeen: msg.markSeen || true,
        showImages: msg.showImages,
      },
      connection_data: socket.qboxmail.imap_connection_params,
      client_ip: socket && socket.client_address,
    };

    imap.getMessage(data, function (err, rawMessage) {
      if (err) {
        return socket.emit("imap_error_get_message", err);
      }
      if (!rawMessage) {
        app.logger.error(`${socket.qboxmail.imap_connection_params.user} Unreadable message`);
        return;
      }

      // we use a library to parse the body of the email and send it to the client
      mailParser.simpleParser(rawMessage.body, {}, (err, parsed_msg) => {
        socket.emit("imap_message", parsed_msg);
      });
    });
  };

  return imapmodule;
}
