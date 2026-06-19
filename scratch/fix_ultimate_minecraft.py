import sys

path = '/Users/zhting/Documents/积木游戏/index.html'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. 定义 Minecraft 正宗像素贴图引擎
minecraft_authentic_engine = """
        // ===== 我的世界：正宗 16x16 像素引擎 =====
        const MC_ASSETS = {
            // 草方块顶部纹理 (16x16 索引图)
            GRASS: [
                "0000000000000000", "0111111111111110", "0112211112211110", "0122221122221110",
                "0112211112211110", "0111110011111110", "0111100001111110", "0111110011111110",
                "0001111111110000", "0111111111111110", "0112211112211110", "0122221122221110",
                "0112211112211110", "0111111111111110", "0111111111111110", "0000000000000000"
            ],
            // 泥土纹理
            DIRT: [
                "3334333333353333", "3444433335555333", "3344333333553333", "3333334433333333",
                "3333344443333333", "3333334433333333", "3355333333443333", "3555533334444333",
                "3355333333443333", "3333333333333333", "3334333333353333", "3444433335555333",
                "3344333333553333", "3333334433333333", "3333344443333333", "3333333333333333"
            ],
            PALETTE: {
                '0': '#79C05A', '1': '#599044', '2': '#96D677', // 草
                '3': '#79553A', '4': '#5D4037', '5': '#8D6E63', // 泥土
                '6': '#5D3A1A', '7': '#3A2411', '8': '#7D512E', // 原木
                '9': '#3A7D21', 'A': '#2D6119', 'B': '#4CA62B'  // 叶子
            }
        };

        function drawPixelBlock(ctx, x, y, size, type) {
            const map = MC_ASSETS[type];
            if (!map) return;
            const pSize = size / 16;
            for (let r = 0; r < 16; r++) {
                for (let c = 0; c < 16; c++) {
                    const colorIdx = map[r][c];
                    ctx.fillStyle = MC_ASSETS.PALETTE[colorIdx];
                    ctx.fillRect(x + c * pSize, y + r * pSize, pSize + 0.5, pSize + 0.5);
                }
            }
        }

        class HomeAnimal {
            constructor(type) {
                this.type = type; // 'pig', 'sheep'
                this.reset();
                this.x = Math.random() * window.innerWidth;
            }
            reset() {
                this.dir = Math.random() < 0.5 ? 1 : -1;
                this.x = this.dir === 1 ? -150 : window.innerWidth + 150;
                this.y = (window.innerHeight * 0.7) + Math.random() * (window.innerHeight * 0.15);
                this.speed = 0.5 + Math.random() * 1.0;
                this.legPhase = 0;
            }
            update(dt) {
                this.x += this.dir * this.speed;
                this.legPhase += dt * 0.01;
                if ((this.dir === 1 && this.x > window.innerWidth + 200) || (this.dir === -1 && this.x < -200)) this.reset();
            }
            draw(ctx) {
                ctx.save();
                ctx.translate(this.x, this.y);
                if (this.dir === -1) ctx.scale(-1, 1);
                
                // 身体 (正宗方块感)
                ctx.fillStyle = this.type === 'pig' ? '#FF9999' : '#FFFFFF';
                ctx.fillRect(-35, -45, 70, 45);
                
                // 头部 (Minecraft 特有的长方体头)
                ctx.fillRect(35, -60, 30, 30);
                
                // 眼睛
                ctx.fillStyle = '#000000';
                ctx.fillRect(55, -52, 6, 6);
                ctx.fillStyle = '#FFFFFF';
                ctx.fillRect(58, -52, 3, 3);

                // 猪鼻子
                if (this.type === 'pig') {
                    ctx.fillStyle = '#FF6666';
                    ctx.fillRect(65, -42, 10, 10);
                    ctx.fillStyle = '#CC4444';
                    ctx.fillRect(72, -38, 2, 2);
                    ctx.fillRect(68, -38, 2, 2);
                }

                // 腿
                const s = Math.sin(this.legPhase) * 12;
                ctx.fillStyle = this.type === 'pig' ? '#FF9999' : '#FFFFFF';
                ctx.fillRect(-25 + s, 0, 12, 18);
                ctx.fillRect(15 - s, 0, 12, 18);
                ctx.restore();
            }
        }

        let homeAnimals = [new HomeAnimal('pig'), new HomeAnimal('sheep'), new HomeAnimal('sheep')];

        function drawMinecraftHomeBackground(dt) {
            if (gameState.mode !== 3) return;

            // 1. 天空
            ctx.fillStyle = '#78A7FF';
            ctx.fillRect(0, 0, width, height);

            // 2. 正方形太阳
            ctx.fillStyle = '#FFF200';
            ctx.fillRect(width * 0.8, 60, 100, 100);

            // 3. 云
            ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
            ctx.fillRect(100, 100, 200, 50);
            ctx.fillRect(140, 80, 120, 30);

            // 4. 正宗方块地面
            const blockSize = 64;
            const groundY = height * 0.7;
            for (let x = 0; x < width + blockSize; x += blockSize) {
                // 顶层草
                drawPixelBlock(ctx, x, groundY, blockSize, 'GRASS');
                // 下层泥土
                for (let y = groundY + blockSize; y < height + blockSize; y += blockSize) {
                    drawPixelBlock(ctx, x, y, blockSize, 'DIRT');
                }
            }

            // 5. 生物
            homeAnimals.forEach(a => { a.update(dt); a.draw(ctx); });
        }
"""

# 2. 注入到文件
if 'const LB_KEY' in content:
    content = content.replace('const LB_KEY', minecraft_engine + '\n        const LB_KEY')
    # 替换之前的占位符版本（如果有）
    content = content.replace('drawMinecraftHomeBackground(dt);', 'drawMinecraftHomeBackground(dt);')

with open(path, 'w', encoding='utf-8') as f:
    f.write(content)
print("Success")
