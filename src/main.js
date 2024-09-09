import { renderCeltic } from './celtic';
import { renderBoids } from './boids-plot';

const $ = (id) => document.getElementById(id);



const defaultParams = {
  'plotType': 'Polar',
  'margin': 100,
  'seed': 100,
  'shape1': 0.3,
  'shape2': 0.3,
  'showGraph': false,
  'nbNodes': 4,
  'cells': 4,
  'perturbation': 0,
  'nbOrbits': 3,
  'nbNodesPerOrbit': 3,
  'iterations': 100,
  'nboids': 10,
  'speedLimit': 30,
  'cohesionForce': 0.5
}


const paramsFromWidgets = () => {
  const params = {};
  // Common params
  ['margin', 'seed', 'shape1', 'shape2'].forEach(id => {
    params[id] = parseFloat($(id).value);
  });
  params['showGraph'] = $('showGraph').checked;
  params['plotType'] = $('plotType').value;

  // Random only
  params['nbNodes'] = parseInt($('nbNodes').value);

  // Grid
  ['cells', 'perturbation'].forEach(id => {
    params[id] = parseInt($(id).value);
  });

  // Polar
  ['cells', 'nbOrbits', 'nbNodesPerOrbit', 'perturbation'].forEach(id => {
    params[id] = parseInt($(id).value);
  });

  // Boids
  ['iterations', 'nboids', 'speedLimit', 'cohesionForce'].forEach(id => {
    params[id] = parseFloat($(id).value);
  });

  return params;
};


const paramsFromUrl = (defaults) => {
  const params = new URLSearchParams(window.location.search);
  const result = defaults;
  for (const [key, value] of params) {
    result[key] = isNaN(value) ? value : parseFloat(value);
  }
  return result;
};


const saveSvg = function() {
  const svgEl = $('svg-canvas');
  svgEl.setAttribute("xmlns", "http://www.w3.org/2000/svg");
  var svgData = svgEl.outerHTML;
  var preface = '<?xml version="1.0" standalone="no"?>';
  var svgBlob = new Blob([preface, svgData], {type:"image/svg+xml;charset=utf-8"});
  var svgUrl = URL.createObjectURL(svgBlob);
  var downloadLink = document.createElement("a");
  downloadLink.href = svgUrl;
  downloadLink.download = 'celtic.svg';
  document.body.appendChild(downloadLink);
  downloadLink.click();
  document.body.removeChild(downloadLink);
}

const paramsPerType = {
  Random: ['showGraph', 'shape1', 'shape2', 'nbNodes'],
  Grid: ['showGraph', 'shape1', 'shape2', 'cells', 'perturbation'],
  Polar: ['showGraph', 'shape1', 'shape2', 'nbOrbits', 'nbNodesPerOrbit', 'perturbation'],
  Boids: ['iterations', 'nboids', 'speedLimit', 'cohesionForce'],
  common: ['seed', 'plotType', 'margin']
};

const activateControls = plotType => {
  const show = id => $(`${id}-control`).style.display = 'inline';
  document.querySelectorAll('.control').forEach(el => el.style.display = 'none');
  ['margin', 'seed'].forEach(show);
  paramsPerType[plotType].forEach(show);
};

const updateUrl = params => {
  const url = new URL(window.location);
  url.search = '';
  const qsParams = paramsPerType.common.concat(paramsPerType[params.plotType]);
  qsParams.forEach(key => {
    url.searchParams.set(key, params[key]);
  });
  history.pushState(null, '', url);
};

// ========== Main rendering function ===========

const render = params => {
  params.width ||= 800;
  params.height ||= 800;

  updateUrl(params);

  const renderFn = (['Random', 'Grid', 'Polar'].includes(params.plotType))
        ? renderCeltic
        : renderBoids;

  return renderFn(params);
}

// ============ Add event listeners ============

$('showGraph').addEventListener('change', () => {
  $('canvas').innerHTML = render(paramsFromWidgets());
});

$('plotType').addEventListener('change', () => {
  activateControls($('plotType').value);
  $('canvas').innerHTML = render(paramsFromWidgets());
});

$('saveSvg').addEventListener('click', saveSvg);

[
  'margin', 'seed', 'shape1', 'shape2', 'nbNodes', 'cells', 'nbOrbits',
  'nbNodesPerOrbit', 'perturbation', 'iterations', 'nboids', 'speedLimit',
  'cohesionForce'
].forEach(id => {
  $(id).addEventListener('change', event => {
    $(`${id}-value`).innerText = event.target.value;
    $('canvas').innerHTML = render(paramsFromWidgets());
  });
});


// =========== First render =============

// Fetch plot parameters from the query string
const params = paramsFromUrl(defaultParams);

// populate the form controls from params
[
  'margin', 'seed', 'shape1', 'shape2', 'nbNodes', 'cells', 'nbOrbits',
  'nbNodesPerOrbit', 'perturbation', 'iterations', 'nboids', 'speedLimit',
  'cohesionForce'
].forEach(key => {
  $(key).value = $(`${key}-value`).innerText = params[key];
});

$('showGraph').checked = params.showGraph;
$('plotType').value = params.plotType;

// only show the relevant ones
activateControls(params.plotType);


$('canvas').innerHTML = render(params);
