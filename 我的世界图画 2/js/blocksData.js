/**
 * Minecraft 方块数据库与调色板定义
 * 包含羊毛、混凝土、陶瓦、矿石、水、草方块等丰富原版方块
 */

export const MC_BLOCKS = [
  // === 水与天空专属纯正蓝色系 ===
  { id: 'water', name: '静止水', enName: 'Water', rgb: [47, 107, 230], group: 'water', textureType: 'water' },
  { id: 'lapis_block', name: '青金石块', enName: 'Lapis Lazuli Block', rgb: [30, 67, 140], group: 'ore', textureType: 'ore_grain' },
  { id: 'blue_concrete', name: '蓝色混凝土', enName: 'Blue Concrete', rgb: [44, 46, 143], group: 'concrete', textureType: 'smooth' },
  { id: 'light_blue_concrete', name: '浅蓝色混凝土', enName: 'Light Blue Concrete', rgb: [36, 137, 199], group: 'concrete', textureType: 'smooth' },
  { id: 'cyan_concrete', name: '青色混凝土', enName: 'Cyan Concrete', rgb: [21, 119, 136], group: 'concrete', textureType: 'smooth' },
  { id: 'light_blue_wool', name: '浅蓝色羊毛', enName: 'Light Blue Wool', rgb: [58, 175, 217], group: 'wool', textureType: 'wool' },
  { id: 'blue_wool', name: '蓝色羊毛', enName: 'Blue Wool', rgb: [53, 57, 157], group: 'wool', textureType: 'wool' },
  { id: 'cyan_wool', name: '青色羊毛', enName: 'Cyan Wool', rgb: [21, 137, 145], group: 'wool', textureType: 'wool' },
  { id: 'diamond_block', name: '钻石块', enName: 'Block of Diamond', rgb: [98, 237, 228], group: 'ore', textureType: 'gem' },

  // === 草地、森林与植物翠绿色系 ===
  { id: 'grass_block', name: '草方块', enName: 'Grass Block', rgb: [90, 168, 50], group: 'nature', textureType: 'grass' },
  { id: 'lime_concrete', name: '黄绿色混凝土', enName: 'Lime Concrete', rgb: [94, 169, 25], group: 'concrete', textureType: 'smooth' },
  { id: 'green_concrete', name: '绿色混凝土', enName: 'Green Concrete', rgb: [73, 91, 36], group: 'concrete', textureType: 'smooth' },
  { id: 'lime_wool', name: '黄绿色羊毛', enName: 'Lime Wool', rgb: [112, 185, 26], group: 'wool', textureType: 'wool' },
  { id: 'green_wool', name: '绿色羊毛', enName: 'Green Wool', rgb: [85, 109, 27], group: 'wool', textureType: 'wool' },
  { id: 'oak_leaves', name: '橡树树叶', enName: 'Oak Leaves', rgb: [56, 102, 35], group: 'nature', textureType: 'leaves' },
  { id: 'emerald_block', name: '绿宝石块', enName: 'Block of Emerald', rgb: [42, 203, 88], group: 'ore', textureType: 'gem' },

  // === 阳光、花朵与金色系 ===
  { id: 'yellow_concrete', name: '黄色混凝土', enName: 'Yellow Concrete', rgb: [241, 175, 21], group: 'concrete', textureType: 'smooth' },
  { id: 'yellow_wool', name: '黄色羊毛', enName: 'Yellow Wool', rgb: [248, 198, 39], group: 'wool', textureType: 'wool' },
  { id: 'gold_block', name: '金块', enName: 'Block of Gold', rgb: [245, 205, 48], group: 'ore', textureType: 'metallic' },
  { id: 'dandelion', name: '蒲公英黄', enName: 'Yellow Dandelion', rgb: [255, 236, 60], group: 'nature', textureType: 'smooth' },

  // === 泥土、木板与山体大地色系 ===
  { id: 'dirt', name: '泥土', enName: 'Dirt', rgb: [134, 96, 67], group: 'nature', textureType: 'dirt' },
  { id: 'oak_planks', name: '橡木木板', enName: 'Oak Planks', rgb: [162, 130, 78], group: 'wood', textureType: 'planks' },
  { id: 'spruce_planks', name: '云杉木板', enName: 'Spruce Planks', rgb: [114, 84, 48], group: 'wood', textureType: 'planks' },
  { id: 'birch_planks', name: '白桦木板', enName: 'Birch Planks', rgb: [196, 179, 123], group: 'wood', textureType: 'planks' },
  { id: 'sand', name: '沙子', enName: 'Sand', rgb: [219, 207, 161], group: 'nature', textureType: 'sand' },
  { id: 'terracotta', name: '陶瓦', enName: 'Terracotta', rgb: [152, 94, 67], group: 'terracotta', textureType: 'grain' },
  { id: 'brown_concrete', name: '棕色混凝土', enName: 'Brown Concrete', rgb: [96, 60, 32], group: 'concrete', textureType: 'smooth' },
  { id: 'brown_wool', name: '棕色羊毛', enName: 'Brown Wool', rgb: [114, 71, 40], group: 'wool', textureType: 'wool' },

  // === 石头、石砖与山脉灰色系 ===
  { id: 'stone', name: '石头', enName: 'Stone', rgb: [125, 125, 125], group: 'stone', textureType: 'stone' },
  { id: 'cobblestone', name: '圆石', enName: 'Cobblestone', rgb: [99, 99, 99], group: 'stone', textureType: 'cobble' },
  { id: 'stone_bricks', name: '石砖', enName: 'Stone Bricks', rgb: [120, 120, 120], group: 'stone', textureType: 'bricks' },
  { id: 'gray_concrete', name: '灰色混凝土', enName: 'Gray Concrete', rgb: [54, 57, 61], group: 'concrete', textureType: 'smooth' },
  { id: 'light_gray_concrete', name: '浅灰色混凝土', enName: 'Light Gray Concrete', rgb: [125, 125, 115], group: 'concrete', textureType: 'smooth' },
  { id: 'white_concrete', name: '白色混凝土', enName: 'White Concrete', rgb: [207, 213, 214], group: 'concrete', textureType: 'smooth' },
  { id: 'white_wool', name: '白色羊毛', enName: 'White Wool', rgb: [234, 236, 237], group: 'wool', textureType: 'wool' },
  { id: 'black_concrete', name: '黑色混凝土', enName: 'Black Concrete', rgb: [8, 10, 15], group: 'concrete', textureType: 'smooth' },
  { id: 'black_wool', name: '黑色羊毛', enName: 'Black Wool', rgb: [20, 21, 25], group: 'wool', textureType: 'wool' },

  // === 红色小花与暖色系 ===
  { id: 'poppy_red', name: '虞美人红', enName: 'Poppy Red', rgb: [220, 30, 30], group: 'nature', textureType: 'smooth' },
  { id: 'red_concrete', name: '红色混凝土', enName: 'Red Concrete', rgb: [142, 33, 33], group: 'concrete', textureType: 'smooth' },
  { id: 'red_wool', name: '红色羊毛', enName: 'Red Wool', rgb: [161, 39, 35], group: 'wool', textureType: 'wool' },
  { id: 'orange_concrete', name: '橙色混凝土', enName: 'Orange Concrete', rgb: [224, 97, 1], group: 'concrete', textureType: 'smooth' },
  { id: 'pink_concrete', name: '粉红色混凝土', enName: 'Pink Concrete', rgb: [214, 101, 143], group: 'concrete', textureType: 'smooth' }
];

