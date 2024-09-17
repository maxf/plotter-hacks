import { renderCeltic } from './celtic';
import { renderBoids } from './boids-plot';

const $ = (id: string) => document.getElementById(id)!;

type ControlType = 'string'|'select'|'boolean'|'number';
class Control {
  #name: string;
  #wrapperEl: HTMLDivElement;
  #widgetEl: HTMLInputElement;
  #valueEl: HTMLSpanElement | undefined;
  #type: ControlType;
  #value: any;

  //constructor(name: string, label: string, type: ControlType, value: any) {
  constructor(name: string, label: string, type: ControlType, value: any, options: any) {
    this.#name = name;
    this.#type = type;
    this.#value = value;

    this.#createHtmlControl("controls", label, options);
    this.#wrapperEl = document.getElementById(`${name}-control`) as HTMLDivElement;
    this.#widgetEl = document.getElementById(name) as HTMLInputElement;
    this.#widgetEl.value = value;
    if (this.#type === 'number') {
      this.#valueEl = document.getElementById(`${name}-value`) as HTMLSpanElement;
      this.#valueEl.innerText = value;
    }
    this.#widgetEl.onchange = event => {
      this.#widgetEl.value = (event.target as HTMLInputElement).value;
      switch (this.#type) {
        case 'number':
          this.#value = parseFloat(this.#widgetEl.value);
          break;
        default:
          this.#value = this.#widgetEl.value;
      }
      if (this.#valueEl) {
        this.#valueEl.innerText = this.#value;
      }
      $('canvas').innerHTML = render();
    };
  }


  #createHtmlControl(anchor: string, label: string, options: any) {
    const html = [];
    html.push(`<span class="control" id="${this.#name}-control">`);
    switch (this.#type) {
      case 'number':
        const step = options.step ? `step="${options.step}"` : '';
        html.push(`
        <input id="${this.#name}" type="range" min="${options.min}" max="${options.max}" value="${this.#value}" ${step}"/>
        ${label}
        <span id="${this.#name}-value">${this.#value}</span>
      `);
      break;
      case 'boolean':
        html.push(`<input type="checkbox" id="${this.#name}"> ${label}`);
      break;
      case 'select':
        if (label) html.push(`${label}: `);
        html.push(`<select id="${this.#name}">`);
        options.choices.forEach((choice: string) => html.push(`<option>${choice}</option>`));
        html.push('</select>');
    }
    html.push(`<br/></span>`);

    // Find the anchor element and insert the constructed HTML as the last child
    const anchorElement = $(anchor);
    if (anchorElement) {
      anchorElement.insertAdjacentHTML('beforeend', html.join(''));
    }
  }

  set(newValue : number|string|boolean) {
    this.#value = newValue;
    this.#widgetEl.value = newValue as string;
    if (this.#valueEl) {
      this.#valueEl.innerText = newValue as string;
    }
  }

  val(): number|string|boolean {
    return this.#value;
  }

  show() {
    this.#wrapperEl.style.display = 'block';
  }

  hide() {
    this.#wrapperEl.style.display = 'none';
  }
}



type PlotType = 'Random'|'Grid'|'Polar'|'Boids';

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
  cohesionForce?: number,
  cohesionDistance?: number
}


const defaultParams: Params = {
  width: 800,
  height: 800,
  plotType: 'Polar',
  margin: 100,
  seed: 128,
  shape1: 0.3,
  shape2: 1.4,
  showGraph: false,
  nbNodes: 4,
  cells: 4,
  perturbation: 0,
  nbOrbits: 3,
  nbNodesPerOrbit: 10,
  iterations: 10,
  startIteration: 0,
  nboids: 10,
  speedLimit: 30,
  cohesionForce: 0.5,
  cohesionDistance: 180
}


