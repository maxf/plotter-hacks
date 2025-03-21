import {
  NumberControl,
  ImageInputControl,
  SvgSaveControl,
  TextAreaControl,
  getParams,
  $
} from './controls';

async function getData() {
  try {
    const response: Response = await fetch('apoo.txt');
    if (!response.ok) {
      throw new Error(`Response status: ${response.status}`);
    }
    const text = await response.text();
    return text.replace(/\n+/g, ' - ');
  } catch (error: any) {
    console.error(error.message);
    return 'error';
  }
}

const defaultParams = {
  inputImageUrl: 'moon-boot.png',
  text: await getData(),
  width: 800,
  height: 800,
  cutoff: 255,
  fontSize: 3.2,
  nbLayers: 6,
  lineHeight: 1
};

const textorizer2Worker = new Worker('build/textorizer2-ww.js');
textorizer2Worker.onmessage = function(e) {
  $('canvas').innerHTML = e.data;
}


const doRender = function() {
  const params = getParams(defaultParams);
  const canvas = imageSourceControl.canvas();
  const ctx = canvas.getContext('2d') as CanvasRenderingContext2D;
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  textorizer2Worker.postMessage({ params, imageData });
};


const imageSourceControl = new ImageInputControl('imageSource', {
  name: 'Source',
  callback: doRender,
  initialImage: defaultParams['inputImageUrl'],
  updateUrl: false
});


new NumberControl('cutoff', {
  name: 'White cutoff',
  value: defaultParams['cutoff'],
  callback: doRender,
  min: 0,
  max: 255,
  updateUrl: true
});


new NumberControl('fontSize', {
  name: 'Font size',
  value: defaultParams['fontSize'],
  callback: doRender,
  min: 1,
  max: 10,
  step: 0.1,
  updateUrl: true
});

new NumberControl('lineHeight', {
  name: 'Line Height',
  value: defaultParams['lineHeight'],
  callback: doRender,
  min: 0.5,
  max: 2,
  step: 0.1,
  updateUrl: true
});

new NumberControl('nbLayers', {
  name: 'Layers',
  value: defaultParams['nbLayers'],
  callback: doRender,
  min: 1,
  max: 10,
  updateUrl: true
});

new TextAreaControl('text', {
  name: 'Text',
  value: defaultParams['text'],
  callback: doRender,
  updateUrl: false
});

new SvgSaveControl('svgSave', {
  canvasId: 'svg-canvas',
  name: 'Save SVG',
  saveFilename: 'textorizer2.svg'
});
