import React, {Component} from "react";
import s from "./css/pageNotFound.scss";
import {withTranslation} from "react-i18next";
import IllustrationMessage from "./components/IllustrationMessage";
import Button from "./components/Button";

import pageNotFound from "./icons/pageNotFound.svg";
import pageNotFoundSweetmail from "./icons/sweetmail/pageNotFound.svg";

class PageNotFound extends Component {
  goToInbox = () => this.props.history.push({pathname: "/mail"});

  render() {
    const {t} = this.props;

    return (
      <div className={s.container}>
        <IllustrationMessage
          className={s.wrapIllustration}
          img={
            window.location.hostname === "webmail.sweetmail.eu" ||
            window.location.hostname === "mtm.sweetmail.eu"
              ? pageNotFoundSweetmail
              : pageNotFound
          }
          imgSize={"20rem"}
          title={t("pageNotFound.pageNotFound")}
          text={t("pageNotFound.pageNotFound")}
        />

        <Button className={s.btn} theme="accent" onClick={this.goToInbox} t={t}>
          {t("buttons.goToMail")}
        </Button>
      </div>
    );
  }
}

export default withTranslation("qbox")(PageNotFound);