const paramsFromWidgets = () => {
  const params: Params = {...defaultParams};
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
  params.cohesionDistance = controls.cohesionDistance.val() as number;
  params.iterations = controls.iterations.val() as number;
  params.startIteration = controls.startIteration.val() as number;
  params.plotType = controls.plotType.val() as PlotType;
  params.nbOrbits = controls.nbOrbits.val() as number;
  params.nbNodesPerOrbit = controls.nbNodesPerOrbit.val() as number;

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

const paramsPerType: Record<PlotType, ControlKeys[]>  = {
  Random: ['seed', 'plotType', 'margin', 'showGraph', 'shape1', 'shape2', 'nbNodes'],
  Grid: ['seed', 'plotType', 'margin', 'showGraph', 'shape1', 'shape2', 'cells', 'perturbation'],
  Polar: ['seed', 'plotType', 'margin', 'showGraph', 'shape1', 'shape2', 'nbOrbits', 'nbNodesPerOrbit', 'perturbation'],
  Boids: ['seed', 'plotType', 'margin', 'iterations', 'startIteration', 'nboids', 'speedLimit', 'cohesionForce', 'cohesionDistance'],
};

const activateControls = (plotType: PlotType) => {
  Object.values(controls).forEach(c => c.hide());
  paramsPerType[plotType].forEach(name => controls[name].show());

};

const updateUrl = (params: any) => {
  const url = new URL(window.location.toString());
  url.search = '';
  const pt: PlotType = params.plotType
  paramsPerType[pt].forEach(key => {
    url.searchParams.set(key, params[key]);
  });
  history.pushState(null, '', url);
};

// ========== Main rendering function ===========

const render = (params?: any) => {

  if (!params) {
    params = paramsFromWidgets();
  }

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
  plotType: new Control('plotType', '', 'select', defaultParams['plotType'], { choices: ['Polar', 'Grid', 'Random', 'Boids'] }),
  margin: new Control('margin', 'Margin', 'number', defaultParams['margin'], { min: 0, max: 500}),
  shape1: new Control('shape1', 'Shape1', 'number', defaultParams['shape1'], { min: -2, max: 2, step: 0.01}),
  shape2: new Control('shape2', 'Shape2', 'number', defaultParams['shape2'], { min: -2, max: 2, step: 0.01}),
  showGraph: new Control('showGraph', 'Graph', 'boolean', defaultParams['showGraph'], {}),
  seed: new Control('seed', 'RNG seed', 'number', defaultParams['seed'], { min: 0, max: 500}),
  nbNodes: new Control('nbNodes', 'Nodes', 'number', defaultParams['nbNodes'], { min: 3, max: 40 }),
  cells: new Control('cells', 'Cells', 'number', defaultParams['cells'], { min: 2, max: 100 }),
  nbOrbits: new Control('nbOrbits', 'Orbits', 'number', defaultParams['nbOrbits'], { min: 1, max: 20}),
  nbNodesPerOrbit: new Control('nbNodesPerOrbit', 'Nodes per orbit', 'number', defaultParams['nbNodesPerOrbit'], { min: 1, max: 20}),
  cohesionForce: new Control('cohesionForce', 'Cohesion', 'number', defaultParams['cohesionForce'], { min: 0, max: 1, step: 0.01}),
  cohesionDistance: new Control('cohesionDistance', 'Cohesion distance', 'number', defaultParams['cohesionDistance'], { min: 10, max: 300 }),
  iterations: new Control('iterations', 'Iterations', 'number', defaultParams['iterations'], { min: 1, max: 500}),
  startIteration: new Control('startIteration', 'Start iteration', 'number', defaultParams['startIteration'], { min: 1, max: 1000}),
  speedLimit: new Control('speedLimit', 'Max speed', 'number', defaultParams['speedLimit'], { min: 0 , max: 30, step: 0.01}),
  perturbation: new Control('perturbation', 'Perturbation', 'number', defaultParams['perturbation'], { min: 0, max: 300 }),
  nboids: new Control('nboids', 'Boids', 'number', defaultParams['nboids'], { min: 1, max: 100 })
};


type ControlKeys = keyof typeof controls;




// We need an extra event listener on plottype to hide and show the controls
// that depend on the plot type
$('plotType').addEventListener('change', () => {
  const plotType = $('plotType') as HTMLInputElement;
  activateControls(plotType.value as PlotType);
});

// save as SVG button
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
controls.plotType.set(params.plotType);

// only show the relevant ones
activateControls(params.plotType);

$('canvas').innerHTML = render(params);
