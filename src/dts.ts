import {
  NumberControl,
  ImageUploadControl,
  CheckboxControl,
  SvgSaveControl,
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
  showVoronoi: false,
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
  params.showVoronoi = controlShowVoronoi.val() as boolean;
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

const controlSeed = new NumberControl('seed', {
  name: 'seed',
  value: defaultParams['seed'],
  callback: renderFromWidgets,
  min: 0,
  max: 500
});


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
  max: 20_000,
});

const controlOptIter = new NumberControl('optIter', {
  name: 'Optimisation',
  value: defaultParams['optIter'],
  callback: renderFromWidgets,
  min: 0,
  max: 20_000_000,
});

const controlCurvature = new NumberControl('curvature', {
  name: 'Curvature',
  value: defaultParams['curvature'],
  callback: renderFromWidgets,
  min: 0,
  max: 50,
});


const controlShowStipple = new CheckboxControl('showStipple', {
  name: 'Stipple points',
  value: defaultParams['showStipple'],
  callback: renderFromWidgets
});

const controlShowPoly = new CheckboxControl('showPoly', {
  name: 'Polygons',
  value: defaultParams['showPoly'],
  callback: renderFromWidgets
});

const controlShowDts = new CheckboxControl('showSplines', {
  name: 'Splines',
  value: defaultParams['showDts'],
  callback: renderFromWidgets
});

const controlShowVoronoi = new CheckboxControl('showVoronoi', {
  name: 'Voronoi diagram',
  value: defaultParams['showVoronoi'],
  callback: renderFromWidgets
});


new SvgSaveControl('svgSave', {
  canvasId: 'svg-canvas',
  name: 'Save SVG',
  saveFilename: 'dts.svg'
});

