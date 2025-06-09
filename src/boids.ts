// copied from https://github.com/hughsk/boids/blob/master/index.js
import seedrandom from 'seedrandom';
import { NumberWidget, SvgSaveWidget, TextWidget, WidgetGroup, $ } from './widgets';

type Params = {
  width: number,
  height: number,
  zoom: number,
  cssStyle: string,
  iterations: number,
  startIteration: number,
  nboids: number,
  speedLimit: number,
  seed: number,
  accelerationLimitRoot: number,
  separationDistance: number,
  alignmentDistance: number,
  separationForce: number,
  cohesionForce: number,
  alignmentForce: number,
  accelerationLimit: number,
  cohesionDistance: number,
  nbAttractors: number
};

const defaultParams: Params = {
  width: 800,
  height: 800,
  zoom: 3,
  cssStyle: 'stroke: black; stroke-width: 0.5',
  iterations: 23,
  startIteration: 11,
  nboids: 195,
  speedLimit: 16.5,
  seed: 188,
  accelerationLimitRoot: 1, // This will be squared in the constructor
  separationDistance: 60, // This will be squared in the constructor
  alignmentDistance: 180, // This will be squared in the constructor
  separationForce: 0.15,
  cohesionForce: 0.23, // Corrected from 0.5 in original constructor to match control
  alignmentForce: 0.25,
  accelerationLimit: 1, // This will be squared in the constructor
  cohesionDistance: 259, // This will be squared in the constructor
  nbAttractors: 0
};

// Indices for boid array
const POSITIONX = 0;
const POSITIONY = 1;
const SPEEDX = 2;
const SPEEDY = 3;
const ACCELERATIONX = 4;
const ACCELERATIONY = 5;


class Boids {
  rng: () => number;
  width: number;
  height: number;
  speedLimit: number;
  speedLimitRoot: number;
  accelerationLimit: number;
  accelerationLimitRoot: number;
  separationDistance: number;
  alignmentDistance: number;
  alignmentForce: number;
  cohesionDistance: number;
  cohesionForce: number;
  separationForce: number;
  attractors: number[][];
  iterations: number;
  startIteration: number;
  cssStyle: string;
  nboids: number;
  boids: [number, number, number, number, number, number][];

  constructor(opts: Params) {
    opts = opts || {}

    this.rng = seedrandom(opts.seed.toString()) || Math.random;
    this.width = opts.width;
    this.cssStyle = opts.cssStyle;
    this.height = opts.height;  
    this.speedLimitRoot = opts.speedLimit || 0;
    this.accelerationLimitRoot = opts.accelerationLimit || 1;
    this.speedLimit = Math.pow(this.speedLimitRoot, 2);
    this.accelerationLimit = Math.pow(this.accelerationLimitRoot, 2);
    this.separationDistance = Math.pow(opts.separationDistance || 60, 2);
    this.alignmentDistance = Math.pow(opts.alignmentDistance || 180, 2);
    this.cohesionDistance = Math.pow(opts.cohesionDistance || 180, 2);
    this.separationForce = opts.separationForce || 0.15;
    this.cohesionForce = opts.cohesionForce || 0.5;
    this.alignmentForce = opts.alignmentForce || 0.25;
    this.attractors = this.#makeAttractors(opts.nbAttractors);
    this.iterations = opts.iterations || 100;
    this.startIteration = opts.startIteration || 0;
    this.nboids = opts.nboids || 10;

    this.boids = []

    for (let i = 0, l = opts.nboids; i < l; i += 1) {
      this.boids[i] = [
        (this.rng()-0.5)*this.width/10,
        (this.rng()-0.5)*this.height/10, // position
        0, 0,                               // speed
        0, 0                               // acceleration
      ]
    }
  }

