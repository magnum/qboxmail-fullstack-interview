"use strict";
import async from "async";
import _ from "lodash";
import imapFiltersParser from "../helpers/imapFiltersParser.js";
import qbimap from "../libs/qbimap.js";
import axios from "axios";
import mailParser from "mailparser";

// this is the controller with the actions called
// by the websocket (qbws.js)
// it uses the qbimap library to perform the needed actions

export default function (app, socket) {
  const imap = new qbimap(app, socket);
  let imapmodule = {};

  // imapmodule.start_connection = function () {
  //   let already_starting_connection = false;
  //   async.series(
  //     [
  //       function (cb) {
  //         if (socket.qboxmail.imap_is_starting_connection) {
  //           app.logger.debug(
  //             `${socket.qboxmail.imap_connection_params.user} Connection is already started... exit`
  //           );
  //           already_starting_connection = true;
  //           return cb();
  //         }
  //         app.logger.info(
  //           `${socket.qboxmail.imap_connection_params.user} starting connection from ${
  //             socket && socket.client_address
  //           }`
  //         );
  //         socket.qboxmail.imap_is_starting_connection = true;

  //         return cb();
  //       },
  //       function (cb) {
  //         if (already_starting_connection) {
  //           return cb();
  //         }
  //         // create idle connection for INBOX
  //         imapmodule.handleIdle("INBOX");
  //         // create a connections for folders status
  //         // and start a timer to check folder status every few minutes
  //         imapmodule.update_folders();

  //         if (!socket.qboxmail.imap_folders_interval && !app.get("isMtm")) {
  //           socket.qboxmail.imap_folders_interval = setInterval(function () {
  //             imapmodule.update_folders();
  //           }, app.get("config").update_folders_interval);
  //         }
  //         return cb();
  //       },
  //     ],
  //     function (err, res) {
  //       if (err) {
  //         app.logger.error(
  //           `${socket.qboxmail.imap_connection_params.user} ERROR ON OPEN_CONNECTION`
  //         );
  //         app.logger.error(err);
  //         socket.emit("force_disconnect", {"ERROR ON OPEN_CONNECTION": err});
  //         return;
  //       }
  //       if (!already_starting_connection) {
  //         socket.emit("imap_start_connection_answer", {});
  //         socket.qboxmail.imap_is_starting_connection = false;
  //       }
  //     }
  //   );
  // };

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

    const connectionConfig = {
      params: {
        folder: folder,
        uid: msg.uid,
        user: socket.qboxmail.imap_connection_params.user,
        markSeen: true,
        showImages: true,
      },
      connection_data: socket.qboxmail.imap_connection_params,
      client_ip: socket && socket.client_address,
    };

    imap.get_message(connectionConfig, function (err, rawMessage) {
      if (err) {
        return socket.emit("imap_error_get_message", err);
      }
      if (!rawMessage) {
        app.logger.error(`${socket.qboxmail.imap_connection_params.user} Unreadable message`);
        return;
      }

      // we use mailParser library to parse the body of the email and send it to the client
      mailParser.simpleParser(rawMessage.body, {}, (err, parsed_msg) => {
        socket.emit("imap_message", parsed_msg);
      });
    });
  };

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

  return imapmodule;
}
