<script lang="ts">
	import { createEventDispatcher } from 'svelte'
	import { slidesByProject, slideShowID, slideIndex } from '$lib/components/stores'

	const dispatch = createEventDispatcher()

	let slideCount: number
	let selectedSlide: any

	$: if ($slideShowID !== undefined) {
		slideCount = $slidesByProject[$slideShowID].length
		selectedSlide = $slidesByProject[$slideShowID][$slideIndex]
	}

	function goNext() {
		if ($slideIndex < slideCount - 1) {
			slideIndex.update((n) => n + 1)
		} else if ($slideIndex === slideCount - 1) {
			slideShowID.set(undefined)
			slideIndex.set(0)
		}
		dispatch('changeView')
	}

	function goPrev() {
		if ($slideIndex > 0) {
			slideIndex.update((n) => n - 1)
		} else if ($slideIndex === 0) {
			slideShowID.set(undefined)
			slideIndex.set(0)
		}
		dispatch('changeView')
	}
</script>

<div class="panel panel-grid-container">
	<div class="caption">
		<p class="project">{selectedSlide.frontmatter.meta.heading}</p>
		<p class="body">{@html selectedSlide.html}</p>
	</div>
	<div class="control-container">
		<button class="control-item" on:click={goNext}>
			{$slideIndex == slideCount - 1 ? 'Back to overview' : 'Next slide'}
		</button>
		<button class="control-item" on:click={goPrev}>
			{$slideIndex == 0 ? 'Back to overview' : 'Previous slide'}
		</button>
	</div>
</div>

<style>
	.panel {
		background-color: rgba(255, 255, 255, 0.8);
		z-index: 2;
	}

	.panel-grid-container {
		grid-column: panel;
		grid-row: map;
		display: grid;
		grid-template-columns: 1fr;
		grid-template-rows: 1fr [controls] 100px;
		min-width: 0;
		min-height: 0;
		border-left: 1px solid lightgray;
	}

	:global(h1) {
		font-size: 1rem;
		font-weight: normal;
	}

	:global(h2) {
		font-size: 1rem;
		font-weight: normal;
	}

	:global(h3) {
		font-size: 1rem;
		font-weight: normal;
	}

	:global(strong) {
		font-weight: normal;
	}

	:global(em) {
		font-style: normal;
	}

	.caption {
		grid-column: 1 / 2;
		grid-row: 1 / 2;
		overflow: auto;
		z-index: 2;
		line-height: 1.3;
		padding-left: 20px;
		padding-right: 20px;
	}

	.body {
		hyphens: auto;
		text-align: justify;
		text-justify: inter-word;
	}

	.project {
		font-size: 0.8rem;
	}

	.control-container {
		grid-column: 1 / 2;
		grid-row: controls;
		display: flex;
		flex-flow: row wrap;
		justify-content: center;
		align-items: flex-start;
		z-index: 3;
		border-top: 1px solid lightgray;
	}

	.control-item {
		height: 50%;
		width: 100%;
		background-color: transparent;
		border: none;
		font-size: 1rem;
	}

	.control-item:hover {
		background-color: lightgray;
	}

	.control-item:first-child {
		border-bottom: 1px solid lightgray;
	}

	@media all and (max-width: 600px) {
		.body {
			display: none;
		}
		.panel {
			align-self: end;
		}
		.panel-grid-container {
			grid-template-rows: 1fr [controls] 50px;
			border-top: 1px solid lightgray;
      border-left: none;
		}
		.project {
			font-size: 1rem;
		}
		.control-container {
			flex-direction: row-reverse;
		}
		.control-item {
			height: 100%;
			width: 50%;
		}
		.control-item:first-child {
			border-bottom: none;
			border-left: 1px solid lightgray;
		}
	}
</style>
