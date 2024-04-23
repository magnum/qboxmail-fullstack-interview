/* eslint-disable */
import React from "react";
import ReactDOM from "react-dom";
import App from "./App";
import {I18nextProvider} from "react-i18next";
import i18next from "i18next";

import moment from "moment-timezone";
import en from "moment/dist/locale/en-gb";
import it from "moment/dist/locale/it";
import de from "moment/dist/locale/de";
import es from "moment/dist/locale/es";
import fr from "moment/dist/locale/fr";
import el from "moment/dist/locale/el";
import nl from "moment/dist/locale/nl";
import pt from "moment/dist/locale/pt";
import sv from "moment/dist/locale/sv";

moment.defineLocale("en", en._config);
moment.defineLocale("it", it._config);
moment.defineLocale("de", de._config);
moment.defineLocale("es", es._config);
moment.defineLocale("fr", fr._config);
moment.defineLocale("el", el._config);
moment.defineLocale("nl", nl._config);
moment.defineLocale("pt", pt._config);
moment.defineLocale("sv", sv._config);

window.moment = moment;

i18next.init({
  react: {
    useSuspense: false,
  },
  interpolation: {escapeValue: false, skipOnVariables: false},
});

ReactDOM.render(
  <I18nextProvider i18n={i18next}>
    <App />
  </I18nextProvider>,
  document.getElementById("root")
);
