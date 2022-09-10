<script context="module" lang="ts">
	export interface Setting {
		debug: boolean;
	}
</script>

<script lang="ts">
	import { fly } from 'svelte/transition';
	let modalShowing = false;

	export let settings: Setting = { debug: false };
</script>

{#if modalShowing}
	<div
		transition:fly={{ y: -200 }}
		class="fixed top-0 left-0 w-screen h-screen bg-gray-600/70 text-white p-8"
	>
		<div class="m-16 bg-gray-500/70 p-16">
			<p>Debug: <input type="checkbox" bind:checked={settings.debug} /></p>
		</div>
	</div>
{/if}

<button
	on:click={() => (modalShowing = !modalShowing)}
	class="fixed z-10 top-8 left-8 rounded-full border-4 border-white p-4 hover:ring-lime-500 ring-offset-2 ring transition-all"
/>
