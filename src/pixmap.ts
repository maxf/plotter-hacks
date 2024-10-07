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
    return (this.#r+this.#g+this.#b)/3;
  }
}


//################################################################################

class Pixmap {
  canvas: HTMLCanvasElement;
  width: number;
  height: number;
  context: any;
  _pixels: any;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.width = this.canvas.width;
    this.height = this.canvas.height;
    this.context = this.canvas.getContext('2d');
    this._pixels = this.context.getImageData(0,0,this.canvas.width,this.canvas.height).data;
  }

  colorAverageAt(x: number, y: number, radius: number): Color {
    let index;
    let resultR=0.0, resultG=0.0, resultB=0.0;
    let count=0;

    for (let i = -radius; i <= radius; i++) {
      for (let j = -radius; j <= radius; j++) {
        if (x + i >= 0 && x + i < this.width && y + j >= 0 && y + j < this.height) {
          count++;
          index = 4*((x+i)+this.width*(y+j));
          if (this._pixels[index+3] === 0) {
            resultR += 255;
            resultG += 255;
            resultB += 255;
          } else {
            resultR+=this._pixels[index];
            resultG+=this._pixels[index+1];
            resultB+=this._pixels[index+2];
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
    let index;
    let resultR=0.0, resultG=0.0, resultB=0.0;

    if (x >= 0 && x < this.width && y >= 0 && y < this.height) {
      index = 4*((x)+this.width*(y));
      if (this._pixels[index+3] === 0) {
        // If the pixel is transparent, color is white
        resultR = 255;
        resultG = 255;
        resultB = 255;
      } else {
        resultR = this._pixels[index];
        resultG = this._pixels[index+1];
        resultB = this._pixels[index+2];
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

}

export { Pixmap };
