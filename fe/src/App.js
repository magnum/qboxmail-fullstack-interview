import React, {Component} from "react";
import {BrowserRouter} from "react-router-dom";
import AppContainer from "./AppContainer";
import {withTranslation} from "react-i18next";

class App extends Component {
  constructor(props) {
    super(props);

    this.state = {};
  }

  render() {
    return (
      <BrowserRouter>
        <AppContainer />
      </BrowserRouter>
    );
  }
}

let banner = `
 .d88888b.  888                                               d8b 888
d88P" "Y88b 888                                               Y8P 888
888     888 888                                                   888
888     888 88888b.   .d88b.  888  888 88888b.d88b.   8888b.  888 888
888     888 888 "88b d88""88b \`Y8bd8P' 888 "888 "88b     "88b 888 888
888 Y8b 888 888  888 888  888   X88K   888  888  888 .d888888 888 888
Y88b.Y8b88P 888 d88P Y88..88P .d8""8b. 888  888  888 888  888 888 888
 "Y888888"  88888P"   "Y88P"  888  888 888  888  888 "Y888888 888 888
       Y8b
`;

if (process.env.REACT_APP_DISABLE_LOG === "1") {
  // enable/disable console.log
  if (localStorage.getItem("debug")) {
    let _console = {...console};
    console.log = function (...args) {
      if (localStorage.debug === "time") {
        _console.log(window.moment().format("HH:mm:ss.SSS"), "==>", ...args);
      } else {
        _console.log(...args);
      }
    };
    console.time = function (...args) {
      _console.time(...args);
    };
    console.timeEnd = function (...args) {
      _console.timeEnd(...args);
    };
  } else {
    console.log = function () {
      /* no log in production */
    };
    console.time = function () {
      /* no log in production */
    };
    console.timeEnd = function () {
      /* no log in production */
    };
  }
}
export default withTranslation("qbox")(App);
