"use strict";
import moment from "moment-timezone";
import bytes from "bytes";

let mod = {};

mod.parse = function (params = {}, fts_autoindex) {
  let imapCriteria = {
    sort: [],
    search: [],
  };

  // parse and format the sorting filters
  const validSortingParams = {
    ASC: ["ARRIVAL"],
    DESC: ["-DATE"],
    "SUBJECT-DESC": ["-SUBJECT"],
    "SUBJECT-ASC": ["SUBJECT"],
    "SIZE-DESC": ["-SIZE"],
    "SIZE-ASC": ["SIZE"],
    "FROM-DESC": ["-DISPLAYFROM"],
    "FROM-ASC": ["DISPLAYFROM"],
  };

  if (params.sort_by && !validSortingParams[params.sort_by]) throw "Invalid sort parameter";

  if (!params.sort_by) {
    imapCriteria.sort = validSortingParams["DESC"];
  } else {
    imapCriteria.sort = validSortingParams[params.sort_by];
  }

  // parse and format the search filters
  imapCriteria.search = [];

  if (!params.search) {
    if (params.query) {
      let criteria;
      //if (params.fullBody) {
      if (fts_autoindex) {
        criteria = [
          "OR",
          ["BODY", params.query],
          [
            "OR",
            ["TO", params.query],
            ["OR", ["CC", params.query], ["OR", ["FROM", params.query], ["SUBJECT", params.query]]],
          ],
        ];
      } else {
        criteria = [
          "OR",
          ["TO", params.query],
          ["OR", ["CC", params.query], ["OR", ["FROM", params.query], ["SUBJECT", params.query]]],
        ];
      }

      imapCriteria.search.push(criteria);
    }

    if (params.from) imapCriteria.search.push(["FROM", params.from]);
    if (params.to) imapCriteria.search.push(["TO", params.to]);

    if (params.all) imapCriteria.search.push(["ALL", params.all]);
    if (params.seen) imapCriteria.search.push(["SEEN", params.seen]);
    if (params.unseen) imapCriteria.search.push(["UNSEEN", params.unseen]);

    if (params.flagged) imapCriteria.search.push(["FLAGGED", params.flagged]);
    if (params.withAttachments) imapCriteria.search.push(["KEYWORD", "$HasAttachment"]);
    if (params.label) imapCriteria.search.push(["KEYWORD", params.label]);
    if (params.subject) imapCriteria.search.push(["SUBJECT", params.subject]);
    if (params.header) imapCriteria.search.push(["HEADER", params.header.key, params.header.value]);

    if (params.sentsince) {
      imapCriteria.search.push(["SENTSINCE", moment(params.sentsince)]);
    }
    if (params.sentbefore) {
      imapCriteria.search.push(["SENTBEFORE", moment(params.sentbefore).add(1, "days")]);
    }

    if (params.sizeComparison && params.size && params.sizeComparison) {
      imapCriteria.search.push([
        params.sizeComparison.toUpperCase(),
        bytes(`${params.size} ${params.sizeUnit}`),
      ]);
    }

    if (imapCriteria.search.length === 0) imapCriteria.search.push("ALL");
  } else {
    imapCriteria.search = params.search;
  }

  return imapCriteria;
};

export default mod;
