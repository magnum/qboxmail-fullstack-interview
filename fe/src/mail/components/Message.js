import React, {Component} from "react";
import s from "./message.scss";
import {view} from "@risingstack/react-easy-state/dist/es.es5.js";

class Message extends Component {
  render() {
    const currentMessage = this.props.currentMessage;
    // remove script tags and css tags
    const purgedHtml = currentMessage.html
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
      .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, "");

    return (
      <div className={s.container}>
        <div className={s.message}>
          <div className={s.header}>
            <div className={s.date}>
              Ricevuto il: {new Date(currentMessage.date).toLocaleString()}
            </div>
            <div className={s.from}>From : {currentMessage.from.text}</div>
          </div>

          <div className={s.body} dangerouslySetInnerHTML={{__html: purgedHtml}} />
        </div>
      </div>
    );
  }
}

export default view(Message);
