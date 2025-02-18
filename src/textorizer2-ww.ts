import { Pixmap } from './pixmap';


type Params = {
  inputCanvas: HTMLCanvasElement,
  text: string;
  width: number,
  height: number,
  cutoff: number,
  fontSize: number
};

class Textorizer2 {
  #image: Pixmap;
  #cutoff: number;
  #text: string;
  #widths: Record<string, number>;
  #fontSize: number;
  #textIndex: number;

  constructor(params: Params, widths: Record<string, number>, imageData: ImageData) {
    this.#image = new Pixmap(imageData);
    this.#text = params.text;
    this.#widths = widths;
    this.#cutoff = params.cutoff;
    this.#fontSize = params.fontSize;
    this.#textIndex = 0;
  }

  #toSvgScanLine(row: number, cutoff: number, dx: number = 0, dy: number = 0): string {
    const w = this.#image.width;
    let x = 0;
    this.#textIndex = Math.floor(Math.random() * this.#text.length);
    const lettersToPush = [];
    while(x <= w) {
      const imageLevel = this.#image.brightnessAt(x, row);
      const glyph = imageLevel < cutoff ? this.#text[this.#textIndex] : ' ';
      lettersToPush.push(glyph);
      this.#textIndex = (this.#textIndex + 1) % this.#text.length;
      x += this.#widths[glyph];
    }
    return `<text x="${dx}" y="${row+dy}" style="white-space: pre">${lettersToPush.join('')}</text>`;
  }

  #toSvgScan(cutoff: number, dx: number = 0, dy: number = 0): string {
    const h = this.#image.height;
    const svg = [];
    svg.push(`<g id="scan">`);
    for (let row = 0; row < h; row += this.#fontSize) {
      svg.push(this.#toSvgScanLine(row, cutoff, dx, dy));
    }
    svg.push('</g>');
    return svg.join('');
  }

  toSvg(): string {
    const w = this.#image.width;
    const h = this.#image.height;
    const svg = [];

    svg.push(`<svg id="svg-canvas" height="100vh" viewBox="0 0 ${w} ${h}">`);
    svg.push(`
    <g style="stroke: black; stroke-width: 0.1; fill: none; font-family: 'AVHershey Simplex'; font-size: ${this.#fontSize};">

    <!-- <rect x="0" y="0" width="${w}" height="${h}"/> -->
`);


    const span = (this.#cutoff - 10);
    for (let cutoff = 10; cutoff < this.#cutoff; cutoff += span/4) {
      svg.push(this.#toSvgScan(cutoff, 0, 0));
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
