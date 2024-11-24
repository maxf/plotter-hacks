class Color {
  #r: number;
  #g: number;
  #b: number;
  #a: number;
  constructor(r: number, g: number, b: number, a: number) {
    this.#r = r;
    this.#g = g;
    this.#b = b;
    this.#a = a;
  }

  toString() {
    return "rgba("+Math.round(this.#r)+","+Math.round(this.#g)+","+Math.round(this.#b)+","+Math.round(this.#a)+")";
  }

  isWhite() {
    return this.#r+this.#g+this.#b >= 3*255;
  }

  brightness() {
    // return (this.#r+this.#g+this.#b)/3;
    return 0.2126*this.#r + 0.7152*this.#g + 0.0722*this.#b;
  }
}


//################################################################################

class Pixmap {
  canvas: ImageData;
  width: number;
  height: number;
  context: any;
  _pixels: any;

  constructor(canvas: ImageData) {
    this.canvas = canvas;
    this.width = this.canvas.width;
    this.height = this.canvas.height;
  }

  colorAverageAt(x: number, y: number, radius: number): Color {
    const xi = Math.floor(x);
    const yi = Math.floor(y);
    let index;
    let resultR=0.0, resultG=0.0, resultB=0.0;
    let count=0;

    for (let i = -radius; i <= radius; i++) {
      for (let j = -radius; j <= radius; j++) {
        if (xi + i >= 0 && xi + i < this.width && yi + j >= 0 && yi + j < this.height) {
          count++;
          index = 4*((xi+i)+this.width*(yi+j));
          if (this.canvas.data[index+3] === 0) {
            resultR += 255;
            resultG += 255;
            resultB += 255;
          } else {
            resultR+=this.canvas.data[index];
            resultG+=this.canvas.data[index+1];
            resultB+=this.canvas.data[index+2];
          }
        }
      }
    }
    if (count === 0) {
      return new Color(255, 255, 255, 1);
    } else {
      return new Color(resultR/count, resultG/count, resultB/count, 1);
    }
  }

  brightnessAverageAt(x: number, y: number, radius: number): number {
    return this.colorAverageAt(x,y,radius).brightness();
  }

  colorAt(x: number, y: number): Color {
    const xi = Math.floor(x);
    const yi = Math.floor(y);
    let index;
    let resultR=0.0, resultG=0.0, resultB=0.0;

    if (xi >= 0 && xi < this.width && yi >= 0 && yi < this.height) {
      index = 4*(xi+this.width*yi);
      if (this.canvas.data[index+3] === 0) {
        // If the pixel is transparent, color is white
        resultR = 255;
        resultG = 255;
        resultB = 255;
      } else {
        resultR = this.canvas.data[index];
        resultG = this.canvas.data[index+1];
        resultB = this.canvas.data[index+2];
      }
      return new Color(resultR, resultG, resultB, 1);
    } else {
      // if the coordinates requested are outside of the picture, return white
      return new Color(255, 255, 255, 1);
    }
  }

  brightnessAt(x: number, y: number): number {
    return this.colorAt(x, y).brightness();
  }

  gradientAt(x: number, y: number): number[] {
    // Sobel kernels for x and y directions

    // if we're too close to the picture edge, return zero gradient.
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

    // Initialize gradient components
    let gx = 0;
    let gy = 0;

    // Apply Sobel kernels
    for (let i = -1; i <= 1; i++) {
      for (let j = -1; j <= 1; j++) {
        // Get the pixel intensity, ensuring we don't go out of bounds
        const brightness = this.brightnessAt(xi + i, yi + j);
        gx += brightness * sobelX[i + 1][j + 1];
        gy += brightness * sobelY[i + 1][j + 1];
      }
    }
    return [gx, gy];
  }
}

export { Pixmap };
