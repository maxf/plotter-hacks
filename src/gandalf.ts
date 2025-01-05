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

const gandalfWorker = new Worker('build/gandalf-ww.js');
gandalfWorker.onmessage = function(e) {
  $('canvas').innerHTML = e.data;
}


const doRender = function() {
  const params = getParams(defaultParams);
  const canvas = imageSourceControl.canvas();
  const ctx = canvas.getContext('2d') as CanvasRenderingContext2D;
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  gandalfWorker.postMessage({ params, imageData });
};


const imageSourceControl = new ImageInputControl('imageSource', {
  name: 'Source',
  callback: doRender,
  initialImage: 'tbl.png'
});

new NumberControl('seed', {
  name: 'seed',
  value: defaultParams['seed'],
  callback: doRender,
  min: 0,
  max: 500
});


new NumberControl('cutoff', {
  name: 'White cutoff',
  value: defaultParams['cutoff'],
  callback: doRender,
  min: 0,
  max: 255
});


new NumberControl('nsamples', {
  name: 'Samples',
  value: defaultParams['nsamples'],
  callback: doRender,
  min: 10,
  max: 20_000,
});


new SvgSaveControl('svgSave', {
  canvasId: 'svg-canvas',
  name: 'Save SVG',
  saveFilename: 'gandalf.svg'
});

