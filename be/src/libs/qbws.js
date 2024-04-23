"use strict";
import _ from "lodash";
import ctrl_imap from "../controllers/ctrl_imap.js";

export default function (io, app) {
  // this middleware is executed only one time immediately before the "connection" event
  io.use((socket, next) => {
    console.log("socket", socket.handshake.query.token);

    socket.qboxmail = {
      sessionid: "session-placeholder",
      QBSessionID: "session-placeholder",
      imap_connection_params: {
        ..._.cloneDeep(app.get("config").imap_params),
        password: "passwordcolloquio1",
        user: "test-colloquio@qboxmail.it",
      },
      imap_current_folder: "INBOX",
      imap_folders_interval: null,
      imap_is_starting_connection: false,
      imap_inbox_idle_conn: null,
      imap_idle_conn: null,
    };

    return next();
  });

  let client_sockets = {};

  io.on("connection", function (socket) {
    app.logger.info(
      `${socket.qboxmail.imap_connection_params.user} new socket session ${socket.qboxmail.QBSessionID}`
    );

    client_sockets[socket.id] = socket;

    app.logger.info(`${Object.keys(client_sockets).length} currently active socket sessions`);

    const imap = new ctrl_imap(app, socket);

    socket.on("error", function (err) {
      imap.stop_connection(function (err) {
        if (err) {
          app.logger.error(
            `${socket.qboxmail.imap_connection_params.user} STOP CONNECTION: ${msg} ${socket.qboxmail.QBSessionID}`
          );
        } else {
          app.logger.error(
            `${socket.qboxmail.imap_connection_params.user} WSS ERROR: ${err} ${socket.qboxmail.QBSessionID}`
          );
        }
        socket.disconnect(true);
      });
    });

    socket.on("disconnecting", function () {
      app.logger.debug(
        `${socket.qboxmail.imap_connection_params.user} WSS DISCONNECTING: ${socket.qboxmail.QBSessionID}`
      );
    });

    socket.on("disconnect", function (msg) {
      imap.stop_connection(function (err) {
        if (err) {
          app.logger.error(
            `${socket.qboxmail.imap_connection_params.user} STOP CONNECTION: ${msg} ${socket.qboxmail.QBSessionID}`
          );
        } else {
          app.logger.debug(
            `${socket.qboxmail.imap_connection_params.user} WSS CLOSE: ${msg} ${socket.qboxmail.QBSessionID}`
          );
        }
        delete client_sockets[socket.id];
      });
    });

    socket.on("imap_get_messages_list", imap.get_messages_list); // OK
    socket.on("imap_get_message", imap.get_message); // OK
  });
}
