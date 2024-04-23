"use strict";

import mailParser from "mailparser";
import {convert} from "html-to-text";
import async from "async";
import postcss from "postcss";
import safe from "postcss-safe-parser";
import crc from "crc";
import tnef from "node-tnef";
import sharp from "sharp";
import {fileTypeFromBuffer} from "file-type";
import _ from "lodash";
import os from "os";
import moment from "moment-timezone";
import linkifyHtml from "linkify-html";
import linkifyText from "linkify-string";
import mmm from "mmmagic";
import * as cheerio from "cheerio";
import JSZip from "jszip";
import smime from "../libs/smime.js";
import fullIcs from "../helpers/full_ics.js";
import utils from "../helpers/utils.js";

const sogoEventBodyStart = `<html><head><styletype="text/css">th,td{font-family:LucidaGrande,BitstreamVeraSans,Tahoma,sans-serif;font-size:12px;line-height:18px;}</style></head><body><tablestyle="width:100%;max-width:600px;"border="0"cellspacing="2"cellpadding="2"><tr><th/><td><h1`;

export default function (app) {
  const postcss_add_class = function (css) {
    let prependClass = `${app.get("config").qboxmailCssMessageClass} `;
    css.walkRules(function (rule) {
      rule.selectors = rule.selectors.map(function (selector) {
        if (/^([0-9]*[.])?[0-9]+\%$|^from$|^to$/.test(selector)) {
          // This is part of a keyframe
          return selector;
        }

        if (selector.startsWith(prependClass.trim())) {
          return selector;
        }

        // special case
        if (selector.startsWith("body") || selector.startsWith("html")) {
          return ".qbox-" + selector;
        }

        return prependClass + selector;
      });
    });
  };

  const sizeToBytes = (bytes) => {
    const sizes = ["B", "KB", "MB", "GB", "TB"];
    if (bytes === 0) return "0.00 KB";
    let i = parseInt(Math.floor(Math.log(bytes) / Math.log(1024)), 10);
    if (i === 0) return bytes + " " + sizes[i];
    return (bytes / Math.pow(1024, i)).toFixed(1) + " " + sizes[i];
  };

  // const prependCssClass = (originalClass) => {
  //   const cssClass = app.get("config").qboxmailCssMessageClass;
  //   return cssClass + " " + originalClass;
  // };

  const generatePrintTemplate = (parsed_msg, timezone, styleTag = "") => {
    let template = _.cloneDeep(app.get("config").printMessageTemplate);
    template = template.replace(/_STYLE_/, styleTag);

    let subject = "";
    if (parsed_msg.subject) {
      subject = `<div class="subject">${parsed_msg.subject}</div>`;
    }
    template = template.replace(/_SUBJECT_/, subject);

    let date = "";
    if (parsed_msg.date) {
      date = `<div class="date">${moment(parsed_msg.date)
        .tz(timezone)
        .format("DD MMM YYYY - HH:mm")}</div>`;
    }
    if (date === "" && parsed_msg.headers.received) {
      let i = parsed_msg.headers.received[0].split(";");
      if (i.length > 0) {
        date = `<div class="date">${moment(parsed_msg.headers.received[0].split(";")[1].trim())
          .tz(timezone)
          .format("DD MMM YYYY - HH:mm")}</div>`;
      }
    }
    if (date === "") {
      date = `<div class="date">${moment().tz(timezone).format("DD MMM YYYY - HH:mm")}</div>`;
    }
    template = template.replace(/_DATE_/, date);

    let from = "";
    if (parsed_msg.from && parsed_msg.from.text) {
      from = parsed_msg.from.text.replace(/</g, "&lt;").replace(/>/g, "&gt;");
      from = `<div class="from"><div>From</div><div>${from}</div></div>`;
    }
    template = template.replace(/_FROM_/, from);

    let to = "";
    if (parsed_msg.to && parsed_msg.to.text) {
      to = parsed_msg.to.text.replace(/</g, "&lt;").replace(/>/g, "&gt;");
      to = `<div class="to"><div>To</div><div>${to}</div></div>`;
    }
    template = template.replace(/_TO_/, to);

    let cc = "";
    if (parsed_msg.cc && parsed_msg.cc.text) {
      cc = parsed_msg.cc.text.replace(/</g, "&lt;").replace(/>/g, "&gt;");
      cc = `<div class="cc"><div>Cc</div><div>${cc}</div></div>`;
    }
    template = template.replace(/_CC_/, cc);

    let bcc = "";
    if (parsed_msg.bcc && parsed_msg.bcc.text) {
      bcc = parsed_msg.bcc.text.replace(/</g, "&lt;").replace(/>/g, "&gt;");
      bcc = `<div class="bcc"><div>Bcc</div><div>${bcc}</div></div>`;
    }
    template = template.replace(/_BCC_/, cc);

    if (parsed_msg.html && parsed_msg.html !== "") {
      template = template.replace(/_BODY_/, parsed_msg.html);
    } else {
      template = template.replace(/_BODY_/, parsed_msg.textAsHtml);
    }

    if (parsed_msg.attachmentsMetaData && parsed_msg.attachmentsMetaData.length > 0) {
      let a = [];

      for (let i in parsed_msg.attachmentsMetaData) {
        a.push(
          `<div class="attachment">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" width="16" height="16">
              <g class="nc-icon-wrapper" stroke-width="1" fill="#2b2b2b" stroke="#2b2b2b">
                <path fill="none" stroke="#2b2b2b" stroke-linecap="round" stroke-linejoin="round" stroke-miterlimit="10" d="M8.857,5.357 L5.852,8.362c-0.683,0.683-0.683,1.791,0,2.475l0,0c0.683,0.683,1.791,0.683,2.475,0l4.066-4.066c1.367-1.367,1.367-3.583,0-4.95 l0,0c-1.367-1.367-3.583-1.367-4.95,0L3.024,6.241c-2.05,2.05-2.05,5.374,0,7.425l0,0c2.05,2.05,5.374,2.05,7.425,0L14.514,9.6" data-cap="butt"/>
              </g>
            </svg>
            <span class="attachment_name">${parsed_msg.attachmentsMetaData[i].filename}</span>
            <span class="attachment_size">${sizeToBytes(
              parsed_msg.attachmentsMetaData[i].size
            )}</span>
          </div>`
        );
      }
      template = template.replace(/_ATTACHMENTS_/, a.join(""));
    } else {
      template = template.replace(/_ATTACHMENTS_/, "");
    }
    return template;
  };

  const createPreview = (msg, len = 200) => {
    let content = "";
    if (msg.text && msg.text.trim().length > 0) {
      content = msg.text;
    } else if (msg.html) {
      content = msg.html.substring(0, len * 25);
      content = convert(content, {
        wordwrap: false,
        selectors: [
          {
            selector: "a",
            options: {ideLinkHrefIfSameAsText: true, linkBrackets: false, ignoreHref: true},
          },
          {selector: "img", format: "skip"},
          {selector: "*", options: {uppercase: false}},
        ],
      });
    } else {
      return "";
    }
    return content.substring(0, len);
  };

  const generateAttachments = (attachments = [], callback) => {
    let metaData = [];
    let i = 0;

    async.forEachSeries(
      attachments,
      (att, cb) => {
        i += 1;

        let filename = att.filename;

        if (att.contentType === "text/calendar") {
          let parsedIcs = fullIcs.parseEvent(att.content.toString("utf8"), "sync");
          let icsAttendees = [];

          if (typeof parsedIcs === "string" || !parsedIcs.VEVENT || parsedIcs.VEVENT.length === 0) {
            return cb();
          }
          if (
            parsedIcs.VEVENT &&
            parsedIcs.VEVENT.length > 0 &&
            parsedIcs.VEVENT[0] &&
            parsedIcs.VEVENT[0].ATTACH &&
            parsedIcs.VEVENT[0].ATTACH.length > 0
          ) {
            for (let i in parsedIcs.VEVENT[0].ATTACH) {
              if (parsedIcs.VEVENT[0].ATTACH[i].v) {
                let buf = Buffer.from(parsedIcs.VEVENT[0].ATTACH[i].v, "base64");
                parsedIcs.VEVENT[0].ATTACH[i].size = buf.length;
                let c = crc.crc32(buf).toString(16);
                parsedIcs.VEVENT[0].ATTACH[i].crc = c;
                delete parsedIcs.VEVENT[0].ATTACH[i].v;
              }
            }
          }

          if (
            parsedIcs.VEVENT &&
            parsedIcs.VEVENT.length > 0 &&
            parsedIcs.VEVENT[0] &&
            parsedIcs.VEVENT[0].ATTENDEE &&
            parsedIcs.VEVENT[0].ATTENDEE.length > 0
          ) {
            let att = {};
            if (typeof parsedIcs.VEVENT[0].ATTENDEE === "string") {
              att = {
                CN: parsedIcs.VEVENT[0].ATTENDEE.replace(/^mailto:/i, ""),
                PARTSTAT: "NEEDS-ACTION",
                ROLE: "REQ-PARTICIPANT",
                RSVP: true,
                v: parsedIcs.VEVENT[0].ATTENDEE.replace(/^mailto:/i, ""),
              };

              icsAttendees.push(att);
            } else {
              for (let i in parsedIcs.VEVENT[0].ATTENDEE) {
                att = {
                  CN: parsedIcs.VEVENT[0].ATTENDEE[i].CN,
                  PARTSTAT: parsedIcs.VEVENT[0].ATTENDEE[i].PARTSTAT,
                  ROLE: parsedIcs.VEVENT[0].ATTENDEE[i].ROLE,
                  RSVP: parsedIcs.VEVENT[0].ATTENDEE[i].RSVP === "TRUE",
                  v: parsedIcs.VEVENT[0].ATTENDEE[i].v
                    ? parsedIcs.VEVENT[0].ATTENDEE[i].v.replace(/^mailto:/i, "")
                    : "",
                };
                icsAttendees.push(att);
              }
            }
          }

          filename =
            parsedIcs.VEVENT && parsedIcs.VEVENT.length > 0
              ? parsedIcs.VEVENT[0].UID + ".ics"
              : "event.ics";
          metaData.push({
            filename: filename,
            size: att.size,
            checksum: att.checksum,
            contentType: att.contentType,
            hash: crc.crc32(att.content).toString(16),
            related: att.related,
            content: null,

            data: {
              UID: parsedIcs.VEVENT[0].UID,
              SUMMARY: parsedIcs.VEVENT[0].SUMMARY && parsedIcs.VEVENT[0].SUMMARY.v,
              LOCATION: {
                v: parsedIcs.VEVENT[0].LOCATION && parsedIcs.VEVENT[0].LOCATION.v,
                TYPE: parsedIcs.VEVENT[0].LOCATION && parsedIcs.VEVENT[0].LOCATION.TYPE,
                ID: parsedIcs.VEVENT[0].LOCATION && parsedIcs.VEVENT[0].LOCATION.ID,
              },
              METHOD: parsedIcs.METHOD,
              DESCRIPTION: parsedIcs.VEVENT[0].DESCRIPTION,
              ATTACH: parsedIcs.VEVENT[0].ATTACH,
              DTSTART: parsedIcs.VEVENT[0].DTSTART,
              DTEND: parsedIcs.VEVENT[0].DTEND,
              RRULE: parsedIcs.VEVENT[0].RRULE,
              CATEGORIES: parsedIcs.VEVENT[0].CATEGORIES,
              ATTENDEE: icsAttendees,
              CLASS: parsedIcs.VEVENT[0].CLASS,
              TRANSP: parsedIcs.VEVENT[0].TRANSP,
              PRIORITY: parsedIcs.VEVENT[0].PRIORITY,
              VALARM: parsedIcs.VEVENT[0].VALARM,
              ORGANIZER: parsedIcs.VEVENT[0].ORGANIZER
                ? {
                    CN: parsedIcs.VEVENT[0].CN,
                    v: parsedIcs.VEVENT[0].ORGANIZER.v
                      ? parsedIcs.VEVENT[0].ORGANIZER.v.replace(/^mailto:/i, "")
                      : "",
                  }
                : null,
              SEQUENCE: parsedIcs.VEVENT[0].SEQUENCE,
              "RECURRENCE-ID": parsedIcs.VEVENT[0]["RECURRENCE-ID"],
              "X-GOOGLE-CONFERENCE": parsedIcs.VEVENT[0]["X-GOOGLE-CONFERENCE"],
              "X-MICROSOFT-ONLINEMEETINGEXTERNALLINK":
                parsedIcs.VEVENT[0]["X-MICROSOFT-ONLINEMEETINGEXTERNALLINK"] ||
                parsedIcs.VEVENT[0]["X-MICROSOFT-SKYPETEAMSMEETINGURL"],

              checksum: att.checksum,
            },
          });
          return cb();
        }

        if (
          att.contentType === "message/rfc822" &&
          (!filename || filename.replace(".eml", "").length === 0)
        ) {
          metaData.push({
            filename: `message_${parseInt(i, 10)}.eml`,
            size: att.size,
            checksum: att.checksum,
            contentType: att.contentType,
            hash: crc.crc32(att.content).toString(16),
            related: att.related,
          });
          return cb();
        }

        if (att.contentType === "message/disposition-notification") {
          filename = `disposition-notification_${parseInt(i, 10)}.txt`;
          metaData.push({
            filename: filename,
            size: att.size,
            checksum: att.checksum,
            contentType: att.contentType,
            hash: crc.crc32(att.content).toString(16),
            related: att.related,
          });
          return cb();
        }

        if (att.contentType === "application/ms-tnef") {
          tnef.parseBuffer(att.content, (err, tnef_data) => {
            if (err) {
              metaData.push({
                filename: filename,

                checksum: att.checksum,
                contentType: att.contentType,
                hash: crc.crc32(att.content).toString(16),
                related: att.related,
              });
              return cb();
            }
            if (!tnef_data.Attachments || tnef_data.Attachments.length === 0) {
              metaData.push({
                filename: filename,
                size: att.size,
                checksum: att.checksum,
                contentType: att.contentType,
                hash: crc.crc32(att.content).toString(16),
                related: att.related,
              });
              return cb();
            }

            for (let i in tnef_data.Attachments) {
              filename = tnef_data.Attachments[i].Title || "attachment";
              let buf = Buffer.from(tnef_data.Attachments[i].Data);
              metaData.push({
                filename: filename,
                size: buf.length,
                checksum: att.checksum,
                contentType: "application/octet-stream",
                hash: crc.crc32(buf).toString(16),
                related: att.related,
              });
            }
            return cb();
          });

          return;
        }

        metaData.push({
          filename: filename || `unreadable_${i}.txt`,
          size: att.size,
          checksum: att.checksum,
          contentType: att.contentType,
          hash: crc.crc32(att.content).toString(16),
          related: att.related,
        });
        return cb();
      },
      (err) => {
        return callback(err, metaData);
      }
    );
  };

  const resizeInlineImage = (base64_img, callback) => {
    let m = base64_img.match(/^(data:image\/.*;base64,)(.*)$/);
    let results = {resized: false, img: base64_img};

    if (!m || m.length < 3) {
      return callback(null, results);
    }
    let buf = Buffer.from(m[2], "base64");

    if (buf.length <= 1024 * 1024 * 1) {
      // 1MB
      return callback(null, results);
    }
    let newBuf = sharp(buf)
      .resize({
        width: 1024,
        fit: "inside",
        //withoutEnlargement: true,
      })
      .jpeg({
        quality: 60,
        optimiseScans: true,
      })
      .toBuffer()
      .then((data) => {
        results.resized = true;
        results.img = m[1] + data.toString("base64");
        return callback(null, results);
      })
      .catch((err) => {
        app.logger.error(err);
        return callback(null, results);
      });
  };

  const extractImages = (dom, callback) => {
    // extract from html tags
    let imgUrls = {};
    let counter = 0;

    let images = dom.root().find("img");
    let decoded = dom.html();

    async.forEachSeries(
      images,
      (img, cb) => {
        if (img.name !== "img") {
          return cb();
        }
        counter++;
        let placeholder = `_src-img-placeholder-${counter}_`;

        if (
          dom(img).prop("src") &&
          dom(img)
            .prop("src")
            .match(/data:image\/.*;base64,/i)
        ) {
          // inline image
          resizeInlineImage(dom(img).prop("src"), (err, result) => {
            if (result.resized) {
              let cheerioImage = dom(img).clone();

              cheerioImage.attr("src", result.img);
              dom(img).replaceWith(
                dom(
                  `<div class="resizedImageContainer"><div id="downloadTag-${counter}" data-img-inline-counter="${counter}" class="downloadTag">Download</div>${cheerioImage}</div>`
                )
              );
            }
            return cb();
          });
        } else {
          imgUrls[placeholder] = dom.html(img);
          dom(img).replaceWith(
            dom(`<span data-img-id="${placeholder}" class="qbox_placeholder"></span>`)
          );
          return cb();
        }
      },
      (err) => {
        if (err) {
          app.logger.error(`ERROR EXTRACTING IMAGES`);
        }

        // extract from css
        let decoded = dom.html();
        let matches = null;

        counter = 0;
        // url(http://xxxx...)
        let regex = new RegExp(/url\(["']?((https?|ftps?):\/\/[^'"]+?)["']?\)/gi);
        while ((matches = regex.exec(decoded)) !== null) {
          counter++;
          let url = matches[1];
          let placeholder = `_css-img-placeholder-${counter}_`;
          imgUrls[placeholder] = url;
        }

        // background="http://xxxx..."
        regex = new RegExp(/background=["']?http([^'"]+)["']?/gi);
        matches = null;
        while ((matches = regex.exec(decoded)) != null) {
          counter++;
          let url = "http" + matches[1];
          let placeholder = `_css-img-placeholder-${counter}_`;
          imgUrls[placeholder] = url;
        }

        let urls = Object.keys(imgUrls);
        for (let i in urls) {
          let k = urls[i];
          if (k.indexOf("_css-img-placeholder") >= 0) {
            decoded = replaceAll(decoded, imgUrls[k], k);
          }
        }

        return callback(null, {
          imgUrls: imgUrls,
          html: decoded,
        });
      }
    );
  };

  const replaceAll = (str, searchString, replaceString) => {
    let s = str;
    try {
      s = str.split(searchString).join(replaceString);
    } catch (e) {
      app.logger.error(
        `ERROR REPLACEALL ${JSON.stringify(e)}, ${str}, ${searchString}, ${replaceString}`
      );
    }
    return s;
  };

  // const escapeRegExp = (str) => {
  //   return str.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, "\\$&");
  // };

  const replacePlainText = (str) => {
    let strPlainParsed = linkifyText(str, {
      nl2br: true,
    });

    // let strPlainParsed = str.replace(/</g, "&lt;").replace(/>/g, "&gt;");

    /* replace all link prepending http */
    // let urlRegExp = new RegExp(
    //   '(((?<!href=")(?<!"\\s*\\>)(?:https?|ftps?):\\/\\/|(?:www))[^\\s]+)',
    //   "gi"
    // );
    // let httpPrepend = new RegExp('(?<=href=")(?!https?:\\/\\/)(.*)(?="\\>)', "gi");
    let replyRegExp = new RegExp("\\[@([^\\]]*)\\]", "g");
    // let boldRegExp = new RegExp("\\[([^\\]]*)\\][^a-zA-Z0-9]", "g");
    // let italicsRegExp = new RegExp("\\{([^}]*)\\}[^a-zA-Z0-9]", "g");
    // let underlineRegExp = new RegExp("_([^_]*)_[^a-zA-Z0-9]", "g");
    // let linebreakRegExp = new RegExp("\\n", "g");
    // let spacesRegExp = new RegExp("\\s{2}", "g");

    // strPlainParsed = strPlainParsed.replace(urlRegExp, '<a href="$1">$1</a>');
    // strPlainParsed = strPlainParsed.replace(httpPrepend, "http://$1");
    strPlainParsed = strPlainParsed.replace(replyRegExp, '<b class="reply">@$1</b>');
    // strPlainParsed = strPlainParsed.replace(boldRegExp, "<b>$1</b>");
    // strPlainParsed = strPlainParsed.replace(italicsRegExp, "<i>$1</i>");
    // strPlainParsed = strPlainParsed.replace(underlineRegExp, "<u>$1</u>");
    // strPlainParsed = strPlainParsed.replace(linebreakRegExp, "<br />");
    // strPlainParsed = strPlainParsed.replace(spacesRegExp, "&ensp;");

    return strPlainParsed;
  };

  const saveToRedis = (parsed_msg, options, callback) => {
    let key = (
      options.user_email +
      ":mail:" +
      Buffer.from(options.folder).toString("base64") +
      ":uid:" +
      parsed_msg.uid
    ).replace(" ", "_");

    let d = "";
    if (typeof parsed_msg.date !== "undefined") {
      d = parsed_msg.date;
    }
    if (d === "" && typeof parsed_msg.headers.received !== "undefined") {
      let arr_received = parsed_msg.headers.received[0].split(";");
      if (arr_received.length > 0 && typeof arr_received[1] !== "undefined") {
        d = moment(arr_received[1].trim()).utc().format();
      }
    }
    if (d === "") {
      d = moment().utc().format();
    }
    parsed_msg["date"] = d;

    let redis_data = {
      headers: JSON.stringify(parsed_msg.headers),
      subject: typeof parsed_msg["subject"] === "undefined" ? "" : parsed_msg["subject"],
      from: typeof parsed_msg["from"] === "undefined" ? "" : JSON.stringify(parsed_msg["from"]),
      to: typeof parsed_msg["to"] === "undefined" ? "" : JSON.stringify(parsed_msg["to"]),
      cc: typeof parsed_msg["cc"] === "undefined" ? "" : JSON.stringify(parsed_msg["cc"]),
      bcc: typeof parsed_msg["bcc"] === "undefined" ? "" : JSON.stringify(parsed_msg["bcc"]),
      date: typeof parsed_msg["date"] === "undefined" ? "" : JSON.stringify(parsed_msg["date"]),
      html: typeof parsed_msg["html"] === "undefined" ? "" : JSON.stringify(parsed_msg["html"]),
      text: typeof parsed_msg["text"] === "undefined" ? "" : JSON.stringify(parsed_msg["text"]),
      textAsHtml:
        typeof parsed_msg["textAsHtml"] === "undefined"
          ? ""
          : JSON.stringify(parsed_msg["textAsHtml"]),
      preview: JSON.stringify(parsed_msg.preview),
      imagesData:
        typeof parsed_msg["imagesData"] === "undefined"
          ? ""
          : JSON.stringify(parsed_msg.imagesData),
      attachmentsMetaData:
        typeof parsed_msg["attachmentsMetaData"] === "undefined"
          ? ""
          : JSON.stringify(parsed_msg.attachmentsMetaData),
      flags:
        typeof parsed_msg["flags"] === "undefined"
          ? JSON.stringify([])
          : JSON.stringify(parsed_msg["flags"]),
      size: typeof parsed_msg["size"] === "undefined" ? "0" : JSON.stringify(parsed_msg["size"]),
      isHuge: typeof parsed_msg.isHuge === "undefined" ? 0 : parsed_msg.isHuge,
      originalData: JSON.stringify(parsed_msg.originalData),
    };

    if (app.redisconn_data.connected) {
      app.redisconn_data
        .HSET(key, redis_data)
        .then(async function () {
          let k = (
            options.user_email +
            ":mail:" +
            Buffer.from(options.folder).toString("base64") +
            ":uid:" +
            parsed_msg.uid
          ).replace(" ", "_");
          await app.redisconn_data.EXPIRE(k, app.get("config").mailTTL);
          return callback();
        })
        .catch(function (e) {
          app.logger.error(e);
          return callback(e);
        });
    } else {
      return callback();
    }
  };

  // parse message using simpleParser and populate utility fields
  const parseTransform = (buf, options, callback) => {
    if (!buf) {
      return callback({err: "No data available"});
    }

    try {
      mailParser.simpleParser(
        buf,
        {
          skipHtmlToText: options.isHuge === 1,
          skipImageLinks: options.isHuge === 1,
          skipTextToHtml: options.isHuge === 1,
          maxHtmlLengthToParse:
            options.isHuge === 1 ? app.get("config").imap_text_message_max_size : undefined,
          skipTextLinks: options.isHuge === 1,
          //Iconv: iconv,
        },
        (err, parsed_msg) => {
          if (err) {
            if (err.code === "EMAXLEN") {
              app.logger.error(
                `${options.user_email} FOLDER ${options.folder} UID: ${options.uid} ERROR EMAXLEN`
              );
            }
            return callback({err: "Error parsing email", data: err});
          }

          const msgPreview = createPreview(parsed_msg);

          let headers = {};
          parsed_msg.headers.forEach((v, k) => (headers[k] = v));
          parsed_msg = Object.assign({}, parsed_msg, {headers: headers});

          parsed_msg.preview = msgPreview;
          parsed_msg.uid = options.uid;
          parsed_msg.flags = options.flags;
          parsed_msg.size = options.size;
          parsed_msg.isHuge = options.isHuge;
          parsed_msg.originalData = options.originalData;
          if (parsed_msg.from) {
            parsed_msg.from = utils.unpackFrom(parsed_msg.from);
          }

          if (parsed_msg.isHuge === 1) {
            parsed_msg.text = replacePlainText(createPreview(parsed_msg, 512));
            parsed_msg.textAsHtml = parsed_msg.text;
          }

          // reset attachment_crc with actual crc for .eml attachments
          if (
            parsed_msg.headers.hasOwnProperty("attachment_crc") &&
            typeof parsed_msg.headers.attachment_crc !== "undefined"
          ) {
            if (typeof parsed_msg.headers.attachment_crc === "string") {
              parsed_msg.headers.attachment_crc = [parsed_msg.headers.attachment_crc];
            }
            for (let i in parsed_msg.headers.attachment_crc) {
              if (parsed_msg.headers.attachment_crc[i].indexOf("eml:") === 0) {
                parsed_msg.headers.attachment_crc[i] =
                  parsed_msg.headers.attachment_crc[i].split(":")[3];
              }
            }
          }
          let result = null;
          async.series(
            [
              (cb1) => {
                if (!parsed_msg.attachments || parsed_msg.attachments.length === 0) {
                  parsed_msg.attachmentsMetaData = [];
                  return cb1();
                }
                generateAttachments(parsed_msg.attachments, (err, atts) => {
                  if (err) {
                    return cb1(err);
                  }
                  parsed_msg.attachmentsMetaData = atts;
                  return cb1();
                });
              },
              (cb1) => {
                transformMessage(parsed_msg, options, (err, res) => {
                  if (err) {
                    app.logger.error(`transformMessage ERR ${JSON.stringify(err)}`);
                    return cb1(err);
                  }
                  let content = "";
                  if (res.parsed_msg.html && res.parsed_msg.html !== "") {
                    content = res.parsed_msg.html;
                  } else if (res.parsed_msg.text && res.parsed_msg.text !== "") {
                    content = res.parsed_msg.text;
                  }
                  res.parsed_msg.content = content;
                  result = res;
                  return cb1();
                });
              },
              (cb1) => {
                if (options.action === "print") return cb1();
                if (options.action === "download") return cb1();
                if (options.action === "download_all") return cb1();
                if (options.action === "preview") return cb1();
                if (options.action === "download_image") return cb1();
                if (!options.skipSaveToRedis) {
                  saveToRedis(result.parsed_msg, options, (err) => {
                    if (err) {
                      app.logger.error(`Error saving message to redis ${JSON.stringify(err)}`);
                    }
                  });
                }
                return cb1();
              },
            ],
            (err) => {
              if (err) {
                return callback(err);
              }
              let output = null;

              if (options.action === "print") {
                return callback(null, result.template);
              } else if (options.action === "download" || options.action === "download_all") {
                if (options.checksum1) {
                  let attach = null;
                  for (let i in result.parsed_msg.attachments) {
                    if (result.parsed_msg.attachments[i].checksum === options.checksum1) {
                      attach = result.parsed_msg.attachments[i];
                      break;
                    }
                  }

                  if (!attach) {
                    return callback({err: "no attachment found"});
                  }

                  if (attach.contentType === "text/calendar") {
                    let parsedIcs = fullIcs.parseEvent(attach.content.toString("utf8"), "sync");
                    if (typeof parsedIcs === "string") {
                      return callback(null, parsedIcs);
                    }
                    output = {
                      content: attach.content,
                      size: attach.size,
                      contentType: attach.contentType,
                      filename: parsedIcs.VEVENT[0].UID + ".ics",
                    };
                    return callback(null, output);
                  } else if (attach.contentType === "application/ms-tnef") {
                    tnef.parseBuffer(attach.content, (err, tnef_data) => {
                      if (err) {
                        output = {
                          content: attach.content,
                          size: attach.size,
                          contentType: attach.contentType || "application/octet-stream",
                          filename: attach.filename || `unreadable.txt`,
                        };
                        return callback(null, output);
                      }
                      if (tnef_data.Attachments.length === 0) {
                        output = {
                          content: attach.content,
                          size: attach.size,
                          contentType: attach.contentType || "application/octet-stream",
                          filename: attach.filename || `unreadable.txt`,
                        };
                        return callback(null, output);
                      }
                      if (options.checksum2) {
                        for (let i in tnef_data.Attachments) {
                          let buf = Buffer.from(tnef_data.Attachments[i].Data);
                          let _crc = crc.crc32(buf).toString(16);

                          if (options.checksum2 === _crc) {
                            output = {
                              filename: tnef_data.Attachments[i].Title || "attachment",
                              size: buf.length,
                              contentType: "application/octet-stream",
                              content: buf,
                            };
                            break;
                          }
                        }
                        return callback(null, output);
                      }
                      output = {
                        content: attach.content,
                        size: attach.size,
                        contentType: attach.contentType || "application/octet-stream",
                        filename: attach.filename || `unreadable.txt`,
                      };
                      return callback(null, output);
                    });
                  } else if (attach.contentType === "message/disposition-notification") {
                    output = {
                      content: attach.content,
                      size: attach.size,
                      contentType: attach.contentType || "application/octet-stream",
                      filename: `disposition-notification.txt`,
                    };
                    return callback(null, output);
                  } else if (
                    (attach.contentType === "application/pkcs7-mime" ||
                      attach.contentType === "application/x-pkcs7-mime") &&
                    options.output === "inline" // try to decode p7m for preview only
                  ) {
                    smime(attach.content, app.get("config").tmpFolder, async (err, content) => {
                      if (err) {
                        output = {
                          content: attach.content,
                          size: attach.size,
                          contentType: attach.contentType || "application/octet-stream",
                          filename: attach.filename,
                        };
                        return callback(null, output);
                      }
                      let file_type = await fileTypeFromBuffer(content);
                      if (file_type) {
                        output = {
                          content: content,
                          size: content.length,
                          contentType: file_type.mime,
                          filename: attach.filename.replace(".p7m", ""),
                        };
                        return callback(null, output);
                      }
                      let magic = new mmm.Magic(mmm.MAGIC_MIME_TYPE);
                      magic.detect(content, (err, result) => {
                        if (err) {
                          output = {
                            content: content,
                            size: content.length,
                            contentType: "application/octet-stream",
                            filename: attach.filename.replace(".p7m", ""),
                          };
                          return callback(null, output);
                        }
                        output = {
                          content: content,
                          size: content.length,
                          contentType: result,
                          filename: attach.filename.replace(".p7m", ""),
                        };
                        return callback(null, output);
                      });
                    });
                  } else if (attach.contentType === "message/rfc822" && options.checksum2) {
                    mailParser.simpleParser(
                      attach.content,
                      {
                        skipHtmlToText: true,
                        skipImageLinks: true,
                        skipTextToHtml: true,
                        maxHtmlLengthToParse: app.get("config").imap_text_message_max_size,
                        skipTextLinks: true, //,
                        //Iconv: iconv,
                      },
                      (err, p) => {
                        if (err) {
                          return callback({
                            err: "Error parsing attached email",
                            data: err,
                          });
                        }

                        if (options.action === "download_all") {
                          //download all attachments, checksum1 not provided
                          const zip = new JSZip();
                          for (let i in p.attachments) {
                            let filename =
                              p.attachments[i].filename || `unreadable_${parseInt(i, 10)}.txt`;
                            if (
                              !p.attachments[i].filename &&
                              p.attachments[i].contentType === "text/calendar"
                            ) {
                              let parsedIcs = fullIcs.parseEvent(
                                p.attachments[i].content.toString("utf8"),
                                "sync"
                              );
                              if (typeof parsedIcs === "string") {
                                continue;
                              }
                              filename =
                                parsedIcs.VEVENT && parsedIcs.VEVENT.length > 0
                                  ? parsedIcs.VEVENT[0].UID + ".ics"
                                  : "event.ics";
                              zip.file(filename, p.attachments[i].content);
                            } else if (p.attachments[i].contentType === "application/ms-tnef") {
                              tnef.parseBuffer(p.attachments[i].content, (err, tnef_data) => {
                                if (err) {
                                  zip.file(p.attachments[i].filename, p.attachments[i].content);
                                } else {
                                  if (tnef_data.Attachments.length === 0) {
                                    zip.file(p.attachments[i].filename, p.attachments[i].content);
                                  } else {
                                    for (let i in tnef_data.Attachments) {
                                      let buf = Buffer.from(tnef_data.Attachments[i].Data);
                                      let _crc = crc.crc32(buf).toString(16);

                                      zip.file(tnef_data.Attachments[i].Title || "attachment", buf);
                                    }
                                  }
                                }
                              });
                            } else if (
                              p.attachments[i].contentType === "message/disposition-notification"
                            ) {
                              zip.file(`disposition-notification.txt`, p.attachments[i].content);
                            } else {
                              zip.file(filename, p.attachments[i].content);
                            }
                          }
                          zip
                            .generateAsync({
                              type: "nodebuffer",
                            })
                            .then(function (buf) {
                              output = {
                                content: Buffer.from(buf, "binary"),
                                size: buf.length,
                                contentType: "application/zip",
                                filename: options.folder + "_" + options.uid + "_attachments.zip",
                              };
                              return callback(null, output);
                            })
                            .catch(function (err) {
                              return callback(err);
                            });
                        } else {
                          for (let i in p.attachments) {
                            if (p.attachments[i].checksum === options.checksum2) {
                              let filename = p.attachments[i].filename;
                              if (
                                !p.attachments[i].filename &&
                                p.attachments[i].contentType === "text/calendar"
                              ) {
                                let parsedIcs = fullIcs.parseEvent(
                                  p.attachments[i].content.toString("utf8"),
                                  "sync"
                                );
                                if (typeof parsedIcs === "string") {
                                  continue;
                                }
                                filename =
                                  parsedIcs.VEVENT && parsedIcs.VEVENT.length > 0
                                    ? parsedIcs.VEVENT[0].UID + ".ics"
                                    : "event.ics";
                                output = {
                                  content: p.attachments[i].content,
                                  size: p.attachments[i].size,
                                  contentType:
                                    p.attachments[i].contentType || "application/octet-stream",
                                  filename: filename || `unreadable.txt`,
                                };
                                return callback(null, output);
                              } else if (p.attachments[i].contentType === "application/ms-tnef") {
                                return tnef.parseBuffer(
                                  p.attachments[i].content,
                                  (err, tnef_data) => {
                                    if (err) {
                                      output = {
                                        content: p.attachments[i].content,
                                        size: p.attachments[i].size,
                                        contentType:
                                          p.attachments[i].contentType ||
                                          "application/octet-stream",
                                        filename: p.attachments[i].filename || `unreadable.txt`,
                                      };
                                      return callback(err, output);
                                    }
                                    if (tnef_data.Attachments.length === 0) {
                                      output = {
                                        content: p.attachments[i].content,
                                        size: p.attachments[i].size,
                                        contentType:
                                          p.attachments[i].contentType ||
                                          "application/octet-stream",
                                        filename: p.attachments[i].filename || `unreadable.txt`,
                                      };
                                      return callback(null, output);
                                    }
                                    if (options.hash) {
                                      for (let i in tnef_data.Attachments) {
                                        let buf = Buffer.from(tnef_data.Attachments[i].Data);
                                        let _crc = crc.crc32(buf).toString(16);

                                        if (options.hash === _crc) {
                                          output = {
                                            filename:
                                              tnef_data.Attachments[i].Title || "attachment",
                                            size: buf.length,
                                            contentType: "application/octet-stream",
                                            content: buf,
                                          };
                                          break;
                                        }
                                      }
                                      return callback(null, output);
                                    }
                                    output = {
                                      content: p.attachments[i].content,
                                      size: p.attachments[i].size,
                                      contentType:
                                        p.attachments[i].contentType || "application/octet-stream",
                                      filename: p.attachments[i].filename || `unreadable.txt`,
                                    };
                                    return callback(null, output);
                                  }
                                );
                              } else if (
                                p.attachments[i].contentType === "message/disposition-notification"
                              ) {
                                output = {
                                  content: attach.content,
                                  size: attach.size,
                                  contentType: attach.contentType || "application/octet-stream",
                                  filename: `disposition-notification.txt`,
                                };
                                return callback(null, output);
                              }
                              output = {
                                content: p.attachments[i].content,
                                size: p.attachments[i].size,
                                contentType:
                                  p.attachments[i].contentType || "application/octet-stream",
                                filename: p.attachments[i].filename || `unreadable.txt`,
                              };
                              return callback(null, output);
                            }
                          }
                        }
                      }
                    );
                  } else {
                    output = {
                      content: attach.content,
                      size: attach.size,
                      contentType: attach.contentType || "application/octet-stream",
                      filename: attach.filename || `unreadable.txt`,
                    };
                    return callback(null, output);
                  }
                } else {
                  //download all attachments, checksum1 not provided
                  const zip = new JSZip();

                  let idx = 0;
                  let filenames = [];

                  async.forEachSeries(
                    result.parsed_msg.attachments,
                    (att, cb) => {
                      idx++;
                      let fn = att.filename || `unreadable_${parseInt(idx, 10)}.txt`;
                      let filename = fn;

                      if (filenames.indexOf(fn) >= 0) {
                        let dotIdx = filename.lastIndexOf(".");
                        let name = filename.slice(0, dotIdx);
                        let extension = filename.slice(dotIdx + 1, filename.length);

                        filename = `${name}_${idx}.${extension}`;
                      }

                      filenames.push(fn);

                      if (att.contentType === "application/ms-tnef") {
                        tnef.parseBuffer(att.content, (err, tnef_data) => {
                          if (err || tnef_data.Attachments.length === 0) {
                            zip.file(
                              att.filename || `attach_${parseInt(idx, 10)}.dat`,
                              att.content
                            );
                            return cb();
                          }
                          for (let i in tnef_data.Attachments) {
                            let buf = Buffer.from(tnef_data.Attachments[i].Data);
                            filename = tnef_data.Attachments[i].Title || `unreadable_${i}.txt`;
                            zip.file(filename, buf);
                          }
                          return cb();
                        });
                      } else {
                        if (!att.filename && att.contentType === "text/calendar") {
                          let parsedIcs = fullIcs.parseEvent(att.content.toString("utf8"), "sync");
                          if (typeof parsedIcs === "string") {
                            return cb();
                          }
                          filename =
                            parsedIcs.VEVENT && parsedIcs.VEVENT.length > 0
                              ? parsedIcs.VEVENT[0].UID + ".ics"
                              : "event.ics";
                          // add to the zip attachments inside ics
                          if (
                            parsedIcs.VEVENT &&
                            parsedIcs.VEVENT.length > 0 &&
                            parsedIcs.VEVENT[0].ATTACH &&
                            parsedIcs.VEVENT[0].ATTACH.length > 0
                          ) {
                            for (let i in parsedIcs.VEVENT[0].ATTACH) {
                              if (parsedIcs.VEVENT[0].ATTACH[i].v) {
                                let content = Buffer.from(
                                  parsedIcs.VEVENT[0].ATTACH[i].v,
                                  parsedIcs.VEVENT[0].ATTACH[i].ENCODING
                                );
                                zip.file(
                                  parsedIcs.VEVENT[0].ATTACH[i]["X-ATTACHMENT-NAME"] ||
                                    `unreadable_${parseInt(i, 10)}.txt`,
                                  content
                                );
                              }
                            }
                          }
                        }

                        zip.file(filename || `unreadable_${parseInt(idx, 10)}.txt`, att.content);
                        return cb();
                      }
                    },
                    (err) => {
                      if (err) {
                        return callback(err);
                      }
                      zip
                        .generateAsync({
                          type: "nodebuffer",
                        })
                        .then(function (buf) {
                          output = {
                            content: Buffer.from(buf, "binary"),
                            size: buf.length,
                            contentType: "application/zip",
                            filename: options.folder + "_" + options.uid + "_attachments.zip",
                          };
                          return callback(null, output);
                        })
                        .catch(function (err) {
                          return callback(err);
                        });
                    }
                  );
                }
              } else if (options.action === "preview") {
                let attach = null;
                for (let i in result.parsed_msg.attachments) {
                  if (result.parsed_msg.attachments[i].checksum === options.checksum1) {
                    attach = result.parsed_msg.attachments[i];
                    break;
                  }
                }

                mailParser.simpleParser(
                  attach.content,
                  {
                    skipHtmlToText: options.isHuge === 1,
                    skipImageLinks: options.isHuge === 1,
                    skipTextToHtml: options.isHuge === 1,
                    maxHtmlLengthToParse:
                      options.isHuge === 1
                        ? app.get("config").imap_text_message_max_size
                        : undefined,
                    skipTextLinks: options.isHuge === 1,
                    //Iconv: iconv,
                  },
                  (err, mail) => {
                    if (
                      mail["text"] &&
                      mail["text"].length > app.get("config").imap_text_message_max_size
                    ) {
                      mail.text = replacePlainText(createPreview(mail, 512));
                      mail.textAsHtml = mail.text;
                      mail.isHuge = 1;
                    }

                    generateAttachments(mail.attachments, (err, atts) => {
                      if (err) {
                        return callback(err);
                      }
                      mail.attachments = atts;
                      transformMessage(mail, options, (err, res) => {
                        if (err) {
                          return callback(err);
                        }
                        let content = "";
                        if (res.parsed_msg.html && res.parsed_msg.html !== "") {
                          content = res.parsed_msg.html;
                        } else if (res.parsed_msg.text && res.parsed_msg.text !== "") {
                          content = res.parsed_msg.text;
                        }
                        if (res.parsed_msg.from) {
                          res.parsed_msg.from = utils.unpackFrom(res.parsed_msg.from);
                        }
                        res.parsed_msg.content = content;
                        return callback(null, res.parsed_msg);
                      });
                    });
                  }
                );
              } else if (options.action === "download_image") {
                if (options.checksum1) {
                  let attach = null;
                  for (let i in result.parsed_msg.attachments) {
                    if (result.parsed_msg.attachments[i].checksum === options.checksum1) {
                      attach = result.parsed_msg.attachments[i];
                      break;
                    }
                  }

                  mailParser.simpleParser(attach.content, (err, mail) => {
                    let $ = cheerio.load(mail.html);
                    let elements = $.root().find("img");
                    let resultImage = null;
                    elements.each((i, el) => {
                      if (i + 1 === parseInt(options.checksum2, 10)) {
                        // inline image
                        let src = $(el).attr("src");
                        let m = src.match(/^data:image\/.*;base64,(.*)/);
                        let mimeType = src.match(/(?<=data:)(.*?)(?=;)/)[0];

                        if (m) {
                          let image = Buffer.from(m[1], "base64");
                          resultImage = {
                            mimeType: mimeType,
                            length: image.length,
                            extension: mimeType.split("/")[1],
                            content: image,
                          };
                        }
                      }
                    });
                    if (!resultImage) {
                      return callback("No image found!");
                    }
                    return callback(null, resultImage);
                  });
                } else {
                  let $ = null;
                  try {
                    $ = cheerio.load(result.parsed_msg.html);
                  } catch (e) {
                    app.logger.error("cheerio load error");
                    app.logger.error(e);
                    $ = cheerio.load("");
                  }
                  let elements = $.root().find("img");
                  let resultImage = null;
                  elements.each((i, el) => {
                    if (i + 1 === parseInt(options.checksum2, 10)) {
                      // inline image
                      let src = $(el).attr("src");
                      let m = src.match(/^data:image\/.*;base64,(.*)/);
                      let mimeType = src.match(/(?<=data:)(.*?)(?=;)/)[0];

                      if (m) {
                        let image = Buffer.from(m[1], "base64");
                        resultImage = {
                          mimeType: mimeType,
                          length: image.length,
                          extension: mimeType.split("/")[1],
                          content: image,
                        };
                      }
                    }
                  });
                  if (!resultImage) {
                    return callback("No image found!");
                  }
                  return callback(null, resultImage);
                }
              } else {
                if (result.parsed_msg.hasOwnProperty("attachments")) {
                  for (let i in result.parsed_msg.attachments) {
                    delete result.parsed_msg.attachments[i].content;
                  }
                }
                return callback(null, result.parsed_msg);
              }
            }
          );
        }
      );
    } catch (e) {
      app.logger.error("parsetransform simpleparser error");
      app.logger.error(e);
      return callback(e);
    }
  };

  // prepare the HTML/TEXT part
  const transformMessage = (parsed_msg, options, callback) => {
    // workaround for linkify error: remove DOCTYPE and CURSOR
    // https://github.com/Soapbox/linkifyjs/issues/203
    if (parsed_msg.html) {
      parsed_msg.html = parsed_msg.html.replace(/<!DOCTYPE[^>[]*(\[[^]]*\])?>/gim, "");
      parsed_msg.html = parsed_msg.html.replace(/<!CURSOR[^>[]*(\[[^]]*\])?>/gim, "");
    }

    let template = null;
    if (!parsed_msg.html) {
      if (parsed_msg.text) {
        parsed_msg.text = replacePlainText(parsed_msg.text);
      }
      if (options.action === "print") {
        template = generatePrintTemplate(parsed_msg, options.timezone);
      }
      return callback(null, {parsed_msg: parsed_msg, template: template});
    }

    // remove SOGO Event html
    if (options.action !== "print" && parsed_msg.attachments && parsed_msg.attachments.length > 0) {
      for (let attachmentIndex in parsed_msg.attachments) {
        if (
          parsed_msg.attachments[attachmentIndex]["contentType"] === "text/calendar" &&
          parsed_msg.attachments[attachmentIndex].hasOwnProperty("content")
        ) {
          // it contains an ICS
          if (
            parsed_msg.html &&
            parsed_msg.html.replace(/\s+/gm, "").indexOf(sogoEventBodyStart) === 0
          ) {
            parsed_msg.html = "";
          }
          break;
        }
      }
    }

    parsed_msg.html = parsed_msg.html.replace(/<!--[^>]*--->/gim, "");

    let $ = cheerio.load(parsed_msg.html);
    let stylesRules = "";

    let elements = [];
    elements = $.root().find("*");
    elements.each((i, el) => {
      if (el.name === "style") {
        stylesRules += $(el).html();
        $(el).remove();
      }
    });

    // remove dark-mode style rules
    stylesRules = stylesRules.replace(
      /@media[\s]*\([\s]*prefers-color-scheme[\s]*:[\s]*dark[\s]*\)[^{]+\{[\s\S]+?\}\s*\}/g,
      ""
    );

    try {
      elements = $.root().find("*").contents();
    } catch (e) {
      if (e instanceof RangeError) {
        // avoid contents() and keep comments in case of memory exceed
        app.logger.error(`Cheerio memory exceeded`);
        elements = $.root().find("*");
      }
    }
    elements.each((i, el) => {
      $(el)
        .removeAttr("onmousein")
        .removeAttr("onmousedown")
        .removeAttr("onmouseenter")
        .removeAttr("onmouseleave")
        .removeAttr("onmousemove")
        .removeAttr("onmouseout")
        .removeAttr("onmouseover")
        .removeAttr("onmouseup")
        .removeAttr("onclick");

      if (el.type === "comment") {
        $(el).remove();
      }

      //remove position absolute from inline style

      let style = $(el).attr("style");
      if (style) {
        let chunks = style.split(";");
        let results = [];
        for (let i = 0; i < chunks.length; i++) {
          let key = chunks[i].split(":")[0].trim();
          let value = chunks[i].split(":")[1] ? chunks[i].split(":")[1].trim() : "";
          if (key === "position" && value === "absolute") {
            continue;
          }

          if (key === "width" && value.indexOf("100vw") === 0) {
            results.push("width: 100%");
          } else if (key === "height" && value.indexOf("100vh") === 0) {
            results.push("height: 100%");
          } else {
            results.push(chunks[i]);
          }
        }
        let res = results.join(";");
        $(el).attr("style", `${res}`);
      }

      // handle bgcolor attributes
      if ($(el).attr("bgcolor")) {
        if ($(el).attr("style")) {
          let s = $(el).attr("style");
          $(el).attr("style", `${s}; background-color:${$(el).attr("bgcolor")};`);
        } else {
          $(el).attr("style", `background-color:${$(el).attr("bgcolor")};`);
        }
        $(el).removeAttr("bgcolor");
      }

      if (el.name && el.name.indexOf("o:") === 0) {
        el.name = el.name.replace("o:", "");
      }

      if (
        el.name === "img" &&
        $(el).prop("src") &&
        ($(el).prop("src").indexOf(`cid:`) === 0 || $(el).prop("src").indexOf(`CID:`) === 0)
      ) {
        let idx = $(el).prop("src").indexOf(":");
        let cid_value = $(el)
          .prop("src")
          .slice(idx + 1);
        for (let attachment of parsed_msg.attachments) {
          if (attachment.cid === cid_value) {
            $(el).prop(
              "src",
              `data:${attachment.contentType};base64,${attachment.content.toString("base64")}`
            );
          }
        }
      }

      if (el.name === "base") {
        $(el).remove();
      }

      if (el.name === "link") {
        $(el).remove();
      }

      if (el.name === "script") {
        $(el).remove();
      }

      if (el.name === "html") {
        el.name = "div";
        $(el).addClass("qbox-html");
      }

      if (el.name === "body") {
        el.name = "div";
        $(el).addClass("qbox-body");
      }

      if (el.name === "a") {
        // target="_self"
        // if ($(el).attr("target") === "_self") {
        //   $(el).attr("href", "#NOP").removeAttr("target");
        // }

        // add target blank to all links
        $(el).attr("target", "_blank");

        // add protocol in case it is not present
        if ($(el).attr("href") && $(el).attr("href") != "") {
          if ($(el).attr("href").startsWith("javascript")) {
            $(el).removeAttr("href");
          } else if (
            !$(el).attr("href").startsWith("mailto:") &&
            !$(el).attr("href").startsWith("tel:") &&
            !$(el)
              .attr("href")
              .match(/^ftps?:/) &&
            !$(el)
              .attr("href")
              .match(/^https?:/) &&
            !$(el).attr("href").startsWith("//")
          ) {
            let url = $(el).attr("href");
            $(el).attr("href", `http://${url}`);
          }
          // fix for space in url in Apparound messages
          // Ticket id = 12213
          if ($(el).attr("href")) {
            let sanitizedUrl = $(el).attr("href").replace("%20", "").replace(" ", "");
            $(el).attr("href", sanitizedUrl);
          }
        }
      }
    });

    $.root().find("head").remove();

    //remove comments from CSS style tag
    stylesRules = stylesRules.replace(/\/\*[^*]*\*+([^/][^*]*\*+)*\//gm, "");

    let selectors = [];

    // translate &lt; and &gt; with < and >
    stylesRules =
      " " +
      stylesRules
        .replace(/\n/g, " ")
        .replace(/\t/g, " ")
        .replace(/\s[\s]+/g, " ")
        .replace(/&gt;/g, ">")
        .replace(/&lt;/g, "<");

    postcss([postcss_add_class])
      .process(stylesRules, {from: undefined, parser: safe})
      .then((result) => {
        let style = `<style>${result.css
          .replace(/100vw/g, "100%")
          .replace(/100vh/g, "100%")}</style>`;
        $.root().prepend(style);

        if (options.action === "print" && options.showImages) {
          parsed_msg.html = $.html();
          template = generatePrintTemplate(parsed_msg, options.timezone, style);
          return callback(null, {parsed_msg: parsed_msg, template: template});
        }
        extractImages($, (err, results) => {
          parsed_msg.imagesData = results.imgUrls;
          parsed_msg.html = results.html;

          if (options.action === "print") {
            template = generatePrintTemplate(parsed_msg, options.timezone, style);
          }

          if (parsed_msg.html) {
            try {
              let linkifiedHTML = linkifyHtml(parsed_msg.html, {
                ignoreTags: ["style"],
                validate: true,
              });

              if (linkifiedHTML.length < parsed_msg.html.length) {
                /* app.logger.error(
                  `LINKIFY LENGTH MISMATCH: ${options.user_email} FOLDER ${options.folder} UID: ${options.uid}`
                ); */
              } else {
                parsed_msg.html = linkifiedHTML;
              }
            } catch (e) {
              app.logger.error(
                `ERROR LINKIFY: ${options.user_email} FOLDER ${options.folder} UID: ${
                  options.uid
                } - ${JSON.stringify(e)}`
              );
            }
          }

          return callback(null, {parsed_msg: parsed_msg, template: template});
        });
      })
      .catch((err) => {
        if (err.name === "CssSyntaxError") {
          app.logger.error(
            `ERROR PARSING CSS FOR MESSAGE ${parsed_msg["uid"]} (${
              parsed_msg.subject
            }) - REMOVE STYLE AND HIDE IMAGES ${JSON.stringify(err)}`
          );
          // set image placeholders
          if (options.action === "print" && options.showImages) {
            template = generatePrintTemplate(parsed_msg, options.timezone);
            return callback(null, {
              parsed_msg: parsed_msg,
              template: template,
            });
          }
          extractImages($, (err, results) => {
            parsed_msg.imagesData = results.imgUrls;
            parsed_msg.html = results.html;
            if (options.action === "print") {
              template = generatePrintTemplate(parsed_msg, options.timezone);
            }
            return callback(null, {
              parsed_msg: parsed_msg,
              template: template,
            });
          });
          return;
        }

        app.logger.error(`ERROR PARSING CSS - MESSAGE NOT SAVED ${JSON.stringify(err)}`);
        return callback(err);
      });
  };

  return {
    getParsedMessage: (obj, callback) => {
      parseTransform(
        obj.message.body,
        {
          isHuge: obj.isHuge,
          user_email: obj.user_email,
          folder: obj.folder,
          action: obj.action || "",
          showImages: obj.showImages || false,
          checksum1: obj.checksum1, //first level attachment checksum
          checksum2: obj.checksum2, //second level attachment checksum (inside EML files or ICS files)
          hash: obj.hash, //third level attachment hash (inside eml files, dat attachment, attachment inside dat)
          timezone: obj.timezone || "Europe/Rome",
          uid: obj.message.uid,
          flags: obj.message.flags,
          size: obj.message.size,
          output: obj.output,
          skipSaveToRedis: obj.skipSaveToRedis || undefined,
          originalData: obj.message.originalData,
        },
        (err, res) => {
          if (err) {
            app.logger.error(
              `USER ${obj.user_email} - FOLDER ${obj.folder} - UID ${
                obj.message.uid
              } PARSING WITH ERROR: ${JSON.stringify(err)}`
            );
            return callback(err);
          } else {
            return callback(null, res);
          }
        }
      );
    },
  };
}
