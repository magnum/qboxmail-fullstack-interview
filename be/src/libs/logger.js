"use strict";
import winston from "winston";
import os from "os";
import fs from "fs";
import process from "process";

let level = "info";
if (fs.existsSync("/tmp/verbose")) {
  level = "debug";
}

export default function (app) {
  const env = process.env.NODE_ENV || "development";

  let os_name = os.hostname();
  let transport_console = new winston.transports.Console({
    level: "debug",
    format: winston.format.combine(
      winston.format.colorize(),
      winston.format.splat(),
      winston.format.label({label: os_name}),
      winston.format.timestamp(),
      winston.format.printf(({level, message, label, timestamp}) => {
        return `[${label}] ${timestamp} ${level} ${message}`;
      })
    ),
  });

  let development_logger = winston.createLogger({
    transports: [transport_console],
    exitOnError: false, // do not exit on handled exceptions
  });

  app.logger = development_logger;
}
