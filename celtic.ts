/* celtic, Copyright (c) 2006 Max Froumentin <max@lapin-bleu.net>
 *
 * Permission to use, copy, modify, distribute, and sell this software and its
 * documentation for any purpose is hereby granted without fee, provided that
 * the above copyright notice appear in all copies and that both that
 * copyright notice and this permission notice appear in supporting
 * documentation.  No representations are made about the suitability of this
 * software for any purpose.  It is provided "as is" without express or
 * implied warranty.
 *
 * A celtic pattern programme inspired by "Les Entrelacs Celtes", by
 * Christian Mercat, Dossier Pour La Science, no. 47, april/june 2005.
 * See <http://www.entrelacs.net/>
 */


const random = () => Math.floor(Math.random()*65535); // CHECK with shape1 and shape2

const assert = function(assertion: boolean) {
  if (!assertion) {
    console.log("Assertion FALSE. Expect errors")
  }
};

/*-----------------------------------------*/

type angle = number;

/*-----------------------------------------*/

enum Direction {
  Clockwise = 0,
  Anticlockwise = 1
}

/*-----------------------------------------*/

class Graph {
  nodes: GraphNode[];
  edges: GraphEdge[];

  constructor() {
    this.nodes = [];
    this.edges = [];
  }

  addNode(n: GraphNode) {
    this.nodes.push(n);
  }

  addEdge(e: GraphEdge) {
    this.edges.push(e);
    e.node1.addEdge(e);
    e.node2.addEdge(e);
  }

  nextEdgeAround(n: GraphNode, e: GraphEdge, direction: Direction): GraphEdge {
    /* return the next edge after e around node n clockwise or anti */
    let minAngle: angle = 20;
    let nextEdge: GraphEdge = e;

    for (let i=0; i<n.edges.length; i++) {
      const edge=n.edges[i];
      if (edge != e) {
        const angle = e.angleTo(edge, n, direction);
        if (angle < minAngle) {
          nextEdge = edge;
          minAngle = angle;
        }
      }
    }
    return nextEdge;
  }

  asSvg(): string {
    const s: string[] = [];
    this.nodes.forEach(node => s.push(node.asSvg()));
    this.edges.forEach(edge => s.push(edge.asSvg()));
    return s.join('\n');
  }
}


/* ====================================== */
// A pattern is a whole celtic pattern, including drawing parameters of the pattern,
// a graph of nodes and edges from which the celtic know is drawn
// a list of Splines which form the celtic know

class Pattern {
  // parameters setting how "stretched" splines are. They dictate how far are
  //  the middle control points of the cubic Bezier splines are from the first
  //  and last points
  shape1: number;
  shape2: number;

  // The graph (nodes and edges) on which the knot is drawn
  graph: Graph;

  // The actual node as a list of bezier splines
  splines: Spline[];

  constructor(g: Graph, shape1: number, shape2: number) {
    this.shape1 = shape1;
    this.shape2 = shape2;
    this.graph = g;
    this.splines = [];
  }

  drawSplineDirection(s: Spline, node: GraphNode, edge1: GraphEdge, edge2: GraphEdge, direction: Direction) {
    const x1: number = (edge1.node1.x + edge1.node2.x) / 2.0;
    const y1: number = (edge1.node1.y + edge1.node2.y) / 2.0;

    /* P2 (x2,y2) is the middle point of edge1 */
    const x4: number = (edge2.node1.x + edge2.node2.x) / 2.0;
    const y4: number = (edge2.node1.y + edge2.node2.y) / 2.0;

    const alpha: number = edge1.angleTo(edge2, node, direction) * this.shape1;
    const beta: number = this.shape2;

    let i1x,i1y,i2x,i2y,x2,y2,x3,y3;

    if (direction == Direction.Anticlockwise) {
      /* I1 must stick out to the left of NP1 and I2 to the right of NP4 */
      i1x =  alpha*(node.y-y1)+x1;
      i1y = -alpha*(node.x-x1)+y1;
      i2x = -alpha*(node.y-y4)+x4;
      i2y =  alpha*(node.x-x4)+y4;
      x2 =  beta*(y1-i1y) + i1x;
      y2 = -beta*(x1-i1x) + i1y;
      x3 = -beta*(y4-i2y) + i2x;
      y3 =  beta*(x4-i2x) + i2y;
    } else {
      /* I1 must stick out to the left of NP1 and I2 to the right of NP4 */
      i1x = -alpha*(node.y-y1)+x1;
      i1y =  alpha*(node.x-x1)+y1;
      i2x =  alpha*(node.y-y4)+x4;
      i2y = -alpha*(node.x-x4)+y4;
      x2 = -beta*(y1-i1y) + i1x;
      y2 =  beta*(x1-i1x) + i1y;
      x3 =  beta*(y4-i2y) + i2x;
      y3 = -beta*(x4-i2x) + i2y;
    }
    s.addSegment(x1,y1,x2,y2,x3,y3,x4,y4);
  }