  #makeAttractors(n: number) {
    const attractors: number[][] = [];
    for (let i=0; i<n; i++) {
      const x = (this.rng()-0.5)*this.width;
      const y = (this.rng()-0.5)*this.height;
      attractors.push([x, y, 100, 2]);
    }
    return attractors;
  }

  tick() {
    let boids: [number, number, number, number, number, number][] = this.boids
      , sepDist = this.separationDistance
      , sepForce = this.separationForce
      , cohDist = this.cohesionDistance
      , cohForce = this.cohesionForce
      , aliDist = this.alignmentDistance
      , aliForce = this.alignmentForce
      , speedLimit = this.speedLimit
      , accelerationLimit = this.accelerationLimit
      , accelerationLimitRoot = this.accelerationLimitRoot
      , speedLimitRoot = this.speedLimitRoot
      , size = boids.length
      , current = size
      , sforceX, sforceY
      , cforceX, cforceY
      , aforceX, aforceY
      , spareX, spareY
      , attractors = this.attractors
      , attractorCount = attractors.length
      , attractor
      , distSquared
      , currPos
      , length
      , target
      , ratio

    while (current--) {
      sforceX = 0; sforceY = 0
      cforceX = 0; cforceY = 0
      aforceX = 0; aforceY = 0
      currPos = boids[current]


      // Attractors
      target = attractorCount
      while (target--) {
        attractor = attractors[target]
        spareX = currPos[0] - attractor[0]
        spareY = currPos[1] - attractor[1]
        distSquared = spareX*spareX + spareY*spareY

        if (distSquared < attractor[2]*attractor[2]) {
          length = hypot(spareX, spareY)
          boids[current][SPEEDX] -= (attractor[3] * spareX / length) || 0
          boids[current][SPEEDY] -= (attractor[3] * spareY / length) || 0
        }
      }

      target = size
      while (target--) {
        if (target === current) continue
        spareX = currPos[0] - boids[target][0]
        spareY = currPos[1] - boids[target][1]
        distSquared = spareX*spareX + spareY*spareY

        if (distSquared < sepDist) {
          sforceX += spareX
          sforceY += spareY
        } else {
          if (distSquared < cohDist) {
            cforceX += spareX
            cforceY += spareY
          }
          if (distSquared < aliDist) {
            aforceX += boids[target][SPEEDX]
            aforceY += boids[target][SPEEDY]
          }
        }
      }

      // Separation
      length = hypot(sforceX, sforceY)
      boids[current][ACCELERATIONX] += (sepForce * sforceX / length) || 0
      boids[current][ACCELERATIONY] += (sepForce * sforceY / length) || 0
      // Cohesion
      length = hypot(cforceX, cforceY)
      boids[current][ACCELERATIONX] -= (cohForce * cforceX / length) || 0
      boids[current][ACCELERATIONY] -= (cohForce * cforceY / length) || 0
      // Alignment
      length = hypot(aforceX, aforceY)
      boids[current][ACCELERATIONX] -= (aliForce * aforceX / length) || 0
      boids[current][ACCELERATIONY] -= (aliForce * aforceY / length) || 0
    }
    current = size

    // Apply speed/acceleration for
    // this tick
    while (current--) {
      if (accelerationLimit) {
        distSquared = boids[current][ACCELERATIONX]*boids[current][ACCELERATIONX] + boids[current][ACCELERATIONY]*boids[current][ACCELERATIONY]
        if (distSquared > accelerationLimit) {
          ratio = accelerationLimitRoot / hypot(boids[current][ACCELERATIONX], boids[current][ACCELERATIONY])
          boids[current][ACCELERATIONX] *= ratio
          boids[current][ACCELERATIONY] *= ratio
        }
      }

      boids[current][SPEEDX] += boids[current][ACCELERATIONX]
      boids[current][SPEEDY] += boids[current][ACCELERATIONY]

      if (speedLimit) {
        distSquared = boids[current][SPEEDX]*boids[current][SPEEDX] + boids[current][SPEEDY]*boids[current][SPEEDY]
        if (distSquared > speedLimit) {
          ratio = speedLimitRoot / hypot(boids[current][SPEEDX], boids[current][SPEEDY])
          boids[current][SPEEDX] *= ratio
          boids[current][SPEEDY] *= ratio
        }
      }
      boids[current][POSITIONX] += boids[current][SPEEDX]
      boids[current][POSITIONY] += boids[current][SPEEDY]
    }
  }
}


// double-dog-leg hypothenuse approximation
// http://forums.parallax.com/discussion/147522/dog-leg-hypotenuse-approximation
function hypot(a: number, b: number): number {
  a = Math.abs(a);
  b = Math.abs(b);
  const lo: number = Math.min(a, b);
  const hi: number = Math.max(a, b)
  return hi + 3 * lo / 32 + Math.max(0, 2 * lo - hi) / 8 + Math.max(0, 4 * lo - hi) / 16
}


const renderAttractors = function(attractors: number[][]): string {

  // [xPosition, yPosition, radius, force]
  const attractorMarkup = attractors.map(attractor => {
    const color = attractor[3] < 0 ? "#fdd" : "#dfd";
    return `<circle cx="${attractor[0]}" cy="${attractor[1]}" r="${attractor[2]}" fill="${color}"/>`
  });
  return `<g id="attractors">${attractorMarkup}</g>`;
}

