import sys

path = '/Users/zhting/Documents/积木游戏/index.html'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. 修复首页标题基础样式 (恢复为原始深灰色和柔和阴影)
import re
old_h1_pattern = r'\.home-screen h1 \{.*?\}'
new_h1_style = """        .home-screen h1 {
            font-size: 56px;
            color: #333;
            margin-bottom: 40px;
            text-shadow: 2px 4px 10px rgba(0, 0, 0, 0.15);
            font-weight: 900;
        }"""
content = re.sub(old_h1_pattern, new_h1_style, content, flags=re.DOTALL)

# 2. 修复游戏内 UI 基础样式 (恢复圆角和颜色)
old_status_box_pattern = r'\.status-box \{.*?\}'
new_status_box_style = """        .status-box {
            background: rgba(255, 255, 255, 0.95);
            padding: 8px 16px;
            border-radius: 12px;
            box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);
            font-size: 16px;
            font-weight: bold;
            color: #333;
            display: flex;
            align-items: center;
            gap: 8px;
            transition: all 0.3s;
            width: fit-content;
            cursor: pointer;
        }"""
content = re.sub(old_status_box_pattern, new_status_box_style, content, flags=re.DOTALL)

old_basket_pattern = r'\.basket-area \{.*?\}'
new_basket_style = """        .basket-area {
            background: rgba(255, 255, 255, 0.95);
            padding: 10px 20px;
            border-radius: 20px;
            display: flex;
            align-items: center;
            gap: 12px;
            box-shadow: 0 4px 15px rgba(0, 0, 0, 0.15);
            border: none;
            pointer-events: auto;
        }"""
content = re.sub(old_basket_pattern, new_basket_style, content, flags=re.DOTALL)

# 3. 强化 Minecraft 主题样式隔离 (确保只有在 .mc-theme 下才变方)
mc_theme_css = """
        /* Minecraft 专属主题样式 */
        .mc-theme h1 {
            color: #FFF !important;
            text-shadow: 4px 4px 0px #555, 6px 6px 0px #000 !important;
        }
        .mc-theme .btn-home, .mc-theme .status-box, .mc-theme .basket-area {
            border-radius: 0 !important;
            background: #DDD !important;
            border: 2px solid #555 !important;
            color: #333 !important;
        }
        .ui-layer.hidden {
            display: none !important;
        }
"""
# 替换之前的 mc-theme 块
old_mc_pattern = r'/\* Minecraft 专属主题样式 \*/.*?\.ui-layer\.hidden\s*\{.*?\}'
content = re.sub(old_mc_pattern, mc_theme_css, content, flags=re.DOTALL)

# 4. 更新 JS 逻辑：同步更新 uiLayer 的主题
content = content.replace('const screen = document.getElementById(\'homeScreen\');', 
                         'const screen = document.getElementById(\'homeScreen\');\n            const uiLayer = document.getElementById(\'uiLayer\');')
content = content.replace('screen.classList.add(\'mc-theme\');', 'screen.classList.add(\'mc-theme\'); uiLayer.classList.add(\'mc-theme\');')
content = content.replace('screen.classList.remove(\'mc-theme\');', 'screen.classList.remove(\'mc-theme\'); uiLayer.classList.remove(\'mc-theme\');')

with open(path, 'w', encoding='utf-8') as f:
    f.write(content)
print("Success")
