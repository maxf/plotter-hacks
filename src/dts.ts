//import seedrandom from 'seedrandom';
import { NumberControl, ImageUploadControl, SvgSaveControl, paramsFromUrl, updateUrl,  $ } from './controls';
import { Pixmap } from './pixmap';
import { Delaunay } from 'd3-delaunay';


class DrunkTravellingSalesman {
  #params: Params;
  #inputPixmap: Pixmap;
  #cutoff: number;
  #nsamples: number;
  #optIter: number;

  constructor(params: Params) {
    this.#params = params;
    this.#inputPixmap = new Pixmap(this.#params.inputCanvas as HTMLCanvasElement);
    this.#cutoff = params.cutoff;
    this.#nsamples = params.nsamples;
    this.#optIter = params.optIter;
  }

  #pathLength(path: number[], points: Float64Array): number {
    let dist = 0;
    for (let i=0; i<path.length-1; i++) {
      const ip = path[i];
      const p1 = [ points[2*ip], points[2*ip+1] ];
      const p2 = [ points[2*ip+2], points[2*ip+3] ];
      dist += (p2[0]-p1[0])*(p2[0]-p1[0]) + (p2[1]-p1[1])*(p2[1]-p1[1]);
    }
    return dist;
  }

  toSvg(): string {
    let n = this.#nsamples;
    let points = new Float64Array(n*2);
    const width = this.#inputPixmap.width;
    const height = this.#inputPixmap.height;

    // See: https://observablehq.com/@mbostock/voronoi-stippling

    // Initialize the points using rejection sampling.
    let sampledPoints = 0;
    for (let i = 0; i < n; ++i) { // Do the following 10k times:
      // for each sample, 30 times pick a random point
      for (let j = 0; j < 30; ++j) {
        const x = Math.floor(width * Math.random());
        const y = Math.floor(height * Math.random());
        const imageLevel = this.#inputPixmap.brightnessAt(x, y);
        // the darker the image at this point, the more likely we're going to keep the point.
        if (200 * Math.random() > imageLevel) {
          points[2*sampledPoints] = x+.5;
          points[2*sampledPoints+1] = y+.5;
          sampledPoints++;
          break;
        }
      }
    }
    n = sampledPoints;

    if (sampledPoints < 2) {
      return 'Less than 2 sampled points!';
    } else {
      console.log(`Initial sampling: ${sampledPoints} points`);
    }

    // for (let d=0; d<points.length/2; d++) {
    //   console.log(d, points[2*d], points[2*d+1])
    // }



    // run voronoi and adjust points iteratively

    const delaunay = new Delaunay(points);
    const voronoi = delaunay.voronoi([0, 0, width, height]);
    const centroids = new Float64Array(n * 2); // centroids
    const weights = new Float64Array(n); // weights


    // over a few iterations...
    for (let k = 0; k < 10; ++k) {
      // Compute the weighted centroid for each Voronoi cell.
      centroids.fill(0);
      weights.fill(0);
      let delaunayIndex = 0;
      // loop over the pixels in our image and adjust the centroid
      // of the voronoi cell where it falls
      for (let y = 0; y < height; ++y) {
        for (let x = 0; x < width; ++x) {
          const weight = 255 - this.#inputPixmap.brightnessAt(x, y);
          delaunayIndex = delaunay.find(x, y, delaunayIndex);
          weights[delaunayIndex] += weight;
          centroids[delaunayIndex * 2] += weight * x;
          centroids[delaunayIndex * 2 + 1] += weight * y;
        }
      }

      // now 'centroids' is an array of the centroid for each cell
      // (some centroids can be 0 though, if no pixel fell on the cell)
      // and 'weigths' are the weights of each cell


      // Relax the diagram by moving points to the weighted centroid.
      // Wiggle the points a little bit so they don’t get stuck.
      // const w = Math.pow(k + 1, -0.8) * 10;
      for (let i = 0; i < n; ++i) {
        const x0 = points[i * 2];
        const y0 = points[i * 2 + 1];
        const x1 = weights[i] ? centroids[i * 2] / weights[i] : x0;
        const y1 = weights[i] ? centroids[i * 2 + 1] / weights[i] : y0;
        points[i * 2] = x0 + (x1 - x0) * 1.8; // + (Math.random() - 0.5) * w;
        points[i * 2 + 1] = y0 + (y1 - y0) * 1.8; // + (Math.random() - 0.5) * w;
      }

      voronoi.update();
    }

    // at this point we have stipple in the 'points' array


    // Filter the array to apply the white cutoff

    const points2 = new Float64Array(n*2);
    let p = 0;
    for (let i=0; i<n; i++) {
      const brightness = this.#inputPixmap.brightnessAt(
        Math.floor(points[2*i]),
        Math.floor(points[2*i+1])
      );
      if (brightness < this.#cutoff) {
        points2[2*p] = points[2*i];
        points2[2*p+1] = points[2*i+1];
        p++;
      }
    }
    points = points2;
    n = p;

    // now we can move on to the travelling salesman problem.
    // ========== TSP ==========

    // First calculate a nearest-neighbour path
    const path: number[] = []; // indices
    const dist2 = (p1: number[], p2: number[]) => (p2[0]-p1[0])*(p2[0]-p1[0]) + (p2[1]-p1[1])*(p2[1]-p1[1]);
    const dist2i = (i1: number, i2: number) => dist2([points[2*i1], points[2*i1+1]], [points[2*i2], points[2*i2+1]]);
    const visited = new Float64Array(n);
    visited.fill(0);

    let current = 0;
    while(true) {
      let nearest;
      let dist = Infinity;
      for (let next=1; next<n; next++) {
        if (visited[next] === 0) {
          const d = dist2i(current, next);
          if (d<dist) {
            nearest = next;
            dist = d;
          }
        }
      }
      if (nearest) {
        path.push(nearest);
        visited[nearest] = 1;
        current = nearest;
      } else {
        break;
      }
    }

    // Optimise the path
    // From: https://github.com/evil-mad/stipplegen/blob/master/StippleGen/StippleGen.pde#L692
    for (let i = 0; i < this.#optIter; ++i) {
      //console.log('dist', this.#pathLength(path, points));
      let indexA = Math.floor(Math.random()*(n - 1));
      let indexB = Math.floor(Math.random()*(n - 1));

      console.log('indexed', indexA, indexB)

      if (Math.abs(indexA - indexB) < 2) {
        continue;
      }

      if (indexB < indexA) { // swap A, B.
        [indexA, indexB] = [indexB, indexA];
      }

      const ai = path[indexA];
      const a0 = [ points[2*ai], points[2*ai+1] ];
      const ai2 = path[indexA + 1];
      const a1 = [ points[2*ai2], points[2*ai2+1] ];

      const bi = path[indexB];
      const b0 = [ points[2*bi], points[2*bi+1] ];
      const bi2 = path[indexB + 1];
      const b1 = [ points[2*bi2], points[2*bi2+1] ];

      // Original distance:
      const dx1 = a0[0] - a1[0];
      const dy1 = a0[1] - a1[1];
      const dx2 = b0[0] - b1[0];
      const dy2 = b0[1] - b1[1];
      const distance = (dx1*dx1 + dy1*dy1) + (dx2*dx2 + dy2*dy2);

      // Possible shorter distance?
      const dx3 = a0[0] - b0[0];
      const dy3 = a0[1] - b0[1];
      const dx4 = a1[0] - b1[0];
      const dy4 = a1[1] - b1[1];

      const distance2 = (dx3*dx3 + dy3*dy3) + (dx4*dx4 + dy4*dy4);

      console.log('d', distance, 'd2', distance2);

      if (distance2 < distance) {
        console.log('swap');
        // Reverse tour between a1 and b0.

        let indexhigh = indexB;
        let indexlow = indexA + 1;

        while (indexhigh > indexlow) {
          const temp = path[indexlow];
          path[indexlow] = path[indexhigh];
          path[indexhigh] = temp;

          indexhigh--;
          indexlow++;
        }
      }
    }

    // =========== Rendering ===================

    const svg = [];

    svg.push(`<svg id="svg-canvas" width="${800}" height="${800}" viewBox="0 0 ${width} ${height}">`);

    // // voronoi polygons
    // const polys = Array.from(voronoi.cellPolygons());
    // polys.forEach(poly => {
    //   const polyPoints = poly.map(pp => `${pp[0]},${pp[1]} `);
    //   svg.push(`<polygon points="${polyPoints.join('')}" stroke="black" fill="none" stroke-width="0.1"/>`);
    // });

    // TSP path
    const svgTspPath = path.map(i => `${points[2*i]},${points[2*i+1]}`);
    svg.push(`<polygon points="${svgTspPath}" stroke="red" fill="none" stroke-width="0.5"/>`);

    // // Stipple points
    // for (let i=0; i<n; i++) {
    //   svg.push(`<circle cx="${points[2*i]}" cy="${points[2*i+1]}" r="0.5" vector-effect="non-scaling-stroke" stroke="none" fill="black"/>`);
    // }

    svg.push(`</svg>`);
    return svg.join('');
  }
}


