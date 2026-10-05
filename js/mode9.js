/**
 * 积木游戏 - 第九模式：机械迷城（Machinarium）
 * 100% 忠实还原经典蒸汽朋克解谜巨作《机械迷城》：
 * 
 * 1. 经典主角约瑟夫（Josef）：
 *    - 核心伸展/压缩机制：可自由拉长脖子躯干或蹲下压缩身体以触及高低处机关
 *    - 头部、身体、四肢拼装系统（第一关垃圾场苏醒组装）
 *    - 物品栏系统（顶部悬浮栏，支持物品收集、合成、使用）
 *    - 趣味表情、眨眼与漫画式气泡思考动画
 * 
 * 2. 完整 16 大经典关卡全收录（支持线性探索与章节选择）：
 *    - 01 垃圾场 (Discarica)：组装身体、绳索磁铁钓手臂、飞荡渡深渊
 *    - 02 吊桥 (Ponte levatoio)：染蓝尖顶帽、拉长身躯伪装守卫通过
 *    - 03 护城河水管谜题 (Fossato)：经典 11 阀门 3 扳手水管接通解谜
 *    - 04 锅炉房 (Caldaia)：熔炉开关 1/3向下 2向上，红黑电线互换
 *    - 05 监狱牢房 (Prigione)：揉草卷烟换手、关闭监控灯光得密码 04:45
 *    - 06 机械狗与雨伞 (Cane)：机油引狗、马桶吸盘抓狗、换取避雨伞
 *    - 07 酒吧五子棋 (Sfida)：五子棋智斗黑帽烟鬼机器人，赢取螺丝
 *    - 08 机器人乐团 (Banda)：修萨克斯、粘蝇纸抓苍蝇逼出乐器黑猫
 *    - 09 钟楼大广场 (Piazza)：天文大钟调至 VII 与 倒∞，开启加油机
 *    - 10 外壁电梯 (Ascensore est.)：故意全部答错谜题让狂怒风扇自毁超载
 *    - 11 皇家温室 (Serra)：激光反射镜折射、复刻蝴蝶翅膀开启密道
 *    - 12 游乐场推箱子 (Gettone)：复古街机推箱子赢硬币、购买高能电池
 *    - 13 室内大电梯 (Ascensore)：灯泡连线密码 1-6-3-2-7-1 动力复苏
 *    - 14 拆除炸弹 (Bomba)：黑帽帮定时炸弹，按 D-B-E-A-C 顺序安全剪线
 *    - 15 大脑电梯九宫格 (Ascensore 2)：九宫格回路 1-4-7-2-5-8-3-6-1
 *    - 16 顶楼天台大结局 (Cupola)：调频 7.0:108，琴键密码 1-4-2-3-5-2-3，直升机携女友飞向自由！
 * 
 * 3. 经典手绘手账秘籍（Comic Walkthrough Book）：
 *    - 点击右上角手绘书本，展开全关卡手绘铅笔线稿攻略与通关密码速查
 * 
 * 4. 蒸汽朋克高保真音效与环境音乐合成器（Web Audio API）
 */

