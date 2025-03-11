import { Pixmap } from './pixmap';
import { strokeGlyphs } from './stroke-font';

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
  #fontSize: number;
  #textIndex: number;
  #nbLayers: number;
  #lineHeight: number;

  constructor(params: Params, imageData: ImageData) {
    this.#image = new Pixmap(imageData);
    this.#text = params.text;
    this.#cutoff = params.cutoff;
    this.#fontSize = params.fontSize;
    this.#textIndex = 0;
    this.#nbLayers = params.nbLayers;
    this.#lineHeight = params.lineHeight;
  }

  #toSvgScanLine(row: number, cutoff: number, dx: number = 0, dy: number = 0): string {
    const w = this.#image.width;
    let x = 0;
    const svg = [];
    while(x <= w) {
      const imageLevel = this.#image.brightnessAt(x, row);
      let glyph, glyphInfo;
      if (imageLevel < cutoff) {
        glyph = this.#text[this.#textIndex];
        glyphInfo = strokeGlyphs[glyph];
        if (glyph !== ' ') {
          const scale = this.#fontSize * 0.001;
          svg.push(`<path data-glyph="${glyph}" vector-effect="non-scaling-stroke" d="${glyphInfo[2]}" transform="translate(${x+dx}, ${row+dy}) scale(${scale},${-scale})" />`);
        }
        this.#textIndex = (this.#textIndex + 1) % this.#text.length;
      } else {
        glyph = ' ';
        glyphInfo = strokeGlyphs[' '];
      }
      x += glyphInfo[1]*this.#fontSize * 0.001;
    }
    const content = svg.join('');
    return content === '' ? '' : `<g class="scan-line" data-row="${row}">${content}</g>`;
  }

  #toSvgScan(cutoff: number, dx: number = 0, dy: number = 0): string {
    const h = this.#image.height;
    const svg = [];
    for (let row = this.#fontSize; row <= h; row += this.#fontSize) {
      svg.push(this.#toSvgScanLine(row, cutoff, dx, dy));
    }
    const scan = svg.join('');
    return scan === '' ? '' : `<g id="scan">${scan}</g>`;
  }

  toSvg(): string {
    const w = this.#image.width;
    const h = this.#image.height;
    const svg = [];

    svg.push(`<svg id="svg-canvas" height="100vh" viewBox="0 0 ${w} ${h}">`);
    svg.push(`
      <rect x="0" y="0" width="${w}" height="${h}" style="stroke: black; stroke-width: 1; fill: none"/>
      <g style="stroke: black; stroke-width: 1; fill: none;">
    `);

    const step = this.#cutoff / this.#nbLayers;
      //for (let c = 1; c <= this.#nbLayers; c++) {
    for (let c = this.#nbLayers; c >= 1; c--) {
      const x = c*step;
      const dy = c === this.#nbLayers ? 0 : Math.random() *this.#lineHeight*5;
        //svg.push(this.#toSvgScan(x, 0, 0));
      svg.push(this.#toSvgScan(x, 0, dy));
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
