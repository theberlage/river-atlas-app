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
	import { VectorSourceEvent } from 'ol/source/Vector'

	// Geojson (temporary)

	import sheetIndex from '$lib/sheetindex.json'
	import biesboschVector from '$lib/biesbosch.json'

	// Allmaps

	import { WarpedMapSource, WarpedMapLayer } from '@allmaps/openlayers'

	// Typescript

	import type { MarkdownSlide } from '$lib/shared/types.js'
	import type { FeatureLike } from 'ol/Feature.js'
  import type { Coordinate } from 'ol/coordinate'
  import type Feature from 'ol/Feature.js'

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
	const firstRevision: Array<String> = [
		'https://annotations.allmaps.org/manifests/f940b520d16381d4',
		'https://annotations.allmaps.org/manifests/752b29a50403371d'
	]

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

	// Function to add vector layer

	function addVectorSource(geojson: any) {
		let features = new GeoJSON().readFeatures(geojson, {
			featureProjection: 'EPSG:3857'
		})

		vectorSource.clear() // Todo: check if layer exists

		vectorSource.addFeatures(features)
	}

	// Function to add Allmaps layer
	// @Bert beter om warpedMapLayer te laten bestaan en warpedMapSource.clear() te doen
	// @Bert checken of annotatie al is geladen (als dezelfde kaart voor meerdere slides wordt gebruikt)
	// @Bert parameters voor transparency en mask
	// @Bert kan ik de plugin een geojson terugvragen van de mask?

	async function addAllmapsLayer(allmapsAnnotations: any) {
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
	}

  function calculateExtent(boundingBox:Coordinate) {
    return fromLonLat(boundingBox.slice(0, 2)).concat(fromLonLat(boundingBox.slice(2)))
  }

  // Function to change view and layers

	function changeView(slide: string | undefined, index: number) {
		let bbox:Coordinate
		let rotation:number
		let extent:Array<Number>
		let geojson

		if (slide !== undefined) {
			selectedSlide = slidesByProject[slide][index]
			slideCount = slidesByProject[slide].length
			allmapsAnnotations = selectedSlide.frontmatter.allmaps.map((item: any) => item.url)
			geojson = biesboschVector.features[slideIndex] // Todo: change to slide vector
			extent = calculateExtent(selectedSlide.frontmatter.viewer.bbox)
			rotation = selectedSlide.frontmatter.viewer.rotation * (Math.PI / 180)
		} else if (slide === undefined) {
			bbox = [4.225369, 51.750297, 6.235737, 52.03771] // Todo: change to about.md bbox
			extent = calculateExtent(bbox)
			allmapsAnnotations = firstRevision
			geojson = sheetIndex
			rotation = 0
		}

		addAllmapsLayer(allmapsAnnotations)
		addVectorSource(geojson)

		let center = getCenter(extent)
		let resolution = view.getResolutionForExtent(extent, map.getSize())

		view.animate({
			center: center,
			resolution: resolution,
			rotation: rotation
		})

    console.log(map.getLayers())
	}

	// onMount function after components are loaded, see https://svelte.dev/tutorial/onmount

	onMount(async () => {
		// Initialising OpenLayers

		view = new View({
			center: initialViewCoords,
			zoom: 9
		})

		vectorSource = new VectorSource()
		vectorLayer = new VectorLayer({
			source: vectorSource,
			style: styles,
			zIndex: 3
		})

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

		addAllmapsLayer(firstRevision)
		addVectorSource(sheetIndex)

		map.on('pointermove', function (event) {
			// @Bert beter maken, typescript error fixen
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
					changeView(slideShowID, slideIndex)
				}
			})
		})
	})

	function goNext() {
		if (slideIndex < slideCount - 1) {
			slideIndex += 1
			changeView(slideShowID, slideIndex)
		} else if (slideIndex === slideCount - 1) {
			slideShowID = undefined
			slideIndex = 0
			changeView(slideShowID, slideIndex)
		}
	}

	function goPrev() {
		if (slideIndex > 0) {
			slideIndex -= 1
			changeView(slideShowID, slideIndex)
		} else if (slideIndex === 0) {
			slideShowID = undefined
			slideIndex = 0
			changeView(slideShowID, slideIndex)
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
