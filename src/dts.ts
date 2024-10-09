//import seedrandom from 'seedrandom';
import { ImageUploadControl, SvgSaveControl, paramsFromUrl, updateUrl,  $ } from './controls';
import { Pixmap } from './pixmap';
import { Delaunay } from 'd3-delaunay';


class DrunkTravellingSalesman {
  #params: Params;
  #inputPixmap: Pixmap;

  constructor(params: Params) {
    this.#params = params;
    this.#inputPixmap = new Pixmap(this.#params.inputCanvas as HTMLCanvasElement);
  }

  // TODO: make async
  toSvg(): string {

    const n = 10_000;
    const points = new Float64Array(n*2);
    const width = this.#inputPixmap.width;
    const height = this.#inputPixmap.height;

    // See: https://observablehq.com/@mbostock/voronoi-stippling

    // Initialize the points using rejection sampling.
    for (let i = 0; i < n; ++i) { // Do the following 10k times:
      // for each sample, 30 times pick a random point
      for (let j = 0; j < 30; ++j) {
        const x = Math.floor(width * Math.random());
        const y = Math.floor(height * Math.random());
        const imageLevel = this.#inputPixmap.brightnessAt(x, y);
        // the darker the image at this point, the more likely we're going to keep the point.
        if (200 * Math.random() > imageLevel) {
          points[2*i] = x+.5;
          points[2*i+1] = y+.5;
          break;
        }
      }
    }

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
    // so we can move on to the travelling salesman problem.

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
      for (let next=current+1; next<n; next++) {
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

    // =========== Rendering ===================
    // Stipple points
    const svgPoints = [];
    for (let i=0; i<n; i++) {
      svgPoints.push(`<circle cx="${points[2*i]}" cy="${points[2*i+1]}" r="0.5" vector-effect="non-scaling-stroke"/>`);
    }

    // voronoi polygons
    const polys = Array.from(voronoi.cellPolygons());
    const polySvg = [];
    polys.forEach(poly => {
      const polyPoints = poly.map(pp => `${pp[0]},${pp[1]} `);
      polySvg.push(`<polygon points="${polyPoints.join('')}" stroke="black" fill="none" stroke-width="0.1"/>`);
    });

    //        <path d="${polySvg.join('')}" stroke="red" fill="none/>
    //              ${polySvg.join('')}
    return `
      <svg id="svg-canvas" width="${800}" height="${800}" viewBox="0 0 ${width} ${height}">
        <g style="stroke: black; fill: black;">
          ${svgPoints.join('')}
        </g>
      </svg>
    `;
  }
}


type Params = {
  inputImageUrl: string,
  inputCanvas: HTMLCanvasElement,
  width: number,
  height: number
};


const defaultParams = {
  inputImageUrl: 'tbl.png',
  width: 800,
  height: 800
};


const paramsFromWidgets = (): any => {
  const params = {...defaultParams};
  return params;
};




new SvgSaveControl({
  name: 'svgSave',
  canvasId: 'svg-canvas',
  label: 'Save SVG',
  saveFilename: 'dts.svg'
});

new ImageUploadControl({
  name: 'inputImage',
  label: 'Image',
  value: defaultParams['inputImageUrl'],
  firstCallback: (instance: ImageUploadControl) => {
    const params = paramsFromUrl(defaultParams);
    params.inputCanvas = instance.canvasEl();
    const dts = new DrunkTravellingSalesman(params);
    $('canvas').innerHTML = dts.toSvg();
    delete params.inputCanvas; // don't put the whole image in the URL
    updateUrl(params);
  },
  callback: (instance: ImageUploadControl) => {
    const params = paramsFromWidgets();
    params.inputCanvas = instance.canvasEl();
    const dts = new DrunkTravellingSalesman(params);
    $('canvas').innerHTML = dts.toSvg();
    delete params.inputCanvas; // don't put the whole image in the URL
    updateUrl(params);
  }
});
