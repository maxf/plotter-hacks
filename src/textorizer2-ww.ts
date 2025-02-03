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
    svg.push(`
    <defs>
    <style>
    @font-face {
    font-family: "hershey font";
    //src: url(hershey_ttf/AVHersheySimplexHeavyItalic.ttf)
    src: url("hershey_ttf/AVHersheyDuplexLight.ttf") format("truetype");
    //src: url(hershey_ttf/AVHersheyComplexLight.ttf);
    //src: url(hershey_ttf/AVHersheyComplexHeavy.ttf);
    //src: url(hershey_ttf/AVHersheyComplexLight.ttf);
    //src: url(hershey_ttf/AVHersheySimplexLight.ttf);
    </style>
    </defs>
    <g stroke="black" fill="none" stroke-width=".4px">`);
    const nw = 10; // approximate number of letter in the width of the canvas
    for (let row=1; row<h; row+=h/10) {
      let x=0;
      let textToDraw = this.#text.substring(0, nw);
      while (x < w) {
        textToDraw += " " + this.#text.substring(0, nw);
        x += nw;
      }
      svg.push(`<text style="font-family: hershey font; font-size: 10" x="0" y="${row}">${textToDraw}</text>`);
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
