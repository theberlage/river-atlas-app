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
		<h1>{selectedSlide.frontmatter.meta.heading}</h1>
		{@html selectedSlide.html}
	</div>
	<div class="control-container">
		<div class="control-item ">
			<button on:click={goPrev} class="button" type="button">
				{$slideIndex == 0 ? 'Overview' : 'Previous'}
			</button>
		</div>
		<div class="control-item">
			<button on:click={goNext} class="button" type="button">
				{$slideIndex == slideCount - 1 ? 'Overview' : 'Next'}
			</button>
		</div>
	</div>
</div>

<style>
	@media screen and (max-width: 400px) {
		.caption {
			display: none;
		}
	}

	.panel {
		background-color: white;
		z-index: 2;
		border-radius: 10px;
		border: solid 1px black;
		margin: 20px;
		padding: 10px;
	}

	.panel-grid-container {
		grid-column: panel;
		grid-row: map;
		display: grid;
		grid-template-columns: 1fr;
		grid-template-rows: 1fr [controls] 100px;
		min-width: 0;
		min-height: 0;
	}

	.caption {
		grid-column: 1 / 2;
		grid-row: 1 / 3;
		overflow: auto;
		z-index: 2;
	}

	.control-container {
		grid-column: 1 / 2;
		grid-row: controls;
		display: flex;
		flex-flow: row wrap;
		justify-content: center;
		gap: 20px;
		margin: 20px;
		align-items: flex-end;
		z-index: 3;
	}

	.button {
		width: 100px;
		height: 35px;
	}
</style>
