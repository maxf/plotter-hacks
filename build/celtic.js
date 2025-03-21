var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __commonJS = (cb, mod) => function __require() {
  return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// node_modules/seedrandom/lib/alea.js
var require_alea = __commonJS({
  "node_modules/seedrandom/lib/alea.js"(exports, module) {
    (function(global, module2, define2) {
      function Alea(seed) {
        var me = this, mash = Mash();
        me.next = function() {
          var t = 2091639 * me.s0 + me.c * 23283064365386963e-26;
          me.s0 = me.s1;
          me.s1 = me.s2;
          return me.s2 = t - (me.c = t | 0);
        };
        me.c = 1;
        me.s0 = mash(" ");
        me.s1 = mash(" ");
        me.s2 = mash(" ");
        me.s0 -= mash(seed);
        if (me.s0 < 0) {
          me.s0 += 1;
        }
        me.s1 -= mash(seed);
        if (me.s1 < 0) {
          me.s1 += 1;
        }
        me.s2 -= mash(seed);
        if (me.s2 < 0) {
          me.s2 += 1;
        }
        mash = null;
      }
      function copy(f, t) {
        t.c = f.c;
        t.s0 = f.s0;
        t.s1 = f.s1;
        t.s2 = f.s2;
        return t;
      }
      function impl(seed, opts) {
        var xg = new Alea(seed), state = opts && opts.state, prng = xg.next;
        prng.int32 = function() {
          return xg.next() * 4294967296 | 0;
        };
        prng.double = function() {
          return prng() + (prng() * 2097152 | 0) * 11102230246251565e-32;
        };
        prng.quick = prng;
        if (state) {
          if (typeof state == "object") copy(state, xg);
          prng.state = function() {
            return copy(xg, {});
          };
        }
        return prng;
      }
      function Mash() {
        var n = 4022871197;
        var mash = function(data) {
          data = String(data);
          for (var i = 0; i < data.length; i++) {
            n += data.charCodeAt(i);
            var h = 0.02519603282416938 * n;
            n = h >>> 0;
            h -= n;
            h *= n;
            n = h >>> 0;
            h -= n;
            n += h * 4294967296;
          }
          return (n >>> 0) * 23283064365386963e-26;
        };
        return mash;
      }
      if (module2 && module2.exports) {
        module2.exports = impl;
      } else if (define2 && define2.amd) {
        define2(function() {
          return impl;
        });
      } else {
        this.alea = impl;
      }
    })(
      exports,
      typeof module == "object" && module,
      // present in node.js
      typeof define == "function" && define
      // present with an AMD loader
    );
  }
});

// node_modules/seedrandom/lib/xor128.js
var require_xor128 = __commonJS({
  "node_modules/seedrandom/lib/xor128.js"(exports, module) {
    (function(global, module2, define2) {
      function XorGen(seed) {
        var me = this, strseed = "";
        me.x = 0;
        me.y = 0;
        me.z = 0;
        me.w = 0;
        me.next = function() {
          var t = me.x ^ me.x << 11;
          me.x = me.y;
          me.y = me.z;
          me.z = me.w;
          return me.w ^= me.w >>> 19 ^ t ^ t >>> 8;
        };
        if (seed === (seed | 0)) {
          me.x = seed;
        } else {
          strseed += seed;
        }
        for (var k = 0; k < strseed.length + 64; k++) {
          me.x ^= strseed.charCodeAt(k) | 0;
          me.next();
        }
      }
      function copy(f, t) {
        t.x = f.x;
        t.y = f.y;
        t.z = f.z;
        t.w = f.w;
        return t;
      }
      function impl(seed, opts) {
        var xg = new XorGen(seed), state = opts && opts.state, prng = function() {
          return (xg.next() >>> 0) / 4294967296;
        };
        prng.double = function() {
          do {
            var top = xg.next() >>> 11, bot = (xg.next() >>> 0) / 4294967296, result = (top + bot) / (1 << 21);
          } while (result === 0);
          return result;
        };
        prng.int32 = xg.next;
        prng.quick = prng;
        if (state) {
          if (typeof state == "object") copy(state, xg);
          prng.state = function() {
            return copy(xg, {});
          };
        }
        return prng;
      }
      if (module2 && module2.exports) {
        module2.exports = impl;
      } else if (define2 && define2.amd) {
        define2(function() {
          return impl;
        });
      } else {
        this.xor128 = impl;
      }
    })(
      exports,
      typeof module == "object" && module,
      // present in node.js
      typeof define == "function" && define
      // present with an AMD loader
    );
  }
});

// node_modules/seedrandom/lib/xorwow.js
var require_xorwow = __commonJS({
  "node_modules/seedrandom/lib/xorwow.js"(exports, module) {
    (function(global, module2, define2) {
      function XorGen(seed) {
        var me = this, strseed = "";
        me.next = function() {
          var t = me.x ^ me.x >>> 2;
          me.x = me.y;
          me.y = me.z;
          me.z = me.w;
          me.w = me.v;
          return (me.d = me.d + 362437 | 0) + (me.v = me.v ^ me.v << 4 ^ (t ^ t << 1)) | 0;
        };
        me.x = 0;
        me.y = 0;
        me.z = 0;
        me.w = 0;
        me.v = 0;
        if (seed === (seed | 0)) {
          me.x = seed;
        } else {
          strseed += seed;
        }
        for (var k = 0; k < strseed.length + 64; k++) {
          me.x ^= strseed.charCodeAt(k) | 0;
          if (k == strseed.length) {
            me.d = me.x << 10 ^ me.x >>> 4;
          }
          me.next();
        }
      }
      function copy(f, t) {
        t.x = f.x;
        t.y = f.y;
        t.z = f.z;
        t.w = f.w;
        t.v = f.v;
        t.d = f.d;
        return t;
      }
      function impl(seed, opts) {
        var xg = new XorGen(seed), state = opts && opts.state, prng = function() {
          return (xg.next() >>> 0) / 4294967296;
        };
        prng.double = function() {
          do {
            var top = xg.next() >>> 11, bot = (xg.next() >>> 0) / 4294967296, result = (top + bot) / (1 << 21);
          } while (result === 0);
          return result;
        };
        prng.int32 = xg.next;
        prng.quick = prng;
        if (state) {
          if (typeof state == "object") copy(state, xg);
          prng.state = function() {
            return copy(xg, {});
          };
        }
        return prng;
      }
      if (module2 && module2.exports) {
        module2.exports = impl;
      } else if (define2 && define2.amd) {
        define2(function() {
          return impl;
        });
      } else {
        this.xorwow = impl;
      }
    })(
      exports,
      typeof module == "object" && module,
      // present in node.js
      typeof define == "function" && define
      // present with an AMD loader
    );
  }
});

// node_modules/seedrandom/lib/xorshift7.js
var require_xorshift7 = __commonJS({
  "node_modules/seedrandom/lib/xorshift7.js"(exports, module) {
    (function(global, module2, define2) {
      function XorGen(seed) {
        var me = this;
        me.next = function() {
          var X = me.x, i = me.i, t, v2, w;
          t = X[i];
          t ^= t >>> 7;
          v2 = t ^ t << 24;
          t = X[i + 1 & 7];
          v2 ^= t ^ t >>> 10;
          t = X[i + 3 & 7];
          v2 ^= t ^ t >>> 3;
          t = X[i + 4 & 7];
          v2 ^= t ^ t << 7;
          t = X[i + 7 & 7];
          t = t ^ t << 13;
          v2 ^= t ^ t << 9;
          X[i] = v2;
          me.i = i + 1 & 7;
          return v2;
        };
        function init(me2, seed2) {
          var j, w, X = [];
          if (seed2 === (seed2 | 0)) {
            w = X[0] = seed2;
          } else {
            seed2 = "" + seed2;
            for (j = 0; j < seed2.length; ++j) {
              X[j & 7] = X[j & 7] << 15 ^ seed2.charCodeAt(j) + X[j + 1 & 7] << 13;
            }
          }
          while (X.length < 8) X.push(0);
          for (j = 0; j < 8 && X[j] === 0; ++j) ;
          if (j == 8) w = X[7] = -1;
          else w = X[j];
          me2.x = X;
          me2.i = 0;
          for (j = 256; j > 0; --j) {
            me2.next();
          }
        }
        init(me, seed);
      }
      function copy(f, t) {
        t.x = f.x.slice();
        t.i = f.i;
        return t;
      }
      function impl(seed, opts) {
        if (seed == null) seed = +/* @__PURE__ */ new Date();
        var xg = new XorGen(seed), state = opts && opts.state, prng = function() {
          return (xg.next() >>> 0) / 4294967296;
        };
        prng.double = function() {
          do {
            var top = xg.next() >>> 11, bot = (xg.next() >>> 0) / 4294967296, result = (top + bot) / (1 << 21);
          } while (result === 0);
          return result;
        };
        prng.int32 = xg.next;
        prng.quick = prng;
        if (state) {
          if (state.x) copy(state, xg);
          prng.state = function() {
            return copy(xg, {});
          };
        }
        return prng;
      }
      if (module2 && module2.exports) {
        module2.exports = impl;
      } else if (define2 && define2.amd) {
        define2(function() {
          return impl;
        });
      } else {
        this.xorshift7 = impl;
      }
    })(
      exports,
      typeof module == "object" && module,
      // present in node.js
      typeof define == "function" && define
      // present with an AMD loader
    );
  }
});

// node_modules/seedrandom/lib/xor4096.js
var require_xor4096 = __commonJS({
  "node_modules/seedrandom/lib/xor4096.js"(exports, module) {
    (function(global, module2, define2) {
      function XorGen(seed) {
        var me = this;
        me.next = function() {
          var w = me.w, X = me.X, i = me.i, t, v2;
          me.w = w = w + 1640531527 | 0;
          v2 = X[i + 34 & 127];
          t = X[i = i + 1 & 127];
          v2 ^= v2 << 13;
          t ^= t << 17;
          v2 ^= v2 >>> 15;
          t ^= t >>> 12;
          v2 = X[i] = v2 ^ t;
          me.i = i;
          return v2 + (w ^ w >>> 16) | 0;
        };
        function init(me2, seed2) {
          var t, v2, i, j, w, X = [], limit = 128;
          if (seed2 === (seed2 | 0)) {
            v2 = seed2;
            seed2 = null;
          } else {
            seed2 = seed2 + "\0";
            v2 = 0;
            limit = Math.max(limit, seed2.length);
          }
          for (i = 0, j = -32; j < limit; ++j) {
            if (seed2) v2 ^= seed2.charCodeAt((j + 32) % seed2.length);
            if (j === 0) w = v2;
            v2 ^= v2 << 10;
            v2 ^= v2 >>> 15;
            v2 ^= v2 << 4;
            v2 ^= v2 >>> 13;
            if (j >= 0) {
              w = w + 1640531527 | 0;
              t = X[j & 127] ^= v2 + w;
              i = 0 == t ? i + 1 : 0;
            }
          }
          if (i >= 128) {
            X[(seed2 && seed2.length || 0) & 127] = -1;
          }
          i = 127;
          for (j = 4 * 128; j > 0; --j) {
            v2 = X[i + 34 & 127];
            t = X[i = i + 1 & 127];
            v2 ^= v2 << 13;
            t ^= t << 17;
            v2 ^= v2 >>> 15;
            t ^= t >>> 12;
            X[i] = v2 ^ t;
          }
          me2.w = w;
          me2.X = X;
          me2.i = i;
        }
        init(me, seed);
      }
      function copy(f, t) {
        t.i = f.i;
        t.w = f.w;
        t.X = f.X.slice();
        return t;
      }
      ;
      function impl(seed, opts) {
        if (seed == null) seed = +/* @__PURE__ */ new Date();
        var xg = new XorGen(seed), state = opts && opts.state, prng = function() {
          return (xg.next() >>> 0) / 4294967296;
        };
        prng.double = function() {
          do {
            var top = xg.next() >>> 11, bot = (xg.next() >>> 0) / 4294967296, result = (top + bot) / (1 << 21);
          } while (result === 0);
          return result;
        };
        prng.int32 = xg.next;
        prng.quick = prng;
        if (state) {
          if (state.X) copy(state, xg);
          prng.state = function() {
            return copy(xg, {});
          };
        }
        return prng;
      }
      if (module2 && module2.exports) {
        module2.exports = impl;
      } else if (define2 && define2.amd) {
        define2(function() {
          return impl;
        });
      } else {
        this.xor4096 = impl;
      }
    })(
      exports,
      // window object or global
      typeof module == "object" && module,
      // present in node.js
      typeof define == "function" && define
      // present with an AMD loader
    );
  }
});

// node_modules/seedrandom/lib/tychei.js
var require_tychei = __commonJS({
  "node_modules/seedrandom/lib/tychei.js"(exports, module) {
    (function(global, module2, define2) {
      function XorGen(seed) {
        var me = this, strseed = "";
        me.next = function() {
          var b = me.b, c = me.c, d = me.d, a = me.a;
          b = b << 25 ^ b >>> 7 ^ c;
          c = c - d | 0;
          d = d << 24 ^ d >>> 8 ^ a;
          a = a - b | 0;
          me.b = b = b << 20 ^ b >>> 12 ^ c;
          me.c = c = c - d | 0;
          me.d = d << 16 ^ c >>> 16 ^ a;
          return me.a = a - b | 0;
        };
        me.a = 0;
        me.b = 0;
        me.c = 2654435769 | 0;
        me.d = 1367130551;
        if (seed === Math.floor(seed)) {
          me.a = seed / 4294967296 | 0;
          me.b = seed | 0;
        } else {
          strseed += seed;
        }
        for (var k = 0; k < strseed.length + 20; k++) {
          me.b ^= strseed.charCodeAt(k) | 0;
          me.next();
        }
      }
      function copy(f, t) {
        t.a = f.a;
        t.b = f.b;
        t.c = f.c;
        t.d = f.d;
        return t;
      }
      ;
      function impl(seed, opts) {
        var xg = new XorGen(seed), state = opts && opts.state, prng = function() {
          return (xg.next() >>> 0) / 4294967296;
        };
        prng.double = function() {
          do {
            var top = xg.next() >>> 11, bot = (xg.next() >>> 0) / 4294967296, result = (top + bot) / (1 << 21);
          } while (result === 0);
          return result;
        };
        prng.int32 = xg.next;
        prng.quick = prng;
        if (state) {
          if (typeof state == "object") copy(state, xg);
          prng.state = function() {
            return copy(xg, {});
          };
        }
        return prng;
      }
      if (module2 && module2.exports) {
        module2.exports = impl;
      } else if (define2 && define2.amd) {
        define2(function() {
          return impl;
        });
      } else {
        this.tychei = impl;
      }
    })(
      exports,
      typeof module == "object" && module,
      // present in node.js
      typeof define == "function" && define
      // present with an AMD loader
    );
  }
});

// (disabled):crypto
var require_crypto = __commonJS({
  "(disabled):crypto"() {
  }
});

// node_modules/seedrandom/seedrandom.js
var require_seedrandom = __commonJS({
  "node_modules/seedrandom/seedrandom.js"(exports, module) {
    (function(global, pool, math) {
      var width = 256, chunks = 6, digits = 52, rngname = "random", startdenom = math.pow(width, chunks), significance = math.pow(2, digits), overflow = significance * 2, mask = width - 1, nodecrypto;
      function seedrandom2(seed, options, callback) {
        var key = [];
        options = options == true ? { entropy: true } : options || {};
        var shortseed = mixkey(flatten(
          options.entropy ? [seed, tostring(pool)] : seed == null ? autoseed() : seed,
          3
        ), key);
        var arc4 = new ARC4(key);
        var prng = function() {
          var n = arc4.g(chunks), d = startdenom, x = 0;
          while (n < significance) {
            n = (n + x) * width;
            d *= width;
            x = arc4.g(1);
          }
          while (n >= overflow) {
            n /= 2;
            d /= 2;
            x >>>= 1;
          }
          return (n + x) / d;
        };
        prng.int32 = function() {
          return arc4.g(4) | 0;
        };
        prng.quick = function() {
          return arc4.g(4) / 4294967296;
        };
        prng.double = prng;
        mixkey(tostring(arc4.S), pool);
        return (options.pass || callback || function(prng2, seed2, is_math_call, state) {
          if (state) {
            if (state.S) {
              copy(state, arc4);
            }
            prng2.state = function() {
              return copy(arc4, {});
            };
          }
          if (is_math_call) {
            math[rngname] = prng2;
            return seed2;
          } else return prng2;
        })(
          prng,
          shortseed,
          "global" in options ? options.global : this == math,
          options.state
        );
      }
      function ARC4(key) {
        var t, keylen = key.length, me = this, i = 0, j = me.i = me.j = 0, s = me.S = [];
        if (!keylen) {
          key = [keylen++];
        }
        while (i < width) {
          s[i] = i++;
        }
        for (i = 0; i < width; i++) {
          s[i] = s[j = mask & j + key[i % keylen] + (t = s[i])];
          s[j] = t;
        }
        (me.g = function(count) {
          var t2, r = 0, i2 = me.i, j2 = me.j, s2 = me.S;
          while (count--) {
            t2 = s2[i2 = mask & i2 + 1];
            r = r * width + s2[mask & (s2[i2] = s2[j2 = mask & j2 + t2]) + (s2[j2] = t2)];
          }
          me.i = i2;
          me.j = j2;
          return r;
        })(width);
      }
      function copy(f, t) {
        t.i = f.i;
        t.j = f.j;
        t.S = f.S.slice();
        return t;
      }
      ;
      function flatten(obj, depth) {
        var result = [], typ = typeof obj, prop;
        if (depth && typ == "object") {
          for (prop in obj) {
            try {
              result.push(flatten(obj[prop], depth - 1));
            } catch (e) {
            }
          }
        }
        return result.length ? result : typ == "string" ? obj : obj + "\0";
      }
      function mixkey(seed, key) {
        var stringseed = seed + "", smear, j = 0;
        while (j < stringseed.length) {
          key[mask & j] = mask & (smear ^= key[mask & j] * 19) + stringseed.charCodeAt(j++);
        }
        return tostring(key);
      }
      function autoseed() {
        try {
          var out;
          if (nodecrypto && (out = nodecrypto.randomBytes)) {
            out = out(width);
          } else {
            out = new Uint8Array(width);
            (global.crypto || global.msCrypto).getRandomValues(out);
          }
          return tostring(out);
        } catch (e) {
          var browser = global.navigator, plugins = browser && browser.plugins;
          return [+/* @__PURE__ */ new Date(), global, plugins, global.screen, tostring(pool)];
        }
      }
      function tostring(a) {
        return String.fromCharCode.apply(0, a);
      }
      mixkey(math.random(), pool);
      if (typeof module == "object" && module.exports) {
        module.exports = seedrandom2;
        try {
          nodecrypto = require_crypto();
        } catch (ex) {
        }
      } else if (typeof define == "function" && define.amd) {
        define(function() {
          return seedrandom2;
        });
      } else {
        math["seed" + rngname] = seedrandom2;
      }
    })(
      // global: `self` in browsers (including strict mode and web workers),
      // otherwise `this` in Node and other environments
      typeof self !== "undefined" ? self : exports,
      [],
      // pool: entropy pool starts empty
      Math
      // math: package containing random, pow, and seedrandom
    );
  }
});

// node_modules/seedrandom/index.js
var require_seedrandom2 = __commonJS({
  "node_modules/seedrandom/index.js"(exports, module) {
    var alea = require_alea();
    var xor128 = require_xor128();
    var xorwow = require_xorwow();
    var xorshift7 = require_xorshift7();
    var xor4096 = require_xor4096();
    var tychei = require_tychei();
    var sr = require_seedrandom();
    sr.alea = alea;
    sr.xor128 = xor128;
    sr.xorwow = xorwow;
    sr.xorshift7 = xorshift7;
    sr.xor4096 = xor4096;
    sr.tychei = tychei;
    module.exports = sr;
  }
});

// node_modules/robust-predicates/esm/util.js
var epsilon = 11102230246251565e-32;
var splitter = 134217729;
var resulterrbound = (3 + 8 * epsilon) * epsilon;
function sum(elen, e, flen, f, h) {
  let Q, Qnew, hh, bvirt;
  let enow = e[0];
  let fnow = f[0];
  let eindex = 0;
  let findex = 0;
  if (fnow > enow === fnow > -enow) {
    Q = enow;
    enow = e[++eindex];
  } else {
    Q = fnow;
    fnow = f[++findex];
  }
  let hindex = 0;
  if (eindex < elen && findex < flen) {
    if (fnow > enow === fnow > -enow) {
      Qnew = enow + Q;
      hh = Q - (Qnew - enow);
      enow = e[++eindex];
    } else {
      Qnew = fnow + Q;
      hh = Q - (Qnew - fnow);
      fnow = f[++findex];
    }
    Q = Qnew;
    if (hh !== 0) {
      h[hindex++] = hh;
    }
    while (eindex < elen && findex < flen) {
      if (fnow > enow === fnow > -enow) {
        Qnew = Q + enow;
        bvirt = Qnew - Q;
        hh = Q - (Qnew - bvirt) + (enow - bvirt);
        enow = e[++eindex];
      } else {
        Qnew = Q + fnow;
        bvirt = Qnew - Q;
        hh = Q - (Qnew - bvirt) + (fnow - bvirt);
        fnow = f[++findex];
      }
      Q = Qnew;
      if (hh !== 0) {
        h[hindex++] = hh;
      }
    }
  }
  while (eindex < elen) {
    Qnew = Q + enow;
    bvirt = Qnew - Q;
    hh = Q - (Qnew - bvirt) + (enow - bvirt);
    enow = e[++eindex];
    Q = Qnew;
    if (hh !== 0) {
      h[hindex++] = hh;
    }
  }
  while (findex < flen) {
    Qnew = Q + fnow;
    bvirt = Qnew - Q;
    hh = Q - (Qnew - bvirt) + (fnow - bvirt);
    fnow = f[++findex];
    Q = Qnew;
    if (hh !== 0) {
      h[hindex++] = hh;
    }
  }
  if (Q !== 0 || hindex === 0) {
    h[hindex++] = Q;
  }
  return hindex;
}
function estimate(elen, e) {
  let Q = e[0];
  for (let i = 1; i < elen; i++) Q += e[i];
  return Q;
}
function vec(n) {
  return new Float64Array(n);
}

// node_modules/robust-predicates/esm/orient2d.js
var ccwerrboundA = (3 + 16 * epsilon) * epsilon;
var ccwerrboundB = (2 + 12 * epsilon) * epsilon;
var ccwerrboundC = (9 + 64 * epsilon) * epsilon * epsilon;
var B = vec(4);
var C1 = vec(8);
var C2 = vec(12);
var D = vec(16);
var u = vec(4);
function orient2dadapt(ax, ay, bx, by, cx, cy, detsum) {
  let acxtail, acytail, bcxtail, bcytail;
  let bvirt, c, ahi, alo, bhi, blo, _i, _j, _0, s1, s0, t1, t0, u32;
  const acx = ax - cx;
  const bcx = bx - cx;
  const acy = ay - cy;
  const bcy = by - cy;
  s1 = acx * bcy;
  c = splitter * acx;
  ahi = c - (c - acx);
  alo = acx - ahi;
  c = splitter * bcy;
  bhi = c - (c - bcy);
  blo = bcy - bhi;
  s0 = alo * blo - (s1 - ahi * bhi - alo * bhi - ahi * blo);
  t1 = acy * bcx;
  c = splitter * acy;
  ahi = c - (c - acy);
  alo = acy - ahi;
  c = splitter * bcx;
  bhi = c - (c - bcx);
  blo = bcx - bhi;
  t0 = alo * blo - (t1 - ahi * bhi - alo * bhi - ahi * blo);
  _i = s0 - t0;
  bvirt = s0 - _i;
  B[0] = s0 - (_i + bvirt) + (bvirt - t0);
  _j = s1 + _i;
  bvirt = _j - s1;
  _0 = s1 - (_j - bvirt) + (_i - bvirt);
  _i = _0 - t1;
  bvirt = _0 - _i;
  B[1] = _0 - (_i + bvirt) + (bvirt - t1);
  u32 = _j + _i;
  bvirt = u32 - _j;
  B[2] = _j - (u32 - bvirt) + (_i - bvirt);
  B[3] = u32;
  let det = estimate(4, B);
  let errbound = ccwerrboundB * detsum;
  if (det >= errbound || -det >= errbound) {
    return det;
  }
  bvirt = ax - acx;
  acxtail = ax - (acx + bvirt) + (bvirt - cx);
  bvirt = bx - bcx;
  bcxtail = bx - (bcx + bvirt) + (bvirt - cx);
  bvirt = ay - acy;
  acytail = ay - (acy + bvirt) + (bvirt - cy);
  bvirt = by - bcy;
  bcytail = by - (bcy + bvirt) + (bvirt - cy);
  if (acxtail === 0 && acytail === 0 && bcxtail === 0 && bcytail === 0) {
    return det;
  }
  errbound = ccwerrboundC * detsum + resulterrbound * Math.abs(det);
  det += acx * bcytail + bcy * acxtail - (acy * bcxtail + bcx * acytail);
  if (det >= errbound || -det >= errbound) return det;
  s1 = acxtail * bcy;
  c = splitter * acxtail;
  ahi = c - (c - acxtail);
  alo = acxtail - ahi;
  c = splitter * bcy;
  bhi = c - (c - bcy);
  blo = bcy - bhi;
  s0 = alo * blo - (s1 - ahi * bhi - alo * bhi - ahi * blo);
  t1 = acytail * bcx;
  c = splitter * acytail;
  ahi = c - (c - acytail);
  alo = acytail - ahi;
  c = splitter * bcx;
  bhi = c - (c - bcx);
  blo = bcx - bhi;
  t0 = alo * blo - (t1 - ahi * bhi - alo * bhi - ahi * blo);
  _i = s0 - t0;
  bvirt = s0 - _i;
  u[0] = s0 - (_i + bvirt) + (bvirt - t0);
  _j = s1 + _i;
  bvirt = _j - s1;
  _0 = s1 - (_j - bvirt) + (_i - bvirt);
  _i = _0 - t1;
  bvirt = _0 - _i;
  u[1] = _0 - (_i + bvirt) + (bvirt - t1);
  u32 = _j + _i;
  bvirt = u32 - _j;
  u[2] = _j - (u32 - bvirt) + (_i - bvirt);
  u[3] = u32;
  const C1len = sum(4, B, 4, u, C1);
  s1 = acx * bcytail;
  c = splitter * acx;
  ahi = c - (c - acx);
  alo = acx - ahi;
  c = splitter * bcytail;
  bhi = c - (c - bcytail);
  blo = bcytail - bhi;
  s0 = alo * blo - (s1 - ahi * bhi - alo * bhi - ahi * blo);
  t1 = acy * bcxtail;
  c = splitter * acy;
  ahi = c - (c - acy);
  alo = acy - ahi;
  c = splitter * bcxtail;
  bhi = c - (c - bcxtail);
  blo = bcxtail - bhi;
  t0 = alo * blo - (t1 - ahi * bhi - alo * bhi - ahi * blo);
  _i = s0 - t0;
  bvirt = s0 - _i;
  u[0] = s0 - (_i + bvirt) + (bvirt - t0);
  _j = s1 + _i;
  bvirt = _j - s1;
  _0 = s1 - (_j - bvirt) + (_i - bvirt);
  _i = _0 - t1;
  bvirt = _0 - _i;
  u[1] = _0 - (_i + bvirt) + (bvirt - t1);
  u32 = _j + _i;
  bvirt = u32 - _j;
  u[2] = _j - (u32 - bvirt) + (_i - bvirt);
  u[3] = u32;
  const C2len = sum(C1len, C1, 4, u, C2);
  s1 = acxtail * bcytail;
  c = splitter * acxtail;
  ahi = c - (c - acxtail);
  alo = acxtail - ahi;
  c = splitter * bcytail;
  bhi = c - (c - bcytail);
  blo = bcytail - bhi;
  s0 = alo * blo - (s1 - ahi * bhi - alo * bhi - ahi * blo);
  t1 = acytail * bcxtail;
  c = splitter * acytail;
  ahi = c - (c - acytail);
  alo = acytail - ahi;
  c = splitter * bcxtail;
  bhi = c - (c - bcxtail);
  blo = bcxtail - bhi;
  t0 = alo * blo - (t1 - ahi * bhi - alo * bhi - ahi * blo);
  _i = s0 - t0;
  bvirt = s0 - _i;
  u[0] = s0 - (_i + bvirt) + (bvirt - t0);
  _j = s1 + _i;
  bvirt = _j - s1;
  _0 = s1 - (_j - bvirt) + (_i - bvirt);
  _i = _0 - t1;
  bvirt = _0 - _i;
  u[1] = _0 - (_i + bvirt) + (bvirt - t1);
  u32 = _j + _i;
  bvirt = u32 - _j;
  u[2] = _j - (u32 - bvirt) + (_i - bvirt);
  u[3] = u32;
  const Dlen = sum(C2len, C2, 4, u, D);
  return D[Dlen - 1];
}
function orient2d(ax, ay, bx, by, cx, cy) {
  const detleft = (ay - cy) * (bx - cx);
  const detright = (ax - cx) * (by - cy);
  const det = detleft - detright;
  const detsum = Math.abs(detleft + detright);
  if (Math.abs(det) >= ccwerrboundA * detsum) return det;
  return -orient2dadapt(ax, ay, bx, by, cx, cy, detsum);
}

// node_modules/robust-predicates/esm/orient3d.js
var o3derrboundA = (7 + 56 * epsilon) * epsilon;
var o3derrboundB = (3 + 28 * epsilon) * epsilon;
var o3derrboundC = (26 + 288 * epsilon) * epsilon * epsilon;
var bc = vec(4);
var ca = vec(4);
var ab = vec(4);
var at_b = vec(4);
var at_c = vec(4);
var bt_c = vec(4);
var bt_a = vec(4);
var ct_a = vec(4);
var ct_b = vec(4);
var bct = vec(8);
var cat = vec(8);
var abt = vec(8);
var u2 = vec(4);
var _8 = vec(8);
var _8b = vec(8);
var _16 = vec(8);
var _12 = vec(12);
var fin = vec(192);
var fin2 = vec(192);

// node_modules/robust-predicates/esm/incircle.js
var iccerrboundA = (10 + 96 * epsilon) * epsilon;
var iccerrboundB = (4 + 48 * epsilon) * epsilon;
var iccerrboundC = (44 + 576 * epsilon) * epsilon * epsilon;
var bc2 = vec(4);
var ca2 = vec(4);
var ab2 = vec(4);
var aa = vec(4);
var bb = vec(4);
var cc = vec(4);
var u3 = vec(4);
var v = vec(4);
var axtbc = vec(8);
var aytbc = vec(8);
var bxtca = vec(8);
var bytca = vec(8);
var cxtab = vec(8);
var cytab = vec(8);
var abt2 = vec(8);
var bct2 = vec(8);
var cat2 = vec(8);
var abtt = vec(4);
var bctt = vec(4);
var catt = vec(4);
var _82 = vec(8);
var _162 = vec(16);
var _16b = vec(16);
var _16c = vec(16);
var _32 = vec(32);
var _32b = vec(32);
var _48 = vec(48);
var _64 = vec(64);
var fin3 = vec(1152);
var fin22 = vec(1152);

// node_modules/robust-predicates/esm/insphere.js
var isperrboundA = (16 + 224 * epsilon) * epsilon;
var isperrboundB = (5 + 72 * epsilon) * epsilon;
var isperrboundC = (71 + 1408 * epsilon) * epsilon * epsilon;
var ab3 = vec(4);
var bc3 = vec(4);
var cd = vec(4);
var de = vec(4);
var ea = vec(4);
var ac = vec(4);
var bd = vec(4);
var ce = vec(4);
var da = vec(4);
var eb = vec(4);
var abc = vec(24);
var bcd = vec(24);
var cde = vec(24);
var dea = vec(24);
var eab = vec(24);
var abd = vec(24);
var bce = vec(24);
var cda = vec(24);
var deb = vec(24);
var eac = vec(24);
var adet = vec(1152);
var bdet = vec(1152);
var cdet = vec(1152);
var ddet = vec(1152);
var edet = vec(1152);
var abdet = vec(2304);
var cddet = vec(2304);
var cdedet = vec(3456);
var deter = vec(5760);
var _83 = vec(8);
var _8b2 = vec(8);
var _8c = vec(8);
var _163 = vec(16);
var _24 = vec(24);
var _482 = vec(48);
var _48b = vec(48);
var _96 = vec(96);
var _192 = vec(192);
var _384x = vec(384);
var _384y = vec(384);
var _384z = vec(384);
var _768 = vec(768);
var xdet = vec(96);
var ydet = vec(96);
var zdet = vec(96);
var fin4 = vec(1152);

// node_modules/delaunator/index.js
var EPSILON = Math.pow(2, -52);
var EDGE_STACK = new Uint32Array(512);
var Delaunator = class _Delaunator {
  static from(points, getX = defaultGetX, getY = defaultGetY) {
    const n = points.length;
    const coords = new Float64Array(n * 2);
    for (let i = 0; i < n; i++) {
      const p = points[i];
      coords[2 * i] = getX(p);
      coords[2 * i + 1] = getY(p);
    }
    return new _Delaunator(coords);
  }
  constructor(coords) {
    const n = coords.length >> 1;
    if (n > 0 && typeof coords[0] !== "number") throw new Error("Expected coords to contain numbers.");
    this.coords = coords;
    const maxTriangles = Math.max(2 * n - 5, 0);
    this._triangles = new Uint32Array(maxTriangles * 3);
    this._halfedges = new Int32Array(maxTriangles * 3);
    this._hashSize = Math.ceil(Math.sqrt(n));
    this._hullPrev = new Uint32Array(n);
    this._hullNext = new Uint32Array(n);
    this._hullTri = new Uint32Array(n);
    this._hullHash = new Int32Array(this._hashSize);
    this._ids = new Uint32Array(n);
    this._dists = new Float64Array(n);
    this.update();
  }
  update() {
    const { coords, _hullPrev: hullPrev, _hullNext: hullNext, _hullTri: hullTri, _hullHash: hullHash } = this;
    const n = coords.length >> 1;
    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;
    for (let i = 0; i < n; i++) {
      const x = coords[2 * i];
      const y = coords[2 * i + 1];
      if (x < minX) minX = x;
      if (y < minY) minY = y;
      if (x > maxX) maxX = x;
      if (y > maxY) maxY = y;
      this._ids[i] = i;
    }
    const cx = (minX + maxX) / 2;
    const cy = (minY + maxY) / 2;
    let i0, i1, i2;
    for (let i = 0, minDist = Infinity; i < n; i++) {
      const d = dist(cx, cy, coords[2 * i], coords[2 * i + 1]);
      if (d < minDist) {
        i0 = i;
        minDist = d;
      }
    }
    const i0x = coords[2 * i0];
    const i0y = coords[2 * i0 + 1];
    for (let i = 0, minDist = Infinity; i < n; i++) {
      if (i === i0) continue;
      const d = dist(i0x, i0y, coords[2 * i], coords[2 * i + 1]);
      if (d < minDist && d > 0) {
        i1 = i;
        minDist = d;
      }
    }
    let i1x = coords[2 * i1];
    let i1y = coords[2 * i1 + 1];
    let minRadius = Infinity;
    for (let i = 0; i < n; i++) {
      if (i === i0 || i === i1) continue;
      const r = circumradius(i0x, i0y, i1x, i1y, coords[2 * i], coords[2 * i + 1]);
      if (r < minRadius) {
        i2 = i;
        minRadius = r;
      }
    }
    let i2x = coords[2 * i2];
    let i2y = coords[2 * i2 + 1];
    if (minRadius === Infinity) {
      for (let i = 0; i < n; i++) {
        this._dists[i] = coords[2 * i] - coords[0] || coords[2 * i + 1] - coords[1];
      }
      quicksort(this._ids, this._dists, 0, n - 1);
      const hull = new Uint32Array(n);
      let j = 0;
      for (let i = 0, d0 = -Infinity; i < n; i++) {
        const id = this._ids[i];
        const d = this._dists[id];
        if (d > d0) {
          hull[j++] = id;
          d0 = d;
        }
      }
      this.hull = hull.subarray(0, j);
      this.triangles = new Uint32Array(0);
      this.halfedges = new Uint32Array(0);
      return;
    }
    if (orient2d(i0x, i0y, i1x, i1y, i2x, i2y) < 0) {
      const i = i1;
      const x = i1x;
      const y = i1y;
      i1 = i2;
      i1x = i2x;
      i1y = i2y;
      i2 = i;
      i2x = x;
      i2y = y;
    }
    const center = circumcenter(i0x, i0y, i1x, i1y, i2x, i2y);
    this._cx = center.x;
    this._cy = center.y;
    for (let i = 0; i < n; i++) {
      this._dists[i] = dist(coords[2 * i], coords[2 * i + 1], center.x, center.y);
    }
    quicksort(this._ids, this._dists, 0, n - 1);
    this._hullStart = i0;
    let hullSize = 3;
    hullNext[i0] = hullPrev[i2] = i1;
    hullNext[i1] = hullPrev[i0] = i2;
    hullNext[i2] = hullPrev[i1] = i0;
    hullTri[i0] = 0;
    hullTri[i1] = 1;
    hullTri[i2] = 2;
    hullHash.fill(-1);
    hullHash[this._hashKey(i0x, i0y)] = i0;
    hullHash[this._hashKey(i1x, i1y)] = i1;
    hullHash[this._hashKey(i2x, i2y)] = i2;
    this.trianglesLen = 0;
    this._addTriangle(i0, i1, i2, -1, -1, -1);
    for (let k = 0, xp, yp; k < this._ids.length; k++) {
      const i = this._ids[k];
      const x = coords[2 * i];
      const y = coords[2 * i + 1];
      if (k > 0 && Math.abs(x - xp) <= EPSILON && Math.abs(y - yp) <= EPSILON) continue;
      xp = x;
      yp = y;
      if (i === i0 || i === i1 || i === i2) continue;
      let start = 0;
      for (let j = 0, key = this._hashKey(x, y); j < this._hashSize; j++) {
        start = hullHash[(key + j) % this._hashSize];
        if (start !== -1 && start !== hullNext[start]) break;
      }
      start = hullPrev[start];
      let e = start, q;
      while (q = hullNext[e], orient2d(x, y, coords[2 * e], coords[2 * e + 1], coords[2 * q], coords[2 * q + 1]) >= 0) {
        e = q;
        if (e === start) {
          e = -1;
          break;
        }
      }
      if (e === -1) continue;
      let t = this._addTriangle(e, i, hullNext[e], -1, -1, hullTri[e]);
      hullTri[i] = this._legalize(t + 2);
      hullTri[e] = t;
      hullSize++;
      let n2 = hullNext[e];
      while (q = hullNext[n2], orient2d(x, y, coords[2 * n2], coords[2 * n2 + 1], coords[2 * q], coords[2 * q + 1]) < 0) {
        t = this._addTriangle(n2, i, q, hullTri[i], -1, hullTri[n2]);
        hullTri[i] = this._legalize(t + 2);
        hullNext[n2] = n2;
        hullSize--;
        n2 = q;
      }
      if (e === start) {
        while (q = hullPrev[e], orient2d(x, y, coords[2 * q], coords[2 * q + 1], coords[2 * e], coords[2 * e + 1]) < 0) {
          t = this._addTriangle(q, i, e, -1, hullTri[e], hullTri[q]);
          this._legalize(t + 2);
          hullTri[q] = t;
          hullNext[e] = e;
          hullSize--;
          e = q;
        }
      }
      this._hullStart = hullPrev[i] = e;
      hullNext[e] = hullPrev[n2] = i;
      hullNext[i] = n2;
      hullHash[this._hashKey(x, y)] = i;
      hullHash[this._hashKey(coords[2 * e], coords[2 * e + 1])] = e;
    }
    this.hull = new Uint32Array(hullSize);
    for (let i = 0, e = this._hullStart; i < hullSize; i++) {
      this.hull[i] = e;
      e = hullNext[e];
    }
    this.triangles = this._triangles.subarray(0, this.trianglesLen);
    this.halfedges = this._halfedges.subarray(0, this.trianglesLen);
  }
  _hashKey(x, y) {
    return Math.floor(pseudoAngle(x - this._cx, y - this._cy) * this._hashSize) % this._hashSize;
  }
  _legalize(a) {
    const { _triangles: triangles, _halfedges: halfedges, coords } = this;
    let i = 0;
    let ar = 0;
    while (true) {
      const b = halfedges[a];
      const a0 = a - a % 3;
      ar = a0 + (a + 2) % 3;
      if (b === -1) {
        if (i === 0) break;
        a = EDGE_STACK[--i];
        continue;
      }
      const b0 = b - b % 3;
      const al = a0 + (a + 1) % 3;
      const bl = b0 + (b + 2) % 3;
      const p0 = triangles[ar];
      const pr = triangles[a];
      const pl = triangles[al];
      const p1 = triangles[bl];
      const illegal = inCircle(
        coords[2 * p0],
        coords[2 * p0 + 1],
        coords[2 * pr],
        coords[2 * pr + 1],
        coords[2 * pl],
        coords[2 * pl + 1],
        coords[2 * p1],
        coords[2 * p1 + 1]
      );
      if (illegal) {
        triangles[a] = p1;
        triangles[b] = p0;
        const hbl = halfedges[bl];
        if (hbl === -1) {
          let e = this._hullStart;
          do {
            if (this._hullTri[e] === bl) {
              this._hullTri[e] = a;
              break;
            }
            e = this._hullPrev[e];
          } while (e !== this._hullStart);
        }
        this._link(a, hbl);
        this._link(b, halfedges[ar]);
        this._link(ar, bl);
        const br = b0 + (b + 1) % 3;
        if (i < EDGE_STACK.length) {
          EDGE_STACK[i++] = br;
        }
      } else {
        if (i === 0) break;
        a = EDGE_STACK[--i];
      }
    }
    return ar;
  }
  _link(a, b) {
    this._halfedges[a] = b;
    if (b !== -1) this._halfedges[b] = a;
  }
  // add a new triangle given vertex indices and adjacent half-edge ids
  _addTriangle(i0, i1, i2, a, b, c) {
    const t = this.trianglesLen;
    this._triangles[t] = i0;
    this._triangles[t + 1] = i1;
    this._triangles[t + 2] = i2;
    this._link(t, a);
    this._link(t + 1, b);
    this._link(t + 2, c);
    this.trianglesLen += 3;
    return t;
  }
};
function pseudoAngle(dx, dy) {
  const p = dx / (Math.abs(dx) + Math.abs(dy));
  return (dy > 0 ? 3 - p : 1 + p) / 4;
}
function dist(ax, ay, bx, by) {
  const dx = ax - bx;
  const dy = ay - by;
  return dx * dx + dy * dy;
}
function inCircle(ax, ay, bx, by, cx, cy, px, py) {
  const dx = ax - px;
  const dy = ay - py;
  const ex = bx - px;
  const ey = by - py;
  const fx = cx - px;
  const fy = cy - py;
  const ap = dx * dx + dy * dy;
  const bp = ex * ex + ey * ey;
  const cp = fx * fx + fy * fy;
  return dx * (ey * cp - bp * fy) - dy * (ex * cp - bp * fx) + ap * (ex * fy - ey * fx) < 0;
}
function circumradius(ax, ay, bx, by, cx, cy) {
  const dx = bx - ax;
  const dy = by - ay;
  const ex = cx - ax;
  const ey = cy - ay;
  const bl = dx * dx + dy * dy;
  const cl = ex * ex + ey * ey;
  const d = 0.5 / (dx * ey - dy * ex);
  const x = (ey * bl - dy * cl) * d;
  const y = (dx * cl - ex * bl) * d;
  return x * x + y * y;
}
function circumcenter(ax, ay, bx, by, cx, cy) {
  const dx = bx - ax;
  const dy = by - ay;
  const ex = cx - ax;
  const ey = cy - ay;
  const bl = dx * dx + dy * dy;
  const cl = ex * ex + ey * ey;
  const d = 0.5 / (dx * ey - dy * ex);
  const x = ax + (ey * bl - dy * cl) * d;
  const y = ay + (dx * cl - ex * bl) * d;
  return { x, y };
}
function quicksort(ids, dists, left, right) {
  if (right - left <= 20) {
    for (let i = left + 1; i <= right; i++) {
      const temp = ids[i];
      const tempDist = dists[temp];
      let j = i - 1;
      while (j >= left && dists[ids[j]] > tempDist) ids[j + 1] = ids[j--];
      ids[j + 1] = temp;
    }
  } else {
    const median = left + right >> 1;
    let i = left + 1;
    let j = right;
    swap(ids, median, i);
    if (dists[ids[left]] > dists[ids[right]]) swap(ids, left, right);
    if (dists[ids[i]] > dists[ids[right]]) swap(ids, i, right);
    if (dists[ids[left]] > dists[ids[i]]) swap(ids, left, i);
    const temp = ids[i];
    const tempDist = dists[temp];
    while (true) {
      do
        i++;
      while (dists[ids[i]] < tempDist);
      do
        j--;
      while (dists[ids[j]] > tempDist);
      if (j < i) break;
      swap(ids, i, j);
    }
    ids[left + 1] = ids[j];
    ids[j] = temp;
    if (right - i + 1 >= j - left) {
      quicksort(ids, dists, i, right);
      quicksort(ids, dists, left, j - 1);
    } else {
      quicksort(ids, dists, left, j - 1);
      quicksort(ids, dists, i, right);
    }
  }
}
function swap(arr, i, j) {
  const tmp = arr[i];
  arr[i] = arr[j];
  arr[j] = tmp;
}
function defaultGetX(p) {
  return p[0];
}
function defaultGetY(p) {
  return p[1];
}

// src/celtic.ts
var import_seedrandom = __toESM(require_seedrandom2());

// src/url-query-string.ts
function objectToQueryString(obj) {
  const params2 = new URLSearchParams();
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      const value = obj[key];
      let paramValue;
      if (typeof value === "number" || typeof value === "boolean" || typeof value === "string") {
        paramValue = String(value);
      } else if (typeof value === "object") {
        paramValue = JSON.stringify(value);
      } else {
        continue;
      }
      params2.append(key, paramValue);
    }
  }
  const queryString = params2.toString();
  return queryString ? `?${queryString}` : "";
}
function queryStringToObject(queryString) {
  const obj = {};
  const query = queryString.startsWith("?") ? queryString.slice(1) : queryString;
  const params2 = new URLSearchParams(query);
  params2.forEach((value, key) => {
    let parsedValue;
    try {
      parsedValue = JSON.parse(value);
      obj[key] = parsedValue;
      return;
    } catch {
    }
    if (!isNaN(Number(value))) {
      obj[key] = Number(value);
      return;
    }
    if (value.toLowerCase() === "true") {
      obj[key] = true;
      return;
    }
    if (value.toLowerCase() === "false") {
      obj[key] = false;
      return;
    }
    obj[key] = value;
  });
  return obj;
}
function updateUrlParam(key, value) {
  const url = new URL(window.location.href);
  url.searchParams.set(key, value);
  history.replaceState(null, "", url.toString());
}

