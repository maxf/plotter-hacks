import {
  NumberControl,
  SvgSaveControl,
  getParams,
  $
} from './controls';


const defaultParams = {
  rectSize: 200
};

const worker = new Worker('build/template-ww.js');
worker.onmessage = function(e) {
  $('canvas').innerHTML = e.data;
}


const renderPlot = function() {
  const params = getParams(defaultParams);
  worker.postMessage({ params });
};


new NumberControl('rectSize', {
  name: 'Rectangle size',
  value: defaultParams['rectSize'],
  callback: renderPlot,
  min: 100,
  max: 500
});

new SvgSaveControl('svgSave', {
  canvasId: 'svg-canvas',
  name: 'Save SVG',
  saveFilename: 'template.svg'
});

renderPlot();
