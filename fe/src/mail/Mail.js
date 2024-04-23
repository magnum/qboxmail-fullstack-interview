import React, {Component} from "react";
import _ from "lodash";
import * as moment from "moment";
import {withRouter} from "react-router-dom";
import {withTranslation} from "react-i18next";
import env from "../env.js";
import qs from "query-string";
import {AnimatePresence} from "framer-motion";

import {view} from "@risingstack/react-easy-state/dist/es.es5.js";
import mailStore from "../stores/mailStore";
import sessionStore from "../stores/sessionStore";
import uiStore from "../stores/uiStore";

import Sidebar from "../mail/components/Sidebar";
import SearchMail from "../mail/components/SearchMail";
import MessagesList from "../mail/components/MessagesList";
import MessagesListHeader from "../mail/components/MessagesListHeader";
import MessageContainer from "../mail/components/MessageContainer";
// import NewMessagesStack from "../mail/components/NewMessagesStack";
import MessagesSelection from "../mail/components/MessagesSelection";
import ConfirmationModal from "../components/ConfirmationModal";
import TotalMessagesFooter from "./components/TotalMessagesFooter";
import IllustrationMessage from "../components/IllustrationMessage";

import ToastCustom from "../components/ToastCustom";
import {toast} from "react-toastify";

import cx from "classnames";
import s from "./mail.scss";

import SVGInline from "react-svg-inline";
import notSelectedSpam from "../icons/notSelectedSpam.svg";
import notSelectedSpamSweetmail from "../icons/sweetmail/notSelectedSpam.svg";
import notSelectedTrash from "../icons/notSelectedTrash.svg";
import notSelectedTrashSweetmail from "../icons/sweetmail/notSelectedTrash.svg";
import notSelectedMessage from "../icons/notSelectedMessage.svg";
import notSelectedMessageSweetmail from "../icons/sweetmail/notSelectedMessage.svg";
import dragIndicator from "../icons/drag_indicator.svg";

import cleanBrFromParagraphs from "../utils/cleanBrFromParagraphs.js";

import {parse} from "uri-js";

class Mail extends Component {
  constructor(props) {
    super(props);

    // this.newMessagesStack = null;
    this.MessageContainer = null;

    this.state = {
      arrAttachments: [],
      actionFromContextMenu: false,
      childrenContextualMenuOpened: {},
      showSidebar: this.props.showSidebar,
      mustOpenFolder: true,
      showMessageList: true,
      showMessage: !uiStore.isMediaMobile,
      viewHalf:
        sessionStore.isSettingsReady &&
        sessionStore.settings.mail.reading.layout === "2" &&
        !uiStore.ismobiledevice &&
        (uiStore.isMediaMD || uiStore.isMediaLG),
      viewFull:
        sessionStore.isSettingsReady &&
        sessionStore.settings.mail.reading.layout === "3" &&
        !uiStore.ismobiledevice &&
        (uiStore.isMediaMD || uiStore.isMediaLG),
      messageToOpen: 0,
      numMessagesFound: 0,
      restoreRequested: false,
      restoreRequestDenied: false,
      restoreRequestInProgress: false,
      isModalEmptyTrashOpened: false,
      isModalRequestRestoreOpened: false,
    };

    this.arrAttachMessage = [];
    this.arrCustomHeaders = [];
    this.checkThread = true;
    this.openMessagePlaceholderTimer = null;
    this.listenersAdded = false;
  }

  componentWillUnmount() {
    this.cleanSocketListeners();

    window.removeEventListener("resize", this.resetRowSizes);
    mailStore.selectedMessages = {};

    //dismiss toast for pending action for new message compose window
    toast.dismiss();

    //save opened draftSaved
    let msgs = mailStore.openedStack.concat(mailStore.closedStack);

    for (let i in msgs) {
      let m =
        this.newMessagesStack &&
        this.newMessagesStack.modals &&
        this.newMessagesStack.modals[msgs[i]];

      if (m) {
        m.syncStore();
      }
    }

    if (uiStore.isMediaMobile) {
      this.props.updateShowSidebar("mail", false);
    }
  }

  cleanSocketListeners() {
    if (sessionStore.socket) {
      // socket.emit("imap_stop_connection");
      //sessionStore.socket.removeListener("imap_message_list", this.openUpdateThreadToast);
      sessionStore.socket.removeListener("imap_message", this.renderMessage);
      sessionStore.socket.removeListener("imap_message_action", this.renderMessageAction);
      sessionStore.socket.removeListener("imap_selected_messages", this.getSelectedMessages);
      sessionStore.socket.removeListener("imap_empty_trash_answer", this.emptyTrashAnswer);

      // errors
      sessionStore.socket.removeListener("imap_error_get_message", this.getMessageError);

      sessionStore.socket.removeListener("imap_error_idle", this.idleError);

      sessionStore.socket.removeListener("imap_error_toggle_flag", this.toggleFlagError);
      sessionStore.socket.removeListener("imap_error_toggle_keyword", this.toggleKeywordError);
      sessionStore.socket.removeListener("imap_error_toggle_spam", this.toggleSpamError);
      sessionStore.socket.removeListener("imap_error_adding_folder", this.addFolderError);
      sessionStore.socket.removeListener(
        "imap_error_subscribing_folder",
        this.subscribeFolderError
      );
      sessionStore.socket.removeListener(
        "imap_error_unsubscribing_folder",
        this.unsubscribeFolderError
      );
      sessionStore.socket.removeListener("imap_error_renaming_folder", this.renamingFolderError);
      sessionStore.socket.removeListener("imap_error_update_folders", this.updateFoldersError);
      sessionStore.socket.removeListener("imap_error_removing_folder", this.removingFolderError);
      sessionStore.socket.removeListener("imap_error_move_message", this.moveMessageError);
      sessionStore.socket.removeListener("imap_error_remove_message", this.removeMessageError);
      sessionStore.socket.removeListener("imap_error_copy_message", this.messageCopyError);
      sessionStore.socket.removeListener(
        "imap_error_manage_default_folders",
        this.manageDefaultFoldersError
      );

      sessionStore.socket.removeListener(
        "imap_default_folders_created",
        this.defaultFoldersCreated
      );

      sessionStore.socket.removeListener("imap_toggle_flag", this.imapToggleFlag);
      sessionStore.socket.removeListener("imap_toggle_keyword", this.imapToggleKeyword);

      sessionStore.socket.removeListener(
        "imap_error_sending_read_notification",
        this.sendingReadNotificationsError
      );
      sessionStore.socket.removeListener("imap_error_get_message_uids", this.getMessageUidsError);
      sessionStore.socket.removeListener("imap_error_mark_spam_read", this.markSpamReadError);
      sessionStore.socket.removeListener("imap_error_erasing_trash", this.emptyTrashError);

      sessionStore.socket.removeListener("imap_toggle_spam", this.imapToggleSpam);
      sessionStore.socket.removeListener("imap_move_message", this.imapMoveMessage);
      sessionStore.socket.removeListener("imap_remove_message", this.imapRemoveMessage);
      sessionStore.socket.removeListener("imap_copy_message", this.imapCopyMessage);
      sessionStore.socket.removeListener("imap_adding_folder", this.imapAddingFolder);
      sessionStore.socket.removeListener("imap_removing_folder", this.imapRemovingFolder);
      sessionStore.socket.removeListener("imap_renaming_folder", this.imapRenamingFolder);

      sessionStore.socket.removeListener("imap_toggle_subscription", this.imapToggleSubscription);
      sessionStore.socket.removeListener("imap_error_get_messages_list", this.errorGetMessages);

      console.log("mail socket listeners removed");
    }
  }

  componentDidMount = () => {
    // Simulate the native ref function because the translate HOC
    // break the behaviour

    //manage resize

    uiStore.optimizedSearch = true;
    mailStore.selectionMode = false;
    this.newMessagesStack = null;

    if (this.props.firstLogin === true) {
      this.props.history.push({
        pathname: "/wizard",
      });
      return;
    }

    // when user enter from another "app" (calendar, settings, addressBook)
    // socket and messages could be ready on the mount
    if (this.props.isSocketReady && !this.props.waitingMails) {
      this.listenersAdded = true;
      this.addSocketListeners();
    }

    if (
      mailStore.currentFolder &&
      ((process.env.REACT_APP_MTM === "0" &&
        mailStore.folders[mailStore.currentFolder] &&
        !mailStore.folders[mailStore.currentFolder].subscribed) ||
        !mailStore.folders[mailStore.currentFolder])
    ) {
      mailStore.currentQuery = {};
    } else {
      if (mailStore.currentPath !== this.props.history.pathname) {
        if (
          Object.keys(mailStore.currentQuery).length > 0 &&
          Object.keys(this.props.location.search).length === 0
        ) {
          this.props.history.push({
            pathname: mailStore.currentPath,
            search: qs.stringify(mailStore.currentQuery),
          });
        } else {
          this.props.history.push({
            pathname: mailStore.currentPath,
            search: this.props.location.search,
          });
        }
      }
    }

    if (this.props.fromSettings) {
      mailStore.updateFolders();
    }
  };

