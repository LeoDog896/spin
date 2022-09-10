<script lang="ts">
  import { fly } from "svelte/transition"
  let modalShowing = false
</script>

{#if modalShowing}
  <div transition:fly={{y: -200}} class="fixed top-0 left-0 w-screen h-screen bg-gray-600/70 text-white"></div>
{/if}

<button on:click={() => modalShowing = !modalShowing} class="fixed z-10 top-8 left-8 rounded-full border-4 border-white p-4 hover:ring-lime-500 ring-offset-2 ring transition-all"></button>