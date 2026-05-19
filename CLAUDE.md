# VideoTools

Pure frontend video processing tool using ffmpeg.wasm. No backend, no build step.

## Run

```bash
python3 -m http.server 8080 -d frontend    # Local dev
docker compose up --build                   # Docker (nginx on port 8080)
```

## Project Structure

- `frontend/index.html` — Entry point, import map for ffmpeg.wasm CDN
- `frontend/app.js` — ES module: ffmpeg.wasm init, file handling, convert/compress/trim
- `frontend/i18n.js` — Classic script: zh/en translations, `t()`, `setLang()`, `applyI18n()`
- `frontend/style.css` — Custom styles on top of PicoCSS

## Key Conventions

- `i18n.js` is a classic script (globals); `app.js` is an ES module — interop via `window.onLangChange`
- ffmpeg.wasm runs single-threaded (no COOP/COEP headers required)
- All processing happens in browser memory: File → writeFile → exec → readFile → Blob download
- One operation at a time (`isProcessing` lock + `setButtonsBusy`)
- Translations use `data-i18n` attributes on HTML elements
