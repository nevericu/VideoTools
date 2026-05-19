const translations = {
    zh: {
        'site.title': 'VideoTools',
        'site.subtitle': '在浏览器中处理视频，无需服务器。',
        'wasm.loading': '正在加载 ffmpeg 引擎...',
        'wasm.ready': 'ffmpeg 引擎已就绪',
        'wasm.failed': 'ffmpeg 引擎加载失败',
        'upload.title': '选择视频',
        'upload.dropzone': '拖放视频文件到此处，或点击选择',
        'upload.ready': '文件已就绪',
        'preview.title': '视频预览',
        'preview.selected': '已选片段',
        'fileinfo.filename': '文件名：',
        'fileinfo.size': '大小：',
        'fileinfo.duration': '时长：',
        'fileinfo.resolution': '分辨率：',
        'ops.title': '操作',
        'ops.convert': '格式转换',
        'ops.convert.label': '目标格式',
        'ops.convert.btn': '转换',
        'ops.compress': '压缩',
        'ops.compress.label': '质量',
        'ops.compress.high': '高质量 (CRF 23)',
        'ops.compress.medium': '中等质量 (CRF 28)',
        'ops.compress.low': '低质量 (CRF 32)',
        'ops.compress.btn': '压缩',
        'ops.trim': '裁剪',
        'ops.trim.start': '开始时间（秒）',
        'ops.trim.end': '结束时间（秒）',
        'ops.trim.btn': '裁剪',
        'gif.fps': '帧率 (FPS)',
        'gif.width': '输出宽度',
        'gif.width.original': '原始尺寸',
        'gif.colors': '调色板颜色数',
        'gif.dither': '抖动算法',
        'gif.dither.none': '无',
        'gif.loop': '循环方式',
        'gif.loop.infinite': '无限循环',
        'gif.loop.once': '播放一次',
        'gif.loop.bounce': '往复播放',
        'gif.loop.custom': '自定义次数',
        'gif.loop.count': '循环次数',
        'ops.hint.full': '当前操作范围：整个视频',
        'ops.hint.range': '当前操作范围：{start} - {end}',
        'tasks.title': '任务列表',
        'tasks.col.operation': '操作',
        'tasks.col.file': '文件',
        'tasks.col.status': '状态',
        'tasks.col.progress': '进度',
        'tasks.col.action': '操作',
        'tasks.download': '下载',
        'tasks.unknown_error': '未知错误',
        'tasks.status.pending': '等待中',
        'tasks.status.processing': '处理中',
        'tasks.status.completed': '已完成',
        'tasks.status.failed': '失败',
        'tasks.kind.convert': '转换',
        'tasks.kind.compress': '压缩',
        'tasks.kind.trim': '裁剪',
        'footer.notice': '本工具无需后端，所有数据仅存放在您的浏览器本地。如不放心，亦可自行部署。首次加载引擎可能较慢，请耐心等待。',
    },
    en: {
        'site.title': 'VideoTools',
        'site.subtitle': 'Process videos in your browser. No server required.',
        'wasm.loading': 'Loading ffmpeg engine...',
        'wasm.ready': 'ffmpeg engine ready',
        'wasm.failed': 'Failed to load ffmpeg engine',
        'upload.title': 'Select Video',
        'upload.dropzone': 'Drag & drop a video file here, or click to select',
        'upload.ready': 'File ready',
        'preview.title': 'Video Preview',
        'preview.selected': 'Selected range',
        'fileinfo.filename': 'Filename:',
        'fileinfo.size': 'Size:',
        'fileinfo.duration': 'Duration:',
        'fileinfo.resolution': 'Resolution:',
        'ops.title': 'Operations',
        'ops.convert': 'Convert',
        'ops.convert.label': 'Target Format',
        'ops.convert.btn': 'Convert',
        'ops.compress': 'Compress',
        'ops.compress.label': 'Quality',
        'ops.compress.high': 'High (CRF 23)',
        'ops.compress.medium': 'Medium (CRF 28)',
        'ops.compress.low': 'Low (CRF 32)',
        'ops.compress.btn': 'Compress',
        'ops.trim': 'Trim',
        'ops.trim.start': 'Start (seconds)',
        'ops.trim.end': 'End (seconds)',
        'ops.trim.btn': 'Trim',
        'gif.fps': 'Frame Rate (FPS)',
        'gif.width': 'Output Width',
        'gif.width.original': 'Original',
        'gif.colors': 'Palette Colors',
        'gif.dither': 'Dither Algorithm',
        'gif.dither.none': 'None',
        'gif.loop': 'Loop Mode',
        'gif.loop.infinite': 'Infinite',
        'gif.loop.once': 'Play Once',
        'gif.loop.bounce': 'Bounce (Ping-Pong)',
        'gif.loop.custom': 'Custom Count',
        'gif.loop.count': 'Loop Count',
        'ops.hint.full': 'Operation scope: entire video',
        'ops.hint.range': 'Operation scope: {start} - {end}',
        'tasks.title': 'Tasks',
        'tasks.col.operation': 'Operation',
        'tasks.col.file': 'File',
        'tasks.col.status': 'Status',
        'tasks.col.progress': 'Progress',
        'tasks.col.action': 'Action',
        'tasks.download': 'Download',
        'tasks.unknown_error': 'Unknown error',
        'tasks.status.pending': 'Pending',
        'tasks.status.processing': 'Processing',
        'tasks.status.completed': 'Completed',
        'tasks.status.failed': 'Failed',
        'tasks.kind.convert': 'Convert',
        'tasks.kind.compress': 'Compress',
        'tasks.kind.trim': 'Trim',
        'footer.notice': 'No backend required — all data stays in your browser. You can also self-host if preferred. The engine may take a moment to load on first visit.',
    },
};

let currentLang = localStorage.getItem('lang') || (navigator.language.startsWith('zh') ? 'zh' : 'en');

function t(key) {
    return (translations[currentLang] && translations[currentLang][key]) || translations['en'][key] || key;
}

function applyI18n() {
    document.querySelectorAll('[data-i18n]').forEach((el) => {
        el.textContent = t(el.dataset.i18n);
    });
    document.querySelectorAll('[data-i18n-placeholder]').forEach((el) => {
        el.placeholder = t(el.dataset.i18nPlaceholder);
    });
    document.documentElement.lang = currentLang === 'zh' ? 'zh-CN' : 'en';

    const langSelect = document.getElementById('lang-select');
    if (langSelect) langSelect.value = currentLang;
}

function setLang(lang) {
    currentLang = lang;
    localStorage.setItem('lang', lang);
    applyI18n();
    if (typeof onLangChange === 'function') {
        onLangChange();
    }
}
