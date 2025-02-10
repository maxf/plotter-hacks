import {
  NumberControl,
  ImageInputControl,
  SvgSaveControl,
  TextControl,
  getParams,
  $
} from './controls';


const defaultParams = {
  inputImageUrl: 'portrait.jpg',
  text: "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum. ",
  width: 800,
  height: 800,
  cutoff: 85,
};

const textorizer2Worker = new Worker('build/textorizer2-ww.js');
textorizer2Worker.onmessage = function(e) {
  $('canvas').innerHTML = e.data;
}


const doRender = function() {
  const params = getParams(defaultParams);
  const widths = glyphWidths('hershey font', 10);
  const canvas = imageSourceControl.canvas();
  const ctx = canvas.getContext('2d') as CanvasRenderingContext2D;
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  textorizer2Worker.postMessage({ params, widths, imageData });
};


const imageSourceControl = new ImageInputControl('imageSource', {
  name: 'Source',
  callback: doRender,
  initialImage: 'joyce.jpg'
});


new TextControl('text', {
  name: 'text',
  value: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.',
  callback: doRender,
});


new NumberControl('cutoff', {
  name: 'White cutoff',
  value: defaultParams['cutoff'],
  callback: doRender,
  min: 0,
  max: 255
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
      const bbox = textElement.getBBox();
      widths[glyph] = bbox.width;
    };
    // whitespace is special as getBBox() returns 0 width since nothing is drawn
    widths[' '] = widths['n']; // arbitrarily, let's use n-width
    playground.style.display = 'none';
  }
  return widths;
};
