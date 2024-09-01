import { renderCeltic } from './celtic';
import { renderBoids } from './boids-plot';

const $ = (id) => document.getElementById(id);

const widgetValues = () => {
  const params = {};
  // Common params
  ['margin', 'seed', 'shape1', 'shape2', 'perturbation'].forEach(id => {
    params[id] = parseFloat($(id).value);
  });
  params['showGraph'] = $('showGraph').checked;
  params['plotType'] = $('plotType').value;

  // Random only
  params['nbNodes'] = parseInt($('nbNodes').value);

  // Grid only
  params['cells'] = parseInt($('cells').value);

  // Polar only
  params['cells'] = parseInt($('cells').value);
  params['nbOrbits'] = parseInt($('nbOrbits').value);
  params['nbNodesPerOrbit'] = parseInt($('nbNodesPerOrbit').value);

  // Boids
  params['iterations'] = parseInt($('iterations').value);
  
  return params;
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


const activateControls = plotType => {
  const show = id => $(`${id}-control`).style.display = 'inline';
  document.querySelectorAll('.control').forEach(el => el.style.display = 'none');
  ['margin', 'seed'].forEach(show);
  switch (plotType) {
  case 'Random':
    ['shape1', 'shape2', 'nbNodes', 'perturbation'].forEach(show);
    break;
  case 'Grid':
    ['shape1', 'shape2', 'cells', 'perturbation'].forEach(show);
    break;
  case 'Polar':
    ['shape1', 'shape2', 'nbOrbits', 'nbNodesPerOrbit', 'perturbation'].forEach(show);
    break;
  case 'Boids':
    ['iterations'].forEach(show);
    break; 
  }
};


const render = params => {
  params.width ||= 800;
  params.height ||= 800;

  const renderFn = (['Random', 'Grid', 'Polar'].includes(params.plotType))
        ? renderCeltic
        : renderBoids;

  return renderFn(params);
}

// ============ Add event listeners ============

$('showGraph').addEventListener('change', () => {
  $('canvas').innerHTML = render(widgetValues());
});

$('plotType').addEventListener('change', () => {
  activateControls($('plotType').value);
  $('canvas').innerHTML = render(widgetValues());
});

$('saveSvg').addEventListener('click', saveSvg);

['margin', 'seed', 'shape1', 'shape2', 'nbNodes', 'cells', 'nbOrbits', 'nbNodesPerOrbit', 'perturbation', 'iterations'].forEach(id => {
  $(id).addEventListener('change', event => {
    $(`${id}-value`).innerText = event.target.value;
    $('canvas').innerHTML = render(widgetValues());
  });
});


// =========== First render =============

activateControls($('plotType').value);
$('canvas').innerHTML = render(widgetValues());