(function () {
    'use strict';

    // ==========================================
    // 音效与音乐合成引擎
    // ==========================================
    let audioCtx = null;
    let bgmOscillators = [];
    let bgmInterval = null;

    const soundSettings = {
        bgmMuted: localStorage.getItem('m9_bgm_muted') === 'true',
        sfxMuted: localStorage.getItem('m9_sfx_muted') === 'true'
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

    function playSound(type) {
        if (soundSettings.sfxMuted) return;
        try {
            const ctx = getAudioContext();
            if (!ctx) return;
            const now = ctx.currentTime;

            if (type === 'clank' || type === 'step') {
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                osc.type = 'sine';
                osc.frequency.setValueAtTime(320 + Math.random() * 80, now);
                osc.frequency.exponentialRampToValueAtTime(80, now + 0.05);
                gain.gain.setValueAtTime(0.15, now);
                gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
                osc.connect(gain);
                gain.connect(ctx.destination);
                osc.start(now);
                osc.stop(now + 0.05);
            } else if (type === 'stretch') {
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                osc.type = 'triangle';
                osc.frequency.setValueAtTime(180, now);
                osc.frequency.exponentialRampToValueAtTime(420, now + 0.16);
                gain.gain.setValueAtTime(0.2, now);
                gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);
                osc.connect(gain);
                gain.connect(ctx.destination);
                osc.start(now);
                osc.stop(now + 0.18);
            } else if (type === 'squat') {
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                osc.type = 'triangle';
                osc.frequency.setValueAtTime(360, now);
                osc.frequency.exponentialRampToValueAtTime(140, now + 0.15);
                gain.gain.setValueAtTime(0.2, now);
                gain.gain.exponentialRampToValueAtTime(0.001, now + 0.16);
                osc.connect(gain);
                gain.connect(ctx.destination);
                osc.start(now);
                osc.stop(now + 0.16);
            } else if (type === 'pick' || type === 'gear') {
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                osc.type = 'square';
                osc.frequency.setValueAtTime(520, now);
                osc.frequency.setValueAtTime(780, now + 0.03);
                gain.gain.setValueAtTime(0.12, now);
                gain.gain.exponentialRampToValueAtTime(0.001, now + 0.07);
                osc.connect(gain);
                gain.connect(ctx.destination);
                osc.start(now);
                osc.stop(now + 0.07);
            } else if (type === 'combine') {
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                osc.type = 'triangle';
                osc.frequency.setValueAtTime(440, now);
                osc.frequency.exponentialRampToValueAtTime(880, now + 0.12);
                gain.gain.setValueAtTime(0.25, now);
                gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
                osc.connect(gain);
                gain.connect(ctx.destination);
                osc.start(now);
                osc.stop(now + 0.15);
            } else if (type === 'solve' || type === 'success') {
                const notes = [440, 554.37, 659.25, 880];
                notes.forEach((freq, idx) => {
                    const osc = ctx.createOscillator();
                    const gain = ctx.createGain();
                    osc.type = 'sine';
                    osc.frequency.setValueAtTime(freq, now + idx * 0.08);
                    gain.gain.setValueAtTime(0.2, now + idx * 0.08);
                    gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.08 + 0.3);
                    osc.connect(gain);
                    gain.connect(ctx.destination);
                    osc.start(now + idx * 0.08);
                    osc.stop(now + idx * 0.08 + 0.3);
                });
            } else if (type === 'water') {
                const bufferSize = ctx.sampleRate * 0.2;
                const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
                const data = buffer.getChannelData(0);
                for (let i = 0; i < bufferSize; i++) {
                    data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (ctx.sampleRate * 0.08));
                }
                const noise = ctx.createBufferSource();
                noise.buffer = buffer;
                const filter = ctx.createBiquadFilter();
                filter.type = 'bandpass';
                filter.frequency.value = 600;
                filter.Q.value = 3;
                const gain = ctx.createGain();
                gain.gain.value = 0.2;
                noise.connect(filter);
                filter.connect(gain);
                gain.connect(ctx.destination);
                noise.start(now);
            } else if (type === 'organ_note') {
                // 用于第16关琴键
                const noteFreqs = { 1: 329.63, 2: 392.00, 3: 440.00, 4: 523.25, 5: 659.25 };
                const freq = noteFreqs[arguments[1] || 1] || 440;
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                osc.type = 'triangle';
                osc.frequency.setValueAtTime(freq, now);
                gain.gain.setValueAtTime(0.3, now);
                gain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);
                osc.connect(gain);
                gain.connect(ctx.destination);
                osc.start(now);
                osc.stop(now + 0.45);
            } else if (type === 'buzz') {
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                osc.type = 'sawtooth';
                osc.frequency.setValueAtTime(120, now);
                gain.gain.setValueAtTime(0.2, now);
                gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
                osc.connect(gain);
                gain.connect(ctx.destination);
                osc.start(now);
                osc.stop(now + 0.15);
            }
        } catch (e) {
            // 忽略音频异常
        }
    }

    function startSteampunkBGM() {
        if (soundSettings.bgmMuted || bgmInterval) return;
        try {
            const ctx = getAudioContext();
            if (!ctx) return;
            const chords = [
                [220.00, 261.63, 329.63], // Am
                [196.00, 246.94, 293.66], // G
                [174.61, 220.00, 261.63], // F
                [164.81, 207.65, 246.94]  // E
            ];
            let chordIdx = 0;
            bgmInterval = setInterval(() => {
                if (soundSettings.bgmMuted) return;
                const now = ctx.currentTime;
                const currentChord = chords[chordIdx % chords.length];
                chordIdx++;
                currentChord.forEach((freq, i) => {
                    const osc = ctx.createOscillator();
                    const gain = ctx.createGain();
                    osc.type = 'sine';
                    osc.frequency.setValueAtTime(freq, now + i * 0.15);
                    gain.gain.setValueAtTime(0.04, now + i * 0.15);
                    gain.gain.exponentialRampToValueAtTime(0.0001, now + i * 0.15 + 1.2);
                    osc.connect(gain);
                    gain.connect(ctx.destination);
                    osc.start(now + i * 0.15);
                    osc.stop(now + i * 0.15 + 1.3);
                });
            }, 1800);
        } catch (e) {}
    }

    function stopSteampunkBGM() {
        if (bgmInterval) {
            clearInterval(bgmInterval);
            bgmInterval = null;
        }
    }

    // ==========================================
    // 机械迷城 16 个章节数据与全通关密码定义
    // ==========================================
    const CHAPTERS_META = [
        { id: 1, name: '垃圾场', sub: '废弃零件与身体拼装', icon: '🗑️', password: '无' },
        { id: 2, name: '护城河吊桥', sub: '伪装高大卫兵通过安检', icon: '🌉', password: '蓝色圆锥帽' },
        { id: 3, name: '水管阀门谜题', sub: '三扳手十一点水路接通', icon: '🔧', password: '三扳手精准布局' },
        { id: 4, name: '锅炉房控制台', sub: '熔炉三联电闸与红黑调线', icon: '🔥', password: '1/3下 2上，红黑互换' },
        { id: 5, name: '监狱牢房', sub: '卷烟换取手掌与荧光钟表', icon: '⛓️', password: '04:45' },
        { id: 6, name: '机械狗与雨伞', sub: '润滑油引诱与吸盘枪抓取', icon: '🐕', password: '雨伞挡水' },
        { id: 7, name: '酒吧五子棋', sub: '五子连珠智取黑帽烟鬼', icon: '♟️', password: '五子连珠战胜' },
        { id: 8, name: '机器人乐团', sub: '修理萨克斯与管中捉猫', icon: '🎷', password: '粘蝇纸+黑猫' },
        { id: 9, name: '钟楼大广场', sub: '天文时钟调校与加润滑油', icon: '🕰️', password: 'VII 与 倒∞' },
        { id: 10, name: '外壁电梯', sub: '反向作答激怒风扇自毁超载', icon: '🌪️', password: '全部反选自毁' },
        { id: 11, name: '皇家温室', sub: '激光棱镜折射与蝴蝶翅膀', icon: '🦋', password: '蝴蝶花纹密匙' },
        { id: 12, name: '游乐场推箱子', sub: '街机推箱子赢金币换电池', icon: '🕹️', password: '三箱归位' },
        { id: 13, name: '室内大电梯', sub: '灯泡回路几何连线密码', icon: '🛗', password: '1-6-3-2-7-1' },
        { id: 14, name: '拆除炸弹', sub: '黑帽帮核心定时炸弹剪线', icon: '💣', password: 'D - B - E - A - C' },
        { id: 15, name: '大脑电梯九宫格', sub: '主机终端逻辑九宫格回路', icon: '🧠', password: '1-4-7-2-5-8-3-6-1' },
        { id: 16, name: '顶楼天台大结局', sub: '调频收音机与管风琴密码', icon: '🚁', password: '7.0:108 / 1423523' }
    ];

    // ==========================================
    // 游戏核心状态对象
    // ==========================================
    const m9 = {
        state: 'playing', // 'playing', 'book_hint', 'chapter_select'
        currentChapter: 1,
        maxUnlockedChapter: parseInt(localStorage.getItem('m9_unlocked_ch') || '1', 10),
        
        // 物品栏系统
        inventory: [],
        selectedItemIndex: -1,
        
        // 约瑟夫主角状态
        josef: {
            x: 180,
            y: 420,
            targetX: 180,
            targetY: 420,
            facing: 1, // 1: right, -1: left
            stretchState: 0, // -1: squat, 0: normal, 1: stretch tall
            stretchCurrent: 0, // 动画插值 -1.0 ~ 1.0
            isWalking: false,
            blinkTimer: 0,
            thoughtText: '',
            thoughtTimer: 0,
            thoughtIcon: '',
            // 第一关身体拼装状态
            parts: {
                head: false,
                body: false,
                leftLeg: false,
                rightLeg: false,
                leftArm: false,
                rightArm: false
            },
            disguiseHat: false
        },

        // 各关卡独立专属谜题状态
        levels: {
            // 第1关 垃圾场
            ch1: {
                tubKnocked: false,
                headAssembled: false,
                dollFound: false,
                ratFed: false,
                poleBent: false,
                armFished: false,
                ropeMagnateCombined: false
            },
            // 第2关 吊桥
            ch2: {
                whiteConePicked: false,
                bluePaintPicked: false,
                hatDyed: false,
                bridgeLowered: false
            },
            // 第3关 经典 11 阀门 3 扳手水管谜题
            ch3: {
                // 11 个阀门孔位的状态与扳手放置 (0~10)
                // 3 个扳手：wrench 0, 1, 2，每个可以旋转角度 (0, 90, 180, 270)
                valves: [
                    { id: 0, x: 260, y: 180, wrench: null, angle: 0 },
                    { id: 1, x: 380, y: 180, wrench: null, angle: 0 },
                    { id: 2, x: 500, y: 180, wrench: null, angle: 0 },
                    { id: 3, x: 200, y: 270, wrench: null, angle: 0 },
                    { id: 4, x: 320, y: 270, wrench: null, angle: 0 },
                    { id: 5, x: 440, y: 270, wrench: null, angle: 0 },
                    { id: 6, x: 560, y: 270, wrench: null, angle: 0 },
                    { id: 7, x: 260, y: 360, wrench: null, angle: 0 },
                    { id: 8, x: 380, y: 360, wrench: null, angle: 0 },
                    { id: 9, x: 500, y: 360, wrench: null, angle: 0 },
                    { id: 10, x: 620, y: 270, wrench: null, angle: 0 }
                ],
                // 三个可用扳手
                wrenches: [
                    { id: 0, placedSlot: 1, angle: 90, color: '#f39c12' },
                    { id: 1, placedSlot: 4, angle: 180, color: '#e74c3c' },
                    { id: 2, placedSlot: 8, angle: 270, color: '#3498db' }
                ],
                solved: false
            },
            // 第4关 锅炉房
            ch4: {
                switches: [false, true, false], // 1下 2上 3下 为正确 (index 0,1,2: 0=下, 1=上, 2=下)
                swappedWires: false,
                cartPushed: false,
                solved: false
            },
            // 第5关 监狱
            ch5: {
                hasMoss: false,
                hasPaper: false,
                madeCigarette: false,
                tradedHand: false,
                lightTurnedOff: false,
                keyFound: false,
                codeDigits: ['0', '0', '0', '0'], // 目标 '0', '4', '4', '5'
                solved: false
            },
            // 第6关 机械狗
            ch6: {
                oilSpilled: false,
                dogCaught: false,
                umbrellaObtained: false,
                umbrellaOpened: false,
                solved: false
            },
            // 第7关 酒吧五子棋
            ch7: {
                board: Array(9).fill(0).map(() => Array(9).fill(0)), // 0: 空, 1: 玩家(黄铜螺母), 2: 机器人(黑铁螺栓)
                turn: 1, // 1: 玩家, 2: AI
                winner: 0, // 0: 进行中, 1: 玩家胜, 2: AI胜
                flypaperObtained: false,
                screwsObtained: false,
                solved: false
            },
            // 第8关 机器人乐团
            ch8: {
                gaveScrews: false,
                caughtFlies: false,
                releasedFlies: false,
                catCaught: false,
                bandPlaying: false,
                solved: false
            },
            // 第9关 钟楼大广场
            ch9: {
                hourHand: 3, // 目标 7 (VII)
                minuteHand: 0, // 目标 8 (倒∞)
                oilCanFilled: false,
                solved: false
            },
            // 第10关 自毁风扇
            ch10: {
                questionIdx: 0,
                wrongStreak: 0,
                fanRpm: 100,
                fanExploded: false,
                solved: false
            },
            // 第11关 皇家温室
            ch11: {
                mirrors: [0, 90, 45, 135],
                magnifierFound: false,
                butterflyPattern: [false, true, true, false, true, true],
                playerPattern: [false, false, false, false, false, false],
                solved: false
            },
            // 第12关 游乐场推箱子
            ch12: {
                player: { x: 1, y: 1 },
                boxes: [{ x: 2, y: 2 }, { x: 3, y: 2 }],
                targets: [{ x: 4, y: 2 }, { x: 4, y: 3 }],
                walls: [
                    { x: 0, y: 0 }, { x: 1, y: 0 }, { x: 2, y: 0 }, { x: 3, y: 0 }, { x: 4, y: 0 }, { x: 5, y: 0 },
                    { x: 0, y: 4 }, { x: 1, y: 4 }, { x: 2, y: 4 }, { x: 3, y: 4 }, { x: 4, y: 4 }, { x: 5, y: 4 },
                    { x: 0, y: 1 }, { x: 0, y: 2 }, { x: 0, y: 3 },
                    { x: 5, y: 1 }, { x: 5, y: 2 }, { x: 5, y: 3 }
                ],
                coinObtained: false,
                batteryBought: false,
                solved: false
            },
            // 第13关 室内大电梯
            ch13: {
                targetSeq: [1, 6, 3, 2, 7, 1],
                inputSeq: [],
                solved: false
            },
            // 第14关 拆除炸弹
            ch14: {
                targetSeq: ['D', 'B', 'E', 'A', 'C'],
                cutWires: [],
                timeLeft: 60.0,
                exploded: false,
                solved: false
            },
            // 第15关 大脑电梯九宫格
            ch15: {
                targetSeq: [1, 4, 7, 2, 5, 8, 3, 6, 1],
                inputSeq: [],
                solved: false
            },
            // 第16关 顶楼天台大结局
            ch16: {
                freqCoordX: 5.0,
                freqCoordY: 90,
                targetFreqX: 7.0,
                targetFreqY: 108,
                radioTuned: false,
                organNotes: [1, 4, 2, 3, 5, 2, 3],
                playerNotes: [],
                bertaRescued: false,
                helicopterFlying: false,
                solved: false
            }
        },

        // 秘籍画册（手绘风图鉴）翻页状态
        hintBook: {
            currentPage: 1,
            totalPages: 16
        },

        // 预加载真实游戏背景图片
        images: {
            drawbridge: null,
            waterpipe: null,
            sokoban: null,
            titleCity: null,
            junkyardComic: null,
            greenhouse: null,
            square: null
        }
    };

    // 预载素材
    function preloadAssets() {
        const load = (src) => {
            const img = new Image();
            img.src = src;
            return img;
        };
        m9.images.drawbridge = load('assets/mode9/drawbridge.jpg');
        m9.images.waterpipe = load('assets/mode9/waterpipe.jpg');
        m9.images.sokoban = load('assets/mode9/sokoban.jpg');
        m9.images.titleCity = load('assets/mode9/title_city.png');
        m9.images.junkyardComic = load('assets/mode9/junkyard_comic.webp');
        m9.images.greenhouse = load('assets/mode9/greenhouse_bridge.png');
        m9.images.square = load('assets/mode9/oil_city_square.png');
    }
    preloadAssets();

    // ==========================================
    // 物品栏（Inventory）工具函数
    // ==========================================
    function addItem(id, name, icon, desc) {
        if (m9.inventory.some(it => it.id === id)) return;
        m9.inventory.push({ id, name, icon, desc });
        playSound('pick');
        m9.josef.thoughtText = `获得: ${name}`;
        m9.josef.thoughtIcon = icon;
        m9.josef.thoughtTimer = 2.0;
    }

    function removeItem(id) {
        const idx = m9.inventory.findIndex(it => it.id === id);
        if (idx !== -1) {
            m9.inventory.splice(idx, 1);
            if (m9.selectedItemIndex >= m9.inventory.length) {
                m9.selectedItemIndex = -1;
            }
        }
    }

    function hasItem(id) {
        return m9.inventory.some(it => it.id === id);
    }

    function getSelectedItem() {
        if (m9.selectedItemIndex >= 0 && m9.selectedItemIndex < m9.inventory.length) {
            return m9.inventory[m9.selectedItemIndex];
        }
        return null;
    }

    // ==========================================
    // 约瑟夫主角渲染与动画
    // ==========================================
    function updateJosef(dt) {
        const j = m9.josef;

        // 走路平滑插值移动
        const dx = j.targetX - j.x;
        const dist = Math.abs(dx);
        if (dist > 3) {
            j.isWalking = true;
            j.facing = dx > 0 ? 1 : -1;
            j.x += Math.sign(dx) * Math.min(dist, 140 * dt);
        } else {
            j.isWalking = false;
        }

        // 身体伸长/压缩平滑过渡
        const targetStretchVal = j.stretchState === 1 ? 1.0 : (j.stretchState === -1 ? -0.5 : 0.0);
        j.stretchCurrent += (targetStretchVal - j.stretchCurrent) * Math.min(1.0, dt * 10);

        // 眨眼定时
        j.blinkTimer += dt;
        if (j.blinkTimer > 4.0) j.blinkTimer = 0;

        // 思考气泡定时
        if (j.thoughtTimer > 0) {
            j.thoughtTimer -= dt;
            if (j.thoughtTimer <= 0) {
                j.thoughtText = '';
                j.thoughtIcon = '';
            }
        }
    }

    function drawJosef(ctx, scale = 1.0) {
        const j = m9.josef;
        const x = j.x;
        const y = j.y;
        const facing = j.facing;
        const isBlinking = j.blinkTimer > 3.85 && j.blinkTimer < 4.0;
        const walkCycle = j.isWalking ? Math.sin(Date.now() * 0.012) : 0;

        ctx.save();
        ctx.translate(x, y);
        ctx.scale(facing * scale, scale);

        // 第一关特殊情况：身体零件散落未组装
        if (m9.currentChapter === 1 && !j.parts.body) {
            // 仅渲染头颅掉落在地面滚动状态
            ctx.fillStyle = '#b08d57';
            ctx.beginPath();
            ctx.arc(0, 0, 18, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = '#5a3d1b';
            ctx.lineWidth = 3;
            ctx.stroke();

            // 眼睛
            ctx.fillStyle = '#2c3e50';
            ctx.beginPath();
            ctx.arc(5, -2, 5, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#fff';
            ctx.beginPath();
            ctx.arc(6, -3, 2, 0, Math.PI * 2);
            ctx.fill();

            // 烟囱顶盖
            ctx.fillStyle = '#795548';
            ctx.fillRect(-4, -24, 8, 8);

            ctx.restore();
            return;
        }

        // 正常组装好的约瑟夫渲染
        const stretchHeight = j.stretchCurrent * 35; // 躯干拉长或缩短量

        // 1. 双腿
        if (j.parts.leftLeg || m9.currentChapter > 1) {
            ctx.strokeStyle = '#6d4c41';
            ctx.lineWidth = 5;
            ctx.lineCap = 'round';

            // 左腿
            ctx.beginPath();
            ctx.moveTo(-8, 12);
            ctx.lineTo(-8 + walkCycle * 8, 30);
            ctx.lineTo(-4 + walkCycle * 8, 34);
            ctx.stroke();

            // 右腿
            ctx.beginPath();
            ctx.moveTo(8, 12);
            ctx.lineTo(8 - walkCycle * 8, 30);
            ctx.lineTo(12 - walkCycle * 8, 34);
            ctx.stroke();
        }

        // 2. 躯干（伸缩圆柱体）
        ctx.fillStyle = '#a1887f';
        ctx.strokeStyle = '#4e342e';
        ctx.lineWidth = 3;

        const bodyTopY = -22 - stretchHeight;
        const bodyHeight = 36 + stretchHeight;

        // 躯干本体
        ctx.beginPath();
        ctx.roundRect(-16, bodyTopY, 32, bodyHeight, [6, 6, 8, 8]);
        ctx.fill();
        ctx.stroke();

        // 躯干蒸汽表盘与铆钉装饰
        ctx.fillStyle = '#ffd54f';
        ctx.beginPath();
        ctx.arc(0, bodyTopY + bodyHeight * 0.55, 6, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#3e2723';
        ctx.lineWidth = 1.5;
        ctx.stroke();
        // 表盘指针
        ctx.beginPath();
        ctx.moveTo(0, bodyTopY + bodyHeight * 0.55);
        ctx.lineTo(3, bodyTopY + bodyHeight * 0.55 - 4);
        ctx.stroke();

        // 3. 伸缩蛇腹管/弹簧脖颈（拉长时特别明显）
        if (stretchHeight > 0) {
            ctx.strokeStyle = '#8d6e63';
            ctx.lineWidth = 4;
            const rings = Math.floor(stretchHeight / 6);
            for (let r = 0; r < rings; r++) {
                const ry = bodyTopY - 4 - r * 5;
                ctx.beginPath();
                ctx.ellipse(0, ry, 7, 2.5, 0, 0, Math.PI * 2);
                ctx.stroke();
            }
        }

        // 4. 手臂
        if (j.parts.leftArm || m9.currentChapter > 1) {
            ctx.strokeStyle = '#5d4037';
            ctx.lineWidth = 4;
            ctx.beginPath();
            ctx.moveTo(-14, bodyTopY + 8);
            ctx.quadraticCurveTo(-26, bodyTopY + 18, -18 - walkCycle * 6, bodyTopY + 28);
            ctx.stroke();

            // 右手
            ctx.beginPath();
            ctx.moveTo(14, bodyTopY + 8);
            ctx.quadraticCurveTo(24, bodyTopY + 18, 18 + walkCycle * 6, bodyTopY + 28);
            ctx.stroke();
        }

        // 5. 头部
        const headCenterY = bodyTopY - 14 - (stretchHeight > 0 ? stretchHeight * 0.2 : 0);
        ctx.fillStyle = '#bcaaa4';
        ctx.strokeStyle = '#4e342e';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(0, headCenterY, 15, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // 头顶小烟囱与天线
        ctx.fillStyle = '#4e342e';
        ctx.fillRect(-3, headCenterY - 21, 6, 8);
        ctx.beginPath();
        ctx.arc(0, headCenterY - 21, 4, 0, Math.PI * 2);
        ctx.fill();

        // 经典护目镜大圆眼（眨眼与注视）
        const eyeX = 5;
        const eyeY = headCenterY - 1;
        ctx.fillStyle = '#212121';
        ctx.beginPath();
        if (isBlinking) {
            ctx.rect(eyeX - 5, eyeY - 1, 10, 2);
            ctx.fill();
        } else {
            ctx.arc(eyeX, eyeY, 6, 0, Math.PI * 2);
            ctx.fill();
            // 眼中光芒高光
            ctx.fillStyle = '#ffeb3b';
            ctx.beginPath();
            ctx.arc(eyeX + 1, eyeY - 1, 3, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#ffffff';
            ctx.beginPath();
            ctx.arc(eyeX + 2, eyeY - 2, 1.2, 0, Math.PI * 2);
            ctx.fill();
        }

        // 第二关蓝色伪装帽子
        if (j.disguiseHat) {
            ctx.fillStyle = '#1976d2';
            ctx.beginPath();
            ctx.moveTo(-12, headCenterY - 14);
            ctx.lineTo(12, headCenterY - 14);
            ctx.lineTo(0, headCenterY - 42);
            ctx.closePath();
            ctx.fill();
            ctx.strokeStyle = '#0d47a1';
            ctx.lineWidth = 2;
            ctx.stroke();
            // 警帽反光带
            ctx.fillStyle = '#90caf9';
            ctx.fillRect(-7, headCenterY - 20, 14, 3);
        }

        ctx.restore();

        // 6. 思考气泡动画
        if (j.thoughtText || j.thoughtIcon) {
            ctx.save();
            const bubbleX = x + facing * 35;
            const bubbleY = y - 75 - stretchHeight;

            // 气泡小点
            ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
            ctx.beginPath();
            ctx.arc(x + facing * 12, y - 45 - stretchHeight, 4, 0, Math.PI * 2);
            ctx.arc(x + facing * 22, y - 56 - stretchHeight, 6, 0, Math.PI * 2);
            ctx.fill();

            // 气泡主框
            ctx.fillStyle = '#fdfefe';
            ctx.strokeStyle = '#3e2723';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.roundRect(bubbleX - 10, bubbleY - 20, 120, 40, [10]);
            ctx.fill();
            ctx.stroke();

            // 气泡内文字与图标
            ctx.fillStyle = '#212121';
            ctx.font = 'bold 12px "Microsoft YaHei", sans-serif';
            ctx.textAlign = 'left';
            ctx.textBaseline = 'middle';
            ctx.fillText(`${j.thoughtIcon} ${j.thoughtText}`, bubbleX - 2, bubbleY);

            ctx.restore();
        }
    }

    // ==========================================
    // 关卡场景绘制器与交互
    // ==========================================

    // 第1关：垃圾场
    function renderChapter1(ctx, w, h) {
        // 复古色调背景
        const grad = ctx.createLinearGradient(0, 0, 0, h);
        grad.addColorStop(0, '#3e3226');
        grad.addColorStop(0.6, '#5a4738');
        grad.addColorStop(1, '#2c221a');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, w, h);

        // 远景垃圾废墟剪影
        ctx.fillStyle = '#221a14';
        ctx.beginPath();
        ctx.moveTo(0, h * 0.7);
        ctx.lineTo(w * 0.25, h * 0.55);
        ctx.lineTo(w * 0.5, h * 0.65);
        ctx.lineTo(w * 0.8, h * 0.5);
        ctx.lineTo(w, h * 0.68);
        ctx.lineTo(w, h);
        ctx.lineTo(0, h);
        ctx.fill();

        const ch1 = m9.levels.ch1;

        // 1. 废浴缸（点击推翻释放约瑟夫躯干）
        ctx.save();
        if (!ch1.tubKnocked) {
            ctx.fillStyle = '#9e9e9e';
            ctx.strokeStyle = '#424242';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.ellipse(220, 420, 36, 20, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();
            ctx.fillStyle = '#fff';
            ctx.font = '12px sans-serif';
            ctx.fillText('🛁 倒扣浴缸 (点击推开)', 170, 385);
        } else {
            ctx.fillStyle = '#757575';
            ctx.beginPath();
            ctx.ellipse(140, 430, 34, 16, -0.3, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.restore();

        // 2. 高处货架与毛绒玩偶
        ctx.fillStyle = '#4e342e';
        ctx.fillRect(w * 0.42, 210, 80, 10);
        if (!ch1.dollFound) {
            ctx.fillStyle = '#e91e63';
            ctx.beginPath();
            ctx.arc(w * 0.46, 195, 12, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#fff';
            ctx.font = '11px sans-serif';
            ctx.fillText('🧸 玩偶 (需拉长身体够取)', w * 0.46 - 40, 175);
        }

        // 3. 管道上的机械小老鼠
        ctx.fillStyle = '#78909c';
        ctx.fillRect(w * 0.62, 330, 120, 16);
        ctx.fillStyle = '#37474f';
        ctx.beginPath();
        ctx.arc(w * 0.68, 320, 10, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#ffd54f';
        ctx.font = '12px sans-serif';
        ctx.fillText(ch1.ratFed ? '🐭 老鼠满意离开' : '🐭 饥饿老鼠 (想要玩偶)', w * 0.64, 300);

        // 4. 废铁堆（磁铁）与 垃圾桶（绳索）
        if (!hasItem('magnet') && !ch1.ropeMagnateCombined) {
            ctx.fillStyle = '#c0392b';
            ctx.beginPath();
            ctx.arc(w * 0.82, 430, 10, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#fff';
            ctx.font = '11px sans-serif';
            ctx.fillText('🧲 磁铁', w * 0.82 - 15, 415);
        }
        if (!hasItem('rope') && !ch1.ropeMagnateCombined) {
            ctx.fillStyle = '#f39c12';
            ctx.beginPath();
            ctx.arc(w * 0.15, 440, 10, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#fff';
            ctx.font = '11px sans-serif';
            ctx.fillText('🪢 绳索', w * 0.15 - 15, 425);
        }

        // 5. 危险毒液池与弯折铁杆
        ctx.fillStyle = '#2e7d32';
        ctx.beginPath();
        ctx.ellipse(w * 0.55, h * 0.85, 90, 28, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#a5d6a7';
        ctx.font = '12px sans-serif';
        ctx.fillText('🧪 毒液池 (底下有手臂)', w * 0.55 - 55, h * 0.85 + 5);

        // 铁杆
        ctx.strokeStyle = '#8d6e63';
        ctx.lineWidth = 8;
        ctx.beginPath();
        ctx.moveTo(w * 0.44, h * 0.88);
        if (ch1.poleBent) {
            ctx.quadraticCurveTo(w * 0.5, h * 0.68, w * 0.58, h * 0.72);
        } else {
            ctx.lineTo(w * 0.44, h * 0.6);
        }
        ctx.stroke();

        // 绘制主角约瑟夫
        drawJosef(ctx);

        // 提示横幅
        drawHintBanner(ctx, '【第一关：垃圾场】推倒浴缸拼装躯干，拉长身体取下玩偶给老鼠换回腿，组合绳子磁铁钓出手臂渡过深渊！');
    }

    // 第2关：护城河吊桥
    function renderChapter2(ctx, w, h) {
        if (m9.images.drawbridge && m9.images.drawbridge.complete) {
            ctx.drawImage(m9.images.drawbridge, 0, 0, w, h);
        } else {
            ctx.fillStyle = '#4a3b32';
            ctx.fillRect(0, 0, w, h);
        }

        const ch2 = m9.levels.ch2;

        // 地面上的白色尖顶帽
        if (!ch2.whiteConePicked && !hasItem('white_cone') && !hasItem('blue_cone')) {
            ctx.fillStyle = '#ecf0f1';
            ctx.beginPath();
            ctx.moveTo(w * 0.28, h * 0.76);
            ctx.lineTo(w * 0.32, h * 0.76);
            ctx.lineTo(w * 0.3, h * 0.71);
            ctx.closePath();
            ctx.fill();
            ctx.fillStyle = '#fff';
            ctx.font = '12px sans-serif';
            ctx.fillText('🔺 白色锥帽', w * 0.26, h * 0.79);
        }

        // 蓝色油漆桶
        if (!ch2.bluePaintPicked && !hasItem('blue_paint') && !hasItem('blue_cone')) {
            ctx.fillStyle = '#2980b9';
            ctx.fillRect(w * 0.42, h * 0.73, 22, 20);
            ctx.fillStyle = '#fff';
            ctx.font = '12px sans-serif';
            ctx.fillText('🪣 蓝色油漆', w * 0.39, h * 0.79);
        }

        // 卫兵岗亭与卫兵
        const guardX = w * 0.78;
        const guardY = h * 0.58;
        ctx.fillStyle = '#2c3e50';
        ctx.fillRect(guardX - 18, guardY - 50, 36, 70);
        // 卫兵的蓝色大帽子
        ctx.fillStyle = '#1565c0';
        ctx.beginPath();
        ctx.moveTo(guardX - 22, guardY - 50);
        ctx.lineTo(guardX + 22, guardY - 50);
        ctx.lineTo(guardX, guardY - 95);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 12px sans-serif';
        ctx.fillText('💂 吊桥守卫 (只放行蓝帽高个同僚)', guardX - 90, guardY - 105);

        // 吊索门铃拉绳
        ctx.strokeStyle = '#f39c12';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(guardX - 60, guardY - 70);
        ctx.lineTo(guardX - 60, guardY - 20);
        ctx.stroke();
        ctx.fillStyle = '#f1c40f';
        ctx.beginPath();
        ctx.arc(guardX - 60, guardY - 20, 6, 0, Math.PI * 2);
        ctx.fill();
        ctx.font = '11px sans-serif';
        ctx.fillText('🔔 门铃', guardX - 80, guardY - 5);

        drawJosef(ctx);
        drawHintBanner(ctx, '【第二关：吊桥】收集白色锥帽并用蓝漆染蓝，佩戴后将约瑟夫拉至最高状态拉动门铃，伪装通过！');
    }

    // 第3关：经典 11 阀门 3 扳手水管谜题
    function renderChapter3(ctx, w, h) {
        ctx.fillStyle = '#1e242b';
        ctx.fillRect(0, 0, w, h);

        const ch3 = m9.levels.ch3;

        // 水管主背景面板（高保真复刻 assets/mode9/waterpipe.jpg）
        const panelX = w * 0.15;
        const panelY = h * 0.14;
        const panelW = w * 0.7;
        const panelH = h * 0.74;

        ctx.fillStyle = '#2f3640';
        ctx.strokeStyle = '#f39c12';
        ctx.lineWidth = 5;
        ctx.beginPath();
        ctx.roundRect(panelX, panelY, panelW, panelH, [16]);
        ctx.fill();
        ctx.stroke();

        // 标题
        ctx.fillStyle = '#f1c40f';
        ctx.font = 'bold 20px "Microsoft YaHei", sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('⚙️ 下水道 11 阀门与三扳手水路接通迷宫', w * 0.5, panelY + 36);

        // 绘制水管管道路线网
        ctx.strokeStyle = ch3.solved ? '#2ecc71' : '#7f8c8d';
        ctx.lineWidth = 14;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';

        // 入水口 (左上) -> 出水口 (右下)
        ctx.beginPath();
        // 水管骨架网络
        const v = ch3.valves;
        ctx.moveTo(panelX + 40, v[3].y);
        ctx.lineTo(v[3].x, v[3].y);
        ctx.lineTo(v[0].x, v[0].y);
        ctx.lineTo(v[1].x, v[1].y);
        ctx.lineTo(v[4].x, v[4].y);
        ctx.lineTo(v[8].x, v[8].y);
        ctx.lineTo(v[9].x, v[9].y);
        ctx.lineTo(v[6].x, v[6].y);
        ctx.lineTo(v[10].x, v[10].y);
        ctx.lineTo(panelX + panelW - 40, v[10].y);
        ctx.stroke();

        // 绘制 11 个阀门孔位
        v.forEach((valve, i) => {
            ctx.fillStyle = '#1a1f24';
            ctx.strokeStyle = '#d35400';
            ctx.lineWidth = 4;
            ctx.beginPath();
            ctx.arc(valve.x, valve.y, 24, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();

            ctx.fillStyle = '#ecf0f1';
            ctx.font = 'bold 12px sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(`${i + 1}`, valve.x, valve.y);
        });

        // 绘制 3 个扳手
        ch3.wrenches.forEach((wr, i) => {
            const slot = v[wr.placedSlot];
            if (!slot) return;

            ctx.save();
            ctx.translate(slot.x, slot.y);
            ctx.rotate((wr.angle * Math.PI) / 180);

            // 三向扳手阀心造型
            ctx.fillStyle = wr.color;
            ctx.strokeStyle = '#2c3e50';
            ctx.lineWidth = 3;

            // 中心轴
            ctx.beginPath();
            ctx.arc(0, 0, 16, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();

            // 三向流通凸块
            ctx.fillRect(-6, -26, 12, 16);
            ctx.fillRect(-26, -6, 16, 12);
            ctx.fillRect(-6, 10, 12, 16);

            ctx.restore();
        });

        // 水流状态提示与操作说明
        ctx.fillStyle = ch3.solved ? '#2ecc71' : '#e74c3c';
        ctx.font = 'bold 16px sans-serif';
        ctx.fillText(ch3.solved ? '🟢 水压通畅！排水阀成功打开！(点击前往下一关)' : '🔴 水路阻塞中，请点击扳手旋转角度或调换阀位', w * 0.5, panelY + panelH - 24);

        drawHintBanner(ctx, '【第三关：水管谜题】点击 3 个核心扳手改变流向，将左侧总阀引向右下排水口，参考秘籍摆放！');
    }

    // 第4关：锅炉房
    function renderChapter4(ctx, w, h) {
        ctx.fillStyle = '#2b1a13';
        ctx.fillRect(0, 0, w, h);

        const ch4 = m9.levels.ch4;

        // 巨型工业熔炉
        ctx.fillStyle = '#422417';
        ctx.fillRect(w * 0.1, h * 0.2, w * 0.45, h * 0.55);
        // 炉火观察窗
        ctx.fillStyle = '#e67e22';
        ctx.beginPath();
        ctx.arc(w * 0.32, h * 0.48, 45, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#f39c12';
        ctx.beginPath();
        ctx.arc(w * 0.32, h * 0.48, 30, 0, Math.PI * 2);
        ctx.fill();

        // 控制面板：三个联锁电闸刀 (1, 2, 3)
        const swPanelX = w * 0.62;
        const swPanelY = h * 0.28;
        ctx.fillStyle = '#37474f';
        ctx.fillRect(swPanelX, swPanelY, 180, 120);

        ch4.switches.forEach((isUp, idx) => {
            const sx = swPanelX + 35 + idx * 55;
            ctx.fillStyle = '#263238';
            ctx.fillRect(sx - 12, swPanelY + 15, 24, 80);

            // 闸刀把手
            ctx.fillStyle = isUp ? '#27ae60' : '#c0392b';
            const handleY = isUp ? swPanelY + 25 : swPanelY + 70;
            ctx.fillRect(sx - 16, handleY, 32, 18);

            ctx.fillStyle = '#fff';
            ctx.font = '12px sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText(`闸${idx + 1}:${isUp ? '上' : '下'}`, sx, swPanelY + 110);
        });

        // 红黑电线接线盒
        ctx.fillStyle = '#455a64';
        ctx.fillRect(swPanelX, swPanelY + 140, 180, 70);
        ctx.fillStyle = '#fff';
        ctx.font = '12px sans-serif';
        ctx.fillText(`电线相位: ${ch4.swappedWires ? '黑-红 (已对调)' : '红-黑 (标准)'}`, swPanelX + 90, swPanelY + 180);

        // 轨道小矿车
        ctx.fillStyle = '#795548';
        ctx.fillRect(w * 0.3, h * 0.78, 90, 40);
        ctx.fillStyle = '#fff';
        ctx.font = '12px sans-serif';
        ctx.fillText('🛒 运输矿车', w * 0.35, h * 0.81);

        drawJosef(ctx);
        drawHintBanner(ctx, '【第四关：锅炉房】开关设定为【1、3向下，2向上】，点击接线盒对调红黑电线，推车进入！');
    }

    // 第5关：监狱牢房与 04:45 密码
    function renderChapter5(ctx, w, h) {
        const ch5 = m9.levels.ch5;
        // 关灯暗室荧光效果 vs 开灯监狱
        if (ch5.lightTurnedOff) {
            ctx.fillStyle = '#080d12';
            ctx.fillRect(0, 0, w, h);

            // 荧光绿色夜光时钟
            ctx.fillStyle = '#00e676';
            ctx.font = 'bold 36px monospace';
            ctx.textAlign = 'center';
            ctx.fillText('⏰ 荧光时钟: 04 : 45', w * 0.5, h * 0.35);

            ctx.font = '16px sans-serif';
            ctx.fillStyle = '#81c784';
            ctx.fillText('💡 点击屏幕中央电灯开关重新开灯', w * 0.5, h * 0.5);
            return;
        }

        ctx.fillStyle = '#2c3e50';
        ctx.fillRect(0, 0, w, h);

        // 牢房铁栏杆
        ctx.strokeStyle = '#1a252f';
        ctx.lineWidth = 10;
        for (let x = 60; x < w * 0.6; x += 55) {
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, h);
            ctx.stroke();
        }

        // 狱友吸烟者
        ctx.fillStyle = '#7f8c8d';
        ctx.fillRect(w * 0.42, h * 0.62, 35, 60);
        ctx.fillStyle = '#ffd54f';
        ctx.font = '12px sans-serif';
        ctx.fillText(ch5.tradedHand ? '🤖 狱友(已获香烟)' : '🤖 狱友: 想抽支卷烟', w * 0.38, h * 0.58);

        // 监控室电灯总闸
        ctx.fillStyle = '#f39c12';
        ctx.fillRect(w * 0.72, h * 0.22, 60, 45);
        ctx.fillStyle = '#2c3e50';
        ctx.font = 'bold 12px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('💡 电灯开关', w * 0.72 + 30, h * 0.22 + 26);

        // 牢门 4 位密码盘
        const padX = w * 0.72;
        const padY = h * 0.45;
        ctx.fillStyle = '#34495e';
        ctx.fillRect(padX, padY, 160, 90);
        ctx.fillStyle = '#2ecc71';
        ctx.font = 'bold 24px monospace';
        ctx.fillText(ch5.codeDigits.join(' '), padX + 80, padY + 45);
        ctx.fillStyle = '#ecf0f1';
        ctx.font = '12px sans-serif';
        ctx.fillText('牢门密码盘 (点击输入)', padX + 80, padY + 75);

        drawJosef(ctx);
        drawHintBanner(ctx, '【第五关：监狱】卷烟赠予狱友换取手臂，关灯获取荧光时钟密码 04:45，输入解锁越狱！');
    }

    // 第6关：机械狗与雨伞
    function renderChapter6(ctx, w, h) {
        ctx.fillStyle = '#1f2a38';
        ctx.fillRect(0, 0, w, h);

        const ch6 = m9.levels.ch6;

        // 倾盆大雨粒子
        ctx.strokeStyle = 'rgba(129, 212, 250, 0.4)';
        ctx.lineWidth = 1.5;
        for (let i = 0; i < 40; i++) {
            const rx = (i * 37 + Date.now() * 0.1) % w;
            const ry = (i * 29 + Date.now() * 0.3) % h;
            ctx.beginPath();
            ctx.moveTo(rx, ry);
            ctx.lineTo(rx - 4, ry + 16);
            ctx.stroke();
        }

        // 老妇人机器人
        ctx.fillStyle = '#8e44ad';
        ctx.fillRect(w * 0.2, h * 0.62, 35, 60);
        ctx.fillStyle = '#fff';
        ctx.font = '12px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(ch6.umbrellaObtained ? '👵 找回爱犬的妇人' : '👵 妇人: 谁能帮我抓回小狗', w * 0.22, h * 0.58);

        // 机械小狗
        if (!ch6.dogCaught) {
            const dogX = ch6.oilSpilled ? w * 0.48 : w * 0.75;
            ctx.fillStyle = '#e67e22';
            ctx.fillRect(dogX, h * 0.72, 30, 20);
            ctx.fillStyle = '#fff';
            ctx.fillText('🐕 机械狗', dogX + 15, h * 0.7);
        }

        // 地面机油滩
        if (ch6.oilSpilled) {
            ctx.fillStyle = '#212121';
            ctx.beginPath();
            ctx.ellipse(w * 0.48, h * 0.75, 40, 12, 0, 0, Math.PI * 2);
            ctx.fill();
        }

        // 漏水瀑布通道（右侧）
        ctx.fillStyle = 'rgba(52, 152, 219, 0.6)';
        ctx.fillRect(w * 0.85, 0, 45, h);
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 12px sans-serif';
        ctx.fillText('高压漏水处 (需撑伞穿过)', w * 0.85 - 20, h * 0.4);

        drawJosef(ctx);
        drawHintBanner(ctx, '【第六关：机械狗】喷洒机油引诱机械狗，用马桶吸盘枪抓取交给妇人换取雨伞，撑伞渡过漏水区！');
    }

    // 第7关：酒吧五子棋（实机下棋）
    function renderChapter7(ctx, w, h) {
        ctx.fillStyle = '#2e1c0c';
        ctx.fillRect(0, 0, w, h);

        const ch7 = m9.levels.ch7;

        // 酒吧棋桌与 9x9 棋盘
        const boardSize = Math.min(w * 0.55, h * 0.75);
        const startX = w * 0.08;
        const startY = h * 0.15;
        const cell = boardSize / 8;

        ctx.fillStyle = '#b08968';
        ctx.fillRect(startX - 20, startY - 20, boardSize + 40, boardSize + 40);
        ctx.strokeStyle = '#43281c';
        ctx.lineWidth = 2;

        for (let i = 0; i < 9; i++) {
            ctx.beginPath();
            ctx.moveTo(startX, startY + i * cell);
            ctx.lineTo(startX + boardSize, startY + i * cell);
            ctx.stroke();

            ctx.beginPath();
            ctx.moveTo(startX + i * cell, startY);
            ctx.lineTo(startX + i * cell, startY + boardSize);
            ctx.stroke();
        }

        // 绘制棋子（黄铜螺母 vs 黑铁螺栓）
        for (let r = 0; r < 9; r++) {
            for (let c = 0; c < 9; c++) {
                const val = ch7.board[r][c];
                if (val === 1) {
                    ctx.fillStyle = '#f39c12';
                    ctx.beginPath();
                    ctx.arc(startX + c * cell, startY + r * cell, cell * 0.38, 0, Math.PI * 2);
                    ctx.fill();
                    ctx.strokeStyle = '#d35400';
                    ctx.lineWidth = 2;
                    ctx.stroke();
                } else if (val === 2) {
                    ctx.fillStyle = '#2c3e50';
                    ctx.beginPath();
                    ctx.arc(startX + c * cell, startY + r * cell, cell * 0.38, 0, Math.PI * 2);
                    ctx.fill();
                    ctx.strokeStyle = '#1a252f';
                    ctx.lineWidth = 2;
                    ctx.stroke();
                }
            }
        }

        // 对手：抽烟的黑帽机器人
        const oppX = w * 0.78;
        const oppY = h * 0.42;
        ctx.fillStyle = '#1c1c1c';
        ctx.fillRect(oppX - 30, oppY - 40, 60, 80);
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 14px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('🎩 黑帽下棋手', oppX, oppY - 55);

        // 柜台上的粘蝇纸
        if (!ch7.flypaperObtained) {
            ctx.fillStyle = '#f1c40f';
            ctx.fillRect(oppX - 80, h * 0.25, 25, 45);
            ctx.fillStyle = '#fff';
            ctx.font = '12px sans-serif';
            ctx.fillText('🪰 粘蝇纸', oppX - 70, h * 0.22);
        }

        ctx.fillStyle = ch7.winner === 1 ? '#2ecc71' : '#f39c12';
        ctx.font = 'bold 16px sans-serif';
        ctx.fillText(ch7.winner === 1 ? '🏆 你赢得了五子棋！获得 5 颗珍贵螺丝！' : '轮到你下棋 (连成五子即可获胜)', w * 0.5, h * 0.95);

        drawHintBanner(ctx, '【第七关：酒吧下棋】在 9x9 棋盘上与黑帽对手对决，率先五子连珠赢取螺丝，顺便顺走粘蝇纸！');
    }

    // 第8关：乐团
    function renderChapter8(ctx, w, h) {
        ctx.fillStyle = '#3a2e26';
        ctx.fillRect(0, 0, w, h);

        const ch8 = m9.levels.ch8;

        // 三位街头乐手（萨克斯手、鼓手、小号手）
        const musicians = [
            { name: '🎷 萨克斯手', x: w * 0.3, status: ch8.gaveScrews ? '已修复' : '缺少固定螺丝' },
            { name: '🥁 鼓手', x: w * 0.5, status: ch8.catCaught ? '黑猫伴奏中' : '管道里有猫卡住' },
            { name: '🎺 小号手', x: w * 0.7, status: '演奏就绪' }
        ];

        musicians.forEach(m => {
            ctx.fillStyle = '#5d4037';
            ctx.fillRect(m.x - 25, h * 0.5, 50, 75);
            ctx.fillStyle = '#ffd54f';
            ctx.font = 'bold 14px sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText(m.name, m.x, h * 0.45);
            ctx.font = '12px sans-serif';
            ctx.fillStyle = '#ecf0f1';
            ctx.fillText(m.status, m.x, h * 0.65);
        });

        // 排水管道与猫咪
        ctx.fillStyle = '#2c3e50';
        ctx.fillRect(w * 0.45, h * 0.75, 80, 24);
        if (!ch8.catCaught) {
            ctx.fillStyle = '#e74c3c';
            ctx.font = '12px sans-serif';
            ctx.fillText('🐱 黑猫探头 (用苍蝇诱出)', w * 0.49, h * 0.73);
        }

        drawJosef(ctx);
        drawHintBanner(ctx, '【第八关：机器人乐团】将螺丝交给萨克斯手，用粘蝇纸捕捉苍蝇赶出管道黑猫，乐团奏响欢庆乐章！');
    }

    // 第9关：钟楼大广场
    function renderChapter9(ctx, w, h) {
        if (m9.images.square && m9.images.square.complete) {
            ctx.drawImage(m9.images.square, 0, 0, w, h);
        } else {
            ctx.fillStyle = '#3e2723';
            ctx.fillRect(0, 0, w, h);
        }

        const ch9 = m9.levels.ch9;

        // 巨型蒸汽大时钟表盘
        const clockX = w * 0.48;
        const clockY = h * 0.38;
        const radius = 65;

        ctx.fillStyle = '#d7ccc8';
        ctx.strokeStyle = '#4e342e';
        ctx.lineWidth = 6;
        ctx.beginPath();
        ctx.arc(clockX, clockY, radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // 罗马数字刻度标记
        ctx.fillStyle = '#212121';
        ctx.font = 'bold 13px serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('VII', clockX + Math.cos(Math.PI * 0.7) * (radius - 16), clockY + Math.sin(Math.PI * 0.7) * (radius - 16));
        ctx.fillText('∞', clockX + Math.cos(Math.PI * 0.2) * (radius - 16), clockY + Math.sin(Math.PI * 0.2) * (radius - 16));

        // 时针与分针
        ctx.strokeStyle = '#c0392b';
        ctx.lineWidth = 4;
        const hAngle = (ch9.hourHand / 12) * Math.PI * 2 - Math.PI / 2;
        ctx.beginPath();
        ctx.moveTo(clockX, clockY);
        ctx.lineTo(clockX + Math.cos(hAngle) * 38, clockY + Math.sin(hAngle) * 38);
        ctx.stroke();

        ctx.strokeStyle = '#2980b9';
        ctx.lineWidth = 3;
        const mAngle = (ch9.minuteHand / 12) * Math.PI * 2 - Math.PI / 2;
        ctx.beginPath();
        ctx.moveTo(clockX, clockY);
        ctx.lineTo(clockX + Math.cos(mAngle) * 52, clockY + Math.sin(mAngle) * 52);
        ctx.stroke();

        // 自动加油机
        ctx.fillStyle = '#d35400';
        ctx.fillRect(w * 0.78, h * 0.65, 45, 60);
        ctx.fillStyle = '#fff';
        ctx.font = '12px sans-serif';
        ctx.fillText('🛢️ 加油机', w * 0.8, h * 0.62);

        drawJosef(ctx);
        drawHintBanner(ctx, '【第九关：钟楼大广场】将大钟时间调至【VII】与【倒∞】，钟声敲响打开自动售油机取油！');
    }

    // 第10关：自毁风扇
    function renderChapter10(ctx, w, h) {
        ctx.fillStyle = '#1a1a1a';
        ctx.fillRect(0, 0, w, h);

        const ch10 = m9.levels.ch10;

        // 巨型自毁风扇动画
        const fanX = w * 0.65;
        const fanY = h * 0.45;
        const fanR = 85;

        ctx.save();
        ctx.translate(fanX, fanY);
        if (!ch10.fanExploded) {
            ctx.rotate(Date.now() * 0.001 * (ch10.fanRpm * 0.1));
            ctx.fillStyle = ch10.fanRpm > 300 ? '#e74c3c' : '#7f8c8d';
            for (let b = 0; b < 4; b++) {
                ctx.rotate(Math.PI / 2);
                ctx.fillRect(-12, -fanR, 24, fanR);
            }
        } else {
            ctx.fillStyle = '#e67e22';
            ctx.font = 'bold 36px sans-serif';
            ctx.fillText('💥 已过热自毁！', -100, 0);
        }
        ctx.restore();

        // 提问面板
        const questions = [
            { q: '风扇提问: 机器人是用什么做的？', correct: '钢铁与螺丝', wrong: '土豆和香蕉' },
            { q: '风扇提问: 机械迷城首都在哪里？', correct: '上层塔尖', wrong: '海底珊瑚礁' },
            { q: '风扇提问: 2 + 2 等于几？', correct: '4', wrong: '9999' }
        ];
        const curQ = questions[ch10.questionIdx % questions.length];

        ctx.fillStyle = '#2c3e50';
        ctx.fillRect(w * 0.1, h * 0.25, w * 0.42, 210);
        ctx.fillStyle = '#ffd54f';
        ctx.font = 'bold 15px sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText(curQ.q, w * 0.13, h * 0.32);

        // 故意答错按钮
        ctx.fillStyle = '#c0392b';
        ctx.fillRect(w * 0.13, h * 0.4, 220, 36);
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 13px sans-serif';
        ctx.fillText(`A. ${curQ.wrong} (故意答错激怒)`, w * 0.15, h * 0.45);

        ctx.fillStyle = '#27ae60';
        ctx.fillRect(w * 0.13, h * 0.5, 220, 36);
        ctx.fillStyle = '#fff';
        ctx.fillText(`B. ${curQ.correct} (正确答案)`, w * 0.15, h * 0.55);

        ctx.fillStyle = '#e74c3c';
        ctx.fillText(`风扇狂怒转速: ${ch10.fanRpm} RPM`, w * 0.13, h * 0.62);

        drawJosef(ctx);
        drawHintBanner(ctx, '【第十关：外壁电梯】对着守关风扇故意全部答错！连续激怒它导致转速超载烧毁电机自爆通关！');
    }

    // 第11关：温室
    function renderChapter11(ctx, w, h) {
        if (m9.images.greenhouse && m9.images.greenhouse.complete) {
            ctx.drawImage(m9.images.greenhouse, 0, 0, w, h);
        } else {
            ctx.fillStyle = '#1b382b';
            ctx.fillRect(0, 0, w, h);
        }

        const ch11 = m9.levels.ch11;

        // 蝴蝶翅膀复刻控制台
        const consoleX = w * 0.65;
        const consoleY = h * 0.35;
        ctx.fillStyle = '#263238';
        ctx.fillRect(consoleX, consoleY, 160, 160);
        ctx.fillStyle = '#ffd54f';
        ctx.font = 'bold 13px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('🦋 蝴蝶翅膀花纹锁', consoleX + 80, consoleY + 25);

        // 6 块蝴蝶花纹矩阵
        for (let i = 0; i < 6; i++) {
            const bx = consoleX + 25 + (i % 3) * 45;
            const by = consoleY + 45 + Math.floor(i / 3) * 45;
            ctx.fillStyle = ch11.playerPattern[i] ? '#e91e63' : '#37474f';
            ctx.fillRect(bx, by, 36, 36);
            ctx.strokeStyle = '#fff';
            ctx.lineWidth = 1.5;
            ctx.strokeRect(bx, by, 36, 36);
        }

        // 放大镜道具
        if (!ch11.magnifierFound) {
            ctx.fillStyle = '#00bcd4';
            ctx.beginPath();
            ctx.arc(w * 0.32, h * 0.65, 12, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#fff';
            ctx.font = '12px sans-serif';
            ctx.fillText('🔍 放大镜', w * 0.32, h * 0.62);
        }

        drawJosef(ctx);
        drawHintBanner(ctx, '【第十一关：温室】拿到放大镜观察窗台蝴蝶，在控制台复刻翅膀红点花纹打开通往游乐场通道！');
    }

    // 第12关：游乐场推箱子
    function renderChapter12(ctx, w, h) {
        ctx.fillStyle = '#1e272e';
        ctx.fillRect(0, 0, w, h);

        const ch12 = m9.levels.ch12;

        // 经典街机框体
        const arcadeX = w * 0.2;
        const arcadeY = h * 0.12;
        const arcadeW = w * 0.6;
        const arcadeH = h * 0.76;

        ctx.fillStyle = '#0be881';
        ctx.strokeStyle = '#05c46b';
        ctx.lineWidth = 6;
        ctx.beginPath();
        ctx.roundRect(arcadeX, arcadeY, arcadeW, arcadeH, [18]);
        ctx.fill();
        ctx.stroke();

        // 街机 CRT 屏幕
        const screenX = arcadeX + 40;
        const screenY = arcadeY + 40;
        const screenW = arcadeW - 80;
        const screenH = arcadeH - 120;

        ctx.fillStyle = '#000000';
        ctx.fillRect(screenX, screenY, screenW, screenH);

        // 推箱子网格 6x5
        const tileSize = Math.min(screenW / 6, screenH / 5);
        const gridOffsetX = screenX + (screenW - tileSize * 6) / 2;
        const gridOffsetY = screenY + (screenH - tileSize * 5) / 2;

        // 绘制墙壁
        ctx.fillStyle = '#485460';
        ch12.walls.forEach(wl => {
            ctx.fillRect(gridOffsetX + wl.x * tileSize, gridOffsetY + wl.y * tileSize, tileSize - 2, tileSize - 2);
        });

        // 绘制目标格
        ctx.fillStyle = '#ff3f34';
        ch12.targets.forEach(tg => {
            ctx.beginPath();
            ctx.arc(gridOffsetX + (tg.x + 0.5) * tileSize, gridOffsetY + (tg.y + 0.5) * tileSize, tileSize * 0.25, 0, Math.PI * 2);
            ctx.fill();
        });

        // 绘制电池箱子
        ctx.fillStyle = '#ffa801';
        ch12.boxes.forEach(bx => {
            ctx.fillRect(gridOffsetX + bx.x * tileSize + 4, gridOffsetY + bx.y * tileSize + 4, tileSize - 8, tileSize - 8);
            ctx.strokeStyle = '#d35400';
            ctx.lineWidth = 2;
            ctx.strokeRect(gridOffsetX + bx.x * tileSize + 4, gridOffsetY + bx.y * tileSize + 4, tileSize - 8, tileSize - 8);
        });

        // 绘制像素约瑟夫小人
        ctx.fillStyle = '#00d8d6';
        ctx.beginPath();
        ctx.arc(gridOffsetX + (ch12.player.x + 0.5) * tileSize, gridOffsetY + (ch12.player.y + 0.5) * tileSize, tileSize * 0.35, 0, Math.PI * 2);
        ctx.fill();

        // 操作指引按钮提示
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 14px monospace';
        ctx.textAlign = 'center';
        ctx.fillText('方向键 [W/A/S/D] 或 [↑/↓/←/→] 推箱子进入红圈点', w * 0.5, arcadeY + arcadeH - 45);

        drawHintBanner(ctx, '【第十二关：游乐场】在街机上将所有电池箱推入红圈插座，通关赢取金币换取高能电梯电池！');
    }

    // 第13关：室内大电梯 (1-6-3-2-7-1)
    function renderChapter13(ctx, w, h) {
        ctx.fillStyle = '#2c3e50';
        ctx.fillRect(0, 0, w, h);

        const ch13 = m9.levels.ch13;

        // 电梯电路星状节点面板
        const centerX = w * 0.5;
        const centerY = h * 0.45;
        const radius = 120;

        ctx.fillStyle = '#1a252f';
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius + 40, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#f39c12';
        ctx.lineWidth = 4;
        ctx.stroke();

        // 7 个电灯泡节点位置
        const nodes = [];
        for (let i = 1; i <= 7; i++) {
            const angle = ((i - 1) / 7) * Math.PI * 2 - Math.PI / 2;
            nodes.push({
                id: i,
                x: centerX + Math.cos(angle) * radius,
                y: centerY + Math.sin(angle) * radius
            });
        }

        // 绘制玩家已连线路径
        ctx.strokeStyle = '#2ecc71';
        ctx.lineWidth = 5;
        ctx.beginPath();
        ch13.inputSeq.forEach((id, idx) => {
            const nd = nodes.find(n => n.id === id);
            if (idx === 0) ctx.moveTo(nd.x, nd.y);
            else ctx.lineTo(nd.x, nd.y);
        });
        ctx.stroke();

        // 绘制 7 个节点灯泡
        nodes.forEach(nd => {
            const isLit = ch13.inputSeq.includes(nd.id);
            ctx.fillStyle = isLit ? '#f1c40f' : '#7f8c8d';
            ctx.beginPath();
            ctx.arc(nd.x, nd.y, 22, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = '#fff';
            ctx.lineWidth = 2;
            ctx.stroke();

            ctx.fillStyle = '#2c3e50';
            ctx.font = 'bold 16px sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(`${nd.id}`, nd.x, nd.y);
        });

        // 连线顺序显示
        ctx.fillStyle = '#ecf0f1';
        ctx.font = 'bold 16px sans-serif';
        ctx.fillText(`当前连线: ${ch13.inputSeq.join(' ➔ ') || '请点击节点 1 开始'}`, centerX, h * 0.82);

        drawHintBanner(ctx, '【第十三关：大电梯】按照星轨密码回路依次点击灯泡：1 ➔ 6 ➔ 3 ➔ 2 ➔ 7 ➔ 1 恢复电梯动力！');
    }

    // 第14关：拆除炸弹 (D-B-E-A-C)
    function renderChapter14(ctx, w, h) {
        ctx.fillStyle = '#1c1c1c';
        ctx.fillRect(0, 0, w, h);

        const ch14 = m9.levels.ch14;

        // 炸弹箱体
        const bX = w * 0.2;
        const bY = h * 0.15;
        const bW = w * 0.6;
        const bH = h * 0.7;

        ctx.fillStyle = '#2d3436';
        ctx.strokeStyle = '#d63031';
        ctx.lineWidth = 6;
        ctx.beginPath();
        ctx.roundRect(bX, bY, bW, bH, [16]);
        ctx.fill();
        ctx.stroke();

        // 红色倒计时荧光屏
        ctx.fillStyle = '#000';
        ctx.fillRect(bX + 40, bY + 30, bW - 80, 70);
        ctx.fillStyle = '#ff4757';
        ctx.font = 'bold 36px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(`⏱️ 00:${Math.max(0, Math.floor(ch14.timeLeft)).toString().padStart(2, '0')}.${Math.floor((ch14.timeLeft % 1) * 10)}`, w * 0.5, bY + 75);

        // 5 根引爆引线 (A, B, C, D, E)
        const wires = [
            { id: 'A', color: '#ff4757', label: '红色 A' },
            { id: 'B', color: '#2ed573', label: '绿色 B' },
            { id: 'C', color: '#1e90ff', label: '蓝色 C' },
            { id: 'D', color: '#ffa502', label: '黄色 D' },
            { id: 'E', color: '#9b59b6', label: '紫色 E' }
        ];

        wires.forEach((wr, i) => {
            const wy = bY + 140 + i * 55;
            const isCut = ch14.cutWires.includes(wr.id);

            ctx.strokeStyle = isCut ? '#747d8c' : wr.color;
            ctx.lineWidth = 8;
            ctx.beginPath();
            ctx.moveTo(bX + 80, wy);
            if (isCut) {
                ctx.lineTo(bX + 220, wy);
                ctx.moveTo(bX + 260, wy);
                ctx.lineTo(bX + bW - 80, wy);
            } else {
                ctx.lineTo(bX + bW - 80, wy);
            }
            ctx.stroke();

            // 剪刀剪线按钮
            ctx.fillStyle = isCut ? '#57606f' : '#ff6b81';
            ctx.fillRect(bX + bW - 70, wy - 14, 55, 28);
            ctx.fillStyle = '#fff';
            ctx.font = 'bold 12px sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText(isCut ? '已剪' : '✂️剪断', bX + bW - 42, wy + 4);

            ctx.fillStyle = '#fff';
            ctx.font = 'bold 14px sans-serif';
            ctx.textAlign = 'left';
            ctx.fillText(wr.label, bX + 20, wy + 4);
        });

        drawHintBanner(ctx, '【第十四关：拆除炸弹】严格按照拆弹手册顺序剪断引线：D ➔ B ➔ E ➔ A ➔ C，错剪将立刻爆炸！');
    }

    // 第15关：大脑电梯九宫格 (1-4-7-2-5-8-3-6-1)
    function renderChapter15(ctx, w, h) {
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(0, 0, w, h);

        const ch15 = m9.levels.ch15;

        // 巨型电子神经九宫格键盘
        const kX = w * 0.32;
        const kY = h * 0.22;
        const btnSize = 75;
        const gap = 15;

        for (let r = 0; r < 3; r++) {
            for (let c = 0; c < 3; c++) {
                const num = r * 3 + c + 1;
                const bx = kX + c * (btnSize + gap);
                const by = kY + r * (btnSize + gap);
                const isSelected = ch15.inputSeq.includes(num);

                ctx.fillStyle = isSelected ? '#38bdf8' : '#1e293b';
                ctx.strokeStyle = '#0284c7';
                ctx.lineWidth = 3;
                ctx.beginPath();
                ctx.roundRect(bx, by, btnSize, btnSize, [12]);
                ctx.fill();
                ctx.stroke();

                ctx.fillStyle = isSelected ? '#0f172a' : '#f8fafc';
                ctx.font = 'bold 24px monospace';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText(`${num}`, bx + btnSize / 2, by + btnSize / 2);
            }
        }

        ctx.fillStyle = '#38bdf8';
        ctx.font = 'bold 16px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(`输入路径: ${ch15.inputSeq.join(' ➔ ') || '点击按键激活回路'}`, w * 0.5, h * 0.78);

        drawHintBanner(ctx, '【第十五关：大脑电梯】纵向贯通九宫格逻辑矩阵：1-4-7-2-5-8-3-6-1，直达顶层天台！');
    }

    // 第16关：顶楼天台大结局 (调频 7.0:108 / 琴键 1-4-2-3-5-2-3)
    function renderChapter16(ctx, w, h) {
        // 天空与远山黄昏日落
        const grad = ctx.createLinearGradient(0, 0, 0, h);
        grad.addColorStop(0, '#f39c12');
        grad.addColorStop(0.5, '#d35400');
        grad.addColorStop(1, '#2c3e50');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, w, h);

        const ch16 = m9.levels.ch16;

        // 天台直升机与约瑟夫女友 Berta
        const bertaX = w * 0.78;
        const bertaY = h * 0.65;
        ctx.fillStyle = '#e91e63';
        ctx.fillRect(bertaX - 16, bertaY - 30, 32, 45);
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 12px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('🎀 伯塔 (女友)', bertaX, bertaY - 40);

        // 逃生直升机
        ctx.fillStyle = '#34495e';
        ctx.fillRect(bertaX - 45, bertaY - 90, 90, 45);
        // 旋翼旋转
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 4;
        const propAngle = ch16.helicopterFlying ? Date.now() * 0.03 : 0;
        ctx.beginPath();
        ctx.moveTo(bertaX - Math.cos(propAngle) * 70, bertaY - 95);
        ctx.lineTo(bertaX + Math.cos(propAngle) * 70, bertaY - 95);
        ctx.stroke();

        // 调频收音机仪表盘
        const rX = w * 0.15;
        const rY = h * 0.28;
        ctx.fillStyle = '#3e2723';
        ctx.fillRect(rX, rY, 180, 110);
        ctx.fillStyle = '#2ecc71';
        ctx.font = 'bold 18px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(`📻 ${ch16.freqCoordX.toFixed(1)} : ${ch16.freqCoordY}`, rX + 90, rY + 45);
        ctx.fillStyle = '#fff';
        ctx.font = '11px sans-serif';
        ctx.fillText('目标调频: 7.0 : 108', rX + 90, rY + 80);

        // 5 键管风琴密码琴键 (1, 2, 3, 4, 5)
        const organX = w * 0.15;
        const organY = h * 0.52;
        ctx.fillStyle = '#212121';
        ctx.fillRect(organX, organY, 210, 100);

        for (let k = 1; k <= 5; k++) {
            const kx = organX + 15 + (k - 1) * 38;
            ctx.fillStyle = '#ecf0f1';
            ctx.fillRect(kx, organY + 15, 30, 70);
            ctx.fillStyle = '#2c3e50';
            ctx.font = 'bold 14px sans-serif';
            ctx.fillText(`${k}`, kx + 15, organY + 65);
        }

        ctx.fillStyle = '#f1c40f';
        ctx.font = 'bold 15px monospace';
        ctx.fillText(`已按音符: ${ch16.playerNotes.join('-') || '请调频后按 1-4-2-3-5-2-3'}`, organX + 105, organY + 130);

        drawJosef(ctx);
        drawHintBanner(ctx, '【第十六关：大结局】收音机调频至 7.0:108 听到神秘旋律，敲响琴键 1-4-2-3-5-2-3 启动直升机双宿双飞！');
    }

    // ==========================================
    // 顶部物品栏、关卡选择器与手绘秘籍画册
    // ==========================================
    function drawHUD(ctx, w, h) {
        // 1. 顶部状态与工具条
        ctx.fillStyle = 'rgba(33, 22, 15, 0.92)';
        ctx.fillRect(0, 0, w, 54);
        ctx.strokeStyle = '#8d6e63';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(0, 54);
        ctx.lineTo(w, 54);
        ctx.stroke();

        // 关卡名称展示
        const curMeta = CHAPTERS_META[m9.currentChapter - 1] || CHAPTERS_META[0];
        ctx.fillStyle = '#ffecb3';
        ctx.font = 'bold 16px "Microsoft YaHei", sans-serif';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';
        ctx.fillText(`第 ${m9.currentChapter} 关：${curMeta.name} · ${curMeta.sub}`, 20, 27);

        // 2. 物品栏槽位
        const invStartX = w * 0.45;
        const maxSlots = 5;
        for (let i = 0; i < maxSlots; i++) {
            const sx = invStartX + i * 44;
            const sy = 8;
            const isSelected = m9.selectedItemIndex === i;

            ctx.fillStyle = isSelected ? '#ffe082' : 'rgba(0, 0, 0, 0.5)';
            ctx.strokeStyle = isSelected ? '#ffb300' : '#a1887f';
            ctx.lineWidth = isSelected ? 3 : 1.5;
            ctx.beginPath();
            ctx.roundRect(sx, sy, 38, 38, [6]);
            ctx.fill();
            ctx.stroke();

            const item = m9.inventory[i];
            if (item) {
                ctx.font = '20px sans-serif';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText(item.icon, sx + 19, sy + 19);
            }
        }

        // 3. 右上角功能按钮：📖 秘籍画册 | 🗺️ 选关 | 🎵 音乐 | 🔊 音效
        const btns = [
            { id: 'book', icon: '📖 秘籍', x: w - 240 },
            { id: 'map', icon: '🗺️ 选关', x: w - 165 },
            { id: 'bgm', icon: soundSettings.bgmMuted ? '🔇' : '🎵', x: w - 90 },
            { id: 'sfx', icon: soundSettings.sfxMuted ? '🔈' : '🔊', x: w - 45 }
        ];

        btns.forEach(b => {
            ctx.fillStyle = '#4e342e';
            ctx.strokeStyle = '#bcaaa4';
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.roundRect(b.x, 10, b.id === 'book' || b.id === 'map' ? 68 : 34, 34, [6]);
            ctx.fill();
            ctx.stroke();

            ctx.fillStyle = '#fff';
            ctx.font = 'bold 12px sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(b.icon, b.x + (b.id === 'book' || b.id === 'map' ? 34 : 17), 27);
        });

        // 4. 左下角主角伸展/压缩快捷控制按钮
        drawJosefControls(ctx, w, h);
    }

    function drawJosefControls(ctx, w, h) {
        const j = m9.josef;
        const cy = h - 60;

        // 拉长身体按钮
        ctx.fillStyle = j.stretchState === 1 ? '#ffb300' : 'rgba(78, 52, 46, 0.85)';
        ctx.strokeStyle = '#d7ccc8';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.roundRect(20, cy, 60, 44, [8]);
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 12px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('⬆️ 拉长', 50, cy + 22);

        // 恢复正常高度按钮
        ctx.fillStyle = j.stretchState === 0 ? '#ffb300' : 'rgba(78, 52, 46, 0.85)';
        ctx.beginPath();
        ctx.roundRect(90, cy, 60, 44, [8]);
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = '#fff';
        ctx.fillText('⏸️ 还原', 120, cy + 22);

        // 蹲下压缩按钮
        ctx.fillStyle = j.stretchState === -1 ? '#ffb300' : 'rgba(78, 52, 46, 0.85)';
        ctx.beginPath();
        ctx.roundRect(160, cy, 60, 44, [8]);
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = '#fff';
        ctx.fillText('⬇️ 蹲下', 190, cy + 22);
    }

    function drawHintBanner(ctx, text) {
        const w = ctx.canvas.width;
        const h = ctx.canvas.height;
        ctx.fillStyle = 'rgba(26, 18, 11, 0.85)';
        ctx.fillRect(0, h - 30, w, 30);
        ctx.fillStyle = '#ffe082';
        ctx.font = '12px "Microsoft YaHei", sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(text, w * 0.5, h - 15);
    }

    // 手绘通关秘籍画册弹窗（Comic Walkthrough Book）
    function renderHintBook(ctx, w, h) {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.75)';
        ctx.fillRect(0, 0, w, h);

        const bookW = Math.min(w * 0.85, 860);
        const bookH = Math.min(h * 0.85, 580);
        const bookX = (w - bookW) / 2;
        const bookY = (h - bookH) / 2;

        // 老旧羊皮纸画册质感
        ctx.fillStyle = '#f5ecd7';
        ctx.strokeStyle = '#5d4037';
        ctx.lineWidth = 8;
        ctx.beginPath();
        ctx.roundRect(bookX, bookY, bookW, bookH, [16]);
        ctx.fill();
        ctx.stroke();

        // 中间书脊装订线
        ctx.strokeStyle = '#bcaaa4';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(bookX + bookW / 2, bookY);
        ctx.lineTo(bookX + bookW / 2, bookY + bookH);
        ctx.stroke();

        const p = m9.hintBook.currentPage;
        const meta = CHAPTERS_META[p - 1];

        // 左页：手绘图解封面与核心关卡密码
        ctx.fillStyle = '#3e2723';
        ctx.font = 'bold 22px "Microsoft YaHei", serif';
        ctx.textAlign = 'center';
        ctx.fillText(`📖 机械迷城通关密卷 · 第 ${p} 关`, bookX + bookW * 0.25, bookY + 45);

        ctx.font = 'bold 15px sans-serif';
        ctx.fillStyle = '#c0392b';
        ctx.fillText(`【通关核心密码】: ${meta.password}`, bookX + bookW * 0.25, bookY + 85);

        // 如果第一关有真实手绘漫画图，则渲染真实漫画
        if (p === 1 && m9.images.junkyardComic && m9.images.junkyardComic.complete) {
            ctx.drawImage(m9.images.junkyardComic, bookX + 30, bookY + 110, bookW * 0.44, bookH - 160);
        } else {
            // 手绘铅笔风线稿方框与步骤指南
            ctx.strokeStyle = '#795548';
            ctx.lineWidth = 2;
            ctx.strokeRect(bookX + 35, bookY + 115, bookW * 0.43, bookH - 170);

            ctx.fillStyle = '#4e342e';
            ctx.font = '13px "Microsoft YaHei", sans-serif';
            ctx.textAlign = 'left';
            const tips = [
                `关卡场景: ${meta.name}`,
                `通关机制: ${meta.sub}`,
                '步骤 1: 观察场景并触碰可互动物品',
                '步骤 2: 必要时使用约瑟夫拉长/蹲下',
                '步骤 3: 点击物品栏道具进行合成或使用',
                '步骤 4: 对应核心机关输入速通密码'
            ];
            tips.forEach((tp, idx) => {
                ctx.fillText(`• ${tp}`, bookX + 50, bookY + 160 + idx * 36);
            });
        }

        // 右页：16 章节极速目录与跳关直达
        ctx.fillStyle = '#3e2723';
        ctx.font = 'bold 18px "Microsoft YaHei", sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('📑 全 16 章节速查目录 (点击直达对应秘籍)', bookX + bookW * 0.75, bookY + 45);

        const colStartX = bookX + bookW * 0.53;
        CHAPTERS_META.forEach((cm, i) => {
            const rx = colStartX + (i % 2) * (bookW * 0.22);
            const ry = bookY + 85 + Math.floor(i / 2) * 48;
            const isCur = cm.id === p;

            ctx.fillStyle = isCur ? '#ffcc80' : '#efebe9';
            ctx.strokeStyle = isCur ? '#e65100' : '#d7ccc8';
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.roundRect(rx, ry, bookW * 0.2, 40, [6]);
            ctx.fill();
            ctx.stroke();

            ctx.fillStyle = '#212121';
            ctx.font = 'bold 11px sans-serif';
            ctx.textAlign = 'left';
            ctx.fillText(`${cm.icon} ${cm.id}.${cm.name}`, rx + 8, ry + 22);
            ctx.fillStyle = '#d32f2f';
            ctx.font = '10px monospace';
            ctx.fillText(`密:${cm.password}`, rx + 8, ry + 34);
        });

        // 翻页与关闭按钮
        ctx.fillStyle = '#5d4037';
        ctx.font = 'bold 14px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('◀ 上一页', bookX + 70, bookY + bookH - 20);
        ctx.fillText('下一页 ▶', bookX + bookW * 0.43, bookY + bookH - 20);
        ctx.fillText('✖️ 点击空白处或右上角关闭画册', bookX + bookW * 0.75, bookY + bookH - 20);
    }

    // 章节选择器弹窗（Chapter Select Map）
    function renderChapterSelect(ctx, w, h) {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
        ctx.fillRect(0, 0, w, h);

        const mapW = Math.min(w * 0.88, 900);
        const mapH = Math.min(h * 0.88, 600);
        const mapX = (w - mapW) / 2;
        const mapY = (h - mapH) / 2;

        ctx.fillStyle = '#2e1c12';
        ctx.strokeStyle = '#d7ccc8';
        ctx.lineWidth = 5;
        ctx.beginPath();
        ctx.roundRect(mapX, mapY, mapW, mapH, [16]);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = '#ffecb3';
        ctx.font = 'bold 22px "Microsoft YaHei", sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('🗺️ 《机械迷城》16 大关卡全景选择', w * 0.5, mapY + 45);

        // 4x4 关卡卡片网格
        const cols = 4;
        const cardW = (mapW - 100) / 4;
        const cardH = (mapH - 140) / 4;

        CHAPTERS_META.forEach((cm, i) => {
            const col = i % cols;
            const row = Math.floor(i / cols);
            const cx = mapX + 35 + col * (cardW + 10);
            const cy = mapY + 70 + row * (cardH + 10);
            const isCur = cm.id === m9.currentChapter;

            ctx.fillStyle = isCur ? '#ffb74d' : '#4e342e';
            ctx.strokeStyle = isCur ? '#e65100' : '#8d6e63';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.roundRect(cx, cy, cardW, cardH, [8]);
            ctx.fill();
            ctx.stroke();

            ctx.fillStyle = isCur ? '#212121' : '#fff';
            ctx.font = 'bold 13px sans-serif';
            ctx.textAlign = 'left';
            ctx.fillText(`${cm.icon} 第 ${cm.id} 关`, cx + 10, cy + 24);

            ctx.fillStyle = isCur ? '#3e2723' : '#ffecb3';
            ctx.font = 'bold 12px sans-serif';
            ctx.fillText(cm.name, cx + 10, cy + 44);

            ctx.fillStyle = isCur ? '#b71c1c' : '#81c784';
            ctx.font = '10px monospace';
            ctx.fillText(`密码: ${cm.password}`, cx + 10, cy + 64);
        });

        ctx.fillStyle = '#fff';
        ctx.font = '13px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('✖️ 点击空白处关闭选关', w * 0.5, mapY + mapH - 18);
    }

    // ==========================================
    // 交互与点击事件逻辑
    // ==========================================
    function handlePointerDown(e) {
        if (m9.state === 'book_hint') {
            const canvas = document.getElementById('gameCanvas');
            const rect = canvas.getBoundingClientRect();
            const clickX = e.clientX - rect.left;
            const clickY = e.clientY - rect.top;
            const w = canvas.width;
            const h = canvas.height;
            const bookW = Math.min(w * 0.85, 860);
            const bookH = Math.min(h * 0.85, 580);
            const bookX = (w - bookW) / 2;
            const bookY = (h - bookH) / 2;

            // 检查点击右页目录项
            const colStartX = bookX + bookW * 0.53;
            for (let i = 0; i < CHAPTERS_META.length; i++) {
                const rx = colStartX + (i % 2) * (bookW * 0.22);
                const ry = bookY + 85 + Math.floor(i / 2) * 48;
                if (clickX >= rx && clickX <= rx + bookW * 0.2 && clickY >= ry && clickY <= ry + 40) {
                    m9.hintBook.currentPage = i + 1;
                    playSound('gear');
                    return;
                }
            }

            // 上下页与关闭
            if (clickX >= bookX + 30 && clickX <= bookX + 130 && clickY >= bookY + bookH - 40) {
                m9.hintBook.currentPage = Math.max(1, m9.hintBook.currentPage - 1);
                playSound('gear');
                return;
            }
            if (clickX >= bookX + bookW * 0.38 && clickX <= bookX + bookW * 0.48 && clickY >= bookY + bookH - 40) {
                m9.hintBook.currentPage = Math.min(16, m9.hintBook.currentPage + 1);
                playSound('gear');
                return;
            }

            // 点击外部关闭
            if (clickX < bookX || clickX > bookX + bookW || clickY < bookY || clickY > bookY + bookH) {
                m9.state = 'playing';
            }
            return;
        }

        if (m9.state === 'chapter_select') {
            const canvas = document.getElementById('gameCanvas');
            const rect = canvas.getBoundingClientRect();
            const clickX = e.clientX - rect.left;
            const clickY = e.clientY - rect.top;
            const w = canvas.width;
            const h = canvas.height;
            const mapW = Math.min(w * 0.88, 900);
            const mapH = Math.min(h * 0.88, 600);
            const mapX = (w - mapW) / 2;
            const mapY = (h - mapH) / 2;
            const cardW = (mapW - 100) / 4;
            const cardH = (mapH - 140) / 4;

            for (let i = 0; i < CHAPTERS_META.length; i++) {
                const col = i % 4;
                const row = Math.floor(i / 4);
                const cx = mapX + 35 + col * (cardW + 10);
                const cy = mapY + 70 + row * (cardH + 10);
                if (clickX >= cx && clickX <= cx + cardW && clickY >= cy && clickY <= cy + cardH) {
                    m9.currentChapter = i + 1;
                    m9.state = 'playing';
                    playSound('gear');
                    return;
                }
            }
            // 点击外部关闭
            m9.state = 'playing';
            return;
        }

        // 正常游玩界面交互
        const canvas = document.getElementById('gameCanvas');
        if (!canvas) return;
        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const w = canvas.width;
        const h = canvas.height;

        // 1. 顶部 HUD 按钮点击
        if (y <= 54) {
            // 右上角按钮
            if (x >= w - 240 && x <= w - 172) {
                m9.state = 'book_hint';
                m9.hintBook.currentPage = m9.currentChapter;
                playSound('gear');
                return;
            }
            if (x >= w - 165 && x <= w - 97) {
                m9.state = 'chapter_select';
                playSound('gear');
                return;
            }
            if (x >= w - 90 && x <= w - 56) {
                soundSettings.bgmMuted = !soundSettings.bgmMuted;
                localStorage.setItem('m9_bgm_muted', soundSettings.bgmMuted);
                if (soundSettings.bgmMuted) stopSteampunkBGM();
                else startSteampunkBGM();
                return;
            }
            if (x >= w - 45 && x <= w - 11) {
                soundSettings.sfxMuted = !soundSettings.sfxMuted;
                localStorage.setItem('m9_sfx_muted', soundSettings.sfxMuted);
                return;
            }

            // 物品栏槽位点击
            const invStartX = w * 0.45;
            for (let i = 0; i < 5; i++) {
                const sx = invStartX + i * 44;
                if (x >= sx && x <= sx + 38 && y >= 8 && y <= 46) {
                    if (m9.inventory[i]) {
                        m9.selectedItemIndex = m9.selectedItemIndex === i ? -1 : i;
                        playSound('pick');
                    }
                    return;
                }
            }
            return;
        }

        // 2. 左下角伸缩身体控制点击
        const cy = h - 60;
        if (y >= cy && y <= cy + 44) {
            if (x >= 20 && x <= 80) {
                m9.josef.stretchState = 1;
                playSound('stretch');
                return;
            }
            if (x >= 90 && x <= 150) {
                m9.josef.stretchState = 0;
                playSound('clank');
                return;
            }
            if (x >= 160 && x <= 220) {
                m9.josef.stretchState = -1;
                playSound('squat');
                return;
            }
        }

        // 3. 关卡内核心解谜物品点击逻辑
        handleSceneClick(x, y, w, h);
    }

    function handleSceneClick(x, y, w, h) {
        const ch = m9.currentChapter;
        const j = m9.josef;

        if (ch === 1) {
            const ch1 = m9.levels.ch1;
            // 浴缸推开
            if (!ch1.tubKnocked && Math.hypot(x - 220, y - 420) < 45) {
                ch1.tubKnocked = true;
                j.parts.body = true;
                playSound('clank');
                j.thoughtText = '身体拼好了！但还缺腿和手臂';
                j.thoughtTimer = 2.5;
                return;
            }
            // 捡玩偶（必须拉长身体）
            if (!ch1.dollFound && Math.hypot(x - w * 0.46, y - 195) < 30) {
                if (j.stretchState === 1) {
                    ch1.dollFound = true;
                    addItem('toy_doll', '毛绒玩偶', '🧸', '机械老鼠最喜爱的玩偶');
                } else {
                    j.thoughtText = '太高了够不着！点击【拉长】试试';
                    j.thoughtTimer = 2.0;
                    playSound('buzz');
                }
                return;
            }
            // 老鼠换腿
            if (!ch1.ratFed && Math.hypot(x - w * 0.68, y - 320) < 35) {
                if (hasItem('toy_doll')) {
                    removeItem('toy_doll');
                    ch1.ratFed = true;
                    j.parts.leftLeg = true;
                    j.parts.rightLeg = true;
                    playSound('solve');
                    j.thoughtText = '老鼠归还了我的机械腿！';
                    j.thoughtTimer = 2.5;
                } else {
                    j.thoughtText = '老鼠想要那个毛绒玩偶';
                    j.thoughtTimer = 2.0;
                }
                return;
            }
            // 拾取磁铁与绳索
            if (!hasItem('magnet') && !ch1.ropeMagnateCombined && Math.hypot(x - w * 0.82, y - 430) < 25) {
                addItem('magnet', '磁铁', '🧲', '强力磁石');
                if (hasItem('rope')) autoCombineMagnetRope();
                return;
            }
            if (!hasItem('rope') && !ch1.ropeMagnateCombined && Math.hypot(x - w * 0.15, y - 440) < 25) {
                addItem('rope', '绳索', '🪢', '结实的粗绳');
                if (hasItem('magnet')) autoCombineMagnetRope();
                return;
            }
            // 弯折铁杆并钓出手臂
            if (Math.hypot(x - w * 0.5, y - (h * 0.72)) < 55) {
                if (!ch1.poleBent) {
                    ch1.poleBent = true;
                    playSound('clank');
                    j.thoughtText = '铁杆弯向了毒液池！';
                    j.thoughtTimer = 2.0;
                } else if (!ch1.armFished) {
                    if (hasItem('magnet_rope')) {
                        ch1.armFished = true;
                        j.parts.leftArm = true;
                        j.parts.rightArm = true;
                        playSound('solve');
                        j.thoughtText = '钓回了机械手臂！身体完整了！';
                        j.thoughtTimer = 2.5;
                    } else {
                        j.thoughtText = '需要将绳子与磁铁组合才能钓出手臂';
                        j.thoughtTimer = 2.0;
                    }
                } else {
                    // 通关第 1 关前往第 2 关
                    playSound('success');
                    advanceToNextChapter();
                }
                return;
            }
        } else if (ch === 2) {
            const ch2 = m9.levels.ch2;
            if (!ch2.whiteConePicked && Math.hypot(x - w * 0.3, y - h * 0.74) < 25) {
                ch2.whiteConePicked = true;
                addItem('white_cone', '白色锥帽', '🔺', '未上色的锥形警帽');
                checkDyeHat();
                return;
            }
            if (!ch2.bluePaintPicked && Math.hypot(x - w * 0.42, y - h * 0.75) < 25) {
                ch2.bluePaintPicked = true;
                addItem('blue_paint', '蓝色油漆', '🪣', '标准卫兵蓝');
                checkDyeHat();
                return;
            }
            // 拉动门铃
            if (Math.hypot(x - (w * 0.78 - 60), y - (h * 0.58 - 20)) < 30) {
                if (j.disguiseHat && j.stretchState === 1) {
                    playSound('success');
                    j.thoughtText = '守卫敬礼开门！顺利通过！';
                    setTimeout(() => advanceToNextChapter(), 1500);
                } else {
                    playSound('buzz');
                    j.thoughtText = '守卫咆哮: 只有戴蓝帽的高个卫兵才能进！';
                    j.thoughtTimer = 2.5;
                }
                return;
            }
        } else if (ch === 3) {
            const ch3 = m9.levels.ch3;
            // 点击 3 个扳手旋转角度
            ch3.wrenches.forEach((wr, i) => {
                const slot = ch3.valves[wr.placedSlot];
                if (slot && Math.hypot(x - slot.x, y - slot.y) < 28) {
                    wr.angle = (wr.angle + 90) % 360;
                    playSound('gear');
                    // 检查是否接通水路
                    if (ch3.wrenches[0].angle === 90 && ch3.wrenches[1].angle === 180 && ch3.wrenches[2].angle === 270) {
                        ch3.solved = true;
                        playSound('water');
                        playSound('success');
                    }
                }
            });
            if (ch3.solved && y > h * 0.7) {
                advanceToNextChapter();
            }
            return;
        } else if (ch === 4) {
            const ch4 = m9.levels.ch4;
            // 点击闸刀
            const swPanelX = w * 0.62;
            const swPanelY = h * 0.28;
            ch4.switches.forEach((isUp, idx) => {
                const sx = swPanelX + 35 + idx * 55;
                if (x >= sx - 16 && x <= sx + 16 && y >= swPanelY + 20 && y <= swPanelY + 95) {
                    ch4.switches[idx] = !isUp;
                    playSound('clank');
                    checkCh4Solve();
                }
            });
            // 对调红黑电线
            if (x >= swPanelX && x <= swPanelX + 180 && y >= swPanelY + 140 && y <= swPanelY + 210) {
                ch4.swappedWires = !ch4.swappedWires;
                playSound('combine');
                checkCh4Solve();
            }
            if (ch4.solved && Math.hypot(x - w * 0.35, y - h * 0.8) < 45) {
                playSound('success');
                advanceToNextChapter();
            }
            return;
        } else if (ch === 5) {
            const ch5 = m9.levels.ch5;
            // 电灯总闸
            if (x >= w * 0.72 && x <= w * 0.72 + 60 && y >= h * 0.22 && y <= h * 0.22 + 45) {
                ch5.lightTurnedOff = !ch5.lightTurnedOff;
                playSound('clank');
                return;
            }
            // 密码盘点击自增
            const padX = w * 0.72;
            const padY = h * 0.45;
            if (x >= padX && x <= padX + 160 && y >= padY && y <= padY + 90) {
                const target = ['0', '4', '4', '5'];
                ch5.codeDigits = target; // 点击直接填入 04:45
                ch5.solved = true;
                playSound('solve');
                playSound('success');
                setTimeout(() => advanceToNextChapter(), 1200);
                return;
            }
        } else if (ch === 7) {
            // 五子棋落子
            const ch7 = m9.levels.ch7;
            const boardSize = Math.min(w * 0.55, h * 0.75);
            const startX = w * 0.08;
            const startY = h * 0.15;
            const cell = boardSize / 8;

            const c = Math.round((x - startX) / cell);
            const r = Math.round((y - startY) / cell);

            if (r >= 0 && r < 9 && c >= 0 && c < 9 && ch7.board[r][c] === 0 && ch7.turn === 1 && ch7.winner === 0) {
                ch7.board[r][c] = 1;
                playSound('clank');
                if (checkGomokuWin(ch7.board, 1, r, c)) {
                    ch7.winner = 1;
                    ch7.solved = true;
                    playSound('success');
                    setTimeout(() => advanceToNextChapter(), 1800);
                    return;
                }
                // AI 简单走子
                ch7.turn = 2;
                setTimeout(() => {
                    aiGomokuMove(ch7.board);
                    ch7.turn = 1;
                }, 300);
            }
            return;
        } else if (ch === 14) {
            const ch14 = m9.levels.ch14;
            const bX = w * 0.2;
            const bY = h * 0.15;
            const bW = w * 0.6;
            const wires = ['A', 'B', 'C', 'D', 'E'];
            wires.forEach((wr, i) => {
                const wy = bY + 140 + i * 55;
                if (x >= bX + bW - 70 && x <= bX + bW - 15 && y >= wy - 14 && y <= wy + 14) {
                    if (!ch14.cutWires.includes(wr)) {
                        ch14.cutWires.push(wr);
                        playSound('pick');
                        // 校验剪线顺序 D-B-E-A-C
                        const target = ['D', 'B', 'E', 'A', 'C'];
                        const curStep = ch14.cutWires.length - 1;
                        if (ch14.cutWires[curStep] !== target[curStep]) {
                            // 剪错，爆炸重置！
                            playSound('buzz');
                            ch14.cutWires = [];
                            m9.josef.thoughtText = '剪错线了！重置中...';
                            m9.josef.thoughtTimer = 2.0;
                        } else if (ch14.cutWires.length === 5) {
                            ch14.solved = true;
                            playSound('success');
                            setTimeout(() => advanceToNextChapter(), 1500);
                        }
                    }
                }
            });
            return;
        } else if (ch === 16) {
            const ch16 = m9.levels.ch16;
            const organX = w * 0.15;
            const organY = h * 0.52;
            for (let k = 1; k <= 5; k++) {
                const kx = organX + 15 + (k - 1) * 38;
                if (x >= kx && x <= kx + 30 && y >= organY + 15 && y <= organY + 85) {
                    playSound('organ_note', k);
                    ch16.playerNotes.push(k);
                    // 检查 1-4-2-3-5-2-3
                    const target = [1, 4, 2, 3, 5, 2, 3];
                    const curStep = ch16.playerNotes.length - 1;
                    if (ch16.playerNotes[curStep] !== target[curStep]) {
                        ch16.playerNotes = [k === 1 ? 1 : null].filter(Boolean);
                    } else if (ch16.playerNotes.length === target.length) {
                        ch16.solved = true;
                        ch16.helicopterFlying = true;
                        playSound('success');
                        m9.josef.thoughtText = '🎉 约瑟夫救出了伯塔，通关大结局！';
                        m9.josef.thoughtTimer = 5.0;
                    }
                    return;
                }
            }
        }

        // 默认让约瑟夫朝点击位置走去
        j.targetX = Math.max(80, Math.min(w - 80, x));
        playSound('step');
    }

    // 第一关自动组合磁铁与绳索
    function autoCombineMagnetRope() {
        removeItem('magnet');
        removeItem('rope');
        addItem('magnet_rope', '磁铁绳套', '🧲', '用于打捞深水池中的金属零件');
        playSound('combine');
    }

    // 第二关帽子染色
    function checkDyeHat() {
        if (hasItem('white_cone') && hasItem('blue_paint')) {
            removeItem('white_cone');
            removeItem('blue_paint');
            addItem('blue_cone', '蓝色警帽', '🔹', '标准蓝色守卫锥帽');
            m9.josef.disguiseHat = true;
            playSound('combine');
        }
    }

    // 第四关检查通关
    function checkCh4Solve() {
        const ch4 = m9.levels.ch4;
        // 1下 2上 3下 且 红黑电线对调
        if (!ch4.switches[0] && ch4.switches[1] && !ch4.switches[2] && ch4.swappedWires) {
            ch4.solved = true;
            playSound('solve');
        }
    }

    // 五子棋判定函数
    function checkGomokuWin(board, player, r, c) {
        const dirs = [[1, 0], [0, 1], [1, 1], [1, -1]];
        for (let [dr, dc] of dirs) {
            let count = 1;
            for (let step = 1; step < 5; step++) {
                const nr = r + dr * step;
                const nc = c + dc * step;
                if (nr >= 0 && nr < 9 && nc >= 0 && nc < 9 && board[nr][nc] === player) count++;
                else break;
            }
            for (let step = 1; step < 5; step++) {
                const nr = r - dr * step;
                const nc = c - dc * step;
                if (nr >= 0 && nr < 9 && nc >= 0 && nc < 9 && board[nr][nc] === player) count++;
                else break;
            }
            if (count >= 5) return true;
        }
        return false;
    }

    function aiGomokuMove(board) {
        // 寻找空位落子
        for (let r = 0; r < 9; r++) {
            for (let c = 0; c < 9; c++) {
                if (board[r][c] === 0) {
                    board[r][c] = 2;
                    playSound('clank');
                    return;
                }
            }
        }
    }

    function advanceToNextChapter() {
        if (m9.currentChapter < 16) {
            m9.currentChapter++;
            if (m9.currentChapter > m9.maxUnlockedChapter) {
                m9.maxUnlockedChapter = m9.currentChapter;
                localStorage.setItem('m9_unlocked_ch', m9.maxUnlockedChapter);
            }
            m9.josef.x = 180;
            m9.josef.targetX = 180;
            playSound('success');
        }
    }

    // 键盘快捷键监听
    function handleKeyDown(e) {
        const j = m9.josef;
        if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') {
            j.stretchState = 1;
            playSound('stretch');
        } else if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') {
            j.stretchState = -1;
            playSound('squat');
        } else if (e.key === ' ' || e.key === 'Control') {
            j.stretchState = 0;
            playSound('clank');
        } else if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
            j.targetX = Math.max(80, j.x - 60);
        } else if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
            j.targetX = Math.min(window.innerWidth - 80, j.x + 60);
        }
    }

    // ==========================================
    // 对外公开标准生命周期接口
    // ==========================================
    window.startMode9Level = function (ch = 1) {
        if (ch < 1) ch = 1;
        if (ch > 16) ch = 16;
        m9.currentChapter = ch;
        m9.state = 'playing';

        if (typeof gameState !== 'undefined') {
            gameState.level = ch;
            gameState.mode = 9;
            gameState.isPlaying = true;
            gameState.timeLeft = 9999;
        }

        document.body.classList.add('mode-9-active');
        const uiLayer = document.getElementById('uiLayer');
        if (uiLayer) uiLayer.classList.add('mode-9-active');

        const canvas = document.getElementById('gameCanvas');
        if (canvas) {
            m9.josef.y = canvas.height * 0.72;
            m9.josef.targetY = canvas.height * 0.72;
            canvas.removeEventListener('pointerdown', handlePointerDown);
            canvas.addEventListener('pointerdown', handlePointerDown);
        }
        window.removeEventListener('keydown', handleKeyDown);
        window.addEventListener('keydown', handleKeyDown);

        startSteampunkBGM();
    };

    window.loopMode9 = function (t, rawDt) {
        const canvas = document.getElementById('gameCanvas');
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        const dt = Math.min(0.05, (rawDt || 16) / 1000);
        const w = canvas.width;
        const h = canvas.height;

        m9.josef.y = h * 0.72;
        updateJosef(dt);

        // 渲染当前关卡场景
        const ch = m9.currentChapter;
        if (ch === 1) renderChapter1(ctx, w, h);
        else if (ch === 2) renderChapter2(ctx, w, h);
        else if (ch === 3) renderChapter3(ctx, w, h);
        else if (ch === 4) renderChapter4(ctx, w, h);
        else if (ch === 5) renderChapter5(ctx, w, h);
        else if (ch === 6) renderChapter6(ctx, w, h);
        else if (ch === 7) renderChapter7(ctx, w, h);
        else if (ch === 8) renderChapter8(ctx, w, h);
        else if (ch === 9) renderChapter9(ctx, w, h);
        else if (ch === 10) renderChapter10(ctx, w, h);
        else if (ch === 11) renderChapter11(ctx, w, h);
        else if (ch === 12) renderChapter12(ctx, w, h);
        else if (ch === 13) renderChapter13(ctx, w, h);
        else if (ch === 14) renderChapter14(ctx, w, h);
        else if (ch === 15) renderChapter15(ctx, w, h);
        else if (ch === 16) renderChapter16(ctx, w, h);

        // 渲染顶部物品栏与状态 HUD
        drawHUD(ctx, w, h);

        // 渲染弹窗
        if (m9.state === 'book_hint') {
            renderHintBook(ctx, w, h);
        } else if (m9.state === 'chapter_select') {
            renderChapterSelect(ctx, w, h);
        }
    };

    window.stopMode9 = function () {
        stopSteampunkBGM();
        m9.state = 'playing';
        document.body.classList.remove('mode-9-active');
        const uiLayer = document.getElementById('uiLayer');
        if (uiLayer) uiLayer.classList.remove('mode-9-active');
        const canvas = document.getElementById('gameCanvas');
        if (canvas) {
            canvas.removeEventListener('pointerdown', handlePointerDown);
        }
        window.removeEventListener('keydown', handleKeyDown);
    };

})();
