import {
  NumberControl,
  SvgSaveControl,
  getParams,
  $
} from './controls';


const defaultParams = {
  nbSamples: 50,
  fx: 100,
  fy: 100
};

const worker = new Worker('build/field-ww.js');
worker.onmessage = function(e) {
  $('canvas').innerHTML = e.data;
}


const renderPlot = function() {
  const params = getParams(defaultParams);
  worker.postMessage({ params });
};


new NumberControl('nbSamples', {
  name: 'NbSamples',
  value: defaultParams['nbSamples'],
  callback: renderPlot,
  min: 100,
  max: 10000
});

new NumberControl('fx', {
  name: 'fx',
  value: defaultParams['fx'],
  callback: renderPlot,
  min: 10,
  max: 1000
});

new NumberControl('fy', {
  name: 'fy',
  value: defaultParams['fy'],
  callback: renderPlot,
  min: 10,
  max: 1000,
});

new SvgSaveControl('svgSave', {
  canvasId: 'svg-canvas',
  name: 'Save SVG',
  saveFilename: 'field.svg'
});

renderPlot();
