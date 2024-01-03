<script lang="ts">
	import { menu } from '$lib/shared/stores/componentStates.js'
	import { selectedChapter } from '$lib/shared/stores/selectedSlide.js'
	import Page from '../../routes/+page.svelte'
	const toggleMenu = () => menu.toggle()

	let black: boolean = false

	$: {
		if ($selectedChapter === 'documentation') {
			black = true
		} else black = false
	}

	const bars = `<svg class="icon w-6 h-6 text-gray-800 dark:text-white" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 17 14">
    <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M1 1h15M1 7h15M1 13h15"/>
  </svg>`

	const close = `<svg class="icon w-6 h-6 text-gray-800 dark:text-white" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 14 14">
    <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="m1 1 6 6m0 0 6 6M7 7l6-6M7 7l-6 6"/>
  </svg>`
</script>

<div class="header" class:black>
	<a href="#/" class:black><span class="hidden">The Berlage: </span>City Atlas</a>
	<div class="float link" on:click={toggleMenu} on:keypress={toggleMenu}>
		{#if $menu}{@html close}{:else}{@html bars}{/if}
	</div>
</div>

<style>
	.header {
		grid-column: 1 / 5;
		/* background-color: rgba(255, 255, 255, 0.8); */
		grid-row: header;
		padding: 15px;
		font-size: 1.2rem;
		/* border-bottom: 1px solid lightgrey; */
		z-index: 4;
		color: white;
	}
	.black {
		color: black;
	}
	.float {
		float: right;
	}
	:global(.icon) {
		height: 1.2rem;
		/* width: 100%; */
	}
	.link {
		cursor: pointer;
	}
	.link:hover {
		color: rgba(255, 255, 114);
	}
	a {
		color: white;
		text-decoration: none;
	}
	a:hover {
		color: rgba(255, 255, 114);
		text-decoration: none;
	}
	@media all and (max-width: 600px) {
		.hidden {
			display: none;
		}
	}
</style>
