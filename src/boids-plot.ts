// copied from https://github.com/hughsk/boids/blob/master/index.js
import seedrandom from 'seedrandom';


type Params = {
  width: number,
  height: number,
  margin: number,
  plotType: 'Boids',
  iterations: number,
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
  alignment: number,
  attractors: number[][]
}


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
  nboids: number;
  boids: [number, number, number, number, number, number][];

  constructor(opts: Params) {
    opts = opts || {}

    this.rng = seedrandom(opts.seed.toString()) || Math.random;
    this.width = opts.width;
    this.height = opts.height;  
    this.speedLimitRoot = opts.speedLimit || 0
    this.accelerationLimitRoot = opts.accelerationLimit || 1
    this.speedLimit = Math.pow(this.speedLimitRoot, 2)
    this.accelerationLimit = Math.pow(this.accelerationLimitRoot, 2)
    this.separationDistance = Math.pow(opts.separationDistance || 60, 2)
    this.alignmentDistance = Math.pow(opts.alignmentDistance || 180, 2)
    this.cohesionDistance = Math.pow(opts.cohesionDistance || 180, 2)
    this.separationForce = opts.separationForce || 0.15
    this.cohesionForce = opts.cohesionForce || 0.5
    this.alignmentForce = opts.alignmentForce || opts.alignment || 0.25
    this.attractors = opts.attractors || []
    this.iterations = opts.iterations || 100;
    this.nboids = opts.nboids || 10;

    this.boids = []

    for (let i = 0, l = opts.nboids; i < l; i += 1) {
      this.boids[i] = [
        (this.rng()-0.5)*this.width/10 + this.width/2,
        (this.rng()-0.5)*this.height/10 + this.height/2, // position
        0, 0,                               // speed
        0, 0                               // acceleration
      ]
    }
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

const renderBoids = (params: Params) => {
  const b = new Boids(params);

  const boidPathsDs = [];
  for (let i=0; i<b.boids.length; i++) { 
    boidPathsDs[i] = [`M${b.boids[i][POSITIONX]} ${b.boids[i][POSITIONY]}`];
  }
    
  for (let iteration = 0; iteration < b.iterations; iteration++) {
    b.tick();
    for (let i=0; i<b.boids.length; i++) { 
      boidPathsDs[i].push(`L${b.boids[i][POSITIONX]} ${b.boids[i][POSITIONY]}`);
    }
  }

  const boidsPaths = boidPathsDs.map(boidPathArray => {
    const d = boidPathArray.join(' ');
    return `<path d="${d}"/>`;
  });

  return `
    <svg id="svg-canvas" height="${params.height}" width="${params.width}" xmlns="http://www.w3.org/2000/svg">
      <g id="pattern" style="fill:none; stroke: red">
        ${boidsPaths.join('')}
      </g>
    </svg>
  `;
};


export { renderBoids };
