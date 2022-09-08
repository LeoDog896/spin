import * as THREE from "three"
import { TextGeometry } from 'three/examples/jsm/geometries/TextGeometry';
import { FontLoader } from 'three/examples/jsm/loaders/FontLoader';
import font from "./droid-sans.json"

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera( 30, window.innerWidth / window.innerHeight, 1, 1500 );
camera.position.set( 0, 400, 700 );
camera.lookAt(new THREE.Vector3( 0, 150, 0 ))
const renderer = new THREE.WebGLRenderer();
renderer.setSize( window.innerWidth, window.innerHeight );
document.body.appendChild( renderer.domElement );

const components: (null | (() => void))[] = [
  // light
  (function () {
    const dirLight = new THREE.DirectionalLight( 0xffffff, 0.125 );
    dirLight.position.set( 0, 0, 1 ).normalize();
    scene.add( dirLight );

    const pointLight = new THREE.PointLight( 0xffffff, 1.5 );
    pointLight.position.set( 0, 100, 90 );
    scene.add( pointLight );

    return null;
  })(),

  // text
  (function() {
    const loader = new FontLoader();
    const geometry = new TextGeometry("hey", {
      font: loader.parse(font),
      size: 70,
      height: 20,
      curveSegments: 12,
      bevelEnabled: true,
      bevelThickness: 2,
      bevelSize: 1.5,
      bevelOffset: 0,
      bevelSegments: 5
    })
    const material = new THREE.MeshPhongMaterial( { color: 0xffffff, flatShading: true } );
    const text = new THREE.Mesh( geometry, material );
    scene.add( text );

    return function() {
      text.rotation.y += 0.01;
    }
  })()
]

function animate() {
  requestAnimationFrame( animate );

  components.filter(i => i !== null).forEach(it => it!()) // run every component that returns a render function

  renderer.render( scene, camera );
};

animate();