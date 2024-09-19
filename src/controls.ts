const $ = (id: string) => document.getElementById(id)!;

class NumberControl {
  #value: number;
  #wrapperEl: HTMLDivElement;
  #widgetEl: HTMLInputElement;
  #valueEl: HTMLSpanElement;

  constructor(params: any) {

    //name: string,
    //label: string,
    //value: number,
    //min: number,
    //max: number,
    //step: number:
    //renderFn: any

    this.#value = params.value;
    this.#createHtmlControl(params.name, params.label, params.value, params.min, params.max, params.step);
    this.#widgetEl = $(params.name) as HTMLInputElement;
    this.#valueEl = $(`${params.name}-value`) as HTMLSpanElement;
    this.#wrapperEl = $(`${params.name}-control`) as HTMLDivElement;

    this.#widgetEl.onchange = event => {
      this.#value = parseFloat((event.target as HTMLInputElement).value);
      this.#valueEl.innerText = this.#value.toString();
      params.renderFn();
    };
  }

  #createHtmlControl(name: string, label: string, value: number, min: number, max: number, step?: number) {
    const html = [];
    html.push(`<span class="control" id="${name}-control">`);
    const stepAttr = step ? `step="${step}"` : '';
    html.push(`
      <input id="${name}" type="range" min="${min}" max="${max}" value="${value}" ${stepAttr}"/>
      ${label}
      <span id="${name}-value">${value}</span>
    `);
    html.push('<br/></span>');
    // Find the anchor element and insert the constructed HTML as the last child
    const anchorElement = $('controls');
    if (anchorElement) {
      anchorElement.insertAdjacentHTML('beforeend', html.join(''));
    }
  }

  set(newValue: number) {
    this.#value = newValue;
    this.#valueEl.innerText = newValue.toString();
  }

  val(): number {
    return this.#value;
  }

  show() {
    this.#wrapperEl.style.display = 'block';
  }

  hide() {
    this.#wrapperEl.style.display = 'none';
  }
}


class SelectControl {
  #name: string;
  #value: string;
  #wrapperEl: HTMLDivElement;
  #widgetEl: HTMLInputElement;

  constructor(params: any) {

    //name: string,
    //label: string,
    //value: number,
    //renderFn: any
    //choices: string[]

    this.#name = params.name;
    this.#value = params.value;
    this.#createHtmlControl(params.name, params.label, params.value, params.choices);
    this.#widgetEl = $(params.name) as HTMLInputElement;
    this.#wrapperEl = $(`${params.name}-control`) as HTMLDivElement;

    this.#widgetEl.onchange = event => {
      this.#value = (event.target as HTMLInputElement).value;
      params.renderFn();
    };
  }

  #createHtmlControl(name: string, label: string, value: string, choices: string[]) {
    const html = [];
    html.push(`<span class="control" id="${name}-control">`);
    html.push(label);
    html.push(`<select id="${this.#name}">`);
    choices.forEach((choice: string) =>
      html.push(`<option ${choice===value ? 'selected' : ''}>${choice}</option>`));
    html.push('</select>');
    html.push('<br/></span>');
    // Find the anchor element and insert the constructed HTML as the last child
    const anchorElement = $('controls');
    if (anchorElement) {
      anchorElement.insertAdjacentHTML('beforeend', html.join(''));
    }
  }

  set(newValue: string) {
    this.#value = newValue;
    // TODO: move the 'selected' attiribute
  }

  val(): string {
    return this.#value;
  }

  show() {
    this.#wrapperEl.style.display = 'block';
  }

  hide() {
    this.#wrapperEl.style.display = 'none';
  }
}


class CheckboxControl {
  #value: boolean;
  #wrapperEl: HTMLDivElement;
  #widgetEl: HTMLInputElement;

