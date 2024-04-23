"use strict";

import fs from "fs";
import {fileURLToPath} from "url";
import {dirname} from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const version = JSON.parse(
  fs.readFileSync(`${__dirname}/package.json`, "utf-8").toString()
).version;

let config = {
  // DEVELOPMENT
  development: {
    version: version,
    port: 5000,
    defaultLanguage: "en",
    superSecret: "helloworld",
    pwd_enc_key: "d8578edf8458ce06fbc5bb76a58c5ca4", // 32 chars
    sessionTTL: 3600 * 24, // 1 day
    rememberMeSessionTTL: 3600 * 24 * 30, // 30 days
    cors: "*",
    redis: {
      data: {
        socket: {
          host: "redis",
          port: "6379",
        },
      },
      sessions: {
        socket: {
          host: "redis",
          port: "6379",
        },
      },
    },
    imap_folders_max_length: 50,
    imap_labels_max_length: 24,
    imap_num_thread_messages: 5,
    imap_max_open_messages: 5,
    imap_max_recipients: 10,
    imap_message_max_size: 50 * 1024 * 1024, // 50MB
    imap_text_message_max_size: 1 * 1024 * 1024, // 1MB
    imap_text_message_max_attach_size: 15 * 1024 * 1024, // 15MB
    imap_messages_max_download_size: 100 * 1024 * 1024, // 100 MB
    caldav_events_max_attach_size: 3 * 1024 * 1024, // 3MB
    rest_max_payload_size: 15 * 1024 * 1024,
    max_event_attachments_number: 4,
    max_labels_number: 4,
    max_firstname_length: 129,
    max_lastname_length: 126,
    max_email_length: 129,
    max_templates_attachments_number_basic: 5,
    max_templates_attachments_number_professional: 10,
    max_templates_attachments_number_enterprise: 10,
    max_template_size_basic: 5 * 1024 * 1024, //5MB
    max_template_size_professional: 10 * 1024 * 1024, //10MB
    max_template_size_enterprise: 10 * 1024 * 1024, //10MB
    max_identities_bcc_entries: 3,

    days_to_password_expiration_reminders: [30, 15, 7, 1],

    info_basic_body_it: fs
      .readFileSync(`${__dirname}/src/assets/mail_info_basic_it.txt`, "utf-8")
      .toString(),
    info_basic_body_en: fs
      .readFileSync(`${__dirname}/src/assets/mail_info_basic_en.txt`, "utf-8")
      .toString(),
    info_basic_subject_it: "Richiesta informazioni features piani avanzati",
    info_basic_subject_en: "Advanced plans feature's information request",
    info_basic_bcc: "filippo.verni@qboxmail.it",

    tmpFolder: "/tmp/webmail",
    mysql: {
      host: "10.66.4.201",
      user: "webmail",
      password: "qboxmail",
      connectionLimit: 5,
      encoding: "utf8",
      charset: "utf8mb4",
    },
    mysqlSlave: {
      host: "10.66.4.201",
      user: "webmail",
      password: "qboxmail",
      connectionLimit: 5,
      encoding: "utf8",
      charset: "utf8mb4",
    },
    db_webmail: "webmail",
    imap_params: {
      user: "",
      password: "",
      host: "imap.qboxmail.com",
      port: 143,
      tls: false,
      keepalive: {
        interval: 5000,
        idleInterval: 60000,
        forceNoop: true,
      },
    },
    smtp_params: {
      host: "smtp.emailvlt.net",
      //host: "smtp.qboxmail.com",
      port: 465,
      secure: true,
      auth: {
        user: "",
        pass: "",
      },
    },
    imap_login_params: {
      user: "",
      password: "",
      host: "10.66.4.235",
      port: 143,
      tls: false,
      authTimeout: 60000,
    },
    user_agent: "Qboxmail Webmail " + version,
    update_folders_interval: 20000,
    numberOfMessages: 25,
    cancelSendTimer: 5000,
    triggerIndexingInDays: 30,
    mailTTL: 3600 * 24 * 4,
    attachmentKeyTTL: 120,
    printMessageKeyTTL: 3600,
    defaultFolders: ["INBOX", "Sent", "Spam", "Drafts", "Archive", "Trash"],
    excludeVCardFlags: ["internet", "pref", "voice"],
    service_baseurl: "http://localhost:60000",
    dav_baseurl_internal: "https://webmail-sogo.emailvlt.net/SOGo/dav",
    dav_baseurl_public: "https://dav.emailvlt.net/SOGo/dav",
    sogo_baseurl: "https://webmail-sogo.emailvlt.net/SOGo/so",
    sogo_api_baseurl: "http://10.66.4.240/SOGo/so",
    dav_api_baseurl_internal: "http://10.66.4.240/SOGo/dav",
    sogo_auth_pwd: "1bd0531059b7e27d160ac4d7b9ff88de",
    backend_api_baseurl: "https://api.emailvlt.net",
    indexer_baseurl: "http://10.66.4.235:4000",
    etlive_baseurl: "http://10.66.4.224",
    doveadm_url: "https://doveadm.emailvlt.net:8443/doveadm/v1",
    doveadm_token: "Q2hpb3BhZWx1MUxh",
    qboxmailCssMessageClass: ".qboxmailCssClass",
    debug_email: "test@emailpnl.net",
    enable_fulltext_search: true,
    printMessageTemplate: fs
      .readFileSync(`${__dirname}/src/assets/printMessageTemplate.html`, "utf-8")
      .toString(),
    minio: {
      endPoint: "10.66.4.235",
      port: 9000,
      useSSL: false,
      accessKey: "minio",
      secretKey: "qboxmail",
    },
    avatarSize: {
      small: 64,
      big: 232,
    },
    integrations: {
      zoom: {
        clientID: "YagJIPt_RjGJWpDBimOh3Q",
        clientSecret: "gt9K0nlfKtCPWSp07xAC7joKjsG27fjy",
        redirect_uri: "https://webmail.emailvlt.net/api/zoom/register",
      },
    },
    killmeToken:
      "ed9300a05cecdf009a23713aaa046240eb605fb82846b1390c970e5246a867c4644aa6be6e9274e5bc19321047ea3174627c20b8e00b3d65ffa490bc5c1f928e",
  },

  // PRE-PRODUCTION
  prepro: {
    version: version,
    port: 5000,
    defaultLanguage: "en",
    superSecret: "bNYDKQ3jqMrdhLXqzCA48dpSHvp8uydj",
    pwd_enc_key: "d8578edf8458ce06fbc5bb76a58c5ca4", // 32 chars
    sessionTTL: 3600 * 24 * 7, // 7 days
    rememberMeSessionTTL: 3600 * 24 * 30, // 30 days
    cors: "*",
    redis: {
      data: {
        socket: {
          host: "redcache.qboxmail.com",
          port: "6379",
        },
      },
      sessions: {
        socket: {
          host: "10.96.3.124",
          port: "6379",
        },
      },
    },
    imap_folders_max_length: 50,
    imap_labels_max_length: 24,
    imap_num_thread_messages: 5,
    imap_max_open_messages: 5,
    imap_max_recipients: 150,
    imap_message_max_size: 50 * 1024 * 1024, // 50MB
    imap_text_message_max_size: 1 * 1024 * 1024, // 1MB
    imap_text_message_max_attach_size: 15 * 1024 * 1024, // 15MB
    imap_messages_max_download_size: 100 * 1024 * 1024, // 100 MB
    caldav_events_max_attach_size: 3 * 1024 * 1024, // 3MB
    rest_max_payload_size: 15 * 1024 * 1024,
    max_event_attachments_number: 4,
    max_labels_number: 4,
    max_firstname_length: 129,
    max_lastname_length: 126,
    max_email_length: 129,
    max_templates_attachments_number_basic: 5,
    max_templates_attachments_number_professional: 10,
    max_templates_attachments_number_enterprise: 10,
    max_template_size_basic: 5 * 1024 * 1024, //5MB
    max_template_size_professional: 10 * 1024 * 1024, //10MB
    max_template_size_enterprise: 10 * 1024 * 1024, //
    max_identities_bcc_entries: 3,

    days_to_password_expiration_reminders: [15, 7, 1],

    info_basic_body_it: fs
      .readFileSync(`${__dirname}/src/assets/mail_info_basic_it.txt`, "utf-8")
      .toString(),
    info_basic_body_en: fs
      .readFileSync(`${__dirname}/src/assets/mail_info_basic_en.txt`, "utf-8")
      .toString(),
    info_basic_subject_it: "Richiesta informazioni features piani avanzati",
    info_basic_subject_en: "Advanced plans feature's information request",
    info_basic_bcc: "info@qboxmail.it",

    tmpFolder: "/tmp/webmail",
    mysql: {
      host: "10.96.3.56",
      user: "webmail",
      password: "Z1Zxw9QuFXc1ZJAt",
      connectionLimit: 5,
      encoding: "utf8",
      charset: "utf8mb4",
    },
    mysqlSlave: {
      host: "10.96.3.57",
      user: "webmail",
      password: "Z1Zxw9QuFXc1ZJAt",
      connectionLimit: 5,
      encoding: "utf8",
      charset: "utf8mb4",
    },
    db_webmail: "webmail",
    imap_params: {
      user: "",
      password: "",
      host: "imap.qboxmail.com",
      port: 143,
      tls: false,
      keepalive: {
        interval: 5000,
        idleInterval: 60000,
        forceNoop: true,
      },
    },

    /* 
        I have issues with DNS / hosts file
        Node.js uses c-ares to resolve domain names, not the DNS library provided by the system, so if you have some custom DNS routing set up, it might be ignored. 
        Nodemailer runs dns.resolve4() and dns.resolve6() to resolve hostname into an IP address. If both calls fail, then Nodemailer will fall back to dns.lookup(). 
        If this does not work for you, you can hard code the IP address into the configuration like shown below. 
        In that case, Nodemailer would not perform any DNS lookups.
     */

    smtp_params: {
      host: "smtp.qboxmail.com", // "185.97.217.46",
      tls: {servername: "smtp.qboxmail.com"}, // this line must be removed
      port: 465,
      secure: true,
      auth: {
        user: "",
        pass: "",
      },
    },
    imap_login_params: {
      user: "",
      password: "",
      host: "10.96.3.98",
      port: 143,
      tls: false,
    },
    user_agent: "Qboxmail Webmail " + version,
    update_folders_interval: 120000,
    numberOfMessages: 25,
    cancelSendTimer: 5000,
    triggerIndexingInDays: 30,
    mailTTL: 3600 * 24 * 4,
    attachmentKeyTTL: 120,
    printMessageKeyTTL: 3600,
    defaultFolders: ["INBOX", "Sent", "Spam", "Drafts", "Archive", "Trash"],
    excludeVCardFlags: ["internet", "pref", "voice"],
    service_baseurl: "http://10.96.3.98",
    dav_baseurl_internal: "https://webmail-sogo.qboxmail.com/SOGo/dav",
    dav_baseurl_public: "https://dav.emailpnl.com/SOGo/dav",
    sogo_baseurl: "https://webmail-sogo.qboxmail.com/SOGo/so",
    sogo_api_baseurl: "http://10.96.3.125/SOGo/so",
    dav_api_baseurl_internal: "http://10.96.3.125/SOGo/dav",
    sogo_auth_pwd: "8eT3rG6ycaHQPcmsjz",
    backend_api_baseurl: "https://api.qboxmail.com",
    indexer_baseurl: "http://10.96.3.98:4000",
    etlive_baseurl: "http://10.96.3.73",
    doveadm_url: "https://doveadm.cbsolt.net:8443/doveadm/v1",
    doveadm_token: "dmlQaHUzSWV2MU9oaDZwaA==",
    qboxmailCssMessageClass: ".qboxmailCssClass",
    debug_email: "feedback@qboxmail.it",
    enable_fulltext_search: true,
    printMessageTemplate: fs
      .readFileSync(`${__dirname}/src/assets/printMessageTemplate.html`, "utf-8")
      .toString(),
    minio: {
      endPoint: "minio-webmail.qboxmail.com",
      port: 9000,
      useSSL: false,
      accessKey: "minio",
      secretKey: "rBd4Use9uwWssuGR",
    },
    avatarSize: {
      small: 64,
      big: 232,
    },
    integrations: {
      zoom: {
        clientID: "UL_zvRNvQ63uUCFwfE1A",
        clientSecret: "pcYMPaWE107zDL8WCtz2xOoo6Q98jfbx",
        redirect_uri: "https://webmail.qboxmail.com/api/zoom/register",
      },
    },
    killmeToken:
      "ed9300a05cecdf009a23713aaa046240eb605fb82846b1390c970e5246a867c4644aa6be6e9274e5bc19321047ea3174627c20b8e00b3d65ffa490bc5c1f928e",
  },
};

let env = process.env.NODE_ENV || "development";
export default config[env];
