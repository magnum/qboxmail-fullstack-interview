"use strict";
import _ from "lodash";
import fs from "fs";
import config from "./config.js";
import express from "express";
import http from "http";
import {Server} from "socket.io";
import logger from "./src/libs/logger.js";
import qbws from "./src/libs/qbws.js";
import cors from "./src/middlewares/cors.js";
import routes from "./src/routes/index.js";

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  pingTimeout: 30000,
  pingInterval: 10000,

  cors: {
    origin: "*",
    methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
    preflightContinue: false,
    optionsSuccessStatus: 204,
  },
});

// set config globally, to be easily accessible
app.set("config", config);

// create temporary folder if not exists
if (!fs.existsSync(app.get("config").tmpFolder)) {
  try {
    fs.mkdirSync(app.get("config").tmpFolder);
  } catch (err) {
    // do nothing
  }
}

// load middlewares
logger(app);
cors(app);

// load websocket routing configuration
qbws(io, app);

// load standard rest routes
routes(app);

// configure public app to server static files
app.use(express.static("public"));

let port = process.env.NODE_PORT || config.port;
server.listen(port, () => {
  let env = process.env.NODE_ENV || "development";
  app.logger.info("=================================================");
  app.logger.info(env + " server started at port " + port);
  app.logger.info("=================================================");
});
