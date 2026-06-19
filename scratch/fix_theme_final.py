import sys

path = '/Users/zhting/Documents/积木游戏/index.html'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. 强化 CSS：明确默认圆角和 Minecraft 方角
content = content.replace('.btn-home {', '.btn-home {\n            border-radius: 30px !important;')
content = content.replace('.home-screen.mc-theme .btn-home {', '.home-screen.mc-theme .btn-home {\n            border-radius: 0 !important;')

# 2. 彻底清理 selectMode 中的冗余代码
import re
# 匹配 --- 新增：动态切换首页 UI 主题 --- 之后到 closeModeModal() 之前的内容并删除
pattern = r'// --- 新增：动态切换首页 UI 主题 ---.*?closeModeModal\(\);'
content = re.sub(pattern, 'closeModeModal();', content, flags=re.DOTALL)

# 3. 重写 updateHomeTheme，确保逻辑万无一失
new_update_theme = """
        function updateHomeTheme() {
            const screen = document.getElementById('homeScreen');
            const title = document.getElementById('homeTitle');
            const mode = gameState.mode;
            const startBtn = document.getElementById('startBtn');
            const modeDisplay = document.getElementById('modeDisplayBtn');
            
            // 默认重置所有状态
            screen.classList.remove('mc-theme');
            startBtn.style.background = ""; 
            startBtn.style.color = "";
            modeDisplay.textContent = (mode === 1 ? '一' : (mode === 2 ? '二' : '三'));

            if (mode === 3) {
                // 进入“我的世界”主题
                screen.classList.add('mc-theme');
                title.textContent = "我的世界";
                screen.style.background = "transparent"; 
            } else if (mode === 2) {
                // 进入“疯狂地鼠”主题
                title.textContent = "疯狂地鼠";
                screen.style.background = "linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%)";
                startBtn.style.background = "linear-gradient(135deg, #ff0844 0%, #ffb199 100%)";
                startBtn.style.color = "white";
            } else {
                // 默认“积木小院”主题
                title.textContent = "积木小院";
                screen.style.background = "linear-gradient(135deg, #87CEEB 0%, #E0F7FA 100%)";
                startBtn.style.background = "linear-gradient(135deg, #667eea 0%, #764ba2 100%)";
                startBtn.style.color = "white";
            }
        }
"""
# 替换旧的 updateHomeTheme
old_update_theme_pattern = r'function updateHomeTheme\(\) \{.*?\}'
content = re.sub(old_update_theme_pattern, new_update_theme, content, flags=re.DOTALL)

with open(path, 'w', encoding='utf-8') as f:
    f.write(content)
print("Success")
