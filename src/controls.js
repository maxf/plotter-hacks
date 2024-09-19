"use strict";
var __classPrivateFieldSet = (this && this.__classPrivateFieldSet) || function (receiver, state, value, kind, f) {
    if (kind === "m") throw new TypeError("Private method is not writable");
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a setter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot write private member to an object whose class did not declare it");
    return (kind === "a" ? f.call(receiver, value) : f ? f.value = value : state.set(receiver, value)), value;
};
var __classPrivateFieldGet = (this && this.__classPrivateFieldGet) || function (receiver, state, kind, f) {
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a getter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot read private member from an object whose class did not declare it");
    return kind === "m" ? f : kind === "a" ? f.call(receiver) : f ? f.value : state.get(receiver);
};
var _NumberControl_instances, _NumberControl_name, _NumberControl_value, _NumberControl_wrapperEl, _NumberControl_widgetEl, _NumberControl_valueEl, _NumberControl_createHtmlControl, _SelectControl_instances, _SelectControl_name, _SelectControl_value, _SelectControl_wrapperEl, _SelectControl_widgetEl, _SelectControl_createHtmlControl, _CheckboxControl_instances, _CheckboxControl_name, _CheckboxControl_value, _CheckboxControl_wrapperEl, _CheckboxControl_widgetEl, _CheckboxControl_createHtmlControl;
Object.defineProperty(exports, "__esModule", { value: true });
exports.$ = exports.updateUrl = exports.saveSvg = exports.paramsFromUrl = exports.CheckboxControl = exports.SelectControl = exports.NumberControl = void 0;
var $ = function (id) { return document.getElementById(id); };
exports.$ = $;
var NumberControl = /** @class */ (function () {
    function NumberControl(params) {
        //name: string,
        //label: string,
        //value: number,
        //min: number,
        //max: number,
        //step: number:
        //renderFn: any
        var _this = this;
        _NumberControl_instances.add(this);
        _NumberControl_name.set(this, void 0);
        _NumberControl_value.set(this, void 0);
        _NumberControl_wrapperEl.set(this, void 0);
        _NumberControl_widgetEl.set(this, void 0);
        _NumberControl_valueEl.set(this, void 0);
        __classPrivateFieldSet(this, _NumberControl_name, params.name, "f");
        __classPrivateFieldSet(this, _NumberControl_value, params.value, "f");
        this. = params.min;
        this. = params.max;
        this. = params.step;
        __classPrivateFieldSet(this, _NumberControl_widgetEl, $(name), "f");
        __classPrivateFieldSet(this, _NumberControl_valueEl, $("".concat(name, "-value")), "f");
        __classPrivateFieldGet(this, _NumberControl_instances, "m", _NumberControl_createHtmlControl).call(this, params.name, params.label, params.value, params.min, params.max, params.step);
        __classPrivateFieldGet(this, _NumberControl_widgetEl, "f").onchange = function (event) {
            __classPrivateFieldSet(_this, _NumberControl_value, event.target.value, "f");
            __classPrivateFieldGet(_this, _NumberControl_valueEl, "f").innerText = __classPrivateFieldGet(_this, _NumberControl_value, "f");
            $('canvas').innerHTML = params.renderFn();
        };
    }
    NumberControl.prototype.set = function (newValue) {
        __classPrivateFieldSet(this, _NumberControl_value, newValue, "f");
        __classPrivateFieldGet(this, _NumberControl_valueEl, "f").innerText = newValue;
    };
    NumberControl.prototype.val = function () {
        return __classPrivateFieldGet(this, _NumberControl_value, "f");
    };
    NumberControl.prototype.show = function () {
        __classPrivateFieldGet(this, _NumberControl_wrapperEl, "f").style.display = 'block';
    };
    NumberControl.prototype.hide = function () {
        __classPrivateFieldGet(this, _NumberControl_wrapperEl, "f").style.display = 'none';
    };
    return NumberControl;
}());
exports.NumberControl = NumberControl;
_NumberControl_name = new WeakMap(), _NumberControl_value = new WeakMap(), _NumberControl_wrapperEl = new WeakMap(), _NumberControl_widgetEl = new WeakMap(), _NumberControl_valueEl = new WeakMap(), _NumberControl_instances = new WeakSet(), _NumberControl_createHtmlControl = function _NumberControl_createHtmlControl(name, label, value, min, max, step) {
    var html = [];
    html.push("<span class=\"control\" id=\"".concat(name, "-control\">"));
    var step = options.step ? "step=\"".concat(options.step, "\"") : '';
    html.push("\n      <input id=\"".concat(name, "\" type=\"range\" min=\"").concat(min, "\" max=\"").concat(max, "\" value=\"").concat(value, "\" ").concat(step, "\"/>\n      ").concat(label, "\n      <span id=\"").concat(name, "-value\">").concat(value, "</span>\n    "));
    html.push('<br/></span>');
    // Find the anchor element and insert the constructed HTML as the last child
    var anchorElement = $('controls');
    if (anchorElement) {
        anchorElement.insertAdjacentHTML('beforeend', html.join(''));
    }
};
var SelectControl = /** @class */ (function () {
    function SelectControl(params) {
        //name: string,
        //label: string,
        //value: number,
        //renderFn: any
        //choices: string[]
        var _this = this;
        _SelectControl_instances.add(this);
        _SelectControl_name.set(this, void 0);
        _SelectControl_value.set(this, void 0);
        _SelectControl_wrapperEl.set(this, void 0);
        _SelectControl_widgetEl.set(this, void 0);
        __classPrivateFieldSet(this, _SelectControl_name, params.name, "f");
        __classPrivateFieldSet(this, _SelectControl_value, params.value, "f");
        __classPrivateFieldSet(this, _SelectControl_widgetEl, $(name), "f");
        __classPrivateFieldGet(this, _SelectControl_instances, "m", _SelectControl_createHtmlControl).call(this, params.name, params.label, params.value, params.choices);
        __classPrivateFieldGet(this, _SelectControl_widgetEl, "f").onchange = function (event) {
            __classPrivateFieldSet(_this, _SelectControl_value, event.target.value, "f");
            $('canvas').innerHTML = params.renderFn();
        };
    }
    SelectControl.prototype.set = function (newValue) {
        __classPrivateFieldSet(this, _SelectControl_value, newValue, "f");
        // TODO: move the 'selected' attiribute
    };
    SelectControl.prototype.val = function () {
        return __classPrivateFieldGet(this, _SelectControl_value, "f");
    };
    SelectControl.prototype.show = function () {
        __classPrivateFieldGet(this, _SelectControl_wrapperEl, "f").style.display = 'block';
    };
    SelectControl.prototype.hide = function () {
        __classPrivateFieldGet(this, _SelectControl_wrapperEl, "f").style.display = 'none';
    };
    return SelectControl;
}());
exports.SelectControl = SelectControl;
_SelectControl_name = new WeakMap(), _SelectControl_value = new WeakMap(), _SelectControl_wrapperEl = new WeakMap(), _SelectControl_widgetEl = new WeakMap(), _SelectControl_instances = new WeakSet(), _SelectControl_createHtmlControl = function _SelectControl_createHtmlControl(name, label, value, choices) {
    var html = [];
    html.push("<span class=\"control\" id=\"".concat(name, "-control\">"));
    html.push("<select id=\"".concat(__classPrivateFieldGet(this, _SelectControl_name, "f"), "\">"));
    options.choices.forEach(function (choice) {
        return html.push("<option ".concat(choice === value ? 'selected' : '', ">").concat(choice, "</option>"));
    });
    html.push('</select>');
    html.push('<br/></span>');
    // Find the anchor element and insert the constructed HTML as the last child
    var anchorElement = $('controls');
    if (anchorElement) {
        anchorElement.insertAdjacentHTML('beforeend', html.join(''));
    }
};
var CheckboxControl = /** @class */ (function () {
    function CheckboxControl(params) {
        //name: string,
        //label: string,
        //value: boolean,
        //renderFn: any
        var _this = this;
        _CheckboxControl_instances.add(this);
        _CheckboxControl_name.set(this, void 0);
        _CheckboxControl_value.set(this, void 0);
        _CheckboxControl_wrapperEl.set(this, void 0);
        _CheckboxControl_widgetEl.set(this, void 0);
        __classPrivateFieldSet(this, _CheckboxControl_name, params.name, "f");
        __classPrivateFieldSet(this, _CheckboxControl_value, params.value, "f");
        __classPrivateFieldSet(this, _CheckboxControl_widgetEl, $(name), "f");
        __classPrivateFieldGet(this, _CheckboxControl_instances, "m", _CheckboxControl_createHtmlControl).call(this, params.name, params.label, params.value);
        __classPrivateFieldGet(this, _CheckboxControl_widgetEl, "f").onchange = function (event) {
            __classPrivateFieldSet(_this, _CheckboxControl_value, event.target.value, "f");
            $('canvas').innerHTML = params.renderFn();
        };
    }
    return CheckboxControl;
}());
exports.CheckboxControl = CheckboxControl;
_CheckboxControl_name = new WeakMap(), _CheckboxControl_value = new WeakMap(), _CheckboxControl_wrapperEl = new WeakMap(), _CheckboxControl_widgetEl = new WeakMap(), _CheckboxControl_instances = new WeakSet(), _CheckboxControl_createHtmlControl = function _CheckboxControl_createHtmlControl(anchor, label, value) {
    var html = [];
    html.push("<span class=\"control\" id=\"".concat(__classPrivateFieldGet(this, _CheckboxControl_name, "f"), "-control\">"));
    html.push("<input type=\"checkbox\" id=\"".concat(__classPrivateFieldGet(this, _CheckboxControl_name, "f"), "\"> ").concat(label));
    html.push("<br/></span>");
    // Find the anchor element and insert the constructed HTML as the last child
    var anchorElement = $(anchor);
    if (anchorElement) {
        anchorElement.insertAdjacentHTML('beforeend', html.join(''));
    }
};
//=====================================================
/*
class Control {
  #name: string;
  #wrapperEl: HTMLDivElement;
  #widgetEl: HTMLInputElement;
  #valueEl: HTMLSpanElement | undefined;
  #type: ControlType;
  #value: any;

  constructor(name: string, label: string, type: ControlType, value: any, renderFn: any, options?: any) {
    this.#name = name;
    this.#type = type;
    this.#value = value;
    this.#createHtmlControl("controls", label, options);
    this.#wrapperEl = document.getElementById(`${name}-control`) as HTMLDivElement;
    this.#widgetEl = document.getElementById(name) as HTMLInputElement;
    if (type === 'file') {
      this.#valueEl = document.getElementById(`${name}-value`) as HTMLImageElement;
      (this.#valueEl as HTMLImageElement).src = this.#value;
    } else {
      this.#widgetEl.value = value;
    }
    if (this.#type === 'number') {
      this.#valueEl = document.getElementById(`${name}-value`) as HTMLSpanElement;
      this.#valueEl.innerText = value;
    }
    this.#widgetEl.onchange = event => {
      switch (this.#type) {
        case 'string':
          this.#value = (event.target as HTMLInputElement).value;
          this.#valueEl.innerText = this.#value;
          break;
        case 'number':
          this.#value = parseInt((event.target as HTMLInputElement).value);
          this.#valueEl.innerText = this.#value;
          break;
        case 'boolean':
          this.#value = (event.target as HTMLInputElement).value;
          break;
        case 'file':
          this.#value = (event.target as HTMLInputElement).files[0];
          this.#valueEl.innerText = this.#value;
          break;
        case 'select':
          this.#value = (event.target as HTMLInputElement).value;
          break;
      }
      $('canvas').innerHTML = renderFn();
    };
  }


  #createHtmlControl(anchor: string, label: string, options: any) {
    const html = [];
    html.push(`<span class="control" id="${this.#name}-control">`);
    switch (this.#type) {
      case 'number':
        const step = options.step ? `step="${options.step}"` : '';
        html.push(`
        <input id="${this.#name}" type="range" min="${options.min}" max="${options.max}" value="${this.#value}" ${step}"/>
        ${label}
        <span id="${this.#name}-value">${this.#value}</span>
      `);
        break;
      case 'boolean':
        html.push(`<input type="checkbox" id="${this.#name}"> ${label}`);
        break;
      case 'select':
        if (label) html.push(`${label}: `);
        html.push(`<select id="${this.#name}">`);
        options.choices.forEach((choice: string) => html.push(`<option>${choice}</option>`));
        html.push('</select>');
        break;
      case 'file':
        html.push(`
          <input id="${this.#name}" type="file" accept="image/*;capture=camera"/>
          <img id="${this.#name}-value" height="100px" src="${this.#value}"/> <!-- must be visible -->
        `);
        break;
      default:
        console.warn('unknown control type', this.#type);
    }
    html.push(`<br/></span>`);

    // Find the anchor element and insert the constructed HTML as the last child
    const anchorElement = $(anchor);
    if (anchorElement) {
      anchorElement.insertAdjacentHTML('beforeend', html.join(''));
    }
  }

  set(newValue : number|string|boolean) {
    this.#value = newValue;
    if (this.#type !== 'file') {
      this.#widgetEl.value = newValue as string;
    }
    if (this.#valueEl) {
      this.#valueEl.innerText = newValue as string;
    }
  }

  val(): number|string|boolean {
    return this.#value;
  }

  show() {
    this.#wrapperEl.style.display = 'block';
  }

  hide() {
    this.#wrapperEl.style.display = 'none';
  }
}
 */
