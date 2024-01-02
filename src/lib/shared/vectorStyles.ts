import { Fill, Stroke, Style } from 'ol/style.js'

export const defaultStyles = new Style({
	stroke: new Stroke({
		color: 'yellow',
		width: 4
	}),
	fill: new Fill({
		color: 'rgba(255, 255, 0, 0)'
	})
})

export const selectedStyles = new Style({
	stroke: new Stroke({
		color: 'yellow',
		width: 4
	}),
	fill: new Fill({
		color: 'yellow'
	}),
	zIndex: 5
})

export const selectableStyles = new Style({
	stroke: new Stroke({
		color: 'yellow',
		width: 4
	}),
	fill: new Fill({
		color: 'rgba(0, 255, 255, 0)'
	}),
	zIndex: 4
})
