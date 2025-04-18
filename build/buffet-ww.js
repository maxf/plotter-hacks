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

// src/buffet-ww.ts
var Buffet = class {
  #image;
  #cutoff;
  #nsamples;
  #strokeLength;
  constructor(params, imageData) {
    this.#image = new Pixmap(imageData);
    this.#cutoff = params.cutoff;
    this.#nsamples = params.nsamples;
    this.#strokeLength = params.strokeLength;
  }
  toSvg() {
    let n = this.#nsamples;
    const width = this.#image.width;
    const height = this.#image.height;
    const svg = [];
    svg.push(`<svg id="svg-canvas" height="100vh" viewBox="0 0 ${width} ${height}">`);
    for (let i = 0; i < n; i++) {
      for (let j = 0; j < n; j++) {
        const ix = width * i / n;
        const iy = height * j / n;
        let [vx, vy] = this.#image.gradientAt(ix, iy);
        vx = -vx;
        const gradientMagnitude = Math.sqrt(vx * vx + vy * vy);
        if (gradientMagnitude < this.#cutoff) {
          continue;
        }
        vx = this.#strokeLength * vx / gradientMagnitude;
        vy = this.#strokeLength * vy / gradientMagnitude;
        svg.push(`<line x1="${ix}" y1="${iy}" x2="${ix + vx}" y2="${iy + vy}" style="stroke:red;stroke-width:0.2" />`);
      }
    }
    svg.push(`</svg>`);
    return svg.join("");
  }
};
onmessage = function(e) {
  const { params, imageData } = e.data;
  const dts = new Buffet(params, imageData);
  postMessage(dts.toSvg());
};
