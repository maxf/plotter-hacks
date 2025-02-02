import { Pixmap } from './pixmap';


type Params = {
  inputCanvas: HTMLCanvasElement,
  text: string;
  width: number,
  height: number,
  cutoff: number,
};

class Textorizer2 {
  #image: Pixmap;
  // #cutoff: number;
  #text: string;

  constructor(params: Params, imageData: ImageData) {
    this.#image = new Pixmap(imageData);
    this.#text = params.text;
    //    this.#cutoff = params.cutoff;
  }

  toSvg(): string {
    const w = this.#image.width;
    const h = this.#image.height;
    const svg = [];

    svg.push(`<svg id="svg-canvas" height="100vh" viewBox="0 0 ${w} ${h}">`);
    svg.push(`<g stroke="black" fill="none" stroke-width=".4px">`);
    for (let row=1; row<h; row+=h/10) {
      let x = 0;
      let i = 0;
      while (x < w) {
        const letter = this.#text[i % this.#text.length];
        svg.push(`<text style="font-family: sans; font-size: 5"  x="${x}" y="${row}">${letter}</text>`);
        x += 3; // replace with letter width
        i++;
      }
    }
    svg.push('</g></svg>');
    return svg.join('');
  }
}

onmessage = function(e) {
  const { params, imageData } = e.data;
  const textorizer2 = new Textorizer2(params, imageData);
  postMessage(textorizer2.toSvg());
};
