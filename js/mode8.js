/**
 * 积木游戏 - 第八模式：坚果保龄球（种植版）
 * 100% 还原《植物大战僵尸》原版体验：
 * 
 * 1. 原版开始界面：
 *    - 原版墓碑草坪主菜单
 *    - 左上角加入“坚果保龄球种植版”专属招牌
 *    - 提供冒险模式、玩玩小游戏、生存无尽模式、植物与僵尸图鉴
 * 
 * 2. 原版背景音乐系统（Web Audio API 高保真合成）：
 *    - 主界面原版主题曲 & 战斗专属神曲《Loonboon》(坚果保龄球)
 *    - 随时支持 🎵 音乐静音 / 开启 与 🔊 音效静音 / 开启
 * 
 * 3. 核心植物与机制：
 *    - 大嘴花坚果 (200☀️)：1.5s 跳 1 格，20% 秒吞 / 80% 咀嚼 20s，50% 增长一圈（食量+1、间隔+1s、血量+200），尽头 50% 折返巡逻循环
 *    - 魅惑坚果 (125☀️)：3×3 范围无伤魅惑，被魅惑僵尸向右进攻
 *    - 普通坚果 (50☀️)：400 伤害，45° 斜向折射弹跳，边缘反弹
 *    - 巨型坚果 (100☀️)：碾压整行所有僵尸
 *    - 经典植物：向日葵、豌豆射手、樱桃炸弹、火爆辣椒、土豆地雷
 * 
 * 4. 丰富僵尸图鉴：
 *    - 普通、旗帜、路障、铁桶、撑杆、读报、橄榄球、舞王、巨人僵尸 (Gargantuar)、僵王博士 (Dr. Zomboss)
 * 
 * 5. 棋盘与倍速：
 *    - 原版 5×9 草坪、第 3 列红线限制、整排数列标注、5 条车道除草机、1x/2x/3x 倍速切换
 */

