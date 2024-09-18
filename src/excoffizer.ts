// copied from https://github.com/hughsk/boids/blob/master/index.js
import seedrandom from 'seedrandom';
import { Control, paramsFromUrl, updateUrl, $ } from './controls';

type Params = {
  inputImage: file,
  width: number,
  height: number,
};

const defaultParams: Params = {
  inputImage: 'images/portrait.png',
  width: 800,
  height: 800,
};


const paramsFromWidgets = () => {
  const params: Params = {...defaultParams};
  params.inputImage = controls.inputImage.val() as number;
  return params;
};


const render = (params?: any) => {
  if (!params) {
    params = paramsFromWidgets();
  }
  params.width ||= 800;
  params.height ||= 800;
  updateUrl(params);
  return `<svg id="svg-canvas" height="${params.height}" width="${params.width}" xmlns="http://www.w3.org/2000/svg"></svg>`
}


const controls = {
  inputImage: new Control('inputImage', 'Image', 'file', defaultParams['inputImage'], render)
};




// =========== First render =============

// Fetch plot parameters from the query string
const params = paramsFromUrl(defaultParams);

// populate the form controls from controls.params
Object.keys(params).forEach(key => {
  if (key in controls) {
    controls[key as keyof typeof controls].set(params[key as keyof typeof params]);
  }
});

$('canvas').innerHTML = render(params);
