/**
 * 图像处理与 Minecraft 原版画作转换核心引擎 (高保真色彩版)
 * 彻底杜绝偏色，完美还原原图色彩与 Minecraft 原版油画像素质感
 */

import { MC_BLOCKS, colorDistanceLab, rgbToLab, getBlockTextureCanvas } from './blocksData.js';

export class PixelEngine {
  constructor() {
    this.sourceImage = null;
    this.sourceCanvas = document.createElement('canvas');
    this.sourceCtx = this.sourceCanvas.getContext('2d', { willReadFrequently: true });
  }

  // 加载图片
  async loadImage(src) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'Anonymous';
      img.onload = () => {
        this.sourceImage = img;
        this.sourceCanvas.width = img.width;
        this.sourceCanvas.height = img.height;
        this.sourceCtx.drawImage(img, 0, 0);
        resolve(img);
      };
      img.onerror = (err) => reject(err);
      img.src = src;
    });
  }

  /**
   * 从图片中提取自适应调色板 (Median-Cut 算法，严格基于原图本身色彩)
   */
  extractAdaptivePalette(imageData, maxColors = 64) {
    const pixels = [];
    const d = imageData.data;
    const step = Math.max(1, Math.floor(d.length / 4 / 2000)); // 采样约 2000 点

    for (let i = 0; i < d.length; i += 4 * step) {
      pixels.push([d[i], d[i + 1], d[i + 2]]);
    }

    function medianCut(bucketList, depth) {
      if (depth === 0 || bucketList.length >= maxColors) return bucketList;
      const newBuckets = [];

      for (const bucket of bucketList) {
        if (bucket.length <= 1) {
          newBuckets.push(bucket);
          continue;
        }

        // 找极差最大的通道
        let minR = 255, maxR = 0, minG = 255, maxG = 0, minB = 255, maxB = 0;
        for (const [r, g, b] of bucket) {
          if (r < minR) minR = r; if (r > maxR) maxR = r;
          if (g < minG) minG = g; if (g > maxG) maxG = g;
          if (b < minB) minB = b; if (b > maxB) maxB = b;
        }

        const rangeR = maxR - minR;
        const rangeG = maxG - minG;
        const rangeB = maxB - minB;
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
      for (const p of b) {
        avg[0] += p[0]; avg[1] += p[1]; avg[2] += p[2];
      }
      const r = Math.round(avg[0] / b.length);
      const g = Math.round(avg[1] / b.length);
      const blue = Math.round(avg[2] / b.length);
      return {
        rgb: [r, g, blue],
        lab: rgbToLab([r, g, blue]),
        hex: `#${[r, g, blue].map(c => c.toString(16).padStart(2, '0')).join('')}`
      };
    });
  }

  /**
   * 核心像素化处理
   */
  processImage({
    targetWidth = 32,
    targetHeight = 32,
    brightness = 0,
    contrast = 0,
    saturation = 0,
    mode = 'true_color',   // 'true_color' (高保真油画), 'adaptive' (自适应油画), 'block' (MC方块)
    dithering = 'none',    // 'none', 'subtle', 'floyd'
    ditherStrength = 0.5,
    aspectRatioMode = 'cover'
  }) {
    if (!this.sourceImage) return null;

    // 1. 高精度双线性/区域平均下采样
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

    // 2. 亮度、对比度、饱和度微调 (保持色彩中立，不歪曲原图色相)
    const cFactor = (259 * (contrast + 255)) / (255 * (259 - contrast));
    const sFactor = (saturation + 100) / 100;

    for (let i = 0; i < data.length; i += 4) {
      let r = data[i];
      let g = data[i + 1];
      let b = data[i + 2];

      if (brightness !== 0) {
        r += brightness * 2.55;
        g += brightness * 2.55;
        b += brightness * 2.55;
      }

      if (contrast !== 0) {
        r = cFactor * (r - 128) + 128;
        g = cFactor * (g - 128) + 128;
        b = cFactor * (b - 128) + 128;
      }

      if (saturation !== 0) {
        const gray = 0.2989 * r + 0.5870 * g + 0.1140 * b;
        r = gray + (r - gray) * sFactor;
        g = gray + (g - gray) * sFactor;
        b = gray + (b - gray) * sFactor;
      }

      data[i] = Math.min(255, Math.max(0, Math.round(r)));
      data[i + 1] = Math.min(255, Math.max(0, Math.round(g)));
      data[i + 2] = Math.min(255, Math.max(0, Math.round(b)));
    }

    // 3. 根据模式处理调色板与像素网格
    const grid = [];

    if (mode === 'true_color') {
      // 模式 A：100% 真彩油画模式 (精确对应原图每一个像素真实色彩)
      for (let y = 0; y < targetHeight; y++) {
        grid[y] = [];
        for (let x = 0; x < targetWidth; x++) {
          const idx = (y * targetWidth + x) * 4;
          const r = data[idx];
          const g = data[idx + 1];
          const b = data[idx + 2];
          grid[y][x] = {
            rgb: [r, g, b],
            hex: `#${[r, g, b].map(c => c.toString(16).padStart(2, '0')).join('')}`
          };
        }
      }
    } else {
      // 模式 B 或 C：自适应调色板或 MC 原版方块匹配
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

          let closest = palette[0];
          let minDist = Infinity;

          for (const item of palette) {
            const dist = colorDistanceLab(targetLab, item.lab);
            if (dist < minDist) {
              minDist = dist;
              closest = item;
            }
          }

          grid[y][x] = closest;

          // 若开启抖动，限制扩散幅度防止偏色扩散
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
   */
  renderToCanvas(result, {
    scale = 16,
    showFrame = true,
    showWall = true,
    useBlockTexture = false
  } = {}) {
    if (!result || !result.grid) return null;

    const { width, height, grid, mode } = result;
    const canvas = document.createElement('canvas');

    const frameThickness = showFrame ? Math.max(12, Math.floor(scale * 0.9)) : 0;
    const wallPadding = showWall ? 40 : 0;

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

    // 1. 石砖墙背景
    if (showWall) {
      ctx.fillStyle = '#666666';
      ctx.fillRect(0, 0, totalW, totalH);

      ctx.fillStyle = '#333333';
      for (let y = 0; y < totalH; y += 32) {
        ctx.fillRect(0, y, totalW, 2);
      }
      for (let y = 0; y < totalH; y += 32) {
        const offset = ((y / 32) % 2 === 0) ? 0 : 32;
        for (let x = offset; x < totalW; x += 64) {
          ctx.fillRect(x, y, 2, 32);
        }
      }
    }

    // 2. 原版黄桦木画框 (Kristoffer Oak Frame)
    if (showFrame) {
      const fx = startX;
      const fy = startY;
      const fw = artWidth + frameThickness * 2;
      const fh = artHeight + frameThickness * 2;

      // 投影
      ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
      ctx.fillRect(fx + 6, fy + 6, fw, fh);

      // 深色木底
      ctx.fillStyle = '#2c1e11';
      ctx.fillRect(fx, fy, fw, fh);

      // 黄桦木主色
      ctx.fillStyle = '#8f683a';
      ctx.fillRect(fx + 3, fy + 3, fw - 6, fh - 6);

      // 顶部与左侧高光
      ctx.fillStyle = '#bfa16f';
      ctx.fillRect(fx + 2, fy + 2, fw - 4, 3);
      ctx.fillRect(fx + 2, fy + 2, 3, fh - 4);

      // 底部与右侧暗影
      ctx.fillStyle = '#442d17';
      ctx.fillRect(fx + 2, fy + fh - 5, fw - 4, 3);
      ctx.fillRect(fx + fw - 5, fy + 2, 3, fh - 4);

      // 内框凹陷阴影
      ctx.fillStyle = '#150d07';
      ctx.fillRect(fx + frameThickness - 3, fy + frameThickness - 3, artWidth + 6, artHeight + 6);
    }

    // 3. 绘制核心像素画
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
