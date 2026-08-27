/**
 * Minecraft 方块拼搭 / 像素画填色小游戏核心逻辑
 */

import { sound } from './audioEngine.js';
import { getBlockTextureCanvas } from './blocksData.js';

export class BuildGame {
  constructor({ container, onProgress, onComplete }) {
    this.container = container;
    this.onProgress = onProgress || (() => {});
    this.onComplete = onComplete || (() => {});

    this.targetGridResult = null;
    this.currentGrid = []; // 玩家当前已放置的方块
    this.selectedBlock = null;
    this.selectedBlockIndex = 0;
    this.usedBlocksList = [];
    this.scale = 20; // 每个格子的渲染大小
    this.isDragging = false;
    this.dragMode = 'place'; // 'place' or 'erase'
    this.highlightActive = true; // 是否高亮当前选中方块位置
    
    this.timer = 0;
    this.timerInterval = null;
    this.isCompleted = false;

    this.canvas = document.createElement('canvas');
    this.ctx = this.canvas.getContext('2d');
    this.setupEventListeners();
  }

  setupEventListeners() {
    this.canvas.addEventListener('mousedown', (e) => this.handleMouseDown(e));
    window.addEventListener('mousemove', (e) => this.handleMouseMove(e));
    window.addEventListener('mouseup', () => this.handleMouseUp());
    this.canvas.addEventListener('contextmenu', (e) => {
      e.preventDefault();
      this.handleRightClick(e);
    });

    // 触屏支持
    this.canvas.addEventListener('touchstart', (e) => this.handleTouchStart(e), { passive: false });
    this.canvas.addEventListener('touchmove', (e) => this.handleTouchMove(e), { passive: false });
    this.canvas.addEventListener('touchend', () => this.handleMouseUp());

    // 快捷键 1-9 切换物品栏
    window.addEventListener('keydown', (e) => {
      const num = parseInt(e.key);
      if (num >= 1 && num <= 9 && this.usedBlocksList.length >= num) {
        this.selectBlockByIndex(num - 1);
      }
    });
  }

  startLevel(gridResult) {
    this.targetGridResult = gridResult;
    const { width, height } = gridResult;
    this.isCompleted = false;
    this.timer = 0;

    if (this.timerInterval) clearInterval(this.timerInterval);
    this.timerInterval = setInterval(() => {
      if (!this.isCompleted) {
        this.timer++;
        this.updateStats();
      }
    }, 1000);

    // 初始化空白网格
    this.currentGrid = [];
    for (let y = 0; y < height; y++) {
      this.currentGrid[y] = new Array(width).fill(null);
    }

    // 动态计算适合屏幕的格点尺寸
    const maxViewSize = Math.min(window.innerWidth * 0.7, window.innerHeight * 0.65);
    this.scale = Math.max(14, Math.min(32, Math.floor(maxViewSize / Math.max(width, height))));

    this.canvas.width = width * this.scale;
    this.canvas.height = height * this.scale;

    this.usedBlocksList = gridResult.usedBlocks || [];
    if (this.usedBlocksList.length > 0) {
      this.selectBlockByIndex(0);
    }

    this.render();
    this.updateStats();
  }

  selectBlockByIndex(index) {
    if (index >= 0 && index < this.usedBlocksList.length) {
      this.selectedBlockIndex = index;
      this.selectedBlock = this.usedBlocksList[index];
      sound.playClick();
      this.renderHotbarUI();
      this.render();
    }
  }

  getGridCoords(e) {
    const rect = this.canvas.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    const x = Math.floor((clientX - rect.left) / (rect.width / this.targetGridResult.width));
    const y = Math.floor((clientY - rect.top) / (rect.height / this.targetGridResult.height));
    return { x, y };
  }

  handleMouseDown(e) {
    if (!this.targetGridResult || this.isCompleted) return;
    const { x, y } = this.getGridCoords(e);
    if (e.button === 2) {
      // 右键擦除
      this.dragMode = 'erase';
      this.eraseBlock(x, y);
    } else {
      this.dragMode = 'place';
      this.placeBlock(x, y);
    }
    this.isDragging = true;
  }

  handleMouseMove(e) {
    if (!this.isDragging || !this.targetGridResult || this.isCompleted) return;
    const { x, y } = this.getGridCoords(e);
    if (this.dragMode === 'place') {
      this.placeBlock(x, y);
    } else {
      this.eraseBlock(x, y);
    }
  }

