import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile } from '@ffmpeg/util';

const CACHE_NAME = 'ffmpeg-core-v0.12.6';

async function cachedBlobURL(url, type) {
    const cache = await caches.open(CACHE_NAME);
    let resp = await cache.match(url);
    if (!resp) {
        resp = await fetch(url);
        await cache.put(url, resp.clone());
    }
    const blob = new Blob([await resp.arrayBuffer()], { type });
    return URL.createObjectURL(blob);
}

let ffmpeg = null;
let ffmpegReady = false;
let currentFile = null;
let currentFilename = null;
let videoDuration = 0;
let selectionStart = 0;
let selectionEnd = 0;
let tasks = [];
let taskIdCounter = 0;
let isProcessing = false;

// --- i18n callback (exposed to global for i18n.js) ---

function onLangChange() {
    renderTasks();
    updateSelectionHint();
}
window.onLangChange = onLangChange;

// --- Init ---

document.addEventListener('DOMContentLoaded', async () => {
    applyI18n();
    initTimeline();
    initGifOptions();
    initEventListeners();
    await initFFmpeg();
});

async function initFFmpeg() {
    const loadingEl = document.getElementById('wasm-loading');
    loadingEl.hidden = false;

    try {
        ffmpeg = new FFmpeg();
        ffmpeg.on('progress', ({ progress }) => {
            updateCurrentTaskProgress(Math.max(0, Math.min(1, progress)));
        });
        const workerResponse = await fetch('https://unpkg.com/@ffmpeg/ffmpeg@0.12.15/dist/esm/worker.js');
        let workerSource = await workerResponse.text();
        const [constResp, errorsResp] = await Promise.all([
            fetch('https://unpkg.com/@ffmpeg/ffmpeg@0.12.15/dist/esm/const.js'),
            fetch('https://unpkg.com/@ffmpeg/ffmpeg@0.12.15/dist/esm/errors.js'),
        ]);
        const constSource = (await constResp.text()).replace(/export /g, '');
        const errorsSource = (await errorsResp.text()).replace(/export /g, '');
        workerSource = workerSource
            .replace(/import\s*\{[^}]*\}\s*from\s*["']\.\/const\.js["'];?/, constSource)
            .replace(/import\s*\{[^}]*\}\s*from\s*["']\.\/errors\.js["'];?/, errorsSource);
        const classWorkerURL = URL.createObjectURL(new Blob([workerSource], { type: 'text/javascript' }));

        const baseURL = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/esm';
        await ffmpeg.load({
            coreURL: await cachedBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
            wasmURL: await cachedBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm'),
            classWorkerURL,
        });
        ffmpegReady = true;
        loadingEl.hidden = true;
        enableButtons();
    } catch (err) {
        loadingEl.textContent = t('wasm.failed');
        loadingEl.classList.add('error');
        console.error('Failed to load ffmpeg.wasm:', err);
    }
}

function enableButtons() {
    document.getElementById('btn-convert').disabled = false;
    document.getElementById('btn-compress').disabled = false;
    document.getElementById('btn-trim').disabled = false;
}

// --- Event Listeners ---

function initEventListeners() {
    const dropZone = document.getElementById('drop-zone');
    const fileInput = document.getElementById('file-input');

    dropZone.addEventListener('click', () => fileInput.click());
    dropZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        dropZone.classList.add('drag-over');
    });
    dropZone.addEventListener('dragleave', () => dropZone.classList.remove('drag-over'));
    dropZone.addEventListener('drop', (e) => {
        e.preventDefault();
        dropZone.classList.remove('drag-over');
        if (e.dataTransfer.files.length > 0) selectFile(e.dataTransfer.files[0]);
    });
    fileInput.addEventListener('change', () => {
        if (fileInput.files.length > 0) selectFile(fileInput.files[0]);
    });

    document.getElementById('btn-convert').addEventListener('click', handleConvert);
    document.getElementById('btn-compress').addEventListener('click', handleCompress);
    document.getElementById('btn-trim').addEventListener('click', handleTrim);
}

