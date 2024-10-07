//import seedrandom from 'seedrandom';
import { ImageUploadControl, SvgSaveControl, paramsFromUrl, updateUrl,  $ } from './controls';
import { Pixmap } from './pixmap';
//import { Delaunay } from 'd3-delaunay';


class DrunkTravellingSalesman {
  #params: Params;
  #inputPixmap: Pixmap;

  constructor(params: Params) {
    this.#params = params;
    this.#inputPixmap = new Pixmap(this.#params.inputCanvas as HTMLCanvasElement);
  }

  // TODO: make async
  toSvg(): string {

    const points = [];
    const inputWidth = this.#inputPixmap.width;
    const inputHeight = this.#inputPixmap.height;
    // See: https://observablehq.com/@mbostock/voronoi-stippling

    // Initialize the points using rejection sampling.
    for (let i = 0; i < 10000; ++i) { // Do the following 10k times:
      // for each sample, 30 times pick a random point
      for (let j = 0; j < 30; ++j) {
        const x = points[i * 2] = Math.floor(Math.random() * inputWidth);
        const y = points[i * 2 + 1] = Math.floor(Math.random() * inputHeight);

        const imageLevel = this.#inputPixmap.brightnessAt(Math.floor(x), Math.floor(y));

        // the darker the image at this point, the more likely we're going to keep the point.
        if (255 * Math.random() > imageLevel) break;
      }
    }


    //    const delaunay = Delaunay.from(points);
    //    const voronoi = delaunay.voronoi([0, 0, 960, 500]);
    //    console.log(voronoi);

    const svgPoints = [];
    for (let i=0; i<10_000; i++) {
      svgPoints.push(`<circle cx="${points[i*2]}" cy="${points[i*2+1]}" r="0.1"/>`);
    }


    return `
      <svg>
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
};


const defaultParams = {
  inputImageUrl: 'portrait.jpg',
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
