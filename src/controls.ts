import { objectToQueryString, queryStringToObject, paramFromQueryString, updateUrlParam } from './url-query-string';

const $ = (id: string) => document.getElementById(id)!;

//============================================================================

export interface ControlParams {
  name: string;
  updateUrl?: boolean;
}


abstract class Control {
  readonly id: string; // like a name but should be a valid query string param name
  protected _updateUrl: boolean;
  protected wrapperEl: HTMLDivElement;

  constructor(id: string, params: ControlParams) {
    this.id = id;
    this._updateUrl = params.updateUrl || true;
    this.wrapperEl = $(`${id}-control`) as HTMLDivElement;
    controls.push(this);
  }

  updateUrl(): boolean {
    return this._updateUrl;
  }

  val(): any {
    // most controls will override this if they hold a value. One exception is
    // SvgSaveControl
    return undefined;
  }

  set(value: any): any {
    // most controls will override this if they hold a value. One exception is
    // SvgSaveControl
    return value;
  }

  show() {
    this.wrapperEl.style.display = 'block';
  }

  hide() {
    this.wrapperEl.style.display = 'none';
  }
}

//============================================================================

interface NumberControlParams extends ControlParams {
  value: number;
  min: number;
  max: number;
  step?: number;
  callback: (...args: any[]) => void;
}

class NumberControl extends Control {
  private widgetEl: HTMLInputElement;
  private valueEl: HTMLSpanElement;
  private value: number;

  constructor(id: string, params: NumberControlParams) {
    super(id, params);
    this.value = params.value;
    this.createHtmlControl(id, params.name, params.value, params.min, params.max, params.step);
    this.widgetEl = $(id) as HTMLInputElement;
    this.valueEl = $(`${id}-value`) as HTMLSpanElement;
    this.wrapperEl = $(`${id}-control`) as HTMLDivElement;

    this.widgetEl.onchange = event => {
      this.set(parseFloat((event.target as HTMLInputElement).value) as number);
      this.valueEl.innerText = this.value.toString();
      console.log(this.id, this.value, this.updateUrl())
      if (this.updateUrl()) updateUrlParam(this.id, this.value);
      params.callback();
    };
  }

  override val(): number {
    return this.value;
  }

  createHtmlControl(id: string, name: string, value: number, min: number, max: number, step?: number) {
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

  override set(newValue: number) {
    this.value = newValue;
    this.widgetEl.value = newValue.toString(); // TODO: clamp to min/max
    this.valueEl.innerText = newValue.toString();
    return this.value;
  }
}

//============================================================================

interface SelectControlParams extends ControlParams {
  value: string,
  choices: string[],
  callback: (...args: any[]) => void
}

class SelectControl extends Control {
  private widgetEl: HTMLInputElement;
  private value: string;

  constructor(id: string, params: SelectControlParams) {
    super(id, params);
    this.value = params.value;
    this.createHtmlControl(id, params.name, params.value, params.choices);
    this.widgetEl = $(id) as HTMLInputElement;
    this.wrapperEl = $(`${id}-control`) as HTMLDivElement;

    this.widgetEl.onchange = event => {
      this.set((event.target as HTMLInputElement).value);
      if (this.updateUrl()) updateUrlParam(this.id, this.value);
      params.callback(this);
    };
  }

  createHtmlControl(id: string, name: string, value: string, choices: string[]) {
    const html = [];
    html.push(`<div class="control" id="${id}-control">`);
    html.push(name);
    html.push(`<select id="${this.id}">`);
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

  override val() {
    return this.value;
  }

  override set(newValue: string) {
    this.value = newValue;
    this.widgetEl.value = newValue;
    return this.value;
  }
}

//============================================================================

interface CheckboxControlParams extends ControlParams {
  value: boolean;
  callback: (...args: any[]) => void;
}


class CheckboxControl extends Control {
  private widgetEl: HTMLInputElement;
  private value: boolean;

  constructor(id: string, params: CheckboxControlParams) {
    super(id, params)
    this.value = params.value;
    this.createHtmlControl(id, params.name, params.value);
    this.widgetEl = $(id) as HTMLInputElement;
    this.wrapperEl = $(`${id}-control`) as HTMLDivElement;

    this.widgetEl.onchange = event => {
      this.set((event.target as HTMLInputElement).checked);
      if (this.updateUrl()) updateUrlParam(this.id, this.value);
      params.callback.bind(this)();
    };
  }

