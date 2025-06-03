import './style.css'
import * as THREE from 'three'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'
import fragmentShader from './glsl/main.frag';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

console.log('Imported fragment shader:', fragmentShader);

const scene = new THREE.Scene()

// --- Enhanced Lighting ---
// Remove old lights
scene.clear();
// Add a dramatic sky light
const hemiLight = new THREE.HemisphereLight(0x88aaff, 0x222233, 1.2);
scene.add(hemiLight);

// Add a strong sun light with shadows
const sunLight = new THREE.DirectionalLight(0xffffff, 1.5);
sunLight.position.set(10, 20, 10);
sunLight.castShadow = true;
sunLight.shadow.mapSize.width = 2048;
sunLight.shadow.mapSize.height = 2048;
sunLight.shadow.camera.left = -10;
sunLight.shadow.camera.right = 10;
sunLight.shadow.camera.top = 10;
sunLight.shadow.camera.bottom = -10;
sunLight.shadow.camera.near = 1;
sunLight.shadow.camera.far = 50;
scene.add(sunLight);

// --- Racing Game: Add Player Car ---
// Remove the green cube, use a car instead
//scene.remove(cube)

// Simple car: a colored box
// const carGeometry = new THREE.BoxGeometry(0.4, 0.2, 0.7)
// const carMaterial = new THREE.MeshLambertMaterial({ color: 0xff3333 })
// const car = new THREE.Mesh(carGeometry, carMaterial)
// car.castShadow = true
// car.position.set(0, 0.1, 0)
// scene.add(car)

let car: THREE.Object3D | null = null;
const loader = new GLTFLoader();
loader.load('/models/bluebumpercar2.glb', (gltf) => {
  car = gltf.scene;
  // Center and scale the car for visibility
  car.position.set(0, 0.1, 0);
  car.scale.set(1.2, 1.2, 1.2); // Adjust as needed for your model
  // Optionally rotate if the car faces the wrong way
  // car.rotation.y = Math.PI;
  car.traverse((obj) => {
    if (obj instanceof THREE.Mesh) {
      obj.castShadow = true;
      obj.receiveShadow = true;
      // Fix material if too dark
      if (obj.material) {
        obj.material.side = THREE.FrontSide;
        obj.material.color = new THREE.Color(0x6699ff);
        obj.material.metalness = 0.2;
        obj.material.roughness = 0.7;
      }
    }
  });
  scene.add(car);
}, undefined, (error) => {
  console.error('Error loading car model:', error);
});

// --- Hover Car Physics ---
// 4 control points (front left, front right, rear left, rear right)
const controlOffsets = [
  new THREE.Vector3(-0.18, 0,  0.32), // FL
  new THREE.Vector3( 0.18, 0,  0.32), // FR
  new THREE.Vector3(-0.18, 0, -0.32), // RL
  new THREE.Vector3( 0.18, 0, -0.32)  // RR
];
const hoverHeight = 0.18;
const hoverStiffness = 0.18;
const hoverDamping = 0.18;
const gravity = -0.25;
let carVelocity = new THREE.Vector3();
let carAngularVel = 0;

// --- Controls ---
const input = { forward: false, backward: false, left: false, right: false };
window.addEventListener('keydown', e => {
  if (e.code === 'ArrowUp' || e.code === 'KeyW') input.forward = true;
  if (e.code === 'ArrowDown' || e.code === 'KeyS') input.backward = true;
  if (e.code === 'ArrowLeft' || e.code === 'KeyA') input.left = true;
  if (e.code === 'ArrowRight' || e.code === 'KeyD') input.right = true;
});
window.addEventListener('keyup', e => {
  if (e.code === 'ArrowUp' || e.code === 'KeyW') input.forward = false;
  if (e.code === 'ArrowDown' || e.code === 'KeyS') input.backward = false;
  if (e.code === 'ArrowLeft' || e.code === 'KeyA') input.left = false;
  if (e.code === 'ArrowRight' || e.code === 'KeyD') input.right = false;
});

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000)
camera.position.set(0, 5, -10);
camera.lookAt(new THREE.Vector3(0, 0.5, 5));