  handleMouseUp() {
    this.isDragging = false;
  }

  handleRightClick(e) {
    if (!this.targetGridResult || this.isCompleted) return;
    const { x, y } = this.getGridCoords(e);
    this.eraseBlock(x, y);
  }

  handleTouchStart(e) {
    e.preventDefault();
    if (!this.targetGridResult || this.isCompleted) return;
    const { x, y } = this.getGridCoords(e);
    this.isDragging = true;
    this.dragMode = 'place';
    this.placeBlock(x, y);
  }

  handleTouchMove(e) {
    e.preventDefault();
    if (!this.isDragging || !this.targetGridResult || this.isCompleted) return;
    const { x, y } = this.getGridCoords(e);
    this.placeBlock(x, y);
  }

  placeBlock(x, y) {
    if (!this.targetGridResult || !this.selectedBlock) return;
    const { width, height, grid: targetGrid } = this.targetGridResult;

    if (x < 0 || x >= width || y < 0 || y >= height) return;

    // 如果该位置需要的就是当前选中的方块
    const correctBlock = targetGrid[y][x];
    if (correctBlock.id === this.selectedBlock.id) {
      if (!this.currentGrid[y][x] || this.currentGrid[y][x].id !== this.selectedBlock.id) {
        this.currentGrid[y][x] = this.selectedBlock;
        sound.playBlockPlace(this.selectedBlock.group);
        this.render();
        this.checkProgress();
      }
    } else {
      // 放置了错误的方块或已放过
      if (!this.currentGrid[y][x]) {
        // 允许试错，但给予音效反馈
        this.currentGrid[y][x] = this.selectedBlock;
        sound.playBlockPlace('stone');
        this.render();
        this.checkProgress();
      }
    }
  }

  eraseBlock(x, y) {
    if (!this.targetGridResult) return;
    const { width, height } = this.targetGridResult;
    if (x < 0 || x >= width || y < 0 || y >= height) return;

    if (this.currentGrid[y][x]) {
      this.currentGrid[y][x] = null;
      sound.playBlockPlace('stone');
      this.render();
      this.checkProgress();
    }
  }