// RGB 转 CIELAB
export function rgbToLab([r, g, b]) {
  let rL = r / 255;
  let gL = g / 255;
  let bL = b / 255;

  rL = rL > 0.04045 ? Math.pow((rL + 0.055) / 1.055, 2.4) : rL / 12.92;
  gL = gL > 0.04045 ? Math.pow((gL + 0.055) / 1.055, 2.4) : gL / 12.92;
  bL = bL > 0.04045 ? Math.pow((bL + 0.055) / 1.055, 2.4) : bL / 12.92;

  let x = (rL * 0.4124 + gL * 0.3576 + bL * 0.1805) / 0.95047;
  let y = (rL * 0.2126 + gL * 0.7152 + bL * 0.0722) / 1.00000;
  let z = (rL * 0.0193 + gL * 0.1192 + bL * 0.9505) / 1.08883;

  const f = (t) => t > 0.008856 ? Math.cbrt(t) : 7.787 * t + 16 / 116;
  let fx = f(x), fy = f(y), fz = f(z);

  return [
    116 * fy - 16,
    500 * (fx - fy),
    200 * (fy - fz)
  ];
}

// 预计算方块 LAB
MC_BLOCKS.forEach(block => {
  block.lab = rgbToLab(block.rgb);
  block.hex = `#${block.rgb.map(c => c.toString(16).padStart(2, '0')).join('')}`;
});

export function colorDistanceLab(lab1, lab2) {
  const dL = lab1[0] - lab2[0];
  const da = lab1[1] - lab2[1];
  const db = lab1[2] - lab2[2];
  return Math.sqrt(dL * dL + da * da + db * db);
}

// 生成 16x16 方块纹理
const textureCache = new Map();

export function getBlockTextureCanvas(block) {
  if (textureCache.has(block.id)) {
    return textureCache.get(block.id);
  }

  const canvas = document.createElement('canvas');
  canvas.width = 16;
  canvas.height = 16;
  const ctx = canvas.getContext('2d');
  const [r, g, b] = block.rgb;

  ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;
  ctx.fillRect(0, 0, 16, 16);

  const seededRandom = (x, y) => {
    const seed = (x * 374761393 + y * 668265263 + block.id.length * 1013904223) >>> 0;
    return (seed % 100) / 100;
  };

  const imgData = ctx.getImageData(0, 0, 16, 16);
  const data = imgData.data;

  for (let y = 0; y < 16; y++) {
    for (let x = 0; x < 16; x++) {
      const idx = (y * 16 + x) * 4;
      const noise = seededRandom(x, y);
      let factor = 1.0;

      switch (block.textureType) {
        case 'wool':
          factor = 0.92 + noise * 0.16;
          break;
        case 'smooth':
          factor = 0.96 + noise * 0.08;
          break;
        case 'water':
          factor = 0.9 + noise * 0.2 + ((x + y) % 3 === 0 ? 0.08 : -0.05);
          break;
        case 'grass':
        case 'leaves':
          factor = 0.88 + noise * 0.25;
          break;
        case 'planks':
          if (y % 4 === 0) factor = 0.78;
          else factor = 0.92 + noise * 0.15;
          break;
        case 'stone':
        case 'dirt':
        case 'cobble':
          factor = 0.85 + noise * 0.3;
          break;
        default:
          factor = 0.94 + noise * 0.12;
      }

      data[idx] = Math.min(255, Math.max(0, Math.round(r * factor)));
      data[idx + 1] = Math.min(255, Math.max(0, Math.round(g * factor)));
      data[idx + 2] = Math.min(255, Math.max(0, Math.round(b * factor)));
      data[idx + 3] = 255;
    }
  }

  ctx.putImageData(imgData, 0, 0);
  textureCache.set(block.id, canvas);
  return canvas;
}
