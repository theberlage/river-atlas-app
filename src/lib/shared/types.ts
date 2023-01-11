export type MarkdownSlide = {
	html: string
	frontmatter: any
}

export type Slide = MarkdownSlide & {
  project: string
  slideNumber: number
}
