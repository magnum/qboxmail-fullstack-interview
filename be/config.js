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
    imap_folders_max_length: 50,
    imap_labels_max_length: 24,
    imap_num_thread_messages: 5,
    imap_max_open_messages: 5,
    imap_max_recipients: 10,
    imap_message_max_size: 50 * 1024 * 1024, // 50MB
    imap_text_message_max_size: 1 * 1024 * 1024, // 1MB
    imap_text_message_max_attach_size: 15 * 1024 * 1024, // 15MB
    imap_messages_max_download_size: 100 * 1024 * 1024, // 100 MB
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

    tmpFolder: "/tmp/webmail",
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
    qboxmailCssMessageClass: ".qboxmailCssClass",
  },
};

let env = process.env.NODE_ENV || "development";
export default config[env];
