/* eslint-disable */
import React from "react";
import ReactDOM from "react-dom";
import App from "./App";

import moment from "moment-timezone";
window.moment = moment;

ReactDOM.render(<App />, document.getElementById("root"));
