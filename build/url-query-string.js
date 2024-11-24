"use strict";
(() => {
  // src/url-query-string.ts
  function objectToQueryString(obj) {
    const params = new URLSearchParams();
    for (const key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        const value = obj[key];
        let paramValue;
        if (typeof value === "number" || typeof value === "boolean" || typeof value === "string") {
          paramValue = String(value);
        } else if (typeof value === "object") {
          paramValue = JSON.stringify(value);
        } else {
          continue;
        }
        params.append(key, paramValue);
      }
    }
    const queryString = params.toString();
    return queryString ? `?${queryString}` : "";
  }
  function queryStringToObject(queryString) {
    const obj = {};
    const query = queryString.startsWith("?") ? queryString.slice(1) : queryString;
    const params = new URLSearchParams(query);
    params.forEach((value, key) => {
      let parsedValue;
      try {
        parsedValue = JSON.parse(value);
        obj[key] = parsedValue;
        return;
      } catch {
      }
      if (!isNaN(Number(value))) {
        obj[key] = Number(value);
        return;
      }
      if (value.toLowerCase() === "true") {
        obj[key] = true;
        return;
      }
      if (value.toLowerCase() === "false") {
        obj[key] = false;
        return;
      }
      obj[key] = value;
    });
    return obj;
  }
})();
