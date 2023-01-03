<script lang="ts">
	import { onMount } from 'svelte'

	import Map from 'ol/Map'
	import View from 'ol/View'
	import TileLayer from 'ol/layer/Tile'
	import OSM from 'ol/source/OSM'
	import 'ol/ol.css'
	import { formatNumber } from '$lib/intl.js'

  import { WarpedMapSource, WarpedMapLayer } from '@allmaps/openlayers'

  import Jules from '$lib/components/Jules.svelte'
  import Projects from '$lib/components/Projects.svelte'

	let map: Map
	let view: View

  let warpedMapSource: WarpedMapSource
  let warpedMapLayer: WarpedMapLayer

	let rotation: number = 0
  let data = {}

  async function fetchJson(url: any) {
  return fetch(url).then((response) => response.json());
}

  let annotationUrls = [
  // West-Roxbury
  "https://raw.githubusercontent.com/allmaps/webgl2-preview/main/static/west-roxbury.json",
  // Roxbury
  "https://annotations.allmaps.org/images/25b19ade19654e66",
  // Provincetown
  "https://annotations.allmaps.org/?url=https://collections.leventhalmap.org/search/commonwealth:0r96fq56q/manifest",
  // Cambridge
  "https://annotations.allmaps.org/?url=https://collections.leventhalmap.org/search/commonwealth:wd376290m/manifest"
  ]


	onMount(async () => {
    let annotations = await Promise.all(annotationUrls.map(fetchJson))

    warpedMapSource = new WarpedMapSource()

    warpedMapLayer = new WarpedMapLayer({
      source: warpedMapSource
    })

    for (let annotation of annotations) {
      await warpedMapSource.addGeorefAnnotation(annotation);
    }

		view = new View({
			center: [0, 0],
			zoom: 1
		})

		map = new Map({
			view,
			layers: [
				new TileLayer({
					source: new OSM()
				}),
        warpedMapLayer
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
    console.log('handleBert', event.detail)
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
<Projects />
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