  private createHtmlControl(id: string, name: string, value: boolean) {
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

  override val() {
    return this.value;
  }

  override set(newValue: boolean) {
    this.value = newValue;
    this.widgetEl.checked = newValue;
  }
}

//============================================================================

interface SvgSaveControlParams extends ControlParams {
  canvasId: string,
  saveFilename: string
}

class SvgSaveControl extends Control {
  constructor(id: string, params: SvgSaveControlParams) {
    super(id, params)
    this.createHtmlControl(id, params.name);

    $(id).onclick = () => {
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

  private createHtmlControl(id: string, name: string) {
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
}

//============================================================================

interface ImageInputControlParams extends ControlParams {
  callback: (...args: any[]) => void;
  initialImage: string;
}

class ImageInputControl extends Control {
  private videoControl: VideoStreamControl;
  private imageControl: ImageUploadControl;
  private toggle: SelectControl;

  constructor(id: string, params: ImageInputControlParams) {
    super(id, params);
    this.videoControl = new VideoStreamControl(`${id}-video`, {
      name: 'Video',
      callback: params.callback
    });
    this.videoControl.hide();
    this.imageControl = new ImageUploadControl(`${id}-image`, {
      name: 'Image',
      callback: params.callback,
      initialImage: params.initialImage
    });
    this.toggle = new SelectControl(`${id}-toggle`, {
      name: 'Mode',
      choices: ['Video', 'Image upload'],
      value: 'Image upload',
      callback: () => {
        if (this.toggle.val() === 'Video') {
          this.imageControl.hide();
          this.videoControl.show();
        } else {
          this.imageControl.show();
          this.videoControl.pauseStreaming();
          this.videoControl.hide();
        }
      }
    });
  }

  canvas(): HTMLCanvasElement {
    return this.toggle.val() === 'Video'
      ? this.videoControl.canvas()
      : this.imageControl.canvas();
  }
}

//============================================================================

interface VideoStreamControlParams extends ControlParams {
  callback: (...args: any[]) => void;
}

class VideoStreamControl extends Control {
  private videoEl: HTMLVideoElement;
  private canvasEl: HTMLCanvasElement;
  private startButtonEl: HTMLButtonElement;
  private isRunning: boolean;
  private animationId: number | null;
  private context: CanvasRenderingContext2D | null;
  private stream: MediaStream | null = null;
  private callback: (...args: any[]) => void;

  constructor(id: string, params: VideoStreamControlParams) {
    super(id, params);
    this.createHtmlControl(id, params.name);
    this.wrapperEl = document.getElementById(`${id}-control`) as HTMLDivElement;
    this.videoEl = document.getElementById(`${id}-video`) as HTMLVideoElement;
    this.canvasEl = document.getElementById(`${id}-canvas`) as HTMLCanvasElement;
    this.startButtonEl = document.getElementById(`${id}-start`) as HTMLButtonElement;
    this.callback = params.callback;
    this.animationId = 0;
    this.isRunning = false;
    this.context = this.canvasEl.getContext(
      '2d',
      { alpha: false, willReadFrequently: true }
    );
  }

  private async stopStreaming() {
    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
      this.videoEl.srcObject = null;
      this.stream = null;
      this.videoEl.pause();
    }
    this.isRunning = false;
  }

  async pauseStreaming() {
    await this.stopStreaming();
    this.startButtonEl.innerText = 'Restart';
    this.startButtonEl.onclick = async () => this.restartStreaming();
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
  }

  async restartStreaming() {
    // First ensure previous stream is fully stopped
    await this.stopStreaming()

    // Request a new stream
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: false,
        video: { width: 1920, height: 1080 },
      });
      this.stream = stream;
      this.videoEl.srcObject = stream;
      this.videoEl.play();
      this.startButtonEl.innerText = 'Pause';
      this.startButtonEl.onclick = async () => this.pauseStreaming();
      this.isRunning = true;
      this.animate();
    } catch (e: any) {
      console.log("Failed to restart camera:", e.name);
    }
  }

  private animate() {
    if (this.context) {
      this.context.drawImage(
        this.videoEl,
        0, 0,
        this.canvasEl.width, this.canvasEl.height
      );
      this.callback(this.context, this.canvasEl.width, this.canvasEl.height);
      if (this.isRunning) {
        this.animationId = requestAnimationFrame(this.animate.bind(this));
      }
    }
  }

  async startStreaming() {
    if (!this.context) throw 'Failed to get context';

    navigator.mediaDevices
      .getUserMedia({
        audio: false,
        video: { width: 1920, height: 1080 },
      })
      .then((stream: MediaStream) => {
        stream = stream;
        this.videoEl.srcObject = stream;
        this.videoEl.play();
      })
      .catch(function (e) {
        console.log("An error with camera occured:", e.id);
      })
    this.startButtonEl.innerText = 'Pause';
    this.startButtonEl.onclick = async () => await this.pauseStreaming();

    this.isRunning = true;
    this.animate();
  }

  private createHtmlControl(id: string, name: string) {
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

  override show() {
    this.wrapperEl.style.display = 'block';
    this.animate();
  }

  override hide() {
    this.stopStreaming();
    this.wrapperEl.style.display = 'none';
  }

  canvas() {
    return this.canvasEl;
  }
}

//============================================================================

interface ImageUploadControlParams extends ControlParams {
  callback: (...args: any[]) => void;
  initialImage: string;
}

class ImageUploadControl extends Control {
  private uploadEl: HTMLInputElement;
  private canvasEl: HTMLCanvasElement;
  private _imageUrl: string;
  private callback: (...args: any[]) => void;


