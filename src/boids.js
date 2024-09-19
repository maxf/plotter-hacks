"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
Object.defineProperty(exports, "__esModule", { value: true });
// copied from https://github.com/hughsk/boids/blob/master/index.js
var seedrandom_1 = require("seedrandom");
var controls_1 = require("./controls");
var defaultParams = {
    width: 800,
    height: 800,
    margin: 100,
    seed: 128,
    iterations: 10,
    startIteration: 0,
    nboids: 10,
    speedLimit: 30,
    cohesionForce: 0.5,
    cohesionDistance: 180,
    accelerationLimitRoot: 1,
    separationDistance: 60,
    separationForce: 0.15,
    alignmentForce: 0.25,
    alignmentDistance: 180,
    accelerationLimit: 1,
    attractors: []
};
// Indices for boid array
var POSITIONX = 0;
var POSITIONY = 1;
var SPEEDX = 2;
var SPEEDY = 3;
var ACCELERATIONX = 4;
var ACCELERATIONY = 5;
var Boids = /** @class */ (function () {
    function Boids(opts) {
        opts = opts || {};
        this.rng = (0, seedrandom_1.default)(opts.seed.toString()) || Math.random;
        this.width = opts.width;
        this.height = opts.height;
        this.speedLimitRoot = opts.speedLimit || 0;
        this.accelerationLimitRoot = opts.accelerationLimit || 1;
        this.speedLimit = Math.pow(this.speedLimitRoot, 2);
        this.accelerationLimit = Math.pow(this.accelerationLimitRoot, 2);
        this.separationDistance = Math.pow(opts.separationDistance || 60, 2);
        this.alignmentDistance = Math.pow(opts.alignmentDistance || 180, 2);
        this.cohesionDistance = Math.pow(opts.cohesionDistance || 180, 2);
        this.separationForce = opts.separationForce || 0.15;
        this.cohesionForce = opts.cohesionForce || 0.5;
        this.alignmentForce = opts.alignmentForce || 0.25;
        this.attractors = opts.attractors || [];
        this.iterations = opts.iterations || 100;
        this.startIteration = opts.startIteration || 0;
        this.nboids = opts.nboids || 10;
        this.boids = [];
        for (var i = 0, l = opts.nboids; i < l; i += 1) {
            this.boids[i] = [
                (this.rng() - 0.5) * this.width / 10 + this.width / 2,
                (this.rng() - 0.5) * this.height / 10 + this.height / 2, // position
                0, 0, // speed
                0, 0 // acceleration
            ];
        }
    }
    Boids.prototype.tick = function () {
        var boids = this.boids, sepDist = this.separationDistance, sepForce = this.separationForce, cohDist = this.cohesionDistance, cohForce = this.cohesionForce, aliDist = this.alignmentDistance, aliForce = this.alignmentForce, speedLimit = this.speedLimit, accelerationLimit = this.accelerationLimit, accelerationLimitRoot = this.accelerationLimitRoot, speedLimitRoot = this.speedLimitRoot, size = boids.length, current = size, sforceX, sforceY, cforceX, cforceY, aforceX, aforceY, spareX, spareY, attractors = this.attractors, attractorCount = attractors.length, attractor, distSquared, currPos, length, target, ratio;
        while (current--) {
            sforceX = 0;
            sforceY = 0;
            cforceX = 0;
            cforceY = 0;
            aforceX = 0;
            aforceY = 0;
            currPos = boids[current];
            // Attractors
            target = attractorCount;
            while (target--) {
                attractor = attractors[target];
                spareX = currPos[0] - attractor[0];
                spareY = currPos[1] - attractor[1];
                distSquared = spareX * spareX + spareY * spareY;
                if (distSquared < attractor[2] * attractor[2]) {
                    length = hypot(spareX, spareY);
                    boids[current][SPEEDX] -= (attractor[3] * spareX / length) || 0;
                    boids[current][SPEEDY] -= (attractor[3] * spareY / length) || 0;
                }
            }
            target = size;
            while (target--) {
                if (target === current)
                    continue;
                spareX = currPos[0] - boids[target][0];
                spareY = currPos[1] - boids[target][1];
                distSquared = spareX * spareX + spareY * spareY;
                if (distSquared < sepDist) {
                    sforceX += spareX;
                    sforceY += spareY;
                }
                else {
                    if (distSquared < cohDist) {
                        cforceX += spareX;
                        cforceY += spareY;
                    }
                    if (distSquared < aliDist) {
                        aforceX += boids[target][SPEEDX];
                        aforceY += boids[target][SPEEDY];
                    }
                }
            }
            // Separation
            length = hypot(sforceX, sforceY);
            boids[current][ACCELERATIONX] += (sepForce * sforceX / length) || 0;
            boids[current][ACCELERATIONY] += (sepForce * sforceY / length) || 0;
            // Cohesion
            length = hypot(cforceX, cforceY);
            boids[current][ACCELERATIONX] -= (cohForce * cforceX / length) || 0;
            boids[current][ACCELERATIONY] -= (cohForce * cforceY / length) || 0;
            // Alignment
            length = hypot(aforceX, aforceY);
            boids[current][ACCELERATIONX] -= (aliForce * aforceX / length) || 0;
            boids[current][ACCELERATIONY] -= (aliForce * aforceY / length) || 0;
        }
        current = size;
        // Apply speed/acceleration for
        // this tick
        while (current--) {
            if (accelerationLimit) {
                distSquared = boids[current][ACCELERATIONX] * boids[current][ACCELERATIONX] + boids[current][ACCELERATIONY] * boids[current][ACCELERATIONY];
                if (distSquared > accelerationLimit) {
                    ratio = accelerationLimitRoot / hypot(boids[current][ACCELERATIONX], boids[current][ACCELERATIONY]);
                    boids[current][ACCELERATIONX] *= ratio;
                    boids[current][ACCELERATIONY] *= ratio;
                }
            }
            boids[current][SPEEDX] += boids[current][ACCELERATIONX];
            boids[current][SPEEDY] += boids[current][ACCELERATIONY];
            if (speedLimit) {
                distSquared = boids[current][SPEEDX] * boids[current][SPEEDX] + boids[current][SPEEDY] * boids[current][SPEEDY];
                if (distSquared > speedLimit) {
                    ratio = speedLimitRoot / hypot(boids[current][SPEEDX], boids[current][SPEEDY]);
                    boids[current][SPEEDX] *= ratio;
                    boids[current][SPEEDY] *= ratio;
                }
            }
            boids[current][POSITIONX] += boids[current][SPEEDX];
            boids[current][POSITIONY] += boids[current][SPEEDY];
        }
    };
    return Boids;
}());
// double-dog-leg hypothenuse approximation
// http://forums.parallax.com/discussion/147522/dog-leg-hypotenuse-approximation
function hypot(a, b) {
    a = Math.abs(a);
    b = Math.abs(b);
    var lo = Math.min(a, b);
    var hi = Math.max(a, b);
    return hi + 3 * lo / 32 + Math.max(0, 2 * lo - hi) / 8 + Math.max(0, 4 * lo - hi) / 16;
}
var renderBoids = function (params) {
    var b = new Boids(params);
    var boids = b.boids;
    for (var iteration = 0; iteration < b.startIteration; iteration++) {
        b.tick();
    }
    var boidPaths = [];
    for (var i = 0; i < boids.length; i++) {
        //boidPaths[i] = [`M${boids[i][POSITIONX]} ${boids[i][POSITIONY]}`];
        boidPaths[i] = [{
                x: boids[i][POSITIONX],
                y: boids[i][POSITIONY]
            }];
    }
    for (var iteration = b.startIteration; iteration < b.startIteration + b.iterations; iteration++) {
        b.tick();
        for (var i = 0; i < boids.length; i++) {
            // add the half point
            var lastPos = boidPaths[i][boidPaths[i].length - 1];
            boidPaths[i].push({
                x: (boids[i][POSITIONX] + lastPos.x) / 2,
                y: (boids[i][POSITIONY] + lastPos.y) / 2
            });
            // add the new point
            boidPaths[i].push({ x: boids[i][POSITIONX], y: boids[i][POSITIONY] });
        }
    }
    var svgPaths = boidPaths.map(function (ps) {
        var d = "M ".concat(ps[0].x, " ").concat(ps[0].y, " L ").concat(ps[1].x, " ").concat(ps[1].y);
        for (var i = 2; i < ps.length - 1; i += 2) {
            d = d + "C ".concat(ps[i].x, " ").concat(ps[i].y, ", ").concat(ps[i].x, " ").concat(ps[i].y, ", ").concat(ps[i + 1].x, " ").concat(ps[i + 1].y, " ");
        }
        return "<path d=\"".concat(d, "\"/>\n");
    });
    return "\n    <svg id=\"svg-canvas\" height=\"".concat(params.height, "\" width=\"").concat(params.width, "\" xmlns=\"http://www.w3.org/2000/svg\">\n      <rect\n        x=\"").concat(params.margin, "\"\n        y=\"").concat(params.margin, "\"\n        width=\"").concat(params.width - 2 * params.margin, "\"\n        height=\"").concat(params.width - 2 * params.margin, "\"\n        style=\"fill:none; stroke: black\"/>\n      <g id=\"pattern\" style=\"fill:none; stroke: red\">\n        ").concat(svgPaths.join(''), "\n      </g>\n    </svg>\n  ");
};
var paramsFromWidgets = function () {
    var params = __assign({}, defaultParams);
    params.margin = controls.margin.val();
    params.seed = controls.seed.val();
    params.nboids = controls.nboids.val();
    params.speedLimit = controls.speedLimit.val();
    params.cohesionForce = controls.cohesionForce.val();
    params.cohesionDistance = controls.cohesionDistance.val();
    params.iterations = controls.iterations.val();
    params.startIteration = controls.startIteration.val();
    return params;
};
var render = function (params) {
    if (!params) {
        params = paramsFromWidgets();
    }
    params.width || (params.width = 800);
    params.height || (params.height = 800);
    (0, controls_1.updateUrl)(params);
    return renderBoids(params);
};
var controls = {
    margin: new controls_1.NumberControl({ name: 'margin', label: 'Margin', value: defaultParams['margin'], renderFn: render, min: 0, max: 500 }),
    seed: new controls_1.NumberControl({ name: 'seed', label: 'RNG seed', value: defaultParams['seed'], renderFn: render, min: 0, max: 500 }),
    cohesionForce: new controls_1.NumberControl({ name: 'cohesionForce', label: 'Cohesion', value: defaultParams['cohesionForce'], renderFn: render, min: 0, max: 1, step: 0.01 }),
    cohesionDistance: new controls_1.NumberControl({ name: 'cohesionDistance', label: 'Cohesion distance', value: defaultParams['cohesionDistance'], renderFn: render, min: 10, max: 300 }),
    iterations: new controls_1.NumberControl({ name: 'iterations', label: 'Iterations', value: defaultParams['iterations'], renderFn: render, min: 1, max: 100 }),
    startIteration: new controls_1.NumberControl({ name: 'startIteration', label: 'Start iteration', value: defaultParams['startIteration'], renderFn: render, min: 1, max: 1000 }),
    speedLimit: new controls_1.NumberControl({ name: 'speedLimit', label: 'Max speed', value: defaultParams['speedLimit'], renderFn: render, min: 0, max: 30, step: 0.01 }),
    nboids: new controls_1.NumberControl({ name: 'nboids', label: 'Boids', value: defaultParams['nboids'], renderFn: render, min: 1, max: 100 })
};
// =========== First render =============
// Fetch plot parameters from the query string
var params = (0, controls_1.paramsFromUrl)(defaultParams);
// populate the form controls from controls.params
Object.keys(params).forEach(function (key) {
    if (key in controls) {
        controls[key].set(params[key]);
    }
});
(0, controls_1.$)('canvas').innerHTML = render(params);