// src/controls.ts
var $ = (id) => document.getElementById(id);
var Control = class {
  id;
  // like a name but should be a valid query string param name
  _updateUrl;
  wrapperEl;
  constructor(id, params2) {
    this.id = id;
    this._updateUrl = params2.updateUrl || false;
    this.wrapperEl = $(`${id}-control`);
    controls.push(this);
  }
  updateUrl() {
    return this._updateUrl;
  }
  val() {
    return void 0;
  }
  set(value) {
    return value;
  }
  show() {
    this.wrapperEl.style.display = "block";
  }
  hide() {
    this.wrapperEl.style.display = "none";
  }
};
var NumberControl = class extends Control {
  widgetEl;
  valueEl;
  value;
  constructor(id, params2) {
    super(id, params2);
    this._updateUrl = params2.updateUrl || true;
    this.value = params2.value;
    this.createHtmlControl(id, params2.name, params2.value, params2.min, params2.max, params2.step);
    this.widgetEl = $(id);
    this.valueEl = $(`${id}-value`);
    this.wrapperEl = $(`${id}-control`);
    this.widgetEl.onchange = (event) => {
      this.set(parseFloat(event.target.value));
      this.valueEl.innerText = this.value.toString();
      if (this.updateUrl()) updateUrlParam(this.id, this.value);
      params2.callback();
    };
  }
  val() {
    return this.value;
  }
  createHtmlControl(id, name, value, min, max, step) {
    const html = [];
    html.push(`<div class="control" id="${id}-control">`);
    const stepAttr = step ? `step="${step}"` : "";
    html.push(`
      <input id="${id}" type="range" min="${min}" max="${max}" value="${value}" ${stepAttr}"/>
      ${name}
      <span id="${id}-value">${value}</span>
    `);
    html.push("</div>");
    const anchorElement = $("controls");
    if (anchorElement) {
      anchorElement.insertAdjacentHTML("beforeend", html.join(""));
    }
  }
  set(newValue) {
    this.value = newValue;
    this.widgetEl.value = newValue.toString();
    this.valueEl.innerText = newValue.toString();
    return this.value;
  }
};
var SelectControl = class extends Control {
  widgetEl;
  value;
  constructor(id, params2) {
    super(id, params2);
    this.value = params2.value;
    this.createHtmlControl(id, params2.name, params2.value, params2.choices);
    this.widgetEl = $(id);
    this.wrapperEl = $(`${id}-control`);
    this._updateUrl = params2.updateUrl || true;
    this.widgetEl.onchange = (event) => {
      this.set(event.target.value);
      if (this.updateUrl()) updateUrlParam(this.id, this.value);
      params2.callback(this);
    };
  }
  createHtmlControl(id, name, value, choices) {
    const html = [];
    html.push(`<div class="control" id="${id}-control">`);
    html.push(name);
    html.push(`<select id="${this.id}">`);
    choices.forEach((choice) => html.push(`<option ${choice === value ? "selected" : ""}>${choice}</option>`));
    html.push("</select>");
    html.push("</div>");
    const anchorElement = $("controls");
    if (anchorElement) {
      anchorElement.insertAdjacentHTML("beforeend", html.join(""));
    }
  }
  val() {
    return this.value;
  }
  set(newValue) {
    this.value = newValue;
    this.widgetEl.value = newValue;
    return this.value;
  }
};
var CheckboxControl = class extends Control {
  widgetEl;
  value;
  constructor(id, params2) {
    super(id, params2);
    this.value = params2.value;
    this.createHtmlControl(id, params2.name, params2.value);
    this.widgetEl = $(id);
    this.wrapperEl = $(`${id}-control`);
    this._updateUrl = params2.updateUrl || true;
    this.widgetEl.onchange = (event) => {
      this.set(event.target.checked);
      if (this.updateUrl()) updateUrlParam(this.id, this.value);
      params2.callback.bind(this)();
    };
  }
  createHtmlControl(id, name, value) {
    const html = [];
    html.push(`<div class="control" id="${id}-control">`);
    html.push(`<input type="checkbox" id="${id}" ${value ? "selected" : ""}> ${name}`);
    html.push(`</div>`);
    const anchorElement = $("controls");
    if (anchorElement) {
      anchorElement.insertAdjacentHTML("beforeend", html.join(""));
    }
  }
  val() {
    return this.value;
  }
  set(newValue) {
    this.value = newValue;
    this.widgetEl.checked = newValue;
  }
};
var SvgSaveControl = class extends Control {
  constructor(id, params2) {
    super(id, params2);
    this.createHtmlControl(id, params2.name);
    $(id).onclick = () => {
      const svgEl = $(params2.canvasId);
      svgEl.setAttribute("xmlns", "http://www.w3.org/2000/svg");
      var svgData = svgEl.outerHTML;
      var preface = '<?xml version="1.0" standalone="no"?>';
      var svgBlob = new Blob([preface, svgData], { type: "image/svg+xml;charset=utf-8" });
      var svgUrl = URL.createObjectURL(svgBlob);
      var downloadLink = document.createElement("a");
      downloadLink.href = svgUrl;
      downloadLink.download = params2.saveFilename;
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);
    };
  }
  createHtmlControl(id, name) {
    const html = `
      <div class="control" id="${id}-control">
        <button id="${id}">${name}</button>
      </div>
    `;
    const anchorElement = $("controls");
    if (anchorElement) {
      anchorElement.insertAdjacentHTML("beforeend", html);
    }
  }
};
var paramsFromUrl = (defaults) => {
  const params2 = queryStringToObject(window.location.search);
  return { ...defaults, ...params2 };
};
var updateUrl = (params2) => {
  const url = objectToQueryString(params2);
  history.pushState(null, "", url);
};
var controls = [];

