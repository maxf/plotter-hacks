"use strict";
(() => {
  // src/controls.ts
  var $ = (id) => document.getElementById(id);
  var Control = class {
    #name;
    #wrapperEl;
    #widgetEl;
    #valueEl;
    #type;
    #value;
    //constructor(name: string, label: string, type: ControlType, value: any) {
    constructor(name, label, type, value, renderFn, options) {
      this.#name = name;
      this.#type = type;
      this.#value = value;
      this.#createHtmlControl("controls", label, options);
      this.#wrapperEl = document.getElementById(`${name}-control`);
      this.#widgetEl = document.getElementById(name);
      if (this.#type === "file") {
        this.#valueEl = document.getElementById(`${name}-value`);
        this.#valueEl.src = this.#value;
      } else {
        this.#widgetEl.value = value;
      }
      if (this.#type === "number") {
        this.#valueEl = document.getElementById(`${name}-value`);
        this.#valueEl.innerText = value;
      }
      this.#widgetEl.onchange = (event) => {
        this.#value = this.#type === "number" ? parseInt(event.target.value) : event.target.value;
        this.#widgetEl.value = this.#value;
        if (this.#valueEl) {
          this.#valueEl.innerText = this.#value;
        }
        $("canvas").innerHTML = renderFn();
      };
    }
    #createHtmlControl(anchor, label, options) {
      const html = [];
      html.push(`<span class="control" id="${this.#name}-control">`);
      switch (this.#type) {
        case "number":
          const step = options.step ? `step="${options.step}"` : "";
          html.push(`
        <input id="${this.#name}" type="range" min="${options.min}" max="${options.max}" value="${this.#value}" ${step}"/>
        ${label}
        <span id="${this.#name}-value">${this.#value}</span>
      `);
          break;
        case "boolean":
          html.push(`<input type="checkbox" id="${this.#name}"> ${label}`);
          break;
        case "select":
          if (label) html.push(`${label}: `);
          html.push(`<select id="${this.#name}">`);
          options.choices.forEach((choice) => html.push(`<option>${choice}</option>`));
          html.push("</select>");
          break;
        case "file":
          html.push(`
          <input id="${this.#name}" type="file" accept="image/*;capture=camera"/>
          <img id="${this.#name}-value" height="100px" src="${this.#value}"/> <!-- must be visible -->
        `);
          break;
        default:
          console.warning("unknown control type", this.#type);
      }
      html.push(`<br/></span>`);
      const anchorElement = $(anchor);
      if (anchorElement) {
        anchorElement.insertAdjacentHTML("beforeend", html.join(""));
      }
    }
    set(newValue) {
      this.#value = newValue;
      if (this.#type !== "file") {
        this.#widgetEl.value = newValue;
      }
      if (this.#valueEl) {
        this.#valueEl.innerText = newValue;
      }
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
  var paramsFromUrl = (defaults) => {
    const params2 = new URLSearchParams(window.location.search);
    const result = defaults;
    for (const [key, value] of params2) {
      const num = Number(value);
      if (!isNaN(num)) {
        result[key] = num;
      } else if (value === "true") {
        result[key] = true;
      } else if (value === "false") {
        result[key] = false;
      } else {
        result[key] = value;
      }
    }
    return result;
  };
  var updateUrl = (params2) => {
    const url = new URL(window.location.toString());
    url.search = "";
    Object.keys(params2).forEach((key) => {
      url.searchParams.set(key, params2[key]);
    });
    history.pushState(null, "", url);
  };

  // src/excoffizer.ts
  var defaultParams = {
    inputImage: "images/portrait.png",
    width: 800,
    height: 800
  };
  var paramsFromWidgets = () => {
    const params2 = { ...defaultParams };
    params2.inputImage = controls.inputImage.val();
    return params2;
  };
  var render = (params2) => {
    if (!params2) {
      params2 = paramsFromWidgets();
    }
    params2.width ||= 800;
    params2.height ||= 800;
    updateUrl(params2);
    return `<svg id="svg-canvas" height="${params2.height}" width="${params2.width}" xmlns="http://www.w3.org/2000/svg"></svg>`;
  };
  var controls = {
    inputImage: new Control("inputImage", "Image", "file", defaultParams["inputImage"], render)
  };
  var params = paramsFromUrl(defaultParams);
  Object.keys(params).forEach((key) => {
    if (key in controls) {
      controls[key].set(params[key]);
    }
  });
  $("canvas").innerHTML = render(params);
})();
