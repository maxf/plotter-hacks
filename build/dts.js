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
    colorAt(x, y) {
      let index;
      let resultR = 0, resultG = 0, resultB = 0;
      if (x >= 0 && x < this.width && y >= 0 && y < this.height) {
        index = 4 * (x + this.width * y);
        if (this._pixels[index + 3] === 0) {
          resultR = 255;
          resultG = 255;
          resultB = 255;
        } else {
          resultR = this._pixels[index];
          resultG = this._pixels[index + 1];
          resultB = this._pixels[index + 2];
        }
        return new Color(resultR, resultG, resultB, 1);
      } else {
        return new Color(255, 255, 255, 1);
      }
    }
    brightnessAt(x, y) {
      return this.colorAt(x, y).brightness();
    }
  };

  // src/dts.ts
  var DrunkTravellingSalesman = class {
    #params;
    #inputPixmap;
    #outputWidth;
    constructor(params) {
      this.#params = params;
      this.#inputPixmap = new Pixmap(this.#params.inputCanvas);
      this.#outputWidth = params.width;
    }
    // TODO: make async
    toSvg() {
      const points = [];
      const inputWidth = this.#inputPixmap.width;
      const inputHeight = this.#inputPixmap.height;
      const outputWidth = this.#outputWidth;
      const outputHeight = this.#outputWidth * inputHeight / inputWidth;
      for (let i = 0; i < 1e4; ++i) {
        for (let j = 0; j < 30; ++j) {
          const x = Math.floor(Math.random() * inputWidth);
          const y = Math.floor(Math.random() * inputHeight);
          const imageLevel = this.#inputPixmap.brightnessAt(Math.floor(x), Math.floor(y));
          if (200 * Math.random() > imageLevel) {
            const inputOutputScale = outputWidth / inputWidth;
            points.push(x * inputOutputScale);
            points.push(y * inputOutputScale);
            break;
          }
        }
      }
      const svgPoints = [];
      for (let i = 0; i < points.length / 3; i++) {
        svgPoints.push(`<circle cx="${points[i * 2]}" cy="${points[i * 2 + 1]}" r="0.5"/>`);
      }
      return `
      <svg id="svg-canvas" width="${outputWidth}" height="${outputHeight}" viewBox="0 0 ${outputWidth} ${outputHeight}">
        <g style="stroke: black; fill: black;">
          ${svgPoints.join("")}
        </g>
      </svg>
    `;
    }
  };
  var defaultParams = {
    inputImageUrl: "portrait.jpg",
    width: 800,
    height: 800
  };
  var paramsFromWidgets = () => {
    const params = { ...defaultParams };
    return params;
  };
  new SvgSaveControl({
    name: "svgSave",
    canvasId: "svg-canvas",
    label: "Save SVG",
    saveFilename: "dts.svg"
  });
  new ImageUploadControl({
    name: "inputImage",
    label: "Image",
    value: defaultParams["inputImageUrl"],
    firstCallback: (instance) => {
      const params = paramsFromUrl(defaultParams);
      params.inputCanvas = instance.canvasEl();
      const dts = new DrunkTravellingSalesman(params);
      $("canvas").innerHTML = dts.toSvg();
      delete params.inputCanvas;
      updateUrl(params);
    },
    callback: (instance) => {
      const params = paramsFromWidgets();
      params.inputCanvas = instance.canvasEl();
      const dts = new DrunkTravellingSalesman(params);
      $("canvas").innerHTML = dts.toSvg();
      delete params.inputCanvas;
      updateUrl(params);
    }
  });
})();
