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
    constructor(id, params) {
      this.#id = id;
      this.#value = params.value;
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
        updateUrlParam(this.id(), this.val());
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
        downloadLink.download = params.saveFileid;
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
  var ImageUploadControl = class extends Control {
    #wrapperEl;
    #uploadEl;
    #canvasEl;
    #imageUrl;
    #callback;
    constructor(id, params) {
      super(id, params);
      this.#imageUrl = params.value;
      this.#callback = params.callback;
      this.#createHtmlControl(id, params.name);
      this.#wrapperEl = document.getElementById(`${id}-control`);
      this.#uploadEl = document.getElementById(`${id}-upload`);
      this.#canvasEl = document.getElementById(`${id}-canvas`);
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
    #createHtmlControl(id, name) {
      const html = [];
      html.push(`<div class="control" id="${id}-control">`);
      html.push(`${name} <input type="file" id="${id}-upload" accept="image/*"><br/>`);
      html.push(`<canvas id="${id}-canvas"></canvas>`);
      html.push(`</div>`);
      const anchorElement = document.getElementById("controls");
      if (anchorElement) {
        anchorElement.insertAdjacentHTML("beforeend", html.join(""));
      }
    }
    loadImage(source, callback) {
      const ctx2 = this.#canvasEl.getContext("2d", { willReadFrequently: true });
      const img = new Image();
      img.onload = () => {
        const desiredWidth = 200;
        const aspectRatio = img.width / img.height;
        const desiredHeight = desiredWidth / aspectRatio;
        this.#canvasEl.width = desiredWidth;
        this.#canvasEl.height = desiredHeight;
        if (ctx2) {
          ctx2.drawImage(img, 0, 0, desiredWidth, desiredHeight);
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
      this.loadImage(this.#imageUrl, () => {
        this.#callback(this);
      });
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
  var controls = [];

  // src/vector-field.ts
  var defaultParams = {
    inputImageUrl: "images/boat.jpg",
    width: 800,
    height: 800,
    cutoff: 90,
    nsamples: 250,
    // vector grid is nsamples x nsamples
    strokeLength: 10
  };
  var paramsFromWidgets = () => {
    const params = { ...defaultParams };
    params.inputImageUrl = imageUpload.imageUrl();
    params.cutoff = controlCutoff.val();
    params.nsamples = controlNSamples.val();
    params.strokeLength = controlStrokeLength.val();
    return params;
  };
  var canvas;
  var ctx;
  var vectorFieldWorker = new Worker("build/vector-field-ww.js");
  vectorFieldWorker.onmessage = function(e) {
    $("canvas").innerHTML = e.data;
  };
  var doRender = function(params) {
    $("canvas").innerHTML = "<h1>Rendering. Please wait</h1>";
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    vectorFieldWorker.postMessage({ params, imageData });
    updateUrl(params);
  };
  var renderFromQsp = function() {
    const params = paramsFromUrl(defaultParams);
    doRender(params);
    controlCutoff.set(params.cutoff);
    controlNSamples.set(params.nsamples);
    controlStrokeLength.set(params.strokeLength);
  };
  var renderFromWidgets = function() {
    doRender(paramsFromWidgets());
  };
  var imageUpload = new ImageUploadControl("inputImage", {
    name: "Image",
    value: defaultParams["inputImageUrl"],
    firstCallback: renderFromQsp,
    callback: renderFromWidgets
  });
  canvas = imageUpload.canvas();
  ctx = canvas.getContext("2d");
  var controlCutoff = new NumberControl("cutoff", {
    name: "White cutoff",
    value: defaultParams["cutoff"],
    callback: renderFromWidgets,
    min: 0,
    max: 255
  });
  var controlNSamples = new NumberControl("nsamples", {
    name: "Samples",
    value: defaultParams["nsamples"],
    callback: renderFromWidgets,
    min: 10,
    max: 500
  });
  var controlStrokeLength = new NumberControl("strokeLength", {
    name: "Stroke length",
    value: 10,
    callback: renderFromWidgets,
    min: 1,
    max: 50
  });
  new SvgSaveControl("svgSave", {
    canvasId: "svg-canvas",
    name: "Save SVG",
    saveFilename: "vector-field.svg"
  });
})();
