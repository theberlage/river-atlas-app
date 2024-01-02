<script lang="ts">
	import { onMount } from 'svelte'

	// Stores
	import { locationHash } from '$lib/shared/stores/hashRouter.js'

	// Components
	// import Header from '$lib/components/Header.svelte'
	import Menu from '$lib/components/Menu.svelte'
	import Map from '$lib/components/Map.svelte'
	// import Controls from '$lib/components/Controls.svelte'
	// import SidePanel from '$lib/components/SidePanel.svelte'

	let innerHeight: number
	let innerWidth: number
	let menu: boolean = false

	onMount(async () => {
		locationHash.set(location.hash)
	})

</script>

<svelte:window
	bind:innerHeight
	bind:innerWidth
	on:hashchange={() => locationHash.set(location.hash)}
/>

<svelte:head>
	<title>City Atlas</title>
</svelte:head>

<div class="grid-container" style="height:{innerHeight}px;">
	<!-- <Header /> -->
	{#if menu}
		<Menu />
	{/if}
	<Map />
</div>

<style>
	:global(.float) {
		float: right;
	}

	.grid-container {
		display: grid;
		grid-template-columns: 1fr 1fr 1fr [panel] 400px;
		grid-template-rows: [header] 42px [map] 1fr;
		width: 100vw;
		height: 100vh;
    position: absolute;
    left: 0;
    top: 0;
	}

	.link {
		cursor: pointer;
	}

	.grey {
		color: grey;
	}

	.full {
		grid-column: 1 / 5;
	}

	.part {
		grid-column: 1 / 4;
	}

	@media all and (max-width: 600px) {
		.grid-container {
			display: grid;
			grid-template-columns: [panel] 1fr;
			grid-template-rows: [header] 40px [map] 1fr;
			width: 100vw;
			height: 100vh;
		}
	}
</style>
