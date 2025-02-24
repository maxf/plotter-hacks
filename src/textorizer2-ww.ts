import { Pixmap } from './pixmap';


type Params = {
  inputCanvas: HTMLCanvasElement,
  text: string;
  width: number,
  height: number,
  cutoff: number,
  fontSize: number,
  nbLayers: number,
  lineHeight: number
};

class Textorizer2 {
  #image: Pixmap;
  #cutoff: number;
  #text: string;
  #widths: Record<string, number>;
  #fontSize: number;
  #textIndex: number;
  #nbLayers: number;
  #lineHeight: number;

  constructor(params: Params, widths: Record<string, number>, imageData: ImageData) {
    this.#image = new Pixmap(imageData);
    this.#text = params.text;
    this.#widths = widths;
    this.#cutoff = params.cutoff;
    this.#fontSize = params.fontSize;
    this.#textIndex = 0;
    this.#nbLayers = params.nbLayers;
    this.#lineHeight = params.lineHeight;
  }

  #toSvgScanLine(row: number, cutoff: number, dx: number = 0, dy: number = 0): string {
    const w = this.#image.width;
    let x = 0;
    //this.#textIndex = Math.floor(Math.random() * this.#text.length);
    const lettersToPush = [];
    while(x <= w) {
      const imageLevel = this.#image.brightnessAt(x, row);
      let glyph;
      if (imageLevel < cutoff) {
        glyph = this.#text[this.#textIndex];
        this.#textIndex = (this.#textIndex + 1) % this.#text.length;
      } else {
        glyph = ' ';
      }
      lettersToPush.push(glyph);
      x += this.#widths[glyph];
    }
    const str = lettersToPush.join('');
    if (/^\s+$/.test(str)) {
      return '';
    } else {
      return `<text x="${dx}" y="${row+dy}" style="white-space: pre">${str}</text>`;
    }
  }

  #toSvgScan(cutoff: number, dx: number = 0, dy: number = 0): string {
    const h = this.#image.height;
    const svg = [];
    for (let row = this.#fontSize; row <= h; row += this.#fontSize*this.#lineHeight) {
      svg.push(this.#toSvgScanLine(row, cutoff, dx, dy));
    }
    const scan = svg.join('');
    if (scan === '') {
      return '';
    } else {
      return `<g id="scan">${scan}</g>`;
    }
  }

  toSvg(): string {
    const w = this.#image.width;
    const h = this.#image.height;
    const svg = [];

    svg.push(`<svg id="svg-canvas" height="100vh" viewBox="0 0 ${w} ${h}">`);
    svg.push(`
    <g style="stroke: black; stroke-width: 0.1; fill: none; font-family: 'AVHershey Simplex'; font-size: ${this.#fontSize};">

    <rect x="0" y="0" width="${w}" height="${h}"/>
    `);

    const step = this.#cutoff / this.#nbLayers;
    for (let c = 1; c <= this.#nbLayers; c++) {
      const x = c*step;
      svg.push(this.#toSvgScan(x, 0, Math.random()*this.#fontSize*this.#lineHeight));
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
