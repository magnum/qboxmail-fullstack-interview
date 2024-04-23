"use strict";

export default function (app) {
  app.get("/", (req, res) => {
    res.send("<h1 style='font-size: 2rem;'>Hello from Webmail for interviews!</h1>");
  });
}
