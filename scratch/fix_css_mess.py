import sys

path = '/Users/zhting/Documents/积木游戏/index.html'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

# 彻底清理样式的混乱，恢复最原始的圆角设定
clean_btn_home = """        .btn-home {
            background: rgba(255, 255, 255, 0.95);
            color: #333;
            border: none;
            padding: 14px 28px;
            font-size: 18px;
            font-weight: bold;
            border-radius: 30px;
            cursor: pointer;
            box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
            transition: transform 0.1s, box-shadow 0.1s;
            display: flex;
            align-items: center;
            gap: 8px;
        }"""

import re
pattern = r'\.btn-home\s*\{.*?\}'
content = re.sub(pattern, clean_btn_home, content, flags=re.DOTALL)

# 确保 mc-theme 里的设置是正确的且具有最高优先级
mc_theme_fix = """
        /* Minecraft 专属主题样式 */
        .home-screen.mc-theme h1 {
            color: #FFF !important;
            text-shadow: 4px 4px 0px #555, 6px 6px 0px #000 !important;
        }
        .home-screen.mc-theme .btn-home {
            border-radius: 0 !important;
            color: #333 !important;
            background: #DDD !important;
            border: 2px solid #555 !important;
        }
        .ui-layer.hidden {
            display: none !important;
        }
"""
# 替换之前的 mc-theme 块
old_mc_pattern = r'/\* Minecraft 专属主题样式 \*/.*?\.ui-layer\.hidden\s*\{.*?\}'
content = re.sub(old_mc_pattern, mc_theme_fix, content, flags=re.DOTALL)

with open(path, 'w', encoding='utf-8') as f:
    f.write(content)
print("Success")
