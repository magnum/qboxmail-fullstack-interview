import {store} from "@risingstack/react-easy-state/dist/es.es5.js";
import env from "../env.js";
import {io} from "socket.io-client";
import * as Sentry from "@sentry/browser";

const socketConnect = function () {
  // handle imap heartbeat
  // let heartbeat_counter = 0;
  // sessionStore.tokenRefreshInterval = setInterval(() => {
  //   let token = null;
  //   if (process.env.REACT_APP_MTM === "1") {
  //     token = window.sessionStorage.getItem("token_mtm");
  //   } else {
  //     token = window.localStorage.getItem("token") || window.sessionStorage.getItem("token");
  //   }
  //   sessionStore.token = token;

  //   let saveDraftStuckDate = localStorage.getItem("saveDraftStuck");

  //   sessionStore.emit("heartbeat", {
  //     webmail_version: process.env.QBWEBMAIL_CURRENT_VERSION,
  //     settings_version: sessionStore.settings.ts,
  //     validate_session: heartbeat_counter % 3 === 0 ? true : false,
  //     check_modal_news: heartbeat_counter % 2 === 0 ? true : false,
  //     saveDraftStuck: saveDraftStuckDate ? true : false,
  //   });

  //   if (heartbeat_counter % 60 === 0) {
  //     if (process.env.REACT_APP_MTM === "0") {
  //       newsStore.init();
  //     }
  //   }

  //   if (heartbeat_counter % 3 === 0) {
  //     sessionStore.checkIfUserBlocked();
  //     sessionStore.checkExpiredPassword();
  //   }
  //   heartbeat_counter++;
  // }, 10000);

  if (sessionStore.socketCallbacks && sessionStore.socketCallbacks.onSocketConnect) {
    sessionStore.socketCallbacks.onSocketConnect();
  }
};

const socketDisconnect = function (reason) {
  console.log("Socket disconnected", reason);
  clearInterval(sessionStore.tokenRefreshInterval);
  sessionStore.tokenRefreshInterval = null;
  if (
    reason === "io server disconnect" ||
    reason === "transport close" ||
    reason === "transport error" ||
    reason === "ping timeout" ||
    reason === "io client disconnect"
  ) {
    console.log("Try to reconnect...");
    sessionStore.isImapReady = false;
    sessionStore.reconnecting = true;
    if (sessionStore.socketCallbacks && sessionStore.socketCallbacks.onSocketDisconnect) {
      sessionStore.socketCallbacks.onSocketDisconnect();
    }
  }
};

// const socketError = function (msg) {
//   console.log("ERROR ON SOCKET", msg);
//   sessionStore.isImapReady = false;
//   sessionStore.reconnecting = true;
//   clearInterval(sessionStore.tokenRefreshInterval);
//   sessionStore.tokenRefreshInterval = null;
// };
//
// const socketReconnect = function () {
//   console.log("reconnect -> start imap connection");
//   if (sessionStore.socketCallbacks && sessionStore.socketCallbacks.onSocketReconnect) {
//     sessionStore.socketCallbacks.onSocketReconnect();
//   }
// };
//
// const socketReconnectError = function (msg) {
//   console.log("reconnect_error");
//   sessionStore.isImapReady = false;
//   sessionStore.reconnecting = true;
//   if (sessionStore.socketCallbacks && sessionStore.socketCallbacks.onConnectError) {
//     sessionStore.socketCallbacks.onConnectError(msg);
//   }
// };
//
// const socketReconnectFailed = function (msg) {
//   console.log("reconnect_failed", msg);
//   sessionStore.isImapReady = false;
//   sessionStore.reconnecting = true;
//   if (sessionStore.socketCallbacks && sessionStore.socketCallbacks.onConnectError) {
//     sessionStore.socketCallbacks.onConnectError(msg);
//   }
// };

const socketConnectError = function (msg) {
  console.log("connect_error 22", msg);
  sessionStore.isImapReady = false;
  sessionStore.reconnecting = true;
  if (sessionStore.socketCallbacks && sessionStore.socketCallbacks.onConnectError) {
    console.log("calling onConnectError", sessionStore.socketCallbacks.onConnectError);
    sessionStore.socketCallbacks.onConnectError(msg);
  }
};

const socketForceDisconnect = function () {
  sessionStore.isImapReady = false;
  if (sessionStore.socketCallbacks && sessionStore.socketCallbacks.onForceDisconnect) {
    sessionStore.socketCallbacks.onForceDisconnect();
  }
};

