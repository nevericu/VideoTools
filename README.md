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

### 直接使用

用任意静态文件服务器托管 `frontend/` 目录：

```bash
python3 -m http.server 8080 -d frontend
```

访问 http://localhost:8080

### Docker

```bash
docker compose up --build
```

访问 http://localhost:8080

## 技术栈 / Tech Stack

- **视频处理**: [ffmpeg.wasm](https://ffmpegwasm.netlify.app/) v0.12.x（单线程模式）
- **前端**: 原生 HTML/JS（ES modules）+ [PicoCSS](https://picocss.com/) v2（深色主题）
- **缓存**: Cache API 持久化 wasm 引擎
- **部署**: 任意静态文件服务器 / nginx (Docker)

## 限制 / Limitations

- 建议处理文件不超过 500MB，大文件可能导致浏览器内存不足
- 浏览器端处理速度比原生 ffmpeg 慢
- 同一时间只能执行一个操作
- 需要现代浏览器支持 WebAssembly 和 ES modules

## 项目结构 / Project Structure

```
├── frontend/
│   ├── index.html    # 入口，含 import map
│   ├── app.js        # ES module：ffmpeg.wasm 核心逻辑
│   ├── i18n.js       # 中英文翻译
│   └── style.css     # 深色主题 + 毛玻璃 + 渐变样式
├── Dockerfile        # nginx 静态文件服务
└── docker-compose.yml
```