  getSnapshotBeforeUpdate = (prevProps, prevState) => {
    const {match, isSocketReady, waitingMails} = this.props;
    const socketActivated = !prevProps.isSocketReady && isSocketReady;
    const mailDataReady = isSocketReady && prevProps.waitingMails && !waitingMails;
    let resetSearch = false;

    if (
      (socketActivated ||
        // if user is not logged in, the socket is ready before this component
        // exists, so I check also isMailReady in this case
        mailDataReady) &&
      !this.listenersAdded
    ) {
      this.listenersAdded = true;
      this.addSocketListeners();
    }

    if (mailStore.currentPath !== window.location.pathname) {
      resetSearch = true;
    }

    mailStore.currentPath = window.location.pathname;

    if (
      match.params.folder &&
      mailStore.folders &&
      Object.keys(mailStore.folders).length > 0 &&
      mailStore.currentFolder &&
      mailStore.currentFolder !== "search_all_folders" &&
      ((process.env.REACT_APP_MTM === "0" &&
        mailStore.folders[mailStore.currentFolder] &&
        !mailStore.folders[mailStore.currentFolder].subscribed) ||
        !mailStore.folders[mailStore.currentFolder])
    ) {
      this.props.history.replace({
        pathname: "/mail/" + this.props.match.params.user + "/INBOX",
      });
    }

    // Open the folder in the url when user enter in the app
    if (mailDataReady && decodeURIComponent(match.params.folder) !== mailStore.currentFolder) {
      if (match.params.folder === "search_all_folders" && this.props.location.search.length === 0) {
        this.props.history.replace({
          pathname: "/mail/" + match.params.user + "/INBOX",
        });
      } else {
        if (
          process.env.REACT_APP_MTM === "0" &&
          match.params.folder &&
          mailStore.folders[match.params.folder] &&
          !mailStore.folders[match.params.folder].subscribed
        ) {
          this.props.history.replace({
            pathname: "/mail/" + this.props.match.params.user + "/INBOX",
          });
        } else {
          this.props.history.replace({
            pathname: "/mail/" + match.params.user + "/" + match.params.folder,
            search: resetSearch ? "" : this.props.location.search,
          });
        }
      }
    }

    const hasQueryChanged = prevProps.location.search !== this.props.location.search;
    // Open the right folder when url changes or query is changed
    if (
      (prevProps.match.params.folder !== match.params.folder &&
        decodeURIComponent(match.params.folder) !== mailStore.currentFolder) ||
      hasQueryChanged
    ) {
      this.messagesList?.resetSelection(true);
      if (uiStore.isMediaMobile || uiStore.isMediaSM) {
        this.props.updateShowSidebar("mail", false);
      }
      this.messagesList && this.messagesList.unsetSelectionMode();
      if (this.props.location.search.length === 0) {
        mailStore.currentQuery = {};
        mailStore.openFolder(match.params.folder);
      } else {
        mailStore.currentFolder = decodeURIComponent(match.params.folder);
        const hasMessageOpened = !!this.props.match.params.uid;

        mailStore.search(qs.parse(this.props.location.search), true, false, 0, hasMessageOpened);
      }
    }

    if (
      sessionStore.isSettingsReady &&
      prevState.viewHalf !==
        (sessionStore.settings.mail.reading.layout === "2" &&
          !uiStore.ismobiledevice &&
          (uiStore.isMediaMD || uiStore.isMediaLG))
    ) {
      this.setState({
        viewHalf:
          sessionStore.settings.mail.reading.layout === "2" &&
          !uiStore.ismobiledevice &&
          (uiStore.isMediaMD || uiStore.isMediaLG),
      });
    }

    if (
      sessionStore.isSettingsReady &&
      prevState.viewFull !==
        (sessionStore.settings.mail.reading.layout === "3" &&
          !uiStore.ismobiledevice &&
          (uiStore.isMediaMD || uiStore.isMediaLG))
    ) {
      this.setState({
        viewFull:
          sessionStore.settings.mail.reading.layout === "3" &&
          !uiStore.ismobiledevice &&
          (uiStore.isMediaMD || uiStore.isMediaLG),
      });
    }

    if (this.props.location.search !== prevProps.location.search) {
      this.setState(
        {
          messages: [],
          threaded_uids: {},
        },
        () => {
          //mailStore.currentMessage = {};
          mailStore.selectMessage = null;
        }
      );
    }

    if (
      mailStore.openMailFromTask ||
      (mailDataReady &&
        match.params.uid &&
        (!mailStore.currentMessage ||
          (mailStore.currentMessage &&
            mailStore.currentMessage.uid !== parseInt(match.params.uid, 10))))
    ) {
      let msg = mailStore.messages.get(parseInt(match.params.uid, 10));

      if (msg) {
        mailStore.goToMessage(msg, false);
      } else {
        if (
          match.params.uid &&
          (!mailStore.openMailFromTask || match.params.folder === match.params.folder)
        ) {
          mailStore.openMessageNotInList(parseInt(match.params.uid, 10));
        }
      }

      if (mailStore.openMailFromTask) {
        mailStore.openMailFromTask = false;
      }
    }

    return {}; // needed!
  };

  //function used to check if hide/show sidebar
  calcLayoutAreas = (init) => {
    let showSidebar = false;
    let showMessageList = false;
    let showMessage = false;

    /*
    isMediaMobile: on toggle sidebar (show/hide), on folder click (hide), start as hidden
    isMediaSM: on toggle sidebar (show/hide), on folder click (hide), start as hidden
    idMediaMD: on toggle sidebar (show full/show compact), on folder click (nothing), start as compact
    idMediaLG: on toggle sidebar (show full/show compact), on folder click (nothing), start as full
  */

    if (uiStore.isMediaMobile) {
      //calling this method from didmount (only first time !!!!)
      if (init) {
        showSidebar = false;
        showMessageList = true;
        showMessage = false;
      } else {
        if (this.props.showSidebar) {
          showSidebar = true;
          showMessageList = false;
          showMessage = false;
        } else {
          if (
            !mailStore.selectionMode &&
            mailStore.currentMessage &&
            mailStore.currentMessage.uid
          ) {
            showSidebar = false;
            showMessageList = false;
            showMessage = true;
          } else {
            showSidebar = false;
            showMessageList = true;
            showMessage = false;
          }
        }
      }
    }

    if (uiStore.isMediaSM) {
      //calling this method from didmount (only first time !!!!)

      if (init) {
        showSidebar = true;
        showMessageList = true;
        showMessage = true;
      } else {
        if (
          !mailStore.selectionMode &&
          mailStore.currentMessage &&
          mailStore.currentMessage.hasOwnProperty("uid")
        ) {
          showSidebar = true;
          showMessageList = false;
          showMessage = true;
        } else {
          showSidebar = true;
          showMessageList = true;
          showMessage = true;
        }
      }
    }

    if (uiStore.isMediaMD || uiStore.isMediaLG) {
      //calling this method from didmount (only first time !!!!)
      showSidebar = true;
      showMessageList = true;
      showMessage = true;
    }

    if (
      this.state.viewFull &&
      mailStore.currentMessage &&
      mailStore.currentMessage.hasOwnProperty("uid") &&
      Object.keys(mailStore.selectedMessages).length === 0
    ) {
      showMessageList = false;
      showMessage = true;
    } else if (
      this.state.viewFull &&
      (!mailStore.currentMessage || Object.keys(mailStore.currentMessage).length === 0)
    ) {
      showMessageList = true;
      showMessage = false;
    } else if (
      this.state.viewFull &&
      !uiStore.isMediaMobile &&
      Object.keys(mailStore.selectedMessages).length > 0
    ) {
      showMessageList = true;
      showMessage = false;
    }

    if (
      this.state.showSidebar !== showSidebar ||
      this.state.showMessageList !== showMessageList ||
      this.state.showMessage !== showMessage
    ) {
      this.setState({
        showSidebar: showSidebar,
        showMessageList: showMessageList,
        showMessage: showMessage,
      });
    }
  };

