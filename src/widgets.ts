import { objectToQueryString, queryStringToObject, paramFromQueryString, updateUrlParam } from './url-query-string';

const $ = (id: string) => document.getElementById(id)!;

//============================================================================

export interface WidgetParams {
  name: string;
  updateUrl?: boolean; // default depends on type of widget, but this lets user override
}


abstract class Widget {
  readonly id: string; // like a name but should be a valid query string param name
  protected _updateUrl: boolean;
  protected wrapperEl: HTMLDivElement;

  constructor(id: string, params: WidgetParams) {
    this.id = id;
    this._updateUrl = params.updateUrl || false;
    this.wrapperEl = $(`${id}-widget`) as HTMLDivElement;
    // Widget instances will now be added to a WidgetGroup manually
  }

  updateUrl(): boolean {
    return this._updateUrl;
  }

  val(): any {
    // most widgets will override this if they hold a value. One exception is
    // SvgSaveWidget
    return undefined;
  }

  set(value: any): any {
    // most widgets will override this if they hold a value. One exception is
    // SvgSaveWidget
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

interface NumberWidgetParams extends WidgetParams {
  value: number;
  min: number;
  max: number;
  step?: number;
  callback: (...args: any[]) => void;
}

class NumberWidget extends Widget {
  private widgetEl: HTMLInputElement;
  private valueEl: HTMLSpanElement;
  private value: number;

  constructor(id: string, params: NumberWidgetParams) {
    super(id, params);
    this._updateUrl = params.updateUrl || true;
    this.value = params.value;
    this.createHtmlWidget(id, params.name, params.value, params.min, params.max, params.step);
    this.widgetEl = $(id) as HTMLInputElement;
    this.valueEl = $(`${id}-value`) as HTMLSpanElement;
    this.wrapperEl = $(`${id}-widget`) as HTMLDivElement;

    this.widgetEl.onchange = event => {
      this.set(parseFloat((event.target as HTMLInputElement).value) as number);
      this.valueEl.innerText = this.value.toString();
      if (this.updateUrl()) updateUrlParam(this.id, this.value);
      params.callback();
    };
  }

  override val(): number {
    return this.value;
  }

  createHtmlWidget(id: string, name: string, value: number, min: number, max: number, step?: number) {
    const html = [];
    html.push(`<div class="widget" id="${id}-widget">`);
    const stepAttr = step ? `step="${step}"` : '';
    html.push(`
      <input id="${id}" type="range" min="${min}" max="${max}" value="${value}" ${stepAttr}"/>
      ${name}
      <span id="${id}-value">${value}</span>
    `);
    html.push('</div>');
    // Find the anchor element and insert the constructed HTML as the last child
    const anchorElement = $('widgets');
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

interface SelectWidgetParams extends WidgetParams {
  value: string,
  choices: string[],
  callback: (...args: any[]) => void
}

class SelectWidget extends Widget {
  private widgetEl: HTMLInputElement;
  private value: string;

  constructor(id: string, params: SelectWidgetParams) {
    super(id, params);
    this.value = params.value;
    this.createHtmlWidget(id, params.name, params.value, params.choices);
    this.widgetEl = $(id) as HTMLInputElement;
    this.wrapperEl = $(`${id}-widget`) as HTMLDivElement;
    this._updateUrl = params.updateUrl || true;

    this.widgetEl.onchange = event => {
      this.set((event.target as HTMLInputElement).value);
      if (this.updateUrl()) updateUrlParam(this.id, this.value);
      params.callback(this);
    };
  }

  createHtmlWidget(id: string, name: string, value: string, choices: string[]) {
    const html = [];
    html.push(`<div class="widget" id="${id}-widget">`);
    html.push(name);
    html.push(`<select id="${this.id}">`);
    choices.forEach((choice: string) =>
      html.push(`<option ${choice===value ? 'selected' : ''}>${choice}</option>`));
    html.push('</select>');
    html.push('</div>');
    // Find the anchor element and insert the constructed HTML as the last child
    const anchorElement = $('widgets');
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

interface CheckboxWidgetParams extends WidgetParams {
  value: boolean;
  callback: (...args: any[]) => void;
}


class CheckboxWidget extends Widget {
  private widgetEl: HTMLInputElement;
  private value: boolean;

  constructor(id: string, params: CheckboxWidgetParams) {
    super(id, params)
    this.value = params.value;
    this.createHtmlWidget(id, params.name, params.value);
    this.widgetEl = $(id) as HTMLInputElement;
    this.wrapperEl = $(`${id}-widget`) as HTMLDivElement;
    this._updateUrl = params.updateUrl || true;

    this.widgetEl.onchange = event => {
      this.set((event.target as HTMLInputElement).checked);
      if (this.updateUrl()) updateUrlParam(this.id, this.value);
      params.callback.bind(this)();
    };
  }

  private createHtmlWidget(id: string, name: string, value: boolean) {
    const html = [];
    html.push(`<div class="widget" id="${id}-widget">`);
    html.push(`<input type="checkbox" id="${id}" ${value?'selected':''}> ${name}`);
    html.push(`</div>`);

    // Find the anchor element and insert the constructed HTML as the last child
    const anchorElement = $('widgets');
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

interface TextSaveWidgetParams extends WidgetParams {
  saveFilename: string,
}

class TextSaveWidget extends Widget {
    constructor(id: string, params: TextSaveWidgetParams) {
    super(id, params)
    this.createHtmlWidget(id, params.name);

    $(`${id}-copy`).onclick = () => {
      const text = ($(`${id}-text`) as HTMLInputElement).value;
      navigator.clipboard.writeText(text)
        .catch(err => {
          console.error('Failed to copy: ', err);
        });
    }

    $(id).onclick = () => {
      const textArea = $(`${id}-text`) as HTMLInputElement;
      const textToSave = textArea.value;
      const blob = new Blob([textToSave], {type:"text/plain;charset=utf-8"});
      const url = URL.createObjectURL(blob);
      const downloadLink = document.createElement("a");
      downloadLink.href = url;
      downloadLink.download = params.saveFilename;
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);
    }
  }

  private createHtmlWidget(id: string, name: string) {
    const html = `
      <div class="widget" id="${id}-widget">
        <button id="${id}">${name}</button>
        <button id="${id}-copy">Copy</button>
        <textarea id="${id}-text"></textarea>
      </div>
    `;
    const anchorElement = $('widgets');
    if (anchorElement) {
      anchorElement.insertAdjacentHTML('beforeend', html);
    }
  }
}

//============================================================================

interface SvgSaveWidgetParams extends WidgetParams {
  canvasId: string,
  saveFilename: string
}

class SvgSaveWidget extends Widget {
  constructor(id: string, params: SvgSaveWidgetParams) {
    super(id, params)
    this.createHtmlWidget(id, params.name);

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

  private createHtmlWidget(id: string, name: string) {
    const html = `
      <div class="widget" id="${id}-widget">
        <button id="${id}">${name}</button>
      </div>
    `;
    const anchorElement = $('widgets');
    if (anchorElement) {
      anchorElement.insertAdjacentHTML('beforeend', html);
    }
  }
}

//============================================================================

interface ImageInputWidgetParams extends WidgetParams {
  callback: (...args: any[]) => void;
  initialImage: string;
}

class ImageInputWidget extends Widget {
  private videoWidget: VideoStreamWidget;
  private imageWidget: ImageUploadWidget;
  private toggle: SelectWidget;

  constructor(id: string, params: ImageInputWidgetParams) {
    super(id, params);
    this.videoWidget = new VideoStreamWidget(`${id}-video`, {
      name: 'Video',
      callback: params.callback
    });
    this.videoWidget.hide();
    this.imageWidget = new ImageUploadWidget(`${id}-image`, {
      name: 'Image',
      callback: params.callback,
      initialImage: params.initialImage
    });
    this.toggle = new SelectWidget(`${id}-toggle`, {
      name: 'Mode',
      choices: ['Video', 'Image upload'],
      value: 'Image upload',
      callback: () => {
        if (this.toggle.val() === 'Video') {
          this.imageWidget.hide();
          this.videoWidget.show();
        } else {
          this.imageWidget.show();
          this.videoWidget.pauseStreaming();
          this.videoWidget.hide();
        }
      }
    });
  }

  canvas(): HTMLCanvasElement {
    return this.toggle.val() === 'Video'
      ? this.videoWidget.canvas()
      : this.imageWidget.canvas();
  }
}

//============================================================================

interface VideoStreamWidgetParams extends WidgetParams {
  callback: (...args: any[]) => void;
}

class VideoStreamWidget extends Widget {
  private videoEl: HTMLVideoElement;
  private canvasEl: HTMLCanvasElement;
  private startButtonEl: HTMLButtonElement;
  private isRunning: boolean;
  private animationId: number | null;
  private context: CanvasRenderingContext2D | null;
  private stream: MediaStream | null = null;
  private callback: (...args: any[]) => void;

  constructor(id: string, params: VideoStreamWidgetParams) {
    super(id, params);
    this.createHtmlWidget(id, params.name);
    this.wrapperEl = document.getElementById(`${id}-widget`) as HTMLDivElement;
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

  private createHtmlWidget(id: string, name: string) {
    const html = [];
    html.push(`<div class="widget" id="${id}-widget">`);
    html.push(`${name} <video id="${id}-video" autoplay playsinline webkit-playsinline muted hidden></video>`);
    html.push(`<canvas id="${id}-canvas"></canvas>`);
    html.push(`<button id="${id}-start">Start</button>`);
    html.push(`</div>`);
    const anchorElement = document.getElementById('widgets');
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

interface ImageUploadWidgetParams extends WidgetParams {
  callback: (...args: any[]) => void;
  initialImage: string;
}

class ImageUploadWidget extends Widget {
  private uploadEl: HTMLInputElement;
  private canvasEl: HTMLCanvasElement;
  private _imageUrl: string;
  private callback: (...args: any[]) => void;


  constructor(id: string, params: ImageUploadWidgetParams) {
    super(id, params);
    this._imageUrl = params.initialImage;
    this.callback = params.callback;
    this.createHtmlWidget(id, params.name);

    this.wrapperEl = document.getElementById(`${id}-widget`) as HTMLDivElement;
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

  private createHtmlWidget(id: string, name: string) {
    const html = [];
    html.push(`<div class="widget" id="${id}-widget">`);
    html.push(`${name} <input type="file" id="${id}-upload" accept="image/*"><br/>`);
    html.push(`<canvas id="${id}-canvas"></canvas>`);
    html.push(`</div>`);
    const anchorElement = document.getElementById('widgets');
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

interface TextWidgetParams extends WidgetParams {
  value: string,
  callback: (...args: any[]) => void
}

class TextWidget extends Widget {
  private widgetEl: HTMLInputElement;
  private buttonEl: HTMLButtonElement;
  private value: string;

  constructor(id: string, params: TextWidgetParams) {
    super(id, params);
    this.value = params.value;
    this.createHtmlWidget(id, params.name, params.value);
    this.widgetEl = $(id) as HTMLInputElement;
    this.wrapperEl = $(`${id}-widget`) as HTMLDivElement;
    this.buttonEl = $(`${id}-button`) as HTMLButtonElement;
    this._updateUrl = params.updateUrl || true;

    this.buttonEl.onclick = () => {
      this.set(this.widgetEl.value);
      if (this.updateUrl()) updateUrlParam(this.id, this.val());
      params.callback.bind(this)();
    };
  }

  private createHtmlWidget(id: string, name: string, value: string) {
    const html = [];
    html.push(`<div class="widget" id="${id}-widget">`);
    html.push(`
      <input id="${id}" value="${value}"/>
      <button id="${id}-button">Update</button>
      ${name}
    `);
    html.push('</div>');
    // Find the anchor element and insert the constructed HTML as the last child
    const anchorElement = $('widgets');
    if (anchorElement) {
      anchorElement.insertAdjacentHTML('beforeend', html.join(''));
    }
  }

  override set(newValue: string) {
    this.value = newValue;
    this.widgetEl.value = newValue.toString();
    return this.value;
  }

  override val() {
    return this.value;
  }
}

class TextAreaWidget extends Widget {
  private widgetEl: HTMLInputElement;
  private value;

  constructor(id: string, params: any) {
    super(id, params);
    this.value = params.value;
    this.createHtmlWidget(id, params.name, params.value);
    this.widgetEl = $(id) as HTMLInputElement;
    this.wrapperEl = $(`${id}-widget`) as HTMLDivElement;
    this._updateUrl = params.updateUrl || false;
    // text can be long so by default don't include it in the URL

    $(`${id}-button`).onclick = () => {
      this.set(this.widgetEl.value);
      if (this.updateUrl()) updateUrlParam(this.id, this.val());
      params.callback.bind(this)();
    };
  }

  private createHtmlWidget(id: string, name: string, value: number) {
    const html = [];
    html.push(`<div class="widget" id="${id}-widget">`);
    html.push(`
      ${name}
      <textarea id="${id}">${value}</textarea>
      <button id="${id}-button">Update</button>
    </div>`);
    // Find the anchor element and insert the constructed HTML as the last child
    const anchorElement = $('widgets');
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

// DEPRECATED: Use WidgetGroup instead.
const widgets: Widget[] = [];

// DEPRECATED: Use WidgetGroup.initializeParams() and WidgetGroup.getValues() instead.
const getParams = function(defaults: any = {}): Record<string, any> {
  const params: Record<string, any> = defaults;
  // iterate widgets with a value (i.e. not SVG save, for instance)
  widgets.forEach((widget: Widget) => {
    if (widget.val() !== undefined) { // if undefined the widget doesn't hold a value so skip
      const key: string = widget.id;
      if (widget.updateUrl()) {
        let value = paramFromQueryString(
          widget.id,
          window.location.search
        );
        if (value) {
          params[key] = value;
          widget.set(value);
        } else {
          value = widget.val();
          if (value) {
            params[key] = widget.val();
            updateUrlParam(key, params[key]);
          } else {
            params[key] = defaults[key];
          }
        }
      } else {
        params[key] = widget.val() || defaults[key];
      }
    }
  });
  return params;
}


export {
  NumberWidget,
  SelectWidget,
  CheckboxWidget,
  VideoStreamWidget,
  ImageUploadWidget,
  SvgSaveWidget,
  TextSaveWidget,
  TextWidget,
  TextAreaWidget,
  ImageInputWidget,
  paramsFromUrl,
  updateUrl,
  getParams, // Maintained for backward compatibility, but deprecated
  $,
  WidgetGroup // New class for managing groups of widgets
};

//============================================================================

class WidgetGroup {
  private widgets: Map<string, Widget> = new Map();

  add(widget: Widget): void {
    if (this.widgets.has(widget.id)) {
      console.warn(`WidgetGroup already has a widget with id: ${widget.id}`);
    }
    this.widgets.set(widget.id, widget);
  }

  getValues(): Record<string, any> {
    const values: Record<string, any> = {};
    this.widgets.forEach((widget, id) => {
      if (typeof widget.val === 'function') {
        const value = widget.val();
        if (value !== undefined) {
          values[id] = value;
        }
      }
    });
    return values;
  }

  setValues(newValues: Record<string, any>): void {
    this.widgets.forEach((widget, id) => {
      if (newValues.hasOwnProperty(id) && typeof widget.set === 'function') {
        widget.set(newValues[id]);
      }
    });
  }

  /**
   * Initializes widgets based on defaults and URL parameters.
   * The order of precedence for a parameter's value is:
   * 1. URL query string
   * 2. Provided defaults
   * 3. Widget's own initial value (from its constructor)
   *
   * Also updates the URL for widgets configured to do so.
   * @param defaults A record of default values for widgets.
   * @param queryString The URL query string (e.g., window.location.search).
   * @returns A record of the final effective parameters.
   */
  initializeParams(defaults: Record<string, any>, queryString: string): Record<string, any> {
    const urlParams = queryStringToObject(queryString);
    const effectiveParams: Record<string, any> = {};

    this.widgets.forEach((widget, id) => {
      let valueToSet: any;
      let valueSource: 'url' | 'default' | 'widgetInitial' = 'widgetInitial';

      if (urlParams.hasOwnProperty(id)) {
        valueToSet = urlParams[id];
        valueSource = 'url';
      } else if (defaults.hasOwnProperty(id)) {
        valueToSet = defaults[id];
        valueSource = 'default';
      } else {
        // Use the widget's current value if no URL or default is provided
        // This assumes the widget was initialized with a meaningful value in its constructor
        valueToSet = widget.val();
      }

      if (valueSource !== 'widgetInitial' && typeof widget.set === 'function') {
        widget.set(valueToSet);
      }
      
      // Store the effective value
      const finalValue = widget.val(); // Get value after potential set
      if (finalValue !== undefined) {
        effectiveParams[id] = finalValue;
      }


      // Update URL if the widget is configured to do so and has a value
      if (widget.updateUrl() && finalValue !== undefined) {
        updateUrlParam(id, finalValue);
      } else if (widget.updateUrl() && defaults.hasOwnProperty(id) && !urlParams.hasOwnProperty(id)) {
        // If widget should update URL, had a default, but wasn't in URL, add its default value to URL
        updateUrlParam(id, defaults[id]);
        if (finalValue === undefined && defaults[id] !== undefined) {
             effectiveParams[id] = defaults[id]; // Ensure default is in effectiveParams if widget.val() was undefined
        }
      }
    });
    return effectiveParams;
  }
}

