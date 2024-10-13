import seedrandom from 'seedrandom';

import {
  NumberControl,
  ImageUploadControl,
  CheckboxControl,
  SvgSaveControl,
  paramsFromUrl,
  updateUrl,
  $
} from './controls';
import { Pixmap } from './pixmap';
import { Delaunay } from 'd3-delaunay';


class DrunkTravellingSalesman {
  #params: Params;
  #image: Pixmap;
  #cutoff: number;
  #nsamples: number;
  #optIter: number;
  #showStipple: boolean;
  #showPoly: boolean;
  #showDts: boolean;
  #rng: any;
  #points: Float64Array;
  #path: number[];
  #curvature: number;

  constructor(params: Params) {
    this.#params = params;
    this.#image = new Pixmap(this.#params.inputCanvas as HTMLCanvasElement);
    this.#cutoff = params.cutoff;
    this.#nsamples = params.nsamples;
    this.#optIter = params.optIter;
    this.#showStipple = params.showStipple;
    this.#showPoly = params.showPoly;
    this.#showDts = params.showDts;
    this.#curvature = params.curvature;
    this.#rng = seedrandom(params.seed.toString());
    this.#points = new Float64Array(this.#nsamples*2);
    this.#path = [];
  }

  #pathLength(): number {
    let dist = 0;
    for (let i=0; i<this.#path.length-1; i++) {
      const ip1 = this.#path[i];
      const ip2 = this.#path[i+1];
      const p1 = [ this.#points[2*ip1], this.#points[2*ip1+1] ];
      const p2 = [ this.#points[2*ip2], this.#points[2*ip2+1] ];
      dist += (p2[0]-p1[0])*(p2[0]-p1[0]) + (p2[1]-p1[1])*(p2[1]-p1[1]);
    }
    return dist;
  }

  #bezierSplineFromPath(path: number[]): string {
    const n = path.length;
    const pathParts: string[] = [];
    if (n < 3) {
      // not enough points
      return '';
    }
    const getPoint = (i: number) => ({
      x: this.#points[2 * path[i]],
      y: this.#points[2 * path[i] + 1]
    });


    // Loop through points to compute bezier segments
    // first segment

    let prev = getPoint(0);
    let curr = prev;
    let next = getPoint(1);
    let next2 = getPoint(2);
    let curvature = this.#rng()*this.#curvature - this.#curvature/2;

    let c0 = { x: curr.x + curvature*(next.x - prev.x), y: curr.y + curvature*(next.y - prev.y) };
    let n0 = { x: next.x - curvature*(next2.x - curr.x), y: next.y - curvature*(next2.y - curr.y) };
    pathParts.push(`M ${prev.x} ${prev.y} C ${c0.x},${c0.y} ${n0.x},${n0.y} ${next.x},${next.y}`);

    // other segments
    for (let i = 1; i < n - 2; i++) {
      prev = getPoint(i - 1);
      curr = getPoint(i);
      next = getPoint(i + 1);
      next2 = getPoint(i + 2);
      curvature = this.#rng()*this.#curvature - this.#curvature/2;
      c0 = { x: curr.x + curvature*(next.x - prev.x), y: curr.y + curvature*(next.y - prev.y) };
      n0 = { x: next.x - curvature*(next2.x - curr.x), y: next.y - curvature*(next2.y - curr.y) };

      // Create cubic Bézier curve command for this segment
      // assuming current bezier control point is at c,
      pathParts.push(`C ${c0.x},${c0.y} ${n0.x},${n0.y} ${next.x},${next.y}`);
    }

    // last segment
    prev = getPoint(n-3);
    curr = getPoint(n-2);
    next = getPoint(n-1);
    next2 = next;
    curvature = this.#rng()*20-10;
    c0 = { x: curr.x + curvature*(next.x - prev.x), y: curr.y + curvature*(next.y - prev.y) };
    n0 = { x: next.x - curvature*(next2.x - curr.x), y: next.y - curvature*(next2.y - curr.y) };

    // Create cubic Bézier curve command for this segment
    // assuming current bezier control point is at c,
    pathParts.push(`C ${c0.x},${c0.y} ${n0.x},${n0.y} ${next.x},${next.y}`);

    return pathParts.join(" ");
  }

