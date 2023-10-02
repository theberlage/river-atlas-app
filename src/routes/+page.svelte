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
	import MapboxVector from 'ol/layer/MapboxVector'

	// Stores

	import { slidesByProject, slideShowID, slideIndex } from '$lib/components/stores'

	// Allmaps

	import { WarpedMapSource, WarpedMapLayer } from '@allmaps/openlayers'

	// Typescript

	import type { FeatureLike } from 'ol/Feature.js'
	import type { Coordinate } from 'ol/coordinate'
	import type { Extent } from 'ol/extent'
	import type { GeoJSONGeometryCollection } from 'ol/format/GeoJSON'

	// Components

	import Slideshow from '$lib/components/Slideshow.svelte'
	import About from '$lib/components/About.svelte'
	import Bearlage from '$lib/components/Bearlage.svelte'

	// Declaring changing variables with let and fixed ones with const

	let map: Map
	let view: View

	let warpedMapSource: WarpedMapSource
	let warpedMapLayer: WarpedMapLayer
	let vectorSource: VectorSource
	let vectorLayer: VectorLayer<VectorSource>

	let slideCount: number
	let selectedSlide: any = undefined
	let selectedFeature: FeatureLike | undefined

	let allmapsAnnotations: Array<String>

	let innerHeight: number
	let about: boolean = false

	// Overview constants

	const firstRevision: Array<String> = [
		'https://annotations.allmaps.org/manifests/f940b520d16381d4',
		'https://annotations.allmaps.org/manifests/752b29a50403371d'
	]
	const firstRevisionVector: Array<string> = ['/overview/geojsons/first-revision.geojson']
	const initialViewCoords = fromLonLat([5.115, 51.882])

	// Styles for OpenLayers

	const styles = new Style({
		stroke: new Stroke({
			color: 'grey',
			width: 1
		}),
		fill: new Fill({
			color: 'rgba(255, 255, 255, 0)'
		})
	})

	const selected = new Style({
		stroke: new Stroke({
			color: 'black',
			width: 1
		}),
		fill: new Fill({
			color: 'rgba(0, 255, 255, 0.2)'
		}),
		zIndex: 5
	})

	const selectable = new Style({
		stroke: new Stroke({
			color: 'rgba(0, 0, 0, 1)',
			width: 1
		}),
		fill: new Fill({
			color: 'rgba(0, 255, 255, 0.6)'
		}),
		zIndex: 4
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

		vectorSource.forEachFeature(function (feature) {
			let properties = feature.getProperties()
			if (properties.project) {
				feature.setStyle(selectable)
			}
		})
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
			await warpedMapSource.addGeoreferenceAnnotation(annotation)
		}

		map.addLayer(warpedMapLayer)
	}

	function calculateExtent(boundingBox: Coordinate) {
		return fromLonLat(boundingBox.slice(0, 2)).concat(fromLonLat(boundingBox.slice(2)))
	}

	// Function to animate view

	function sleep(ms: number) {
		return new Promise((resolve) => setTimeout(resolve, ms))
	}

	async function animateView(extent: Extent, rotation: number, duration: number = 1000) {
		let center = getCenter(extent)
		let resolution = view.getResolutionForExtent(extent, map.getSize())

		view.animate({
			center: center,
			resolution: resolution,
			rotation: rotation
		})
		await sleep(duration)
	}

	// Function to change layers and view depending on state

	async function changeView() {
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
			await animateView(extent, rotation)

			if (selectedSlide.frontmatter.allmaps) {
				allmapsAnnotations = selectedSlide.frontmatter.allmaps.map((item: any) => {
					return `/projects/${$slideShowID}/annotations/${item.annotation}`
				})
				let allmapsAnnotationsReversed = allmapsAnnotations.reverse()
				addAllmapsLayer(allmapsAnnotationsReversed)
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
		} else if (slide === undefined) {
			bbox = [4.018731, 51.737203, 6.213143, 52.027794]
			extent = calculateExtent(bbox)
			rotation = 0

			allmapsAnnotations = firstRevision
			if (warpedMapLayer) {
				map.removeLayer(warpedMapLayer)
			}
			addAllmapsLayer(allmapsAnnotations)

			geojsons = firstRevisionVector
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
			zoom: 8
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

		let mapBoxLayer = new MapboxVector({
			styleUrl: 'mapbox://styles/eliottmoreau/cld2u07au002k01ql8ku1gx29',
			accessToken:
				'pk.eyJ1IjoiZWxpb3R0bW9yZWF1IiwiYSI6ImNsY3N0bWUwcDBlNXYzd3MxaGptMDlyeXgifQ.pXVx5GYbNMBGYDNY_gQZVg'
		})

		map = new Map({
			view,
			layers: [
				// new TileLayer({
				// 	source: new OSM(),
				// 	zIndex: 1
				// }),
				mapBoxLayer,
				vectorLayer,
				warpedMapLayer
			],
			target: 'map'
		})

		// addAllmapsLayer(firstRevision)
		// addVectorSource(firstRevisionVector)
		changeView()

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
			vectorLayer.getFeatures(event.pixel).then(function (features) {
				let feature = features.length ? features[0] : undefined
				if (feature == undefined || !feature.getProperties().project) {
					vectorSource.forEachFeature(function (feature) {
						let properties = feature.getProperties()
						if (properties.project) {
							feature.setStyle(selectable)
						}
					})
					map.getTargetElement().style.cursor = ''
				}
				if (feature !== undefined && feature.getProperties().project) {
					feature.setStyle(selected)
					map.getTargetElement().style.cursor = 'pointer'
				}
			})
		})

		map.on('singleclick', function (event) {
			vectorLayer.getFeatures(event.pixel).then(function (features) {
				const feature = features.length ? features[0] : undefined
				if (feature !== undefined) {
					const properties = feature.getProperties()
					if (properties.project) {
						slideShowID.set(properties.project)
						changeView()
					}
				}
			})
		})
	})

	function goHome() {
		slideShowID.set(undefined)
		slideIndex.set(0)
		about = false
		changeView()
	}

	let bear: boolean = false

	function onKeyDown(e: any) {
		switch (e.keyCode) {
			case 66:
				bear = true
		}
	}

	function onKeyUp(e: any) {
		switch (e.keyCode) {
			case 66:
				bear = false
		}
	}
