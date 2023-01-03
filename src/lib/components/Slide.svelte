<script lang="ts">
	import type { MarkdownSlide } from '$lib/shared/types.js'

	export let id: string
	export let slide: MarkdownSlide
</script>

<div>
	<div>{id}</div>
	<code>{JSON.stringify(slide.matter)}</code>
	<div>{@html slide.html}</div>
</div>
