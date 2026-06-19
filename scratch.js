        const canvas = document.getElementById('gameCanvas');
        const ctx = canvas.getContext('2d');

        const DEFAULT_THEME = {
            name: "默认小院",
            colors: {
                SQUARE: '#4FC3F7',
                CIRCLE: '#FF7043',
                TRIANGLE: '#FFD54F',
                GRASS: '#8BC34A',
                GRASS_DARK: '#689F38',
                TRUNK: '#795548',
                LEAVES: '#4CAF50',
                GROUND: '#C5E1A5',
                FLOWER_PETAL: '#E91E63',
                HOLE: '#5D4037',
                CLOUD: '#FFFFFF',
                POOL: '#29B6F6',
                APPLE_RED: '#F44336',
                APPLE_LEAF: '#4CAF50'
            },
            skyGradient: ['#87CEEB', '#E0F7FA', '#C5E1A5', '#AED581'],
            decorationColor: '#FFEB3B'
        };

        let currentTheme = JSON.parse(JSON.stringify(DEFAULT_THEME));

        let gameState = {
            mode: 1,
            isPlaying: false,
            level: 1,
            levelId: 0,
            currentLevelCollected: 0,
            targetCount: 1,
            timeLeft: 60,
            score: 0,
            lastTime: 0,
            shapes: [],
            hidingSpots: [],
            effects: [],
            track: null,
            hasRainbow: false,
            sessionLevels: { 1: 1, 2: 1, 3: 1 },
            isModified: false,
            flyingBlocks: []
        };

        let width, height;
        let basketPos = { x: 0, y: 0 };

        const LB_KEY = 'brick_game_leaderboard';
        const UNLOCK_KEY = 'brick_game_unlocked_mode';

        // ===== 开发者测试后门 =====
        let titleClickCount = 0;
        let titleClickTimer = null;
        let isDevMode = false;

        function handleTitleClick() {
            titleClickCount++;
            if (titleClickTimer) clearTimeout(titleClickTimer);

            // 连续点击 5 次触发解锁
            if (titleClickCount >= 5) {
                isDevMode = true;
                
                showMessage("🔧 开发者模式：已激活！", width / 2, height / 2);
                document.getElementById('devConsole').classList.remove('hidden');
                devLog('🔧 开发者模式已激活，输入 help 查看指令', 'info');
                titleClickCount = 0;
            } else {
                // 如果 1 秒内没有连续点击，则重置计数
                titleClickTimer = setTimeout(() => { titleClickCount = 0; }, 1000);
            }
        }

                // ===== 开发者指令系统 =====
        if (isDevMode) {
            document.getElementById('devConsole').classList.remove('hidden');
        }

        document.getElementById('homeTitle').addEventListener('pointerdown', (e) => {
            handleTitleClick();
        });
        function devLog(msg, type = '') {
            const log = document.getElementById('devLog');
            const line = document.createElement('div');
            if (type) line.className = 'log-' + type;
            line.textContent = msg;
            log.appendChild(line);
            log.scrollTop = log.scrollHeight;
        }

        function executeDevCommand(raw) {
            let cmd = raw.trim();
            if (!cmd) return;

            // 提取数字参数（支持 "跳到第99关"、"level 99"、"99关" 等各种写法）
            const numMatch = cmd.match(/\d+/);
            const num = numMatch ? parseInt(numMatch[0]) : null;

            // 帮助
            if (/帮助|help|指令|命令|怎么用/.test(cmd)) {
                devLog('=== 指令列表 ===', 'info');
                devLog('随便输入含以下关键词即可：', 'info');
                devLog('乌云/cloud/下雨  - 生成乌云', 'info');
                devLog('彩虹/rainbow    - 生成彩虹', 'info');
                devLog('升降机/lift     - 生成升降机', 'info');
                devLog('跳关/level/第N关 - 跳到第N关', 'info');
                devLog('时间/time/秒数   - 设置剩余秒数', 'info');
                devLog('分数/score/收集  - 设置收集数', 'info');
                devLog('解锁/unlock     - 永久解锁所有模式', 'info');
                devLog('清空/clear      - 清空日志', 'info');
                return;
            }

            // 永久解锁所有模式
            if (/解锁|unlock|全部解锁/.test(cmd)) {
                localStorage.setItem(UNLOCK_KEY, 99);
                devLog('🔓 所有模式已永久解锁！', 'info');
                return;
            }

            // 锁定所有模式（保留关卡进度）
            if (/锁定|lock/.test(cmd)) {
                localStorage.setItem(UNLOCK_KEY, 1);
                devLog('🔒 模式已重新锁定，进度已保留', 'info');
                setTimeout(() => location.reload(), 1000);
                return;
            }

            // 仅清空排行榜
            if (/清除排行榜|清空排行|clear lb/.test(cmd)) {
                localStorage.removeItem(LB_KEY);
                devLog('🏆 排行榜已清空', 'info');
                if (document.getElementById('leaderboardScreen').classList.contains('hidden') === false) {
                    renderLeaderboard();
                }
                return;
            }

            // 重置所有进度
            if (/重置|reset|清除进度/.test(cmd)) {
                localStorage.clear();
                isDevMode = false;
                devLog('🧹 所有记录已彻底清空！', 'info');
                setTimeout(() => location.reload(), 1000);
                return;
            }

            // 乌云
            if (/乌云|cloud|下雨|暴雨|阴天|雷/.test(cmd)) {
                if (!gameState.isPlaying) { devLog('请先开始游戏！', 'error'); return; }
                gameState.hidingSpots.forEach(spot => {
                    if (spot.type === 'cloud') {
                        spot.isRaining = true;
                        spot.rainTimer = 0;
                        spot.lastRainDrop = 0;
                    }
                });
                devLog('☁️ 所有云朵已变为乌云！');
                return;
            }

            // 彩虹
            if (/彩虹|rainbow|虹/.test(cmd)) {
                if (!gameState.isPlaying) { devLog('请先开始游戏！', 'error'); return; }
                gameState.hasRainbow = true;
                devLog('🌈 彩虹已出现！');
                return;
            }

            // 升降机
            if (/升降机|升降梯|lift|电梯|轨道|自动/.test(cmd)) {
                if (!gameState.isPlaying) { devLog('请先开始游戏！', 'error'); return; }
                gameState.track = new GameTrack();
                devLog('🏙️ 升降机已生成！');
                return;
            }

            // 跳关
            if (/跳关|level|第.*关|关卡|去第|到第|切换关/.test(cmd)) {
                if (!gameState.isPlaying) { devLog('请先开始游戏！', 'error'); return; }
                if (num === null || num < 1) { devLog('请指定关卡数，例如：跳到第99关', 'error'); return; }
                if (gameState.mode === 1) startMode1Level(num);
                else if (gameState.mode === 2) startMode2Level(num);
                else if (gameState.mode === 3) startMode3Level(num);
                devLog(`⏩ 已跳到第 ${num} 关`);
                return;
            }

            // 增加/设置时间
            if (/时间|time|秒|倒计时|计时/.test(cmd)) {
                if (!gameState.isPlaying) { devLog('请先开始游戏！', 'error'); return; }
                if (num === null || num < 0) { devLog('请指定秒数，例如：时间 30 或 加时间 10', 'error'); return; }
                if (/加|添加|增加|多/.test(cmd)) {
                    gameState.timeLeft += num;
                    devLog(`⏰ 已增加 ${num} 秒，当前剩余时间 ${gameState.timeLeft} 秒`);
                } else {
                    gameState.timeLeft = num;
                    devLog(`⏰ 剩余时间已设为 ${num} 秒`);
                }
                return;
            }

            // 添加积木
            if (/积木|方块|地鼠|添加|加/.test(cmd) && (/积木/.test(cmd) || /地鼠/.test(cmd))) {
                if (!gameState.isPlaying) { devLog('请先开始游戏！', 'error'); return; }
                if (num === null || num <= 0) { devLog('请指定数量，例如：加10个积木', 'error'); return; }
                
                if (gameState.mode === 1) {
                    for (let i = 0; i < num; i++) {
                        const s = new Shape(gameState.shapes.length, gameState.targetCount);
                        s.state = 'falling_to_spot';
                        s.x = width * 0.1 + Math.random() * width * 0.8;
                        s.y = -50;
                        s.targetX = width * 0.1 + Math.random() * width * 0.8;
                        s.targetY = height * 0.3 + Math.random() * height * 0.5;
                        s.willHide = false;
                        s.isHidden = false;
                        gameState.shapes.push(s);
                    }
                    devLog(`🧱 模式一：已从天而降添加 ${num} 个积木！`);
                } else if (gameState.mode === 2) {
                    for (let i = 0; i < num; i++) {
                        const shapeType = Math.floor(Math.random() * 3);
                        const runner = new RunningBlock(width / 2 + (Math.random() - 0.5) * 50, height / 2 + (Math.random() - 0.5) * 50, shapeType);
                        if (!gameState.runningBlocks) gameState.runningBlocks = [];
                        gameState.runningBlocks.push(runner);
                    }
                    devLog(`🏃 模式二：已在场地中央添加 ${num} 个跑跑积木！`);
                } else {
                    devLog('当前模式暂不支持添加积木', 'error');
                }
                return;
            }

            // 分数
            if (/分数|score|收集|得分|进度/.test(cmd)) {
                if (!gameState.isPlaying) { devLog('请先开始游戏！', 'error'); return; }
                if (num === null || num < 0) { devLog('请指定数量，例如：分数 5', 'error'); return; }
                gameState.currentLevelCollected = num;
                if (gameState.currentLevelCollected >= gameState.targetCount) {
                    collectShape({ isCollected: false });
                }
                devLog(`🧺 当前收集数设为 ${num}`);
                return;
            }

            // 清空
            if (/清空|clear|清除|删除日志/.test(cmd)) {
                document.getElementById('devLog').innerHTML = '';
                return;
            }

            devLog(`没理解你的意思，输入 帮助 查看可用指令`, 'error');
        }

        function handleDevSubmit() {
            if (!isDevMode) return; // 没有开启开发者模式时，输入命令的功能完全不存在
            const input = document.getElementById('devInput');
            const cmd = input.value.trim();
            if (cmd) {
                devLog('> ' + cmd);
                executeDevCommand(cmd);
                input.value = '';
            }
        }

        // 方式1: form submit（兼容大部分浏览器）
        document.getElementById('devForm').addEventListener('submit', e => {
            e.preventDefault();
            handleDevSubmit();
        });

        // 方式2: keydown Enter（兼容所有浏览器，含移动端）
        document.getElementById('devInput').addEventListener('keydown', e => {
            if (e.key === 'Enter') {
                e.preventDefault();
                // 延迟一帧，确保 IME 输入已完成
                requestAnimationFrame(() => handleDevSubmit());
            }
        });

        // 阻止指令区点击冒泡到游戏 Canvas
        document.getElementById('devConsole').addEventListener('pointerdown', e => e.stopPropagation());

        // ===== 解锁与排行榜逻辑 =====
        const PROGRESS_KEY = 'brick_game_mode_progress';

        function getUnlockedMode() {
            if (isDevMode) return 99;
            let unlocked = 1;
            // 必须通关前一个模式的第 50 关（即进度达到 51）才能解锁下一个模式
            if (getModeProgress(1) > 50) {
                unlocked = 2;
                if (getModeProgress(2) > 50) {
                    unlocked = 3;
                }
            }
            return unlocked;
        }

        function unlockNextMode(currentMode) {
            // 此函数现在主要用于确保进度被正确保存，解锁状态由 getUnlockedMode 实时计算
            let modeNum = parseInt(currentMode);
            if (getModeProgress(modeNum) < 51) {
                saveModeProgress(modeNum, 51);
            }
        }

        // 保存各模式的进度
        function saveModeProgress(mode, level) {
            let progress = JSON.parse(localStorage.getItem(PROGRESS_KEY)) || {};
            progress[mode] = level;
            localStorage.setItem(PROGRESS_KEY, JSON.stringify(progress));
        }

        // 获取各模式的进度
        function getModeProgress(mode) {
            let progress = JSON.parse(localStorage.getItem(PROGRESS_KEY)) || {};
            return progress[mode] || 1;
        }

        function loadLeaderboard() {
            try {
                const data = localStorage.getItem(LB_KEY);
                return data ? JSON.parse(data) : [];
            } catch (e) { return []; }
        }

        function saveToLeaderboard(level, score) {
            if (score <= 0) return; // 零分记录不计入排行榜
            if (gameState.isModified) return; // 如果使用了开发者指令修改状态，不计入排行榜
            let lb = loadLeaderboard();
            lb.push({ level: level, score: score, date: new Date().toLocaleDateString() });
            lb.sort((a, b) => b.level !== a.level ? b.level - a.level : b.score - a.score);
            lb = lb.slice(0, 50); // 严格保留前 50 名
            localStorage.setItem(LB_KEY, JSON.stringify(lb));
        }

        function renderLeaderboard() {
            const list = document.getElementById('leaderboardListFull');
            let lbData = loadLeaderboard().filter(item => item.score > 0); // 过滤并只显示有得分的记录
            list.innerHTML = lbData.length === 0 ? '<li class="lb-item" style="justify-content:center;color:#999;">暂无记录，快去挑战吧！</li>' : '';
            lbData.forEach((item, index) => {
                const li = document.createElement('li');
                li.className = 'lb-item';
                li.innerHTML = `<div><span class="lb-rank">#${index + 1}</span> 第 ${item.level} 关</div><div class="lb-info">${item.score} 个</div>`;
                list.appendChild(li);
            });
        }

        let isGamePausedForLB = false;

        function openLeaderboard() {
            if (gameState.isPlaying) {
                isGamePausedForLB = true;
                gameState.isPlaying = false;
            } else {
                isGamePausedForLB = false;
            }
            renderLeaderboard();
            document.getElementById('homeScreen').classList.add('hidden');
            document.getElementById('modeModal').classList.add('hidden');
            document.getElementById('gameOverModal').classList.add('hidden');
            document.getElementById('leaderboardScreen').classList.remove('hidden');
        }

        function closeLeaderboard() {
            document.getElementById('leaderboardScreen').classList.add('hidden');
            if (isGamePausedForLB) {
                isGamePausedForLB = false;
                gameState.isPlaying = true;
                gameState.lastTime = performance.now();
                requestAnimationFrame(loop);
            } else if (gameState.timeLeft <= 0 && gameState.level > 0) {
                document.getElementById('gameOverModal').classList.remove('hidden');
            } else {
                document.getElementById('homeScreen').classList.remove('hidden');
            }
        }

        // ===== 模式选择菜单 =====
        function openModeModal() {
            const container = document.getElementById('modeButtonsContainer');
            container.innerHTML = '';
            
            const currentUnlocked = getUnlockedMode();

            const modes = [
                { id: 1, name: '模式一：捉迷藏', color: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', text: 'white' },
                { id: 2, name: '模式二：新挑战', color: 'linear-gradient(135deg, #FF9A9E 0%, #FECFEF 100%)', text: '#d81b60' },
                { id: 3, name: '模式三：神秘领域', color: 'linear-gradient(135deg, #a18cd1 0%, #fbc2eb 100%)', text: 'white' }
            ];

            modes.forEach(m => {
                const btn = document.createElement('button');
                btn.className = 'btn-primary';
                btn.style.background = m.color;
                btn.style.color = m.text;
                
                // 使用最严谨的数值比较
                const currentUnlocked = getUnlockedMode();
                const isUnlocked = isDevMode || (Number(currentUnlocked) >= m.id);
                
                if (isUnlocked) {
                    btn.innerHTML = `▶ ${m.name}`;
                    btn.onclick = () => selectMode(m.id);
                    btn.style.opacity = '1';
                    btn.style.filter = 'none';
                    btn.disabled = false;
                } else {
                    btn.innerHTML = `🔒 ${m.name} <br><span style="font-size:12px;opacity:0.8;">(需通关模式${m.id - 1}第 50 关)</span>`;
                    btn.style.opacity = '0.5';
                    btn.style.filter = 'grayscale(100%)';
                    btn.style.cursor = 'not-allowed';
                    btn.disabled = true;
                    btn.onclick = (e) => {
                        e.preventDefault();
                        return false;
                    };
                }
                container.appendChild(btn);
            });

            document.getElementById('modeModal').classList.remove('hidden');
        }

        function closeModeModal() { document.getElementById('modeModal').classList.add('hidden'); }

        function selectMode(mode) {
            // 二次校验解锁状态
            const unlocked = isDevMode ? 99 : getUnlockedMode();
            if (unlocked < mode) {
                showMessage(`🔒 该模式尚未解锁！`, width / 2, height / 2);
                return;
            }
            gameState.mode = mode;
            const modeNames = ["一", "二", "三"];
            document.getElementById('modeDisplayBtn').textContent = modeNames[mode - 1] || mode;

            // --- 新增：动态切换首页 UI 主题 ---
            const homeScreen = document.getElementById('homeScreen');
            const homeTitle = document.getElementById('homeTitle');
            const startBtn = document.getElementById('startBtn');

            if (mode === 1) {
                homeTitle.textContent = "积木小院";
                homeScreen.style.background = "linear-gradient(135deg, #87CEEB 0%, #E0F7FA 100%)";
                startBtn.style.background = "linear-gradient(135deg, #667eea 0%, #764ba2 100%)";
                startBtn.style.color = "white";
            } else if (mode === 2) {
                homeTitle.textContent = "疯狂地鼠"; // 第二模式的专属标题
                homeScreen.style.background = "linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%)";
                startBtn.style.background = "linear-gradient(135deg, #ff0844 0%, #ffb199 100%)";
                startBtn.style.color = "white";
            } else if (mode === 3) {
                homeTitle.textContent = "神秘领域"; // 第三模式的专属标题
                homeScreen.style.background = "linear-gradient(135deg, #a18cd1 0%, #fbc2eb 100%)";
                startBtn.style.background = "linear-gradient(135deg, #89f7fe 0%, #66a6ff 100%)";
                startBtn.style.color = "#333";
            }
            // ------------------------------------

            closeModeModal();
        }

        // 新增：游戏说明弹窗控制逻辑
        function openInstructionsModal() { document.getElementById('instructionsModal').classList.remove('hidden'); }
        function closeInstructionsModal() { document.getElementById('instructionsModal').classList.add('hidden'); }

        function backToHome() {
            gameState.isPlaying = false;
            document.getElementById('gameOverModal').classList.add('hidden');
            document.getElementById('victoryOverlay').classList.add('hidden');
            document.getElementById('confettiContainer').innerHTML = '';
            document.getElementById('homeScreen').classList.remove('hidden');
            
            // 返回首页时清空画布和状态
            ctx.clearRect(0, 0, width, height);
            gameState.hidingSpots = [];
            gameState.shapes = [];
            
            // 重置当前模式的会话进度为 1（满足“退出后记录不继续”的需求）
            gameState.sessionLevels[gameState.mode] = 1;
        }



        function resize() {
            width = window.innerWidth;
            height = window.innerHeight;
            canvas.width = width;
            canvas.height = height;
            const basketEl = document.getElementById('basket');
            const rect = basketEl.getBoundingClientRect();
            basketPos = { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
            if (gameState.mode === 1 || gameState.mode === 2) {
                updateHidingSpots();
                if (gameState.track) gameState.track.updateDimensions(width, height);
            }
        }
        window.addEventListener('resize', resize);

        // 垂直升降机类 (模式一专用)
        class GameTrack {
            constructor() {
                this.updateDimensions(window.innerWidth, window.innerHeight);
            }

            updateDimensions(width, height) {
                const basketEl = document.getElementById('basket');
                const rect = basketEl.getBoundingClientRect();
                this.centerX = rect.left + rect.width / 2;
                this.yBottom = height * 0.75;
                this.yTop = rect.bottom + 10;
                this.width = 50;
            }

            draw(ctx, timestamp = performance.now()) {
                ctx.save();
                const xLeft = this.centerX - this.width / 2;
                const h = this.yBottom - this.yTop;

                ctx.fillStyle = '#424242';
                ctx.fillRect(xLeft, this.yTop, this.width, h);

                ctx.fillStyle = 'rgba(144, 202, 249, 0.2)';
                ctx.fillRect(xLeft - 5, this.yTop, 5, h);
                ctx.fillRect(xLeft + this.width, this.yTop, 5, h);

                ctx.strokeStyle = '#616161';
                ctx.lineWidth = 2;
                const stepGap = 15;
                const offset = (timestamp / 30) % stepGap;

                ctx.beginPath();
                ctx.rect(xLeft, this.yTop, this.width, h);
                ctx.clip();
                for (let i = this.yBottom - offset; i > this.yTop - stepGap; i -= stepGap) {
                    ctx.moveTo(xLeft, i);
                    ctx.lineTo(xLeft + this.width, i);
                }
                ctx.stroke();

                ctx.strokeStyle = '#212121';
                ctx.lineWidth = 4;
                ctx.beginPath();
                ctx.moveTo(xLeft - 2, this.yTop);
                ctx.lineTo(xLeft - 2, this.yBottom);
                ctx.moveTo(xLeft + this.width + 2, this.yTop);
                ctx.lineTo(xLeft + this.width + 2, this.yBottom);
                ctx.stroke();
                ctx.restore();
            }

            checkCapture(shape) {
                if (shape.isRolling || shape.isHidden || shape.isCollected) return false;
                const xLeft = this.centerX - this.width / 2;
                if (shape.x > xLeft && shape.x < xLeft + this.width && shape.y > this.yBottom - 50) return true;
                return false;
            }
        }

        // 遮挡物类 (模式一专用)
        class HidingSpot {
            constructor(id, type, xr, yr) {
                this.id = id; this.type = type; this.xr = xr; this.yr = yr;
                this.x = 0; this.y = 0; this.w = 0; this.h = 0;
                this.shakeOffset = 0; this.animOffsetX = 0;
                this.isRaining = false;
                this.rainTimer = 0;
                this.lastRainDrop = 0;
            }

            updateDimensions(width, height) {
                const w = width || window.innerWidth;
                const h = height || window.innerHeight;
                this.x = w * this.xr; this.y = h * this.yr;
                if (this.type === 'tree') { this.w = 100; this.h = h * 0.35; }
                else if (this.type === 'hole') { this.w = 120; this.h = 45; }
                else if (this.type === 'grass') { this.w = 50; this.h = 40; }
                else if (this.type === 'flower') { this.w = 70; this.h = 50; }
                else if (this.type === 'bush') { this.w = 80; this.h = 50; }
                else if (this.type === 'cloud') { this.w = 100; this.h = 60; }
                else if (this.type === 'pool') { this.w = 280; this.h = 110; }
            }

            update(timestamp) {
                if (this.id === 7) this.animOffsetX = Math.sin(timestamp / 1500) * 180;
            }

            contains(x, y) {
                const p = 30; let cx = this.x + this.animOffsetX;
                if (this.type === 'tree') return x > cx - 60 - p && x < cx + this.w + 60 + p && y > this.y - 80 - p && y < this.y + this.h + p;
                else if (this.type === 'cloud') return x > cx - 30 - p && x < cx + this.w + 30 + p && y > this.y - 30 - p && y < this.y + this.h + p;
                else return x > cx - 30 - p && x < cx + this.w + 30 + p && y > this.y - 60 - p && y < this.y + this.h + p;
            }

            draw(ctx) {
                ctx.save();
                ctx.translate(this.x + this.shakeOffset + this.animOffsetX, this.y);

                if (this.type === 'cloud' && this.isRaining) {
                    ctx.strokeStyle = 'rgba(255, 255, 255, 0.7)';
                    ctx.lineWidth = 2;
                    const time = performance.now();
                    for (let i = 0; i < 5; i++) {
                        const dropX = this.w * 0.2 + (i * this.w * 0.15);
                        const dropY = (time / 15 + i * 20) % 50;
                        ctx.beginPath();
                        ctx.moveTo(dropX, this.h / 2 + dropY);
                        ctx.lineTo(dropX, this.h / 2 + dropY + 15);
                        ctx.stroke();
                    }
                }

                if (this.type === 'tree') {
                    ctx.fillStyle = currentTheme.colors.TRUNK; ctx.fillRect(this.w / 2 - 15, 0, 30, this.h);
                    ctx.fillStyle = currentTheme.colors.LEAVES; ctx.beginPath();
                    ctx.arc(this.w / 2, -30, 60, 0, Math.PI * 2); ctx.arc(this.w / 2 - 40, 10, 50, 0, Math.PI * 2); ctx.arc(this.w / 2 + 40, 10, 50, 0, Math.PI * 2); ctx.fill();
                } else if (this.type === 'bush') {
                    ctx.fillStyle = currentTheme.colors.GRASS_DARK; ctx.beginPath(); ctx.arc(0, this.h, 40, 0, Math.PI * 2); ctx.arc(30, this.h - 20, 50, 0, Math.PI * 2); ctx.arc(60, this.h, 40, 0, Math.PI * 2); ctx.fill();
                } else if (this.type === 'grass') {
                    ctx.fillStyle = currentTheme.colors.GRASS; ctx.beginPath(); ctx.moveTo(0, this.h); ctx.lineTo(10, 0); ctx.lineTo(20, this.h); ctx.lineTo(30, -10); ctx.lineTo(40, this.h); ctx.fill();
                } else if (this.type === 'hole') {
                    ctx.fillStyle = currentTheme.colors.HOLE || '#5D4037'; ctx.beginPath(); ctx.ellipse(this.w / 2, this.h / 2, this.w / 2, this.h / 2, 0, 0, Math.PI * 2); ctx.fill();
                } else if (this.type === 'pool') {
                    ctx.fillStyle = currentTheme.colors.POOL || '#29B6F6'; ctx.beginPath(); ctx.ellipse(this.w / 2, this.h / 2, this.w / 2, this.h / 2, 0, 0, Math.PI * 2); ctx.fill();
                    ctx.strokeStyle = 'rgba(255,255,255,0.3)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.ellipse(this.w / 2, this.h / 2, this.w / 2 - 10, this.h / 2 - 8, 0, 0, Math.PI * 2); ctx.stroke();
                } else if (this.type === 'flower') {
                    // 绘制花朵
                    ctx.strokeStyle = '#4CAF50'; ctx.lineWidth = 3;
                    ctx.beginPath(); ctx.moveTo(this.w / 2, this.h); ctx.lineTo(this.w / 2, this.h / 2); ctx.stroke();
                    ctx.fillStyle = currentTheme.colors.FLOWER_PETAL || '#E91E63';
                    for (let i = 0; i < 5; i++) {
                        ctx.beginPath();
                        ctx.arc(this.w / 2 + Math.cos(i * 1.25) * 12, this.h / 2 + Math.sin(i * 1.25) * 12, 8, 0, Math.PI * 2);
                        ctx.fill();
                    }
                    ctx.fillStyle = '#FFEB3B'; ctx.beginPath(); ctx.arc(this.w / 2, this.h / 2, 6, 0, Math.PI * 2); ctx.fill();
                } else if (this.type === 'cloud') {
                    ctx.fillStyle = this.isRaining ? '#B0BEC5' : (currentTheme.colors.CLOUD || '#FFFFFF');
                    ctx.beginPath(); ctx.arc(this.w / 4, this.h / 2, this.h / 2, 0, Math.PI * 2); ctx.arc(this.w / 2, this.h / 2 - 10, this.h / 1.5, 0, Math.PI * 2); ctx.arc(this.w * 0.75, this.h / 2, this.h / 2, 0, Math.PI * 2); ctx.fill();
                }
                ctx.restore();
            }

            shake() {
                let s = performance.now(); const anim = (t) => {
                    const el = t - s; if (el < 300) { this.shakeOffset = Math.sin(el * 0.1) * 5; requestAnimationFrame(anim); } else this.shakeOffset = 0;
                }; requestAnimationFrame(anim);
            }
        }

        function getFlowerCount() {
            const r = Math.random();
            let count = 0;
            // 90% 到 10% 概率生成 1-9 朵
            for (let i = 1; i <= 9; i++) {
                if (r < (1 - i * 0.1)) count = i;
                else break;
            }
            // 0.1% 及以下概率生成 10 朵及以上
            if (count === 9) {
                let p = 0.001;
                while (r < p && count < 50) {
                    count++;
                    p /= 10;
                }
            }
            return count;
        }

        function updateHidingSpots(isNewLevel = false) {
            if (gameState.hidingSpots.length === 0 && gameState.mode === 1) {
                gameState.hidingSpots = [
                    new HidingSpot(6, 'cloud', 0.1, 0.28), new HidingSpot(7, 'cloud', 0.5, 0.15), new HidingSpot(8, 'cloud', 0.8, 0.25),
                    new HidingSpot(2, 'pool', 0.3, 0.55), new HidingSpot(0, 'tree', 0.05, 0.65), new HidingSpot(1, 'hole', 0.35, 0.82),
                    new HidingSpot(3, 'grass', 0.55, 0.85), new HidingSpot(5, 'bush', 0.85, 0.8)
                ];
            }

            if (isNewLevel) {
                // 移除旧花朵，重新生成
                gameState.hidingSpots = gameState.hidingSpots.filter(s => s.type !== 'flower');
                
                // 只有在第二模式下才生成花朵
                if (gameState.mode === 2) {
                    const count = getFlowerCount();
                    for (let i = 0; i < count; i++) {
                        const xr = 0.1 + Math.random() * 0.8;
                        const yr = 0.7 + Math.random() * 0.2;
                        gameState.hidingSpots.push(new HidingSpot(100 + i, 'flower', xr, yr));
                    }
                }
            }

            gameState.hidingSpots.forEach(s => s.updateDimensions(width, height));
        }

        class Shape {
            constructor(index, totalShapes) {
                this.size = 20 + Math.random() * 10;
                this.type = Math.floor(Math.random() * 3);
                this.isCollected = false;
                this.scale = 1;
                this.rotation = Math.random() * 6.28;
                this.hidingSpotId = null;
                this.relativeX = 0;
                this.relativeY = 0;
                this.isApple = false;
                this.isRolling = false;
                this.isOnRainbow = false;

                const startXOffset = width / 2 - (totalShapes * 40) / 2;
                this.x = startXOffset + index * 40 + 20;
                this.y = -50 - Math.random() * 50;

                if (gameState.mode === 1) {
                    if (gameState.hasRainbow && Math.random() < 0.7) {
                        this.isOnRainbow = true;
                        this.rainbowAngle = Math.PI * 0.1 + Math.random() * (Math.PI * 0.8);
                        this.rainbowSpeed = (Math.random() < 0.5 ? 1 : -1) * (0.003 + Math.random() * 0.005);
                        this.willHide = false;
                        this.isHidden = false;
                        this.hidingSpotId = null;
                    } else if (gameState.track && Math.random() < 0.95) {
                        this.hidingSpotId = null;
                        this.targetX = gameState.track.centerX + (Math.random() - 0.5) * 20;
                        this.targetY = gameState.track.yBottom - 5;
                        this.willHide = false;
                        this.isHidden = false;
                    } else if (Math.random() < 0.5 && gameState.hidingSpots.length > 0) {
                        const s = gameState.hidingSpots[Math.floor(Math.random() * gameState.hidingSpots.length)];
                        this.hidingSpotId = s.id;
                        this.relativeX = (Math.random() - 0.5) * 30;
                        this.relativeY = (Math.random() - 0.5) * 30;
                        if (s.type === 'tree') {
                            this.isApple = true;
                            this.type = 1;
                            this.targetX = s.x + s.w / 2 + this.relativeX;
                            this.targetY = s.y - 20 + this.relativeY;
                        }
                        else {
                            this.targetX = s.x + s.w / 2 + this.relativeX;
                            this.targetY = s.y + s.h / 2 + this.relativeY;
                        }
                        this.willHide = true;
                        this.isHidden = false;
                    } else {
                        this.targetX = width * 0.1 + Math.random() * (width * 0.8);
                        this.targetY = height * 0.7 + Math.random() * (height * 0.2);
                        this.willHide = false;
                        this.isHidden = false;
                    }
                } else {
                    // 占位
                    this.targetX = width / 2;
                    this.targetY = height / 2;
                }

                this.state = 'falling_to_spot';
                this.speed = 5;
                this.vy = 0;
            }

            update(dt) {
                if (this.isCollected) {
                    this.x += (basketPos.x - this.x) * 0.05; this.y += (basketPos.y - this.y) * 0.05; this.scale *= 0.95;
                    return this.scale < 0.05;
                }

                if (this.isRolling && gameState.track) {
                    this.x = gameState.track.centerX;
                    this.y -= 4;
                    if (this.y < gameState.track.yTop) collectShape(this);
                    return false;
                }

                if (this.state === 'falling_to_spot') {
                    if (this.isOnRainbow) {
                        const cx = width / 2;
                        const cy = height * 0.75;
                        const r = Math.min(width, height) * 0.55 + 7.5 + this.size / 2;
                        this.targetX = cx + r * Math.cos(this.rainbowAngle);
                        this.targetY = cy - r * Math.sin(this.rainbowAngle);
                    } else if (this.hidingSpotId !== null) {
                        const sp = gameState.hidingSpots.find(spot => spot.id === this.hidingSpotId);
                        if (sp) {
                            this.targetX = sp.x + sp.animOffsetX + sp.w / 2 + this.relativeX;
                            this.targetY = sp.y + (sp.type === 'tree' ? -20 : sp.h / 2) + this.relativeY;
                        }
                    }

                    const dx = this.targetX - this.x;
                    const dy = this.targetY - this.y;
                    const dist = Math.sqrt(dx * dx + dy * dy);

                    if (gameState.track && !this.isHidden && gameState.track.checkCapture(this)) {
                        this.isRolling = true; this.state = 'rolling'; return false;
                    }

                    if (dist < 10) {
                        this.x = this.targetX;
                        this.y = this.targetY;

                        if (this.isOnRainbow) {
                            this.state = 'walking_on_rainbow';
                        } else {
                            this.state = this.willHide ? 'hiding' : 'landed';
                            if (this.willHide) this.isHidden = true;

                            if (this.hidingSpotId !== null) {
                                const s = gameState.hidingSpots.find(sp => sp.id === this.hidingSpotId);
                                if (s && s.type === 'pool') createSplash(this.x, this.y);
                            }
                        }
                    } else {
                        this.x += dx * 0.04;
                        this.y += dy * 0.04;
                        this.rotation += 0.1;
                    }
                } else if (this.state === 'walking_on_rainbow') {
                    this.rainbowAngle += this.rainbowSpeed;
                    if (this.rainbowAngle < 0.05) {
                        this.rainbowAngle = 0.05;
                        this.rainbowSpeed *= -1;
                    } else if (this.rainbowAngle > Math.PI - 0.05) {
                        this.rainbowAngle = Math.PI - 0.05;
                        this.rainbowSpeed *= -1;
                    }
                    const cx = width / 2;
                    const cy = height * 0.75;
                    const r = Math.min(width, height) * 0.55 + 7.5 + this.size / 2;
                    this.x = cx + r * Math.cos(this.rainbowAngle);
                    this.y = cy - r * Math.sin(this.rainbowAngle);
                    this.rotation -= this.rainbowSpeed * 15;

                    if (gameState.track && gameState.track.checkCapture(this)) {
                        this.isRolling = true; this.state = 'rolling'; return false;
                    }
                } else if (this.state === 'hiding' || this.state === 'landed') {
                    if (gameState.track && !this.isHidden && gameState.track.checkCapture(this)) {
                        this.isRolling = true; this.state = 'rolling'; return false;
                    }
                } else if (this.state === 'popped') {
                    this.y += this.vy; this.vy += 0.5; if (this.y > this.targetY) { this.y = this.targetY; this.vy = 0; this.state = 'landed'; }
                }
                return false;
            }

            draw(ctx) {
                ctx.save(); ctx.translate(this.x, this.y); ctx.rotate(this.rotation); ctx.scale(this.scale, this.scale);
                if (this.isApple && this.isHidden) {
                    ctx.fillStyle = '#F44336'; ctx.beginPath(); ctx.arc(0, 0, this.size / 2, 0, Math.PI * 2); ctx.fill();
                    ctx.strokeStyle = '#795548'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(0, -this.size / 2); ctx.lineTo(0, -this.size / 2 - 8); ctx.stroke();
                    ctx.fillStyle = '#4CAF50'; ctx.beginPath(); ctx.ellipse(5, -this.size / 2 - 5, 6, 3, Math.PI / 4, 0, Math.PI * 2); ctx.fill();
                } else {
                    ctx.fillStyle = this.type === 0 ? currentTheme.colors.SQUARE : (this.type === 1 ? currentTheme.colors.CIRCLE : currentTheme.colors.TRIANGLE);
                    if (this.type === 0) ctx.fillRect(-this.size / 2, -this.size / 2, this.size, this.size);
                    else if (this.type === 1) { ctx.beginPath(); ctx.arc(0, 0, this.size / 2, 0, Math.PI * 2); ctx.fill(); }
                    else { ctx.beginPath(); const h = (Math.sqrt(3) / 2) * this.size; ctx.moveTo(0, -h / 2); ctx.lineTo(this.size / 2, h / 2); ctx.lineTo(-this.size / 2, h / 2); ctx.fill(); }
                }
                ctx.restore();
            }

            popOut() { if (this.state === 'hiding') { this.state = 'popped'; this.vy = -12 - Math.random() * 5; this.isHidden = false; } }
        }

        class Effect {
            constructor(type, x, y) {
                this.type = type; this.x = x; this.y = y; this.life = 1.0;
                if (type === 'splash') { this.vx = (Math.random() - 0.5) * 6; this.vy = -Math.random() * 5 - 2; this.gravity = 0.3; }
            }
            update() {
                this.life -= 0.03; if (this.type === 'splash') { this.x += this.vx; this.y += this.vy; this.vy += this.gravity; }
                return this.life <= 0;
            }
            draw(ctx) {
                ctx.save(); ctx.globalAlpha = this.life;
                if (this.type === 'ripple') { ctx.beginPath(); ctx.arc(this.x, this.y, 40 * (1 - this.life), 0, Math.PI * 2); ctx.strokeStyle = '#fff'; ctx.lineWidth = 3; ctx.stroke(); }
                else if (this.type === 'splash') { ctx.beginPath(); ctx.arc(this.x, this.y, 4, 0, Math.PI * 2); ctx.fillStyle = '#B3E5FC'; ctx.fill(); }
                ctx.restore();
            }
        }

        function createSplash(x, y) { for (let i = 0; i < 8; i++) gameState.effects.push(new Effect('splash', x, y)); }

        function drawScene() {
            const grad = ctx.createLinearGradient(0, 0, 0, height);
            currentTheme.skyGradient.forEach((c, i) => grad.addColorStop(i / (currentTheme.skyGradient.length - 1), c));
            ctx.fillStyle = grad; ctx.fillRect(0, 0, width, height);

            if (gameState.mode === 1 && gameState.hasRainbow) {
                ctx.save();
                ctx.globalAlpha = 0.4;
                ctx.lineWidth = 15;
                const centerX = width / 2;
                const centerY = height * 0.75;
                const radius = Math.min(width, height) * 0.55;
                const colors = ['#FF0000', '#FF7F00', '#FFFF00', '#00FF00', '#0000FF', '#4B0082', '#9400D3'];
                for (let i = 0; i < colors.length; i++) {
                    ctx.beginPath();
                    ctx.arc(centerX, centerY, radius - i * 15, Math.PI, 0);
                    ctx.strokeStyle = colors[i];
                    ctx.stroke();
                }
                ctx.restore();
            }

            ctx.fillStyle = currentTheme.decorationColor;
            for (let i = 0; i < 5; i++) {
                ctx.beginPath();
                ctx.arc(width * (0.1 + i * 0.2), height * 0.65, 3, 0, Math.PI * 2);
                ctx.fill();
            }
        }

        // ===== 模式关卡流转逻辑 =====
        function startMode1Level(n) {
            gameState.level = n; gameState.levelId++; gameState.currentLevelCollected = 0; gameState.targetCount = n; gameState.timeLeft = 60;
            gameState.shapes = []; gameState.effects = []; gameState.track = null; gameState.hasRainbow = false;

            if (Math.random() < 0.05) { gameState.track = new GameTrack(); showMessage("🎰 幸运升降机！", width / 2, height / 3); }
            if (Math.random() < 0.10) { gameState.hasRainbow = true; }

            updateHidingSpots(true);

            gameState.hidingSpots.forEach(spot => {
                if (spot.type === 'cloud') {
                    if (n === 10 || Math.random() < 0.01) {
                        spot.isRaining = true;
                        spot.rainTimer = 0;
                    } else {
                        spot.isRaining = false;
                    }
                }
            });

            for (let i = 0; i < n; i++) gameState.shapes.push(new Shape(i, n));
            const el = document.getElementById('levelIndicator'); el.textContent = `第 ${n} 关：寻找 ${n} 个积木`; el.classList.add('show'); setTimeout(() => el.classList.remove('show'), 3000);
            updateUI();
        }

        function loopMode1(t, dt) {
            if (gameState.track) gameState.track.draw(ctx, t);

            // 乌云每隔5秒自动掉出藏在里面的积木
            gameState.hidingSpots.forEach(spot => {
                if (spot.type === 'cloud' && spot.isRaining) {
                    if (spot.lastRainDrop === 0) spot.lastRainDrop = t;
                    if (t - spot.lastRainDrop >= 5000) {
                        spot.lastRainDrop = t;
                        gameState.shapes.forEach(s => {
                            if (s.hidingSpotId === spot.id && !s.isCollected && s.state === 'hiding') {
                                s.isHidden = false;
                                s.popOut();
                                setTimeout(() => collectShape(s), 100);
                            }
                        });
                    }
                }
            });

            gameState.hidingSpots.forEach(s => s.update(t));

            gameState.shapes.forEach(s => {
                if (s.state === 'hiding' && s.hidingSpotId !== null) {
                    const sp = gameState.hidingSpots.find(spot => spot.id === s.hidingSpotId);
                    if (sp) { s.x = sp.x + sp.animOffsetX + sp.w / 2 + s.relativeX; s.y = sp.y + (sp.type === 'tree' ? -20 : sp.h / 2) + s.relativeY; }
                }
            });

            gameState.shapes.filter(s => s.state === 'hiding' && !s.isApple).forEach(s => s.draw(ctx));
            gameState.hidingSpots.forEach(s => s.draw(ctx));
            gameState.shapes.filter(s => s.state === 'hiding' && s.isApple).forEach(s => s.draw(ctx));

            for (let i = gameState.shapes.length - 1; i >= 0; i--) {
                const s = gameState.shapes[i];
                const fin = s.update(dt);
                if (!fin && s.state !== 'hiding') s.draw(ctx);
                if (fin) gameState.shapes.splice(i, 1);
            }
        }

        // ===== 模式二：疯狂地鼠 =====
        class MoleHole {
            constructor(id, x, y) {
                this.id = id;
                this.x = x;
                this.y = y;
                this.w = 110;
                this.h = 40;
                this.blocks = [];
            }

            drawBack(ctx) {
                ctx.save();
                ctx.translate(this.x, this.y);
                // 绘制深色扁平洞口，完全模仿第一模式
                ctx.fillStyle = currentTheme.colors.HOLE || '#3E2723';
                ctx.beginPath();
                ctx.ellipse(0, 0, this.w / 2, this.h / 2, 0, 0, Math.PI * 2);
                ctx.fill();
                ctx.restore();
            }

            drawFront(ctx) {
                // 彻底移除前方的土堆和草，保持和模式一完全一致
            }

            contains(px, py) {
                return Math.sqrt((px - this.x) ** 2 + (py - this.y) ** 2) < this.w / 2 + 20;
            }
        }

        class MoleBlock {
            constructor(hole, shapeType, delay, speed) {
                this.hole = hole;
                this.shapeType = shapeType; // 0=方块, 1=圆形, 2=三角
                this.size = 30;
                this.x = hole.x;
                this.y = hole.y;
                this.isUp = false;
                this.isCollected = false;
                this.collectAnim = 0;
                this.phase = 'waiting'; // waiting, rising, up, falling
                this.timer = delay; 
                this.upDuration = speed || 2000;
                this.downDuration = speed || 2000;
                this.riseSpeed = 0.08;
                this.offsetY = 0; 
                this.maxOffset = -45;
                this.rotation = 0;
            }

            update(dt) {
                if (this.phase === 'dead') return true; 
                if (this.isCollected) {
                    this.x += (basketPos.x - this.x) * 0.2;
                    this.y += (basketPos.y - this.y) * 0.2;
                    this.collectAnim += dt * 0.003;
                    return this.collectAnim > 1;
                }

                this.timer -= dt;
                if (this.timer > 0) return;

                if (this.phase === 'waiting') {
                    if (this.timer === -1) return; 
                    this.phase = 'rising';
                }

                if (this.phase === 'rising') {
                    this.offsetY += this.maxOffset * this.riseSpeed;
                    this.rotation += 0.05;
                    if (this.offsetY <= this.maxOffset) {
                        this.offsetY = this.maxOffset;
                        this.phase = 'up';
                        this.timer = this.upDuration;
                        this.isUp = true;

                        if (gameState.moleHoles && gameState.moleHoles.length > 1) {
                            const triggerRoll = Math.random();
                            if (triggerRoll < 0.1) { // 10% 概率飞到另一个洞
                                const otherHoles = gameState.moleHoles.filter(h => h.id !== this.hole.id);
                                if (otherHoles.length > 0) {
                                    const targetHole = otherHoles[Math.floor(Math.random() * otherHoles.length)];
                                    if (gameState.flyingBlocks) {
                                        gameState.flyingBlocks.push(new FlyingBlock(this.x, this.y + this.offsetY, targetHole, this.shapeType));
                                        this.phase = 'dead';
                                        return false;
                                    }
                                }
                            } else if (triggerRoll < 0.13) { // 3% 概率跑掉
                                this.isUp = false;
                                this.phase = 'dead';
                                if (gameState.runningBlocks) {
                                    gameState.runningBlocks.push(new RunningBlock(this.x, this.y + this.offsetY, this.shapeType));
                                }
                            }
                        }
                    }
                } else if (this.phase === 'up') {
                    if (this.timer <= 0) {
                        this.phase = 'falling';
                        this.isUp = false;
                    }
                } else if (this.phase === 'falling') {
                    this.offsetY -= this.maxOffset * this.riseSpeed;
                    this.rotation -= 0.05;
                    if (this.offsetY >= 0) {
                        this.offsetY = 0;
                        this.phase = 'waiting';
                        this.timer = this.downDuration;

                        // 激活当前洞口的下一个积木
                        const myHoleBlocks = gameState.moleBlocks.filter(b => b.hole === this.hole && b !== this);
                        const next = myHoleBlocks.find(b => b.phase === 'waiting' && b.timer === -1);
                        if (next) {
                            next.timer = 500 + Math.random() * 1000;
                        }
                    }
                }

                return false;
            }

            draw(ctx) {
                if (this.isCollected) {
                    ctx.save();
                    ctx.globalAlpha = 1 - this.collectAnim;
                    ctx.translate(this.x, this.y);
                    const s = 1 - this.collectAnim * 0.7;
                    ctx.scale(s, s);
                    this.drawShape(ctx);
                    ctx.restore();
                    return;
                }

                if (this.offsetY >= -2 && this.phase !== 'rising') return; 

                ctx.save();
                ctx.translate(this.x, this.y + this.offsetY);
                ctx.rotate(this.rotation);
                this.drawShape(ctx);
                ctx.restore();
            }

            drawShape(ctx) {
                ctx.fillStyle = this.shapeType === 0 ? currentTheme.colors.SQUARE : (this.shapeType === 1 ? currentTheme.colors.CIRCLE : currentTheme.colors.TRIANGLE);
                const s = this.size;
                if (this.shapeType === 0) ctx.fillRect(-s / 2, -s / 2, s, s);
                else if (this.shapeType === 1) { ctx.beginPath(); ctx.arc(0, 0, s / 2, 0, Math.PI * 2); ctx.fill(); }
                else {
                    ctx.beginPath();
                    const h = (Math.sqrt(3) / 2) * s;
                    ctx.moveTo(0, -h / 2); ctx.lineTo(s / 2, h / 2); ctx.lineTo(-s / 2, h / 2); ctx.fill();
                }
            }

            hitTest(px, py) {
                if (!this.isUp || this.isCollected) return false;
                const dx = px - this.x;
                const dy = py - (this.y + this.offsetY);
                return Math.sqrt(dx * dx + dy * dy) < this.size;
            }
        }

        // 飞行的积木 (从一个洞飞往另一个洞)
        class FlyingBlock {
            constructor(x, y, targetHole, shapeType) {
                this.startX = x;
                this.startY = y;
                this.x = x;
                this.y = y;
                this.targetHole = targetHole;
                this.shapeType = shapeType;
                this.progress = 0;
                this.duration = 1000 + Math.random() * 500; // 1.0 - 1.5秒飞行动画
                this.peakHeight = 100 + Math.random() * 50; // 抛物线高度
                this.isCollected = false;
                this.collectAnim = 0;
                this.size = 30;
                this.rotation = 0;
            }

            update(dt) {
                if (this.isCollected) {
                    this.x += (basketPos.x - this.x) * 0.2;
                    this.y += (basketPos.y - this.y) * 0.2;
                    this.collectAnim += dt * 0.005;
                    return this.collectAnim > 1;
                }

                this.progress += dt / this.duration;
                if (this.progress >= 1) {
                    // 到达目标洞口，触发目标洞口的下潜或钻出逻辑
                    const next = gameState.moleBlocks.find(b => b.hole === this.targetHole && b.phase === 'waiting');
                    if (next) {
                        next.timer = 0;
                        next.phase = 'rising';
                        next.offsetY = 0; 
                    }
                    return true;
                }

                const t = this.progress;
                // 抛物线插值
                this.x = this.startX + (this.targetHole.x - this.startX) * t;
                const baseY = this.startY + (this.targetHole.y - this.startY) * t;
                const jump = Math.sin(t * Math.PI) * this.peakHeight;
                this.y = baseY - jump;
                this.rotation += dt * 0.01;
                return false;
            }

            draw(ctx) {
                ctx.save();
                ctx.translate(this.x, this.y);
                ctx.rotate(this.rotation);
                if (this.isCollected) ctx.scale(1 - this.collectAnim, 1 - this.collectAnim);
                
                ctx.fillStyle = this.shapeType === 0 ? currentTheme.colors.SQUARE : (this.shapeType === 1 ? currentTheme.colors.CIRCLE : currentTheme.colors.TRIANGLE);
                const s = this.size;
                if (this.shapeType === 0) ctx.fillRect(-s / 2, -s / 2, s, s);
                else if (this.shapeType === 1) { ctx.beginPath(); ctx.arc(0, 0, s / 2, 0, Math.PI * 2); ctx.fill(); }
                else {
                    ctx.beginPath();
                    const h = (Math.sqrt(3) / 2) * s;
                    ctx.moveTo(0, -h / 2); ctx.lineTo(s / 2, h / 2); ctx.lineTo(-s / 2, h / 2); ctx.fill();
                }
                ctx.restore();
            }

            hitTest(px, py) {
                if (this.isCollected) return false;
                return Math.sqrt((px - this.x)**2 + (py - this.y)**2) < this.size;
            }
        }

        // 长腿乱跑的积木
        class RunningBlock {
            constructor(x, y, shapeType) {
                this.x = x;
                this.y = y;
                this.shapeType = shapeType;
                this.size = 28;
                this.isCollected = false;
                this.collectAnim = 0;
                this.rotation = 0;
                this.legPhase = Math.random() * Math.PI * 2;
                this.speed = 1.2 + Math.random() * 1.0; // 增加移动速度，使其更活泼
                this.hopY = 0;
                this.dir = Math.random() * Math.PI * 2; // 移动方向
                this.dirTimer = 0;
                this.dirInterval = 1000 + Math.random() * 2000;
                this.spawnAnim = 0;
                this.state = 'running'; // running, staggering, falling
                this.staggerTimer = 0;
                this.targetHole = null;
            }

            update(dt) {
                if (this.isCollected) {
                    // 飞向收集栏
                    this.x += (basketPos.x - this.x) * 0.2;
                    this.y += (basketPos.y - this.y) * 0.2;
                    this.collectAnim += dt * 0.004;
                    return this.collectAnim > 1;
                }

                if (this.state === 'falling') {
                    this.spawnAnim = Math.max(0, this.spawnAnim - dt * 0.005);
                    this.y += dt * 0.1; // 掉进洞里
                    return this.spawnAnim <= 0;
                }

                // 出现动画
                if (this.spawnAnim < 1) {
                    this.spawnAnim = Math.min(1, this.spawnAnim + dt * 0.003);
                }

                if (this.state === 'staggering') {
                    this.staggerTimer -= dt;
                    this.rotation = Math.sin(Date.now() * 0.02) * 0.4; // 摇摇晃晃
                    if (this.staggerTimer <= 0) {
                        if (Math.random() < 0.5) {
                            this.state = 'falling';
                        } else {
                            this.state = 'running';
                            this.dir = Math.random() * Math.PI * 2; // 稳住后反向跑
                            // 瞬间移出洞口范围，防止再次触发 staggering 陷入循环
                            this.x += Math.cos(this.dir) * 40;
                            this.y += Math.sin(this.dir) * 40;
                        }
                    }
                    return false;
                }

                // 腿部动画 (减慢速度并减小 hop 幅度，解决“一抖一抖”的问题)
                this.legPhase += dt * 0.005; 

                // 随机换方向
                this.dirTimer += dt;
                if (this.dirTimer >= this.dirInterval) {
                    this.dirTimer = 0;
                    this.dirInterval = 2000 + Math.random() * 2000;
                    this.dir = Math.random() * Math.PI * 2;
                }

                // 移动
                this.x += Math.cos(this.dir) * this.speed;
                this.y += Math.sin(this.dir) * this.speed;
                this.rotation = Math.sin(this.legPhase) * 0.08; 
                this.hopY = Math.abs(Math.sin(this.legPhase * 2)) * 3; // 减小跳跃高度，使走动更平滑

                // 边界反弹
                const margin = 40;
                const skyLine = height * 0.65; // 天空交界线
                if (this.x < margin) { this.x = margin; this.dir = Math.PI - this.dir; }
                if (this.x > width - margin) { this.x = width - margin; this.dir = Math.PI - this.dir; }
                if (this.y < skyLine) { this.y = skyLine; this.dir = Math.abs(this.dir); } // 碰到天空线反弹
                if (this.y > height - margin) { this.y = height - margin; this.dir = -Math.abs(this.dir); }

                // 检查是否碰到洞口
                if (gameState.moleHoles) {
                    for (const hole of gameState.moleHoles) {
                        const dist = Math.sqrt((this.x - hole.x)**2 + (this.y - hole.y)**2);
                        if (dist < 30) {
                            this.state = 'staggering';
                            this.staggerTimer = 1000 + Math.random() * 1000;
                            this.targetHole = hole;
                            break;
                        }
                    }
                }

                return false;
            }

            draw(ctx) {
                if (this.isCollected) {
                    ctx.save();
                    ctx.globalAlpha = 1 - this.collectAnim;
                    ctx.translate(this.x, this.y);
                    const s = 1 - this.collectAnim * 0.6;
                    ctx.scale(s, s);
                    this.drawBody(ctx);
                    ctx.restore();
                    return;
                }

                const scale = this.spawnAnim;
                ctx.save();
                ctx.translate(this.x, this.y - this.hopY); // 应用跳跃偏移
                ctx.scale(scale, scale);
                ctx.rotate(this.rotation);

                // 画腿/脚
                this.drawLegs(ctx);

                // 画身体
                this.drawBody(ctx);

                ctx.restore();
            }

            drawBody(ctx) {
                ctx.fillStyle = this.shapeType === 0 ? currentTheme.colors.SQUARE : (this.shapeType === 1 ? currentTheme.colors.CIRCLE : currentTheme.colors.TRIANGLE);
                const s = this.size;
                if (this.shapeType === 0) {
                    ctx.fillRect(-s / 2, -s / 2, s, s);
                } else if (this.shapeType === 1) {
                    ctx.beginPath();
                    ctx.arc(0, 0, s / 2, 0, Math.PI * 2);
                    ctx.fill();
                } else {
                    ctx.beginPath();
                    const h = (Math.sqrt(3) / 2) * s;
                    ctx.moveTo(0, -h / 2);
                    ctx.lineTo(s / 2, h / 2);
                    ctx.lineTo(-s / 2, h / 2);
                    ctx.fill();
                }
            }

            drawLegs(ctx) {
                ctx.strokeStyle = '#5D4037';
                ctx.lineWidth = 3;
                ctx.lineCap = 'round';
                const legLen = 10;
                const swing = Math.sin(this.legPhase) * 6;

                // 左腿
                ctx.beginPath();
                ctx.moveTo(-8, this.size / 2 - 2);
                ctx.lineTo(-8 - swing, this.size / 2 + legLen);
                ctx.stroke();

                // 右腿
                ctx.beginPath();
                ctx.moveTo(8, this.size / 2 - 2);
                ctx.lineTo(8 + swing, this.size / 2 + legLen);
                ctx.stroke();

                // 脚
                ctx.fillStyle = '#5D4037';
                ctx.beginPath(); ctx.arc(-8 - swing, this.size / 2 + legLen, 3, 0, Math.PI * 2); ctx.fill();
                ctx.beginPath(); ctx.arc(8 + swing, this.size / 2 + legLen, 3, 0, Math.PI * 2); ctx.fill();
            }

            hitTest(px, py) {
                if (this.isCollected) return false;
                return Math.sqrt((px - this.x) ** 2 + (py - this.y) ** 2) < this.size + 10;
            }
        }

        function startMode2Level(n) {
            gameState.level = n; gameState.levelId++; gameState.currentLevelCollected = 0; gameState.targetCount = n; gameState.timeLeft = 60;
            gameState.shapes = []; gameState.effects = []; gameState.track = null; gameState.hasRainbow = false; gameState.hidingSpots = [];
            updateHidingSpots(true);
            
            // 为了防止同一个位置堆叠过 3 个以上，我们将洞的数量调整为 Math.ceil(n / 3)
            // 这样平均每个洞只会分配到 3 个积木
            const holeCount = Math.ceil(n / 3);
            gameState.moleHoles = [];
            gameState.moleBlocks = [];
            gameState.runningBlocks = [];
            gameState.flyingBlocks = [];

            const groundY = height * 0.65;
            const margin = 60;
            const availW = width - margin * 2;
            const spacing = holeCount > 1 ? availW / (holeCount - 1) : 0;

            const startX = holeCount > 1 ? margin : width / 2;

            for (let i = 0; i < holeCount; i++) {
                // 基础位置仍然大致均匀分布，但增加较大的随机偏移量使其看起来不那么整齐
                const baseHx = holeCount > 1 ? startX + i * spacing : width / 2;
                const jitterX = holeCount > 1 ? (Math.random() - 0.5) * spacing * 0.6 : 0;
                const hx = baseHx + jitterX;
                
                // 垂直方向增加更大的随机错落感
                const hy = groundY + Math.random() * 100; 
                
                const hole = new MoleHole(i, hx, hy);
                gameState.moleHoles.push(hole);
            }

            const speedTier = Math.floor((n - 1) / 5);
            const blockSpeed = Math.max(600, 2000 - speedTier * 300);

            // 记录每个洞分配了多少个积木，用于初始化第一个积木
            const holeAssignedCount = new Array(holeCount).fill(0);

            for (let i = 0; i < n; i++) {
                const holeIdx = i % holeCount;
                const hole = gameState.moleHoles[holeIdx];
                const shapeType = Math.floor(Math.random() * 3);
                
                // 每个洞的第一个积木立即（或稍后）激活
                const delay = holeAssignedCount[holeIdx] === 0 ? (500 + Math.random() * 1000) : -1;
                const block = new MoleBlock(hole, shapeType, delay, blockSpeed);
                
                // 增加随机偏移量，防止视觉上的重叠
                block.x += (Math.random() - 0.5) * 40;
                block.y += (Math.random() - 0.5) * 20;
                
                gameState.moleBlocks.push(block);
                holeAssignedCount[holeIdx]++;
            }

            const el = document.getElementById('levelIndicator');
            el.textContent = `第 ${n}关：收集 ${n} 个积木`;
            el.classList.add('show');
            setTimeout(() => el.classList.remove('show'), 3000);
            updateUI();
        }

        function loopMode2(t, dt) {
            // 画草地背景
            const grad = ctx.createLinearGradient(0, 0, 0, height);
            grad.addColorStop(0, '#87CEEB');
            grad.addColorStop(0.5, '#E0F7FA');
            grad.addColorStop(0.6, '#AED581');
            grad.addColorStop(1, '#8BC34A');
            ctx.fillStyle = grad;
            ctx.fillRect(0, 0, width, height);

            // 更新并绘制装饰物（包括第二模式专属的小花）
            gameState.hidingSpots.forEach(s => s.update(t));
            gameState.hidingSpots.forEach(s => s.draw(ctx));

            // 先画洞的底层
            for (const hole of gameState.moleHoles) {
                hole.drawBack(ctx);
            }

            // 画积木地鼠（在洞的前半部分后面会被遮挡）
            for (const block of gameState.moleBlocks) {
                block.update(dt);
                block.draw(ctx);
            }

            // 画洞的前方遮挡（土堆边缘）
            for (const hole of gameState.moleHoles) {
                hole.drawFront(ctx);
            }

            // 画跑跑积木
            if (gameState.runningBlocks) {
                gameState.runningBlocks = gameState.runningBlocks.filter(r => {
                    const dead = r.update(dt);
                    r.draw(ctx);
                    return !dead;
                });
            }

            // 画飞行的积木
            if (gameState.flyingBlocks) {
                gameState.flyingBlocks = gameState.flyingBlocks.filter(f => {
                    const arrived = f.update(dt);
                    f.draw(ctx);
                    return !arrived;
                });
            }

            // 清理已完成的收集动画和已死亡的积木
            gameState.moleBlocks = gameState.moleBlocks.filter(b => {
                if (b.phase === 'dead') return false;
                if (b.isCollected && b.collectAnim > 1) return false;
                return true;
            });
        }

        function startMode3Level(n) {
            gameState.level = n; gameState.levelId++; gameState.currentLevelCollected = 0; gameState.targetCount = n; gameState.timeLeft = 60;
            gameState.shapes = []; gameState.effects = []; gameState.track = null; gameState.hasRainbow = false; gameState.hidingSpots = [];
            const el = document.getElementById('levelIndicator'); el.textContent = `模式三 - 第 ${n} 关：敬请期待`; el.classList.add('show'); setTimeout(() => el.classList.remove('show'), 3000);
            updateUI();
        }

        function loopMode3(t, dt) {
            ctx.fillStyle = "white"; ctx.font = "bold 30px Arial"; ctx.textAlign = "center";
            ctx.fillText(`第三模式开发中... (当前第 ${gameState.level} 关)`, width / 2, height / 2);
        }

        // ===== 通用核心控制 =====
        function startGame(mode) {
            // 最终安全检查：防止直接通过函数调用启动未解锁模式
            const unlocked = isDevMode ? 99 : getUnlockedMode();
            if (unlocked < mode) {
                mode = 1;
            }
            
            document.getElementById('homeScreen').classList.add('hidden');
            document.getElementById('gameOverModal').classList.add('hidden');
            gameState.mode = mode;
            gameState.isPlaying = true;
            gameState.score = 0;
            gameState.isModified = false; // 新对局开始，重置修改标记
            gameState.lastTime = performance.now();

            // 开发者模式显示指令区
            if (isDevMode) {
                document.getElementById('devLog').innerHTML = '';
            }

            document.getElementById('scoreLabel').textContent = "当前目标";
            gameState.hidingSpots = [];

            // 加载当前模式的进度
            // 使用会话进度作为开始关卡
            const startLevel = gameState.sessionLevels[mode] || 1;

            if (mode === 1) {
                updateHidingSpots(true);
                startMode1Level(startLevel);
            } else if (mode === 2) {
                startMode2Level(startLevel);
            } else if (mode === 3) {
                startMode3Level(startLevel);
            }

            requestAnimationFrame(loop);
        }

        function gameOver() {
            gameState.isPlaying = false; const modal = document.getElementById('gameOverModal');
            modal.querySelector('h2').textContent = "时间到了";

            if (gameState.mode === 1) {
                modal.querySelector('p').innerHTML = `止步于第 ${gameState.level} 关。<br>得分：${gameState.score}`;
            } else {
                modal.querySelector('p').innerHTML = `模式 ${gameState.mode} 止步于第 ${gameState.level} 关。<br>得分：${gameState.score}`;
            }

            saveToLeaderboard(gameState.level, gameState.score);
            modal.classList.remove('hidden');
        }

        function updateUI() {
            document.getElementById('scoreDisplay').textContent = `${gameState.currentLevelCollected} / ${gameState.targetCount}`;
            document.getElementById('timerDisplay').textContent = `${Math.ceil(gameState.timeLeft)}s`;
        }

        function collectShape(shape) {
            if (shape.isCollected) return; shape.isCollected = true;
            gameState.currentLevelCollected++;
            gameState.score++;

            if (gameState.currentLevelCollected >= gameState.targetCount) {
                // 更新会话进度
                gameState.sessionLevels[gameState.mode] = gameState.level + 1;
                // 仅当创造新纪录时才持久化到 localStorage（满足“退出浏览器后再进入还能继续玩”的需求）
                if (gameState.level + 1 > getModeProgress(gameState.mode)) {
                    saveModeProgress(gameState.mode, gameState.level + 1);
                }

                // 模式通关（第 50 关完成时解锁下一模式）
                if (gameState.level === 50) {
                    gameState.isPlaying = false;
                    unlockNextMode(gameState.mode);
                    saveToLeaderboard(gameState.level, gameState.score);
                    setTimeout(() => showVictoryScreen(), 500);
                    return;
                }

                const savedLevelId = gameState.levelId;
                showMessage("✨ 关卡完成！", width / 2, height / 2);
                setTimeout(() => {
                    // 如果关卡已被指令切换，不再自动跳关
                    if (savedLevelId !== gameState.levelId) return;
                    if (gameState.mode === 1) startMode1Level(gameState.level + 1);
                    else if (gameState.mode === 2) startMode2Level(gameState.level + 1);
                    else if (gameState.mode === 3) startMode3Level(gameState.level + 1);
                }, 1000);
            }

            const b = document.getElementById('basket'); b.style.transform = 'scale(1.1)'; setTimeout(() => b.style.transform = 'scale(1)', 100);
        }

        // ===== 胜利庆祝界面 =====
        const modeNames = ['第一模式', '第二模式', '第三模式'];
        const modeNextNames = ['第二模式', '第三模式', '全新模式'];

        function showVictoryScreen() {
            const mode = gameState.mode;
            const modeName = modeNames[mode - 1] || `模式${mode}`;
            const nextName = modeNextNames[mode - 1] || `模式${mode + 1}`;

            document.getElementById('victoryText').textContent = `恭喜你通过${modeName}，解锁${nextName}`;
            document.getElementById('victorySubtitle').textContent = `最终得分：${gameState.score}`;
            document.getElementById('victoryOverlay').classList.remove('hidden');
            

            launchConfetti();
        }

        function closeVictory() {
            document.getElementById('victoryOverlay').classList.add('hidden');
            document.getElementById('confettiContainer').innerHTML = '';
        }

        function launchConfetti() {
            const container = document.getElementById('confettiContainer');
            container.innerHTML = '';
            const colors = ['#FFD700', '#FF6B6B', '#4ECDC4', '#45B7D1', '#FF69B4', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E9', '#F0B27A'];
            const shapes = ['square', 'circle', 'triangle'];

            for (let i = 0; i < 80; i++) {
                setTimeout(() => {
                    const el = document.createElement('div');
                    el.className = 'confetti';
                    const color = colors[Math.floor(Math.random() * colors.length)];
                    const shape = shapes[Math.floor(Math.random() * shapes.length)];
                    const size = 6 + Math.random() * 10;
                    const left = Math.random() * 100;
                    const duration = 2 + Math.random() * 3;
                    const delay = Math.random() * 0.5;

                    el.style.left = left + '%';
                    el.style.top = '-20px';
                    el.style.width = size + 'px';
                    el.style.height = size + 'px';
                    el.style.backgroundColor = color;
                    el.style.animationDuration = duration + 's';
                    el.style.animationDelay = delay + 's';

                    if (shape === 'circle') {
                        el.style.borderRadius = '50%';
                    } else if (shape === 'triangle') {
                        el.style.width = '0';
                        el.style.height = '0';
                        el.style.backgroundColor = 'transparent';
                        el.style.borderLeft = (size / 2) + 'px solid transparent';
                        el.style.borderRight = (size / 2) + 'px solid transparent';
                        el.style.borderBottom = size + 'px solid ' + color;
                    }

                    container.appendChild(el);
                    setTimeout(() => el.remove(), (duration + delay) * 1000 + 100);
                }, i * 30);
            }

            // 持续发射彩炮
            if (!document.getElementById('victoryOverlay').classList.contains('hidden')) {
                setTimeout(() => launchConfetti(), 3000);
            }
        }

        function showMessage(text, x, y) {
            const t = document.getElementById('messageToast'); t.textContent = text; t.classList.remove('show'); void t.offsetWidth;
            if (x !== undefined) { t.style.left = x + 'px'; t.style.top = y + 'px'; } t.classList.add('show');
        }

        function loop(t) {
            if (!gameState.isPlaying) return;
            const dt = t - gameState.lastTime; gameState.lastTime = t;

            if (dt > 1000) { requestAnimationFrame(loop); return; }

            gameState.timeLeft -= dt / 1000;
            if (gameState.timeLeft <= 0) { gameOver(); return; }

            ctx.clearRect(0, 0, width, height);
            drawScene();

            if (gameState.mode === 1) {
                loopMode1(t, dt);
            } else if (gameState.mode === 2) {
                loopMode2(t, dt);
            } else if (gameState.mode === 3) {
                loopMode3(t, dt);
            }

            for (let i = gameState.effects.length - 1; i >= 0; i--) {
                if (gameState.effects[i].update()) gameState.effects.splice(i, 1); else gameState.effects[i].draw(ctx);
            }
            updateUI(); requestAnimationFrame(loop);
        }

        canvas.addEventListener('pointerdown', e => {
            if (!gameState.isPlaying) return;
            const rect = canvas.getBoundingClientRect(); const x = (e.clientX - rect.left) * (canvas.width / rect.width); const y = (e.clientY - rect.top) * (canvas.height / rect.height);
            gameState.effects.push(new Effect('ripple', x, y));

            if (gameState.mode === 1) {
                let best = null; let minDist = 100;
                for (const s of gameState.shapes) {
                    if (!s.isCollected) {
                        if (s.state !== 'falling_to_spot') {
                            const d = Math.sqrt((x - s.x) ** 2 + (y - s.y) ** 2);
                            if (d < minDist) { best = { type: 'shape', obj: s }; minDist = d; }
                        }
                    }
                }
                if (!best) {
                    for (const s of gameState.hidingSpots) { if (s.contains(x, y) && !s.isRaining) { best = { type: 'spot', obj: s }; break; } }
                }
                if (best) {
                    if (best.type === 'shape') { best.obj.isHidden = false; best.obj.popOut(); setTimeout(() => collectShape(best.obj), 100); }
                    else {
                        best.obj.shake(); let found = false;
                        gameState.shapes.forEach(s => {
                            if (s.hidingSpotId === best.obj.id && !s.isCollected && s.state === 'hiding') {
                                s.isHidden = false; s.popOut(); setTimeout(() => collectShape(s), 100); found = true;
                            }
                        });
                        showMessage(found ? "✨ 找到了！" : "🍂 空空如也...", e.clientX, e.clientY);
                    }
                }
            } else if (gameState.mode === 2) {
                // 模式二：点击出洞的积木或跑跑积木收集
                let hit = false;
                if (gameState.moleBlocks) {
                    for (const block of gameState.moleBlocks) {
                        if (block.hitTest(x, y)) {
                            block.isUp = false;
                            collectShape(block);
                            block.isCollected = true;
                            // 激活下一个待命积木
                            const idx = gameState.moleBlocks.indexOf(block);
                            if (idx >= 0) {
                                for (let j = idx + 1; j < gameState.moleBlocks.length; j++) {
                                    const next = gameState.moleBlocks[j];
                                    if (next.phase === 'waiting' && next.timer === -1 && !next.isCollected && next.phase !== 'dead') {
                                        next.timer = 0;
                                        break;
                                    }
                                }
                            }
                            gameState.effects.push(new Effect('ripple', x, y));
                            hit = true;
                            break;
                        }
                    }
                }
                if (!hit && gameState.runningBlocks) {
                    for (const runner of gameState.runningBlocks) {
                        if (runner.hitTest(x, y)) {
                            collectShape(runner);
                            runner.isCollected = true;
                            gameState.effects.push(new Effect('ripple', x, y));
                            hit = true;
                            break;
                        }
                    }
                }
                if (!hit && gameState.flyingBlocks) {
                    for (const flyer of gameState.flyingBlocks) {
                        if (flyer.hitTest(x, y)) {
                            collectShape(flyer);
                            flyer.isCollected = true;
                            gameState.effects.push(new Effect('ripple', x, y));
                            hit = true;
                            break;
                        }
                    }
                }
            } else if (gameState.mode === 3) {
                // 模式三开发中
            }
        });

        // 初始化会话进度（从持久化存档加载）
        gameState.sessionLevels[1] = getModeProgress(1);
        gameState.sessionLevels[2] = getModeProgress(2);
        gameState.sessionLevels[3] = getModeProgress(3);

        resize(); renderLeaderboard();
