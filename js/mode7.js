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
            } else if (type === 'electric_off') {
                // 电源切断消散音
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                osc.type = 'sine';
                osc.frequency.setValueAtTime(460, now);
                osc.frequency.exponentialRampToValueAtTime(50, now + 0.35);
                gain.gain.setValueAtTime(0.25, now);
                gain.gain.exponentialRampToValueAtTime(0.01, now + 0.35);
                osc.connect(gain);
                gain.connect(ctx.destination);
                osc.start(now);
                osc.stop(now + 0.35);
            } else if (type === 'slam') {
                // 栅栏/巨柱插地撞击声
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                osc.type = 'triangle';
                osc.frequency.setValueAtTime(150, now);
                osc.frequency.exponentialRampToValueAtTime(35, now + 0.2);
                gain.gain.setValueAtTime(0.32, now);
                gain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
                osc.connect(gain);
                gain.connect(ctx.destination);
                osc.start(now);
                osc.stop(now + 0.2);
            } else if (type === 'teleport') {
                // 末影传送音效
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                osc.type = 'sine';
                osc.frequency.setValueAtTime(320, now);
                osc.frequency.exponentialRampToValueAtTime(880, now + 0.18);
                osc.frequency.exponentialRampToValueAtTime(240, now + 0.38);
                gain.gain.setValueAtTime(0.28, now);
                gain.gain.exponentialRampToValueAtTime(0.01, now + 0.38);
                osc.connect(gain);
                gain.connect(ctx.destination);
                osc.start(now);
                osc.stop(now + 0.38);
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
        fenceTrap: null,     // 第25关大柱子与4连动升降栅栏机关
        levers: [],          // [{ x, y, state: 'left'|'right', animProgress: 0, targetDoorId, targetElectricId }]
        doors: [],           // [{ id, x, y, w, h, isOpen: false, openProgress: 0 }]
        electrics: [],       // [{ id, x, y, w, h, animTimer: 0, disabled: false }]
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
            crouchH: 22,
            isGrounded: false,
            isCrouching: false,
            facing: 1, // 1: 右, -1: 左
            walkAnim: 0,
            state: 'idle', // idle, walk, jump, crouch, crawl, dead, win
            isDead: false,
            deadTimer: 0,
            nearLever: null
        },

        // 药水状态机 (加速10秒、跳跃提升10秒、悬浮10秒、瞬移单次生效)
        potionEffects: {
            speed: { active: false, timer: 0 },
            jump: { active: false, timer: 0 },
            levitation: { active: false, timer: 0 },
            teleport: { armed: false }
        },

        // 按键状态
        keys: {
            left: false,
            right: false,
            up: false,
            down: false,
            sprint: false,
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
            addGround(340, 120, groundY, 'stone');
            // 暗坑做短（宽度 60px）：按 Shift 加速爬行冲刺可直接跨越；不加速则掉入坑中
            addGround(520, 140, groundY, 'stone');
            // 上方的杠子大幅向上抬高加厚（从 y=60 延伸至 groundY-38，厚度达 382px），防止从上方跳过去，底部保持 38px 爬行空间
            addBlock(340, 60, 320, (groundY - 38) - 60, 'brick');

            addGround(660, 900, groundY, 'grass');
            m7.signs.push({ x: 220, y: groundY - 60, text: '低矮暗道有险情！', subText: '按住【Shift】加速爬行冲过暗坑' });
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
            // 上方长廊天花板：抬升至 groundY - 130，底部高 390 (站立拥有 40px 充裕净空，起跳不再撞头)
            addBlock(300, groundY - 130, 480, 40, 'brick');
            addGround(300, 160, groundY, 'stone');
            // 中间避险凹槽：深度 22px (y = groundY + 22 = 502)
            addBlock(460, groundY + 22, 140, 140, 'stone');
            addGround(600, 180, groundY, 'stone');
            // 巡逻巨石：y = groundY - 90 = 390, h = 80，底部为 470
            // 在平地 (480) 净空仅 10px（封路推挤）；在凹槽 (502) 净空达 32px，趴下 (22px) 即可从容避险穿过！
            addMovingBlock(620, groundY - 90, 50, 80, 340, 720, 2.8, 'obsidian');

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

            // 初始化第 10 关专属往复陷阱状态机（右侧高速推挤，左侧升墙拦截，5秒休眠重置）
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
                    targetX: 486, // 一直推到中间方块左边缘 (x=460)
                    y: groundY - 140, // 高达 140px (3.5 格高)
                    w: 52,
                    h: 140,
                    solid: false,
                    active: false,
                    visible: false
                },
                leftWall: {
                    x: 434,
                    targetY: groundY - 140, // 340
                    currentY: groundY,
                    w: 28,
                    h: 140,
                    solid: false,
                    visible: false
                },
                state: 'idle', // 'idle' | 'triggered' | 'holding' | 'waiting5s'
                timer: 0,
                triggerRangeX: 535
            };

            m7.signs.push({ x: 200, y: groundY - 60, text: '⭐ 第 10 关：双壁合围陷阱', subText: '极速推挤与左侧升墙！双墙消失有5秒空窗！' });

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
            // 🏆【第 25 关：普通难度终极关卡·电网拉杆与升降四栅栏】
            endX = 2100;

            // 1. 起点与出生平台
            addGround(0, 380, groundY, 'grass');

            // 2. 机关一：致命高压电网 + 地下电闸拉杆
            // 地表走廊：地面石桥 + 顶部防跳跃顶棚 + 致命电流
            addBlock(380, groundY, 340, 20, 'stone');
            addBlock(380, groundY - 130, 340, 30, 'brick'); // 顶部阻挡，防止直接起跳越过
            m7.electrics.push({
                id: 'elec_lvl25',
                x: 420,
                y: groundY - 30,
                w: 260,
                h: 30,
                animTimer: 0,
                disabled: false
            });

            // 地下暗室通道：左侧台阶下行进入地下室
            addBlock(340, groundY + 30, 40, 130, 'stone');  // 阶梯 1
            addBlock(380, groundY + 60, 40, 100, 'stone');  // 阶梯 2
            addBlock(380, groundY + 90, 260, 70, 'tunnel'); // 地下室行走地面
            // 地下室末端死胡同实心黑曜石阻挡墙
            addBlock(640, groundY + 20, 40, 140, 'obsidian');

            // 地下室电闸拉杆（拉动后切断 elec_lvl25 电流）
            m7.levers.push({
                x: 520,
                y: groundY + 58,
                w: 32,
                h: 30,
                state: 'left',
                animProgress: 0,
                targetElectricId: 'elec_lvl25'
            });

            m7.signs.push({
                x: 300,
                y: groundY - 60,
                text: '高压电网与地下电闸',
                subText: '进入地下暗室拉动电闸，方可切断上方致命电流！'
            });

            // 3. 中间过渡地面
            addGround(720, 280, groundY, 'grass');

            // 4. 机关二告示牌（严格按照用户要求立牌："四个栅栏会有两个先伸出来"）
            m7.signs.push({
                x: 920,
                y: groundY - 60,
                text: '四个栅栏会有两个先伸出来',
                subText: '2/4号先伸出，趁升起间隙在下方避难！触碰将传送回起点'
            });

            // 5. 机关二：大柱子与 4 个升降栅栏
            addGround(1000, 600, groundY, 'stone');
            m7.fenceTrap = {
                x: 1000,
                w: 560,
                groundY: groundY,
                minY: 120, // 升起状态：底部位于 Y=380，留出 100px 安全通行与避难净空
                maxY: 220, // 降下状态：底部位于 Y=480，严密插在地上封死通道
                fences: [
                    { id: 1, x: 1080, w: 40, h: 260, currentY: 120, num: '①' },
                    { id: 2, x: 1200, w: 40, h: 260, currentY: 220, num: '②' },
                    { id: 3, x: 1320, w: 40, h: 260, currentY: 120, num: '③' },
                    { id: 4, x: 1440, w: 40, h: 260, currentY: 220, num: '④' }
                ],
                state: 'phase1_pause', // 初始阶段：2号与4号先插在地上
                timer: 0,
                pauseDuration: 2000,   // 停止 2 秒
                moveDuration: 1800     // 缓缓升起/下落 1.8 秒
            };

            // 6. 终点区域
            addGround(1600, 500, groundY, 'grass');
            m7.goal.x = 1880;
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
        m7.fenceTrap = null;

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

        // 起点常驻村民 NPC (供玩家交易兑换药水)
        m7.villager = {
            x: 25,
            y: groundY - 52,
            w: 26,
            h: 52
        };

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
            const prevX = b.x;
            b.x += b.dir * step;
            if (b.dir > 0 && b.x >= b.maxX) {
                b.x = b.maxX;
                b.dir = -1;
            } else if (b.dir < 0 && b.x <= b.minX) {
                b.x = b.minX;
                b.dir = 1;
            }

            // 1. 如果玩家稳稳站在移动方块顶部，跟随方块平移
            if (!p.isDead && p.isGrounded && Math.abs(p.y + p.h - b.y) <= 4 && (p.x + p.w > b.x + 2 && p.x < b.x + b.w - 2)) {
                p.x += (b.x - prevX);
            }
            // 2. 如果移动方块撞上/推挤玩家
            else if (!p.isDead && isColliding(p, b)) {
                // 踩在顶部借力
                if (p.vy >= 0 && (p.y + p.h - b.y) <= 14) {
                    p.y = b.y - p.h;
                    p.vy = 0;
                    p.isGrounded = true;
                    p.x += (b.x - prevX);
                } else {
                    // 水平推挤：根据玩家中心与方块中心的相对位置推挤，严禁反向瞬移
                    const pCenterX = p.x + p.w / 2;
                    const bCenterX = b.x + b.w / 2;
                    if (b.dir > 0 && pCenterX > bCenterX) {
                        p.x = b.x + b.w;
                        if (p.vx < 0) p.vx = 0;
                    } else if (b.dir < 0 && pCenterX < bCenterX) {
                        p.x = b.x - p.w;
                        if (p.vx > 0) p.vx = 0;
                    }
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
            if (tr.leftWall) {
                tr.leftWall.currentY = groundY;
                tr.leftWall.solid = false;
                tr.leftWall.visible = false;
            }

            // 触发条件：玩家到达中间浮岛并接近第2个坑 (x >= 535)
            if (!p.isDead && p.x >= tr.triggerRangeX && p.x < 740) {
                tr.state = 'triggered';
                tr.wall.solid = true;
                tr.wall.active = true;
                tr.wall.visible = true;
                tr.timer = 0;
                playSound('lever');
                playSound('slide');
                if (typeof showMessage === 'function') {
                    showMessage('⚠️ 前方方块高墙急速推挤而来！', window.innerWidth / 2, window.innerHeight * 0.3);
                }
            }
        } else if (tr.state === 'triggered') {
            // 加快推挤速度：大幅提升至 6.8，极速推挤迅猛逼近
            const moveStep = 6.8 * (dt / 16.67);
            tr.wall.x -= moveStep;

            // 第 2 坑覆盖地面迅速下坠开裂打开
            tr.pitCover.currentY += 8.0 * (dt / 16.67);
            if (tr.pitCover.currentY > groundY + 20) {
                tr.pitCover.solid = false;
            }

            // ⭐ 核心逻辑：在马上要推到边缘的时候 (右墙到达 540 以内，即将把玩家逼到边缘 460)，左边迅速升起一道墙把玩家挡下去
            if (tr.wall.x <= 540 && tr.leftWall) {
                tr.leftWall.visible = true;
                tr.leftWall.solid = true;
                // 极速升起 (每帧 18px)
                tr.leftWall.currentY -= 18.0 * (dt / 16.67);
                if (tr.leftWall.currentY <= tr.leftWall.targetY) {
                    tr.leftWall.currentY = tr.leftWall.targetY;
                }
            }

            // 推挤到中间方块左侧边缘 (targetX = 486，玩家刚好被推至 x=460 悬空边缘)
            if (tr.wall.x <= tr.wall.targetX) {
                tr.wall.x = tr.wall.targetX;
                tr.state = 'holding';
                tr.timer = 0;
            }

            handleWallPlayerCollision(tr.wall, -moveStep);
            if (tr.leftWall) handleLeftWallPlayerCollision(tr.leftWall);

        } else if (tr.state === 'holding') {
            tr.timer += dt;
            tr.pitCover.solid = false;

            // 保持左墙升起到位
            if (tr.leftWall && tr.leftWall.currentY > tr.leftWall.targetY) {
                tr.leftWall.currentY -= 18.0 * (dt / 16.67);
                if (tr.leftWall.currentY <= tr.leftWall.targetY) tr.leftWall.currentY = tr.leftWall.targetY;
            }

            handleWallPlayerCollision(tr.wall, 0);
            if (tr.leftWall) handleLeftWallPlayerCollision(tr.leftWall);

            // 挡下玩家后持续约 0.8 秒，然后双墙消失，等待 5 秒后再出现
            if (tr.timer >= 800) {
                tr.state = 'waiting5s';
                tr.timer = 0;
                // 墙消失！
                tr.wall.visible = false;
                tr.wall.solid = false;
                tr.wall.active = false;
                if (tr.leftWall) {
                    tr.leftWall.visible = false;
                    tr.leftWall.solid = false;
                    tr.leftWall.currentY = groundY;
                }
                // 坑道回填恢复，为玩家创造 5 秒绝佳穿越通道！
                tr.pitCover.currentY = groundY;
                tr.pitCover.solid = true;
                playSound('slide');
            }

        } else if (tr.state === 'waiting5s') {
            // ⭐ 核心逻辑：等待 5 秒 (5000ms) 后再出现
            tr.timer += dt;
            tr.pitCover.currentY = groundY;
            tr.pitCover.solid = true;

            // 5 秒后重置为 idle，可再次触发出现
            if (tr.timer >= 5000) {
                tr.state = 'idle';
                tr.timer = 0;
                tr.wall.x = tr.wall.initialX;
                if (tr.leftWall) tr.leftWall.currentY = groundY;
            }
        }
    }

    function handleWallPlayerCollision(wall, moveX) {
        const p = m7.player;
        if (!wall.solid || p.isDead) return;

        const wallBox = { x: wall.x, y: wall.y, w: wall.w, h: wall.h };
        if (isColliding(p, wallBox)) {
            // 站在墙顶部
            if (p.vy >= 0 && (p.y + p.h - wall.y) <= 14) {
                p.y = wall.y - p.h;
                p.vy = 0;
                p.isGrounded = true;
                p.x += moveX;
            } else {
                // 水平推挤：将玩家持续向左推移
                p.x = wall.x - p.w;
                if (p.vx > 0) p.vx = 0;
            }
        }
    }

    function handleLeftWallPlayerCollision(leftWall) {
        const p = m7.player;
        if (!leftWall.solid || p.isDead || leftWall.currentY >= 480) return;
        const lwBox = { x: leftWall.x, y: leftWall.currentY, w: leftWall.w, h: leftWall.h };
        if (isColliding(p, lwBox)) {
            // ⭐ 核心机制：左边迅速升起一道墙，把玩家挡下去（击退并推落入深渊坑中）
            p.x = Math.min(p.x, leftWall.x - p.w);
            if (p.vx > -3.5) p.vx = -3.5;
            p.isGrounded = false;
        }
    }

    function updateFenceTrap(dt) {
        const ft = m7.fenceTrap;
        if (!ft) return;
        const p = m7.player;

        ft.timer += dt;

        // 阶段状态机运转
        if (ft.state === 'phase1_pause') {
            // 2号和4号插在地上，1号和3号升起；停止 2 秒
            ft.fences[0].currentY = ft.minY;
            ft.fences[1].currentY = ft.maxY;
            ft.fences[2].currentY = ft.minY;
            ft.fences[3].currentY = ft.maxY;

            if (ft.timer >= ft.pauseDuration) {
                ft.state = 'phase1_move';
                ft.timer = 0;
                playSound('slide');
            }
        } else if (ft.state === 'phase1_move') {
            // 2号和4号缓缓升起，同时1号和3号缓缓下落 (耗时 1.8秒)
            const progress = Math.min(1, ft.timer / ft.moveDuration);
            const eased = 0.5 - 0.5 * Math.cos(progress * Math.PI); // 平滑余弦插值

            // 2 & 4 升起 (maxY -> minY)
            ft.fences[1].currentY = ft.maxY - (ft.maxY - ft.minY) * eased;
            ft.fences[3].currentY = ft.maxY - (ft.maxY - ft.minY) * eased;
            // 1 & 3 下落 (minY -> maxY)
            ft.fences[0].currentY = ft.minY + (ft.maxY - ft.minY) * eased;
            ft.fences[2].currentY = ft.minY + (ft.maxY - ft.minY) * eased;

            if (progress >= 1) {
                ft.state = 'phase2_pause';
                ft.timer = 0;
                playSound('slam'); // 1号与3号落地砸向地面
            }
        } else if (ft.state === 'phase2_pause') {
            // 1号和3号插在地上，2号和4号升起；停止 2 秒（玩家在2/4号下方避险）
            ft.fences[0].currentY = ft.maxY;
            ft.fences[1].currentY = ft.minY;
            ft.fences[2].currentY = ft.maxY;
            ft.fences[3].currentY = ft.minY;

            if (ft.timer >= ft.pauseDuration) {
                ft.state = 'phase2_move';
                ft.timer = 0;
                playSound('slide');
            }
        } else if (ft.state === 'phase2_move') {
            // 1号和3号缓缓升起，同时2号和4号缓缓下落 (耗时 1.8秒)
            const progress = Math.min(1, ft.timer / ft.moveDuration);
            const eased = 0.5 - 0.5 * Math.cos(progress * Math.PI);

            // 1 & 3 升起 (maxY -> minY)
            ft.fences[0].currentY = ft.maxY - (ft.maxY - ft.minY) * eased;
            ft.fences[2].currentY = ft.maxY - (ft.maxY - ft.minY) * eased;
            // 2 & 4 下落 (minY -> maxY)
            ft.fences[1].currentY = ft.minY + (ft.maxY - ft.minY) * eased;
            ft.fences[3].currentY = ft.minY + (ft.maxY - ft.minY) * eased;

            if (progress >= 1) {
                ft.state = 'phase1_pause';
                ft.timer = 0;
                playSound('slam'); // 2号与4号落地砸向地面
            }
        }

        // 碰撞检测：玩家碰到任何栅栏，立即传送回出生点！
        if (!p.isDead && !p.isTeleporting) {
            for (const f of ft.fences) {
                // 给予适度容错判定内缩
                const fenceBox = {
                    x: f.x + 3,
                    y: f.currentY,
                    w: f.w - 6,
                    h: f.h
                };
                if (isColliding(p, fenceBox)) {
                    teleportPlayerToSpawn();
                    break;
                }
            }
        }
    }

    function teleportPlayerToSpawn() {
        const p = m7.player;
        if (p.isDead || p.isTeleporting) return;
        p.isTeleporting = true;

        playSound('teleport');

        // 在被传送的原位置产生末影传送粒子
        for (let i = 0; i < 24; i++) {
            m7.particles.push({
                x: p.x + p.w / 2,
                y: p.y + p.h / 2,
                vx: (Math.random() - 0.5) * 6,
                vy: (Math.random() - 0.5) * 6,
                life: 1,
                color: Math.random() < 0.5 ? '#A855F7' : '#E879F9',
                size: 4
            });
        }

        // 传送回出生点 (x=80, y=300)
        p.x = 80;
        p.y = 300;
        p.vx = 0;
        p.vy = 0;
        p.isGrounded = false;

        // 在出生点产生出现粒子
        for (let i = 0; i < 24; i++) {
            m7.particles.push({
                x: p.x + p.w / 2,
                y: p.y + p.h / 2,
                vx: (Math.random() - 0.5) * 6,
                vy: (Math.random() - 0.5) * 6,
                life: 1,
                color: Math.random() < 0.5 ? '#9C27B0' : '#BA68C8',
                size: 4
            });
        }

        if (typeof showMessage === 'function') {
            showMessage('🌀 触碰机关栅栏！已传送回出生点！', window.innerWidth / 2, window.innerHeight * 0.35);
        }

        setTimeout(() => {
            p.isTeleporting = false;
        }, 350);
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
        if (m7.fenceTrap) {
            updateFenceTrap(dt);
        }

        // ===== 药水效果时效衰减 =====
        const isDev = (typeof isDevMode !== 'undefined' && isDevMode);
        if (m7.potionEffects) {
            if (m7.potionEffects.speed.timer > 0) {
                m7.potionEffects.speed.timer -= dt;
                if (m7.potionEffects.speed.timer <= 0) {
                    m7.potionEffects.speed.timer = 0;
                    m7.potionEffects.speed.active = false;
                }
            }
            if (m7.potionEffects.jump.timer > 0) {
                m7.potionEffects.jump.timer -= dt;
                if (m7.potionEffects.jump.timer <= 0) {
                    m7.potionEffects.jump.timer = 0;
                    m7.potionEffects.jump.active = false;
                }
            }
            if (m7.potionEffects.levitation.timer > 0) {
                m7.potionEffects.levitation.timer -= dt;
                if (m7.potionEffects.levitation.timer <= 0) {
                    m7.potionEffects.levitation.timer = 0;
                    m7.potionEffects.levitation.active = false;
                }
            }
        }

        const hasLevitation = (m7.potionEffects && m7.potionEffects.levitation.timer > 0);
        const hasSpeedPotion = (m7.potionEffects && m7.potionEffects.speed.timer > 0) || isDev;
        const hasJumpBoost = (m7.potionEffects && m7.potionEffects.jump.timer > 0) || isDev;

        // 动态更新控制按键提示（悬浮药水激活时：跳跃/下蹲变更为往上/往下按键）
        updateM7ControlButtons(hasLevitation);

        // 1. 趴下状态控制（下键触发；悬浮药水激活时，下键为【向下移动】，禁用趴下爬行姿势）
        const wantCrouch = m7.keys.down && !hasLevitation;
        if (hasLevitation && p.isCrouching) {
            p.isCrouching = false;
            p.y -= (p.standH - p.crouchH);
            p.h = p.standH;
        }

        // 如果想站起来，必须在地面上且头顶无方块阻挡
        if (!wantCrouch && p.isCrouching) {
            let canStand = true;
            // ⭐ 核心修复：在空中时绝对不要自动直立！保持趴下爬行姿势，避免撞到暗道低矮梁柱
            if (!p.isGrounded) {
                canStand = false;
            } else {
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

        // 2. 水平速度计算（关闭旧加速键：只有在村民处购买并饮用【加速药水】或开发者模式下，才激活冲刺加速！）
        let currentSpeed = MOVE_SPEED;
        if (p.isCrouching) {
            // 爬行基础速度 2.2，加速药水生效时达到 5.1（极速冲刺爬行）
            currentSpeed = hasSpeedPotion ? (CRAWL_SPEED * 2.32) : CRAWL_SPEED;
        } else {
            // 站立基础速度 4.2，加速药水生效时达到 7.2（疾跑冲刺）
            currentSpeed = hasSpeedPotion ? (MOVE_SPEED * 1.7) : MOVE_SPEED;
        }
        let targetVx = 0;
        if (m7.keys.left) {
            targetVx -= currentSpeed;
            p.facing = -1;
        }
        if (m7.keys.right) {
            targetVx += currentSpeed;
            p.facing = 1;
        }

        const lerpFactor = hasSpeedPotion ? 0.45 : 0.35;
        p.vx += (targetVx - p.vx) * lerpFactor;
        if (Math.abs(p.vx) > 0.1) {
            p.walkAnim += dt * (p.isCrouching ? 0.012 : 0.016);
        }

        // 冲刺加速金色粒子轨迹特效 (仅在加速药水激活时生成)
        if (hasSpeedPotion && Math.abs(p.vx) > 1.2 && Math.random() < 0.45) {
            m7.particles.push({
                x: p.facing === 1 ? p.x : p.x + p.w,
                y: p.y + p.h - 4 + (Math.random() - 0.5) * 6,
                vx: -p.facing * (1.5 + Math.random() * 2),
                vy: -0.3 - Math.random() * 0.8,
                life: 0.35,
                color: '#FFB300',
                size: 3 + Math.random() * 3
            });
        }

        // 3. 垂直移动与重力/悬浮飞行逻辑
        if (hasLevitation) {
            // ⭐ 悬浮药水精准操作：
            // 1. 往上：会直接漂浮到上面（按上键直接在空中稳健升空）
            // 2. 往下：是从漂浮点向下，不穿透方块（按下键向下平稳降落，垂直碰撞检测确保完美踏在地面/方块上）
            // 3. 不按键：精准稳定滞空悬停在当前高度！左右键保持水平飞行漫步！
            if (m7.keys.up) {
                p.vy = -4.6;
            } else if (m7.keys.down) {
                p.vy = 4.6;
            } else {
                p.vy = 0; // 悬浮滞空！
            }
            p.isGrounded = true; // 悬浮状态下可自由在空中漫步跨越一切深渊障碍

            // 悬浮青白色潜影旋转气泡粒子
            if (Math.random() < 0.4) {
                const angle = performance.now() * 0.008;
                m7.particles.push({
                    x: p.x + p.w / 2 + Math.cos(angle) * 14,
                    y: p.y + p.h - 6 + Math.sin(angle) * 4,
                    vx: (Math.random() - 0.5) * 0.6,
                    vy: (m7.keys.up ? -1.8 : (m7.keys.down ? 1.5 : -0.5)),
                    life: 0.8,
                    color: Math.random() < 0.5 ? '#E0F7FA' : '#00E5FF',
                    size: 3 + Math.random() * 2
                });
            }
        } else {
            // 普通重力与跳跃逻辑
            if (m7.keys.up && p.isGrounded && !p.isCrouching) {
                p.vy = hasJumpBoost ? (JUMP_FORCE * 1.48) : JUMP_FORCE;
                p.isGrounded = false;
                playSound('jump');
                // 跳跃粒子
                const pColor = hasJumpBoost ? '#00E676' : '#81C784';
                for (let i = 0; i < (hasJumpBoost ? 10 : 5); i++) {
                    m7.particles.push({
                        x: p.x + p.w / 2 + (Math.random() - 0.5) * 16,
                        y: p.y + p.h,
                        vx: (Math.random() - 0.5) * (hasJumpBoost ? 3.5 : 2),
                        vy: -Math.random() * (hasJumpBoost ? 4 : 2),
                        life: 1,
                        color: pColor,
                        size: 3 + Math.random() * (hasJumpBoost ? 4 : 3)
                    });
                }
            }
            p.vy += GRAVITY;
            if (p.vy > 14) p.vy = 14;
        }

        // 5. 水平移动与 AABB 碰撞
        p.x += p.vx;
        handleHorizontalCollisions();

        // 6. 垂直移动与 AABB 碰撞
        p.y += p.vy;
        p.isGrounded = false;
        handleVerticalCollisions();

        // 简单模式在空气中潜行漫步时生成微弱空气微尘反馈
        const isAirWalkActive = (m7.difficulty === 'easy' && (m7.level === 11 || m7.level === 10));
        if (isAirWalkActive && (p.isCrouching || m7.keys.down) && p.isGrounded && p.x > 240 && p.x < (m7.mapWidth - 280)) {
            if (Math.random() < 0.25) {
                m7.particles.push({
                    x: p.x + p.w / 2 + (Math.random() - 0.5) * 12,
                    y: 480,
                    vx: (Math.random() - 0.5) * 0.4,
                    vy: -0.2 - Math.random() * 0.3,
                    life: 0.5,
                    color: 'rgba(255, 255, 255, 0.45)',
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
            if (e.disabled) continue;
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
        const STEP_UP_MAX = 24; // 冲刺跨越暗坑/凹槽时允许平滑踏上平台的微小高差容差 (Step-Up)

        // 与所有固体方块检测
        for (const b of m7.blocks) {
            if (!b.solid) continue;
            if (isColliding(p, b)) {
                // 检查是否属于允许平滑踏上平台的微小高差 (如冲刺跨过暗坑时轻微下落)
                const footOverlap = (p.y + p.h) - b.y;
                if (footOverlap > 0 && footOverlap <= STEP_UP_MAX && p.vy >= 0) {
                    const testBox = { x: p.x, y: b.y - p.h, w: p.w, h: p.h };
                    let headBlocked = false;
                    for (const ob of m7.blocks) {
                        if (ob !== b && ob.solid && isColliding(testBox, ob)) {
                            headBlocked = true;
                            break;
                        }
                    }
                    if (!headBlocked) {
                        p.y = b.y - p.h;
                        p.vy = 0;
                        p.isGrounded = true;
                        continue;
                    }
                }

                if (p.vx > 0) {
                    p.x = b.x - p.w;
                    p.vx = 0;
                } else if (p.vx < 0) {
                    p.x = b.x + b.w;
                    p.vx = 0;
                }
            }
        }
        // 与所有移动巡逻推挤方块横向碰撞检测
        for (const mb of m7.movingBlocks) {
            if (!mb.solid) continue;
            if (isColliding(p, mb)) {
                if (p.vy >= 0 && (p.y + p.h - mb.y) <= 8) continue;
                const pCenterX = p.x + p.w / 2;
                const bCenterX = mb.x + mb.w / 2;
                if (pCenterX < bCenterX) {
                    p.x = mb.x - p.w;
                    if (p.vx > 0) p.vx = 0;
                } else {
                    p.x = mb.x + mb.w;
                    if (p.vx < 0) p.vx = 0;
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
        // 与第10关左升降拦截高墙检测
        if (m7.level10Trap && m7.level10Trap.leftWall && m7.level10Trap.leftWall.solid && m7.level10Trap.leftWall.currentY < 480) {
            const lw = m7.level10Trap.leftWall;
            const lwBox = { x: lw.x, y: lw.currentY, w: lw.w, h: lw.h };
            if (isColliding(p, lwBox)) {
                if (p.vx > 0) {
                    p.x = lw.x - p.w;
                    p.vx = 0;
                } else if (p.vx < 0) {
                    p.x = lw.x + lw.w;
                    p.vx = 0;
                }
            }
        }
        // 与第10关推挤方块高墙检测
        if (m7.level10Trap && m7.level10Trap.wall && m7.level10Trap.wall.solid) {
            const wl = m7.level10Trap.wall;
            const wlBox = { x: wl.x, y: wl.y, w: wl.w, h: wl.h };
            if (isColliding(p, wlBox)) {
                if (p.vx > 0) {
                    p.x = wl.x - p.w;
                    p.vx = 0;
                } else if (p.vx < 0) {
                    p.x = wl.x + wl.w;
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
        // 与所有移动巡逻推挤方块垂直检测 (支持站在上方借力乘骑，以及顶头)
        for (const mb of m7.movingBlocks) {
            if (!mb.solid) continue;
            if (isColliding(p, mb)) {
                if (p.vy > 0 && (p.y + p.h - mb.y) <= 16) {
                    p.y = mb.y - p.h;
                    p.vy = 0;
                    p.isGrounded = true;
                } else if (p.vy < 0) {
                    p.y = mb.y + mb.h;
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

        // 【简单模式第 10、11 关专属特性】：空中漫步（只有按住潜行/趴下才能走在空气上，其他关没有）
        // 规则：当玩家潜行/趴下时，往右会直接走在空气上面。松开潜行会掉下去。不做告示牌提醒。
        const isAirWalkLevel = (m7.difficulty === 'easy' && (m7.level === 11 || m7.level === 10));
        if (isAirWalkLevel && (p.isCrouching || m7.keys.down)) {
            const airGroundY = 480; // 与起点和终点地面高度一致
            // 玩家处于深渊空中悬浮范围 (从左平台边缘 200 开始，到终点平台前)
            if (p.x + p.w > 200 && p.x < m7.mapWidth) {
                const feetY = p.y + p.h;
                // 当玩家脚底位于空气地面高度附近，且不是在向上跃起
                if (feetY >= airGroundY - 8 && (feetY <= airGroundY + 36 || (feetY - p.vy <= airGroundY + 8)) && p.vy >= 0) {
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

            // 切断对应电流机关
            if (lev.targetElectricId) {
                let foundElec = false;
                for (const e of m7.electrics) {
                    if (e.id === lev.targetElectricId) {
                        e.disabled = true;
                        foundElec = true;
                    }
                }
                if (foundElec) {
                    playSound('electric_off');
                    for (let i = 0; i < 25; i++) {
                        m7.particles.push({
                            x: lev.x + (Math.random() - 0.5) * 80,
                            y: lev.y - Math.random() * 40,
                            vx: (Math.random() - 0.5) * 6,
                            vy: -Math.random() * 4,
                            life: 1.2,
                            color: Math.random() < 0.5 ? '#00E5FF' : '#FFEA00',
                            size: 3
                        });
                    }
                    if (typeof showMessage === 'function') {
                        showMessage('⚡ 电闸已拉下！上方致命电流已切断消失！', window.innerWidth / 2, window.innerHeight * 0.35);
                    }
                }
            }
        }
    }

    // 关卡胜利
    function handleLevelVictory() {
        playSound('win');
        if (window.GameEconomy) {
            GameEconomy.addTrophies(1);
        }
        const isNormal = (m7.difficulty === 'normal');
        const diffText = isNormal ? '普通模式' : '简单模式';
        if (typeof showMessage === 'function') {
            showMessage(`✨ 第 ${m7.level} 关通过 (${diffText})！🏆 获得奖杯 +1`, window.innerWidth / 2, window.innerHeight / 2);
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
                if (!isNormal) {
                    // ⭐ 简单模式全部 25 关通关！普通模式永久解锁开启！
                    try {
                        localStorage.setItem('mode7_easy_completed', 'true');
                    } catch (e) {}
                    if (typeof gameState !== 'undefined') {
                        gameState.mode7EasyCompleted = true;
                    }
                    if (typeof showMessage === 'function') {
                        showMessage('🎉 恭喜通关简单模式全部 25 关！【普通模式】已永久解锁！', window.innerWidth / 2, window.innerHeight / 2);
                    }
                }
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

            // 3. 左侧极速升起拦截高墙（迅速升起把玩家挡下去）
            if (tr.leftWall && (tr.leftWall.visible || tr.leftWall.solid) && tr.leftWall.currentY < groundY) {
                ctx.save();
                const lx = tr.leftWall.x;
                const ly = tr.leftWall.currentY;
                const lw = tr.leftWall.w;
                const lh = groundY - ly;

                // 深蓝黑曜石墙体
                ctx.fillStyle = '#1A237E';
                ctx.fillRect(lx, ly, lw, lh);

                // 顶端合金包边
                ctx.fillStyle = '#7986CB';
                ctx.fillRect(lx, ly, lw, 6);

                // 侧边警示光带
                ctx.fillStyle = '#FF1744';
                ctx.fillRect(lx + 4, ly + 10, lw - 8, 4);
                ctx.fillRect(lx + 4, ly + 22, lw - 8, 4);

                // 上升警示箭头
                ctx.fillStyle = '#FFEB3B';
                ctx.font = 'bold 12px sans-serif';
                ctx.textAlign = 'center';
                ctx.fillText('▲', lx + lw / 2, ly + 40);

                ctx.restore();
            }

            // 4. 机关休眠 5 秒倒计时浮标
            if (tr.state === 'waiting5s') {
                ctx.save();
                const remainSec = Math.max(0, (5000 - tr.timer) / 1000).toFixed(1);
                const bannerX = 590;
                const bannerY = groundY - 110;

                ctx.fillStyle = 'rgba(0, 0, 0, 0.75)';
                if (typeof ctx.roundRect === 'function') {
                    ctx.beginPath();
                    ctx.roundRect(bannerX - 85, bannerY - 18, 170, 28, 6);
                    ctx.fill();
                    ctx.strokeStyle = '#00E676';
                    ctx.lineWidth = 2;
                    ctx.stroke();
                } else {
                    ctx.fillRect(bannerX - 85, bannerY - 18, 170, 28);
                    ctx.strokeStyle = '#00E676';
                    ctx.lineWidth = 2;
                    ctx.strokeRect(bannerX - 85, bannerY - 18, 170, 28);
                }

                ctx.fillStyle = '#00E676';
                ctx.font = 'bold 13px sans-serif';
                ctx.textAlign = 'center';
                ctx.fillText(`⏱️ 机关休眠中: ${remainSec}s`, bannerX, bannerY);
                ctx.restore();
            }
        }

        // A5. 渲染第 25 关大柱子与升降四栅栏机关
        if (m7.fenceTrap) {
            renderFenceTrap(ctx, dt);
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
            if (e.disabled) {
                // 电流已切断：渲染熄灭的电闸底座与绿色安全指示灯
                ctx.save();
                ctx.fillStyle = '#1c252a';
                ctx.fillRect(e.x, e.y, e.w, e.h);
                ctx.strokeStyle = '#37474f';
                ctx.lineWidth = 1;
                ctx.strokeRect(e.x, e.y, e.w, e.h);
                // 绿色安全灯
                ctx.fillStyle = '#00E676';
                for (let lx = e.x + 18; lx < e.x + e.w; lx += 36) {
                    ctx.beginPath();
                    ctx.arc(lx, e.y + e.h / 2, 3, 0, Math.PI * 2);
                    ctx.fill();
                }
                ctx.fillStyle = 'rgba(76, 175, 80, 0.9)';
                ctx.font = 'bold 11px sans-serif';
                ctx.textAlign = 'center';
                ctx.fillText('⚡ 电流已切断 [安全通行]', e.x + e.w / 2, e.y + e.h / 2 + 4);
                ctx.restore();
                return;
            }

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

        // H1. 渲染关卡村民 NPC (供交易兑换药水)
        if (m7.villager) {
            renderVillagerNPC(ctx, m7.villager, dt);
        }

        // H2. 渲染玩家角色（方块人，支持站立、跑动、趴下爬行、触电）
        renderPlayer(ctx, dt);

        // H3. 如果瞬移药水已激活，在世界中绘制瞬移落点准星瞄准指示
        if (m7.potionEffects && m7.potionEffects.teleport.armed && m7.mouseCanvasPos) {
            renderTeleportTarget(ctx, m7.mouseCanvasPos.x + m7.camera.x, m7.mouseCanvasPos.y + m7.camera.y);
        }

        ctx.restore();

        // 6. 顶部模式专有 HUD
        renderMode7HUD(ctx, width, height);
    }

    function renderFenceTrap(ctx, dt) {
        const ft = m7.fenceTrap;
        if (!ft) return;
        const groundY = ft.groundY;

        ctx.save();

        // 1. 渲染大石柱门框 (Pillar Frame)
        // 门头横梁 (Ceiling Lintel)
        ctx.fillStyle = '#37474F';
        ctx.fillRect(ft.x - 30, ft.minY - 40, ft.w + 60, 50);
        ctx.fillStyle = '#546E7A';
        ctx.fillRect(ft.x - 30, ft.minY - 40, ft.w + 60, 8); // 顶沿高光

        // 黄黑警示斑马斜纹装饰带
        ctx.save();
        ctx.beginPath();
        ctx.rect(ft.x - 20, ft.minY + 2, ft.w + 40, 8);
        ctx.clip();
        for (let sx = ft.x - 50; sx < ft.x + ft.w + 50; sx += 20) {
            ctx.fillStyle = '#FFD600';
            ctx.fillRect(sx, ft.minY + 2, 10, 8);
            ctx.fillStyle = '#212121';
            ctx.fillRect(sx + 10, ft.minY + 2, 10, 8);
        }
        ctx.restore();

        // 机关门楣铭牌
        ctx.fillStyle = '#ECEFF1';
        ctx.font = 'bold 13px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('⚡ 连动升降栅栏机关 ⚡', ft.x + ft.w / 2, ft.minY - 14);

        // 左右巨型立柱 (Left & Right Pillars)
        // 左立柱
        ctx.fillStyle = '#263238';
        ctx.fillRect(ft.x - 30, ft.minY - 40, 40, groundY - (ft.minY - 40));
        ctx.fillStyle = '#455A64';
        ctx.fillRect(ft.x - 30, ft.minY - 40, 8, groundY - (ft.minY - 40));
        // 右立柱
        ctx.fillStyle = '#263238';
        ctx.fillRect(ft.x + ft.w - 10, ft.minY - 40, 40, groundY - (ft.minY - 40));
        ctx.fillStyle = '#455A64';
        ctx.fillRect(ft.x + ft.w + 22, ft.minY - 40, 8, groundY - (ft.minY - 40));

        // 2. 渲染 4 个升降栅栏
        ft.fences.forEach(f => {
            const fx = f.x;
            const fy = f.currentY;
            const fw = f.w;
            const fh = f.h;

            // 栅栏顶端滑轨滑块
            ctx.fillStyle = '#78909C';
            ctx.fillRect(fx - 4, fy - 6, fw + 8, 8);

            // 栅栏主体金属深灰色底色
            ctx.fillStyle = '#212121';
            ctx.fillRect(fx, fy, fw, fh);

            // 垂直金属格栅条
            ctx.fillStyle = '#424242';
            const barW = 6;
            ctx.fillRect(fx + 4, fy, barW, fh);
            ctx.fillRect(fx + fw / 2 - 3, fy, barW, fh);
            ctx.fillRect(fx + fw - 10, fy, barW, fh);

            // 水平横撑与加固铆钉
            for (let hy = fy + 20; hy < fy + fh; hy += 45) {
                ctx.fillStyle = '#616161';
                ctx.fillRect(fx, hy, fw, 6);
                ctx.fillStyle = '#B0BEC5';
                ctx.fillRect(fx + 6, hy + 1, 4, 4);
                ctx.fillRect(fx + fw - 10, hy + 1, 4, 4);
            }

            // 底部尖锐地刺/锁桩
            ctx.fillStyle = '#CFD8DC';
            ctx.beginPath();
            ctx.moveTo(fx + 2, fy + fh);
            ctx.lineTo(fx + fw / 4, fy + fh + 8);
            ctx.lineTo(fx + fw / 2, fy + fh);
            ctx.lineTo(fx + (fw * 3) / 4, fy + fh + 8);
            ctx.lineTo(fx + fw - 2, fy + fh);
            ctx.fill();

            // 栅栏中央醒目编号牌（① ② ③ ④）
            const badgeY = fy + 40;
            ctx.beginPath();
            ctx.arc(fx + fw / 2, badgeY, 14, 0, Math.PI * 2);
            ctx.fillStyle = (f.id === 2 || f.id === 4) ? '#E65100' : '#1565C0';
            ctx.fill();
            ctx.strokeStyle = '#FFFFFF';
            ctx.lineWidth = 2;
            ctx.stroke();

            ctx.fillStyle = '#FFFFFF';
            ctx.font = 'bold 15px sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(f.num, fx + fw / 2, badgeY);

            // 状态文字提示 (升起时提示安全避险区)
            const isFullyUp = (fy <= ft.minY + 15);
            const isFullyDown = (fy >= ft.maxY - 15);
            if (isFullyUp) {
                ctx.fillStyle = '#00E676';
                ctx.font = 'bold 11px sans-serif';
                ctx.fillText('避险区', fx + fw / 2, groundY - 62);
                ctx.fillText('▼', fx + fw / 2, groundY - 48);
            } else if (isFullyDown) {
                ctx.fillStyle = '#FF1744';
                ctx.font = 'bold 11px sans-serif';
                ctx.fillText('封死', fx + fw / 2, fy + fh - 20);
            }
        });

        // 3. 渲染机关当前状态实时指示浮标（顶部居中）
        let statusText = '';
        let statusColor = '#FFEA00';
        if (ft.state === 'phase1_pause') {
            const remain = Math.max(0, (ft.pauseDuration - ft.timer) / 1000).toFixed(1);
            statusText = `⏳ 2/4号插地锁定中 (${remain}s) - 准备升起`;
            statusColor = '#FF9100';
        } else if (ft.state === 'phase1_move') {
            statusText = '⚙️ 2/4号升起 ↑，1/3号下落 ↓！快到2/4号下躲避！';
            statusColor = '#00E676';
        } else if (ft.state === 'phase2_pause') {
            const remain = Math.max(0, (ft.pauseDuration - ft.timer) / 1000).toFixed(1);
            statusText = `🛡️ 2/4号升起避难中 (${remain}s) - 1/3号封锁地面`;
            statusColor = '#00E5FF';
        } else if (ft.state === 'phase2_move') {
            statusText = '⚙️ 1/3号升起 ↑，2/4号下落 ↓！向前冲！';
            statusColor = '#FFD600';
        }

        const bannerX = ft.x + ft.w / 2;
        const bannerY = ft.minY - 55;
        ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        if (typeof ctx.roundRect === 'function') {
            ctx.beginPath();
            ctx.roundRect(bannerX - 170, bannerY - 14, 340, 24, 6);
            ctx.fill();
            ctx.strokeStyle = statusColor;
            ctx.lineWidth = 1.5;
            ctx.stroke();
        } else {
            ctx.fillRect(bannerX - 170, bannerY - 14, 340, 24);
            ctx.strokeStyle = statusColor;
            ctx.lineWidth = 1.5;
            ctx.strokeRect(bannerX - 170, bannerY - 14, 340, 24);
        }
        ctx.fillStyle = statusColor;
        ctx.font = 'bold 12px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(statusText, bannerX, bannerY - 2);

        ctx.restore();
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
            // 【趴下/爬行姿势】(高度 22px, 宽度 26px，碰撞箱与图像精准对齐)
            // 身体扁平横置 (16x12)
            ctx.fillStyle = '#2196F3'; // 衣服
            ctx.fillRect(2, 6, 16, 12);

            // 头部 (11x11)
            ctx.fillStyle = '#FFCC80'; // 肤色
            ctx.fillRect(15, 2, 11, 11);

            // 眼睛
            ctx.fillStyle = '#1A237E';
            ctx.fillRect(22, 5, 3, 3);

            // 爬行四肢动画
            const limbAnim = Math.sin(p.walkAnim) * 3;
            ctx.fillStyle = '#1565C0'; // 裤子
            ctx.fillRect(0, 9, 6, 8 + limbAnim);
            ctx.fillStyle = '#455A64'; // 手臂
            ctx.fillRect(12, 10, 6, 7 - limbAnim);

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

    // ==========================================
    // 关卡常驻村民 NPC 渲染
    // ==========================================
    function renderVillagerNPC(ctx, v, dt) {
        ctx.save();
        const bobbing = Math.sin(performance.now() * 0.003) * 1.5;
        ctx.translate(v.x, v.y + bobbing);

        // 1. 村民腿部 / 袍底 (18x12, 深棕色)
        ctx.fillStyle = '#4E342E';
        ctx.fillRect(4, 40, 18, 12);

        // 2. 村民长袍身体 (20x24, 经典棕色)
        ctx.fillStyle = '#795548';
        ctx.fillRect(3, 18, 20, 24);

        // 3. 交叉双手 (经典抱胸姿势, 22x10, 深棕色袖子 + 肤色双手)
        ctx.fillStyle = '#5D4037';
        ctx.fillRect(2, 24, 22, 10);
        ctx.fillStyle = '#D7CCC8';
        ctx.fillRect(9, 27, 8, 6);

        // 4. 村民头部 (18x18, 肤色 #D7CCC8)
        ctx.fillStyle = '#D7CCC8';
        ctx.fillRect(4, 0, 18, 18);

        // 5. 经典一字眉 (#3E2723)
        ctx.fillStyle = '#3E2723';
        ctx.fillRect(4, 5, 18, 3);

        // 6. 绿色眼睛 (#2E7D32)
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(6, 8, 4, 4);
        ctx.fillRect(16, 8, 4, 4);
        ctx.fillStyle = '#2E7D32';
        ctx.fillRect(8, 8, 2, 4);
        ctx.fillRect(16, 8, 2, 4);

        // 7. 村民标志性大鼻子 (#BCAAA4)
        ctx.fillStyle = '#BCAAA4';
        ctx.fillRect(11, 10, 4, 9);
        ctx.strokeStyle = '#8D6E63';
        ctx.lineWidth = 1;
        ctx.strokeRect(11, 10, 4, 9);

        ctx.restore();

        // 8. 漂浮在头顶的绿宝石与商铺标签
        ctx.save();
        const pulse = Math.sin(performance.now() * 0.005) * 3;
        ctx.translate(v.x + v.w / 2, v.y - 12 + pulse);

        ctx.font = 'bold 16px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('💎', 0, -18);

        // 村民标签背景 (经典 Minecraft 方形像素边框)
        ctx.fillStyle = '#C6C6C6';
        ctx.fillRect(-45, -14, 90, 20);
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 2;
        ctx.strokeRect(-45, -14, 90, 20);

        ctx.fillStyle = '#111111';
        ctx.font = 'bold 11px sans-serif';
        ctx.fillText('🧑‍🌾 村民交易', 0, 0);

        // 玩家靠近时的气泡提示 (方方正正的对话框，全中文纯正提示)
        const distToPlayer = Math.abs(m7.player.x - v.x);
        if (distToPlayer < 95) {
            ctx.fillStyle = '#C6C6C6';
            ctx.fillRect(-70, -46, 140, 24);
            ctx.strokeStyle = '#000000';
            ctx.lineWidth = 2;
            ctx.strokeRect(-70, -46, 140, 24);

            // 下指方尖角
            ctx.fillStyle = '#000000';
            ctx.beginPath();
            ctx.moveTo(-5, -22);
            ctx.lineTo(5, -22);
            ctx.lineTo(0, -17);
            ctx.fill();

            ctx.fillStyle = '#212121';
            ctx.font = 'bold 11px sans-serif';
            ctx.fillText('点击或按E键交易药水', 0, -30);
        }
        ctx.restore();
    }

    // ==========================================
    // 瞬移瞄准指示准星
    // ==========================================
    function renderTeleportTarget(ctx, tx, ty) {
        ctx.save();
        const time = performance.now() * 0.006;
        const pulseR = 14 + Math.sin(time * 2) * 3;

        // 准星外圈光环
        ctx.strokeStyle = '#E1BEE7';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(tx, ty, pulseR, 0, Math.PI * 2);
        ctx.stroke();

        // 动态十字瞄准线
        ctx.strokeStyle = '#BA68C8';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(tx - pulseR - 6, ty);
        ctx.lineTo(tx - pulseR + 4, ty);
        ctx.moveTo(tx + pulseR - 4, ty);
        ctx.lineTo(tx + pulseR + 6, ty);
        ctx.moveTo(tx, ty - pulseR - 6);
        ctx.lineTo(tx, ty - pulseR + 4);
        ctx.moveTo(tx, ty + pulseR - 4);
        ctx.lineTo(tx, ty + pulseR + 6);
        ctx.stroke();

        // 中心聚焦点
        ctx.fillStyle = '#BA68C8';
        ctx.beginPath();
        ctx.arc(tx, ty, 3, 0, Math.PI * 2);
        ctx.fill();

        // 悬浮文字指示
        ctx.fillStyle = 'rgba(0, 0, 0, 0.75)';
        if (ctx.roundRect) ctx.roundRect(tx - 45, ty - pulseR - 26, 90, 20, 6);
        else ctx.fillRect(tx - 45, ty - pulseR - 26, 90, 20);
        ctx.fill();
        ctx.strokeStyle = '#BA68C8';
        ctx.lineWidth = 1;
        ctx.stroke();

        ctx.fillStyle = '#E1BEE7';
        ctx.font = 'bold 11px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('点击瞬移至此', tx, ty - pulseR - 12);

        ctx.restore();
    }

    // ==========================================
    // 顶部专有 HUD 渲染
    // ==========================================
    function renderMode7HUD(ctx, width, height) {
        ctx.save();
        const isNormal = (m7.difficulty === 'normal');

        // 1. 中间关卡徽章
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

        // 2. 左上角：奖杯与绿宝石资产栏
        const trophies = window.GameEconomy ? GameEconomy.getTrophies() : 0;
        const emeralds = window.GameEconomy ? GameEconomy.getEmeralds() : 0;
        const isDev = window.GameEconomy && GameEconomy.isDevMode();

        ctx.fillStyle = 'rgba(0, 0, 0, 0.72)';
        ctx.beginPath();
        if (ctx.roundRect) ctx.roundRect(16, 12, 140, 36, 18);
        else ctx.rect(16, 12, 140, 36);
        ctx.fill();
        ctx.strokeStyle = '#FFE082';
        ctx.lineWidth = 1.5;
        ctx.stroke();

        ctx.font = 'bold 13px sans-serif';
        ctx.textAlign = 'left';
        ctx.fillStyle = '#FFD54F';
        ctx.fillText(`🏆 ${trophies}`, 28, 35);
        ctx.fillStyle = '#69F0AE';
        ctx.fillText(`💎 ${isDev ? '∞' : emeralds}`, 88, 35);

        // 3. 右上角：【🧑‍🌾 村民交易】HUD 按钮
        const btnW = 120;
        const btnH = 36;
        const btnX = width - btnW - 16;
        const btnY = 12;
        m7.hudVillagerBtn = { x: btnX, y: btnY, w: btnW, h: btnH };

        ctx.fillStyle = 'rgba(46, 125, 50, 0.9)';
        ctx.beginPath();
        if (ctx.roundRect) ctx.roundRect(btnX, btnY, btnW, btnH, 18);
        else ctx.rect(btnX, btnY, btnW, btnH);
        ctx.fill();
        ctx.strokeStyle = '#81C784';
        ctx.lineWidth = 1.5;
        ctx.stroke();

        ctx.fillStyle = '#FFFFFF';
        ctx.font = 'bold 13px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('🧑‍🌾 村民交易', btnX + btnW / 2, btnY + 23);

        // 4. 激活药水效果倒计时指示条 (位于关卡指示牌下方)
        let activeEffects = [];
        if (m7.potionEffects) {
            if (m7.potionEffects.speed.timer > 0) {
                activeEffects.push({ icon: '⚡', name: '加速', time: m7.potionEffects.speed.timer, color: '#FFB300' });
            }
            if (m7.potionEffects.jump.timer > 0) {
                activeEffects.push({ icon: '🦘', name: '跳跃', time: m7.potionEffects.jump.timer, color: '#00E676' });
            }
            if (m7.potionEffects.levitation.timer > 0) {
                activeEffects.push({ icon: '🪶', name: '悬浮', time: m7.potionEffects.levitation.timer, color: '#00E5FF' });
            }
            if (m7.potionEffects.teleport.armed) {
                activeEffects.push({ icon: '🔮', name: '瞬移就绪', time: null, color: '#BA68C8' });
            }
        }

        if (activeEffects.length > 0) {
            const itemW = 96;
            let startX = width / 2 - (activeEffects.length * itemW) / 2;
            activeEffects.forEach(eff => {
                ctx.fillStyle = 'rgba(0, 0, 0, 0.78)';
                ctx.beginPath();
                if (ctx.roundRect) ctx.roundRect(startX, 54, itemW - 6, 24, 12);
                else ctx.rect(startX, 54, itemW - 6, 24);
                ctx.fill();
                ctx.strokeStyle = eff.color;
                ctx.lineWidth = 1.5;
                ctx.stroke();

                ctx.fillStyle = eff.color;
                ctx.font = 'bold 11px sans-serif';
                ctx.textAlign = 'center';
                const str = eff.time !== null ? `${eff.icon}${eff.name} ${eff.time.toFixed(1)}s` : `${eff.icon}${eff.name}`;
                ctx.fillText(str, startX + (itemW - 6) / 2, 70);
                startX += itemW;
            });
        }

        ctx.restore();
    }

    // ==========================================
    // 药水快捷按键与控制
    // ==========================================
    const lastPotionClicks = { speed: 0, jump: 0, levitation: 0, teleport: 0 };
    let potionTipTimeout = null;

    function showPotionTip(type, text) {
        let tip = document.getElementById('m7PotionTip');
        if (!tip) {
            tip = document.createElement('div');
            tip.id = 'm7PotionTip';
            tip.style.cssText = `
                position: fixed;
                background: rgba(0, 0, 0, 0.88);
                color: #FFEB3B;
                font-size: 13px;
                font-weight: bold;
                padding: 4px 10px;
                border-radius: 12px;
                border: 1px solid #FFD54F;
                pointer-events: none;
                z-index: 600;
                box-shadow: 0 4px 10px rgba(0,0,0,0.5);
                transition: opacity 0.2s ease;
            `;
            document.body.appendChild(tip);
        }
        const btn = document.getElementById('m7PotionBtn_' + type);
        if (btn) {
            const rect = btn.getBoundingClientRect();
            tip.textContent = text;
            tip.style.display = 'block';
            tip.style.opacity = '1';
            tip.style.left = (rect.left + rect.width / 2 - 40) + 'px';
            tip.style.top = (rect.top - 32) + 'px';
            clearTimeout(potionTipTimeout);
            potionTipTimeout = setTimeout(() => {
                if (tip) tip.style.opacity = '0';
            }, 1200);
        }
    }

    function handlePotionClick(type) {
        const now = Date.now();
        if (now - lastPotionClicks[type] < 450) {
            // 双击达成！消耗 1 瓶药水并激活对应效果
            lastPotionClicks[type] = 0;
            const tip = document.getElementById('m7PotionTip');
            if (tip) tip.style.opacity = '0';
            drinkPotion(type);
        } else {
            // 第一次单按：记录时间，弹出双击提示
            lastPotionClicks[type] = now;
            const pName = window.GameEconomy ? GameEconomy.POTION_TYPES[type].name : type;
            showPotionTip(type, `💡 双击饮用【${pName}】`);
        }
    }

    function drinkPotion(type) {
        if (!window.GameEconomy) return;
        const res = GameEconomy.consumePotion(type);
        if (!res.success) {
            GameEconomy.playAudio('villager_no');
            if (typeof showMessage === 'function') {
                showMessage(res.msg, window.innerWidth / 2, window.innerHeight * 0.4);
            }
            return;
        }

        GameEconomy.playPotionDrinkSound();
        const pName = GameEconomy.POTION_TYPES[type].name;

        if (type === 'speed') {
            m7.potionEffects.speed.timer = 10.0;
            m7.potionEffects.speed.active = true;
            if (typeof showMessage === 'function') {
                showMessage(`⚡【${pName}】已饮用！极速冲刺 10 秒`, window.innerWidth / 2, window.innerHeight * 0.35);
            }
        } else if (type === 'jump') {
            m7.potionEffects.jump.timer = 10.0;
            m7.potionEffects.jump.active = true;
            if (typeof showMessage === 'function') {
                showMessage(`🦘【${pName}】已饮用！跳跃高度翻倍 10 秒`, window.innerWidth / 2, window.innerHeight * 0.35);
            }
        } else if (type === 'levitation') {
            m7.potionEffects.levitation.timer = 10.0;
            m7.potionEffects.levitation.active = true;
            if (typeof showMessage === 'function') {
                showMessage(`🪶【${pName}】已饮用！空中悬浮漫步 10 秒`, window.innerWidth / 2, window.innerHeight * 0.35);
            }
        } else if (type === 'teleport') {
            m7.potionEffects.teleport.armed = true;
            if (typeof showMessage === 'function') {
                showMessage(`🔮【${pName}】已激活！点击或轻触画面任意位置直接瞬移`, window.innerWidth / 2, window.innerHeight * 0.35);
            }
        }

        updatePotionButtonsUI();
    }

    // ⭐ 悬浮药水激活时：跳跃/下蹲按键自动动态变更为往上/往下按键
    function updateM7ControlButtons(hasLevitation) {
        const btnUp = document.getElementById('m7BtnUp');
        const btnDown = document.getElementById('m7BtnDown');
        if (!btnUp || !btnDown) return;
        if (!btnUp.dataset) btnUp.dataset = {};
        if (!btnDown.dataset) btnDown.dataset = {};

        if (hasLevitation) {
            if (!btnUp.dataset.isLevitation) {
                btnUp.dataset.isLevitation = 'true';
                btnUp.innerHTML = '▲往上';
                btnUp.style.background = 'linear-gradient(135deg, #00ACC1 0%, #00838F 100%)';
                btnUp.style.borderColor = '#80DEEA';
                btnUp.style.boxShadow = '0 0 14px rgba(0, 229, 255, 0.7)';
            }
            if (!btnDown.dataset.isLevitation) {
                btnDown.dataset.isLevitation = 'true';
                btnDown.innerHTML = '▼往下';
                btnDown.style.background = 'linear-gradient(135deg, #0097A7 0%, #006064 100%)';
                btnDown.style.borderColor = '#80DEEA';
                btnDown.style.boxShadow = '0 0 14px rgba(0, 229, 255, 0.5)';
            }
        } else {
            if (btnUp.dataset.isLevitation) {
                delete btnUp.dataset.isLevitation;
                btnUp.innerHTML = '▲跳跃';
                btnUp.style.background = 'rgba(27, 94, 32, 0.85)';
                btnUp.style.borderColor = '#81C784';
                btnUp.style.boxShadow = '0 4px 12px rgba(0,0,0,0.4)';
            }
            if (btnDown.dataset.isLevitation) {
                delete btnDown.dataset.isLevitation;
                btnDown.innerHTML = '▼趴下';
                btnDown.style.background = 'rgba(56, 142, 60, 0.88)';
                btnDown.style.borderColor = '#C8E6C9';
                btnDown.style.boxShadow = '0 4px 10px rgba(0,0,0,0.35)';
            }
        }
    }

    function updatePotionButtonsUI() {
        if (!window.GameEconomy) return;
        const isDev = GameEconomy.isDevMode();
        const potions = GameEconomy.getPotions();

        ['speed', 'jump', 'levitation', 'teleport'].forEach(type => {
            const btn = document.getElementById('m7PotionBtn_' + type);
            const badge = document.getElementById('m7PotionBadge_' + type);
            if (!btn || !badge) return;

            const count = potions[type] || 0;
            // 只要买到药水 (count > 0) 或处于开发者模式，按键就会出现
            if (count > 0 || isDev) {
                btn.style.display = 'flex';
                if (isDev) {
                    badge.style.display = 'block';
                    badge.textContent = '∞';
                    badge.style.background = '#7B1FA2';
                } else if (count >= 2) {
                    // 如果拥有多瓶药水，按钮右下角会显示数量标识（两瓶显示 ×2，三瓶显示 ×3）
                    badge.style.display = 'block';
                    badge.textContent = '×' + count;
                    badge.style.background = '#D32F2F';
                } else {
                    badge.style.display = 'none';
                }
            } else {
                // 没有药水且不是开发者模式，按键隐藏
                btn.style.display = 'none';
            }
        });
    }

    function bindPotionButton(btn, type) {
        btn.addEventListener('pointerdown', (e) => {
            e.preventDefault();
            e.stopPropagation();
            getAudioContext();
            handlePotionClick(type);
            btn.style.transform = 'scale(0.9)';
            setTimeout(() => { btn.style.transform = 'scale(1)'; }, 120);
        });
    }

    // ==========================================
    // 画布触控与点击交互 (瞬移、村民点击、HUD点击)
    // ==========================================
    function initCanvasInteraction() {
        const canvas = document.getElementById('gameCanvas');
        if (!canvas || typeof canvas.addEventListener !== 'function') return;
        if (canvas.dataset) {
            if (canvas.dataset.m7InteractionBound) return;
            canvas.dataset.m7InteractionBound = 'true';
        } else if (canvas._m7InteractionBound) {
            return;
        } else {
            canvas._m7InteractionBound = true;
        }

        // 鼠标悬停跟踪
        canvas.addEventListener('pointermove', (e) => {
            if (typeof gameState === 'undefined' || gameState.mode !== 7 || !gameState.isPlaying) return;
            const rect = canvas.getBoundingClientRect ? canvas.getBoundingClientRect() : { left: 0, top: 0, width: canvas.width || 800, height: canvas.height || 600 };
            const scaleX = rect.width ? (canvas.width / rect.width) : 1;
            const scaleY = rect.height ? (canvas.height / rect.height) : 1;
            m7.mouseCanvasPos = {
                x: (e.clientX - rect.left) * scaleX,
                y: (e.clientY - rect.top) * scaleY
            };
            if (m7.potionEffects && m7.potionEffects.teleport.armed) {
                canvas.style.cursor = 'crosshair';
            } else {
                canvas.style.cursor = 'default';
            }
        });

        canvas.addEventListener('pointerleave', () => {
            m7.mouseCanvasPos = null;
        });

        canvas.addEventListener('pointerdown', (e) => {
            if (typeof gameState === 'undefined' || gameState.mode !== 7 || !gameState.isPlaying) return;
            getAudioContext();

            const rect = canvas.getBoundingClientRect ? canvas.getBoundingClientRect() : { left: 0, top: 0, width: canvas.width || 800, height: canvas.height || 600 };
            const scaleX = rect.width ? (canvas.width / rect.width) : 1;
            const scaleY = rect.height ? (canvas.height / rect.height) : 1;
            const cx = (e.clientX - rect.left) * scaleX;
            const cy = (e.clientY - rect.top) * scaleY;

            // 1. 检查是否点击了右上角【🧑‍🌾 村民交易】HUD 按钮
            if (m7.hudVillagerBtn) {
                const b = m7.hudVillagerBtn;
                if (cx >= b.x && cx <= b.x + b.w && cy >= b.y && cy <= b.y + b.h) {
                    if (typeof openVillagerModal === 'function') openVillagerModal();
                    return;
                }
            }

            const worldX = cx + m7.camera.x;
            const worldY = cy + m7.camera.y;

            // 2. 检查是否点击了关卡内的常驻村民 NPC
            if (m7.villager) {
                const v = m7.villager;
                if (worldX >= v.x - 15 && worldX <= v.x + v.w + 15 && worldY >= v.y - 20 && worldY <= v.y + v.h + 10) {
                    if (typeof openVillagerModal === 'function') openVillagerModal();
                    return;
                }
            }

            // 3. 检查是否激活了【瞬移药水】
            if (m7.potionEffects && m7.potionEffects.teleport.armed) {
                m7.potionEffects.teleport.armed = false;
                canvas.style.cursor = 'default';

                // 起点紫粒子爆裂
                for (let i = 0; i < 28; i++) {
                    m7.particles.push({
                        x: m7.player.x + m7.player.w / 2 + (Math.random() - 0.5) * 20,
                        y: m7.player.y + m7.player.h / 2 + (Math.random() - 0.5) * 30,
                        vx: (Math.random() - 0.5) * 6,
                        vy: (Math.random() - 0.5) * 6,
                        life: 0.65,
                        color: Math.random() < 0.5 ? '#CE93D8' : '#7B1FA2',
                        size: 3 + Math.random() * 4
                    });
                }

                // 传送角色至目标位置
                m7.player.x = Math.max(10, Math.min(worldX - m7.player.w / 2, m7.mapWidth - 30));
                m7.player.y = Math.min(worldY - m7.player.h / 2, m7.mapHeight - 40);
                m7.player.vx = 0;
                m7.player.vy = 0;

                // 终点紫粒子爆裂
                for (let i = 0; i < 35; i++) {
                    m7.particles.push({
                        x: m7.player.x + m7.player.w / 2 + (Math.random() - 0.5) * 24,
                        y: m7.player.y + m7.player.h / 2 + (Math.random() - 0.5) * 36,
                        vx: (Math.random() - 0.5) * 7,
                        vy: (Math.random() - 0.5) * 7,
                        life: 0.75,
                        color: Math.random() < 0.5 ? '#E1BEE7' : '#9C27B0',
                        size: 4 + Math.random() * 4
                    });
                }

                if (window.GameEconomy) {
                    GameEconomy.playTeleportSound();
                }

                if (typeof showMessage === 'function') {
                    showMessage('✨ 瞬移成功！', window.innerWidth / 2, window.innerHeight * 0.35);
                }

                updatePotionButtonsUI();
            }
        });
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
                <button id="m7BtnLeft" class="m7-btn" style="width: 58px; height: 58px; border-radius: 50%; background: rgba(46, 125, 50, 0.85); border: 2px solid #81C784; color: white; font-size: 22px; display: flex; align-items: center; justify-content: center; touch-action: manipulation; box-shadow: 0 4px 10px rgba(0,0,0,0.3);">◀</button>
                <button id="m7BtnRight" class="m7-btn" style="width: 58px; height: 58px; border-radius: 50%; background: rgba(46, 125, 50, 0.85); border: 2px solid #81C784; color: white; font-size: 22px; display: flex; align-items: center; justify-content: center; touch-action: manipulation; box-shadow: 0 4px 10px rgba(0,0,0,0.3);">▶</button>
            </div>

            <!-- 右侧动作键组 (药水栏 + 基础动作) -->
            <div style="display: flex; flex-direction: column; align-items: flex-end; gap: 10px; pointer-events: none;">
                <!-- 药水快捷栏 (买到药水或开发者模式时出现) -->
                <div id="m7PotionBar" style="display: flex; gap: 8px; pointer-events: auto; align-items: center;">
                    <button id="m7PotionBtn_speed" class="m7-btn m7-potion-btn" style="position: relative; width: 50px; height: 50px; border-radius: 12px; background: linear-gradient(135deg, #FF6F00, #E65100); border: 2px solid #FFE082; color: white; display: none; flex-direction: column; align-items: center; justify-content: center; font-size: 11px; font-weight: bold; touch-action: manipulation; box-shadow: 0 4px 10px rgba(255,111,0,0.4); cursor: pointer;" title="加速药水 (双击饮用)">
                        <span style="font-size: 18px; line-height: 1;">⚡</span>
                        <span>加速</span>
                        <span id="m7PotionBadge_speed" style="position: absolute; right: -4px; bottom: -4px; background: #D32F2F; color: white; font-size: 11px; font-weight: bold; border-radius: 10px; padding: 0 5px; border: 1.5px solid white; display: none; line-height: 16px;">×2</span>
                    </button>
                    <button id="m7PotionBtn_jump" class="m7-btn m7-potion-btn" style="position: relative; width: 50px; height: 50px; border-radius: 12px; background: linear-gradient(135deg, #2E7D32, #1B5E20); border: 2px solid #A5D6A7; color: white; display: none; flex-direction: column; align-items: center; justify-content: center; font-size: 11px; font-weight: bold; touch-action: manipulation; box-shadow: 0 4px 10px rgba(46,125,50,0.4); cursor: pointer;" title="跳跃提升药水 (双击饮用)">
                        <span style="font-size: 18px; line-height: 1;">🦘</span>
                        <span>跳跃</span>
                        <span id="m7PotionBadge_jump" style="position: absolute; right: -4px; bottom: -4px; background: #D32F2F; color: white; font-size: 11px; font-weight: bold; border-radius: 10px; padding: 0 5px; border: 1.5px solid white; display: none; line-height: 16px;">×2</span>
                    </button>
                    <button id="m7PotionBtn_levitation" class="m7-btn m7-potion-btn" style="position: relative; width: 50px; height: 50px; border-radius: 12px; background: linear-gradient(135deg, #00838F, #006064); border: 2px solid #80DEEA; color: white; display: none; flex-direction: column; align-items: center; justify-content: center; font-size: 11px; font-weight: bold; touch-action: manipulation; box-shadow: 0 4px 10px rgba(0,131,143,0.4); cursor: pointer;" title="悬浮药水 (双击饮用)">
                        <span style="font-size: 18px; line-height: 1;">🪶</span>
                        <span>悬浮</span>
                        <span id="m7PotionBadge_levitation" style="position: absolute; right: -4px; bottom: -4px; background: #D32F2F; color: white; font-size: 11px; font-weight: bold; border-radius: 10px; padding: 0 5px; border: 1.5px solid white; display: none; line-height: 16px;">×2</span>
                    </button>
                    <button id="m7PotionBtn_teleport" class="m7-btn m7-potion-btn" style="position: relative; width: 50px; height: 50px; border-radius: 12px; background: linear-gradient(135deg, #6A1B9A, #4A148C); border: 2px solid #E1BEE7; color: white; display: none; flex-direction: column; align-items: center; justify-content: center; font-size: 11px; font-weight: bold; touch-action: manipulation; box-shadow: 0 4px 10px rgba(106,27,154,0.4); cursor: pointer;" title="瞬移药水 (双击饮用)">
                        <span style="font-size: 18px; line-height: 1;">🔮</span>
                        <span>瞬移</span>
                        <span id="m7PotionBadge_teleport" style="position: absolute; right: -4px; bottom: -4px; background: #D32F2F; color: white; font-size: 11px; font-weight: bold; border-radius: 10px; padding: 0 5px; border: 1.5px solid white; display: none; line-height: 16px;">×2</span>
                    </button>
                </div>

                <!-- 动作按键组 (拉杆、趴下、跳跃) -->
                <div style="display: flex; gap: 10px; align-items: flex-end; pointer-events: auto;">
                    <button id="m7BtnInteract" class="m7-btn" style="width: 50px; height: 50px; border-radius: 50%; background: rgba(255, 179, 0, 0.85); border: 2px solid #FFE082; color: white; font-size: 12px; font-weight: bold; display: flex; align-items: center; justify-content: center; touch-action: manipulation; box-shadow: 0 4px 10px rgba(0,0,0,0.3);">🕹️拉杆</button>
                    <button id="m7BtnDown" class="m7-btn" style="width: 58px; height: 58px; border-radius: 50%; background: rgba(56, 142, 60, 0.88); border: 2px solid #C8E6C9; color: white; font-size: 15px; font-weight: bold; display: flex; align-items: center; justify-content: center; touch-action: manipulation; box-shadow: 0 4px 10px rgba(0,0,0,0.35);">▼趴下</button>
                    <button id="m7BtnUp" class="m7-btn" style="width: 64px; height: 64px; border-radius: 50%; background: rgba(27, 94, 32, 0.85); border: 2px solid #81C784; color: white; font-size: 20px; display: flex; align-items: center; justify-content: center; touch-action: manipulation; box-shadow: 0 4px 12px rgba(0,0,0,0.4);">▲跳跃</button>
                </div>
            </div>
        `;

        document.body.appendChild(container);

        // 绑定移动与动作按键
        function bindTouch(id, keyName, isAction = false) {
            const btn = document.getElementById(id);
            if (!btn) return;

            const onStart = (e) => {
                e.preventDefault();
                getAudioContext();
                if (isAction) {
                    triggerLeverInteraction();
                } else {
                    m7.keys[keyName] = true;
                }
                btn.style.transform = 'scale(0.92)';
            };

            const onEnd = (e) => {
                e.preventDefault();
                if (!isAction) m7.keys[keyName] = false;
                btn.style.transform = 'scale(1)';
            };

            btn.addEventListener('pointerdown', onStart);
            btn.addEventListener('pointerup', onEnd);
            btn.addEventListener('pointercancel', onEnd);
            btn.addEventListener('touchstart', onStart, { passive: false });
            btn.addEventListener('touchend', onEnd, { passive: false });
            btn.addEventListener('touchcancel', onEnd, { passive: false });
        }

        bindTouch('m7BtnLeft', 'left');
        bindTouch('m7BtnRight', 'right');
        bindTouch('m7BtnUp', 'up');
        bindTouch('m7BtnDown', 'down');
        bindTouch('m7BtnInteract', 'interact', true);

        // 绑定药水按键 (双击使用)
        ['speed', 'jump', 'levitation', 'teleport'].forEach(type => {
            const btn = document.getElementById('m7PotionBtn_' + type);
            if (btn) bindPotionButton(btn, type);
        });

        updatePotionButtonsUI();
    }

    function showMobileControls() {
        initMobileControls();
        const el = document.getElementById('mode7Controls');
        if (el) el.style.display = 'flex';
        updatePotionButtonsUI();
    }

    function hideMobileControls() {
        const el = document.getElementById('mode7Controls');
        if (el) el.style.display = 'none';
        const tip = document.getElementById('m7PotionTip');
        if (tip) tip.style.opacity = '0';
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
            } else if (e.code === 'ShiftLeft' || e.code === 'ShiftRight') {
                // Shift 冲刺加速
                m7.keys.sprint = true;
            } else if (e.code === 'Digit1') {
                handlePotionClick('speed');
            } else if (e.code === 'Digit2') {
                handlePotionClick('jump');
            } else if (e.code === 'Digit3') {
                handlePotionClick('levitation');
            } else if (e.code === 'Digit4') {
                handlePotionClick('teleport');
            } else if (e.code === 'KeyE') {
                if (typeof openVillagerModal === 'function') {
                    openVillagerModal();
                }
            } else if (e.code === 'ArrowDown' || e.code === 'KeyS' || e.code === 'KeyC' || e.code === 'ControlLeft' || e.code === 'ControlRight') {
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
            } else if (e.code === 'ShiftLeft' || e.code === 'ShiftRight') {
                m7.keys.sprint = false;
            } else if (e.code === 'ArrowDown' || e.code === 'KeyS' || e.code === 'KeyC' || e.code === 'ControlLeft' || e.code === 'ControlRight') {
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

        let targetDiff = diff;
        if (!targetDiff && typeof gameState !== 'undefined' && gameState.mode7Difficulty) {
            targetDiff = gameState.mode7Difficulty;
        }
        if (targetDiff !== 'normal' && targetDiff !== 'easy') {
            targetDiff = 'easy';
        }

        // 校验普通模式是否解锁（未通关简单模式且未开启创造者模式时禁止进入普通模式）
        if (targetDiff === 'normal') {
            let isUnlocked = false;
            if (typeof isMode7NormalUnlocked === 'function') {
                isUnlocked = isMode7NormalUnlocked();
            } else {
                const isDev = (typeof isDevMode !== 'undefined' && isDevMode);
                const isCreator = (typeof localStorage !== 'undefined' && localStorage.getItem('creator_mode_active') === 'true');
                const isEasyWon = (typeof localStorage !== 'undefined' && localStorage.getItem('mode7_easy_completed') === 'true');
                isUnlocked = isDev || isCreator || isEasyWon;
            }
            if (!isUnlocked) {
                targetDiff = 'easy';
                if (typeof showMessage === 'function') {
                    showMessage('🔒 普通模式尚未解锁！需通关简单模式全部 25 关', window.innerWidth / 2, window.innerHeight / 2);
                }
            }
        }
        m7.difficulty = targetDiff;

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

        // 重置药水临时状态并刷新药水快捷栏
        m7.potionEffects = {
            speed: { active: false, timer: 0 },
            jump: { active: false, timer: 0 },
            levitation: { active: false, timer: 0 },
            teleport: { armed: false }
        };

        initBackgroundElements();
        buildLevelData(lvl);
        initKeyboardListeners();
        initCanvasInteraction();
        showMobileControls();
        updatePotionButtonsUI();

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
        m7.keys.sprint = false;
        if (m7.potionEffects) {
            m7.potionEffects.speed.active = false;
            m7.potionEffects.speed.timer = 0;
            m7.potionEffects.jump.active = false;
            m7.potionEffects.jump.timer = 0;
            m7.potionEffects.levitation.active = false;
            m7.potionEffects.levitation.timer = 0;
            m7.potionEffects.teleport.armed = false;
        }
        const canvas = document.getElementById('gameCanvas');
        if (canvas) canvas.style.cursor = 'default';
    };

    // 监听经济系统变动，实时更新药水按键显示
    window.addEventListener('economyUpdated', () => {
        if (typeof updatePotionButtonsUI === 'function') {
            updatePotionButtonsUI();
        }
    });

})();
