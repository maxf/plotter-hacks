import { objectToQueryString, queryStringToObject, paramFromQueryString, updateUrlParam } from './url-query-string';

const $ = (id: string) => document.getElementById(id)!;

//============================================================================

class Control {
  #id: string; // like a name but should be a valid query string param name
  #value: any;

  constructor(id: string, params: any) {
    this.#id = id;
    this.#value = params.value;
    controls.push(this);
  }
  id(): string {
    return this.#id;
  }
  setVal(val: any) {
    this.#value = val;
  }
  val(): any {
    return this.#value;
  }
}

//============================================================================

class NumberControl extends Control {
  #wrapperEl: HTMLDivElement;
  #widgetEl: HTMLInputElement;
  #valueEl: HTMLSpanElement;

  constructor(id: string, params: any) {
    super(id, params);
    this.#createHtmlControl(id, params.name, params.value, params.min, params.max, params.step);
    this.#widgetEl = $(id) as HTMLInputElement;
    this.#valueEl = $(`${id}-value`) as HTMLSpanElement;
    this.#wrapperEl = $(`${id}-control`) as HTMLDivElement;

    this.#widgetEl.onchange = event => {
      this.setVal(parseFloat((event.target as HTMLInputElement).value) as number);
      this.#valueEl.innerText = this.val().toString();
      updateUrlParam(this.id(), this.val());
      params.callback();
    };
  }

  #createHtmlControl(id: string, name: string, value: number, min: number, max: number, step?: number) {
    const html = [];
    html.push(`<div class="control" id="${id}-control">`);
    const stepAttr = step ? `step="${step}"` : '';
    html.push(`
      <input id="${id}" type="range" min="${min}" max="${max}" value="${value}" ${stepAttr}"/>
      ${name}
      <span id="${id}-value">${value}</span>
    `);
    html.push('</div>');
    // Find the anchor element and insert the constructed HTML as the last child
    const anchorElement = $('controls');
    if (anchorElement) {
      anchorElement.insertAdjacentHTML('beforeend', html.join(''));
    }
  }

  set(newValue: number) {
    this.setVal(newValue);
    this.#widgetEl.value = newValue.toString(); // TODO: clamp to min/max
    this.#valueEl.innerText = newValue.toString();
  }

  show() {
    this.#wrapperEl.style.display = 'block';
  }

  hide() {
    this.#wrapperEl.style.display = 'none';
  }
}

//============================================================================

class SelectControl extends Control {
  #wrapperEl: HTMLDivElement;
  #widgetEl: HTMLInputElement;

  constructor(id: string, params: any) {
    super(id, params);
    this.setVal(params.value);
    this.#createHtmlControl(id, params.name, params.value, params.choices);
    this.#widgetEl = $(id) as HTMLInputElement;
    this.#wrapperEl = $(`${id}-control`) as HTMLDivElement;

    this.#widgetEl.onchange = event => {
      this.setVal((event.target as HTMLInputElement).value);
      updateUrlParam(this.id(), this.val());
      params.callback.call(this);
    };
  }

  #createHtmlControl(id: string, name: string, value: string, choices: string[]) {
    const html = [];
    html.push(`<div class="control" id="${id}-control">`);
    html.push(name);
    html.push(`<select id="${this.id()}">`);
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
    this.setVal(newValue);
    this.#widgetEl.value = newValue;
  }

  show() {
    this.#wrapperEl.style.display = 'block';
  }

  hide() {
    this.#wrapperEl.style.display = 'none';
  }
}

//============================================================================

class CheckboxControl extends Control {
  #wrapperEl: HTMLDivElement;
  #widgetEl: HTMLInputElement;

  constructor(id: string, params: any) {
    super(id, params)
    this.setVal(params.value);
    this.#createHtmlControl(id, params.name, params.value);
    this.#widgetEl = $(id) as HTMLInputElement;
    this.#wrapperEl = $(`${id}-control`) as HTMLDivElement;

    this.#widgetEl.onchange = event => {
      this.setVal((event.target as HTMLInputElement).checked);
      updateUrlParam(this.id(), this.val());
      params.callback().bind(this);
    };
  }

  #createHtmlControl(id: string, name: string, value: boolean) {
    const html = [];
    html.push(`<div class="control" id="${id}-control">`);
    html.push(`<input type="checkbox" id="${id}" ${value?'selected':''}> ${name}`);
    html.push(`</div>`);

    // Find the anchor element and insert the constructed HTML as the last child
    const anchorElement = $('controls');
    if (anchorElement) {
      anchorElement.insertAdjacentHTML('beforeend', html.join(''));
    }
  }

  set(newValue: boolean) {
    this.setVal(newValue);
    this.#widgetEl.checked = newValue;
  }

  show() {
    this.#wrapperEl.style.display = 'block';
  }

  hide() {
    this.#wrapperEl.style.display = 'none';
  }
}

//============================================================================

class SvgSaveControl extends Control {
  #wrapperEl: HTMLSpanElement;

