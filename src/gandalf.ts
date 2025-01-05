import {
  NumberControl,
  ImageInputControl,
  SvgSaveControl,
  getParams,
  $
} from './controls';


const defaultParams = {
  inputImageUrl: 'portrait.jpg',
  width: 800,
  height: 800,
  cutoff: 85,
  nsamples: 8296,
  seed: 72
};

let canvas: HTMLCanvasElement;

let ctx: CanvasRenderingContext2D;

const gandalfWorker = new Worker('build/gandalf-ww.js');
gandalfWorker.onmessage = function(e) {
  $('canvas').innerHTML = e.data;
}

const doRender = function() {
  const params = getParams(defaultParams);
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  gandalfWorker.postMessage({ params, imageData });
};

const imageSourceControl = new ImageInputControl({
  name: 'imageSource',
  label: 'Source',
  callback: doRender,
  value: 'tbl.png'
});

canvas = imageSourceControl.canvas();
ctx = canvas.getContext('2d') as CanvasRenderingContext2D;


new NumberControl({
  name: 'seed',
  label: 'seed',
  value: defaultParams['seed'],
  callback: doRender,
  min: 0,
  max: 500
});


new NumberControl({
  name: 'cutoff',
  label: 'White cutoff',
  value: defaultParams['cutoff'],
  callback: doRender,
  min: 0,
  max: 255
});

new NumberControl({
  name: 'nsamples',
  label: 'Samples',
  value: defaultParams['nsamples'],
  callback: doRender,
  min: 10,
  max: 20_000,
});

new SvgSaveControl({
  name: 'svgSave',
  canvasId: 'svg-canvas',
  label: 'Save SVG',
  saveFilename: 'gandalf.svg'
});