// --- File Selection (replaces upload) ---

function selectFile(file) {
    currentFile = file;
    currentFilename = file.name;

    const objectUrl = URL.createObjectURL(file);
    setupVideoPreview(objectUrl);

    const progressDiv = document.getElementById('upload-progress');
    progressDiv.hidden = false;
    document.getElementById('upload-bar').value = 100;
    document.getElementById('upload-status').textContent = t('upload.ready');

    document.getElementById('info-filename').textContent = file.name;
    document.getElementById('info-size').textContent = formatBytes(file.size);
}

function setupVideoPreview(src) {
    const player = document.getElementById('video-player');
    player.src = src;
    document.getElementById('preview-section').hidden = false;

    player.addEventListener('loadedmetadata', () => {
        videoDuration = player.duration;
        selectionStart = 0;
        selectionEnd = videoDuration;
        document.getElementById('tl-duration').textContent = formatTime(videoDuration);
        document.getElementById('trim-start').value = '0';
        document.getElementById('trim-end').value = videoDuration.toFixed(1);
        document.getElementById('trim-end').max = videoDuration.toFixed(1);
        document.getElementById('trim-start').max = videoDuration.toFixed(1);
        document.getElementById('info-duration').textContent = `${videoDuration.toFixed(1)}s`;
        document.getElementById('info-resolution').textContent =
            player.videoWidth && player.videoHeight
                ? `${player.videoWidth}x${player.videoHeight}`
                : '-';
        document.getElementById('operations').hidden = false;
        updateTimeline();
        updateSelectionHint();
    }, { once: true });

    player.addEventListener('timeupdate', () => {
        updatePlayhead(player.currentTime);
        if (!player.paused && player.currentTime >= selectionEnd) {
            player.pause();
        }
    });
}

// --- Timeline Range Selector ---

let dragging = null;

function initTimeline() {
    const track = document.getElementById('timeline-track');
    const handleStart = document.getElementById('handle-start');
    const handleEnd = document.getElementById('handle-end');

    handleStart.addEventListener('pointerdown', (e) => {
        e.preventDefault();
        e.stopPropagation();
        dragging = 'start';
        handleStart.classList.add('dragging');
        handleStart.setPointerCapture(e.pointerId);
    });

    handleEnd.addEventListener('pointerdown', (e) => {
        e.preventDefault();
        e.stopPropagation();
        dragging = 'end';
        handleEnd.classList.add('dragging');
        handleEnd.setPointerCapture(e.pointerId);
    });

    document.addEventListener('pointermove', (e) => {
        if (!dragging || videoDuration <= 0) return;
        const rect = track.getBoundingClientRect();
        const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
        const time = ratio * videoDuration;

        if (dragging === 'start') {
            selectionStart = Math.max(0, Math.min(time, selectionEnd - 0.1));
        } else {
            selectionEnd = Math.min(videoDuration, Math.max(time, selectionStart + 0.1));
        }
        syncFromTimeline();
    });

    document.addEventListener('pointerup', () => {
        if (dragging) {
            document.getElementById('handle-start').classList.remove('dragging');
            document.getElementById('handle-end').classList.remove('dragging');
            dragging = null;
        }
    });

    track.addEventListener('click', (e) => {
        if (videoDuration <= 0) return;
        const rect = track.getBoundingClientRect();
        const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
        document.getElementById('video-player').currentTime = ratio * videoDuration;
    });

    document.getElementById('trim-start').addEventListener('input', () => {
        const val = parseFloat(document.getElementById('trim-start').value) || 0;
        selectionStart = Math.max(0, Math.min(val, selectionEnd - 0.1));
        updateTimeline();
        updateSelectionHint();
    });

    document.getElementById('trim-end').addEventListener('input', () => {
        const val = parseFloat(document.getElementById('trim-end').value) || 0;
        selectionEnd = Math.min(videoDuration, Math.max(val, selectionStart + 0.1));
        updateTimeline();
        updateSelectionHint();
    });
}

