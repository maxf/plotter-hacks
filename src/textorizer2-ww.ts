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
  #widths: Record<string, number>;

  constructor(params: Params, widths: Record<string, number>, imageData: ImageData) {
    this.#image = new Pixmap(imageData);
    this.#text = params.text;
    this.#widths = widths;
    //    this.#cutoff = params.cutoff;
  }

  toSvg(): string {
    const w = this.#image.width;
    const h = this.#image.height;
    const svg = [];
    const fontSize = 5;

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

    let textIndex = 0;
    for (let row=1; row<h; row+=h/50) {
      let x=0;
      while(x < w) {
        const imageLevel = this.#image.brightnessAt(x, row);
        const glyph = this.#text[textIndex];
        if (imageLevel < 128) {
          svg.push(`<text style="font-family: hershey font; font-size: ${fontSize}; stroke-width: 0.1" x="${x}" y="${row}">${glyph}</text>`);
        }
        textIndex = (textIndex + 1) % this.#text.length;
        x += this.#widths[glyph] * fontSize / 10;
      }
    }
    svg.push('</g></svg>');
    return svg.join('');
  }
}

onmessage = function(e) {
  const { params, widths, imageData } = e.data;
  const textorizer2 = new Textorizer2(params, widths, imageData);
  postMessage(textorizer2.toSvg());
};
