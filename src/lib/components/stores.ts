import { readable, writable } from 'svelte/store';
import { groupBy } from 'lodash-es'
import type { MarkdownSlide } from '$lib/shared/types.js'

export const selectedSlide = readable;

	// Importing Markdown and frontmatter for slides
	// @Bert: toevoegen aan object: georef annotaties + geojson
	// @Bert: toevoegen: markdown + annotations + geojson in mapje overview

	const markdownSlides = import.meta.glob<MarkdownSlide>('$contents/projects/*/slides/*.md', {
		eager: true
	})

	const slides = Object.entries(markdownSlides).map(([id, slide]) => {
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

	// Grouping slides by project

	export const slidesByProject = readable(groupBy(slides, (slide) => slide.project))

  // Writable stores

  export const slideShowID = writable(undefined)
	export const slideIndex = writable(0)


