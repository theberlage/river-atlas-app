<script lang="ts">
	// JS and Svelte functions

	import { onMount } from 'svelte'
	import { groupBy } from 'lodash-es'
	import { formatNumber } from '$lib/intl.js'

	// OpenLayers

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

	// Allmaps

	import { WarpedMapSource, WarpedMapLayer } from '@allmaps/openlayers'

	// Typescript

	import type { MarkdownSlide } from '$lib/shared/types.js'
	import { VectorSourceEvent } from 'ol/source/Vector'

	// Declaring changing variables with let and fixed ones with const

	let map: Map
	let view: View

	let warpedMapSource: WarpedMapSource
	let warpedMapLayer: WarpedMapLayer
	let vectorLayer: VectorLayer<VectorSource>

	let slideIndex: number = 0

	const biesboschVector = {
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
				}
			},
			{
				type: 'Feature',
				geometry: {
					type: 'Polygon',
					coordinates: [
						[
							[4.7679879, 51.7866501],
							[4.88446, 51.7872071],
							[4.8839519, 51.8327543],
							[4.7673621, 51.8321967],
							[4.7679879, 51.7866501]
						]
					]
				}
			}
		]
	}

	// Styles for OpenLayers

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

	// Importing Markdown and frontmatter for slides

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

	// Grouping slides by project

	const slidesByProject = groupBy(slides, (slide) => slide.project)
	console.log(slides, slidesByProject)
	console.log(slidesByProject.biesbosch[0].frontmatter.viewer.bbox)

	// Function to fetch external jsons

	async function fetchJson(url: any) {
		return fetch(url).then((response) => response.json())
	}

	// Reactive variables

	$: slideShowID = 'biesbosch'
	$: selectedSlide = slidesByProject[slideShowID][slideIndex]
	$: slideCount = slidesByProject[slideShowID].length - 1
	$: boundingBox = selectedSlide.frontmatter.viewer.bbox
	$: viewerExtent = fromLonLat(boundingBox.slice(0, 2)).concat(fromLonLat(boundingBox.slice(2)))
	$: geoJsonSource = new GeoJSON().readFeatures(biesboschVector.features[1], {
		featureProjection: 'EPSG:3857'
	})
  $: allmapsAnnotations = selectedSlide.frontmatter.allmaps.map((item: any) => item.url)

	$: slideVectorSource = new VectorSource({
		features: geoJsonSource
	})

	$: vectorLayer = new VectorLayer({
		source: slideVectorSource
	})

	function replaceVectorSource() {
		slideVectorSource.clear
		slideVectorSource.addFeatures(geoJsonSource)
	}

  // Function to replace Allmaps layer

	async function refreshAllmapsLayer() {

		map.removeLayer(warpedMapLayer) // Todo: check if layer exists

		let annotations = await Promise.all(allmapsAnnotations.map(fetchJson))

    warpedMapSource = new WarpedMapSource()

		warpedMapLayer = new WarpedMapLayer({
			source: warpedMapSource
		})

		for (let annotation of annotations) {
			await warpedMapSource.addGeorefAnnotation(annotation)
		}

		map.addLayer(warpedMapLayer)

  }

	// onMount function after components are loaded, see https://svelte.dev/tutorial/onmount

	onMount(async () => {
		// Initialising OpenLayers

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
				vectorLayer
			],
			target: 'map'
		})
	})

	async function goNext() {
		if (slideIndex < slideCount) {
			slideIndex += 1
			map.getView().fit(viewerExtent)
      refreshAllmapsLayer()
		}
		if (slideIndex == slideCount) {
		}
	}

	async function goPrev() {
		if (slideIndex != 0) {
			slideIndex -= 1
			map.getView().fit(viewerExtent)
      refreshAllmapsLayer()
		}
		if (slideIndex == 0) {
		}
	}

	async function goBoston() {
		view.animate({
			center: boston,
			zoom: 12,
			rotation: 90
		})
		console.log(extent)
	}
</script>

<div class="grid-container">
	<div class="header">The Berlage: Project NL</div>
	<div class="panel panel-grid-container">
		<!-- <Projects {slides} /> -->
		<div class="caption">
			<h1>{selectedSlide.frontmatter.meta.heading}</h1>
			{JSON.stringify(allmapsAnnotations)}
			{@html selectedSlide.html}
			<p>slideIndex: {slideIndex}, slideCount: {slideCount}</p>
		</div>
		<div class="control-container">
			<div class="control-item ">
				<button on:click={goPrev} class="button" type="button">
					{slideIndex == 0 ? 'Start' : 'Previous'}
				</button>
			</div>
			<div class="control-item">
				<button on:click={goNext} class="button" type="button">
					{slideIndex == slideCount ? 'End' : 'Next'}
				</button>
			</div>
		</div>
	</div>
	<div id="map" class="map" />
</div>

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
		.caption {
			display: none;
		}
	}

	.header {
		grid-column: 1 / 5;
		grid-row: header;
		padding: 10px;
	}

	.map {
		grid-column: 1 / 5;
		grid-row: map;
		background-color: blue;
		width: 100%;
		height: 100%;
		z-index: 1;
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
</style>
