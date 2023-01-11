<script lang="ts">
	import Slide from '$lib/components/Slide.svelte'

  import type { Slide as SlideType } from '$lib/shared/types.js'

  export let slides: SlideType[]

</script>

<div class="projects">
	<h4>Projects:</h4>
	<ol>
		{#each slides as slide}
			<li><Slide {...slide} /></li>
		{/each}
	</ol>
</div>