  renderMessageAction = (msg) => {
    let res = msg.msg;

    if (!res) {
      return;
    }

    let action = msg.action;

    let content = "";
    if (res.html && res.html !== false && res.html !== "") {
      content = res.html;
    } else if (res.text && res.text !== false && res.text !== "") {
      content = res.text;
    }

    res.content = content;

    let arrValidFlags = [];

    for (let i = 0; i < res.flags.length; i++) {
      if (sessionStore.datasets.system_flags.indexOf(res.flags[i]) === -1) {
        arrValidFlags.push(res.flags[i]);
      }
    }

    res.validFlags = arrValidFlags;

    // re-replace placeholders with original images
    // if user has not blocked the remote images
    if (res.imagesData && !msg.actionMeta?.blockImages) {
      const placeholderImages = Object.keys(res.imagesData);

      for (let i in placeholderImages) {
        let placeholder = placeholderImages[i];
        if (placeholder.indexOf("_css-img-placeholder-") >= 0) {
          // handle css images
          res.content = res.content.split(placeholder).join(res.imagesData[placeholder]);
        } else {
          // handle images in html tag
          res.content = res.content
            .split(`<span data-img-id="${placeholder}" class="qbox_placeholder"></span>`)
            .join(res.imagesData[placeholder]);
        }
      }
    }

    let arrCRC = [];
    if (typeof res.headers["attachment_crc"] === "string") {
      arrCRC.push(res.headers["attachment_crc"]);
    } else {
      arrCRC = res.headers["attachment_crc"];
    }

    let messageTemplate = {
      imagesData: res.imagesData,
      blockImages: msg.actionMeta?.blockImages,
    };
    // let from =
    //   sessionStore.settings.general.firstName +
    //   " " +
    //   sessionStore.settings.general.lastName +
    //   " <" +
    //   sessionStore.username +
    //   ">";

    let body = "";
    let address = "";
    let name = "";

    // Handle multiple identities
    let defaultIdentity = `${sessionStore.settings.general.firstName} ${sessionStore.settings.general.lastName} <${sessionStore.username}>`;
    let defaultMail = sessionStore.username;

    //check default identity flag in settings
    if (
      sessionStore.settings.mail.compose.defaultSignature &&
      sessionStore.settings.mail.compose.defaultSignature.length > 0 &&
      sessionStore.settings.mail.compose.defaultSignature !== sessionStore.username &&
      sessionStore.settings.mail.compose.identities[
        sessionStore.settings.mail.compose.defaultSignature
      ]
    ) {
      defaultIdentity = `${
        sessionStore.settings.mail.compose.identities[
          sessionStore.settings.mail.compose.defaultSignature
        ].title
      } <${sessionStore.settings.mail.compose.defaultSignature}>`;
      defaultMail = sessionStore.settings.mail.compose.defaultSignature;
    }

    if (
      sessionStore.settings.mail.compose.identities &&
      Object.keys(sessionStore.settings.mail.compose.identities).length > 1 &&
      (action === "answer" ||
        action === "answerToAll" ||
        action === "forward" ||
        action === "thanks" ||
        action === "confirm")
    ) {
      let validIds = Object.keys(sessionStore.settings.mail.compose.identities);

      if (res.to) {
        for (let v in res.to.value) {
          address = res.to.value[v].address;
          if (validIds.includes(address)) {
            name =
              sessionStore.settings.mail.compose.identities &&
              sessionStore.settings.mail.compose.identities[address]
                ? sessionStore.settings.mail.compose.identities[address].title
                : sessionStore.getFullName();
            defaultIdentity = `${name} <${address}>`;
            defaultMail = address;
            break;
          }
        }
      }

      if (res.cc) {
        for (let v in res.cc.value) {
          address = res.cc.value[v].address;
          if (validIds.includes(address)) {
            name =
              sessionStore.settings.mail.compose.identities &&
              sessionStore.settings.mail.compose.identities[address]
                ? sessionStore.settings.mail.compose.identities[address].title
                : sessionStore.getFullName();
            defaultIdentity = `${name} <${address}>`;
            defaultMail = address;
            break;
          }
        }
      }

      if (res.bcc) {
        for (let v in res.bcc.value) {
          address = res.bcc.value[v].address;
          if (validIds.includes(address)) {
            name =
              sessionStore.settings.mail.compose.identities &&
              sessionStore.settings.mail.compose.identities[address]
                ? sessionStore.settings.mail.compose.identities[address].title
                : sessionStore.getFullName();
            defaultIdentity = `${name} <${address}>`;
            defaultMail = address;
            break;
          }
        }
      }
    }

    let re = sessionStore.username;

    const editorBodyStyles = "color:black;font-size:14px";

    // attach or not signature
    let signature = `<div style='${editorBodyStyles}'><br/></div>`;
    const signatureConfig = sessionStore.settings.mail.compose.identities[sessionStore.username];
    const dateFormat = sessionStore.settings.general.dateFormat || "DD/MM/YYYY";
    let sigBody = sessionStore.getIdentitySignature(defaultMail) || "";

    if (!signatureConfig?.onlyNewMessages) {
      signature =
        `<div style='${editorBodyStyles}'><br/></div><div class='signature' style='${editorBodyStyles}'>` +
        sigBody +
        "</div>";
    }

    const blockQuoteStyle =
      "border-left: 2px solid #a8a8a8;margin-left: 0px;padding-left: 10px;margin-top: 0.5rem;";

    switch (action) {
      case "answer":
        body =
          signature +
          "<br/>" +
          moment(res.date).format(dateFormat) +
          ", " +
          moment(res.date).format("HH:mm") +
          " " +
          res["from"].text +
          " " +
          this.props.t("mail.message.wrote") +
          `</div><blockquote style="${blockQuoteStyle}">` +
          cleanBrFromParagraphs(res.content) +
          "</blockquote>";

        let answerTo = [];

        if (!res.headers.hasOwnProperty("reply-to")) {
          if (mailStore.currentFolder === "Sent") {
            answerTo = res["to"].value;
          } else {
            answerTo = res["from"].value;
          }
        } else {
          answerTo = res.headers["reply-to"].value;
        }

        if (!res.subject) {
          res.subject = "";
        }

        messageTemplate = {
          ...messageTemplate,
          from: defaultIdentity,
          to: answerTo,
          cc: [],
          bcc: [],
          //subject: res.subject.indexOf("Re: ") !== -1 ? res.subject : "Re: " + res.subject,
          subject:
            "Re: " + (res.subject ? _.unescape(res.subject.toString().replace(/^Re: /, "")) : ""),
          priority: "normal",
          inReplyTo: res.headers["message-id"],
          objHeadersReply: {
            references: res.headers["references"]
              ? res.headers["references"].concat([res.headers["message-id"]])
              : [res.headers["message-id"]],
          },
          body: body,
          uid: null,
          parent_uid: res.originalData && res.originalData.uid,
          parent_folder: res.originalData && res.originalData.folder,
          current_uid: res.uid,
          parent_flag: "Answered",
          focusPosition: "start",
        };
        break;
      case "answerToAll":
        let answerToAllFrom = [];

        if (!res.headers.hasOwnProperty("reply-to")) {
          if (mailStore.currentFolder === "Sent") {
            answerToAllFrom = res["to"].value;
          } else {
            answerToAllFrom = res["from"].value;
          }
        } else {
          answerToAllFrom = res.headers["reply-to"].value;
        }

        let answerToAllTo = (res["to"] && Array.from(res["to"].value)) || [];
        let answerToAllToArray = [];
        let answerToAllCc = (res["cc"] && Array.from(res["cc"].value)) || [];
        let answerToAllCcArray = [];

        if (answerToAllFrom.length > 0 && answerToAllFrom[0].address !== re) {
          answerToAllToArray.push(answerToAllFrom[0]);
        }

        if (res.to) {
          for (let i in answerToAllTo) {
            let a = _.filter(answerToAllToArray, (o) => {
              return o.address === answerToAllTo[i].address;
            });

            if (a.length === 0 && answerToAllTo[i].address !== re) {
              answerToAllToArray.push(answerToAllTo[i]);
            }
          }
        }

        if (res.cc) {
          for (let i in answerToAllCc) {
            let a = _.filter(answerToAllCcArray, (o) => {
              return o.address === answerToAllCc[i].address;
            });

            if (a.length === 0 && answerToAllCc[i].address !== re) {
              answerToAllCcArray.push(answerToAllCc[i]);
            }
          }
        }

        body =
          signature +
          "<br/>" +
          moment(res.date).format(dateFormat) +
          ", " +
          moment(res.date).format("HH:mm") +
          " " +
          res["from"].text +
          " " +
          this.props.t("mail.message.wrote") +
          `<br/><blockquote style="${blockQuoteStyle}">` +
          cleanBrFromParagraphs(res.content) +
          "</blockquote>";

        if (!res.subject) {
          res.subject = "";
        }

        messageTemplate = {
          ...messageTemplate,
          from: defaultIdentity,
          to: answerToAllToArray,
          cc: answerToAllCcArray,
          bcc: [],
          //subject: res.subject.indexOf("Re: ") !== -1 ? res.subject : "Re: " + res.subject,
          subject:
            "Re: " + (res.subject ? _.unescape(res.subject.toString().replace(/^Re: /, "")) : ""),
          priority: "normal",
          inReplyTo: res.headers["message-id"],
          objHeadersReply: {
            references: res.headers["references"]
              ? res.headers["references"].concat([res.headers["message-id"]])
              : [res.headers["message-id"]],
          },
          body: body,
          uid: null,
          parent_uid: res.originalData && res.originalData.uid,
          parent_folder: res.originalData && res.originalData.folder,
          current_uid: res.uid,
          parent_flag: "Answered",
          focusPosition: "start",
        };
        break;
      case "forward":
        body =
          signature +
          "<br/>---------" +
          this.props.t("mail.message.messageForwarded") +
          " ---------" +
          "<br/><b>" +
          this.props.t("mail.message.subject") +
          " </b> " +
          _.unescape(res.subject) +
          "<br/><b>" +
          this.props.t("mail.message.date") +
          " </b> " +
          moment(res.date).format(dateFormat) +
          ", " +
          moment(res.date).format("HH:mm") +
          "<br/><b>" +
          this.props.t("mail.message.from") +
          " </b>" +
          (res["from"] &&
            res["from"].text &&
            res["from"].text.replace(/</g, "(").replace(/>/g, ")")) +
          "<br/><b>" +
          this.props.t("mail.message.to") +
          " </b> " +
          (res["to"] && res["to"].text && res["to"].text.replace(/</g, "(").replace(/>/g, ")")) +
          (res.cc && res.cc.length > 0
            ? "<br/><b>" + this.props.t("mail.message.cc") + " </b> " + res.cc.text
            : "") +
          "<br/><br/>" +
          cleanBrFromParagraphs(res.content);

        let attachments = [];

        for (let i in res.attachmentsMetaData) {
          if (
            !res.attachmentsMetaData[i].hasOwnProperty("related") ||
            (res.attachmentsMetaData[i].related && res.attachmentsMetaData[i].related === false)
          ) {
            attachments.push(res.attachmentsMetaData[i]);
          } else if (
            res.attachmentsMetaData[i].related &&
            res.attachmentsMetaData[i].contentType &&
            res.attachmentsMetaData[i].contentType.indexOf("image/") < 0
          ) {
            attachments.push(res.attachmentsMetaData[i]);
          }
        }

        messageTemplate = {
          ...messageTemplate,
          from: defaultIdentity,
          to: [],
          cc: [],
          bcc: [],
          subject: "Fwd: " + res.subject,
          priority: "normal",
          body: body,
          uid: null,
          parent_uid: res.originalData && res.originalData.uid,
          parent_folder: res.originalData && res.originalData.folder,
          current_uid: res.uid,
          parent_flag: "$forwarded",
          focusPosition: "start",
          attachmentsArray: attachments,
        };
        break;
      case "thanks":
        let thanksToFrom = [];

        if (!res.headers.hasOwnProperty("reply-to")) {
          thanksToFrom = (res["from"] && Array.from(res["from"].value)) || [];
        } else {
          thanksToFrom = res.headers["reply-to"].value;
        }

        let thanksTo = (res["to"] && Array.from(res["to"].value)) || [];
        let thanksToArray = [];
        let thanksCc = (res["cc"] && Array.from(res["cc"].value)) || [];
        let thanksCcArray = [];

        if (thanksToFrom.length > 0 && thanksToFrom[0].address !== re) {
          thanksToArray.push(thanksToFrom[0]);
        }

        if (res.to) {
          for (let i in thanksTo) {
            let a = _.filter(thanksToArray, (o) => {
              return o.address === thanksTo[i].address;
            });

            if (a.length === 0 && thanksTo[i].address !== re) {
              thanksToArray.push(thanksTo[i]);
            }
          }
        }

        if (res.cc) {
          for (let i in thanksCc) {
            let a = _.filter(thanksCcArray, (o) => {
              return o.address === thanksCc[i].address;
            });

            if (a.length === 0 && thanksCc[i].address !== re) {
              thanksCcArray.push(thanksCc[i]);
            }
          }
        }

        body =
          '<div style="text-align:center;"><img style="display: block; margin-left: auto; margin-right: auto;" src=' +
          sessionStore.datasets.thanksSVG +
          '></div><div style="text-align: center;">' +
          this.props.t("mail.thanksMailLabel") +
          "</div>" +
          signature +
          "<br/>" +
          moment(res.date).format(dateFormat) +
          ", " +
          moment(res.date).format("HH:mm") +
          " " +
          res.from.text +
          " " +
          this.props.t("mail.message.wrote") +
          `<br/><blockquote style="${blockQuoteStyle}">` +
          cleanBrFromParagraphs(res.content) +
          "</blockquote>";

        messageTemplate = {
          ...messageTemplate,
          from: defaultIdentity,
          to: thanksToArray,
          cc: thanksCcArray,
          bcc: [],
          //subject: res.subject.indexOf("Re: ") !== -1 ? res.subject : "Re: " + res.subject,
          subject:
            "Re: " + (res.subject ? _.unescape(res.subject.toString().replace(/^Re: /, "")) : ""),
          priority: "normal",
          body: body,
          uid: null,
          inReplyTo: res.headers["message-id"],
          objHeadersReply: {
            references: res.headers["references"]
              ? res.headers["references"].concat([res.headers["message-id"]])
              : [res.headers["message-id"]],
          },
          parent_uid: res.originalData && res.originalData.uid,
          parent_folder: res.originalData && res.originalData.folder,
          current_uid: res.uid,
          parent_flag: "Answered",
          focusPosition: "start",
        };
        break;
      case "confirm":
        let confirmFrom = [];

        if (!res.headers.hasOwnProperty("reply-to")) {
          confirmFrom = (res["from"] && Array.from(res["from"].value)) || [];
        } else {
          confirmFrom = res.headers["reply-to"].value;
        }

        let confirmTo = (res["to"] && Array.from(res["to"].value)) || [];
        let confirmToArray = [];
        let confirmCc = (res["cc"] && Array.from(res["cc"].value)) || [];
        let confirmCcArray = [];

        if (confirmFrom.length > 0 && confirmFrom[0].address !== re) {
          confirmToArray.push(confirmFrom[0]);
        }

        if (res.to) {
          for (let i in confirmTo) {
            let a = _.filter(confirmToArray, (o) => {
              return o.address === confirmTo[i].address;
            });

            if (a.length === 0 && confirmTo[i].address !== re) {
              confirmToArray.push(confirmTo[i]);
            }
          }
        }

        if (res.cc) {
          for (let i in confirmCc) {
            let a = _.filter(confirmCcArray, (o) => {
              return o.address === confirmCc[i].address;
            });

            if (a.length === 0 && confirmCc[i].address !== re) {
              confirmCcArray.push(confirmCc[i]);
            }
          }
        }

        body =
          '<div style="text-align:center;"><img style="display: block; margin-left: auto; margin-right: auto;" src=' +
          sessionStore.datasets.confirmSVG +
          '></div><div style="text-align: center;">' +
          this.props.t("mail.confirmMailLabel") +
          "</div>" +
          signature +
          "<br/>" +
          moment(res.date).format(dateFormat) +
          ", " +
          moment(res.date).format("HH:mm") +
          " " +
          res.from.text +
          " " +
          this.props.t("mail.message.wrote") +
          `<br/><blockquote style="${blockQuoteStyle}">` +
          cleanBrFromParagraphs(res.content) +
          "</blockquote>";

        messageTemplate = {
          ...messageTemplate,
          from: defaultIdentity,
          to: confirmToArray,
          cc: confirmCcArray,
          bcc: [],
          //subject: res.subject.indexOf("Re: ") !== -1 ? res.subject : "Re: " + res.subject,
          subject:
            "Re: " + (res.subject ? _.unescape(res.subject.toString().replace(/^Re: /, "")) : ""),
          priority: "normal",
          body: body,
          uid: null,
          inReplyTo: res.headers["message-id"],
          objHeadersReply: {
            references: res.headers["references"]
              ? res.headers["references"].concat([res.headers["message-id"]])
              : [res.headers["message-id"]],
          },
          parent_uid: res.originalData && res.originalData.uid,
          parent_folder: res.originalData && res.originalData.folder,
          current_uid: res.uid,
          parent_flag: "Answered",
          focusPosition: "start",
        };
        break;
      case "editAsNew":
        let editAsNewFrom = [];

        if (!res.headers.hasOwnProperty("reply-to")) {
          editAsNewFrom = (res["from"] && Array.from(res["from"].value)) || [];
        } else {
          editAsNewFrom = res.headers["reply-to"].value;
        }

        let editAsNewTo = (res["to"] && Array.from(res["to"].value)) || [];
        let editAsNewToArray = [];
        let editAsNewCc = (res["cc"] && Array.from(res["cc"].value)) || [];
        let editAsNewCcArray = [];

        if (editAsNewFrom.length > 0 && editAsNewFrom[0].address !== re) {
          editAsNewToArray.push(editAsNewFrom[0]);
        }

        if (res.to) {
          for (let i in editAsNewTo) {
            let a = _.filter(editAsNewToArray, (o) => {
              return o.address === editAsNewTo[i].address;
            });

            if (a.length === 0 && editAsNewTo[i].address !== re) {
              editAsNewToArray.push(editAsNewTo[i]);
            }
          }
        }

        if (res.cc) {
          for (let i in editAsNewCc) {
            let a = _.filter(editAsNewCcArray, (o) => {
              return o.address === editAsNewCc[i].address;
            });

            if (a.length === 0 && editAsNewCc[i].address !== re) {
              editAsNewCcArray.push(editAsNewCc[i]);
            }
          }
        }

        body = cleanBrFromParagraphs(res.content) + "<br/>" + signature;

        messageTemplate = {
          ...messageTemplate,
          from: defaultIdentity,
          to: editAsNewToArray,
          cc: editAsNewCcArray,
          bcc: [],
          subject: _.unescape(res.subject),
          priority: "normal",
          body: body,
          uid: null,
          focusPosition: "end",
          attachmentsArray: res.attachmentsMetaData,
        };
        break;
      default:
        console.log("unknown action", action, "!!!");
    }

    let messageAlreadyPresent = false;

    if (messageTemplate.parent_uid) {
      for (let m of mailStore.newMessages.values()) {
        if (m.data && m.data.parent_uid && messageTemplate.parent_uid === m.data.parent_uid) {
          messageAlreadyPresent = true;
        }
      }
    }

    if (Object.keys(messageTemplate).length > 0 && !messageAlreadyPresent) {
      this.loadTemplate(messageTemplate);
    }
  };