  #createHtmlControl(id: string, name: string) {
    const html = `
      <div class="control" id="${id}-control">
        <button id="${id}">${name}</button>
      </div>
    `;
    const anchorElement = $('controls');
    if (anchorElement) {
      anchorElement.insertAdjacentHTML('beforeend', html);
    }
  }

  constructor(id: string, params: any) {
    super(id, params)
    this.#createHtmlControl(id, params.name);
    this.#wrapperEl = $(`${id}-control`) as HTMLSpanElement;

    $(id).onclick = () => {
      const svgEl = $(params.canvasId);
      svgEl.setAttribute("xmlns", "http://www.w3.org/2000/svg");
      var svgData = svgEl.outerHTML;
      var preface = '<?xml version="1.0" standalone="no"?>';
      var svgBlob = new Blob([preface, svgData], {type:"image/svg+xml;charset=utf-8"});
      var svgUrl = URL.createObjectURL(svgBlob);
      var downloadLink = document.createElement("a");
      downloadLink.href = svgUrl;
      downloadLink.download = params.saveFileid;
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

//============================================================================

class ImageInputControl extends Control {
  #videoControl: VideoStreamControl;
  #imageControl: ImageUploadControl;
  #toggle: SelectControl;

  constructor(id: string, params: any) {
    super(id, params);
    this.#videoControl = new VideoStreamControl(`${id}-video`, {
      name: 'Video',
      callback: params.callback
    });
    this.#videoControl.hide();
    this.#imageControl = new ImageUploadControl(`${id}-image`, {
      name: 'Image',
      callback: params.callback,
      value: params.initialImage
    });
    this.#toggle = new SelectControl(`${id}-toggle`, {
      name: 'Mode',
      choices: ['Video', 'Image upload'],
      value: 'Image upload',
      callback: () => {
        if (this.#toggle.val() === 'Video') {
          this.#imageControl.hide();
          this.#videoControl.show();
        } else {
          this.#imageControl.show();
          this.#videoControl.pauseStreaming();
          this.#videoControl.hide();
        }
      }
    });
  }

  canvas(): HTMLCanvasElement {
    return this.#toggle.val() === 'Video'
      ? this.#videoControl.canvas()
      : this.#imageControl.canvas();
  }
}

//============================================================================

class VideoStreamControl extends Control {
  #wrapperEl: HTMLDivElement;
  #videoEl: HTMLVideoElement;
  #canvasEl: HTMLCanvasElement;
  #startButtonEl: HTMLButtonElement;
  #callback: any;
  #isRunning: boolean;
  #animationId: number | null;
  #context: CanvasRenderingContext2D | null;
  #stream: MediaStream | null = null;

  constructor(id: string, params: any) {
    super(id, params);
    this.#createHtmlControl(id, params.name);
    this.#wrapperEl = document.getElementById(`${id}-control`) as HTMLDivElement;
    this.#videoEl = document.getElementById(`${id}-video`) as HTMLVideoElement;
    this.#canvasEl = document.getElementById(`${id}-canvas`) as HTMLCanvasElement;
    this.#startButtonEl = document.getElementById(`${id}-start`) as HTMLButtonElement;
    this.#callback = params.callback;
    this.#animationId = 0;
    this.#isRunning = false;
    this.#context = this.#canvasEl.getContext(
      '2d',
      { alpha: false, willReadFrequently: true }
    );
  }

  async #stopStreaming() {
    if (this.#stream) {
      this.#stream.getTracks().forEach(track => track.stop());
      this.#videoEl.srcObject = null;
      this.#stream = null;
      this.#videoEl.pause();
    }
  }

  async pauseStreaming() {
    await this.#stopStreaming();
    this.#startButtonEl.innerText = 'Restart';
    this.#startButtonEl.onclick = async () => this.restartStreaming();
    this.#isRunning = false;
    if (this.#animationId) {
      cancelAnimationFrame(this.#animationId);
      this.#animationId = null;
    }
  }

  async restartStreaming() {
    // First ensure previous stream is fully stopped
    await this.#stopStreaming()

    // Request a new stream
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: false,
        video: { width: 1920, height: 1080 },
      });
      this.#stream = stream;
      this.#videoEl.srcObject = stream;
      this.#videoEl.play();
      this.#startButtonEl.innerText = 'Pause';
      this.#startButtonEl.onclick = async () => this.pauseStreaming();
      this.#isRunning = true;
      this.#animate();
    } catch (e: any) {
      console.log("Failed to restart camera:", e.name);
    }
  }

  #animate() {
    if (this.#context) {
      this.#context.drawImage(this.#videoEl, 0, 0, this.#canvasEl.width, this.#canvasEl.height);
      this.#callback(this.#context, this.#canvasEl.width, this.#canvasEl.height);
      if (this.#isRunning) {
        this.#animationId = requestAnimationFrame(this.#animate.bind(this));
      }
    }
  }

  async startStreaming() {
    if (!this.#context) throw 'Failed to get context';

    navigator.mediaDevices
      .getUserMedia({
        audio: false,
        video: { width: 1920, height: 1080 },
      })
      .then((stream: MediaStream) => {
        this.#stream = stream;
        this.#videoEl.srcObject = stream;
        this.#videoEl.play();
      })
      .catch(function (e) {
        console.log("An error with camera occured:", e.id);
      })
    this.#startButtonEl.innerText = 'Pause';
    this.#startButtonEl.onclick = async () => await this.pauseStreaming();

    this.#isRunning = true;
    this.#animate();
  }

  #createHtmlControl(id: string, name: string) {
    const html = [];
    html.push(`<div class="control" id="${id}-control">`);
    html.push(`${name} <video id="${id}-video" autoplay playsinline webkit-playsinline muted hidden></video>`);
    html.push(`<canvas id="${id}-canvas"></canvas>`);
    html.push(`<button id="${id}-start">Start</button>`);
    html.push(`</div>`);
    const anchorElement = document.getElementById('controls');
    if (anchorElement) {
      anchorElement.insertAdjacentHTML('beforeend', html.join(''));
      $(`${id}-start`).onclick = async () => {
        await this.startStreaming();
      }
    }
  }

  show() {
    this.#wrapperEl.style.display = 'block';
  }

  hide() {
    this.#wrapperEl.style.display = 'none';
  }

  canvas() {
    return this.#canvasEl;
  }
}

