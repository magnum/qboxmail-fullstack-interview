import React, {Component} from "react";

import cx from "classnames";
import _ from "lodash";
import s from "./message.scss";

import tasks from "../../icons/tasks.svg";

import {view} from "@risingstack/react-easy-state/dist/es.es5.js";
class Message extends Component {
  constructor(props) {
    super(props);

    this.state = {};
  }

  componentDidMount() {}

  render() {
    const currentMessage = this.props.currentMessage;

    console.log("currentMessage io", currentMessage.messageId);

    return (
      <div className={s.container}>
        <div className={s.message}>
          <div className={s.header}>
            <div className={s.date}>
              Received on: {new Date(currentMessage.date).toLocaleString()}
            </div>
            <div className={s.from}>From : {currentMessage.from.text}</div>
          </div>

          <div className={s.body} dangerouslySetInnerHTML={{__html: currentMessage.html}} />
        </div>
      </div>
    );
  }
}

export default view(Message);