  answerMessage = (obj) => {
    if (!sessionStore.socket) {
      console.log("answerMessage: socket not present");
      return false;
    }

    if (obj.uids.length > 1) {
      return;
    }

    console.log("imap_get_messages - answerMessage");

    let objImapConn = {
      uid: obj.uids[0],
      folder: mailStore.currentFolder,
      action: "answer",
      actionMeta: obj.actionMeta,
    };

    sessionStore.emit("imap_get_message", objImapConn);
  };

  answerToAllMessage = (obj) => {
    if (!sessionStore.socket) {
      console.log("answerToAllMessage: socket not present");
      return false;
    }

    if (obj.uids.length > 1) {
      return;
    }

    console.log("imap_get_messages - answerToAllMessage");

    let objImapConn = {
      uid: obj.uids[0],
      folder: mailStore.currentFolder,
      action: "answerToAll",
      actionMeta: obj.actionMeta,
    };

    sessionStore.emit("imap_get_message", objImapConn);
  };

  forwardMessage = (obj) => {
    if (!sessionStore.socket) {
      console.log("forwardMessage: socket not present");
      return false;
    }

    if (obj.uids.length > 1) {
      return;
    }

    console.log("imap_get_messages - forwardMessage");

    let objImapConn = {
      uid: obj.uids[0],
      folder: mailStore.currentFolder,
      action: "forward",
      actionMeta: obj.actionMeta,
    };

    sessionStore.emit("imap_get_message", objImapConn);
  };

  thanksMessage = (obj) => {
    if (!sessionStore.socket) {
      console.log("thanksMessage: socket not present");
      return false;
    }

    if (obj.uids.length > 1) {
      return;
    }

    console.log("imap_get_messages - thanksMessage");

    let objImapConn = {
      uid: obj.uids[0],
      folder: mailStore.currentFolder,
      action: "thanks",
      actionMeta: obj.actionMeta,
    };

    sessionStore.emit("imap_get_message", objImapConn);
  };

  confirmMessage = (obj) => {
    if (!sessionStore.socket) {
      console.log("confirmMessage: socket not present");
      return false;
    }

    if (obj.uids.length > 1) {
      return;
    }

    console.log("imap_get_messages - thanksMessage");

    let objImapConn = {
      uid: obj.uids[0],
      folder: mailStore.currentFolder,
      action: "confirm",
      actionMeta: obj.actionMeta,
    };

    sessionStore.emit("imap_get_message", objImapConn);
  };

  editAsNew = (obj) => {
    if (!sessionStore.socket) {
      console.log("editAsNew: socket not present");
      return false;
    }

    if (obj.uids.length > 1) {
      return;
    }

    console.log("imap_get_messages - editAsNew");

    let objImapConn = {
      uid: obj.uids[0],
      folder: mailStore.currentFolder,
      action: "editAsNew",
    };

    sessionStore.emit("imap_get_message", objImapConn);
  };

  getMessagesSize = (uids, cb = null) => {
    let sizes = {};
    let xhr = new XMLHttpRequest();

    xhr.open("POST", env.be_url + "/imap/get_messages_size", true);
    xhr.setRequestHeader("Content-type", "application/json");
    xhr.setRequestHeader("x-access-token", sessionStore.token);
    xhr.send(
      JSON.stringify({
        uids: uids,
        folder: mailStore.currentFolder,
      })
    );

    xhr.onreadystatechange = () => {
      if (xhr.readyState === 4) {
        if (xhr.status === 200) {
          sizes = JSON.parse(xhr.response);
          return cb(sizes);
        } else {
          if (cb) {
            return cb({});
          }
        }
      }
    };
  };

  sendAsAttachment = (obj) => {
    let arrAttachments = [];
    let arrCRC = [];

    let uids = [];

    for (let i in obj.messages) {
      uids.push(obj.messages[i].uid);
    }

    this.getMessagesSize(uids, (response) => {
      let sizes = response.sizes;
      for (let i in obj.messages) {
        let uid = obj.messages[i].uid;
        let objAttachment = {
          filename: obj.messages[i].subject
            ? obj.messages[i].subject.substring(0, 60) + ".eml"
            : "message.eml", // truncate to 64 chars
          size: sizes[uid],
          contentType: "message/rfc822",
          hash: "eml:" + mailStore.currentFolder + ":" + uid,
          content: null,
          contentDisposition: "attachment",
          contentTransferEncoding: "7BIT",
        };
        arrAttachments.push(objAttachment);
        arrCRC.push("eml:" + mailStore.currentFolder + ":" + obj.messages[i].uid);
      }

      let name =
        sessionStore.settings.mail.compose.identities &&
        sessionStore.settings.mail.compose.identities[sessionStore.username]
          ? sessionStore.settings.mail.compose.identities[sessionStore.username].title
          : sessionStore.getFullName();
      let from = `${name} <${sessionStore.username}>`;

      //check default identity flag in settings
      for (let i in sessionStore.settings.mail.compose.identities) {
        if (
          sessionStore.settings.mail.compose.identities[i] &&
          sessionStore.settings.mail.compose.identities[i].defaultSignature === true
        ) {
          name = sessionStore.settings.mail.compose.identities[i].title;
          from = `${sessionStore.settings.mail.compose.identities[i].title} <${i}>`;
          break;
        }
      }

      // Handle multiple identities
      let defaultMail = sessionStore.username;

      //check default identity flag in settings
      if (
        sessionStore.settings.mail.compose.defaultSignature &&
        sessionStore.settings.mail.compose.defaultSignature.length > 0 &&
        sessionStore.settings.mail.compose.defaultSignature !== sessionStore.username &&
        sessionStore.settings.mail.compose.identities[
          sessionStore.settings.mail.compose.defaultSignature
        ]
      ) {
        defaultMail = sessionStore.settings.mail.compose.defaultSignature;
      }

      const editorBodyStyles = "color:black;font-size:14px";

      // attach or not signature
      let signature = `<div style='${editorBodyStyles}'><br/></div>`;
      let sigBody = sessionStore.getIdentitySignature(defaultMail) || "";

      signature +=
        `<div style='${editorBodyStyles}'><br/></div><div class='signature' style='${editorBodyStyles}'>` +
        sigBody +
        "</div>";

      let messageTemplate = {
        from: from,
        to: [],
        cc: [],
        bcc: [],
        subject: obj.messages && obj.messages.length > 0 ? "Fwd: " + obj.messages[0].subject : "",
        priority: "normal",
        body: signature,
        uid: null,
        parent_uid: obj.messages && obj.messages.length > 0 ? obj.messages[0].uid : undefined,
        parent_folder:
          obj.messages && obj.messages.length > 0 ? mailStore.currentFolder : undefined,
        parent_flag: obj.messages && obj.messages.length > 0 ? "$forwarded" : undefined,
        attachmentsArray: arrAttachments,
        customHeaders: {
          attachment_crc: arrCRC,
        },
        focusPosition: "start",
      };

      this.loadTemplate(messageTemplate);
    });
  };

  // socket listeners
  addSocketListeners(cb = null) {
    if (!this.props.isSocketReady) {
      console.log("SOCKET IS NOT READY");
      this.props.history.push({
        pathname: "/",
        search: this.props.location.search,
      });
      return;
    }

    //duplicate listener for opening update thread toast if needed
    //sessionStore.socket.on("imap_message_list", this.openUpdateThreadToast);
    sessionStore.addNewSocketListener("imap_message", this.renderMessage);
    sessionStore.addNewSocketListener("imap_message_action", this.renderMessageAction);
    sessionStore.addNewSocketListener("imap_selected_messages", this.getSelectedMessages);
    sessionStore.addNewSocketListener("imap_empty_trash_answer", this.emptyTrashAnswer);

    // errors
    sessionStore.addNewSocketListener("imap_error_get_message", this.getMessageError);
    sessionStore.addNewSocketListener("imap_error_idle", this.idleError);

    sessionStore.addNewSocketListener("imap_error_toggle_flag", this.toggleFlagError);
    sessionStore.addNewSocketListener("imap_error_toggle_keyword", this.toggleKeywordError);
    sessionStore.addNewSocketListener("imap_error_toggle_spam", this.toggleSpamError);
    sessionStore.addNewSocketListener("imap_error_adding_folder", this.addFolderError);
    sessionStore.addNewSocketListener("imap_error_subscribing_folder", this.subscribeFolderError);
    sessionStore.addNewSocketListener(
      "imap_error_unsubscribing_folder",
      this.unsubscribeFolderError
    );
    sessionStore.addNewSocketListener("imap_error_renaming_folder", this.renamingFolderError);
    sessionStore.addNewSocketListener("imap_error_update_folders", this.updateFoldersError);
    sessionStore.addNewSocketListener("imap_error_removing_folder", this.removingFolderError);
    sessionStore.addNewSocketListener("imap_error_move_message", this.moveMessageError);
    sessionStore.addNewSocketListener("imap_error_remove_message", this.removeMessageError);
    sessionStore.addNewSocketListener("imap_error_copy_message", this.messageCopyError);
    sessionStore.addNewSocketListener(
      "imap_error_manage_default_folders",
      this.manageDefaultFoldersError
    );
    sessionStore.addNewSocketListener("imap_default_folders_created", this.defaultFoldersCreated);
    sessionStore.addNewSocketListener(
      "imap_error_sending_read_notification",
      this.sendingReadNotificationsError
    );
    sessionStore.addNewSocketListener("imap_error_get_message_uids", this.getMessageUidsError);
    sessionStore.addNewSocketListener("imap_error_mark_spam_read", this.markSpamReadError);
    sessionStore.addNewSocketListener("imap_error_erasing_trash", this.emptyTrashError);

    sessionStore.addNewSocketListener("imap_toggle_flag", this.imapToggleFlag);
    sessionStore.addNewSocketListener("imap_toggle_keyword", this.imapToggleKeyword);
    sessionStore.addNewSocketListener("imap_toggle_spam", this.imapToggleSpam);
    sessionStore.addNewSocketListener("imap_remove_message", this.imapRemoveMessage);
    sessionStore.addNewSocketListener("imap_move_message", this.imapMoveMessage);
    sessionStore.addNewSocketListener("imap_copy_message", this.imapCopyMessage);
    sessionStore.addNewSocketListener("imap_adding_folder", this.imapAddingFolder);
    sessionStore.addNewSocketListener("imap_removing_folder", this.imapRemovingFolder);
    sessionStore.addNewSocketListener("imap_renaming_folder", this.imapRenamingFolder);
    sessionStore.addNewSocketListener("imap_toggle_subscription", this.imapToggleSubscription);
    sessionStore.addNewSocketListener("imap_error_get_messages_list", this.errorGetMessages);

    sessionStore.reconnecting = false;
    if (cb) {
      return cb();
    }
  }

