/**
 * 积木游戏 - 第七模式：第七音 (Part 1: 简单模式 - 绿色背景)
 * 核心机制：
 * 1. 关卡不限时，共 25 关，难度递增（第 1 关平路教学，第 2 关微难，第 3 关起递增）
 * 2. 经典方块物理平台：左/右移动，上键跳跃，下键趴下钻洞，空格键拉动拉杆
 * 3. 第 20 关：拉杆与开门机制
 * 4. 第 24 关：高压电流致死机制
 * 5. 第 25 关：第一部分通关庆典
 */

(function () {
    'use strict';

    const BLOCK_SIZE = 40;
    const GRAVITY = 0.58;
    const MOVE_SPEED = 4.2;
    const CRAWL_SPEED = 2.2;
    const JUMP_FORCE = -11.8;

    // 音频合成器（Web Audio API 无损生成）
    let audioCtx = null;
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
        try {
            const ctx = getAudioContext();
            if (!ctx) return;
            const now = ctx.currentTime;

            if (type === 'jump') {
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                osc.type = 'sine';
                osc.frequency.setValueAtTime(160, now);
                osc.frequency.exponentialRampToValueAtTime(420, now + 0.15);
                gain.gain.setValueAtTime(0.2, now);
                gain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
                osc.connect(gain);
                gain.connect(ctx.destination);
                osc.start(now);
                osc.stop(now + 0.15);
            } else if (type === 'crouch') {
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                osc.type = 'triangle';
                osc.frequency.setValueAtTime(220, now);
                osc.frequency.exponentialRampToValueAtTime(110, now + 0.08);
                gain.gain.setValueAtTime(0.15, now);
                gain.gain.exponentialRampToValueAtTime(0.01, now + 0.08);
                osc.connect(gain);
                gain.connect(ctx.destination);
                osc.start(now);
                osc.stop(now + 0.08);
            } else if (type === 'lever') {
                // 机械拉杆咔哒声
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                osc.type = 'square';
                osc.frequency.setValueAtTime(600, now);
                osc.frequency.setValueAtTime(880, now + 0.05);
                gain.gain.setValueAtTime(0.25, now);
                gain.gain.exponentialRampToValueAtTime(0.01, now + 0.18);
                osc.connect(gain);
                gain.connect(ctx.destination);
                osc.start(now);
                osc.stop(now + 0.18);
            } else if (type === 'door') {
                // 石门升起低沉震动音
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                osc.type = 'sawtooth';
                osc.frequency.setValueAtTime(140, now);
                osc.frequency.linearRampToValueAtTime(260, now + 0.4);
                gain.gain.setValueAtTime(0.2, now);
                gain.gain.exponentialRampToValueAtTime(0.01, now + 0.45);
                osc.connect(gain);
                gain.connect(ctx.destination);
                osc.start(now);
                osc.stop(now + 0.45);
            } else if (type === 'electric') {
                // 高压电流电击电弧音
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                osc.type = 'sawtooth';
                osc.frequency.setValueAtTime(90, now);
                osc.frequency.setValueAtTime(320, now + 0.05);
                osc.frequency.setValueAtTime(120, now + 0.12);
                osc.frequency.setValueAtTime(580, now + 0.2);
                gain.gain.setValueAtTime(0.35, now);
                gain.gain.exponentialRampToValueAtTime(0.01, now + 0.35);
                osc.connect(gain);
                gain.connect(ctx.destination);
                osc.start(now);
                osc.stop(now + 0.35);
            } else if (type === 'crumble') {
                // 塌陷落石崩解声
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                osc.type = 'sawtooth';
                osc.frequency.setValueAtTime(140, now);
                osc.frequency.exponentialRampToValueAtTime(45, now + 0.22);
                gain.gain.setValueAtTime(0.3, now);
                gain.gain.exponentialRampToValueAtTime(0.01, now + 0.22);
                osc.connect(gain);
                gain.connect(ctx.destination);
                osc.start(now);
                osc.stop(now + 0.22);
            } else if (type === 'slide') {
                // 巨石机关滑动/机械推挤声
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                osc.type = 'triangle';
                osc.frequency.setValueAtTime(90, now);
                osc.frequency.linearRampToValueAtTime(170, now + 0.25);
                gain.gain.setValueAtTime(0.25, now);
                gain.gain.exponentialRampToValueAtTime(0.01, now + 0.25);
                osc.connect(gain);
                gain.connect(ctx.destination);
                osc.start(now);
                osc.stop(now + 0.25);
            } else if (type === 'win') {
                // 通关和弦欢呼音
                [523.25, 659.25, 783.99, 1046.5].forEach((freq, i) => {
                    const osc = ctx.createOscillator();
                    const gain = ctx.createGain();
                    osc.type = 'triangle';
                    osc.frequency.setValueAtTime(freq, now + i * 0.08);
                    gain.gain.setValueAtTime(0.2, now + i * 0.08);
                    gain.gain.exponentialRampToValueAtTime(0.01, now + i * 0.08 + 0.4);
                    osc.connect(gain);
                    gain.connect(ctx.destination);
                    osc.start(now + i * 0.08);
                    osc.stop(now + i * 0.08 + 0.4);
                });
            }
        } catch (e) {
            console.warn('Audio play error:', e);
        }
    }

    // 模式 7 运行时全局状态
    const m7 = {
        level: 1,
        maxLevels: 25,
        difficulty: 'easy',  // 'easy' | 'normal'
        mapWidth: 0,
        mapHeight: 0,
        blocks: [],          // [{ x, y, w, h, type, color, topColor, solid, id }]
        collapseTraps: [],   // [{ x, y, w, h, state, timer, vy, dropDelay, color, topColor, solid, shakeOffset }]
        movingBlocks: [],    // [{ x, y, w, h, minX, maxX, dir, speed, type, color, topColor, solid }]
        level10Trap: null,   // 第10关双坑联动与往复推挤地坑专属机关
        levers: [],          // [{ x, y, state: 'left'|'right', animProgress: 0, targetDoorId }]
        doors: [],           // [{ id, x, y, w, h, isOpen: false, openProgress: 0 }]
        electrics: [],       // [{ x, y, w, h, animTimer: 0 }]
        goal: { x: 0, y: 0, w: 40, h: 60, reached: false },
        signs: [],           // [{ x, y, text, subText }]
        particles: [],

        // 玩家实体
        player: {
            x: 80,
            y: 300,
            vx: 0,
            vy: 0,
            w: 26,
            h: 50,
            standH: 50,
            crouchH: 24,
            isGrounded: false,
            isCrouching: false,
            facing: 1, // 1: 右, -1: 左
            walkAnim: 0,
            state: 'idle', // idle, walk, jump, crouch, crawl, dead, win
            isDead: false,
            deadTimer: 0,
            nearLever: null
        },

        // 按键状态
        keys: {
            left: false,
            right: false,
            up: false,
            down: false,
            interact: false
        },

        // 镜头
        camera: {
            x: 0,
            y: 0,
            targetX: 0,
            targetY: 0
        },

        // 背景粒子/云朵
        bgClouds: [],
        bgHills: [],
        initialized: false
    };
    window.m7 = m7;

    // 初始化背景远景元素
    function initBackgroundElements() {
        m7.bgClouds = [];
        for (let i = 0; i < 20; i++) {
            m7.bgClouds.push({
                x: i * 160 + (Math.random() * 80),
                y: 30 + Math.random() * 120,
                w: 60 + Math.random() * 80,
                h: 20 + Math.random() * 18,
                speed: 0.15 + Math.random() * 0.25,
                opacity: 0.35 + Math.random() * 0.35
            });
        }
        m7.bgHills = [];
        const isNormal = (m7.difficulty === 'normal');
        for (let i = 0; i < 30; i++) {
            m7.bgHills.push({
                x: i * 200,
                y: 260 + Math.sin(i * 1.5) * 40,
                r: 120 + Math.random() * 60,
                color: isNormal ? (i % 2 === 0 ? '#FFA000' : '#F57C00') : (i % 2 === 0 ? '#43A047' : '#388E3C')
            });
        }
    }

    // ==========================================
    // 简单模式关卡设计（共 25 关，难度梯度递增）
    // ==========================================
    function buildEasyLevel(lvl, groundY, addBlock, addGround) {
        let endX = 1400;

        // 根据关卡定制
        if (lvl === 1) {
            // 【第 1 关：平坦教学关】
            endX = 1200;
            addGround(0, endX + 300, groundY);
            m7.signs.push({ x: 200, y: groundY - 60, text: '◀ ▶ / A D 左右移动', subText: '按 ▲ 或 空格 跳跃' });
            m7.signs.push({ x: 550, y: groundY - 60, text: '按 ▼ 或 S 趴下', subText: '走入右侧绿色光柱即可通关！' });
            m7.goal.x = endX;
            m7.goal.y = groundY - 80;

        } else if (lvl === 2) {
            // 【第 2 关：稍微难一点，加入低台阶】
            endX = 1400;
            addGround(0, 350, groundY);
            // 几个阶梯
            addBlock(350, groundY - 40, 120, 200, 'stone');
            addBlock(470, groundY - 80, 140, 240, 'stone');
            addGround(610, 200, groundY - 80);
            addBlock(810, groundY - 40, 120, 200, 'stone');
            addGround(930, 600, groundY);

            m7.signs.push({ x: 220, y: groundY - 60, text: '跳上台阶', subText: '按 ▲ / W / 空格 起跳' });
            m7.goal.x = endX;
            m7.goal.y = groundY - 80;

        } else if (lvl === 3) {
            // 【第 3 关：初识低矮通道 - 需趴下钻过】
            endX = 1500;
            addGround(0, 400, groundY);

            // 构造低矮通道（高度 36px，站立 50px 无法通过，趴下 24px 可钻过）
            addGround(400, 300, groundY);
            addBlock(400, groundY - 80, 300, 44, 'brick'); // 顶部盖板，只留 36px 高缝隙

            addGround(700, 900, groundY);
            m7.signs.push({ x: 260, y: groundY - 60, text: '前方有低矮通道！', subText: '按住 ▼ 键趴下钻过去' });
            m7.goal.x = endX;
            m7.goal.y = groundY - 80;

        } else if (lvl === 4) {
            // 【第 4 关：小坑跳跃与台阶】
            endX = 1500;
            addGround(0, 350, groundY);
            // 坑 1 (宽 80px)
            addGround(430, 250, groundY);
            // 坑 2 (宽 90px)
            addGround(770, 200, groundY - 40);
            addGround(1040, 600, groundY);
            m7.signs.push({ x: 220, y: groundY - 60, text: '小心悬崖坑洞', subText: '奔跑中跳跃可以跳得更远' });
            m7.goal.x = endX;
            m7.goal.y = groundY - 80;

        } else if (lvl === 5) {
            // 【第 5 关：浮空方块与多层跳台】
            endX = 1600;
            addGround(0, 300, groundY);
            addBlock(360, groundY - 50, 90, 30, 'wood');
            addBlock(500, groundY - 100, 90, 30, 'wood');
            addBlock(640, groundY - 150, 100, 30, 'gold');
            addBlock(790, groundY - 100, 90, 30, 'wood');
            addBlock(930, groundY - 50, 90, 30, 'wood');
            addGround(1080, 600, groundY);
            m7.goal.x = endX;
            m7.goal.y = groundY - 80;

        } else if (lvl === 6) {
            // 【第 6 关：低矮通道 + 连续小跳台】
            endX = 1600;
            addGround(0, 350, groundY);
            addGround(350, 280, groundY);
            addBlock(350, groundY - 78, 280, 42, 'brick');
            addGround(630, 150, groundY);
            addBlock(840, groundY - 60, 90, 30, 'wood');
            addBlock(990, groundY - 120, 90, 30, 'wood');
            addGround(1140, 600, groundY);
            m7.goal.x = endX;
            m7.goal.y = groundY - 80;

        } else if (lvl === 7) {
            // 【第 7 关：长坑跨越与高塔】
            endX = 1700;
            addGround(0, 280, groundY);
            addBlock(340, groundY - 40, 70, 30, 'stone');
            addBlock(470, groundY - 40, 70, 30, 'stone');
            addBlock(600, groundY - 80, 70, 30, 'stone');
            addGround(730, 200, groundY);
            addBlock(1000, groundY - 60, 80, 30, 'wood');
            addBlock(1150, groundY - 60, 80, 30, 'wood');
            addGround(1300, 500, groundY);
            m7.goal.x = endX;
            m7.goal.y = groundY - 80;

        } else if (lvl === 8) {
            // 【第 8 关：双重低矮隧道与高低差】
            endX = 1750;
            addGround(0, 300, groundY);
            // 隧道 1
            addGround(300, 240, groundY);
            addBlock(300, groundY - 78, 240, 42, 'tunnel');
            // 跳跃升降
            addBlock(600, groundY - 80, 160, 240, 'stone');
            // 隧道 2（在高台上）
            addBlock(760, groundY - 80, 260, 240, 'stone');
            addBlock(760, groundY - 158, 260, 42, 'tunnel');
            addGround(1080, 750, groundY);
            m7.goal.x = endX;
            m7.goal.y = groundY - 80;

        } else if (lvl === 9) {
            // 【第 9 关：长距离爬行与狭窄立足点】
            endX = 1800;
            addGround(0, 260, groundY);
            // 超长爬行隧道
            addGround(260, 420, groundY);
            addBlock(260, groundY - 78, 420, 42, 'brick');
            // 出口接坑
            addBlock(740, groundY - 50, 70, 30, 'gold');
            addBlock(870, groundY - 100, 70, 30, 'gold');
            addBlock(1000, groundY - 150, 70, 30, 'gold');
            addBlock(1130, groundY - 100, 70, 30, 'gold');
            addGround(1260, 600, groundY);
            m7.goal.x = endX;
            m7.goal.y = groundY - 80;

        } else if (lvl === 10) {
            // 【第 10 关：阶段考验 - 迷宫式方块跳跃】
            endX = 1900;
            addGround(0, 260, groundY);
            addBlock(320, groundY - 60, 90, 30, 'stone');
            addBlock(470, groundY - 120, 90, 30, 'stone');
            addBlock(620, groundY - 180, 120, 30, 'stone');
            // 顶部隧道
            addBlock(740, groundY - 180, 260, 30, 'stone');
            addBlock(740, groundY - 258, 260, 42, 'brick');
            // 下落平台
            addBlock(1060, groundY - 130, 90, 30, 'wood');
            addBlock(1210, groundY - 70, 90, 30, 'wood');
            addGround(1360, 600, groundY);
            m7.goal.x = endX;
            m7.goal.y = groundY - 80;

        } else if (lvl === 11) {
            // ⭐【第 11 关：空中漫步挑战】
            // 规则：只有趴下（一直摁着趴下）才能过去的关卡。当玩家趴下时，往右会直接走在空气上面。
            // 只有这一关有这个特性，其他关没有。不做告示牌提醒。
            endX = 1100;
            // 起点左侧平台（地面高 groundY）
            addGround(0, 240, groundY);
            // 中间（240 ~ 1020）纯空气，不生成任何方块，不做告示牌提醒！
            // 终点右侧平台
            addGround(endX - 80, 400, groundY);
            m7.goal.x = endX;
            m7.goal.y = groundY - 80;

        } else if (lvl >= 12 && lvl <= 19) {
            // 【第 12 ~ 19 关：渐进增强的多重挑战】
            endX = 1700 + (lvl - 10) * 100;
            addGround(0, 240, groundY);

            // 模块 1：根据关卡交替出现隧道和高空跳跃
            let curX = 240;
            for (let s = 0; s < (lvl - 8); s++) {
                if (s % 2 === 0) {
                    // 跳跃平台段
                    const h = 40 + ((s * 35) % 140);
                    addBlock(curX + 60, groundY - h, 75, 28, 'stone');
                    curX += 170;
                } else {
                    // 趴下隧道段
                    addGround(curX + 40, 200, groundY);
                    addBlock(curX + 40, groundY - 78, 200, 42, 'tunnel');
                    curX += 260;
                }
            }
            addGround(curX + 40, 600, groundY);
            m7.goal.x = endX;
            m7.goal.y = groundY - 80;

        } else if (lvl === 20) {
            // ⭐【第 20 关：拉杆与开门机制】
            // 规则：在拉杆旁/上按空格，拉杆从左拉到右，右边的门被打开！
            endX = 2000;
            addGround(0, 600, groundY);

            // 高台上的拉杆
            addBlock(600, groundY - 60, 160, 220, 'stone');
            addBlock(760, groundY - 120, 180, 280, 'gold'); // 拉杆所在黄金高台

            // 拉杆对象 (x: 830, y: groundY - 120 - 32)
            m7.levers.push({
                x: 830,
                y: groundY - 120 - 30,
                w: 32,
                h: 30,
                state: 'left',
                animProgress: 0,
                targetDoorId: 'door_lvl20'
            });

            m7.signs.push({
                x: 720,
                y: groundY - 180,
                text: '🕹️ 机关拉杆',
                subText: '走近拉杆按 [空格键] 拉动以开门'
            });

            // 下降深坑与中间垫脚石
            addBlock(1020, groundY - 60, 90, 30, 'wood');
            addBlock(1180, groundY - 40, 90, 30, 'wood');

            // 终点前的大门区域
            addGround(1330, 700, groundY);

            // 门框建筑
            addBlock(1560, groundY - 220, 40, 140, 'brick'); // 门头支撑上方方块
            addBlock(1600, groundY - 220, 60, 140, 'brick');
            addBlock(1660, groundY - 220, 40, 140, 'brick');

            // ⭐ 阻挡大门（door_lvl20）
            m7.doors.push({
                id: 'door_lvl20',
                x: 1600,
                y: groundY - 80,
                w: 60,
                h: 80,
                isOpen: false,
                openProgress: 0
            });

            m7.signs.push({
                x: 1470,
                y: groundY - 60,
                text: '🔒 铁门紧闭',
                subText: '需要先拉动左侧高台的拉杆！'
            });

            m7.goal.x = endX;
            m7.goal.y = groundY - 80;

        } else if (lvl === 21) {
            // 【第 21 关：拉杆与低矮通道结合】
            endX = 2100;
            addGround(0, 400, groundY);
            // 隧道通往拉杆密室
            addGround(400, 320, groundY);
            addBlock(400, groundY - 78, 320, 42, 'tunnel');

            addGround(720, 300, groundY);
            m7.levers.push({
                x: 820,
                y: groundY - 30,
                w: 32,
                h: 30,
                state: 'left',
                animProgress: 0,
                targetDoorId: 'door_lvl21'
            });

            // 平台跳跃通往高处大门
            addBlock(1080, groundY - 60, 80, 30, 'stone');
            addBlock(1220, groundY - 120, 80, 30, 'stone');
            addBlock(1360, groundY - 180, 300, 30, 'stone');

            // 大门
            m7.doors.push({
                id: 'door_lvl21',
                x: 1480,
                y: groundY - 260,
                w: 50,
                h: 80,
                isOpen: false,
                openProgress: 0
            });

            addGround(1660, 600, groundY);
            m7.goal.x = endX;
            m7.goal.y = groundY - 80;

        } else if (lvl === 22) {
            // 【第 22 关：双重高低差与精准跳跃】
            endX = 2100;
            addGround(0, 240, groundY);
            addBlock(310, groundY - 60, 70, 30, 'stone');
            addBlock(440, groundY - 120, 70, 30, 'stone');
            addBlock(570, groundY - 180, 70, 30, 'stone');
            addBlock(700, groundY - 120, 70, 30, 'stone');
            addGround(830, 240, groundY);
            addBlock(830, groundY - 78, 240, 42, 'tunnel');
            addBlock(1140, groundY - 80, 80, 30, 'gold');
            addBlock(1290, groundY - 140, 80, 30, 'gold');
            addGround(1440, 700, groundY);
            m7.goal.x = endX;
            m7.goal.y = groundY - 80;

        } else if (lvl === 23) {
            // 【第 23 关：悬空连环跳与低通道出口】
            endX = 2200;
            addGround(0, 220, groundY);
            for (let i = 0; i < 5; i++) {
                addBlock(280 + i * 140, groundY - (40 + (i % 3) * 50), 65, 26, 'stone');
            }
            addGround(1000, 300, groundY);
            addBlock(1000, groundY - 78, 300, 42, 'brick');
            addBlock(1360, groundY - 70, 80, 30, 'wood');
            addBlock(1500, groundY - 130, 80, 30, 'wood');
            addGround(1650, 600, groundY);
            m7.goal.x = endX;
            m7.goal.y = groundY - 80;

        } else if (lvl === 24) {
            // ⭐【第 24 关：加入致命电流】
            // 规则：玩家一旦碰到电流，本关直接结束（触电失败重开本关）！
            endX = 2200;
            addGround(0, 350, groundY);

            m7.signs.push({
                x: 200,
                y: groundY - 60,
                text: '⚡ 危险：高压电流！',
                subText: '切勿触碰蓝色电网，触碰立即失败'
            });

            // 电流区 1：地面低矮电网（需从上方跳台跃过）
            addBlock(350, groundY - 5, 260, 20, 'stone', false); // 底座
            m7.electrics.push({ x: 350, y: groundY - 30, w: 260, h: 30, animTimer: 0 });

            // 上方避险跳台
            addBlock(410, groundY - 90, 80, 24, 'wood');
            addBlock(520, groundY - 140, 80, 24, 'wood');

            addGround(610, 220, groundY);

            // 电流区 2：空中电弧柱（需从下方低矮通道钻过去，趴下即可安全通过！）
            addGround(830, 280, groundY);
            // 顶部盖板
            addBlock(830, groundY - 78, 280, 42, 'tunnel');
            // 在通道上方的空中设置电弧（只要趴下高度 24px 就碰不到电网）
            m7.electrics.push({ x: 860, y: groundY - 65, w: 220, h: 28, animTimer: 0 });

            m7.signs.push({
                x: 740,
                y: groundY - 60,
                text: '按住 ▼ 趴下',
                subText: '低姿势爬行可通过高空电流！'
            });

            // 电流区 3：连续跳跃避雷台
            addGround(1110, 160, groundY);

            addBlock(1270, groundY - 5, 300, 20, 'stone', false);
            m7.electrics.push({ x: 1270, y: groundY - 30, w: 300, h: 30, animTimer: 0 });

            addBlock(1320, groundY - 90, 70, 24, 'gold');
            addBlock(1450, groundY - 110, 70, 24, 'gold');

            addGround(1570, 700, groundY);
            m7.goal.x = endX;
            m7.goal.y = groundY - 80;

        } else if (lvl === 25) {
            // 🏆【第 25 关：第一部分·简单模式 终极大闯关】
            endX = 2400;
            addGround(0, 300, groundY);

            m7.signs.push({
                x: 180,
                y: groundY - 60,
                text: '🏆 第 25 关：简单模式巅峰',
                subText: '综合拉杆、电流与跳跃技巧到达终点！'
            });

            // 1. 跨越电网
            m7.electrics.push({ x: 300, y: groundY - 25, w: 180, h: 25, animTimer: 0 });
            addBlock(340, groundY - 80, 80, 24, 'wood');

            addGround(480, 200, groundY);

            // 2. 爬行穿过电弧隧道
            addGround(680, 260, groundY);
            addBlock(680, groundY - 78, 260, 42, 'tunnel');
            m7.electrics.push({ x: 710, y: groundY - 65, w: 200, h: 26, animTimer: 0 });

            // 3. 高台拉杆
            addGround(940, 200, groundY);
            addBlock(1140, groundY - 70, 80, 30, 'stone');
            addBlock(1270, groundY - 140, 160, 260, 'gold');

            m7.levers.push({
                x: 1330,
                y: groundY - 140 - 30,
                w: 32,
                h: 30,
                state: 'left',
                animProgress: 0,
                targetDoorId: 'door_lvl25'
            });

            // 4. 终点大门与深渊
            addBlock(1500, groundY - 80, 80, 30, 'wood');
            addBlock(1640, groundY - 50, 80, 30, 'wood');

            addGround(1780, 700, groundY);

            m7.doors.push({
                id: 'door_lvl25',
                x: 1980,
                y: groundY - 80,
                w: 60,
                h: 80,
                isOpen: false,
                openProgress: 0
            });

            m7.goal.x = endX;
            m7.goal.y = groundY - 80;
        }

        return endX;
    }

    // ==========================================
    // 普通难度关卡设计（共 25 关，渐进陷阱与机关挑战）
    // ==========================================
    function buildNormalLevel(lvl, groundY, addBlock, addGround, addCollapseTrap, addMovingBlock) {
        let endX = 1400;

        if (lvl === 1) {
            // ⭐【第 1 关：平地塌陷陷阱（暗藏玄机）】
            // 开局是一条平的地面，然后在玩家前面设置一个陷阱，玩家走到上面后会掉下去
            endX = 1300;
            addGround(0, 360, groundY, 'grass');
            // 前方塌陷陷阱 (宽 100px)，表面与平地完全一致，踩中 40ms 即崩塌下坠
            addCollapseTrap(360, groundY, 100, 160, 40, 'grass');
            // 陷阱后平坦地面
            addGround(460, endX - 460 + 300, groundY, 'grass');

            m7.signs.push({ x: 180, y: groundY - 60, text: '⚠️ 普通模式：第 1 关', subText: '前方看似平坦，走到上面会掉下去！' });
            m7.signs.push({ x: 540, y: groundY - 60, text: '漂亮的跳跃！', subText: '右侧光柱为通关终点' });
            m7.goal.x = endX;
            m7.goal.y = groundY - 80;

        } else if (lvl === 2) {
            // 【第 2 关：连环双塌陷坑】
            endX = 1450;
            addGround(0, 320, groundY, 'grass');
            addCollapseTrap(320, groundY, 90, 160, 60, 'grass');
            addGround(410, 130, groundY, 'stone');
            addCollapseTrap(540, groundY, 90, 160, 60, 'grass');
            addGround(630, 900, groundY, 'grass');

            m7.signs.push({ x: 200, y: groundY - 60, text: '连环双塌陷坑', subText: '预判起跳距离，中间有坚硬石台' });
            m7.goal.x = endX;
            m7.goal.y = groundY - 80;

        } else if (lvl === 3) {
            // 【第 3 关：低矮通道暗坑】
            endX = 1500;
            addGround(0, 340, groundY, 'grass');
            addGround(340, 100, groundY, 'stone');
            addCollapseTrap(440, groundY, 100, 160, 140, 'dirt');
            addGround(540, 120, groundY, 'stone');
            addBlock(340, groundY - 78, 320, 42, 'brick');

            addGround(660, 900, groundY, 'grass');
            m7.signs.push({ x: 220, y: groundY - 60, text: '低矮暗道有险情！', subText: '趴下爬行时快速越过暗坑' });
            m7.goal.x = endX;
            m7.goal.y = groundY - 80;

        } else if (lvl === 4) {
            // 【第 4 关：浮空崩裂方块】
            endX = 1550;
            addGround(0, 260, groundY, 'grass');
            addCollapseTrap(350, groundY - 40, 80, 28, 350, 'wood');
            addCollapseTrap(480, groundY - 80, 80, 28, 350, 'wood');
            addCollapseTrap(610, groundY - 50, 80, 28, 350, 'wood');

            addGround(740, 900, groundY, 'grass');
            m7.signs.push({ x: 180, y: groundY - 60, text: '脆弱的浮空踏板', subText: '踩中 0.35 秒后碎裂，不可停留！' });
            m7.goal.x = endX;
            m7.goal.y = groundY - 80;

        } else if (lvl === 5) {
            // 【第 5 关：虚假黄金引诱】
            endX = 1600;
            addGround(0, 280, groundY, 'grass');
            addCollapseTrap(360, groundY - 80, 80, 24, 70, 'gold');
            addCollapseTrap(480, groundY - 130, 80, 24, 70, 'gold');
            addCollapseTrap(600, groundY - 140, 80, 24, 70, 'gold');

            addGround(340, 360, groundY, 'stone');
            addBlock(340, groundY - 78, 360, 42, 'stone');

            addGround(700, 950, groundY, 'grass');
            m7.signs.push({ x: 200, y: groundY - 60, text: '虚妄的黄金', subText: '高处黄金是下坠陷阱，下方隧道安全' });
            m7.goal.x = endX;
            m7.goal.y = groundY - 80;

        } else if (lvl === 6) {
            // 【第 6 关：巡逻推挤方块初现】
            endX = 1650;
            addGround(0, 320, groundY, 'grass');
            addGround(320, 460, groundY, 'stone');
            addMovingBlock(520, groundY - 70, 60, 70, 400, 700, 2.6, 'stone');

            addGround(780, 900, groundY, 'grass');
            m7.signs.push({ x: 220, y: groundY - 60, text: '巡逻推挤巨石', subText: '小心被巨石推落深渊！可踩在其顶' });
            m7.goal.x = endX;
            m7.goal.y = groundY - 80;

        } else if (lvl === 7) {
            // 【第 7 关：真假浮石断崖】
            endX = 1700;
            addGround(0, 260, groundY, 'grass');
            addCollapseTrap(340, groundY - 40, 70, 26, 280, 'stone');
            addBlock(460, groundY - 80, 70, 26, 'stone');
            addCollapseTrap(580, groundY - 120, 70, 26, 280, 'stone');
            addBlock(700, groundY - 70, 70, 26, 'stone');
            addCollapseTrap(820, groundY - 40, 70, 26, 280, 'stone');

            addGround(940, 800, groundY, 'grass');
            m7.signs.push({ x: 180, y: groundY - 60, text: '虚实浮台', subText: '深色石台坚固，浅色踩踏即坠' });
            m7.goal.x = endX;
            m7.goal.y = groundY - 80;

        } else if (lvl === 8) {
            // 【第 8 关：下沉阶梯大跨步】
            endX = 1750;
            addGround(0, 240, groundY - 120, 'grass');
            addCollapseTrap(320, groundY - 100, 70, 24, 300, 'wood');
            addCollapseTrap(440, groundY - 70, 70, 24, 300, 'wood');
            addCollapseTrap(560, groundY - 40, 70, 24, 300, 'wood');
            addCollapseTrap(680, groundY - 10, 70, 24, 300, 'wood');

            addGround(800, 1000, groundY, 'grass');
            m7.signs.push({ x: 160, y: groundY - 180, text: '坠落台阶链', subText: '连续向前奔跑跳跃，不要停顿！' });
            m7.goal.x = endX;
            m7.goal.y = groundY - 80;

        } else if (lvl === 9) {
            // 【第 9 关：长廊推挤与地缝避险】
            endX = 1800;
            addGround(0, 300, groundY, 'grass');
            addBlock(300, groundY - 110, 480, 40, 'brick');
            addGround(300, 160, groundY, 'stone');
            addBlock(460, groundY + 20, 140, 140, 'stone');
            addGround(600, 180, groundY, 'stone');
            addMovingBlock(620, groundY - 70, 50, 70, 340, 720, 2.8, 'obsidian');

            addGround(780, 1100, groundY, 'grass');
            m7.signs.push({ x: 200, y: groundY - 60, text: '低空巨石推挤', subText: '进入中间凹槽按 ▼ 趴下避险' });
            m7.goal.x = endX;
            m7.goal.y = groundY - 80;

        } else if (lvl === 10) {
            // ⭐⭐⭐【第 10 关：双坑联动、多重方块推挤与往复回填陷阱】⭐⭐⭐
            // 规则：玩家前面有两个坑。第一个坑是直接掉下去；第二个坑不会直接掉下去，
            // 而是前面会多出来好几个方块，玩家跳不过去。接着方块往左移动，坑出现让玩家掉进去。
            // 要是玩家没有掉进去躲过去了，就再倒过来：坑回填上，方块也从左边回到右边。
            // 但如果玩家再次过来，还会重新触发。
            endX = 1850;
            addGround(0, 320, groundY, 'grass');

            // 第 1 个坑：320 到 460 (宽 140px 无底深渊，跳不过去直接掉下去坠渊死亡)

            // 中间安全浮岛：460 到 590 (宽 130px)
            addGround(460, 130, groundY, 'stone');

            // 第 2 个坑：590 到 730 (宽 140px)
            // 初始状态下不直接掉下去，由动态 pitCover 覆盖，玩家踩上去稳如泰山

            // 右侧平台：740 往后
            addGround(740, endX - 740 + 300, groundY, 'grass');

            // 初始化第 10 关专属往复陷阱状态机
            m7.level10Trap = {
                pit1: { x: 320, w: 140 },
                midPlatform: { x: 460, w: 130 },
                pit2: { x: 590, w: 140 },
                pitCover: {
                    x: 590,
                    y: groundY,
                    currentY: groundY,
                    w: 140,
                    h: 160,
                    solid: true,
                    color: '#795548',
                    topColor: '#8D6E63'
                },
                wall: {
                    initialX: 740,
                    x: 740,
                    targetX: 530,
                    y: groundY - 140, // 高达 140px (3.5 格高！阻挡直接起跳)
                    w: 52,
                    h: 140,
                    solid: false,
                    active: false,
                    visible: false
                },
                state: 'idle', // 'idle' | 'triggered' | 'holding' | 'reversing'
                timer: 0,
                triggerRangeX: 540
            };

            m7.signs.push({ x: 180, y: groundY - 60, text: '⭐ 第 10 关：双坑试炼', subText: '一坑必坠，二坑暗藏多重推挤方块！' });
            m7.signs.push({ x: 475, y: groundY - 60, text: '后撤避险可倒转机关', subText: '亦可踩上推挤方块顶端翻越！' });

            m7.goal.x = endX;
            m7.goal.y = groundY - 80;

        } else if (lvl === 11) {
            // 【第 11 关：双坑推挤机制进阶 + 高空栈道】
            endX = 1850;
            addGround(0, 300, groundY, 'grass');
            addBlock(280, groundY - 140, 80, 24, 'wood');
            addBlock(420, groundY - 160, 100, 24, 'wood');
            addBlock(580, groundY - 140, 80, 24, 'wood');

            addGround(420, 140, groundY, 'stone');
            addMovingBlock(680, groundY - 100, 50, 100, 480, 720, 3.2, 'obsidian');

            addGround(740, 1100, groundY, 'grass');
            m7.signs.push({ x: 180, y: groundY - 60, text: '高低两重天', subText: '可走高空栈道避开地面推挤' });
            m7.goal.x = endX;
            m7.goal.y = groundY - 80;

        } else if (lvl === 12) {
            // 【第 12 关：真假双拉杆】
            endX = 1900;
            addGround(0, 500, groundY, 'grass');
            m7.levers.push({
                x: 420, y: groundY - 30, w: 32, h: 30, state: 'left', animProgress: 0, targetDoorId: 'fake_lever_door'
            });
            addCollapseTrap(380, groundY, 110, 160, 60, 'grass');

            addBlock(640, groundY - 60, 90, 220, 'stone');
            addBlock(730, groundY - 130, 100, 290, 'gold');
            m7.levers.push({
                x: 770, y: groundY - 160, w: 32, h: 30, state: 'left', animProgress: 0, targetDoorId: 'door_lvl12'
            });

            addGround(950, 950, groundY, 'grass');
            addBlock(1200, groundY - 220, 60, 140, 'brick');
            m7.doors.push({ id: 'door_lvl12', x: 1200, y: groundY - 80, w: 60, h: 80, isOpen: false, openProgress: 0 });

            m7.signs.push({ x: 260, y: groundY - 60, text: '真假双拉杆', subText: '平地拉杆暗藏陷阱，高台拉杆方为生门' });
            m7.goal.x = endX;
            m7.goal.y = groundY - 80;

        } else if (lvl === 13) {
            // 【第 13 关：游弋移动电网】
            endX = 1900;
            addGround(0, 360, groundY, 'grass');
            addGround(360, 400, groundY, 'stone');
            m7.electrics.push({ x: 440, y: groundY - 30, w: 200, h: 30, animTimer: 0 });
            addMovingBlock(420, groundY - 90, 70, 24, 380, 680, 2.5, 'wood');

            addGround(760, 1150, groundY, 'grass');
            m7.signs.push({ x: 220, y: groundY - 60, text: '电网与滑移台', subText: '借移动木板跳跃避开高压电流' });
            m7.goal.x = endX;
            m7.goal.y = groundY - 80;

        } else if (lvl === 14) {
            // 【第 14 关：塌陷逃亡阶梯（多米诺）】
            endX = 1950;
            addGround(0, 240, groundY, 'grass');
            for (let i = 0; i < 6; i++) {
                addCollapseTrap(280 + i * 110, groundY - (i * 24), 85, 24, 260 + i * 50, 'brick');
            }
            addGround(960, 1000, groundY, 'grass');
            m7.signs.push({ x: 160, y: groundY - 60, text: '多米诺塌陷阶梯', subText: '一经踏上逐级瓦解，全力向前冲！' });
            m7.goal.x = endX;
            m7.goal.y = groundY - 80;

        } else if (lvl === 15) {
            // 【第 15 关：伪终点暗道】
            endX = 2000;
            addGround(0, 400, groundY, 'grass');
            addBlock(700, groundY - 140, 50, 140, 'brick');
            addCollapseTrap(580, groundY, 120, 160, 50, 'dirt');
            addGround(380, 360, groundY + 60, 'tunnel');
            addBlock(380, groundY - 18, 360, 42, 'brick');

            addGround(760, 1250, groundY, 'grass');
            m7.signs.push({ x: 240, y: groundY - 60, text: '伪终点陷阱', subText: '直行是死穴，钻入地下暗道方可通关' });
            m7.goal.x = endX;
            m7.goal.y = groundY - 80;

        } else if (lvl === 16) {
            // 【第 16 关：双向交错推挤墙】
            endX = 2050;
            addGround(0, 300, groundY, 'grass');
            addGround(300, 500, groundY, 'stone');
            addMovingBlock(340, groundY - 80, 50, 80, 300, 500, 2.2, 'obsidian');
            addMovingBlock(680, groundY - 80, 50, 80, 540, 760, 2.2, 'obsidian');
            addBlock(500, groundY - 130, 40, 20, 'gold');

            addGround(800, 1250, groundY, 'grass');
            m7.signs.push({ x: 180, y: groundY - 60, text: '双向交错推挤', subText: '中间高台是避险黄金安全岛' });
            m7.goal.x = endX;
            m7.goal.y = groundY - 80;

        } else if (lvl === 17) {
            // 【第 17 关：高空电弧与下沉浮台】
            endX = 2100;
            addGround(0, 280, groundY, 'grass');
            m7.electrics.push({ x: 340, y: groundY - 150, w: 420, h: 26, animTimer: 0 });
            addCollapseTrap(380, groundY - 50, 75, 26, 350, 'wood');
            addCollapseTrap(520, groundY - 50, 75, 26, 350, 'wood');
            addCollapseTrap(660, groundY - 50, 75, 26, 350, 'wood');

            addGround(800, 1300, groundY, 'grass');
            m7.signs.push({ x: 180, y: groundY - 60, text: '控高微操', subText: '头顶有电网，脚下会崩塌，轻点跳跃！' });
            m7.goal.x = endX;
            m7.goal.y = groundY - 80;

        } else if (lvl === 18) {
            // 【第 18 关：极限微操·单格连续下落跳】
            endX = 2150;
            addGround(0, 240, groundY, 'grass');
            for (let i = 0; i < 5; i++) {
                addCollapseTrap(300 + i * 140, groundY - 40, 50, 24, 250, 'stone');
            }
            addGround(1020, 1150, groundY, 'grass');
            m7.signs.push({ x: 150, y: groundY - 60, text: '单格极限跳', subText: '极其狭窄的落脚点，落地即起跳！' });
            m7.goal.x = endX;
            m7.goal.y = groundY - 80;

        } else if (lvl === 19) {
            // 【第 19 关：逆向推力隧道】
            endX = 2200;
            addGround(0, 320, groundY, 'grass');
            addGround(320, 450, groundY, 'stone');
            addBlock(320, groundY - 78, 450, 42, 'brick');
            addMovingBlock(680, groundY - 40, 40, 40, 380, 720, 2.4, 'obsidian');

            addGround(770, 1450, groundY, 'grass');
            m7.signs.push({ x: 200, y: groundY - 60, text: '隧道迎面撞击', subText: '在隧道内把握时机，找准节奏穿行' });
            m7.goal.x = endX;
            m7.goal.y = groundY - 80;

        } else if (lvl === 20) {
            // 【第 20 关：综合考验·推挤墙+拉杆升门】
            endX = 2200;
            addGround(0, 400, groundY, 'grass');
            addMovingBlock(520, groundY - 90, 60, 90, 420, 660, 3.0, 'obsidian');
            addBlock(720, groundY - 120, 140, 280, 'gold');
            m7.levers.push({
                x: 770, y: groundY - 150, w: 32, h: 30, state: 'left', animProgress: 0, targetDoorId: 'door_lvl20_norm'
            });

            addGround(920, 1300, groundY, 'grass');
            addBlock(1200, groundY - 220, 60, 140, 'brick');
            m7.doors.push({ id: 'door_lvl20_norm', x: 1200, y: groundY - 80, w: 60, h: 80, isOpen: false, openProgress: 0 });

            m7.signs.push({ x: 240, y: groundY - 60, text: '巨石拦路拉杆开门', subText: '越过推挤巨石，拉动高台拉杆开门' });
            m7.goal.x = endX;
            m7.goal.y = groundY - 80;

        } else if (lvl === 21) {
            // 【第 21 关：电弧追击隧道】
            endX = 2250;
            addGround(0, 300, groundY, 'grass');
            addGround(300, 450, groundY, 'tunnel');
            addBlock(300, groundY - 78, 450, 42, 'tunnel');
            m7.electrics.push({ x: 360, y: groundY - 65, w: 320, h: 26, animTimer: 0 });
            addMovingBlock(310, groundY - 50, 40, 50, 280, 680, 1.6, 'stone');

            addGround(750, 1500, groundY, 'grass');
            m7.signs.push({ x: 180, y: groundY - 60, text: '趴下避电爬行', subText: '保持趴下姿态避开电网与后方逼近块' });
            m7.goal.x = endX;
            m7.goal.y = groundY - 80;

        } else if (lvl === 22) {
            // 【第 22 关：虚空交替双向回填跳台】
            endX = 2300;
            addGround(0, 260, groundY, 'grass');
            addMovingBlock(340, groundY - 60, 75, 26, 280, 520, 2.5, 'gold');
            addMovingBlock(560, groundY - 110, 75, 26, 480, 720, 2.8, 'gold');
            addMovingBlock(780, groundY - 60, 75, 26, 700, 940, 2.5, 'gold');

            addGround(980, 1350, groundY, 'grass');
            m7.signs.push({ x: 160, y: groundY - 60, text: '移动浮空飞艇', subText: '踩在移动金色飞石上横渡天险' });
            m7.goal.x = endX;
            m7.goal.y = groundY - 80;

        } else if (lvl === 23) {
            // 【第 23 关：机关升降墙与多重假地面】
            endX = 2350;
            addGround(0, 300, groundY, 'grass');
            addCollapseTrap(300, groundY, 120, 160, 80, 'stone');
            addGround(420, 120, groundY, 'stone');
            addCollapseTrap(540, groundY, 120, 160, 80, 'stone');
            addGround(660, 140, groundY, 'stone');
            addMovingBlock(840, groundY - 90, 55, 90, 700, 900, 3.2, 'obsidian');

            addGround(940, 1450, groundY, 'grass');
            m7.goal.x = endX;
            m7.goal.y = groundY - 80;

        } else if (lvl === 24) {
            // 【第 24 关：高压电网+推挤墙+动态落穴大结合】
            endX = 2400;
            addGround(0, 320, groundY, 'grass');
            m7.electrics.push({ x: 320, y: groundY - 30, w: 220, h: 30, animTimer: 0 });
            addCollapseTrap(380, groundY - 80, 80, 24, 300, 'wood');
            addGround(540, 240, groundY, 'stone');
            addMovingBlock(620, groundY - 80, 50, 80, 540, 760, 3.2, 'obsidian');
            m7.electrics.push({ x: 780, y: groundY - 65, w: 240, h: 26, animTimer: 0 });
            addBlock(780, groundY - 78, 240, 42, 'tunnel');
            addGround(780, 240, groundY, 'tunnel');

            addGround(1020, 1400, groundY, 'grass');
            m7.signs.push({ x: 200, y: groundY - 60, text: '巅峰前夕·致命绝境', subText: '集电网、推挤墙与崩裂台于一体' });
            m7.goal.x = endX;
            m7.goal.y = groundY - 80;

        } else if (lvl === 25) {
            // 🏆【第 25 关：终极大闯关·普通难度巅峰】
            endX = 2500;
            addGround(0, 320, groundY, 'grass');
            addGround(460, 130, groundY, 'stone');
            addGround(740, 240, groundY, 'grass');

            m7.level10Trap = {
                pit1: { x: 320, w: 140 },
                midPlatform: { x: 460, w: 130 },
                pit2: { x: 590, w: 140 },
                pitCover: {
                    x: 590, y: groundY, currentY: groundY, w: 140, h: 160, solid: true, color: '#795548', topColor: '#8D6E63'
                },
                wall: {
                    initialX: 740, x: 740, targetX: 530, y: groundY - 140, w: 52, h: 140, solid: false, active: false, visible: false
                },
                state: 'idle',
                timer: 0,
                triggerRangeX: 540
            };

            m7.electrics.push({ x: 980, y: groundY - 30, w: 260, h: 30, animTimer: 0 });
            addCollapseTrap(1030, groundY - 80, 75, 24, 320, 'wood');
            addCollapseTrap(1140, groundY - 120, 75, 24, 320, 'wood');

            addGround(1240, 200, groundY, 'grass');
            addBlock(1440, groundY - 80, 90, 240, 'stone');
            addBlock(1530, groundY - 150, 120, 310, 'gold');
            m7.levers.push({
                x: 1580, y: groundY - 180, w: 32, h: 30, state: 'left', animProgress: 0, targetDoorId: 'door_lvl25_norm'
            });

            addGround(1700, 850, groundY, 'grass');
            addBlock(2000, groundY - 220, 60, 140, 'brick');
            m7.doors.push({ id: 'door_lvl25_norm', x: 2000, y: groundY - 80, w: 60, h: 80, isOpen: false, openProgress: 0 });

            m7.signs.push({ x: 180, y: groundY - 60, text: '🏆 第 25 关：普通难度终极巅峰', subText: '突破连环机关，赢得无上荣耀！' });
            m7.goal.x = endX;
            m7.goal.y = groundY - 80;
        }

        return endX;
    }

    // ==========================================
    // 关卡数据构建总入口
    // ==========================================
    function buildLevelData(lvl) {
        m7.blocks = [];
        m7.levers = [];
        m7.doors = [];
        m7.electrics = [];
        m7.signs = [];
        m7.particles = [];
        m7.collapseTraps = [];
        m7.movingBlocks = [];
        m7.level10Trap = null;

        const groundY = 480; // 地面基础高度
        let endX = 1400;

        function addBlock(x, y, w, h, type = 'grass', solid = true, id = null) {
            let color = '#4CAF50';
            let topColor = '#81C784';
            if (m7.difficulty === 'normal' && type === 'grass') {
                color = '#D87C19';
                topColor = '#FFB300';
            }
            else if (type === 'dirt') { color = '#795548'; topColor = '#8D6E63'; }
            else if (type === 'stone') { color = '#607D8B'; topColor = '#90A4AE'; }
            else if (type === 'brick') { color = '#A1887F'; topColor = '#BCAAA4'; }
            else if (type === 'wood') { color = '#8D6E63'; topColor = '#A1887F'; }
            else if (type === 'gold') { color = '#FFC107'; topColor = '#FFE082'; }
            else if (type === 'leaves') { color = '#2E7D32'; topColor = '#43A047'; }
            else if (type === 'tunnel') { color = '#3E2723'; topColor = '#4E342E'; }
            else if (type === 'obsidian') { color = '#263238'; topColor = '#37474F'; }

            m7.blocks.push({ x, y, w, h, type, color, topColor, solid, id });
        }

        function addGround(startX, lengthX, y = groundY, type = 'grass') {
            addBlock(startX, y, lengthX, 160, type, true);
        }

        function addCollapseTrap(x, y, w, h = 160, dropDelay = 80, type = 'grass') {
            let color = '#4CAF50';
            let topColor = '#81C784';
            if (m7.difficulty === 'normal' && type === 'grass') {
                color = '#D87C19';
                topColor = '#FFB300';
            }
            else if (type === 'dirt') { color = '#795548'; topColor = '#8D6E63'; }
            else if (type === 'stone') { color = '#607D8B'; topColor = '#90A4AE'; }
            else if (type === 'brick') { color = '#A1887F'; topColor = '#BCAAA4'; }
            else if (type === 'wood') { color = '#8D6E63'; topColor = '#A1887F'; }
            else if (type === 'gold') { color = '#FFC107'; topColor = '#FFE082'; }

            m7.collapseTraps.push({
                x, y, w, h,
                type, color, topColor,
                state: 'idle',
                timer: 0,
                vy: 0,
                dropDelay,
                solid: true,
                shakeOffset: 0
            });
        }

        function addMovingBlock(x, y, w, h, minX, maxX, speed = 2, type = 'stone') {
            let color = '#607D8B';
            let topColor = '#90A4AE';
            if (type === 'brick') { color = '#A1887F'; topColor = '#BCAAA4'; }
            else if (type === 'wood') { color = '#8D6E63'; topColor = '#A1887F'; }
            else if (type === 'obsidian') { color = '#263238'; topColor = '#37474F'; }
            else if (type === 'gold') { color = '#FFC107'; topColor = '#FFE082'; }

            m7.movingBlocks.push({
                x, y, w, h,
                minX, maxX,
                dir: 1,
                speed,
                type, color, topColor,
                solid: true
            });
        }

        // 默认玩家出生点
        m7.player.x = 80;
        m7.player.y = groundY - m7.player.standH;
        m7.player.vx = 0;
        m7.player.vy = 0;
        m7.player.isDead = false;
        m7.player.isCrouching = false;
        m7.goal.reached = false;

        if (m7.difficulty === 'normal') {
            endX = buildNormalLevel(lvl, groundY, addBlock, addGround, addCollapseTrap, addMovingBlock);
        } else {
            endX = buildEasyLevel(lvl, groundY, addBlock, addGround);
        }

        m7.mapWidth = endX + 350;
        m7.mapHeight = groundY + 200;
        m7.camera.x = m7.player.x - 200;
        m7.camera.y = m7.player.y - 200;
    }

    // ==========================================
    // 机关与陷阱物理更新
    // ==========================================
    function updateCollapseTraps(dt) {
        const p = m7.player;
        m7.collapseTraps.forEach(trap => {
            if (trap.state === 'idle') {
                const isSteppingOn = (!p.isDead &&
                    p.x + p.w > trap.x + 4 && p.x < trap.x + trap.w - 4 &&
                    p.y + p.h >= trap.y - 6 && p.y + p.h <= trap.y + 16);

                if (isSteppingOn) {
                    trap.state = 'triggered';
                    trap.timer = 0;
                    playSound('crumble');
                    for (let i = 0; i < 10; i++) {
                        m7.particles.push({
                            x: trap.x + Math.random() * trap.w,
                            y: trap.y + 2,
                            vx: (Math.random() - 0.5) * 3,
                            vy: -Math.random() * 2.5,
                            life: 1,
                            color: trap.topColor || '#81C784',
                            size: 3 + Math.random() * 3
                        });
                    }
                }
            } else if (trap.state === 'triggered') {
                trap.timer += dt;
                trap.shakeOffset = (Math.random() - 0.5) * 5;
                if (trap.timer >= trap.dropDelay) {
                    trap.state = 'falling';
                    trap.solid = false; // 失去支撑实体，玩家跌落！
                    trap.vy = 1.2;
                }
            } else if (trap.state === 'falling') {
                trap.vy += 0.8 * (dt / 16.67);
                trap.y += trap.vy * (dt / 16.67);
                if (trap.y > m7.mapHeight + 250) {
                    trap.state = 'gone';
                }
            }
        });
    }

    function updateMovingBlocks(dt) {
        const p = m7.player;
        m7.movingBlocks.forEach(b => {
            const step = (b.speed || 2) * (dt / 16.67);
            b.x += b.dir * step;
            if (b.dir > 0 && b.x >= b.maxX) {
                b.x = b.maxX;
                b.dir = -1;
            } else if (b.dir < 0 && b.x <= b.minX) {
                b.x = b.minX;
                b.dir = 1;
            }

            if (!p.isDead && isColliding(p, b)) {
                // 踩在顶部平台借力
                if (p.vy >= 0 && (p.y + p.h - b.y) < 14) {
                    p.y = b.y - p.h;
                    p.vy = 0;
                    p.isGrounded = true;
                    p.x += b.dir * step;
                } else {
                    // 水平推挤
                    if (b.dir > 0) {
                        p.x = b.x + b.w;
                    } else {
                        p.x = b.x - p.w;
                    }
                    if (Math.abs(p.vx) > 0) p.vx = 0;
                }
            }
        });
    }

    function updateLevel10Trap(dt) {
        const tr = m7.level10Trap;
        if (!tr) return;
        const p = m7.player;
        const groundY = 480;

        if (tr.state === 'idle') {
            tr.pitCover.currentY = groundY;
            tr.pitCover.solid = true;
            tr.wall.x = tr.wall.initialX;
            tr.wall.solid = false;
            tr.wall.active = false;
            tr.wall.visible = false;

            // 触发条件：玩家到达中间浮岛并接近第2个坑 (x >= 540)
            if (!p.isDead && p.x >= tr.triggerRangeX && p.x < 740) {
                tr.state = 'triggered';
                tr.wall.solid = true;
                tr.wall.active = true;
                tr.wall.visible = true;
                tr.timer = 0;
                playSound('lever');
                playSound('slide');
                if (typeof showMessage === 'function') {
                    showMessage('⚠️ 前方方块高墙升起并向左推来！', window.innerWidth / 2, window.innerHeight * 0.3);
                }
            }
        } else if (tr.state === 'triggered') {
            const moveStep = 3.0 * (dt / 16.67);
            tr.wall.x -= moveStep;

            // 第 2 坑覆盖地面迅速下坠开裂打开
            tr.pitCover.currentY += 4.5 * (dt / 16.67);
            if (tr.pitCover.currentY > groundY + 20) {
                tr.pitCover.solid = false;
            }

            if (tr.wall.x <= tr.wall.targetX) {
                tr.wall.x = tr.wall.targetX;
                tr.state = 'holding';
                tr.timer = 0;
            }

            handleWallPlayerCollision(tr.wall, -moveStep);

        } else if (tr.state === 'holding') {
            tr.timer += dt;
            tr.pitCover.solid = false;

            handleWallPlayerCollision(tr.wall, 0);

            // 闪避判定：玩家存活未掉进坑，且成功后撤避险 (x < 540)
            if (!p.isDead && p.x < 540 && tr.timer >= 600) {
                tr.state = 'reversing';
                tr.timer = 0;
                playSound('slide');
            }
        } else if (tr.state === 'reversing') {
            // 倒过来：坑回填上，方块也从左边回到右边
            const moveStep = 2.6 * (dt / 16.67);
            tr.wall.x += moveStep;

            tr.pitCover.currentY -= 4.0 * (dt / 16.67);
            if (tr.pitCover.currentY <= groundY) {
                tr.pitCover.currentY = groundY;
                tr.pitCover.solid = true; // 坑回填上，恢复支撑！
            }

            handleWallPlayerCollision(tr.wall, moveStep);

            if (tr.wall.x >= tr.wall.initialX) {
                tr.wall.x = tr.wall.initialX;
                tr.pitCover.currentY = groundY;
                tr.pitCover.solid = true;
                tr.wall.solid = false;
                tr.wall.active = false;
                tr.wall.visible = false;
                tr.state = 'idle'; // 再次靠近还会重新触发！
                tr.timer = 0;
            }
        }
    }

    function handleWallPlayerCollision(wall, moveX) {
        const p = m7.player;
        if (!wall.solid || p.isDead) return;

        const wallBox = { x: wall.x, y: wall.y, w: wall.w, h: wall.h };
        if (isColliding(p, wallBox)) {
            // 站在墙顶部
            if (p.vy >= 0 && (p.y + p.h - wall.y) < 14) {
                p.y = wall.y - p.h;
                p.vy = 0;
                p.isGrounded = true;
                p.x += moveX;
            } else {
                // 水平推挤
                if (moveX < 0) {
                    p.x = wall.x - p.w;
                    if (p.vx > 0) p.vx = 0;
                } else if (moveX > 0) {
                    p.x = wall.x + wall.w;
                    if (p.vx < 0) p.vx = 0;
                } else {
                    if (p.x + p.w / 2 < wall.x + wall.w / 2) {
                        p.x = wall.x - p.w;
                    } else {
                        p.x = wall.x + wall.w;
                    }
                }
            }
        }
    }

    // ==========================================
    // 物理与碰撞处理
    // ==========================================
    function updatePhysics(dt) {
        const p = m7.player;
        if (p.isDead) {
            p.deadTimer += dt;
            if (p.deadTimer > 1000) {
                // 重新开始当前关卡
                startMode7Level(m7.level, m7.difficulty);
            }
            return;
        }

        // 机关与陷阱物理更新
        updateCollapseTraps(dt);
        updateMovingBlocks(dt);
        if (m7.level10Trap) {
            updateLevel10Trap(dt);
        }

        // 1. 趴下状态控制（下键触发）
        const wantCrouch = m7.keys.down;

        // 如果想站起来，必须检查头顶是否有方块阻挡
        if (!wantCrouch && p.isCrouching) {
            let canStand = true;
            const headBox = {
                x: p.x + 2,
                y: p.y - (p.standH - p.crouchH),
                w: p.w - 4,
                h: p.standH - p.crouchH
            };
            for (const b of m7.blocks) {
                if (b.solid && isColliding(headBox, b)) {
                    canStand = false;
                    break;
                }
            }
            for (const tr of m7.collapseTraps) {
                if (tr.solid && isColliding(headBox, tr)) {
                    canStand = false;
                    break;
                }
            }
            for (const d of m7.doors) {
                if (!d.isOpen && isColliding(headBox, d)) {
                    canStand = false;
                    break;
                }
            }
            if (canStand) {
                p.isCrouching = false;
                p.y -= (p.standH - p.crouchH);
                p.h = p.standH;
            }
        } else if (wantCrouch && !p.isCrouching) {
            p.isCrouching = true;
            p.y += (p.standH - p.crouchH);
            p.h = p.crouchH;
            playSound('crouch');
        }

        // 2. 水平速度计算
        const currentSpeed = p.isCrouching ? CRAWL_SPEED : MOVE_SPEED;
        let targetVx = 0;
        if (m7.keys.left) {
            targetVx -= currentSpeed;
            p.facing = -1;
        }
        if (m7.keys.right) {
            targetVx += currentSpeed;
            p.facing = 1;
        }

        p.vx += (targetVx - p.vx) * 0.35;
        if (Math.abs(p.vx) > 0.1) {
            p.walkAnim += dt * (p.isCrouching ? 0.01 : 0.015);
        }

        // 3. 跳跃（上键 / 空格，在未趴下且着地时）
        if (m7.keys.up && p.isGrounded && !p.isCrouching) {
            p.vy = JUMP_FORCE;
            p.isGrounded = false;
            playSound('jump');
            // 跳跃微尘粒子
            for (let i = 0; i < 5; i++) {
                m7.particles.push({
                    x: p.x + p.w / 2 + (Math.random() - 0.5) * 16,
                    y: p.y + p.h,
                    vx: (Math.random() - 0.5) * 2,
                    vy: -Math.random() * 2,
                    life: 1,
                    color: '#81C784',
                    size: 3 + Math.random() * 3
                });
            }
        }

        // 4. 重力应用
        p.vy += GRAVITY;
        if (p.vy > 14) p.vy = 14;

        // 5. 水平移动与 AABB 碰撞
        p.x += p.vx;
        handleHorizontalCollisions();

        // 6. 垂直移动与 AABB 碰撞
        p.y += p.vy;
        p.isGrounded = false;
        handleVerticalCollisions();

        // 简单模式第 11 关在空气中爬行时生成微弱空气微尘反馈
        if (m7.difficulty === 'easy' && m7.level === 11 && p.isCrouching && p.isGrounded && p.x > 240 && p.x < 1020) {
            if (Math.random() < 0.25) {
                m7.particles.push({
                    x: p.x + p.w / 2 + (Math.random() - 0.5) * 12,
                    y: 480,
                    vx: (Math.random() - 0.5) * 0.4,
                    vy: -0.2 - Math.random() * 0.3,
                    life: 0.5,
                    color: 'rgba(255, 255, 255, 0.4)',
                    size: 2 + Math.random() * 2
                });
            }
        }

        // 7. 跌入深渊死亡判定
        if (p.y > m7.mapHeight + 100) {
            triggerDeath('掉下深渊！');
            return;
        }

        // 8. 致命电流碰撞检测
        for (const e of m7.electrics) {
            if (isColliding(p, e)) {
                triggerElectricDeath();
                return;
            }
        }

        // 9. 拉杆交互判定（检测玩家是否在拉杆附近）
        p.nearLever = null;
        for (const lev of m7.levers) {
            const dist = Math.hypot((p.x + p.w / 2) - (lev.x + lev.w / 2), (p.y + p.h / 2) - (lev.y + lev.h / 2));
            if (dist < 65) {
                p.nearLever = lev;
                break;
            }
        }

        // 10. 终点判定
        if (!m7.goal.reached && isColliding(p, m7.goal)) {
            m7.goal.reached = true;
            handleLevelVictory();
        }
    }

    function isColliding(r1, r2) {
        return r1.x < r2.x + r2.w &&
            r1.x + r1.w > r2.x &&
            r1.y < r2.y + r2.h &&
            r1.y + r1.h > r2.y;
    }

    function handleHorizontalCollisions() {
        const p = m7.player;
        // 与所有固体方块检测
        for (const b of m7.blocks) {
            if (!b.solid) continue;
            if (isColliding(p, b)) {
                if (p.vx > 0) {
                    p.x = b.x - p.w;
                    p.vx = 0;
                } else if (p.vx < 0) {
                    p.x = b.x + b.w;
                    p.vx = 0;
                }
            }
        }
        // 与固体崩塌陷阱检测
        for (const tr of m7.collapseTraps) {
            if (!tr.solid) continue;
            if (isColliding(p, tr)) {
                if (p.vx > 0) {
                    p.x = tr.x - p.w;
                    p.vx = 0;
                } else if (p.vx < 0) {
                    p.x = tr.x + tr.w;
                    p.vx = 0;
                }
            }
        }
        // 与第10关活动坑盖板检测
        if (m7.level10Trap && m7.level10Trap.pitCover && m7.level10Trap.pitCover.solid) {
            const pc = m7.level10Trap.pitCover;
            if (isColliding(p, pc)) {
                if (p.vx > 0) {
                    p.x = pc.x - p.w;
                    p.vx = 0;
                } else if (p.vx < 0) {
                    p.x = pc.x + pc.w;
                    p.vx = 0;
                }
            }
        }
        // 与大门检测
        for (const d of m7.doors) {
            if (d.isOpen) continue;
            if (isColliding(p, d)) {
                if (p.vx > 0) {
                    p.x = d.x - p.w;
                    p.vx = 0;
                } else if (p.vx < 0) {
                    p.x = d.x + d.w;
                    p.vx = 0;
                }
            }
        }
    }

    function handleVerticalCollisions() {
        const p = m7.player;
        // 与所有固体方块检测
        for (const b of m7.blocks) {
            if (!b.solid) continue;
            if (isColliding(p, b)) {
                if (p.vy > 0) {
                    // 踩在地面
                    p.y = b.y - p.h;
                    p.vy = 0;
                    p.isGrounded = true;
                } else if (p.vy < 0) {
                    // 顶头
                    p.y = b.y + b.h;
                    p.vy = 0;
                }
            }
        }
        // 与固体崩塌陷阱检测
        for (const tr of m7.collapseTraps) {
            if (!tr.solid) continue;
            if (isColliding(p, tr)) {
                if (p.vy > 0) {
                    p.y = tr.y - p.h;
                    p.vy = 0;
                    p.isGrounded = true;
                } else if (p.vy < 0) {
                    p.y = tr.y + tr.h;
                    p.vy = 0;
                }
            }
        }
        // 与第10关活动坑盖板检测
        if (m7.level10Trap && m7.level10Trap.pitCover && m7.level10Trap.pitCover.solid) {
            const pc = m7.level10Trap.pitCover;
            if (isColliding(p, pc)) {
                if (p.vy > 0) {
                    p.y = pc.currentY - p.h;
                    p.vy = 0;
                    p.isGrounded = true;
                } else if (p.vy < 0) {
                    p.y = pc.currentY + pc.h;
                    p.vy = 0;
                }
            }
        }
        // 与第10关方块高墙顶部踩踏检测
        if (m7.level10Trap && m7.level10Trap.wall && m7.level10Trap.wall.solid) {
            const wl = m7.level10Trap.wall;
            if (isColliding(p, wl)) {
                if (p.vy >= 0 && (p.y + p.h - wl.y) < 14) {
                    p.y = wl.y - p.h;
                    p.vy = 0;
                    p.isGrounded = true;
                }
            }
        }
        // 与大门检测
        for (const d of m7.doors) {
            if (d.isOpen) continue;
            if (isColliding(p, d)) {
                if (p.vy > 0) {
                    p.y = d.y - p.h;
                    p.vy = 0;
                    p.isGrounded = true;
                } else if (p.vy < 0) {
                    p.y = d.y + d.h;
                    p.vy = 0;
                }
            }
        }

        // 【简单模式第 11 关专属特性】：只有趴下（一直摁着趴下）才能直接走在空气上面，其他关没有
        const isLevel11AirWalk = (m7.difficulty === 'easy' && m7.level === 11);
        if (isLevel11AirWalk && p.isCrouching && m7.keys.down) {
            const airGroundY = 480; // 与起点和终点地面高度一致
            // 玩家处于深渊空中悬浮范围 (从左平台边缘 220 开始，到终点平台前)
            if (p.x + p.w > 220 && p.x < m7.mapWidth) {
                // 当玩家脚底位于空气地面高度附近，且不是在向上跃起
                if (p.y + p.h >= airGroundY && p.y + p.h <= airGroundY + 28 && p.vy >= 0) {
                    p.y = airGroundY - p.h;
                    p.vy = 0;
                    p.isGrounded = true;
                }
            }
        }
    }

    // 触发触电死亡
    function triggerElectricDeath() {
        const p = m7.player;
        if (p.isDead) return;
        p.isDead = true;
        p.deadTimer = 0;
        p.state = 'electrocuted';
        playSound('electric');

        // 生成电击火花粒子
        for (let i = 0; i < 25; i++) {
            m7.particles.push({
                x: p.x + p.w / 2,
                y: p.y + p.h / 2,
                vx: (Math.random() - 0.5) * 8,
                vy: (Math.random() - 0.5) * 8,
                life: 1,
                color: Math.random() < 0.5 ? '#00E5FF' : '#FFEA00',
                size: 3 + Math.random() * 4
            });
        }

        if (typeof showMessage === 'function') {
            showMessage('⚡ 触电了！按时躲避电流！', window.innerWidth / 2, window.innerHeight / 2);
        }
    }

    // 普通失败
    function triggerDeath(reason) {
        const p = m7.player;
        if (p.isDead) return;
        p.isDead = true;
        p.deadTimer = 0;
        p.state = 'dead';
        if (typeof showMessage === 'function') {
            showMessage(`🍂 ${reason}`, window.innerWidth / 2, window.innerHeight / 2);
        }
    }

    // 拉杆互动逻辑
    function triggerLeverInteraction() {
        const lev = m7.player.nearLever;
        if (!lev) return;

        // 切换拉杆状态
        if (lev.state === 'left') {
            lev.state = 'right';
            playSound('lever');

            // 触发火花
            for (let i = 0; i < 10; i++) {
                m7.particles.push({
                    x: lev.x + lev.w / 2,
                    y: lev.y + lev.h / 2,
                    vx: (Math.random() - 0.5) * 4,
                    vy: -Math.random() * 4,
                    life: 1,
                    color: '#FFD700',
                    size: 3
                });
            }

            // 打开对应大门
            for (const d of m7.doors) {
                if (d.id === lev.targetDoorId) {
                    d.isOpen = true;
                    playSound('door');
                    if (typeof showMessage === 'function') {
                        showMessage('🔓 机关已触发！大门正在打开！', window.innerWidth / 2, window.innerHeight * 0.35);
                    }
                }
            }
        }
    }

    // 关卡胜利
    function handleLevelVictory() {
        playSound('win');
        const isNormal = (m7.difficulty === 'normal');
        const diffText = isNormal ? '普通模式' : '简单模式';
        if (typeof showMessage === 'function') {
            showMessage(`✨ 第 ${m7.level} 关通过 (${diffText})！`, window.innerWidth / 2, window.innerHeight / 2);
        }

        // 保存关卡进度
        if (typeof gameState !== 'undefined') {
            if (!gameState.mode7Progress) {
                gameState.mode7Progress = { easy: 1, normal: 1 };
            }
            const nextLvl = m7.level + 1;
            if (isNormal) {
                if (nextLvl > (gameState.mode7Progress.normal || 1)) {
                    gameState.mode7Progress.normal = Math.min(nextLvl, m7.maxLevels);
                    localStorage.setItem('mode7_progress_normal', gameState.mode7Progress.normal);
                }
            } else {
                if (nextLvl > (gameState.mode7Progress.easy || 1)) {
                    gameState.mode7Progress.easy = Math.min(nextLvl, m7.maxLevels);
                    localStorage.setItem('mode7_progress_easy', gameState.mode7Progress.easy);
                }
            }
        }

        setTimeout(() => {
            if (m7.level >= m7.maxLevels) {
                // 25关全部通关！
                if (typeof showVictoryScreen === 'function') {
                    showVictoryScreen();
                } else if (typeof showMessage === 'function') {
                    showMessage(`🎉 恭喜通关第七模式（${diffText}）！`, window.innerWidth / 2, window.innerHeight / 2);
                }
            } else {
                startMode7Level(m7.level + 1, m7.difficulty);
            }
        }, 800);
    }

    // ==========================================
    // 渲染系统 (以清新绿色为基调)
    // ==========================================
    function render(ctx, width, height, dt) {
        // 1. 镜头平滑跟踪
        const targetCamX = m7.player.x - width * 0.38;
        const targetCamY = m7.player.y - height * 0.55;
        m7.camera.x += (targetCamX - m7.camera.x) * 0.1;
        m7.camera.y += (targetCamY - m7.camera.y) * 0.1;

        const camX = m7.camera.x;
        const camY = m7.camera.y;

        // 2. 绘制主题背景（渐变天空）
        const skyGrad = ctx.createLinearGradient(0, 0, 0, height);
        if (m7.difficulty === 'normal') {
            // 普通模式：黄色的背景（黄色加点橘）
            skyGrad.addColorStop(0, '#FFF9C4');   // 明朗淡金黄
            skyGrad.addColorStop(0.35, '#FFE082'); // 柔和金黄
            skyGrad.addColorStop(0.65, '#FFCA28'); // 金黄偏橘
            skyGrad.addColorStop(0.85, '#FFA726'); // 黄色加点橘
            skyGrad.addColorStop(1, '#FF9800');    // 温暖橘黄
        } else {
            skyGrad.addColorStop(0, '#E8F5E9');   // 极其清爽的浅薄荷绿
            skyGrad.addColorStop(0.5, '#C8E6C9'); // 柔和春绿
            skyGrad.addColorStop(1, '#A5D6A7');   // 自然草绿
        }
        ctx.fillStyle = skyGrad;
        ctx.fillRect(0, 0, width, height);

        // 3. 视差远景（普通模式：温暖金黄/橘色像素山丘；简单模式：绿色山丘）
        ctx.save();
        m7.bgHills.forEach(hill => {
            const screenX = hill.x - camX * 0.25;
            const screenY = hill.y - camY * 0.15;
            ctx.beginPath();
            ctx.arc(screenX, screenY + height * 0.3, hill.r, 0, Math.PI * 2);
            ctx.fillStyle = hill.color;
            ctx.fill();
        });
        ctx.restore();

        // 4. 视差云朵
        ctx.save();
        m7.bgClouds.forEach(c => {
            c.x += c.speed;
            if (c.x > m7.mapWidth + 500) c.x = -200;
            const screenX = c.x - camX * 0.4;
            const screenY = c.y - camY * 0.2;
            ctx.fillStyle = m7.difficulty === 'normal' ? `rgba(255, 253, 231, ${c.opacity * 0.85})` : `rgba(255, 255, 255, ${c.opacity})`;
            ctx.fillRect(screenX, screenY, c.w, c.h);
            ctx.fillRect(screenX + 15, screenY - 8, c.w - 30, c.h + 16);
        });
        ctx.restore();

        // 5. 渲染游戏世界（应用摄像机位移）
        ctx.save();
        ctx.translate(-camX, -camY);

        // A. 渲染所有方块
        m7.blocks.forEach(b => {
            // 视口剔除优化
            if (b.x + b.w < camX - 100 || b.x > camX + width + 100) return;

            // 方块主体
            ctx.fillStyle = b.color;
            ctx.fillRect(b.x, b.y, b.w, b.h);

            // 顶部高亮边条（像素积木感）
            ctx.fillStyle = b.topColor;
            ctx.fillRect(b.x, b.y, b.w, 6);

            // 内部像素纹理装饰
            ctx.fillStyle = 'rgba(0, 0, 0, 0.08)';
            ctx.fillRect(b.x + b.w - 4, b.y, 4, b.h);
            ctx.fillRect(b.x, b.y + b.h - 4, b.w, 4);

            if (b.type === 'grass') {
                // 草方块垂下来的草叶纹理 (普通模式采用金黄偏橘纹理，简单模式采用鲜绿)
                ctx.fillStyle = (m7.difficulty === 'normal') ? '#FFA000' : '#4CAF50';
                for (let i = 0; i < b.w; i += 12) {
                    ctx.fillRect(b.x + i, b.y + 6, 6, 4);
                }
            } else if (b.type === 'brick' || b.type === 'tunnel') {
                // 砖块纹路
                ctx.fillStyle = 'rgba(0, 0, 0, 0.15)';
                for (let py = 12; py < b.h; py += 16) {
                    ctx.fillRect(b.x, b.y + py, b.w, 2);
                }
            }
        });

        // A2. 渲染崩塌陷阱方块
        m7.collapseTraps.forEach(trap => {
            if (trap.state === 'gone') return;
            ctx.save();
            const ox = trap.shakeOffset || 0;
            ctx.translate(trap.x + ox, trap.y);

            ctx.fillStyle = trap.color || '#4CAF50';
            ctx.fillRect(0, 0, trap.w, trap.h);

            ctx.fillStyle = trap.topColor || '#81C784';
            ctx.fillRect(0, 0, trap.w, 6);

            // 碎裂纹路
            if (trap.state === 'triggered' || trap.state === 'falling') {
                ctx.strokeStyle = 'rgba(0, 0, 0, 0.45)';
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.moveTo(trap.w * 0.2, 0);
                ctx.lineTo(trap.w * 0.45, 18);
                ctx.lineTo(trap.w * 0.35, 36);
                ctx.moveTo(trap.w * 0.6, 0);
                ctx.lineTo(trap.w * 0.75, 26);
                ctx.stroke();
            }
            ctx.restore();
        });

        // A3. 渲染巡逻推挤方块
        m7.movingBlocks.forEach(mb => {
            ctx.save();
            ctx.fillStyle = mb.color || '#607D8B';
            ctx.fillRect(mb.x, mb.y, mb.w, mb.h);
            ctx.fillStyle = mb.topColor || '#90A4AE';
            ctx.fillRect(mb.x, mb.y, mb.w, 6);
            ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
            ctx.fillRect(mb.x + 4, mb.y + 10, mb.w - 8, mb.h - 14);
            ctx.fillStyle = '#FFE082';
            ctx.fillRect(mb.x + mb.w / 2 - 2, mb.y + mb.h / 2 - 2, 4, 4);
            ctx.restore();
        });

        // A4. 渲染第 10 关往复双坑与推挤方块高墙
        if (m7.level10Trap) {
            const tr = m7.level10Trap;
            const groundY = 480;

            // 1. 坑 2 的活动盖板
            if (tr.pitCover && tr.pitCover.currentY < groundY + 160) {
                ctx.save();
                ctx.fillStyle = tr.pitCover.color;
                ctx.fillRect(tr.pitCover.x, tr.pitCover.currentY, tr.pitCover.w, tr.pitCover.h);
                ctx.fillStyle = tr.pitCover.topColor;
                ctx.fillRect(tr.pitCover.x, tr.pitCover.currentY, tr.pitCover.w, 6);
                ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
                ctx.fillRect(tr.pitCover.x, tr.pitCover.currentY + 6, 4, tr.pitCover.h);
                ctx.fillRect(tr.pitCover.x + tr.pitCover.w - 4, tr.pitCover.currentY + 6, 4, tr.pitCover.h);
                ctx.restore();
            }

            // 2. 推挤方块高墙（3.5格高）
            if (tr.wall && (tr.wall.active || tr.wall.visible)) {
                ctx.save();
                const wx = tr.wall.x;
                const wy = tr.wall.y;
                const ww = tr.wall.w;
                const wh = tr.wall.h;

                // 曜石底色
                ctx.fillStyle = '#263238';
                ctx.fillRect(wx, wy, ww, wh);

                // 坚硬顶层平台
                ctx.fillStyle = '#78909C';
                ctx.fillRect(wx, wy, ww, 8);

                // 分层方块与符文雕花
                const blockSize = 40;
                for (let py = 0; py < wh; py += blockSize) {
                    const blockH = Math.min(blockSize, wh - py);
                    ctx.strokeStyle = '#37474F';
                    ctx.lineWidth = 2;
                    ctx.strokeRect(wx, wy + py, ww, blockH);
                    ctx.fillStyle = '#FF1744';
                    ctx.fillRect(wx + 6, wy + py + blockH / 2 - 3, 6, 6);
                }

                // 动态方向指示
                ctx.fillStyle = tr.state === 'triggered' ? '#FFEB3B' : '#00E676';
                ctx.font = 'bold 16px sans-serif';
                ctx.textAlign = 'center';
                const arrow = tr.state === 'triggered' ? '◀' : '▶';
                ctx.fillText(arrow, wx + ww / 2, wy + wh / 2);

                ctx.restore();
            }
        }

        // B. 渲染提示木牌
        m7.signs.forEach(s => {
            // 木桩
            ctx.fillStyle = '#5D4037';
            ctx.fillRect(s.x + 12, s.y + 24, 8, 36);
            // 标牌底板
            ctx.fillStyle = '#8D6E63';
            ctx.fillRect(s.x - 30, s.y - 10, 92, 34);
            ctx.strokeStyle = '#4E342E';
            ctx.lineWidth = 2;
            ctx.strokeRect(s.x - 30, s.y - 10, 92, 34);
            // 文字
            ctx.fillStyle = '#FFFFFF';
            ctx.font = 'bold 12px sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText(s.text, s.x + 16, s.y + 6);
            if (s.subText) {
                ctx.font = '10px sans-serif';
                ctx.fillStyle = '#FFF9C4';
                ctx.fillText(s.subText, s.x + 16, s.y + 18);
            }
        });

        // C. 渲染大门（电动门）
        m7.doors.forEach(d => {
            if (d.isOpen && d.openProgress < 1) {
                d.openProgress += dt * 0.003;
                if (d.openProgress > 1) d.openProgress = 1;
            }
            const curH = d.h * (1 - d.openProgress);
            if (curH > 0) {
                // 铁门门板
                ctx.fillStyle = '#37474F';
                ctx.fillRect(d.x, d.y, d.w, curH);
                // 门栅栏条纹
                ctx.fillStyle = '#78909C';
                for (let ox = 8; ox < d.w; ox += 14) {
                    ctx.fillRect(d.x + ox, d.y, 4, curH);
                }
                // 红色警示灯
                ctx.fillStyle = d.isOpen ? '#00E676' : '#FF1744';
                ctx.beginPath();
                ctx.arc(d.x + d.w / 2, d.y + 8, 4, 0, Math.PI * 2);
                ctx.fill();
            }
        });

        // D. 渲染拉杆
        m7.levers.forEach(lev => {
            // 拉杆底座
            ctx.fillStyle = '#424242';
            ctx.fillRect(lev.x, lev.y + 20, lev.w, 10);

            // 拉杆杆柄（带平滑转动动画）
            if (lev.state === 'right' && lev.animProgress < 1) {
                lev.animProgress += dt * 0.008;
                if (lev.animProgress > 1) lev.animProgress = 1;
            }
            const angle = lev.state === 'left' ? -0.6 : (-0.6 + lev.animProgress * 1.2);

            ctx.save();
            ctx.translate(lev.x + lev.w / 2, lev.y + 20);
            ctx.rotate(angle);
            // 杆身
            ctx.fillStyle = '#BDBDBD';
            ctx.fillRect(-3, -22, 6, 22);
            // 握把红球
            ctx.fillStyle = lev.state === 'right' ? '#00E676' : '#E53935';
            ctx.beginPath();
            ctx.arc(0, -22, 6, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();

            // 靠近提示标记
            if (m7.player.nearLever === lev && lev.state === 'left') {
                ctx.fillStyle = 'rgba(255, 235, 59, 0.9)';
                ctx.font = 'bold 12px sans-serif';
                ctx.textAlign = 'center';
                ctx.fillText('[按空格键拉动]', lev.x + lev.w / 2, lev.y - 12);
            }
        });

        // E. 渲染致命电流网
        m7.electrics.forEach(e => {
            e.animTimer += dt * 0.01;
            // 电流底座
            ctx.fillStyle = '#263238';
            ctx.fillRect(e.x, e.y, e.w, e.h);

            // 动态电弧射线
            ctx.save();
            ctx.strokeStyle = Math.random() < 0.5 ? '#00E5FF' : '#FFEA00';
            ctx.lineWidth = 2;
            ctx.beginPath();
            const segments = Math.floor(e.w / 12);
            ctx.moveTo(e.x, e.y + e.h / 2);
            for (let i = 1; i <= segments; i++) {
                const px = e.x + (i * 12);
                const py = e.y + (e.h / 2) + (Math.random() - 0.5) * (e.h * 0.8);
                ctx.lineTo(px, py);
            }
            ctx.stroke();

            // 边缘光晕
            ctx.fillStyle = 'rgba(0, 229, 255, 0.25)';
            ctx.fillRect(e.x, e.y, e.w, e.h);
            ctx.restore();
        });

        // F. 渲染终点（绿色传送门/光柱）
        const g = m7.goal;
        const pulse = Math.sin(performance.now() * 0.005) * 0.2 + 0.8;
        ctx.save();
        // 光柱
        const goalGrad = ctx.createLinearGradient(g.x, g.y, g.x, g.y + g.h);
        goalGrad.addColorStop(0, `rgba(76, 175, 80, ${0.8 * pulse})`);
        goalGrad.addColorStop(1, 'rgba(139, 195, 74, 0.2)');
        ctx.fillStyle = goalGrad;
        ctx.fillRect(g.x, g.y - 20, g.w, g.h + 20);

        // 终点旗帜/边框
        ctx.strokeStyle = '#2E7D32';
        ctx.lineWidth = 3;
        ctx.strokeRect(g.x, g.y - 20, g.w, g.h + 20);

        // 终点图标
        ctx.fillStyle = '#FFFFFF';
        ctx.font = 'bold 20px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('🏁', g.x + g.w / 2, g.y + g.h / 2);
        ctx.restore();

        // G. 渲染粒子
        for (let i = m7.particles.length - 1; i >= 0; i--) {
            const pt = m7.particles[i];
            pt.x += pt.vx;
            pt.y += pt.vy;
            pt.life -= dt * 0.002;
            if (pt.life <= 0) {
                m7.particles.splice(i, 1);
            } else {
                ctx.fillStyle = pt.color;
                ctx.globalAlpha = pt.life;
                ctx.fillRect(pt.x, pt.y, pt.size, pt.size);
            }
        }
        ctx.globalAlpha = 1;

        // H. 渲染玩家角色（方块人，支持站立、跑动、趴下爬行、触电）
        renderPlayer(ctx, dt);

        ctx.restore();

        // 6. 顶部模式专有 HUD
        renderMode7HUD(ctx, width, height);
    }

    function renderPlayer(ctx, dt) {
        const p = m7.player;
        ctx.save();
        ctx.translate(p.x, p.y);

        if (p.state === 'electrocuted') {
            // 触电震颤与蓝黄光效
            ctx.translate((Math.random() - 0.5) * 6, (Math.random() - 0.5) * 6);
            ctx.fillStyle = Math.random() < 0.5 ? '#00E5FF' : '#FFEB3B';
            ctx.fillRect(0, 0, p.w, p.h);
            ctx.restore();
            return;
        }

        // 面向镜像
        if (p.facing === -1) {
            ctx.translate(p.w, 0);
            ctx.scale(-1, 1);
        }

        if (p.isCrouching) {
            // 【趴下/爬行姿势】(高度 24px, 宽度 36px)
            // 身体扁平横置
            ctx.fillStyle = '#2196F3'; // 衣服
            ctx.fillRect(4, 8, 24, 14);

            // 头部
            ctx.fillStyle = '#FFCC80'; // 肤色
            ctx.fillRect(20, 2, 14, 14);

            // 眼睛
            ctx.fillStyle = '#1A237E';
            ctx.fillRect(30, 6, 3, 4);

            // 爬行四肢动画
            const limbAnim = Math.sin(p.walkAnim) * 4;
            ctx.fillStyle = '#1565C0'; // 裤子
            ctx.fillRect(0, 12, 8, 10 + limbAnim);
            ctx.fillStyle = '#455A64'; // 手臂
            ctx.fillRect(16, 14, 8, 8 - limbAnim);

        } else {
            // 【站立/奔跑/跳跃姿势】(高度 50px, 宽度 26px)
            const legSwing = p.isGrounded ? Math.sin(p.walkAnim) * 6 : 4;

            // 头部 (16x16)
            ctx.fillStyle = '#FFCC80';
            ctx.fillRect(5, 0, 16, 16);

            // 头发
            ctx.fillStyle = '#4E342E';
            ctx.fillRect(5, 0, 16, 5);
            ctx.fillRect(5, 0, 4, 9);

            // 眼睛
            ctx.fillStyle = '#1A237E';
            ctx.fillRect(17, 6, 3, 4);

            // 身体/上衣 (18x18)
            ctx.fillStyle = '#2196F3';
            ctx.fillRect(4, 16, 18, 18);

            // 手臂
            ctx.fillStyle = '#1976D2';
            ctx.fillRect(1, 18 - legSwing * 0.5, 4, 14);
            ctx.fillRect(21, 18 + legSwing * 0.5, 4, 14);

            // 腿部/裤子
            ctx.fillStyle = '#1565C0';
            // 左腿
            ctx.fillRect(5, 34, 6, 16 + legSwing);
            // 右腿
            ctx.fillRect(15, 34, 6, 16 - legSwing);

            // 鞋子
            ctx.fillStyle = '#37474F';
            ctx.fillRect(5, 46 + legSwing, 7, 4);
            ctx.fillRect(15, 46 - legSwing, 7, 4);
        }

        ctx.restore();
    }

    function renderMode7HUD(ctx, width, height) {
        ctx.save();
        const isNormal = (m7.difficulty === 'normal');
        // 顶部关卡指示徽章
        ctx.fillStyle = isNormal ? 'rgba(230, 81, 0, 0.92)' : 'rgba(27, 94, 32, 0.85)';
        ctx.beginPath();
        if (ctx.roundRect) ctx.roundRect(width / 2 - 130, 12, 260, 36, 18);
        else ctx.rect(width / 2 - 130, 12, 260, 36);
        ctx.fill();
        ctx.strokeStyle = isNormal ? '#FFD54F' : '#81C784';
        ctx.lineWidth = 2;
        ctx.stroke();

        ctx.fillStyle = '#FFFFFF';
        ctx.font = 'bold 15px sans-serif';
        ctx.textAlign = 'center';
        const diffText = isNormal ? '普通模式' : '简单模式';
        ctx.fillText(`第七音 · 第 ${m7.level} / ${m7.maxLevels} 关 (${diffText})`, width / 2, 35);
        ctx.restore();
    }

    // ==========================================
    // 移动端触屏虚拟按键
    // ==========================================
    function initMobileControls() {
        let container = document.getElementById('mode7Controls');
        if (container) return;

        container = document.createElement('div');
        container.id = 'mode7Controls';
        container.style.cssText = `
            position: fixed;
            bottom: 20px;
            left: 0;
            right: 0;
            display: flex;
            justify-content: space-between;
            align-items: flex-end;
            padding: 0 25px;
            z-index: 500;
            pointer-events: none;
        `;

        container.innerHTML = `
            <!-- 左侧移动键组 -->
            <div style="display: flex; gap: 15px; pointer-events: auto;">
                <button id="m7BtnLeft" class="m7-btn" style="width: 58px; height: 58px; border-radius: 50%; background: rgba(46, 125, 50, 0.8); border: 2px solid #81C784; color: white; font-size: 22px; display: flex; align-items: center; justify-content: center; touch-action: manipulation; box-shadow: 0 4px 10px rgba(0,0,0,0.3);">◀</button>
                <button id="m7BtnRight" class="m7-btn" style="width: 58px; height: 58px; border-radius: 50%; background: rgba(46, 125, 50, 0.8); border: 2px solid #81C784; color: white; font-size: 22px; display: flex; align-items: center; justify-content: center; touch-action: manipulation; box-shadow: 0 4px 10px rgba(0,0,0,0.3);">▶</button>
            </div>

            <!-- 右侧动作键组 (跳跃、趴下、互动) -->
            <div style="display: flex; gap: 14px; align-items: flex-end; pointer-events: auto;">
                <button id="m7BtnInteract" class="m7-btn" style="width: 52px; height: 52px; border-radius: 50%; background: rgba(255, 179, 0, 0.85); border: 2px solid #FFE082; color: white; font-size: 13px; font-weight: bold; display: flex; align-items: center; justify-content: center; touch-action: manipulation; box-shadow: 0 4px 10px rgba(0,0,0,0.3);">🕹️拉杆</button>
                <button id="m7BtnDown" class="m7-btn" style="width: 56px; height: 56px; border-radius: 50%; background: rgba(56, 142, 60, 0.8); border: 2px solid #A5D6A7; color: white; font-size: 20px; display: flex; align-items: center; justify-content: center; touch-action: manipulation; box-shadow: 0 4px 10px rgba(0,0,0,0.3);">▼趴下</button>
                <button id="m7BtnUp" class="m7-btn" style="width: 66px; height: 66px; border-radius: 50%; background: rgba(27, 94, 32, 0.85); border: 2px solid #81C784; color: white; font-size: 24px; display: flex; align-items: center; justify-content: center; touch-action: manipulation; box-shadow: 0 4px 12px rgba(0,0,0,0.4);">▲跳跃</button>
            </div>
        `;

        document.body.appendChild(container);

        // 绑定触控事件
        function bindTouch(id, keyName, isAction = false) {
            const btn = document.getElementById(id);
            if (!btn) return;

            btn.addEventListener('pointerdown', (e) => {
                e.preventDefault();
                getAudioContext();
                if (isAction) {
                    triggerLeverInteraction();
                } else {
                    m7.keys[keyName] = true;
                }
                btn.style.transform = 'scale(0.92)';
            });

            btn.addEventListener('pointerup', (e) => {
                e.preventDefault();
                if (!isAction) m7.keys[keyName] = false;
                btn.style.transform = 'scale(1)';
            });

            btn.addEventListener('pointercancel', (e) => {
                e.preventDefault();
                if (!isAction) m7.keys[keyName] = false;
                btn.style.transform = 'scale(1)';
            });
        }

        bindTouch('m7BtnLeft', 'left');
        bindTouch('m7BtnRight', 'right');
        bindTouch('m7BtnUp', 'up');
        bindTouch('m7BtnDown', 'down');
        bindTouch('m7BtnInteract', 'interact', true);
    }

    function showMobileControls() {
        initMobileControls();
        const el = document.getElementById('mode7Controls');
        if (el) el.style.display = 'flex';
    }

    function hideMobileControls() {
        const el = document.getElementById('mode7Controls');
        if (el) el.style.display = 'none';
    }

    // ==========================================
    // 键盘监听
    // ==========================================
    function initKeyboardListeners() {
        if (m7.initialized) return;
        m7.initialized = true;

        window.addEventListener('keydown', (e) => {
            if (typeof gameState === 'undefined' || gameState.mode !== 7 || !gameState.isPlaying) return;

            getAudioContext();

            if (e.code === 'ArrowLeft' || e.code === 'KeyA') {
                m7.keys.left = true;
            } else if (e.code === 'ArrowRight' || e.code === 'KeyD') {
                m7.keys.right = true;
            } else if (e.code === 'ArrowUp' || e.code === 'KeyW') {
                m7.keys.up = true;
            } else if (e.code === 'ArrowDown' || e.code === 'KeyS') {
                m7.keys.down = true;
            } else if (e.code === 'Space') {
                // 空格键在拉杆旁时优先拉动拉杆，否则也可用于跳跃
                if (m7.player.nearLever) {
                    triggerLeverInteraction();
                } else {
                    m7.keys.up = true;
                }
            }
        });

        window.addEventListener('keyup', (e) => {
            if (typeof gameState === 'undefined' || gameState.mode !== 7) return;

            if (e.code === 'ArrowLeft' || e.code === 'KeyA') {
                m7.keys.left = false;
            } else if (e.code === 'ArrowRight' || e.code === 'KeyD') {
                m7.keys.right = false;
            } else if (e.code === 'ArrowUp' || e.code === 'KeyW' || e.code === 'Space') {
                m7.keys.up = false;
            } else if (e.code === 'ArrowDown' || e.code === 'KeyS') {
                m7.keys.down = false;
            }
        });
    }

    // ==========================================
    // 对外公开 API
    // ==========================================
    function startMode7Level(lvl = 1, diff = null) {
        if (lvl < 1) lvl = 1;
        if (lvl > m7.maxLevels) lvl = m7.maxLevels;

        if (diff === 'normal' || diff === 'easy') {
            m7.difficulty = diff;
        } else if (typeof gameState !== 'undefined' && gameState.mode7Difficulty) {
            m7.difficulty = gameState.mode7Difficulty;
        }

        m7.level = lvl;
        if (typeof gameState !== 'undefined') {
            gameState.level = lvl;
            gameState.mode = 7;
            gameState.isPlaying = true;
            gameState.targetCount = m7.maxLevels;
            gameState.currentLevelCollected = lvl - 1;
            gameState.timeLeft = 9999; // 不限时
            gameState.mode7Difficulty = m7.difficulty;
        }

        initBackgroundElements();
        buildLevelData(lvl);
        initKeyboardListeners();
        showMobileControls();

        // 隐藏其他模式的控件
        const mcControls = document.getElementById('mcControls');
        if (mcControls) mcControls.classList.add('hidden');
        const tetrisControls = document.getElementById('tetrisControls');
        if (tetrisControls) tetrisControls.classList.add('hidden');
        const stairControls = document.getElementById('mcStairControls');
        if (stairControls) stairControls.classList.add('hidden');

        // 更新顶部关卡显示
        const scoreLabel = document.getElementById('scoreLabel');
        if (scoreLabel) scoreLabel.textContent = '当前关卡';
        const scoreDisplay = document.getElementById('scoreDisplay');
        const diffLabel = m7.difficulty === 'normal' ? '普通模式' : '简单模式';
        if (scoreDisplay) scoreDisplay.textContent = `第 ${lvl} / ${m7.maxLevels} 关 (${diffLabel})`;

        // 隐藏倒计时与收集篮
        const timerBox = document.getElementById('timerBox');
        if (timerBox) timerBox.classList.add('hidden');
        const basket = document.getElementById('basket');
        if (basket) basket.classList.add('hidden');
    }
    window.startMode7Level = startMode7Level;

    window.loopMode7 = function (t, dt) {
        updatePhysics(dt);
        const canvas = document.getElementById('gameCanvas');
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        render(ctx, canvas.width, canvas.height, dt);
    };

    window.stopMode7 = function () {
        hideMobileControls();
        m7.keys.left = false;
        m7.keys.right = false;
        m7.keys.up = false;
        m7.keys.down = false;
    };

})();
