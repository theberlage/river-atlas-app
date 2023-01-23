<script lang="ts">
	// JS and Svelte functions

	import { onMount } from 'svelte'

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

	// Stores

	import { slidesByProject, slideShowID, slideIndex } from '$lib/components/stores'
	import { page } from '$app/stores'

	// Allmaps

	import { WarpedMapSource, WarpedMapLayer } from '@allmaps/openlayers'

	// Typescript

	import type { FeatureLike } from 'ol/Feature.js'
	import type { Coordinate } from 'ol/coordinate'
	import type { Extent } from 'ol/extent'
	import type { GeoJSONGeometryCollection } from 'ol/format/GeoJSON'

	// Components

	import Slideshow from '$lib/components/Slideshow.svelte'
	import { kebabCase } from 'lodash-es'

	// Declaring changing variables with let and fixed ones with const

	let map: Map
	let view: View

	let warpedMapSource: WarpedMapSource
	let warpedMapLayer: WarpedMapLayer
	let vectorSource: VectorSource
	let vectorLayer: VectorLayer<VectorSource>
	let initialViewCoords = fromLonLat([5.054, 51.965])

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
			width: 2
		}),
		fill: new Fill({
			color: 'rgba(0, 0, 255, 0.1)'
		})
	})

	const selected = new Style({
		stroke: new Stroke({
			color: 'red',
			width: 2
		}),
		fill: new Fill({
			color: 'rgba(0, 0, 255, 0.1)'
		})
	})

	// Function to fetch external jsons

	async function fetchJson(url: string) {
		return fetch(url).then((response) => response.json())
	}

	// Function to add vector layer

	async function addVectorSource(geojsonsPaths: Array<string>) {
		let geojsons = await Promise.all(geojsonsPaths.map(fetchJson))
		let extent: Extent

		for (let geojson of geojsons) {
			let features = new GeoJSON().readFeatures(geojson, {
				featureProjection: 'EPSG:3857'
			})
			vectorSource.addFeatures(features)
		}
	}

	// Function to add Allmaps layer
	// @Bert beter om warpedMapLayer te laten bestaan en warpedMapSource.clear() te doen
	// @Bert checken of annotatie al is geladen (als dezelfde kaart voor meerdere slides wordt gebruikt)
	// @Bert parameters voor transparency en mask
	// @Bert kan ik de plugin een geojson terugvragen van de mask?

	async function addAllmapsLayer(allmapsAnnotations: any) {
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

	function calculateExtent(boundingBox: Coordinate) {
		return fromLonLat(boundingBox.slice(0, 2)).concat(fromLonLat(boundingBox.slice(2)))
	}

	// Function to animate view

	function animateView(extent: Extent, rotation: number) {
		let center = getCenter(extent)
		let resolution = view.getResolutionForExtent(extent, map.getSize())

		view.animate({
			center: center,
			resolution: resolution,
			rotation: rotation
		})
	}

	// Function to change layers and view depending on state

	function changeView() {
		let bbox: Coordinate
		let rotation: number
		let extent: Extent
		let geojsons: Array<string>
		let slide = $slideShowID
		let index = $slideIndex

		if (slide !== undefined) {
			selectedSlide = $slidesByProject[slide][index]
			slideCount = $slidesByProject[slide].length
			extent = calculateExtent(selectedSlide.frontmatter.viewer.bbox)
			rotation = selectedSlide.frontmatter.viewer.rotation * (Math.PI / 180)

			map.removeLayer(warpedMapLayer) // Todo: check if layer exists
			if (selectedSlide.frontmatter.allmaps) {
				allmapsAnnotations = selectedSlide.frontmatter.allmaps.map((item: any) => {
					return `/projects/${$slideShowID}/annotations/${item.annotation}`
				})
				addAllmapsLayer(allmapsAnnotations)
			}

			if (vectorSource) {
				vectorSource.clear()
			}
			if (selectedSlide.frontmatter.geojson) {
				geojsons = selectedSlide.frontmatter.geojson.map((item: any) => {
					return `/projects/${$slideShowID}/geojsons/${item.filename}`
				})
				addVectorSource(geojsons)
			}

			animateView(extent, rotation)
		} else if (slide === undefined) {
			bbox = [4.225369, 51.750297, 6.235737, 52.03771]
			extent = calculateExtent(bbox)
			rotation = 0

			allmapsAnnotations = firstRevision
			if (warpedMapLayer) {
				map.removeLayer(warpedMapLayer)
			}
			addAllmapsLayer(allmapsAnnotations)

			geojsons = ['/overview/geojsons/sheetindex.json']
			vectorSource.clear() // Todo: check if layer exists
			addVectorSource(geojsons)

			// extent = vectorSource.getExtent() // Aanpassen want addVectorSource is async

			animateView(extent, rotation)
		}
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
		addVectorSource(['/overview/geojsons/sheetindex.json'])

		// if ($page.url.searchParams.has('project')) {
		//   let project: string = $page.url.searchParams.get('project')
    //   if ($slidesByProject[project]) {
		//     slideShowID.set(project)
    //     let slide: number = $page.url.searchParams.get('slide')
    //     let slideCount = $slidesByProject[$slideShowID].length
    //     if (slide >= 0 && slide <= slideCount) {
    //       slideIndex.set(slide)
    //     }
    //     changeView()
    //   }
    // }

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
				if (properties.project) {
					slideShowID.set(properties.project)
					changeView()
				}
			})
		})
	})
</script>

<div class="grid-container">
	<div class="header">The Berlage: Project NL</div>
	{#if $slideShowID !== undefined}
		<Slideshow on:changeView={changeView} />
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
	}

	.header {
		grid-column: 1 / 5;
		grid-row: header;
		padding: 10px;
	}

	.map {
		grid-column: 1 / 5;
		grid-row: map;
		background-color: white;
		width: 100%;
		height: 100%;
		z-index: 1;
	}
</style>
