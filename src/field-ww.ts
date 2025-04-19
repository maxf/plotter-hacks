type Params = {
  nbSamples: number;
  fx: number;
  fy: number;
};

class Plot {
  private nbSamples: number;
  //private fx: number;
  //private fy: number;

  constructor(params: Params) {
    this.nbSamples = params.nbSamples;
    //this.fx = params.fx;
    //this.fy = params.fy;
  }

  private f(x: number, y: number): number {
    const d = (x: number, y: number, x1: number, y1: number) => {
      const dist = (x-x1)*(x-x1) + (y-y1)*(y-y1);
      const res = 10*Math.exp(-dist/100000);
      return res;
    }
    const d1 = d(x,y, 100, 100);
    const d2 = d(x,y, 700, 200);
    const d3 = d(x,y, 400, 700);

    return d1 + d2 + d3;
  }

  private gradient(x: number, y: number): number[] {
    const d = 0.001;
    const fxy = this.f(x, y);
    const gx = (this.f(x+d, y) - fxy) / d;
    const gy = (this.f(x, y+d) - fxy) / d;
    const gmag = 3000; //* (gx*gx + gy*gy);
    return [
      gx*gmag, gy*gmag
    ];
  }


  private fieldToSvg(w: number, h: number): string {
    const svg = [];
    for (let i=0; i < this.nbSamples; i++) {
      const [x, y] = [Math.random() * w, Math.random() * h];
      const [dx, dy] = this.gradient(x, y);
      svg.push(`
      <line
      x1="${x}" y1="${y}"
      x2="${x+dx}" y2="${y+dy}"/>`);
    }
    return svg.join('');
  }

  private gcodeStroke(x1: number, y1: number, x2: number, y2: number): string {
    return `
    Z0
    G0 ${x1} ${y1}
    Z5
    G1 ${x2} ${y2}
    Z0`
  }

  private fieldToGcode(w: number, h: number): string {
    const gcode = [];
    for (let i=0; i < this.nbSamples; i++) {
      const [x, y] = [Math.random() * w, Math.random() * h];
      const [dx, dy] = this.gradient(x, y);
      gcode.push(this.gcodeStroke(x, y, x+dx, y+dy));
    }
    return gcode.join('');
  }


  toSvg(): string {
    const w = 800;
    const h = 800;
    const svg = [];

    svg.push(`<svg id="svg-canvas" height="100vh" viewBox="0 0 ${w} ${h}">`);
    svg.push(`  <g stroke="red" fill="none" stroke-width="1.0">`);
    svg.push(this.fieldToSvg(w, h));
    svg.push(`  </g>`);
    svg.push(`</svg>`);
    return svg.join('');
  }

  toGcode(): string {
    const gcode = [];
    const w = 800;
    const h = 800;

    gcode.push(`; preamble
G21 ; millimeters
G90 ; absolute coordinates
G17 ; XY plane
G94 ; units per minute feed rate mode

; Go to safety height
G0 Z0

; Go to page top-right
G0 X50 Y0
`);

    gcode.push(this.fieldToGcode(w, h));

    gcode.push(`; reset
G0 Z0
G0 X50 Y0
`);
    return gcode.join('');
  }

}

onmessage = function(e) {
  const { params } = e.data;
  const plot = new Plot(params);
  postMessage({
    svg: plot.toSvg(),
    gcode: plot.toGcode()
  });
};
