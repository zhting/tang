import sys

path = '/Users/zhting/Documents/积木游戏/index.html'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

# 确保游戏启动时强制设置为模式 1 并刷新主页主题
initialization_code = """
        // 初始化游戏状态和首页主题
        gameState.mode = 1;
        gameState.sessionLevels[1] = 1;
        gameState.sessionLevels[2] = 1;
        gameState.sessionLevels[3] = 1;

        resize(); 
        renderLeaderboard();
        updateUI();
        updateHomeTheme();
    </script>"""

import re
content = re.sub(r'resize\(\);\s*renderLeaderboard\(\);\s*</script>', initialization_code, content)

with open(path, 'w', encoding='utf-8') as f:
    f.write(content)
print("Success")
