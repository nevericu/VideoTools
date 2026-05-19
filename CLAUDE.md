# VideoTools

Pure src video processing tool using ffmpeg.wasm. No backend, no build step.

## Run

```bash
npx serve src                          # Node.js (recommended)
npx http-server src -p 8080            # Node.js alt
python3 -m http.server 8080 -d src     # Python
php -S localhost:8080 -t src           # PHP
```

## Deploy

- GitHub Pages: push to `main` triggers `.github/workflows/deploy.yml`
- Cloudflare Pages: set build output to `src`, no build command
- Vercel: `vercel.json` sets `outputDirectory` to `src`

## Project Structure

- `src/index.html` — Entry point, import map for ffmpeg.wasm CDN
- `src/app.js` — ES module: ffmpeg.wasm init, file handling, convert/compress/trim
- `src/i18n.js` — Classic script: zh/en translations, `t()`, `setLang()`, `applyI18n()`
- `src/style.css` — Custom styles on top of PicoCSS

## Key Conventions

- `i18n.js` is a classic script (globals); `app.js` is an ES module — interop via `window.onLangChange`
- ffmpeg.wasm runs single-threaded (no COOP/COEP headers required)
- All processing happens in browser memory: File → writeFile → exec → readFile → Blob download
- One operation at a time (`isProcessing` lock + `setButtonsBusy`)
- Translations use `data-i18n` attributes on HTML elements
