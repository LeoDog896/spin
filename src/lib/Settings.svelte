<script context="module" lang="ts">
	export interface Setting {
		debug: boolean;
		toon: boolean;
	}
</script>

<script lang="ts">
	import { fly } from 'svelte/transition';
  import { localStore } from "svelte-persistent"

  export let content = localStore('content', 'spin');
	let modalShowing = false;

	export let settings: Setting = { debug: false, toon: false };
</script>

<svelte:window on:click|self={() => (modalShowing = false)} />

{#if modalShowing}
	<div
		transition:fly={{ y: -200 }}
		class="fixed m-6 rounded-lg top-0 left-0 w-[calc(100vw - 1.5rem)] h-[calc(100vh - 1.5rem)] bg-gray-600/70 text-white p-8"
		on:click|self={() => (modalShowing = false)}
	>
		<div class="m-16 bg-gray-500/90 rounded-lg p-16">
			<p>Debug: <input type="checkbox" bind:checked={settings.debug} /></p>
			<p>Toon: <input type="checkbox" bind:checked={settings.toon} /></p>
      <textarea bind:value={$content}></textarea>
		</div>
	</div>
{/if}

<button
	on:click={() => (modalShowing = !modalShowing)}
	class="fixed z-10 top-8 left-8 rounded-full border-4 border-white p-4 hover:ring-lime-500 ring-offset-2 ring transition-all"
/>

<style>
  textarea {
    color: black;
  }
</style>