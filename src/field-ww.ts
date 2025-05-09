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
    return `Z0
G0 X${x1} Y${y1}
Z5
G1 X${x2} Y${y2}
Z0
`
  }

  private fieldToGcode(w: number, h: number): string {
    const gcode: string[] = [];

    // To decrease plotter head travel, do a simple travelling salesman
    const points: number[] = [];
    for (let i=0; i < this.nbSamples; i++) {
      points.push(Math.random() * w, Math.random() * h);
    }

    const orderedPointIndexes = computeTsp(points);

    orderedPointIndexes.forEach(i => {
      const x = points[2*i];
      const y = points[2*i + 1];
      const [dx, dy] = this.gradient(x, y);
      gcode.push(this.gcodeStroke(x, y, x+dx, y+dy));
    });
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
G21 ; use millimeters
G90 ; All distances and positions are Absolute values from the current origin.
G17 ; Draw Arcs in the XY plane, default.
G94 ; Units/min mode at the current F rate.

F 1000 ; Set Feed rate in mm/min

G0 Z0 ; Go to safety height
G0 X50 Y0 ; Go to page top-right
`);

    gcode.push(this.fieldToGcode(w, h));

    gcode.push(`; reset to origin position
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


// Compute a travelling salesman from the array of 2D points passed
// - points: array of points: [x0, y0, x1, y1, etc.]
// - returns an array of indices of the points
const computeTsp = function(points: number[]): number[] {
  const n = points.length / 2;
  const dist2 = (p1: number[], p2: number[]) => (p2[0]-p1[0])*(p2[0]-p1[0]) + (p2[1]-p1[1])*(p2[1]-p1[1]);
  const dist2i = (i1: number, i2: number) => dist2([points[2*i1], points[2*i1+1]], [points[2*i2], points[2*i2+1]]);
  const visited = new Float64Array(n);
  const path = [];

  let current = 0;
  path.push(0);
  while(true) {
    let nearest;
    let dist = Infinity;
    for (let next=1; next<n; next++) {
      if (visited[next] === 0) {
        const d = dist2i(current, next);
        if (d<dist) {
          nearest = next;
          dist = d;
        }
      }
    }
    if (nearest) {
      path.push(nearest);
      visited[nearest] = 1;
      current = nearest;
    } else {
      break;
    }
  }

  // Optimise the path by swapping random edges if it reduces the path length
  // From: https://github.com/evil-mad/stipplegen/blob/master/StippleGen/StippleGen.pde#L692
  for (let i = 0; i < 1_000_000; ++i) {
    let indexA = Math.floor(Math.random()*(n - 1));
    let indexB = Math.floor(Math.random()*(n - 1));

    if (Math.abs(indexA - indexB) < 2) {
      continue;
    }

    if (indexB < indexA) { // swap A, B.
      [indexA, indexB] = [indexB, indexA];
    }

    const ai = path[indexA];
    const a0 = [ points[2*ai], points[2*ai+1] ];
    const ai2 = path[indexA + 1];
    const a1 = [ points[2*ai2], points[2*ai2+1] ];

    const bi = path[indexB];
    const b0 = [ points[2*bi], points[2*bi+1] ];
    const bi2 = path[indexB + 1];
    const b1 = [ points[2*bi2], points[2*bi2+1] ];

    // Original distance:
    const dx1 = a0[0] - a1[0];
    const dy1 = a0[1] - a1[1];
    const dx2 = b0[0] - b1[0];
    const dy2 = b0[1] - b1[1];
    const distance = (dx1*dx1 + dy1*dy1) + (dx2*dx2 + dy2*dy2);

    // Possible shorter distance?
    const dx3 = a0[0] - b0[0];
    const dy3 = a0[1] - b0[1];
    const dx4 = a1[0] - b1[0];
    const dy4 = a1[1] - b1[1];

    const distance2 = (dx3*dx3 + dy3*dy3) + (dx4*dx4 + dy4*dy4);

    if (distance2 < distance) {
      // Reverse tour between a1 and b0.

      let indexhigh = indexB;
      let indexlow = indexA + 1;

      while (indexhigh > indexlow) {
        const temp: number = path[indexlow];
        path[indexlow] = path[indexhigh];
        path[indexhigh] = temp;

        indexhigh--;
        indexlow++;
      }
    }
  }

  return path;
}
