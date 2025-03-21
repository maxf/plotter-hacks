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
function updateUrlParam(key, value) {
  const url = new URL(window.location.href);
  url.searchParams.set(key, value);
  history.replaceState(null, "", url.toString());
}

// src/controls.ts
var $ = (id) => document.getElementById(id);
var Control = class {
  id;
  // like a name but should be a valid query string param name
  _updateUrl;
  wrapperEl;
  constructor(id, params) {
    this.id = id;
    this._updateUrl = params.updateUrl || false;
    this.wrapperEl = $(`${id}-control`);
    controls.push(this);
  }
  updateUrl() {
    return this._updateUrl;
  }
  val() {
    return void 0;
  }
  set(value) {
    return value;
  }
  show() {
    this.wrapperEl.style.display = "block";
  }
  hide() {
    this.wrapperEl.style.display = "none";
  }
};
var NumberControl = class extends Control {
  widgetEl;
  valueEl;
  value;
  constructor(id, params) {
    super(id, params);
    this._updateUrl = params.updateUrl || true;
    this.value = params.value;
    this.createHtmlControl(id, params.name, params.value, params.min, params.max, params.step);
    this.widgetEl = $(id);
    this.valueEl = $(`${id}-value`);
    this.wrapperEl = $(`${id}-control`);
    this.widgetEl.onchange = (event) => {
      this.set(parseFloat(event.target.value));
      this.valueEl.innerText = this.value.toString();
      if (this.updateUrl()) updateUrlParam(this.id, this.value);
      params.callback();
    };
  }
  val() {
    return this.value;
  }
  createHtmlControl(id, name, value, min, max, step) {
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
    this.value = newValue;
    this.widgetEl.value = newValue.toString();
    this.valueEl.innerText = newValue.toString();
    return this.value;
  }
};
var CheckboxControl = class extends Control {
  widgetEl;
  value;
  constructor(id, params) {
    super(id, params);
    this.value = params.value;
    this.createHtmlControl(id, params.name, params.value);
    this.widgetEl = $(id);
    this.wrapperEl = $(`${id}-control`);
    this._updateUrl = params.updateUrl || true;
    this.widgetEl.onchange = (event) => {
      this.set(event.target.checked);
      if (this.updateUrl()) updateUrlParam(this.id, this.value);
      params.callback.bind(this)();
    };
  }
  createHtmlControl(id, name, value) {
    const html = [];
    html.push(`<div class="control" id="${id}-control">`);
    html.push(`<input type="checkbox" id="${id}" ${value ? "selected" : ""}> ${name}`);
    html.push(`</div>`);
    const anchorElement = $("controls");
    if (anchorElement) {
      anchorElement.insertAdjacentHTML("beforeend", html.join(""));
    }
  }
  val() {
    return this.value;
  }
  set(newValue) {
    this.value = newValue;
    this.widgetEl.checked = newValue;
  }
};
var SvgSaveControl = class extends Control {
  constructor(id, params) {
    super(id, params);
    this.createHtmlControl(id, params.name);
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
  createHtmlControl(id, name) {
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
};
var ImageUploadControl = class extends Control {
  uploadEl;
  canvasEl;
  _imageUrl;
  callback;
  constructor(id, params) {
    super(id, params);
    this._imageUrl = params.initialImage;
    this.callback = params.callback;
    this.createHtmlControl(id, params.name);
    this.wrapperEl = document.getElementById(`${id}-control`);
    this.uploadEl = document.getElementById(`${id}-upload`);
    this.canvasEl = document.getElementById(`${id}-canvas`);
    this.loadImage(this._imageUrl, () => {
      params.callback(this);
    });
    this.uploadEl.onchange = () => {
      const file = this.uploadEl.files[0];
      if (file) {
        this.loadImage(file, () => params.callback(this));
      }
    };
  }
  createHtmlControl(id, name) {
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
    const ctx2 = this.canvasEl.getContext("2d", { willReadFrequently: true });
    const img = new Image();
    img.onload = () => {
      const desiredWidth = 200;
      const aspectRatio = img.width / img.height;
      const desiredHeight = desiredWidth / aspectRatio;
      this.canvasEl.width = desiredWidth;
      this.canvasEl.height = desiredHeight;
      if (ctx2) {
        ctx2.drawImage(img, 0, 0, desiredWidth, desiredHeight);
      }
      if (callback) {
        callback();
      }
    };
    if (typeof source === "string") {
      img.src = source;
      this._imageUrl = source;
    } else {
      this._imageUrl = "";
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
    return this._imageUrl;
  }
  canvas() {
    return this.canvasEl;
  }
  show() {
    this.loadImage(this._imageUrl, () => {
      this.callback(this);
    });
    super.show();
  }
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
var renderFromWidgets = function() {
  doRender(paramsFromWidgets());
};
var imageUpload = new ImageUploadControl("inputImage", {
  name: "Image",
  initialImage: defaultParams["inputImageUrl"],
  callback: renderFromWidgets
});
canvas = imageUpload.canvas();
ctx = canvas.getContext("2d");
var controlSeed = new NumberControl("seed", {
  name: "seed",
  value: defaultParams["seed"],
  callback: renderFromWidgets,
  min: 0,
  max: 500
});
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
  max: 2e4
});
var controlOptIter = new NumberControl("optIter", {
  name: "Optimisation",
  value: defaultParams["optIter"],
  callback: renderFromWidgets,
  min: 0,
  max: 2e7
});
var controlCurvature = new NumberControl("curvature", {
  name: "Curvature",
  value: defaultParams["curvature"],
  callback: renderFromWidgets,
  min: 0,
  max: 50
});
var controlShowStipple = new CheckboxControl("showStipple", {
  name: "Stipple points",
  value: defaultParams["showStipple"],
  callback: renderFromWidgets
});
var controlShowPoly = new CheckboxControl("showPoly", {
  name: "Polygons",
  value: defaultParams["showPoly"],
  callback: renderFromWidgets
});
var controlShowDts = new CheckboxControl("showSplines", {
  name: "Splines",
  value: defaultParams["showDts"],
  callback: renderFromWidgets
});
var controlShowVoronoi = new CheckboxControl("showVoronoi", {
  name: "Voronoi diagram",
  value: defaultParams["showVoronoi"],
  callback: renderFromWidgets
});
new SvgSaveControl("svgSave", {
  canvasId: "svg-canvas",
  name: "Save SVG",
  saveFilename: "dts.svg"
});
