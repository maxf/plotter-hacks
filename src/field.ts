import {
  NumberControl,
  SvgSaveControl,
  TextSaveControl,
  getParams,
  $
} from './controls';

const worker = new Worker('build/field-ww.js');
worker.onmessage = function(e) {
  console.log(223, e)
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

new TextSaveControl('gcodeSave', {
  name: 'Save G-code',
  saveFilename: 'field.gcode',
});


renderPlot();
