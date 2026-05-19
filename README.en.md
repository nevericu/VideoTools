# VideoTools

A browser-only video processing tool powered by ffmpeg.wasm. No server required.

[中文](README.md)

## Features

- **Format Conversion** — Convert between MP4, WebM, MKV, AVI, MOV, and GIF
- **GIF Export** — Frame rate, output width, palette colors, dither algorithm (Bayer / Sierra2_4a / Floyd-Steinberg / Heckbert), loop mode (infinite / play once / bounce ping-pong / custom count)
- **Video Compression** — Three quality presets (high / medium / low) via CRF
- **Video Trimming** — Visual dual-handle timeline selector; all operations auto-apply to the selected range
- **Video Preview** — Instant preview after file selection with playhead and timeline
- **Multilingual** — 🇨🇳 Chinese / 🇬🇧 English, auto-detects browser language, globe icon for switching
- **Offline Cache** — ffmpeg.wasm engine (~30 MB) cached in browser after first load for instant startup
- **Privacy** — All processing happens locally in the browser; files never leave your device
- **Modern UI** — Dark theme, glassmorphism cards, cyan-blue gradient accents, glow effects

## Quick Start

### Local Development

Serve the `src/` directory with any static file server:

```bash
npx serve src                          # Node.js (recommended, zero install)
npx http-server src -p 8080            # Node.js alt
python3 -m http.server 8080 -d src     # Python
php -S localhost:8080 -t src           # PHP
```

Or use the **Live Server** extension in VS Code — right-click `src/index.html` → Open with Live Server.

## Deploy

Pure static project — no build step required. Just deploy the `src/` directory.

### GitHub Pages

The repo includes `.github/workflows/deploy.yml`. Push to `main` to auto-deploy.

Enable manually: Settings → Pages → Source → **GitHub Actions**.

### Cloudflare Pages

1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com/) → Pages → Create a project
2. Connect your GitHub repository
3. Build settings:
   - **Build command**: leave empty
   - **Build output directory**: `src`
4. Save and deploy

### Vercel

The repo includes a `vercel.json` config.

1. Go to [Vercel](https://vercel.com/) → Import Git Repository
2. Select the repo, choose framework **Other**
3. Config is auto-detected — deploy directly

Or via CLI:

```bash
npx vercel --prod
```

## Tech Stack

- **Video Processing**: [ffmpeg.wasm](https://ffmpegwasm.netlify.app/) v0.12.x (single-threaded)
- **Frontend**: Vanilla HTML/JS (ES modules) + [PicoCSS](https://picocss.com/) v2 (dark theme)
- **Caching**: Cache API for persisting the wasm engine
- **Hosting**: GitHub Pages / Cloudflare Pages / Vercel

## Limitations

- Recommended file size under 500 MB; large files may cause browser memory issues
- Browser-side processing is slower than native ffmpeg
- One operation at a time
- Requires a modern browser with WebAssembly and ES modules support

## Project Structure

```
├── src/
│   ├── index.html        # Entry point with import map
│   ├── app.js            # ES module: ffmpeg.wasm core logic
│   ├── i18n.js           # zh/en translations
│   └── style.css         # Dark theme + glassmorphism + gradient styles
├── .github/workflows/
│   └── deploy.yml        # GitHub Pages auto-deploy
└── vercel.json           # Vercel deploy config
```