  constructor(params: any) {

    //name: string,
    //label: string,
    //value: boolean,
    //renderFn: any

    this.#value = params.value;
    this.#createHtmlControl(params.name, params.label, params.value);
    this.#widgetEl = $(params.name) as HTMLInputElement;
    this.#wrapperEl = $(`${params.name}-control`) as HTMLDivElement;

    this.#widgetEl.onchange = event => {
      this.#value = (event.target as HTMLInputElement).checked;
      params.renderFn();
    };
  }

  #createHtmlControl(name: string, label: string, value: boolean) {
    const html = [];
    html.push(`<span class="control" id="${name}-control">`);
    html.push(`<input type="checkbox" id="${name}" ${value?'selected':''}> ${label}`);
    html.push(`<br/></span>`);

    // Find the anchor element and insert the constructed HTML as the last child
    const anchorElement = $('controls');
    if (anchorElement) {
      anchorElement.insertAdjacentHTML('beforeend', html.join(''));
    }
  }

  set(newValue: boolean) {
    this.#value = newValue;
    // TODO: change the select state (in case the change is not user-initiated)
  }

  val(): boolean {
    return this.#value;
  }

  show() {
    this.#wrapperEl.style.display = 'block';
  }

  hide() {
    this.#wrapperEl.style.display = 'none';
  }
}


class ImageUploadControl {
  #wrapperEl: HTMLDivElement;
  #uploadEl: HTMLInputElement;
  #canvasEl: HTMLCanvasElement;
  #imageUrl: string;
  #canvas: any;

  constructor(params: any) {
    this.#createHtmlControl(params.name, params.label);
    this.#wrapperEl = $(`${params.name}-control`) as HTMLDivElement;
    this.#uploadEl = $(`${params.name}-upload`) as HTMLInputElement;
    this.#canvasEl = $(`${params.name}-canvas`) as HTMLCanvasElement;
    this.#imageUrl = params.value;

    const ctx = this.#canvasEl.getContext('2d', { willReadFrequently: true });
    const img: HTMLImageElement = new Image();
    img.src = params.value;
    img.onload = () => {
      this.#canvasEl.width = img.width/5;
      this.#canvasEl.height = img.height/5;
      if (ctx) {
        ctx.drawImage(img, 0, 0, this.#canvasEl.width, this.#canvasEl.height);
        this.#canvas = ctx.getImageData(0, 0, this.#canvasEl.width, this.#canvasEl.height);
      }
    }

    this.#uploadEl.onchange = event => {
      const reader = new FileReader();
      reader.onload = event => {
        const img: HTMLImageElement = new Image();
        img.onload = () => {
          this.#canvasEl.width = img.width;
          this.#canvasEl.height = img.height;
          if (ctx) {
            ctx.drawImage(img, 0, 0);
            this.#canvas = ctx.getImageData(0, 0, this.#canvasEl.width, this.#canvasEl.height);
            params.renderFn();
          }
        }
        if (event.target) {
          img.src = event.target.result as string;
          this.#imageUrl = event.target.result as string;
        }
      }
      if (event.target) {
        const target = event.target as HTMLInputElement;
        if (target && target.files) {
          reader.readAsDataURL(target.files[0]);
        }
      }
    };
  }

  #createHtmlControl(name: string, label: string) {
    const html = [];
    html.push(`<span class="control" id="${name}-control">`);
    html.push(`${label} <input type="file" id="${name}-upload" accept="image/*;capture=camera">`);
    html.push(`<canvas id="${name}-canvas" width=100 height=100/>`);
    html.push(`</span><br/>`);
    // Find the anchor element and insert the constructed HTML as the last child
    const anchorElement = $('controls');
    if (anchorElement) {
      anchorElement.insertAdjacentHTML('beforeend', html.join(''));
    }
  }

  set(url: string, cb: any) {
    this.#imageUrl = url;
    const ctx = this.#canvasEl.getContext('2d', { willReadFrequently: true });
    const img: HTMLImageElement = new Image();
    img.src = url;
    img.onload = () => {
      this.#canvasEl.width = img.width/5;
      this.#canvasEl.height = img.height/5;
      if (ctx) {
        ctx.drawImage(img, 0, 0, this.#canvasEl.width, this.#canvasEl.height);
        this.#canvas = ctx.getImageData(0, 0, this.#canvasEl.width, this.#canvasEl.height);
      }
      cb();
    }
  }

  imageUrl(): string {
    return this.#imageUrl;
  }

  canvasEl(): HTMLCanvasElement {
    return this.#canvasEl;
  }

  canvas(): any {
    return this.#canvas;
  }


  show() {
    this.#wrapperEl.style.display = 'block';
  }

  hide() {
    this.#wrapperEl.style.display = 'none';
  }
}

//=====================================================

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

//export { Control, paramsFromUrl, saveSvg, updateUrl, $ };

export { NumberControl, SelectControl, CheckboxControl, ImageUploadControl, paramsFromUrl, saveSvg, updateUrl, $ };
