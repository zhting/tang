/**
 * Minecraft 原版画作生成器 - 主交互控制逻辑 (高保真色彩版)
 */

import { PixelEngine } from './pixelEngine.js';
import { sound } from './audioEngine.js';
import { generatePresetSamples } from './presetSamples.js';
import { ExportStudio } from './exportStudio.js';

class MinecraftPaintingApp {
  constructor() {
    this.pixelEngine = new PixelEngine();
    this.currentGridResult = null;
    this.currentRenderedCanvas = null;

    // 参数状态
    this.params = {
      targetWidth: 32,
      targetHeight: 32,
      mode: 'true_color',      // 'true_color' (100% 精准), 'adaptive' (自适应), 'block' (MC方块)
      dithering: 'none',       // 'none', 'subtle', 'floyd'
      ditherStrength: 0.5,
      showFrame: true,
      showWall: true,
      contrast: 0,
      saturation: 0,
      brightness: 0
    };
  }

  async init() {
    this.cacheDomElements();
    this.bindEvents();
    this.renderPresets();

    // 默认加载用户上传的 Minecraft 真实河流风景图
    const presets = generatePresetSamples();
    if (presets.length > 0) {
      await this.loadSourceImage(presets[0].dataUrl);
    }
  }

  cacheDomElements() {
    // 上传与示例
    this.dropzone = document.getElementById('upload-dropzone');
    this.fileInput = document.getElementById('image-file-input');
    this.presetList = document.getElementById('preset-samples-list');

    // 控件
    this.sizeButtons = document.querySelectorAll('.size-btn');
    this.modeSelect = document.getElementById('mode-select');
    this.ditherSelect = document.getElementById('dither-select');
    this.showFrameToggle = document.getElementById('show-frame-toggle');
    this.showWallToggle = document.getElementById('show-wall-toggle');
    this.contrastSlider = document.getElementById('contrast-slider');
    this.saturSlider = document.getElementById('satur-slider');

    // 舞台与预览
    this.renderContainer = document.getElementById('painting-render-container');
    this.originalImgPreview = document.getElementById('original-image-preview');
    this.artSizeBadge = document.getElementById('art-size-badge');
    this.artInfoText = document.getElementById('art-info-text');

    // 按钮
    this.headerExportBtn = document.getElementById('header-export-btn');
    this.mainExportBtn = document.getElementById('main-export-btn');
    this.toggleOriginalBtn = document.getElementById('toggle-view-original-btn');

    // 提示弹窗
    this.toast = document.getElementById('achievement-toast');
    this.toastTitle = document.getElementById('toast-title');
    this.toastDesc = document.getElementById('toast-desc');
  }

