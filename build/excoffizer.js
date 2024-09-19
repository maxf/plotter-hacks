"use strict";
(() => {
  // src/controls.ts
  var $ = (id) => document.getElementById(id);
  var NumberControl = class {
    #value;
    #wrapperEl;
    #widgetEl;
    #valueEl;
    constructor(params2) {
      this.#value = params2.value;
      this.#createHtmlControl(params2.name, params2.label, params2.value, params2.min, params2.max, params2.step);
      this.#widgetEl = $(params2.name);
      this.#valueEl = $(`${params2.name}-value`);
      this.#wrapperEl = $(`${params2.name}-control`);
      this.#widgetEl.onchange = (event) => {
        this.#value = parseFloat(event.target.value);
        this.#valueEl.innerText = this.#value.toString();
        params2.renderFn();
      };
    }
    #createHtmlControl(name, label, value, min, max, step) {
      const html = [];
      html.push(`<span class="control" id="${name}-control">`);
      const stepAttr = step ? `step="${step}"` : "";
      html.push(`
      <input id="${name}" type="range" min="${min}" max="${max}" value="${value}" ${stepAttr}"/>
      ${label}
      <span id="${name}-value">${value}</span>
    `);
      html.push("<br/></span>");
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
  var ImageUploadControl = class {
    #wrapperEl;
    #uploadEl;
    #canvasEl;
    #imageUrl;
    #canvas;
    constructor(params2) {
      this.#createHtmlControl(params2.name, params2.label);
      this.#wrapperEl = $(`${params2.name}-control`);
      this.#uploadEl = $(`${params2.name}-upload`);
      this.#canvasEl = $(`${params2.name}-canvas`);
      this.#imageUrl = params2.value;
      const ctx = this.#canvasEl.getContext("2d", { willReadFrequently: true });
      const img = new Image();
      img.src = params2.value;
      img.onload = () => {
        this.#canvasEl.width = img.width / 5;
        this.#canvasEl.height = img.height / 5;
        if (ctx) {
          ctx.drawImage(img, 0, 0, this.#canvasEl.width, this.#canvasEl.height);
          this.#canvas = ctx.getImageData(0, 0, this.#canvasEl.width, this.#canvasEl.height);
        }
      };
      this.#uploadEl.onchange = (event) => {
        const reader = new FileReader();
        reader.onload = (event2) => {
          const img2 = new Image();
          img2.onload = () => {
            this.#canvasEl.width = img2.width;
            this.#canvasEl.height = img2.height;
            if (ctx) {
              ctx.drawImage(img2, 0, 0);
              this.#canvas = ctx.getImageData(0, 0, this.#canvasEl.width, this.#canvasEl.height);
              params2.renderFn();
            }
          };
          if (event2.target) {
            img2.src = event2.target.result;
            this.#imageUrl = event2.target.result;
          }
        };
        if (event.target) {
          const target = event.target;
          if (target && target.files) {
            reader.readAsDataURL(target.files[0]);
          }
        }
      };
    }
    #createHtmlControl(name, label) {
      const html = [];
      html.push(`<span class="control" id="${name}-control">`);
      html.push(`${label} <input type="file" id="${name}-upload" accept="image/*;capture=camera">`);
      html.push(`<canvas id="${name}-canvas" width=100 height=100/>`);
      html.push(`</span><br/>`);
      const anchorElement = $("controls");
      if (anchorElement) {
        anchorElement.insertAdjacentHTML("beforeend", html.join(""));
      }
    }
    set(url, cb) {
      this.#imageUrl = url;
      const ctx = this.#canvasEl.getContext("2d", { willReadFrequently: true });
      const img = new Image();
      img.src = url;
      img.onload = () => {
        this.#canvasEl.width = img.width / 5;
        this.#canvasEl.height = img.height / 5;
        if (ctx) {
          ctx.drawImage(img, 0, 0, this.#canvasEl.width, this.#canvasEl.height);
          this.#canvas = ctx.getImageData(0, 0, this.#canvasEl.width, this.#canvasEl.height);
        }
        cb();
      };
    }
    imageUrl() {
      return this.#imageUrl;
    }
    canvasEl() {
      return this.#canvasEl;
    }
    canvas() {
      return this.#canvas;
    }
    show() {
      this.#wrapperEl.style.display = "block";
    }
    hide() {
      this.#wrapperEl.style.display = "none";
    }
  };
  var paramsFromUrl = (defaults) => {
    const params2 = new URLSearchParams(window.location.search);
    const result = defaults;
    for (const [key, value] of params2) {
      const num = Number(value);
      if (!isNaN(num)) {
        result[key] = num;
      } else if (value === "true") {
        result[key] = true;
      } else if (value === "false") {
        result[key] = false;
      } else {
        result[key] = value;
      }
    }
    return result;
  };
  var updateUrl = (params2) => {
    const url = new URL(window.location.toString());
    url.search = "";
    Object.keys(params2).forEach((key) => {
      url.searchParams.set(key, params2[key]);
    });
    history.pushState(null, "", url);
  };

  // src/excoffizer.ts
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
  var Excoffizer = class {
    #params;
    #inputPixmap;
    #wiggleFrequency;
    #wiggleAmplitude;
    #blur;
    #outputWidth;
    constructor(params2) {
      this.#params = params2;
      this.#params.tx = 1;
      this.#params.ty = 1;
      this.#inputPixmap = new Pixmap(params2.inputCanvas);
      this.#wiggleFrequency = this.#params.waviness / 100;
      this.#wiggleAmplitude = this.#wiggleFrequency === 0 ? 0 : 0.5 / this.#wiggleFrequency;
      this.#blur = params2.blur;
      this.#outputWidth = params2.width;
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
        - line height: ${this.#params.lineHeight}
        - thickness: ${this.#params.thickness}
        - density: ${this.#params.density}
        - margin: ${this.#params.margin}
        - sx: ${this.#params.sx}
        - sy: ${this.#params.sy}
        - tx: ${this.#params.tx}
        - ty: ${this.#params.ty}
      </desc>
      <rect x="0" y="0" width="${outputWidth}" height="${outputHeight}" fill="#eee"/>
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
            const radius = thickness * (1 - imageLevel / 255) / 2 - 0.05;
            const zoom = outputWidth / inputWidth;
            if (radius < 0.5) {
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
              stepx = Math.max(1.5, density - radius);
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
    inputCanvas: void 0,
    theta: 2,
    width: 800,
    height: 800,
    margin: 10,
    waviness: 1,
    lineHeight: 10,
    thickness: 10,
    density: 5,
    sx: 0.8,
    sy: 1,
    tx: 1,
    ty: 1,
    blur: 1
  };
  var paramsFromWidgets = () => {
    const params2 = { ...defaultParams };
    if (controls.inputImage) {
      params2.inputImageUrl = controls.inputImage.imageUrl();
      params2.inputCanvas = controls.inputImage.canvasEl();
    }
    params2.theta = controls.theta.val();
    params2.waviness = controls.waviness.val();
    params2.lineHeight = controls.lineHeight.val();
    params2.density = controls.density.val();
    params2.thickness = controls.thickness.val();
    params2.sx = controls.sx.val();
    params2.sy = controls.sy.val();
    params2.blur = controls.blur.val();
    return params2;
  };
  var render = (params2) => {
    if (!params2) {
      params2 = paramsFromWidgets();
    }
    params2.width ||= 800;
    params2.height ||= 800;
    const excoffizator = new Excoffizer(params2);
    delete params2.inputImage;
    updateUrl(params2);
    $("canvas").innerHTML = excoffizator.excoffize();
  };
  var controls = {
    inputImage: new ImageUploadControl({
      name: "inputImage",
      label: "Image",
      value: defaultParams["inputImageUrl"],
      renderFn: render
    }),
    theta: new NumberControl({
      name: "theta",
      label: "Angle",
      value: defaultParams["theta"],
      renderFn: render,
      min: 0,
      max: 6.28,
      step: 0.01
    }),
    waviness: new NumberControl({
      name: "waviness",
      label: "Waviness",
      value: defaultParams["waviness"],
      renderFn: render,
      min: 0,
      max: 10,
      step: 0.1
    }),
    lineHeight: new NumberControl({
      name: "lineHeight",
      label: "Line height",
      value: defaultParams["lineHeight"],
      renderFn: render,
      min: 5,
      max: 15,
      step: 0.1
    }),
    density: new NumberControl({
      name: "density",
      label: "Density",
      value: defaultParams["density"],
      renderFn: render,
      min: 1,
      max: 10,
      step: 0.1
    }),
    thickness: new NumberControl({
      name: "thickness",
      label: "Thickness",
      value: defaultParams["thickness"],
      renderFn: render,
      min: 1,
      max: 20,
      step: 0.1
    }),
    sx: new NumberControl({
      name: "sx",
      label: "Stretch X",
      value: defaultParams["sx"],
      renderFn: render,
      min: 0,
      max: 2,
      step: 0.01
    }),
    sy: new NumberControl({
      name: "sy",
      label: "Stretch Y",
      value: defaultParams["sy"],
      renderFn: render,
      min: 0,
      max: 2,
      step: 0.01
    }),
    blur: new NumberControl({
      name: "blur",
      label: "Blur",
      value: defaultParams["blur"],
      renderFn: render,
      min: 1,
      max: 10
    })
  };
  var params = paramsFromUrl(defaultParams);
  controls.theta.set(params.theta);
  controls.waviness.set(params.waviness);
  controls.lineHeight.set(params.lineHeight);
  controls.density.set(params.density);
  controls.thickness.set(params.thickness);
  controls.sx.set(params.sx);
  controls.sy.set(params.sy);
  controls.blur.set(params.blur);
  controls.inputImage.set(params.inputImageUrl, () => {
    params.inputCanvas = controls.inputImage.canvasEl();
    const excoffizator = new Excoffizer(params);
    delete params.inputCanvas;
    updateUrl(params);
    $("canvas").innerHTML = excoffizator.excoffize();
  });
})();
