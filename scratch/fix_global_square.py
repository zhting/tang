import sys

path = '/Users/zhting/Documents/积木游戏/index.html'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. 全局按钮和弹窗变方 (圆角归零)
content = content.replace('border-radius: 12px;', 'border-radius: 0;')
content = content.replace('border-radius: 20px;', 'border-radius: 0;')
content = content.replace('border-radius: 30px;', 'border-radius: 0;')
content = content.replace('border-radius: 50px;', 'border-radius: 0;')
content = content.replace('border-radius: 15px;', 'border-radius: 0;')

# 2. 首页标题强化 Minecraft 风格 (立体投影)
content = content.replace('text-shadow: 2px 4px 10px rgba(0, 0, 0, 0.15);', 
                         'text-shadow: 4px 4px 0px #555, 6px 6px 0px #000;')
content = content.replace('color: #333;', 'color: #FFF;')

with open(path, 'w', encoding='utf-8') as f:
    f.write(content)
print("Success")
