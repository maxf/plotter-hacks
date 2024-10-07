//import seedrandom from 'seedrandom';
import { ImageUploadControl, SvgSaveControl, paramsFromUrl, updateUrl,  $ } from './controls';
//import { Pixmap } from './pixmap';
import { Delaunay } from 'd3-delaunay';


class DrunkTravellingSalesman {
  #params: Params;

  constructor(params: Params) {
    this.#params = params;

    const points = [[0, 0], [0, 1], [1, 0], [1, 1]];
    const delaunay = Delaunay.from(points);
    const voronoi = delaunay.voronoi([0, 0, 960, 500]);

    console.log(voronoi);
  }
  toSvg(): string {
    return `<svg>${this.#params.inputImageUrl}</svg>`;
  }
}


type Params = {
  inputImageUrl: string,
  inputCanvas?: HTMLCanvasElement,
};


const defaultParams: Params = {
  inputImageUrl: 'portrait.jpg',
};


const paramsFromWidgets = (): Params => {
  const params: Params = {...defaultParams};
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
