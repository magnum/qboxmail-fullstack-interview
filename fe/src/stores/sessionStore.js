import {store} from "@risingstack/react-easy-state/dist/es.es5.js";
import env from "../env.js";
import {io} from "socket.io-client";

const socketConnect = function () {
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

const socketConnectError = function (msg) {
  sessionStore.isImapReady = false;
  sessionStore.reconnecting = true;
  if (sessionStore.socketCallbacks && sessionStore.socketCallbacks.onConnectError) {
    sessionStore.socketCallbacks.onConnectError(msg);
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

  socketInit(callbacks = {}) {
    console.log("socketInit start");
    if (!sessionStore.socketCallbacks) {
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

    sessionStore.addSocketListeners();

    if (sessionStore.socketCallbacks && sessionStore.socketCallbacks.onSocketInit) {
      sessionStore.socketCallbacks.onSocketInit();
    }
  },

  removeSocketListeners() {
    if (sessionStore.socket) {
      sessionStore.socket.removeListener("connect", socketConnect);
      sessionStore.socket.removeListener("disconnect", socketDisconnect);
      sessionStore.socket.removeListener("connect_error", socketConnectError);
      // sessionStore.socket.removeListener("error", socketError);
      // sessionStore.socket.removeListener("reconnect", socketReconnect);
      // sessionStore.socket.removeListener("reconnect_error", socketReconnectError);
      // sessionStore.socket.removeListener("reconnect_failed", socketReconnectFailed);
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
  },
});

// TODO only in development
window.sessionStore = sessionStore;
export default sessionStore;