  imapToggleFlag = () => {
    console.log("Flag settato correttamente");
  };

  imapToggleKeyword = () => {
    console.log("Keyword settata correttamente");
  };

  imapToggleSpam = () => {
    console.log("Spam settata correttamente");
  };

  imapMoveMessage = () => {
    console.log("Messaggio spostato con successo");
  };

  imapCopyMessage = () => {
    console.log("Messaggio copiato con successo");
  };

  imapRemoveMessage = (msg) => {
    //remove new message compose window from store when closed and deleted
    if (msg.uids && msg.uids.length > 0 && mailStore.newMessages.size > 0) {
      let keys = Array.from(mailStore.newMessages.keys());
      for (let i in msg.uids) {
        for (let j in keys) {
          let message = mailStore.newMessages.get(keys[j]);
          if (message && message.data.uid === msg.uids[i]) {
            mailStore.newMessages.delete(keys[j]);
            mailStore.openedStack.splice(mailStore.openedStack.indexOf(keys[j]), 1);
            mailStore.closedStack.splice(mailStore.closedStack.indexOf(keys[j]), 1);
          }
        }
        if (mailStore.currentFolder === "Drafts") {
          mailStore.messages.delete(msg.uids[i]);
        }
      }
    }
  };

  imapAddingFolder = () => {
    console.log("Imap folder created successfully");
  };

  imapRemovingFolder = () => {
    console.log("Folder removed successfully");
  };

  imapRenamingFolder = () => {
    console.log("Folder renamed successfully");
  };

  imapToggleSubscription = () => {
    console.log("Subscription changed successfully");
  };

  defaultFoldersCreated = () => {
    console.log("Default imap folders created successfully");
  };

  goToFolder = (str) => {
    if (str !== mailStore.currentFolder) {
      const params = this.props.match.params;
      this.props.history.push({
        search: "",
        pathname: "/mail/" + params.user + "/" + encodeURIComponent(str),
      });
    } else {
      if (uiStore.isMediaMobile || uiStore.isMediaSM) {
        this.props.updateShowSidebar("mail", false);
      }
    }
  };

  filterByLabel = (e) => {
    e.preventDefault();
    e.stopPropagation();

    let label =
      "$qb_" + sessionStore.settings.user_hash + "_" + e.currentTarget.dataset.label_id.toString();

    const params = this.props.match.params;
    this.props.history.push({
      pathname: "/mail/" + params.user + "/search_all_folders", // + params.folder,
      search: qs.stringify({label}),
    });

    this.setState({currentMessage: {}});

    if (uiStore.isMediaMobile || uiStore.isMediaSM) {
      this.props.updateShowSidebar("mail", false);
    }
  };

  // refresh message visualization when there is a new
  // message received in the thread
  updateThreadMessages = (messageUID) => {
    let t = mailStore.threaded_uids;

    _.map(t, (obj, key) => {
      for (let i in obj) {
        if (obj[i].uid === parseInt(messageUID, 10)) {
          mailStore.goToMessage(mailStore.messages.get(parseInt(key, 10)), true);
        }
      }
    });
  };

  renderMessage = (res) => {
    let message = null;

    if (res.from_thread) {
      message = res.msg;
    } else {
      message = res;
    }

    mailStore.renderMessage(message, (messageOpened, useTemplate, template) => {
      if (useTemplate) {
        this.loadTemplate(template);
      } else {
        mailStore.isLoadingMessage = false;
        mailStore.showPlaceholder = false;

        this.setState(
          {
            showMessageList: uiStore.isMediaSM
              ? false
              : uiStore.isMediaMD
              ? true
              : uiStore.isMediaLG && !this.state.viewFull
              ? true
              : false,
            showMessage: true,
          },
          () => {
            // it has opened a draft message

            if (!messageOpened) return;

            if (!res.from_thread) {
              const params = this.props.match.params;
              this.props.history.push({
                pathname: "/mail/" + params.user + "/" + params.folder + "/" + messageOpened.uid,
                search: this.props.location.search,
              });

              mailStore.currentMessage = messageOpened;
            } else {
              let msg = null;
              let i = null;
              let threads = mailStore.threaded_uids[mailStore.currentMessage.uid];

              if (threads && threads.length > 0) {
                for (let index in threads) {
                  if (threads[index].uid === messageOpened.uid) {
                    i = index;
                    msg = {...threads[index], ...messageOpened};
                    break;
                  }
                }

                mailStore.threaded_uids[mailStore.currentMessage.uid][i] = msg;
              }
            }

            if (
              messageOpened.headers &&
              messageOpened.headers.hasOwnProperty("disposition-notification-to") &&
              messageOpened.flags.indexOf("$MDNSent") === -1 &&
              sessionStore.settings &&
              sessionStore.settings.mail &&
              sessionStore.settings.mail.reading
            ) {
              if (sessionStore.settings.mail.reading.sendReadConfirmation === "always") {
                this.MessageContainer.setReadingNotification({uid: messageOpened.uid, send: true});
              } else if (sessionStore.settings.mail.reading.sendReadConfirmation === "never") {
                this.MessageContainer.setReadingNotification({uid: messageOpened.uid, send: false});
              }
            }
          }
        );
      }
    });
  };

  newRestore = () => {
    this.setState({
      isModalRequestRestoreOpened: true,
    });
  };

  newMessage = (contact, fieldToCCBCC = "To") => {
    let name =
      sessionStore.settings.mail.compose.identities &&
      sessionStore.settings.mail.compose.identities[sessionStore.username]
        ? sessionStore.settings.mail.compose.identities[sessionStore.username].title
        : sessionStore.getFullName();
    let from = `${name} <${sessionStore.username}>`;

    //check default identity flag in settings
    for (let i in sessionStore.settings.mail.compose.identities) {
      if (
        sessionStore.settings.mail.compose.identities[i] &&
        sessionStore.settings.mail.compose.identities[i].defaultSignature === true
      ) {
        name = sessionStore.settings.mail.compose.identities[i].title;
        from = `${sessionStore.settings.mail.compose.identities[i].title} <${i}>`;
        break;
      }
    }

    if (contact && contact.length > 0) {
      if (fieldToCCBCC === "To") {
        this.newMessagesStack.addNewMessage({from: from, to: contact});
      }

      if (fieldToCCBCC === "Cc") {
        this.newMessagesStack.addNewMessage({from: from, cc: contact});
      }

      if (fieldToCCBCC === "Bcc") {
        this.newMessagesStack.addNewMessage({from: from, bcc: contact});
      }
    } else {
      this.newMessagesStack.addNewMessage({from: from});
    }
    uiStore.modalStatus.general.tasksModalOpened = false;
    this.props.ResetSendToContact();
  };

  afterOpenModal() {
    // references are now sync'd and can be accessed.
    this.subtitle.style.color = "#f00";
  }

  sendMail = (id) => {
    if (!sessionStore.socket) {
      console.log("sendMail: socket not present");
      return false;
    }

    let msg = _.cloneDeep(mailStore.newMessages.get(id));

    if (!msg || !msg.data) {
      console.log("sendMail: message not present");
      return false;
    }

    // replace placeholders images before send
    if (msg.data.blockImages) {
      const placeholderImages = Object.keys(msg.data.imagesData);

      for (let i in placeholderImages) {
        let placeholder = placeholderImages[i];
        if (placeholder.indexOf("_css-img-placeholder-") >= 0) {
          // handle css images
          msg.data.body = msg.data.body.split(placeholder).join(msg.data.imagesData[placeholder]);
        } else {
          // handle images in html tag
          msg.data.body = msg.data.body
            .split(`<span data-img-id="${placeholder}" class="qbox_placeholder"></span>`)
            .join(msg.data.imagesData[placeholder]);
        }
      }
    }

    if (msg.data.objHeadersReply && msg.data.objHeadersReply.hasOwnProperty("references")) {
      if (msg.data.objHeadersReply.references === undefined) {
        msg.data.objHeadersReply.references = [];
      }

      if (typeof msg.data.objHeadersReply.references === "string") {
        msg.data.objHeadersReply.references = msg.data.objHeadersReply.references.split(" ");
      }

      msg.data.objHeadersReply.references.push(id);
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
      messageid: id,
      inReplyTo: msg.data.inReplyTo,
      headers: {...msg.data.customHeaders, ...msg.data.objHeadersReply},
      attachments: msg.data.attachmentsArray,
      readConfirmation: msg.data.customHeaders.askReadConfirmation,
      deliveryNotification: msg.data.customHeaders.askDeliveryConfirmation,
      plainTextComposition: msg.data.customHeaders.plainTextComposition,
      parent_uid: msg.data.parent_uid,
      parent_folder: msg.data.parent_folder,
      parent_flag: msg.data.parent_flag,
      action: "send",
      notificationFrom: sessionStore.username,
    };

    let m = mailStore.messages.get(parseInt(msg.data.current_uid, 10));
    if (m) {
      if (objMail.parent_flag === "$forwarded") {
        m.flags.push(objMail.parent_flag);
      } else if (objMail.parent_flag === "Answered") {
        m.flags.push("\\Answered");
      }
    }

    let xhr = new XMLHttpRequest();

    xhr.open("POST", env.be_url + "/imap/append_message", true);
    xhr.setRequestHeader("x-access-token", sessionStore.token);

    let fdata = new FormData();
    if (objMail.attachments && objMail.attachments.length > 0) {
      for (let i in objMail.attachments) {
        if (
          objMail.attachments[i].content &&
          !objMail.attachments[i].content.hasOwnProperty("VEVENT") &&
          objMail.attachments[i].hash
        ) {
          fdata.append(
            objMail.attachments[i].hash,
            new Blob([objMail.attachments[i].content], {type: "application/octet-stream"})
          );
        }
        delete objMail.attachments[i].content;
      }
    }

    fdata.append("message", JSON.stringify(objMail));
    xhr.send(fdata);

    xhr.onreadystatechange = () => {
      if (xhr.readyState === 4) {
        let response = JSON.parse(xhr.response);
        if (xhr.status === 200) {
          if (response) {
            response.identifier = id;
          }

          this.appendResponse(response);

          // if (!objMail.uid) {
          //   // force folders update
          //   mailStore.updateFoldersCall();
          // }

          if (mailStore.folders["Drafts"].tot_messages > 0) {
            mailStore.folders["Drafts"].tot_messages -= 1;
          }

          if (mailStore.folders["Drafts"].unseen_messages > 0) {
            mailStore.folders["Drafts"].unseen_messages -= 1;
          }
        } else {
          // error management
          let m =
            this.newMessagesStack &&
            this.newMessagesStack.modals &&
            this.newMessagesStack.modals[id];

          if (m) {
            m.handleError(response.err);
          }
        }
      }
    };

    // contact autosave
    if (sessionStore.settings.addressbook.autoSaveContact) {
      let xhr1 = new XMLHttpRequest();

      xhr1.open("POST", env.be_url + "/contacts/autosavecontact", true);
      xhr1.setRequestHeader("Content-type", "application/json");
      xhr1.setRequestHeader("x-access-token", sessionStore.token);

      xhr1.send(
        JSON.stringify({
          folder: sessionStore.settings.addressbook.autoSaveFolder,
          mails: objMail.to,
        })
      );
    }
  };

