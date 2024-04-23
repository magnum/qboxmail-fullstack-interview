import React, {Component} from "react";
import {BrowserRouter} from "react-router-dom";
import AppContainer from "./AppContainer";

class App extends Component {
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

console.log(banner);

export default App;
