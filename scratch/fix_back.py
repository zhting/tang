import sys

path = '/Users/zhting/Documents/积木游戏/index.html'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

old_text = """            // 重置当前模式的会话进度为 1（满足“退出后记录不继续”的需求）
            gameState.sessionLevels[gameState.mode] = 1;"""

new_text = """            // 重置所有模式的会话进度为 1（满足“退出后记录不继续”的需求）
            gameState.sessionLevels[1] = 1;
            gameState.sessionLevels[2] = 1;
            gameState.sessionLevels[3] = 1;"""

if old_text in content:
    content = content.replace(old_text, new_text)
    with open(path, 'w', encoding='utf-8') as f:
        f.write(content)
    print("Success")
else:
    print("Not found")