  deleteDraft = (uid) => {
    if (!sessionStore.socket) {
      console.log("deleteDraft: socket not present");
      return false;
    }

    if (uid === null || uid === undefined) {
      return;
    }

    let originalData = [{folder: "Drafts", uid: uid}];

    let objMail = {
      uids: originalData,
      folder: "Drafts",
    };
    sessionStore.emit("imap_remove_messages", objMail);
  };

  appendResponse = (msg) => {
    if (!msg) {
      return;
    }

    // update data in composition window
    let m =
      this.newMessagesStack &&
      this.newMessagesStack.modals &&
      this.newMessagesStack.modals[msg.identifier];

    if (m) {
      m.updateDraftContent(msg);
    }
  };

  loadTemplate = (messageTemplate) => {
    this.newMessagesStack.addNewMessage(messageTemplate);
    uiStore.modalStatus.general.tasksModalOpened = false;
  };

  resetActionFromContextMenu = () => {
    this.setState({
      actionFromContextMenu: false,
    });
  };

  onContextualAction = (obj) => {
    switch (obj.action) {
      case "answer":
        this.answerMessage(obj);
        break;
      case "answerToAll":
        this.answerToAllMessage(obj);
        break;
      case "forward":
        this.forwardMessage(obj);
        break;
      case "thanks":
        this.thanksMessage(obj);
        break;
      case "confirm":
        this.confirmMessage(obj);
        break;
      case "editAsNew":
        this.editAsNew(obj);
        break;
      case "sendAsAttachment":
        this.sendAsAttachment(obj);
        break;
      default:
        console.log("Unknown action", obj.action);
    }
    this.messagesList.closeContextualMenu();
  };

  setMessageContainerRef = (el) => {
    this.MessageContainer = el;
  };

  setReadingNotification = (obj) => {
    if (!sessionStore.socket) {
      console.log("setReadingNotification: socket not present");
      return false;
    }

    let currentMessage = mailStore.currentMessage;
    let uid = obj.uid;

    let msg = mailStore.messages.get(uid);

    if (!msg) {
      console.log("setReadingNotification: message not present");
      return false;
    }

    if (!msg.flags) {
      msg.flags = [];
    }

    if (msg.flags.indexOf("$MDNSent") === -1) {
      if (msg.flags && typeof msg.flags === "object") {
        msg.flags.push("$MDNSent");
      } else if (msg.flags && typeof msg.flags === "string") {
        msg.flags = [msg.flags, "$MDNSent"];
      } else {
        msg.flags = ["$MDNSent"];
      }

      if (currentMessage.flags && typeof currentMessage.flags === "object") {
        currentMessage.flags.push("$MDNSent");
      } else if (currentMessage.flags && typeof currentMessage.flags === "string") {
        currentMessage.flags = [currentMessage.flags, "$MDNSent"];
      } else {
        currentMessage.flags = ["$MDNSent"];
      }
    }

    if (obj.send === true) {
      let refs = [];
      let html = "";
      let from =
        sessionStore.settings.general.firstName +
        " " +
        sessionStore.settings.general.lastName +
        " <" +
        sessionStore.username +
        ">";

      html = this.props.t("mail.message.readNotificationResponse");
      html = html.replace("%TO%", currentMessage.to ? currentMessage.to.text : "");
      html = html.replace("%SUBJECT%", currentMessage.subject);
      html = html.replace(
        "%SENDDATE%",
        moment(currentMessage.date).format("L") + " " + moment(currentMessage.date).format("LT")
      );
      html = html.replace("%READDATE%", moment().format("L") + " " + moment().format("LT"));

      refs = currentMessage.headers.references || [];
      if (typeof refs === "object") {
        refs.push(currentMessage.headers["message-id"]);
      } else if (typeof refs === "string") {
        refs = [refs, currentMessage.headers["message-id"]];
      }

      sessionStore.emit("imap_read_notification", {
        uid: uid,
        msg: {
          to: currentMessage.from.text,
          from: from,
          subject:
            this.props.t("mail.message.readNotificationSubjectPrefix") +
            " " +
            currentMessage.subject,
          inReplyTo: currentMessage.headers["message-id"],
          references: refs,
          html: html,
        },
      });
    }
  };

  unSubscribeFromList = (obj) => {
    if (!sessionStore.socket) {
      console.log("unSubscribeFromList: socket not present");
      return false;
    }

    let currentMessage = mailStore.currentMessage;
    let uid = obj.uid;

    let msg = mailStore.messages.get(uid);

    if (!msg) {
      console.log("unSubscribeFromList: message not present");
      return false;
    }

    if (!msg.flags) {
      msg.flags = [];
    }

    if (!currentMessage.flags) {
      currentMessage.flags = [];
    }

    if (msg.flags.indexOf("$ListUnsub") === -1) {
      if (msg.flags && typeof msg.flags === "object") {
        msg.flags.push("$ListUnsub");
      } else if (msg.flags && typeof msg.flags === "string") {
        msg.flags = [msg.flags, "$ListUnsub"];
      } else {
        msg.flags = ["$ListUnsub"];
      }

      if (currentMessage.flags && typeof currentMessage.flags === "object") {
        currentMessage.flags.push("$ListUnsub");
      } else if (currentMessage.flags && typeof currentMessage.flags === "string") {
        currentMessage.flags = [currentMessage.flags, "$ListUnsub"];
      } else {
        currentMessage.flags = ["$ListUnsub"];
      }
    }

    let refs = currentMessage.headers.references || [];

    if (typeof refs === "object") {
      refs.push(currentMessage.headers["message-id"]);
    } else if (typeof refs === "string") {
      refs = [refs, currentMessage.headers["message-id"]];
    }

    let mailTo = parse(currentMessage.headers.list.unsubscribe.mail);
    let queryString = qs.parse(mailTo.query) || {};

    sessionStore.emit("imap_list_unsubscribe", {
      uid: uid,
      msg: {
        to: mailTo.path,
        from: sessionStore.username,
        subject: queryString.subject || "unsubscribe",
        inReplyTo: currentMessage.headers["message-id"],
        references: refs,
        html: "",
      },
    });
  };

  checkChildrenContextualMenu = (child) => {
    const {childrenContextualMenuOpened} = this.state;

    let obj = childrenContextualMenuOpened;
    if (!obj.hasOwnProperty(child)) {
      for (let i in Object.keys(childrenContextualMenuOpened)) {
        let key = Object.keys(childrenContextualMenuOpened)[i];
        if (key === "messageList") {
          if (this.messagesList !== undefined && this.messagesList !== null) {
            this.messagesList.closeContextualMenu();
          }
          delete obj[key];
        } else if (key === "messageContainer") {
          if (this.MessageContainer !== undefined && this.MessageContainer !== null) {
            this.MessageContainer.closeContextualMenuFromParent(false);
          }
          delete obj[key];
        } else if (key === "message") {
          if (this.MessageContainer !== undefined && this.MessageContainer !== null) {
            this.MessageContainer.closeContextualMenuFromParent(true);
          }
          delete obj[key];
        } else if (key === "sidebar") {
          if (this.sidebar !== undefined && this.sidebar !== null) {
            this.sidebar.closeContextualMenu();
          }
          delete obj[key];
        }
      }
    }

    obj[child] = true;

    this.setState({
      childrenContextualMenuOpened: obj,
    });
  };

  getSelectedMessages = (obj) => {
    if (obj) {
      mailStore.selectedMessages = obj;
    }
  };

  closeMessage = () => {
    mailStore.currentMessage = {};

    this.setState(
      {
        showMessage: uiStore.isMediaMobile || this.state.viewFull ? false : true,
        showMessageList: true,
      },
      () => {
        const params = this.props.match.params;

        this.props.history.push({
          pathname: "/mail/" + params.user + "/" + params.folder,
          search: this.props.location.search,
        });
      }
    );
  };

  updateOpenedMessageThread = (obj) => {
    this.setState({
      openedMessageThreads: obj,
    });
  };

  sendMessageTo = (email) => {
    this.newMessage(email);
  };

  openEmptyTrashModal = () => {
    this.setState({
      isModalEmptyTrashOpened: true,
    });
  };

  emptyTrashConfirmation = () => {
    if (!sessionStore.socket) {
      console.log("emptyTrashConfirmation: socket not present");
      return false;
    }

    for (let i in mailStore.folders) {
      if (mailStore.folders[i].fullName === "Trash") {
        mailStore.folders[i].hasChildren = false;
        mailStore.folders[i].hasSubscribedChildren = false;
        mailStore.folders[i].opened = false;
      }
      if (mailStore.folders[i].fullName.indexOf("Trash/") === 0) {
        delete mailStore.folders[i];
      }
    }
    mailStore.folders["Trash"].unseen_messages = 0;
    mailStore.folders["Trash"].tot_messages = 0;

    sessionStore.emit("imap_empty_trash");
    if (mailStore.currentFolder === "Trash") {
      this.setState({
        messages: [],
        threaded_uids: {},
        currentMessage: {},
        isModalEmptyTrashOpened: false,
      });
    } else if (mailStore.currentFolder.indexOf("Trash/") === 0) {
      this.setState(
        {
          isModalEmptyTrashOpened: false,
        },
        () => {
          mailStore.currentQuery = {};
          mailStore.openFolder("Trash");
        }
      );
    } else {
      this.setState({
        isModalEmptyTrashOpened: false,
      });
    }
  };

  closeConfirmationModal = () => {
    this.setState({
      isModalEmptyTrashOpened: false,
      isModalRequestRestoreOpened: false,
      restoreRequested: false,
      restoreRequestDenied: false,
    });
  };

  prepareMailTemplate = (obj) => {
    let template = obj;

    template.from =
      sessionStore.settings.general.firstName +
      " " +
      sessionStore.settings.general.lastName +
      " <" +
      sessionStore.username +
      ">";

    template.priority = "normal";
    template.uid = null;

    if (Object.keys(template).length > 0) {
      this.loadTemplate(template);
    }
  };

  toggleReadMail = () => {
    let uids = Object.keys(mailStore.selectedMessages);
    let originalData = [];

    for (let u of uids) {
      originalData.push(mailStore.selectedMessages[u]);
    }

    mailStore.toggleFlagMessage(originalData, uids, "\\Seen", true);

    mailStore.selectedMessages = {};

    if (this.messagesList) {
      this.messagesList.disableSelectionMode();
      this.messagesList.resetEditMode();
    }
  };

  toggleUnreadMail = () => {
    let uids = Object.keys(mailStore.selectedMessages);
    let originalData = [];

    for (let u of uids) {
      originalData.push(mailStore.selectedMessages[u]);
    }

    mailStore.toggleFlagMessage(originalData, uids, "\\Seen", false);

    mailStore.selectedMessages = {};
    if (this.messagesList) {
      this.messagesList.disableSelectionMode();
      this.messagesList.resetEditMode();
    }
  };

