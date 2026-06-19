import sys

path = '/Users/zhting/Documents/积木游戏/index.html'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. 修复 RunningBlock 掉落导致失踪的问题
old_running = """                if (this.state === 'falling') { this.spawnAnim = Math.max(0, this.spawnAnim - dt * 0.005); this.y += dt * 0.1; return this.spawnAnim <= 0; }"""
new_running = """                if (this.state === 'falling') { 
                    // 以前是掉进深处消失，现在改为强行重置到一个空闲地洞
                    for (const hole of gameState.moleHoles) {
                        if (!hole.isBusy) {
                            const newBlock = new MoleBlock(hole, this.shapeType, 500, 2000);
                            gameState.moleBlocks.push(newBlock);
                            hole.isBusy = true;
                            return true; // 乱跑实体消失，转化为钻地积木
                        }
                    }
                    // 如果实在没空位，就在原地继续跑，不要消失
                    this.state = 'running';
                    this.dir = Math.random() * Math.PI * 2;
                    return false;
                }"""

# 2. 修复 FlyingBlock 进洞失败导致失踪的问题
old_flying = """                        } else {
                            // 如果目标洞刚好有人，就随机找个空闲洞钻进去，或者干脆变身乱跑
                            gameState.runningBlocks.push(new RunningBlock(this.x, this.y, this.shapeType));
                        }"""
new_flying = """                        } else {
                            // 如果目标洞忙，尝试找任何一个空洞
                            let found = false;
                            for (const h of gameState.moleHoles) {
                                if (!h.isBusy) {
                                    const nb = new MoleBlock(h, this.shapeType, 500, 2000);
                                    gameState.moleBlocks.push(nb);
                                    h.isBusy = true;
                                    found = true; break;
                                }
                            }
                            if (!found) {
                                // 实在没洞，变身乱跑，确保积木还在场上
                                gameState.runningBlocks.push(new RunningBlock(this.x, this.y, this.shapeType));
                            }
                        }"""

# 3. 增加“积木失踪补偿”安全网 (在 loopMode2 中)
old_loop = """            for (const hole of gameState.moleHoles) {
                hole.update(dt, blockSpeed); // 新增：由地洞控制生成
                hole.drawBack(ctx);
            }"""
new_loop = """            // 安全检查：如果场上活跃积木 + 已抓获积木 < 总量，说明有积木逻辑丢失了，强制补发
            const activeCount = gameState.moleBlocks.length + gameState.flyingBlocks.length + gameState.runningBlocks.length;
            if (activeCount + gameState.currentLevelCollected < gameState.targetCount && gameState.spawnedCount >= gameState.targetCount) {
                // 发现漏网之鱼，重置生成计数允许补发
                gameState.spawnedCount = gameState.targetCount - (activeCount + gameState.currentLevelCollected);
            }

            for (const hole of gameState.moleHoles) {
                hole.update(dt, blockSpeed);
                hole.drawBack(ctx);
            }"""

if old_running in content:
    content = content.replace(old_running, new_running)
if old_flying in content:
    content = content.replace(old_flying, new_flying)
if old_loop in content:
    content = content.replace(old_loop, new_loop)

with open(path, 'w', encoding='utf-8') as f:
    f.write(content)
print("Success")
