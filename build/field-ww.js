// src/field-ww.ts
var Plot = class {
  density;
  constructor(params) {
    this.density = params.density;
  }
  fieldToSvg(w, h) {
    const svg = [];
    svg.push('<g stroke="red" stroke-width="1.0">');
    for (let x = 0; x <= w; x += w / this.density) {
      for (let y = 0; y <= h; y += h / this.density) {
        const x2 = x + 10 * Math.sin(2 * x);
        const y2 = y + 10 * Math.cos(2 * y);
        svg.push(`<line x1="${x}" y1="${y}" x2="${x2}" y2="${y2}"/>`);
      }
    }
    svg.push("</g>");
    return svg.join("");
  }
  toSvg() {
    const w = 800;
    const h = 800;
    const svg = [];
    svg.push(`<svg id="svg-canvas" height="100vh" viewBox="0 0 ${w} ${h}">`);
    svg.push(`  <g stroke="red" fill="none" stroke-width=".4px">`);
    svg.push(this.fieldToSvg(w, h));
    svg.push(`  </g>`);
    svg.push(`</svg>`);
    return svg.join("");
  }
};
onmessage = function(e) {
  const { params } = e.data;
  const plot = new Plot(params);
  postMessage(plot.toSvg());
};
