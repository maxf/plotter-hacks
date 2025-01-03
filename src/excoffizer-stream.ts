// copied from https://github.com/hughsk/boids/blob/master/index.js
//import seedrandom from 'seedrandom';
import { NumberControl, VideoStreamControl, SvgSaveControl, TextControl, $, getParams } from './controls';
import { Pixmap } from './pixmap';


class Excoffizer {
  #params;
  #inputPixmap: Pixmap;
  #wiggleFrequency;
  #wiggleAmplitude;
  #blur;
  #outputWidth: number;
  #cutoff: number;
  #style: string;

  constructor(params: any, inputCanvas: HTMLCanvasElement) {
    this.#params = params;
    this.#params.tx = 1;
    this.#params.ty = 1;
    const ctx = inputCanvas.getContext('2d') as CanvasRenderingContext2D;
    const imageData: ImageData = ctx.getImageData(
      0, 0,
      inputCanvas.width, inputCanvas.height
    );
    this.#inputPixmap = new Pixmap(imageData);
    this.#wiggleFrequency = this.#params.waviness/100.0;
    this.#wiggleAmplitude = this.#wiggleFrequency===0 ? 0 : 0.5/this.#wiggleFrequency;
    this.#blur = params.blur;
    this.#outputWidth = params.width;
    this.#cutoff = params.cutoff;
    this.#style = params.style;
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
        <g style="${this.#style}">
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

          //const radius = lineHeight * ( 1 - imageLevel / 255) / 2 - 0.05;
          const radius = thickness * ( 1 - imageLevel / 255) / 3 - 0.05;

          const zoom=outputWidth/inputWidth;

          if (radius < this.#cutoff) {
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
            //stepx = Math.max(0.5, density - radius);
            stepx = Math.max(0.3, density - radius);
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
  context?: CanvasRenderingContext2D,
  theta: number,
  width: number,
  height: number,
  canvasWidth: number,
  canvasHeight: number,
  margin: number
  waviness: number,
  lineHeight: number,
  thickness: number,
  density: number,
  sx: number,
  sy: number,
  tx: number,
  ty: number,
  blur: number,
  cutoff: number,
  style: string
};


const defaultParams: Params = {
  theta: 3.58,
  width: 800,
  height: 800,
  canvasWidth: 100,
  canvasHeight: 100,
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
  cutoff: 0.5,
  style: "stroke: black; stroke-width: 1; fill: none"
};


const render = () => {
  const params = getParams(defaultParams);
  params['width'] ||= 800;
  params['height'] ||= 800;
  const excoffizator = new Excoffizer(params, videoStream.canvas());
  $('canvas').innerHTML = excoffizator.excoffize();
};


new NumberControl({
  name: 'margin',
  label: 'Margin',
  value: defaultParams['margin'],
  callback: render,
  min: 0,
  max: 500
});


new TextControl({
  name: 'style',
  label: 'CSS Style',
  value: defaultParams['style'],
  callback: render
});


new NumberControl({
  name: 'theta',
  label: 'Angle',
  value: defaultParams['theta'],
  callback: render,
  min: 0,
  max: 6.28,
  step: 0.01
});


new NumberControl({
  name: 'waviness',
  label: 'Waviness',
  value: defaultParams['waviness'],
  callback: render,
  min: 0,
  max: 10,
  step: 0.1
});


new NumberControl({
  name: 'lineHeight',
  label: 'Line height',
  value: defaultParams['lineHeight'],
  callback: render,
  min: 1,
  max: 15,
  step: 0.1
});


new NumberControl({
  name: 'density',
  label: 'Density',
  value: defaultParams['density'],
  callback: render,
  min: 1,
  max: 4,
  step: 0.1
});


new NumberControl({
  name: 'thickness',
  label: 'Thickness',
  value: defaultParams['thickness'],
  callback: render,
  min: 1,
  max: 10,
  step: 0.1
});


new NumberControl({
  name: 'sx',
  label: 'Stretch X',
  value: defaultParams['sx'],
  callback: render,
  min: 0,
  max: 2,
  step: 0.01
});


new NumberControl({
  name: 'sy',
  label: 'Stretch Y',
  value: defaultParams['sy'],
  callback: render,
  min: 0,
  max: 2,
  step: 0.01
});


new NumberControl({
  name: 'blur',
  label: 'Blur',
  value: defaultParams['blur'],
  callback: render,
  min: 1,
  max: 10
});


new NumberControl({
  name: 'cutoff',
  label: 'White cutoff',
  value: defaultParams['cutoff'],
  callback: render,
  min: 0.1,
  max: 1,
  step: 0.01
});


new SvgSaveControl({
  name: 'svgSave',
  canvasId: 'svg-canvas',
  label: 'Save SVG',
  saveFilename: 'excoffizer.svg'
});


const videoStream = new VideoStreamControl({
  name: 'inputStream',
  label: 'Stream',
  callback: render
});
