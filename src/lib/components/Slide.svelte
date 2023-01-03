<script lang="ts">
  export let project: string
  export let slideNumber: number
	export let html: string
	export let frontmatter: any
</script>

<div>
	<div>Project: <strong>{project}</strong></div>
  <div>Number: <strong>{slideNumber}</strong></div>
	<code>{JSON.stringify(frontmatter)}</code>
	<div>{@html html}</div>
</div>