  setStarredFlag = () => {
    let uids = Object.keys(mailStore.selectedMessages);
    let originalData = [];

    for (let u of uids) {
      originalData.push(mailStore.selectedMessages[u]);
    }

    mailStore.toggleFlagMessage(originalData, uids, "\\Flagged", true);

    mailStore.selectedMessages = {};

    if (this.messagesList) {
      this.messagesList.disableSelectionMode();
      this.messagesList.resetEditMode();
    }
  };

  unsetStarredFlag = () => {
    let uids = Object.keys(mailStore.selectedMessages);
    let originalData = [];

    for (let u of uids) {
      originalData.push(mailStore.selectedMessages[u]);
    }

    mailStore.toggleFlagMessage(originalData, uids, "\\Flagged", false);

    mailStore.selectedMessages = {};
    if (this.messagesList) {
      this.messagesList.disableSelectionMode();
      this.messagesList.resetEditMode();
    }
  };

  // delete the selected messages in the
  deleteSelectedMessages = () => {
    let uids = Object.keys(mailStore.selectedMessages);
    let originalData = [];

    for (let u of uids) {
      originalData.push(mailStore.selectedMessages[u]);
    }

    let mustReload = false;
    if (mailStore.currentMessage && uids.indexOf(mailStore.currentMessage.uid) >= 0) {
      mustReload = true;
    }

    mailStore.deleteMessage(qs.parse(this.props.location.search), originalData, uids, false, () => {
      const params = this.props.match.params;
      this.props.history.push({
        pathname: "/mail/" + params.user + "/" + params.folder,
      });
      toast.dismiss();
      toast(<ToastCustom type="success" label={this.props.t("toast.success.delete")} />);
    });

    if (mustReload) {
      const params = this.props.match.params;
      this.props.history.push({
        pathname: "/mail/" + params.user + "/" + params.folder,
      });
    }
    if (this.messagesList) {
      this.messagesList.disableSelectionMode();
      this.messagesList.resetEditMode();
    }
  };

  isReadPresent = () => {
    let selectedMessages = mailStore.selectedMessages;
    let messages = mailStore.messages;

    let isReadPresent = false;

    for (let i in selectedMessages) {
      let message = messages.get(parseInt(i, 10));
      if (message && message.flags && message.flags.indexOf("\\Seen") >= 0) {
        isReadPresent = true;
        break;
      }
    }

    return isReadPresent;
  };

  isStarredPresent = () => {
    let selectedMessages = mailStore.selectedMessages;
    let messages = mailStore.messages;

    let isStarredPresent = true;

    for (let i in selectedMessages) {
      let message = messages.get(parseInt(i, 10));
      if (message && message.flags.indexOf("\\Flagged") === -1) {
        isStarredPresent = false;
        break;
      }
    }

    return isStarredPresent;
  };

  createPersonalFolder = () => {
    this.sidebar.createSubFolder();
  };

  goToFolderSettings = () => {
    this.sidebar.closeContextualMenu();
    this.props.history.push({
      pathname: "/settings/mail/folders",
    });
  };

  goToLabelsSettings = () => {
    this.sidebar.closeContextualMenu();
    this.props.history.push({
      pathname: "/settings/mail/labels",
    });
  };

  updateThread = () => {
    this.updateThreadMessages(mailStore.currentMessage.uid);
    mailStore.messageMustUpdate = false;
    this.showingUpdateThreadToast = false;
  };

  openUpdateThreadToast = (data) => {
    let mustUpdate = false;
    if (sessionStore.settings.mail.reading.showThreads === true) {
      // If there is a thread opened
      if (mailStore.currentMessage) {
        let currentUID = mailStore.currentMessage.uid;
        // If the currently opened message is in the threaded_uids of
        // the new data it means that there is a new message (as parent) in
        // the thread
        for (let u in data.msgsRelated) {
          let mess = data.msgsRelated[u].filter((m) => m.uid === currentUID);

          if (mess.length > 0) {
            // There is a new message, show mustUpdate banner
            mustUpdate = true;
            break;
          }
        }
      }
    }

    if (mustUpdate) {
      this.showingUpdateThreadToast = true;
      toast(
        <ToastCustom
          type="info"
          label={this.props.t("mail.message.newMessageinThread")}
          btnLabel={this.props.t("buttons.update")}
          onClick={this.updateThread}
        />,
        {
          autoClose: false,
        }
      );
    }
  };

  emptyTrashAnswer = () => {
    toast.dismiss();
    toast(<ToastCustom type="success" label={this.props.t("toast.success.delete")} />);
    if (mailStore.currentFolder === "Trash") {
      mailStore.messages = new Map();
    }
  };

  getMessageError = () => {
    toast.dismiss();
    toast(<ToastCustom type="error" label={this.props.t("toast.error.messageNotFound")} />);
    this.goToFolder(mailStore.currentFolder);
  };

  idleError = () => {
    toast.dismiss();
    toast(<ToastCustom type="error" label={this.props.t("toast.error.folderNotPresent")} />);
    this.goToFolder("INBOX");
  };

  toggleFlagError = (res) => {
    console.log("imap_error_toggle_flags", res);
    toast.dismiss();
    toast(<ToastCustom type="error" label={this.props.t("toast.error.requestError")} />);
  };
  toggleKeywordError = (res) => {
    console.log("imap_error_toggle_keyword", res);
    toast.dismiss();
    toast(<ToastCustom type="error" label={this.props.t("toast.error.requestError")} />);
  };
  toggleSpamError = (res) => {
    console.log("imap_error_toggle_spam", res);
    toast.dismiss();
    toast(<ToastCustom type="error" label={this.props.t("toast.error.requestError")} />);
  };
  addFolderError = (res) => {
    console.log("imap_error_adding_folder", res);
    toast.dismiss();
    toast(<ToastCustom type="error" label={this.props.t("toast.error.folderCreation")} />);
  };
  subscribeFolderError = (res) => {
    console.log("imap_error_subscribing_folder", res);
    toast.dismiss();
    toast(<ToastCustom type="error" label={this.props.t("toast.error.folderSubscribe")} />);
  };
  unsubscribeFolderError = (res) => {
    console.log("imap_error_unsubscribing_folder", res);
    toast.dismiss();
    toast(<ToastCustom type="error" label={this.props.t("toast.error.folderSubscribe")} />);
  };
  renamingFolderError = () => {
    toast.dismiss();
    toast(<ToastCustom type="error" label={this.props.t("toast.error.folderRename")} />);
  };
  updateFoldersError = (res) => {
    console.log("imap_error_update_folders", res);
    toast.dismiss();
    toast(<ToastCustom type="error" label={this.props.t("toast.error.updateFolders")} />);
  };
  removingFolderError = (res) => {
    console.log("imap_error_removing_folder", res);
    toast.dismiss();
    toast(<ToastCustom type="error" label={this.props.t("toast.error.folderDelete")} />);
  };
  moveMessageError = (res) => {
    console.log("imap_error_move_message", res);
    toast.dismiss();
    toast(<ToastCustom type="error" label={this.props.t("toast.error.messageMove")} />);
  };
  removeMessageError = (res) => {
    console.log("imap_error_remove_message", res);
    toast.dismiss();
    toast(<ToastCustom type="error" label={this.props.t("toast.error.messageRemove")} />);
  };
  messageCopyError = (res) => {
    console.log("imap_error_copy_message", res);
    toast.dismiss();
    toast(<ToastCustom type="error" label={this.props.t("toast.error.messageCopy")} />);
  };
  manageDefaultFoldersError = (res) => {
    console.log("imap_error_manage_default_folders", res);
    toast.dismiss();
    toast(<ToastCustom type="error" label={this.props.t("toast.error.requestError")} />);
  };
  sendingReadNotificationsError = (res) => {
    console.log("imap_error_sending_read_notification", res);
    toast.dismiss();
    toast(<ToastCustom type="error" label={this.props.t("toast.error.notifications")} />);
  };
  markSpamReadError = (res) => {
    console.log("imap_error_mark_spam_read", res);
    toast.dismiss();
    toast(<ToastCustom type="error" label={this.props.t("toast.error.requestError")} />);
  };
  emptyTrashError = (res) => {
    console.log("imap_error_erasing_trash", res);
    toast.dismiss();
    toast(<ToastCustom type="error" label={this.props.t("toast.error.delete")} />);
  };

  getMessageUidsError = (res) => {
    console.log("imap_error_get_message_uids", res);
    toast.dismiss();
    toast(<ToastCustom type="error" label={this.props.t("toast.error.requestError")} />);
  };

  errorGetMessages = (res) => {
    if (res.unavailable) {
      mailStore.messagesLoading = false;
      mailStore.messages = new Map();
      mailStore.currentMessage = {};
      uiStore.optimizedSearch = true;
      uiStore.searchNotAvailable = true;
      toast(<ToastCustom type="error" label={this.props.t("toast.error.searchNotAvailable")} />);
      if (!mailStore.areMailMessagesLoaded) {
        this.goToFolder("INBOX");
      }
    } else if (res.limited) {
      uiStore.optimizedSearch = false;

      if (mailStore.currentFolder === "search_all_folders") {
        mailStore.currentFolder = mailStore.oldCurrentfolder || "INBOX";
        mailStore.oldCurrentfolder = undefined;

        if (
          Object.keys(mailStore.currentQuery).length > 0 &&
          Object.keys(this.props.location.search).length === 0
        ) {
          this.props.history.push({
            search: qs.stringify(mailStore.currentQuery),
            pathname:
              "/mail/" +
              this.props.match.params.user +
              "/" +
              encodeURIComponent(mailStore.currentFolder),
          });
          mailStore.refreshMessages({...mailStore.currentQuery, limited: true}, false);
        } else {
          this.props.history.push({
            search: this.props.location.search,
            pathname:
              "/mail/" +
              this.props.match.params.user +
              "/" +
              encodeURIComponent(mailStore.currentFolder),
          });
          mailStore.refreshMessages(
            {...qs.parse(this.props.location.search), limited: true},
            false
          );
        }
      } else {
        mailStore.refreshMessages({...qs.parse(this.props.location.search), limited: true}, false);
      }
    } else {
      console.log("Error getting messages");
      mailStore.messagesLoading = false;
    }
  };

  requestRestoreConfirmation = () => {
    this.setState(
      {
        restoreRequestInProgress: true,
      },
      () => {
        mailStore.requestRestore({requestDate: sessionStore.selectedSnapshot}, (err) => {
          if (err) {
            if (err.err === "already_pending_restore") {
              return this.setState({
                restoreRequestDenied: true,
                restoreRequestInProgress: false,
              });
            }

            toast.dismiss();
            toast(<ToastCustom type="error" label={this.props.t("toast.error.requestError")} />);

            this.setState({
              isModalRequestRestoreOpened: false,
              restoreRequestInProgress: false,
              restoreRequestDenied: true,
            });
          } else {
            this.setState({
              restoreRequested: true,
              restoreRequestInProgress: false,
              restoreRequestDenied: false,
            });
          }
        });
      }
    );
  };

  startDrag = () => {
    this.isDragging = true;
    this.setCursor("ns-resize");
  };