  bindEvents() {
    // 1. 上传图片与拖拽
    this.fileInput.addEventListener('change', (e) => {
      if (e.target.files && e.target.files[0]) {
        this.handleFileUpload(e.target.files[0]);
      }
    });

    this.dropzone.addEventListener('dragover', (e) => {
      e.preventDefault();
      this.dropzone.classList.add('dragover');
    });

    this.dropzone.addEventListener('dragleave', () => {
      this.dropzone.classList.remove('dragover');
    });

    this.dropzone.addEventListener('drop', (e) => {
      e.preventDefault();
      this.dropzone.classList.remove('dragover');
      if (e.dataTransfer.files && e.dataTransfer.files[0]) {
        this.handleFileUpload(e.dataTransfer.files[0]);
      }
    });

    // 剪贴板粘贴图片 (Ctrl+V / Cmd+V)
    window.addEventListener('paste', (e) => {
      const items = e.clipboardData?.items;
      if (!items) return;
      for (const item of items) {
        if (item.type.startsWith('image/')) {
          const file = item.getAsFile();
          if (file) {
            this.handleFileUpload(file);
            break;
          }
        }
      }
    });

    // 2. 尺寸规格切换
    this.sizeButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        sound.playClick();
        this.sizeButtons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.params.targetWidth = parseInt(btn.dataset.w);
        this.params.targetHeight = parseInt(btn.dataset.h);
        this.updateArt();
      });
    });

    // 3. 模式与算法切换
    this.modeSelect.addEventListener('change', (e) => {
      this.params.mode = e.target.value;
      sound.playClick();
      this.updateArt();
    });

    this.ditherSelect.addEventListener('change', (e) => {
      this.params.dithering = e.target.value;
      sound.playClick();
      this.updateArt();
    });

    this.showFrameToggle.addEventListener('change', (e) => {
      this.params.showFrame = e.target.checked;
      sound.playClick();
      this.renderCanvasView();
    });

    this.showWallToggle.addEventListener('change', (e) => {
      this.params.showWall = e.target.checked;
      sound.playClick();
      this.renderCanvasView();
    });

    // 4. 滑块控制
    const bindSlider = (slider, key, labelId) => {
      if (!slider) return;
      slider.addEventListener('input', (e) => {
        const val = parseFloat(e.target.value);
        this.params[key] = val;
        const elem = document.getElementById(labelId);
        if (elem) elem.innerText = val;
        this.updateArt();
      });
    };

    bindSlider(this.contrastSlider, 'contrast', 'contrast-val');
    bindSlider(this.saturSlider, 'saturation', 'satur-val');

    // 5. 查看原图对比 (按住查看)
    const showOriginal = () => {
      if (this.renderContainer && this.originalImgPreview) {
        this.renderContainer.style.display = 'none';
        this.originalImgPreview.style.display = 'block';
      }
    };
    const showArt = () => {
      if (this.renderContainer && this.originalImgPreview) {
        this.renderContainer.style.display = 'block';
        this.originalImgPreview.style.display = 'none';
      }
    };

    this.toggleOriginalBtn.addEventListener('mousedown', showOriginal);
    this.toggleOriginalBtn.addEventListener('mouseup', showArt);
    this.toggleOriginalBtn.addEventListener('mouseleave', showArt);
    this.toggleOriginalBtn.addEventListener('touchstart', (e) => { e.preventDefault(); showOriginal(); });
    this.toggleOriginalBtn.addEventListener('touchend', (e) => { e.preventDefault(); showArt(); });

    // 6. 导出下载画作
    const doExport = () => {
      if (!this.currentRenderedCanvas) return;
      sound.playOrb();
      const filename = `minecraft-painting-${this.params.targetWidth}x${this.params.targetHeight}.png`;
      ExportStudio.downloadCanvas(this.currentRenderedCanvas, filename);
      this.showToast('画作已下载！', `已导出 ${this.params.targetWidth}x${this.params.targetHeight} 原版画作图片`);
    };

    this.headerExportBtn.addEventListener('click', doExport);
    this.mainExportBtn.addEventListener('click', doExport);
  }

  renderPresets() {
    const presets = generatePresetSamples();
    this.presetList.innerHTML = '';

    presets.forEach(preset => {
      const card = document.createElement('div');
      card.className = 'preset-thumb-card';
      card.title = `点击体验: ${preset.name}`;

      const img = document.createElement('img');
      img.src = preset.dataUrl;
      img.className = 'preset-thumb';

      const name = document.createElement('span');
      name.className = 'preset-name';
      name.innerText = preset.name;

      card.appendChild(img);
      card.appendChild(name);

      card.addEventListener('click', () => {
        sound.playClick();
        this.loadSourceImage(preset.dataUrl);
      });

      this.presetList.appendChild(card);
    });
  }

  async handleFileUpload(file) {
    if (!file.type.startsWith('image/')) {
      alert('请上传有效的图片文件 (JPG / PNG / WebP)');
      return;
    }
    const reader = new FileReader();
    reader.onload = async (e) => {
      sound.playGenerate();
      await this.loadSourceImage(e.target.result);
      this.showToast('画作已生成！', '照片已完美转化为《我的世界》原版画作');
    };
    reader.readAsDataURL(file);
  }

  async loadSourceImage(src) {
    try {
      await this.pixelEngine.loadImage(src);
      this.originalImgPreview.src = src;
      this.updateArt();
    } catch (err) {
      console.error('加载图像失败:', err);
    }
  }

  updateArt() {
    if (!this.pixelEngine.sourceImage) return;

    // 核心处理
    this.currentGridResult = this.pixelEngine.processImage({
      targetWidth: this.params.targetWidth,
      targetHeight: this.params.targetHeight,
      mode: this.params.mode,
      contrast: this.params.contrast,
      saturation: this.params.saturation,
      dithering: this.params.dithering,
      ditherStrength: this.params.ditherStrength
    });

    this.renderCanvasView();
    this.updateInfoBadge();
  }

  renderCanvasView() {
    if (!this.currentGridResult) return;

    const maxDimension = Math.max(this.params.targetWidth, this.params.targetHeight);
    const scale = Math.max(10, Math.min(22, Math.floor(520 / maxDimension)));

    this.currentRenderedCanvas = this.pixelEngine.renderToCanvas(this.currentGridResult, {
      scale,
      showFrame: this.params.showFrame,
      showWall: this.params.showWall,
      useBlockTexture: this.params.mode === 'block'
    });

    this.currentRenderedCanvas.className = 'rendered-art-canvas';
    this.renderContainer.innerHTML = '';
    this.renderContainer.appendChild(this.currentRenderedCanvas);
  }

  updateInfoBadge() {
    const w = this.params.targetWidth;
    const h = this.params.targetHeight;
    const blockW = Math.round(w / 16);
    const blockH = Math.round(h / 16);
    this.artSizeBadge.innerText = `${w}×${h} (${blockW}×${blockH} 方块)`;
    
    if (this.params.mode === 'true_color') {
      this.artInfoText.innerText = '原版真彩油画 (100% 精准色彩还原)';
    } else if (this.params.mode === 'adaptive') {
      this.artInfoText.innerText = '自适应 64 色油画 (原图提取调色板)';
    } else {
      this.artInfoText.innerText = 'Minecraft 原版方块画 (羊毛/混凝土搭建)';
    }
  }

  showToast(title, desc) {
    if (!this.toast) return;
    this.toastTitle.innerText = title;
    this.toastDesc.innerText = desc;
    this.toast.classList.add('show');

    if (this.toastTimeout) clearTimeout(this.toastTimeout);
    this.toastTimeout = setTimeout(() => {
      this.toast.classList.remove('show');
    }, 3500);
  }
}

window.addEventListener('DOMContentLoaded', () => {
  const app = new MinecraftPaintingApp();
  app.init();
  window.mcPaintingApp = app;
});
