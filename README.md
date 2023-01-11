# Project NL App

This repository contains the source code for the application presenting the results of the fall 2022 Project NL design-research project of the [Berlage Center for Advanced Studies in Architecture and Urban Design](https://theberlage.nl/) of TU Delft.

The application showcases the possiblities of [IIIF](https://iiif.io) and [Allmaps](https://allmaps.org). See also [this repository](https://github.com/theberlage/allmaps-workshop) outlining the introductory workshop in the beginning of the semester.

## File structure

The following file structure is used for the content (general introduction and individual projects):

```yml
- contents
  - about
    - about.md
    # Markdown file containg a general introduction to the app
  - projects
    - [project-title]
    # Each project has a dedicated folder
      - annotations
      # The annotation folder contains all the georeferencing annotations used for the project
      - slides
      # Folder with a collection of markdown files used for the slides
    projects.yml
    # Yaml file with list of projects (main title and a slug, which corresponds to the folder name)
  - sheet-index
    sheet-index.json
    # Geojson file containing the sheet index used to navigate the projects
```

## File types

**Markdown with YAML frontmatter**

Markdown is a markup language to add formatting to plain text. [See this guide for more information](https://www.markdownguide.org/basic-syntax/). Each markdown file starts with a metadata block (also called *frontmatter*) in the YAML format, set between `---`.

Each slide contains the following frontmatter:

```yaml
meta: # Slide metadata
  heading: Subtitle # Slide heading
  period: [1900, 1930] # Array denoting period
viewer: # Viewer settings
  bbox: [4.651103, 51.78665, 4.768242, 51.832353] # Viewer bounding box as can be exported from Placemark (Export > BBOX)
  rotation: 180 # Degrees
allmaps: # List of maps
  - label: Map # Label for map
    attribution: # Optional attribution
      name: Regionaal Archief Dordrecht
      url: https://www.regionaalarchiefdordrecht.nl
    annotation: annotation-01.json # Georef annotation filename in the project's annotations/ folder
    opacity: 50 # Setting from 0 to 100 (optional)
    mask: rgb(255,0,0) # Mask based on color, RGB value (optional)
    colorize: rgb(255,0,0) # Colorize image after masking, RGB value (optional)
```

**YAML**

YAML is a 'human friendly' format to store data, [here's a tutorial](https://spacelift.io/blog/yaml).

**GeoJSON**

JSON format to store geographic information. It can be exported from Placemark.

**Georeferencing Annotations**

JSON web annotation used by Allmaps to store the mask and control points of georeferenced maps available with IIIF.

## Development

This app uses [SvelteKit](https://kit.svelte.dev).

Requirements:

- Node v18.12.1

For development using `pnpm`:

`pnpm i` to install dependencies

`pnpm run dev` to start development server.

Production build:

`pnpm run build`