const renderer = new THREE.WebGLRenderer()
renderer.setSize(window.innerWidth, window.innerHeight)
renderer.shadowMap.enabled = true
renderer.shadowMap.type = THREE.PCFSoftShadowMap
document.body.appendChild(renderer.domElement)

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight
  camera.updateProjectionMatrix()
  renderer.setSize(window.innerWidth, window.innerHeight)
})

new OrbitControls(camera, renderer.domElement)

// --- Remove old ground plane from scene if present ---
scene.traverse(obj => {
  if (obj instanceof THREE.Mesh && obj.material instanceof THREE.MeshPhongMaterial && obj.material.color.getHex() === 0x222222) {
    scene.remove(obj);
  }
});

// --- Remove previous track meshes ---
scene.traverse(obj => {
  if (obj instanceof THREE.Mesh && obj.material instanceof THREE.MeshPhongMaterial && (obj.material.color.getHex() === 0x8b5a2b || obj.material.color.getHex() === 0x444444)) {
    scene.remove(obj);
  }
});

// --- Add a wide straightaway under the car ---
const straightWidth = 18;
const straightLength = 100;
const straightGeo = new THREE.BoxGeometry(straightWidth, 0.2, straightLength);
const straightMat = new THREE.MeshPhongMaterial({ color: 0x8b5a2b, shininess: 20 });
const straightMesh = new THREE.Mesh(straightGeo, straightMat);
straightMesh.position.set(0, 0.1, straightLength / 2 - 10); // Centered under car, extends forward
straightMesh.castShadow = false;
straightMesh.receiveShadow = true;
scene.add(straightMesh);

// Remove any remaining barrier meshes from previous track
scene.traverse(obj => {
  if (obj instanceof THREE.Mesh && obj.material instanceof THREE.MeshPhongMaterial && (obj.material.color.getHex() === 0xff4444 || obj.material.color.getHex() === 0xffffff)) {
    scene.remove(obj);
  }
});

// --- Animate ---
function animate() {
  requestAnimationFrame(animate);

  if (car) {
    // --- Hover Physics ---
    let force = new THREE.Vector3();
    let torque = 0;
    for (let i = 0; i < 4; ++i) {
      // World position of control point
      const local = controlOffsets[i].clone();
      local.applyAxisAngle(new THREE.Vector3(0,1,0), car.rotation.y);
      const world = car.position.clone().add(local);
      // Distance to ground
      const groundY = 0;
      const pointY = world.y;
      const dy = hoverHeight - (pointY - groundY);
      // Velocity at point
      const vel = carVelocity.clone().add(new THREE.Vector3(-local.z * carAngularVel, 0, local.x * carAngularVel));
      // Spring force
      const spring = dy * hoverStiffness - vel.y * hoverDamping;
      force.y += spring / 4;
      // Lateral friction (simple)
      force.x -= vel.x * 0.04 / 4;
      force.z -= vel.z * 0.04 / 4;
      // Torque for tilt correction
      if (i < 2) torque -= local.x * spring * 0.5; // front
      else torque += local.x * spring * 0.5; // rear
    }
    // Gravity
    force.y += gravity;

    // --- Controls: Forward/Back/Turn ---
    const forward = new THREE.Vector3(Math.sin(car.rotation.y), 0, Math.cos(car.rotation.y));
    if (input.forward) {
      carVelocity.add(forward.clone().multiplyScalar(0.012));
    }
    if (input.backward) {
      carVelocity.add(forward.clone().multiplyScalar(-0.008));
    }
    if (input.left) {
      carAngularVel += 0.0025;
    }
    if (input.right) {
      carAngularVel -= 0.0025;
    }
    // Damping
    carVelocity.multiplyScalar(0.985);
    carAngularVel *= 0.97;

    // Integrate
    carVelocity.add(force);
    car.position.add(carVelocity);
    car.rotation.y += carAngularVel;
    // Prevent sinking
    if (car.position.y < 0.05) car.position.y = 0.05;
  }

  renderer.render(scene, camera)
}

animate()