  constructor(id: string, params: ImageUploadControlParams) {
    super(id, params);
    this._imageUrl = params.initialImage;
    this.callback = params.callback;
    this.createHtmlControl(id, params.name);

    this.wrapperEl = document.getElementById(`${id}-control`) as HTMLDivElement;
    this.uploadEl = document.getElementById(`${id}-upload`) as HTMLInputElement;
    this.canvasEl = document.getElementById(`${id}-canvas`) as HTMLCanvasElement;
    this.loadImage(this._imageUrl, () => {
      params.callback(this);
    });

    this.uploadEl.onchange = () => {
      const file: File = (this.uploadEl.files as FileList)[0];
      if (file) {
        this.loadImage(file, () => params.callback(this));
      }
    };
  }

  private createHtmlControl(id: string, name: string) {
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
    const ctx = this.canvasEl.getContext('2d', { willReadFrequently: true });
    const img = new Image();
    img.onload = () => {
      const desiredWidth = 200;
      const aspectRatio = img.width / img.height;
      const desiredHeight = desiredWidth / aspectRatio;
      this.canvasEl.width = desiredWidth;
      this.canvasEl.height = desiredHeight;
      if (ctx) {
        ctx.drawImage(img, 0, 0, desiredWidth, desiredHeight);
      }
      if (callback) {
        callback();
      }
    };

    if (typeof source === 'string') {
      img.src = source;
      this._imageUrl = source;
    } else {
      this._imageUrl = '';
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
    return this._imageUrl;
  }

  canvas(): HTMLCanvasElement {
    return this.canvasEl;
  }

  override show() {
    this.loadImage(this._imageUrl, () => {
      this.callback(this);
    });
    super.show();
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

interface TextControlParams extends ControlParams {
  value: string,
  callback: (...args: any[]) => void
}

class TextControl extends Control {
  private widgetEl: HTMLInputElement;
  private value: string;

  constructor(id: string, params: TextControlParams) {
    super(id, params);
    this.value = params.value;
    this.createHtmlControl(id, params.name, params.value);
    this.widgetEl = $(id) as HTMLInputElement;
    this.wrapperEl = $(`${id}-control`) as HTMLDivElement;
    this.widgetEl.onchange = event => {
      this.set((event.target as HTMLInputElement).value);
      if (this.updateUrl()) updateUrlParam(this.id, this.val());
      params.callback.bind(this)();
    };
  }

  private createHtmlControl(id: string, name: string, value: string) {
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

  override set(newValue: string) {
    this.set(newValue);
    this.widgetEl.value = newValue.toString();
    return this.value;
  }

  override val() {
    return this.value;
  }
}

class TextAreaControl extends Control {
  private widgetEl: HTMLInputElement;
  private value;

  constructor(id: string, params: any) {
    super(id, params);
    this.value = params.value;
    this.createHtmlControl(id, params.name, params.value);
    this.widgetEl = $(id) as HTMLInputElement;
    this.wrapperEl = $(`${id}-control`) as HTMLDivElement;

    $(`${id}-button`).onclick = () => {
      this.set(this.widgetEl.value);
      if (this.updateUrl()) updateUrlParam(this.id, this.val());
      params.callback.bind(this)();
    };
  }

  private createHtmlControl(id: string, name: string, value: number) {
    const html = [];
    html.push(`<div class="control" id="${id}-control">`);
    html.push(`
      ${name}
      <textarea id="${id}">${value}</textarea>
      <button id="${id}-button">Update</button>
    </div>`);
    // Find the anchor element and insert the constructed HTML as the last child
    const anchorElement = $('controls');
    if (anchorElement) {
      anchorElement.insertAdjacentHTML('beforeend', html.join(''));
    }
  }

  override val() {
    return this.value;
  }

  override set(newValue: string) {
    this.value = newValue;
    this.widgetEl.value = newValue.toString();
    return this.value;
  }
}

//============================================================================

const controls: Control[] = [];

const getParams = function(defaults: any, useUrl: boolean = true) {
  const params: Record<string, any> = defaults;

  // iterate controls with a value (i.e. not SVG save, for instance)
  controls.forEach((control: Control) => {
    if (control.val() !== undefined) { // if undefined the control doesn't hold a value so skip
      const key: string = control.id;
      if (useUrl) {
        let value = paramFromQueryString(
          control.id,
          window.location.search
        );
        if (value) {
          params[key] = value;
          control.set(value);
        } else {
          value = control.val();
          if (value) {
            params[key] = control.val();
            updateUrlParam(key, params[key]);
          } else {
            params[key] = defaults[key];
          }
        }
      } else {
        params[key] = control.val() || defaults[key];
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
  TextAreaControl,
  ImageInputControl,
  paramsFromUrl,
  updateUrl,
  getParams,
  $
};

