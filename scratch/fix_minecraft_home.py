import sys

path = '/Users/zhting/Documents/积木游戏/index.html'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

old_loop_start = """        function loop(t) {
            if (!gameState.isPlaying) return;
            const dt = t - gameState.lastTime; gameState.lastTime = t;"""

new_loop_start = """        function loop(t) {
            const dt = t - gameState.lastTime; gameState.lastTime = t;
            if (dt > 1000) { requestAnimationFrame(loop); return; }

            if (!gameState.isPlaying) {
                // 首页背景渲染
                drawMinecraftHomeBackground(dt);
                requestAnimationFrame(loop);
                return;
            }"""

old_loop_end = """            ctx.clearRect(0, 0, width, height);
            drawScene();
            requestAnimationFrame(loop);
        }"""

new_loop_end = """            ctx.clearRect(0, 0, width, height);
            drawScene();
            requestAnimationFrame(loop);
        }

        function drawMinecraftHomeBackground(dt) {
            ctx.clearRect(0, 0, width, height);
            
            // 天空 (Minecraft 蓝)
            ctx.fillStyle = '#78A7FF';
            ctx.fillRect(0, 0, width, height);
            
            // 云朵 (方形像素感)
            ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
            ctx.fillRect(width * 0.1, height * 0.1, 150, 40);
            ctx.fillRect(width * 0.5, height * 0.2, 200, 50);
            ctx.fillRect(width * 0.8, height * 0.15, 120, 30);

            // 地面 (草地+泥土)
            const groundY = height * 0.7;
            ctx.fillStyle = '#55A830'; // 草
            ctx.fillRect(0, groundY, width, height - groundY);
            ctx.fillStyle = '#8B5A2B'; // 泥土
            ctx.fillRect(0, groundY + 40, width, height - (groundY + 40));

            // 画树 (Minecraft 风格)
            function drawTree(tx, ty) {
                ctx.save();
                ctx.translate(tx, ty);
                // 树干
                ctx.fillStyle = '#5D3A1A';
                ctx.fillRect(-15, -60, 30, 60);
                // 树叶 (方形叠加)
                ctx.fillStyle = '#3A7D21';
                ctx.fillRect(-50, -120, 100, 60);
                ctx.fillRect(-35, -150, 70, 30);
                ctx.restore();
            }
            drawTree(width * 0.15, groundY + 20);
            drawTree(width * 0.85, groundY + 10);
            drawTree(width * 0.55, groundY + 40);

            // 画羊
            homeSheeps.forEach(s => {
                s.update(dt);
                s.draw(ctx);
            });
        }"""

if old_loop_start in content:
    content = content.replace(old_loop_start, new_loop_start)
if old_loop_end in content:
    content = content.replace(old_loop_end, new_loop_end)

with open(path, 'w', encoding='utf-8') as f:
    f.write(content)
print("Success")
