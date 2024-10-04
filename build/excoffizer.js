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

  // src/controls.ts
  var $ = (id) => document.getElementById(id);
  var NumberControl = class {
    #value;
    #wrapperEl;
    #widgetEl;
    #valueEl;
    constructor(params) {
      this.#value = params.value;
      this.#createHtmlControl(params.name, params.label, params.value, params.min, params.max, params.step);
      this.#widgetEl = $(params.name);
      this.#valueEl = $(`${params.name}-value`);
      this.#wrapperEl = $(`${params.name}-control`);
      this.#widgetEl.onchange = (event) => {
        this.#value = parseFloat(event.target.value);
        this.#valueEl.innerText = this.#value.toString();
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
      this.#value = newValue;
      this.#valueEl.innerText = newValue.toString();
    }
    val() {
      return this.#value;
    }
    show() {
      this.#wrapperEl.style.display = "block";
    }
    hide() {
      this.#wrapperEl.style.display = "none";
    }
  };
  var SvgSaveControl = class {
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
  var ImageUploadControl = class {
    #wrapperEl;
    #uploadEl;
    #canvasEl;
    #imageUrl;
    constructor(params) {
      this.#imageUrl = params.value;
      this.#createHtmlControl(params.name, params.label);
      this.#wrapperEl = document.getElementById(`${params.name}-control`);
      this.#uploadEl = document.getElementById(`${params.name}-upload`);
      this.#canvasEl = document.getElementById(`${params.name}-canvas`);
      this.loadImage(this.#imageUrl, () => {
        params.firstCallback(this);
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
      html.push(`${label} <input type="file" id="${name}-upload" accept="image/*">`);
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
      } else {
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
    canvasEl() {
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
      return (this.#r + this.#g + this.#b) / 3;
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
      this.context = this.canvas.getContext("2d");
      this._pixels = this.context.getImageData(0, 0, this.canvas.width, this.canvas.height).data;
    }
    colorAverageAt(x, y, radius) {
      let index;
      let resultR = 0, resultG = 0, resultB = 0;
      let count = 0;
      for (let i = -radius; i <= radius; i++) {
        for (let j = -radius; j <= radius; j++) {
          if (x + i >= 0 && x + i < this.width && y + j >= 0 && y + j < this.height) {
            count++;
            index = 4 * (x + i + this.width * (y + j));
            if (this._pixels[index + 3] === 0) {
              resultR += 255;
              resultG += 255;
              resultB += 255;
            } else {
              resultR += this._pixels[index];
              resultG += this._pixels[index + 1];
              resultB += this._pixels[index + 2];
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
    constructor(params) {
      this.#params = params;
      this.#params.tx = 1;
      this.#params.ty = 1;
      this.#inputPixmap = new Pixmap(params.inputCanvas);
      this.#wiggleFrequency = this.#params.waviness / 100;
      this.#wiggleAmplitude = this.#wiggleFrequency === 0 ? 0 : 0.5 / this.#wiggleFrequency;
      this.#blur = params.blur;
      this.#outputWidth = params.width;
      this.#cutoff = params.cutoff;
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
      <g stroke="black" stroke-width="1" fill="none">
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
            const radius = thickness * (1 - imageLevel / 300) / 2 - 0.05;
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
              stepx = Math.max(0.2, density - radius);
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
    cutoff: 0.5
  };
  var paramsFromWidgets = () => {
    const params = { ...defaultParams };
    if (controlInputImage) {
      params.inputImageUrl = controlInputImage.imageUrl();
      params.inputCanvas = controlInputImage.canvasEl();
    }
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
  var controlInputImage = new ImageUploadControl({
    name: "inputImage",
    label: "Image",
    value: defaultParams["inputImageUrl"],
    firstCallback: (instance) => {
      const params = paramsFromUrl(defaultParams);
      controlTheta.set(params.theta);
      controlMargin.set(params.margin);
      controlWaviness.set(params.waviness);
      controlLineHeight.set(params.lineHeight);
      controlDensity.set(params.density);
      controlThickness.set(params.thickness);
      controlCutoff.set(params.cutoff);
      controlSx.set(params.sx);
      controlSy.set(params.sy);
      controlBlur.set(params.blur);
      params.inputCanvas = instance.canvasEl();
      const excoffizator = new Excoffizer(params);
      $("canvas").innerHTML = excoffizator.excoffize();
      delete params.inputCanvas;
      updateUrl(params);
    },
    callback: (instance) => {
      const params = paramsFromWidgets();
      params.inputCanvas = instance.canvasEl();
      const excoffizator = new Excoffizer(params);
      $("canvas").innerHTML = excoffizator.excoffize();
      delete params.inputCanvas;
      updateUrl(params);
    }
  });
})();
