<script lang="ts">
	import Slide from '$lib/components/Slide.svelte'

	import type { MarkdownSlide } from '$lib/shared/types.js'

	const slides = import.meta.glob<MarkdownSlide>('$contents/projects/*/slides/*.md', {
		eager: true
	})

	const slidesWithProject = Object.entries(slides).map(([id, slide]) => {
		let project = ''
		let slideNumber = -1

		const match = /projects\/(?<project>\w+)\/slides\/(?<slideNumber>\d+).md$/.exec(id)

		if (match && match.groups) {
			project = match.groups.project
			slideNumber = parseInt(match.groups.slideNumber)
		}

		return {
			project,
			slideNumber,
			...slide
		}
	})
</script>

<div>
	<h4>Projects:</h4>
	<ol>
		{#each slidesWithProject as slide}
			<li><Slide {...slide} /></li>
		{/each}
	</ol>
</div>
