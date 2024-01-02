<script lang="ts"></script>

<div class="header">
	<span class="link" on:click={() => goHome()} on:keypress={() => goHome()}>
		<span class="hidden">The Berlage: </span>City Atlas</span
	>
	{#if $slideShowID === undefined}
		<span class="float link" on:click={() => goAbout()} on:keypress={() => goAbout()}>
			{about === false ? 'About' : 'Back to overview'}
		</span>
	{/if}
</div>

<style>
	.header {
		grid-column: 1 / 5;
		grid-row: header;
		padding: 10px;
		font-size: 1.2rem;
		border-bottom: 1px solid lightgrey;
	}
</style>
