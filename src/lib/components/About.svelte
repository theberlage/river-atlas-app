<script lang="ts">
	import { aboutPage } from '$lib/components/stores'
</script>

<div class="about">
	<div class="body">
		<h1>{$aboutPage[0][1].frontmatter.title}</h1>
		<div class="html">{@html $aboutPage[0][1].html}</div>
	</div>
</div>

<style>
	.about {
		grid-column: 1 / 5;
		grid-row: map;
		background-color: rgba(255, 255, 255, 0.8);
		padding-left: 20px;
		padding-right: 20px;
		min-width: 0;
		min-height: 0;
		overflow: auto;
		z-index: 2;
		display: flex;
		justify-content: center;
		align-items: center;
	}
	.body {
		max-width: 600px;
		max-height: 100%;
	}
	.html {
		hyphens: auto;
		text-align: justify;
		text-justify: inter-word;
		columns: 1;
	}
	:global(a) {
		color: blue;
		text-decoration: none;
	}
	:global(a:hover) {
		color: black;
		text-decoration: none;
	}
	@media all and (max-width: 800px) {
		.body {
			height: 100%;
		}
		.html {
			columns: 1;
		}
	}
</style>
