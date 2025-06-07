type Params = {
  nbSamples: number;
  landingSpeed: number;
  takeoffSpeed: number;
};

class Plot {
  private nbSamples: number;
  private landingSpeed: number;
  private takeoffSpeed: number;

  constructor(params: Params) {
    this.nbSamples = params.nbSamples;
    this.landingSpeed = params.landingSpeed;
    this.takeoffSpeed = params.takeoffSpeed;
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

  private gcodeXY(x: number, y: number): string {
    return `X${x} Y${y}`;
    //return `X${(-1.4*x + 43)/4} Y${(-1.4*y + 78)/4}`;
  }

//   private gcodeStroke(x1: number, y1: number, x2: number, y2: number): string {
//     return `
// G0 ${this.gcodeXY(x1, y1)}
// G0 Z5
// G1 ${this.gcodeXY(x2, y2)}
// G0 Z0
// `;
//   }

  /*
  private gcodeGentleStroke(x1: number, y1: number, x2: number, y2: number, high: number, low: number): string {
    // stroke from x1,y1 to x2,y2 going from high to low then high again  \____/
    const lerp1x = x1 + (x2 - x1)/3;
    const lerp1y = y1 + (y2 - y1)/3;
    const lerp2x = x1 + 2*(x2 - x1)/3;
    const lerp2y = y1 + 2*(y2 - y1)/3;
    return `
    G0 ${this.gcodeXY(x1, y1)} Z${high}
    G1 ${this.gcodeXY(lerp1x, lerp1y)} Z${low}
    G1 ${this.gcodeXY(lerp2x, lerp2y)}
    G1 ${this.gcodeXY(x2, y2)} Z${high}
`;
  }
   */
  private gcodeGentleStroke(x1: number, y1: number, x2: number, y2: number, high: number, low: number): string {
    // stroke from x1,y1 to x2,y2 going from high to low then high again  \____/
    const deltaX = x2 - x1;
    const deltaY = y2 - y1;

    const l = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

    const M1x = x1 + deltaX/3;
    const M1y = y1 + deltaY/3;
    const M1minx = x1 + deltaX * this.landingSpeed / l;
    const M1miny = y1 + deltaY * this.landingSpeed / l;

    // m1x, m1y is the point closest to P1 (x1,y1) among M1 and M1min
    const dP1M1 = (x1 - M1x) * (x1 - M1x) + (y1 - M1y) * (y1 - M1y);
    const dP1M1min = (x1 - M1minx) * (x1 - M1minx) + (y1 - M1miny) * (y1 - M1miny);

    console.log(dP1M1 > dP1M1min ? 'M1minx' : 'M1x');
    const m1x = dP1M1 > dP1M1min ? M1minx : M1x;
    const m1y = dP1M1 > dP1M1min ? M1miny : M1y;

    const M2x = x1 + 2*deltaX/3;
    const M2y = y1 + 2*deltaY/3;
    const M2maxx = x1 + deltaX * (l - this.takeoffSpeed) / l;
    const M2maxy = y1 + deltaY * (l - this.takeoffSpeed) / l;

    // m2x, m2y is the point closest to x2 among M2 and M2max

    const dP2M2 = (x2 - M2x) * (x2 - M2x) + (y2 - M2y) * (y2 - M2y);
    const dP2M2max = (x2 - M2maxx) * (x2 - M2maxx) + (y2 - M2maxy) * (y2 - M2maxy);

    console.log(dP2M2 > dP2M2max ? 'M2maxx' : 'M2x');
    const m2x = dP2M2 > dP2M2max ? M2maxx : M2x;
    const m2y = dP2M2 > dP2M2max ? M2maxy : M2y;

    return `
G0 ${this.gcodeXY(x1, y1)} Z${high}
G1 ${this.gcodeXY(m1x, m1y)} Z${low}
G1 ${this.gcodeXY(m2x, m2y)}
G1 ${this.gcodeXY(x2, y2)} Z${high}
`;
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
      gcode.push(this.gcodeGentleStroke(x, y, x+dx, y+dy, 5, 0));
    });
    return gcode.join('');
  }

    /*
  private testGcode(): string {
    const gcode: string[] = [];
    gcode.push(this.gcodeGentleStroke(0,-40,  1,-40, 5, 0));
    gcode.push(this.gcodeGentleStroke(0,-30,  2,-30, 5, 0));
    gcode.push(this.gcodeGentleStroke(0,-20,  3,-20, 5, 0));
    gcode.push(this.gcodeGentleStroke(0,-10,  5,-10, 5, 0));
    gcode.push(this.gcodeGentleStroke(0,  0, 10,  0, 5, 0));
    gcode.push(this.gcodeGentleStroke(0, 10, 20, 10, 5, 0));
    gcode.push(this.gcodeGentleStroke(0, 20, 30, 20, 5, 0));
    return gcode.join('');
  }
     */

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

G0 X43 Y80 Z0 ; Go to start point
`);

    gcode.push(this.fieldToGcode(w, h));
    //gcode.push(this.testGcode());

    gcode.push(`; reset to origin position
G0 X43 Y80 Z0
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