function syncFromTimeline() {
    document.getElementById('trim-start').value = selectionStart.toFixed(1);
    document.getElementById('trim-end').value = selectionEnd.toFixed(1);
    updateTimeline();
    updateSelectionHint();
}

function updateTimeline() {
    if (videoDuration <= 0) return;
    const startPct = (selectionStart / videoDuration) * 100;
    const endPct = (selectionEnd / videoDuration) * 100;

    document.getElementById('handle-start').style.left = `${startPct}%`;
    document.getElementById('handle-end').style.left = `${endPct}%`;

    const selected = document.getElementById('timeline-selected');
    selected.style.left = `${startPct}%`;
    selected.style.width = `${endPct - startPct}%`;

    document.getElementById('tl-start-label').textContent = formatTime(selectionStart);
    document.getElementById('tl-end-label').textContent = formatTime(selectionEnd);
}

function updatePlayhead(currentTime) {
    if (videoDuration <= 0) return;
    const pct = (currentTime / videoDuration) * 100;
    document.getElementById('timeline-playhead').style.left = `${pct}%`;
}

function updateSelectionHint() {
    const hint = document.getElementById('selection-hint');
    if (!hint || videoDuration <= 0) return;

    const isFullRange = selectionStart <= 0.05 && selectionEnd >= videoDuration - 0.05;
    if (isFullRange) {
        hint.textContent = t('ops.hint.full');
    } else {
        hint.textContent = t('ops.hint.range')
            .replace('{start}', formatTime(selectionStart))
            .replace('{end}', formatTime(selectionEnd));
    }
}

// --- GIF Options ---

function initGifOptions() {
    const formatSelect = document.getElementById('target-format');
    const gifPanel = document.getElementById('gif-options');
    const loopSelect = document.getElementById('gif-loop');
    const loopCountWrap = document.getElementById('gif-loop-count-wrap');

    formatSelect.addEventListener('change', () => {
        gifPanel.hidden = formatSelect.value !== 'gif';
    });

    loopSelect.addEventListener('change', () => {
        loopCountWrap.hidden = loopSelect.value !== 'custom';
    });
}

function buildGifArgs(inputName, outputName) {
    const fps = document.getElementById('gif-fps').value;
    const widthVal = document.getElementById('gif-width').value;
    const maxColors = document.getElementById('gif-colors').value;
    const dither = document.getElementById('gif-dither').value;

    const loopMode = document.getElementById('gif-loop').value;
    let loopVal = '0';
    if (loopMode === 'once') loopVal = '-1';
    else if (loopMode === 'custom') loopVal = document.getElementById('gif-loop-count').value || '3';

    let trimPart = `trim=start=${selectionStart.toFixed(3)}:end=${selectionEnd.toFixed(3)},setpts=PTS-STARTPTS,`;

    let scalePart = '';
    if (widthVal) scalePart = `scale=${widthVal}:-1:flags=lanczos,`;

    let bouncePart = '';
    if (loopMode === 'bounce') bouncePart = 'split[fwd][rev];[rev]reverse[r];[fwd][r]concat=n=2:v=1,';

    const filter = `${trimPart}fps=${fps},${scalePart}${bouncePart}split[s0][s1];[s0]palettegen=max_colors=${maxColors}[p];[s1][p]paletteuse=dither=${dither}`;

    return ['-i', inputName, '-vf', filter, '-loop', loopVal, '-an', outputName];
}

// --- Codec Map ---

const CODECS = {
    mp4:  { video: 'libx264',    audio: 'aac' },
    webm: { video: 'libvpx-vp9', audio: 'libopus' },
    mkv:  { video: 'libx264',    audio: 'aac' },
    avi:  { video: 'mpeg4',      audio: 'aac' },
    mov:  { video: 'libx264',    audio: 'aac' },
};

