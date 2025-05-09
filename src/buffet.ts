import {
  NumberControl,
  ImageUploadControl,
  SvgSaveControl,
  updateUrl,
  $
} from './controls';


const defaultParams = {
  inputImageUrl: 'images/boat.jpg',
  width: 800,
  height: 800,
  cutoff: 90,
  nsamples: 250, // vector grid is nsamples x nsamples
  strokeLength: 10
};


const paramsFromWidgets = (): any => {
  const params = {...defaultParams};
  params.inputImageUrl = imageUpload.imageUrl() as string;
  params.cutoff = controlCutoff.val() as number;
  params.nsamples = controlNSamples.val() as number;
  params.strokeLength = controlStrokeLength.val() as number;
  return params;
};

let canvas: HTMLCanvasElement;
let ctx: CanvasRenderingContext2D;

const buffetWorker = new Worker('build/buffet-ww.js');
buffetWorker.onmessage = function(e) {
  $('canvas').innerHTML = e.data;
}

const doRender = function(params: any) {
  $('canvas').innerHTML = "<h1>Rendering. Please wait</h1>";
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  buffetWorker.postMessage({ params, imageData });
  updateUrl(params);
};

const renderFromWidgets = function() {
  doRender(paramsFromWidgets());
};

const imageUpload = new ImageUploadControl('inputImage', {
  name: 'Image',
  initialImage: defaultParams['inputImageUrl'],
  callback: renderFromWidgets
});

canvas = imageUpload.canvas();
ctx = canvas.getContext('2d') as CanvasRenderingContext2D;

const controlCutoff = new NumberControl('cutoff', {
  name: 'White cutoff',
  value: defaultParams['cutoff'],
  callback: renderFromWidgets,
  min: 0,
  max: 255
});

const controlNSamples = new NumberControl('nsamples', {
  name: 'Samples',
  value: defaultParams['nsamples'],
  callback: renderFromWidgets,
  min: 10,
  max: 500,
});

const controlStrokeLength = new NumberControl('strokeLength', {
  name: 'Stroke length',
  value: 10,
  callback: renderFromWidgets,
  min: 1,
  max: 50
});

new SvgSaveControl('svgSave', {
  canvasId: 'svg-canvas',
  name: 'Save SVG',
  saveFilename: 'vector-field.svg'
});

