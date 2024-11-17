import seedrandom from 'seedrandom';
import { Pixmap } from './pixmap';


type Params = {
  inputImageUrl: string,
  inputCanvas: HTMLCanvasElement,
  width: number,
  height: number,
  cutoff: number,
  nsamples: number,
  seed: number
};

class Gandalf {
  #image: Pixmap;
  #cutoff: number;
  #nsamples: number;
  #rng: any;

  constructor(params: Params, imageData: ImageData) {
    this.#image = new Pixmap(imageData);
    this.#cutoff = params.cutoff;
    this.#nsamples = params.nsamples;
    this.#rng = seedrandom(params.seed.toString());
  }

  #samplePoints() {
    const w = this.#image.width;
    const h = this.#image.height;
    const points = [];

    for (let i = 0; i < this.#nsamples; ++i) {
      // for each sample, 30 times pick a random point
      for (let j = 0; j < 30; ++j) {
        const x = w * this.#rng();
        const y = h * this.#rng();
        const imageLevel = this.#image.brightnessAt(x, y);
        // the darker the image at this point, the more likely we're going to keep the point.
        if (200 * this.#rng() > imageLevel) {
          if (imageLevel < this.#cutoff) {
            //const avgLevel = this.#image.brightnessAverageAt(x, y, 1);
            const avgLevel = this.#image.brightnessAt(x, y);
            points.push({ x, y, radius: Math.pow(avgLevel,1.8)/1000 });
            break;
        }
        }
      }
    }
    return points;
  }

  toSvg(): string {
    const points = this.#samplePoints();
    const w = this.#image.width;
    const h = this.#image.height;

    const svg = [];

    svg.push(`<svg id="svg-canvas" height="100vh" viewBox="0 0 ${w} ${h}">`);
    svg.push(`<g stroke="black" fill="none" stroke-width=".4px">`);
    points.forEach((point: any) => {
      const r = (point.radius-1)*4;
      const p1 = {x: point.x, y: point.y-r};
      const p2 = {x: point.x, y: point.y+r};
      const m = {x: (p1.x + p2.x)/2, y: (p1.y + p2.y)/2};
      const angle = (this.#rng() > .5 ? 10 : -15) + (this.#rng()*10 - 5);
      svg.push(`<line
        x1="${p1.x}" y1="${p1.y}"
        x2="${p2.x}" y2="${p2.y}"
        transform="rotate(${angle}, ${m.x}, ${m.y})"
      />`);
      //svg.push(`<circle cx="${point.x}" cy="${point.y}" r="${r}" stroke="none" fill="red"/>`);
    });

    svg.push('</g></svg>');
    return svg.join('');
  }
}

onmessage = function(e) {
  const { params, imageData } = e.data;
  const gandalf = new Gandalf(params, imageData);
  postMessage(gandalf.toSvg());
};
