import italian from "../italian";
import english from "../english";
import _ from "lodash";

export default (key, language, subs = {}) => {
  if (!language) {
    language = store.getState().ui.language;
  }

  const langs = {
    it: italian,
    en: english
  };

  var t = langs[language][key];

  if (!t) return "missing translation";

  if (Object.keys(subs).length > 0) {
    _.each(subs, (sub, key) => {
      t = t.replace(`{${key}}`, sub);
    });
  }

  return t;
};
