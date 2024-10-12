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
      this.#widgetEl.value = newValue.toString();
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
    constructor(canvas2) {
      this.canvas = canvas2;
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

  // node_modules/robust-predicates/esm/util.js
  var epsilon = 11102230246251565e-32;
  var splitter = 134217729;
  var resulterrbound = (3 + 8 * epsilon) * epsilon;
  function sum(elen, e, flen, f, h) {
    let Q, Qnew, hh, bvirt;
    let enow = e[0];
    let fnow = f[0];
    let eindex = 0;
    let findex = 0;
    if (fnow > enow === fnow > -enow) {
      Q = enow;
      enow = e[++eindex];
    } else {
      Q = fnow;
      fnow = f[++findex];
    }
    let hindex = 0;
    if (eindex < elen && findex < flen) {
      if (fnow > enow === fnow > -enow) {
        Qnew = enow + Q;
        hh = Q - (Qnew - enow);
        enow = e[++eindex];
      } else {
        Qnew = fnow + Q;
        hh = Q - (Qnew - fnow);
        fnow = f[++findex];
      }
      Q = Qnew;
      if (hh !== 0) {
        h[hindex++] = hh;
      }
      while (eindex < elen && findex < flen) {
        if (fnow > enow === fnow > -enow) {
          Qnew = Q + enow;
          bvirt = Qnew - Q;
          hh = Q - (Qnew - bvirt) + (enow - bvirt);
          enow = e[++eindex];
        } else {
          Qnew = Q + fnow;
          bvirt = Qnew - Q;
          hh = Q - (Qnew - bvirt) + (fnow - bvirt);
          fnow = f[++findex];
        }
        Q = Qnew;
        if (hh !== 0) {
          h[hindex++] = hh;
        }
      }
    }
    while (eindex < elen) {
      Qnew = Q + enow;
      bvirt = Qnew - Q;
      hh = Q - (Qnew - bvirt) + (enow - bvirt);
      enow = e[++eindex];
      Q = Qnew;
      if (hh !== 0) {
        h[hindex++] = hh;
      }
    }
    while (findex < flen) {
      Qnew = Q + fnow;
      bvirt = Qnew - Q;
      hh = Q - (Qnew - bvirt) + (fnow - bvirt);
      fnow = f[++findex];
      Q = Qnew;
      if (hh !== 0) {
        h[hindex++] = hh;
      }
    }
    if (Q !== 0 || hindex === 0) {
      h[hindex++] = Q;
    }
    return hindex;
  }
  function estimate(elen, e) {
    let Q = e[0];
    for (let i = 1; i < elen; i++) Q += e[i];
    return Q;
  }
  function vec(n) {
    return new Float64Array(n);
  }

  // node_modules/robust-predicates/esm/orient2d.js
  var ccwerrboundA = (3 + 16 * epsilon) * epsilon;
  var ccwerrboundB = (2 + 12 * epsilon) * epsilon;
  var ccwerrboundC = (9 + 64 * epsilon) * epsilon * epsilon;
  var B = vec(4);
  var C1 = vec(8);
  var C2 = vec(12);
  var D = vec(16);
  var u = vec(4);
  function orient2dadapt(ax, ay, bx, by, cx, cy, detsum) {
    let acxtail, acytail, bcxtail, bcytail;
    let bvirt, c, ahi, alo, bhi, blo, _i, _j, _0, s1, s0, t1, t0, u32;
    const acx = ax - cx;
    const bcx = bx - cx;
    const acy = ay - cy;
    const bcy = by - cy;
    s1 = acx * bcy;
    c = splitter * acx;
    ahi = c - (c - acx);
    alo = acx - ahi;
    c = splitter * bcy;
    bhi = c - (c - bcy);
    blo = bcy - bhi;
    s0 = alo * blo - (s1 - ahi * bhi - alo * bhi - ahi * blo);
    t1 = acy * bcx;
    c = splitter * acy;
    ahi = c - (c - acy);
    alo = acy - ahi;
    c = splitter * bcx;
    bhi = c - (c - bcx);
    blo = bcx - bhi;
    t0 = alo * blo - (t1 - ahi * bhi - alo * bhi - ahi * blo);
    _i = s0 - t0;
    bvirt = s0 - _i;
    B[0] = s0 - (_i + bvirt) + (bvirt - t0);
    _j = s1 + _i;
    bvirt = _j - s1;
    _0 = s1 - (_j - bvirt) + (_i - bvirt);
    _i = _0 - t1;
    bvirt = _0 - _i;
    B[1] = _0 - (_i + bvirt) + (bvirt - t1);
    u32 = _j + _i;
    bvirt = u32 - _j;
    B[2] = _j - (u32 - bvirt) + (_i - bvirt);
    B[3] = u32;
    let det = estimate(4, B);
    let errbound = ccwerrboundB * detsum;
    if (det >= errbound || -det >= errbound) {
      return det;
    }
    bvirt = ax - acx;
    acxtail = ax - (acx + bvirt) + (bvirt - cx);
    bvirt = bx - bcx;
    bcxtail = bx - (bcx + bvirt) + (bvirt - cx);
    bvirt = ay - acy;
    acytail = ay - (acy + bvirt) + (bvirt - cy);
    bvirt = by - bcy;
    bcytail = by - (bcy + bvirt) + (bvirt - cy);
    if (acxtail === 0 && acytail === 0 && bcxtail === 0 && bcytail === 0) {
      return det;
    }
    errbound = ccwerrboundC * detsum + resulterrbound * Math.abs(det);
    det += acx * bcytail + bcy * acxtail - (acy * bcxtail + bcx * acytail);
    if (det >= errbound || -det >= errbound) return det;
    s1 = acxtail * bcy;
    c = splitter * acxtail;
    ahi = c - (c - acxtail);
    alo = acxtail - ahi;
    c = splitter * bcy;
    bhi = c - (c - bcy);
    blo = bcy - bhi;
    s0 = alo * blo - (s1 - ahi * bhi - alo * bhi - ahi * blo);
    t1 = acytail * bcx;
    c = splitter * acytail;
    ahi = c - (c - acytail);
    alo = acytail - ahi;
    c = splitter * bcx;
    bhi = c - (c - bcx);
    blo = bcx - bhi;
    t0 = alo * blo - (t1 - ahi * bhi - alo * bhi - ahi * blo);
    _i = s0 - t0;
    bvirt = s0 - _i;
    u[0] = s0 - (_i + bvirt) + (bvirt - t0);
    _j = s1 + _i;
    bvirt = _j - s1;
    _0 = s1 - (_j - bvirt) + (_i - bvirt);
    _i = _0 - t1;
    bvirt = _0 - _i;
    u[1] = _0 - (_i + bvirt) + (bvirt - t1);
    u32 = _j + _i;
    bvirt = u32 - _j;
    u[2] = _j - (u32 - bvirt) + (_i - bvirt);
    u[3] = u32;
    const C1len = sum(4, B, 4, u, C1);
    s1 = acx * bcytail;
    c = splitter * acx;
    ahi = c - (c - acx);
    alo = acx - ahi;
    c = splitter * bcytail;
    bhi = c - (c - bcytail);
    blo = bcytail - bhi;
    s0 = alo * blo - (s1 - ahi * bhi - alo * bhi - ahi * blo);
    t1 = acy * bcxtail;
    c = splitter * acy;
    ahi = c - (c - acy);
    alo = acy - ahi;
    c = splitter * bcxtail;
    bhi = c - (c - bcxtail);
    blo = bcxtail - bhi;
    t0 = alo * blo - (t1 - ahi * bhi - alo * bhi - ahi * blo);
    _i = s0 - t0;
    bvirt = s0 - _i;
    u[0] = s0 - (_i + bvirt) + (bvirt - t0);
    _j = s1 + _i;
    bvirt = _j - s1;
    _0 = s1 - (_j - bvirt) + (_i - bvirt);
    _i = _0 - t1;
    bvirt = _0 - _i;
    u[1] = _0 - (_i + bvirt) + (bvirt - t1);
    u32 = _j + _i;
    bvirt = u32 - _j;
    u[2] = _j - (u32 - bvirt) + (_i - bvirt);
    u[3] = u32;
    const C2len = sum(C1len, C1, 4, u, C2);
    s1 = acxtail * bcytail;
    c = splitter * acxtail;
    ahi = c - (c - acxtail);
    alo = acxtail - ahi;
    c = splitter * bcytail;
    bhi = c - (c - bcytail);
    blo = bcytail - bhi;
    s0 = alo * blo - (s1 - ahi * bhi - alo * bhi - ahi * blo);
    t1 = acytail * bcxtail;
    c = splitter * acytail;
    ahi = c - (c - acytail);
    alo = acytail - ahi;
    c = splitter * bcxtail;
    bhi = c - (c - bcxtail);
    blo = bcxtail - bhi;
    t0 = alo * blo - (t1 - ahi * bhi - alo * bhi - ahi * blo);
    _i = s0 - t0;
    bvirt = s0 - _i;
    u[0] = s0 - (_i + bvirt) + (bvirt - t0);
    _j = s1 + _i;
    bvirt = _j - s1;
    _0 = s1 - (_j - bvirt) + (_i - bvirt);
    _i = _0 - t1;
    bvirt = _0 - _i;
    u[1] = _0 - (_i + bvirt) + (bvirt - t1);
    u32 = _j + _i;
    bvirt = u32 - _j;
    u[2] = _j - (u32 - bvirt) + (_i - bvirt);
    u[3] = u32;
    const Dlen = sum(C2len, C2, 4, u, D);
    return D[Dlen - 1];
  }
  function orient2d(ax, ay, bx, by, cx, cy) {
    const detleft = (ay - cy) * (bx - cx);
    const detright = (ax - cx) * (by - cy);
    const det = detleft - detright;
    const detsum = Math.abs(detleft + detright);
    if (Math.abs(det) >= ccwerrboundA * detsum) return det;
    return -orient2dadapt(ax, ay, bx, by, cx, cy, detsum);
  }

  // node_modules/robust-predicates/esm/orient3d.js
  var o3derrboundA = (7 + 56 * epsilon) * epsilon;
  var o3derrboundB = (3 + 28 * epsilon) * epsilon;
  var o3derrboundC = (26 + 288 * epsilon) * epsilon * epsilon;
  var bc = vec(4);
  var ca = vec(4);
  var ab = vec(4);
  var at_b = vec(4);
  var at_c = vec(4);
  var bt_c = vec(4);
  var bt_a = vec(4);
  var ct_a = vec(4);
  var ct_b = vec(4);
  var bct = vec(8);
  var cat = vec(8);
  var abt = vec(8);
  var u2 = vec(4);
  var _8 = vec(8);
  var _8b = vec(8);
  var _16 = vec(8);
  var _12 = vec(12);
  var fin = vec(192);
  var fin2 = vec(192);

  // node_modules/robust-predicates/esm/incircle.js
  var iccerrboundA = (10 + 96 * epsilon) * epsilon;
  var iccerrboundB = (4 + 48 * epsilon) * epsilon;
  var iccerrboundC = (44 + 576 * epsilon) * epsilon * epsilon;
  var bc2 = vec(4);
  var ca2 = vec(4);
  var ab2 = vec(4);
  var aa = vec(4);
  var bb = vec(4);
  var cc = vec(4);
  var u3 = vec(4);
  var v = vec(4);
  var axtbc = vec(8);
  var aytbc = vec(8);
  var bxtca = vec(8);
  var bytca = vec(8);
  var cxtab = vec(8);
  var cytab = vec(8);
  var abt2 = vec(8);
  var bct2 = vec(8);
  var cat2 = vec(8);
  var abtt = vec(4);
  var bctt = vec(4);
  var catt = vec(4);
  var _82 = vec(8);
  var _162 = vec(16);
  var _16b = vec(16);
  var _16c = vec(16);
  var _32 = vec(32);
  var _32b = vec(32);
  var _48 = vec(48);
  var _64 = vec(64);
  var fin3 = vec(1152);
  var fin22 = vec(1152);

  // node_modules/robust-predicates/esm/insphere.js
  var isperrboundA = (16 + 224 * epsilon) * epsilon;
  var isperrboundB = (5 + 72 * epsilon) * epsilon;
  var isperrboundC = (71 + 1408 * epsilon) * epsilon * epsilon;
  var ab3 = vec(4);
  var bc3 = vec(4);
  var cd = vec(4);
  var de = vec(4);
  var ea = vec(4);
  var ac = vec(4);
  var bd = vec(4);
  var ce = vec(4);
  var da = vec(4);
  var eb = vec(4);
  var abc = vec(24);
  var bcd = vec(24);
  var cde = vec(24);
  var dea = vec(24);
  var eab = vec(24);
  var abd = vec(24);
  var bce = vec(24);
  var cda = vec(24);
  var deb = vec(24);
  var eac = vec(24);
  var adet = vec(1152);
  var bdet = vec(1152);
  var cdet = vec(1152);
  var ddet = vec(1152);
  var edet = vec(1152);
  var abdet = vec(2304);
  var cddet = vec(2304);
  var cdedet = vec(3456);
  var deter = vec(5760);
  var _83 = vec(8);
  var _8b2 = vec(8);
  var _8c = vec(8);
  var _163 = vec(16);
  var _24 = vec(24);
  var _482 = vec(48);
  var _48b = vec(48);
  var _96 = vec(96);
  var _192 = vec(192);
  var _384x = vec(384);
  var _384y = vec(384);
  var _384z = vec(384);
  var _768 = vec(768);
  var xdet = vec(96);
  var ydet = vec(96);
  var zdet = vec(96);
  var fin4 = vec(1152);

  // node_modules/delaunator/index.js
  var EPSILON = Math.pow(2, -52);
  var EDGE_STACK = new Uint32Array(512);
  var Delaunator = class _Delaunator {
    static from(points, getX = defaultGetX, getY = defaultGetY) {
      const n = points.length;
      const coords = new Float64Array(n * 2);
      for (let i = 0; i < n; i++) {
        const p = points[i];
        coords[2 * i] = getX(p);
        coords[2 * i + 1] = getY(p);
      }
      return new _Delaunator(coords);
    }
    constructor(coords) {
      const n = coords.length >> 1;
      if (n > 0 && typeof coords[0] !== "number") throw new Error("Expected coords to contain numbers.");
      this.coords = coords;
      const maxTriangles = Math.max(2 * n - 5, 0);
      this._triangles = new Uint32Array(maxTriangles * 3);
      this._halfedges = new Int32Array(maxTriangles * 3);
      this._hashSize = Math.ceil(Math.sqrt(n));
      this._hullPrev = new Uint32Array(n);
      this._hullNext = new Uint32Array(n);
      this._hullTri = new Uint32Array(n);
      this._hullHash = new Int32Array(this._hashSize);
      this._ids = new Uint32Array(n);
      this._dists = new Float64Array(n);
      this.update();
    }
    update() {
      const { coords, _hullPrev: hullPrev, _hullNext: hullNext, _hullTri: hullTri, _hullHash: hullHash } = this;
      const n = coords.length >> 1;
      let minX = Infinity;
      let minY = Infinity;
      let maxX = -Infinity;
      let maxY = -Infinity;
      for (let i = 0; i < n; i++) {
        const x = coords[2 * i];
        const y = coords[2 * i + 1];
        if (x < minX) minX = x;
        if (y < minY) minY = y;
        if (x > maxX) maxX = x;
        if (y > maxY) maxY = y;
        this._ids[i] = i;
      }
      const cx = (minX + maxX) / 2;
      const cy = (minY + maxY) / 2;
      let i0, i1, i2;
      for (let i = 0, minDist = Infinity; i < n; i++) {
        const d = dist(cx, cy, coords[2 * i], coords[2 * i + 1]);
        if (d < minDist) {
          i0 = i;
          minDist = d;
        }
      }
      const i0x = coords[2 * i0];
      const i0y = coords[2 * i0 + 1];
      for (let i = 0, minDist = Infinity; i < n; i++) {
        if (i === i0) continue;
        const d = dist(i0x, i0y, coords[2 * i], coords[2 * i + 1]);
        if (d < minDist && d > 0) {
          i1 = i;
          minDist = d;
        }
      }
      let i1x = coords[2 * i1];
      let i1y = coords[2 * i1 + 1];
      let minRadius = Infinity;
      for (let i = 0; i < n; i++) {
        if (i === i0 || i === i1) continue;
        const r = circumradius(i0x, i0y, i1x, i1y, coords[2 * i], coords[2 * i + 1]);
        if (r < minRadius) {
          i2 = i;
          minRadius = r;
        }
      }
      let i2x = coords[2 * i2];
      let i2y = coords[2 * i2 + 1];
      if (minRadius === Infinity) {
        for (let i = 0; i < n; i++) {
          this._dists[i] = coords[2 * i] - coords[0] || coords[2 * i + 1] - coords[1];
        }
        quicksort(this._ids, this._dists, 0, n - 1);
        const hull = new Uint32Array(n);
        let j = 0;
        for (let i = 0, d0 = -Infinity; i < n; i++) {
          const id = this._ids[i];
          const d = this._dists[id];
          if (d > d0) {
            hull[j++] = id;
            d0 = d;
          }
        }
        this.hull = hull.subarray(0, j);
        this.triangles = new Uint32Array(0);
        this.halfedges = new Uint32Array(0);
        return;
      }
      if (orient2d(i0x, i0y, i1x, i1y, i2x, i2y) < 0) {
        const i = i1;
        const x = i1x;
        const y = i1y;
        i1 = i2;
        i1x = i2x;
        i1y = i2y;
        i2 = i;
        i2x = x;
        i2y = y;
      }
      const center = circumcenter(i0x, i0y, i1x, i1y, i2x, i2y);
      this._cx = center.x;
      this._cy = center.y;
      for (let i = 0; i < n; i++) {
        this._dists[i] = dist(coords[2 * i], coords[2 * i + 1], center.x, center.y);
      }
      quicksort(this._ids, this._dists, 0, n - 1);
      this._hullStart = i0;
      let hullSize = 3;
      hullNext[i0] = hullPrev[i2] = i1;
      hullNext[i1] = hullPrev[i0] = i2;
      hullNext[i2] = hullPrev[i1] = i0;
      hullTri[i0] = 0;
      hullTri[i1] = 1;
      hullTri[i2] = 2;
      hullHash.fill(-1);
      hullHash[this._hashKey(i0x, i0y)] = i0;
      hullHash[this._hashKey(i1x, i1y)] = i1;
      hullHash[this._hashKey(i2x, i2y)] = i2;
      this.trianglesLen = 0;
      this._addTriangle(i0, i1, i2, -1, -1, -1);
      for (let k = 0, xp, yp; k < this._ids.length; k++) {
        const i = this._ids[k];
        const x = coords[2 * i];
        const y = coords[2 * i + 1];
        if (k > 0 && Math.abs(x - xp) <= EPSILON && Math.abs(y - yp) <= EPSILON) continue;
        xp = x;
        yp = y;
        if (i === i0 || i === i1 || i === i2) continue;
        let start = 0;
        for (let j = 0, key = this._hashKey(x, y); j < this._hashSize; j++) {
          start = hullHash[(key + j) % this._hashSize];
          if (start !== -1 && start !== hullNext[start]) break;
        }
        start = hullPrev[start];
        let e = start, q;
        while (q = hullNext[e], orient2d(x, y, coords[2 * e], coords[2 * e + 1], coords[2 * q], coords[2 * q + 1]) >= 0) {
          e = q;
          if (e === start) {
            e = -1;
            break;
          }
        }
        if (e === -1) continue;
        let t = this._addTriangle(e, i, hullNext[e], -1, -1, hullTri[e]);
        hullTri[i] = this._legalize(t + 2);
        hullTri[e] = t;
        hullSize++;
        let n2 = hullNext[e];
        while (q = hullNext[n2], orient2d(x, y, coords[2 * n2], coords[2 * n2 + 1], coords[2 * q], coords[2 * q + 1]) < 0) {
          t = this._addTriangle(n2, i, q, hullTri[i], -1, hullTri[n2]);
          hullTri[i] = this._legalize(t + 2);
          hullNext[n2] = n2;
          hullSize--;
          n2 = q;
        }
        if (e === start) {
          while (q = hullPrev[e], orient2d(x, y, coords[2 * q], coords[2 * q + 1], coords[2 * e], coords[2 * e + 1]) < 0) {
            t = this._addTriangle(q, i, e, -1, hullTri[e], hullTri[q]);
            this._legalize(t + 2);
            hullTri[q] = t;
            hullNext[e] = e;
            hullSize--;
            e = q;
          }
        }
        this._hullStart = hullPrev[i] = e;
        hullNext[e] = hullPrev[n2] = i;
        hullNext[i] = n2;
        hullHash[this._hashKey(x, y)] = i;
        hullHash[this._hashKey(coords[2 * e], coords[2 * e + 1])] = e;
      }
      this.hull = new Uint32Array(hullSize);
      for (let i = 0, e = this._hullStart; i < hullSize; i++) {
        this.hull[i] = e;
        e = hullNext[e];
      }
      this.triangles = this._triangles.subarray(0, this.trianglesLen);
      this.halfedges = this._halfedges.subarray(0, this.trianglesLen);
    }
    _hashKey(x, y) {
      return Math.floor(pseudoAngle(x - this._cx, y - this._cy) * this._hashSize) % this._hashSize;
    }
    _legalize(a) {
      const { _triangles: triangles, _halfedges: halfedges, coords } = this;
      let i = 0;
      let ar = 0;
      while (true) {
        const b = halfedges[a];
        const a0 = a - a % 3;
        ar = a0 + (a + 2) % 3;
        if (b === -1) {
          if (i === 0) break;
          a = EDGE_STACK[--i];
          continue;
        }
        const b0 = b - b % 3;
        const al = a0 + (a + 1) % 3;
        const bl = b0 + (b + 2) % 3;
        const p0 = triangles[ar];
        const pr = triangles[a];
        const pl = triangles[al];
        const p1 = triangles[bl];
        const illegal = inCircle(
          coords[2 * p0],
          coords[2 * p0 + 1],
          coords[2 * pr],
          coords[2 * pr + 1],
          coords[2 * pl],
          coords[2 * pl + 1],
          coords[2 * p1],
          coords[2 * p1 + 1]
        );
        if (illegal) {
          triangles[a] = p1;
          triangles[b] = p0;
          const hbl = halfedges[bl];
          if (hbl === -1) {
            let e = this._hullStart;
            do {
              if (this._hullTri[e] === bl) {
                this._hullTri[e] = a;
                break;
              }
              e = this._hullPrev[e];
            } while (e !== this._hullStart);
          }
          this._link(a, hbl);
          this._link(b, halfedges[ar]);
          this._link(ar, bl);
          const br = b0 + (b + 1) % 3;
          if (i < EDGE_STACK.length) {
            EDGE_STACK[i++] = br;
          }
        } else {
          if (i === 0) break;
          a = EDGE_STACK[--i];
        }
      }
      return ar;
    }
    _link(a, b) {
      this._halfedges[a] = b;
      if (b !== -1) this._halfedges[b] = a;
    }
    // add a new triangle given vertex indices and adjacent half-edge ids
    _addTriangle(i0, i1, i2, a, b, c) {
      const t = this.trianglesLen;
      this._triangles[t] = i0;
      this._triangles[t + 1] = i1;
      this._triangles[t + 2] = i2;
      this._link(t, a);
      this._link(t + 1, b);
      this._link(t + 2, c);
      this.trianglesLen += 3;
      return t;
    }
  };
  function pseudoAngle(dx, dy) {
    const p = dx / (Math.abs(dx) + Math.abs(dy));
    return (dy > 0 ? 3 - p : 1 + p) / 4;
  }
  function dist(ax, ay, bx, by) {
    const dx = ax - bx;
    const dy = ay - by;
    return dx * dx + dy * dy;
  }
  function inCircle(ax, ay, bx, by, cx, cy, px, py) {
    const dx = ax - px;
    const dy = ay - py;
    const ex = bx - px;
    const ey = by - py;
    const fx = cx - px;
    const fy = cy - py;
    const ap = dx * dx + dy * dy;
    const bp = ex * ex + ey * ey;
    const cp = fx * fx + fy * fy;
    return dx * (ey * cp - bp * fy) - dy * (ex * cp - bp * fx) + ap * (ex * fy - ey * fx) < 0;
  }
  function circumradius(ax, ay, bx, by, cx, cy) {
    const dx = bx - ax;
    const dy = by - ay;
    const ex = cx - ax;
    const ey = cy - ay;
    const bl = dx * dx + dy * dy;
    const cl = ex * ex + ey * ey;
    const d = 0.5 / (dx * ey - dy * ex);
    const x = (ey * bl - dy * cl) * d;
    const y = (dx * cl - ex * bl) * d;
    return x * x + y * y;
  }
  function circumcenter(ax, ay, bx, by, cx, cy) {
    const dx = bx - ax;
    const dy = by - ay;
    const ex = cx - ax;
    const ey = cy - ay;
    const bl = dx * dx + dy * dy;
    const cl = ex * ex + ey * ey;
    const d = 0.5 / (dx * ey - dy * ex);
    const x = ax + (ey * bl - dy * cl) * d;
    const y = ay + (dx * cl - ex * bl) * d;
    return { x, y };
  }
  function quicksort(ids, dists, left, right) {
    if (right - left <= 20) {
      for (let i = left + 1; i <= right; i++) {
        const temp = ids[i];
        const tempDist = dists[temp];
        let j = i - 1;
        while (j >= left && dists[ids[j]] > tempDist) ids[j + 1] = ids[j--];
        ids[j + 1] = temp;
      }
    } else {
      const median = left + right >> 1;
      let i = left + 1;
      let j = right;
      swap(ids, median, i);
      if (dists[ids[left]] > dists[ids[right]]) swap(ids, left, right);
      if (dists[ids[i]] > dists[ids[right]]) swap(ids, i, right);
      if (dists[ids[left]] > dists[ids[i]]) swap(ids, left, i);
      const temp = ids[i];
      const tempDist = dists[temp];
      while (true) {
        do
          i++;
        while (dists[ids[i]] < tempDist);
        do
          j--;
        while (dists[ids[j]] > tempDist);
        if (j < i) break;
        swap(ids, i, j);
      }
      ids[left + 1] = ids[j];
      ids[j] = temp;
      if (right - i + 1 >= j - left) {
        quicksort(ids, dists, i, right);
        quicksort(ids, dists, left, j - 1);
      } else {
        quicksort(ids, dists, left, j - 1);
        quicksort(ids, dists, i, right);
      }
    }
  }
  function swap(arr, i, j) {
    const tmp = arr[i];
    arr[i] = arr[j];
    arr[j] = tmp;
  }
  function defaultGetX(p) {
    return p[0];
  }
  function defaultGetY(p) {
    return p[1];
  }

  // node_modules/d3-delaunay/src/path.js
  var epsilon2 = 1e-6;
  var Path = class {
    constructor() {
      this._x0 = this._y0 = // start of current subpath
      this._x1 = this._y1 = null;
      this._ = "";
    }
    moveTo(x, y) {
      this._ += `M${this._x0 = this._x1 = +x},${this._y0 = this._y1 = +y}`;
    }
    closePath() {
      if (this._x1 !== null) {
        this._x1 = this._x0, this._y1 = this._y0;
        this._ += "Z";
      }
    }
    lineTo(x, y) {
      this._ += `L${this._x1 = +x},${this._y1 = +y}`;
    }
    arc(x, y, r) {
      x = +x, y = +y, r = +r;
      const x0 = x + r;
      const y0 = y;
      if (r < 0) throw new Error("negative radius");
      if (this._x1 === null) this._ += `M${x0},${y0}`;
      else if (Math.abs(this._x1 - x0) > epsilon2 || Math.abs(this._y1 - y0) > epsilon2) this._ += "L" + x0 + "," + y0;
      if (!r) return;
      this._ += `A${r},${r},0,1,1,${x - r},${y}A${r},${r},0,1,1,${this._x1 = x0},${this._y1 = y0}`;
    }
    rect(x, y, w, h) {
      this._ += `M${this._x0 = this._x1 = +x},${this._y0 = this._y1 = +y}h${+w}v${+h}h${-w}Z`;
    }
    value() {
      return this._ || null;
    }
  };

  // node_modules/d3-delaunay/src/polygon.js
  var Polygon = class {
    constructor() {
      this._ = [];
    }
    moveTo(x, y) {
      this._.push([x, y]);
    }
    closePath() {
      this._.push(this._[0].slice());
    }
    lineTo(x, y) {
      this._.push([x, y]);
    }
    value() {
      return this._.length ? this._ : null;
    }
  };

  // node_modules/d3-delaunay/src/voronoi.js
  var Voronoi = class {
    constructor(delaunay, [xmin, ymin, xmax, ymax] = [0, 0, 960, 500]) {
      if (!((xmax = +xmax) >= (xmin = +xmin)) || !((ymax = +ymax) >= (ymin = +ymin))) throw new Error("invalid bounds");
      this.delaunay = delaunay;
      this._circumcenters = new Float64Array(delaunay.points.length * 2);
      this.vectors = new Float64Array(delaunay.points.length * 2);
      this.xmax = xmax, this.xmin = xmin;
      this.ymax = ymax, this.ymin = ymin;
      this._init();
    }
    update() {
      this.delaunay.update();
      this._init();
      return this;
    }
    _init() {
      const { delaunay: { points, hull, triangles }, vectors } = this;
      let bx, by;
      const circumcenters = this.circumcenters = this._circumcenters.subarray(0, triangles.length / 3 * 2);
      for (let i = 0, j = 0, n = triangles.length, x, y; i < n; i += 3, j += 2) {
        const t1 = triangles[i] * 2;
        const t2 = triangles[i + 1] * 2;
        const t3 = triangles[i + 2] * 2;
        const x12 = points[t1];
        const y12 = points[t1 + 1];
        const x2 = points[t2];
        const y2 = points[t2 + 1];
        const x3 = points[t3];
        const y3 = points[t3 + 1];
        const dx = x2 - x12;
        const dy = y2 - y12;
        const ex = x3 - x12;
        const ey = y3 - y12;
        const ab4 = (dx * ey - dy * ex) * 2;
        if (Math.abs(ab4) < 1e-9) {
          if (bx === void 0) {
            bx = by = 0;
            for (const i2 of hull) bx += points[i2 * 2], by += points[i2 * 2 + 1];
            bx /= hull.length, by /= hull.length;
          }
          const a = 1e9 * Math.sign((bx - x12) * ey - (by - y12) * ex);
          x = (x12 + x3) / 2 - a * ey;
          y = (y12 + y3) / 2 + a * ex;
        } else {
          const d = 1 / ab4;
          const bl = dx * dx + dy * dy;
          const cl = ex * ex + ey * ey;
          x = x12 + (ey * bl - dy * cl) * d;
          y = y12 + (dx * cl - ex * bl) * d;
        }
        circumcenters[j] = x;
        circumcenters[j + 1] = y;
      }
      let h = hull[hull.length - 1];
      let p0, p1 = h * 4;
      let x0, x1 = points[2 * h];
      let y0, y1 = points[2 * h + 1];
      vectors.fill(0);
      for (let i = 0; i < hull.length; ++i) {
        h = hull[i];
        p0 = p1, x0 = x1, y0 = y1;
        p1 = h * 4, x1 = points[2 * h], y1 = points[2 * h + 1];
        vectors[p0 + 2] = vectors[p1] = y0 - y1;
        vectors[p0 + 3] = vectors[p1 + 1] = x1 - x0;
      }
    }
    render(context) {
      const buffer = context == null ? context = new Path() : void 0;
      const { delaunay: { halfedges, inedges, hull }, circumcenters, vectors } = this;
      if (hull.length <= 1) return null;
      for (let i = 0, n = halfedges.length; i < n; ++i) {
        const j = halfedges[i];
        if (j < i) continue;
        const ti = Math.floor(i / 3) * 2;
        const tj = Math.floor(j / 3) * 2;
        const xi = circumcenters[ti];
        const yi = circumcenters[ti + 1];
        const xj = circumcenters[tj];
        const yj = circumcenters[tj + 1];
        this._renderSegment(xi, yi, xj, yj, context);
      }
      let h0, h1 = hull[hull.length - 1];
      for (let i = 0; i < hull.length; ++i) {
        h0 = h1, h1 = hull[i];
        const t = Math.floor(inedges[h1] / 3) * 2;
        const x = circumcenters[t];
        const y = circumcenters[t + 1];
        const v2 = h0 * 4;
        const p = this._project(x, y, vectors[v2 + 2], vectors[v2 + 3]);
        if (p) this._renderSegment(x, y, p[0], p[1], context);
      }
      return buffer && buffer.value();
    }
    renderBounds(context) {
      const buffer = context == null ? context = new Path() : void 0;
      context.rect(this.xmin, this.ymin, this.xmax - this.xmin, this.ymax - this.ymin);
      return buffer && buffer.value();
    }
    renderCell(i, context) {
      const buffer = context == null ? context = new Path() : void 0;
      const points = this._clip(i);
      if (points === null || !points.length) return;
      context.moveTo(points[0], points[1]);
      let n = points.length;
      while (points[0] === points[n - 2] && points[1] === points[n - 1] && n > 1) n -= 2;
      for (let i2 = 2; i2 < n; i2 += 2) {
        if (points[i2] !== points[i2 - 2] || points[i2 + 1] !== points[i2 - 1])
          context.lineTo(points[i2], points[i2 + 1]);
      }
      context.closePath();
      return buffer && buffer.value();
    }
    *cellPolygons() {
      const { delaunay: { points } } = this;
      for (let i = 0, n = points.length / 2; i < n; ++i) {
        const cell = this.cellPolygon(i);
        if (cell) cell.index = i, yield cell;
      }
    }
    cellPolygon(i) {
      const polygon = new Polygon();
      this.renderCell(i, polygon);
      return polygon.value();
    }
    _renderSegment(x0, y0, x1, y1, context) {
      let S;
      const c0 = this._regioncode(x0, y0);
      const c1 = this._regioncode(x1, y1);
      if (c0 === 0 && c1 === 0) {
        context.moveTo(x0, y0);
        context.lineTo(x1, y1);
      } else if (S = this._clipSegment(x0, y0, x1, y1, c0, c1)) {
        context.moveTo(S[0], S[1]);
        context.lineTo(S[2], S[3]);
      }
    }
    contains(i, x, y) {
      if ((x = +x, x !== x) || (y = +y, y !== y)) return false;
      return this.delaunay._step(i, x, y) === i;
    }
    *neighbors(i) {
      const ci = this._clip(i);
      if (ci) for (const j of this.delaunay.neighbors(i)) {
        const cj = this._clip(j);
        if (cj) loop: for (let ai = 0, li = ci.length; ai < li; ai += 2) {
          for (let aj = 0, lj = cj.length; aj < lj; aj += 2) {
            if (ci[ai] === cj[aj] && ci[ai + 1] === cj[aj + 1] && ci[(ai + 2) % li] === cj[(aj + lj - 2) % lj] && ci[(ai + 3) % li] === cj[(aj + lj - 1) % lj]) {
              yield j;
              break loop;
            }
          }
        }
      }
    }
    _cell(i) {
      const { circumcenters, delaunay: { inedges, halfedges, triangles } } = this;
      const e0 = inedges[i];
      if (e0 === -1) return null;
      const points = [];
      let e = e0;
      do {
        const t = Math.floor(e / 3);
        points.push(circumcenters[t * 2], circumcenters[t * 2 + 1]);
        e = e % 3 === 2 ? e - 2 : e + 1;
        if (triangles[e] !== i) break;
        e = halfedges[e];
      } while (e !== e0 && e !== -1);
      return points;
    }
    _clip(i) {
      if (i === 0 && this.delaunay.hull.length === 1) {
        return [this.xmax, this.ymin, this.xmax, this.ymax, this.xmin, this.ymax, this.xmin, this.ymin];
      }
      const points = this._cell(i);
      if (points === null) return null;
      const { vectors: V } = this;
      const v2 = i * 4;
      return this._simplify(V[v2] || V[v2 + 1] ? this._clipInfinite(i, points, V[v2], V[v2 + 1], V[v2 + 2], V[v2 + 3]) : this._clipFinite(i, points));
    }
    _clipFinite(i, points) {
      const n = points.length;
      let P = null;
      let x0, y0, x1 = points[n - 2], y1 = points[n - 1];
      let c0, c1 = this._regioncode(x1, y1);
      let e0, e1 = 0;
      for (let j = 0; j < n; j += 2) {
        x0 = x1, y0 = y1, x1 = points[j], y1 = points[j + 1];
        c0 = c1, c1 = this._regioncode(x1, y1);
        if (c0 === 0 && c1 === 0) {
          e0 = e1, e1 = 0;
          if (P) P.push(x1, y1);
          else P = [x1, y1];
        } else {
          let S, sx0, sy0, sx1, sy1;
          if (c0 === 0) {
            if ((S = this._clipSegment(x0, y0, x1, y1, c0, c1)) === null) continue;
            [sx0, sy0, sx1, sy1] = S;
          } else {
            if ((S = this._clipSegment(x1, y1, x0, y0, c1, c0)) === null) continue;
            [sx1, sy1, sx0, sy0] = S;
            e0 = e1, e1 = this._edgecode(sx0, sy0);
            if (e0 && e1) this._edge(i, e0, e1, P, P.length);
            if (P) P.push(sx0, sy0);
            else P = [sx0, sy0];
          }
          e0 = e1, e1 = this._edgecode(sx1, sy1);
          if (e0 && e1) this._edge(i, e0, e1, P, P.length);
          if (P) P.push(sx1, sy1);
          else P = [sx1, sy1];
        }
      }
      if (P) {
        e0 = e1, e1 = this._edgecode(P[0], P[1]);
        if (e0 && e1) this._edge(i, e0, e1, P, P.length);
      } else if (this.contains(i, (this.xmin + this.xmax) / 2, (this.ymin + this.ymax) / 2)) {
        return [this.xmax, this.ymin, this.xmax, this.ymax, this.xmin, this.ymax, this.xmin, this.ymin];
      }
      return P;
    }
    _clipSegment(x0, y0, x1, y1, c0, c1) {
      const flip = c0 < c1;
      if (flip) [x0, y0, x1, y1, c0, c1] = [x1, y1, x0, y0, c1, c0];
      while (true) {
        if (c0 === 0 && c1 === 0) return flip ? [x1, y1, x0, y0] : [x0, y0, x1, y1];
        if (c0 & c1) return null;
        let x, y, c = c0 || c1;
        if (c & 8) x = x0 + (x1 - x0) * (this.ymax - y0) / (y1 - y0), y = this.ymax;
        else if (c & 4) x = x0 + (x1 - x0) * (this.ymin - y0) / (y1 - y0), y = this.ymin;
        else if (c & 2) y = y0 + (y1 - y0) * (this.xmax - x0) / (x1 - x0), x = this.xmax;
        else y = y0 + (y1 - y0) * (this.xmin - x0) / (x1 - x0), x = this.xmin;
        if (c0) x0 = x, y0 = y, c0 = this._regioncode(x0, y0);
        else x1 = x, y1 = y, c1 = this._regioncode(x1, y1);
      }
    }
    _clipInfinite(i, points, vx0, vy0, vxn, vyn) {
      let P = Array.from(points), p;
      if (p = this._project(P[0], P[1], vx0, vy0)) P.unshift(p[0], p[1]);
      if (p = this._project(P[P.length - 2], P[P.length - 1], vxn, vyn)) P.push(p[0], p[1]);
      if (P = this._clipFinite(i, P)) {
        for (let j = 0, n = P.length, c0, c1 = this._edgecode(P[n - 2], P[n - 1]); j < n; j += 2) {
          c0 = c1, c1 = this._edgecode(P[j], P[j + 1]);
          if (c0 && c1) j = this._edge(i, c0, c1, P, j), n = P.length;
        }
      } else if (this.contains(i, (this.xmin + this.xmax) / 2, (this.ymin + this.ymax) / 2)) {
        P = [this.xmin, this.ymin, this.xmax, this.ymin, this.xmax, this.ymax, this.xmin, this.ymax];
      }
      return P;
    }
    _edge(i, e0, e1, P, j) {
      while (e0 !== e1) {
        let x, y;
        switch (e0) {
          case 5:
            e0 = 4;
            continue;
          // top-left
          case 4:
            e0 = 6, x = this.xmax, y = this.ymin;
            break;
          // top
          case 6:
            e0 = 2;
            continue;
          // top-right
          case 2:
            e0 = 10, x = this.xmax, y = this.ymax;
            break;
          // right
          case 10:
            e0 = 8;
            continue;
          // bottom-right
          case 8:
            e0 = 9, x = this.xmin, y = this.ymax;
            break;
          // bottom
          case 9:
            e0 = 1;
            continue;
          // bottom-left
          case 1:
            e0 = 5, x = this.xmin, y = this.ymin;
            break;
        }
        if ((P[j] !== x || P[j + 1] !== y) && this.contains(i, x, y)) {
          P.splice(j, 0, x, y), j += 2;
        }
      }
      return j;
    }
    _project(x0, y0, vx, vy) {
      let t = Infinity, c, x, y;
      if (vy < 0) {
        if (y0 <= this.ymin) return null;
        if ((c = (this.ymin - y0) / vy) < t) y = this.ymin, x = x0 + (t = c) * vx;
      } else if (vy > 0) {
        if (y0 >= this.ymax) return null;
        if ((c = (this.ymax - y0) / vy) < t) y = this.ymax, x = x0 + (t = c) * vx;
      }
      if (vx > 0) {
        if (x0 >= this.xmax) return null;
        if ((c = (this.xmax - x0) / vx) < t) x = this.xmax, y = y0 + (t = c) * vy;
      } else if (vx < 0) {
        if (x0 <= this.xmin) return null;
        if ((c = (this.xmin - x0) / vx) < t) x = this.xmin, y = y0 + (t = c) * vy;
      }
      return [x, y];
    }
    _edgecode(x, y) {
      return (x === this.xmin ? 1 : x === this.xmax ? 2 : 0) | (y === this.ymin ? 4 : y === this.ymax ? 8 : 0);
    }
    _regioncode(x, y) {
      return (x < this.xmin ? 1 : x > this.xmax ? 2 : 0) | (y < this.ymin ? 4 : y > this.ymax ? 8 : 0);
    }
    _simplify(P) {
      if (P && P.length > 4) {
        for (let i = 0; i < P.length; i += 2) {
          const j = (i + 2) % P.length, k = (i + 4) % P.length;
          if (P[i] === P[j] && P[j] === P[k] || P[i + 1] === P[j + 1] && P[j + 1] === P[k + 1]) {
            P.splice(j, 2), i -= 2;
          }
        }
        if (!P.length) P = null;
      }
      return P;
    }
  };

  // node_modules/d3-delaunay/src/delaunay.js
  var tau = 2 * Math.PI;
  var pow = Math.pow;
  function pointX(p) {
    return p[0];
  }
  function pointY(p) {
    return p[1];
  }
  function collinear(d) {
    const { triangles, coords } = d;
    for (let i = 0; i < triangles.length; i += 3) {
      const a = 2 * triangles[i], b = 2 * triangles[i + 1], c = 2 * triangles[i + 2], cross = (coords[c] - coords[a]) * (coords[b + 1] - coords[a + 1]) - (coords[b] - coords[a]) * (coords[c + 1] - coords[a + 1]);
      if (cross > 1e-10) return false;
    }
    return true;
  }
  function jitter(x, y, r) {
    return [x + Math.sin(x + y) * r, y + Math.cos(x - y) * r];
  }
  var Delaunay = class _Delaunay {
    static from(points, fx = pointX, fy = pointY, that) {
      return new _Delaunay("length" in points ? flatArray(points, fx, fy, that) : Float64Array.from(flatIterable(points, fx, fy, that)));
    }
    constructor(points) {
      this._delaunator = new Delaunator(points);
      this.inedges = new Int32Array(points.length / 2);
      this._hullIndex = new Int32Array(points.length / 2);
      this.points = this._delaunator.coords;
      this._init();
    }
    update() {
      this._delaunator.update();
      this._init();
      return this;
    }
    _init() {
      const d = this._delaunator, points = this.points;
      if (d.hull && d.hull.length > 2 && collinear(d)) {
        this.collinear = Int32Array.from({ length: points.length / 2 }, (_, i) => i).sort((i, j) => points[2 * i] - points[2 * j] || points[2 * i + 1] - points[2 * j + 1]);
        const e = this.collinear[0], f = this.collinear[this.collinear.length - 1], bounds = [points[2 * e], points[2 * e + 1], points[2 * f], points[2 * f + 1]], r = 1e-8 * Math.hypot(bounds[3] - bounds[1], bounds[2] - bounds[0]);
        for (let i = 0, n = points.length / 2; i < n; ++i) {
          const p = jitter(points[2 * i], points[2 * i + 1], r);
          points[2 * i] = p[0];
          points[2 * i + 1] = p[1];
        }
        this._delaunator = new Delaunator(points);
      } else {
        delete this.collinear;
      }
      const halfedges = this.halfedges = this._delaunator.halfedges;
      const hull = this.hull = this._delaunator.hull;
      const triangles = this.triangles = this._delaunator.triangles;
      const inedges = this.inedges.fill(-1);
      const hullIndex = this._hullIndex.fill(-1);
      for (let e = 0, n = halfedges.length; e < n; ++e) {
        const p = triangles[e % 3 === 2 ? e - 2 : e + 1];
        if (halfedges[e] === -1 || inedges[p] === -1) inedges[p] = e;
      }
      for (let i = 0, n = hull.length; i < n; ++i) {
        hullIndex[hull[i]] = i;
      }
      if (hull.length <= 2 && hull.length > 0) {
        this.triangles = new Int32Array(3).fill(-1);
        this.halfedges = new Int32Array(3).fill(-1);
        this.triangles[0] = hull[0];
        inedges[hull[0]] = 1;
        if (hull.length === 2) {
          inedges[hull[1]] = 0;
          this.triangles[1] = hull[1];
          this.triangles[2] = hull[1];
        }
      }
    }
    voronoi(bounds) {
      return new Voronoi(this, bounds);
    }
    *neighbors(i) {
      const { inedges, hull, _hullIndex, halfedges, triangles, collinear: collinear2 } = this;
      if (collinear2) {
        const l = collinear2.indexOf(i);
        if (l > 0) yield collinear2[l - 1];
        if (l < collinear2.length - 1) yield collinear2[l + 1];
        return;
      }
      const e0 = inedges[i];
      if (e0 === -1) return;
      let e = e0, p0 = -1;
      do {
        yield p0 = triangles[e];
        e = e % 3 === 2 ? e - 2 : e + 1;
        if (triangles[e] !== i) return;
        e = halfedges[e];
        if (e === -1) {
          const p = hull[(_hullIndex[i] + 1) % hull.length];
          if (p !== p0) yield p;
          return;
        }
      } while (e !== e0);
    }
    find(x, y, i = 0) {
      if ((x = +x, x !== x) || (y = +y, y !== y)) return -1;
      const i0 = i;
      let c;
      while ((c = this._step(i, x, y)) >= 0 && c !== i && c !== i0) i = c;
      return c;
    }
    _step(i, x, y) {
      const { inedges, hull, _hullIndex, halfedges, triangles, points } = this;
      if (inedges[i] === -1 || !points.length) return (i + 1) % (points.length >> 1);
      let c = i;
      let dc = pow(x - points[i * 2], 2) + pow(y - points[i * 2 + 1], 2);
      const e0 = inedges[i];
      let e = e0;
      do {
        let t = triangles[e];
        const dt = pow(x - points[t * 2], 2) + pow(y - points[t * 2 + 1], 2);
        if (dt < dc) dc = dt, c = t;
        e = e % 3 === 2 ? e - 2 : e + 1;
        if (triangles[e] !== i) break;
        e = halfedges[e];
        if (e === -1) {
          e = hull[(_hullIndex[i] + 1) % hull.length];
          if (e !== t) {
            if (pow(x - points[e * 2], 2) + pow(y - points[e * 2 + 1], 2) < dc) return e;
          }
          break;
        }
      } while (e !== e0);
      return c;
    }
    render(context) {
      const buffer = context == null ? context = new Path() : void 0;
      const { points, halfedges, triangles } = this;
      for (let i = 0, n = halfedges.length; i < n; ++i) {
        const j = halfedges[i];
        if (j < i) continue;
        const ti = triangles[i] * 2;
        const tj = triangles[j] * 2;
        context.moveTo(points[ti], points[ti + 1]);
        context.lineTo(points[tj], points[tj + 1]);
      }
      this.renderHull(context);
      return buffer && buffer.value();
    }
    renderPoints(context, r) {
      if (r === void 0 && (!context || typeof context.moveTo !== "function")) r = context, context = null;
      r = r == void 0 ? 2 : +r;
      const buffer = context == null ? context = new Path() : void 0;
      const { points } = this;
      for (let i = 0, n = points.length; i < n; i += 2) {
        const x = points[i], y = points[i + 1];
        context.moveTo(x + r, y);
        context.arc(x, y, r, 0, tau);
      }
      return buffer && buffer.value();
    }
    renderHull(context) {
      const buffer = context == null ? context = new Path() : void 0;
      const { hull, points } = this;
      const h = hull[0] * 2, n = hull.length;
      context.moveTo(points[h], points[h + 1]);
      for (let i = 1; i < n; ++i) {
        const h2 = 2 * hull[i];
        context.lineTo(points[h2], points[h2 + 1]);
      }
      context.closePath();
      return buffer && buffer.value();
    }
    hullPolygon() {
      const polygon = new Polygon();
      this.renderHull(polygon);
      return polygon.value();
    }
    renderTriangle(i, context) {
      const buffer = context == null ? context = new Path() : void 0;
      const { points, triangles } = this;
      const t0 = triangles[i *= 3] * 2;
      const t1 = triangles[i + 1] * 2;
      const t2 = triangles[i + 2] * 2;
      context.moveTo(points[t0], points[t0 + 1]);
      context.lineTo(points[t1], points[t1 + 1]);
      context.lineTo(points[t2], points[t2 + 1]);
      context.closePath();
      return buffer && buffer.value();
    }
    *trianglePolygons() {
      const { triangles } = this;
      for (let i = 0, n = triangles.length / 3; i < n; ++i) {
        yield this.trianglePolygon(i);
      }
    }
    trianglePolygon(i) {
      const polygon = new Polygon();
      this.renderTriangle(i, polygon);
      return polygon.value();
    }
  };
  function flatArray(points, fx, fy, that) {
    const n = points.length;
    const array = new Float64Array(n * 2);
    for (let i = 0; i < n; ++i) {
      const p = points[i];
      array[i * 2] = fx.call(that, p, i, points);
      array[i * 2 + 1] = fy.call(that, p, i, points);
    }
    return array;
  }
  function* flatIterable(points, fx, fy, that) {
    let i = 0;
    for (const p of points) {
      yield fx.call(that, p, i, points);
      yield fy.call(that, p, i, points);
      ++i;
    }
  }

  // src/dts.ts
  var DrunkTravellingSalesman = class {
    #params;
    #inputPixmap;
    #cutoff;
    #nsamples;
    #optIter;
    constructor(params) {
      this.#params = params;
      this.#inputPixmap = new Pixmap(this.#params.inputCanvas);
      this.#cutoff = params.cutoff;
      this.#nsamples = params.nsamples;
      this.#optIter = params.optIter;
    }
    #pathLength(path, points) {
      let dist2 = 0;
      for (let i = 0; i < path.length - 1; i++) {
        const ip1 = path[i];
        const ip2 = path[i + 1];
        const p1 = [points[2 * ip1], points[2 * ip1 + 1]];
        const p2 = [points[2 * ip2], points[2 * ip2 + 1]];
        dist2 += (p2[0] - p1[0]) * (p2[0] - p1[0]) + (p2[1] - p1[1]) * (p2[1] - p1[1]);
      }
      return dist2;
    }
    #bezierSplineFromPath(points, path) {
      const n = path.length;
      const pathParts = [];
      if (n < 3) {
        return "";
      }
      const getPoint = (i) => ({
        x: points[2 * path[i]],
        y: points[2 * path[i] + 1]
      });
      let prev = getPoint(0);
      let curr = prev;
      let next = getPoint(1);
      let next2 = getPoint(2);
      let curviness = Math.random() * 20 - 10;
      let c0 = { x: curr.x + curviness * (next.x - prev.x), y: curr.y + curviness * (next.y - prev.y) };
      let n0 = { x: next.x - curviness * (next2.x - curr.x), y: next.y - curviness * (next2.y - curr.y) };
      pathParts.push(`M ${prev.x} ${prev.y} C ${c0.x},${c0.y} ${n0.x},${n0.y} ${next.x},${next.y}`);
      for (let i = 1; i < n - 2; i++) {
        prev = getPoint(i - 1);
        curr = getPoint(i);
        next = getPoint(i + 1);
        next2 = getPoint(i + 2);
        curviness = Math.random() * 20 - 10;
        c0 = { x: curr.x + curviness * (next.x - prev.x), y: curr.y + curviness * (next.y - prev.y) };
        n0 = { x: next.x - curviness * (next2.x - curr.x), y: next.y - curviness * (next2.y - curr.y) };
        pathParts.push(`C ${c0.x},${c0.y} ${n0.x},${n0.y} ${next.x},${next.y}`);
      }
      prev = getPoint(n - 3);
      curr = getPoint(n - 2);
      next = getPoint(n - 1);
      next2 = next;
      curviness = Math.random() * 20 - 10;
      c0 = { x: curr.x + curviness * (next.x - prev.x), y: curr.y + curviness * (next.y - prev.y) };
      n0 = { x: next.x - curviness * (next2.x - curr.x), y: next.y - curviness * (next2.y - curr.y) };
      pathParts.push(`C ${c0.x},${c0.y} ${n0.x},${n0.y} ${next.x},${next.y}`);
      return pathParts.join(" ");
    }
    toSvg() {
      let n = this.#nsamples;
      let points = new Float64Array(n * 2);
      const width = this.#inputPixmap.width;
      const height = this.#inputPixmap.height;
      let sampledPoints = 0;
      for (let i = 0; i < n; ++i) {
        for (let j = 0; j < 30; ++j) {
          const x = Math.floor(width * Math.random());
          const y = Math.floor(height * Math.random());
          const imageLevel = this.#inputPixmap.brightnessAt(x, y);
          if (200 * Math.random() > imageLevel) {
            points[2 * sampledPoints] = x + 0.5;
            points[2 * sampledPoints + 1] = y + 0.5;
            sampledPoints++;
            break;
          }
        }
      }
      n = sampledPoints;
      if (sampledPoints < 2) {
        return "Less than 2 sampled points!";
      } else {
        console.log(`Initial sampling: ${sampledPoints} points`);
      }
      const delaunay = new Delaunay(points);
      const voronoi = delaunay.voronoi([0, 0, width, height]);
      const centroids = new Float64Array(n * 2);
      const weights = new Float64Array(n);
      for (let k = 0; k < 10; ++k) {
        centroids.fill(0);
        weights.fill(0);
        let delaunayIndex = 0;
        for (let y = 0; y < height; ++y) {
          for (let x = 0; x < width; ++x) {
            const weight = 255 - this.#inputPixmap.brightnessAt(x, y);
            delaunayIndex = delaunay.find(x, y, delaunayIndex);
            weights[delaunayIndex] += weight;
            centroids[delaunayIndex * 2] += weight * x;
            centroids[delaunayIndex * 2 + 1] += weight * y;
          }
        }
        for (let i = 0; i < n; ++i) {
          const x0 = points[i * 2];
          const y0 = points[i * 2 + 1];
          const x1 = weights[i] ? centroids[i * 2] / weights[i] : x0;
          const y1 = weights[i] ? centroids[i * 2 + 1] / weights[i] : y0;
          points[i * 2] = x0 + (x1 - x0) * 1.8;
          points[i * 2 + 1] = y0 + (y1 - y0) * 1.8;
        }
        voronoi.update();
      }
      const points2 = new Float64Array(n * 2);
      let p = 0;
      for (let i = 0; i < n; i++) {
        const brightness = this.#inputPixmap.brightnessAt(
          Math.floor(points[2 * i]),
          Math.floor(points[2 * i + 1])
        );
        if (brightness < this.#cutoff) {
          points2[2 * p] = points[2 * i];
          points2[2 * p + 1] = points[2 * i + 1];
          p++;
        }
      }
      points = points2;
      n = p;
      const path = [];
      const dist2 = (p1, p2) => (p2[0] - p1[0]) * (p2[0] - p1[0]) + (p2[1] - p1[1]) * (p2[1] - p1[1]);
      const dist2i = (i1, i2) => dist2([points[2 * i1], points[2 * i1 + 1]], [points[2 * i2], points[2 * i2 + 1]]);
      const visited = new Float64Array(n);
      visited.fill(0);
      let current = 0;
      path.push(0);
      while (true) {
        let nearest;
        let dist3 = Infinity;
        for (let next = 1; next < n; next++) {
          if (visited[next] === 0) {
            const d = dist2i(current, next);
            if (d < dist3) {
              nearest = next;
              dist3 = d;
            }
          }
        }
        if (nearest) {
          path.push(nearest);
          visited[nearest] = 1;
          current = nearest;
        } else {
          break;
        }
      }
      for (let i = 0; i < this.#optIter; ++i) {
        let indexA = Math.floor(Math.random() * (n - 1));
        let indexB = Math.floor(Math.random() * (n - 1));
        if (Math.abs(indexA - indexB) < 2) {
          continue;
        }
        if (indexB < indexA) {
          [indexA, indexB] = [indexB, indexA];
        }
        const ai = path[indexA];
        const a0 = [points[2 * ai], points[2 * ai + 1]];
        const ai2 = path[indexA + 1];
        const a1 = [points[2 * ai2], points[2 * ai2 + 1]];
        const bi = path[indexB];
        const b0 = [points[2 * bi], points[2 * bi + 1]];
        const bi2 = path[indexB + 1];
        const b1 = [points[2 * bi2], points[2 * bi2 + 1]];
        const dx1 = a0[0] - a1[0];
        const dy1 = a0[1] - a1[1];
        const dx2 = b0[0] - b1[0];
        const dy2 = b0[1] - b1[1];
        const distance = dx1 * dx1 + dy1 * dy1 + (dx2 * dx2 + dy2 * dy2);
        const dx3 = a0[0] - b0[0];
        const dy3 = a0[1] - b0[1];
        const dx4 = a1[0] - b1[0];
        const dy4 = a1[1] - b1[1];
        const distance2 = dx3 * dx3 + dy3 * dy3 + (dx4 * dx4 + dy4 * dy4);
        if (distance2 < distance) {
          let indexhigh = indexB;
          let indexlow = indexA + 1;
          while (indexhigh > indexlow) {
            const temp = path[indexlow];
            path[indexlow] = path[indexhigh];
            path[indexhigh] = temp;
            indexhigh--;
            indexlow++;
          }
        }
      }
      console.log("total distance:", this.#pathLength(path, points));
      const minLength = 200;
      const subPaths = [];
      let indexSub = 0;
      subPaths[0] = [path[0]];
      for (let i = 0; i < path.length - 1; i++) {
        const ai = path[i];
        const a0 = [points[2 * ai], points[2 * ai + 1]];
        const ai2 = path[i + 1];
        const a1 = [points[2 * ai2], points[2 * ai2 + 1]];
        if ((a0[0] - a1[0]) * (a0[0] - a1[0]) + (a0[1] - a1[1]) * (a0[1] - a1[1]) < minLength) {
          subPaths[indexSub].push(ai2);
        } else {
          subPaths[++indexSub] = [ai2];
        }
      }
      const svg = [];
      svg.push(`<svg id="svg-canvas" width="${800}" height="${800}" viewBox="0 0 ${width} ${height}">`);
      svg.push('<g style="fill: none; stroke: blue; stroke-width: 0.2">');
      subPaths.forEach((path2) => {
        const svgPathData = this.#bezierSplineFromPath(points, path2);
        svg.push(`<path d="${svgPathData}"/>`);
      });
      svg.push("</g>");
      svg.push(`</svg>`);
      return svg.join("");
    }
  };
  var defaultParams = {
    inputImageUrl: "tbl.png",
    width: 800,
    height: 800,
    cutoff: 210,
    nsamples: 1e4,
    optIter: 1
  };
  var paramsFromWidgets = () => {
    const params = { ...defaultParams };
    params.cutoff = controlCutoff.val();
    params.nsamples = controlNSamples.val();
    params.optIter = controlOptIter.val();
    return params;
  };
  var canvas;
  var renderFromQsp = function() {
    const params = paramsFromUrl(defaultParams);
    params.inputCanvas = canvas;
    const dts = new DrunkTravellingSalesman(params);
    $("canvas").innerHTML = dts.toSvg();
    delete params.inputCanvas;
    controlCutoff.set(params.cutoff);
    controlOptIter.set(params.optIter);
    controlNSamples.set(params.nsamples);
    updateUrl(params);
  };
  var renderFromWidgets = function() {
    const params = paramsFromWidgets();
    params.inputCanvas = canvas;
    const dts = new DrunkTravellingSalesman(params);
    $("canvas").innerHTML = dts.toSvg();
    delete params.inputCanvas;
    updateUrl(params);
  };
  var render = (params) => {
    if (!params) {
      params = paramsFromWidgets();
    }
    params.inputCanvas = canvas;
    const dts = new DrunkTravellingSalesman(params);
    $("canvas").innerHTML = dts.toSvg();
    delete params.inputCanvas;
    updateUrl(params);
  };
  var imageUpload = new ImageUploadControl({
    name: "inputImage",
    label: "Image",
    value: defaultParams["inputImageUrl"],
    firstCallback: renderFromQsp,
    callback: renderFromWidgets
  });
  canvas = imageUpload.canvasEl();
  var controlCutoff = new NumberControl({
    name: "cutoff",
    label: "White cutoff",
    value: defaultParams["cutoff"],
    renderFn: render,
    min: 0,
    max: 255
  });
  var controlNSamples = new NumberControl({
    name: "nsamples",
    label: "Samples",
    value: defaultParams["nsamples"],
    renderFn: render,
    min: 10,
    max: 2e4
  });
  var controlOptIter = new NumberControl({
    name: "optIter",
    label: "Optimisation",
    value: defaultParams["optIter"],
    renderFn: render,
    min: 0,
    max: 1e5
  });
  new SvgSaveControl({
    name: "svgSave",
    canvasId: "svg-canvas",
    label: "Save SVG",
    saveFilename: "dts.svg"
  });
})();