const socketUpdateSettings = function () {
  if (sessionStore.socketCallbacks && sessionStore.socketCallbacks.onUpdateSettings) {
    sessionStore.socketCallbacks.onUpdateSettings();
  }
};

const socketForceUiReload = function () {
  window.location.reload(true);
};

const saveDraftStuckNotification = function () {
  try {
    let saveDraftStuckDate = localStorage.getItem("saveDraftStuck");

    if (saveDraftStuckDate) {
      Sentry.captureMessage(
        "saveDraftStuck -> " + sessionStore.settings.code + " - " + saveDraftStuckDate
      );
      localStorage.removeItem("saveDraftStuck");
    }
  } catch (error) {
    console.log("Error in saveDraftStuck management");
  }
};

const sessionStore = store({
  token: null,
  isSettingsReady: false,
  isDoingLogout: false,
  isUserBlocked: false,

  /*** socket ***/
  socket: null,
  connectionTimeout: null,
  tokenRefreshInterval: null,
  isImapReady: false,
  socketCallbacks: null,
  reconnecting: false,
  username: null,
  newWebmailVersion: null,
  preventWebmailClosure: false,
  settings: {},
  datasets: {},
  limits: {},
  snapshots: process.env.REACT_APP_MTM === "1" ? [] : undefined,
  selectedSnapshot: process.env.REACT_APP_MTM === "1" ? null : undefined,

  emit(msg, data) {
    if (sessionStore.socket && sessionStore.socket.connected) {
      if (data) {
        sessionStore.socket.emit(msg, data);
      } else {
        sessionStore.socket.emit(msg);
      }
    } else {
      console.log("Socket emit - Not Connected");
    }
  },

  reset() {
    sessionStore.removeSocketListeners();
    clearInterval(sessionStore.tokenRefreshInterval);
    sessionStore.tokenRefreshInterval = null;
    sessionStore.token = null;
    sessionStore.isSettingsReady = false;
    sessionStore.isDoingLogout = false;
    sessionStore.socket = null;
    sessionStore.connectionTimeout = null;
    sessionStore.isImapReady = false;
    sessionStore.socketCallbacks = null;
    sessionStore.reconnecting = false;
    sessionStore.username = null;
    sessionStore.preventWebmailClosure = false;
    sessionStore.newWebmailVersion = process.env.QBWEBMAIL_CURRENT_VERSION;
    sessionStore.settings = {};
    sessionStore.datasets = {};
    sessionStore.limits = {};

    if (process.env.REACT_APP_MTM === "1") {
      sessionStore.snapshots = [];
      sessionStore.selectedSnapshot = null;
    }
  },

  init(token, opts = {}, cb) {
    if (!token) {
      console.log("can't init store without token");
      return;
    }
    if (Object.keys(opts).length === 0) {
      console.log("can't init store without data");
      return;
    }

    sessionStore.token = token;
    sessionStore.username = opts.settings.user;
    sessionStore.settings = opts.settings;
    sessionStore.datasets = opts.datasets;
    sessionStore.limits = opts.limits;

    if (process.env.REACT_APP_MTM === "1") {
      sessionStore.snapshots = opts.snapshots;
      sessionStore.selectedSnapshot = opts.selectedSnapshot;
      sessionStore.settings.mail.reading.showThreads = false;
    }

    sessionStore.canUseCalendar =
      (opts.settings && opts.settings.general && opts.settings.general.calendar) || false;
    sessionStore.isSettingsReady = true;
    sessionStore.isDoingLogout = false;
    sessionStore.newWebmailVersion = process.env.QBWEBMAIL_CURRENT_VERSION;

    if (cb) {
      return cb();
    }
  },

  setHTMLLanguage() {
    // Set the correct language on the HTML tag
    const htmlElement = document.querySelector("html");
    const lang = sessionStore.settings.general.language;

    if (lang === "gr") {
      htmlElement.lang = "el";
    } else {
      htmlElement.lang = lang;
    }
  },

  socketInit(callbacks = {}) {
    console.log("socketInit start");
    if (!sessionStore.socketCallbacks) {
      console.log("callbacks loaded");
      sessionStore.socketCallbacks = callbacks;
    } else {
      console.log("callbacks already present");
    }

    sessionStore.socket = null;

    // clear retry connection timeout if present
    clearTimeout(sessionStore.connectionTimeout);
    sessionStore.connectionTimeout = null;

    // clear heartbeat interval
    clearInterval(sessionStore.tokenRefreshInterval);
    sessionStore.tokenRefreshInterval = null;

    // instantiate socket connection
    let environment = process.env.TARGET_ENV || "development";
    if (environment === "development") {
      sessionStore.socket = io(env.be_url, {
        autoconnect: true,
        reconnection: false,
        query: {
          token: "token-placeholder",
        },
      });
    }
    // } else if (environment === "dev_production") {
    //   let base_url = env.be_url.replace(/\/api$/, "");

    //   sessionStore.socket = io(base_url, {
    //     path: "/api/socket.io",
    //     autoconnect: true,
    //     reconnection: false,
    //     query: {
    //       token: sessionStore.token,
    //     },
    //   });
    // } else {
    //   let ar = window.location.href.split("/");
    //   let base_url = ar[0] + "//" + ar[2];
    //   sessionStore.socket = io(base_url, {
    //     path: env.be_url + "/socket.io",
    //     autoconnect: true,
    //     reconnection: false,
    //     query: {
    //       token: sessionStore.token,
    //     },
    //     transports: ["polling", "websocket"],
    //     // forceNew: true,
    //   });
    // }

    console.log("[sessionStore] Socket loaded");
    sessionStore.addSocketListeners();
    console.log("[sessionStore] Socket  loaded2 222");

    if (sessionStore.socketCallbacks && sessionStore.socketCallbacks.onSocketInit) {
      sessionStore.socketCallbacks.onSocketInit();
    }
  },

  removeSocketListeners() {
    if (sessionStore.socket) {
      sessionStore.socket.removeListener("connect", socketConnect);
      sessionStore.socket.removeListener("disconnect", socketDisconnect);
      sessionStore.socket.removeListener("connect_error", socketConnectError);
      //
      // sessionStore.socket.removeListener("error", socketError);
      // sessionStore.socket.removeListener("reconnect", socketReconnect);
      // sessionStore.socket.removeListener("reconnect_error", socketReconnectError);
      // sessionStore.socket.removeListener("reconnect_failed", socketReconnectFailed);
      sessionStore.socket.removeListener("force_disconnect", socketForceDisconnect);
      sessionStore.socket.removeListener("update_settings", socketUpdateSettings);
      sessionStore.socket.removeListener("force_ui_reload", socketForceUiReload);
      sessionStore.socket.removeListener(
        "save_draft_stuck_notification",
        saveDraftStuckNotification
      );
    }
  },

  // Guarantee that event is not added twice
  addNewSocketListener(event, cb) {
    if (!sessionStore.socket) {
      console.log("addNewSocketListener: Socket not present");
      return;
    }
    let socketIOInternalEvents = [
      "connect",
      //"error",
      "disconnect",
      //"reconnect",
      "reconnect_attempt",
      "reconnecting",
      // "reconnect_error",
      // "reconnect_failed",
    ];

    sessionStore.socket._callbacks = sessionStore.socket._callbacks || {};

    let internalKey = `$${event}`;
    if (
      !sessionStore.socket._callbacks[internalKey] ||
      sessionStore.socket._callbacks[internalKey].indexOf(cb) < 0 || // there is already this cb for this event
      socketIOInternalEvents.indexOf(event) >= 0 // if it is one of the internal socket.io events add it anyway
    ) {
      sessionStore.socket.on(event, cb);
    }
  },

  addSocketListeners() {
    sessionStore.addNewSocketListener("connect", socketConnect);
    sessionStore.addNewSocketListener("disconnect", socketDisconnect);
    //sessionStore.addNewSocketListener("error", socketError);
    // sessionStore.addNewSocketListener("reconnect", socketReconnect);
    // sessionStore.addNewSocketListener("reconnect_error", socketReconnectError);
    // sessionStore.addNewSocketListener("reconnect_failed", socketReconnectFailed);
    sessionStore.addNewSocketListener("connect_error", socketConnectError);
    sessionStore.addNewSocketListener("force_disconnect", socketForceDisconnect);
    sessionStore.addNewSocketListener("update_settings", socketUpdateSettings);
    sessionStore.addNewSocketListener("force_ui_reload", socketForceUiReload);
    sessionStore.addNewSocketListener("save_draft_stuck_notification", saveDraftStuckNotification);
  },
});

// TODO only in development
window.sessionStore = sessionStore;
export default sessionStore;
