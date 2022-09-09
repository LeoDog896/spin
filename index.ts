import * as THREE from "three"
import type { Mesh, MeshPhongMaterial } from "three";
import { TextGeometry } from 'three/examples/jsm/geometries/TextGeometry';
import { FontLoader } from 'three/examples/jsm/loaders/FontLoader';
import font from "./droid-sans.json"

interface Settings {
  debug: boolean;
}

// TODO: User's custom settings
const settings: Settings = {
  debug: true
}

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera( 30, window.innerWidth / window.innerHeight, 1, 1500 );
const renderer = new THREE.WebGLRenderer();

let text: {
  content: string,
  mesh?: Mesh<TextGeometry, MeshPhongMaterial>,
  boundCollision?: Mesh
  active: boolean,
  cursor: { from: number, to: number }
} = { content: "spin", active: false, cursor: { from: 0, to: 0 } };

// scene setup
{
  camera.position.set( 0, 400, 700 );
  camera.lookAt(new THREE.Vector3( 0, 150, 0 ))
  renderer.setSize( window.innerWidth, window.innerHeight );
  document.body.appendChild( renderer.domElement );
}

const components: (null | { animate?: () => void, resize?: () => void })[] = [
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
    const textGeometry = new TextGeometry(text.content, {
      font: new FontLoader().parse(font),
      size: 70,
      height: 20,
      curveSegments: 12,
      bevelEnabled: true,
      bevelThickness: 2,
      bevelSize: 1.5,
      bevelOffset: 0,
      bevelSegments: 5
    })

    text.cursor = { from: text.content.length - 1, to: text.content.length - 1 }

    textGeometry.computeBoundingBox();

    // Move transform origin to center
    {
      const center = textGeometry.boundingBox!.getCenter(new THREE.Vector3( ));
      textGeometry.translate(-center.x, -center.y, -center.z)
    }

    // mesh creation
    {
      const material = new THREE.MeshPhongMaterial( { color: 0xffffff, flatShading: true } );
      text.mesh = new THREE.Mesh( textGeometry, material );
      text.mesh.translateY(150);
      scene.add( text.mesh );
    }

    // declared here so when typing we can move it during typing & window resize
    function redo_move() {
      // so, funny trick: we can actually check the delta between
      // the camera's height and the text's height.
      // then, we move the camera down as many units as the text went down
      // and refocus the camera.
      camera.lookAt(text.mesh!.position)
    }

    // Compute and add invisible bounding box to scene for detection
    {

      const textBoundingBoxSize = textGeometry.boundingBox!.getSize(new THREE.Vector3());
      const geometry = new THREE.BoxGeometry(
        textBoundingBoxSize.x,
        textBoundingBoxSize.y,
        textBoundingBoxSize.z
      );
      const material = new THREE.MeshBasicMaterial({
        color: 0x00ff00,
        wireframe: true,
        visible: settings.debug
      });

      text.boundCollision = new THREE.Mesh(
        geometry,
        material
      )

      scene.add(text.boundCollision)

      text.boundCollision!.position.copy(text.mesh!.position);
    }

    return {
      animate() {
        text.mesh!.rotation.y += 0.01;
        text.boundCollision!.rotation.y += 0.01;

        text.mesh!.material.color.set(text.active ? 0xff0000 : 0xffffff)
      },
      resize() {
        redo_move()
      }
    }
  })(),

  // raycasting
  (function() {
    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();
    function onPointerMove( event: PointerEvent ) {
      // calculate pointer position in normalized device coordinates
      // (-1 to +1) for both components
      pointer.x = ( event.clientX / window.innerWidth ) * 2 - 1;
      pointer.y = - ( event.clientY / window.innerHeight ) * 2 + 1;
    }

    window.addEventListener( 'pointermove', onPointerMove );

    {
      // debouncing. 300ms debounce
      const lastTimeClicked = 0;
      window.addEventListener( 'click', function() {
        if (!text.boundCollision) return;
        if (new Date().getTime() - lastTimeClicked < 300) {
          text.cursor = { from: 0, to: text.content.length - 1}
        } else {
          raycaster.setFromCamera( pointer, camera );
          // calculate objects intersecting the picking ray.
          // TODO move to a bounding box around the text
          const intersects = raycaster.intersectObject( text.boundCollision! );
          if (new Date().getTime() - lastTimeClicked <= 300) {

          } else {
            text.active = intersects.length !== 0 ? !text.active : false
            renderer.render( scene, camera );
          }
        }
      })
    }

    return null;
  })()
]

function animate() {
  requestAnimationFrame( animate );

  components.filter(i => i !== null).forEach(it => {
    if (it!.animate) it!.animate();
    if (it!.resize) window.addEventListener("resize", it!.resize)
  }) // run every component that returns a render function

  renderer.render( scene, camera );
};

animate();