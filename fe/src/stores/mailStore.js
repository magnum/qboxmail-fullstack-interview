import {store} from "@risingstack/react-easy-state/dist/es.es5.js";
import qs from "query-string";
import _ from "lodash";
import sessionStore from "./sessionStore.js";

// The mailStore contains all the data relative messages that the frontend
// receive from the server. Every edit to this data must be performed through
// setters (functions) declared in this store.
let mailStore = store({
  // Folders
  folders: [],
  currentPath: "",
  currentFolder: undefined,
  // Messages
  messages: new Map(),
  threaded_uids: {},
  messagesLoading: false,
  currentMessage: undefined,
  numMessagesFound: undefined,
  openedMessageThreads: {},
  loadingInitialThreadItems: false,
  loadingMoreThreadItems: false,
  arrAttachments: [],
  currentQuery: {},

  isLoadingMessage: false,
  showPlaceholder: false,

  // actions buffer
  actionsBuffer: {},

  //toggle flag seen timer
  markReadTimer: null,

  inboxHighestmodseq: null,

  reloadSocketConnection() {
    if (sessionStore.socket) {
      sessionStore.socket.close();
    }

    clearTimeout(sessionStore.connectionTimeout);
    clearInterval(sessionStore.tokenRefreshInterval);
  },

  /**
   * Init store with socket
   *
   * @param  {object} opts - {}
   */
  init(opts = {}) {
    mailStore.initialOpts = opts;

    mailStore.cleanSocketListeners();
    mailStore.addSocketListeners();
    // mailStore.loadSocketImapConnections(opts);
    mailStore.startImapConnections();

    if (opts && opts.onMailStoreReady) {
      opts.onMailStoreReady();
    }
  },

  reset() {
    mailStore.cleanSocketListeners();
    mailStore.folders = [];
    mailStore.currentPath = "";
    mailStore.currentFolder = undefined;
    // Messages
    mailStore.messages = new Map();
    mailStore.threaded_uids = {};
    mailStore.messagesLoading = false;
    mailStore.currentMessage = {};
    mailStore.areMailMessagesLoaded = false;
    mailStore.numMessagesFound = undefined;
    mailStore.currentQuery = {};
    mailStore.referenceUID = null;
  },

  addSocketListeners() {
    sessionStore.addNewSocketListener("imap_message_list_answer", mailStore.updateMessageList);
    sessionStore.addNewSocketListener("imap_message", mailStore.openMessage);
  },

  openMessage(data) {
    mailStore.currentMessage = data;
    mailStore.isLoadingMessage = false;
  },

  cleanSocketListeners() {
    if (!sessionStore.socket) {
      console.log("mailstore cleanSocketListeners: socket not present");
      return false;
    }

    sessionStore.socket.removeListener("imap_message_list_answer", mailStore.updateMessageList);
    sessionStore.socket.removeListener("imap_folders", mailStore.updateFoldersList);
    sessionStore.socket.removeListener("imap_idle_request", mailStore.idleRequest);
  },

  startImapConnections() {
    if (!sessionStore.socket) {
      console.log("startImapConnections: socket not present");
      return false;
    }
    sessionStore.emit("imap_start_connection");
  },

  updateMessageList(data) {
    mailStore.messagesLoading = false;
    mailStore.loadingNextPage = false;

    let numMessages = data.found_messages_number;
    if (
      (mailStore.messages.size === 0 && data.msgsData.length >= 0) ||
      mailStore.idleReceived === mailStore.currentFolder ||
      data.msgsData.length > sessionStore.limits.imap_num_messages // is not a page
    ) {
      // reset idleReceived
      mailStore.idleReceived = false;
      mailStore.resetSearch = false;
      mailStore.messages = new Map(mailStore.normalizeMessages(data.msgsData));

      // handle thread stuff, it is not important for the interview
      if (Object.keys(mailStore.threaded_uids).length === 0) {
        mailStore.threaded_uids = {...data.msgsRelated};
      } else {
        for (let i in mailStore.threaded_uids) {
          for (let j in mailStore.threaded_uids[i]) {
            if (data.msgsRelated[i] && data.msgsRelated[i][j]) {
              mailStore.threaded_uids[i][j] = {
                ...mailStore.threaded_uids[i][j],
                ...data.msgsRelated[i][j],
              };
            }
          }
        }

        for (let k in data.msgsRelated) {
          if (!mailStore.threaded_uids[k]) {
            mailStore.threaded_uids[k] = data.msgsRelated[k];
          }
        }
      }
    } else {
      if (mailStore.resetSearch) {
        mailStore.messages = new Map(mailStore.normalizeMessages(data.msgsData));

        if (Object.keys(mailStore.threaded_uids).length === 0) {
          mailStore.threaded_uids = {...data.msgsRelated};
        } else {
          for (let i in mailStore.threaded_uids) {
            for (let j in mailStore.threaded_uids[i]) {
              if (data.msgsRelated[i] && data.msgsRelated[i][j]) {
                mailStore.threaded_uids[i][j] = {
                  ...mailStore.threaded_uids[i][j],
                  ...data.msgsRelated[i][j],
                };
              }
            }
          }

          for (let k in data.msgsRelated) {
            if (!mailStore.threaded_uids[k]) {
              mailStore.threaded_uids[k] = data.msgsRelated[k];
            }
          }
        }
        mailStore.resetSearch = false;
      } else {
        // Append messages
        data.msgsData.forEach((msg) => {
          mailStore.messages.set(msg.uid, msg);
        });

        if (Object.keys(mailStore.threaded_uids).length === 0) {
          mailStore.threaded_uids = {...data.msgsRelated};
        } else {
          for (let i in mailStore.threaded_uids) {
            for (let j in mailStore.threaded_uids[i]) {
              if (data.msgsRelated[i] && data.msgsRelated[i][j]) {
                mailStore.threaded_uids[i][j] = {
                  ...mailStore.threaded_uids[i][j],
                  ...data.msgsRelated[i][j],
                };
              }
            }
          }

          for (let k in data.msgsRelated) {
            if (!mailStore.threaded_uids[k]) {
              mailStore.threaded_uids[k] = data.msgsRelated[k];
            }
          }
        }
      }
    }

    // Handle threads
    _.each(data.msgsRelated, (uids, key) => {
      key = parseInt(key, 10);
      let threadUnreaded = false;
      let threadMessageFlagged = false;
      for (let i in uids) {
        if (uids[i].flags.indexOf("\\Seen") === -1) {
          threadUnreaded = true;
        }
        if (uids[i].flags.indexOf("\\Flagged") !== -1) {
          threadMessageFlagged = true;
        }
      }

      mailStore.messages.forEach((value) => {
        if (value.uid === key) {
          value.threadUnreaded = threadUnreaded;
          value.threadMessageFlagged = threadMessageFlagged;
        }
      });
    });

    let isLastMessage = false;

    let lastMessage = Array.from(mailStore.messages.values()).pop();
    if (
      lastMessage &&
      mailStore.currentMessage &&
      lastMessage.uid === mailStore.currentMessage.uid
    ) {
      isLastMessage = true;
    }

    if (mailStore.currentFolder === "Drafts") {
      let keys = Array.from(mailStore.newMessages.keys());

      for (let i in keys) {
        let m = mailStore.newMessages.get(keys[i]);
        let uid = m.data.uid;
        let mesg = mailStore.messages.get(uid);

        if (mesg) {
          mesg.disabled = true;
        }
      }
    }

    mailStore.messageNotInList =
      mailStore.currentMessage && mailStore.currentMessage.uid
        ? !mailStore.messages.has(mailStore.currentMessage.uid)
        : false;
    mailStore.messagesLoading = false;
    mailStore.areMailMessagesLoaded = true;
    mailStore.isLastPage = data.is_last_page;
    mailStore.isLastMessage = isLastMessage;
    mailStore.numMessagesFound = numMessages;
  },

  /**
   * Transform the messages array in a normalized array of [uid, messageObject] to
   * use it to initialize the Map structure
   *
   * @param  {object} messages - array of messages
   */
  normalizeMessages(messages) {
    if (mailStore.currentFolder === "Drafts") {
      let m = _.filter(messages, (o) => {
        return o.flags && o.flags.indexOf("Deleted") < 0;
      });

      for (let j in m) {
        if (Array.from(mailStore.newMessages.keys()).indexOf(m[j].headers["x-identifier"]) >= 0) {
          m[j].disabled = true;
        } else {
          m[j].disabled = false;
        }
      }
      return m.map((v) => [v.uid, v]);
    } else {
      return messages.map((v) => [v.uid, v]);
    }
  },

  /**
   * Handle when server trigger IMAP IDLE
   *
   * @param  {string} folder - name of the folder
   * @param  {string} type - ???
   */
  idleRequest(folder, type) {
    if (!sessionStore.socket) {
      console.log("idleRequest: socket not present");
      return false;
    }

    mailStore.idleReceived = folder;

    //update highestModSeq for webmail red dot
    if (type === "mail") {
      let hms = parseInt(mailStore.inboxHighestmodseq, 10) + 1;

      if (
        folder === "INBOX" &&
        mailStore.inboxHighestmodseq !== null &&
        mailStore.inboxHighestmodseq !== hms
      ) {
        mailStore.newMessagesInInbox = true;
        mailStore.inboxHighestmodseq = hms;
      }
    }

    let last_uid = -1;
    let filters = qs.parse(window.location.search) || "";

    if (!filters) {
      filters = mailStore.currentQuery;
    }

    if (
      filters &&
      (filters.unseen === "true" || filters.seen === "true" || filters.flagged === "true")
    ) {
      return;
    }

    let objImapConn = {
      folder: folder,
      criteria: {...filters, last_uid},
      numMsgs:
        mailStore.messages.size > sessionStore.limits.imap_num_messages
          ? mailStore.messages.size
          : sessionStore.limits.imap_num_messages,
      showThreads: sessionStore.settings.mail.reading.showThreads,
      type: type,
      curMessageUid:
        mailStore.currentMessage && mailStore.currentMessage.hasOwnProperty("uid")
          ? mailStore.currentMessage.uid
          : null,
      fts_autoindex: mailStore.fts_autoindex,
    };

    sessionStore.emit("imap_get_messages_list", objImapConn);
  },
});

// TODO only in development
window.mailStore = mailStore;
export default mailStore;
