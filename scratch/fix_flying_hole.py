import sys

path = '/Users/zhting/Documents/积木游戏/index.html'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

old_text = """                                const isMiss = Math.random() < 0.2;
                                gameState.flyingBlocks.push(new FlyingBlock(this.x, this.y + this.offsetY, target, this.shapeType, isMiss));
                                this.phase = 'dead'; return false;"""

new_text = """                                const isMiss = Math.random() < 0.2;
                                gameState.flyingBlocks.push(new FlyingBlock(this.x, this.y + this.offsetY, target, this.shapeType, isMiss));
                                this.phase = 'dead'; 
                                this.hole.isBusy = false; // 飞走后，地洞立即可生成下一个
                                return false;"""

if old_text in content:
    content = content.replace(old_text, new_text)
    with open(path, 'w', encoding='utf-8') as f:
        f.write(content)
    print("Success")
else:
    print("Not found")
