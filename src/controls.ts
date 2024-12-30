import { objectToQueryString, queryStringToObject } from './url-query-string';

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
    html.push(`<div class="control" id="${name}-control">`);
    const stepAttr = step ? `step="${step}"` : '';
    html.push(`
      <input id="${name}" type="range" min="${min}" max="${max}" value="${value}" ${stepAttr}"/>
      ${label}
      <span id="${name}-value">${value}</span>
    `);
    html.push('</div>');
    // Find the anchor element and insert the constructed HTML as the last child
    const anchorElement = $('controls');
    if (anchorElement) {
      anchorElement.insertAdjacentHTML('beforeend', html.join(''));
    }
  }

  set(newValue: number) {
    this.#value = newValue;
    this.#widgetEl.value = newValue.toString(); // TODO: clamp to min/max
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
      params.renderFn.call(this);
    };
  }

  #createHtmlControl(name: string, label: string, value: string, choices: string[]) {
    const html = [];
    html.push(`<div class="control" id="${name}-control">`);
    html.push(label);
    html.push(`<select id="${this.#name}">`);
    choices.forEach((choice: string) =>
      html.push(`<option ${choice===value ? 'selected' : ''}>${choice}</option>`));
    html.push('</select>');
    html.push('</div>');
    // Find the anchor element and insert the constructed HTML as the last child
    const anchorElement = $('controls');
    if (anchorElement) {
      anchorElement.insertAdjacentHTML('beforeend', html.join(''));
    }
  }

  set(newValue: string) {
    this.#value = newValue;
    this.#widgetEl.value = newValue;
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
    html.push(`<div class="control" id="${name}-control">`);
    html.push(`<input type="checkbox" id="${name}" ${value?'selected':''}> ${label}`);
    html.push(`</div>`);

    // Find the anchor element and insert the constructed HTML as the last child
    const anchorElement = $('controls');
    if (anchorElement) {
      anchorElement.insertAdjacentHTML('beforeend', html.join(''));
    }
  }

  set(newValue: boolean) {
    this.#value = newValue;
    this.#widgetEl.checked = newValue;
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


class SvgSaveControl {
  #wrapperEl: HTMLSpanElement;

  #createHtmlControl(name: string, label: string) {
    const html = `
      <div class="control" id="${name}-control">
        <button id="${name}">${label}</button>
      </div>
    `;
    const anchorElement = $('controls');
    if (anchorElement) {
      anchorElement.insertAdjacentHTML('beforeend', html);
    }
  }

  constructor(params: any) {
    // params:
    //   name, canvasId, label, saveFilename

    this.#createHtmlControl(params.name, params.label);
    this.#wrapperEl = $(`${params.name}-control`) as HTMLSpanElement;

    $(params.name).onclick = () => {
      const svgEl = $(params.canvasId);
      svgEl.setAttribute("xmlns", "http://www.w3.org/2000/svg");
      var svgData = svgEl.outerHTML;
      var preface = '<?xml version="1.0" standalone="no"?>';
      var svgBlob = new Blob([preface, svgData], {type:"image/svg+xml;charset=utf-8"});
      var svgUrl = URL.createObjectURL(svgBlob);
      var downloadLink = document.createElement("a");
      downloadLink.href = svgUrl;
      downloadLink.download = params.saveFilename;
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);
    }
  }
  show() {
    this.#wrapperEl.style.display = 'block';
  }

  hide() {
    this.#wrapperEl.style.display = 'none';
  }
}


class VideoStreamControl {
  #wrapperEl: HTMLDivElement;
  #videoEl: HTMLVideoElement;
  #canvasEl: HTMLCanvasElement;
  #callback: any;

  constructor(params: any) {
    // const fps = .3;
    this.#createHtmlControl(params.name, params.label);
    
    this.#wrapperEl = document.getElementById(`${params.name}-control`) as HTMLDivElement;
    this.#videoEl = document.getElementById(`${params.name}-video`) as HTMLVideoElement;
    this.#canvasEl = document.getElementById(`${params.name}-canvas`) as HTMLCanvasElement;
    this.#callback = params.callback;
  }

  async startStreaming() {
    const context = this.#canvasEl.getContext(
      '2d',
      { alpha: false, willReadFrequently: true }
    );
    if (!context) throw 'Failed to get context';

    navigator.mediaDevices
      .getUserMedia({
        audio: false,
        video: { width: 1920, height: 1080 },
      })
      .then((stream: MediaStream) => {
        this.#videoEl.srcObject = stream;
        this.#videoEl.play();
      })
      .catch(function (e) {
        console.log("An error with camera occured:", e.name);
      })
    while(true) {
      context.drawImage(this.#videoEl, 0, 0, this.#canvasEl.width, this.#canvasEl.height);
      this.#callback(context, this.#canvasEl.width, this.#canvasEl.height);

      // Make the loop non-blocking by yielding to the event loop
      await new Promise(resolve => setTimeout(resolve, 0));
    }
  }

