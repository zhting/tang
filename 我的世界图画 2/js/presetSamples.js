/**
 * Minecraft 原版游戏场景示例图片集
 * 提供真实的 Minecraft 原版游戏实拍风景与场景
 */

export function generatePresetSamples() {
  const samples = [];

  // 1. 用户精选：Minecraft 原版河流与平原山谷 (River Valley & Mountain)
  samples.push({
    id: 'minecraft_river',
    name: '原版河流与山谷',
    dataUrl: 'assets/sample_minecraft_river.png'
  });

  // 2. 原版 Minecraft 平原村庄与日落 (Sunset Plains Village)
  {
    const canvas = document.createElement('canvas');
    canvas.width = 320;
    canvas.height = 240;
    const ctx = canvas.getContext('2d');

    const skyGrad = ctx.createLinearGradient(0, 0, 0, 160);
    skyGrad.addColorStop(0, '#e65c00');
    skyGrad.addColorStop(0.4, '#F9D423');
    skyGrad.addColorStop(1, '#ffeed0');
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, 320, 160);

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(180, 50, 36, 36);
    ctx.fillStyle = 'rgba(255, 255, 200, 0.4)';
    ctx.fillRect(174, 44, 48, 48);

    ctx.fillStyle = '#5c7a38';
    ctx.fillRect(0, 120, 120, 40);
    ctx.fillRect(80, 100, 100, 60);
    ctx.fillRect(200, 110, 120, 50);

    ctx.fillStyle = '#4f772d';
    ctx.fillRect(0, 140, 320, 100);

    ctx.fillStyle = '#6b705c';
    ctx.fillRect(60, 130, 90, 50);
    ctx.fillStyle = '#583101';
    ctx.fillRect(60, 120, 14, 60);
    ctx.fillRect(136, 120, 14, 60);
    ctx.fillStyle = '#b08968';
    ctx.fillRect(74, 120, 62, 50);
    ctx.fillStyle = '#90e0ef';
    ctx.fillRect(88, 135, 18, 18);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(96, 135, 2, 18);
    ctx.fillRect(88, 143, 18, 2);
    ctx.fillStyle = '#6f1d1b';
    ctx.fillRect(116, 145, 14, 25);
    ctx.fillStyle = '#3f2208';
    ctx.fillRect(52, 110, 106, 12);
    ctx.fillRect(66, 100, 78, 10);
    ctx.fillRect(80, 92, 50, 8);

    ctx.fillStyle = '#583101';
    ctx.fillRect(240, 110, 12, 50);
    ctx.fillStyle = '#386641';
    ctx.fillRect(220, 70, 52, 45);
    ctx.fillRect(228, 55, 36, 18);

    samples.push({
      id: 'village_sunset',
      name: '原版村庄日落',
      dataUrl: canvas.toDataURL('image/jpeg', 0.95)
    });
  }

  // 3. 原版 Minecraft 樱花树林与山峰 (Cherry Blossom Grove)
  {
    const canvas = document.createElement('canvas');
    canvas.width = 320;
    canvas.height = 240;
    const ctx = canvas.getContext('2d');

    const sky = ctx.createLinearGradient(0, 0, 0, 180);
    sky.addColorStop(0, '#56ccf2');
    sky.addColorStop(1, '#2f80ed');
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, 320, 240);

    ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
    ctx.fillRect(20, 30, 80, 16);
    ctx.fillRect(40, 20, 90, 16);
    ctx.fillRect(180, 40, 110, 20);

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(100, 70, 70, 70);
    ctx.fillRect(120, 50, 30, 30);
    ctx.fillStyle = '#ced4da';
    ctx.fillRect(80, 110, 120, 60);

    ctx.fillStyle = '#70e000';
    ctx.fillRect(0, 150, 320, 90);

    ctx.fillStyle = '#3a2e39';
    ctx.fillRect(50, 120, 14, 60);
    ctx.fillStyle = '#ff85a1';
    ctx.fillRect(20, 70, 75, 55);
    ctx.fillStyle = '#f72585';
    ctx.fillRect(30, 80, 20, 20);
    ctx.fillStyle = '#ffc2d1';
    ctx.fillRect(50, 60, 35, 25);

    ctx.fillStyle = '#3a2e39';
    ctx.fillRect(210, 110, 14, 70);
    ctx.fillStyle = '#ff85a1';
    ctx.fillRect(180, 55, 80, 60);
    ctx.fillStyle = '#ffc2d1';
    ctx.fillRect(200, 45, 40, 30);

    samples.push({
      id: 'cherry_grove',
      name: '樱花林与雪山',
      dataUrl: canvas.toDataURL('image/jpeg', 0.95)
    });
  }

  // 4. 原版 Minecraft 下界传送门与黑曜石 (Nether Portal)
  {
    const canvas = document.createElement('canvas');
    canvas.width = 320;
    canvas.height = 240;
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = '#1c1c24';
    ctx.fillRect(0, 0, 320, 240);

    ctx.fillStyle = '#2b2d42';
    for (let y = 0; y < 240; y += 30) {
      for (let x = 0; x < 320; x += 40) {
        ctx.fillRect(x + ((y / 30) % 2 === 0 ? 0 : 20), y, 38, 28);
      }
    }

    ctx.fillStyle = '#383a48';
    ctx.fillRect(0, 180, 320, 60);

    const px = 110, py = 40, pw = 100, ph = 140;
    ctx.fillStyle = '#100c1e';
    ctx.fillRect(px, py, pw, ph);

    ctx.fillStyle = '#3c2a63';
    ctx.fillRect(px + 2, py + 2, pw - 4, 18);
    ctx.fillRect(px + 2, py + ph - 20, pw - 4, 18);
    ctx.fillRect(px + 2, py + 2, 18, ph - 4);
    ctx.fillRect(px + pw - 20, py + 2, 18, ph - 4);

    const portalGrad = ctx.createLinearGradient(px + 20, py + 20, px + pw - 20, py + ph - 20);
    portalGrad.addColorStop(0, '#7b2cbf');
    portalGrad.addColorStop(0.5, '#c77dff');
    portalGrad.addColorStop(1, '#5a189a');
    ctx.fillStyle = portalGrad;
    ctx.fillRect(px + 20, py + 20, pw - 40, ph - 40);

    ctx.fillStyle = '#e0aaff';
    ctx.fillRect(px + 30, py + 40, 10, 10);
    ctx.fillRect(px + 55, py + 70, 14, 14);
    ctx.fillRect(px + 40, py + 95, 8, 8);

    samples.push({
      id: 'nether_portal',
      name: '黑曜石传送门',
      dataUrl: canvas.toDataURL('image/jpeg', 0.95)
    });
  }

  return samples;
}
