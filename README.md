# VideoTools

纯浏览器视频处理工具，基于 ffmpeg.wasm，无需后端服务器。

A browser-only video processing tool powered by ffmpeg.wasm. No server required.

## 功能 / Features

- **格式转换** — MP4、WebM、MKV、AVI、MOV、GIF 互转
- **GIF 转换** — 帧率、输出宽度、调色板颜色数、抖动算法（Bayer / Sierra2_4a / Floyd-Steinberg / Heckbert）、循环方式（无限循环 / 播放一次 / 往复播放 / 自定义次数）
- **视频压缩** — 三档质量（高 / 中 / 低），基于 CRF 参数
- **视频裁剪** — 可视化时间线双手柄选取片段，所有操作自动应用选区范围
- **视频预览** — 选择文件后即时预览，带播放头和时间线
- **多语言** — 🇨🇳 中文 / 🇬🇧 English，跟随浏览器语言自动切换，地球图标引导
- **离线缓存** — ffmpeg.wasm 引擎（~30MB）首次加载后缓存到浏览器，后续秒开
- **隐私安全** — 所有处理在浏览器本地完成，文件不会离开你的设备
- **现代 UI** — 深色主题、毛玻璃卡片、青蓝渐变色调、发光交互效果

## 快速开始 / Quick Start

### 本地开发

用任意静态文件服务器托管 `src/` 目录，以下方式任选其一：

```bash
npx serve src                          # Node.js（推荐，零安装）
npx http-server src -p 8080            # Node.js 备选
python3 -m http.server 8080 -d src     # Python
php -S localhost:8080 -t src           # PHP
```

或使用 VS Code 的 **Live Server** 扩展，右键 `src/index.html` → Open with Live Server。

## 部署 / Deploy

纯静态项目，无需构建步骤，直接部署 `src/` 目录即可。

### GitHub Pages

仓库已包含 `.github/workflows/deploy.yml`，推送到 `main` 分支自动部署。

手动开启：Settings → Pages → Source 选择 **GitHub Actions**。

### Cloudflare Pages

1. 登录 [Cloudflare Dashboard](https://dash.cloudflare.com/) → Pages → Create a project
2. 连接 GitHub 仓库
3. 构建设置：
   - **Build command**：留空
   - **Build output directory**：`src`
4. 保存并部署

### Vercel

仓库已包含 `vercel.json` 配置。

1. 登录 [Vercel](https://vercel.com/) → Import Git Repository
2. 选择仓库，框架选择 **Other**
3. 自动识别配置，直接部署

或使用 CLI：

```bash
npx vercel --prod
```

## 技术栈 / Tech Stack

- **视频处理**: [ffmpeg.wasm](https://ffmpegwasm.netlify.app/) v0.12.x（单线程模式）
- **前端**: 原生 HTML/JS（ES modules）+ [PicoCSS](https://picocss.com/) v2（深色主题）
- **缓存**: Cache API 持久化 wasm 引擎
- **部署**: GitHub Pages / Cloudflare Pages / Vercel

## 限制 / Limitations

- 建议处理文件不超过 500MB，大文件可能导致浏览器内存不足
- 浏览器端处理速度比原生 ffmpeg 慢
- 同一时间只能执行一个操作
- 需要现代浏览器支持 WebAssembly 和 ES modules

## 项目结构 / Project Structure

```
├── src/
│   ├── index.html        # 入口，含 import map
│   ├── app.js            # ES module：ffmpeg.wasm 核心逻辑
│   ├── i18n.js           # 中英文翻译
│   └── style.css         # 深色主题 + 毛玻璃 + 渐变样式
├── .github/workflows/
│   └── deploy.yml        # GitHub Pages 自动部署
└── vercel.json           # Vercel 部署配置
```
