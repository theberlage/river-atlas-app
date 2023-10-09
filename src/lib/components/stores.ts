import { readable, writable, derived } from 'svelte/store';
import { groupBy } from 'lodash-es'
import type { MarkdownSlide } from '$lib/shared/types.js'

// Importing Markdown and frontmatter for slides
// @Bert: toevoegen: markdown + annotations + geojson in mapje overview

const markdownSlides = import.meta.glob<MarkdownSlide>('$contents/projects/*/slides/*.md', {
  eager: true
})

const aboutMarkdown = import.meta.glob<MarkdownSlide>('$contents/overview/about/*.md', {
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
export const homePage = readable(Object.entries(aboutMarkdown)[0][1])

// Writable stores

export const slideShowID = writable<string | undefined>(undefined)
export const slideIndex = writable<number>(0)

export const selectedSlide = derived(
  slidesByProject,
  $slidesByProject => { $slidesByProject[slideShowID][slideIndex] }
);