//============================================================================

class ImageUploadControl extends Control {
  #wrapperEl: HTMLDivElement;
  #uploadEl: HTMLInputElement;
  #canvasEl: HTMLCanvasElement;
  #imageUrl: string;

  constructor(id: string, params: any) {
    super(id, params);
    this.#imageUrl = params.value;
    this.#createHtmlControl(id, params.name);

    this.#wrapperEl = document.getElementById(`${id}-control`) as HTMLDivElement;
    this.#uploadEl = document.getElementById(`${id}-upload`) as HTMLInputElement;
    this.#canvasEl = document.getElementById(`${id}-canvas`) as HTMLCanvasElement;
    this.loadImage(this.#imageUrl, () => {
      params.callback(this);
    });

    this.#uploadEl.onchange = () => {
      const file: File = (this.#uploadEl.files as FileList)[0];
      if (file) {
        this.loadImage(file, () => params.callback(this));
      }
    };
  }

  #createHtmlControl(id: string, name: string) {
    const html = [];
    html.push(`<div class="control" id="${id}-control">`);
    html.push(`${name} <input type="file" id="${id}-upload" accept="image/*"><br/>`);
    html.push(`<canvas id="${id}-canvas"></canvas>`);
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

  canvas(): HTMLCanvasElement {
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

//============================================================================

class TextControl extends Control {
  #wrapperEl: HTMLDivElement;
  #widgetEl: HTMLInputElement;

  constructor(id: string, params: any) {
    super(id, params);
    this.setVal(params.value);
    this.#createHtmlControl(id, params.name, params.value);
    this.#widgetEl = $(id) as HTMLInputElement;
    this.#wrapperEl = $(`${id}-control`) as HTMLDivElement;
    this.#widgetEl.onchange = event => {
      this.setVal((event.target as HTMLInputElement).value);
      updateUrlParam(this.id(), this.val());
      params.callback().bind(this);
    };
  }

  #createHtmlControl(id: string, name: string, value: number) {
    const html = [];
    html.push(`<div class="control" id="${id}-control">`);
    html.push(`
      <input id="${id}" value="${value}"/>
      ${name}
    `);
    html.push('</div>');
    // Find the anchor element and insert the constructed HTML as the last child
    const anchorElement = $('controls');
    if (anchorElement) {
      anchorElement.insertAdjacentHTML('beforeend', html.join(''));
    }
  }

  set(newValue: string) {
    this.setVal(newValue);
    this.#widgetEl.value = newValue.toString();
  }

  show() {
    this.#wrapperEl.style.display = 'block';
  }

  hide() {
    this.#wrapperEl.style.display = 'none';
  }
}

//============================================================================

const controls: Control[] = [];

const getParams = function(defaults: any) {
  const params: Record<string, any> = {};
  controls.forEach((control: Control) => {
    const key: string = control.id();
    let value = paramFromQueryString(
      control.id(),
      window.location.search
    );
    if (value) {
      params[key] = value;
      control.setVal(value);
    } else {
      value = control.val();
      if (value) {
        params[key] = control.val();
        updateUrlParam(key, params[key]);
      } else {
        params[key] = defaults[key];
      }
    }
  });
  return params;
}


export {
  NumberControl,
  SelectControl,
  CheckboxControl,
  VideoStreamControl,
  ImageUploadControl,
  SvgSaveControl,
  TextControl,
  ImageInputControl,
  paramsFromUrl,
  updateUrl,
  getParams,
  $
};
