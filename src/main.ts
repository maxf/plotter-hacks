import { renderCeltic } from './celtic';
import { renderBoids } from './boids-plot';

const $ = (id: string) => document.getElementById(id)!;

const plotTypeEl = document.getElementById('plotType') as HTMLInputElement;

type ControlType = 'string'|'select'|'boolean'|'number';
class Control {
  name: string;
  wrapper: HTMLDivElement;
  widget: HTMLInputElement;
  value: HTMLSpanElement | undefined;
  type: ControlType;

  constructor(name: string, type: ControlType, value: any) {
    this.name = name;
    this.type = type;
    this.wrapper = document.getElementById(`${name}-control`) as HTMLDivElement;
    this.widget = document.getElementById(name) as HTMLInputElement;
    this.widget.value = value;
    this.widget.value = value;
    if (this.type === 'number') {
      this.value = document.getElementById(`${name}-value`) as HTMLSpanElement;
      this.value.innerText = value;
    }

    this.widget.addEventListener('change', event => {
      this.widget.value = (event.target as HTMLInputElement).value;
      if (this.value) {
        this.value.innerText = this.widget.value;
      }
      $('canvas').innerHTML = render(paramsFromWidgets());
    });
  }

  set(newValue : number|string|boolean) {
    this.widget.value = newValue as string;
    if (this.value) {
      this.value.innerText = newValue as string;
    }
  }

  val(): number|string|boolean {
    switch(this.type) {
      case 'string': case 'select': return this.widget.value;
      case 'boolean': return this.widget.checked;
      case 'number': return parseFloat(this.widget.value);
    }
  }

  show() {
    this.wrapper.style.display = 'block';
  }

  hide() {
    this.wrapper.style.display = 'none';
  }
}



type PlotType = 'Random'|'Grid'|'Polar'|'Boids'|'common';

type Params = {
  width: number,
  height: number,
  shape1: number,
  shape2: number,
  margin: number,

  plotType: PlotType,
  showGraph: boolean,

  //  for polar, grid and random
  perturbation?: number,

  // for polar graph only
  nbOrbits?: number,
  nbNodesPerOrbit?: number

  // for grid graph only
  cells?: number,

  // for random graph only
  nbNodes?: number,
  seed?: number,

  // for boids
  iterations?: number,
  startIteration?: number,
  nboids?: number,
  speedLimit?: number,
  cohesionForce?: number
}


const defaultParams: Params = {
  width: 800,
  height: 800,
  plotType: 'Polar',
  margin: 100,
  seed: 100,
  shape1: 0.3,
  shape2: 0.3,
  showGraph: false,
  nbNodes: 4,
  cells: 4,
  perturbation: 0,
  nbOrbits: 3,
  nbNodesPerOrbit: 3,
  iterations: 10,
  startIteration: 0,
  nboids: 10,
  speedLimit: 30,
  cohesionForce: 0.5
}


const paramsFromWidgets = () => {
  const params: Params = {...defaultParams};
  // Common params
  params.margin = controls.margin.val() as number;
  params.shape1 = controls.shape1.val() as number;
  params.shape2 = controls.shape2.val() as number;
  params.showGraph = controls.showGraph.val() as boolean;
  params.seed = controls.seed.val() as number;
  params.nbNodes = controls.nbNodes.val() as number;
  params.cells = controls.cells.val() as number;
  params.perturbation = controls.perturbation.val() as number;
  params.nboids = controls.nboids.val() as number;
  params.speedLimit = controls.speedLimit.val() as number;
  params.cohesionForce = controls.cohesionForce.val() as number;
  params.iterations = controls.iterations.val() as number;
  params.startIteration = controls.startIteration.val() as number;

  params.plotType = plotTypeEl.value as PlotType;

  return params;
};


const paramsFromUrl = (defaults: any) => {
  const params = new URLSearchParams(window.location.search);
  const result = defaults;
  for (const [key, value] of params) {
    const num = Number(value);
    if (!isNaN(num)) {
      result[key] = num;
    } else if (value === 'true') {
      result[key] = true;
    } else if (value === 'false') {
      result[key] = false;
    } else {
      result[key] = value;
    }
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
  Boids: ['iterations', 'startIteration', 'nboids', 'speedLimit', 'cohesionForce'],
  common: ['seed', 'plotType', 'margin']
};

const activateControls = (plotType: PlotType) => {
  const show = (id: string) => $(`${id}-control`).style.display = 'inline';
  document.querySelectorAll('.control').forEach(el => (el as HTMLElement).style.display = 'none');
  controls.margin.show();
  controls.seed.show();
  paramsPerType[plotType].forEach(show);
};

const updateUrl = (params: any) => {
  const url = new URL(window.location.toString());
  url.search = '';
  const pt: PlotType = params.plotType
  const qsParams = paramsPerType.common.concat(paramsPerType[pt]);
  qsParams.forEach(key => {
    url.searchParams.set(key, params[key]);
  });
  history.pushState(null, '', url);
};

// ========== Main rendering function ===========

const render = (params: any) => {
  params.width ||= 800;
  params.height ||= 800;

  updateUrl(params);

  const renderFn = (['Random', 'Grid', 'Polar'].includes(params.plotType))
        ? renderCeltic
        : renderBoids;

  return renderFn(params);
}


// =========== declare widgets =========


const controls = {
  margin: new Control('margin', 'number', defaultParams['margin']),
  shape1: new Control('shape1', 'number', defaultParams['shape1']),
  shape2: new Control('shape2', 'number', defaultParams['shape2']),
  showGraph: new Control('showGraph', 'boolean', defaultParams['showGraph']),
  seed: new Control('seed', 'number', defaultParams['seed']),
  nbNodes: new Control('nbNodes', 'number', defaultParams['nbNodes']),
  cells: new Control('cells', 'number', defaultParams['cells']),
  nbOrbits: new Control('nbOrbits', 'number', defaultParams['nbOrbits']),
  nbNodesPerOrbit: new Control('nbNodesPerOrbit', 'number', defaultParams['nbNodesPerOrbit']),
  cohesionForce: new Control('cohesionForce', 'number', defaultParams['cohesionForce']),
  iterations: new Control('iterations', 'number', defaultParams['iterations']),
  startIteration: new Control('startIteration', 'number', defaultParams['startIteration']),
  speedLimit: new Control('speedLimit', 'number', defaultParams['speedLimit']),
  perturbation: new Control('perturbation', 'number', defaultParams['perturbation']),
  nboids: new Control('nboids', 'number', defaultParams['nboids'])
}

// ============ Add event listeners ============


plotTypeEl.addEventListener('change', () => {
  activateControls(plotTypeEl.value as PlotType);
  $('canvas').innerHTML = render(paramsFromWidgets());
});

$('saveSvg').addEventListener('click', saveSvg);


// =========== First render =============

// Fetch plot parameters from the query string
const params = paramsFromUrl(defaultParams);

// populate the form controls from controls.params
Object.keys(params).forEach(key => {
  if (key in controls) {
    controls[key as keyof typeof controls].set(params[key as keyof typeof params]);
  }
});




($('showGraph') as HTMLInputElement).checked = params.showGraph;
plotTypeEl.value = params.plotType;

// only show the relevant ones
activateControls(params.plotType);

$('canvas').innerHTML = render(params);
