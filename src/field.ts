import {
  NumberControl,
  SvgSaveControl,
  getParams,
  $
} from './controls';

const worker = new Worker('build/field-ww.js');
worker.onmessage = function(e) {
  $('canvas').innerHTML = e.data;
}


const renderPlot = function() {
  const params = getParams();
  worker.postMessage({ params });
};


new NumberControl('nbSamples', {
  name: 'NbSamples',
  value: 500,
  callback: renderPlot,
  min: 100,
  max: 10000
});

new NumberControl('fx', {
  name: 'fx',
  value: 20,
  callback: renderPlot,
  min: 1,
  max: 500
});

new NumberControl('fy', {
  name: 'fy',
  value: 20,
  callback: renderPlot,
  min: 1,
  max: 500,
});

new SvgSaveControl('svgSave', {
  canvasId: 'svg-canvas',
  name: 'Save SVG',
  saveFilename: 'field.svg'
});

renderPlot();
