import sys

path = '/Users/zhting/Documents/积木游戏/index.html'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. 修复按钮文字颜色 (Minecraft 主题下文字为黑色或深灰，保证可读性)
content = content.replace('.home-screen.mc-theme .btn-home {', 
                         '.home-screen.mc-theme .btn-home {\n            color: #333 !important;\n            background: #DDD !important;\n            border: 2px solid #555;')

# 2. 页面加载时执行初始化
content = content.replace('updateUI();', 'updateUI(); updateHomeTheme();')

# 3. 确保按钮的基础样式有颜色
content = content.replace('.btn-home {', '.btn-home {\n            color: #333;')

with open(path, 'w', encoding='utf-8') as f:
    f.write(content)
print("Success")
