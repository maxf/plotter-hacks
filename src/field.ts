import {
  NumberControl,
  SvgSaveControl,
  TextSaveControl,
  getParams,
  $
} from './controls';

const worker = new Worker('build/field-ww.js');
worker.onmessage = function(e) {
  $('canvas').innerHTML = e.data.svg;
  ($('gcodeSave-text') as HTMLInputElement).value = e.data.gcode;
}


const renderPlot = function() {
  const params = getParams();
  worker.postMessage({ params });
};


new NumberControl('nbSamples', {
  name: 'NbSamples',
  value: 500,
  callback: renderPlot,
  min: 1,
  max: 10000
});

new NumberControl('ls', {
  name: 'Landing speed', // maximum length of stroke landing
  value: 5,
  callback: renderPlot,
  min: 1,
  max: 20
});

new NumberControl('ts', {
  name: 'Takeoff speed', // maximum length of stroke takeoff
  value: 10,
  callback: renderPlot,
  min: 1,
  max: 20,
});

new SvgSaveControl('svgSave', {
  canvasId: 'svg-canvas',
  name: 'Save SVG',
  saveFilename: 'field.svg'
});

new TextSaveControl('gcodeSave', {
  name: 'Save G-code',
  saveFilename: 'field.gcode',
});


renderPlot();
