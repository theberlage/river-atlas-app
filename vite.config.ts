import { sveltekit } from '@sveltejs/kit/vite'
import type { UserConfig } from 'vite'
import path from 'path'

import { read } from 'to-vfile'
import { unified } from 'unified'
import remarkParse from 'remark-parse'
import remarkHtml from 'remark-html'
import remarkFrontmatter from 'remark-frontmatter'
import { matter } from 'vfile-matter'

function markdown() {
	return {
		name: 'markdown',
		async load(id: string) {
			if (/\.(md)$/.test(id)) {
				const file = await unified()
					.use(remarkParse)
					.use(remarkHtml)
					.use(remarkFrontmatter, ['yaml'])
					.use(() => (_, file) => {
						matter(file)
					})
					.process(await read(id))

				return `
        export const html = ${JSON.stringify(file.value)}
        export const matter = ${JSON.stringify(file.data.matter)}
        `
			}
		}
	}
}

const config: UserConfig = {
	plugins: [markdown(), sveltekit()],
	resolve: {
		alias: {
			$lib: path.resolve('./src/lib'),
			$contents: path.resolve('./contents')
		}
	}
}

export default config
