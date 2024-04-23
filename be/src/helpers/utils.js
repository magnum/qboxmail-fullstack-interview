"use strict";

let m = {};

m.formatByteSize = function (bytes) {
  if (bytes < 1024) return bytes + " bytes";
  else if (bytes < 1048576) return (bytes / 1024).toFixed(3) + " KiB";
  else if (bytes < 1073741824) return (bytes / 1048576).toFixed(3) + " MiB";
  else return (bytes / 1073741824).toFixed(3) + " GiB";
};

m.unpackFrom = function (from) {
  let result = from;
  let text = from.text;

  if (
    from &&
    from.value &&
    from.value.length > 0 &&
    (!from.value[0].name || !from.value[0].address)
  ) {
    text = text.replace(/</g, "").replace(/>/g, "");
    let last_space_index = null;
    for (let i = 0; i < text.length; i++) {
      if (text[i] === " ") {
        last_space_index = i;
      }
    }
    if (last_space_index) {
      result.value[0].name = text.substr(0, last_space_index);
      let address = text.substr(last_space_index + 1, text.length);
      if (address.indexOf("@") > 0) {
        result.value[0].address = address;
      } else {
        result.value[0].address = "";
      }
    } else {
      if (text.indexOf("@") > 0) {
        result.value[0].address = text;
        result.value[0].name = "";
      } else {
        result.value[0].address = "";
        result.value[0].name = text;
      }
    }
  }
  return result;
};

m.memorySizeOf = function (obj) {
  var bytes = 0;

  function sizeOf(obj) {
    if (obj !== null && obj !== undefined) {
      switch (typeof obj) {
        case "number":
          bytes += 8;
          break;
        case "string":
          bytes += obj.length * 2;
          break;
        case "boolean":
          bytes += 4;
          break;
        case "object":
          var objClass = Object.prototype.toString.call(obj).slice(8, -1);
          if (objClass === "Object" || objClass === "Array") {
            for (var key in obj) {
              if (!obj.hasOwnProperty(key)) continue;
              sizeOf(obj[key]);
            }
          } else bytes += obj.toString().length * 2;
          break;
      }
    }
    return bytes;
  }

  return m.formatByteSize(sizeOf(obj));
};

export default m;
