
export const DriveMadHTML = `
<!DOCTYPE html>
<html lang="en-us">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=no">
  <title>Drive Mad</title>
  
  <!-- CRITICAL FIX: Base tag ensures WASM and Data files are found -->
  <base href="https://deckard.openprocessing.org/user485717/visual2458132/hf42bec4b58ab09712c0f3bedb92cada1/">

  <style>
    @font-face {
      font-family: 'baloo 2';
      font-style: normal;
      font-weight: 800;
      font-display: swap;
      src: url(baloo2.woff) format('woff');
    }
    
    body, html {
      margin: 0;
      padding: 0;
      width: 100%;
      height: 100%;
      background-color: #000;
      overflow: hidden;
    }

    /* Hide the original loading UI to show our own App UI instead if desired, 
       but keeping core structure intact */
    .edge { display: none; }
    #progress_or_play { display: none; }

    canvas {
      display: block;
      width: 100%;
      height: 100%;
      outline: none;
    }
    
    .emscripten_border {
        width: 100%;
        height: 100%;
        position: absolute;
        top: 0;
        left: 0;
    }
  </style>
</head>
<body>
  <div class="emscripten_border">
    <canvas class="emscripten" id="canvas" oncontextmenu="event.preventDefault()" tabindex="-1"></canvas>
  </div>

  <!-- Game Glue Code -->
  <script type="text/javascript">
    var Module = {
      preRun: [],
      postRun: [function() {
        console.log("Drive Mad Engine Loaded");
        // Force resize to fit iframe
        window.dispatchEvent(new Event('resize'));
      }],
      print: function(text) {
        if (arguments.length > 1) text = Array.prototype.slice.call(arguments).join(' ');
        console.log(text);
      },
      printErr: function(text) {
        if (arguments.length > 1) text = Array.prototype.slice.call(arguments).join(' ');
        console.error(text);
      },
      canvas: (function() {
        var canvas = document.getElementById('canvas');
        canvas.addEventListener("webglcontextlost", function(e) { alert('WebGL context lost. You will need to reload the page.'); e.preventDefault(); }, false);
        return canvas;
      })(),
      setStatus: function(text) {
        if (text) console.log(text);
      },
      totalDependencies: 0,
      monitorRunDependencies: function(left) {
        this.totalDependencies = Math.max(this.totalDependencies, left);
      },
      // Force asset location to the base URL
      locateFile: function(path, prefix) {
        if (path.endsWith('.wasm')) return 'https://deckard.openprocessing.org/user485717/visual2458132/hf42bec4b58ab09712c0f3bedb92cada1/index.wasm';
        if (path.endsWith('.data')) return 'https://deckard.openprocessing.org/user485717/visual2458132/hf42bec4b58ab09712c0f3bedb92cada1/index.data';
        return prefix + path;
      }
    };

    window.onerror = function(event) {
      console.error("Game Error:", event);
    };
  </script>

  <!-- Load the Original Game Scripts -->
  <script async type="text/javascript" src="https://deckard.openprocessing.org/user485717/visual2458132/hf42bec4b58ab09712c0f3bedb92cada1/index.wasm.js"></script>
  <script async type="text/javascript" src="https://deckard.openprocessing.org/user485717/visual2458132/hf42bec4b58ab09712c0f3bedb92cada1/index.data.js"></script>
  
  <script>
    // Focus helper
    window.addEventListener('click', function() {
        if(document.getElementById('canvas')) document.getElementById('canvas').focus();
    });
  </script>
</body>
</html>
`;
