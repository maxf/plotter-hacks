"use strict";
(() => {
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
})();