(function () {
    'use strict';

    // 棋盘常量
    const ROWS = 5;
    const COLS = 9;
    const RED_LINE_COL = 3; // 红线在第 3 列右侧（索引 0, 1, 2 为种植区）

    // ==========================================
    // 音频引擎与原版 BGM 合成器
    // ==========================================
    let audioCtx = null;
    let bgmInterval = null;
    let currentBgmTrack = null;

    const soundSettings = {
        bgmMuted: localStorage.getItem('pvz_bgm_muted') === 'true',
        sfxMuted: localStorage.getItem('pvz_sfx_muted') === 'true'
    };

    function getAudioContext() {
        if (!audioCtx) {
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            if (AudioContext) audioCtx = new AudioContext();
        }
        if (audioCtx && audioCtx.state === 'suspended') {
            audioCtx.resume();
        }
        return audioCtx;
    }

    function toggleBGM() {
        soundSettings.bgmMuted = !soundSettings.bgmMuted;
        localStorage.setItem('pvz_bgm_muted', soundSettings.bgmMuted);
        if (soundSettings.bgmMuted) {
            stopBGM();
        } else {
            playBGM(currentBgmTrack || 'title');
        }
    }

    function toggleSFX() {
        soundSettings.sfxMuted = !soundSettings.sfxMuted;
        localStorage.setItem('pvz_sfx_muted', soundSettings.sfxMuted);
    }

    function playSound(type) {
        if (soundSettings.sfxMuted) return;
        try {
            const ctx = getAudioContext();
            if (!ctx) return;
            const now = ctx.currentTime;

            if (type === 'click') {
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                osc.type = 'triangle';
                osc.frequency.setValueAtTime(440, now);
                osc.frequency.exponentialRampToValueAtTime(880, now + 0.06);
                gain.gain.setValueAtTime(0.2, now);
                gain.gain.exponentialRampToValueAtTime(0.01, now + 0.06);
                osc.connect(gain);
                gain.connect(ctx.destination);
                osc.start(now);
                osc.stop(now + 0.06);
            } else if (type === 'plant') {
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                osc.type = 'triangle';
                osc.frequency.setValueAtTime(220, now);
                osc.frequency.exponentialRampToValueAtTime(540, now + 0.1);
                gain.gain.setValueAtTime(0.25, now);
                gain.gain.exponentialRampToValueAtTime(0.01, now + 0.12);
                osc.connect(gain);
                gain.connect(ctx.destination);
                osc.start(now);
                osc.stop(now + 0.12);
            } else if (type === 'jump') {
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                osc.type = 'sine';
                osc.frequency.setValueAtTime(180, now);
                osc.frequency.exponentialRampToValueAtTime(360, now + 0.14);
                gain.gain.setValueAtTime(0.18, now);
                gain.gain.exponentialRampToValueAtTime(0.01, now + 0.14);
                osc.connect(gain);
                gain.connect(ctx.destination);
                osc.start(now);
                osc.stop(now + 0.14);
            } else if (type === 'chomp') {
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                osc.type = 'sawtooth';
                osc.frequency.setValueAtTime(180, now);
                osc.frequency.exponentialRampToValueAtTime(60, now + 0.12);
                gain.gain.setValueAtTime(0.3, now);
                gain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
                osc.connect(gain);
                gain.connect(ctx.destination);
                osc.start(now);
                osc.stop(now + 0.15);
            } else if (type === 'gulp') {
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                osc.type = 'sine';
                osc.frequency.setValueAtTime(340, now);
                osc.frequency.exponentialRampToValueAtTime(120, now + 0.22);
                gain.gain.setValueAtTime(0.3, now);
                gain.gain.exponentialRampToValueAtTime(0.01, now + 0.25);
                osc.connect(gain);
                gain.connect(ctx.destination);
                osc.start(now);
                osc.stop(now + 0.25);
            } else if (type === 'grow') {
                [330, 440, 550, 660].forEach((f, i) => {
                    const osc = ctx.createOscillator();
                    const gain = ctx.createGain();
                    osc.type = 'triangle';
                    osc.frequency.setValueAtTime(f, now + i * 0.06);
                    gain.gain.setValueAtTime(0.25, now + i * 0.06);
                    gain.gain.exponentialRampToValueAtTime(0.01, now + i * 0.06 + 0.3);
                    osc.connect(gain);
                    gain.connect(ctx.destination);
                    osc.start(now + i * 0.06);
                    osc.stop(now + i * 0.06 + 0.3);
                });
            } else if (type === 'strike') {
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                osc.type = 'square';
                osc.frequency.setValueAtTime(130, now);
                osc.frequency.exponentialRampToValueAtTime(40, now + 0.2);
                gain.gain.setValueAtTime(0.35, now);
                gain.gain.exponentialRampToValueAtTime(0.01, now + 0.25);
                osc.connect(gain);
                gain.connect(ctx.destination);
                osc.start(now);
                osc.stop(now + 0.25);
            } else if (type === 'hypno') {
                [587, 740, 880, 1174].forEach((f, i) => {
                    const osc = ctx.createOscillator();
                    const gain = ctx.createGain();
                    osc.type = 'sine';
                    osc.frequency.setValueAtTime(f, now + i * 0.05);
                    gain.gain.setValueAtTime(0.2, now + i * 0.05);
                    gain.gain.exponentialRampToValueAtTime(0.01, now + i * 0.05 + 0.4);
                    osc.connect(gain);
                    gain.connect(ctx.destination);
                    osc.start(now + i * 0.05);
                    osc.stop(now + i * 0.05 + 0.4);
                });
            } else if (type === 'sun') {
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                osc.type = 'sine';
                osc.frequency.setValueAtTime(659, now);
                osc.frequency.setValueAtTime(880, now + 0.08);
                gain.gain.setValueAtTime(0.25, now);
                gain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
                osc.connect(gain);
                gain.connect(ctx.destination);
                osc.start(now);
                osc.stop(now + 0.2);
            } else if (type === 'explosion') {
                // 樱桃炸弹 / 土豆地雷爆炸震响
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                osc.type = 'sawtooth';
                osc.frequency.setValueAtTime(100, now);
                osc.frequency.exponentialRampToValueAtTime(25, now + 0.45);
                gain.gain.setValueAtTime(0.5, now);
                gain.gain.exponentialRampToValueAtTime(0.01, now + 0.5);
                osc.connect(gain);
                gain.connect(ctx.destination);
                osc.start(now);
                osc.stop(now + 0.5);
            } else if (type === 'mower') {
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                osc.type = 'sawtooth';
                osc.frequency.setValueAtTime(90, now);
                osc.frequency.linearRampToValueAtTime(160, now + 1.0);
                gain.gain.setValueAtTime(0.35, now);
                gain.gain.exponentialRampToValueAtTime(0.01, now + 1.2);
                osc.connect(gain);
                gain.connect(ctx.destination);
                osc.start(now);
                osc.stop(now + 1.2);
            } else if (type === 'hugewave') {
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                osc.type = 'sawtooth';
                osc.frequency.setValueAtTime(70, now);
                osc.frequency.exponentialRampToValueAtTime(45, now + 0.8);
                gain.gain.setValueAtTime(0.4, now);
                gain.gain.exponentialRampToValueAtTime(0.01, now + 1.0);
                osc.connect(gain);
                gain.connect(ctx.destination);
                osc.start(now);
                osc.stop(now + 1.0);
            } else if (type === 'win') {
                [440, 554, 659, 880].forEach((f, i) => {
                    const osc = ctx.createOscillator();
                    const gain = ctx.createGain();
                    osc.type = 'triangle';
                    osc.frequency.setValueAtTime(f, now + i * 0.12);
                    gain.gain.setValueAtTime(0.3, now + i * 0.12);
                    gain.gain.exponentialRampToValueAtTime(0.01, now + i * 0.12 + 0.5);
                    osc.connect(gain);
                    gain.connect(ctx.destination);
                    osc.start(now + i * 0.12);
                    osc.stop(now + i * 0.12 + 0.5);
                });
            }
        } catch (e) {
            console.warn('Audio play error:', e);
        }
    }

    // PVZ 原版背景音乐合成系统 (Loonboon 保龄球主题曲 & Title 主界面)
    function playBGM(track = 'battle') {
        currentBgmTrack = track;
        if (soundSettings.bgmMuted) return;

        stopBGM();
        const ctx = getAudioContext();
        if (!ctx) return;

        let step = 0;
        // Loonboon 经典旋律序列 (Hz 与 音长)
        const battleMelody = [
            261.63, 293.66, 329.63, 392.00, 329.63, 293.66, 261.63, 196.00,
            261.63, 329.63, 392.00, 523.25, 493.88, 392.00, 329.63, 293.66,
            349.23, 392.00, 440.00, 523.25, 440.00, 392.00, 349.23, 261.63,
            293.66, 349.23, 440.00, 587.33, 523.25, 440.00, 392.00, 329.63
        ];
        // Title 经典主菜单旋律
        const titleMelody = [
            196.00, 261.63, 329.63, 392.00, 329.63, 261.63, 196.00, 164.81,
            220.00, 261.63, 349.23, 440.00, 392.00, 329.63, 261.63, 220.00
        ];

        const melody = (track === 'title' ? titleMelody : battleMelody);
        const bpm = (track === 'title' ? 100 : 132);
        const intervalMs = (60 / bpm) * 1000 * 0.5;

        bgmInterval = setInterval(() => {
            if (soundSettings.bgmMuted) return;
            try {
                const now = ctx.currentTime;
                const freq = melody[step % melody.length];

                // 主音轨 (马林巴琴木质音色)
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                osc.type = (track === 'title' ? 'triangle' : 'sine');
                osc.frequency.setValueAtTime(freq, now);
                gain.gain.setValueAtTime(0.08, now);
                gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
                osc.connect(gain);
                gain.connect(ctx.destination);
                osc.start(now);
                osc.stop(now + 0.2);

                // 低音贝斯音轨
                if (step % 2 === 0) {
                    const bass = ctx.createOscillator();
                    const bassGain = ctx.createGain();
                    bass.type = 'triangle';
                    bass.frequency.setValueAtTime(freq * 0.5, now);
                    bassGain.gain.setValueAtTime(0.1, now);
                    bassGain.gain.exponentialRampToValueAtTime(0.001, now + 0.28);
                    bass.connect(bassGain);
                    bassGain.connect(ctx.destination);
                    bass.start(now);
                    bass.stop(now + 0.28);
                }

                step++;
            } catch (e) {}
        }, intervalMs);
    }

    function stopBGM() {
        if (bgmInterval) {
            clearInterval(bgmInterval);
            bgmInterval = null;
        }
    }

    // ==========================================
    // 贴图加载器与抠图处理
    // ==========================================
    const textures = {
        chomper_nut: null,
        hypno_nut: null,
        wallnut: null,
        zombie_normal: null,
        zombie_conehead: null
    };

    function loadAndFilterTexture(key, url) {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.src = url;
        img.onload = () => {
            try {
                const off = document.createElement('canvas');
                off.width = img.width;
                off.height = img.height;
                const octx = off.getContext('2d');
                octx.drawImage(img, 0, 0);
                const idata = octx.getImageData(0, 0, off.width, off.height);
                const data = idata.data;

                const r0 = data[0], g0 = data[1], b0 = data[2];
                const isGreenish = (g0 > 100 && g0 > r0 * 1.15 && g0 > b0 * 1.15);
                const isDarkGreen = (g0 > 40 && g0 > r0 && g0 > b0 && r0 < 100 && b0 < 100);
                const isWhite = (r0 > 235 && g0 > 235 && b0 > 235);

                if (isGreenish || isDarkGreen || isWhite) {
                    for (let i = 0; i < data.length; i += 4) {
                        const r = data[i], g = data[i+1], b = data[i+2];
                        if (isGreenish || isDarkGreen) {
                            if (g > 70 && g > r * 1.08 && g > b * 1.08 && (g - r > 15 || g - b > 15)) {
                                data[i+3] = 0;
                            }
                        } else if (isWhite) {
                            if (r > 230 && g > 230 && b > 230) {
                                data[i+3] = 0;
                            }
                        }
                    }
                    octx.putImageData(idata, 0, 0);
                }
                textures[key] = off;
            } catch (err) {
                textures[key] = img;
            }
        };
    }

    loadAndFilterTexture('chomper_nut', 'assets/mode8/chomper_nut.png?v=2');
    loadAndFilterTexture('hypno_nut', 'assets/mode8/hypno_nut.png?v=2');
    loadAndFilterTexture('wallnut', 'assets/mode8/wallnut.png?v=2');
    loadAndFilterTexture('zombie_normal', 'assets/mode8/zombie_normal.png?v=2');
    loadAndFilterTexture('zombie_conehead', 'assets/mode8/zombie_conehead.png?v=2');

    // ==========================================
    // 模式八全局状态与实体仓库
    // ==========================================
    const m8 = {
        state: 'title', // 'title', 'playing', 'almanac', 'paused'
        gameModeType: 'adventure', // 'adventure', 'minigame', 'survival'
        level: 1,
        maxLevels: 10,
        speed: 1, // 1, 2, 3 倍速
        sun: 250,
        sunDropTimer: 4.0,
        selectedCard: null,
        
        // 棋盘网格
        grid: { x: 0, y: 0, w: 0, h: 0, cellW: 0, cellH: 0 },

        plants: [],     // 场上植物（大嘴花坚果、向日葵、豌豆射手、土豆雷等）
        projectiles: [],// 魅惑坚果、普通坚果、巨型坚果、豌豆子弹
        zombies: [],    // 敌方与被魅惑僵尸
        suns: [],       // 掉落阳光
        mowers: [],     // 5 条车道的小推车
        effects: [],    // 粒子、弹字、冲击波
        
        // 波次调度
        waveIndex: 0,
        totalWaves: 10,
        waveTimer: 0,
        waveProgress: 0,
        isHugeWaveApproaching: false,
        hugeWaveBannerTimer: 0,
        readyPlantTimer: 0, // "Ready... Set... PLANT!" 入场倒计时

        // 完整植物卡片库
        cards: [
            { id: 'chomper_nut', name: '大嘴花坚果', cost: 200, cooldown: 8.0, currentCd: 0, icon: 'chomper_nut' },
            { id: 'hypno_nut', name: '魅惑坚果', cost: 125, cooldown: 10.0, currentCd: 0, icon: 'hypno_nut' },
            { id: 'wallnut', name: '普通坚果', cost: 50, cooldown: 6.0, currentCd: 0, icon: 'wallnut' },
            { id: 'giant_wallnut', name: '巨型坚果', cost: 100, cooldown: 15.0, currentCd: 0, icon: 'giant_nut' },
            { id: 'sunflower', name: '向日葵', cost: 50, cooldown: 7.0, currentCd: 0, icon: 'sunflower' },
            { id: 'peashooter', name: '豌豆射手', cost: 100, cooldown: 7.0, currentCd: 0, icon: 'peashooter' },
            { id: 'cherry_bomb', name: '樱桃炸弹', cost: 150, cooldown: 20.0, currentCd: 0, icon: 'cherry_bomb' },
            { id: 'jalapeno', name: '火爆辣椒', cost: 125, cooldown: 20.0, currentCd: 0, icon: 'jalapeno' },
            { id: 'potato_mine', name: '土豆地雷', cost: 25, cooldown: 12.0, currentCd: 0, icon: 'potato_mine' }
        ],

        hoverCell: { row: -1, col: -1, valid: false },
        almanacTab: 'plants' // 'plants' | 'zombies'
    };

    // ==========================================
    // 实体类定义
    // ==========================================

    // 1. 大嘴花坚果
    class ChomperNutEntity {
        constructor(row, col) {
            this.type = 'chomper_nut';
            this.row = row;
            this.col = col;
            this.originRow = row;
            this.originCol = col;

            this.hp = 400;
            this.maxHp = 400;
            this.growthLevel = 0;
            this.capacity = 1;
            this.currentStomach = 0;
            this.jumpInterval = 1.5;
            this.jumpTimer = this.jumpInterval;

            this.state = 'idle';
            this.chewTimer = 0;
            this.facing = 1;

            this.jumpProgress = 0;
            this.jumpDuration = 0.35;
            this.fromCol = col;
            this.toCol = col;

            this.mouthOpen = 0;
            this.chewAnimTimer = 0;
            this.auraAngle = 0;
        }

        update(dt) {
            this.auraAngle += dt * 3;

            if (this.state === 'chewing') {
                this.chewTimer -= dt;
                this.chewAnimTimer += dt * 8;
                this.mouthOpen = 0.3 + Math.sin(this.chewAnimTimer) * 0.3;

                if (Math.random() < 0.25) {
                    const pos = getCellCenter(this.row, this.col);
                    m8.effects.push(new Particle(pos.x + (Math.random() - 0.5) * 20, pos.y - 10 + (Math.random() - 0.5) * 15, 'crumb'));
                }

                if (this.currentStomach < this.capacity) {
                    this.checkAndEatTarget();
                }

                if (this.chewTimer <= 0) {
                    this.chewTimer = 0;
                    this.currentStomach = 0;
                    this.state = 'idle';
                    this.mouthOpen = 0;
                    this.jumpTimer = this.jumpInterval * 0.5;
                }
                return;
            }

            if (this.state === 'jumping') {
                this.jumpProgress += dt / this.jumpDuration;
                if (this.jumpProgress >= 1) {
                    this.jumpProgress = 0;
                    this.col = this.toCol;
                    this.state = 'idle';
                    this.onLand();
                }
                return;
            }

            if (this.state === 'idle') {
                this.checkAndEatTarget();
                this.jumpTimer -= dt;
                if (this.jumpTimer <= 0) {
                    this.startJump();
                }
            }
        }

        startJump() {
            let nextCol = this.col + this.facing;
            
            if (this.facing === 1 && nextCol >= COLS) {
                if (Math.random() < 0.5) {
                    this.facing = -1;
                    nextCol = this.col - 1;
                    m8.effects.push(new FloatingText('↩ 掉头巡逻！', getCellCenter(this.row, this.col).x, getCellCenter(this.row, this.col).y - 40, '#ffeb3b'));
                } else {
                    m8.plants = m8.plants.filter(p => p !== this);
                    m8.effects.push(new FloatingText('★ 巡逻圆满完成！', getCellCenter(this.row, this.col).x, getCellCenter(this.row, this.col).y - 40, '#4caf50'));
                    return;
                }
            } else if (this.facing === -1 && nextCol <= this.originCol) {
                this.col = this.originCol;
                this.facing = 1;
                nextCol = this.originCol + 1;
                m8.effects.push(new FloatingText('🔄 回到起点，再次出征！', getCellCenter(this.row, this.col).x, getCellCenter(this.row, this.col).y - 40, '#00e676'));
            }

            this.fromCol = this.col;
            this.toCol = nextCol;
            this.jumpProgress = 0;
            this.state = 'jumping';
            this.jumpTimer = this.jumpInterval;
            playSound('jump');
        }

        onLand() {
            this.checkAndEatTarget();
        }

        checkAndEatTarget() {
            if (this.currentStomach >= this.capacity) return;

            const plantX = getCellCenter(this.row, this.col).x;
            const targetZombies = m8.zombies.filter(z => !z.isHypnotized && z.row === this.row && Math.abs(z.x - plantX) <= (m8.grid.cellW * 0.65) && z.hp > 0);
            const targetPlants = m8.plants.filter(p => p !== this && p.row === this.row && p.col === this.col && p.hp > 0);

            const targets = [...targetZombies, ...targetPlants];
            if (targets.length > 0) {
                this.eat(targets[0]);
            }
        }

        eat(target) {
            playSound('chomp');
            const pos = getCellCenter(this.row, this.col);

            if (target instanceof ChomperNutEntity || target instanceof PlantEntity) {
                m8.plants = m8.plants.filter(p => p !== target);
            } else {
                target.hp = 0;
                m8.zombies = m8.zombies.filter(z => z !== target);
            }

            this.currentStomach++;
            m8.effects.push(new Particle(pos.x, pos.y, 'bite'));

            const isDirectSwallow = (Math.random() < 0.20);
            if (isDirectSwallow) {
                playSound('gulp');
                m8.effects.push(new FloatingText('⚡ 秒吞！无需咀嚼！', pos.x, pos.y - 45, '#ff4081'));
                this.state = 'idle';
                this.currentStomach = 0;
                this.jumpTimer = 0.4;
            } else {
                this.state = 'chewing';
                this.chewTimer = 20.0;
                m8.effects.push(new FloatingText('🍖 大口咀嚼中 (20s)...', pos.x, pos.y - 45, '#ff9800'));
            }

            if (Math.random() < 0.50) {
                this.growOneRing();
            }
        }

        growOneRing() {
            this.growthLevel++;
            this.capacity += 1;
            this.jumpInterval += 1.0;
            this.hp += 200;
            this.maxHp += 200;

            playSound('grow');
            const pos = getCellCenter(this.row, this.col);
            m8.effects.push(new FloatingText(`✨ 增长一圈！(第${this.growthLevel}圈)`, pos.x, pos.y - 70, '#ffd700', 22));
            m8.effects.push(new FloatingText(`+200血量 | 食量+1 | 间隔+1s`, pos.x, pos.y - 92, '#76ff03', 15));
            m8.effects.push(new Particle(pos.x, pos.y, 'grow_ring'));
        }

        getRenderPos() {
            const fromPos = getCellCenter(this.row, this.fromCol);
            const toPos = getCellCenter(this.row, this.toCol);
            
            if (this.state === 'jumping') {
                const t = this.jumpProgress;
                const x = fromPos.x + (toPos.x - fromPos.x) * t;
                const arcH = Math.sin(t * Math.PI) * 45;
                const y = fromPos.y - arcH;
                return { x, y };
            }
            return getCellCenter(this.row, this.col);
        }

        draw(ctx) {
            const pos = this.getRenderPos();
            const scale = 1.0 + this.growthLevel * 0.22;

            ctx.save();
            ctx.translate(pos.x, pos.y);

            if (this.growthLevel > 0) {
                ctx.save();
                ctx.beginPath();
                ctx.arc(0, 0, 36 * scale, 0, Math.PI * 2);
                ctx.strokeStyle = `hsla(${(this.auraAngle * 50) % 360}, 100%, 65%, 0.8)`;
                ctx.lineWidth = 3 + this.growthLevel;
                ctx.setLineDash([8, 6]);
                ctx.stroke();
                ctx.restore();
            }

            ctx.scale(this.facing * scale, scale);

            if (textures.chomper_nut) {
                const w = 70;
                const h = 74;
                ctx.drawImage(textures.chomper_nut, -w/2, -h/2 - 8, w, h);
            } else {
                ctx.beginPath();
                ctx.ellipse(0, 0, 26, 32, 0, 0, Math.PI * 2);
                ctx.fillStyle = '#8e24aa';
                ctx.fill();
                ctx.lineWidth = 3;
                ctx.strokeStyle = '#4a148c';
                ctx.stroke();
            }

            ctx.restore();

            const barW = 50 * scale;
            const barH = 6;
            const barX = pos.x - barW / 2;
            const barY = pos.y - 46 * scale;

            ctx.fillStyle = 'rgba(0,0,0,0.5)';
            ctx.fillRect(barX - 1, barY - 1, barW + 2, barH + 2);
            ctx.fillStyle = '#00e676';
            ctx.fillRect(barX, barY, barW * (this.hp / this.maxHp), barH);

            if (this.state === 'chewing') {
                const chewW = barW;
                const chewY = barY - 8;
                ctx.fillStyle = 'rgba(0,0,0,0.6)';
                ctx.fillRect(barX - 1, chewY - 1, chewW + 2, 6);
                ctx.fillStyle = '#ff9800';
                ctx.fillRect(barX, chewY, chewW * (this.chewTimer / 20.0), 4);

                ctx.fillStyle = '#fff';
                ctx.font = 'bold 11px sans-serif';
                ctx.textAlign = 'center';
                ctx.fillText(`咀嚼 ${Math.ceil(this.chewTimer)}s`, pos.x, chewY - 3);
            }
        }
    }

    // 2. 其它种植植物实体（向日葵、豌豆射手、樱桃炸弹、辣椒、土豆雷）
    class PlantEntity {
        constructor(type, row, col) {
            this.type = type;
            this.row = row;
            this.col = col;
            this.hp = (type === 'potato_mine' ? 100 : 300);
            this.maxHp = this.hp;
            this.shootTimer = 1.4;
            this.sunTimer = 10.0;
            this.armTimer = 8.0; // 土豆雷武装时间
            this.isArmed = (type !== 'potato_mine');
            this.fuseTimer = (type === 'cherry_bomb' ? 1.0 : (type === 'jalapeno' ? 0.8 : 0));
        }

        update(dt) {
            const pos = getCellCenter(this.row, this.col);

            if (this.type === 'sunflower') {
                this.sunTimer -= dt;
                if (this.sunTimer <= 0) {
                    this.sunTimer = 10.0;
                    playSound('sun');
                    m8.suns.push(new SunEntity(pos.x, pos.y, false));
                }
            } else if (this.type === 'peashooter') {
                this.shootTimer -= dt;
                if (this.shootTimer <= 0) {
                    // 检查本行是否有前方僵尸
                    const hasEnemy = m8.zombies.some(z => !z.isHypnotized && z.row === this.row && z.x > pos.x && z.hp > 0);
                    if (hasEnemy) {
                        this.shootTimer = 1.4;
                        playSound('plant');
                        m8.projectiles.push(new PeaProjectile(this.row, pos.x + 20, pos.y - 10));
                    }
                }
            } else if (this.type === 'cherry_bomb') {
                this.fuseTimer -= dt;
                if (this.fuseTimer <= 0) {
                    playSound('explosion');
                    // 3x3 范围 1800 伤害
                    for (const z of m8.zombies) {
                        if (!z.isHypnotized && Math.abs(z.row - this.row) <= 1 && Math.abs(getColFromX(z.x) - this.col) <= 1.5) {
                            z.takeDamage(1800);
                        }
                    }
                    m8.effects.push(new HypnoBlastEffect(pos.x, pos.y));
                    m8.effects.push(new FloatingText('💥 BOOM! 樱桃大爆炸!', pos.x, pos.y - 40, '#ff1744', 24));
                    m8.plants = m8.plants.filter(p => p !== this);
                }
            } else if (this.type === 'jalapeno') {
                this.fuseTimer -= dt;
                if (this.fuseTimer <= 0) {
                    playSound('explosion');
                    // 整行火焰清场
                    for (const z of m8.zombies) {
                        if (!z.isHypnotized && z.row === this.row) {
                            z.takeDamage(1800);
                        }
                    }
                    m8.effects.push(new FloatingText('🔥 火焰烈风！整行清屏！', m8.grid.x + m8.grid.w / 2, pos.y - 20, '#ff3d00', 26));
                    m8.plants = m8.plants.filter(p => p !== this);
                }
            } else if (this.type === 'potato_mine') {
                if (!this.isArmed) {
                    this.armTimer -= dt;
                    if (this.armTimer <= 0) {
                        this.isArmed = true;
                        m8.effects.push(new FloatingText('⚡ 土豆地雷武装就绪！', pos.x, pos.y - 30, '#ffab00', 14));
                    }
                } else {
                    // 触碰引爆
                    for (const z of m8.zombies) {
                        if (!z.isHypnotized && z.row === this.row && Math.abs(z.x - pos.x) < 26) {
                            playSound('explosion');
                            z.takeDamage(1800);
                            m8.effects.push(new Particle(pos.x, pos.y, 'spark'));
                            m8.plants = m8.plants.filter(p => p !== this);
                            break;
                        }
                    }
                }
            }
        }

        draw(ctx) {
            const pos = getCellCenter(this.row, this.col);
            ctx.save();
            ctx.translate(pos.x, pos.y);

            if (this.type === 'sunflower') {
                ctx.fillStyle = '#ffeb3b';
                ctx.beginPath();
                ctx.arc(0, -10, 18, 0, Math.PI * 2);
                ctx.fill();
                ctx.fillStyle = '#795548';
                ctx.beginPath();
                ctx.arc(0, -10, 10, 0, Math.PI * 2);
                ctx.fill();
            } else if (this.type === 'peashooter') {
                ctx.fillStyle = '#4caf50';
                ctx.beginPath();
                ctx.arc(0, -10, 16, 0, Math.PI * 2);
                ctx.fill();
                ctx.fillRect(8, -16, 16, 12);
            } else if (this.type === 'cherry_bomb') {
                ctx.fillStyle = '#d50000';
                ctx.beginPath();
                ctx.arc(-8, -4, 14, 0, Math.PI * 2);
                ctx.arc(10, -8, 14, 0, Math.PI * 2);
                ctx.fill();
            } else if (this.type === 'jalapeno') {
                ctx.fillStyle = '#ff1744';
                ctx.beginPath();
                ctx.ellipse(0, -8, 10, 22, 0, 0, Math.PI * 2);
                ctx.fill();
            } else if (this.type === 'potato_mine') {
                ctx.fillStyle = '#8d6e63';
                ctx.beginPath();
                ctx.arc(0, (this.isArmed ? -6 : 4), 14, 0, Math.PI * 2);
                ctx.fill();
                if (this.isArmed) {
                    ctx.fillStyle = '#f44336';
                    ctx.beginPath();
                    ctx.arc(0, -22, 5, 0, Math.PI * 2);
                    ctx.fill();
                }
            }

            ctx.restore();
        }
    }

    // 3. 保龄球与投射物实体
    class HypnoNutProjectile {
        constructor(row, startCol) {
            this.type = 'hypno_nut';
            this.row = row;
            const pos = getCellCenter(row, startCol);
            this.x = pos.x;
            this.y = pos.y;
            this.vx = 320;
            this.radius = 24;
            this.rotation = 0;
            this.isAlive = true;
        }

        update(dt) {
            this.x += this.vx * dt;
            this.rotation += dt * 12;

            if (Math.random() < 0.4) {
                m8.effects.push(new Particle(this.x - 15, this.y + (Math.random() - 0.5) * 10, 'hypno_trail'));
            }

            for (const z of m8.zombies) {
                if (!z.isHypnotized && z.row === this.row && Math.abs(z.x - this.x) < 32 && z.hp > 0) {
                    this.onHit();
                    break;
                }
            }

            if (this.x > m8.grid.x + m8.grid.w + 60) this.isAlive = false;
        }

        onHit() {
            this.isAlive = false;
            playSound('hypno');

            const impactRow = this.row;
            const impactCol = getColFromX(this.x);

            let count = 0;
            for (const z of m8.zombies) {
                if (!z.isHypnotized && z.hp > 0) {
                    if (Math.abs(z.row - impactRow) <= 1 && Math.abs(getColFromX(z.x) - impactCol) <= 1.5) {
                        z.hypnotize();
                        count++;
                    }
                }
            }

            m8.effects.push(new HypnoBlastEffect(this.x, this.y));
            m8.effects.push(new FloatingText(`🌀 3×3 魅惑爆发！(${count}只叛变)`, this.x, this.y - 45, '#e040fb', 20));
        }

        draw(ctx) {
            ctx.save();
            ctx.translate(this.x, this.y);
            ctx.rotate(this.rotation);

            if (textures.hypno_nut) {
                ctx.drawImage(textures.hypno_nut, -26, -26, 52, 52);
            } else {
                ctx.beginPath();
                ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
                ctx.fillStyle = '#b388ff';
                ctx.fill();
            }
            ctx.restore();
        }
    }

    class WallnutProjectile {
        constructor(row, startCol, isGiant = false) {
            this.type = (isGiant ? 'giant_wallnut' : 'wallnut');
            this.isGiant = isGiant;
            this.row = row;
            const pos = getCellCenter(row, startCol);
            this.x = pos.x;
            this.y = pos.y;
            this.vx = (isGiant ? 240 : 300);
            this.vy = 0;
            this.radius = (isGiant ? 36 : 24);
            this.rotation = 0;
            this.isAlive = true;
        }

        update(dt) {
            this.x += this.vx * dt;
            this.y += this.vy * dt;
            this.rotation += dt * 10;
            this.row = getRowFromY(this.y);

            const minY = m8.grid.y + m8.grid.cellH * 0.4;
            const maxY = m8.grid.y + m8.grid.h - m8.grid.cellH * 0.4;

            if (this.y <= minY && this.vy < 0) {
                this.y = minY;
                this.vy = Math.abs(this.vy);
                playSound('strike');
            } else if (this.y >= maxY && this.vy > 0) {
                this.y = maxY;
                this.vy = -Math.abs(this.vy);
                playSound('strike');
            }

            for (const z of m8.zombies) {
                if (!z.isHypnotized && Math.abs(z.x - this.x) < (this.radius + 10) && Math.abs(z.y - this.y) < 36 && z.hp > 0) {
                    this.onHitZombie(z);
                    if (!this.isGiant) break;
                }
            }

            if (this.x > m8.grid.x + m8.grid.w + 60) this.isAlive = false;
        }

        onHitZombie(zombie) {
            playSound('strike');
            if (this.isGiant) {
                zombie.takeDamage(1800); // 巨型坚果碾压秒杀
                m8.effects.push(new FloatingText('🎳 巨石碾压！-1800', this.x, this.y - 40, '#ff9800', 20));
            } else {
                zombie.takeDamage(400);
                m8.effects.push(new FloatingText('🎳 STRIKE! -400', this.x, this.y - 35, '#ffeb3b', 18));
                
                const speed = 260;
                if (this.vy === 0) {
                    if (this.row === 0) this.vy = speed;
                    else if (this.row === ROWS - 1) this.vy = -speed;
                    else this.vy = (Math.random() < 0.5 ? -speed : speed);
                } else {
                    this.vy = -this.vy;
                }
            }
            m8.effects.push(new Particle(this.x, this.y, 'spark'));
        }

        draw(ctx) {
            ctx.save();
            ctx.translate(this.x, this.y);
            ctx.rotate(this.rotation);

            const scale = (this.isGiant ? 1.6 : 1.0);
            ctx.scale(scale, scale);

            if (textures.wallnut) {
                ctx.drawImage(textures.wallnut, -26, -26, 52, 52);
            } else {
                ctx.beginPath();
                ctx.ellipse(0, 0, 24, 28, 0, 0, Math.PI * 2);
                ctx.fillStyle = '#8d6e63';
                ctx.fill();
            }
            ctx.restore();
        }
    }

    class PeaProjectile {
        constructor(row, x, y) {
            this.row = row;
            this.x = x;
            this.y = y;
            this.vx = 360;
            this.isAlive = true;
        }
        update(dt) {
            this.x += this.vx * dt;
            for (const z of m8.zombies) {
                if (!z.isHypnotized && z.row === this.row && Math.abs(z.x - this.x) < 22 && z.hp > 0) {
                    z.takeDamage(20);
                    this.isAlive = false;
                    m8.effects.push(new Particle(this.x, this.y, 'crumb'));
                    break;
                }
            }
            if (this.x > m8.grid.x + m8.grid.w + 40) this.isAlive = false;
        }
        draw(ctx) {
            ctx.save();
            ctx.beginPath();
            ctx.arc(this.x, this.y, 7, 0, Math.PI * 2);
            ctx.fillStyle = '#76ff03';
            ctx.fill();
            ctx.strokeStyle = '#33691e';
            ctx.lineWidth = 1.5;
            ctx.stroke();
            ctx.restore();
        }
    }

    // 4. 僵尸实体（普通、路障、铁桶、撑杆、读报、橄榄球、舞王、巨人、僵王）
    class ZombieEntity {
        constructor(type, row) {
            this.type = type;
            this.row = row;
            this.col = COLS - 0.2;
            const pos = getCellCenter(row, this.col);
            this.x = pos.x;
            this.y = pos.y;
            this.facing = -1;
            this.isHypnotized = false;

            if (type === 'normal') { this.hp = 200; this.maxHp = 200; this.speed = 18; this.attackDmg = 50; }
            else if (type === 'conehead') { this.hp = 560; this.maxHp = 560; this.speed = 18; this.attackDmg = 50; }
            else if (type === 'buckethead') { this.hp = 1300; this.maxHp = 1300; this.speed = 18; this.attackDmg = 50; }
            else if (type === 'polevaulter') { this.hp = 500; this.maxHp = 500; this.speed = 42; this.hasVaulted = false; this.attackDmg = 50; }
            else if (type === 'newspaper') { this.hp = 350; this.maxHp = 350; this.speed = 16; this.isEnraged = false; this.attackDmg = 60; }
            else if (type === 'football') { this.hp = 1600; this.maxHp = 1600; this.speed = 34; this.attackDmg = 75; }
            else if (type === 'gargantuar') { this.hp = 3000; this.maxHp = 3000; this.speed = 14; this.attackDmg = 400; }
            else if (type === 'zomboss') { this.hp = 6000; this.maxHp = 6000; this.speed = 10; this.attackDmg = 500; }

            this.walkAnim = 0;
            this.eatTimer = 0;
        }

        update(dt) {
            this.walkAnim += dt * (this.speed * 0.2);
            this.col = getColFromX(this.x);

            if (this.isHypnotized) {
                this.x += this.speed * 1.5 * dt;
                const enemy = m8.zombies.find(z => !z.isHypnotized && z.row === this.row && Math.abs(z.x - this.x) < 30 && z.hp > 0);
                if (enemy) {
                    this.eatTimer += dt;
                    if (this.eatTimer >= 0.5) {
                        this.eatTimer = 0;
                        enemy.takeDamage(this.attackDmg);
                        playSound('chomp');
                    }
                }
                if (this.x > m8.grid.x + m8.grid.w + 100) this.hp = 0;
                return;
            }

            // 撑杆僵尸跳跃机制
            if (this.type === 'polevaulter' && !this.hasVaulted) {
                const plantAhead = m8.plants.find(p => p.row === this.row && Math.abs(getCellCenter(p.row, p.col).x - this.x) < 40);
                if (plantAhead) {
                    this.hasVaulted = true;
                    this.speed = 18;
                    this.x -= 65; // 跳过植物
                    playSound('jump');
                    m8.effects.push(new FloatingText('🏃 撑杆跳跃！', this.x, this.y - 40, '#00e5ff', 16));
                }
            }

            // 读报僵尸狂暴机制
            if (this.type === 'newspaper' && !this.isEnraged && this.hp < 150) {
                this.isEnraged = true;
                this.speed = 46;
                m8.effects.push(new FloatingText('😡 报纸被打烂！暴走！', this.x, this.y - 40, '#ff1744', 16));
            }

            const plant = m8.plants.find(p => p.row === this.row && Math.abs(getCellCenter(p.row, p.col).x - this.x) < 28 && p.hp > 0);
            if (plant) {
                this.eatTimer += dt;
                if (this.eatTimer >= 0.5) {
                    this.eatTimer = 0;
                    plant.hp -= this.attackDmg;
                    playSound('chomp');
                    if (plant.hp <= 0) {
                        m8.plants = m8.plants.filter(p => p !== plant);
                    }
                }
            } else {
                this.x -= this.speed * dt;
            }

            if (this.x < m8.grid.x - 10) triggerMower(this.row);
        }

        takeDamage(dmg) {
            this.hp -= dmg;
            if (this.hp <= 0) {
                this.hp = 0;
                m8.effects.push(new Particle(this.x, this.y, 'zombie_die'));
                if (Math.random() < 0.4) {
                    m8.suns.push(new SunEntity(this.x, this.y - 20, false));
                }
            }
        }

        hypnotize() {
            this.isHypnotized = true;
            this.facing = 1;
            m8.effects.push(new Particle(this.x, this.y, 'hypno_spark'));
        }

        draw(ctx) {
            ctx.save();
            ctx.translate(this.x, this.y);

            const scale = (this.type === 'gargantuar' ? 1.6 : (this.type === 'zomboss' ? 2.0 : 1.0));
            ctx.scale(this.facing * scale, scale);

            if (this.isHypnotized) {
                ctx.save();
                ctx.beginPath();
                ctx.arc(0, -20, 36, 0, Math.PI * 2);
                ctx.fillStyle = 'rgba(224, 64, 251, 0.25)';
                ctx.fill();
                ctx.restore();
            }

            ctx.rotate(Math.sin(this.walkAnim) * 0.08);

            if (this.type === 'conehead' && textures.zombie_conehead && this.hp > 200) {
                ctx.drawImage(textures.zombie_conehead, -36, -72, 72, 80);
            } else if (textures.zombie_normal) {
                ctx.drawImage(textures.zombie_normal, -36, -68, 72, 76);
            } else {
                ctx.beginPath();
                ctx.arc(0, -32, 16, 0, Math.PI * 2);
                ctx.fillStyle = (this.isHypnotized ? '#ce93d8' : '#7cb342');
                ctx.fill();
            }

            ctx.restore();

            if (this.maxHp > 200 && this.hp > 0) {
                const barW = 44 * scale;
                const barH = 5;
                const barX = this.x - barW / 2;
                const barY = this.y - 75 * scale;

                ctx.fillStyle = 'rgba(0,0,0,0.5)';
                ctx.fillRect(barX - 1, barY - 1, barW + 2, barH + 2);
                ctx.fillStyle = (this.isHypnotized ? '#e040fb' : '#f44336');
                ctx.fillRect(barX, barY, barW * (this.hp / this.maxHp), barH);
            }
        }
    }

    // 5. 阳光、小推车、特效
    class SunEntity {
        constructor(x, y, fromSky = true) {
            this.x = x;
            this.y = (fromSky ? m8.grid.y - 30 : y);
            this.targetY = (fromSky ? m8.grid.y + 40 + Math.random() * (m8.grid.h - 80) : y);
            this.speed = (fromSky ? 80 : 0);
            this.value = 50;
            this.rotation = 0;
            this.life = 12.0;
            this.isAlive = true;
        }

        update(dt) {
            this.rotation += dt * 2;
            this.life -= dt;
            if (this.life <= 0) this.isAlive = false;
            if (this.y < this.targetY) this.y += this.speed * dt;
        }

        collect() {
            if (!this.isAlive) return;
            this.isAlive = false;
            playSound('sun');
            m8.sun += this.value;
            m8.effects.push(new FloatingText(`+${this.value} ☀️`, this.x, this.y - 20, '#ffd700', 20));
        }

        draw(ctx) {
            ctx.save();
            ctx.translate(this.x, this.y);
            ctx.rotate(this.rotation);

            ctx.fillStyle = '#ffeb3b';
            for (let i = 0; i < 8; i++) {
                ctx.rotate(Math.PI / 4);
                ctx.beginPath();
                ctx.moveTo(-6, -18);
                ctx.lineTo(6, -18);
                ctx.lineTo(0, -28);
                ctx.closePath();
                ctx.fill();
            }

            ctx.beginPath();
            ctx.arc(0, 0, 18, 0, Math.PI * 2);
            ctx.fillStyle = '#ffca28';
            ctx.fill();
            ctx.lineWidth = 2;
            ctx.strokeStyle = '#ff9800';
            ctx.stroke();

            ctx.restore();
        }
    }

    class MowerEntity {
        constructor(row) {
            this.row = row;
            this.x = m8.grid.x - 36;
            this.y = getCellCenter(row, 0).y;
            this.isTriggered = false;
            this.speed = 450;
            this.isAlive = true;
        }

        update(dt) {
            if (!this.isTriggered) return;
            this.x += this.speed * dt;

            for (const z of m8.zombies) {
                if (!z.isHypnotized && z.row === this.row && Math.abs(z.x - this.x) < 40 && z.hp > 0) {
                    z.hp = 0;
                    m8.effects.push(new Particle(z.x, z.y, 'zombie_die'));
                }
            }
            if (this.x > m8.grid.x + m8.grid.w + 80) this.isAlive = false;
        }

        trigger() {
            if (this.isTriggered) return;
            this.isTriggered = true;
            playSound('mower');
            m8.effects.push(new FloatingText('🚜 割草机启动！横扫全行！', this.x + 80, this.y - 30, '#f44336', 18));
        }

        draw(ctx) {
            ctx.save();
            ctx.translate(this.x, this.y);
            ctx.fillStyle = '#e53935';
            ctx.beginPath();
            ctx.roundRect(-20, -14, 40, 24, 6);
            ctx.fill();
            ctx.fillStyle = '#424242';
            ctx.beginPath();
            ctx.arc(-12, 12, 7, 0, Math.PI * 2);
            ctx.arc(12, 12, 7, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        }
    }

    class FloatingText {
        constructor(text, x, y, color = '#ffffff', size = 16) {
            this.text = text;
            this.x = x;
            this.y = y;
            this.color = color;
            this.size = size;
            this.life = 1.6;
        }
        update(dt) {
            this.y -= dt * 32;
            this.life -= dt;
            return this.life <= 0;
        }
        draw(ctx) {
            ctx.save();
            ctx.globalAlpha = Math.max(0, this.life / 1.6);
            ctx.font = `bold ${this.size}px "PingFang SC", "Microsoft YaHei", sans-serif`;
            ctx.fillStyle = this.color;
            ctx.strokeStyle = 'rgba(0,0,0,0.85)';
            ctx.lineWidth = 4;
            ctx.textAlign = 'center';
            ctx.strokeText(this.text, this.x, this.y);
            ctx.fillText(this.text, this.x, this.y);
            ctx.restore();
        }
    }

    class Particle {
        constructor(x, y, type) {
            this.x = x;
            this.y = y;
            this.type = type;
            this.vx = (Math.random() - 0.5) * 120;
            this.vy = (Math.random() - 0.5) * 120;
            this.life = 0.6;
            this.maxLife = 0.6;
            this.size = 4 + Math.random() * 5;
        }
        update(dt) {
            this.x += this.vx * dt;
            this.y += this.vy * dt;
            this.life -= dt;
            return this.life <= 0;
        }
        draw(ctx) {
            const alpha = Math.max(0, this.life / this.maxLife);
            ctx.save();
            ctx.globalAlpha = alpha;
            ctx.fillStyle = (this.type === 'grow_ring' ? '#ffd700' : '#ffeb3b');
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        }
    }

    class HypnoBlastEffect {
        constructor(x, y) {
            this.x = x;
            this.y = y;
            this.radius = 10;
            this.maxRadius = 140;
            this.life = 0.8;
            this.maxLife = 0.8;
        }
        update(dt) {
            this.life -= dt;
            this.radius += (this.maxRadius - this.radius) * (dt * 6);
            return this.life <= 0;
        }
        draw(ctx) {
            const alpha = Math.max(0, this.life / this.maxLife);
            ctx.save();
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(224, 64, 251, ${alpha * 0.35})`;
            ctx.fill();
            ctx.strokeStyle = `rgba(255, 255, 255, ${alpha * 0.9})`;
            ctx.lineWidth = 4;
            ctx.stroke();
            ctx.restore();
        }
    }

    // ==========================================
    // 棋盘几何与网格辅助
    // ==========================================
    function calculateGrid(canvasWidth, canvasHeight) {
        const topMargin = 115;
        const bottomMargin = 40;
        const leftMargin = 70;
        const rightMargin = 40;

        const availW = Math.max(600, canvasWidth - leftMargin - rightMargin);
        const availH = Math.max(360, canvasHeight - topMargin - bottomMargin);

        m8.grid.x = leftMargin;
        m8.grid.y = topMargin;
        m8.grid.w = availW;
        m8.grid.h = availH;
        m8.grid.cellW = availW / COLS;
        m8.grid.cellH = availH / ROWS;
    }

    function getCellCenter(row, col) {
        return {
            x: m8.grid.x + col * m8.grid.cellW + m8.grid.cellW * 0.5,
            y: m8.grid.y + row * m8.grid.cellH + m8.grid.cellH * 0.5
        };
    }

    function getColFromX(x) { return (x - m8.grid.x) / m8.grid.cellW; }
    function getRowFromY(y) {
        const r = Math.floor((y - m8.grid.y) / m8.grid.cellH);
        return Math.max(0, Math.min(ROWS - 1, r));
    }

    function triggerMower(row) {
        const mower = m8.mowers.find(m => m.row === row && !m.isTriggered);
        if (mower) mower.trigger();
        else if (typeof window.gameOver === 'function') window.gameOver("僵尸吃掉了你的脑子！");
    }

    // ==========================================
    // 波次与关卡初始化
    // ==========================================
    function initLevelWaves(level, modeType = 'adventure') {
        m8.gameModeType = modeType;
        m8.level = level;
        m8.waveIndex = 0;
        m8.totalWaves = (modeType === 'survival' ? 99 : (6 + level * 2));
        m8.waveTimer = 4.0;
        m8.waveProgress = 0;
        m8.readyPlantTimer = 2.5; // "Ready... Set... PLANT!" 动画
        m8.isHugeWaveApproaching = false;
        m8.hugeWaveBannerTimer = 0;

        m8.mowers = [];
        for (let r = 0; r < ROWS; r++) m8.mowers.push(new MowerEntity(r));

        m8.plants = [];
        m8.projectiles = [];
        m8.zombies = [];
        m8.suns = [];
        m8.effects = [];
        m8.sun = 250 + level * 50;

        playBGM('battle');
    }

    function updateWaves(dt) {
        if (m8.readyPlantTimer > 0) {
            m8.readyPlantTimer -= dt;
        }

        m8.waveTimer -= dt;
        m8.waveProgress = Math.min(1.0, m8.waveIndex / m8.totalWaves);

        m8.sunDropTimer -= dt;
        if (m8.sunDropTimer <= 0) {
            m8.sunDropTimer = 5.0 + Math.random() * 3.0;
            const dropX = m8.grid.x + 60 + Math.random() * (m8.grid.w - 120);
            m8.suns.push(new SunEntity(dropX, 0, true));
        }

        if (m8.hugeWaveBannerTimer > 0) m8.hugeWaveBannerTimer -= dt;

        if (m8.waveTimer <= 0 && m8.waveIndex < m8.totalWaves) {
            m8.waveIndex++;
            m8.waveTimer = Math.max(8.0, 16.0 - m8.level * 0.8);

            const isFinalWave = (m8.waveIndex === m8.totalWaves);
            const isHugeWave = isFinalWave || (m8.waveIndex === Math.floor(m8.totalWaves / 2));

            if (isHugeWave) {
                playSound('hugewave');
                m8.hugeWaveBannerTimer = 3.5;
                m8.effects.push(new FloatingText('⚠️ 一大波僵尸正在接近！', m8.grid.x + m8.grid.w / 2, m8.grid.y + m8.grid.h / 2, '#f44336', 32));
            }
            spawnZombieWave(m8.waveIndex, isHugeWave);
        }

        if (m8.waveIndex >= m8.totalWaves && m8.zombies.filter(z => !z.isHypnotized && z.hp > 0).length === 0) {
            playSound('win');
            m8.effects.push(new FloatingText('🏆 胜利通关！', m8.grid.x + m8.grid.w / 2, m8.grid.y + m8.grid.h / 2, '#76ff03', 36));
            setTimeout(() => {
                if (m8.level < m8.maxLevels) {
                    window.startMode8Level(m8.level + 1);
                } else {
                    const overlay = document.getElementById('victoryOverlay');
                    if (overlay) overlay.classList.remove('hidden');
                }
            }, 2200);
        }
    }

    function spawnZombieWave(waveNum, isHugeWave) {
        const count = isHugeWave ? (4 + m8.level) : (1 + Math.floor(waveNum * 0.6));
        const rows = [0, 1, 2, 3, 4].sort(() => Math.random() - 0.5);

        for (let i = 0; i < count; i++) {
            const r = rows[i % ROWS];
            let type = 'normal';
            const rand = Math.random();

            if (m8.level >= 5 && isHugeWave && i === 0) type = 'gargantuar';
            else if (m8.level >= 8 && isHugeWave && i === 0) type = 'zomboss';
            else if (m8.level >= 4 && rand < 0.25) type = 'football';
            else if (m8.level >= 3 && rand < 0.45) type = 'newspaper';
            else if (m8.level >= 2 && rand < 0.65) type = 'conehead';
            else if (m8.level >= 2 && rand < 0.8) type = 'polevaulter';

            const zombie = new ZombieEntity(type, r);
            zombie.x += i * 35;
            m8.zombies.push(zombie);
        }
    }

    // ==========================================
    // 原版开始界面渲染系统 (Title Screen)
    // ==========================================
    function renderTitleScreen(ctx, width, height) {
        // 1. 蓝天与阳光草坪背景
        const skyGrad = ctx.createLinearGradient(0, 0, 0, height);
        skyGrad.addColorStop(0, '#29b6f6');
        skyGrad.addColorStop(0.4, '#81d4fa');
        skyGrad.addColorStop(0.45, '#388e3c');
        skyGrad.addColorStop(1, '#1b5e20');
        ctx.fillStyle = skyGrad;
        ctx.fillRect(0, 0, width, height);

        // 远景草丘与云朵
        ctx.fillStyle = 'rgba(255,255,255,0.7)';
        ctx.beginPath();
        ctx.arc(width * 0.2, 70, 35, 0, Math.PI * 2);
        ctx.arc(width * 0.25, 60, 45, 0, Math.PI * 2);
        ctx.arc(width * 0.3, 70, 35, 0, Math.PI * 2);
        ctx.fill();

        ctx.beginPath();
        ctx.arc(width * 0.75, 90, 40, 0, Math.PI * 2);
        ctx.arc(width * 0.82, 80, 50, 0, Math.PI * 2);
        ctx.fill();

        // 2. 左上角金字专属招牌：“坚果保龄球种植版”
        const signX = 30;
        const signY = 25;
        const signW = 320;
        const signH = 70;

        ctx.save();
        // 木纹底板
        ctx.fillStyle = '#4e342e';
        ctx.beginPath();
        ctx.roundRect(signX, signY, signW, signH, 12);
        ctx.fill();
        ctx.strokeStyle = '#d7ccc8';
        ctx.lineWidth = 4;
        ctx.stroke();

        // 金色立体文字
        ctx.font = 'bold 24px "PingFang SC", "Microsoft YaHei", sans-serif';
        ctx.fillStyle = '#ffd54f';
        ctx.strokeStyle = '#3e2723';
        ctx.lineWidth = 5;
        ctx.textAlign = 'center';
        ctx.strokeText('🌰 坚果保龄球种植版 🌸', signX + signW / 2, signY + 44);
        ctx.fillText('🌰 坚果保龄球种植版 🌸', signX + signW / 2, signY + 44);
        ctx.restore();

        // 3. 右上角音频与倍速控制栏
        const barX = width - 240;
        const barY = 25;
        
        // 🎵 音乐按钮
        ctx.fillStyle = soundSettings.bgmMuted ? '#b0bec5' : '#4caf50';
        ctx.beginPath();
        ctx.roundRect(barX, barY, 65, 36, 8);
        ctx.fill();
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 12px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(soundSettings.bgmMuted ? '🎵 静音' : '🎵 音乐', barX + 32, barY + 22);

        // 🔊 音效按钮
        ctx.fillStyle = soundSettings.sfxMuted ? '#b0bec5' : '#4caf50';
        ctx.beginPath();
        ctx.roundRect(barX + 75, barY, 65, 36, 8);
        ctx.fill();
        ctx.fillStyle = '#fff';
        ctx.fillText(soundSettings.sfxMuted ? '🔇 静音' : '🔊 音效', barX + 107, barY + 22);

        // ⚡ 倍速按钮
        ctx.fillStyle = '#ff9800';
        ctx.beginPath();
        ctx.roundRect(barX + 150, barY, 65, 36, 8);
        ctx.fill();
        ctx.fillStyle = '#fff';
        ctx.fillText(`⚡ ${m8.speed}x`, barX + 182, barY + 22);

        // 4. 原版经典大木牌 / 墓碑菜单按钮
        const menuCenterX = width / 2;
        const menuCenterY = height * 0.52;
        const btnW = Math.min(width - 60, 360);
        const btnH = 54;
        const gap = 16;

        const menuButtons = [
            { id: 'adventure', title: '🧟 冒险模式 (10 关)', color: '#689f38' },
            { id: 'minigame', title: '🎳 玩玩小游戏 (保龄球特训)', color: '#f57c00' },
            { id: 'survival', title: '♾️ 生存模式 (无尽挑战)', color: '#7b1fa2' },
            { id: 'almanac', title: '📖 植物与僵尸图鉴', color: '#0097a7' },
            { id: 'back', title: '🏠 返回积木大厅', color: '#5d4037' }
        ];

        menuButtons.forEach((btn, i) => {
            const by = menuCenterY - 110 + i * (btnH + gap);
            const bx = menuCenterX - btnW / 2;

            ctx.save();
            ctx.fillStyle = btn.color;
            ctx.beginPath();
            ctx.roundRect(bx, by, btnW, btnH, 10);
            ctx.fill();
            ctx.strokeStyle = '#fff';
            ctx.lineWidth = 3;
            ctx.stroke();

            // 立体按钮文字
            ctx.font = 'bold 20px "PingFang SC", "Microsoft YaHei", sans-serif';
            ctx.fillStyle = '#ffffff';
            ctx.strokeStyle = '#000000';
            ctx.lineWidth = 4;
            ctx.textAlign = 'center';
            ctx.strokeText(btn.title, menuCenterX, by + 35);
            ctx.fillText(btn.title, menuCenterX, by + 35);
            ctx.restore();
        });

        // 5. 底部版权与说明
        ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
        ctx.font = 'bold 13px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('Plants vs. Zombies: Wall-nut Bowling Edition · 原版高清种植版', width / 2, height - 20);
    }

    // ==========================================
    // 战场与 HUD 渲染
    // ==========================================
    function renderLawn(ctx) {
        const g = m8.grid;
        for (let r = 0; r < ROWS; r++) {
            for (let c = 0; c < COLS; c++) {
                const x = g.x + c * g.cellW;
                const y = g.y + r * g.cellH;
                ctx.fillStyle = ((r + c) % 2 === 0 ? '#4caf50' : '#43a047');
                ctx.fillRect(x, y, g.cellW, g.cellH);
                ctx.strokeStyle = 'rgba(0, 0, 0, 0.08)';
                ctx.lineWidth = 1;
                ctx.strokeRect(x, y, g.cellW, g.cellH);
            }
        }

        ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
        ctx.font = 'bold 13px sans-serif';
        ctx.textAlign = 'center';

        for (let c = 0; c < COLS; c++) {
            ctx.fillText(`第 ${c + 1} 列`, g.x + c * g.cellW + g.cellW / 2, g.y - 12);
        }
        for (let r = 0; r < ROWS; r++) {
            ctx.fillText(`第 ${r + 1} 行`, g.x - 30, g.y + r * g.cellH + g.cellH / 2 + 4);
        }

        const redLineX = g.x + RED_LINE_COL * g.cellW;
        ctx.save();
        ctx.strokeStyle = '#f44336';
        ctx.lineWidth = 4;
        ctx.setLineDash([10, 6]);
        ctx.beginPath();
        ctx.moveTo(redLineX, g.y);
        ctx.lineTo(redLineX, g.y + g.h);
        ctx.stroke();

        ctx.fillStyle = '#ff5252';
        ctx.font = 'bold 12px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('◄ 种植/放球区 (红线内) | 僵尸战场区 ►', redLineX, g.y - 28);
        ctx.restore();

        if (m8.hoverCell.row >= 0 && m8.hoverCell.col >= 0) {
            const hx = g.x + m8.hoverCell.col * g.cellW;
            const hy = g.y + m8.hoverCell.row * g.cellH;
            ctx.save();
            ctx.fillStyle = (m8.hoverCell.valid ? 'rgba(118, 255, 3, 0.35)' : 'rgba(244, 67, 54, 0.35)');
            ctx.fillRect(hx, hy, g.cellW, g.cellH);
            ctx.restore();
        }
    }

    function renderHUD(ctx, width, height) {
        const barX = 15;
        const barY = 12;
        const barW = Math.min(width - 30, 880);
        const barH = 75;

        ctx.save();
        ctx.fillStyle = '#4e342e';
        ctx.beginPath();
        ctx.roundRect(barX, barY, barW, barH, 10);
        ctx.fill();
        ctx.strokeStyle = '#8d6e63';
        ctx.lineWidth = 3;
        ctx.stroke();

        // 阳光槽
        ctx.fillStyle = '#fff8e1';
        ctx.beginPath();
        ctx.roundRect(barX + 8, barY + 8, 80, 58, 6);
        ctx.fill();
        ctx.fillStyle = '#ff8f00';
        ctx.font = 'bold 11px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('☀️ 阳光', barX + 48, barY + 24);
        ctx.fillStyle = '#e65100';
        ctx.font = 'bold 20px sans-serif';
        ctx.fillText(`${m8.sun}`, barX + 48, barY + 52);

        // 植物卡片
        const cardStartX = barX + 96;
        const cardW = 68;
        const cardH = 58;

        m8.cards.slice(0, 7).forEach((card, idx) => {
            const cx = cardStartX + idx * (cardW + 6);
            const cy = barY + 8;
            const isSelected = (m8.selectedCard === card.id);
            const canAfford = (m8.sun >= card.cost);
            const isReady = (card.currentCd <= 0);

            ctx.save();
            ctx.fillStyle = (isSelected ? '#fff59d' : (canAfford && isReady ? '#efebe9' : '#9e9e9e'));
            ctx.beginPath();
            ctx.roundRect(cx, cy, cardW, cardH, 6);
            ctx.fill();
            ctx.strokeStyle = (isSelected ? '#fbc02d' : '#6d4c41');
            ctx.lineWidth = (isSelected ? 3 : 2);
            ctx.stroke();

            const tex = textures[card.icon];
            if (tex) {
                ctx.drawImage(tex, cx + 4, cy + 4, 32, 32);
            }

            ctx.fillStyle = '#3e2723';
            ctx.font = 'bold 10px sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText(card.name.substring(0, 3), cx + cardW / 2, cy + 42);
            ctx.fillStyle = (canAfford ? '#e65100' : '#d32f2f');
            ctx.font = 'bold 11px sans-serif';
            ctx.fillText(`${card.cost}`, cx + cardW / 2, cy + 54);

            if (card.currentCd > 0) {
                ctx.fillStyle = 'rgba(0, 0, 0, 0.55)';
                ctx.fillRect(cx, cy, cardW, cardH * (card.currentCd / card.cooldown));
            }
            ctx.restore();
        });

        // 铲子
        const shovelX = cardStartX + 7 * (cardW + 6) + 4;
        ctx.fillStyle = (m8.selectedCard === 'shovel' ? '#ffcc80' : '#cfd8dc');
        ctx.beginPath();
        ctx.roundRect(shovelX, barY + 8, 42, cardH, 6);
        ctx.fill();
        ctx.fillStyle = '#37474f';
        ctx.font = 'bold 18px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('⛏️', shovelX + 21, barY + 32);
        ctx.font = 'bold 9px sans-serif';
        ctx.fillText('铲除', shovelX + 21, barY + 50);

        // 菜单与设置按钮 (右侧)
        const optX = barX + barW - 170;
        // 🎵
        ctx.fillStyle = soundSettings.bgmMuted ? '#b0bec5' : '#4caf50';
        ctx.beginPath();
        ctx.roundRect(optX, barY + 12, 36, 24, 4);
        ctx.fill();
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 11px sans-serif';
        ctx.fillText(soundSettings.bgmMuted ? '🔇' : '🎵', optX + 18, barY + 28);

        // ⚡ 倍速
        ctx.fillStyle = '#ff9800';
        ctx.beginPath();
        ctx.roundRect(optX + 42, barY + 12, 45, 24, 4);
        ctx.fill();
        ctx.fillStyle = '#fff';
        ctx.fillText(`${m8.speed}x`, optX + 64, barY + 28);

        // 📋 菜单
        ctx.fillStyle = '#5d4037';
        ctx.beginPath();
        ctx.roundRect(optX + 92, barY + 12, 58, 24, 4);
        ctx.fill();
        ctx.fillStyle = '#fff';
        ctx.fillText('📋 主菜单', optX + 121, barY + 28);

        // 进度条
        const meterW = 160;
        const meterH = 12;
        const meterX = width - meterW - 30;
        const meterY = 96;

        ctx.fillStyle = '#37474f';
        ctx.beginPath();
        ctx.roundRect(meterX, meterY, meterW, meterH, 6);
        ctx.fill();
        ctx.fillStyle = '#00e676';
        ctx.beginPath();
        ctx.roundRect(meterX, meterY, meterW * m8.waveProgress, meterH, 6);
        ctx.fill();
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 11px sans-serif';
        ctx.textAlign = 'right';
        ctx.fillText(`🚩 波次: ${m8.waveIndex} / ${m8.totalWaves}`, meterX - 8, meterY + 10);

        // "准备... 种植！" 开场动画
        if (m8.readyPlantTimer > 0) {
            ctx.save();
            ctx.fillStyle = '#ffeb3b';
            ctx.strokeStyle = '#b71c1c';
            ctx.lineWidth = 8;
            ctx.font = 'bold 48px "PingFang SC", "Microsoft YaHei", sans-serif';
            ctx.textAlign = 'center';
            const text = (m8.readyPlantTimer > 1.2 ? 'Ready... Set...' : 'PLANT! 准备... 种植！');
            ctx.strokeText(text, width / 2, height / 2);
            ctx.fillText(text, width / 2, height / 2);
            ctx.restore();
        }

        if (m8.hugeWaveBannerTimer > 0) {
            ctx.fillStyle = 'rgba(211, 47, 47, 0.88)';
            ctx.fillRect(0, height / 2 - 40, width, 80);
            ctx.fillStyle = '#ffffff';
            ctx.font = 'bold 36px sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText('🧟 一大波僵尸正在接近！🧟', width / 2, height / 2 + 12);
        }

        ctx.restore();
    }

    // ==========================================
    // 图鉴系统 (Almanac)
    // ==========================================
    function renderAlmanac(ctx, width, height) {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
        ctx.fillRect(0, 0, width, height);

        const boxW = Math.min(width - 40, 720);
        const boxH = Math.min(height - 40, 520);
        const boxX = (width - boxW) / 2;
        const boxY = (height - boxH) / 2;

        ctx.fillStyle = '#4e342e';
        ctx.beginPath();
        ctx.roundRect(boxX, boxY, boxW, boxH, 16);
        ctx.fill();
        ctx.strokeStyle = '#d7ccc8';
        ctx.lineWidth = 4;
        ctx.stroke();

        ctx.fillStyle = '#ffd54f';
        ctx.font = 'bold 24px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('📖 植物与僵尸图鉴 (Almanac)', boxX + boxW / 2, boxY + 42);

        // 标签栏
        ctx.fillStyle = (m8.almanacTab === 'plants' ? '#4caf50' : '#37474f');
        ctx.beginPath();
        ctx.roundRect(boxX + 40, boxY + 60, 140, 36, 8);
        ctx.fill();
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 15px sans-serif';
        ctx.fillText('🌱 植物图鉴', boxX + 110, boxY + 84);

        ctx.fillStyle = (m8.almanacTab === 'zombies' ? '#4caf50' : '#37474f');
        ctx.beginPath();
        ctx.roundRect(boxX + 200, boxY + 60, 140, 36, 8);
        ctx.fill();
        ctx.fillStyle = '#fff';
        ctx.fillText('🧟 僵尸图鉴', boxX + 270, boxY + 84);

        // 关闭按钮
        ctx.fillStyle = '#e53935';
        ctx.beginPath();
        ctx.roundRect(boxX + boxW - 100, boxY + 60, 70, 36, 8);
        ctx.fill();
        ctx.fillStyle = '#fff';
        ctx.fillText('关闭', boxX + boxW - 65, boxY + 84);

        // 图鉴内容列表
        ctx.textAlign = 'left';
        ctx.font = '14px sans-serif';
        ctx.fillStyle = '#fff';

        if (m8.almanacTab === 'plants') {
            const plantsInfo = [
                '🌸 大嘴花坚果 (200☀️): 每 1.5s 跳 1 格，20%秒吞/80%咀嚼20s，50%增长一圈(+1食量/+1s间隔/+200HP)，尽头50%折返巡逻！',
                '🌀 魅惑坚果 (125☀️): 直线滚动，命中后 3×3 范围无伤魅惑，被魅惑僵尸向右反攻！',
                '🎳 普通坚果 (50☀️): 原版坚果保龄球，400 伤害，45° 斜向折射弹跳与上下边界反弹！',
                '🪨 巨型坚果 (100☀️): 巨型巨石坚果，直接碾压整行所有僵尸！',
                '🌻 向日葵 (50☀️): 种植在草坪上，每 10 秒产出 50 阳光。',
                '🌱 豌豆射手 (100☀️): 直线射击豌豆协助防守。',
                '🍒 樱桃炸弹 (150☀️): 3×3 范围 1800 巨大爆炸伤害。',
                '🌶️ 火爆辣椒 (125☀️): 横扫整行火焰毁灭。',
                '🥔 土豆地雷 (25☀️): 潜地武装后触发 1800 爆炸。'
            ];
            plantsInfo.forEach((text, idx) => {
                ctx.fillText(text, boxX + 30, boxY + 130 + idx * 38);
            });
        } else {
            const zombiesInfo = [
                '🧟 普通僵尸: 基础僵尸，血量 200。',
                '🚩 旗帜僵尸: 带领一大波僵尸出现。',
                '🚧 路障僵尸: 拥有路障防护，血量 560。',
                '🪣 铁桶僵尸: 拥有铁桶极高护甲，血量 1300。',
                '🏃 撑杆僵尸: 极速奔跑并跳过遇到的第一株植物。',
                '📰 读报僵尸: 报纸被打烂后进入狂暴冲刺状态！',
                '🏈 橄榄球僵尸: 极高血量与超快冲锋速度。',
                '👹 巨人僵尸 (Gargantuar): 3000 HP，电线杆砸击，残血扔小鬼，大嘴花坚果可一口吞掉！',
                '🤖 僵王博士 (Dr. Zomboss): 6000 HP 终极 Boss，大嘴花坚果可跃起啃咬！'
            ];
            zombiesInfo.forEach((text, idx) => {
                ctx.fillText(text, boxX + 30, boxY + 130 + idx * 38);
            });
        }
    }

    // ==========================================
    // 交互与输入监听
    // ==========================================
    function handlePointerDown(e) {
        if (typeof gameState === 'undefined' || gameState.mode !== 8 || !gameState.isPlaying) return;

        const canvas = document.getElementById('gameCanvas');
        if (!canvas) return;
        const rect = canvas.getBoundingClientRect();
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;
        const x = (e.clientX - rect.left) * scaleX;
        const y = (e.clientY - rect.top) * scaleY;

        // 1. 图鉴界面点击
        if (m8.state === 'almanac') {
            const boxW = Math.min(canvas.width - 40, 720);
            const boxH = Math.min(canvas.height - 40, 520);
            const boxX = (canvas.width - boxW) / 2;
            const boxY = (canvas.height - boxH) / 2;

            if (x >= boxX + 40 && x <= boxX + 180 && y >= boxY + 60 && y <= boxY + 96) {
                m8.almanacTab = 'plants';
                playSound('click');
                return;
            }
            if (x >= boxX + 200 && x <= boxX + 340 && y >= boxY + 60 && y <= boxY + 96) {
                m8.almanacTab = 'zombies';
                playSound('click');
                return;
            }
            if (x >= boxX + boxW - 100 && x <= boxX + boxW - 30 && y >= boxY + 60 && y <= boxY + 96) {
                m8.state = 'title';
                playSound('click');
                return;
            }
            return;
        }

        // 2. 开始界面点击
        if (m8.state === 'title') {
            const width = canvas.width;
            const height = canvas.height;
            const barX = width - 240;
            const barY = 25;

            // 🎵 音乐开关
            if (x >= barX && x <= barX + 65 && y >= barY && y <= barY + 36) {
                toggleBGM();
                playSound('click');
                return;
            }
            // 🔊 音效开关
            if (x >= barX + 75 && x <= barX + 140 && y >= barY && y <= barY + 36) {
                toggleSFX();
                playSound('click');
                return;
            }
            // ⚡ 倍速切换
            if (x >= barX + 150 && x <= barX + 215 && y >= barY && y <= barY + 36) {
                m8.speed = (m8.speed % 3) + 1;
                playSound('click');
                return;
            }

            const menuCenterX = width / 2;
            const menuCenterY = height * 0.52;
            const btnW = Math.min(width - 60, 360);
            const btnH = 54;
            const gap = 16;

            const buttons = ['adventure', 'minigame', 'survival', 'almanac', 'back'];
            buttons.forEach((id, i) => {
                const by = menuCenterY - 110 + i * (btnH + gap);
                const bx = menuCenterX - btnW / 2;
                if (x >= bx && x <= bx + btnW && y >= by && y <= by + btnH) {
                    playSound('click');
                    if (id === 'adventure') {
                        m8.state = 'playing';
                        initLevelWaves(m8.level, 'adventure');
                    } else if (id === 'minigame') {
                        m8.state = 'playing';
                        initLevelWaves(1, 'minigame');
                    } else if (id === 'survival') {
                        m8.state = 'playing';
                        initLevelWaves(1, 'survival');
                    } else if (id === 'almanac') {
                        m8.state = 'almanac';
                    } else if (id === 'back') {
                        if (typeof window.backToHome === 'function') window.backToHome();
                    }
                }
            });
            return;
        }

        // 3. 战斗中点击
        if (m8.state === 'playing') {
            // 收集阳光
            for (const s of m8.suns) {
                if (s.isAlive && Math.hypot(s.x - x, s.y - y) < 32) {
                    s.collect();
                    return;
                }
            }

            const barX = 15;
            const barY = 12;
            const barW = Math.min(canvas.width - 30, 880);
            const optX = barX + barW - 170;

            // 🎵
            if (x >= optX && x <= optX + 36 && y >= barY + 12 && y <= barY + 36) {
                toggleBGM();
                playSound('click');
                return;
            }
            // ⚡
            if (x >= optX + 42 && x <= optX + 87 && y >= barY + 12 && y <= barY + 36) {
                m8.speed = (m8.speed % 3) + 1;
                playSound('click');
                return;
            }
            // 📋 菜单
            if (x >= optX + 92 && x <= optX + 150 && y >= barY + 12 && y <= barY + 36) {
                m8.state = 'title';
                playBGM('title');
                playSound('click');
                return;
            }

            // 卡片选择
            const cardStartX = barX + 96;
            const cardW = 68;
            const cardH = 58;

            m8.cards.slice(0, 7).forEach((card, idx) => {
                const cx = cardStartX + idx * (cardW + 6);
                const cy = barY + 8;
                if (x >= cx && x <= cx + cardW && y >= cy && y <= cy + cardH) {
                    if (m8.sun >= card.cost && card.currentCd <= 0) {
                        m8.selectedCard = (m8.selectedCard === card.id ? null : card.id);
                        playSound('plant');
                    }
                }
            });

            // 铲子
            const shovelX = cardStartX + 7 * (cardW + 6) + 4;
            if (x >= shovelX && x <= shovelX + 42 && y >= barY + 8 && y <= barY + 8 + cardH) {
                m8.selectedCard = (m8.selectedCard === 'shovel' ? null : 'shovel');
                playSound('plant');
                return;
            }

            // 格子种植
            const g = m8.grid;
            if (x >= g.x && x <= g.x + g.w && y >= g.y && y <= g.y + g.h) {
                const col = Math.floor((x - g.x) / g.cellW);
                const row = Math.floor((y - g.y) / g.cellH);
                if (row >= 0 && row < ROWS && col >= 0 && col < COLS) {
                    handleGridPlacement(row, col);
                }
            }
        }
    }

    function handlePointerMove(e) {
        if (typeof gameState === 'undefined' || gameState.mode !== 8 || !gameState.isPlaying) return;

        const canvas = document.getElementById('gameCanvas');
        if (!canvas) return;
        const rect = canvas.getBoundingClientRect();
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;
        const x = (e.clientX - rect.left) * scaleX;
        const y = (e.clientY - rect.top) * scaleY;

        const g = m8.grid;
        if (x >= g.x && x <= g.x + g.w && y >= g.y && y <= g.y + g.h) {
            const col = Math.floor((x - g.x) / g.cellW);
            const row = Math.floor((y - g.y) / g.cellH);
            const isValid = (m8.selectedCard && col < RED_LINE_COL);
            m8.hoverCell = { row, col, valid: isValid };
        } else {
            m8.hoverCell = { row: -1, col: -1, valid: false };
        }
    }

    function handleGridPlacement(row, col) {
        if (!m8.selectedCard) return;

        if (m8.selectedCard === 'shovel') {
            const plant = m8.plants.find(p => p.row === row && p.col === col);
            if (plant) {
                m8.plants = m8.plants.filter(p => p !== plant);
                playSound('plant');
            }
            m8.selectedCard = null;
            return;
        }

        if (col >= RED_LINE_COL) {
            m8.effects.push(new FloatingText('⛔ 红线右侧为战场区，不可种植！', getCellCenter(row, col).x, getCellCenter(row, col).y - 30, '#f44336', 15));
            playSound('jump');
            return;
        }

        const card = m8.cards.find(c => c.id === m8.selectedCard);
        if (!card || m8.sun < card.cost || card.currentCd > 0) return;

        m8.sun -= card.cost;
        card.currentCd = card.cooldown;
        playSound('plant');

        if (card.id === 'chomper_nut') {
            m8.plants.push(new ChomperNutEntity(row, col));
            m8.effects.push(new FloatingText('🌱 大嘴花坚果已就位！', getCellCenter(row, col).x, getCellCenter(row, col).y - 40, '#8e24aa', 16));
        } else if (card.id === 'hypno_nut') {
            m8.projectiles.push(new HypnoNutProjectile(row, col));
            m8.effects.push(new FloatingText('🌀 魅惑坚果出击！', getCellCenter(row, col).x, getCellCenter(row, col).y - 40, '#e040fb', 16));
        } else if (card.id === 'wallnut') {
            m8.projectiles.push(new WallnutProjectile(row, col, false));
            m8.effects.push(new FloatingText('🎳 普通坚果出击！', getCellCenter(row, col).x, getCellCenter(row, col).y - 40, '#ff9800', 16));
        } else if (card.id === 'giant_wallnut') {
            m8.projectiles.push(new WallnutProjectile(row, col, true));
            m8.effects.push(new FloatingText('🪨 巨型坚果出击！', getCellCenter(row, col).x, getCellCenter(row, col).y - 40, '#ff6d00', 18));
        } else {
            m8.plants.push(new PlantEntity(card.id, row, col));
            m8.effects.push(new FloatingText(`🌱 ${card.name}已种植！`, getCellCenter(row, col).x, getCellCenter(row, col).y - 40, '#4caf50', 16));
        }

        m8.selectedCard = null;
    }

    function initListeners() {
        const canvas = document.getElementById('gameCanvas');
        if (canvas) {
            canvas.removeEventListener('pointerdown', handlePointerDown);
            canvas.removeEventListener('pointermove', handlePointerMove);
            canvas.addEventListener('pointerdown', handlePointerDown);
            canvas.addEventListener('pointermove', handlePointerMove);
        }
    }

    // ==========================================
    // 对外公开 API
    // ==========================================
    window.startMode8Level = function (lvl = 1) {
        if (lvl < 1) lvl = 1;
        if (lvl > m8.maxLevels) lvl = m8.maxLevels;

        m8.level = lvl;
        m8.state = 'title'; // 启动时首先呈现原版开始界面

        if (typeof gameState !== 'undefined') {
            gameState.level = lvl;
            gameState.mode = 8;
            gameState.isPlaying = true;
            gameState.targetCount = 6 + lvl * 2;
            gameState.currentLevelCollected = 0;
            gameState.timeLeft = 9999;
        }

        const canvas = document.getElementById('gameCanvas');
        if (canvas) calculateGrid(canvas.width, canvas.height);

        initListeners();
        playBGM('title');

        const mcControls = document.getElementById('mcControls');
        if (mcControls) mcControls.classList.add('hidden');
        const tetrisControls = document.getElementById('tetrisControls');
        if (tetrisControls) tetrisControls.classList.add('hidden');
        const stairControls = document.getElementById('mcStairControls');
        if (stairControls) stairControls.classList.add('hidden');
        const mode7Controls = document.getElementById('mode7Controls');
        if (mode7Controls) mode7Controls.style.display = 'none';

        const timerBox = document.getElementById('timerBox');
        if (timerBox) timerBox.classList.add('hidden');
        const basket = document.getElementById('basket');
        if (basket) basket.classList.add('hidden');
    };

    window.loopMode8 = function (t, rawDt) {
        const canvas = document.getElementById('gameCanvas');
        if (!canvas) return;
        const ctx = canvas.getContext('2d');

        calculateGrid(canvas.width, canvas.height);

        if (m8.state === 'title') {
            renderTitleScreen(ctx, canvas.width, canvas.height);
            return;
        }

        if (m8.state === 'almanac') {
            renderTitleScreen(ctx, canvas.width, canvas.height);
            renderAlmanac(ctx, canvas.width, canvas.height);
            return;
        }

        // 战斗状态更新
        const dt = (rawDt / 1000) * m8.speed;

        m8.cards.forEach(c => {
            if (c.currentCd > 0) c.currentCd = Math.max(0, c.currentCd - dt);
        });

        updateWaves(dt);

        m8.plants.forEach(p => p.update(dt));
        m8.projectiles = m8.projectiles.filter(p => p.isAlive);
        m8.projectiles.forEach(p => p.update(dt));
        m8.zombies = m8.zombies.filter(z => z.hp > 0);
        m8.zombies.forEach(z => z.update(dt));
        m8.suns = m8.suns.filter(s => s.isAlive);
        m8.suns.forEach(s => s.update(dt));
        m8.mowers = m8.mowers.filter(m => m.isAlive);
        m8.mowers.forEach(m => m.update(dt));
        m8.effects = m8.effects.filter(eff => !eff.update(dt));

        // 绘制战场
        renderLawn(ctx);
        m8.mowers.forEach(m => m.draw(ctx));
        m8.plants.forEach(p => p.draw(ctx));
        m8.zombies.forEach(z => z.draw(ctx));
        m8.projectiles.forEach(p => p.draw(ctx));
        m8.suns.forEach(s => s.draw(ctx));
        m8.effects.forEach(eff => eff.draw(ctx));
        renderHUD(ctx, canvas.width, canvas.height);
    };

    window.stopMode8 = function () {
        stopBGM();
        m8.state = 'title';
        m8.selectedCard = null;
        m8.plants = [];
        m8.projectiles = [];
        m8.zombies = [];
        m8.suns = [];
        m8.mowers = [];
        m8.effects = [];
    };

})();