// src/celtic.ts
var assert = function(assertion) {
  if (!assertion) {
    console.warn("Assertion FALSE. Expect errors");
  }
};
var defaultParams = {
  width: 800,
  height: 800,
  graphType: "Polar",
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
  palette: ["#522258", "#8C3061", "#C63C51", "#D95F59"]
};
var Graph = class {
  nodes;
  edges;
  constructor() {
    this.nodes = [];
    this.edges = [];
  }
  addNode(n) {
    this.nodes.push(n);
  }
  addEdge(e) {
    this.edges.push(e);
    e.node1.addEdge(e);
    e.node2.addEdge(e);
  }
  nextEdgeAround(n, e, direction) {
    let minAngle = 20;
    let nextEdge = e;
    for (let i = 0; i < n.edges.length; i++) {
      const edge = n.edges[i];
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
  asSvg() {
    const s = [];
    this.nodes.forEach((node) => s.push(node.asSvg()));
    this.edges.forEach((edge) => s.push(edge.asSvg()));
    return s.join("\n");
  }
  asText() {
    return `Graph
    Nodes:

${this.nodes.map((node) => node.asText()).join("\n")}

    Edges:

${this.edges.map((edge) => edge.asText()).join("\n")}
    `;
  }
};
var Pattern = class {
  // parameters setting how "stretched" splines are. They dictate how far are
  //  the middle control points of the cubic Bezier splines are from the first
  //  and last points
  shape1;
  shape2;
  // The graph (nodes and edges) on which the knot is drawn
  graph;
  // The actual knot as a list of bezier splines
  splines;
  palette;
  constructor(g, shape1, shape2, palette) {
    this.shape1 = shape1;
    this.shape2 = shape2;
    this.graph = g;
    this.splines = [];
    this.palette = palette;
  }
  drawSplineDirection(s, node, edge1, edge2, direction) {
    const x1 = (edge1.node1.x + edge1.node2.x) / 2;
    const y1 = (edge1.node1.y + edge1.node2.y) / 2;
    const x4 = (edge2.node1.x + edge2.node2.x) / 2;
    const y4 = (edge2.node1.y + edge2.node2.y) / 2;
    const alpha = edge1.angleTo(edge2, node, direction) * this.shape1;
    const beta = this.shape2;
    let i1x, i1y, i2x, i2y, x2, y2, x3, y3;
    if (direction == 1 /* Anticlockwise */) {
      i1x = alpha * (node.y - y1) + x1;
      i1y = -alpha * (node.x - x1) + y1;
      i2x = -alpha * (node.y - y4) + x4;
      i2y = alpha * (node.x - x4) + y4;
      x2 = beta * (y1 - i1y) + i1x;
      y2 = -beta * (x1 - i1x) + i1y;
      x3 = -beta * (y4 - i2y) + i2x;
      y3 = beta * (x4 - i2x) + i2y;
    } else {
      i1x = -alpha * (node.y - y1) + x1;
      i1y = alpha * (node.x - x1) + y1;
      i2x = alpha * (node.y - y4) + x4;
      i2y = -alpha * (node.x - x4) + y4;
      x2 = -beta * (y1 - i1y) + i1x;
      y2 = beta * (x1 - i1x) + i1y;
      x3 = beta * (y4 - i2y) + i2x;
      y3 = -beta * (x4 - i2x) + i2y;
    }
    s.addSegment(x1, y1, x2, y2, x3, y3, x4, y4);
  }
  nextUnprocessedEdgeDirection() {
    for (let edge of this.graph.edges) {
      if (!edge.processedClockwise) {
        return { edge, direction: 0 /* Clockwise */ };
      }
      if (!edge.processedAnticlockwise) {
        return { edge, direction: 1 /* Anticlockwise */ };
      }
    }
    return 0;
  }
  makeCurves() {
    let currentEdge, firstEdge, nextEdge;
    let currentNode, firstNode;
    let currentDirection, firstDirection;
    let s;
    let nextEdgeDirection = this.nextUnprocessedEdgeDirection();
    let colourIndex = 0;
    while (nextEdgeDirection !== 0) {
      firstEdge = nextEdgeDirection.edge;
      firstDirection = nextEdgeDirection.direction;
      colourIndex++;
      s = new Spline(colourIndex, this.palette[colourIndex % this.palette.length]);
      this.splines.push(s);
      currentEdge = firstEdge;
      currentNode = firstNode = currentEdge.node1;
      currentDirection = firstDirection;
      do {
        if (currentDirection == 0 /* Clockwise */) {
          currentEdge.processedClockwise = true;
        } else {
          currentEdge.processedAnticlockwise = true;
        }
        nextEdge = this.graph.nextEdgeAround(currentNode, currentEdge, currentDirection);
        this.drawSplineDirection(s, currentNode, currentEdge, nextEdge, currentDirection);
        currentEdge = nextEdge;
        currentNode = nextEdge.otherNode(currentNode);
        currentDirection = 1 - currentDirection;
      } while (currentNode !== firstNode || currentEdge !== firstEdge || currentDirection !== firstDirection);
      if (s.segments.length == 2) {
        this.splines.pop();
      }
      nextEdgeDirection = this.nextUnprocessedEdgeDirection();
    }
  }
};
var GraphNode = class {
  x;
  y;
  edges;
  // edges that contain this node
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.edges = [];
  }
  asSvg() {
    return `<circle cx="${this.x}" cy="${this.y}" r="10" fill="none" />`;
  }
  asText() {
    return `Node (${this.x}, ${this.y})`;
  }
  addEdge(e) {
    this.edges.push(e);
  }
};
var GraphEdge = class {
  node1;
  node2;
  #angle1;
  #angle2;
  processedClockwise;
  processedAnticlockwise;
  constructor(n1, n2) {
    this.node1 = n1;
    this.node2 = n2;
    this.#angle1 = Math.atan2(n2.y - n1.y, n2.x - n1.x);
    if (this.#angle1 < 0) this.#angle1 += 2 * Math.PI;
    this.#angle2 = Math.atan2(n1.y - n2.y, n1.x - n2.x);
    if (this.#angle2 < 0) this.#angle2 += 2 * Math.PI;
    this.processedClockwise = false;
    this.processedAnticlockwise = false;
  }
  asSvg() {
    return `<line x1="${this.node1.x}" y1="${this.node1.y}" x2="${this.node2.x}" y2="${this.node2.y}" fill="none" />`;
  }
  asText() {
    return `Edge (${this.node1.asText()}, ${this.node2.asText()} - cw: ${this.processedClockwise}, acw: ${this.processedAnticlockwise})`;
  }
  angle(n) {
    assert(n == this.node1 || n == this.node2);
    return n == this.node1 ? this.#angle1 : this.#angle2;
  }
  otherNode(n) {
    assert(n == this.node1 || n == this.node2);
    return n == this.node1 ? this.node2 : this.node1;
  }
  angleTo(e2, node, direction) {
    const a = direction == 0 /* Clockwise */ ? this.angle(node) - e2.angle(node) : e2.angle(node) - this.angle(node);
    return a < 0 ? a + 2 * Math.PI : a;
  }
};
var makePolarGraph = (params2) => {
  const xmin = params2.margin;
  const ymin = params2.margin;
  const width = params2.width - 2 * params2.margin;
  const height = params2.width - 2 * params2.margin;
  const nbp = params2.nbNodesPerOrbit || 6;
  let nbo = params2.nbOrbits || 3;
  const perturbation = params2.perturbation;
  const seed = params2.seed || "someseed";
  const rng = (0, import_seedrandom.default)(seed.toString());
  const g = new Graph();
  const cx = width / 2 + xmin;
  const cy = height / 2 + ymin;
  const grid = [];
  if (nbo === 1) {
    const os2 = (width < height ? width : height) / 2;
    for (let p = 0; p < nbp; p++) {
      const gridNode = new GraphNode(
        cx + os2 * Math.sin(p * 2 * Math.PI / nbp) + perturbation * (rng() - 0.5),
        cy + os2 * Math.sin(p * 2 * Math.PI / nbp) + perturbation * (rng() - 0.5)
      );
      grid.push(gridNode);
      g.addNode(gridNode);
    }
    for (let p = 0; p < nbp; p++) {
      g.addEdge(new GraphEdge(grid[p], grid[(p + 1) % nbp]));
    }
    return g;
  }
  nbo = nbo - 1;
  const os = (width < height ? width : height) / (2 * nbo);
  const firstNode = new GraphNode(cx, cy);
  g.addNode(firstNode);
  grid.push(firstNode);
  for (let o = 0; o < nbo; o++) {
    for (let p = 0; p < nbp; p++) {
      const gridNode = new GraphNode(
        cx + (o + 1) * os * Math.sin(p * 2 * Math.PI / nbp) + perturbation * (rng() - 0.5),
        cy + (o + 1) * os * Math.cos(p * 2 * Math.PI / nbp) + perturbation * (rng() - 0.5)
      );
      grid.push(gridNode);
      g.addNode(gridNode);
    }
  }
  for (let o = 0; o < nbo; o++) {
    for (let p = 0; p < nbp; p++) {
      if (o == 0) {
        g.addEdge(new GraphEdge(grid[1 + o * nbp + p], grid[0]));
      } else {
        g.addEdge(new GraphEdge(grid[1 + o * nbp + p], grid[1 + (o - 1) * nbp + p]));
      }
      g.addEdge(new GraphEdge(grid[1 + o * nbp + p], grid[1 + o * nbp + (p + 1) % nbp]));
    }
  }
  return g;
};
var makeGridGraph = (params2) => {
  const xmin = params2.margin;
  const ymin = params2.margin;
  const width = params2.width;
  const height = params2.height;
  const cells = params2.cells || 5;
  const seed = params2.seed || "someseed";
  const rng = (0, import_seedrandom.default)(seed.toString());
  const perturbation = params2.perturbation;
  const g = new Graph();
  let row, col;
  let x, y;
  const nbcol = cells;
  const nbrow = cells;
  const grid = [];
  const alpha = Math.min(width, height);
  const beta = Math.min(xmin, ymin);
  for (row = 0; row < nbrow; row++) {
    for (col = 0; col < nbcol; col++) {
      x = xmin + row * (alpha - 2 * beta) / (cells - 1);
      y = ymin + col * (alpha - 2 * beta) / (cells - 1);
      if (perturbation !== 0) {
        x += perturbation * (rng() - 0.5);
        y += perturbation * (rng() - 0.5);
      }
      grid[row + col * nbrow] = new GraphNode(x, y);
      g.addNode(grid[row + col * nbrow]);
    }
  }
  for (row = 0; row < nbrow; row++) {
    for (col = 0; col < nbcol; col++) {
      if (col != nbcol - 1)
        g.addEdge(new GraphEdge(grid[row + col * nbrow], grid[row + (col + 1) * nbrow]));
      if (row != nbrow - 1)
        g.addEdge(new GraphEdge(grid[row + col * nbrow], grid[row + 1 + col * nbrow]));
      if (col != nbcol - 1 && row != nbrow - 1) {
        g.addEdge(new GraphEdge(grid[row + col * nbrow], grid[row + 1 + (col + 1) * nbrow]));
        g.addEdge(new GraphEdge(grid[row + 1 + col * nbrow], grid[row + (col + 1) * nbrow]));
      }
    }
  }
  return g;
};
var dist2 = (a, b) => (b.x - a.x) * (b.x - a.x) + (b.y - a.y) * (b.y - a.y);
var randomNodes = (w, h, xmin, ymin, n, minDist, rand) => {
  const result = [];
  const maxIterations = 100;
  for (let i = 0; i < n; i++) {
    let iter = 0;
    do {
      const node = new GraphNode(rand() * w + xmin, rand() * h + ymin);
      const distances = result.map((r) => dist2(r, node));
      if (Math.min(...distances) >= minDist * minDist) {
        result.push(node);
        break;
      }
    } while (iter++ < maxIterations);
  }
  return result;
};
var makeRandomGraph = (params2) => {
  const xmin = params2.margin;
  const ymin = params2.margin;
  const width = params2.width - 2 * params2.margin;
  const height = params2.height - 2 * params2.margin;
  const nbNodes = params2.nbNodes || 4;
  const seed = params2.seed || "someseed";
  const rng = (0, import_seedrandom.default)(seed.toString());
  const g = new Graph();
  const rNodes = randomNodes(width, height, xmin, ymin, nbNodes, 20, rng);
  const delaunayPoints = [];
  for (let node of rNodes) {
    delaunayPoints.push(node.x);
    delaunayPoints.push(node.y);
    g.addNode(node);
  }
  const delaunay = new Delaunator(delaunayPoints);
  const edges = [];
  const addToEdges = function(i1, i2) {
    for (let edge of edges) {
      if (edge[0] == i1 && edge[1] == i2 || edge[0] == i2 && edge[1] == i1) {
        return;
      }
    }
    edges.push([i1, i2]);
  };
  for (let i = 0; i < delaunay.triangles.length / 3; i++) {
    const te1 = delaunay.triangles[i * 3];
    const te2 = delaunay.triangles[i * 3 + 1];
    const te3 = delaunay.triangles[i * 3 + 2];
    addToEdges(te1, te2);
    addToEdges(te2, te3);
    addToEdges(te3, te1);
  }
  edges.forEach(([nodeIndex1, nodeIndex2]) => g.addEdge(new GraphEdge(g.nodes[nodeIndex1], g.nodes[nodeIndex2])));
  return g;
};
var SplineSegment = class {
  x1;
  y1;
  x2;
  y2;
  x3;
  y3;
  x4;
  y4;
  constructor(x1, y1, x2, y2, x3, y3, x4, y4) {
    this.x1 = x1;
    this.y1 = y1;
    this.x2 = x2;
    this.y2 = y2;
    this.x3 = x3;
    this.y3 = y3;
    this.x4 = x4;
    this.y4 = y4;
  }
  asSvg(index) {
    const bezier = `C ${this.x2},${this.y2} ${this.x3},${this.y3} ${this.x4},${this.y4}`;
    if (index === 0) {
      return `M ${this.x1},${this.y1} ${bezier}`;
    } else {
      return bezier;
    }
  }
};
var Spline = class {
  segments;
  colour;
  layerNumber;
  constructor(layerNumber, colour) {
    this.segments = [];
    this.colour = colour;
    this.layerNumber = layerNumber;
  }
  addSegment(x1, y1, x2, y2, x3, y3, x4, y4) {
    this.segments.push(new SplineSegment(x1, y1, x2, y2, x3, y3, x4, y4));
  }
  asSvg() {
    return `<path fill="none" stroke="${this.colour}" class="spline" d="${this.segments.map((s, i) => s.asSvg(i)).join(" ")}"/>`;
  }
};
var renderCeltic = (params2) => {
  params2.graphType ||= "Polar";
  params2.width ||= 800;
  params2.height ||= 800;
  params2.margin ||= 50;
  params2.cells ||= 10;
  params2.nbNodesPerOrbit ||= 10;
  params2.nbOrbits ||= 10;
  params2.nbNodes ||= 20;
  params2.seed ||= 3;
  params2.perturbation ||= 0;
  params2.showGraph ||= false;
  params2.palette = ["#522258", "#8C3061", "#C63C51", "#D95F59"];
  let graph;
  switch (params2.graphType) {
    case "Grid":
      graph = makeGridGraph(params2);
      break;
    case "Polar":
      graph = makePolarGraph(params2);
      break;
    case "Random":
      graph = makeRandomGraph(params2);
  }
  const pattern = new Pattern(
    graph,
    params2.shape1,
    params2.shape2,
    params2.palette
  );
  pattern.makeCurves();
  const renderedGraph = params2.showGraph ? `
    <g id="graph" style="fill:none; stroke: #888">
      ${graph.asSvg()}
    </g>
  ` : "";
  return `
    <svg id="svg-canvas" height="${params2.height}" width="${params2.width}" xmlns="http://www.w3.org/2000/svg">
      ${renderedGraph}
      <g id="pattern" style="fill:none; stroke: red; stroke-width: 10">
        ${pattern.splines.map((spline) => spline.asSvg()).join("\n")}
      </g>
    </svg>
  `;
};
var paramsFromWidgets = (controls3) => {
  const params2 = { ...defaultParams };
  params2.graphType = controls3.graphType.val();
  params2.margin = controls3.margin.val();
  params2.shape1 = controls3.shape1.val();
  params2.shape2 = controls3.shape2.val();
  params2.showGraph = controls3.showGraph.val();
  params2.seed = controls3.seed.val();
  params2.nbNodes = controls3.nbNodes.val();
  params2.cells = controls3.cells.val();
  params2.perturbation = controls3.perturbation.val();
  params2.nbOrbits = controls3.nbOrbits.val();
  params2.nbNodesPerOrbit = controls3.nbNodesPerOrbit.val();
  return params2;
};
var render = (params2) => {
  if (!params2) {
    params2 = paramsFromWidgets(controls2);
  }
  params2.width ||= 800;
  params2.height ||= 800;
  updateUrl(params2);
  const graphType = $("graphType");
  activateControls(graphType.value);
  $("canvas").innerHTML = renderCeltic(params2);
};
var controls2 = {};
controls2.graphType = new SelectControl("graphType", {
  name: "",
  value: defaultParams["graphType"],
  choices: ["Polar", "Grid", "Random"],
  callback: function(t) {
    Object.values(controls2).forEach((c) => c.hide());
    paramsPerType[t.val()].forEach((name) => controls2[name].show());
    render();
  }
});
controls2.margin = new NumberControl("margin", {
  name: "Margin",
  value: defaultParams["margin"],
  callback: render,
  min: 0,
  max: 500
});
controls2.shape1 = new NumberControl("shape1", {
  name: "Shape1",
  value: defaultParams["shape1"],
  callback: render,
  min: -2,
  max: 2,
  step: 0.01
});
controls2.shape2 = new NumberControl("shape2", {
  name: "Shape2",
  value: defaultParams["shape2"],
  callback: render,
  min: -2,
  max: 2,
  step: 0.01
});
controls2.perturbation = new NumberControl("perturbation", {
  name: "Perturbation",
  value: defaultParams["perturbation"],
  callback: render,
  min: 0,
  max: 300
});
controls2.showGraph = new CheckboxControl("showGraph", {
  name: "Graph",
  value: defaultParams["showGraph"],
  callback: render
});
controls2.seed = new NumberControl("seed", {
  name: "seed",
  value: defaultParams["seed"] || 0,
  callback: render,
  min: 0,
  max: 500
});
controls2.nbNodes = new NumberControl("nbNodes", {
  name: "Nodes",
  value: defaultParams["nbNodes"] || 3,
  callback: render,
  min: 3,
  max: 40
});
controls2.cells = new NumberControl("cells", {
  name: "Cells",
  value: defaultParams["cells"] || 2,
  callback: render,
  min: 2,
  max: 100
});
controls2.nbOrbits = new NumberControl("nbOrbits", {
  name: "Orbits",
  value: defaultParams["nbOrbits"] || 1,
  callback: render,
  min: 1,
  max: 20
});
controls2.nbNodesPerOrbit = new NumberControl("nbNodesPerOrbit", {
  name: "Nodes per orbit",
  value: defaultParams["nbNodesPerOrbit"] || 3,
  callback: render,
  min: 3,
  max: 20
});
controls2.svgSave = new SvgSaveControl("svgSave", {
  canvasId: "svg-canvas",
  name: "Save SVG",
  saveFilename: "celtic.svg"
});
var paramsPerType = {
  Random: ["seed", "graphType", "margin", "showGraph", "shape1", "shape2", "nbNodes", "svgSave"],
  Grid: ["seed", "graphType", "margin", "showGraph", "shape1", "shape2", "cells", "perturbation", "svgSave"],
  Polar: ["seed", "graphType", "margin", "showGraph", "shape1", "shape2", "nbOrbits", "nbNodesPerOrbit", "perturbation", "svgSave"]
};
var activateControls = (graphType) => {
  Object.values(controls2).forEach((c) => c.hide());
  paramsPerType[graphType].forEach((name) => controls2[name].show());
};
var params = paramsFromUrl(defaultParams);
activateControls(params.graphType);
Object.keys(params).forEach((key) => {
  if (key in controls2) {
    const index = key;
    const paramValue = params[index];
    controls2[key].set(paramValue);
  }
});
$("canvas").innerHTML = renderCeltic(params);
