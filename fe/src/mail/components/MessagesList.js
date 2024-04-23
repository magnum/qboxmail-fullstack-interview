import {withRouter} from "react-router-dom";
import sessionStore from "../../stores/sessionStore";
import {translate} from "react-i18next";
import mailStore from "../../stores/mailStore";
import React, {Component} from "react";
import s from "./messagesList.scss";
import _ from "lodash";

import {withTranslation} from "react-i18next";

import "!style-loader!css-loader!react-toastify/dist/ReactToastify.css";
import "!style-loader!css-loader!react-datepicker/dist/react-datepicker.css";

import {view} from "@risingstack/react-easy-state/dist/es.es5.js";

class MessageList extends Component {
  constructor(props) {
    super(props);
    this.messagesList = null;
    this.state = {};
  }

  componentDidMount() {}

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
