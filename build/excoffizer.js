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
var TextControl = class extends Control {
  widgetEl;
  buttonEl;
  value;
  constructor(id, params) {
    super(id, params);
    this.value = params.value;
    this.createHtmlControl(id, params.name, params.value);
    this.widgetEl = $(id);
    this.wrapperEl = $(`${id}-control`);
    this.buttonEl = $(`${id}-button`);
    this._updateUrl = params.updateUrl || true;
    this.buttonEl.onclick = () => {
      this.set(this.widgetEl.value);
      if (this.updateUrl()) updateUrlParam(this.id, this.val());
      params.callback.bind(this)();
    };
  }
  createHtmlControl(id, name, value) {
    const html = [];
    html.push(`<div class="control" id="${id}-control">`);
    html.push(`
      <input id="${id}" value="${value}"/>
      <button id="${id}-button">Update</button>
      ${name}
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
    return this.value;
  }
  val() {
    return this.value;
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

// src/pixmap.ts
var Color = class {
  #r;
  #g;
  #b;
  #a;
  constructor(r, g, b, a) {
    this.#r = r;
    this.#g = g;
    this.#b = b;
    this.#a = a;
  }
  toString() {
    return "rgba(" + Math.round(this.#r) + "," + Math.round(this.#g) + "," + Math.round(this.#b) + "," + Math.round(this.#a) + ")";
  }
  isWhite() {
    return this.#r + this.#g + this.#b >= 3 * 255;
  }
  brightness() {
    return 0.2126 * this.#r + 0.7152 * this.#g + 0.0722 * this.#b;
  }
};
var Pixmap = class {
  canvas;
  width;
  height;
  context;
  constructor(canvas) {
    this.canvas = canvas;
    this.width = this.canvas.width;
    this.height = this.canvas.height;
  }
  colorAverageAt(x, y, radius) {
    const xi = Math.floor(x);
    const yi = Math.floor(y);
    let index;
    let resultR = 0, resultG = 0, resultB = 0;
    let count = 0;
    for (let i = -radius; i <= radius; i++) {
      for (let j = -radius; j <= radius; j++) {
        if (xi + i >= 0 && xi + i < this.width && yi + j >= 0 && yi + j < this.height) {
          count++;
          index = 4 * (xi + i + this.width * (yi + j));
          if (this.canvas.data[index + 3] === 0) {
            resultR += 255;
            resultG += 255;
            resultB += 255;
          } else {
            resultR += this.canvas.data[index];
            resultG += this.canvas.data[index + 1];
            resultB += this.canvas.data[index + 2];
          }
        }
      }
    }
    if (count === 0) {
      return new Color(255, 255, 255, 1);
    } else {
      return new Color(resultR / count, resultG / count, resultB / count, 1);
    }
  }
  brightnessAverageAt(x, y, radius) {
    return this.colorAverageAt(x, y, radius).brightness();
  }
  colorAt(x, y) {
    const xi = Math.floor(x);
    const yi = Math.floor(y);
    let index;
    let resultR = 0, resultG = 0, resultB = 0;
    if (xi >= 0 && xi < this.width && yi >= 0 && yi < this.height) {
      index = 4 * (xi + this.width * yi);
      if (this.canvas.data[index + 3] === 0) {
        resultR = 255;
        resultG = 255;
        resultB = 255;
      } else {
        resultR = this.canvas.data[index];
        resultG = this.canvas.data[index + 1];
        resultB = this.canvas.data[index + 2];
      }
      return new Color(resultR, resultG, resultB, 1);
    } else {
      return new Color(255, 255, 255, 1);
    }
  }
  brightnessAt(x, y) {
    return this.colorAt(x, y).brightness();
  }
  gradientAt(x, y) {
    if (x < 1 || x > this.width - 2 || y < 1 || y > this.height - 2) {
      return [0, 0];
    }
    const xi = Math.floor(x);
    const yi = Math.floor(y);
    const sobelX = [
      [-1, 0, 1],
      [-2, 0, 2],
      [-1, 0, 1]
    ];
    const sobelY = [
      [-1, -2, -1],
      [0, 0, 0],
      [1, 2, 1]
    ];
    let gx = 0;
    let gy = 0;
    for (let i = -1; i <= 1; i++) {
      for (let j = -1; j <= 1; j++) {
        const brightness = this.brightnessAt(xi + i, yi + j);
        gx += brightness * sobelX[i + 1][j + 1];
        gy += brightness * sobelY[i + 1][j + 1];
      }
    }
    return [gx, gy];
  }
};

// src/excoffizer.ts
var Excoffizer = class {
  #params;
  #inputPixmap;
  #wiggleFrequency;
  #wiggleAmplitude;
  #blur;
  #outputWidth;
  #cutoff;
  #style;
  constructor(params, inputCanvas) {
    this.#params = params;
    this.#params.tx = 1;
    this.#params.ty = 1;
    const ctx = inputCanvas.getContext("2d");
    const imageData = ctx.getImageData(0, 0, inputCanvas.width, inputCanvas.height);
    this.#inputPixmap = new Pixmap(imageData);
    this.#wiggleFrequency = this.#params.waviness / 100;
    this.#wiggleAmplitude = this.#wiggleFrequency === 0 ? 0 : 0.5 / this.#wiggleFrequency;
    this.#blur = params.blur;
    this.#outputWidth = 800;
    this.#cutoff = params.cutoff;
    this.#style = params.style;
  }
  excoffize() {
    return this.#excoffize();
  }
  // private
  #wiggle(x) {
    return this.#wiggleAmplitude * Math.sin(x * this.#wiggleFrequency);
  }
  #S2P({ x, y }) {
    const c = Math.cos(this.#params.theta);
    const s = Math.sin(this.#params.theta);
    const sx = this.#params.sx;
    const sy = this.#params.sy;
    const tx = this.#params.tx;
    const ty = this.#params.ty;
    return {
      x: x * sx * c - y * sy * s + tx * sx * c - ty * sy * s,
      y: x * sx * s + y * sy * c + tx * sx * s + ty * sy * c
    };
  }
  #P2S({ x, y }) {
    const c = Math.cos(-this.#params.theta);
    const s = Math.sin(-this.#params.theta);
    const sx = 1 / this.#params.sx;
    const sy = 1 / this.#params.sy;
    const tx = -this.#params.tx;
    const ty = -this.#params.ty;
    return {
      x: x * sx * c - y * sx * s + tx,
      y: x * sy * s + y * sy * c + ty
    };
  }
  #sidePoints(p1, p2, r) {
    const L = Math.sqrt((p2.x - p1.x) * (p2.x - p1.x) + (p2.y - p1.y) * (p2.y - p1.y));
    const px = (p2.x - p1.x) * r / L;
    const py = (p2.y - p1.y) * r / L;
    return [
      { x: p1.x - py - px / 20, y: p1.y + px - py / 20 },
      { x: p1.x + py - px / 20, y: p1.y - px - py / 20 }
    ];
  }
  /*
  #poly2path(polygon) {
    if (polygon.length > 4) {
      const m = `M${polygon[0].x} ${polygon[0].y}`;
      polygon.shift();
      const l = polygon.map(point => ` L ${point.x} ${point.y}`).join(' ');
      return `<path d="${m} ${l}"/>\n`;
    } else {
      return '';
    }
  }
     */
  #poly2pathSmooth(polygon) {
    if (polygon.length > 4) {
      const ps = [];
      for (let i = 0; i < polygon.length - 1; i++) {
        ps.push(polygon[i]);
        ps.push({ x: (polygon[i].x + polygon[i + 1].x) / 2, y: (polygon[i].y + polygon[i + 1].y) / 2 });
      }
      ps.push(polygon[polygon.length - 1]);
      let d = `M ${ps[0].x} ${ps[0].y} L ${ps[1].x} ${ps[1].y}`;
      for (let i = 2; i < ps.length - 1; i += 2) {
        d = d + `C ${ps[i].x} ${ps[i].y}, ${ps[i].x} ${ps[i].y}, ${ps[i + 1].x} ${ps[i + 1].y} `;
      }
      return `<path d="${d}"/>
`;
    } else {
      return "";
    }
  }
  #excoffize() {
    const inputWidth = this.#inputPixmap.width;
    const inputHeight = this.#inputPixmap.height;
    const outputWidth = this.#outputWidth;
    const outputHeight = this.#outputWidth * inputHeight / inputWidth;
    const lineHeight = this.#params.lineHeight;
    const thickness = this.#params.thickness;
    const margin = this.#params.margin;
    const density = this.#params.density;
    let outputSvg = `
    <svg id="svg-canvas" width="${outputWidth}" height="${outputHeight}" viewBox="${-margin} ${-margin} ${outputWidth + 2 * margin} ${outputHeight + 2 * margin}" xmlns="http://www.w3.org/2000/svg">
      <desc>
        Made by excoffizer
        Params:
        - waviness: ${this.#params.waviness}
        - theta: ${this.#params.theta}
        - blur: ${this.#blur}
        - cutoff: ${this.#cutoff}
        - line height: ${this.#params.lineHeight}
        - thickness: ${this.#params.thickness}
        - density: ${this.#params.density}
        - margin: ${this.#params.margin}
        - sx: ${this.#params.sx}
        - sy: ${this.#params.sy}
        - tx: ${this.#params.tx}
        - ty: ${this.#params.ty}
      </desc>
        <g style="${this.#style}">
    `;
    const corner1 = this.#P2S({ x: 0, y: 0 });
    const corner2 = this.#P2S({ x: inputWidth, y: 0 });
    const corner3 = this.#P2S({ x: inputWidth, y: inputHeight });
    const corner4 = this.#P2S({ x: 0, y: inputHeight });
    const minX = Math.min(corner1.x, corner2.x, corner3.x, corner4.x);
    const minY = Math.min(corner1.y, corner2.y, corner3.y, corner4.y);
    const maxX = Math.max(corner1.x, corner2.x, corner3.x, corner4.x);
    const maxY = Math.max(corner1.y, corner2.y, corner3.y, corner4.y);
    let stepx = density;
    const stepy = lineHeight;
    for (let y = minY - this.#wiggleAmplitude; y < maxY + this.#wiggleAmplitude; y += stepy) {
      const hatchPoints2 = [];
      let counter = 0;
      for (let x = minX; x < maxX; x += stepx) {
        const p = this.#S2P({ x, y: y + this.#wiggle(x) });
        const p2 = this.#S2P({ x: x + stepx, y: y + this.#wiggle(x + stepx) });
        if (p.x >= 0 && p.x < inputWidth && p.y >= 0 && p.y < inputHeight || p2.x >= 0 && p2.x < inputWidth && p2.y >= 0 && p2.y < inputHeight) {
          const imageLevel = this.#inputPixmap.brightnessAverageAt(Math.floor(p.x), Math.floor(p.y), this.#blur);
          const radius = thickness * (1 - imageLevel / 255) / 3 - 0.05;
          const zoom = outputWidth / inputWidth;
          if (radius < this.#cutoff) {
            p.x *= zoom;
            p.y *= zoom;
            hatchPoints2.push(p);
            stepx = 1.5;
          } else {
            const [sidePoint1, sidePoint2] = this.#sidePoints(p, p2, radius);
            sidePoint1.x *= zoom;
            sidePoint1.y *= zoom;
            sidePoint2.x *= zoom;
            sidePoint2.y *= zoom;
            if (counter++ % 2) {
              hatchPoints2.push(sidePoint2);
            } else {
              hatchPoints2.push(sidePoint1);
            }
            stepx = Math.max(0.3, density - radius);
          }
        }
      }
      outputSvg += this.#poly2pathSmooth(hatchPoints2);
    }
    outputSvg += `</g></svg>`;
    return outputSvg;
  }
};
var defaultParams = {
  inputImageUrl: "portrait.jpg",
  theta: 3.58,
  width: 800,
  height: 800,
  margin: 10,
  waviness: 3.1,
  lineHeight: 3.4,
  thickness: 3.1,
  density: 1.6,
  sx: 1,
  sy: 1,
  tx: 1,
  ty: 1,
  blur: 1,
  cutoff: 0.5,
  style: "stroke: black; stroke-width: 1; fill: none"
};
var render = () => {
  const params = getParams(defaultParams);
  params["width"] ||= 800;
  params["height"] ||= 800;
  const canvas = imageSourceControl.canvas();
  const excoffizator = new Excoffizer(params, canvas);
  $("canvas").innerHTML = excoffizator.excoffize();
};
new NumberControl("margin", {
  name: "Margin",
  value: defaultParams["margin"],
  callback: render,
  min: 0,
  max: 500
});
new TextControl("style", {
  name: "CSS Style",
  value: defaultParams["style"],
  callback: render
});
new NumberControl("theta", {
  name: "Angle",
  value: defaultParams["theta"],
  callback: render,
  min: 0,
  max: 6.28,
  step: 0.01
});
new NumberControl("waviness", {
  name: "Waviness",
  value: defaultParams["waviness"],
  callback: render,
  min: 0,
  max: 10,
  step: 0.1
});
new NumberControl("lineHeight", {
  name: "Line height",
  value: defaultParams["lineHeight"],
  callback: render,
  min: 1,
  max: 15,
  step: 0.1
});
new NumberControl("density", {
  name: "Density",
  value: defaultParams["density"],
  callback: render,
  min: 1,
  max: 4,
  step: 0.1
});
new NumberControl("thickness", {
  name: "Thickness",
  value: defaultParams["thickness"],
  callback: render,
  min: 1,
  max: 10,
  step: 0.1
});
new NumberControl("sx", {
  name: "Stretch X",
  value: defaultParams["sx"],
  callback: render,
  min: 0,
  max: 2,
  step: 0.01
});
new NumberControl("sy", {
  name: "Stretch Y",
  value: defaultParams["sy"],
  callback: render,
  min: 0,
  max: 2,
  step: 0.01
});
new NumberControl("blur", {
  name: "Blur",
  value: defaultParams["blur"],
  callback: render,
  min: 1,
  max: 10
});
new NumberControl("cutoff", {
  name: "White cutoff",
  value: defaultParams["cutoff"],
  callback: render,
  min: 0.1,
  max: 1,
  step: 0.01
});
new SvgSaveControl("svgSave", {
  canvasId: "svg-canvas",
  name: "Save SVG",
  saveFilename: "excoffizer.svg"
});
var imageSourceControl = new ImageInputControl("imageSource", {
  name: "Source",
  callback: render,
  initialImage: "tbl.png",
  updateUrl: false
});
