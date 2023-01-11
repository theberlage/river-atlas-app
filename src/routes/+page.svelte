<script lang="ts">
	import { onMount } from 'svelte'
	import { groupBy } from 'lodash-es'
	import { formatNumber } from '$lib/intl.js'

	import Map from 'ol/Map'
	import View from 'ol/View'
	import { Tile as TileLayer, Vector as VectorLayer } from 'ol/layer.js'
	import 'ol/ol.css'
	import { fromLonLat } from 'ol/proj.js'
	import ZoomToExtent from 'ol/control/ZoomToExtent.js'
	import GeoJSON from 'ol/format/GeoJSON.js'
	import Feature from 'ol/Feature.js'
	import { OSM, Vector as VectorSource } from 'ol/source.js'
	import { Fill, Stroke, Style } from 'ol/style.js'

	import { WarpedMapSource, WarpedMapLayer } from '@allmaps/openlayers'

	import Jules from '$lib/components/Jules.svelte'
	import Projects from '$lib/components/Projects.svelte'

	import type { MarkdownSlide } from '$lib/shared/types.js'

	let map: Map
	let view: View

	let warpedMapSource: WarpedMapSource
	let warpedMapLayer: WarpedMapLayer

	let rotation: number = 0
	let data = {}

	let dordrecht = {
		type: 'FeatureCollection',
		features: [
			{
				type: 'Feature',
				geometry: {
					type: 'Polygon',
					coordinates: [
						[
							[4.6518381, 51.7866497],
							[4.7682417, 51.7873216],
							[4.7676233, 51.8323529],
							[4.6511033, 51.8316801],
							[4.6518381, 51.7866497]
						]
					]
				},
				properties: {
					id: 425,
					name: 'eerste druk-1-14-1833-dordrecht'
				}
			}
		]
	}

	const styles = {
		Polygon: new Style({
			stroke: new Stroke({
				color: 'blue',
				lineDash: [4],
				width: 3
			}),
			fill: new Fill({
				color: 'rgba(0, 0, 255, 0.1)'
			})
		})
	}

	const markdownSlides = import.meta.glob<MarkdownSlide>('$contents/projects/*/slides/*.md', {
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

	const slidesByProject = groupBy(slides, (slide) => slide.project)
	console.log(slides, slidesByProject)

	async function fetchJson(url: any) {
		return fetch(url).then((response) => response.json())
	}

	let annotationUrls = [
		// West-Roxbury
		'https://raw.githubusercontent.com/allmaps/webgl2-preview/main/static/west-roxbury.json',
		// Roxbury
		'https://annotations.allmaps.org/images/25b19ade19654e66',
		// Provincetown
		'https://annotations.allmaps.org/?url=https://collections.leventhalmap.org/search/commonwealth:0r96fq56q/manifest',
		// Cambridge
		'https://annotations.allmaps.org/?url=https://collections.leventhalmap.org/search/commonwealth:wd376290m/manifest'
	]

	onMount(async () => {
		let annotations = await Promise.all(annotationUrls.map(fetchJson))

		warpedMapSource = new WarpedMapSource()

		warpedMapLayer = new WarpedMapLayer({
			source: warpedMapSource
		})

		for (let annotation of annotations) {
			await warpedMapSource.addGeorefAnnotation(annotation)
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
				warpedMapLayer,
				new VectorLayer({
					source: new VectorSource({
						features: new GeoJSON().readFeatures(dordrecht, {
							featureProjection: 'EPSG:3857'
						})
					})
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

	let boston = fromLonLat([-71.076, 42.359])
	let bbox = [4.651103, 51.78665, 4.768242, 51.832353]
	let extent = fromLonLat(bbox.slice(0, 2)).concat(fromLonLat(bbox.slice(2)))

	async function goExtent() {
		map.getView().fit(extent)
	}

	async function goBoston() {
		view.animate({
			center: boston,
			zoom: 12,
			rotation: 90
		})
		console.log(extent)
	}

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

<div class="grid-container">
	<div class="header">The Berlage: Project NL</div>
	<div class="panel panel-grid-container">
		<!-- <Projects {slides} /> -->
		<div class="caption">
			<h1>Title</h1>
			<h2>Subtitle</h2>
			<p>
				Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed vitae porttitor neque. Nulla
				mattis tempus nisl, non sagittis mi rhoncus non. Curabitur venenatis dolor erat, a tristique
				justo lobortis vitae. Integer at faucibus lorem, sed fermentum arcu. Maecenas molestie leo
				sed ultricies porttitor. Curabitur pharetra tincidunt mi vel feugiat. Nunc semper non ligula
				sed mollis. Nam sit amet libero ac est posuere porttitor ac ac enim. Nulla facilisi.
				Phasellus posuere tempor felis vel vulputate. Vestibulum commodo pretium justo ut congue.
			</p>
			<p>
				Nulla consectetur dui ac risus consequat, eget ultrices velit porttitor. Suspendisse
				placerat auctor mi, non tempor orci porta eu. Class aptent taciti sociosqu ad litora
				torquent per conubia nostra, per inceptos himenaeos. Nunc at ipsum elementum, ullamcorper
				enim ut, laoreet nibh. Maecenas vitae nunc a nulla vulputate facilisis. Ut at nunc in elit
				accumsan elementum eu vel quam. Etiam at justo eget massa mattis sagittis. Mauris maximus
				tortor ligula, eu iaculis nibh mattis id. Aenean vel imperdiet est, id tristique turpis.
				Orci varius natoque penatibus et magnis dis parturient montes, nascetur ridiculus mus.
				Curabitur vestibulum a massa dignissim condimentum. Lorem ipsum dolor sit amet, consectetur
				adipiscing elit. Aenean malesuada lacus leo, in euismod ante sagittis id. Phasellus
				vestibulum justo quis iaculis lobortis.
			</p>
			<p>
				Orci varius natoque penatibus et magnis dis parturient montes, nascetur ridiculus mus. Donec
				dapibus hendrerit ultricies. Suspendisse hendrerit convallis sapien eu hendrerit. Donec mi
				dolor, tempus id felis ac, tempor lobortis urna. Nunc vel commodo leo, eget vestibulum
				metus. Aliquam erat volutpat. Praesent sagittis consectetur eleifend. Donec et nunc arcu.
			</p>
			<p>
				Donec at euismod tortor. Vivamus venenatis pharetra diam quis eleifend. Nulla vel interdum
				quam. Mauris eu placerat tellus. Vivamus urna nibh, tincidunt nec aliquam in, elementum vel
				lacus. Cras pellentesque nulla convallis ultricies pulvinar. Pellentesque maximus eu turpis
				convallis finibus. Proin ac pharetra erat. Ut rutrum porttitor arcu quis pulvinar.
			</p>
		</div>
		<div class="control-container">
			<div class="control-item">
				<button on:click={goExtent} class="button" type="button">Previous</button>
			</div>
			<div class="control-item">
				<button on:click={goBoston} class="button" type="button">Next</button>
			</div>
		</div>
	</div>
	<div id="map" class="map" />
</div>

<button on:click={handleClick}> Hoi </button>
<ol>
	{#each chapters as chapter, index}
		<Jules on:bert={handleBert} title={chapter.title} {index} />
	{/each}
</ol>
<div>Rotation: {formatNumber(rotation, 4)}</div>
<pre><code>{JSON.stringify(data, null, 2)}</code></pre>

<style>
	:global(@font-face) {
		font-family: 'ZurichBT';
		src: url('$lib/fonts/ZurichBT-Regular.woff') format('woff');
		font-weight: normal;
		font-stretch: normal;
		font-style: normal;
	}

	:global(html),
	:global(body) {
		font-family: ZurichBT, Helvetica Neue, Helvetica, Arial, sans-serif;
		padding: 0;
		margin: 0;
	}

	li {
		color: red;
	}

	.grid-container {
		display: grid;
		grid-template-columns: 1fr 1fr 1fr [panel] 400px;
		grid-template-rows: [header] 40px [map] 1fr;
		width: 100vw;
		height: 100vh;
	}

	@media screen and (max-width: 400px) {
		.grid-container {
			display: grid;
			grid-template-columns: 1fr [panel];
			grid-template-rows: [header] 40px [map] 1fr;
			width: 100vw;
			height: 100vh;
		}
	}

	.header {
		grid-column: 1 / 5;
		grid-row: header;
		padding: 10px;
	}

	.panel {
		background-color: aqua;
		z-index: 2;
		border-radius: 15px;
		border: solid black;
		margin: 20px;
		padding: 10px;
	}

	.panel-grid-container {
		grid-column: panel;
		grid-row: map;
		display: grid;
		grid-template-columns: 1fr;
		grid-template-rows: 1fr [controls] 100px;
		min-width: 0;
		min-height: 0;
	}

	.caption {
		grid-column: 1 / 2;
		grid-row: 1 / 3;
		overflow: auto;
		z-index: 2;
	}

	.control-container {
		grid-column: 1 / 2;
		grid-row: controls;
		display: flex;
		flex-flow: row wrap;
		justify-content: center;
		gap: 20px;
		margin: 20px;
		align-items: flex-end;
		z-index: 3;
	}

	.button {
		width: 100px;
		height: 35px;
	}

	.map {
		grid-column: 1 / 5;
		grid-row: map;
		background-color: blue;
		width: 100%;
		height: 100%;
		z-index: 1;
	}
</style>