  onDrag = (event) => {
    if (this.isDragging) {
      let mailContainer = document.getElementById("mailContainer");
      let messageList = document.getElementById("messageList");
      let messageListColHeight = this.isDragging ? event.clientY - 48 : messageList.clientHeight;
      let dragbarHeight = 8;

      if (messageListColHeight < 192) {
        messageListColHeight = 192;
      }

      if (messageListColHeight > mailContainer.clientHeight - 260) {
        messageListColHeight = mailContainer.clientHeight - 260;
      }

      let rows = [
        (messageListColHeight / 16).toString() + "rem",
        "0.5rem",
        ((mailContainer.clientHeight - dragbarHeight - messageListColHeight - 24) / 16).toString() +
          "rem",
        "1.5rem",
      ];

      let newRowDefn = rows.join(" ");
      mailContainer.style.gridTemplateRows = newRowDefn;

      event.preventDefault();
    }
  };

  endDrag = () => {
    this.isDragging = false;
    this.setCursor("auto");
  };

  resetRowSizes = () => {
    // when page resizes return to default col sizes
    if (sessionStore?.settings?.mail?.reading?.layout === "2" && !uiStore.isMediaMobile) {
      let page = document.getElementById("mailContainer");
      page.style.gridTemplateRows = "20rem 0.5rem 1fr 1.5rem";
    }
  };

  setCursor = (cursor) => {
    let page = document.getElementById("mailContainer");
    page.style.cursor = cursor;
  };

  render() {
    const {
      showSidebar,
      showMessageList,
      showMessage,
      viewHalf,
      viewFull,
      isModalEmptyTrashOpened,
      isModalRequestRestoreOpened,
      restoreRequested,
      restoreRequestInProgress,
      restoreRequestDenied,
    } = this.state;
    const {compactSidebar, t, history, location, onCreateTask} = this.props;

    const showMessagesSelection =
      !uiStore.isMediaMobile && Object.keys(mailStore.selectedMessages).length > 0;
    const settings = sessionStore.settings;
    const limits = sessionStore.limits;

    if (!sessionStore.isSettingsReady) {
      return <div />;
    }

    let selectionMode =
      mailStore.selectedMessages && Object.keys(mailStore.selectedMessages).length > 0;

    let showFooter = false;

    if (viewHalf) {
      showFooter = true;
    } else if (viewFull) {
      if (
        !mailStore.currentMessage ||
        !mailStore.currentMessage.content ||
        mailStore.currentMessage.content.length === 0
      ) {
        showFooter = true;
      }
    } else if (!viewFull && !viewHalf) {
      showFooter = true;
    }

    this.calcLayoutAreas(false);

    let formatString =
      sessionStore.settings.general.language === "it" ? "DD/MM/YYYY" : "MM/DD/YYYY";

    return (
      <div
        className={cx(s.mailContainer, {
          [s.viewHalf]: viewHalf,
          [s.viewFull]: viewFull,
          [s.isMobileiOS]: uiStore.isIOS && uiStore.isMediaMobile,
          [s.ismobiledevice]: uiStore.ismobiledevice,
          [s.compactSidebar]: compactSidebar,
          [s.hideSidebar]: !showSidebar,
          [s.hideMessageList]: !showMessageList,
          [s.hideMessage]: !showMessage,
          [s.homeBarSafeArea]: uiStore.isIPhoneX && uiStore.isApp,
        })}
        onresize={this.resetColumnSizes}
        id="mailContainer"
        onMouseUp={this.endDrag}
        onMouseMove={this.onDrag}
      >
        <AnimatePresence>
          {isModalEmptyTrashOpened && (
            <ConfirmationModal
              title={t("mail.emptyTrashTitle")}
              description={t("mail.emptyTrashDsc")}
              buttons={[
                {
                  label: this.props.t("buttons.cancel"),
                  theme: "text",
                  onClick: this.closeConfirmationModal,
                },
                {
                  label: this.props.t("buttons.empty"),
                  theme: "red",
                  onClick: this.emptyTrashConfirmation,
                },
              ]}
              type="DeleteConfirmation"
              t={t}
            />
          )}
        </AnimatePresence>

        <AnimatePresence>
          {isModalRequestRestoreOpened && (
            <ConfirmationModal
              title={
                restoreRequestDenied
                  ? t("mail.restoreRequest.deniedTitle")
                  : restoreRequested
                  ? t("mail.restoreRequest.titleRestoreRequested")
                  : t("mail.restoreRequest.title")
              }
              description={
                restoreRequestDenied
                  ? t("mail.restoreRequest.restoreRequestDenied")
                  : restoreRequested
                  ? t("mail.restoreRequest.restoreRequested")
                  : t("mail.restoreRequest.desc", {
                      username: sessionStore.username,
                      restore_date: moment(sessionStore.selectedSnapshot).format(formatString),
                    })
              }
              buttons={_.compact([
                !restoreRequested &&
                  !restoreRequestDenied && {
                    label: this.props.t("buttons.cancel"),
                    theme: "text",
                    onClick: this.closeConfirmationModal,
                  },
                !restoreRequested &&
                  !restoreRequestDenied && {
                    label: this.props.t("buttons.confirm"),
                    theme: "green",
                    loading: restoreRequestInProgress,
                    onClick: this.requestRestoreConfirmation,
                  },
                (restoreRequested || restoreRequestDenied) && {
                  label: this.props.t("buttons.close"),
                  theme: "text",
                  onClick: this.closeConfirmationModal,
                },
              ])}
              type="default"
              t={t}
            />
          )}
        </AnimatePresence>

        <div className={s.sidebar}>
          <Sidebar
            ref={(el) => (this.sidebar = el ? el.handler.ref.current : null)} // this is needed because Sidebar is wrapped in <DropZone />
            newMessage={this.newMessage}
            newRestore={this.newRestore}
            goToFolder={this.goToFolder}
            filterByLabel={this.filterByLabel}
            goToFolderSettings={this.goToFolderSettings}
            goToLabelsSettings={this.goToLabelsSettings}
            checkChildrenContextualMenu={this.checkChildrenContextualMenu}
            openEmptyTrashModal={this.openEmptyTrashModal}
            t={this.props.t}
            compact={compactSidebar}
            toggleSidebar={this.props.toggleSidebar}
            updateSettings={this.props.updateSettings}
            location={this.props.location}
          />
        </div>

        {/* settings.mail.reading.layout = "1" */}

        {/*updatingSettings && (
          <div className={s.componentLoader}>
            <LoaderFullscreen message="Loading" desc="Your messages are coming, please wait!" />
          </div>
        )*/}

        <div
          className={cx(s.messageList, {
            [s.isSearching]: uiStore.isMediaMobile,
          })}
        >
          {!uiStore.isMediaMobile && (
            <MessagesListHeader t={t} location={location} viewHalf={viewHalf} viewFull={viewFull} />
          )}

          {uiStore.isMediaMobile && uiStore.searchMode && (
            <SearchMail className={s.searchMail} t={t} />
          )}

          <MessagesList
            currentFolder={mailStore.currentFolder}
            currentMessage={mailStore.currentMessage}
            lastMsgIndex={mailStore.lastSelectedMessageIndex}
            location={this.props.location}
            history={this.props.history}
            ref={(el) => (this.messagesList = el)}
            t={t}
            onContextualAction={this.onContextualAction}
            match={this.props.match}
            checkChildrenContextualMenu={this.checkChildrenContextualMenu}
            updateOpenedMessageThread={this.updateOpenedMessageThread}
            newMessagesStack={this.newMessagesStack}
            emptyTrash={this.openEmptyTrashModal}
            showMessageList={showMessageList}
            id={"messageList"}
          />
        </div>
        {settings.mail.reading.layout === "2" && !uiStore.isMediaMobile && (
          <div id="dragbar" className={s.dragbar} onMouseDown={this.startDrag}>
            <SVGInline svg={dragIndicator} className={s.icon} height="0.5rem" width="0.5rem" />
          </div>
        )}
        <div className={s.message}>
          {showMessagesSelection && (
            <MessagesSelection
              t={t}
              match={this.props.match}
              history={this.props.history}
              location={this.props.location}
            />
          )}

          {!showMessagesSelection &&
            mailStore.currentMessage &&
            mailStore.currentMessage.hasOwnProperty("content") && (
              <MessageContainer
                addressBooksList={this.props.addressBooksList}
                onAnswer={this.answerMessage}
                onAnswerToAll={this.answerToAllMessage}
                onForward={this.forwardMessage}
                onConfirm={this.confirmMessage}
                onThanks={this.thanksMessage}
                onSendAsAttachment={this.sendAsAttachment}
                onEditAsNew={this.editAsNew}
                onCreateTask={onCreateTask}
                actionFromContextMenu={this.state.actionFromContextMenu}
                resetActionFromContextMenu={this.resetActionFromContextMenu}
                t={t}
                match={this.props.match}
                setReadingNotification={this.setReadingNotification}
                unSubscribeFromList={this.unSubscribeFromList}
                ref={this.setMessageContainerRef}
                checkChildrenContextualMenu={this.checkChildrenContextualMenu}
                closeMessage={this.closeMessage}
                history={this.props.history}
                sendMessageTo={this.sendMessageTo}
                onMailToClick={this.prepareMailTemplate}
                compactSidebar={compactSidebar}
                location={this.props.location}
                currentMessage={mailStore.currentMessage}
                id={"messageContainer"}
              />
            )}

          {mailStore.messages &&
            !showMessagesSelection &&
            !viewFull &&
            (!mailStore.currentMessage || !mailStore.currentMessage.hasOwnProperty("content")) && (
              <div className={s.messageInfoContainer}>
                {mailStore.messages.size > 0 && (
                  <IllustrationMessage
                    img={
                      window.location.hostname === "webmail.sweetmail.eu" ||
                      window.location.hostname === "mtm.sweetmail.eu"
                        ? mailStore.currentFolder === "Spam"
                          ? notSelectedSpamSweetmail
                          : mailStore.currentFolder === "Trash"
                          ? notSelectedTrashSweetmail
                          : notSelectedMessageSweetmail
                        : mailStore.currentFolder === "Spam"
                        ? notSelectedSpam
                        : mailStore.currentFolder === "Trash"
                        ? notSelectedTrash
                        : notSelectedMessage
                    }
                    title={
                      mailStore.currentFolder === "Spam"
                        ? t("mail.message.spamNotSelected")
                        : mailStore.currentFolder === "Trash"
                        ? t("mail.message.trashNotSelected")
                        : t("mail.message.notSelected")
                    }
                    text={
                      mailStore.currentFolder === "INBOX"
                        ? t("mail.message.inboxSelectedInfo")
                        : mailStore.currentFolder === "Drafts"
                        ? t("mail.message.draftsSelectedInfo")
                        : mailStore.currentFolder === "Sent"
                        ? t("mail.message.sentSelectedInfo")
                        : mailStore.currentFolder === "Spam"
                        ? t("mail.message.spamSelectedInfo")
                        : mailStore.currentFolder === "Trash"
                        ? t("mail.message.trashSelectedInfo")
                        : t("mail.message.folderSelectedInfo")
                    }
                  />
                )}
              </div>
            )}
        </div>

        {showFooter && !uiStore.isMediaMobile && (
          <div
            className={cx(s.listFooter, {
              [s.isSelectMode]: !uiStore.searchMode && uiStore.isMediaMobile && selectionMode,
              [s.isSearch]: uiStore.searchMode || this.props.history.location.search,
            })}
          >
            {!selectionMode && (
              <TotalMessagesFooter
                className={cx(s.totalFooter, {
                  [s.totalFooterMTM]: process.env.REACT_APP_MTM === "1",
                })}
                t={t}
                search={this.props.history.location.search}
              />
            )}
          </div>
        )}
      </div>
    );
  }
}

export default withTranslation("qbox")(withRouter(view(Mail)));
