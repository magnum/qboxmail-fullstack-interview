import "!style-loader!css-loader!tippy.js/dist/tippy.css";
import "!style-loader!css-loader!./css/variables.css";
import "!style-loader!css-loader!sass-loader!./css/App.scss";
import {withRouter} from "react-router-dom";
import sessionStore from "./stores/sessionStore";
import mailStore from "./stores/mailStore";
import React, {Component} from "react";
import MessagesList from "./mail/components/MessagesList";
import Message from "./mail/components/Message";
import Loader from "./components/Loader";
import {view} from "@risingstack/react-easy-state/dist/es.es5.js";

class AppContainer extends Component {
  constructor(props) {
    super(props);
    this.state = {};
  }

  componentDidMount() {
    sessionStore.socketInit({
      onSocketConnect: () => {
        console.log("socket initialized, asking messages list");

        mailStore.init();

        sessionStore.emit("imap_get_messages_list", {
          folder: "INBOX",
        });
      },
    });
  }

  openMessage = (uid) => {
    mailStore.currentMessage = null;
    mailStore.isLoadingMessage = true;

    sessionStore.emit("imap_get_message", {
      uid: uid,
      folder: mailStore.currentFolder,
    });
  };

  render() {
    return (
      <div>
        <div className="container">
          <img src="/webmail_logo.svg" alt="logo" height={24} />
        </div>

        <div className={"main-container"}>
          <MessagesList
            openMessage={this.openMessage}
            currentFolder={mailStore.currentFolder}
            currentMessage={mailStore.currentMessage}
            location={this.props.location}
            history={this.props.history}
          />

          {mailStore.currentMessage ? (
            <Message currentMessage={mailStore.currentMessage} />
          ) : mailStore.isLoadingMessage ? (
            <div className="message-container">
              <Loader width={32} height={32} />
            </div>
          ) : (
            <div className="message-container">Nessun messaggio selezionato</div>
          )}
        </div>
      </div>
    );
  }
}

export default withRouter(view(AppContainer));
