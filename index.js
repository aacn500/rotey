(function() {
  'use strict';

  const WIDTH = window.innerWidth;
  const HEIGHT = window.innerHeight*0.996;

  const VIEW_ANGLE = 45;
  const ASPECT = WIDTH / HEIGHT;
  const NEAR = 0.1;
  const FAR = 10000;

  const MAX_ROT = Math.PI/25;

  const SIDE = 50;
  //              EAST      WEST      NORTH     SOUTH     FORWARD   REVERSE
  //              RED       GREEN     BLUE      YELLOW    VIOLET    CYAN
  const COLORS = [0xFF0000, 0x00FF00, 0x0000FF, 0xFFFF00, 0xEE82EE, 0x20B2AA];

  let renderer, camera, scene;

  let cube;
  let rotate = false;
  let desiredRotation = {x: 0, y: 0};

  class FaceRep {
    constructor(color) {
      this.color = color;
      this.north;
      this.south;
      this.west;
      this.east;
      this.reverse;
    }

    setJoiningFaces(north, south, west, east, reverse) {
      this.north = north;
      this.south = south;
      this.west = west;
      this.east = east;
      this.reverse = reverse;
    }
  }

  class CubeRep {
    constructor() {
      this.forwardFace;
      this.upDirection;
      let faces = [];
      for (let i = 0; i < COLORS.length; i++) {
        faces.push(new FaceRep(COLORS[i]));
      }
      faces[0].setJoiningFaces(faces[2], faces[3], faces[4], faces[5], faces[1]);
      faces[1].setJoiningFaces(faces[2], faces[3], faces[5], faces[4], faces[0]);
      faces[2].setJoiningFaces(faces[5], faces[4], faces[1], faces[0], faces[3]);
      faces[3].setJoiningFaces(faces[5], faces[4], faces[0], faces[1], faces[2]);
      faces[4].setJoiningFaces(faces[2], faces[3], faces[1], faces[0], faces[5]);
      faces[5].setJoiningFaces(faces[2], faces[3], faces[0], faces[1], faces[4]);
    }
  }

  function setDesiredRotation(x, y) {
    if (rotate) {
      if (desiredRotation.x != 0 || desiredRotation.y != 0) {
        // only set rotation in one axis
        return;
      }
      if (x != 0) {
        desiredRotation.x = x;
      }
      if (y != 0) {
        desiredRotation.y = y;
      }
    }
  }

  function rotateAroundWorldMatrix(object, axis, radians) {
    let rotWorldMatrix = new THREE.Matrix4();
    rotWorldMatrix.makeRotationAxis(axis.normalize(), radians);
    rotWorldMatrix.multiply(object.matrix);
    object.matrix = rotWorldMatrix;
    object.rotation.setFromRotationMatrix(object.matrix);
  }

  function getDesiredRotation() {
    if (desiredRotation.x != 0) {
      if (desiredRotation.x > 0) {
        let rotx = Math.min(MAX_ROT, Math.abs(desiredRotation.x));
        desiredRotation.x -= rotx;
        return {x: rotx, y: 0};
      } else {
        let rotx = Math.min(MAX_ROT, Math.abs(desiredRotation.x));
        desiredRotation.x += rotx;
        return {x: -rotx, y: 0};
      }
    } else if (desiredRotation.y != 0) {
      if (desiredRotation.y > 0) {
        let roty = Math.min(MAX_ROT, Math.abs(desiredRotation.y));
        desiredRotation.y -= roty;
        return {x: 0, y: roty};
      } else {
        let roty = Math.min(MAX_ROT, Math.abs(desiredRotation.y));
        desiredRotation.y += roty;
        return {x: 0, y: -roty};
      }
    }
    return {x: 0, y: 0};
  }

  let xAxis = new THREE.Vector3(1, 0, 0);
  let yAxis = new THREE.Vector3(0, 1, 0);

  function update() {
    renderer.render(scene, camera);
    let rot = getDesiredRotation();
    rotateAroundWorldMatrix(cube, xAxis, rot.x);
    rotateAroundWorldMatrix(cube, yAxis, rot.y);
    requestAnimationFrame(update);
  }

  function toggleRotate() {
    rotate = !rotate;
  }

  function init() {
    renderer = new THREE.WebGLRenderer();
    renderer.setClearColor(0xAAAAAA, 1);
    camera = new THREE.PerspectiveCamera(VIEW_ANGLE, ASPECT, NEAR, FAR);
    scene = new THREE.Scene();

    scene.add(camera);
    renderer.setSize(WIDTH, HEIGHT);
    const container = document.querySelector('#container');
    container.appendChild(renderer.domElement);

    const cubeMaterial = new THREE.MeshLambertMaterial({color: 0xFFFFFF});
    cubeMaterial.vertexColors = THREE.FaceColors;

    const cubeGeometry = new THREE.BoxGeometry(SIDE, SIDE, SIDE, 1, 1, 1);
    for (let i = 0; i < 6; i++) {
      let r = Math.random();
      let g = Math.random();
      let b = Math.random();
      cubeGeometry.faces[2*i].color.setHex(COLORS[i]);
      cubeGeometry.faces[2*i+1].color.setHex(COLORS[i]);
    }
    cubeGeometry.colorsNeedUpdate = true;

    cube = new THREE.Mesh(cubeGeometry, cubeMaterial);
    cube.position.z = -200;
    scene.add(cube);

    const ambientLight = new THREE.AmbientLight(0xFFFFFF, 0.5);
    scene.add(ambientLight);

    const pointLight = new THREE.PointLight(0xFFFFFF, 0.8);

    pointLight.position.x = 10;
    pointLight.position.y = 50;
    pointLight.position.z = 0;
    scene.add(pointLight);

    requestAnimationFrame(update);

    document.addEventListener('keydown', function(event) {
      console.log(cube.matrixWorld);
      if (event.key === " ") {
        toggleRotate();
      }
      if (event.key === "ArrowLeft") {
        setDesiredRotation(0, Math.PI / 2);
      }
      if (event.key === "ArrowRight") {
        setDesiredRotation(0, -Math.PI / 2);
      }
      if (event.key === "ArrowUp") {
        setDesiredRotation(Math.PI / 2, 0);
      }
      if (event.key === "ArrowDown") {
        setDesiredRotation(-Math.PI / 2, 0);
      }
    });
  }

  init();

})();
