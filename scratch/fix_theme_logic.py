import sys

path = '/Users/zhting/Documents/积木游戏/index.html'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. 恢复 CSS 圆角样式 (默认)
content = content.replace('.btn-home {', '.btn-home {\n            border-radius: 30px;')
content = content.replace('.modal-content {', '.modal-content {\n            border-radius: 20px;')
content = content.replace('.btn-primary {', '.btn-primary {\n            border-radius: 50px;')
content = content.replace('.lb-item {', '.lb-item {\n            border-radius: 12px;')

# 2. 增加 Minecraft 专属主题 Class
mc_theme_css = """
        /* Minecraft 专属主题样式 */
        .home-screen.mc-theme h1 {
            color: #FFF !important;
            text-shadow: 4px 4px 0px #555, 6px 6px 0px #000 !important;
        }
        .home-screen.mc-theme .btn-home {
            border-radius: 0 !important;
        }
        .ui-layer.hidden {
            display: none !important;
        }
"""
content = content.replace('</style>', mc_theme_css + '\n    </style>')

# 3. 首页 UI 层显隐控制
content = content.replace('<div class="ui-layer">', '<div id="uiLayer" class="ui-layer hidden">')

# 4. 模式切换与主页主题联动函数
update_theme_js = """
        function updateHomeTheme() {
            const screen = document.getElementById('homeScreen');
            const title = document.getElementById('homeTitle');
            const mode = gameState.mode;
            
            if (mode === 3) {
                screen.classList.add('mc-theme');
                title.textContent = "我的世界";
                screen.style.background = "transparent"; // 由 Canvas 绘制背景
            } else {
                screen.classList.remove('mc-theme');
                title.textContent = (mode === 2) ? "神秘领域" : "积木小院";
                screen.style.background = "linear-gradient(135deg, #87CEEB 0%, #E0F7FA 100%)";
                if (mode === 2) screen.style.background = "linear-gradient(135deg, #a18cd1 0%, #fbc2eb 100%)";
            }
            document.getElementById('modeDisplayBtn').textContent = (mode === 1 ? '一' : (mode === 2 ? '二' : '三'));
        }
"""
content = content.replace('// ===== 通用核心控制 =====', update_theme_js + '\n        // ===== 通用核心控制 =====')

# 5. 在相关入口调用 updateHomeTheme
content = content.replace('gameState.mode = mode;', 'gameState.mode = mode; updateHomeTheme();')
content = content.replace('function backToHome() {', 'function backToHome() {\n            document.getElementById("uiLayer").classList.add("hidden");')
content = content.replace('function startGame(mode) {', 'function startGame(mode) {\n            document.getElementById("uiLayer").classList.remove("hidden");')

# 6. 修正绘图逻辑：只在模式 3 时绘制 Minecraft 背景
old_draw_bg = """        function drawMinecraftHomeBackground(dt) {
            ctx.clearRect(0, 0, width, height);"""

new_draw_bg = """        function drawMinecraftHomeBackground(dt) {
            ctx.clearRect(0, 0, width, height);
            if (gameState.mode !== 3) {
                // 模式 1/2 不在 Canvas 画背景，直接使用 CSS
                return;
            }"""

if old_draw_bg in content:
    content = content.replace(old_draw_bg, new_draw_bg)

with open(path, 'w', encoding='utf-8') as f:
    f.write(content)
print("Success")
