import {
  NumberControl,
  ImageInputControl,
  SvgSaveControl,
  getParams,
  $
} from './controls';

async function getData() {
  try {
    const response: Response = await fetch('apoo.txt');
    if (!response.ok) {
      throw new Error(`Response status: ${response.status}`);
    }
    const text = await response.text();
    return text.replace(/\n+/g, ' - ');
  } catch (error: any) {
    console.error(error.message);
    return 'error';
  }
}

const defaultParams = {
  inputImageUrl: 'moon-boot.jpg',
  text: await getData(),
  width: 800,
  height: 800,
  cutoff: 255,
  fontSize: 3,
  nbLayers: 4
};

const textorizer2Worker = new Worker('build/textorizer2-ww.js');
textorizer2Worker.onmessage = function(e) {
  $('canvas').innerHTML = e.data;
}


const doRender = function() {
  const params = getParams(defaultParams, false);
  console.log('dorender', params);
  const widths = glyphWidths('AVHershey Simplex', params['fontSize']);
  const canvas = imageSourceControl.canvas();
  const ctx = canvas.getContext('2d') as CanvasRenderingContext2D;
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  textorizer2Worker.postMessage({ params, widths, imageData });
};


const imageSourceControl = new ImageInputControl('imageSource', {
  name: 'Source',
  callback: doRender,
  initialImage: defaultParams['inputImageUrl'],
  updateUrl: false
});


new NumberControl('cutoff', {
  name: 'White cutoff',
  value: defaultParams['cutoff'],
  callback: doRender,
  min: 0,
  max: 255,
  updateUrl: false
});


new NumberControl('fontSize', {
  name: 'Font size',
  value: defaultParams['fontSize'],
  callback: doRender,
  min: 1,
  max: 10,
  step: 0.1,
  updateUrl: false
});

new NumberControl('nbLayers', {
  name: 'Layers',
  value: defaultParams['nbLayers'],
  callback: doRender,
  min: 1,
  max: 10,
  updateUrl: false
});


new SvgSaveControl('svgSave', {
  canvasId: 'svg-canvas',
  name: 'Save SVG',
  saveFilename: 'textorizer2.svg'
});


const glyphWidths = function(fontFamily: string, fontSize: number): Record<string, number> {
  const widths: Record<string, number> = {};
  const playground: HTMLElement | null = document.querySelector('#playground');
  if (playground) {
    playground.style.display = 'block';
    const textElement = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    textElement.setAttribute('x', '10');
    textElement.setAttribute('y', '50');
    textElement.setAttribute('font-size', fontSize.toString());
    textElement.setAttribute('font-family', fontFamily);
    textElement.setAttribute('stroke', 'none');
    textElement.setAttribute('fill', 'black');
    playground.appendChild(textElement);
    const allAsciiChars = Array.from({ length: 95 }, (_, i) => String.fromCharCode(i+32)).join('');
    for (let glyph of allAsciiChars) {
      textElement.textContent = glyph;
      widths[glyph] = textElement.getComputedTextLength();
    };

    // whitespace
    textElement.textContent = 'aa';
    const wwithout = textElement.getComputedTextLength();
    textElement.textContent = 'a a';
    const wwith = textElement.getComputedTextLength();
    widths[' '] = wwith - wwithout;
    playground.style.display = 'none';
  }
  return widths;
};
