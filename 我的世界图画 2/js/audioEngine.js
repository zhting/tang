/**
 * Web Audio API 音频合成引擎
 * 模拟 Minecraft 原汁原味的声音效果（点击、放置方块、经验拾取、成就达成等）
 */

class AudioEngine {
  constructor() {
    this.ctx = null;
    this.enabled = true;
    this.initAudioContext = this.initAudioContext.bind(this);
    // 监听用户首次交互以解锁 AudioContext
    window.addEventListener('click', this.initAudioContext, { once: true });
    window.addEventListener('keydown', this.initAudioContext, { once: true });
  }

  initAudioContext() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  ensureContext() {
    if (!this.ctx) {
      this.initAudioContext();
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  // 1. Minecraft 经典按钮点击音 (Click)
  playClick() {
    if (!this.enabled) return;
    this.ensureContext();
    if (!this.ctx) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(1200, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(300, this.ctx.currentTime + 0.04);

    gain.gain.setValueAtTime(0.3, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.04);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start();
    osc.stop(this.ctx.currentTime + 0.04);
  }

  // 2. 放置方块声音 (Place Block: 羊毛/石头等)
  playBlockPlace(blockType = 'wool') {
    if (!this.enabled) return;
    this.ensureContext();
    if (!this.ctx) return;

    const bufferSize = this.ctx.sampleRate * 0.08;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);

    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    // 低通滤波模拟不同方块材质的沉闷打击感
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    
    if (blockType === 'wool') {
      filter.frequency.setValueAtTime(450, this.ctx.currentTime);
      filter.frequency.linearRampToValueAtTime(120, this.ctx.currentTime + 0.08);
    } else if (blockType === 'stone' || blockType === 'ore') {
      filter.frequency.setValueAtTime(1200, this.ctx.currentTime);
      filter.frequency.linearRampToValueAtTime(300, this.ctx.currentTime + 0.08);
    } else {
      filter.frequency.setValueAtTime(700, this.ctx.currentTime);
      filter.frequency.linearRampToValueAtTime(200, this.ctx.currentTime + 0.08);
    }

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.4, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.08);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);

    noise.start();
    noise.stop(this.ctx.currentTime + 0.08);
  }

  // 3. 经验球拾取音效 (Orb / Ting)
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

  // 4. 成就达成 / 关卡完成音效 (Level Up / Challenge Complete)
  playChallengeComplete() {
    if (!this.enabled) return;
    this.ensureContext();
    if (!this.ctx) return;

    const notes = [261.63, 329.63, 392.00, 523.25, 659.25, 783.99]; // C, E, G, C5, E5, G5
    const now = this.ctx.currentTime;

    notes.forEach((freq, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const startTime = now + idx * 0.08;
      const duration = 0.28;

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, startTime);

      gain.gain.setValueAtTime(0.3, startTime);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(startTime);
      osc.stop(startTime + duration);
    });
  }

  // 5. 拍照/画作生成音效 (Painting Generated)
  playGenerate() {
    if (!this.enabled) return;
    this.ensureContext();
    if (!this.ctx) return;

    const now = this.ctx.currentTime;
    [400, 600, 900].forEach((freq, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const startTime = now + idx * 0.06;

      osc.type = 'square';
      osc.frequency.setValueAtTime(freq, startTime);

      gain.gain.setValueAtTime(0.15, startTime);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.1);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(startTime);
      osc.stop(startTime + 0.1);
    });
  }
}

export const sound = new AudioEngine();
