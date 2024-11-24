import {
  NumberControl,
  ImageUploadControl,
  SvgSaveControl,
  paramsFromUrl,
  updateUrl,
  $
} from './controls';


const defaultParams = {
  inputImageUrl: 'portrait.jpg',
  width: 800,
  height: 800,
  cutoff: 90,
  nsamples: 250, // vector grid is nsamples x nsamples
};


const paramsFromWidgets = (): any => {
  const params = {...defaultParams};
  params.inputImageUrl = imageUpload.imageUrl() as string;
  params.cutoff = controlCutoff.val() as number;
  params.nsamples = controlNSamples.val() as number;
  return params;
};

let canvas: HTMLCanvasElement;
let ctx: CanvasRenderingContext2D;

const vectorFieldWorker = new Worker('build/vector-field-ww.js');
vectorFieldWorker.onmessage = function(e) {
  $('canvas').innerHTML = e.data;
}

const doRender = function(params: any) {
  $('canvas').innerHTML = "<h1>Rendering. Please wait</h1>";
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  vectorFieldWorker.postMessage({ params, imageData });
  updateUrl(params);
};

const renderFromQsp = function() {
  const params = paramsFromUrl(defaultParams);
  doRender(params);
  controlCutoff.set(params.cutoff);
  controlNSamples.set(params.nsamples);
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
  max: 500,
});

new SvgSaveControl({
  name: 'svgSave',
  canvasId: 'svg-canvas',
  label: 'Save SVG',
  saveFilename: 'vector-field.svg'
});

