const htmlWidget = function(type, id, label, value, params) {
  const html = [];
  switch (type) {
  case 'select':
    html.push(`<select class="widget" id="${id}">`);
    params.options.forEach(option => {
      html.push(`<option>${option}</option>`);
    });
    html.push('</select><br/>');
    html.push(`
      <script data-type="widget-script" id="${id}-script">
        document.getElementById('${id}').value = '${value}';
        document.getElementById('${id}').addEventListener('change', () => {
          document.getElementById('canvas').innerHTML = render(widgetValues());
        })
      </script>
    `);
  break;
  case 'slider':
    html.push(`
      <span>
        <input class="widget" id="${id}" type="range" min="${params.min}" max="${params.max}" step="${params.step}" />
        ${label}:
        <span id="${id}-value">
      </span><br/>
      <script data-type="widget-script" id="${id}-script">
        document.getElementById('${id}').value = ${value};
        document.getElementById('${id}-value').innerText = ${value};
        document.getElementById('${id}').addEventListener('change', event => {
          document.getElementById('${id}-value').innerText = event.target.value;
          document.getElementById('canvas').innerHTML = render(widgetValues());
        });
      </script>
    `);
  break;
  case 'save-svg':
    html.push(`
      <button class="widget" id="${id}" onclick="saveSvg()">${label}</button><br/>
      <script data-type="widget-script" id="${id}-script">
        const saveSvg = function() {
          const svgEl = document.getElementById('${params.svgId}');
          svgEl.setAttribute("xmlns", "http://www.w3.org/2000/svg");
          var svgData = svgEl.outerHTML;
          var preface = '<?xml version="1.0" standalone="no"?>\\r\\n';
          var svgBlob = new Blob([preface, svgData], {type:"image/svg+xml;charset=utf-8"});
          var svgUrl = URL.createObjectURL(svgBlob);
          var downloadLink = document.createElement("a");
          downloadLink.href = svgUrl;
          downloadLink.download = '${params.filename}';
          document.body.appendChild(downloadLink);
          downloadLink.click();
          document.body.removeChild(downloadLink);
        }
      </script>
    `);
  break;
  }
  return html.join('');
}


const widgetValues = function() {
  const values = {};
  document.querySelectorAll('.widget').forEach(widget => {
    if (widget.type === 'range') {
      values[widget.id] = parseFloat(widget.value);
    } else {
      values[widget.id] = widget.value;
    }
  });
  return values;
};


const activateWidgets = function() {
  // Move all widget scripts at the bottom of the page and run them
  document.querySelectorAll("script[data-type='widget-script']").forEach(script => {
    const newScript = document.createElement('script');
    if (script.src) {
      newScript.src = script.src;
    } else {
      newScript.textContent = script.innerHTML;
    }
    document.body.appendChild(newScript);
    script.remove();
  });
};
