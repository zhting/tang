import sys

path = '/Users/zhting/Documents/积木游戏/index.html'
with open(path, 'r', encoding='utf-8') as f:
    lines = f.readlines()

# The gap is between line 1670 (index 1669) and 1674 (index 1673)
# We want to replace lines 1671, 1672, 1673 (indices 1670, 1671, 1672)

missing_code = """
            for (let i = 0; i < n; i++) gameState.shapes.push(new Shape(i, n));
            const el = document.getElementById('levelIndicator');
            el.textContent = `第 ${n} 关：寻找 ${n} 个积木`;
            el.classList.add('show');
            setTimeout(() => el.classList.remove('show'), 3000);
            updateUI();
        }

        function loopMode1(t, dt) {
            if (gameState.track) gameState.track.draw(ctx, t);
            gameState.hidingSpots.forEach(spot => {
                if (spot.type === 'cloud' && spot.isRaining) {
                    if (spot.lastRainDrop === 0) spot.lastRainDrop = t;
                    if (t - spot.lastRainDrop >= 5000) {
                        spot.lastRainDrop = t;
                        gameState.shapes.forEach(s => {
                            if (s.hidingSpotId === spot.id && !s.isCollected && s.state === 'hiding') {
                                s.isHidden = false; s.popOut(); setTimeout(() => collectShape(s), 100);
                            }
                        });
                    }
                }
            });
            gameState.hidingSpots.forEach(s => s.update(t));
            gameState.shapes.forEach(s => {
                if (s.state === 'hiding' && s.hidingSpotId !== null) {
                    const sp = gameState.hidingSpots.find(spot => spot.id === s.hidingSpotId);
                    if (sp) { s.x = sp.x + sp.animOffsetX + sp.w / 2 + s.relativeX; s.y = sp.y + (sp.type === 'tree' ? -20 : sp.h / 2) + s.relativeY; }
                }
            });
            gameState.shapes.filter(s => s.state === 'hiding' && !s.isApple).forEach(s => s.draw(ctx));
            gameState.hidingSpots.forEach(s => s.draw(ctx));
            gameState.shapes.filter(s => s.state === 'hiding' && s.isApple).forEach(s => s.draw(ctx));
            for (let i = gameState.shapes.length - 1; i >= 0; i--) {
                const s = gameState.shapes[i];
                const fin = s.update(dt);
                if (!fin && s.state !== 'hiding') s.draw(ctx);
                if (fin) gameState.shapes.splice(i, 1);
            }
        }

        // ===== 模式二：疯狂地鼠 =====
        class MoleHole {
            constructor(id, x, y) { this.id = id; this.x = x; this.y = y; this.w = 110; this.h = 40; }
            drawBack(ctx) {
                ctx.save(); ctx.translate(this.x, this.y);
                ctx.fillStyle = currentTheme.colors.HOLE || '#3E2723';
                ctx.beginPath(); ctx.ellipse(0, 0, this.w / 2, this.h / 2, 0, 0, Math.PI * 2); ctx.fill(); ctx.restore();
            }
            drawFront(ctx) {}
            contains(px, py) { return Math.sqrt((px - this.x) ** 2 + (py - this.y) ** 2) < this.w / 2 + 20; }
        }

        class MoleBlock {
            constructor(hole, shapeType, delay, speed) {
                this.hole = hole; this.shapeType = shapeType; this.size = 30; this.x = hole.x; this.y = hole.y;
                this.isUp = false; this.isCollected = false; this.collectAnim = 0;
                this.phase = 'waiting'; this.timer = delay;
                this.upDuration = speed || 2000; this.downDuration = speed || 2000;
                this.riseSpeed = 0.08; this.offsetY = 0; this.maxOffset = -45; this.rotation = 0;
            }
            update(dt) {
                if (this.phase === 'dead') return true;
                if (this.isCollected) {
                    this.x += (basketPos.x - this.x) * 0.2; this.y += (basketPos.y - this.y) * 0.2;
                    this.collectAnim += dt * 0.003; return this.collectAnim > 1;
                }
                this.timer -= dt; if (this.timer > 0) return;
                if (this.phase === 'waiting') { if (this.timer === -1) return; this.phase = 'rising'; }
                if (this.phase === 'rising') {
                    this.offsetY += this.maxOffset * this.riseSpeed; this.rotation += 0.05;
                    if (this.offsetY <= this.maxOffset) {
                        this.offsetY = this.maxOffset; this.phase = 'up'; this.timer = this.upDuration; this.isUp = true;
                        if (gameState.moleHoles && gameState.moleHoles.length > 1) {
                            const roll = Math.random();
                            if (roll < 0.1) {
                                const target = gameState.moleHoles.filter(h => h.id !== this.hole.id)[Math.floor(Math.random() * (gameState.moleHoles.length - 1))];
                                gameState.flyingBlocks.push(new FlyingBlock(this.x, this.y + this.offsetY, target, this.shapeType));
                                this.phase = 'dead'; return false;
                            } else if (roll < 0.13) {
                                this.isUp = false; this.phase = 'dead';
                                gameState.runningBlocks.push(new RunningBlock(this.x, this.y + this.offsetY, this.shapeType));
                            }
                        }
                    }
                } else if (this.phase === 'up') { if (this.timer <= 0) { this.phase = 'falling'; this.isUp = false; }
                } else if (this.phase === 'falling') {
                    this.offsetY -= this.maxOffset * this.riseSpeed; this.rotation -= 0.05;
                    if (this.offsetY >= 0) {
                        this.offsetY = 0; this.phase = 'waiting'; this.timer = this.downDuration;
                        const next = gameState.moleBlocks.find(b => b.hole === this.hole && b !== this && b.phase === 'waiting' && b.timer === -1);
                        if (next) next.timer = 500 + Math.random() * 1000;
                    }
                }
                return false;
            }
            draw(ctx) {
                if (this.isCollected) {
                    ctx.save(); ctx.globalAlpha = 1 - this.collectAnim; ctx.translate(this.x, this.y);
                    const s = 1 - this.collectAnim * 0.7; ctx.scale(s, s); this.drawShape(ctx); ctx.restore(); return;
                }
                if (this.offsetY >= -2 && this.phase !== 'rising') return;
                ctx.save(); ctx.translate(this.x, this.y + this.offsetY); ctx.rotate(this.rotation); this.drawShape(ctx); ctx.restore();
            }
            drawShape(ctx) {
                ctx.fillStyle = this.shapeType === 0 ? currentTheme.colors.SQUARE : (this.shapeType === 1 ? currentTheme.colors.CIRCLE : currentTheme.colors.TRIANGLE);
                const s = this.size;
                if (this.shapeType === 0) ctx.fillRect(-s / 2, -s / 2, s, s);
                else if (this.shapeType === 1) { ctx.beginPath(); ctx.arc(0, 0, s / 2, 0, Math.PI * 2); ctx.fill(); }
                else { ctx.beginPath(); const h = (Math.sqrt(3) / 2) * s; ctx.moveTo(0, -h / 2); ctx.lineTo(s / 2, h / 2); ctx.lineTo(-s / 2, h / 2); ctx.fill(); }
            }
            hitTest(px, py) {
                if (!this.isUp || this.isCollected) return false;
                return Math.sqrt((px - this.x) ** 2 + (py - (this.y + this.offsetY)) ** 2) < this.size;
            }
        }

        class FlyingBlock {
            constructor(x, y, targetHole, shapeType) {
                this.startX = x; this.startY = y; this.x = x; this.y = y; this.targetHole = targetHole; this.shapeType = shapeType;
                this.progress = 0; this.duration = 1000 + Math.random() * 500; this.peakHeight = 100 + Math.random() * 50;
                this.isCollected = false; this.collectAnim = 0; this.size = 30; this.rotation = 0;
            }
            update(dt) {
                if (this.isCollected) {
                    this.x += (basketPos.x - this.x) * 0.2; this.y += (basketPos.y - this.y) * 0.2;
                    this.collectAnim += dt * 0.005; return this.collectAnim > 1;
                }
                this.progress += dt / this.duration;
                if (this.progress >= 1) {
                    const next = gameState.moleBlocks.find(b => b.hole === this.targetHole && b.phase === 'waiting');
                    if (next) { next.timer = 0; next.phase = 'rising'; next.offsetY = 0; }
                    return true;
                }
                const t = this.progress;
                this.x = this.startX + (this.targetHole.x - this.startX) * t;
                this.y = (this.startY + (this.targetHole.y - this.startY) * t) - Math.sin(t * Math.PI) * this.peakHeight;
                this.rotation += dt * 0.01; return false;
            }
            draw(ctx) {
                ctx.save(); ctx.translate(this.x, this.y); ctx.rotate(this.rotation);
                if (this.isCollected) ctx.scale(1 - this.collectAnim, 1 - this.collectAnim);
                ctx.fillStyle = this.shapeType === 0 ? currentTheme.colors.SQUARE : (this.shapeType === 1 ? currentTheme.colors.CIRCLE : currentTheme.colors.TRIANGLE);
                const s = this.size;
                if (this.shapeType === 0) ctx.fillRect(-s / 2, -s / 2, s, s);
                else if (this.shapeType === 1) { ctx.beginPath(); ctx.arc(0, 0, s / 2, 0, Math.PI * 2); ctx.fill(); }
                else { ctx.beginPath(); const h = (Math.sqrt(3) / 2) * s; ctx.moveTo(0, -h / 2); ctx.lineTo(s / 2, h / 2); ctx.lineTo(-s / 2, h / 2); ctx.fill(); }
                ctx.restore();
            }
            hitTest(px, py) { return !this.isCollected && Math.sqrt((px - this.x) ** 2 + (py - this.y) ** 2) < this.size; }
        }

        class RunningBlock {
            constructor(x, y, shapeType) {
                this.x = x; this.y = y; this.shapeType = shapeType; this.size = 28; this.isCollected = false; this.collectAnim = 0;
                this.rotation = 0; this.legPhase = Math.random() * Math.PI * 2; this.speed = 1.2 + Math.random() * 1.0;
                this.hopY = 0; this.dir = Math.random() * Math.PI * 2; this.dirTimer = 0; this.dirInterval = 2000 + Math.random() * 2000;
                this.spawnAnim = 0; this.state = 'running'; this.staggerTimer = 0; this.targetHole = null;
            }
            update(dt) {
                if (this.isCollected) {
                    this.x += (basketPos.x - this.x) * 0.2; this.y += (basketPos.y - this.y) * 0.2;
                    this.collectAnim += dt * 0.004; return this.collectAnim > 1;
                }
                if (this.state === 'falling') { this.spawnAnim = Math.max(0, this.spawnAnim - dt * 0.005); this.y += dt * 0.1; return this.spawnAnim <= 0; }
                if (this.spawnAnim < 1) this.spawnAnim = Math.min(1, this.spawnAnim + dt * 0.003);
                if (this.state === 'staggering') {
                    this.staggerTimer -= dt; this.rotation = Math.sin(Date.now() * 0.02) * 0.4;
                    if (this.staggerTimer <= 0) {
                        if (Math.random() < 0.5) this.state = 'falling';
                        else { this.state = 'running'; this.dir = Math.random() * Math.PI * 2; this.x += Math.cos(this.dir) * 40; this.y += Math.sin(this.dir) * 40; }
                    }
                    return false;
                }
                this.legPhase += dt * 0.005; this.dirTimer += dt;
                if (this.dirTimer >= this.dirInterval) { this.dirTimer = 0; this.dirInterval = 2000 + Math.random() * 2000; this.dir = Math.random() * Math.PI * 2; }
                this.x += Math.cos(this.dir) * this.speed; this.y += Math.sin(this.dir) * this.speed;
                this.rotation = Math.sin(this.legPhase) * 0.08; this.hopY = Math.abs(Math.sin(this.legPhase * 2)) * 3;
                const margin = 40; const skyLine = height * 0.65;
                if (this.x < margin) { this.x = margin; this.dir = Math.PI - this.dir; }
                if (this.x > width - margin) { this.x = width - margin; this.dir = Math.PI - this.dir; }
                if (this.y < skyLine) { this.y = skyLine; this.dir = Math.abs(this.dir); }
                if (this.y > height - margin) { this.y = height - margin; this.dir = -Math.abs(this.dir); }
                if (gameState.moleHoles) {
                    for (const hole of gameState.moleHoles) {
                        if (Math.sqrt((this.x - hole.x)**2 + (this.y - hole.y)**2) < 30) {
                            this.state = 'staggering'; this.staggerTimer = 1000 + Math.random() * 1000; this.targetHole = hole; break;
                        }
                    }
                }
                return false;
            }
"""

new_lines = lines[:1670] + [missing_code] + lines[1673:]

with open(path, 'w', encoding='utf-8') as f:
    f.writelines(new_lines)
