import {
  NumberControl,
  SvgSaveControl,
  getParams,
  $
} from './controls';


const defaultParams = {
  density: 50
};

const worker = new Worker('build/field-ww.js');
worker.onmessage = function(e) {
  $('canvas').innerHTML = e.data;
}


const renderPlot = function() {
  const params = getParams(defaultParams);
  worker.postMessage({ params });
};


new NumberControl('density', {
  name: 'Density',
  value: defaultParams['density'],
  callback: renderPlot,
  min: 10,
  max: 100
});

new SvgSaveControl('svgSave', {
  canvasId: 'svg-canvas',
  name: 'Save SVG',
  saveFilename: 'field.svg'
});

renderPlot();
