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
    #name;
    #value;
    constructor(params) {
      this.#name = params.name;
      this.#value = params.value;
      controls.push(this);
    }
    name() {
      return this.#name;
    }
    setVal(val) {
      this.#value = val;
    }
    val() {
      return this.#value;
    }
  };
  var NumberControl = class extends Control {
    #wrapperEl;
    #widgetEl;
    #valueEl;
    constructor(params) {
      super(params);
      this.#createHtmlControl(params.name, params.label, params.value, params.min, params.max, params.step);
      this.#widgetEl = $(params.name);
      this.#valueEl = $(`${params.name}-value`);
      this.#wrapperEl = $(`${params.name}-control`);
      this.#widgetEl.onchange = (event) => {
        this.setVal(parseFloat(event.target.value));
        this.#valueEl.innerText = this.val().toString();
        updateUrlParam(this.name(), this.val());
        params.renderFn();
      };
    }
    #createHtmlControl(name, label, value, min, max, step) {
      const html = [];
      html.push(`<div class="control" id="${name}-control">`);
      const stepAttr = step ? `step="${step}"` : "";
      html.push(`
      <input id="${name}" type="range" min="${min}" max="${max}" value="${value}" ${stepAttr}"/>
      ${label}
      <span id="${name}-value">${value}</span>
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
  var SelectControl = class extends Control {
    #wrapperEl;
    #widgetEl;
    constructor(params) {
      super(params);
      this.setVal(params.value);
      this.#createHtmlControl(params.name, params.label, params.value, params.choices);
      this.#widgetEl = $(params.name);
      this.#wrapperEl = $(`${params.name}-control`);
      this.#widgetEl.onchange = (event) => {
        this.setVal(event.target.value);
        updateUrlParam(this.name(), this.val());
        params.renderFn.call(this);
      };
    }
    #createHtmlControl(name, label, value, choices) {
      const html = [];
      html.push(`<div class="control" id="${name}-control">`);
      html.push(label);
      html.push(`<select id="${this.name()}">`);
      choices.forEach((choice) => html.push(`<option ${choice === value ? "selected" : ""}>${choice}</option>`));
      html.push("</select>");
      html.push("</div>");
      const anchorElement = $("controls");
      if (anchorElement) {
        anchorElement.insertAdjacentHTML("beforeend", html.join(""));
      }
    }
    set(newValue) {
      this.setVal(newValue);
      this.#widgetEl.value = newValue;
    }
    show() {
      this.#wrapperEl.style.display = "block";
    }
    hide() {
      this.#wrapperEl.style.display = "none";
    }
  };
  var CheckboxControl = class extends Control {
    #wrapperEl;
    #widgetEl;
    constructor(params) {
      super(params);
      this.setVal(params.value);
      this.#createHtmlControl(params.name, params.label, params.value);
      this.#widgetEl = $(params.name);
      this.#wrapperEl = $(`${params.name}-control`);
      this.#widgetEl.onchange = (event) => {
        this.setVal(event.target.checked);
        updateUrlParam(this.name(), this.val());
        params.renderFn();
      };
    }
    #createHtmlControl(name, label, value) {
      const html = [];
      html.push(`<div class="control" id="${name}-control">`);
      html.push(`<input type="checkbox" id="${name}" ${value ? "selected" : ""}> ${label}`);
      html.push(`</div>`);
      const anchorElement = $("controls");
      if (anchorElement) {
        anchorElement.insertAdjacentHTML("beforeend", html.join(""));
      }
    }
    set(newValue) {
      this.setVal(newValue);
      this.#widgetEl.checked = newValue;
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
    #createHtmlControl(name, label) {
      const html = `
      <div class="control" id="${name}-control">
        <button id="${name}">${label}</button>
      </div>
    `;
      const anchorElement = $("controls");
      if (anchorElement) {
        anchorElement.insertAdjacentHTML("beforeend", html);
      }
    }
    constructor(params) {
      super(params);
      this.#createHtmlControl(params.name, params.label);
      this.#wrapperEl = $(`${params.name}-control`);
      $(params.name).onclick = () => {
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
  var VideoStreamControl = class extends Control {
    #wrapperEl;
    #videoEl;
    #canvasEl;
    #startButtonEl;
    #callback;
    #isRunning;
    #animationId;
    #context;
    constructor(params) {
      super(params);
      this.#createHtmlControl(params.name, params.label);
      this.#wrapperEl = document.getElementById(`${params.name}-control`);
      this.#videoEl = document.getElementById(`${params.name}-video`);
      this.#canvasEl = document.getElementById(`${params.name}-canvas`);
      this.#startButtonEl = document.getElementById(`${params.name}-start`);
      this.#callback = params.callback;
      this.#animationId = 0;
      this.#isRunning = false;
      this.#context = this.#canvasEl.getContext(
        "2d",
        { alpha: false, willReadFrequently: true }
      );
    }
    async pauseStreaming() {
      this.#videoEl.pause();
      this.#startButtonEl.innerText = "Restart";
      this.#startButtonEl.onclick = async () => this.restartStreaming();
      this.#isRunning = false;
      if (this.#animationId) {
        cancelAnimationFrame(this.#animationId);
        this.#animationId = null;
      }
    }
    async restartStreaming() {
      this.#videoEl.play();
      this.#startButtonEl.innerText = "Pause";
      this.#startButtonEl.onclick = async () => this.pauseStreaming();
      this.#isRunning = true;
      this.#animate();
    }
    #animate() {
      this.#context.drawImage(this.#videoEl, 0, 0, this.#canvasEl.width, this.#canvasEl.height);
      this.#callback(this.#context, this.#canvasEl.width, this.#canvasEl.height);
      if (this.#isRunning) {
        this.#animationId = requestAnimationFrame(this.#animate.bind(this));
      }
    }
    async startStreaming() {
      if (!this.#context) throw "Failed to get context";
      navigator.mediaDevices.getUserMedia({
        audio: false,
        video: { width: 1920, height: 1080 }
      }).then((stream) => {
        this.#videoEl.srcObject = stream;
        this.#videoEl.play();
      }).catch(function(e) {
        console.log("An error with camera occured:", e.name);
      });
      this.#startButtonEl.innerText = "Pause";
      this.#startButtonEl.onclick = async () => await this.pauseStreaming();
      this.#isRunning = true;
      this.#animate();
    }
    #createHtmlControl(name, label) {
      const html = [];
      html.push(`<div class="control" id="${name}-control">`);
      html.push(`${label} <video id="${name}-video" autoplay playsinline webkit-playsinline muted hidden></video>`);
      html.push(`<canvas id="${name}-canvas"></canvas>`);
      html.push(`<button id="${name}-start">Start</button>`);
      html.push(`</div>`);
      const anchorElement = document.getElementById("controls");
      if (anchorElement) {
        anchorElement.insertAdjacentHTML("beforeend", html.join(""));
        $(`${name}-start`).onclick = async () => {
          await this.startStreaming();
        };
      }
    }
    show() {
      this.#wrapperEl.style.display = "block";
    }
    hide() {
      this.#wrapperEl.style.display = "none";
    }
  };
  var ImageUploadControl = class extends Control {
    #wrapperEl;
    #uploadEl;
    #canvasEl;
    #imageUrl;
    constructor(params) {
      super(params);
      this.#imageUrl = params.value;
      this.#createHtmlControl(params.name, params.label);
      this.#wrapperEl = document.getElementById(`${params.name}-control`);
      this.#uploadEl = document.getElementById(`${params.name}-upload`);
      this.#canvasEl = document.getElementById(`${params.name}-canvas`);
      this.loadImage(this.#imageUrl, () => {
        params.callback(this);
      });
      this.#uploadEl.onchange = () => {
        const file = this.#uploadEl.files[0];
        if (file) {
          this.loadImage(file, () => params.callback(this));
        }
      };
    }
    #createHtmlControl(name, label) {
      const html = [];
      html.push(`<div class="control" id="${name}-control">`);
      html.push(`${label} <input type="file" id="${name}-upload" accept="image/*"><br/>`);
      html.push(`<canvas id="${name}-canvas"></canvas>`);
      html.push(`</div>`);
      const anchorElement = document.getElementById("controls");
      if (anchorElement) {
        anchorElement.insertAdjacentHTML("beforeend", html.join(""));
      }
    }
    loadImage(source, callback) {
      const ctx = this.#canvasEl.getContext("2d", { willReadFrequently: true });
      const img = new Image();
      img.onload = () => {
        const desiredWidth = 200;
        const aspectRatio = img.width / img.height;
        const desiredHeight = desiredWidth / aspectRatio;
        this.#canvasEl.width = desiredWidth;
        this.#canvasEl.height = desiredHeight;
        if (ctx) {
          ctx.drawImage(img, 0, 0, desiredWidth, desiredHeight);
        }
        if (callback) {
          callback();
        }
      };
      if (typeof source === "string") {
        img.src = source;
        this.#imageUrl = source;
      } else {
        this.#imageUrl = "";
        const reader = new FileReader();
        reader.onload = (event) => {
          if (event.target && event.target.result) {
            img.src = event.target.result;
          }
        };
        reader.readAsDataURL(source);
      }
    }
    imageUrl() {
      return this.#imageUrl;
    }
    canvas() {
      return this.#canvasEl;
    }
    show() {
      this.#wrapperEl.style.display = "block";
    }
    hide() {
      this.#wrapperEl.style.display = "none";
    }
  };
  var paramsFromUrl = (defaults) => {
    const params = queryStringToObject(window.location.search);
    return { ...defaults, ...params };
  };
  var updateUrl = (params) => {
    const url = objectToQueryString(params);
    history.pushState(null, "", url);
  };
  var TextControl = class extends Control {
    #wrapperEl;
    #widgetEl;
    constructor(params) {
      super(params);
      this.setVal(params.value);
      this.#createHtmlControl(params.name, params.label, params.value);
      this.#widgetEl = $(params.name);
      this.#wrapperEl = $(`${params.name}-control`);
      this.#widgetEl.onchange = (event) => {
        this.setVal(event.target.value);
        updateUrlParam(this.name(), this.val());
        params.renderFn();
      };
    }
    #createHtmlControl(name, label, value) {
      const html = [];
      html.push(`<div class="control" id="${name}-control">`);
      html.push(`
      <input id="${name}" value="${value}"/>
      ${label}
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
    }
    show() {
      this.#wrapperEl.style.display = "block";
    }
    hide() {
      this.#wrapperEl.style.display = "none";
    }
  };
  var controls = [];
  var getParams = function(defaults) {
    const params = {};
    controls.forEach((control) => {
      const key = control.name();
      let value = paramFromQueryString(
        control.name(),
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
    });
    return params;
  };
})();