  #sampleStipplePoints(): number {
    let n = this.#points.length / 2;
    const width = this.#image.width;
    const height = this.#image.height;

    // Step 1 : Voronoi stippling
    // See: https://observablehq.com/@mbostock/voronoi-stippling

    // 1.1 Initialize the points using rejection sampling.
    let sampledPoints = 0;
    for (let i = 0; i < n; ++i) {
      // for each sample, 30 times pick a random point
      for (let j = 0; j < 30; ++j) {
        const x = Math.floor(width * this.#rng());
        const y = Math.floor(height * this.#rng());
        const imageLevel = this.#image.brightnessAt(x, y);
        // the darker the image at this point, the more likely we're going to keep the point.
        if (200 * this.#rng() > imageLevel) {
          this.#points[2*sampledPoints] = x+.5;
          this.#points[2*sampledPoints+1] = y+.5;
          sampledPoints++;
          break;
        }
      }
    }
    return sampledPoints;
  }


  #relaxCentroids() {
    const n = this.#points.length / 2;
    const width = this.#image.width;
    const height = this.#image.height;

    // Create voronoi diagram
    const delaunay = new Delaunay(this.#points);
    const voronoi = delaunay.voronoi([0, 0, width, height]);
    const centroids = new Float64Array(n * 2);
    const weights = new Float64Array(n);

    // Lloyd relaxation of the centroids
    for (let k = 0; k < 10; ++k) {
      // Compute the weighted centroid for each Voronoi cell.
      centroids.fill(0);
      weights.fill(0);
      let delaunayIndex = 0;
      // loop over the pixels in our image and adjust the centroid
      // of the voronoi cell where it falls
      for (let y = 0; y < height; ++y) {
        for (let x = 0; x < width; ++x) {
          const weight = 255 - this.#image.brightnessAt(x, y);
          delaunayIndex = delaunay.find(x, y, delaunayIndex);
          weights[delaunayIndex] += weight;
          centroids[delaunayIndex * 2] += weight * x;
          centroids[delaunayIndex * 2 + 1] += weight * y;
        }
      }

      // now 'centroids' is an array of the centroid for each cell
      // (some centroids can be empty though, if no pixel fell on the cell)
      // and 'weigths' are the weights of each cell


      // Relax the diagram by moving points to the weighted centroid.
      // Wiggle the points a little bit so they don’t get stuck.
      // const w = Math.pow(k + 1, -0.8) * 10;
      for (let i = 0; i < n; ++i) {
        const x0 = this.#points[i * 2];
        const y0 = this.#points[i * 2 + 1];
        const x1 = weights[i] ? centroids[i * 2] / weights[i] : x0;
        const y1 = weights[i] ? centroids[i * 2 + 1] / weights[i] : y0;
        this.#points[i * 2] = x0 + (x1 - x0) * 1.8; // + (this.#rng() - 0.5) * w;
        this.#points[i * 2 + 1] = y0 + (y1 - y0) * 1.8; // + (this.#rng() - 0.5) * w;
      }

      voronoi.update();
    }
  }

  #removeBrightPoints(): number {
    const n = this.#points.length / 2;
    const points2 = new Float64Array(n*2);
    let p = 0;
    for (let i=0; i<n; i++) {
      const brightness = this.#image.brightnessAt(
        Math.floor(this.#points[2*i]),
        Math.floor(this.#points[2*i+1])
      );
      if (brightness < this.#cutoff) {
        points2[2*p] = this.#points[2*i];
        points2[2*p+1] = this.#points[2*i+1];
        p++;
      }
    }
    this.#points = points2;
    return p;
  }

  #computeTsp() {
    const n = this.#points.length / 2;
    const dist2 = (p1: number[], p2: number[]) => (p2[0]-p1[0])*(p2[0]-p1[0]) + (p2[1]-p1[1])*(p2[1]-p1[1]);
    const dist2i = (i1: number, i2: number) => dist2([this.#points[2*i1], this.#points[2*i1+1]], [this.#points[2*i2], this.#points[2*i2+1]]);
    const visited = new Float64Array(n);

    let current = 0;
    this.#path.push(0);
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
        this.#path.push(nearest);
        visited[nearest] = 1;
        current = nearest;
      } else {
        break;
      }
    }

    // 3.2 Then optimise the path by swapping random edges if it reduces the path length
    // From: https://github.com/evil-mad/stipplegen/blob/master/StippleGen/StippleGen.pde#L692
    for (let i = 0; i < this.#optIter; ++i) {
      let indexA = Math.floor(this.#rng()*(n - 1));
      let indexB = Math.floor(this.#rng()*(n - 1));

      if (Math.abs(indexA - indexB) < 2) {
        continue;
      }

      if (indexB < indexA) { // swap A, B.
        [indexA, indexB] = [indexB, indexA];
      }

      const ai = this.#path[indexA];
      const a0 = [ this.#points[2*ai], this.#points[2*ai+1] ];
      const ai2 = this.#path[indexA + 1];
      const a1 = [ this.#points[2*ai2], this.#points[2*ai2+1] ];

      const bi = this.#path[indexB];
      const b0 = [ this.#points[2*bi], this.#points[2*bi+1] ];
      const bi2 = this.#path[indexB + 1];
      const b1 = [ this.#points[2*bi2], this.#points[2*bi2+1] ];

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

      if (distance2 < distance) {
        // Reverse tour between a1 and b0.

        let indexhigh = indexB;
        let indexlow = indexA + 1;

        while (indexhigh > indexlow) {
          const temp = this.#path[indexlow];
          this.#path[indexlow] = this.#path[indexhigh];
          this.#path[indexhigh] = temp;

          indexhigh--;
          indexlow++;
        }
      }
    }

    console.log('total distance:', this.#pathLength());

    // 3.3 remove long edges, as they aren't aestethically pleasing.
    // We don't need a single path anyway and we don't want long straight lines
    // in our final rendering
    const minLength = 200;
    const subPaths: number[][] = [];
    let indexSub: number = 0;
    subPaths[0] = [this.#path[0]];
    for (let i=0; i<this.#path.length-1; i++) {
      const ai = this.#path[i];
      const a0 = [ this.#points[2*ai], this.#points[2*ai+1] ];
      const ai2 = this.#path[i + 1];
      const a1 = [ this.#points[2*ai2], this.#points[2*ai2+1] ];

      if ((a0[0]-a1[0])*(a0[0]-a1[0]) + (a0[1]-a1[1])*(a0[1]-a1[1]) < minLength) {
        subPaths[indexSub].push(ai2);
      } else {
        subPaths[++indexSub] = [ai2];
      }
    }
    return subPaths;
  }


  toSvg(): string {
    let n = this.#nsamples;
    const width = this.#image.width;
    const height = this.#image.height;

    // Step 1 : Voronoi stippling
    // See: https://observablehq.com/@mbostock/voronoi-stippling

    // 1.1 Initialize the points using rejection sampling.

    n = this.#sampleStipplePoints();

    if (n < 2) {
      return 'Less than 2 sampled points!';
    } else {
      console.log(`Initial sampling: ${n} points`);
    }

    this.#relaxCentroids();

    // 3. Remove the points in the brightest areas (above the cutoff point)
    n = this.#removeBrightPoints();

    // 3. now we can move on to the travelling salesman problem.
    const subPaths: number[][] = this.#computeTsp();

    // From the polylines in subPath we can compute Bezier splines.

    const svg = [];

    svg.push(`<svg id="svg-canvas" width="${800}" height="${800}" viewBox="0 0 ${width} ${height}">`);

    // // voronoi polygons
    // const polys = Array.from(voronoi.cellPolygons());
    // polys.forEach(poly => {
    //   const polyPoints = poly.map(pp => `${pp[0]},${pp[1]} `);
    //   svg.push(`<polygon points="${polyPoints.join('')}" stroke="black" fill="none" stroke-width="0.1"/>`);
    // });

    // Main TSP path
    // const svgTspPath = path.map(i => [this.#points[2*i], this.#points[2*i+1]]);
    // const d0 = `M ${svgTspPath[0][0]} ${svgTspPath[0][1]}`;
    // const d1 = svgTspPath.slice(1).map(([x,y]) => `L ${x} ${y}`).join('');
    // svg.push(`<path d="${d0} ${d1}" stroke="red" fill="none" stroke-width="0.5"/>`);

    // TSP sub paths
    if (this.#showPoly) {
      svg.push('<g style="fill: none; stroke: green">');
      subPaths.forEach(path => {
        const svgTspPath = path.map(i => [this.#points[2*i], this.#points[2*i+1]]);
        const d0 = `M ${svgTspPath[0][0]} ${svgTspPath[0][1]}`;
        const d1 = svgTspPath.slice(1).map(([x,y]) => `L ${x} ${y}`).join('');
        svg.push(`<path d="${d0} ${d1}" stroke="green" fill="none" stroke-width="0.5"/>`);
      });
      svg.push('</g>');
    }
    
    // Drunk TSP spline
    if (this.#showDts) {
      svg.push('<g style="fill: none; stroke: blue; stroke-width: 0.2">');
      subPaths.forEach(path => {
        const svgPathData = this.#bezierSplineFromPath(path);
        svg.push(`<path d="${svgPathData}"/>`);
      });
      svg.push('</g>');
    }

    if (this.#showStipple) {
      // Stipple points
      for (let i=0; i<n; i++) {
        svg.push(`<circle cx="${this.#points[2*i]}" cy="${this.#points[2*i+1]}" r="0.6" vector-effect="non-scaling-stroke" stroke="none" fill="black"/>`);
      }
    }
    
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
  optIter: number,
  showStipple: boolean,
  showPoly: boolean,
  showDts: boolean,
  seed: number,
  curvature: number
};


const defaultParams = {
  inputImageUrl: 'tbl.png',
  width: 800,
  height: 800,
  cutoff: 210,
  nsamples: 10_000,
  optIter: 1,
  showStipple: false,
  showPoly: false,
  showDts: true,
  seed: 128,
  curvature: 20
};


const paramsFromWidgets = (): any => {
  const params = {...defaultParams};
  params.cutoff = controlCutoff.val() as number;
  params.nsamples = controlNSamples.val() as number;
  params.optIter = controlOptIter.val() as number;
  params.showStipple = controlShowStipple.val() as boolean;
  params.showPoly = controlShowPoly.val() as boolean;
  params.showDts = controlShowDts.val() as boolean;
  params.seed = controlSeed.val() as number;
  params.curvature = controlCurvature.val() as number;
  return params;
};

let canvas: HTMLCanvasElement;

const renderFromQsp = function() {
  const params = paramsFromUrl(defaultParams);
  params.inputCanvas = canvas;
  const dts = new DrunkTravellingSalesman(params);
  $('canvas').innerHTML = dts.toSvg();
  delete params.inputCanvas; // don't put the whole image in the URL
  controlCutoff.set(params.cutoff);
  controlOptIter.set(params.optIter);
  controlNSamples.set(params.nsamples);
  controlShowStipple.set(params.showStipple);
  controlShowPoly.set(params.showPoly);
  controlShowDts.set(params.showDts);
  controlSeed.set(params.seed);
  controlCurvature.set(params.curvature);
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

const controlSeed = new NumberControl({
  name: 'seed',
  label: 'seed',
  value: defaultParams['seed'],
  renderFn: render,
  min: 0,
  max: 500
});


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
  min: 10,
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

const controlCurvature = new NumberControl({
  name: 'curvature',
  label: 'Curvature',
  value: defaultParams['curvature'],
  renderFn: render,
  min: 1,
  max: 50,
});


const controlShowStipple = new CheckboxControl({
  name: 'showStipple',
  label: 'Stipple points',
  value: defaultParams['showStipple'],
  renderFn: render
});

const controlShowPoly = new CheckboxControl({
  name: 'showPoly',
  label: 'Polygons',
  value: defaultParams['showPoly'],
  renderFn: render
});

const controlShowDts = new CheckboxControl({
  name: 'Splines',
  label: 'Dts points',
  value: defaultParams['showDts'],
  renderFn: render
});


new SvgSaveControl({
  name: 'svgSave',
  canvasId: 'svg-canvas',
  label: 'Save SVG',
  saveFilename: 'dts.svg'
});



