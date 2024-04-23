import {store} from "@risingstack/react-easy-state/dist/es.es5.js";
import env from "../env.js";
import qs from "query-string";
import _ from "lodash";
import i18next from "i18next";
import inbox from "../icons/inboxColor.svg";
import sent from "../icons/sentColor.svg";
import spam from "../icons/spamColor.svg";
import drafts from "../icons/draftsColor.svg";
import archive from "../icons/archiveColor.svg";
import trash from "../icons/trashColor.svg";
import folder from "../icons/folder.svg";
import sessionStore from "./sessionStore.js";

// The mailStore contains all the data relative messages that the frontend
// receive from the server. Every edit to this data must be performed through
// setters (functions) declared in this store.
let mailStore = store({
  // Folders
  folders: [],
  currentPath: "",
  currentFolder: undefined,
  oldCurrentfolder: undefined,
  updatedFmtdFolders: false,
  currentFolderPerms: {},
  // Messages
  messages: new Map(),
  threaded_uids: {},
  messagesLoading: false,
  currentMessage: undefined,
  areMailMessagesLoaded: false,
  areMailFoldersLoaded: false,
  isSubscridedToSharedFolders: false,
  numMessagesFound: undefined,
  virtualTotalMessages: undefined,
  openedMessageThreads: {},
  loadingInitialThreadItems: false,
  loadingMoreThreadItems: false,
  arrAttachments: [],
  currentQuery: {},
  referenceUID: null,
  openMailFromTask: false,
  // Multiple selection
  selectedMessages: {},
  selectionMode: false,
  firstSelected: undefined,
  // Mail settings
  isCurrentSenderContact: false,
  initialOpts: undefined,

  showNavbarBack: false,
  messageStackBackup: null,
  showAdvancedFilters: false,

  //lastRequest: null,
  //pendingSearch: false,

  // Quota info
  quotaInfo: {
    storageUsage: 0,
    storageLimit: 0,
    messageUsage: 0,
    messageLimit: 0,
  },

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
    mailStore.oldCurrentfolder = undefined;
    mailStore.updatedFmtdFolders = false;
    mailStore.currentFolderPerms = {};
    // Messages
    mailStore.messages = new Map();
    mailStore.threaded_uids = {};
    mailStore.messagesLoading = false;
    mailStore.currentMessage = {};
    mailStore.areMailMessagesLoaded = false;
    mailStore.areMailFoldersLoaded = false;
    mailStore.isSubscridedToSharedFolders = false;
    mailStore.numMessagesFound = undefined;
    mailStore.virtualTotalMessages = undefined;
    mailStore.openedMessageThreads = {};
    mailStore.loadingInitialThreadItems = false;
    mailStore.loadingMoreThreadItems = false;
    mailStore.currentQuery = {};
    mailStore.referenceUID = null;
    mailStore.openMailFromTask = false;
    // Multiple selection
    mailStore.selectedMessages = {};
    mailStore.selectionMode = false;
    mailStore.firstSelected = undefined;
    // Mail settings
    mailStore.isCurrentSenderContact = false;
    mailStore.initialOpts = undefined;
    mailStore.messageStackBackup = null;
    mailStore.showAdvancedFilters = false;
    mailStore.closedStack = [];
    mailStore.openedStack = [];
    mailStore.newMessages = new Map();
    mailStore.activeNewMessageModal = null;
    mailStore.recalcStacks = false;
    mailStore.deletingMessageUID = null;
    mailStore.lastSelectedMessageIndex = -1;
    mailStore.resetSearch = false;
    mailStore.unSelectAll = false;
    mailStore.messageIdAutocompleteHighlighted = "";

    mailStore.pendingNotification = null;

    mailStore.messageNotInList = false;
    mailStore.showThreadsChanged = false;
    mailStore.newMessagesInInbox = false;

    //mailStore.lastRequest = null;
    //mailStore.pendingSearch = false;

    mailStore.quotaInfo = {
      storageUsage: 0,
      storageLimit: 0,
      messageUsage: 0,
      messageLimit: 0,
    };

    mailStore.actionsBuffer = {};

    mailStore.isLoadingMessage = false;
    mailStore.showPlaceholder = false;
  },

  addSocketListeners() {
    sessionStore.addNewSocketListener(
      "imap_start_connection_answer",
      mailStore.startConnectionAnswer
    );
    sessionStore.addNewSocketListener("imap_message_list_answer", mailStore.updateMessageList);
    sessionStore.addNewSocketListener("imap_message", mailStore.openMessageI);

    // sessionStore.addNewSocketListener("imap_folders", mailStore.updateFoldersList);
    // sessionStore.addNewSocketListener("imap_get_quota", mailStore.renderQuota);
    // sessionStore.addNewSocketListener("imap_idle_request", mailStore.idleRequest);
    //TODO add errors handler of ~ Mail.js:910
  },

  openMessageI(data) {
    console.log("openMessage", data);
    mailStore.currentMessage = data;
    mailStore.isLoadingMessage = false;
  },

  cleanSocketListeners() {
    if (!sessionStore.socket) {
      console.log("mailstore cleanSocketListeners: socket not present");
      return false;
    }
    sessionStore.socket.removeListener(
      "imap_start_connection_answer",
      mailStore.startConnectionAnswer
    );
    sessionStore.socket.removeListener("imap_message_list_answer", mailStore.updateMessageList);
    sessionStore.socket.removeListener("imap_folders", mailStore.updateFoldersList);
    sessionStore.socket.removeListener("imap_get_quota", mailStore.renderQuota);
    sessionStore.socket.removeListener("imap_idle_request", mailStore.idleRequest);
  },

  get arrayOfMessages() {
    return Array.from(mailStore.messages).map((duple) => duple[1]);
  },

  startImapConnections() {
    if (!sessionStore.socket) {
      console.log("startImapConnections: socket not present");
      return false;
    }
    sessionStore.emit("imap_start_connection");
  },

  updateFolders() {
    if (!sessionStore.socket) {
      console.log("openFolder: socket not present");
      return false;
    }
    sessionStore.emit("imap_update_folders");
  },

  /**
   * TODO
   *
   * @param  {string} name - name of the folder to open
   */
  openFolder(name) {
    if (!sessionStore.socket) {
      console.log("openFolder: socket not present");
      return false;
    }

    let folder = decodeURIComponent(name);
    mailStore.currentFolder = folder;

    // Reset Fields
    mailStore.messages = new Map();
    mailStore.threaded_uids = {};
    mailStore.currentMessage = {};
    mailStore.messagesLoading = true;
    mailStore.openedMessageThreads = {};

    if (mailStore.folders[name] && mailStore.folders[name].isShared) {
      mailStore.getFolderRights(name);
    } else {
      mailStore.currentFolderPerms = {
        canDelete: true,
        canWrite: true,
      };
    }

    let filters = qs.parse(window.location.search) || "";

    if (!filters) {
      filters = mailStore.currentQuery;
    }

    let objImapConn = {
      folder: folder,
      showThreads: sessionStore.settings.mail.reading.showThreads,
      forceOpen: false,
      filters: filters,
    };

    sessionStore.emit("imap_open_folder", objImapConn);
  },

  deleteFolder(folder) {
    if (!sessionStore.socket) {
      console.log("deleteFolder: socket not present");
      return false;
    }

    let fldr = mailStore.folders[folder];

    if (fldr.hasChildren) {
      let toRemove = [];
      let folders = Object.keys(mailStore.folders);
      folders.forEach((f) => {
        if (f.match(new RegExp(`^${folder}/`))) {
          toRemove.push(f);
        }
      });

      toRemove.forEach((n) => {
        delete mailStore.folders[n];
      });
    }

    delete mailStore.folders[folder];
    mailStore.updatedFmtdFolders = true;
    sessionStore.emit("imap_delete_folder", {folder: folder});
  },

  /**
   * Add a new folder
   *
   * @param  {string} the name of the folder typed by the user
   */
  addFolder(folder) {
    if (!sessionStore.socket) {
      console.log("addFolder: socket not present");
      return false;
    }

    sessionStore.emit("imap_add_folder", {folder});
    mailStore.updatedFmtdFolders = true;
  },

  /**
   * Rename an existing folder
   *
   * @param {obj} {old_name: the current fullname of the folder, new_name: the new name typed by the user}
   */
  renameFolder(objFolder) {
    if (!sessionStore.socket) {
      console.log("renameFolder: socket not present");
      return false;
    }

    let oldName = objFolder.old_name;
    let newName = objFolder.new_name;

    let sanitizedName = newName.replace(/^\.\//, "");
    if (Object.keys(mailStore.folders).indexOf(sanitizedName) >= 0) {
      return false;
    }

    // rename folder locally
    mailStore.folders = _.mapKeys(mailStore.folders, (value, key) => {
      if (key === oldName) return newName;
      return key;
    });

    // update internal props
    mailStore.folders[newName] = _.mapValues(mailStore.folders[newName], (value) => {
      if (value === oldName) return newName;
      return value;
    });

    mailStore.updatedFmtdFolders = true;

    sessionStore.emit("imap_rename_folder", {
      folder_old: oldName,
      folder_new: newName,
    });
  },

  /**
   * Get shared folder rights
   *
   * @param  {string} name - name of the folder to open
   */
  getFolderRights(name) {
    let xhr = new XMLHttpRequest();
    xhr.open("GET", env.be_url + "/imap/folders/" + encodeURIComponent(name) + "/myrights", true);
    xhr.setRequestHeader("Content-type", "application/json");
    xhr.setRequestHeader("x-access-token", sessionStore.token);
    xhr.send();

    xhr.onreadystatechange = () => {
      if (xhr.readyState === 4 && xhr.status === 200) {
        let res = JSON.parse(xhr.responseText);
        mailStore.currentFolderPerms = res;
      }
    };
  },

  requestRestore(data, cb) {
    let xhr = new XMLHttpRequest();
    xhr.open("POST", env.be_url + "/imap/request_restore", true);
    xhr.setRequestHeader("Content-type", "application/json");
    xhr.setRequestHeader("x-access-token", sessionStore.token);
    xhr.send(JSON.stringify(data));

    xhr.onreadystatechange = () => {
      if (xhr.readyState === 4 && xhr.status === 200) {
        return cb();
      } else if (xhr.readyState === 4 && xhr.status !== 200) {
        let body;
        if (xhr.response) body = JSON.parse(xhr.response);

        return cb({err: (body && body.err) || "Request error"});
      }
    };
  },

  startConnectionAnswer() {
    sessionStore.isImapReady = true;
    if (mailStore.initialOpts && mailStore.initialOpts.onImapReady) {
      mailStore.initialOpts.onImapReady();
    }
  },

  resetInboxNotification() {
    mailStore.newMessagesInInbox = false;
  },

  updateFoldersList(boxes) {
    let {fmtFolders, isSubscridedToSharedFolders} = mailStore.normalizeFolders(boxes);

    // if (Object.keys(mailStore.folders).length > 0 && mailStore.folders[mailStore.currentFolder]) {
    //   for (let i in fmtFolders) {
    //     if (i === mailStore.currentFolder) {
    //       fmtFolders[i] = mailStore.folders[i];
    //     }
    //   }
    // }

    let folders = mailStore.sortFolders(fmtFolders);

    let obj = localStorage.getItem("closed_folders")
      ? JSON.parse(localStorage.getItem("closed_folders"))
      : {};

    let updateLocalStorage = false;

    // start with all folders opened
    for (let i in folders) {
      if (!mailStore.inboxHighestmodseq && i === "INBOX") {
        mailStore.inboxHighestmodseq = parseInt(folders[i].highestmodseq, 10);
      }

      let folderName = folders[i].fullName;

      if (obj[folderName]) {
        if (folders[i].hasChildren) {
          folders[i].opened = false;
        } else {
          folders[i].opened = true;
          delete obj[folderName];
          updateLocalStorage = true;
        }
      } else {
        folders[i].opened = true;
      }
    }

    if (updateLocalStorage) {
      localStorage.setItem("closed_folders", JSON.stringify(obj));
      updateLocalStorage = false;
    }

    mailStore.folders = folders;
    mailStore.isSubscridedToSharedFolders = isSubscridedToSharedFolders;
    mailStore.updatedFmtdFolders = true;
    mailStore.areMailFoldersLoaded = true;
  },

  updateMessageList(data) {
    mailStore.loadingNextPage = false;

    console.log("messages", data);

    // If data are not for the current folder ignore them
    // if (data.folder && data.folder !== decodeURIComponent(mailStore.currentFolder)) return;

    mailStore.messagesLoading = false;

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

      // remove the one that are marked as remove in the actions buffer
      const toRemove = mailStore.getRemovedFromActionsBuffer(mailStore.currentFolder);
      toRemove.forEach((uid) => {
        mailStore.messages.delete(uid);
      });

      // apply the right flags to the messages that are in the action buffer
      const flagStatuses = mailStore.getFlagsStatusFromActionsBuffer(mailStore.currentFolder);
      flagStatuses.forEach((data) => {
        if (mailStore.messages.get(data.uid)) mailStore.messages.get(data.uid).flags = data.flags;
      });

      if (data.msgsData.length <= sessionStore.limits.imap_num_messages) {
        //TODO move to component level
        // scrollReset = true;
      }

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

      // reset actions buffer
      mailStore.resetActionsBuffer(mailStore.currentFolder);
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

    const toRemove = mailStore.getRemovedFromActionsBuffer(mailStore.currentFolder);
    toRemove.forEach((uid) => {
      mailStore.messages.delete(uid);
    });

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

  renderQuota(msg) {
    mailStore.quotaInfo = {
      storageUsage: msg.storage ? msg.storage.usage * 1024 : null,
      storageLimit: msg.storage ? msg.storage.limit * 1024 : null,
      messageUsage: msg.message ? msg.message.usage : null,
      messageLimit: msg.message ? msg.message.limit : null,
    };
  },

  refreshMessages(searchFilters, forceNew) {
    mailStore._refreshingMessages = true;
    mailStore.search(searchFilters, true, forceNew, null, true);
  },

  goToMessage(msg, checkThread) {
    if (msg && mailStore.currentMessage && msg.uid === mailStore.currentMessage.uid) {
      return;
    }

    if (mailStore.messages?.get(msg.uid)?.flags.indexOf("\\Seen") === -1) {
      mailStore.resetInboxNotification();
    }

    // if it is opening a message from the thread preview
    // the message will not be present in the message list and will not be
    // marked as "clicked"
    if (mailStore.messages.get(msg.uid)) {
      mailStore.messages.get(msg.uid).clicked = true;
    }

    mailStore.selectedMessages = {};

    if (mailStore.currentFolder === "Drafts" && process.env.REACT_APP_MTM === "0") {
      mailStore.messages.get(msg.uid).disabled = true;
      mailStore.openMessage(msg.uid);
      return;
    }

    msg.content = "";
    mailStore.currentMessage = msg;

    mailStore.checkThread = checkThread;
    mailStore.openMessage(msg.uid);
  },

  openMessageNotInList(uid) {
    let objImapConn = {
      uid: uid,
      folder: mailStore.currentFolder,
      markSeen: true,
      showImages: true,
    };

    sessionStore.emit("imap_get_message", objImapConn);
    mailStore.currentMessage = {};
    mailStore.selectedMessages = {};
    mailStore.firstSelected = undefined;
    mailStore.messageToOpen = uid;
  },

  openMessage(uid) {
    let msg = mailStore.messages.get(uid);

    if (
      mailStore.currentFolder !== "Drafts" ||
      (mailStore.currentFolder === "Drafts" && process.env.REACT_APP_MTM === "1")
    ) {
      if (msg && mailStore.openMailFromTask) {
        mailStore.currentMessage = msg;
      }

      let content = "";
      if (
        mailStore.currentMessage.html &&
        mailStore.currentMessage.html !== false &&
        mailStore.currentMessage.html !== ""
      ) {
        content = mailStore.currentMessage.html;
      } else if (
        mailStore.currentMessage.text &&
        mailStore.currentMessage.text !== false &&
        mailStore.currentMessage.text !== ""
      ) {
        content = mailStore.currentMessage.text;
      }

      mailStore.currentMessage.content = content;
    }

    if (!sessionStore.socket) {
      console.log("openMessage: socket not present");
      return false;
    }

    uid = parseInt(uid, 10);

    if (
      sessionStore.settings.mail.reading.showImages === "contacts" &&
      mailStore.currentFolder !== "Drafts"
    ) {
      // check if is a parent of a thread
      if (mailStore.currentMessage) {
        mailStore.checkMailIfContact(mailStore.currentMessage.from.value[0].address, uid);
      } else if (mailStore.threaded_uids[uid]) {
        let m = mailStore.messages.get(uid);
        mailStore.checkMailIfContact(m.from.value[0].address, uid);
      } else {
        // check if is a child of a thread
        for (let msg in mailStore.threaded_uids) {
          //child is passed so i need to find it and update it
          for (let j = 0; j < mailStore.threaded_uids[msg].length; j++) {
            if (mailStore.threaded_uids[msg][j].uid === uid) {
              mailStore.checkMailIfContact(
                mailStore.threaded_uids[msg][j].from.value[0].address,
                uid
              );
              break;
            }
          }
        }
      }
    } else {
      let objImapConn = {
        uid: uid,
        folder: mailStore.currentFolder,
        markSeen: true,
        showImages: true,
      };

      sessionStore.emit("imap_get_message", objImapConn);

      mailStore.selectedMessages = {};
      mailStore.firstSelected = undefined;
      mailStore.messageToOpen = uid;
    }
  },

  // renderMessage(res, cb) {
  //   if (!res) {
  //     console.log("Unreadable message");
  //     return;
  //   }

  //   if (!sessionStore.socket) {
  //     console.log("renderMessage: socket not present");
  //     return false;
  //   }

  //   if (mailStore.openMessagePlaceholderTimer) {
  //     clearTimeout(mailStore.openMessagePlaceholderTimer);
  //   }

  //   /**** MAKE SURE TO HAVE FOLDERS DATA *****/
  //   if (mailStore.folders.length === 0) {
  //     setTimeout(() => {
  //       mailStore.renderMessage(res, cb);
  //     }, 50);
  //     return;
  //   }

  //   let j = 0;
  //   let messageOpened = {};
  //   let showMessageImages = false;

  //   let content = "";
  //   let arrValidFlags = [];

  //   if (res.html && res.html !== false && res.html !== "") {
  //     content = res.html;
  //   } else if (res.text && res.text !== false && res.text !== "") {
  //     content = res.text;
  //   }

  //   res.content = content;

  //   if (mailStore.messages.get(res.uid)) {
  //     res.flags = mailStore.messages.get(res.uid).flags;
  //   } else {
  //     for (let t in mailStore.threaded_uids) {
  //       let threads = Array.from(mailStore.threaded_uids[t]);
  //       for (let u in threads) {
  //         if (threads[u].uid === res.uid) {
  //           res.flags = threads[u].flags;
  //         }
  //       }
  //     }
  //   }

  //   for (j = 0; j < res.flags.length; j++) {
  //     if (sessionStore.datasets.system_flags.indexOf(res.flags[j]) === -1) {
  //       arrValidFlags.push(res.flags[j]);
  //     }
  //   }

  //   res.validFlags = arrValidFlags;

  //   // Handle image placeholders
  //   if (res.imagesData) {
  //     let hasPlaceholderImage = false;

  //     if (sessionStore.settings.mail.reading.showImages === "never") {
  //       // render images
  //       hasPlaceholderImage = true;
  //       showMessageImages = false;
  //     } else if (sessionStore.settings.mail.reading.showImages === "always") {
  //       // render images
  //       hasPlaceholderImage = false;
  //       showMessageImages = true;
  //     } else if (
  //       sessionStore.settings.mail.reading.showImages === "contacts" &&
  //       mailStore.isCurrentSenderContact
  //     ) {
  //       hasPlaceholderImage = false;
  //       showMessageImages = true;
  //     }

  //     //if i'm in spam folder never render image
  //     if (mailStore.currentFolder === "Spam") {
  //       hasPlaceholderImage = true;
  //       showMessageImages = false;
  //     }

  //     const imgData = res.imagesData;

  //     let keys = Object.keys(imgData);

  //     for (let j in keys) {
  //       if (keys[j].indexOf("_css-img-placeholder") >= 0) {
  //         if (!hasPlaceholderImage && showMessageImages) {
  //           res.content = res.content.split(keys[j]).join(imgData[keys[j]]);
  //         } else {
  //           res.content = res.content.split(imgData[keys[j]]).join(keys[j]);
  //         }
  //       } else {
  //         if (!hasPlaceholderImage && showMessageImages) {
  //           res.content = res.content
  //             .split(`<span data-img-id="${keys[j]}" class="qbox_placeholder"></span>`)
  //             .join(imgData[keys[j]]);
  //         } else {
  //           res.content = res.content
  //             .split(imgData[keys[j]])
  //             .join(`<span data-img-id="${keys[j]}" class="qbox_placeholder"></span>`);
  //         }
  //       }
  //     }
  //   }

  //   res.showImages = showMessageImages;

  //   // Handle ICS
  //   if (res.attachmentsMetaData && res.attachmentsMetaData.length > 0) {
  //     res.events = [];
  //     let attachments = [];
  //     // Handle local image in signature
  //     for (let i in res.attachmentsMetaData) {
  //       if (
  //         !res.attachmentsMetaData[i].hasOwnProperty("related") ||
  //         (res.attachmentsMetaData[i].related && res.attachmentsMetaData[i].related === false)
  //       ) {
  //         attachments.push(res.attachmentsMetaData[i]);
  //       } else if (
  //         res.attachmentsMetaData[i].related &&
  //         res.attachmentsMetaData[i].contentType &&
  //         res.attachmentsMetaData[i].contentType.indexOf("image/") < 0
  //       ) {
  //         attachments.push(res.attachmentsMetaData[i]);
  //       }
  //     }

  //     res.attachmentsMetaData = attachments;

  //     for (let a in res.attachmentsMetaData) {
  //       if (
  //         res.attachmentsMetaData[a].contentType === "text/calendar" &&
  //         res.attachmentsMetaData[a].data
  //       ) {
  //         res.events.push(res.attachmentsMetaData[a].data);
  //       }
  //     }
  //   }

  //   messageOpened = res;

  //   // if it is opening a draft, show it in the newMessage window
  //   if (mailStore.currentFolder === "Drafts" && process.env.REACT_APP_MTM === "0") {
  //     let arrCRC = [];

  //     if (typeof messageOpened.headers["attachment_crc"] === "string") {
  //       arrCRC.push(messageOpened.headers["attachment_crc"]);
  //     } else {
  //       arrCRC = messageOpened.headers["attachment_crc"];
  //     }

  //     let defaultIdentity = `${sessionStore.settings.general.firstName} ${sessionStore.settings.general.lastName} <${sessionStore.username}>`;

  //     return cb(undefined, true, {
  //       body: messageOpened.content,
  //       subject: messageOpened.subject,
  //       to: (messageOpened.to && messageOpened.to.value) || [],
  //       cc: (messageOpened.cc && messageOpened.cc.value) || [],
  //       bcc: (messageOpened.bcc && messageOpened.bcc.value) || [],
  //       from: (messageOpened.from && messageOpened.from.text) || defaultIdentity,
  //       attachmentsArray: messageOpened.attachmentsMetaData,
  //       customHeaders: {
  //         attachment_crc: arrCRC,
  //         "x-identifier": messageOpened.headers["x-identifier"],
  //         priority: messageOpened.headers["priority"],
  //         askReadConfirmation: messageOpened.headers.hasOwnProperty("askreadconfirmation")
  //           ? messageOpened.headers["askreadconfirmation"] === "true"
  //             ? true
  //             : false
  //           : sessionStore.settings.mail.compose.readConfirmation === "never"
  //           ? false
  //           : true,
  //         askDeliveryConfirmation: messageOpened.headers.hasOwnProperty("askdeliveryconfirmation")
  //           ? messageOpened.headers["askdeliveryconfirmation"] === "true"
  //             ? true
  //             : false
  //           : sessionStore.settings.mail.compose.readConfirmation === "never"
  //           ? false
  //           : true,
  //         plainTextComposition: messageOpened.headers.hasOwnProperty("plaintextcomposition")
  //           ? messageOpened.headers["plaintextcomposition"] === "true"
  //             ? true
  //             : false
  //           : false,
  //       },
  //       uid: messageOpened.uid,
  //       inReplyTo: messageOpened.headers["inReplyTo"],
  //       objHeadersReply: {
  //         references: messageOpened.headers["references"],
  //       },
  //       parent_uid: messageOpened.headers["parent_uid"],
  //       parent_folder: messageOpened.headers["parent_folder"],
  //       parent_flag: messageOpened.headers["parent_flag"],
  //       fromDraft: true,
  //       draftMessage: true,
  //       focusPosition:
  //         (messageOpened.headers["inReplyTo"] && messageOpened.headers["inReplyTo"].length > 0) ||
  //         (messageOpened.headers["references"] && messageOpened.headers["references"].length) > 0
  //           ? "start"
  //           : "end",
  //     });
  //   }

  //   let mail = null;
  //   let uid = parseInt(messageOpened.uid, 10);

  //   let msgs = Array.from(mailStore.messages.values());

  //   if (msgs.length > 0 && msgs[0].uid === messageOpened.uid) {
  //     mailStore.isFirstMessage = true;
  //   } else {
  //     mailStore.isFirstMessage = false;
  //   }

  //   if (msgs.length > 0 && msgs[msgs.length - 1].uid === messageOpened.uid) {
  //     mailStore.isLastMessage = true;
  //   } else {
  //     mailStore.isLastMessage = false;
  //   }

  //   if (messageOpened.events && messageOpened.events.length > 0) {
  //     mailStore.checkAttendeesStatus(messageOpened, (msg) => {
  //       if (mailStore.messages.get(uid)) {
  //         mail = mailStore.messages.get(uid);

  //         if (mail) {
  //           messageOpened.flags = Array.from(mail.flags);
  //         }

  //         for (j = 0; j < messageOpened.validFlags.length; j++) {
  //           if (messageOpened.flags.indexOf(messageOpened.validFlags[j]) === -1) {
  //             messageOpened.validFlags.splice(messageOpened.validFlags[j], 1);
  //           }
  //         }

  //         for (j = 0; j < messageOpened.flags.length; j++) {
  //           if (messageOpened.validFlags.indexOf(messageOpened.flags[j]) === -1) {
  //             messageOpened.validFlags.push(messageOpened.flags[j]);
  //           }
  //         }

  //         messageOpened.showEventsActionsBar = msg.showEventsActionsBar || {};
  //         messageOpened.outDatedEvent = msg.outDatedEvent || false;

  //         messageOpened.originalData =
  //           mailStore.messages.get(messageOpened.uid) &&
  //           mailStore.messages.get(messageOpened.uid).originalData;

  //         mailStore.currentMessage = messageOpened;

  //         mailStore.selectedMessage = messageOpened.uid;

  //         return cb(messageOpened, false);
  //       } else {
  //         for (let i in mailStore.threaded_uids) {
  //           let m = mailStore.threaded_uids[i];
  //           for (let k in m) {
  //             if (m[k].uid === uid) {
  //               messageOpened.flags = Array.from(m[k].flags);

  //               for (j = 0; j < messageOpened.validFlags.length; j++) {
  //                 if (messageOpened.flags.indexOf(messageOpened.validFlags[j]) === -1) {
  //                   messageOpened.validFlags.splice(messageOpened.validFlags[j], 1);
  //                 }
  //               }

  //               for (j = 0; j < messageOpened.flags.length; j++) {
  //                 if (messageOpened.validFlags.indexOf(messageOpened.flags[j]) === -1) {
  //                   messageOpened.validFlags.push(messageOpened.flags[j]);
  //                 }
  //               }
  //               messageOpened.showEventsActionsBar = msg.showEventsActionsBar || {};
  //               messageOpened.outDatedEvent = msg.outDatedEvent || false;
  //               messageOpened.originalData = mailStore.threaded_uids[i][k].originalData;
  //               mailStore.threaded_uids[i][k] = messageOpened;
  //             }
  //           }
  //         }

  //         if (mailStore.currentMessage.uid === messageOpened.uid) {
  //           messageOpened.originalData = mailStore.currentMessage.originalData;
  //           mailStore.currentMessage = messageOpened;
  //         }
  //         return cb(messageOpened, false);
  //       }
  //     });
  //   } else {
  //     return cb(messageOpened, false);
  //   }
  // },

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

  toggleFlagMessage(
    originalData,
    currentUIDS,
    flag,
    value,
    threadOperation = false,
    toggleAllMessages = false
  ) {
    if (!sessionStore.socket) {
      console.log("toggleFlagMessage: socket not present");
      return false;
    }

    if (!currentUIDS || !originalData) {
      console.log("toggleFlagMessage: uid not present");
      return false;
    }

    if (currentUIDS.indexOf(mailStore.currentMessage.uid) >= 0) {
      clearTimeout(mailStore.markReadTimer);
    }

    let counterRead = {};
    let counterUnread = {};
    let found = false;
    let messageFlags = [];

    // calc uids to update
    if (threadOperation) {
      for (let i in currentUIDS) {
        let u = currentUIDS[i];
        if (mailStore.threaded_uids[u]) {
          currentUIDS = currentUIDS.concat(mailStore.threaded_uids[u].map((m) => m.uid));
          originalData = originalData.concat(mailStore.threaded_uids[u].map((m) => m.originalData));
        }
      }
    }

    for (let i in currentUIDS) {
      let u = parseInt(currentUIDS[i], 10);
      // Passed by reference so any update on the messageInList
      // reflect instantly on mailStore.messages
      let messageInList = mailStore.messages.get(u);

      if (messageInList) {
        found = true;
        messageFlags = messageFlags.concat(messageInList.flags);

        if (value) {
          if (messageInList.flags.indexOf(flag) < 0) {
            messageInList.flags.push(flag);

            if (!counterRead[messageInList.originalData.folder]) {
              counterRead[messageInList.originalData.folder] = 0;
            }

            counterRead[messageInList.originalData.folder] += 1;
          }
        } else {
          let idx = messageInList.flags.indexOf(flag);
          if (idx > -1) {
            messageInList.flags.splice(idx, 1);

            if (!counterUnread[messageInList.originalData.folder]) {
              counterUnread[messageInList.originalData.folder] = 0;
            }

            counterUnread[messageInList.originalData.folder] += 1;
          }
        }

        mailStore.messages.set(u, messageInList);

        // mark as removed in the action buffer
        mailStore.addInActionsBuffer(u, mailStore.currentFolder, {flags: messageInList.flags});
      }
    }

    // update threaded_uids
    for (let i in mailStore.threaded_uids) {
      let mess = mailStore.threaded_uids[i].filter((m) => currentUIDS.indexOf(m.uid) > -1);

      if (mess.length === 0) {
        continue;
      } else {
        found = true;
      }

      for (let m in mess) {
        if (!mess[m].flags) {
          mess[m].flags = [];
        }

        messageFlags = messageFlags.concat(mess[m].flags);

        if (value) {
          if (mess[m].flags.indexOf(flag) === -1) {
            // Add flag
            mess[m].flags.push(flag);

            if (!counterRead[mailStore.currentFolder]) {
              counterRead[mailStore.currentFolder] = 0;
            }

            counterRead[mailStore.currentFolder] += 1;
          }
        } else {
          // Remove flag
          let idx = mess[m].flags.indexOf(flag);
          if (idx > -1) {
            mess[m].flags.splice(idx, 1);

            if (!counterUnread[mailStore.currentFolder]) {
              counterUnread[mailStore.currentFolder] = 0;
            }

            counterUnread[mailStore.currentFolder] += 1;
          }
        }
      }
    }

    if (!found && mailStore.currentMessage) {
      messageFlags = messageFlags.concat(mailStore.currentMessage);

      if (value) {
        if (mailStore.currentMessage.flags.indexOf(flag) < 0) {
          mailStore.currentMessage.flags.push(flag);

          if (!counterRead[mailStore.currentMessage.originalData.folder]) {
            counterRead[mailStore.currentMessage.originalData.folder] = 0;
          }

          counterRead[mailStore.currentMessage.originalData.folder] += 1;
        }
      } else {
        let idx = mailStore.currentMessage.flags.indexOf(flag);
        if (idx > -1) {
          mailStore.currentMessage.flags.splice(idx, 1);

          if (!counterUnread[mailStore.currentMessage.originalData.folder]) {
            counterUnread[mailStore.currentMessage.originalData.folder] = 0;
          }

          counterUnread[mailStore.currentMessage.originalData.folder] += 1;
        }
      }
    }

    // Handle threads
    mailStore.messages.forEach((value, key) => {
      let threadUnreaded = false;
      let threadMessageFlagged = false;
      let threaduids = mailStore.threaded_uids;

      if (threaduids[key] && threaduids[key].length > 0) {
        for (let i in threaduids[key]) {
          messageFlags = messageFlags.concat(threaduids[key][i].flags);

          if (threaduids[key][i].flags && threaduids[key][i].flags.indexOf("\\Seen") === -1) {
            threadUnreaded = true;
          }
          if (threaduids[key][i].flags && threaduids[key][i].flags.indexOf("\\Flagged") !== -1) {
            threadMessageFlagged = true;
          }
        }
        value.threadUnreaded = threadUnreaded;
        value.threadMessageFlagged = threadMessageFlagged;
      }
    });

    // If seen/unseen update also folder counter
    if (flag === "\\Seen") {
      if (value) {
        if (toggleAllMessages) {
          mailStore.folders[mailStore.currentFolder].unseen_messages = 0;
        } else {
          for (let f in counterRead) {
            if (mailStore.folders[f]) {
              mailStore.folders[f].unseen_messages -= counterRead[f];
            }
          }
        }
      } else {
        if (toggleAllMessages) {
          let totalMessages = mailStore.folders[mailStore.currentFolder].tot_messages;
          mailStore.folders[mailStore.currentFolder].unseen_messages = totalMessages;
        } else {
          for (let f in counterUnread) {
            if (mailStore.folders[f]) {
              mailStore.folders[f].unseen_messages += counterUnread[f];
            }
          }
        }
      }

      messageFlags = [];
    }

    if (mailStore.currentFolder === "INBOX" && flag.split("\\")[1] === "Seen" && value === true) {
      mailStore.newMessagesInInbox = false;
    }

    // Sync with server
    let objImapConn = {
      uids: originalData,
      flag: flag.split("\\")[1],
      action: value,
      criteria: {sort: ["-DATE"], search: ["ALL"]},
    };

    sessionStore.emit("imap_toggle_flags", objImapConn);
  },

  toggleLabel(label, originalData, currentUIDS, threadOperation = false, maxLabelNumCallback) {
    if (!sessionStore.socket) {
      console.log("toggleLabel: socket not present");
      return false;
    }

    let value = false;
    let flags = [];
    let skipSave = false;
    let uids = currentUIDS;
    let found = false;

    uids.forEach((u) => {
      let idx = null;
      let messageInList = mailStore.messages.get(parseInt(u, 10));

      if (messageInList) {
        found = true;

        idx = messageInList.flags.indexOf(label);

        flags = _.filter(messageInList.flags, function (obj) {
          return obj.indexOf("$qb") === 0;
        });

        if (idx === -1 && flags.length === sessionStore.limits.max_labels_number) {
          skipSave = true;
        } else {
          if (idx < 0) {
            messageInList.flags.push(label);
            value = true;
          } else {
            messageInList.flags.splice(idx, 1);
          }
        }

        if (mailStore.currentMessage.uid === messageInList.uid) {
          mailStore.currentMessage.flags = messageInList.flags;
        }
      }
    });

    if (threadOperation) {
      for (let i in currentUIDS) {
        let u = currentUIDS[i];
        if (mailStore.threaded_uids[u]) {
          uids = uids.concat(mailStore.threaded_uids[u].map((m) => m.uid));
          originalData = originalData.concat(mailStore.threaded_uids[u].map((m) => m.originalData));
        }
      }
    }

    // update threaded_uids
    for (let u in mailStore.threaded_uids) {
      let mess = mailStore.threaded_uids[u].filter((m) => uids.indexOf(m.uid) > -1);

      if (mess.length === 0) {
        continue;
      } else {
        found = true;
      }

      for (let m of mess) {
        let idx = m.flags.indexOf(label);

        flags = _.filter(m.flags, function (obj) {
          return obj.indexOf("$qb") === 0;
        });

        if (idx === -1 && flags.length === sessionStore.limits.max_labels_number) {
          skipSave = true;
        } else {
          if (threadOperation && value && idx === -1) {
            m.flags.push(label);
          } else if (threadOperation && !value && idx !== -1) {
            m.flags.splice(idx, 1);
          } else if (!threadOperation && idx !== -1) {
            // Remove label
            m.flags.splice(idx, 1);
          } else if (!threadOperation && idx === -1) {
            // Add label
            m.flags.push(label);
            value = true;
          }

          if (mailStore.currentMessage.uid === m.uid) {
            mailStore.currentMessage.flags = m.flags;
          }
        }
      }
    }

    if (!found && mailStore.currentMessage) {
      let idx = mailStore.currentMessage.flags.indexOf(label);

      if (idx !== -1) {
        // Remove label
        mailStore.currentMessage.flags.splice(idx, 1);
      } else if (idx === -1) {
        // Add label
        mailStore.currentMessage.flags.push(label);
        value = true;
      }
    }

    if (!skipSave) {
      // Sync with server
      const objImapConn = {
        uids: originalData,
        flag: label,
        action: value,
      };

      sessionStore.emit("imap_toggle_keywords", objImapConn);
    } else {
      if (maxLabelNumCallback) {
        maxLabelNumCallback();
      }
    }
  },

  deleteMessage(search, originalData, currentUIDS, threadOperation = false, cb) {
    if (!sessionStore.socket) {
      console.log("deleteMessage: socket not present");
      return false;
    }

    // when making thread operation only the parent uid is passed
    // that is used to get all the uids of the thread
    if (threadOperation) {
      let uid = currentUIDS[0];
      if (mailStore.threaded_uids && mailStore.threaded_uids[uid]) {
        for (let m of mailStore.threaded_uids[uid]) {
          currentUIDS.push(m.uid);
          originalData.push(m.originalData);
        }
      }
    }

    // clean selection
    mailStore.selectedMessages = {};
    mailStore.firstSelected = undefined;

    let messageToOpen = undefined;

    // open the right currentMessage if there is one opened
    if (mailStore.currentMessage && currentUIDS.indexOf(mailStore.currentMessage.uid) > -1) {
      let uid = mailStore.currentMessage.uid;

      // if the message is in a thread, do nothing
      // if it is parent of a thread, show the the first child
      if (
        !threadOperation &&
        mailStore.threaded_uids[uid] &&
        mailStore.threaded_uids[uid].length > 0
      ) {
        messageToOpen = mailStore.threaded_uids[uid][0];
      } else {
        // it is a message without thread
        let orderedUIDs = Array.from(mailStore.messages.values());
        let idx = _.findIndex(orderedUIDs, (msg) => msg.uid === uid);

        if (idx >= 0 && orderedUIDs[idx + 1]) {
          messageToOpen = orderedUIDs[idx + 1];
        } else {
          // if not found, set the first before the one that
          // is being deleted as default
          messageToOpen = orderedUIDs[idx - 1];
        }
      }
    }

    //manage local folder messages counters
    if (mailStore.currentFolder !== "Trash") {
      mailStore.handleFolderCounters(
        currentUIDS,
        originalData,
        false,
        mailStore.currentFolder,
        "Trash"
      );
    } else {
      if (mailStore.folders["Trash"].tot_messages - currentUIDS.length >= 0) {
        mailStore.folders["Trash"].tot_messages -= currentUIDS.length;
      }
    }

    currentUIDS.forEach((u) => {
      u = parseInt(u, 10);
      // if is parent of a thread mark it as deleted and wait
      // for imap_idle to handle the rest
      if (mailStore.threaded_uids[u] && mailStore.threaded_uids[u].length > 0 && !threadOperation) {
        let m = mailStore.messages.get(u);
        if (m) m.deleted = true;
      } else {
        // remove from messages list
        // if the message is the child of a thread, this action does nothing
        mailStore.messages.delete(u);
      }
      // remove from threaded_uids and save parent UID
      mailStore._removeFromThreadedUIDs(u, threadOperation);

      // remove from thread preview

      if (mailStore.openedMessageThreads[u]) {
        delete mailStore.openedMessageThreads[u];
      }
    });

    if (messageToOpen) {
      if (mailStore.messages.get(messageToOpen.uid)) {
        mailStore.goToMessage(messageToOpen, true);
      } else {
        mailStore.currentMessage = {};
        if (cb) {
          cb();
        }
      }
    } else {
      if (mailStore.messages.size === 0) {
        mailStore.currentMessage = {};
        if (cb) {
          cb();
        }
      }
    }

    mailStore.addInActionsBuffer(currentUIDS, mailStore.currentFolder, {removed: true});
    let objImapConn = {
      uids: originalData,
      dest_folder: "Trash",
      criteria: {sort: ["-DATE"], search: ["ALL"]},
    };

    sessionStore.emit("imap_remove_messages", objImapConn);
  },

  _removeFromThreadedUIDs(uid, threadOperation) {
    // remove all the thread and return
    if (threadOperation) {
      delete mailStore.threaded_uids[uid];
      return;
    }

    for (let u in mailStore.threaded_uids) {
      // Check if the message that want to be remove is the parent of the thread
      // In this case re-assign the thread to the new parent
      if (parseInt(u, 10) === parseInt(uid, 10) && mailStore.threaded_uids[u].length > 0) {
        let threadUIDs = mailStore.threaded_uids[u];
        let messageToOpen = threadUIDs[0];
        let UIDToOpen = messageToOpen.uid;

        // remove first element, that become the new parent
        threadUIDs.shift();
        mailStore.threaded_uids[UIDToOpen] = threadUIDs;
        delete mailStore.threaded_uids[uid];
      }
      // Check if the message that want to be remove is a child of the thread
      for (let idx in mailStore.threaded_uids[u]) {
        if (mailStore.threaded_uids[u][idx].uid === uid) {
          mailStore.threaded_uids[u].splice(idx, 1);
          break;
        }
      }
    }
  },

  copyMessageInFolder(originalData, currentUIDS, folder, threadOperation = false) {
    if (!sessionStore.socket) {
      console.log("copyMessageInFolder: socket not present");
      return false;
    }

    if (threadOperation) {
      for (let i in currentUIDS) {
        let u = currentUIDS[i];
        if (mailStore.threaded_uids[u]) {
          currentUIDS = currentUIDS.concat(mailStore.threaded_uids[u].map((m) => m.uid));
          originalData = originalData.concat(mailStore.threaded_uids[u].map((m) => m.originalData));
        }
      }
    }

    mailStore.handleFolderCounters(
      currentUIDS,
      originalData,
      true,
      mailStore.currentFolder,
      folder
    );

    let objImapConn = {
      uids: originalData,
      dest_folder: folder,
      criteria: {sort: ["-DATE"], search: ["ALL"]},
    };

    sessionStore.emit("imap_copy_messages", objImapConn);
  },

  moveMessageInFolder(search, originalData, currentUIDS, folder, threadOperation = false) {
    if (!sessionStore.socket) {
      console.log("moveMessageInFolder: socket not present");
      return false;
    }

    //let performSearch = false;
    let messageToOpen = undefined;

    if (threadOperation) {
      let uid = currentUIDS[0];
      if (mailStore.threaded_uids && mailStore.threaded_uids[uid]) {
        for (let m of mailStore.threaded_uids[uid]) {
          currentUIDS.push(m.uid);
          originalData.push(m.originalData);
        }
      }
    }

    if (!mailStore.selectionMode) {
      if (mailStore.currentMessage && currentUIDS.indexOf(mailStore.currentMessage.uid) >= 0) {
        let uid = mailStore.currentMessage.uid;

        // if the message is in a thread, do nothing
        // if it is parent of a thread, show the the first child
        if (
          !threadOperation &&
          mailStore.threaded_uids[uid] &&
          mailStore.threaded_uids[uid].length > 0
        ) {
          messageToOpen = mailStore.threaded_uids[uid][0];
        } else {
          // it is a message without thread
          let orderedUIDs = Array.from(mailStore.messages.values());
          let idx = _.findIndex(orderedUIDs, (msg) => msg.uid === uid);

          if (idx > 0 && orderedUIDs[idx + 1]) {
            messageToOpen = orderedUIDs[idx + 1];
          } else {
            // if not found, set the first after the one that
            // is being deleted as default
            messageToOpen = orderedUIDs[1];
          }
        }

        if (messageToOpen) {
          mailStore.goToMessage(messageToOpen, true);
        } else {
          mailStore.currentMessage = {};
        }
      }
    } else {
      mailStore.currentMessage = {};
      mailStore.selectedMessages = {};
    }

    //manage local folder messages counters
    mailStore.handleFolderCounters(
      currentUIDS,
      originalData,
      false,
      mailStore.currentFolder,
      folder
    );

    currentUIDS.forEach((u) => {
      u = parseInt(u, 10);
      // if is parent of a thread mark it as deleted and wait
      // for imap_idle to handle the rest
      if (mailStore.threaded_uids[u] && mailStore.threaded_uids[u].length > 0 && !threadOperation) {
        let m = mailStore.messages.get(u);
        if (m) m.deleted = true;
      } else {
        // remove from messages list
        // if the message is the child of a thread, this action does nothing
        mailStore.messages.delete(u);
      }

      // remove from threaded_uids
      mailStore._removeFromThreadedUIDs(u, threadOperation);

      // remove from thread preview
      if (mailStore.openedMessageThreads[u]) {
        delete mailStore.openedMessageThreads[u];
      }
    });

    mailStore.addInActionsBuffer(currentUIDS, mailStore.currentFolder, {removed: true});

    const objImapConn = {
      uids: originalData,
      dest_folder: folder,
      criteria: {sort: ["-DATE"], search: ["ALL"]},
    };

    sessionStore.emit("imap_move_messages", objImapConn);
  },

  toggleJunkFlag(originalData, uids, value, threadOperation = false) {
    if (!sessionStore.socket) {
      console.log("toggleJunkFlag: socket not present");
      return false;
    }

    // calc uids to update
    if (threadOperation) {
      let uid = uids[0];
      uids = uids.concat(mailStore.threaded_uids[uid].map((m) => m.uid));
    }

    if (mailStore.currentMessage && uids.indexOf(mailStore.currentMessage.uid) > -1) {
      mailStore.currentMessage = {};
    }

    //fix local counters
    mailStore.handleFolderCounters(uids, originalData, false, mailStore.currentFolder, "Spam");

    uids.forEach((u) => {
      let messageUid = parseInt(u, 10);
      // remove from message list
      mailStore.messages.delete(messageUid);

      // remove from threaded_uids
      mailStore._removeFromThreadedUIDs(messageUid, threadOperation);

      // remove from thread preview
      if (mailStore.openedMessageThreads[messageUid]) {
        delete mailStore.openedMessageThreads[messageUid];
      }
    });

    mailStore.addInActionsBuffer(uids, mailStore.currentFolder, {removed: true});

    let objImapConn = {
      uids: originalData,
      flag: "Junk",
      action: value,
    };

    sessionStore.emit("imap_toggle_spam", objImapConn);
  },

  handleFolderCounters(uids, origData, keep, sourceFolder, destinationFolder) {
    let unreadMsgs = 0;
    let originalData = {};

    for (let obj of origData) {
      if (!originalData[obj.folder]) {
        originalData[obj.folder] = [];
      }
      originalData[obj.folder].push(obj.uid);
    }

    for (let uid of uids) {
      let msg = mailStore.messages.get(parseInt(uid, 10));

      if (msg) {
        if (msg.flags.indexOf("\\Seen") < 0) {
          unreadMsgs++;
        }
      } else {
        for (let u in mailStore.threaded_uids) {
          let message = mailStore.threaded_uids[u].find((o) => {
            return o.uid === uid;
          });

          if (message) {
            if (message.flags && message.flags.indexOf("\\Seen") < 0) {
              unreadMsgs++;
            }
            break;
          }
        }
      }
    }

    if (unreadMsgs > 0) {
      if (sourceFolder !== "search_all_folders" && !keep) {
        if (mailStore.folders[sourceFolder].unseen_messages - unreadMsgs >= 0) {
          mailStore.folders[sourceFolder].unseen_messages -= unreadMsgs;
        } else {
          mailStore.folders[sourceFolder].unseen_messages = 0;
        }

        if (mailStore.folders[sourceFolder].tot_messages - uids.length >= 0) {
          mailStore.folders[sourceFolder].tot_messages -= uids.length;
        } else {
          mailStore.folders[sourceFolder].tot_messages = 0;
        }
      } else if (sourceFolder === "search_all_folders" && !keep) {
        for (let f of Object.keys(originalData)) {
          if (mailStore.folders[f].unseen_messages - unreadMsgs >= 0) {
            mailStore.folders[f].unseen_messages -= unreadMsgs;
          } else {
            mailStore.folders[f].unseen_messages = 0;
          }

          if (mailStore.folders[f].tot_messages - originalData[f].length >= 0) {
            mailStore.folders[f].tot_messages -= originalData[f].length;
          } else {
            mailStore.folders[f].tot_messages = 0;
          }
        }
      }

      mailStore.folders[destinationFolder].unseen_messages += unreadMsgs;
    }

    mailStore.folders[destinationFolder].tot_messages += uids.length;

    if (mailStore.folders["INBOX"].unseen_messages === 0) {
      mailStore.resetInboxNotification();
    }
  },

  updatePartecipationStatus(uid, option) {
    for (let i in mailStore.currentMessage.events) {
      if (
        mailStore.currentMessage.events[i].UID === uid &&
        mailStore.currentMessage.events[i].RSVP.attendees
      ) {
        mailStore.currentMessage.events[i].RSVP.attendees[sessionStore.settings.general.email] =
          option.toString();
      }
    }
  },

  getFlagsStatusFromActionsBuffer(folder) {
    let flaggeds = [];

    if (mailStore.actionsBuffer[folder]) {
      for (let uid in mailStore.actionsBuffer[folder]) {
        if (mailStore.actionsBuffer[folder][uid].flags) {
          flaggeds.push({
            uid: parseInt(uid, 10),
            flags: mailStore.actionsBuffer[folder][uid].flags,
          });
        }
      }
    }

    return flaggeds;
  },

  getRemovedFromActionsBuffer(folder) {
    let removeds = [];

    if (mailStore.actionsBuffer[folder]) {
      for (let uid in mailStore.actionsBuffer[folder]) {
        if (mailStore.actionsBuffer[folder][uid].removed) {
          removeds.push(parseInt(uid, 10));
        }
      }
    }

    return removeds;
  },

  addInActionsBuffer(uids, folder, state) {
    if (!mailStore.actionsBuffer[folder]) mailStore.actionsBuffer[folder] = {};
    if (!Array.isArray(uids)) uids = [uids];

    for (let uid of uids) {
      if (!mailStore.actionsBuffer[folder][uid]) mailStore.actionsBuffer[folder][uid] = {};

      mailStore.actionsBuffer[folder][uid] = {...state};
    }
  },

  resetActionsBuffer(folder = null) {
    if (folder) {
      mailStore.actionsBuffer[folder] = {};
    } else {
      mailStore.actionsBuffer = {};
    }
  },

  checkSaveDraftDialogs() {
    let ids = Array.from(mailStore.newMessages.keys());
    let found = false;
    for (let i in ids) {
      let msg = mailStore.newMessages.get(ids[i]);
      if (msg.saveDraftDialogOpened === true) {
        found = true;
        break;
      }
    }
    return found;
  },

  closeSaveDraftDialogs() {
    let ids = Array.from(mailStore.newMessages.keys());
    for (let i in ids) {
      let msg = mailStore.newMessages.get(ids[i]);
      msg.saveDraftDialogOpened = false;
      mailStore.newMessages.set(ids[i], msg);
    }
  },

  printMessage(obj) {
    let uids = [];

    if (Object.keys(mailStore.selectedMessages).length > 0) {
      for (let key in mailStore.selectedMessages) {
        uids.push(parseInt(key, 10));
      }
    } else {
      uids.push(parseInt(obj.uid, 10));
    }

    let req = {
      token: sessionStore.token,
      folder: mailStore.currentFolder,
      uids: uids,
      timezone: sessionStore.settings.general.timezone,
      user: sessionStore.settings.general.email,
      showImages: obj.showImages,
    };

    return `${env.be_url}/download/message_print_direct/?${qs.stringify(req, {
      arrayFormat: "bracket",
    })}`;
  },

  updateDraft(id, action, callback) {
    if (!sessionStore.socket) {
      console.log("updateDraft: socket not present");
      return false;
    }

    let msg = mailStore.newMessages.get(id);

    // if it is already saving a draft, enqueue another update action
    // at the end of the current operation

    const editorInitBody = "<div></div>";
    let emptyBody =
      !msg.data.body || msg.data.body.length === 0 || msg.data.body === editorInitBody;
    let emptyTo = !msg.data.to || msg.data.to.length === 0;
    let emptySubject = !msg.data.subject || msg.data.subject.length === 0;
    let emptyAttachments = !msg.data.attachmentsArray || msg.data.attachmentsArray.length === 0;
    let isOnServer = !!msg.data.uid;

    if (emptyBody && emptyTo && emptySubject && emptyAttachments && !isOnServer) {
      if (callback && window.location.pathname.indexOf("/mail/") === 0) {
        callback("closeModal", {action: "update_and_close"});
      }
      return;
    }

    let objMail = {
      from: msg.data.from,
      to: msg.data.to,
      cc: msg.data.cc,
      bcc: msg.data.bcc,
      subject: msg.data.subject,
      html: msg.data.body,
      text: msg.data.bodyText,
      uid: msg.data.uid,
      inReplyTo: msg.data.inReplyTo,
      headers: {...msg.data.customHeaders, ...msg.data.objHeadersReply},
      attachments: msg.data.attachmentsArray,
      readConfirmation: sessionStore.settings.mail.compose.readConfirmation,
      deliveryNotification: sessionStore.settings.mail.compose.deliveryNotification,
      action: action,
      parent_flag: msg.data.parent_flag, //"$forwarded"
      parent_folder: msg.data.parent_folder, //"INBOX"
      parent_uid: msg.data.parent_uid, //5312
    };

    let xhr = new XMLHttpRequest();

    xhr.open("POST", env.be_url + "/imap/append_message", true);
    xhr.setRequestHeader("x-access-token", sessionStore.token);

    let fdata = new FormData();
    if (objMail.attachments && objMail.attachments.length > 0) {
      for (let i in objMail.attachments) {
        if (objMail.attachments[i].content && objMail.attachments[i].hash) {
          fdata.append(
            objMail.attachments[i].hash,
            new Blob([objMail.attachments[i].content], {type: "application/octet-stream"})
          );
        }
        delete objMail.attachments[i].content;
      }
    }

    msg.isSavingDraft = true;
    mailStore.newMessages.set(id, msg);

    fdata.append("message", JSON.stringify(objMail));

    xhr.ontimeout = () => {
      let now = new Date();

      let saveDraftStuckDate =
        now.getDate() +
        "-" +
        (now.getMonth() + 1) +
        "-" +
        now.getFullYear() +
        " " +
        now.getHours() +
        ":" +
        now.getMinutes();
      localStorage.setItem("saveDraftStuck", saveDraftStuckDate);
    };

    xhr.send(fdata);

    xhr.onreadystatechange = () => {
      if (xhr.readyState === 4) {
        if (xhr.status === 200 && xhr.response) {
          let response = null;
          try {
            response = JSON.parse(xhr.response);
          } catch (e) {
            console.log(`error parsing JSON in updateDraft: ${xhr.response}`);
          }
          if (callback && window.location.pathname.indexOf("/mail/") === 0) {
            if (action === "update") {
              callback("appendResponse", response);
            } else if (action === "update_and_close") {
              callback("closeModal", {action: action});
            }
          }

          if (!objMail.uid || objMail.action === "send") {
            if (mailStore.folders["Drafts"].unseen_messages > 0) {
              mailStore.folders["Drafts"].unseen_messages -= 1;
            }

            if (mailStore.folders["Drafts"].tot_messages > 0) {
              mailStore.folders["Drafts"].tot_messages -= 1;
            }
          }
        } else {
          msg.isSavingDraft = false;
          mailStore.newMessages.set(id, msg);

          if (callback && window.location.pathname.indexOf("/mail/") === 0) {
            callback("errorAppend", xhr.response);
          }
        }
      }
    };
  },
});

// TODO only in development
window.mailStore = mailStore;
export default mailStore;
