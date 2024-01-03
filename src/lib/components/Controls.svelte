<script lang="ts">
	import {
		selectedChapter as chapter,
		selectedSlideShow as slideshow,
		selectedSlideShowCount as count,
		selectedSlideIndex as index
	} from '$lib/shared/stores/selectedSlide.js'

	function goNext() {
		if ($index < $count - 1) {
			window.location.hash = `#/${$chapter}/${$slideshow}/${$index + 2}`
		} else if ($index === $count - 1) {
			window.location.hash = `#/${$chapter}/`
		}
	}

	function goPrev() {
		if ($index > 0) {
			window.location.hash = `#/${$chapter}/${$slideshow}/${$index}`
		} else if ($index === 0) {
			window.location.hash = `#/${$chapter}/`
		}
	}

	function goHome() {
		window.location.hash = '#/'
	}

	// up = 38
	// down = 40
	// right = 39
	// left = 37
	// esc = 27

	function onKeyDown(e: any) {
		switch (e.keyCode) {
			case 27:
				goHome()
				break
			case 37:
				goPrev()
				break
			case 39:
				goNext()
				break
		}
	}

	const next = `<svg class="icon w-6 h-6 text-gray-800 dark:text-white" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 8 14">
    <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="m1 13 5.7-5.326a.909.909 0 0 0 0-1.348L1 1"/>
  </svg>`

	const prev = `<svg class="icon w-6 h-6 text-gray-800 dark:text-white" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 8 14">
    <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 1 1.3 6.326a.91.91 0 0 0 0 1.348L7 13"/>
  </svg>`
</script>

<svelte:window on:keydown={onKeyDown} />

{#if $count > 1}
	<div class="control">
		<div class="content">
			<span class="link" on:click={() => goPrev()}>{@html prev}</span>
			Slide {$index + 1} of {$count}
			<span class="link" on:click={() => goNext()}>{@html next}</span>
		</div>
	</div>
{/if}

<style>
	.control {
		grid-column: 2 / 3;
		grid-row: 2 / 3;
		background-color: rgba(255, 255, 114);
		/* height: 40px; */
		bottom: 0px;
		z-index: 2;
		border-radius: 10px;
		margin: 15px auto;
		padding: 10px;
		align-self: end;
	}
	.content {
		font-size: 1.2rem;
		margin: auto;
	}

	.link {
		cursor: pointer;
	}
	.link:hover {
	}

	@media all and (max-width: 600px) {
		.control {
			width: 100%;
		}
	}
</style>