const MIME_TYPES = {
    mp4: 'video/mp4', webm: 'video/webm', mkv: 'video/x-matroska',
    avi: 'video/x-msvideo', mov: 'video/quicktime', gif: 'image/gif',
};

// --- Operations (ffmpeg.wasm) ---

async function handleConvert() {
    if (!currentFile || !ffmpegReady || isProcessing) return;

    const format = document.getElementById('target-format').value;
    const inputExt = getExtension(currentFilename);
    const inputName = `input.${inputExt}`;
    const outputName = `output.${format}`;

    const task = createTask('convert', currentFilename, format);

    try {
        isProcessing = true;
        setButtonsBusy(true);
        await ffmpeg.writeFile(inputName, await fetchFile(currentFile));

        let args;
        if (format === 'gif') {
            args = buildGifArgs(inputName, outputName);
        } else {
            const codecs = CODECS[format] || CODECS.mp4;
            args = ['-i', inputName, '-ss', selectionStart.toFixed(3), '-to', selectionEnd.toFixed(3), '-c:v', codecs.video, '-c:a', codecs.audio, outputName];
        }

        updateTaskStatus(task.id, 'processing');
        await ffmpeg.exec(args);

        const data = await ffmpeg.readFile(outputName);
        task.outputBlob = new Blob([data.buffer], { type: MIME_TYPES[format] || 'application/octet-stream' });
        updateTaskStatus(task.id, 'completed', 1.0);

        await ffmpeg.deleteFile(inputName).catch(() => {});
        await ffmpeg.deleteFile(outputName).catch(() => {});
    } catch (err) {
        updateTaskStatus(task.id, 'failed', 0, err.message);
    } finally {
        isProcessing = false;
        setButtonsBusy(false);
    }
}

async function handleCompress() {
    if (!currentFile || !ffmpegReady || isProcessing) return;

    const quality = document.getElementById('quality').value;
    const qualityMap = {
        high:   { crf: '23', preset: 'slow' },
        medium: { crf: '28', preset: 'medium' },
        low:    { crf: '32', preset: 'faster' },
    };
    const { crf, preset } = qualityMap[quality];

    const inputExt = getExtension(currentFilename);
    const inputName = `input.${inputExt}`;
    const outputName = 'output.mp4';

    const task = createTask('compress', currentFilename, 'mp4');

    try {
        isProcessing = true;
        setButtonsBusy(true);
        await ffmpeg.writeFile(inputName, await fetchFile(currentFile));

        updateTaskStatus(task.id, 'processing');
        await ffmpeg.exec(['-i', inputName, '-ss', selectionStart.toFixed(3), '-to', selectionEnd.toFixed(3), '-c:v', 'libx264', '-crf', crf, '-preset', preset, '-c:a', 'aac', outputName]);

        const data = await ffmpeg.readFile(outputName);
        task.outputBlob = new Blob([data.buffer], { type: 'video/mp4' });
        updateTaskStatus(task.id, 'completed', 1.0);

        await ffmpeg.deleteFile(inputName).catch(() => {});
        await ffmpeg.deleteFile(outputName).catch(() => {});
    } catch (err) {
        updateTaskStatus(task.id, 'failed', 0, err.message);
    } finally {
        isProcessing = false;
        setButtonsBusy(false);
    }
}

