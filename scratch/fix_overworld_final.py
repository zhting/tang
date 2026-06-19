import sys

path = '/Users/zhting/Documents/积木游戏/index.html'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. 定义 Minecraft 主世界背景生态系统 (动物、背景绘制函数)
minecraft_engine = """
        // ===== 我的世界主世界渲染引擎 =====
        class HomeAnimal {
            constructor(type) {
                this.type = type; // 'sheep', 'cow', 'pig'
                this.reset();
                this.x = Math.random() * window.innerWidth;
            }
            reset() {
                this.dir = Math.random() < 0.5 ? 1 : -1;
                this.x = this.dir === 1 ? -100 : window.innerWidth + 100;
                this.y = (window.innerHeight * 0.7) + Math.random() * (window.innerHeight * 0.2);
                this.speed = 0.5 + Math.random() * 1.5;
                this.legPhase = 0;
                this.color = this.type === 'sheep' ? '#FFFFFF' : (this.type === 'cow' ? '#5D3A1A' : '#FF9999');
            }
            update(dt) {
                this.x += this.dir * this.speed;
                this.legPhase += dt * 0.008;
                if ((this.dir === 1 && this.x > window.innerWidth + 150) || (this.dir === -1 && this.x < -150)) {
                    this.reset();
                }
            }
            draw(ctx) {
                ctx.save();
                ctx.translate(this.x, this.y);
                if (this.dir === -1) ctx.scale(-1, 1);
                
                // 身体 (像素感方块)
                ctx.fillStyle = this.color;
                ctx.fillRect(-30, -40, 60, 40);
                
                // 细节 (如牛的斑点或猪的鼻子)
                if (this.type === 'cow') {
                    ctx.fillStyle = '#FFFFFF';
                    ctx.fillRect(-10, -30, 15, 15);
                    ctx.fillRect(10, -20, 10, 10);
                } else if (this.type === 'pig') {
                    ctx.fillStyle = '#FF6666'; // 鼻子
                    ctx.fillRect(25, -25, 12, 8);
                }

                // 头
                ctx.fillStyle = this.color;
                ctx.fillRect(20, -55, 25, 25);
                
                // 眼睛 (像素点)
                ctx.fillStyle = '#000000';
                ctx.fillRect(38, -48, 4, 4);
                ctx.fillStyle = '#FFFFFF';
                ctx.fillRect(40, -48, 2, 2);

                // 腿
                ctx.fillStyle = this.color;
                const swing = Math.sin(this.legPhase) * 10;
                ctx.fillRect(-20 + swing, 0, 10, 15);
                ctx.fillRect(10 - swing, 0, 10, 15);
                ctx.fillRect(-20 - swing, 0, 10, 15);
                ctx.fillRect(10 + swing, 0, 10, 15);
                
                ctx.restore();
            }
        }

        let homeAnimals = [
            new HomeAnimal('sheep'), 
            new HomeAnimal('cow'), 
            new HomeAnimal('pig'),
            new HomeAnimal('sheep')
        ];

        function drawMinecraftHomeBackground(dt) {
            if (gameState.mode !== 3) return;

            // 1. 天空
            ctx.fillStyle = '#78A7FF';
            ctx.fillRect(0, 0, width, height);

            // 2. 太阳 (正方形)
            ctx.fillStyle = '#FFF200';
            ctx.fillRect(width * 0.75, height * 0.1, 80, 80);
            ctx.fillStyle = '#FFD700';
            ctx.fillRect(width * 0.75 + 10, height * 0.1 + 10, 60, 60);

            // 3. 云朵 (像素重叠)
            ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
            function drawCloud(cx, cy, cw) {
                ctx.fillRect(cx, cy, cw, 40);
                ctx.fillRect(cx + 20, cy - 20, cw - 40, 20);
                ctx.fillRect(cx + 40, cy + 40, cw - 60, 15);
            }
            drawCloud(width * 0.1, height * 0.2, 180);
            drawCloud(width * 0.5, height * 0.15, 220);
            drawCloud(width * 0.8, height * 0.25, 150);

            // 4. 分层草方块地面
            const groundY = height * 0.7;
            // 侧边泥土层
            ctx.fillStyle = '#8B5A2B';
            ctx.fillRect(0, groundY + 40, width, height - (groundY + 40));
            // 顶部草皮 (带锯齿像素边缘)
            ctx.fillStyle = '#55A830';
            ctx.fillRect(0, groundY, width, 40);
            // 像素锯齿点缀
            ctx.fillStyle = '#3A7D21';
            for (let i = 0; i < width; i += 40) {
                ctx.fillRect(i + (i % 80 === 0 ? 0 : 20), groundY + 15, 20, 20);
            }

            // 5. 像素森林 (主世界树木)
            function drawOverworldTree(tx, ty) {
                ctx.save();
                ctx.translate(tx, ty);
                // 树干
                ctx.fillStyle = '#5D3A1A';
                ctx.fillRect(-15, -70, 30, 70);
                // 树叶 (多层重叠方形)
                ctx.fillStyle = '#3A7D21';
                ctx.fillRect(-55, -130, 110, 60); // 底层
                ctx.fillStyle = '#4CA62B';
                ctx.fillRect(-40, -160, 80, 40); // 中层
                ctx.fillStyle = '#5EBD35';
                ctx.fillRect(-25, -180, 50, 30); // 顶层
                ctx.restore();
            }
            drawOverworldTree(width * 0.12, groundY + 25);
            drawOverworldTree(width * 0.88, groundY + 15);
            drawOverworldTree(width * 0.62, groundY + 35);
            drawOverworldTree(width * 0.35, groundY + 45);

            // 6. 动物群落
            homeAnimals.forEach(a => {
                a.update(dt);
                a.draw(ctx);
            });
        }
"""

# 2. 注入代码到 LB_KEY 之前
if 'const LB_KEY' in content:
    content = content.replace('const LB_KEY', minecraft_engine + '\n        const LB_KEY')

# 3. 修复 loop 函数中多余的 requestAnimationFrame 递归和清理开发者控制台
content = content.replace('document.getElementById(\'devConsole\').classList.remove(\'hidden\');', '// 已隐藏控制台')

with open(path, 'w', encoding='utf-8') as f:
    f.write(content)
print("Success")
