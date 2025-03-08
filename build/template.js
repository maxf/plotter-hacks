// src/url-query-string.ts
function paramFromQueryString(name, queryString) {
  const query = queryString.startsWith("?") ? queryString.slice(1) : queryString;
  const params = new URLSearchParams(query);
  if (params.has(name)) {
    const value = params.get(name);
    if (value === null) return null;
    try {
      return JSON.parse(value);
    } catch {
    }
    if (!isNaN(Number(value))) {
      return Number(value);
    }
    if (value.toLowerCase() === "true") {
      return true;
    }
    if (value.toLowerCase() === "false") {
      return false;
    }
    return value.toString();
  }
  return void 0;
}
function updateUrlParam(key, value) {
  const url = new URL(window.location.href);
  url.searchParams.set(key, value);
  history.replaceState(null, "", url.toString());
}

// src/controls.ts
var $ = (id) => document.getElementById(id);
var Control = class {
  #id;
  // like a name but should be a valid query string param name
  #value;
  #updateUrl;
  constructor(id, params) {
    this.#id = id;
    this.#value = params.value;
    this.#updateUrl = params.updateUrl === void 0 ? true : false;
    controls.push(this);
  }
  id() {
    return this.#id;
  }
  setVal(val) {
    this.#value = val;
  }
  val() {
    return this.#value;
  }
  updateUrl() {
    return this.#updateUrl;
  }
};
var NumberControl = class extends Control {
  #wrapperEl;
  #widgetEl;
  #valueEl;
  constructor(id, params) {
    super(id, params);
    this.#createHtmlControl(id, params.name, params.value, params.min, params.max, params.step);
    this.#widgetEl = $(id);
    this.#valueEl = $(`${id}-value`);
    this.#wrapperEl = $(`${id}-control`);
    this.#widgetEl.onchange = (event) => {
      this.setVal(parseFloat(event.target.value));
      this.#valueEl.innerText = this.val().toString();
      if (this.updateUrl()) updateUrlParam(this.id(), this.val());
      params.callback();
    };
  }
  #createHtmlControl(id, name, value, min, max, step) {
    const html = [];
    html.push(`<div class="control" id="${id}-control">`);
    const stepAttr = step ? `step="${step}"` : "";
    html.push(`
      <input id="${id}" type="range" min="${min}" max="${max}" value="${value}" ${stepAttr}"/>
      ${name}
      <span id="${id}-value">${value}</span>
    `);
    html.push("</div>");
    const anchorElement = $("controls");
    if (anchorElement) {
      anchorElement.insertAdjacentHTML("beforeend", html.join(""));
    }
  }
  set(newValue) {
    this.setVal(newValue);
    this.#widgetEl.value = newValue.toString();
    this.#valueEl.innerText = newValue.toString();
  }
  show() {
    this.#wrapperEl.style.display = "block";
  }
  hide() {
    this.#wrapperEl.style.display = "none";
  }
};
var SvgSaveControl = class extends Control {
  #wrapperEl;
  #createHtmlControl(id, name) {
    const html = `
      <div class="control" id="${id}-control">
        <button id="${id}">${name}</button>
      </div>
    `;
    const anchorElement = $("controls");
    if (anchorElement) {
      anchorElement.insertAdjacentHTML("beforeend", html);
    }
  }
  constructor(id, params) {
    super(id, params);
    this.#createHtmlControl(id, params.name);
    this.#wrapperEl = $(`${id}-control`);
    $(id).onclick = () => {
      const svgEl = $(params.canvasId);
      svgEl.setAttribute("xmlns", "http://www.w3.org/2000/svg");
      var svgData = svgEl.outerHTML;
      var preface = '<?xml version="1.0" standalone="no"?>';
      var svgBlob = new Blob([preface, svgData], { type: "image/svg+xml;charset=utf-8" });
      var svgUrl = URL.createObjectURL(svgBlob);
      var downloadLink = document.createElement("a");
      downloadLink.href = svgUrl;
      downloadLink.download = params.saveFilename;
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);
    };
  }
  show() {
    this.#wrapperEl.style.display = "block";
  }
  hide() {
    this.#wrapperEl.style.display = "none";
  }
};
var controls = [];
var getParams = function(defaults, useUrl = true) {
  const params = defaults;
  controls.forEach((control) => {
    const key = control.id();
    if (useUrl) {
      let value = paramFromQueryString(
        control.id(),
        window.location.search
      );
      if (value) {
        params[key] = value;
        control.setVal(value);
      } else {
        value = control.val();
        if (value) {
          params[key] = control.val();
          updateUrlParam(key, params[key]);
        } else {
          params[key] = defaults[key];
        }
      }
    } else {
      params[key] = control.val() || defaults[key];
    }
  });
  return params;
};

// src/template.ts
var defaultParams = {
  rectSize: 200
};
var worker = new Worker("build/template-ww.js");
worker.onmessage = function(e) {
  $("canvas").innerHTML = e.data;
};
var renderPlot = function() {
  const params = getParams(defaultParams);
  worker.postMessage({ params });
};
new NumberControl("rectSize", {
  name: "Rectangle size",
  value: defaultParams["rectSize"],
  callback: renderPlot,
  min: 100,
  max: 500
});
new SvgSaveControl("svgSave", {
  canvasId: "svg-canvas",
  name: "Save SVG",
  saveFilename: "template.svg"
});
renderPlot();
