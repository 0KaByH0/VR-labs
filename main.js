'use strict';

let gl; // The webgl context.
let surface; // A surface model
let shProgram; // A shader program
let spaceball; // A SimpleRotator object that lets the user rotate the view by mouse.

let stereoCam;

function deg2rad(angle) {
  return (angle * Math.PI) / 180;
}

// Constructor
function Model(name) {
  this.name = name;
  this.vertices = 0;
  this.count = 0;

  this.BufferData = function (vertices, textCoords) {
    // vertices
    const vBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STREAM_DRAW);
    gl.enableVertexAttribArray(shProgram.iAttribVertex);
    gl.vertexAttribPointer(shProgram.iAttribVertex, 3, gl.FLOAT, false, 0, 0);

    // textCoords
    const tBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, tBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(textCoords), gl.STREAM_DRAW);
    gl.enableVertexAttribArray(shProgram.iAttribTextCoords);
    gl.vertexAttribPointer(shProgram.iAttribTextCoords, 2, gl.FLOAT, false, 0, 0);

    this.count = vertices.length / 3;
    this.vertices = vertices;
  };

  this.Draw = function () {
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, this.count);
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
  gl.clearColor(0, 0, 0, 1);

  gl.clear(gl.DEPTH_BUFFER_BIT);
  gl.colorMask(true, false, false, true);
  drawLeft();
  gl.clear(gl.DEPTH_BUFFER_BIT);
  gl.colorMask(false, true, true, true);
  drawRight();
}

function rerender() {
  surface.BufferData(...createSurfaceData());
  draw();

  document.getElementById('userCoords').innerHTML = `User point cords: X:${userX} Y:${userY}`;
}

function initGL() {
  let prog = createProgram(gl, vertexShaderSource, fragmentShaderSource);

  shProgram = new ShaderProgram('Basic', prog);
  shProgram.Use();

  shProgram.iAttribVertex = gl.getAttribLocation(prog, 'vertex');
  shProgram.iAttribTextCoords = gl.getAttribLocation(prog, 'textCoords');
  shProgram.iModelViewProjectionMatrix = gl.getUniformLocation(prog, 'ModelViewProjectionMatrix');
  shProgram.iNormalMatrix = gl.getUniformLocation(prog, 'normalMatrix');

  surface = new Model('Surface');
  surface.BufferData(...createSurfaceData());

  const ap = gl.canvas.width / gl.canvas.height;

  stereoCam = { eyeSeparation: 2, convergence: 40, aspectRatio: ap, fov: 1.5, near: 10, far: 2000 };

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

  const videoElement = document.querySelector('video');

  navigator.mediaDevices
    .getUserMedia({ video: true })
    .then((stream) => {
      videoElement.srcObject = stream;
      videoElement.play();
    })
    .catch((error) => {
      console.error('Error accessing user media', error);
    });

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

  const image = new Image();
  const imgURL =
    'https://www.the3rdsequence.com/texturedb/download/9/texture/jpg/1024/brick+wall-1024x1024.jpg';

  image.src = imgURL;
  image.crossOrigin = 'anonymous';
  image.onload = () => {
    setTexture(gl, image);
    draw();
  };

  draw();
}

function setTexture(gl, image) {
  const texture = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
}
