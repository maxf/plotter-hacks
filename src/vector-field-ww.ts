import { Pixmap } from './pixmap';

type Params = {
  inputImageUrl: string,
  inputCanvas: HTMLCanvasElement,
  width: number,
  height: number,
  cutoff: number,
  nsamples: number,
  strokeLength: number
};

class VectorField {
  #image: Pixmap;
  #cutoff: number;
  #nsamples: number;
  #strokeLength: number;

  constructor(params: Params, imageData: ImageData) {
    this.#image = new Pixmap(imageData);
    this.#cutoff = params.cutoff;
    this.#nsamples = params.nsamples;
    this.#strokeLength = params.strokeLength;
  }

  toSvg(): string {
    let n = this.#nsamples;
    const width = this.#image.width;
    const height = this.#image.height;
    const svg = [];
    svg.push(`<svg id="svg-canvas" height="100vh" viewBox="0 0 ${width} ${height}">`);

    for (let i=0; i<n; i++) {
      for (let j=0; j<n; j++) {
        const ix = Math.floor(width*i/n);
        const iy = Math.floor(height*j/n);
        let [vx, vy] = this.#image.gradientAt(ix, iy);
        vx = -vx; // reorient

        const gradientMagnitude = Math.sqrt(vx * vx + vy * vy);
        if (gradientMagnitude < this.#cutoff) {
          continue
        }
        vx = this.#strokeLength * vx / gradientMagnitude;
        vy = this.#strokeLength * vy / gradientMagnitude;

        svg.push(`<line x1="${ix}" y1="${iy}" x2="${ix+vx}" y2="${iy+vy}" style="stroke:red;stroke-width:0.2" />`);
      }
    }


    svg.push(`</svg>`);
    return svg.join('');
  }
}

onmessage = function(e) {
  const { params, imageData } = e.data;
  const dts = new VectorField(params, imageData);
  postMessage(dts.toSvg());
};
