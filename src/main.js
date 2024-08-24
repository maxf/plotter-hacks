import { render } from './celtic';

const $ = (id) => document.getElementById(id);

const widgetValues = () => {
  const params = {};
  ['margin', 'seed', 'shape1', 'shape2', 'nbNodes'].forEach(id => {
    params[id] = parseFloat($(id).value);
  });
  params['showGraph'] = $('showGraph').checked;
  params['graphType'] = $('graphType').value;
  return params;
};

$('showGraph').addEventListener('change', () => {
    $('canvas').innerHTML = render(widgetValues());
})

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

$('saveSvg').addEventListener('click', saveSvg);

['margin', 'seed', 'shape1', 'shape2', 'nbNodes'].forEach(id => {
  $(id).addEventListener('change', event => {
    $(`${id}-value`).innerText = event.target.value;
    $('canvas').innerHTML = render(widgetValues());
  });
});

$('showGraph').addEventListener('change', event => {
  $('canvas').innerHTML = render(widgetValues());
});


// =========== First render =============

$('canvas').innerHTML = render(widgetValues());