var paramsFromUrl = function (defaults) {
    var params = new URLSearchParams(window.location.search);
    var result = defaults;
    for (var _i = 0, params_1 = params; _i < params_1.length; _i++) {
        var _a = params_1[_i], key = _a[0], value = _a[1];
        var num = Number(value);
        if (!isNaN(num)) {
            result[key] = num;
        }
        else if (value === 'true') {
            result[key] = true;
        }
        else if (value === 'false') {
            result[key] = false;
        }
        else {
            result[key] = value;
        }
    }
    return result;
};
exports.paramsFromUrl = paramsFromUrl;
var updateUrl = function (params) {
    var url = new URL(window.location.toString());
    url.search = '';
    Object.keys(params).forEach(function (key) {
        url.searchParams.set(key, params[key]);
    });
    history.pushState(null, '', url);
};
exports.updateUrl = updateUrl;
var saveSvg = function () {
    var svgEl = $('svg-canvas');
    svgEl.setAttribute("xmlns", "http://www.w3.org/2000/svg");
    var svgData = svgEl.outerHTML;
    var preface = '<?xml version="1.0" standalone="no"?>';
    var svgBlob = new Blob([preface, svgData], { type: "image/svg+xml;charset=utf-8" });
    var svgUrl = URL.createObjectURL(svgBlob);
    var downloadLink = document.createElement("a");
    downloadLink.href = svgUrl;
    downloadLink.download = 'celtic.svg';
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
};
exports.saveSvg = saveSvg;
