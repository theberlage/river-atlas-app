import { readable, writable, derived, get } from 'svelte/store'

function toggleMenu() {
	const { subscribe, update } = writable<boolean>(false)
	return {
		subscribe,
		toggle: () => update((value) => (value === false ? true : false))
	}
}

export const menu = toggleMenu()