  nextUnprocessedEdgeDirection() {
    // Check all edges of our graph and if we find an unprocessed one, return it
    for (let edge of this.graph.edges) {
      if (!edge.processedClockwise) {
        return { edge, direction: Direction.Clockwise }
      }
      if (!edge.processedAnticlockwise) {
        return { edge, direction: Direction.Anticlockwise }
      }
    }
    return 0;
  }

  makeCurves() {
    let currentEdge: GraphEdge, firstEdge: GraphEdge, nextEdge: GraphEdge;
    let currentNode: GraphNode, firstNode: GraphNode;
    let currentDirection: Direction, firstDirection: Direction;
    let s: Spline;
    let nextEdgeDirection: any;

    while (nextEdgeDirection = this.nextUnprocessedEdgeDirection()) {
      firstEdge = nextEdgeDirection.edge;
      firstDirection = nextEdgeDirection.direction;

      /* start a new loop */
      s = new Spline();
      this.splines.push(new Spline());

      currentEdge = firstEdge;
      currentNode = firstNode = currentEdge.node1;
      currentDirection = firstDirection;

      do {
        if (currentDirection == Direction.Clockwise) {
          currentEdge.processedClockwise = true;
        } else {
          currentEdge.processedAnticlockwise = true;
        }
        nextEdge = this.graph.nextEdgeAround(currentNode, currentEdge, currentDirection);

        /* add the spline segment to the spline */
        this.drawSplineDirection(s, currentNode, currentEdge, nextEdge, currentDirection);

        /* cross the edge */
        currentEdge = nextEdge;
        currentNode = nextEdge.otherNode(currentNode);
        currentDirection = 1 - currentDirection;

      } while (currentNode !== firstNode || currentEdge !== firstEdge || currentDirection !== firstDirection);

      if (s.segments.length==2) { /* spline is just one point: remove it */
        this.splines.pop()
      }
    }
  }
}




/*-----------------------------------------*/


class GraphNode {
  x: number;
  y: number;
  edges: GraphEdge[]; // edges that contain this node

  constructor(x: number, y: number) {
    this.x = x;
    this.y = y;
    this.edges = [];
  }

  asSvg(): string {
    return `<circle cx="${this.x}" cy="${this.y}" r="10" stroke="black" fill="none" />`;
  }

  addEdge(e: GraphEdge) {
    this.edges.push(e)
  }
}

class GraphEdge {
  node1: GraphNode;
  node2: GraphNode;
  #angle1: angle;
  #angle2: angle;
  processedClockwise: boolean;
  processedAnticlockwise: boolean;

