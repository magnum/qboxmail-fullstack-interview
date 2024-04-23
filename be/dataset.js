import moment from "moment-timezone";
import langs from "./src/langs/check.js";

const createTZObject = (array) => {
  let initialValue = {};

  for (let el of array) {
    initialValue[el] = el;
  }
  return initialValue;
};

export default {
  version: "0.0.1",
  languages: langs.languages,
  timezones: moment.tz.names(),
  timeFormats: ["12h", "24h"],
  dateFormats: [
    "YYYY/MM/DD",
    "DD/MM/YYYY",
    "DD.MM.YYYY",
    "MM/DD/YYYY",
    "DD MMM YYYY",
    "MMM DD YYYY",
  ],
  themes: ["dark", "light"],
  readConfirmations: ["never", "always"],
  deliveryNotifications: ["never", "always"],
  markReadAfter: ["onOpen", "manually", "5000", "10000", "30000"],
  showImages: ["never", "always", "contacts"],
  sendReadConfirmation: ["never", "always", "ask"],
  filtersMatchTypes: ["allof", "anyof"],
  antispamFilterTypes: ["whitelist_from", "whitelist_to"],
  cancelSendTimer: ["0", "5000", "10000", "20000", "30000"],
  richEditorColors: [
    "#2b2b2b", // basic text color
    "#e45548",
    "#26c6da",
    "#3f51b5",
    "#c0ca33",
    "#f5a623",
    "#ec407a",
    "#ab47bc",
    "#29c369",
  ],
  mailLabels: {
    "#ec407a": {border_color: "#f386aa", light_color: "#facbdb"},
    "#ab47bc": {border_color: "#c57fd0", light_color: "#deb7e5"},
    "#3f51b5": {border_color: "#7280ce", light_color: "#abb4e2"},
    "#26c6da": {border_color: "#67d7e5", light_color: "#a9e8f0"},
    "#c0ca33": {border_color: "#d3db6f", light_color: "#e6eaac"},
    "#29c369": {border_color: "#5cdd91", light_color: "#c5f3d8"},
    "#f5a623": {border_color: "#f8c46c", light_color: "#fce1b5"},
    "#e45548": {border_color: "#ee938b", light_color: "#f8d1cd"},
  },
  mailNewsLabels: {
    news: "#29c369",
    suggestions: "#f5a623",
    fix: "#3f51b5",
    comingSoon: "#ec407a",
    beta: "#26c6da",
  },
  filtersRules: ["Subject", "From", "To", "Cc", "envelope", "body", "currentdate", "size", "other"],
  filtersEnvelopeSubtypes: ["From", "To"],
  filtersStringOperators: ["contains", "notcontains", "is", "notis", "exists", "notexists"],
  filtersDateSubTypes: ["date", "time", "weekday"],
  filtersDateOperators: ["is", "notis", "lt", "gt"],
  filtersDateWeekdays: [
    "monday",
    "tuesday",
    "wednesday",
    "thursday",
    "friday",
    "saturday",
    "sunday",
  ],
  filtersSizeOperators: ["under", "over"],
  filtersSizeMUnits: ["B", "K", "M"],
  filtersActions: [
    "fileinto",
    "fileinto_copy",
    "reject",
    "discard",
    "addflag",
    "setkeyword",
    "redirect",
    "redirect_copy",
    "keep",
    "stop",
  ],
  system_flags: ["\\Deleted", "\\Seen", "\\Draft", "\\Recent", "$NotJunk", "$Junk", "NonJunk"],
  system_folders: ["INBOX", "Drafts", "Sent", "Spam", "Archive", "Trash"],
  denied_folders: ["shared"],
  folders_order: {
    INBOX: 0,
    Drafts: 1,
    Sent: 2,
    Spam: 3,
    Archive: 4,
    Trash: 5,
    shared: 6,
  },
  actionsFlags: ["\\\\Seen", "\\\\Deleted", "\\\\Answered", "\\\\Draft", "\\\\Flagged"],
  selectMail: ["all", "none", "seen", "unseen", "flagged"],
  viewMode: ["viewColumns", "viewHalf", "viewFull"],
  contactNameFormat: ["firstName", "lastName"],
  contactsOrder: ["firstName", "lastName"],
  feedbackAreas: [
    "mailSidebar",
    "mailSearch",
    "messageList",
    "messageView",
    "newMessage",
    "addressbookSidebar",
    "contactList",
    "contactView",
    "settings",
    "other",
  ],
  sogoCalendarShareRules: ["None", "DAndTViewer", "Viewer", "Responder", "Modifier"],
  calendarView: ["year", "month", "week", "workWeek", "day", "listmonth"],
  calendarStartWeekDay: ["saturday", "sunday", "monday"],
  calendarMinutesInterval: ["15", "30", "60"],
  calendarBusinessDayHours: [
    "00:00",
    "01:00",
    "02:00",
    "03:00",
    "04:00",
    "05:00",
    "06:00",
    "07:00",
    "08:00",
    "09:00",
    "10:00",
    "11:00",
    "12:00",
    "13:00",
    "14:00",
    "15:00",
    "16:00",
    "17:00",
    "18:00",
    "19:00",
    "20:00",
    "21:00",
    "22:00",
    "23:00",
  ],
  calendarEventFilterBy: ["allEvents", "nextEvents"],
  calendarEventSearchIn: ["title", "all"],
  calendarNewEventTypes: ["public", "confidential", "private"],
  calendarNewEventFreeBusy: ["busy", "free", "outofoffice", "temporary"],
  calendarNewEventPartecipation: ["ACCEPTED", "DECLINED", "TENTATIVE"],
  calendarNewEventParticipationRoles: [
    "CHAIR",
    "REQ-PARTICIPANT",
    "OPT-PARTICIPANT",
    "NON-PARTICIPANT",
  ],
  calendarNewEventPriority: ["0", "1", "5", "9"],
  newEventAlert: [
    "never",
    "eventHour",
    "-PT5M",
    "-PT10M",
    "-PT15M",
    "-PT30M",
    "-PT1H",
    "-PT2H",
    "-PT12H",
    "-P1D",
    "-P7D",
  ],
  newAllDayEventAlert: ["never", "eventDate", "-PT17H", "-P6DT17H"],
  newEventRepeatDayWeek: ["MO", "TU", "WE", "TH", "FR", "SA", "SU"],
  newEventRepeatFrequency: ["NEVER", "DAILY", "WEEKLY", "MONTHLY", "YEARLY"],
  newEventRepeatMonths: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
  calendarTaskStatus: ["NEEDS-ACTION", "COMPLETED", "PROCESS", "CANCELLED"],
  eventAlarmPostponeTime: ["60", "300", "900", "1800", "3600", "7200", "86400", "604800"],
  eventTimeIntervals: ["5", "10", "15", "20", "30"],
  mailRetention: ["0", "30", "90", "180", "365", "730", "1095", "1460", "1825"],
  setting_sidebar: [
    {
      value: "settings.general",
      label: "general",
      className: "sidebar-item",
      showCheckbox: false,
      icon: "$placeholder-gear$",
      children: [
        {
          value: "settings.general.profile",
          label: "profilo",
          children: [],
          className: "sidebar-item",
          showCheckbox: false,
          icon: "",
        },
        {
          value: "settings.general.security",
          label: "sicurezza",
          children: [],
          className: "sidebar-item",
          showCheckbox: false,
          icon: "",
        },
        {
          value: "settings.general.notifications",
          label: "notifiche",
          children: [],
          className: "sidebar-item",
          showCheckbox: false,
          icon: "",
        },
        {
          value: "settings.general.integrations",
          label: "integrazioni",
          children: [],
          className: "sidebar-item",
          showCheckbox: false,
          icon: "",
        },
        {
          value: "settings.general.parameters",
          label: "parametri",
          children: [],
          className: "sidebar-item",
          showCheckbox: false,
          icon: "",
        },
      ],
    },
    {
      value: "settings.mail",
      label: "mail",
      className: "sidebar-item",
      showCheckbox: false,
      icon: "$placeholder-mail$",
      children: [
        {
          value: "settings.mail.reading",
          label: "lettura",
          children: [],
          className: "sidebar-item",
          showCheckbox: false,
          icon: "",
        },
        {
          value: "settings.mail.folders",
          label: "cartelle",
          children: [],
          className: "sidebar-item",
          showCheckbox: false,
          icon: "",
        },
        {
          value: "settings.mail.compose",
          label: "composizione",
          children: [],
          className: "sidebar-item",
          showCheckbox: false,
          icon: "",
        },
        {
          value: "settings.mail.template",
          label: "template",
          children: [],
          className: "sidebar-item",
          showCheckbox: false,
          icon: "",
        },
        {
          value: "settings.mail.signature",
          label: "firma",
          children: [],
          className: "sidebar-item",
          showCheckbox: false,
          icon: "",
        },
        {
          value: "settings.mail.labels",
          label: "etichette",
          children: [],
          className: "sidebar-item",
          showCheckbox: false,
          icon: "",
        },
        {
          value: "settings.mail.autoresponder",
          label: "autorisponditore",
          children: [],
          className: "sidebar-item",
          showCheckbox: false,
          icon: "",
        },
        {
          value: "settings.mail.forward",
          label: "inoltri",
          children: [],
          className: "sidebar-item",
          showCheckbox: false,
          icon: "",
        },
        {
          value: "settings.mail.antispam",
          label: "white/black list",
          children: [],
          className: "sidebar-item",
          showCheckbox: false,
          icon: "",
        },
        {
          value: "settings.mail.filters",
          label: "filtri",
          children: [],
          className: "sidebar-item",
          showCheckbox: false,
          icon: "",
        },
        // {
        //   value: "settings.mail.accounts",
        //   label: "accounts",
        //   children: [],
        //   className: "sidebar-item",
        //   showCheckbox: false,
        //   icon: ""
        // },
        // {
        //   value: "settings.mail.delegations",
        //   label: "deleghe",
        //   children: [],
        //   className: "sidebar-item",
        //   showCheckbox: false,
        //   icon: ""
        // }
      ],
    },
    {
      value: "settings.addressbook",
      label: "rubrica",
      className: "sidebar-item",
      showCheckbox: false,
      icon: "$placeholder-contacts$",
      children: [
        {
          value: "settings.addressbook.view",
          label: "view",
          children: [],
          className: "sidebar-item",
          showCheckbox: false,
          icon: "",
        },
        {
          value: "settings.addressbook.management",
          label: "management",
          children: [],
          className: "sidebar-item",
          showCheckbox: false,
          icon: "",
        },
      ],
    },
    {
      value: "settings.calendar",
      label: "calendario",
      className: "sidebar-item",
      showCheckbox: false,
      icon: "$placeholder-calendar$",
      children: [
        {
          value: "settings.calendar.view",
          label: "visualizzazione",
          children: [],
          className: "sidebar-item",
          showCheckbox: false,
          icon: "",
        },
        {
          value: "settings.calendar.management",
          label: "gestione",
          children: [],
          className: "sidebar-item",
          showCheckbox: false,
          icon: "",
        },
        {
          value: "settings.calendar.events",
          label: "eventi",
          children: [],
          className: "sidebar-item",
          showCheckbox: false,
          icon: "",
        },
        {
          value: "settings.calendar.invitations",
          label: "inviti",
          children: [],
          className: "sidebar-item",
          showCheckbox: false,
          icon: "",
        },
        {
          value: "settings.calendar.labels",
          label: "etichette",
          children: [],
          className: "sidebar-item",
          showCheckbox: false,
          icon: "",
        },
      ],
    },
    {
      value: "settings.tasks",
      label: "attivita",
      className: "sidebar-item",
      showCheckbox: false,
      icon: "$placeholder-calendar$",
      children: [
        {
          value: "settings.tasks.notifications",
          label: "notifiche",
          children: [],
          className: "sidebar-item",
          showCheckbox: false,
          icon: "",
        },
        {
          value: "settings.tasks.labels",
          label: "etichette",
          children: [],
          className: "sidebar-item",
          showCheckbox: false,
          icon: "",
        },
      ],
    },
    {
      value: "settings.privacy",
      label: "privacy",
      className: "sidebar-item",
      showCheckbox: false,
      icon: "$placeholder-privacy$",
      children: [
        {
          value: "settings.privacy.cookie",
          label: "cookie policy",
          children: [],
          className: "sidebar-item",
          showCheckbox: false,
          icon: "",
        },
        {
          value: "settings.privacy.privacy",
          label: "privacy policy",
          children: [],
          className: "sidebar-item",
          showCheckbox: false,
          icon: "",
        },
      ],
    },
    {
      value: "settings.shortcuts",
      label: "shortcuts",
      children: [],
      className: "sidebar-item",
      showCheckbox: false,
      icon: "$placeholder-shortcuts$",
    },
    // {
    //   value: "settings.chat",
    //   label: "chat",
    //   className: "sidebar-item",
    //   showCheckbox: false,
    //   icon: "",
    //   children: [
    //     {
    //       value: "settings.chat.view",
    //       label: "visualizzazione",
    //       children: [],
    //       className: "sidebar-item",
    //       showCheckbox: false,
    //       icon: ""
    //     }
    //   ]
    // },
    // {
    //   value: "settings.meeting",
    //   label: "meeting",
    //   className: "sidebar-item",
    //   showCheckbox: false,
    //   icon: "",
    //   children: [
    //     {
    //       value: "settings.meeting.view",
    //       label: "visualizzazione",
    //       children: [],
    //       className: "sidebar-item",
    //       showCheckbox: false,
    //       icon: ""
    //     }
    //   ]
    // }
  ],
  countries: [
    "AD",
    "AE",
    "AG",
    "AI",
    "AL",
    "AM",
    "AO",
    "AR",
    "AS",
    "AT",
    "AU",
    "AW",
    "AX",
    "AZ",
    "BA",
    "BB",
    "BD",
    "BE",
    "BF",
    "BG",
    "BH",
    "BI",
    "BJ",
    "BL",
    "BM",
    "BN",
    "BO",
    "BQ",
    "BR",
    "BS",
    "BW",
    "BY",
    "BZ",
    "CA",
    "CC",
    "CD",
    "CF",
    "CG",
    "CH",
    "CL",
    "CM",
    "CN",
    "CO",
    "CR",
    "CU",
    "CV",
    "CW",
    "CX",
    "CY",
    "CZ",
    "DE",
    "DK",
    "DM",
    "DO",
    "EC",
    "EE",
    "ES",
    "ET",
    "FI",
    "FO",
    "FR",
    "GA",
    "GB",
    "GD",
    "GF",
    "GG",
    "GI",
    "GL",
    "GP",
    "GQ",
    "GR",
    "GT",
    "GU",
    "GY",
    "HN",
    "HR",
    "HT",
    "HU",
    "IE",
    "IM",
    "IS",
    "IT",
    "JE",
    "JM",
    "JP",
    "KE",
    "KR",
    "LI",
    "LS",
    "LT",
    "LU",
    "LV",
    "MC",
    "MD",
    "ME",
    "MG",
    "MK",
    "MQ",
    "MT",
    "MW",
    "MX",
    "MZ",
    "NA",
    "NI",
    "NL",
    "NO",
    "NZ",
    "PA",
    "PE",
    "PH",
    "PL",
    "PT",
    "PY",
    "RE",
    "RO",
    "RS",
    "RU",
    "RW",
    "SE",
    "SG",
    "SH",
    "SI",
    "SJ",
    "SK",
    "SM",
    "SO",
    "SS",
    "SV",
    "TG",
    "TO",
    "TR",
    "TZ",
    "UA",
    "UG",
    "US",
    "UY",
    "VA",
    "VE",
    "VN",
    "XK",
    "YT",
    "ZA",
    "ZM",
    "ZW",
  ],
  timeZonelist: createTZObject(moment.tz.names()),
  confirmSVG:
    "data:image/png;base64,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",
  thanksSVG:
    "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAIAAAACACAYAAADDPmHLAAARJElEQVR4Xu1dPWwdxxGe2aN+0tgSyCBxgMQU4lgkYMBUgAQpHJgC0gaWqiARKVGIC1cxlSZAGtNV0kmGiwCxDVImZZeiglRp/Gx3DhJRFZ/k/FBFkBjmkyjHCJ/03rsJ5n6ou729d7t3e+/d+2FhA3p7uzsz387OzM7sIoz/RpoDONLUj4mHMQBGHARjAIwBMOIcGHHyxxpgDIAR58CIk18JDTBzbXeJ5VA/N7U2CvKoEr19BwAzAwlXWfCEdHHYQVA1evsKgCgzwpU/zCCoIr19A4CKGcMMgqrS2xcAdGPGMIKgyvT2HAA6zBgmEFSd3p4CII0ZvO+z0ENjMOoJDLJNMAj09gwA3ZgRWv4mqyXNXdxemCxE03eu3Z8TrvuiQJgmoDl/HJxGgGkbLmoU0Do8sTFmtz4KMUt3ciaEFgVBHgCcvHb/JUHuPAGcsSVoFW9U2syEN7r8NmlXOgDyEFgEBCYAmNnYvQCAK2UKXceeycMjEyH3TQMUISwvCHQAMLN+fx7RvQwAgYq3xU51Pzp2TBFeFZl9aRqgXwR1Y8b06v1jRw91riPgfFo7AniAQDUArBGJLa/dBOzUf3p8pwijdb7tB89KAUA/CMliMBt3E+RyyFm56gngqku0eWdxajOrrzJ/7zXvrAOg1wToCMNT+eBeB4RjcnsWPDhipRcrXGeu3KaXPLQKgF5OvDAziT7sCGf503PHfTVfsb9e8dIaAHo1YRM5pc4J4Gp9YdI7gq7yXy94agUAvZioqaCqOCdTGnqxHRQGQBUZrZoTW/dA4kx98XgtjyD6+U2ZPC4EgDInlpfhaXPqEJ3tt4Wfl6YyNUFuAFRS+H6A54OEpT8kmUZl8DwXAMqYSJHVwd96fr7rfiC7ejpRuKJj9/J727w3BoDtCdhg3qgIP+SVTRkYAcDmwDYEP0orX+aXLVloA8DWgLYEP8rCt6kJtAAwFr5N2Nrtq6hsMgFQdAC75Pq9pe75AxLhs82TIjLqCoAiHdsmMuzPP9J1b8pJHHyoMwjh3bL4kldWqQDI22FZBHK/LPyvHPL8/NiR7qgLv4hNoATAWPhlwrjcvk1llwCAaQflkuP3Pl75Zlw2kWEMACYfmk0pf+teCv/Z9d0zJJydsnME2Ih1yL0OJC6WdTilK8tKAyBV+EQf1henUvP6TOHmjTPRWQXEM0Cw1xbidFkgkI3YskLVuQDAjNP90JTJedrPbjRuJgw+glvNtpjfuXh8L0+fiYjaxu4FJLwSO0MoCQTpgBanbWoCExlW1gic2WisIkAsa4csCn/m/fvT0OmspmYIE+wRiLO2BBOq/bLdVxPh82KopBs4s95YQYTXoqvVpvBPrjdeFQArqiRRhVa5st8SrxfRODPXGq8hwYrct2331VT4XQHQr+0gSN9m1X/wZ0v4/irsXFatei9jCGATAS4kQECw5wKsPGyLqyZA6FZ5VAXhZwKgHyBQ7Pt391tizoTxKtsgbRVyWyL6ECacJU4NT1tFETRuksAtQFHrEDwIjUVvSyF4GtzONBKcAS4+UaSh++PB6/XFyYRGyGvT5Fn54ViZZwG9BEFgJN2Pr/5iBlK3MjC/CghWthcmr0THDL7hC6uezisU1Xdl5CUWEb6WBggJSRtIpxZPl4kB4w9Sunhl5nX3AjCxHbGsHp9u7LecpW6aRWWL6NISAzEAAeIfm4/wfFFNJo8/u9GghG1hkAKnpQG6gcAmAGY3GiwsLtr0/wje2F6cTBFguigYSIAuexGJmn5ehS7Rkm6CaACkJSJYQoTnTQDgSYb/g3z5RTnxBRkApnEFIwAwPfKAVQJAEGS5LLuPUUDtt8VK3lUYGKjzQP7lEYjIAAu3ibtE5BWQIuJmB+AJB+D1GGBKAEFReVQKAEW2AA7jOoCrKYbXXSKxZMun19UCym3TMgiGCgAqDUPU3Qhk6xvbncteGFdteb1RZNXrCjutXdkgGDoAzKzv1hDxxYjaTo3NdwvocOygI8RSWTF9E2DMrjc41PxqGdvB8AHAC9G6WwjwZMySRo7ciRog3CUXnkdyr6Rd7WLbzzYRdqom2GisJYJMFraDoQNAsA3EvQFNCUQDOpqf9LTZTAkgGEoAsFRMfPC0gE5Ppas5mAoEBLDTbIlTebyToQWADwKv1q9rRK6KN3xkYUGpCQC29lvitCkIhhoAISO9QxzXPQNAXhIIAm4RwB5MiLUqXe2SJfjo77ZAMBIAMGHsILW1AYIxAAZJ4oq5FgXBGAADDgDP1lF5B5o2wRgAQwAA3+CVAmA+XZmGYc8BMCT8rhwZ3kHWhFtTnDhmgqAIMcaHQUUGG3/bnQP9AMEYABVDZRoICKhWX5g6bXu6YwDY5qiF/tJBAGv1hUnvdRVbf2MA2OKk5X56BQKrAOCIXesR7JiGMy3zbmi66wUICgHAS4V23QtANB/LteeqGqQtIty8vTj5xtBIpA+ElA2C3ADwMl1cvKxRXbNFJC71Oh2rD7IqbcgyQWAMgFglrQHJVUzSMJh+35sG2cl8tX2sVoGgmGFoBIC06taQO5yGBQj8xFosm+fx78WKPPouhT5PICgwrSWypQqAwAgAqtw2r9oFabn5yNkMjb9AZS3LBZ5ce7/fFifGRmJ+JKWBIO9l2NoAkFO2mYSsok3VZG0XReZn5eB+qQRBzsWlBQDV1WxZwg/Zq6j22dtenDw+uOyvxsxtLS4tAKhWfxvFKd2U69mNBlfMHBgv5IgTg5rJY1P8vLAOHYZpXT7KYycWFwCYVmppAkC6sMGwZm92Y3cTAF8KCci7X9lkfr/7OjCoCaaL3EkkLy6Thck80AJAUQEqMnwv7bfE2qgagwlvqkB9gCybUopD5WSFrHIteXUlv8e/IdIzniHJr3Qi1kCIq6OyLShT3nOCQO7LNN6SSwOYAMB3CTu3EPFbkXgBoGJkl2B5VELHtopEEhogo5ZSXpxaAEgg1sAGmHl39xoK/NmB8LP2HaLN/bZzcRS2h6IgUHpnhga2FgC80mvE6wfo4cOeCXEqS2WfXP/8bYHi5zkMrlLToHLMp7RPioBAtZWU4gWkxKG7CkklfPIvM7mFCGttFDXH5bd8Xb5MaTkRPiba3F6cOlsa5yvUsbJcjOC/Lji/vLN47G3VVBOLMuflU1oagCegGpBDu8Rh4JZzI1TZ3i0anfabIMQL8sRdl967fX7qXMJI5GPldmctVhbuN7okX+BUIblZnUoUBMS1T7xaEIAQrwHiW82HcIsHPHoEnsdOZ1lxH8Ld7YXJxJU4WZPUBgB3JBscsc4J9rodDbvkvnN78asvd5uQKjV6lIJGDAIAvBAKP0t40d9NDPPod0YACCz6TcVKTZ0ra33XpTfvnJ/6RRZBqq3G1K3JGqPqv89sND5BgO/pztP00qtcXoD8EYcgCWAl7dg3bB8I/9d3zk/9RpcgeaspclWc7pg22zGIub8iXszJa/f+IFz6cXaYLvuquyzajDRAtDMvHaztLnkVu4hzIRg8Qy/oFYFubC9Mqe/uSZmZ6rJIU8s2i+iyfo9E+CBPqXeMv1wuhnABXC9YxleP8f++BKC/AmDNBdrSvequG725ASB3+ux7915wXPo4+u/7LXE8z0oYxMMjRbJMIVc2xfOybhTbA4AUK+Dj4vriZOxxJ52V59361XH/GV6yiED/A8BH/rdUcwFrOCFuZMUgdMay2aZIgWfaPOQbxsrIpbAGgGRQwlz9MyOUN2opOGR66GFT2Kq+yijrUtycvrW9MHnKJi0WARB/up3vvakvTJ4wmewza5+fm3BwA1UHBSoQAKw1W+JSnm3GZF66bcsAQdHq36y5WwOAt3qli4tNzqa/vdH4yQTBewJBZE1a+r3QXms4VmbzbiDYa4oz/375+N3MToIGsgbIu632xAjkQWbWG1tSebOWcE6s3/vhYaCaLHwi+hIB3+nwkTEAOIDzhLCUzIotp3BSV1ByOxUI/Cg47T9oOrO6IBgoG8AHQHwb8EjOUNPBBVCfIMKhKCNdotsP284PZPUeuJ+bch191QJGURBEPGN26b5stpxvZm1bqpO+MkLjVreAQAsk3vvhmy7IEWdly12V08Z9uER/v7045SWMpP0pw8aGZ+F5V7jud0HktI6IX4t+QwT/arbFc13fKlBcG1NGWNw6AHwQKK474bMCoBohbAKi96wKEczJ9h4RfVZfnPp6FpODFbIT3Q7KcJOy5pH1+1Nv33/6ySPuPzBi2wSnol+4QBfkYE6w76/Kz+WVsfp57qUAoIshFOMXET+k8XgKBPSg2XKms9Rj2EkibJzD88gSIP9eNLzLNs5RpI9iWiDCfC8tzvtDrqpKPnJR4OWULPpKAUA4aJZP7514RmZguo+HQaMYYx1xotmEvSLp1tH+bIV3T67v/lYg/irsO2oXZAjpLjlivqzAV6kAYMKCVcqPMiUeYJIBYOI2HoBMcj2JHieccr5CGD3Mk2toM7yrBKu0ABJAICj9rYPSARAS5d8l0JkHQn5yZQdA1AA6K9GjZdMz7ZQ3BpUJp6xmmy3nrO724tkyBe7vU61qhZv8GQDEDUSutSTaAnBWelFS3zMApDAk7jEYJJtyfwm1mr2ijJ6DVfrzvu6+96Apvqvrzx8sAsk4DgHvPXLFfxOwU5aqT9tm+gwAKW5gkBv/7HrjZQfhLcm9Uq5+mXiTyqSYPx++AObXM+w3W843DDXKXtRryXtammXYmfzeVwCoXDmd2zHZqj4CxJcqxsLGLsEXAuE1Tjjlu4oOT3TmHeQHqB+XpXnM0cxqDhnJ8zzidD5Ggc9FGUZE/2m2nVkdECi2q1w5fCbC1WnbVwB4+6wiepgWOArbA7h/UkQO//Kw7fxIJYyUgJPRyZrnzx/u1FHg0bjWodtNRcRS9iSOHnJvxl28fKelOkI1adN3APBk0x5VimYchxdSKV/hJvpzfXHq+90IT3m9y+hhyiCo86kMPgZsG8VFVZVv2jP1eTweE8Hqtq0EAPyVnThIekxDl4xjAvqsvpAdOVQCjcD4roJg+/kocWLtz3HNRcFb0x4RHENw59CFZTlb2jTeoSvMPO0qA4DAHuCXwJLPt6dQRkTNZtt5SmcPDrsocmQd9nHy3d3fIeIrmmkLsdmXcaSbR/DhN5UBQDghDhwJRH5iTXnRVNguMMiNc+QUtQ05+mgsE/lvHJuBoHgWbxFhq76tHAC87SCScRwGiojoC0B8giccRhDz7KNycCePOo4arn7uIj1ExCNpwimau29b6NH+KgkAmeDwKpUJcm9Gf8vjRycyjnMcIcsGZYfgfQHi91zniEhz3v7v2QG4xenbj9pOzWSbKlPgct8DAYBw0jMbjVggxSSg42kWvt2UkI9aD/7y1BwovBbjbaSXQu421kABILF/G1QQe4EY1/0gbpGb++L+Y9XuzWg/pmcYVRG+Z8NUaTJZc0kJ6GSuPsWpHqeqPQBHzJnE3n1PpXM9ejE291NfmPTKwQbxb6AA4KlxRbZRtxqBtAwb4+2DD2zQXZUTNkz7qRpIBg4AKecHzNcr2wuTl6IMTr3RXOPUkYEGyIoCAAnnlKXvGv1UTeADbQQeGIPq8wPvkMfPO8Q9AJhXplcBXK0vTC5lCUYOGMntdW9KzRqn378PnAYIGaYbMIox2GDFdgNAnthBvwWdNv7AAsCzB/yAUaJGILFaAR64REsm5dQyAPwn6qnWRmcl79WuVQTBQAMgZGjgl/M9BPJjCp7Q9lvOkmkg5iBLBwCabdgy/b6KwlbNaSgAEBLGBiIngQgBx0A4NRMXb1AEZnueQwUA28wZhf7GABgFKXehcQyAMQBGnAMjTv5YA4wBMOIcGHHyxxpgDIAR58CIkz/WACMOgP8D685qNYVJSS0AAAAASUVORK5CYII=",
  placeholderImage:
    "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP89R8AAvkB+0p/ESEAAAAASUVORK5CYII=",
  defaultAvatar:
    "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHhtbG5zOnhsaW5rPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5L3hsaW5rIiB3aWR0aD0iODAiIGhlaWdodD0iODAiIHZpZXdCb3g9IjAgMCA4MCA4MCI+CiAgPGRlZnM+CiAgICA8cGF0aCBpZD0icGxhY2Vob2xkZXItYSIgZD0iTTMzLjMzMzMzMzMsMzUuNjQ4MTQ4MSBDNDAuOTkyMTE1MywzNS42NDgxNDgxIDQ3LjIyMjIyMjIsMjkuNDE4MDQxIDQ3LjIyMjIyMjIsMjEuNzU5MjU5MyBDNDcuMjIyMjIyMiwxNC4xMDA0Nzc1IDQwLjk5MjExNSw3Ljg3MDM3MDM3IDMzLjMzMzMzMzMsNy44NzAzNzAzNyBDMjUuNjc0NTUxNiw3Ljg3MDM3MDM3IDE5LjQ0NDQ0NDQsMTQuMTAwNDc3NSAxOS40NDQ0NDQ0LDIxLjc1OTI1OTMgQzE5LjQ0NDQ0NDQsMjkuNDE4MDQxIDI1LjY3NDU1MTYsMzUuNjQ4MTQ4MSAzMy4zMzMzMzMzLDM1LjY0ODE0ODEgWiBNMzMuMzMzMzMzMywxMC4xODUxODUyIEMzOS43MTQ4OTc5LDEwLjE4NTE4NTIgNDQuOTA3NDA3NCwxNS4zNzc2OTQ3IDQ0LjkwNzQwNzQsMjEuNzU5MjU5MyBDNDQuOTA3NDA3NCwyOC4xNDA4MjM4IDM5LjcxNDg5NzksMzMuMzMzMzMzMyAzMy4zMzMzMzMzLDMzLjMzMzMzMzMgQzI2Ljk1MTc2ODgsMzMuMzMzMzMzMyAyMS43NTkyNTkzLDI4LjE0MDgyMzggMjEuNzU5MjU5MywyMS43NTkyNTkzIEMyMS43NTkyNTkzLDE1LjM3NzY5NDcgMjYuOTUxNzY4OCwxMC4xODUxODUyIDMzLjMzMzMzMzMsMTAuMTg1MTg1MiBaIE01My4wOTg1NTE0LDQzLjE4MjU5OTEgQzQ4LjQ2MTAxLDQwLjgwMTA5NzcgNDEuMjY2NzczNCwzNy45NjI5NjMgMzMuMzMzMzMzMywzNy45NjI5NjMgQzI1LjM5OTg5MzMsMzcuOTYyOTYzIDE4LjIwNTY1NjcsNDAuODAxMDk3NyAxMy41NjgxMTUzLDQzLjE4MjU5OTEgQzEwLjA1NDA3MjcsNDQuOTg3NjU3NCA3Ljg3MDM3MDM3LDQ4LjU0NjkxMTEgNy44NzAzNzAzNyw1Mi40NzIzNzU5IEw3Ljg3MDM3MDM3LDU0LjE2NjY2NjcgQzcuODcwMzcwMzcsNTYuNzE5OTcwNiA5Ljk0NjY5NjA2LDU4Ljc5NjI5NjMgMTIuNSw1OC43OTYyOTYzIEw1NC4xNjY2NjY3LDU4Ljc5NjI5NjMgQzU2LjcxOTk3MDYsNTguNzk2Mjk2MyA1OC43OTYyOTYzLDU2LjcxOTk3MDYgNTguNzk2Mjk2Myw1NC4xNjY2NjY3IEw1OC43OTYyOTYzLDUyLjQ3MjM3NTkgQzU4Ljc5NjI5NjMsNDguNTQ2OTExMSA1Ni42MTI1OTQsNDQuOTg3NjU3NCA1My4wOTg1NTE0LDQzLjE4MjU5OTEgWiBNNTYuNDgxNDgxNSw1NC4xNjY2NjY3IEM1Ni40ODE0ODE1LDU1LjQ0Mjc1MzUgNTUuNDQyNzUzNSw1Ni40ODE0ODE1IDU0LjE2NjY2NjcsNTYuNDgxNDgxNSBMMTIuNSw1Ni40ODE0ODE1IEMxMS4yMjM5MTMyLDU2LjQ4MTQ4MTUgMTAuMTg1MTg1Miw1NS40NDI3NTM1IDEwLjE4NTE4NTIsNTQuMTY2NjY2NyBMMTAuMTg1MTg1Miw1Mi40NzIzNzU5IEMxMC4xODUxODUyLDQ5LjQxODM1NzYgMTEuODg2MjU3Niw0Ni42NDgwMzk2IDE0LjYyNjA1NzksNDUuMjQxOTcwNCBDMTkuMDM2NDEzMiw0Mi45NzY4ODggMjUuODYyMTc4LDQwLjI3Nzc3NzggMzMuMzMzMzMzMyw0MC4yNzc3Nzc4IEM0MC44MDQ0ODg3LDQwLjI3Nzc3NzggNDcuNjMwMjUzNSw0Mi45NzY4ODggNTIuMDQwNjA4OCw0NS4yNDE5NzA2IEM1NC43ODA0MDksNDYuNjQ4MDM5NiA1Ni40ODE0ODE1LDQ5LjQxODM1NzYgNTYuNDgxNDgxNSw1Mi40NzIzNzU5IEw1Ni40ODE0ODE1LDU0LjE2NjY2NjcgWiIvPgogIDwvZGVmcz4KICA8ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPgogICAgPHJlY3Qgd2lkdGg9IjgwIiBoZWlnaHQ9IjgwIiBmaWxsPSIjQzFDMUMxIi8+CiAgICA8ZyB0cmFuc2Zvcm09InRyYW5zbGF0ZSg2LjY2NyA2LjY2NykiPgogICAgICA8bWFzayBpZD0icGxhY2Vob2xkZXItYiIgZmlsbD0iI2ZmZiI+CiAgICAgICAgPHVzZSB4bGluazpocmVmPSIjcGxhY2Vob2xkZXItYSIvPgogICAgICA8L21hc2s+CiAgICAgIDxnIGZpbGw9IiNFOEU4RTgiIG1hc2s9InVybCgjcGxhY2Vob2xkZXItYikiPgogICAgICAgIDxyZWN0IHdpZHRoPSI2Ny4xNjgiIGhlaWdodD0iNjcuMTY4Ii8+CiAgICAgIDwvZz4KICAgIDwvZz4KICA8L2c+Cjwvc3ZnPgo=",
};
