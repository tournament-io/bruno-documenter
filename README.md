# Bruno Documenter

Generate beautiful static API documentation pages from a [Bruno](https://www.usebruno.com/) OpenCollection YAML file.

Fork of [insomnia-documenter](https://github.com/jozsefsallai/insomnia-documenter) (Svelte + Rollup). The Insomnia v4 JSON pipeline was replaced with a Bruno OpenCollection 1.0 YAML parser. The design was customized to match the [Kickertool](https://kickertool.com) / tournament.app look — Roboto, Roboto Condensed, and Roboto Mono served locally (no Google Fonts, no CDNs — GDPR-safe).

**Live example:** https://docs.api.tournament.io/

## Table of Contents

- [Requirements](#requirements)
- [Getting Started](#getting-started)
  - [Options](#options)
- [How it Works](#how-it-works)
- [Authoring the Bruno YAML](#authoring-the-bruno-yaml)
- [Updating the API](#updating-the-api)
- [Custom Root Paths](#custom-root-paths)
- [Running the Page Locally](#running-the-page-locally)
- [Development](#development)
- [License](#license)

## Requirements

* Node.js 16+
* A Bruno OpenCollection YAML file (typically `bruno.yml`)

## Getting Started

```sh
node bin/generate.js \
  --config /path/to/bruno.yml \
  --logo /path/to/logo.png \
  --favicon /path/to/favicon.ico \
  --output /path/to/output/dir
```

The output directory will contain `index.html`, `bundle.js`, `bundle.css`, the `static/` font assets, `bruno.yml`, `logo.png`, and `favicon.ico` — a self-contained static site ready to deploy (Cloudflare Pages, GitHub Pages, S3, etc.).

### Options

```
Options:
  -c, --config <location>     Location of the Bruno OpenCollection YAML (bruno.yml).
  -l, --logo <location>       Project logo location (48x48px PNG).
  -f, --favicon <location>    Project favicon location (ICO).
  -o, --output <location>     Where to save the files (defaults to current working directory).
  -d, --data-root <docs-root> Docs root for the API documentation (see "Custom Root Paths").
  -h, --help                  Output usage information.
```

Both relative and absolute paths are accepted for every flag.

## How it Works

`src/lib/bruno/parseBruno.js` reads the Bruno OpenCollection YAML in the browser (via `js-yaml`) and translates it to the internal model used by the renderer:

| Internal field | Bruno source |
|---|---|
| `workspace.name` | `info.name` |
| `workspace.description` | top-level `docs.content` (rendered under the H1 as the API introduction) |
| `environments[]` | `config.environments[]` |
| `groups[]` (recursive folders) | items where `info.type === 'folder'`; folder docs from `docs.content` |
| `requests[]` | items where `info.type === 'http'` |
| `headers[]`, `params[]` (query + path), `body` | `http.headers`, `http.params`, `http.body` |
| `description` + `exampleResponses[]` | `docs` block — example responses extracted from ` ```response:STATUS ` fenced blocks |
| Sort order | `info.seq` (ascending; missing → end) |

`{{var}}` interpolation in URLs, headers, params, and bodies uses the selected environment, identical to Bruno's runtime behavior.

## Authoring the Bruno YAML

* Endpoint docs live in the `docs:` block (string or `{content, type}`). Markdown is supported, including `<aside class="notice|warning|success">` callouts.
* Example responses are fenced code blocks tagged with status:

  ````markdown
  ```response:200
  { "id": "..." }
  ```

  ```response:403
  { "error": "Forbidden" }
  ```
  ````

  They are color-coded by status class (`1xx`, `2xx`, `3xx`, `4xx`, `5xx`).
* Top-level `docs.content` becomes the API introduction shown under the H1.
* Folder `docs.content` is rendered above the folder's endpoint list.
* `info.seq` controls ordering of folders and endpoints.

## Updating the API

Re-run `bin/generate.js` after editing the YAML. The output is fully static — copy or rsync it to your host.

## Custom Root Paths

To host the docs under a subpath, pass `-d /your/subpath` to the CLI, or hand-edit the generated `index.html`:

```html
<div id="app" data-root="/your/subpath"></div>
```

No trailing slash. The app will fetch `bruno.yml` from that path. Logo and favicon are still loaded relative to `index.html`.

## Running the Page Locally

`file://` will not work — `fetch()` needs HTTP. Use any static server:

```sh
python3 -m http.server -d <output-dir> 8000
# or
npx sirv <output-dir> --single
```

## Development

```sh
git clone <this-repo>
cd bruno-documenter
npm install
```

Bring in a demo YAML (the bundled one points at `public/bruno.yml`):

```sh
cp docs/bruno.yml public/bruno.yml
```

Production build:

```sh
npm run build
```

Watch + dev server:

```sh
npm run dev
```

The frontend is Svelte 3; bundling via Rollup; styles via Dart Sass.

## License

MIT. Inherits from the upstream insomnia-documenter project.

*Not affiliated with Bruno, Kong, or Insomnia.*