type Params = {
  inputImageUrl: string,
  inputCanvas: HTMLCanvasElement,
  width: number,
  height: number,
  cutoff: number,
  nsamples: number,
  optIter: number
};


const defaultParams = {
  inputImageUrl: 'tbl.png',
  width: 800,
  height: 800,
  cutoff: 210,
  nsamples: 10_000,
  optIter: 1
};


const paramsFromWidgets = (): any => {
  const params = {...defaultParams};
  params.cutoff = controlCutoff.val() as number;
  params.nsamples = controlNSamples.val() as number;
  params.optIter = controlOptIter.val() as number;
  return params;
};

let canvas: HTMLCanvasElement;

const renderFromQsp = function() {
  const params = paramsFromUrl(defaultParams);
  params.inputCanvas = canvas;
  const dts = new DrunkTravellingSalesman(params);
  $('canvas').innerHTML = dts.toSvg();
  delete params.inputCanvas; // don't put the whole image in the URL
  updateUrl(params);
};

const renderFromWidgets = function() {
  const params = paramsFromWidgets();
  params.inputCanvas = canvas;
  const dts = new DrunkTravellingSalesman(params);
  $('canvas').innerHTML = dts.toSvg();
  delete params.inputCanvas; // don't put the whole image in the URL
  updateUrl(params);
};

