"use strict";
(() => {
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
            var X = me.x, i = me.i, t, v, w;
            t = X[i];
            t ^= t >>> 7;
            v = t ^ t << 24;
            t = X[i + 1 & 7];
            v ^= t ^ t >>> 10;
            t = X[i + 3 & 7];
            v ^= t ^ t >>> 3;
            t = X[i + 4 & 7];
            v ^= t ^ t << 7;
            t = X[i + 7 & 7];
            t = t ^ t << 13;
            v ^= t ^ t << 9;
            X[i] = v;
            me.i = i + 1 & 7;
            return v;
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
            var w = me.w, X = me.X, i = me.i, t, v;
            me.w = w = w + 1640531527 | 0;
            v = X[i + 34 & 127];
            t = X[i = i + 1 & 127];
            v ^= v << 13;
            t ^= t << 17;
            v ^= v >>> 15;
            t ^= t >>> 12;
            v = X[i] = v ^ t;
            me.i = i;
            return v + (w ^ w >>> 16) | 0;
          };
          function init(me2, seed2) {
            var t, v, i, j, w, X = [], limit = 128;
            if (seed2 === (seed2 | 0)) {
              v = seed2;
              seed2 = null;
            } else {
              seed2 = seed2 + "\0";
              v = 0;
              limit = Math.max(limit, seed2.length);
            }
            for (i = 0, j = -32; j < limit; ++j) {
              if (seed2) v ^= seed2.charCodeAt((j + 32) % seed2.length);
              if (j === 0) w = v;
              v ^= v << 10;
              v ^= v >>> 15;
              v ^= v << 4;
              v ^= v >>> 13;
              if (j >= 0) {
                w = w + 1640531527 | 0;
                t = X[j & 127] ^= v + w;
                i = 0 == t ? i + 1 : 0;
              }
            }
            if (i >= 128) {
              X[(seed2 && seed2.length || 0) & 127] = -1;
            }
            i = 127;
            for (j = 4 * 128; j > 0; --j) {
              v = X[i + 34 & 127];
              t = X[i = i + 1 & 127];
              v ^= v << 13;
              t ^= t << 17;
              v ^= v >>> 15;
              t ^= t >>> 12;
              X[i] = v ^ t;
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

  // src/boids.ts
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

  // src/controls.ts
  var $ = (id) => document.getElementById(id);
  var NumberControl = class {
    #value;
    #wrapperEl;
    #widgetEl;
    #valueEl;
    constructor(params2) {
      this.#value = params2.value;
      this.#createHtmlControl(params2.name, params2.label, params2.value, params2.min, params2.max, params2.step);
      this.#widgetEl = $(params2.name);
      this.#valueEl = $(`${params2.name}-value`);
      this.#wrapperEl = $(`${params2.name}-control`);
      this.#widgetEl.onchange = (event) => {
        this.#value = parseFloat(event.target.value);
        this.#valueEl.innerText = this.#value.toString();
        params2.renderFn();
      };
    }
    #createHtmlControl(name, label, value, min, max, step) {
      const html = [];
      html.push(`<div class="control" id="${name}-control">`);
      const stepAttr = step ? `step="${step}"` : "";
      html.push(`
      <input id="${name}" type="range" min="${min}" max="${max}" value="${value}" ${stepAttr}"/>
      ${label}
      <span id="${name}-value">${value}</span>
    `);
      html.push("</div>");
      const anchorElement = $("controls");
      if (anchorElement) {
        anchorElement.insertAdjacentHTML("beforeend", html.join(""));
      }
    }
    set(newValue) {
      this.#value = newValue;
      this.#valueEl.innerText = newValue.toString();
    }
    val() {
      return this.#value;
    }
    show() {
      this.#wrapperEl.style.display = "block";
    }
    hide() {
      this.#wrapperEl.style.display = "none";
    }
  };
  var CheckboxControl = class {
    #value;
    #wrapperEl;
    #widgetEl;
    constructor(params2) {
      this.#value = params2.value;
      this.#createHtmlControl(params2.name, params2.label, params2.value);
      this.#widgetEl = $(params2.name);
      this.#wrapperEl = $(`${params2.name}-control`);
      this.#widgetEl.onchange = (event) => {
        this.#value = event.target.checked;
        params2.renderFn();
      };
    }
    #createHtmlControl(name, label, value) {
      const html = [];
      html.push(`<div class="control" id="${name}-control">`);
      html.push(`<input type="checkbox" id="${name}" ${value ? "selected" : ""}> ${label}`);
      html.push(`</div>`);
      const anchorElement = $("controls");
      if (anchorElement) {
        anchorElement.insertAdjacentHTML("beforeend", html.join(""));
      }
    }
    set(newValue) {
      this.#value = newValue;
      this.#widgetEl.checked = newValue;
    }
    val() {
      return this.#value;
    }
    show() {
      this.#wrapperEl.style.display = "block";
    }
    hide() {
      this.#wrapperEl.style.display = "none";
    }
  };
  var SvgSaveControl = class {
    #wrapperEl;
    #createHtmlControl(name, label) {
      const html = `
      <div class="control" id="${name}-control">
        <button id="${name}">${label}</button>
      </div>
    `;
      const anchorElement = $("controls");
      if (anchorElement) {
        anchorElement.insertAdjacentHTML("beforeend", html);
      }
    }
    constructor(params2) {
      this.#createHtmlControl(params2.name, params2.label);
      this.#wrapperEl = $(`${params2.name}-control`);
      $(params2.name).onclick = () => {
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
    show() {
      this.#wrapperEl.style.display = "block";
    }
    hide() {
      this.#wrapperEl.style.display = "none";
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

  // src/boids.ts
  var defaultParams = {
    width: 800,
    height: 800,
    zoom: 0,
    seed: 128,
    iterations: 400,
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
    showAttractors: false
  };
  var POSITIONX = 0;
  var POSITIONY = 1;
  var SPEEDX = 2;
  var SPEEDY = 3;
  var ACCELERATIONX = 4;
  var ACCELERATIONY = 5;
  var Boids = class {
    rng;
    width;
    height;
    speedLimit;
    speedLimitRoot;
    accelerationLimit;
    accelerationLimitRoot;
    separationDistance;
    alignmentDistance;
    alignmentForce;
    cohesionDistance;
    cohesionForce;
    separationForce;
    attractors;
    iterations;
    startIteration;
    nboids;
    boids;
    constructor(opts) {
      opts = opts || {};
      this.rng = (0, import_seedrandom.default)(opts.seed.toString()) || Math.random;
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
      this.attractors = opts.showAttractors ? this.#makeAttractors() : [];
      this.iterations = opts.iterations || 100;
      this.startIteration = opts.startIteration || 0;
      this.nboids = opts.nboids || 10;
      this.boids = [];
      for (let i = 0, l = opts.nboids; i < l; i += 1) {
        this.boids[i] = [
          (this.rng() - 0.5) * this.width / 10,
          (this.rng() - 0.5) * this.height / 10,
          // position
          0,
          0,
          // speed
          0,
          0
          // acceleration
        ];
      }
    }
    #makeAttractors() {
      const attractors = [];
      for (let i = 0; i < 10; i++) {
        const x = (this.rng() - 0.5) * this.width;
        const y = (this.rng() - 0.5) * this.height;
        attractors.push([x, y, 100, 2]);
      }
      return attractors;
    }
    tick() {
      let boids = this.boids, sepDist = this.separationDistance, sepForce = this.separationForce, cohDist = this.cohesionDistance, cohForce = this.cohesionForce, aliDist = this.alignmentDistance, aliForce = this.alignmentForce, speedLimit = this.speedLimit, accelerationLimit = this.accelerationLimit, accelerationLimitRoot = this.accelerationLimitRoot, speedLimitRoot = this.speedLimitRoot, size = boids.length, current = size, sforceX, sforceY, cforceX, cforceY, aforceX, aforceY, spareX, spareY, attractors = this.attractors, attractorCount = attractors.length, attractor, distSquared, currPos, length, target, ratio;
      while (current--) {
        sforceX = 0;
        sforceY = 0;
        cforceX = 0;
        cforceY = 0;
        aforceX = 0;
        aforceY = 0;
        currPos = boids[current];
        target = attractorCount;
        while (target--) {
          attractor = attractors[target];
          spareX = currPos[0] - attractor[0];
          spareY = currPos[1] - attractor[1];
          distSquared = spareX * spareX + spareY * spareY;
          if (distSquared < attractor[2] * attractor[2]) {
            length = hypot(spareX, spareY);
            boids[current][SPEEDX] -= attractor[3] * spareX / length || 0;
            boids[current][SPEEDY] -= attractor[3] * spareY / length || 0;
          }
        }
        target = size;
        while (target--) {
          if (target === current) continue;
          spareX = currPos[0] - boids[target][0];
          spareY = currPos[1] - boids[target][1];
          distSquared = spareX * spareX + spareY * spareY;
          if (distSquared < sepDist) {
            sforceX += spareX;
            sforceY += spareY;
          } else {
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
        length = hypot(sforceX, sforceY);
        boids[current][ACCELERATIONX] += sepForce * sforceX / length || 0;
        boids[current][ACCELERATIONY] += sepForce * sforceY / length || 0;
        length = hypot(cforceX, cforceY);
        boids[current][ACCELERATIONX] -= cohForce * cforceX / length || 0;
        boids[current][ACCELERATIONY] -= cohForce * cforceY / length || 0;
        length = hypot(aforceX, aforceY);
        boids[current][ACCELERATIONX] -= aliForce * aforceX / length || 0;
        boids[current][ACCELERATIONY] -= aliForce * aforceY / length || 0;
      }
      current = size;
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
    }
  };
  function hypot(a, b) {
    a = Math.abs(a);
    b = Math.abs(b);
    const lo = Math.min(a, b);
    const hi = Math.max(a, b);
    return hi + 3 * lo / 32 + Math.max(0, 2 * lo - hi) / 8 + Math.max(0, 4 * lo - hi) / 16;
  }
  var renderAttractors = function(attractors) {
    const attractorMarkup = attractors.map((attractor) => {
      const color = attractor[3] < 0 ? "#fdd" : "#dfd";
      return `<circle cx="${attractor[0]}" cy="${attractor[1]}" r="${attractor[2]}" fill="${color}"/>`;
    });
    return `<g id="attractors">${attractorMarkup}</g>`;
  };
  var renderBoids = (params2) => {
    const b = new Boids(params2);
    const boids = b.boids;
    for (let iteration = 0; iteration < b.startIteration; iteration++) {
      b.tick();
    }
    const boidPaths = [];
    for (let i = 0; i < boids.length; i++) {
      boidPaths[i] = [{
        x: boids[i][POSITIONX],
        y: boids[i][POSITIONY]
      }];
    }
    for (let iteration = b.startIteration; iteration < b.startIteration + b.iterations; iteration++) {
      b.tick();
      for (let i = 0; i < boids.length; i++) {
        const lastPos = boidPaths[i][boidPaths[i].length - 1];
        boidPaths[i].push({
          x: (boids[i][POSITIONX] + lastPos.x) / 2,
          y: (boids[i][POSITIONY] + lastPos.y) / 2
        });
        boidPaths[i].push({ x: boids[i][POSITIONX], y: boids[i][POSITIONY] });
      }
    }
    const svgPaths = boidPaths.map((ps) => {
      let d = `M ${ps[0].x} ${ps[0].y} L ${ps[1].x} ${ps[1].y}`;
      for (let i = 2; i < ps.length - 1; i += 2) {
        d = d + `C ${ps[i].x} ${ps[i].y}, ${ps[i].x} ${ps[i].y}, ${ps[i + 1].x} ${ps[i + 1].y} `;
      }
      return `<path d="${d}" vector-effect="non-scaling-stroke"/>
`;
    });
    const zoomFactor = Math.exp(-params2.zoom / 10);
    const vboxX = -params2.width / 2 * zoomFactor;
    const vboxY = -params2.height / 2 * zoomFactor;
    const vboxW = params2.width * zoomFactor;
    const vboxH = params2.height * zoomFactor;
    return `
    <svg id="svg-canvas"
        xmlns="http://www.w3.org/2000/svg"
        height="${params2.height}"
        width="${params2.width}"
        viewBox="${vboxX} ${vboxY} ${vboxW} ${vboxH}"
        style="border: 1px solid black">
      ${params2.showAttractors ? renderAttractors(b.attractors) : ""}
      <g id="pattern" style="fill:none; stroke: black; stroke-width: 0.5">
        ${svgPaths.join("")}
      </g>
    </svg>
  `;
  };
  var paramsFromWidgets = () => {
    const params2 = { ...defaultParams };
    params2.zoom = controls.zoom.val();
    params2.seed = controls.seed.val();
    params2.nboids = controls.nboids.val();
    params2.speedLimit = controls.speedLimit.val();
    params2.cohesionForce = controls.cohesionForce.val();
    params2.cohesionDistance = controls.cohesionDistance.val();
    params2.iterations = controls.iterations.val();
    params2.startIteration = controls.startIteration.val();
    params2.showAttractors = controls.showAttractors.val();
    return params2;
  };
  var render = (params2) => {
    if (!params2) {
      params2 = paramsFromWidgets();
    }
    params2.width ||= defaultParams.width;
    params2.height ||= defaultParams.height;
    updateUrl(params2);
    $("canvas").innerHTML = renderBoids(params2);
  };
  var controls = {
    zoom: new NumberControl({
      name: "zoom",
      label: "Zoom",
      value: defaultParams["zoom"],
      renderFn: render,
      min: -20,
      max: 20
    }),
    seed: new NumberControl({ name: "seed", label: "RNG seed", value: defaultParams["seed"], renderFn: render, min: 0, max: 500 }),
    nboids: new NumberControl({ name: "nboids", label: "Boids", value: defaultParams["nboids"], renderFn: render, min: 1, max: 100 }),
    iterations: new NumberControl({ name: "iterations", label: "Iterations", value: defaultParams["iterations"], renderFn: render, min: 1, max: 1e3 }),
    startIteration: new NumberControl({ name: "startIteration", label: "Start iteration", value: defaultParams["startIteration"], renderFn: render, min: 1, max: 1e3 }),
    speedLimit: new NumberControl({ name: "speedLimit", label: "Max speed", value: defaultParams["speedLimit"], renderFn: render, min: 0, max: 20, step: 0.1 }),
    cohesionForce: new NumberControl({ name: "cohesionForce", label: "Cohesion", value: defaultParams["cohesionForce"], renderFn: render, min: 0, max: 1, step: 0.01 }),
    cohesionDistance: new NumberControl({ name: "cohesionDistance", label: "Cohesion distance", value: defaultParams["cohesionDistance"], renderFn: render, min: 10, max: 300 }),
    showAttractors: new CheckboxControl({ name: "showAttractors", label: "Attractors", value: defaultParams["showAttractors"], renderFn: render }),
    svgSave: new SvgSaveControl({
      name: "svgSave",
      canvasId: "svg-canvas",
      label: "Save SVG",
      saveFilename: "boids.svg"
    })
  };
  var params = paramsFromUrl(defaultParams);
  controls.zoom.set(params.zoom);
  controls.seed.set(params.seed);
  controls.cohesionForce.set(params.cohesionForce);
  controls.cohesionDistance.set(params.cohesionDistance);
  controls.iterations.set(params.iterations);
  controls.startIteration.set(params.startIteration);
  controls.speedLimit.set(params.speedLimit);
  controls.nboids.set(params.nboids);
  controls.showAttractors.set(params.showAttractors);
  updateUrl(params);
  $("canvas").innerHTML = renderBoids(params);
})();
