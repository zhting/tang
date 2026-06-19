import sys

path = '/Users/zhting/Documents/积木游戏/index.html'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

old_text = """                this.legPhase += dt * 0.005; this.dirTimer += dt;
                if (this.dirTimer >= this.dirInterval) { this.dirTimer = 0; this.dirInterval = 2000 + Math.random() * 2000; this.dir = Math.random() * Math.PI * 2; }
                this.x += Math.cos(this.dir) * this.speed; this.y += Math.sin(this.dir) * this.speed;"""

new_text = """                this.legPhase += dt * 0.005; this.dirTimer += dt;
                if (this.dirTimer >= this.dirInterval) { this.dirTimer = 0; this.dirInterval = 2000 + Math.random() * 2000; this.dir = Math.random() * Math.PI * 2; }
                this.x += Math.cos(this.dir) * this.speed; this.y += Math.sin(this.dir) * this.speed;

                // 撞墙反弹
                if (this.x < 50 || this.x > (window.innerWidth || 800) - 50) this.dir = Math.PI - this.dir;
                if (this.y < (window.innerHeight || 600) * 0.65 || this.y > (window.innerHeight || 600) - 50) this.dir = -this.dir;

                // 尝试钻进附近的地洞
                for (const hole of gameState.moleHoles) {
                    if (!hole.isBusy && Math.sqrt((this.x - hole.x) ** 2 + (this.y - hole.y) ** 2) < 40) {
                        const newBlock = new MoleBlock(hole, this.shapeType, 1000, 2000);
                        gameState.moleBlocks.push(newBlock);
                        hole.isBusy = true;
                        return true; // 钻进去了，乱跑实体消失
                    }
                }"""

if old_text in content:
    content = content.replace(old_text, new_text)
    with open(path, 'w', encoding='utf-8') as f:
        f.write(content)
    print("Success")
else:
    print("Not found")
