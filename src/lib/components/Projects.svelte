<script lang="ts">
	import Slide from '$lib/components/Slide.svelte'

  import type { MarkdownSlide } from '$lib/shared/types.js'

	const slides = import.meta.glob<MarkdownSlide>('$contents/projects/*/slides/*.md', {
		eager: true
	})
</script>

<div>
	<h4>Projects:</h4>
	<ol>
		{#each Object.entries(slides) as [id, slide]}
			<li><Slide {id} {slide} /></li>
		{/each}
	</ol>
</div>
