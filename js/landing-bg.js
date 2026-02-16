/**
 * Landing background — WebGL2 runner for Unicorn Studio scene JSON (gradient + aurora).
 * No SDK, no badge. Loads data/landing-scene.json and runs the compiled shaders.
 */
(function () {
  var canvas = document.getElementById('landing-bg-canvas');
  if (!canvas) return;

  var gl = canvas.getContext('webgl2', { alpha: false, antialias: true });
  if (!gl) return;

  var scene = null;
  var gradientProgram = null;
  var auroraProgram = null;
  var fbo = null;
  var fboTexture = null;
  var quadVAO = null;
  var quadBuffer = null;
  var startTime = Date.now() / 1000;
  var mousePos = [0.5, 0.5];

  function compileShader(gl, type, source) {
    var shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      console.error(gl.getShaderInfoLog(shader));
      gl.deleteShader(shader);
      return null;
    }
    return shader;
  }

  function createProgram(gl, vsSource, fsSource) {
    var vs = compileShader(gl, gl.VERTEX_SHADER, vsSource);
    var fs = compileShader(gl, gl.FRAGMENT_SHADER, fsSource);
    if (!vs || !fs) return null;
    var program = gl.createProgram();
    gl.attachShader(program, vs);
    gl.attachShader(program, fs);
    gl.linkProgram(program);
    gl.deleteShader(vs);
    gl.deleteShader(fs);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      console.error(gl.getProgramInfoLog(program));
      gl.deleteProgram(program);
      return null;
    }
    return program;
  }

  function setupQuad(gl) {
    var positions = new Float32Array([
      -1, -1, 0, 1,
      1, -1, 1, 1,
      -1, 1, 0, 0,
      -1, 1, 0, 0,
      1, -1, 1, 1,
      1, 1, 1, 0
    ]);
    var buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, positions, gl.STATIC_DRAW);
    return buf;
  }

  function resize() {
    var w = Math.max(canvas.clientWidth || 0, window.innerWidth || 300);
    var h = Math.max(canvas.clientHeight || 0, window.innerHeight || 150);
    if (w <= 0 || h <= 0) return;
    if (canvas.width !== w || canvas.height !== h) {
      canvas.width = w;
      canvas.height = h;
      gl.viewport(0, 0, w, h);
      if (fboTexture) {
        gl.bindTexture(gl.TEXTURE_2D, fboTexture);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA8, w, h, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
      }
    }
  }

  function initFramebuffer(w, h) {
    if (fbo) gl.deleteFramebuffer(fbo);
    if (fboTexture) gl.deleteTexture(fboTexture);
    fboTexture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, fboTexture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA8, w, h, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);

    fbo = gl.createFramebuffer();
    gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, fboTexture, 0);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
  }

  function drawFullscreenQuad(gl, program) {
    gl.bindBuffer(gl.ARRAY_BUFFER, quadBuffer);
    var posLoc = gl.getAttribLocation(program, 'aVertexPosition');
    var tcLoc = gl.getAttribLocation(program, 'aTextureCoord');
    gl.enableVertexAttribArray(posLoc);
    gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, 16, 0);
    gl.enableVertexAttribArray(tcLoc);
    gl.vertexAttribPointer(tcLoc, 2, gl.FLOAT, false, 16, 8);
    gl.drawArrays(gl.TRIANGLES, 0, 6);
  }

  function identity4() {
    return new Float32Array([
      1, 0, 0, 0,
      0, 1, 0, 0,
      0, 0, 1, 0,
      0, 0, 0, 1
    ]);
  }

  function render() {
    if (!gradientProgram || !auroraProgram) return;

    var w = canvas.width;
    var h = canvas.height;
    if (w <= 0 || h <= 0) return;

    var time = (Date.now() / 1000 - startTime);

    gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
    gl.viewport(0, 0, w, h);
    gl.clearColor(0.933, 0.933, 0.933, 1);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.useProgram(gradientProgram);
    var uMV = gl.getUniformLocation(gradientProgram, 'uMVMatrix');
    var uP = gl.getUniformLocation(gradientProgram, 'uPMatrix');
    var uMouseG = gl.getUniformLocation(gradientProgram, 'uMousePos');
    if (uMV) gl.uniformMatrix4fv(uMV, false, identity4());
    if (uP) gl.uniformMatrix4fv(uP, false, identity4());
    if (uMouseG) gl.uniform2f(uMouseG, mousePos[0], mousePos[1]);
    drawFullscreenQuad(gl, gradientProgram);

    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.viewport(0, 0, w, h);
    gl.clearColor(0.933, 0.933, 0.933, 1);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.useProgram(auroraProgram);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, fboTexture);
    var uTex = gl.getUniformLocation(auroraProgram, 'uTexture');
    var uTime = gl.getUniformLocation(auroraProgram, 'uTime');
    var uMouse = gl.getUniformLocation(auroraProgram, 'uMousePos');
    var uRes = gl.getUniformLocation(auroraProgram, 'uResolution');
    var uMV2 = gl.getUniformLocation(auroraProgram, 'uMVMatrix');
    var uP2 = gl.getUniformLocation(auroraProgram, 'uPMatrix');
    var uTexMat = gl.getUniformLocation(auroraProgram, 'uTextureMatrix');
    if (uTex) gl.uniform1i(uTex, 0);
    if (uTime) gl.uniform1f(uTime, time);
    if (uMouse) gl.uniform2f(uMouse, mousePos[0], mousePos[1]);
    if (uRes) gl.uniform2f(uRes, w, h);
    if (uMV2) gl.uniformMatrix4fv(uMV2, false, identity4());
    if (uP2) gl.uniformMatrix4fv(uP2, false, identity4());
    if (uTexMat) gl.uniformMatrix4fv(uTexMat, false, identity4());
    drawFullscreenQuad(gl, auroraProgram);
  }

  function loop() {
    resize();
    if (gradientProgram && auroraProgram) render();
    requestAnimationFrame(loop);
  }

  function onMouseMove(e) {
    var rect = canvas.getBoundingClientRect();
    mousePos[0] = (e.clientX - rect.left) / rect.width;
    mousePos[1] = 1.0 - (e.clientY - rect.top) / rect.height;
  }

  function init(sceneData) {
    scene = sceneData;
    var history = scene.history || [];
    var gradientLayer = history[0];
    var auroraLayer = history[1];
    if (!gradientLayer || !auroraLayer) return;

    var gradVs = (gradientLayer.compiledVertexShaders && gradientLayer.compiledVertexShaders[0]) || '';
    var gradFs = (gradientLayer.compiledFragmentShaders && gradientLayer.compiledFragmentShaders[0]) || '';
    var auroraVs = (auroraLayer.compiledVertexShaders && auroraLayer.compiledVertexShaders[0]) || '';
    var auroraFs = (auroraLayer.compiledFragmentShaders && auroraLayer.compiledFragmentShaders[0]) || '';

    gradientProgram = createProgram(gl, gradVs, gradFs);
    auroraProgram = createProgram(gl, auroraVs, auroraFs);
    if (!gradientProgram || !auroraProgram) return;

    quadBuffer = setupQuad(gl);
    var w = Math.max(canvas.clientWidth || 0, window.innerWidth || 300);
    var h = Math.max(canvas.clientHeight || 0, window.innerHeight || 150);
    if (w <= 0 || h <= 0) { w = window.innerWidth || 300; h = window.innerHeight || 150; }
    canvas.width = w;
    canvas.height = h;
    initFramebuffer(w, h);
    gl.viewport(0, 0, w, h);

    canvas.addEventListener('mousemove', onMouseMove);
    loop();
  }

  function run() {
    var jsonPath = document.currentScript && document.currentScript.getAttribute('data-scene');
    if (!jsonPath) jsonPath = './strand_remix.json';
    fetch(jsonPath)
      .then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); })
      .then(function (data) {
        if (!data.history || data.history.length < 2) throw new Error('Invalid scene JSON');
        init(data);
      })
      .catch(function (e) { console.warn('Landing scene load failed:', e); });
  }

  function start() {
    run();
  }
  if (document.readyState === 'loading') {
    window.addEventListener('load', start);
  } else {
    start();
  }
})();