  #createHtmlControl(name: string, label: string) {
    const html = [];
    html.push(`<div class="control" id="${name}-control">`);
    html.push(`${label} <video id="${name}-video" autoplay playsinline webkit-playsinline muted hidden></video>`);
    html.push(`<canvas id="${name}-canvas"></canvas>`);
    html.push(`<button id="${name}-start">Start</button>`);
    html.push(`</div>`);
    const anchorElement = document.getElementById('controls');
    if (anchorElement) {
      anchorElement.insertAdjacentHTML('beforeend', html.join(''));
      $(`${name}-start`).onclick = async () => await this.startStreaming();
    }
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

  constructor(params: any) {
    this.#imageUrl = params.value;
    this.#createHtmlControl(params.name, params.label);

    this.#wrapperEl = document.getElementById(`${params.name}-control`) as HTMLDivElement;
    this.#uploadEl = document.getElementById(`${params.name}-upload`) as HTMLInputElement;
    this.#canvasEl = document.getElementById(`${params.name}-canvas`) as HTMLCanvasElement;
    this.loadImage(this.#imageUrl, () => {
      params.firstCallback(this);
    });

    this.#uploadEl.onchange = () => {
      const file: File = (this.#uploadEl.files as FileList)[0];
      if (file) {
        this.loadImage(file, () => params.callback(this));
      }
    };
  }

  #createHtmlControl(name: string, label: string) {
    const html = [];
    html.push(`<div class="control" id="${name}-control">`);
    html.push(`${label} <input type="file" id="${name}-upload" accept="image/*"><br/>`);
    html.push(`<canvas id="${name}-canvas"></canvas>`);
    html.push(`</div>`);
    const anchorElement = document.getElementById('controls');
    if (anchorElement) {
      anchorElement.insertAdjacentHTML('beforeend', html.join(''));
    }
  }

  loadImage(source: File | string, callback?: () => void) {
    const ctx = this.#canvasEl.getContext('2d', { willReadFrequently: true });
    const img = new Image();
    img.onload = () => {
      const desiredWidth = 200;
      const aspectRatio = img.width / img.height;
      const desiredHeight = desiredWidth / aspectRatio;
      this.#canvasEl.width = desiredWidth;
      this.#canvasEl.height = desiredHeight;
      if (ctx) {
        ctx.drawImage(img, 0, 0, desiredWidth, desiredHeight);
      }
      if (callback) {
        callback();
      }
    };

    if (typeof source === 'string') {
      img.src = source;
      this.#imageUrl = source;
    } else {
      this.#imageUrl = '';
      const reader = new FileReader();
      reader.onload = event => {
        if (event.target && event.target.result) {
          img.src = event.target.result as string;
        }
      };
      reader.readAsDataURL(source);
    }
  }

  imageUrl(): string {
    return this.#imageUrl;
  }

  canvasEl(): HTMLCanvasElement {
    return this.#canvasEl;
  }

  show() {
    this.#wrapperEl.style.display = 'block';
  }

  hide() {
    this.#wrapperEl.style.display = 'none';
  }
}


const paramsFromUrl = (defaults: any) => {
  const params = queryStringToObject(window.location.search);
  return { ...defaults,  ...params };
};

const updateUrl = (params: any) => {
  const url: string = objectToQueryString(params);
  history.pushState(null, '', url);
};


class TextControl {
  #value: string;
  #wrapperEl: HTMLDivElement;
  #widgetEl: HTMLInputElement;

  constructor(params: any) {
    this.#value = params.value;
    this.#createHtmlControl(params.name, params.label, params.value);
    this.#widgetEl = $(params.name) as HTMLInputElement;
    this.#wrapperEl = $(`${params.name}-control`) as HTMLDivElement;
    this.#widgetEl.onchange = event => {
      this.#value = (event.target as HTMLInputElement).value;
      params.renderFn();
    };
  }

  #createHtmlControl(name: string, label: string, value: number) {
    const html = [];
    html.push(`<div class="control" id="${name}-control">`);
    html.push(`
      <input id="${name}" value="${value}"/>
      ${label}
    `);
    html.push('</div>');
    // Find the anchor element and insert the constructed HTML as the last child
    const anchorElement = $('controls');
    if (anchorElement) {
      anchorElement.insertAdjacentHTML('beforeend', html.join(''));
    }
  }

  set(newValue: string) {
    this.#value = newValue;
    this.#widgetEl.value = newValue.toString();
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


export {
  NumberControl,
  SelectControl,
  CheckboxControl,
  VideoStreamControl,
  ImageUploadControl,
  SvgSaveControl,
  TextControl,
  paramsFromUrl,
  updateUrl,
  $
};
