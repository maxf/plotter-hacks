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

import Delaunator from 'delaunator';
import seedrandom from 'seedrandom';
import { SelectControl, NumberControl, CheckboxControl, SvgSaveControl, paramsFromUrl, updateUrl, $ } from './controls';

const assert = function(assertion: boolean) {
  if (!assertion) {
    console.warn("Assertion FALSE. Expect errors")
  }
};

const defaultParams: Params = {
  width: 800,
  height: 800,
  graphType: 'Polar',
  perturbation: 0,
  margin: 100,
  seed: 128,
  shape1: 0.3,
  shape2: 1.4,
  showGraph: false,
  nbNodes: 4,
  cells: 4,
  nbOrbits: 3,
  nbNodesPerOrbit: 10,
  palette: ['#522258', '#8C3061', '#C63C51', '#D95F59']
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

  asText(): string {
    return `Graph
    Nodes:

${this.nodes.map(node => node.asText()).join('\n')}

    Edges:

${this.edges.map(edge => edge.asText()).join('\n')}
    `
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

  // The actual knot as a list of bezier splines
  splines: Spline[];

  palette: string[];

  constructor(g: Graph, shape1: number, shape2: number, palette: string[]) {
    this.shape1 = shape1;
    this.shape2 = shape2;
    this.graph = g;
    this.splines = [];
    this.palette = palette;
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
    let nextEdgeDirection: any = this.nextUnprocessedEdgeDirection();
    let colourIndex = 0;

    while (nextEdgeDirection !== 0) {
      firstEdge = nextEdgeDirection.edge;
      firstDirection = nextEdgeDirection.direction;

      /* start a new loop */
      colourIndex++;
      s = new Spline(colourIndex, this.palette[colourIndex % this.palette.length]);
      this.splines.push(s);

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
      nextEdgeDirection = this.nextUnprocessedEdgeDirection();
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
    return `<circle cx="${this.x}" cy="${this.y}" r="10" fill="none" />`;
  }

  asText(): string {
    return `Node (${this.x}, ${this.y})`;
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
    return `<line x1="${this.node1.x}" y1="${this.node1.y}" x2="${this.node2.x}" y2="${this.node2.y}" fill="none" />`;
  }

  asText(): string {
    return `Edge (${this.node1.asText()}, ${this.node2.asText()} - cw: ${this.processedClockwise}, acw: ${this.processedAnticlockwise})`;
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

const makePolarGraph = (params: Params): Graph => {
  const xmin: number = params.margin;
  const ymin: number = params.margin;
  const width: number = params.width - 2*params.margin;
  const height: number = params.width - 2*params.margin;
  const nbp: number = params.nbNodesPerOrbit || 6;
  let nbo: number = params.nbOrbits || 3;
  const perturbation: number = params.perturbation;
  const seed = params.seed || "someseed";
  const rng: any = seedrandom(seed.toString());
  const g = new Graph();
  const cx: number = width / 2 + xmin; /* centre x */
  const cy: number = height / 2 + ymin; /* centre y */
  const grid: GraphNode[] = [];

  if (nbo === 1) {
    const os: number = (width < height ? width : height) / 2; /* orbit height */

    // special case. Just nodes around an orbit, no centre

    // Nodes
    for (let p = 0; p < nbp; p++) {
      const gridNode = new GraphNode(
        cx + os * Math.sin(p * 2*Math.PI / nbp) + perturbation * (rng()-0.5), 
        cy + os * Math.sin(p * 2*Math.PI / nbp) + perturbation * (rng()-0.5)
      )
      grid.push(gridNode);
      g.addNode(gridNode);
    }
    // edges
    for (let p = 0; p < nbp; p++) {
      /* link along orbit */
      g.addEdge(new GraphEdge(grid[p], grid[(p+1)%nbp]));
    }

    return g;
  }


  nbo = nbo - 1; // for all other cases, nbo should be the actual number of orbits
  const os: number = (width < height ? width : height) / (2 * nbo); /* orbit height */

  /* generate nodes */
  const firstNode: GraphNode = new GraphNode(cx, cy);
  g.addNode(firstNode);
  grid.push(firstNode);

  for (let o = 0; o < nbo; o++) {
    for (let p = 0; p < nbp; p++) {
      const gridNode = new GraphNode(
        cx + (o+1) * os * Math.sin(p * 2*Math.PI / nbp) + perturbation * (rng()-0.5),
        cy + (o+1) * os * Math.cos(p*2*Math.PI/nbp) + perturbation * (rng()-0.5)
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

const makeGridGraph = (params: Params): Graph => {
  const xmin: number = params.margin;
  const ymin: number = params.margin;
  const width: number = params.width;
  const height: number = params.height;
  const cells: number = params.cells || 5;
  const seed = params.seed || "someseed";
  const rng: any = seedrandom(seed.toString());
  const perturbation: number = params.perturbation;

  /* make a simple grid graph */

  const g = new Graph();
  let row: number, col: number;
  let x: number, y: number;

  const nbcol: number = cells;
  const nbrow: number = cells;
  const grid: GraphNode[] = [];

  const alpha = Math.min(width, height);
  const beta = Math.min(xmin, ymin)

  /* create node grid */
  for (row=0;row<nbrow;row++) {
    for (col=0;col<nbcol;col++) {
      x = xmin + row * (alpha - 2*beta) / (cells - 1);
      y = ymin + col * (alpha - 2*beta) / (cells - 1);

      if (perturbation !== 0) {
        x += perturbation * (rng()-0.5);
        y += perturbation * (rng()-0.5);
      }
      
      grid[row+col*nbrow]=new GraphNode(x, y);
      g.addNode(grid[row+col*nbrow]);
    }
  }

  /* create edges */
  for (row=0; row<nbrow; row++) {
    for (col=0; col<nbcol; col++) {
      if (col != nbcol-1)
        g.addEdge(new GraphEdge(grid[row+col*nbrow], grid[row+(col+1)*nbrow]));
      if (row!=nbrow-1)
        g.addEdge(new GraphEdge(grid[row+col*nbrow],grid[row+1+col*nbrow]));
      if (col!=nbcol-1 && row!=nbrow-1) {
        g.addEdge(new GraphEdge(grid[row+col*nbrow], grid[row+1+(col+1)*nbrow]));
        g.addEdge(new GraphEdge(grid[row+1+col*nbrow], grid[row+(col+1)*nbrow]));
      }
    }
  }
  return g;
}


/*---------------------------*/

const dist2 = (a: GraphNode, b: GraphNode): number => (b.x-a.x)*(b.x-a.x) + (b.y-a.y)*(b.y-a.y);

const randomNodes = (w: number, h: number, xmin: number, ymin: number, n: number, minDist: number, rand: any): GraphNode[] => {
  const result: GraphNode[] = [];
  const maxIterations = 100;
  for (let i=0; i<n; i++) {
    let iter = 0;
    do {
      const node = new GraphNode(rand()*w + xmin, rand()*h + ymin);
      const distances = result.map(r => dist2(r,node));
      if (Math.min(...distances) >= minDist*minDist) {
        result.push(node);
        break;
      }
    } while(iter++ < maxIterations);
  }
  return result;
};


/*---------------------------*/

const makeRandomGraph = (params: Params): Graph => {
  const xmin: number = params.margin;
  const ymin: number = params.margin;
  const width: number = params.width - 2*params.margin;
  const height: number = params.height - 2*params.margin;
  const nbNodes: number = params.nbNodes || 4;
  const seed = params.seed || "someseed";
  const rng: any = seedrandom(seed.toString());

  // Create a random graph
  const g = new Graph()

  const rNodes = randomNodes(width, height, xmin, ymin, nbNodes, 20, rng);
  const delaunayPoints: number[] = [];
  for (let node of rNodes) {
    delaunayPoints.push(node.x);
    delaunayPoints.push(node.y);
    g.addNode(node);
  }

  // 2. Generate a Delaunay triangulation
  const delaunay = new Delaunator(delaunayPoints);


  // delaunay.triangles is triples of indices: [0,1,2,   3,4,1   3,4,5,...   ]
  // we need to turn the triangles into a unique list of edges
  const edges: number[][] = []; // array of arrays of 2 indices
  const addToEdges = function(i1: number, i2: number) {
    for (let edge of edges) {
      if ((edge[0] == i1 && edge[1] == i2) || (edge[0] == i2 && edge[1] == i1)) {
        return;
      }
    }
    edges.push([i1, i2]);
  }
  for (let i=0; i<delaunay.triangles.length / 3; i++) {
    const te1 = delaunay.triangles[i*3];
    const te2 = delaunay.triangles[i*3+1];
    const te3 = delaunay.triangles[i*3+2];
    addToEdges(te1, te2);
    addToEdges(te2, te3);
    addToEdges(te3, te1);
  }

  // Add edges to our graph
  edges.forEach(([nodeIndex1, nodeIndex2]) => g.addEdge(new GraphEdge(g.nodes[nodeIndex1], g.nodes[nodeIndex2])));

  return g;
};




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

  asSvg(index: number): string {
    const bezier = `C ${this.x2},${this.y2} ${this.x3},${this.y3} ${this.x4},${this.y4}`;
    if (index === 0) {
      // This is the first bezier in the path, so start with an M
      return `M ${this.x1},${this.y1} ${bezier}`;
    } else {
      return bezier;
    }
  }
}


class Spline {
  segments: SplineSegment[];
  colour: string;
  layerNumber: number;

  constructor(layerNumber: number, colour: string) {
    this.segments = [];
    this.colour = colour;
    this.layerNumber = layerNumber;
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
    return `<path fill="none" stroke="${this.colour}" class="spline" d="${this.segments.map((s, i) => s.asSvg(i)).join(' ')}"/>`;
  }
}

/*======================================================================*/

type GraphType = 'Polar' | 'Grid' | 'Random';

type Params = {
  width: number,
  height: number,
  shape1: number,
  shape2: number,
  margin: number,

  graphType: GraphType,
  showGraph: boolean,
  palette: string[],

  perturbation: number,

  // for polar graph only
  nbOrbits?: number,
  nbNodesPerOrbit?: number

  // for grid graph only
  cells?: number,

  // for random graph only
  nbNodes?: number,
  seed?: number,
}

const renderCeltic = (params: Params): string => {
  params.graphType ||= 'Polar';
  params.width ||= 800;
  params.height ||= 800;
  params.margin ||= 50;
  params.cells ||= 10;
  params.nbNodesPerOrbit ||= 10;
  params.nbOrbits ||= 10;
  params.nbNodes ||= 20;
  params.seed ||= 3;
  params.perturbation ||= 0;  
  params.showGraph ||= false;
  params.palette = ['#522258', '#8C3061', '#C63C51', '#D95F59'];

  let graph: Graph;
  switch (params.graphType) {
  case 'Grid':
    graph = makeGridGraph(params);
    break;
  case 'Polar':
    graph = makePolarGraph(params);
    break;
  case 'Random':
    graph = makeRandomGraph(params);
  }

  const pattern = new Pattern(
    graph,
    params.shape1,
    params.shape2,
    params.palette
  );

  pattern.makeCurves();

  // generate SVG for pattern
  const renderedGraph = params.showGraph ? `
    <g id="graph" style="fill:none; stroke: #888">
      ${graph.asSvg()}
    </g>
  ` : '';

  return `
    <svg id="svg-canvas" height="${params.height}" width="${params.width}" xmlns="http://www.w3.org/2000/svg">
      ${renderedGraph}
      <g id="pattern" style="fill:none; stroke: red; stroke-width: 10">
        ${pattern.splines.map(spline => spline.asSvg()).join('\n')}
      </g>
    </svg>
  `;
};

const paramsFromWidgets = (controls: any) => {
  const params: Params = {...defaultParams};
  params.graphType = controls.graphType.val() as GraphType;
  params.margin = controls.margin.val() as number;
  params.shape1 = controls.shape1.val() as number;
  params.shape2 = controls.shape2.val() as number;
  params.showGraph = controls.showGraph.val() as boolean;
  params.seed = controls.seed.val() as number;
  params.nbNodes = controls.nbNodes.val() as number;
  params.cells = controls.cells.val() as number;
  params.perturbation = controls.perturbation.val() as number;
  params.nbOrbits = controls.nbOrbits.val() as number;
  params.nbNodesPerOrbit = controls.nbNodesPerOrbit.val() as number;

  return params;
};


const render = (params?: any) => {
  if (!params) {
    params = paramsFromWidgets(controls);
  }

  params.width ||= 800;
  params.height ||= 800;

  updateUrl(params);

  const graphType = $('graphType') as HTMLInputElement;
  activateControls(graphType.value as GraphType);

  $('canvas').innerHTML = renderCeltic(params);
};





const controls: any = {};

controls.margin = new NumberControl({
  name: 'margin',
  label: 'Margin',
  value: defaultParams['margin'],
  renderFn: render,
  min: 0,
  max: 500
});

controls.shape1 = new NumberControl({
  name: 'shape1',
  label: 'Shape1',
  value: defaultParams['shape1'],
  renderFn: render,
  min: -2,
  max: 2,
  step: 0.01
});

controls.shape2 = new NumberControl({
  name: 'shape2',
  label: 'Shape2',
  value: defaultParams['shape2'],
  renderFn: render,
  min: -2,
  max: 2,
  step: 0.01
});

controls.perturbation = new NumberControl({
  name: 'perturbation',
  label: 'Perturbation',
  value: defaultParams['perturbation'],
  renderFn: render,
  min: 0,
  max: 300
});

controls.showGraph = new CheckboxControl({
  name: 'showGraph',
  label: 'Graph',
  value: defaultParams['showGraph'],
  renderFn: render
});

controls.seed = new NumberControl({
  name: 'seed',
  label: 'seed',
  value: defaultParams['seed'],
  renderFn: render,
  min: 0,
  max: 500
});

controls.nbNodes = new NumberControl({
  name: 'nbNodes',
  label: 'Nodes',
  value: defaultParams['nbNodes'],
  renderFn: render,
  min: 3,
  max: 40
});

controls.cells = new NumberControl({
  name: 'cells',
  label: 'Cells',
  value: defaultParams['cells'],
  renderFn: render,
  min: 2,
  max: 100
});

controls.nbOrbits = new NumberControl({
  name: 'nbOrbits',
  label: 'Orbits',
  value: defaultParams['nbOrbits'],
  renderFn: render,
  min: 1,
  max: 20
});

controls.nbNodesPerOrbit = new NumberControl({
  name: 'nbNodesPerOrbit',
  label: 'Nodes per orbit',
  value: defaultParams['nbNodesPerOrbit'],
  renderFn: render,
  min: 1,
  max: 20
});

controls.svgSave = new SvgSaveControl({
  name: 'svgSave',
  canvasId: 'svg-canvas',
  label: "Save SVG",
  saveFilename: 'celtic.svg'
});

controls.graphType = new SelectControl({
  name:'graphType',
  label:'',
  value: defaultParams['graphType'],
  choices: ['Polar', 'Grid', 'Random'],
  renderFn: function()  {
    document.querySelectorAll('.control').forEach((c: any) => c.hide());
    paramsPerType[(this.val() as GraphType)].forEach(name => controls[name].show());
    render();
  }
});

type ControlKeys = keyof typeof controls;


const paramsPerType: Record<GraphType, ControlKeys[]>  = {
  Random: ['seed', 'graphType', 'margin', 'showGraph', 'shape1', 'shape2', 'nbNodes', 'svgSave'],
  Grid: ['seed', 'graphType', 'margin', 'showGraph', 'shape1', 'shape2', 'cells', 'perturbation', 'svgSave'],
  Polar: ['seed', 'graphType', 'margin', 'showGraph', 'shape1', 'shape2', 'nbOrbits', 'nbNodesPerOrbit', 'perturbation', 'svgSave']
};

const activateControls = (graphType: GraphType) => {
  Object.values(controls).forEach((c: any) => c.hide());
  paramsPerType[graphType].forEach(name => controls[name].show());
};


// =========== First render =============

// Fetch plot parameters from the query string
const params = paramsFromUrl(defaultParams);

// populate the form controls from controls.params
activateControls(params.graphType as GraphType);
Object.keys(params).forEach(key => {
  if (key in controls) {
    const index: keyof typeof params = key;
    const paramValue: any = params[index];
    controls[key as keyof typeof controls].set(paramValue);
  }
});

$('canvas').innerHTML = renderCeltic(params);
