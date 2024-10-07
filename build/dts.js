"use strict";
(() => {
  var __create = Object.create;
  var __defProp = Object.defineProperty;
  var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
  var __getOwnPropNames = Object.getOwnPropertyNames;
  var __getProtoOf = Object.getPrototypeOf;
  var __hasOwnProp = Object.prototype.hasOwnProperty;
  var __commonJS = (cb, mod) => function __require() {
    return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
  };
  var __copyProps = (to, from, except, desc) => {
    if (from && typeof from === "object" || typeof from === "function") {
      for (let key of __getOwnPropNames(from))
        if (!__hasOwnProp.call(to, key) && key !== except)
          __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
    }
    return to;
  };
  var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
    // If the importer is in node compatibility mode or this is not an ESM
    // file that has been converted to a CommonJS file using a Babel-
    // compatible transform (i.e. "__esModule" has not been set), then set
    // "default" to the CommonJS "module.exports" for node compatibility.
    isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
    mod
  ));

  // node_modules/@wemap/salesman.js/salesman.js
  var require_salesman = __commonJS({
    "node_modules/@wemap/salesman.js/salesman.js"(exports, module) {
      function Path(points, distanceFunc) {
        this.points = points;
        this.distanceFunc = distanceFunc;
        this.initializeOrder();
        this.initializeDistances();
      }
      Path.prototype.initializeOrder = function() {
        this.order = new Array(this.points.length);
        for (var i = 0; i < this.order.length; i++) this.order[i] = i;
      };
      Path.prototype.initializeDistances = function() {
        this.distances = new Array(this.points.length * this.points.length);
        for (var i = 0; i < this.points.length; i++) {
          for (var j = i + 1; j < this.points.length; j++) {
            this.distances[j + i * this.points.length] = this.distanceFunc(this.points[i], this.points[j]);
          }
        }
      };
      Path.prototype.change = function(temp) {
        var i = this.randomPos(), j = this.randomPos();
        var delta = this.delta_distance(i, j);
        if (delta < 0 || Math.random() < Math.exp(-delta / temp)) {
          this.swap(i, j);
        }
      };
      Path.prototype.swap = function(i, j) {
        var tmp = this.order[i];
        this.order[i] = this.order[j];
        this.order[j] = tmp;
      };
      Path.prototype.delta_distance = function(i, j) {
        var jm1 = this.index(j - 1), jp1 = this.index(j + 1), im1 = this.index(i - 1), ip1 = this.index(i + 1);
        var s = this.distance(jm1, i) + this.distance(i, jp1) + this.distance(im1, j) + this.distance(j, ip1) - this.distance(im1, i) - this.distance(i, ip1) - this.distance(jm1, j) - this.distance(j, jp1);
        if (jm1 === i || jp1 === i)
          s += 2 * this.distance(i, j);
        return s;
      };
      Path.prototype.index = function(i) {
        return (i + this.points.length) % this.points.length;
      };
      Path.prototype.access = function(i) {
        return this.points[this.order[this.index(i)]];
      };
      Path.prototype.distance = function(i, j) {
        if (i === j) return 0;
        var low = this.order[i], high = this.order[j];
        if (low > high) {
          low = this.order[j];
          high = this.order[i];
        }
        return this.distances[low * this.points.length + high] || 0;
      };
      Path.prototype.randomPos = function() {
        return 1 + Math.floor(Math.random() * (this.points.length - 1));
      };
      function Point2(x, y) {
        this.x = x;
        this.y = y;
      }
      function solve2(points, temp_coeff = 0.999, callback, distance = euclidean) {
        var path = new Path(points, distance);
        if (points.length < 2) return path.order;
        if (temp_coeff >= 1 || temp_coeff <= 0) return path.order;
        if (!temp_coeff)
          temp_coeff = 1 - Math.exp(-10 - Math.min(points.length, 1e6) / 1e5);
        var hasCallback = typeof callback === "function";
        for (var temperature = 100 * distance(path.access(0), path.access(1)); temperature > 1e-6; temperature *= temp_coeff) {
          path.change(temperature);
          if (hasCallback) callback(path.order);
        }
        return path.order;
      }
      function euclidean(p, q) {
        var dx = p.x - q.x, dy = p.y - q.y;
        return Math.sqrt(dx * dx + dy * dy);
      }
      if (typeof module === "object") {
        module.exports = {
          "solve": solve2,
          "Point": Point2
        };
      }
    }
  });

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
  var import_salesman = __toESM(require_salesman());
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
      for (let i = 0; i < 5e3; ++i) {
        for (let j = 0; j < 30; ++j) {
          const x = Math.floor(Math.random() * inputWidth);
          const y = Math.floor(Math.random() * inputHeight);
          const imageLevel = this.#inputPixmap.brightnessAt(Math.floor(x), Math.floor(y));
          if (200 * Math.random() > imageLevel) {
            const inputOutputScale = outputWidth / inputWidth;
            points.push(new import_salesman.Point(x * inputOutputScale, y * inputOutputScale));
            break;
          }
        }
      }
      const svgPoints = [];
      for (let i = 0; i < points.length; i++) {
        svgPoints.push(`<circle cx="${points[i].x}" cy="${points[i].y}" r="0.5"/>`);
      }
      const solution = (0, import_salesman.solve)(points, 0.9999);
      const svgPathD = solution.map((i) => `${points[i].x} ${points[i].y} L`);
      return `
      <svg id="svg-canvas" width="${outputWidth}" height="${outputHeight}" viewBox="0 0 ${outputWidth} ${outputHeight}">
        <g style="stroke: black; fill: black;">
          ${svgPoints.join("")}
        </g>
        <g style="stroke: black; fill: none;">
          <path d="M ${svgPathD.join("")}"/>
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
