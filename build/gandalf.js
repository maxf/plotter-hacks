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
var SelectControl = class extends Control {
  widgetEl;
  value;
  constructor(id, params) {
    super(id, params);
    this.value = params.value;
    this.createHtmlControl(id, params.name, params.value, params.choices);
    this.widgetEl = $(id);
    this.wrapperEl = $(`${id}-control`);
    this._updateUrl = params.updateUrl || true;
    this.widgetEl.onchange = (event) => {
      this.set(event.target.value);
      if (this.updateUrl()) updateUrlParam(this.id, this.value);
      params.callback(this);
    };
  }
  createHtmlControl(id, name, value, choices) {
    const html = [];
    html.push(`<div class="control" id="${id}-control">`);
    html.push(name);
    html.push(`<select id="${this.id}">`);
    choices.forEach((choice) => html.push(`<option ${choice === value ? "selected" : ""}>${choice}</option>`));
    html.push("</select>");
    html.push("</div>");
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
    this.widgetEl.value = newValue;
    return this.value;
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
var ImageInputControl = class extends Control {
  videoControl;
  imageControl;
  toggle;
  constructor(id, params) {
    super(id, params);
    this.videoControl = new VideoStreamControl(`${id}-video`, {
      name: "Video",
      callback: params.callback
    });
    this.videoControl.hide();
    this.imageControl = new ImageUploadControl(`${id}-image`, {
      name: "Image",
      callback: params.callback,
      initialImage: params.initialImage
    });
    this.toggle = new SelectControl(`${id}-toggle`, {
      name: "Mode",
      choices: ["Video", "Image upload"],
      value: "Image upload",
      callback: () => {
        if (this.toggle.val() === "Video") {
          this.imageControl.hide();
          this.videoControl.show();
        } else {
          this.imageControl.show();
          this.videoControl.pauseStreaming();
          this.videoControl.hide();
        }
      }
    });
  }
  canvas() {
    return this.toggle.val() === "Video" ? this.videoControl.canvas() : this.imageControl.canvas();
  }
};
var VideoStreamControl = class extends Control {
  videoEl;
  canvasEl;
  startButtonEl;
  isRunning;
  animationId;
  context;
  stream = null;
  callback;
  constructor(id, params) {
    super(id, params);
    this.createHtmlControl(id, params.name);
    this.wrapperEl = document.getElementById(`${id}-control`);
    this.videoEl = document.getElementById(`${id}-video`);
    this.canvasEl = document.getElementById(`${id}-canvas`);
    this.startButtonEl = document.getElementById(`${id}-start`);
    this.callback = params.callback;
    this.animationId = 0;
    this.isRunning = false;
    this.context = this.canvasEl.getContext(
      "2d",
      { alpha: false, willReadFrequently: true }
    );
  }
  async stopStreaming() {
    if (this.stream) {
      this.stream.getTracks().forEach((track) => track.stop());
      this.videoEl.srcObject = null;
      this.stream = null;
      this.videoEl.pause();
    }
    this.isRunning = false;
  }
  async pauseStreaming() {
    await this.stopStreaming();
    this.startButtonEl.innerText = "Restart";
    this.startButtonEl.onclick = async () => this.restartStreaming();
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
  }
  async restartStreaming() {
    await this.stopStreaming();
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: false,
        video: { width: 1920, height: 1080 }
      });
      this.stream = stream;
      this.videoEl.srcObject = stream;
      this.videoEl.play();
      this.startButtonEl.innerText = "Pause";
      this.startButtonEl.onclick = async () => this.pauseStreaming();
      this.isRunning = true;
      this.animate();
    } catch (e) {
      console.log("Failed to restart camera:", e.name);
    }
  }
  animate() {
    if (this.context) {
      this.context.drawImage(
        this.videoEl,
        0,
        0,
        this.canvasEl.width,
        this.canvasEl.height
      );
      this.callback(this.context, this.canvasEl.width, this.canvasEl.height);
      if (this.isRunning) {
        this.animationId = requestAnimationFrame(this.animate.bind(this));
      }
    }
  }
  async startStreaming() {
    if (!this.context) throw "Failed to get context";
    navigator.mediaDevices.getUserMedia({
      audio: false,
      video: { width: 1920, height: 1080 }
    }).then((stream) => {
      stream = stream;
      this.videoEl.srcObject = stream;
      this.videoEl.play();
    }).catch(function(e) {
      console.log("An error with camera occured:", e.id);
    });
    this.startButtonEl.innerText = "Pause";
    this.startButtonEl.onclick = async () => await this.pauseStreaming();
    this.isRunning = true;
    this.animate();
  }
  createHtmlControl(id, name) {
    const html = [];
    html.push(`<div class="control" id="${id}-control">`);
    html.push(`${name} <video id="${id}-video" autoplay playsinline webkit-playsinline muted hidden></video>`);
    html.push(`<canvas id="${id}-canvas"></canvas>`);
    html.push(`<button id="${id}-start">Start</button>`);
    html.push(`</div>`);
    const anchorElement = document.getElementById("controls");
    if (anchorElement) {
      anchorElement.insertAdjacentHTML("beforeend", html.join(""));
      $(`${id}-start`).onclick = async () => {
        await this.startStreaming();
      };
    }
  }
  show() {
    this.wrapperEl.style.display = "block";
    this.animate();
  }
  hide() {
    this.stopStreaming();
    this.wrapperEl.style.display = "none";
  }
  canvas() {
    return this.canvasEl;
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
    const ctx = this.canvasEl.getContext("2d", { willReadFrequently: true });
    const img = new Image();
    img.onload = () => {
      const desiredWidth = 200;
      const aspectRatio = img.width / img.height;
      const desiredHeight = desiredWidth / aspectRatio;
      this.canvasEl.width = desiredWidth;
      this.canvasEl.height = desiredHeight;
      if (ctx) {
        ctx.drawImage(img, 0, 0, desiredWidth, desiredHeight);
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
var controls = [];
var getParams = function(defaults) {
  const params = defaults;
  console.log("getParams");
  controls.forEach((control) => {
    if (control.val() !== void 0) {
      const key = control.id;
      if (control.updateUrl()) {
        let value = paramFromQueryString(
          control.id,
          window.location.search
        );
        if (value) {
          params[key] = value;
          control.set(value);
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
    }
  });
  return params;
};

// src/gandalf.ts
var defaultParams = {
  inputImageUrl: "portrait.jpg",
  width: 800,
  height: 800,
  cutoff: 85,
  nsamples: 8296,
  seed: 72
};
var gandalfWorker = new Worker("build/gandalf-ww.js");
gandalfWorker.onmessage = function(e) {
  $("canvas").innerHTML = e.data;
};
var doRender = function() {
  const params = getParams(defaultParams);
  const canvas = imageSourceControl.canvas();
  const ctx = canvas.getContext("2d");
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  gandalfWorker.postMessage({ params, imageData });
};
var imageSourceControl = new ImageInputControl("imageSource", {
  name: "Source",
  callback: doRender,
  initialImage: "tbl.png"
});
new NumberControl("seed", {
  name: "seed",
  value: defaultParams["seed"],
  callback: doRender,
  min: 0,
  max: 500
});
new NumberControl("cutoff", {
  name: "White cutoff",
  value: defaultParams["cutoff"],
  callback: doRender,
  min: 0,
  max: 255
});
new NumberControl("nsamples", {
  name: "Samples",
  value: defaultParams["nsamples"],
  callback: doRender,
  min: 10,
  max: 2e4
});
new SvgSaveControl("svgSave", {
  canvasId: "svg-canvas",
  name: "Save SVG",
  saveFilename: "gandalf.svg"
});
