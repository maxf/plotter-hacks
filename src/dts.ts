//import seedrandom from 'seedrandom';
import { ImageUploadControl, SvgSaveControl, paramsFromUrl, updateUrl,  $ } from './controls';
import { Pixmap } from './pixmap';
import { Delaunay } from 'd3-delaunay';
//import { Point, solve } from '@wemap/salesman.js';


class DrunkTravellingSalesman {
  #params: Params;
  #inputPixmap: Pixmap;
  #outputWidth: number;

  constructor(params: Params) {
    this.#params = params;
    this.#inputPixmap = new Pixmap(this.#params.inputCanvas as HTMLCanvasElement);
    this.#outputWidth = params.width;
  }

  // TODO: make async
  toSvg(): string {

    const n = 10_000;
    const points = new Float64Array(n*2);
    const inputWidth = this.#inputPixmap.width;
    const inputHeight = this.#inputPixmap.height;
    const outputWidth  = this.#outputWidth;
    const outputHeight = this.#outputWidth * inputHeight / inputWidth;

    // See: https://observablehq.com/@mbostock/voronoi-stippling

    // Initialize the points using rejection sampling.
    for (let i = 0; i < n; ++i) { // Do the following 10k times:
      // for each sample, 30 times pick a random point
      for (let j = 0; j < 30; ++j) {
        const x = Math.random() * outputWidth;
        const y = Math.random() * outputHeight
        const imageX = Math.floor(x * inputWidth / outputWidth);
        const imageY = Math.floor(y * inputWidth / outputWidth);
        const imageLevel = this.#inputPixmap.brightnessAt(imageX, imageY);
        // the darker the image at this point, the more likely we're going to keep the point.
        if (200 * Math.random() > imageLevel) {
          points[2*i] = x;
          points[2*i+1] = y;
          break;
        }
      }
    }

    // run voronoi and adjust points iteratively

    const delaunay = new Delaunay(points);
    const voronoi = delaunay.voronoi([0, 0, outputWidth, outputHeight]);
    const centroids = new Float64Array(n * 2); // centroids
    const weights = new Float64Array(n); // weights

    // over a few iterations...
    for (let k = 0; k < 80; ++k) {

      // Compute the weighted centroid for each Voronoi cell.
      centroids.fill(0);
      weights.fill(0);
      let delaunayIndex = 0;
      // loop over the pixels in our image and adjust the centroid
      // of the voronoi cell where it falls
      for (let inputY = 0; inputY < inputHeight; ++inputY) {
        for (let inputX = 0; inputX < inputWidth; ++inputX) {
          const weight = 255 - this.#inputPixmap.brightnessAt(inputX, inputY);
          const outputX = inputX * outputWidth / inputWidth;
          const outputY = inputY * outputWidth / inputWidth;
          delaunayIndex = delaunay.find(outputX, outputY, delaunayIndex);
          weights[delaunayIndex] += weight;
          centroids[delaunayIndex * 2] += weight * outputX;
          centroids[delaunayIndex * 2 + 1] += weight * outputY;
        }
      }

      // now 'centroids' is an array of the centroid for each cell
      // (some centroids can be 0 though, if no pixel fell on the cell)
      // and 'weigths' are the weights of each cell


      // Relax the diagram by moving points to the weighted centroid.
      // Wiggle the points a little bit so they don’t get stuck.
      const w = Math.pow(k + 1, -0.8) * 10;
      for (let i = 0; i < n; ++i) {
        const x0 = points[i * 2], y0 = points[i * 2 + 1];
        const x1 = weights[i] ? centroids[i * 2] / weights[i] : x0, y1 = weights[i] ? centroids[i * 2 + 1] / weights[i] : y0;
        points[i * 2] = x0 + (x1 - x0) * 1.8 + (Math.random() - 0.5) * w;
        points[i * 2 + 1] = y0 + (y1 - y0) * 1.8 + (Math.random() - 0.5) * w;
      }

      voronoi.update();
    }

    // at this point we have stipple in the 'points' array
    // so we can move on to the travelling salesman problem.

    const svgPoints = [];
    for (let i=0; i<n; i++) {
      svgPoints.push(`<circle cx="${points[2*i]}" cy="${points[2*i+1]}" r="0.5"/>`);
    }

    //    const solution = solve(points, 0.999999);
    //const ordered_points = solution.map(i => points[i]);

    //const svgPathD = solution.map(i => `${points[i].x} ${points[i].y} L`);

          // <!--        <g style="stroke: black; fill: none;">
          // <path d="M ${svgPathD.join('')}"/>
          // </g>-->

    return `
      <svg id="svg-canvas" width="${outputWidth}" height="${outputHeight}" viewBox="0 0 ${outputWidth} ${outputHeight}">
        <g style="stroke: black; fill: black;">
          ${svgPoints.join('')}
        </g>
      </svg>
    `;
  }
}


type Params = {
  inputImageUrl: string,
  inputCanvas: HTMLCanvasElement,
  width: number,
  height: number
};


const defaultParams = {
  inputImageUrl: 'portrait.jpg',
  width: 800,
  height: 800
};


const paramsFromWidgets = (): any => {
  const params = {...defaultParams};
  return params;
};




new SvgSaveControl({
  name: 'svgSave',
  canvasId: 'svg-canvas',
  label: 'Save SVG',
  saveFilename: 'dts.svg'
});

new ImageUploadControl({
  name: 'inputImage',
  label: 'Image',
  value: defaultParams['inputImageUrl'],
  firstCallback: (instance: ImageUploadControl) => {
    const params = paramsFromUrl(defaultParams);
    params.inputCanvas = instance.canvasEl();
    const dts = new DrunkTravellingSalesman(params);
    $('canvas').innerHTML = dts.toSvg();
    delete params.inputCanvas; // don't put the whole image in the URL
    updateUrl(params);
  },
  callback: (instance: ImageUploadControl) => {
    const params = paramsFromWidgets();
    params.inputCanvas = instance.canvasEl();
    const dts = new DrunkTravellingSalesman(params);
    $('canvas').innerHTML = dts.toSvg();
    delete params.inputCanvas; // don't put the whole image in the URL
    updateUrl(params);
  }
});
