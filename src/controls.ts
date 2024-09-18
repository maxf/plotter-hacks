const $ = (id: string) => document.getElementById(id)!;

type ControlType = 'string'|'select'|'boolean'|'number'|'file';
class Control {
  #name: string;
  #wrapperEl: HTMLDivElement;
  #widgetEl: HTMLInputElement;
  #valueEl: HTMLSpanElement | undefined;
  #type: ControlType;
  #value: any;

  //constructor(name: string, label: string, type: ControlType, value: any) {
  constructor(name: string, label: string, type: ControlType, value: any, renderFn: any, options: any) {
    this.#name = name;
    this.#type = type;
    this.#value = value;
    this.#createHtmlControl("controls", label, options);
    this.#wrapperEl = document.getElementById(`${name}-control`) as HTMLDivElement;
    this.#widgetEl = document.getElementById(name) as HTMLInputElement;
    if (this.#type === 'file') {
      this.#valueEl = document.getElementById(`${name}-value`) as HTMLImgElement;
      this.#valueEl.src = this.#value;
    } else {
      this.#widgetEl.value = value;
    }
    if (this.#type === 'number') {
      this.#valueEl = document.getElementById(`${name}-value`) as HTMLSpanElement;
      this.#valueEl.innerText = value;
    }
    this.#widgetEl.onchange = event => {
      this.#value = this.#type === 'number'
        ? parseInt((event.target as HTMLInputElement).value)
        : (event.target as HTMLInputElement).value;
      this.#widgetEl.value = this.#value;
      if (this.#valueEl) {
        this.#valueEl.innerText = this.#value;
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
        console.warning('unknown control type', this.#type);
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

const paramsFromUrl = (defaults: any) => {
  const params = new URLSearchParams(window.location.search);
  const result = defaults;
  for (const [key, value] of params) {
    const num = Number(value);
    if (!isNaN(num)) {
      result[key] = num;
    } else if (value === 'true') {
      result[key] = true;
    } else if (value === 'false') {
      result[key] = false;
    } else {
      result[key] = value;
    }
  }
  return result;
};

const updateUrl = (params: any) => {
  const url = new URL(window.location.toString());
  url.search = '';
  Object.keys(params).forEach(key => {
    url.searchParams.set(key, params[key]);
  });
  history.pushState(null, '', url);
};

const saveSvg = function() {
  const svgEl = $('svg-canvas');
  svgEl.setAttribute("xmlns", "http://www.w3.org/2000/svg");
  var svgData = svgEl.outerHTML;
  var preface = '<?xml version="1.0" standalone="no"?>';
  var svgBlob = new Blob([preface, svgData], {type:"image/svg+xml;charset=utf-8"});
  var svgUrl = URL.createObjectURL(svgBlob);
  var downloadLink = document.createElement("a");
  downloadLink.href = svgUrl;
  downloadLink.download = 'celtic.svg';
  document.body.appendChild(downloadLink);
  downloadLink.click();
  document.body.removeChild(downloadLink);
}

export { Control, paramsFromUrl, saveSvg, updateUrl, $ };
