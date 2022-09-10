<script lang="ts">
  import * as THREE from "three"
  import { TextGeometry } from 'three/examples/jsm/geometries/TextGeometry';
  import { FontLoader } from 'three/examples/jsm/loaders/FontLoader';
  import font from "$lib/droid-sans.json"
  import { onMount } from "svelte";
  import Settings, { type Setting } from "$lib/Settings.svelte"

  let scene = new THREE.Scene();
  let camera: THREE.PerspectiveCamera | null;
  let renderer: THREE.Renderer | null;
  let content = "spin"
  let rotation = 0;
  let settings: Setting = { debug: false }

  $: {
    if (text.mesh) text.mesh.rotation.y = rotation;
    if (text.boundCollision) text.boundCollision.rotation.y = rotation;
  }

  $: if (text.boundCollision) text.boundCollision.material.visible = settings.debug

  let text: {
    mesh?: THREE.Mesh<TextGeometry, THREE.MeshStandardMaterial>,
    boundCollision?: THREE.Mesh<THREE.BoxGeometry, THREE.MeshBasicMaterial>
    active: boolean,
    cursor: { from: number, to: number }
  } = { active: false, cursor: { from: 0, to: 0 } };  

  function redo_move() {
    if (!camera || !renderer) return;

    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize( window.innerWidth, window.innerHeight );
    camera?.lookAt(text.mesh!.position)
  }

  const fontGen = new FontLoader().parse(font);
  function createText(content: string) {
    if (!scene) return

    const textGeometry = new TextGeometry(content, {
      font: fontGen,
      size: 70,
      height: 20,
      curveSegments: 2,
      bevelEnabled: true,
      bevelThickness: 10,
      bevelSize: 6.5,
      bevelOffset: 0,
      bevelSegments: 2,
    })

    text.cursor = { from: content.length - 1, to: content.length - 1 }

    textGeometry.computeBoundingBox();

    // Move transform origin to center
    {
      const center = textGeometry.boundingBox!.getCenter(new THREE.Vector3( ));
      textGeometry.translate(-center.x, -center.y, -center.z)
    }

    if (text.mesh && scene.children.includes(text.mesh)) {
      scene.remove(text.mesh)
    }

    if (text.boundCollision && scene.children.includes(text.boundCollision)) {
      scene.remove(text.boundCollision)
    }

    // mesh creation
    {
      const material = new THREE.MeshStandardMaterial( { color: 0xffffff } );
      text.mesh = new THREE.Mesh( textGeometry, material );
      text.mesh.rotation.y = rotation;
      text.mesh.translateY(150);
      scene.add( text.mesh );
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

      text.boundCollision.rotation.y = rotation;

      scene.add(text.boundCollision)

      text.boundCollision!.position.copy(text.mesh!.position);
    }

    redo_move()
  }

  $: createText(content)

  onMount(() => {
    camera = new THREE.PerspectiveCamera( 30, window.innerWidth / window.innerHeight, 1, 1500 );
    renderer = new THREE.WebGLRenderer();

    // scene setup
    {
      camera.position.set( 0, 400, 700 );
      camera.lookAt(new THREE.Vector3( 0, 150, 0 ))
      renderer.setSize( window.innerWidth, window.innerHeight );
      document.body.appendChild( renderer.domElement );
    }

    // light
    {
      const dirLight = new THREE.DirectionalLight( 0xffffff, 0.125 );
      dirLight.position.set( 0, 0, 1 ).normalize();
      scene.add( dirLight );

      const pointLight = new THREE.PointLight( 0xffffff, 1.5 );
      pointLight.position.set( 0, 100, 90 );
      scene.add( pointLight );
    }

    // raycast
    {
      const raycaster = new THREE.Raycaster();
      const pointer = new THREE.Vector2();
      function onPointerMove( event: PointerEvent ) {
        // calculate pointer position in normalized device coordinates
        // (-1 to +1) for both components
        pointer.x = ( event.clientX / window.innerWidth ) * 2 - 1;
        pointer.y = - ( event.clientY / window.innerHeight ) * 2 + 1;
      }

      window.addEventListener( 'pointermove', onPointerMove );
      window.addEventListener( 'dblclick', function() {
        if (!text.boundCollision || !camera || !renderer) return;
        raycaster.setFromCamera( pointer, camera );
        // calculate objects intersecting the picking ray.
        const intersects = raycaster.intersectObject( text.boundCollision! );
        text.active = intersects.length !== 0;
        renderer.render( scene!, camera );
      })

      window.addEventListener( 'click', function() {
        if (!text.boundCollision || !camera || !renderer) return;
        raycaster.setFromCamera( pointer, camera );
        // calculate objects intersecting the picking ray.
        const intersects = raycaster.intersectObject( text.boundCollision! );
        text.active = intersects.length !== 0 ? !text.active : false
        renderer.render( scene!, camera );
      })
    }

    // text
    {
      createText(content)

      window.addEventListener("keydown", event => {
        switch (event.key) {
          case "Backspace":
            content = content.replace(/.$/, ''); // TODO i think theres an easier way
            break;
          default:
            if (event.key.length === 1)
              content += event.key;
        }
      })
    }

    function animate() {
      if (!renderer || !camera) return;
      requestAnimationFrame( animate );

      rotation += 0.01;

      text.mesh!.material.color.set(text.active ? 0xff0000 : 0xffffff)
      window.addEventListener("resize", redo_move)

      renderer.render( scene!, camera );
    };

    animate();
  });
</script>

<Settings bind:settings/>