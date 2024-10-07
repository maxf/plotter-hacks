//import seedrandom from 'seedrandom';
import { ImageUploadControl, SvgSaveControl, paramsFromUrl, updateUrl,  $ } from './controls';
import { Pixmap } from './pixmap';
//import { Delaunay } from 'd3-delaunay';
import { Point, solve } from '@wemap/salesman.js';


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

    const points: Point[] = [];
    const inputWidth = this.#inputPixmap.width;
    const inputHeight = this.#inputPixmap.height;
    const outputWidth  = this.#outputWidth;
    const outputHeight = this.#outputWidth * inputHeight / inputWidth;

    // See: https://observablehq.com/@mbostock/voronoi-stippling

    // Initialize the points using rejection sampling.
    for (let i = 0; i < 5_000; ++i) { // Do the following 10k times:
      // for each sample, 30 times pick a random point
      for (let j = 0; j < 30; ++j) {
        const x = Math.floor(Math.random() * inputWidth);
        const y = Math.floor(Math.random() * inputHeight);

        
        const imageLevel = this.#inputPixmap.brightnessAt(Math.floor(x), Math.floor(y));
        // the darker the image at this point, the more likely we're going to keep the point.
        if (200 * Math.random() > imageLevel) {

          const inputOutputScale=outputWidth/inputWidth;
          points.push(new Point(x*inputOutputScale, y*inputOutputScale));
          //points.push(x*inputOutputScale);
          //points.push(y*inputOutputScale);
          break;
        }
      }
    }


    //    const delaunay = Delaunay.from(points);
    //    const voronoi = delaunay.voronoi([0, 0, 960, 500]);
    //    console.log(voronoi);

    const svgPoints = [];
    for (let i=0; i<points.length; i++) {
      svgPoints.push(`<circle cx="${points[i].x}" cy="${points[i].y}" r="0.5"/>`);
    }

    const solution = solve(points, 0.9999);
    //const ordered_points = solution.map(i => points[i]);

    const svgPathD = solution.map(i => `${points[i].x} ${points[i].y} L`);


    return `
      <svg id="svg-canvas" width="${outputWidth}" height="${outputHeight}" viewBox="0 0 ${outputWidth} ${outputHeight}">
        <g style="stroke: black; fill: black;">
          ${svgPoints.join('')}
        </g>
        <g style="stroke: black; fill: none;">
          <path d="M ${svgPathD.join('')}"/>
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