  constructor(n1: GraphNode, n2: GraphNode) {
    this.node1 = n1;
    this.node2 = n2;
    this.#angle1 = Math.atan2(n2.y - n1.y, n2.x - n1.x);
    if (this.#angle1 < 0) this.#angle1 += 2*Math.PI;
    this.#angle2 = Math.atan2(n1.y - n2.y, n1.x - n2.x);
    if (this.#angle2 < 0) this.#angle2 += 2*Math.PI;
    this.processedClockwise = false;
    this.processedAnticlockwise = false;
  }

  asSvg(): string {
    return `<line x1="${this.node1.x}" y1="${this.node1.y}" x2="${this.node2.x}" y2="${this.node2.y}" stroke="black" fill="none" />`;
  }

  angle(n: GraphNode): angle {
    /* returns the angle of the edge at Node n */
    assert(n==this.node1 || n==this.node2);
    return n==this.node1 ? this.#angle1 : this.#angle2;
  }

  otherNode(n: GraphNode): GraphNode {
    /* returns this edge's node which is not the one passed */
    assert(n==this.node1 || n==this.node2);
    return n==this.node1 ? this.node2 : this.node1;
  }

  angleTo(e2: GraphEdge, node: GraphNode, direction: Direction): angle {
    /* returns the absolute angle from this edge to edge e2 around
    node following direction */

    const a = direction==Direction.Clockwise ? this.angle(node) - e2.angle(node) : e2.angle(node) - this.angle(node)
    return a < 0 ? a + 2*Math.PI : a;
  }
}

/*-----------------------------------------*/

const makePolarGraph = (
  xmin: number,
  ymin: number,
  width: number,
  height: number,
  nbp: number,  /* number of points on each orbit */
  nbo: number /* number of orbits */
): Graph => {
  const g = new Graph()

  const cx: number = width / 2 + xmin; /* centre x */
  const cy: number = height / 2 + ymin; /* centre y */
  const os: number = (width < height ? width : height) / (2 * nbo); /* orbit height */
  const grid: GraphNode[] = [];

  /* generate nodes */
  const firstNode: GraphNode = new GraphNode(cx, cy);
  g.addNode(firstNode);
  grid.push(firstNode);

  for (let o = 0; o < nbo; o++) {
    for (let p = 0; p < nbp; p++) {
      const gridNode = new GraphNode(
        cx + (o+1) * os * Math.sin(p * 2*Math.PI / nbp),
        cy + (o+1) * os * Math.cos(p*2*Math.PI/nbp)
      );
      grid.push(gridNode);
      g.addNode(gridNode);
    }
  }

  /* generate edges */
  for (let o = 0; o < nbo; o++) {
    for (let p = 0; p < nbp; p++) {
      if (o == 0) { /* link first orbit nodes with centre */
        g.addEdge(new GraphEdge(grid[1+o*nbp+p], grid[0]));
      } else { /* liink orbit nodes with lower orbit */
        g.addEdge(new GraphEdge(grid[1+o*nbp+p], grid[1+(o-1)*nbp+p]));
      }
      /* link along orbit */
      g.addEdge(new GraphEdge(grid[1+o*nbp+p], grid[1+o*nbp+(p+1)%nbp]));
    }
  }
  return g;
}


/*---------------------------*/

// Cubic Bezier spline segment
class SplineSegment {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  x3: number;
  y3: number;
  x4: number;
  y4: number;

  constructor(
    x1: number,
    y1: number,
    x2: number,
    y2: number,
    x3: number,
    y3: number,
    x4: number,
    y4: number
  ) {
    this.x1 = x1;
    this.y1 = y1;
    this.x2 = x2;
    this.y2 = y2;
    this.x3 = x3;
    this.y3 = y3;
    this.x4 = x4;
    this.y4 = y4;
  }

  asSvg(): string {
    return `<path class="spline-segment" d="M ${this.x1},${this.y1} C ${this.x2},${this.y2} ${this.x3},${this.y3} ${this.x4},${this.y4}"/>`;
  }
}


class Spline {
  segments: SplineSegment[];

  constructor() {
    this.segments = []
  }

  addSegment(
    x1: number,
    y1: number,
    x2: number,
    y2: number,
    x3: number,
    y3: number,
    x4: number,
    y4: number
  ): void {
    this.segments.push(new SplineSegment(x1, y1, x2, y2, x3, y3, x4, y4))
  }

  asSvg(): string {
    return `<g class="spline">${this.segments.map(s => s.asSvg()).join('')}</g>`;
  }

}

/*======================================================================*/

const WIDTH=800;
const HEIGHT=800;


const celticDraw = () => {
  const shape1: number = (15+random()%15)/10.0 -1.0;
  const shape2: number = (15+random()%15)/10.0 -1.0;
  const margin: number = 50;
  const nbOrbits: number = 2+random()%10;
  const nbNodesPerOrbit: number = 4+random()%10;

  const graph: Graph = makePolarGraph(
    margin,
    margin,
    WIDTH-2*margin,
    HEIGHT-2*margin,
    nbNodesPerOrbit,
    nbOrbits
  );

  const pattern = new Pattern(graph, shape1, shape2);

  pattern.makeCurves();

  // generate SVG for pattern
  console.log(`
    <svg height="${HEIGHT}" width="${WIDTH}" xmlns="http://www.w3.org/2000/svg">
      <g id="graph" style="fill:none; stroke: #888">
        ${graph.asSvg()}
      </g>
      <g id="pattern" style="fill:none; stroke: red">
        ${pattern.splines.map(spline => spline.asSvg()).join('')}
      </g>
    </svg>
  `);
};


celticDraw();
