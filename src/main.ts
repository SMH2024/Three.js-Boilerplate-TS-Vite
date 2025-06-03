import './style.css'
import * as THREE from 'three'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'
import Stats from 'three/addons/libs/stats.module.js'
import { GUI } from 'lil-gui'
import fragment from './glsl/main.frag';

console.log('Imported fragment shader:', fragment);

const scene = new THREE.Scene()

// Add lighting to the scene
// Ambient light for overall illumination
const ambientLight = new THREE.AmbientLight(0x404040, 0.4)
scene.add(ambientLight)

// Main directional light (sun-like)
const directionalLight = new THREE.DirectionalLight(0x1dbec0, 1)
directionalLight.position.set(10, 10, 5)
directionalLight.castShadow = true
directionalLight.shadow.mapSize.width = 1024
directionalLight.shadow.mapSize.height = 1024
scene.add(directionalLight)

// Point light for additional illumination
const pointLight = new THREE.PointLight(0xffffff, 0.5, 100)
pointLight.position.set(-10, 10, -10)
scene.add(pointLight)

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000)
camera.position.z = 1.5

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

const geometry = new THREE.BoxGeometry()
const material = new THREE.MeshLambertMaterial({ color: 0x00ff00 })

const cube = new THREE.Mesh(geometry, material)
cube.castShadow = true
cube.receiveShadow = true
scene.add(cube)

// Add a ground plane to receive shadows
const planeGeometry = new THREE.PlaneGeometry(20, 20)
const planeMaterial = new THREE.MeshLambertMaterial({ color: 0xcccccc })
const plane = new THREE.Mesh(planeGeometry, planeMaterial)
plane.rotation.x = -Math.PI / 2
plane.position.y = -1
plane.receiveShadow = true
scene.add(plane)

const stats = new Stats()
document.body.appendChild(stats.dom)

const gui = new GUI()

const cubeFolder = gui.addFolder('Cube')
cubeFolder.add(cube.rotation, 'x', 0, Math.PI * 2)
cubeFolder.add(cube.rotation, 'y', 0, Math.PI * 2)
cubeFolder.add(cube.rotation, 'z', 0, Math.PI * 2)
cubeFolder.open()

const cameraFolder = gui.addFolder('Camera')
cameraFolder.add(camera.position, 'z', 0, 20)
cameraFolder.open()

function animate() {
  requestAnimationFrame(animate)

  //cube.rotation.x += 0.01
  //cube.rotation.y += 0.01

  renderer.render(scene, camera)

  stats.update()
}

animate()