</script>

<svelte:window bind:innerHeight on:keydown={onKeyDown} on:keyup={onKeyUp} />

<svelte:head>
	<title>River Atlas</title>
</svelte:head>

<div class="grid-container" style="height:{innerHeight}px;">
	<div class="header">
		<span class="link" on:click={() => goHome()} on:keypress={() => goHome()}>
			<span class="hidden">The Berlage: </span>River Atlas</span
		>
		{#if $slideShowID === undefined}
			<span
				class="float link"
				on:click={() => (about = !about)}
				on:keypress={() => (about = !about)}
			>
				{about === false ? 'About' : 'Back to overview'}
			</span>
		{:else}
			<span class="float grey">About</span>
		{/if}
	</div>
	{#if about}
		<About />
	{/if}
	{#if $slideShowID !== undefined}
		<Slideshow on:changeView={changeView} />
	{/if}
	{#if bear}
		<Bearlage />
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
		font-size: 15px;
		padding: 0;
		margin: 0;
	}

	:global(.float) {
		float: right;
	}

	.grid-container {
		display: grid;
		grid-template-columns: 1fr 1fr 1fr [panel] 400px;
		grid-template-rows: [header] 42px [map] 1fr;
		width: 100vw;
		height: 100vh;
	}

	@media all and (max-width: 600px) {
		.grid-container {
			display: grid;
			grid-template-columns: [panel] 1fr;
			grid-template-rows: [header] 40px [map] 1fr;
			width: 100vw;
			height: 100vh;
		}
		.hidden {
			display: none;
		}
	}

	.header {
		grid-column: 1 / 5;
		grid-row: header;
		padding: 10px;
		font-size: 1.2rem;
		border-bottom: 1px solid lightgrey;
	}

	.link {
		cursor: pointer;
	}

	.grey {
		color: grey;
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
