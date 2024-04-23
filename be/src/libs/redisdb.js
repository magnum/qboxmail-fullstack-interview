"use strict";
// import redis from "redis";
import {createClient} from "redis";

export default async function (app) {
  app.redisconn_data = createClient(app.get("config").redis.data);
  app.redisconn_sessions = createClient(app.get("config").redis.sessions);

  app.redisconn_data.on("error", function (error) {
    app.redisconn_data.connected = false;
    app.logger.error(`redisconn_data ${error}`);
  });
  app.redisconn_sessions.on("error", function (error) {
    app.redisconn_sessions.connected = false;
    app.logger.error(`redisconn_sessions ${error}`);
  });

  app.redisconn_data.on("end", function () {
    app.redisconn_data.connected = false;
  });
  app.redisconn_sessions.on("end", function () {
    app.redisconn_sessions.connected = false;
  });

  app.redisconn_data.on("reconnecting", function () {
    app.redisconn_data.connected = false;
  });
  app.redisconn_sessions.on("reconnecting", function () {
    app.redisconn_sessions.connected = false;
  });

  app.redisconn_data.on("connect", function () {
    app.redisconn_data.connected = true;
  });
  app.redisconn_sessions.on("connect", function () {
    app.redisconn_sessions.connected = true;
  });

  app.redisconn_data.on("ready", function () {
    app.redisconn_data.connected = true;
  });
  app.redisconn_sessions.on("ready", function () {
    app.redisconn_sessions.connected = true;
  });

  await app.redisconn_data.connect();
  await app.redisconn_sessions.connect();
}
