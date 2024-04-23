/*********************************************************************************************************
 * English Copyright (C) 2017-2019 by Qboxmail Srl
 *
 * All rights reserved. No part of this publication may be reproduced, distributed, or transmitted in any
 * form or by any means, including photocopying, recording, or other electronic or mechanical
 * methods, without the prior written permission of the publisher, except in the case of brief quotations
 * embodied in critical reviews and certain other noncommercial uses permitted by copyright law. For
 * permission requests, write to the publisher at the address below.
 *
 * Qboxmail Srl - IT02338120971
 * https://www.qboxmail.it - info@qboxmail.it
 *
 * Italiano Copyright (C) 2017-2019 by Qboxmail Srl
 *
 * Tutti i diritti riservati. Nessuna parte di questa pubblicazione può essere riprodotta, memorizzata in
 * sistemi di recupero o trasmessa in qualsiasi forma o attraverso qualsiasi mezzo elettronico, meccanico,
 * mediante fotocopiatura, registrazione o altro, senza l'autorizzazione del possessore del copyright salvo
 * nel caso di brevi citazioni a scopo critico o altri usi non commerciali consentiti dal copyright. Per le
 * richieste di autorizzazione, scrivere all'editore al seguente indirizzo.
 *
 * Qboxmail Srl - IT02338120971
 * https://www.qboxmail.it - info@qboxmail.it
 *********************************************************************************************************/
import de from "./de.js";
import en from "./en.js";
import es from "./es.js";
import fr from "./fr.js";
import gr from "./gr.js";
import it from "./it.js";
import nl from "./nl.js";
import pt from "./pt.js";
import sv from "./sv.js";

const data = {
  de: de,
  en: en,
  es: es,
  fr: fr,
  gr: gr,
  it: it,
  nl: nl,
  pt: pt,
  sv: sv,
};

function objectDeepKeys(obj) {
  return Object.keys(obj)
    .filter((key) => obj[key] instanceof Object)
    .map((key) => objectDeepKeys(obj[key]).map((k) => `${key}.${k}`))
    .reduce((x, y) => x.concat(y), Object.keys(obj));
}

function check() {
  let master = objectDeepKeys(data.en);
  for (let l in data) {
    if (l === "en") continue;
    let translations = objectDeepKeys(data[l]);
    for (let t in master) {
      if (translations.indexOf(master[t]) < 0) {
        console.log(l.toUpperCase() + " => " + master[t]);
      }
    }
    for (let t in translations) {
      if (master.indexOf(translations[t]) < 0) {
        console.log(l.toUpperCase() + " <= " + translations[t]);
      }
    }
  }
}

export default {
  get_language: function (lang) {
    return data[lang];
  },
  languages: Object.keys(data),
};

check();
