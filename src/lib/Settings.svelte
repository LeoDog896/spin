<script context="module" lang="ts">
	export interface Setting {
		debug: boolean;
		toon: boolean;
    fog: boolean;
    color: number;
    opacity: number;
	}
</script>

<script lang="ts">
  import ColorPicker from 'svelte-awesome-color-picker';
	import { fly } from 'svelte/transition';
  import { localStore } from "svelte-persistent"

  export let content = localStore('content', 'spin');
	let modalShowing = false;
  export let settings: Setting = { debug: false, toon: false, fog: true, color: 0xffffff, opacity: 1 };
  let hex = "#" + settings.color.toString(16)
  $: noHashHex = hex.substring(1);
  $: noAlphaHex = noHashHex.length === 6 ? noHashHex : noHashHex.slice(0, -2);
  $: alpha = hex.length == "#000000".length ? 1 : parseInt(hex.slice(-2), 16) / 100
  
  $: settings.color = parseInt(noAlphaHex, 16)
  $: settings.opacity = alpha
</script>

<svelte:window on:click|self={() => (modalShowing = false)} />

{#if modalShowing}
	<div
		transition:fly={{ x: -200 }}
		class="fixed rounded-r-lg p-4 pl-20 top-0 left-0 w-[calc(100vw - 1.5rem)] h-screen bg-gray-600/70 text-white p-8"
		on:click|self={() => (modalShowing = false)}
	>
    <div>
      <div class="text-black">
        <ColorPicker bind:hex/>
      </div>
      <p>Debug: <input type="checkbox" bind:checked={settings.debug} /></p>
      <p>Toon: <input type="checkbox" bind:checked={settings.toon} /></p>
      <p>Fog: <input type="checkbox" bind:checked={settings.fog} /></p>
      <textarea placeholder="Enter text here OR type in page" class="p-2 rounded-lg" bind:value={$content}></textarea>
    </div>
	</div>
{/if}

<button
	on:click={() => (modalShowing = !modalShowing)}
	class="fixed z-10 top-8 left-8 rounded-full p-4 border-4 border-white hover:scale-125 transition-all"
/>

<style>
  textarea {
    color: black;
  }
</style>