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
	import { getCenter } from 'ol/extent'
	import GeoJSON from 'ol/format/GeoJSON.js'
	import { OSM, Vector as VectorSource } from 'ol/source.js'
	import { Fill, Stroke, Style } from 'ol/style.js'
	import Select from 'ol/interaction/Select.js'
	import sheetIndex from '$lib/sheetindex.json'
  import { VectorSourceEvent } from 'ol/source/Vector'

	// Allmaps

	import { WarpedMapSource, WarpedMapLayer } from '@allmaps/openlayers'

	// Typescript

	import type { MarkdownSlide } from '$lib/shared/types.js'
  import type { FeatureLike } from 'ol/Feature.js'

	// Declaring changing variables with let and fixed ones with const

	let map: Map
	let view: View

	let warpedMapSource: WarpedMapSource
	let warpedMapLayer: WarpedMapLayer
	let vectorSource: VectorSource
	let vectorLayer: VectorLayer<VectorSource>
	let initialViewCoords = fromLonLat([5.054, 51.965])

	let slideShowID: string | undefined
	let slideIndex: number = 0
	let slideCount: number
	let selectedSlide: any = undefined
	let selectedFeature: FeatureLike | undefined
  let allmapsAnnotations: Array<String>
  const firstRevision: Array<String> = ["https://annotations.allmaps.org/manifests/f940b520d16381d4","https://annotations.allmaps.org/manifests/752b29a50403371d"]

	const biesboschVector = {
		type: 'FeatureCollection',
		features: [
			{
				type: 'Feature',
				properties: {
					slug: 'dordrecht'
				},
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
				properties: {
					slug: 'biesbosch'
				},
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

	const styles = new Style({
		stroke: new Stroke({
			color: 'blue',
			lineDash: [4],
			width: 3
		}),
		fill: new Fill({
			color: 'rgba(0, 0, 255, 0.1)'
		})
	})

	const selected = new Style({
		stroke: new Stroke({
			color: 'red',
			lineDash: [4],
			width: 3
		}),
		fill: new Fill({
			color: 'rgba(0, 0, 255, 0.1)'
		})
	})

	// Importing Markdown and frontmatter for slides
	// @Bert: toevoegen aan object: georef annotaties + geojson
	// @Bert: toevoegen: markdown + annotations + geojson in mapje overview
	// @Bert: geojson gebruiken voor projecttitels? (yml verwijderd)

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

	// Function to fetch external jsons

	async function fetchJson(url: any) {
		return fetch(url).then((response) => response.json())
	}

	// Function to replace vector layer

	function replaceVectorSource() {
		let geojson = new GeoJSON().readFeatures(biesboschVector.features[slideIndex], {
			featureProjection: 'EPSG:3857'
		})

		vectorSource.clear() // Todo: check if layer exists

		vectorSource.addFeatures(geojson)
	}

	// Function to replace Allmaps layer
	// @Bert beter om warpedMapLayer te laten bestaan en warpedMapSource.clear() te doen
	// @Bert optie: checken of annotatie al is geladen (als dezelfde kaart voor meerdere slides wordt gebruikt)
  // @Bert parameters voor transparency en mask

	async function replaceAllmapsLayer(allmapsAnnotations:any) {
		map.removeLayer(warpedMapLayer) // Todo: check if layer exists

		let annotations = await Promise.all(allmapsAnnotations.map(fetchJson))

		warpedMapSource = new WarpedMapSource()

		warpedMapLayer = new WarpedMapLayer({
			source: warpedMapSource,
      zIndex: 2
		})

		for (let annotation of annotations) {
			await warpedMapSource.addGeorefAnnotation(annotation)
		}

		map.addLayer(warpedMapLayer)

    console.log(allmapsAnnotations)

    // z-index toevoegen
	}

	// Function to adjust view

	function changeView() {
		let boundingBox = selectedSlide.frontmatter.viewer.bbox

		let extent = fromLonLat(boundingBox.slice(0, 2)).concat(fromLonLat(boundingBox.slice(2)))

		let rotation = selectedSlide.frontmatter.viewer.rotation * (Math.PI / 180)

		let center = getCenter(extent)

		let resolution = view.getResolutionForExtent(extent, map.getSize())

		view.animate({
			center: center,
			resolution: resolution,
			rotation: rotation
		})
	}

	function initialView() {
		view.animate({
			center: initialViewCoords,
			zoom: 10,
			rotation: 0
		})

		map.removeLayer(warpedMapLayer)

		vectorSource.clear()

		let geojson = new GeoJSON().readFeatures(sheetIndex, {
			featureProjection: 'EPSG:3857'
		})

		vectorSource.addFeatures(geojson)

    replaceAllmapsLayer(firstRevision)
	}

	// onMount function after components are loaded, see https://svelte.dev/tutorial/onmount

	onMount(async () => {
		// Initialising OpenLayers

		view = new View({
			center: initialViewCoords,
			zoom: 10
		})

		let geojson = new GeoJSON().readFeatures(sheetIndex, {
			featureProjection: 'EPSG:3857'
		})

		vectorSource = new VectorSource()
		vectorLayer = new VectorLayer({
			source: vectorSource,
			style: styles,
      zIndex: 3
		})

		vectorSource.addFeatures(geojson)

		warpedMapSource = new WarpedMapSource()
		warpedMapLayer = new WarpedMapLayer({
			source: warpedMapSource
		})

		map = new Map({
			view,
			layers: [
				new TileLayer({
					source: new OSM(),
          zIndex: 1
				}),
				vectorLayer,
				warpedMapLayer
			],
			target: 'map'
		})

    replaceAllmapsLayer(firstRevision)

		map.on('pointermove', function (event) {
      // @Bert: beter maken, typescript error fixen
			if (selectedFeature !== undefined) {
				selectedFeature.setStyle(undefined)
				selectedFeature = undefined
				map.getTargetElement().style.cursor = ''
			}
			map.forEachFeatureAtPixel(event.pixel, function (feature) {
				selectedFeature = feature
				selectedFeature.setStyle(selected)
				map.getTargetElement().style.cursor = 'pointer'
			})
		})

		map.on('click', function (event) {
			map.forEachFeatureAtPixel(event.pixel, function (feature) {
				let properties = selectedFeature.getProperties()
				if (properties.slug) {
					slideShowID = properties.slug
					selectedSlide = slidesByProject[slideShowID][slideIndex]
					slideCount = slidesByProject[slideShowID].length
					changeView()
          allmapsAnnotations = selectedSlide.frontmatter.allmaps.map((item: any) => item.url)
					replaceAllmapsLayer(allmapsAnnotations)
					replaceVectorSource()
				}
			})
		})
	})

	function goNext() {
		if (slideIndex < slideCount - 1) {
			slideIndex += 1
			selectedSlide = slidesByProject[slideShowID][slideIndex]
			changeView()
      allmapsAnnotations = selectedSlide.frontmatter.allmaps.map((item: any) => item.url)
			replaceAllmapsLayer(allmapsAnnotations)
			replaceVectorSource()
		}
		else if (slideIndex === slideCount - 1) {
			slideShowID = undefined
      slideIndex = 0
			initialView()
		}
	}

	function goPrev() {
		if (slideIndex > 0) {
			slideIndex -= 1
			selectedSlide = slidesByProject[slideShowID][slideIndex]
			changeView()
      allmapsAnnotations = selectedSlide.frontmatter.allmaps.map((item: any) => item.url)
			replaceAllmapsLayer(allmapsAnnotations)
			replaceVectorSource()
		}
		else if (slideIndex === 0) {
			slideShowID = undefined
      slideIndex = 0
			initialView()
		}
	}
</script>

<div class="grid-container">
	<div class="header">The Berlage: Project NL</div>
	{#if slideShowID !== undefined}
		<div class="panel panel-grid-container">
			<!-- @Bert: componentje maken  -->
			<!-- <Projects {slidesByProject} /> -->
			<div class="caption">
				<h1>{selectedSlide.frontmatter.meta.heading}</h1>
				{@html selectedSlide.html}
			</div>
			<div class="control-container">
				<div class="control-item ">
					<button on:click={goPrev} class="button" type="button">
						{slideIndex == 0 ? 'Overview' : 'Previous'}
					</button>
				</div>
				<div class="control-item">
					<button on:click={goNext} class="button" type="button">
						{slideIndex == slideCount - 1 ? 'Overview' : 'Next'}
					</button>
				</div>
			</div>
		</div>
	{/if}
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
