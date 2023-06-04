'use strict';

let gl; // The webgl context.
let surface; // A surface model
let sphere; // A surface sphere
let shProgram; // A shader program
let spaceball; // A SimpleRotator object that lets the user rotate the view by mouse.
let texture;

let stereoCam;

let deviceOrient;

let step = 0;
let sphereCoords = [0, 0, 0];

function deg2rad(angle) {
  return (angle * Math.PI) / 180;
}

// Constructor
function Model(name) {
  this.name = name;
  this.count = 0;
  this.iVertexBuff = gl.createBuffer();
  this.iTextureBuff = gl.createBuffer();

  this.BufferData = function (vertices, textCoords) {
    // vertices
    gl.bindBuffer(gl.ARRAY_BUFFER, this.iVertexBuff);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STREAM_DRAW);

    // textCoords
    gl.bindBuffer(gl.ARRAY_BUFFER, this.iTextureBuff);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(textCoords), gl.STREAM_DRAW);

    this.count = vertices.length / 3;
  };

  this.Draw = function () {
    gl.bindBuffer(gl.ARRAY_BUFFER, this.iVertexBuff);
    gl.vertexAttribPointer(shProgram.iAttribVertex, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(shProgram.iAttribVertex);

    gl.bindBuffer(gl.ARRAY_BUFFER, this.iTextureBuff);
    gl.vertexAttribPointer(shProgram.iAttribTextCoords, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(shProgram.iAttribTextCoords);

    gl.drawArrays(gl.TRIANGLE_STRIP, 0, this.count);
  };

  this.DrawSphere = function () {
    this.Draw();
    gl.drawArrays(gl.LINE_STRIP, 0, this.count);
  };
}

// Constructor
function ShaderProgram(name, program) {
  this.name = name;
  this.prog = program;

  this.iAttribVertex = -1;
  this.iColor = -1;

  this.iModelViewProjectionMatrix = -1;
  // normals
  this.iNormalMatrix = 0;
  // light pos
  this.iLightPos = 0;
  // textCoords
  this.iAttribTextCoords = -1;

  this.Use = function () {
    gl.useProgram(this.prog);
  };
}

function draw() {
  gl.colorMask(false, false, true, true);
  drawRight();

  gl.colorMask(true, false, false, true);
  drawLeft();

  gl.colorMask(true, true, true, true);
  drawSphere();
}

function initGL() {
  stereoCam = {
    aspectRatio: 1,
    convergence: 40,
    eyeSeparation: 2,
    far: 2000,
    fov: 0.4,
    near: 16.5,
  };

  let prog = createProgram(gl, vertexShaderSource, fragmentShaderSource);

  shProgram = new ShaderProgram('Basic', prog);
  shProgram.Use();

  shProgram.iAttribVertex = gl.getAttribLocation(prog, 'vertex');
  shProgram.iAttribTextCoords = gl.getAttribLocation(prog, 'textCoords');
  shProgram.iModelViewProjectionMatrix = gl.getUniformLocation(prog, 'ModelViewProjectionMatrix');
  shProgram.iNormalMatrix = gl.getUniformLocation(prog, 'normalMatrix');

  surface = new Model('Surface');
  surface.BufferData(...createSurfaceData());

  sphere = new Model('AudioSphere');
  sphere.BufferData(...createSphereData(10, 500, 500));

  gl.enable(gl.DEPTH_TEST);
}

function createProgram(gl, vShader, fShader) {
  let vsh = gl.createShader(gl.VERTEX_SHADER);
  gl.shaderSource(vsh, vShader);
  gl.compileShader(vsh);
  if (!gl.getShaderParameter(vsh, gl.COMPILE_STATUS)) {
    throw new Error('Error in vertex shader:  ' + gl.getShaderInfoLog(vsh));
  }
  let fsh = gl.createShader(gl.FRAGMENT_SHADER);
  gl.shaderSource(fsh, fShader);
  gl.compileShader(fsh);
  if (!gl.getShaderParameter(fsh, gl.COMPILE_STATUS)) {
    throw new Error('Error in fragment shader:  ' + gl.getShaderInfoLog(fsh));
  }
  let prog = gl.createProgram();
  gl.attachShader(prog, vsh);
  gl.attachShader(prog, fsh);
  gl.linkProgram(prog);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
    throw new Error('Link error in program:  ' + gl.getProgramInfoLog(prog));
  }
  return prog;
}

function reDraw() {
  draw();
  window.requestAnimationFrame(reDraw);
}

/**
 * initialization function that will be called when the page has loaded
 */
function init() {
  let canvas;
  try {
    canvas = document.getElementById('webglcanvas');
    gl = canvas.getContext('webgl');
    if (!gl) {
      throw 'Browser does not support WebGL';
    }
  } catch (e) {
    console.error(e);
    document.getElementById('canvas-holder').innerHTML =
      '<p>Sorry, could not get a WebGL graphics context.</p>';
    return;
  }
  try {
    initGL(); // initialize the WebGL graphics context
  } catch (e) {
    console.error(e);
    document.getElementById('canvas-holder').innerHTML =
      '<p>Sorry, could not initialize the WebGL graphics context: ' + e + '</p>';
    return;
  }

  spaceball = new TrackballRotator(canvas, draw, 0);

  const eyeSeparationInput = document.getElementById('eyeSeparation');
  const convergenceInput = document.getElementById('convergence');
  const fovInput = document.getElementById('fov');
  const nearInput = document.getElementById('near');

  const onViewChange = () => {
    stereoCam.eyeSeparation = parseFloat(eyeSeparationInput.value);
    stereoCam.convergence = parseFloat(convergenceInput.value);
    stereoCam.fov = deg2rad(parseFloat(fovInput.value));
    stereoCam.near = parseFloat(nearInput.value);
    draw();
  };

  eyeSeparationInput.addEventListener('input', onViewChange);
  convergenceInput.addEventListener('input', onViewChange);
  fovInput.addEventListener('input', onViewChange);
  nearInput.addEventListener('input', onViewChange);

  const audioBtn = document.getElementById('audio');
  audioBtn.addEventListener('click', () => loadAudio('sound.mp3'));

  const soundFilterElement = document.getElementById('filter');
  soundFilterElement.addEventListener('change', () => {
    if (soundFilterElement.checked) {
      panner?.disconnect();
      panner?.connect?.(filter);
      filter?.connect?.(ctx.destination);
    } else {
      panner?.disconnect();
      panner?.connect?.(ctx.destination);
    }
  });

  const image = new Image();
  const imgURL =
    'https://www.the3rdsequence.com/texturedb/download/9/texture/jpg/1024/brick+wall-1024x1024.jpg';

  image.src = imgURL;
  image.crossOrigin = 'anonymous';
  image.onload = () => {
    setTexture(gl, image);
    draw();
  };

  const deviceOrientBtn = document.getElementById('deviceOrient');
  deviceOrientBtn.addEventListener('click', handleDeviceOrient);

  reDraw();
}

function setTexture(gl, image) {
  texture = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
}