  // 一键填充当前选中方块（魔法助手）
  autoFillCurrentBlock() {
    if (!this.targetGridResult || !this.selectedBlock || this.isCompleted) return;
    const { width, height, grid: targetGrid } = this.targetGridResult;
    let placedCount = 0;

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        if (targetGrid[y][x].id === this.selectedBlock.id && !this.currentGrid[y][x]) {
          this.currentGrid[y][x] = this.selectedBlock;
          placedCount++;
        }
      }
    }

    if (placedCount > 0) {
      sound.playOrb();
      this.render();
      this.checkProgress();
    }
  }

  // 一键全部拼好（快速预览）
  autoCompleteAll() {
    if (!this.targetGridResult || this.isCompleted) return;
    const { width, height, grid: targetGrid } = this.targetGridResult;
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        this.currentGrid[y][x] = targetGrid[y][x];
      }
    }
    this.render();
    this.checkProgress();
  }

  checkProgress() {
    if (!this.targetGridResult) return;
    const { width, height, grid: targetGrid, totalBlocks } = this.targetGridResult;
    let correctCount = 0;

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        if (this.currentGrid[y][x] && this.currentGrid[y][x].id === targetGrid[y][x].id) {
          correctCount++;
        }
      }
    }

    const percentage = Math.floor((correctCount / totalBlocks) * 100);
    this.updateStats(percentage, correctCount, totalBlocks);

    if (correctCount === totalBlocks && !this.isCompleted) {
      this.isCompleted = true;
      if (this.timerInterval) clearInterval(this.timerInterval);
      sound.playChallengeComplete();
      this.onComplete({
        timeSeconds: this.timer,
        totalBlocks
      });
    }
  }

  updateStats(percentage = null, correct = null, total = null) {
    const p = percentage !== null ? percentage : this.getPercentage();
    this.onProgress({
      percentage: p,
      timer: this.timer,
      formattedTime: this.formatTime(this.timer),
      selectedBlock: this.selectedBlock,
      isCompleted: this.isCompleted
    });
    this.renderHotbarUI();
  }

  getPercentage() {
    if (!this.targetGridResult) return 0;
    const { width, height, grid: targetGrid, totalBlocks } = this.targetGridResult;
    let correct = 0;
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        if (this.currentGrid[y][x] && this.currentGrid[y][x].id === targetGrid[y][x].id) {
          correct++;
        }
      }
    }
    return Math.floor((correct / totalBlocks) * 100);
  }

  formatTime(sec) {
    const m = Math.floor(sec / 60).toString().padStart(2, '0');
    const s = (sec % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  }

  render() {
    if (!this.targetGridResult) return;
    const { width, height, grid: targetGrid } = this.targetGridResult;
    const s = this.scale;

    this.ctx.fillStyle = '#1e1e24';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const px = x * s;
        const py = y * s;
        const targetBlock = targetGrid[y][x];
        const currentBlock = this.currentGrid[y][x];

        if (currentBlock) {
          // 玩家已放置方块
          const tex = getBlockTextureCanvas(currentBlock);
          this.ctx.drawImage(tex, 0, 0, 16, 16, px, py, s, s);

          // 若放错则显示红叉警告
          if (currentBlock.id !== targetBlock.id) {
            this.ctx.strokeStyle = '#e74c3c';
            this.ctx.lineWidth = 2;
            this.ctx.beginPath();
            this.ctx.moveTo(px + 2, py + 2);
            this.ctx.lineTo(px + s - 2, py + s - 2);
            this.ctx.moveTo(px + s - 2, py + 2);
            this.ctx.lineTo(px + 2, py + s - 2);
            this.ctx.stroke();
          }
        } else {
          // 未放置格子，显示半透明占位或底纹
          this.ctx.fillStyle = (x + y) % 2 === 0 ? '#2c2d35' : '#23242b';
          this.ctx.fillRect(px, py, s, s);

          // 如果开启了高亮并且当前格子是选中的方块
          if (this.highlightActive && this.selectedBlock && targetBlock.id === this.selectedBlock.id) {
            this.ctx.fillStyle = 'rgba(255, 255, 255, 0.28)';
            this.ctx.fillRect(px, py, s, s);
            this.ctx.strokeStyle = '#ffd32a';
            this.ctx.lineWidth = 1.5;
            this.ctx.strokeRect(px + 0.5, py + 0.5, s - 1, s - 1);
          }
        }

        // 网格细线
        this.ctx.strokeStyle = 'rgba(0, 0, 0, 0.25)';
        this.ctx.lineWidth = 1;
        this.ctx.strokeRect(px, py, s, s);
      }
    }
  }

  renderHotbarUI() {
    const hotbarElem = document.getElementById('game-hotbar');
    if (!hotbarElem || !this.targetGridResult) return;

    hotbarElem.innerHTML = '';
    const { width, height, grid: targetGrid } = this.targetGridResult;

    // 统计每种方块的完成进度
    this.usedBlocksList.forEach((block, idx) => {
      let placed = 0;
      let total = block.count;
      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          if (targetGrid[y][x].id === block.id && this.currentGrid[y][x] && this.currentGrid[y][x].id === block.id) {
            placed++;
          }
        }
      }

      const slot = document.createElement('div');
      const isSelected = this.selectedBlock && this.selectedBlock.id === block.id;
      const isDone = placed >= total;

      slot.className = `hotbar-slot ${isSelected ? 'selected' : ''} ${isDone ? 'done' : ''}`;
      slot.title = `${block.name} (${placed}/${total})`;

      const iconCanvas = getBlockTextureCanvas(block);
      const img = document.createElement('img');
      img.src = iconCanvas.toDataURL();
      img.className = 'hotbar-icon';

      const countBadge = document.createElement('span');
      countBadge.className = 'hotbar-count';
      countBadge.innerText = isDone ? '✓' : (total - placed);

      if (idx < 9) {
        const keyNum = document.createElement('span');
        keyNum.className = 'hotbar-key';
        keyNum.innerText = idx + 1;
        slot.appendChild(keyNum);
      }

      slot.appendChild(img);
      slot.appendChild(countBadge);

      slot.addEventListener('click', () => {
        this.selectBlockByIndex(idx);
      });

      hotbarElem.appendChild(slot);
    });
  }
}
