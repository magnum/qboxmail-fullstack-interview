import mailStore from "../../stores/mailStore";
import React, {Component} from "react";
import s from "./messagesList.scss";
import {view} from "@risingstack/react-easy-state/dist/es.es5.js";

class MessageList extends Component {
  constructor(props) {
    super(props);
    this.messagesList = null;
    this.state = {};
  }

  render() {
    const {openMessage} = this.props;

    return (
      <div className={s.container}>
        <div className={s.header}>INBOX - {mailStore.messages.size} messaggi</div>

        <div>
          {Array.from(mailStore.messages.values()).map((message) => {
            return (
              <div className={s.message} key={message.uid} onClick={() => openMessage(message.uid)}>
                <div className={s.from}>{message.from.text}</div>
                <div className={s.subject}>{message.subject}</div>
                <div className={s.preview}>{message.preview}</div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }
}

export default view(MessageList);