const render = (params?: any) => {
  if (!params) {
    params = paramsFromWidgets();
  }
  params.inputCanvas = canvas;
  const dts = new DrunkTravellingSalesman(params);
  $('canvas').innerHTML = dts.toSvg();
  delete params.inputCanvas; // don't put the whole image in the URL
  updateUrl(params);
};



const imageUpload = new ImageUploadControl({
  name: 'inputImage',
  label: 'Image',
  value: defaultParams['inputImageUrl'],
  firstCallback: renderFromQsp,
  callback: renderFromWidgets
});

canvas = imageUpload.canvasEl();

const controlCutoff = new NumberControl({
  name: 'cutoff',
  label: 'White cutoff',
  value: defaultParams['cutoff'],
  renderFn: render,
  min: 0,
  max: 255
});

const controlNSamples = new NumberControl({
  name: 'nsamples',
  label: 'Samples',
  value: defaultParams['nsamples'],
  renderFn: render,
  min: 5_000,
  max: 20_000,
});

const controlOptIter = new NumberControl({
  name: 'optIter',
  label: 'Optimisation',
  value: defaultParams['optIter'],
  renderFn: render,
  min: 0,
  max: 100_000,
});

new SvgSaveControl({
  name: 'svgSave',
  canvasId: 'svg-canvas',
  label: 'Save SVG',
  saveFilename: 'dts.svg'
});



