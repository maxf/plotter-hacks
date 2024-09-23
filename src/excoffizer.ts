// copied from https://github.com/hughsk/boids/blob/master/index.js
//import seedrandom from 'seedrandom';
import { NumberControl, ImageUploadControl, SvgSaveControl, paramsFromUrl, updateUrl,  $ } from './controls';

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

  colorAverageAt(x: number, y: number, radius: number) {
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

  brightnessAverageAt(x: number, y: number, radius: number) {
    return this.colorAverageAt(x,y,radius).brightness();
  }
}

class Excoffizer {
  #params;
  #inputPixmap;
  #wiggleFrequency;
  #wiggleAmplitude;
  #blur;
  #outputWidth: number;

  constructor(params: any) {
    this.#params = params;
    this.#params.tx = 1;
    this.#params.ty = 1;
    this.#inputPixmap = new Pixmap(params.inputCanvas);
    this.#wiggleFrequency = this.#params.waviness/100.0;
    this.#wiggleAmplitude = this.#wiggleFrequency===0 ? 0 : 0.5/this.#wiggleFrequency;
    this.#blur = params.blur;
    this.#outputWidth = params.width;
  }

  excoffize() {
    return this.#excoffize();
  }

  // private
  #wiggle(x: number) {
    return this.#wiggleAmplitude*Math.sin(x*this.#wiggleFrequency);
  }

  #S2P({x, y}: { x: number; y: number }) {
    // transform x,y from "sine space" to picture space
    // rotation ('theta'), scaling (sx,sy), translation (tx, ty)
    const c = Math.cos(this.#params.theta);
    const s = Math.sin(this.#params.theta);
    const sx = this.#params.sx;
    const sy = this.#params.sy;
    const tx = this.#params.tx;
    const ty = this.#params.ty;
    return {
      x: x*sx*c - y*sy*s + tx*sx*c - ty*sy*s,
      y: x*sx*s + y*sy*c + tx*sx*s + ty*sy*c
    };
  }

  #P2S({x, y}: { x: number; y: number }) {
    // convert x,y from picture space to  "sine space"
    const c = Math.cos(-this.#params.theta);
    const s = Math.sin(-this.#params.theta);
    const sx = 1 / this.#params.sx;
    const sy = 1 / this.#params.sy;
    const tx = -this.#params.tx;
    const ty = -this.#params.ty;
    return {
      x: x*sx*c - y*sx*s + tx,
      y: x*sy*s + y*sy*c + ty
    };
  }

  #sidePoints(p1: { x: number; y: number }, p2: { x: number; y: number }, r: number) {
    const L = Math.sqrt((p2.x-p1.x)*(p2.x-p1.x) + (p2.y-p1.y)*(p2.y-p1.y));
    const px = (p2.x-p1.x)*r/L;
    const py = (p2.y-p1.y)*r/L;
    return [
      { x: p1.x-py-(px/20), y: p1.y+px-(py/20) },
      { x: p1.x+py-(px/20), y: p1.y-px-(py/20) }
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
  #poly2pathSmooth(polygon: any[]) {
    if (polygon.length > 4) {
      const ps = [];
      for (let i=0; i < polygon.length-1; i++) {
        ps.push(polygon[i]);
        ps.push({ x: (polygon[i].x + polygon[i+1].x)/2, y: (polygon[i].y + polygon[i+1].y)/2 });
      }
      ps.push(polygon[polygon.length-1])
      let d = `M ${ps[0].x} ${ps[0].y} L ${ps[1].x} ${ps[1].y}`;
      for (let i=2; i < ps.length - 1; i+= 2) {
        d = d + `C ${ps[i].x} ${ps[i].y}, ${ps[i].x} ${ps[i].y}, ${ps[i+1].x} ${ps[i+1].y} `
      }
      return `<path d="${d}"/>\n`;
    } else {
      return '';
    }
  }

  #excoffize() {
    const inputWidth = this.#inputPixmap.width;
    const inputHeight  = this.#inputPixmap.height;
    const outputWidth  = this.#outputWidth;
    const outputHeight = this.#outputWidth * inputHeight / inputWidth;
    const lineHeight = this.#params.lineHeight;
    const thickness = this.#params.thickness;
    const margin = this.#params.margin;
    const density = this.#params.density;
    let outputSvg = `
    <svg id="svg-canvas" width="${outputWidth}" height="${outputHeight}" viewBox="${-margin} ${-margin} ${outputWidth+2*margin} ${outputHeight+2*margin}" xmlns="http://www.w3.org/2000/svg">
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

    // boundaries of the image in sine space
    const corner1 = this.#P2S({x: 0, y: 0});
    const corner2 = this.#P2S({x: inputWidth, y: 0});
    const corner3 = this.#P2S({x: inputWidth, y: inputHeight});
    const corner4 = this.#P2S({x: 0, y: inputHeight});
    const minX = Math.min(corner1.x,corner2.x,corner3.x,corner4.x);
    const minY = Math.min(corner1.y,corner2.y,corner3.y,corner4.y);
    const maxX = Math.max(corner1.x,corner2.x,corner3.x,corner4.x);
    const maxY = Math.max(corner1.y,corner2.y,corner3.y,corner4.y);

    // from the min/max bounding box, we know which sines to draw

    let stepx=density;
    const stepy=lineHeight;

        //for (let y = minY - this.#wiggleAmplitude; y < maxY + this.#wiggleAmplitude; y += stepy) {
    for (let y = minY - this.#wiggleAmplitude; y < maxY + this.#wiggleAmplitude; y += stepy) {
      const hatchPoints2 = [];
      let counter = 0;

      for (let x = minX; x < maxX; x += stepx) {
        const p = this.#S2P({x, y: y+this.#wiggle(x)});

        // next point ahead
        // we need it to compute the side points as they should stick out from segment [p1, p2]
        const p2 = this.#S2P({ x: x + stepx, y: y + this.#wiggle(x+stepx)});

        if ((p.x >= 0 && p.x  < inputWidth && p.y  >= 0 && p.y  < inputHeight) || (p2.x >= 0 && p2.x < inputWidth && p2.y >= 0 && p2.y < inputHeight)) {

          const imageLevel = this.#inputPixmap.brightnessAverageAt(Math.floor(p.x), Math.floor(p.y), this.#blur)

          // const radius = lineHeight * ( 1 - imageLevel / 255) / 2 - 0.05;
          const radius = thickness * ( 1 - imageLevel / 255) / 2 - 0.05;

          const zoom=outputWidth/inputWidth;

          if (radius < 0.5) {
            p.x *= zoom;
            p.y *= zoom;
            hatchPoints2.push(p);
            // how far away should the next point be?
            stepx = 1.5;
          } else {
            const [ sidePoint1, sidePoint2 ] = this.#sidePoints(p, p2, radius);
            sidePoint1.x *= zoom;
            sidePoint1.y *= zoom;
            sidePoint2.x *= zoom;
            sidePoint2.y *= zoom;

            if (counter++ % 2) {
              hatchPoints2.push(sidePoint2);
            } else {
              hatchPoints2.push(sidePoint1);
            }

            // how far away should the next point be?
            stepx = Math.max(1.5, density - radius);

          }

        }
      }
      outputSvg += this.#poly2pathSmooth(hatchPoints2);
    }
    outputSvg += `</g></svg>`;
    return outputSvg;
  }
}



type Params = {
  inputImageUrl: string,
  inputCanvas?: HTMLCanvasElement,
  theta: number,
  width: number,
  height: number,
  margin: number
  waviness: number,
  lineHeight: number,
  thickness: number,
  density: number,
  sx: number,
  sy: number,
  tx: number,
  ty: number,
  blur: number
};

const defaultParams: Params = {
  inputImageUrl: 'portrait.jpg',
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


const paramsFromWidgets = () => {
  const params: Params = {...defaultParams};
  if (controlInputImage) {
    params.inputImageUrl = (controlInputImage as ImageUploadControl).imageUrl() as string;
    params.inputCanvas = (controlInputImage as ImageUploadControl).canvasEl();
  }
  params.theta = controlTheta.val() as number;
  params.waviness = controlWaviness.val() as number;
  params.lineHeight = controlLineHeight.val() as number;
  params.density = controlDensity.val() as number;
  params.thickness = controlThickness.val() as number;
  params.sx = controlSx.val() as number;
  params.sy = controlSy.val() as number;
  params.blur = controlBlur.val() as number;
  return params;
};


const render = (params?: any) => {
  if (!params) {
    params = paramsFromWidgets();
  }
  params.width ||= 800;
  params.height ||= 800;

  const excoffizator = new Excoffizer(params);
  delete params.inputCanvas; // don't put the whole image in the URL
  updateUrl(params);
  $('canvas').innerHTML = excoffizator.excoffize();
};


const controlTheta = new NumberControl({
  name: 'theta',
  label: 'Angle',
  value: defaultParams['theta'],
  renderFn: render,
  min: 0,
  max: 6.28,
  step: 0.01
});

const controlWaviness = new NumberControl({
  name: 'waviness',
  label: 'Waviness',
  value: defaultParams['waviness'],
  renderFn: render,
  min: 0,
  max: 10,
  step: 0.1
});

const controlLineHeight = new NumberControl({
  name: 'lineHeight',
  label: 'Line height',
  value: defaultParams['lineHeight'],
  renderFn: render,
  min: 5,
  max: 15,
  step: 0.1
});

const controlDensity = new NumberControl({
  name: 'density',
  label: 'Density',
  value: defaultParams['density'],
  renderFn: render,
  min: 1,
  max: 10,
  step: 0.1
});

const controlThickness = new NumberControl({
  label: 'Thickness',
  value: defaultParams['thickness'],
  renderFn: render,
  min: 1,
  max: 20,
  step: 0.1
});

const controlSx = new NumberControl({
  name: 'sx',
  label: 'Stretch X',
  value: defaultParams['sx'],
  renderFn: render,
  min: 0,
  max: 2,
  step: 0.01
});

const controlSy = new NumberControl({
  name: 'sy',
  label: 'Stretch Y',
  value: defaultParams['sy'],
  renderFn: render,
  min: 0,
  max: 2,
  step: 0.01
});

const controlBlur = new NumberControl({
  name: 'blur',
  label: 'Blur',
  value: defaultParams['blur'],
  renderFn: render,
  min: 1,
  max: 10
});

new SvgSaveControl({
  name: 'svgSave',
  canvasId: 'svg-canvas',
  label: 'Save SVG',
  saveFilename: 'excoffizer.svg'
});

const controlInputImage = new ImageUploadControl({
  name: 'inputImage',
  label: 'Image',
  value: defaultParams['inputImageUrl'],
  firstCallback: (instance: ImageUploadControl) => {
    const params = paramsFromUrl(defaultParams);
    controlTheta.set(params.theta);
    controlWaviness.set(params.waviness);
    controlLineHeight.set(params.lineHeight);
    controlDensity.set(params.density);
    controlThickness.set(params.thickness);
    controlSx.set(params.sx);
    controlSy.set(params.sy);
    controlBlur.set(params.blur);
    params.inputCanvas = instance.canvasEl();
    const excoffizator = new Excoffizer(params);
    $('canvas').innerHTML = excoffizator.excoffize();
    delete params.inputCanvas; // don't put the whole image in the URL
    updateUrl(params);
  },
  callback: (instance: ImageUploadControl) => {
    const params = paramsFromWidgets();
    params.inputCanvas = instance.canvasEl();
    const excoffizator = new Excoffizer(params);
    $('canvas').innerHTML = excoffizator.excoffize();
    delete params.inputCanvas; // don't put the whole image in the URL
    updateUrl(params);
  }
});
