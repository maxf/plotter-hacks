type Params = {
  rectSize: number
};

class Plot {
  #rectSize: number;

  constructor(params: Params) {
    this.#rectSize = params.rectSize;
  }

  toSvg(): string {
    const w = 800;
    const h = 800;

    const svg = [];

    svg.push(`<svg id="svg-canvas" height="100vh" viewBox="0 0 ${w} ${h}">`);
    svg.push(`  <g stroke="black" fill="none" stroke-width=".4px">`);
    svg.push(`    <rect x="100" y="100" width="${this.#rectSize}" height="${this.#rectSize}"/>`);
    svg.push(`  </g>`);
    svg.push(`</svg>`);
    return svg.join('');
  }
}

onmessage = function(e) {
  const { params } = e.data;
  const plot = new Plot(params);
  postMessage(plot.toSvg());
};
