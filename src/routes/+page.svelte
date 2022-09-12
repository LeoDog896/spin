<script lang="ts">
	import * as THREE from 'three';
	import { TextGeometry } from '$lib/three/TextGeometry';
	import { Font } from '$lib/three/FontLoader';
	import font from '$lib/droid-sans.json';
	import { onMount } from 'svelte';
	import Settings, { type Setting } from '$lib/Settings.svelte';
	import { localStore } from "svelte-persistent"
	import writableDerived from "svelte-writable-derived";
	import type { Writable } from 'svelte/store';

	let scene = new THREE.Scene();
	scene.fog = new THREE.FogExp2(0xaaaaaa, 0.001);

	let camera: THREE.PerspectiveCamera | null;
	let renderer: THREE.WebGLRenderer | null;
	let rotation: Writable<number[]> = writableDerived(localStore('rotation', '[0, 0, 0]'), json => JSON.parse(json), obj => JSON.stringify(obj)); // x, y, z
	let settings: Setting = { debug: false, toon: false };
	let pointer = new THREE.Vector2();
  let renderDiv: HTMLDivElement;
  let content = localStore("content", "spin")

	$: {
		if (text.mesh) text.mesh.rotation.fromArray($rotation);
		if (text.boundCollision) text.boundCollision.rotation.fromArray($rotation);
	}

	$: if (text.boundCollision) text.boundCollision.material.visible = settings.debug;

	let text: {
		mesh?: THREE.Mesh<TextGeometry, THREE.MeshToonMaterial | THREE.MeshPhysicalMaterial>;
		boundCollision?: THREE.Mesh<THREE.BoxGeometry, THREE.MeshBasicMaterial>;
		active: boolean;
		cursor: { from: number; to: number };
	} = { active: false, cursor: { from: 0, to: 0 } };

	function redo_move() {
		if (!camera || !renderer || !text.mesh) return;

		camera.aspect = window.innerWidth / window.innerHeight;
		camera.updateProjectionMatrix();
		renderer.setSize(window.innerWidth, window.innerHeight);
		camera?.lookAt(text.mesh.position);
	}

	function textMaterial(settings: Settings) {
		if (!renderer) return;
		if (settings.toon) {
			const colors = new Uint8Array(5);
			for (let c = 0; c <= colors.length; c++) {
				colors[c] = (c / colors.length) * 256;
			}

			const gradientMap = new THREE.DataTexture(
				colors,
				colors.length,
				1,
				renderer.capabilities.isWebGL2 ? THREE.RedFormat : THREE.LuminanceFormat
			);
			gradientMap.needsUpdate = true;
			return new THREE.MeshToonMaterial({ color: 0xffffff, gradientMap });
		} else {
			return new THREE.MeshPhysicalMaterial({ color: 0xffffff });
		}
	}

	const fontGen = new Font(font);
	function createText(content: string, settings: Settings) {
		if (!scene) return;

		const textGeometry = new TextGeometry(content, {
			font: fontGen,
			size: 70,
			depth: 15,
			curveSegments: 2,
			bevelEnabled: true,
			bevelThickness: 10,
			bevelSize: 6.5,
			bevelOffset: 0,
			bevelSegments: 2
		});

		text.cursor = { from: content.length - 1, to: content.length - 1 };

		textGeometry.computeBoundingBox();

		if (!textGeometry.boundingBox) throw Error('No bounding box. This is a bug.');

		// Move transform origin to center
		{
			const center = textGeometry.boundingBox.getCenter(new THREE.Vector3());
			textGeometry.translate(-center.x, -center.y, -center.z);
		}

		if (text.mesh && scene.children.includes(text.mesh)) {
			scene.remove(text.mesh);
		}

		if (text.boundCollision && scene.children.includes(text.boundCollision)) {
			scene.remove(text.boundCollision);
		}

		// mesh creation
		{
			text.mesh = new THREE.Mesh(textGeometry, textMaterial(settings));
			text.mesh.rotation.fromArray($rotation);
			text.mesh.translateY(150);
			scene.add(text.mesh);
		}

		// Compute and add invisible bounding box to scene for detection
		{
			const textBoundingBoxSize = textGeometry.boundingBox.getSize(new THREE.Vector3());
			const geometry = new THREE.BoxGeometry(
				textBoundingBoxSize.x,
				textBoundingBoxSize.y,
				textBoundingBoxSize.z
			);

			text.boundCollision = new THREE.Mesh(
				geometry,
				new THREE.MeshBasicMaterial({
					color: 0x00ff00,
					wireframe: true,
					visible: settings.debug
				})
			);

			text.boundCollision.rotation.fromArray($rotation);

			scene.add(text.boundCollision);

			if (!text.mesh) throw Error('No mesh. This is a bug.'); // mesh creation confirms this.

			text.boundCollision.position.copy(text.mesh.position);
		}

		redo_move();
	}

	$: createText($content, settings);

	onMount(() => {
		camera = new THREE.PerspectiveCamera(30, window.innerWidth / window.innerHeight, 1, 1500);
		renderer = new THREE.WebGLRenderer();

		// scene setup
		{
			camera.position.set(0, 400, 700);
			camera.lookAt(new THREE.Vector3(0, 150, 0));
			renderer.setSize(window.innerWidth, window.innerHeight);
			renderDiv.appendChild(renderer.domElement);
		}

		// light
		{
			const dirLight = new THREE.DirectionalLight(0xffffff, 0.125);
			dirLight.position.set(0, 0, 1).normalize();
			scene.add(dirLight);

			const pointLight = new THREE.PointLight(0xffffff, 1.5);
			pointLight.position.set(20, 100, 90);
			scene.add(pointLight);
		}

		// raycast
		{
			const raycaster = new THREE.Raycaster();

			renderDiv.addEventListener('pointermove', function (event) {
				// calculate pointer position in normalized device coordinates
				// (-1 to +1) for both components
				pointer.x = (event.clientX / window.innerWidth) * 2 - 1;
				pointer.y = -(event.clientY / window.innerHeight) * 2 + 1;
			});
			renderDiv.addEventListener('dblclick', function () {
				if (!text.boundCollision || !camera || !renderer) return;
				raycaster.setFromCamera(pointer, camera);
				// calculate objects intersecting the picking ray.
				const intersects = raycaster.intersectObject(text.boundCollision);
				text.active = intersects.length !== 0;
				renderer.render(scene, camera);
			});

			renderDiv.addEventListener('click', function () {
				if (!text.boundCollision || !camera || !renderer) return;
				raycaster.setFromCamera(pointer, camera);
				// calculate objects intersecting the picking ray.
				const intersects = raycaster.intersectObject(text.boundCollision);
				text.active = intersects.length !== 0 ? !text.active : false;
				renderer.render(scene, camera);
			});
		}

		function animate() {
			requestAnimationFrame(animate);
			if (!renderer || !camera || !text.mesh) return;

			$rotation[1] += 0.01;

			text.mesh.material.color.set(settings.color);
			renderer.render(scene, camera);
		}

		animate();
	});
</script>

<div class="render" bind:this={renderDiv} on:keydown={event => {
	switch (event.key) {
		case 'Backspace':
			$content = $content.slice(0, -1);
			break;
		case 'Enter':
			$content += '\n';
			break;
		default:
			if (event.key.length === 1) $content += event.key;
	}
}}

on:resize={redo_move}
></div>
<Settings bind:settings bind:content />
