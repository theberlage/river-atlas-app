<script lang="ts">
	import { createEventDispatcher } from 'svelte';

const dispatch = createEventDispatcher();

  export let title: string
  export let index: number

  function sayHello() {
		dispatch('bert', {title})
	}
</script>

<li>
  Hoi Jules zegt: "{title}" (nr. {index + 1})
  <button on:click={sayHello}>Klik</button>
</li>
