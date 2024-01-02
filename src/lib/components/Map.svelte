<script lang="ts">
	import { onMount } from 'svelte'
	import { readable, writable, derived, get } from 'svelte/store'

	// Stores
	import {
		mapBoxLayer as mapboxSettings,
		selectedSlideData as selectedSlide,
		georefAnnotations as newWarpedMapSource,
		vectorLayers as newVectorSource
	} from '$lib/shared/stores/selectedSlide.js'

	// Shared functions
	import { calculateExtent, sleep, hexToRGBA } from '$lib/shared/utils.js'

	// Open Layers
	import olMap from 'ol/Map'
	import olView from 'ol/View'
	import { Tile as TileLayer, Vector as VectorLayer } from 'ol/layer.js'
	import { OSM, XYZ, Vector as VectorSource } from 'ol/source.js'
	import { Rotate, defaults as defaultControls } from 'ol/control.js'
	import { getCenter } from 'ol/extent'
	import GeoJSON from 'ol/format/GeoJSON.js'
	import { Fill, Stroke, Circle, Style } from 'ol/style.js'
	import { MapboxVectorLayer } from 'ol-mapbox-style'
	import { fromExtent } from 'ol/geom/Polygon'
	import Feature from 'ol/Feature.js'

	// Types & CSS
	import type { Extent, Coordinate } from 'ol/extent'
	import 'ol/ol.css'

	// Vector styles
	import { defaultStyles, selectedStyles, selectableStyles } from '$lib/shared/vectorStyles.js'

	// Allmaps
	import { WarpedMapSource, WarpedMapLayer } from '@allmaps/openlayers'

	let map: olMap
	let view: olView

	let xyzSource: XYZ
	let xyzLayer: TileLayer<XYZ>

	let warpedMapLayer: WarpedMapLayer
	let warpedMapSource: WarpedMapSource

	let vectorSource: VectorSource
	let vectorLayer: VectorLayer<VectorSource>

	let mapBoxLayer: MapboxVectorLayer

	let currentXyzSource: string | undefined = undefined
	let currentWarpedMapSource = writable(new Map())
	let currentVectorSource = writable(new Map())
	let animating: boolean = false
	let extent: Extent

	// Add Mapbox background layer
	$: {
		if (map && $mapboxSettings) {
			let mapboxLayer = new MapboxVectorLayer({
				styleUrl: $mapboxSettings.styleUrl,
				accessToken: $mapboxSettings.accessToken
			})
			let resp = map.getLayers().extend([mapboxLayer])
			console.log('Added Mapbox layer')
		}
	}

	// Add optional XYZ layer and animate the view
	$: {
		if (map && $selectedSlide) {
			const settings = $selectedSlide.frontmatter
			extent = calculateExtent(settings.viewer.bbox)
			const center: Coordinate = getCenter(extent)
			const resolution: number = view.getResolutionForExtent(extent, map.getSize())
			const rotation: number = settings.viewer.rotation * (Math.PI / 180)
			const duration: number = 1000

			// Add/remove XYZ layer
			if (settings.xyz?.url) {
				const url = settings.xyz.url
				if (currentXyzSource !== url) {
					// Replace XYZ layer
					xyzSource.setUrl('')
					xyzSource.clear()
					xyzSource.setUrl(url)
					currentXyzSource = url
				}
			} else {
				// Remove XYZ layer
				xyzSource.setUrl('')
				xyzSource.clear()
				currentXyzSource = undefined
			}

			// Todo: Padding
			// view.padding = innerWidth > 600 ? [0, 400, 0, 0] : [0, 0, 0, 0]

			// Animate view
			animateView(center, resolution, rotation, duration)
		}
	}

	// Add Allmaps layers
	$: {
		// Add && !animating to wait for animation
		if (warpedMapLayer && $newWarpedMapSource) {
			if ($newWarpedMapSource.size) {
				addWarpedMapSource($newWarpedMapSource)
			} else {
				warpedMapSource.clear()
				currentWarpedMapSource.set(new Map())
			}
			console.log('Processed maps!')
		}
	}

	// Add vector layers
	$: {
		// Add && !animating to wait for animation
		if (vectorLayer && $newVectorSource) {
			if ($newVectorSource.size) {
				addVectorSource($newVectorSource)
			} else {
				vectorSource.clear()
				currentVectorSource.set(new Map())
			}
			console.log('Processed features!')
		}
	}

	function animateView(center: Coordinate, resolution: number, rotation: number, duration: number) {
		view.animate({
			center,
			resolution,
			rotation,
			duration
		})
		// To determine if view is animating (and only add layers after animation)
		if (view.getAnimating) {
			animating = true
			setTimeout(() => (animating = false), duration)
		}
	}

	async function addWarpedMapSource(newWarpedMapSource: any) {
		for (const [id, annotation] of $currentWarpedMapSource) {
			// Remove maps from WarpedMapSource that are not on the new slide
			if (!newWarpedMapSource.has(id)) {
				await warpedMapSource.removeGeoreferenceAnnotation(annotation)
				console.log('Removed map', id)
			}
		}
		for (const [id, annotation] of newWarpedMapSource) {
			// Only add new maps to WarpedMapSource
			if (!$currentWarpedMapSource.has(id)) {
				await warpedMapSource.addGeoreferenceAnnotation(annotation)
				console.log('Added map', id)
			} else {
				// Move existing maps to front to follow new layer order
				warpedMapSource.bringMapsToFront([id])
			}
			// Set properties
			const properties = annotation.properties
			// if ('opacity' in properties) {
			if (properties.opacity) {
				let opacity = properties.opacity / 100
				warpedMapLayer.setMapOpacity(id, opacity)
			}
			if (properties.removeBackground?.color) {
				let hexColor = properties.removeBackground.color
				let threshold = properties.removeBackground.threshold
					? properties.removeBackground.threshold / 100
					: 0.1
				let hardness = properties.removeBackground.hardness
					? properties.removeBackground.hardness / 100
					: 0.7
				warpedMapLayer.setMapRemoveBackground(id, { hexColor, threshold, hardness })
			}
			// if ('saturation' in properties) {
			if (properties.saturation) {
				warpedMapLayer.setMapSaturation(id, properties.saturation / 100)
			}
			if (properties.colorize) {
				warpedMapLayer.setMapColorize(id, properties.colorize)
			}
		}
		currentWarpedMapSource.set(newWarpedMapSource)
	}

	function addVectorSource(newVectorSource: any) {
		vectorSource.forEachFeature((feature) => {
			const path = feature.getProperties().collection
			// Remove vectors from VectorSource that are not on the new slide
			if (!newVectorSource.has(path)) {
				vectorSource.removeFeature(feature)
				console.log('Removed feature', feature)
			}
		})
		for (let [path, features] of newVectorSource) {
			// Only add new features to VectorSource
			if (!$currentVectorSource.has(path)) {
				let parsedFeatures = new GeoJSON().readFeatures(features, {
					featureProjection: 'EPSG:3857'
				})
				vectorSource.addFeatures(parsedFeatures)
				console.log('Added features', features)
			}
		}
		currentVectorSource.set(newVectorSource)
		// Uncomment the block below to display the bbox of the view

		// let bboxPolygon = fromExtent(extent)
		// let bboxFeature = new Feature({
		// 	geometry: bboxPolygon
		// })
		// vectorSource.addFeature(bboxFeature)

		// Set properties
		vectorSource.forEachFeature(function (feature) {
			let properties = feature.getProperties()
			let fillOpacity = 'fill-opacity' in properties ? properties['fill-opacity'] : 0
			let strokeOpacity = 'stroke-opacity' in properties ? properties['stroke-opacity'] : 1
			let fillColor =
				properties.fill && properties.fill.includes('rgba')
					? properties.fill
					: properties.fill && properties.fill.includes('#')
					? hexToRGBA(properties.fill, fillOpacity)
					: `rgba(255, 255, 0, ${fillOpacity})`
			let strokeColor =
				properties.stroke && properties.stroke.includes('rgba')
					? properties.stroke
					: properties.stroke && properties.stroke.includes('#')
					? hexToRGBA(properties.stroke, strokeOpacity)
					: `rgba(255, 255, 0, ${strokeOpacity})`
			let strokeWidth = 'stroke-width' in properties ? properties['stroke-width'] : 2
			let radius = 'radius' in properties ? properties.radius : 10
			let customStyle = new Style({
				stroke: new Stroke({
					color: strokeColor,
					width: strokeWidth
				}),
				fill: new Fill({
					color: fillColor
				}),
				image: new Circle({
					radius,
					fill: new Fill({ color: fillColor }),
					stroke: new Stroke({
						color: strokeColor,
						width: strokeWidth
					})
				})
			})
			feature.setStyle(customStyle)
			if (properties.project) {
				feature.setStyle(selectableStyles)
			}
		})
	}

	// map.on('pointermove', function (event) {
	// 	vectorLayer.getFeatures(event.pixel).then(function (features) {
	// 		let feature = features.length ? features[0] : undefined
	// 		if (feature == undefined || !feature.getProperties().project) {
	// 			vectorSource.forEachFeature(function (feature) {
	// 				let properties = feature.getProperties()
	// 				if (properties.project) {
	// 					feature.setStyle($selectableStyles)
	// 				}
	// 			})
	// 			map.getTargetElement().style.cursor = ''
	// 		}
	// 		if (feature !== undefined && feature.getProperties().project) {
	// 			feature.setStyle($selectedStyles)
	// 			map.getTargetElement().style.cursor = 'pointer'
	// 		}
	// 	})
	// })

	// map.on('singleclick', function (event) {
	// 	vectorLayer.getFeatures(event.pixel).then(function (features) {
	// 		const feature = features.length ? features[0] : undefined
	// 		if (feature !== undefined) {
	// 			const properties = feature.getProperties()
	// 			if (properties.project) {
	// 				window.location.hash = '#/project/' + properties.project + '/1'
	// 			}
	// 		}
	// 	})
	// })

	onMount(async () => {
		// let osmLayer = new TileLayer({
		// 	source: new OSM(),
		// 	zIndex: 1
		// })

		xyzSource = new XYZ()
		xyzLayer = new TileLayer({
			source: xyzSource,
			zIndex: 2
		})

		warpedMapSource = new WarpedMapSource()
		warpedMapLayer = new WarpedMapLayer({
			source: warpedMapSource,
			zIndex: 3
		})

		vectorSource = new VectorSource()
		vectorLayer = new VectorLayer({
			source: vectorSource,
			style: defaultStyles,
			zIndex: 4
		})

		view = new olView()
		map = new olMap({
			view,
			layers: [
				xyzLayer,
				// osmLayer,
				// mapBoxLayer,
				warpedMapLayer,
				vectorLayer
			],
			target: 'ol',
			controls: defaultControls().extend([new Rotate()])
		})
	})
</script>

<div id="ol" class="map" />

<style>
	.map {
		grid-column: 1 / 5;
		grid-row: map;
		background-color: white;
		width: 100%;
		height: 100%;
		z-index: 1;
	}

	:global(.ol-rotate) {
		left: 0.5em;
		top: 4em;
		right: auto;
	}

	@media all and (max-width: 600px) {
		:global(.ol-rotate) {
			left: auto;
			right: 0.5em;
			top: 0.5em;
		}
	}
</style>
