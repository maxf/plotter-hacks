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
        params.callback().bind(this);
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
        params.callback().bind(this);
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

  // src/dts.ts
  var defaultParams = {
    inputImageUrl: "tbl.png",
    width: 800,
    height: 800,
    cutoff: 210,
    nsamples: 1e4,
    optIter: 1,
    showStipple: false,
    showPoly: false,
    showDts: true,
    showVoronoi: false,
    seed: 128,
    curvature: 20
  };
  var paramsFromWidgets = () => {
    const params = { ...defaultParams };
    params.inputImageUrl = imageUpload.imageUrl();
    params.cutoff = controlCutoff.val();
    params.nsamples = controlNSamples.val();
    params.optIter = controlOptIter.val();
    params.showStipple = controlShowStipple.val();
    params.showPoly = controlShowPoly.val();
    params.showDts = controlShowDts.val();
    params.showVoronoi = controlShowVoronoi.val();
    params.seed = controlSeed.val();
    params.curvature = controlCurvature.val();
    return params;
  };
  var canvas;
  var ctx;
  var dtsWorker = new Worker("build/dts-ww.js");
  dtsWorker.onmessage = function(e) {
    $("canvas").innerHTML = e.data;
  };
  var doRender = function(params) {
    $("canvas").innerHTML = "<h1>Rendering. Please wait</h1>";
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    dtsWorker.postMessage({ params, imageData });
    updateUrl(params);
  };
  var renderFromQsp = function() {
    const params = paramsFromUrl(defaultParams);
    doRender(params);
    controlCutoff.set(params.cutoff);
    controlOptIter.set(params.optIter);
    controlNSamples.set(params.nsamples);
    controlShowStipple.set(params.showStipple);
    controlShowPoly.set(params.showPoly);
    controlShowDts.set(params.showDts);
    controlShowVoronoi.set(params.showVoronoi);
    controlSeed.set(params.seed);
    controlCurvature.set(params.curvature);
  };
  var renderFromWidgets = function() {
    doRender(paramsFromWidgets());
  };
  var imageUpload = new ImageUploadControl({
    name: "inputImage",
    label: "Image",
    value: defaultParams["inputImageUrl"],
    firstCallback: renderFromQsp,
    callback: renderFromWidgets
  });
  canvas = imageUpload.canvas();
  ctx = canvas.getContext("2d");
  var controlSeed = new NumberControl({
    name: "seed",
    label: "seed",
    value: defaultParams["seed"],
    callback: renderFromWidgets,
    min: 0,
    max: 500
  });
  var controlCutoff = new NumberControl({
    name: "cutoff",
    label: "White cutoff",
    value: defaultParams["cutoff"],
    callback: renderFromWidgets,
    min: 0,
    max: 255
  });
  var controlNSamples = new NumberControl({
    name: "nsamples",
    label: "Samples",
    value: defaultParams["nsamples"],
    callback: renderFromWidgets,
    min: 10,
    max: 2e4
  });
  var controlOptIter = new NumberControl({
    name: "optIter",
    label: "Optimisation",
    value: defaultParams["optIter"],
    callback: renderFromWidgets,
    min: 0,
    max: 2e7
  });
  var controlCurvature = new NumberControl({
    name: "curvature",
    label: "Curvature",
    value: defaultParams["curvature"],
    callback: renderFromWidgets,
    min: 0,
    max: 50
  });
  var controlShowStipple = new CheckboxControl({
    name: "showStipple",
    label: "Stipple points",
    value: defaultParams["showStipple"],
    callback: renderFromWidgets
  });
  var controlShowPoly = new CheckboxControl({
    name: "showPoly",
    label: "Polygons",
    value: defaultParams["showPoly"],
    callback: renderFromWidgets
  });
  var controlShowDts = new CheckboxControl({
    name: "showSplines",
    label: "Splines",
    value: defaultParams["showDts"],
    callback: renderFromWidgets
  });
  var controlShowVoronoi = new CheckboxControl({
    name: "showVoronoi",
    label: "Voronoi diagram",
    value: defaultParams["showVoronoi"],
    callback: renderFromWidgets
  });
  new SvgSaveControl({
    name: "svgSave",
    canvasId: "svg-canvas",
    label: "Save SVG",
    saveFilename: "dts.svg"
  });
})();
