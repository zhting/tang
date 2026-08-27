/**
 * Minecraft 原版照片画作生成器 - 单文件独立运行引擎
 * 包含竹板门打开音效、100% 精准色彩转换引擎与高清原版示例
 */

(function() {
  'use strict';

  // ==========================================
  // 1. 原版 Minecraft 竹板门音效与 C418 原版录音背景音乐引擎
  // ==========================================
  class AudioEngine {
    constructor() {
      this.ctx = null;
      this.enabled = true;
      this.bambooAudioBuffer = null;

      // C418 原版录音音乐系统 (真实温暖原声钢琴)
      this.bgmMuted = false;
      this.bgmVolume = 0.65; // 舒适清晰且温暖的原声音量
      this.bgmAudio = null;
      this.blobUrl = null;

      this.initBgmAudio();

      const userGestureHandler = () => {
        this.ensureContext();
        this.loadBambooSound();
        if (!this.bgmMuted) {
          this.playBgm();
        }
      };

      // 绑定全局手势监听，确保用户初次操作时立即启动原版录音
      window.addEventListener('click', userGestureHandler, { passive: true });
      window.addEventListener('keydown', userGestureHandler, { passive: true });
      window.addEventListener('touchstart', userGestureHandler, { passive: true });
      window.addEventListener('mousedown', userGestureHandler, { passive: true });
    }

    ensureContext() {
      if (!this.ctx) {
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        if (AudioCtx) this.ctx = new AudioCtx();
      }
      if (this.ctx && this.ctx.state === 'suspended') {
        this.ctx.resume().catch(() => {});
      }
    }

    base64ToBlobUrl(base64Str) {
      try {
        const parts = base64Str.split(',');
        const mime = (parts[0].match(/:(.*?);/) || [])[1] || 'audio/wav';
        const raw = window.atob(parts[1] || parts[0]);
        const rawLength = raw.length;
        const uInt8Array = new Uint8Array(rawLength);
        for (let i = 0; i < rawLength; ++i) {
          uInt8Array[i] = raw.charCodeAt(i);
        }
        const blob = new Blob([uInt8Array], { type: mime });
        return URL.createObjectURL(blob);
      } catch (err) {
        console.warn('Base64 转换 Blob 失败，使用原始 URI:', err);
        return base64Str;
      }
    }

    initBgmAudio() {
      if (this.bgmAudio) return;
      
      let domAudio = document.getElementById('c418-bgm-audio-player');
      if (!domAudio) {
        domAudio = document.createElement('audio');
        domAudio.id = 'c418-bgm-audio-player';
        domAudio.loop = true;
        domAudio.preload = 'auto';
        domAudio.setAttribute('playsinline', '');
        domAudio.style.display = 'none';
        document.body.appendChild(domAudio);
      }
      this.bgmAudio = domAudio;

      // 加载 C418 传世钢琴原声《Wet Hands》
      const srcUrl = window.C418_BGM_SOUND_BASE64 
        ? this.base64ToBlobUrl(window.C418_BGM_SOUND_BASE64)
        : 'assets/c418_wet_hands_piano.wav';

      this.bgmAudio.src = srcUrl;
      this.bgmAudio.volume = this.bgmVolume;

      this.bgmAudio.addEventListener('play', () => this.syncUi(true));
      this.bgmAudio.addEventListener('pause', () => this.syncUi(false));
      this.bgmAudio.addEventListener('ended', () => {
        if (!this.bgmMuted) this.bgmAudio.play().catch(() => {});
      });
    }

    playBgm() {
      this.ensureContext();
      this.bgmMuted = false;

      if (!this.bgmAudio) {
        this.initBgmAudio();
      }
      if (this.bgmAudio) {
        this.bgmAudio.volume = this.bgmVolume;
        const p = this.bgmAudio.play();
        if (p !== undefined) {
          p.then(() => this.syncUi(true))
           .catch(err => {
             console.log('等待用户点击激活音频播放:', err);
           });
        }
      }
    }

    pauseBgm() {
      this.bgmMuted = true;
      if (this.bgmAudio) {
        this.bgmAudio.pause();
      }
      this.syncUi(false);
    }

    toggleBgm() {
      this.ensureContext();
      if (!this.bgmAudio) {
        this.initBgmAudio();
      }

      const isCurrentlyPaused = !this.bgmAudio || this.bgmAudio.paused;
      if (isCurrentlyPaused || this.bgmMuted) {
        this.playBgm();
        return true;
      } else {
        this.pauseBgm();
        return false;
      }
    }

    syncUi(isPlaying) {
      const btn = document.getElementById('bgm-toggle-btn');
      const onIcon = document.getElementById('icon-sound-on');
      const offIcon = document.getElementById('icon-sound-off');
      const text = document.getElementById('bgm-status-text');

      if (btn && onIcon && offIcon && text) {
        if (isPlaying) {
          btn.classList.remove('is-muted');
          onIcon.style.display = 'block';
          offIcon.style.display = 'none';
          text.innerText = 'Wet Hands 钢琴';
          btn.title = '正在播放 C418《Wet Hands》纯钢琴原声 (点击静音)';
        } else {
          btn.classList.add('is-muted');
          onIcon.style.display = 'none';
          offIcon.style.display = 'block';
          text.innerText = '已静音';
          btn.title = '点击播放 C418《Wet Hands》纯钢琴原声';
        }
      }
    }

    syncUi(isPlaying) {
      const btn = document.getElementById('bgm-toggle-btn');
      const onIcon = document.getElementById('icon-sound-on');
      const offIcon = document.getElementById('icon-sound-off');
      const text = document.getElementById('bgm-status-text');

      if (btn && onIcon && offIcon && text) {
        if (isPlaying) {
          btn.classList.remove('is-muted');
          onIcon.style.display = 'block';
          offIcon.style.display = 'none';
          text.innerText = 'C418 BGM';
          btn.title = '点击静音 C418 背景音乐';
        } else {
          btn.classList.add('is-muted');
          onIcon.style.display = 'none';
          offIcon.style.display = 'block';
          text.innerText = '已静音';
          btn.title = '点击播放 C418 背景音乐';
        }
      }
    }

    async loadBambooSound() {
      if (this.bambooAudioBuffer || !window.BAMBOO_DOOR_SOUND_BASE64 || !this.ctx) return;
      try {
        const base64Data = window.BAMBOO_DOOR_SOUND_BASE64.split(',')[1];
        const binaryStr = window.atob(base64Data);
        const len = binaryStr.length;
        const bytes = new Uint8Array(len);
        for (let i = 0; i < len; i++) {
          bytes[i] = binaryStr.charCodeAt(i);
        }
        this.bambooAudioBuffer = await this.ctx.decodeAudioData(bytes.buffer);
      } catch (e) {
        console.warn('解码竹门音效失败，使用合成音效:', e);
      }
    }

    /**
     * Minecraft 原版打开竹板门音效 (Bamboo Wood Door Open)
     */
    playBambooDoorOpen() {
      try {
        if (!this.enabled) return;
        this.ensureContext();
        if (!this.ctx) return;

        // 如果已加载原版竹门 WAV 音频缓冲，直接 0 延迟播放
        if (this.bambooAudioBuffer) {
          const src = this.ctx.createBufferSource();
          src.buffer = this.bambooAudioBuffer;
          const gain = this.ctx.createGain();
          gain.gain.setValueAtTime(0.85, this.ctx.currentTime);
          src.connect(gain);
          gain.connect(this.ctx.destination);
          src.start(0);
          return;
        }

        // 如果音频缓冲正在加载中，调用音频元素直接播放
        if (window.BAMBOO_DOOR_SOUND_BASE64) {
          const audio = new Audio(window.BAMBOO_DOOR_SOUND_BASE64);
          audio.volume = 0.85;
          audio.play().catch(() => {});
          this.loadBambooSound();
          return;
        }
      } catch (err) {
        console.warn('播放竹门音效时被浏览器策略忽略:', err);
      }
    }

    // 拾取/保存画作音效
    playOrb() {
      if (!this.enabled) return;
      this.ensureContext();
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const t = this.ctx.currentTime;
      osc.type = 'sine';
      const baseFreq = 750 + Math.random() * 150;
      osc.frequency.setValueAtTime(baseFreq, t);
      osc.frequency.exponentialRampToValueAtTime(baseFreq * 1.5, t + 0.12);
      gain.gain.setValueAtTime(0.35, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.12);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(t);
      osc.stop(t + 0.12);
    }
  }

  const sound = new AudioEngine();

  // ==========================================
  // 2. Minecraft 方块数据与色空间转换
  // ==========================================
  function rgbToLab([r, g, b]) {
    let rL = r / 255, gL = g / 255, bL = b / 255;
    rL = rL > 0.04045 ? Math.pow((rL + 0.055) / 1.055, 2.4) : rL / 12.92;
    gL = gL > 0.04045 ? Math.pow((gL + 0.055) / 1.055, 2.4) : gL / 12.92;
    bL = bL > 0.04045 ? Math.pow((bL + 0.055) / 1.055, 2.4) : bL / 12.92;

    let x = (rL * 0.4124 + gL * 0.3576 + bL * 0.1805) / 0.95047;
    let y = (rL * 0.2126 + gL * 0.7152 + bL * 0.0722) / 1.00000;
    let z = (rL * 0.0193 + gL * 0.1192 + bL * 0.9505) / 1.08883;

    const f = (t) => t > 0.008856 ? Math.cbrt(t) : 7.787 * t + 16 / 116;
    let fx = f(x), fy = f(y), fz = f(z);

    return [116 * fy - 16, 500 * (fx - fy), 200 * (fy - fz)];
  }

  function colorDistanceLab(lab1, lab2) {
    const dL = lab1[0] - lab2[0];
    const da = lab1[1] - lab2[1];
    const db = lab1[2] - lab2[2];
    return Math.sqrt(dL * dL + da * da + db * db);
  }

  const MC_BLOCKS = [
    { id: 'water', name: '静止水', rgb: [47, 107, 230], group: 'water', textureType: 'water' },
    { id: 'lapis_block', name: '青金石块', rgb: [30, 67, 140], group: 'ore', textureType: 'ore_grain' },
    { id: 'blue_concrete', name: '蓝色混凝土', rgb: [44, 46, 143], group: 'concrete', textureType: 'smooth' },
    { id: 'light_blue_concrete', name: '浅蓝色混凝土', rgb: [36, 137, 199], group: 'concrete', textureType: 'smooth' },
    { id: 'cyan_concrete', name: '青色混凝土', rgb: [21, 119, 136], group: 'concrete', textureType: 'smooth' },
    { id: 'light_blue_wool', name: '浅蓝色羊毛', rgb: [58, 175, 217], group: 'wool', textureType: 'wool' },
    { id: 'blue_wool', name: '蓝色羊毛', rgb: [53, 57, 157], group: 'wool', textureType: 'wool' },
    { id: 'diamond_block', name: '钻石块', rgb: [98, 237, 228], group: 'ore', textureType: 'gem' },

    { id: 'grass_block', name: '草方块', rgb: [90, 168, 50], group: 'nature', textureType: 'grass' },
    { id: 'lime_concrete', name: '黄绿色混凝土', rgb: [94, 169, 25], group: 'concrete', textureType: 'smooth' },
    { id: 'green_concrete', name: '绿色混凝土', rgb: [73, 91, 36], group: 'concrete', textureType: 'smooth' },
    { id: 'lime_wool', name: '黄绿色羊毛', rgb: [112, 185, 26], group: 'wool', textureType: 'wool' },
    { id: 'green_wool', name: '绿色羊毛', rgb: [85, 109, 27], group: 'wool', textureType: 'wool' },
    { id: 'emerald_block', name: '绿宝石块', rgb: [42, 203, 88], group: 'ore', textureType: 'gem' },

    { id: 'yellow_concrete', name: '黄色混凝土', rgb: [241, 175, 21], group: 'concrete', textureType: 'smooth' },
    { id: 'yellow_wool', name: '黄色羊毛', rgb: [248, 198, 39], group: 'wool', textureType: 'wool' },
    { id: 'gold_block', name: '金块', rgb: [245, 205, 48], group: 'ore', textureType: 'metallic' },

    { id: 'dirt', name: '泥土', rgb: [134, 96, 67], group: 'nature', textureType: 'dirt' },
    { id: 'oak_planks', name: '橡木木板', rgb: [162, 130, 78], group: 'wood', textureType: 'planks' },
    { id: 'spruce_planks', name: '云杉木板', rgb: [114, 84, 48], group: 'wood', textureType: 'planks' },
    { id: 'birch_planks', name: '白桦木板', rgb: [196, 179, 123], group: 'wood', textureType: 'planks' },
    { id: 'sand', name: '沙子', rgb: [219, 207, 161], group: 'nature', textureType: 'sand' },
    { id: 'terracotta', name: '陶瓦', rgb: [152, 94, 67], group: 'terracotta', textureType: 'grain' },
    { id: 'brown_concrete', name: '棕色混凝土', rgb: [96, 60, 32], group: 'concrete', textureType: 'smooth' },
    { id: 'brown_wool', name: '棕色羊毛', rgb: [114, 71, 40], group: 'wool', textureType: 'wool' },

    { id: 'stone', name: '石头', rgb: [125, 125, 125], group: 'stone', textureType: 'stone' },
    { id: 'stone_bricks', name: '石砖', rgb: [120, 120, 120], group: 'stone', textureType: 'bricks' },
    { id: 'gray_concrete', name: '灰色混凝土', rgb: [54, 57, 61], group: 'concrete', textureType: 'smooth' },
    { id: 'light_gray_concrete', name: '浅灰色混凝土', rgb: [125, 125, 115], group: 'concrete', textureType: 'smooth' },
    { id: 'white_concrete', name: '白色混凝土', rgb: [207, 213, 214], group: 'concrete', textureType: 'smooth' },
    { id: 'white_wool', name: '白色羊毛', rgb: [234, 236, 237], group: 'wool', textureType: 'wool' },
    { id: 'black_concrete', name: '黑色混凝土', rgb: [8, 10, 15], group: 'concrete', textureType: 'smooth' },
    { id: 'black_wool', name: '黑色羊毛', rgb: [20, 21, 25], group: 'wool', textureType: 'wool' },

    { id: 'poppy_red', name: '虞美人红', rgb: [220, 30, 30], group: 'nature', textureType: 'smooth' },
    { id: 'red_concrete', name: '红色混凝土', rgb: [142, 33, 33], group: 'concrete', textureType: 'smooth' },
    { id: 'red_wool', name: '红色羊毛', rgb: [161, 39, 35], group: 'wool', textureType: 'wool' },
    { id: 'orange_concrete', name: '橙色混凝土', rgb: [224, 97, 1], group: 'concrete', textureType: 'smooth' },
    { id: 'pink_concrete', name: '粉红色混凝土', rgb: [214, 101, 143], group: 'concrete', textureType: 'smooth' }
  ];

  MC_BLOCKS.forEach(b => {
    b.lab = rgbToLab(b.rgb);
    b.hex = `#${b.rgb.map(c => c.toString(16).padStart(2, '0')).join('')}`;
  });

  const textureCache = new Map();
  function getBlockTextureCanvas(block) {
    if (textureCache.has(block.id)) return textureCache.get(block.id);
    const canvas = document.createElement('canvas');
    canvas.width = 16;
    canvas.height = 16;
    const ctx = canvas.getContext('2d');
    const [r, g, b] = block.rgb;
    ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;
    ctx.fillRect(0, 0, 16, 16);

    const imgData = ctx.getImageData(0, 0, 16, 16);
    const data = imgData.data;
    for (let y = 0; y < 16; y++) {
      for (let x = 0; x < 16; x++) {
        const idx = (y * 16 + x) * 4;
        const seed = (x * 374761393 + y * 668265263 + block.id.length * 1013904223) >>> 0;
        const noise = (seed % 100) / 100;
        let factor = 0.94 + noise * 0.12;
        data[idx] = Math.min(255, Math.max(0, Math.round(r * factor)));
        data[idx + 1] = Math.min(255, Math.max(0, Math.round(g * factor)));
        data[idx + 2] = Math.min(255, Math.max(0, Math.round(b * factor)));
      }
    }
    ctx.putImageData(imgData, 0, 0);
    textureCache.set(block.id, canvas);
    return canvas;
  }

  // ==========================================
  // 3. 图像处理与像素转换引擎
  // ==========================================
  class PixelEngine {
    constructor() {
      this.sourceImage = null;
      this.sourceCanvas = document.createElement('canvas');
      this.sourceCtx = this.sourceCanvas.getContext('2d', { willReadFrequently: true });
    }

    async loadImage(src) {
      return new Promise((resolve, reject) => {
        const img = new Image();
        if (typeof src === 'string' && (src.startsWith('http://') || src.startsWith('https://'))) {
          img.crossOrigin = 'Anonymous';
        }
        img.onload = () => {
          this.sourceImage = img;
          this.sourceCanvas.width = img.width;
          this.sourceCanvas.height = img.height;
          this.sourceCtx.drawImage(img, 0, 0);
          resolve(img);
        };
        img.onerror = (err) => {
          console.error('图片加载失败:', err);
          reject(err);
        };
        img.src = src;
      });
    }

    extractAdaptivePalette(imageData, maxColors = 64) {
      const pixels = [];
      const d = imageData.data;
      const step = Math.max(1, Math.floor(d.length / 4 / 2000));
      for (let i = 0; i < d.length; i += 4 * step) {
        pixels.push([d[i], d[i + 1], d[i + 2]]);
      }

      function medianCut(bucketList, depth) {
        if (depth === 0 || bucketList.length >= maxColors) return bucketList;
        const newBuckets = [];
        for (const bucket of bucketList) {
          if (bucket.length <= 1) { newBuckets.push(bucket); continue; }
          let minR = 255, maxR = 0, minG = 255, maxG = 0, minB = 255, maxB = 0;
          for (const [r, g, b] of bucket) {
            if (r < minR) minR = r; if (r > maxR) maxR = r;
            if (g < minG) minG = g; if (g > maxG) maxG = g;
            if (b < minB) minB = b; if (b > maxB) maxB = b;
          }
          const rangeR = maxR - minR, rangeG = maxG - minG, rangeB = maxB - minB;
          let sortIdx = 0;
          if (rangeG >= rangeR && rangeG >= rangeB) sortIdx = 1;
          else if (rangeB >= rangeR && rangeB >= rangeG) sortIdx = 2;
          bucket.sort((a, b) => a[sortIdx] - b[sortIdx]);
          const mid = Math.floor(bucket.length / 2);
          newBuckets.push(bucket.slice(0, mid));
          newBuckets.push(bucket.slice(mid));
        }
        return medianCut(newBuckets, depth - 1);
      }

      const rawBuckets = medianCut([pixels], Math.ceil(Math.log2(maxColors)));
      return rawBuckets.map(b => {
        if (b.length === 0) return { rgb: [0, 0, 0], hex: '#000000', lab: rgbToLab([0, 0, 0]) };
        const avg = [0, 0, 0];
        for (const p of b) { avg[0] += p[0]; avg[1] += p[1]; avg[2] += p[2]; }
        const r = Math.round(avg[0] / b.length), g = Math.round(avg[1] / b.length), blue = Math.round(avg[2] / b.length);
        return {
          rgb: [r, g, blue],
          lab: rgbToLab([r, g, blue]),
          hex: `#${[r, g, blue].map(c => c.toString(16).padStart(2, '0')).join('')}`
        };
      });
    }

    processImage({
      targetWidth = 32,
      targetHeight = 32,
      brightness = 0,
      contrast = 0,
      saturation = 0,
      mode = 'true_color',
      dithering = 'none',
      ditherStrength = 0.5,
      aspectRatioMode = 'cover'
    }) {
      if (!this.sourceImage) return null;

      const tempCanvas = document.createElement('canvas');
      tempCanvas.width = targetWidth;
      tempCanvas.height = targetHeight;
      const tempCtx = tempCanvas.getContext('2d', { willReadFrequently: true });

      let sx = 0, sy = 0, sWidth = this.sourceImage.width, sHeight = this.sourceImage.height;
      if (aspectRatioMode === 'cover') {
        const srcRatio = sWidth / sHeight;
        const targetRatio = targetWidth / targetHeight;
        if (srcRatio > targetRatio) {
          sWidth = sHeight * targetRatio;
          sx = (this.sourceImage.width - sWidth) / 2;
        } else {
          sHeight = sWidth / targetRatio;
          sy = (this.sourceImage.height - sHeight) / 2;
        }
      }

      tempCtx.imageSmoothingEnabled = true;
      tempCtx.imageSmoothingQuality = 'high';
      tempCtx.drawImage(this.sourceImage, sx, sy, sWidth, sHeight, 0, 0, targetWidth, targetHeight);

      const imgData = tempCtx.getImageData(0, 0, targetWidth, targetHeight);
      const data = imgData.data;

      const cFactor = (259 * (contrast + 255)) / (255 * (259 - contrast));
      const sFactor = (saturation + 100) / 100;

      for (let i = 0; i < data.length; i += 4) {
        let r = data[i], g = data[i + 1], b = data[i + 2];
        if (brightness !== 0) {
          r += brightness * 2.55; g += brightness * 2.55; b += brightness * 2.55;
        }
        if (contrast !== 0) {
          r = cFactor * (r - 128) + 128; g = cFactor * (g - 128) + 128; b = cFactor * (b - 128) + 128;
        }
        if (saturation !== 0) {
          const gray = 0.2989 * r + 0.5870 * g + 0.1140 * b;
          r = gray + (r - gray) * sFactor; g = gray + (g - gray) * sFactor; b = gray + (b - gray) * sFactor;
        }
        data[i] = Math.min(255, Math.max(0, Math.round(r)));
        data[i + 1] = Math.min(255, Math.max(0, Math.round(g)));
        data[i + 2] = Math.min(255, Math.max(0, Math.round(b)));
      }

      const grid = [];
      if (mode === 'true_color') {
        for (let y = 0; y < targetHeight; y++) {
          grid[y] = [];
          for (let x = 0; x < targetWidth; x++) {
            const idx = (y * targetWidth + x) * 4;
            const r = data[idx], g = data[idx + 1], b = data[idx + 2];
            grid[y][x] = {
              rgb: [r, g, b],
              hex: `#${[r, g, b].map(c => c.toString(16).padStart(2, '0')).join('')}`
            };
          }
        }
      } else {
        let palette = MC_BLOCKS;
        if (mode === 'adaptive') {
          palette = this.extractAdaptivePalette(imgData, 64);
        }

        const buffer = [];
        for (let y = 0; y < targetHeight; y++) {
          buffer[y] = [];
          for (let x = 0; x < targetWidth; x++) {
            const idx = (y * targetWidth + x) * 4;
            buffer[y][x] = [data[idx], data[idx + 1], data[idx + 2]];
          }
        }

        for (let y = 0; y < targetHeight; y++) {
          grid[y] = [];
          for (let x = 0; x < targetWidth; x++) {
            let [r, g, b] = buffer[y][x];
            r = Math.min(255, Math.max(0, r));
            g = Math.min(255, Math.max(0, g));
            b = Math.min(255, Math.max(0, b));

            const targetLab = rgbToLab([r, g, b]);
            let closest = palette[0], minDist = Infinity;

            for (const item of palette) {
              const dist = colorDistanceLab(targetLab, item.lab);
              if (dist < minDist) { minDist = dist; closest = item; }
            }

            grid[y][x] = closest;

            if (dithering === 'floyd' || dithering === 'subtle') {
              const effectiveStrength = (dithering === 'subtle' ? 0.35 : ditherStrength);
              const errR = (r - closest.rgb[0]) * effectiveStrength;
              const errG = (g - closest.rgb[1]) * effectiveStrength;
              const errB = (b - closest.rgb[2]) * effectiveStrength;

              const distribute = (nx, ny, weight) => {
                if (nx >= 0 && nx < targetWidth && ny >= 0 && ny < targetHeight) {
                  buffer[ny][nx][0] += errR * weight;
                  buffer[ny][nx][1] += errG * weight;
                  buffer[ny][nx][2] += errB * weight;
                }
              };
              distribute(x + 1, y, 7 / 16);
              distribute(x - 1, y + 1, 3 / 16);
              distribute(x, y + 1, 5 / 16);
              distribute(x + 1, y + 1, 1 / 16);
            }
          }
        }
      }

      return {
        width: targetWidth,
        height: targetHeight,
        mode,
        grid,
        totalPixels: targetWidth * targetHeight
      };
    }

    /**
     * 将转换结果渲染为 Canvas
     * 背景：原版《我的世界》橡木木板 (Oak Planks)
     * 边框：原版《我的世界》物品展示框 (Item Frame) - 严格保持 1:1 像素比例等比自适应缩放
     */
    renderToCanvas(result, {
      scale = 16,
      showFrame = true,
      showWall = true,
      useBlockTexture = false
    } = {}) {
      if (!result || !result.grid) return null;

      const { width, height, grid } = result;
      const canvas = document.createElement('canvas');

      // 物品展示框边框厚度：严格按比例与像素网格大小保持一致 (1个像素单位厚度)
      const frameThickness = showFrame ? Math.max(8, Math.round(scale * 1.0)) : 0;
      // 橡木木板背景边距
      const wallPadding = showWall ? Math.max(24, Math.round(scale * 2.5)) : 0;

      const artWidth = width * scale;
      const artHeight = height * scale;
      const totalW = artWidth + (frameThickness * 2) + (wallPadding * 2);
      const totalH = artHeight + (frameThickness * 2) + (wallPadding * 2);

      canvas.width = totalW;
      canvas.height = totalH;
      const ctx = canvas.getContext('2d');
      ctx.imageSmoothingEnabled = false;

      const startX = wallPadding;
      const startY = wallPadding;

      // 1. 渲染原版《我的世界》橡木木板背景 (Oak Planks Background)
      if (showWall) {
        // 基础橡木温暖色
        ctx.fillStyle = '#a2824e';
        ctx.fillRect(0, 0, totalW, totalH);

        const plankH = Math.max(16, Math.round(scale * 1.5)); // 每层木板高度
        const totalRows = Math.ceil(totalH / plankH) + 1;

        for (let row = 0; row < totalRows; row++) {
          const y = row * plankH;

          // 木板层微杂色与原木纤维
          ctx.fillStyle = (row % 2 === 0) ? '#a98953' : '#9b7b47';
          ctx.fillRect(0, y, totalW, plankH);

          // 木纤维纹理颗粒
          ctx.fillStyle = 'rgba(0, 0, 0, 0.04)';
          for (let px = 0; px < totalW; px += 4) {
            if ((px + row * 17) % 8 === 0) {
              ctx.fillRect(px, y + 2, 3, plankH - 4);
            }
          }

          // 木板顶部细微高光线
          ctx.fillStyle = 'rgba(255, 255, 255, 0.12)';
          ctx.fillRect(0, y, totalW, 1);

          // 木板之间深褐色横缝隙
          ctx.fillStyle = '#5c3d1e';
          ctx.fillRect(0, y + plankH - 2, totalW, 2);

          // 错位交错的木板垂直缝隙 (Staggered Vertical Seams)
          const seamOffset = (row % 4) * (plankH * 2.5);
          const seamSpacing = plankH * 6;
          for (let x = -seamSpacing + (seamOffset % seamSpacing); x < totalW + seamSpacing; x += seamSpacing) {
            if (x >= 0 && x < totalW) {
              ctx.fillStyle = '#492f15';
              ctx.fillRect(x, y, 2, plankH);
              ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
              ctx.fillRect(x + 2, y, 1, plankH - 2);
            }
          }
        }
      }

      // 2. 渲染《我的世界》原版物品展示框 (Item Frame)
      if (showFrame) {
        const fx = startX;
        const fy = startY;
        const fw = artWidth + frameThickness * 2;
        const fh = artHeight + frameThickness * 2;
        const b = frameThickness; // 边框宽度，与像素网格同比例

        // 展示框在橡木木板上的投射阴影
        ctx.fillStyle = 'rgba(0, 0, 0, 0.55)';
        ctx.fillRect(fx + 4, fy + 4, fw, fh);

        // 展示框深木色外框基底
        ctx.fillStyle = '#3c2512';
        ctx.fillRect(fx, fy, fw, fh);

        // 展示框桦木外圈表面主色
        ctx.fillStyle = '#8f6739';
        ctx.fillRect(fx + 2, fy + 2, fw - 4, fh - 4);

        // 顶部与左侧外沿亮色高光 (原版 Item Frame 经典高光边缘)
        ctx.fillStyle = '#be975f';
        ctx.fillRect(fx + 1, fy + 1, fw - 2, Math.max(2, Math.round(b * 0.35)));
        ctx.fillRect(fx + 1, fy + 1, Math.max(2, Math.round(b * 0.35)), fh - 2);

        // 底部与右侧外沿深色阴影边
        ctx.fillStyle = '#26160a';
        ctx.fillRect(fx + 1, fy + fh - Math.max(2, Math.round(b * 0.35)) - 1, fw - 2, Math.max(2, Math.round(b * 0.35)));
        ctx.fillRect(fx + fw - Math.max(2, Math.round(b * 0.35)) - 1, fy + 1, Math.max(2, Math.round(b * 0.35)), fh - 2);

        // 内层深色凹槽 (熟皮革底板托槽与阴影)
        ctx.fillStyle = '#1c1006';
        ctx.fillRect(fx + b - 2, fy + b - 2, artWidth + 4, artHeight + 4);

        // 熟皮革微暖底衬垫圈
        ctx.fillStyle = '#5c3a1d';
        ctx.fillRect(fx + b - 1, fy + b - 1, artWidth + 2, artHeight + 2);
      }

      // 3. 绘制核心像素画内容 (与展示框保持严格 1:1 像素比例)
      const contentX = startX + frameThickness;
      const contentY = startY + frameThickness;

      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          const item = grid[y][x];
          const px = contentX + x * scale;
          const py = contentY + y * scale;

          if (useBlockTexture && item.id) {
            const tex = getBlockTextureCanvas(item);
            ctx.drawImage(tex, 0, 0, 16, 16, px, py, scale, scale);
          } else {
            ctx.fillStyle = item.hex;
            ctx.fillRect(px, py, scale, scale);
          }
        }
      }

      return canvas;
    }
  }

  // ==========================================
  // 4. 导出工坊
  // ==========================================
  class ExportStudio {
    static downloadCanvas(canvas, filename = 'minecraft-art.png') {
      if (!canvas) return;
      const link = document.createElement('a');
      link.download = filename;
      link.href = canvas.toDataURL('image/png');
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  }

  // ==========================================
  // 5. 预设示例集 (100% 纯正 Minecraft 原版经典画作与高清实拍)
  // ==========================================
  function generatePresetSamples() {
    if (window.PRESET_SAMPLES_DATA && window.PRESET_SAMPLES_DATA.length > 0) {
      return window.PRESET_SAMPLES_DATA;
    }

    return [
      {
        id: 'minecraft_river',
        name: '原版河流与山谷',
        dataUrl: window.RIVER_SAMPLE_BASE64 || ''
      }
    ];
  }

  // ==========================================
  // 6. 主应用交互管理
  // ==========================================
  class MinecraftPaintingApp {
    constructor() {
      this.pixelEngine = new PixelEngine();
      this.currentGridResult = null;
      this.currentRenderedCanvas = null;

      this.params = {
        targetWidth: 32,
        targetHeight: 32,
        mode: 'true_color',
        dithering: 'none',
        ditherStrength: 0.5,
        showFrame: true,
        showWall: true,
        contrast: 0,
        saturation: 0,
        brightness: 0
      };
    }

    async init() {
      this.applyCobblestoneBackground();
      this.cacheDomElements();
      this.bindEvents();
      this.renderPresets();

      const presets = generatePresetSamples();
      if (presets.length > 0) {
        await this.loadSourceImage(presets[0].dataUrl);
      }
    }

    applyCobblestoneBackground() {
      if (window.MC_COBBLESTONE_BASE64) {
        document.body.style.backgroundImage = `
          radial-gradient(circle at 50% 20%, rgba(20, 20, 26, 0.72) 0%, rgba(10, 10, 14, 0.92) 100%),
          url('${window.MC_COBBLESTONE_BASE64}')
        `;
        document.body.style.backgroundRepeat = 'repeat';
        document.body.style.backgroundSize = 'auto, 64px 64px';
        document.body.style.imageRendering = 'pixelated';
      }
    }

    cacheDomElements() {
      this.dropzone = document.getElementById('upload-dropzone');
      this.fileInput = document.getElementById('image-file-input');
      this.presetList = document.getElementById('preset-samples-list');

      this.sizeButtons = document.querySelectorAll('.size-btn');
      this.modeSelect = document.getElementById('mode-select');
      this.ditherSelect = document.getElementById('dither-select');
      this.showFrameToggle = document.getElementById('show-frame-toggle');
      this.showWallToggle = document.getElementById('show-wall-toggle');
      this.contrastSlider = document.getElementById('contrast-slider');
      this.saturSlider = document.getElementById('satur-slider');

      this.renderContainer = document.getElementById('painting-render-container');
      this.originalImgPreview = document.getElementById('original-image-preview');
      this.artSizeBadge = document.getElementById('art-size-badge');
      this.artInfoText = document.getElementById('art-info-text');

      this.headerExportBtn = document.getElementById('header-export-btn');
      this.mainExportBtn = document.getElementById('main-export-btn');
      this.toggleOriginalBtn = document.getElementById('toggle-view-original-btn');

      this.toast = document.getElementById('achievement-toast');
      this.toastTitle = document.getElementById('toast-title');
      this.toastDesc = document.getElementById('toast-desc');
    }

    bindEvents() {
      // 1. 全局与拖拽区域事件
      const preventDefaults = (e) => {
        e.preventDefault();
        e.stopPropagation();
      };
      ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        window.addEventListener(eventName, preventDefaults, false);
        document.body.addEventListener(eventName, preventDefaults, false);
        if (this.dropzone) {
          this.dropzone.addEventListener(eventName, preventDefaults, false);
        }
      });

      if (this.dropzone) {
        this.dropzone.addEventListener('dragover', () => {
          this.dropzone.classList.add('dragover');
        });
        this.dropzone.addEventListener('dragleave', () => {
          this.dropzone.classList.remove('dragover');
        });
        this.dropzone.addEventListener('drop', (e) => {
          this.dropzone.classList.remove('dragover');
          const files = e.dataTransfer?.files;
          if (files && files.length > 0) {
            this.handleFileUpload(files[0]);
          }
        });
        this.dropzone.addEventListener('click', (e) => {
          if (e.target !== this.fileInput && this.fileInput) {
            this.fileInput.click();
          }
        });
      }

      window.addEventListener('drop', (e) => {
        if (this.dropzone) this.dropzone.classList.remove('dragover');
        const files = e.dataTransfer?.files;
        if (files && files.length > 0) {
          this.handleFileUpload(files[0]);
        }
      });

      // 2. 点击上传框与文件选择交互 (支持同名文件反复重选)
      if (this.fileInput) {
        this.fileInput.addEventListener('change', (e) => {
          if (e.target.files && e.target.files[0]) {
            this.handleFileUpload(e.target.files[0]);
            e.target.value = ''; // 允许重复上传同一张图片
          }
        });
      }

      // 3. 剪贴板粘贴图片交互
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

      // 4. 切换画框尺寸 (白桦木告示牌 ➔ 橡木告示牌选中)
      document.addEventListener('click', (e) => {
        const btn = e.target.closest('.size-btn');
        if (btn) {
          sound.playBambooDoorOpen();
          document.querySelectorAll('.size-btn').forEach(b => b.classList.remove('active'));
          btn.classList.add('active');
          this.params.targetWidth = parseInt(btn.dataset.w);
          this.params.targetHeight = parseInt(btn.dataset.h);
          this.updateArt();
        }
      });

      // 5. 下拉模式选择与开关切换时播放打开竹板门声音
      this.modeSelect.addEventListener('change', (e) => {
        this.params.mode = e.target.value;
        sound.playBambooDoorOpen();
        this.updateArt();
      });

      this.ditherSelect.addEventListener('change', (e) => {
        this.params.dithering = e.target.value;
        sound.playBambooDoorOpen();
        this.updateArt();
      });

      this.showFrameToggle.addEventListener('change', (e) => {
        this.params.showFrame = e.target.checked;
        sound.playBambooDoorOpen();
        this.renderCanvasView();
      });

      this.showWallToggle.addEventListener('change', (e) => {
        this.params.showWall = e.target.checked;
        sound.playBambooDoorOpen();
        this.renderCanvasView();
      });

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

      const showOriginal = () => {
        sound.playBambooDoorOpen();
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
          sound.playBambooDoorOpen();
          this.loadSourceImage(preset.dataUrl);
        });

        this.presetList.appendChild(card);
      });
    }

    async handleFileUpload(file) {
      if (!file) return;
      const reader = new FileReader();
      reader.onload = async (e) => {
        sound.playBambooDoorOpen();
        await this.loadSourceImage(e.target.result);
        this.showToast('画作已生成！', '照片已完美转化为《我的世界》原版画作');
      };
      reader.onerror = (err) => {
        console.error('读取文件失败:', err);
        alert('读取照片失败，请重新选择图片文件');
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

      // 1. 更新大画右下角视窗
      this.updateMiniViewport();

      // 2. 更新底部原石展台上的原版展示框（保持完全相同比例并等比缩小）
      this.updateGalleryItemFrames();
    }

    updateMiniViewport() {
      const miniCanvas = document.getElementById('viewport-mini-canvas');
      const frameBox = document.getElementById('viewport-frame-box');
      if (!miniCanvas || !this.currentGridResult) return;

      const w = this.params.targetWidth;
      const h = this.params.targetHeight;

      // 调整视窗展示框尺寸，与大画比例完全一致
      const maxBox = 44;
      let boxW, boxH;
      if (w >= h) {
        boxW = maxBox;
        boxH = Math.max(18, Math.round(maxBox * (h / w)));
      } else {
        boxH = maxBox;
        boxW = Math.max(18, Math.round(maxBox * (w / h)));
      }

      if (frameBox) {
        frameBox.style.width = `${boxW}px`;
        frameBox.style.height = `${boxH}px`;
      }

      miniCanvas.width = w;
      miniCanvas.height = h;
      const ctx = miniCanvas.getContext('2d');
      ctx.imageSmoothingEnabled = false;

      const pixels = this.currentGridResult.pixels;
      const imgData = ctx.createImageData(w, h);
      for (let i = 0; i < pixels.length; i++) {
        imgData.data[i * 4] = pixels[i][0];
        imgData.data[i * 4 + 1] = pixels[i][1];
        imgData.data[i * 4 + 2] = pixels[i][2];
        imgData.data[i * 4 + 3] = pixels[i][3];
      }
      ctx.putImageData(imgData, 0, 0);
    }

    updateGalleryItemFrames() {
      const activeFrame = document.getElementById('gallery-active-frame');
      const activeCanvas = document.getElementById('gallery-active-canvas');
      if (!activeFrame || !activeCanvas || !this.currentGridResult) return;

      const w = this.params.targetWidth;
      const h = this.params.targetHeight;

      // 底部展示框：与大画比例严格保持相同，但是整个等比缩小
      const maxFrame = 48;
      let frameW, frameH;
      if (w >= h) {
        frameW = maxFrame;
        frameH = Math.max(22, Math.round(maxFrame * (h / w)));
      } else {
        frameH = maxFrame;
        frameW = Math.max(22, Math.round(maxFrame * (w / h)));
      }

      activeFrame.style.width = `${frameW}px`;
      activeFrame.style.height = `${frameH}px`;

      activeCanvas.width = w;
      activeCanvas.height = h;
      const ctx = activeCanvas.getContext('2d');
      ctx.imageSmoothingEnabled = false;

      const pixels = this.currentGridResult.pixels;
      const imgData = ctx.createImageData(w, h);
      for (let i = 0; i < pixels.length; i++) {
        imgData.data[i * 4] = pixels[i][0];
        imgData.data[i * 4 + 1] = pixels[i][1];
        imgData.data[i * 4 + 2] = pixels[i][2];
        imgData.data[i * 4 + 3] = pixels[i][3];
      }
      ctx.putImageData(imgData, 0, 0);

      // 初始化填充其他展示框的示例画作
      this.initSampleGalleryFrames();
    }

    initSampleGalleryFrames() {
      const sampleConfigs = [
        { id: 'gallery-canvas-2', w: 16, h: 16, draw: (ctx) => {
          ctx.fillStyle = '#6ab04c'; ctx.fillRect(0, 0, 16, 16);
          ctx.fillStyle = '#eb4d4b'; ctx.fillRect(4, 4, 8, 8);
          ctx.fillStyle = '#f0932b'; ctx.fillRect(6, 6, 4, 4);
        }},
        { id: 'gallery-canvas-3', w: 32, h: 16, draw: (ctx) => {
          ctx.fillStyle = '#22a6b3'; ctx.fillRect(0, 0, 32, 16);
          ctx.fillStyle = '#f9ca24'; ctx.fillRect(4, 2, 8, 8);
          ctx.fillStyle = '#30336b'; ctx.fillRect(0, 10, 32, 6);
        }},
        { id: 'gallery-canvas-4', w: 16, h: 32, draw: (ctx) => {
          ctx.fillStyle = '#be2edd'; ctx.fillRect(0, 0, 16, 32);
          ctx.fillStyle = '#4834d4'; ctx.fillRect(2, 6, 12, 18);
          ctx.fillStyle = '#e056fd'; ctx.fillRect(5, 10, 6, 10);
        }},
        { id: 'gallery-canvas-5', w: 64, h: 48, draw: (ctx) => {
          ctx.fillStyle = '#3867d6'; ctx.fillRect(0, 0, 64, 48);
          ctx.fillStyle = '#20bf6b'; ctx.fillRect(0, 30, 64, 18);
          ctx.fillStyle = '#fa8231'; ctx.fillRect(12, 8, 16, 16);
          ctx.fillStyle = '#fed330'; ctx.fillRect(40, 12, 12, 12);
        }}
      ];

      sampleConfigs.forEach(cfg => {
        const c = document.getElementById(cfg.id);
        if (c && !c.dataset.rendered) {
          c.width = cfg.w;
          c.height = cfg.h;
          const ctx = c.getContext('2d');
          ctx.imageSmoothingEnabled = false;
          cfg.draw(ctx);
          c.dataset.rendered = 'true';
        }
      });
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

  // 启动应用
  window.sound = sound;
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      const app = new MinecraftPaintingApp();
      app.init();
      window.mcPaintingApp = app;
    });
  } else {
    const app = new MinecraftPaintingApp();
    app.init();
    window.mcPaintingApp = app;
  }

})();
