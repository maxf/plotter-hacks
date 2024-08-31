import { render } from './celtic';

const $ = (id) => document.getElementById(id);

const widgetValues = () => {
  const params = {};
  // Common params
  ['margin', 'seed', 'shape1', 'shape2', 'perturbation'].forEach(id => {
    params[id] = parseFloat($(id).value);
  });
  params['showGraph'] = $('showGraph').checked;
  params['graphType'] = $('graphType').value;

  // Random only
  params['nbNodes'] = parseInt($('nbNodes').value);

  // Grid only
  params['cells'] = parseInt($('cells').value);

  // Polar only
  params['cells'] = parseInt($('cells').value);
  params['nbOrbits'] = parseInt($('nbOrbits').value);
  params['nbNodesPerOrbit'] = parseInt($('nbNodesPerOrbit').value);

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

// ============ Add event listeners ============

$('showGraph').addEventListener('change', () => {
  $('canvas').innerHTML = render(widgetValues());
});

$('graphType').addEventListener('change', () => {
  $('canvas').innerHTML = render(widgetValues());
});



$('graphType').addEventListener('change', () => {
  $('canvas').innerHTML = render(widgetValues());
});

$('saveSvg').addEventListener('click', saveSvg);

['margin', 'seed', 'shape1', 'shape2', 'nbNodes', 'cells', 'nbOrbits', 'nbNodesPerOrbit', 'perturbation'].forEach(id => {
  $(id).addEventListener('change', event => {
    $(`${id}-value`).innerText = event.target.value;
    $('canvas').innerHTML = render(widgetValues());
  });
});


// =========== First render =============

$('canvas').innerHTML = render(widgetValues());
