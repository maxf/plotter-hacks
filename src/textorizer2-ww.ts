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
  #cutoff: number;
  #text: string;
  #widths: Record<string, number>;

  constructor(params: Params, widths: Record<string, number>, imageData: ImageData) {
    this.#image = new Pixmap(imageData);
    this.#text = params.text;
    this.#widths = widths;
    this.#cutoff = params.cutoff;
  }


  #toSvgScanLine(angle: number, row: number): string {
    const w = this.#image.width;
    const h = this.#image.height;
    const cos = Math.cos(angle);
    const sin = Math.sin(angle);
    const svg = [];
    let row = 1;
    let x = 0;
    let textIndex = 0;
    svg.push('<g class="scanLine")>');
    while(row <=h && row >= 0 && x <= w && x >= 0) {
      const imageLevel = this.#image.brightnessAt(x, row);
      const glyph = this.#text[textIndex];
      if (imageLevel < cutoff) {
        svg.push(`<text x="${x}" y="${row}">${glyph}</text>`);
      }
      textIndex = (textIndex + 1) % this.#text.length;
      const distStep = this.#widths[glyph] * fontSize / 10;
      x += cos * distStep;
      y += sin * distStep;
    }
    svg.push('</g>');
    return svg.join('');
  }

  #toSvgScan(angle: number): string {
    const w = this.#image.width;
    const h = this.#image.height;
    const svg = [];
    svg.push('<g class="scan")>');
    for (let row = 0; row<w; row += h/50) {
      svg.push(this.#toSvgScanLine(angle, row);
    }
    svg.push('</g>');
    return svg.join('');
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
    <g style="stroke: black; stroke-width: 0.1; fill: none; font-family: hershey font; font-size: ${fontSize};">`);
    for (let cutoff = 10; cutoff < 255; cutoff += 50) {
      svg.push(this.#toSvgScan(angle));
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