const renderBoids = (params: Params): string => {
  const b = new Boids(params);
  const boids = b.boids;

  for (let iteration = 0; iteration < b.startIteration; iteration++) {
    b.tick();
  }

  const boidPaths = [];
  for (let i=0; i<boids.length; i++) {
    //boidPaths[i] = [`M${boids[i][POSITIONX]} ${boids[i][POSITIONY]}`];
    boidPaths[i] = [{
      x: boids[i][POSITIONX],
      y: boids[i][POSITIONY]
    }];
  }

  for (let iteration = b.startIteration; iteration < b.startIteration + b.iterations; iteration++) {
    b.tick();
    for (let i=0; i<boids.length; i++) {
      // add the half point
      const lastPos = boidPaths[i][boidPaths[i].length - 1];
      boidPaths[i].push({
        x: (boids[i][POSITIONX] + lastPos.x)/2,
        y: (boids[i][POSITIONY] + lastPos.y)/2
      });
      // add the new point
      boidPaths[i].push({ x: boids[i][POSITIONX], y: boids[i][POSITIONY]});
    }
  }

  const svgPaths = boidPaths.map(ps => {
    let d = `M ${ps[0].x} ${ps[0].y} L ${ps[1].x} ${ps[1].y}`;
    for (let i=2; i < ps.length - 1; i+= 2) {
      d = d + `C ${ps[i].x} ${ps[i].y}, ${ps[i].x} ${ps[i].y}, ${ps[i+1].x} ${ps[i+1].y} `
    }
    return `<path d="${d}" vector-effect="non-scaling-stroke"/>\n`;
  });

  const zoomFactor = Math.exp(-params.zoom/10);
  const vboxX = -params.width/2*zoomFactor;
  const vboxY = -params.height/2*zoomFactor;
  const vboxW = params.width*zoomFactor;
  const vboxH = params.height*zoomFactor;

  return `
    <svg id="svg-canvas"
        xmlns="http://www.w3.org/2000/svg"
        height="${params.height}"
        width="${params.width}"
        viewBox="${vboxX} ${vboxY} ${vboxW} ${vboxH}">
      ${renderAttractors(b.attractors)}
      <g id="pattern" style="fill:none; ${params.cssStyle}">
        ${svgPaths.join('')}
      </g>
    </svg>
  `;
};

const widgetGroup = new WidgetGroup();

const render = () => {
  const params = {
    ...defaultParams, // Ensure width/height are part of the base
    ...widgetGroup.getValues()
  };
  $('canvas').innerHTML = renderBoids(params as Params);
};

widgetGroup.add(new NumberWidget('zoom', { name: 'Zoom', value: defaultParams.zoom, callback: render, min: -20, max: 20 }));
widgetGroup.add(new NumberWidget('seed', {name: 'RNG seed', value: defaultParams.seed, callback: render, min: 0, max: 500}));
widgetGroup.add(new NumberWidget('nboids', {name: 'Boids', value: defaultParams.nboids, callback: render, min: 1, max: 100 }));
widgetGroup.add(new NumberWidget('iterations', {name: 'Iterations', value: defaultParams.iterations, callback: render, min: 1, max: 1000}));
widgetGroup.add(new NumberWidget('startIteration', {name: 'Start iteration', value: defaultParams.startIteration, callback: render, min: 1, max: 1000}));
widgetGroup.add(new NumberWidget('speedLimit', {name: 'Max speed', value: defaultParams.speedLimit, callback: render, min: 0 , max: 20, step: 0.1}));
widgetGroup.add(new NumberWidget('cohesionForce', {name: 'Cohesion', value: defaultParams.cohesionForce, callback: render, min: 0, max: 1, step: 0.01}));
widgetGroup.add(new NumberWidget('cohesionDistance', {name: 'Cohesion distance', value: defaultParams.cohesionDistance, callback: render, min: 10, max: 300 }));
widgetGroup.add(new NumberWidget('nbAttractors', {name: 'Attractors', value: defaultParams.nbAttractors, callback: render, min: 0, max: 10 }));
widgetGroup.add(new TextWidget('cssStyle', {name: 'CSS style', value: defaultParams.cssStyle, callback: render}));
widgetGroup.add(new SvgSaveWidget('svgSave', { canvasId: 'svg-canvas', name: 'Save SVG', saveFilename: 'boids.svg' }));


// =========== First render =============
widgetGroup.initializeParams(defaultParams, window.location.search);
render();
