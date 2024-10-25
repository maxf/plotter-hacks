import {
  NumberControl,
  ImageUploadControl,
  CheckboxControl,
  SvgSaveControl,
  paramsFromUrl,
  updateUrl,
  $
} from './controls';


const defaultParams = {
  inputImageUrl: 'tbl.png',
  width: 800,
  height: 800,
  cutoff: 210,
  nsamples: 10_000,
  optIter: 1,
  showStipple: false,
  showPoly: false,
  showDts: true,
  seed: 128,
  curvature: 20
};


const paramsFromWidgets = (): any => {
  const params = {...defaultParams};
  params.inputImageUrl = imageUpload.imageUrl() as string;
  params.cutoff = controlCutoff.val() as number;
  params.nsamples = controlNSamples.val() as number;
  params.optIter = controlOptIter.val() as number;
  params.showStipple = controlShowStipple.val() as boolean;
  params.showPoly = controlShowPoly.val() as boolean;
  params.showDts = controlShowDts.val() as boolean;
  params.seed = controlSeed.val() as number;
  params.curvature = controlCurvature.val() as number;
  return params;
};

let canvas: HTMLCanvasElement;
let ctx: CanvasRenderingContext2D;

const dtsWorker = new Worker('build/dts-ww.js');
dtsWorker.onmessage = function(e) {
  $('canvas').innerHTML = e.data;
}

const doRender = function(params: any) {
  $('canvas').innerHTML = "<h1>Rendering. Please wait</h1>";
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  dtsWorker.postMessage({ params, imageData });
  updateUrl(params);
};

const renderFromQsp = function() {
  const params = paramsFromUrl(defaultParams);
  doRender(params);
  controlCutoff.set(params.cutoff);
  controlOptIter.set(params.optIter);
  controlNSamples.set(params.nsamples);
  controlShowStipple.set(params.showStipple);
  controlShowPoly.set(params.showPoly);
  controlShowDts.set(params.showDts);
  controlSeed.set(params.seed);
  controlCurvature.set(params.curvature);
};

const renderFromWidgets = function() {
  doRender(paramsFromWidgets());
};

const imageUpload = new ImageUploadControl({
  name: 'inputImage',
  label: 'Image',
  value: defaultParams['inputImageUrl'],
  firstCallback: renderFromQsp,
  callback: renderFromWidgets
});

canvas = imageUpload.canvasEl();
ctx = canvas.getContext('2d') as CanvasRenderingContext2D;

const controlSeed = new NumberControl({
  name: 'seed',
  label: 'seed',
  value: defaultParams['seed'],
  renderFn: renderFromWidgets,
  min: 0,
  max: 500
});


const controlCutoff = new NumberControl({
  name: 'cutoff',
  label: 'White cutoff',
  value: defaultParams['cutoff'],
  renderFn: renderFromWidgets,
  min: 0,
  max: 255
});

const controlNSamples = new NumberControl({
  name: 'nsamples',
  label: 'Samples',
  value: defaultParams['nsamples'],
  renderFn: renderFromWidgets,
  min: 10,
  max: 20_000,
});

const controlOptIter = new NumberControl({
  name: 'optIter',
  label: 'Optimisation',
  value: defaultParams['optIter'],
  renderFn: renderFromWidgets,
  min: 0,
  max: 20_000_000,
});

const controlCurvature = new NumberControl({
  name: 'curvature',
  label: 'Curvature',
  value: defaultParams['curvature'],
  renderFn: renderFromWidgets,
  min: 1,
  max: 50,
});


const controlShowStipple = new CheckboxControl({
  name: 'showStipple',
  label: 'Stipple points',
  value: defaultParams['showStipple'],
  renderFn: renderFromWidgets
});

const controlShowPoly = new CheckboxControl({
  name: 'showPoly',
  label: 'Polygons',
  value: defaultParams['showPoly'],
  renderFn: renderFromWidgets
});

const controlShowDts = new CheckboxControl({
  name: 'Splines',
  label: 'Dts points',
  value: defaultParams['showDts'],
  renderFn: renderFromWidgets
});

new SvgSaveControl({
  name: 'svgSave',
  canvasId: 'svg-canvas',
  label: 'Save SVG',
  saveFilename: 'dts.svg'
});

