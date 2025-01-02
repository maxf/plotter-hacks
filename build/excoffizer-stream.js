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
    constructor(params) {
      super(params);
      this.#createHtmlControl(params.name, params.label);
      this.#wrapperEl = document.getElementById(`${params.name}-control`);
      this.#videoEl = document.getElementById(`${params.name}-video`);
      this.#canvasEl = document.getElementById(`${params.name}-canvas`);
      this.#startButtonEl = document.getElementById(`${params.name}-start`);
      this.#callback = params.callback;
    }
    async pauseStreaming() {
      this.#videoEl.pause();
      this.#startButtonEl.innerText = "Restart";
      this.#startButtonEl.onclick = async () => this.restartStreaming();
    }
    async restartStreaming() {
      this.#videoEl.play();
      this.#startButtonEl.innerText = "Pause";
      this.#startButtonEl.onclick = async () => this.pauseStreaming();
    }
    async startStreaming() {
      const context = this.#canvasEl.getContext(
        "2d",
        { alpha: false, willReadFrequently: true }
      );
      if (!context) throw "Failed to get context";
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
      const renderFrame = () => {
        context.drawImage(this.#videoEl, 0, 0, this.#canvasEl.width, this.#canvasEl.height);
        this.#callback(context, this.#canvasEl.width, this.#canvasEl.height);
        requestAnimationFrame(renderFrame);
      };
      renderFrame();
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
    _pixels;
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

  // src/excoffizer-stream.ts
  var Excoffizer = class {
    #params;
    #inputPixmap;
    #wiggleFrequency;
    #wiggleAmplitude;
    #blur;
    #outputWidth;
    #cutoff;
    #style;
    constructor(params) {
      this.#params = params;
      this.#params.tx = 1;
      this.#params.ty = 1;
      const imageData = this.#params.context.getImageData(
        0,
        0,
        params.canvasWidth,
        params.canvasHeight
      );
      this.#inputPixmap = new Pixmap(imageData);
      this.#wiggleFrequency = this.#params.waviness / 100;
      this.#wiggleAmplitude = this.#wiggleFrequency === 0 ? 0 : 0.5 / this.#wiggleFrequency;
      this.#blur = params.blur;
      this.#outputWidth = params.width;
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
    theta: 3.58,
    width: 800,
    height: 800,
    canvasWidth: 100,
    canvasHeight: 100,
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
  var paramsFromWidgets = () => {
    const params = { ...defaultParams };
    params.theta = controlTheta.val();
    params.margin = controlMargin.val();
    params.waviness = controlWaviness.val();
    params.lineHeight = controlLineHeight.val();
    params.density = controlDensity.val();
    params.thickness = controlThickness.val();
    params.sx = controlSx.val();
    params.sy = controlSy.val();
    params.blur = controlBlur.val();
    params.cutoff = controlCutoff.val();
    params.style = controlStyle.val();
    return params;
  };
  var render = (params) => {
    if (!params) {
      params = paramsFromWidgets();
    }
    params.width ||= 800;
    params.height ||= 800;
    const excoffizator = new Excoffizer(params);
    delete params.inputCanvas;
    updateUrl(params);
    $("canvas").innerHTML = excoffizator.excoffize();
  };
  var controlMargin = new NumberControl({
    name: "margin",
    label: "Margin",
    value: defaultParams["margin"],
    renderFn: render,
    min: 0,
    max: 500
  });
  var controlStyle = new TextControl({
    name: "style",
    label: "CSS Style",
    value: defaultParams["style"],
    renderFn: render
  });
  var controlTheta = new NumberControl({
    name: "theta",
    label: "Angle",
    value: defaultParams["theta"],
    renderFn: render,
    min: 0,
    max: 6.28,
    step: 0.01
  });
  var controlWaviness = new NumberControl({
    name: "waviness",
    label: "Waviness",
    value: defaultParams["waviness"],
    renderFn: render,
    min: 0,
    max: 10,
    step: 0.1
  });
  var controlLineHeight = new NumberControl({
    name: "lineHeight",
    label: "Line height",
    value: defaultParams["lineHeight"],
    renderFn: render,
    min: 1,
    max: 15,
    step: 0.1
  });
  var controlDensity = new NumberControl({
    name: "density",
    label: "Density",
    value: defaultParams["density"],
    renderFn: render,
    min: 1,
    max: 4,
    step: 0.1
  });
  var controlThickness = new NumberControl({
    label: "Thickness",
    value: defaultParams["thickness"],
    renderFn: render,
    min: 1,
    max: 10,
    step: 0.1
  });
  var controlSx = new NumberControl({
    name: "sx",
    label: "Stretch X",
    value: defaultParams["sx"],
    renderFn: render,
    min: 0,
    max: 2,
    step: 0.01
  });
  var controlSy = new NumberControl({
    name: "sy",
    label: "Stretch Y",
    value: defaultParams["sy"],
    renderFn: render,
    min: 0,
    max: 2,
    step: 0.01
  });
  var controlBlur = new NumberControl({
    name: "blur",
    label: "Blur",
    value: defaultParams["blur"],
    renderFn: render,
    min: 1,
    max: 10
  });
  var controlCutoff = new NumberControl({
    name: "cutoff",
    label: "White cutoff",
    value: defaultParams["cutoff"],
    renderFn: render,
    min: 0.1,
    max: 1,
    step: 0.01
  });
  new SvgSaveControl({
    name: "svgSave",
    canvasId: "svg-canvas",
    label: "Save SVG",
    saveFilename: "excoffizer.svg"
  });
  new VideoStreamControl({
    name: "inputStream",
    label: "Stream",
    callback: (context, canvasWidth, canvasHeight) => {
      const params = paramsFromWidgets();
      params.context = context;
      params.canvasWidth = canvasWidth;
      params.canvasHeight = canvasHeight;
      const excoffizator = new Excoffizer(params);
      $("canvas").innerHTML = excoffizator.excoffize();
      delete params.context;
      updateUrl(params);
    }
  });
})();
