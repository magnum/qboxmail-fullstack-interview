export default {
  general: {
    avatar:
      "data:image/svg+xml;base64,PHN2ZyBpZD0iTGl2ZWxsb18xIiBkYXRhLW5hbWU9IkxpdmVsbG8gMSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIiB2aWV3Qm94PSIwIDAgMTYwIDE2MCI+CiAgPHRpdGxlPlRhdm9sYSBkaXNlZ25vIDE8L3RpdGxlPgogIDxyZWN0IHdpZHRoPSIxNjAiIGhlaWdodD0iMTYwIiBmaWxsPSIjZWJlYmViIi8+CiAgPHBhdGggZD0iTTU0LjU4LDU1LjQyQTI1LjQyLDI1LjQyLDAsMSwxLDgwLDgwLjg1LDI1LjQyLDI1LjQyLDAsMCwxLDU0LjU4LDU1LjQyWk0xMjQuOTIsMTMwYzAtMjAuNTktMjAuMTEtMzcuMjktNDQuOTItMzcuMjlTMzUuMDgsMTA5LjQxLDM1LjA4LDEzMCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSIjNjY2IiBzdHJva2UtbGluZWNhcD0ic3F1YXJlIiBzdHJva2UtbWl0ZXJsaW1pdD0iMTAiIHN0cm9rZS13aWR0aD0iMyIvPgo8L3N2Zz4K",
    firstName: "",
    lastName: "",
    company: "",
    theme: "light",
    firstLogin: true,
    lastNewsID: -1,
    lastNewsModalTimestamp: null,
    customization: {},
    country: "",
    security: {
      otp: {},
      force_new_password: false,
    },
    notificationEnabled: false,
    integrations: {},
  },
  mail: {
    reading: {
      layout: "1",
      showThreads: true,
      showMessagePriority: false,
      sendReadConfirmation: "ask",
      showImages: "always",
      markReadAfter: "onOpen",
    },
    compose: {
      readConfirmation: "never",
      deliveryNotification: "never",
      cancelSendTimer: "5000",
    },
    labels: [],
    sieveForwards: false,
  },
  addressbook: {
    loginAddressbook: "",
    defaultAddressbook: "",
    contactNameFormat: "firstName",
    orderBy: "firstName",
    addressFormat: "0",
    autoSaveContact: true,
    autoSaveFolder: "personal",
  },
  calendar: {
    view: {
      mainCalendar: "personal",
      view: "month",
      startWeekDay: "monday",
      minutesInterval: "30",
      businessDayStartHour: "09:00",
      businessDayEndHour: "18:00",
      showWeekNumbers: false,
      showBusyOutsideWorkingHours: false,
    },
    events: {
      newEventType: "confidential",
      newEventFreeBusy: "busy",
      alertEvent: "never",
      alertAllDayEvent: "never",
      eventTimeInterval: "15",
      personalMeetingRoom: "",
    },
    holidayCalendars: {},
    labels: [],
    labelsTask: [],
    tasks: {
      emailNotifications: true,
    },
  },
  chat: {},
  meeting: {},
};
