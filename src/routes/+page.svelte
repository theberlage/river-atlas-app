<script lang="ts">
	import { onMount } from 'svelte'

	import Map from 'ol/Map'
	import View from 'ol/View'
	import TileLayer from 'ol/layer/Tile'
	import OSM from 'ol/source/OSM'
	import 'ol/ol.css'
	import { formatNumber } from '$lib/intl.js'

  import { WarpedMapLayer } from '@allmaps/openlayers'

  import Jules from '$lib/components/Jules.svelte'

	let map: Map
	let view: View
  let warpedMapLayer: WarpedMapLayer

	let rotation: number = 0
  let data = {}

	onMount(() => {

    warpedMapLayer = new WarpedMapLayer()

    console.log(warpedMapLayer)
		view = new View({
			center: [0, 0],
			zoom: 1
		})

		map = new Map({
			view,
			layers: [
				new TileLayer({
					source: new OSM()
				})
			],
			target: 'map'
		})
	})

	let chapters = [
		{
			title: 'hallo'
		},
		{
			title: 'deze'
		},
		{
			title: 'ook'
		}
	]

  function handleBert(event) {
    console.log(event.detail)
  }

	async function handleClick() {
		rotation = view.getRotation() - Math.PI / 2

		view.animate({
			rotation
		})

		chapters.push({
			title: `Nieuwe: ${formatNumber(rotation)}`
		})
		chapters = chapters

		const url = 'https://raw.githubusercontent.com/allmaps/allmaps/main/package.json'
		const response = await fetch(url)
		data = await response.json()
	}
</script>

<div id="map" />
<button on:click={handleClick}> Hoi </button>
<ol>
	{#each chapters as chapter, index}
    <Jules on:bert={handleBert} title={chapter.title} index={index} />
	{/each}
</ol>
<div>Rotation: {formatNumber(rotation, 4)}</div>
<pre><code>{JSON.stringify(data, null, 2)}</code></pre>

<style>
	li {
		color: red;
	}

	#map {
		width: 300px;
		height: 300px;
	}
</style>