async function handleTrim() {
    if (!currentFile || !ffmpegReady || isProcessing) return;

    const inputExt = getExtension(currentFilename);
    const inputName = `input.${inputExt}`;
    const outputName = `output.${inputExt}`;

    const task = createTask('trim', currentFilename, inputExt);

    try {
        isProcessing = true;
        setButtonsBusy(true);
        await ffmpeg.writeFile(inputName, await fetchFile(currentFile));

        updateTaskStatus(task.id, 'processing');
        await ffmpeg.exec(['-i', inputName, '-ss', selectionStart.toFixed(3), '-to', selectionEnd.toFixed(3), '-c', 'copy', outputName]);

        const data = await ffmpeg.readFile(outputName);
        task.outputBlob = new Blob([data.buffer], { type: currentFile.type || 'video/mp4' });
        updateTaskStatus(task.id, 'completed', 1.0);

        await ffmpeg.deleteFile(inputName).catch(() => {});
        await ffmpeg.deleteFile(outputName).catch(() => {});
    } catch (err) {
        updateTaskStatus(task.id, 'failed', 0, err.message);
    } finally {
        isProcessing = false;
        setButtonsBusy(false);
    }
}

function setButtonsBusy(busy) {
    const ids = ['btn-convert', 'btn-compress', 'btn-trim'];
    ids.forEach(id => {
        document.getElementById(id).ariaBusy = busy ? 'true' : null;
        document.getElementById(id).disabled = busy;
    });
}

// --- Local Task Management ---

function createTask(kind, filename, outputExt) {
    const task = {
        id: ++taskIdCounter,
        kind,
        status: 'pending',
        input_filename: filename,
        progress: 0,
        created_at: new Date(),
        outputBlob: null,
        outputExt,
        error: null,
    };
    tasks.push(task);
    document.getElementById('tasks-section').hidden = false;
    renderTasks();
    return task;
}

function updateTaskStatus(taskId, status, progress, error) {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;
    task.status = status;
    if (progress !== undefined) task.progress = progress;
    if (error) task.error = error;
    renderTasks();
}

function updateCurrentTaskProgress(progress) {
    const task = tasks.find(t => t.status === 'processing');
    if (task) {
        task.progress = progress;
        renderTasks();
    }
}

function renderTasks() {
    const tbody = document.getElementById('tasks-body');
    tbody.innerHTML = '';

    const sorted = [...tasks].sort((a, b) => b.created_at - a.created_at);

    for (const task of sorted) {
        const tr = document.createElement('tr');
        const kindLabel = t(`tasks.kind.${task.kind}`);
        const statusLabel = t(`tasks.status.${task.status}`);
        const progressPct = Math.round(task.progress * 100);

        let actionHtml = '';
        if (task.status === 'completed' && task.outputBlob) {
            const url = URL.createObjectURL(task.outputBlob);
            const base = task.input_filename.replace(/\.[^.]+$/, '');
            const downloadName = `${base}_${task.kind}.${task.outputExt}`;
            actionHtml = `<a href="${url}" download="${downloadName}" role="button" class="outline">${t('tasks.download')}</a>`;
        } else if (task.status === 'failed') {
            actionHtml = `<small>${task.error || t('tasks.unknown_error')}</small>`;
        }

        tr.innerHTML = `
            <td>${kindLabel}</td>
            <td>${task.input_filename}</td>
            <td>${statusLabel}</td>
            <td><progress max="100" value="${progressPct}"></progress> ${progressPct}%</td>
            <td>${actionHtml}</td>
        `;
        tbody.appendChild(tr);
    }
}

// --- Utils ---

function getExtension(filename) {
    const parts = filename.split('.');
    return parts.length > 1 ? parts.pop().toLowerCase() : 'mp4';
}

function formatTime(secs) {
    if (!secs || secs < 0) return '00:00.0';
    const m = Math.floor(secs / 60);
    const s = secs - m * 60;
    return `${String(m).padStart(2, '0')}:${s.toFixed(1).padStart(4, '0')}`;
}

function formatBytes(bytes) {
    if (!bytes) return '-';
    const units = ['B', 'KB', 'MB', 'GB'];
    let i = 0;
    let val = bytes;
    while (val >= 1024 && i < units.length - 1) {
        val /= 1024;
        i++;
    }
    return `${val.toFixed(1)} ${units[i]}`;
}
