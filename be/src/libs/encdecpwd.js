"use strict";

// Nodejs encryption with CTR
import crypto from "crypto";

export default function (app) {
  app.encdecpwd = {};

  const algorithm = "aes-256-cbc";
  const enc_key = app.get("config").pwd_enc_key;
  const iv_length = 16; // For AES, this is always 16

  app.encdecpwd.encrypt = function (text) {
    let iv = crypto.randomBytes(iv_length);
    let cipher = crypto.createCipheriv(algorithm, Buffer.from(enc_key), iv);
    let encrypted = cipher.update(text);
    encrypted = Buffer.concat([encrypted, cipher.final()]);
    return iv.toString("hex") + ":" + encrypted.toString("hex");
  };

  app.encdecpwd.decrypt = function (text) {
    if (!text) {
      return "";
    }
    let textParts = text.split(":");
    let iv = Buffer.from(textParts.shift(), "hex");
    let encryptedText = Buffer.from(textParts.join(":"), "hex");
    let decipher = crypto.createDecipheriv(algorithm, Buffer.from(enc_key), iv);
    let decrypted = decipher.update(encryptedText);
    decrypted = Buffer.concat([decrypted, decipher.final()]);
    return decrypted.toString();
  };
}
