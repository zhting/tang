/**
 * 3D Minecraft 画廊漫游模块
 * 基于 Three.js 构建 Minecraft 风格的沉浸式 3D 画展厅
 */

export class Gallery3D {
  constructor(container) {
    this.container = container;
    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.mainPaintingMesh = null;
    this.torches = [];
    this.animId = null;

    this.isPointerLocked = false;
    this.moveForward = false;
    this.moveBackward = false;
    this.moveLeft = false;
    this.moveRight = false;
    this.velocity = { x: 0, y: 0, z: 0 };
    this.cameraRotation = { pitch: 0, yaw: 0 };
    this.autoRotate = false;

    this.init();
  }

  init() {
    if (!window.THREE) {
      this.container.innerHTML = `
        <div style="display:flex;flex-direction:column;align-items:center;justify-content:center;height:100%;color:#aaa;font-family:var(--font-pixel);text-align:center;padding:20px;">
          <div style="font-size:32px;margin-bottom:10px;">🏛️</div>
          <div style="color:var(--mc-gold);margin-bottom:6px;">正在加载 3D 渲染引擎 (Three.js)...</div>
          <div style="font-size:11px;">若网络较慢请稍候，加载完成后将自动呈现 3D 展厅</div>
        </div>
      `;
      const checkThree = setInterval(() => {
        if (window.THREE) {
          clearInterval(checkThree);
          this.init();
        }
      }, 500);
      return;
    }

    const width = this.container.clientWidth || 800;
    const height = this.container.clientHeight || 500;

    // 1. Scene
    this.scene = new window.THREE.Scene();
    this.scene.background = new window.THREE.Color(0x0a0a0f);
    this.scene.fog = new window.THREE.FogExp2(0x0a0a0f, 0.035);

    // 2. Camera
    this.camera = new window.THREE.PerspectiveCamera(65, width / height, 0.1, 100);
    this.camera.position.set(0, 1.7, 4.5); // 史蒂夫 1.8 格高视线

    // 3. Renderer
    this.renderer = new window.THREE.WebGLRenderer({ antialias: true, alpha: false });
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = window.THREE.PCFSoftShadowMap;

    this.container.innerHTML = '';
    this.container.appendChild(this.renderer.domElement);

    // 4. Lights
    const ambientLight = new window.THREE.AmbientLight(0x404050, 0.8);
    this.scene.add(ambientLight);

    // 5. Build Room
    this.buildMinecraftRoom();

    // 6. Event Listeners
    this.setupControls();

    // 7. Resize Observer
    const resizeObserver = new ResizeObserver(() => this.onWindowResize());
    resizeObserver.observe(this.container);

    // 8. Start Loop
    this.animate = this.animate.bind(this);
    this.animate();
  }

  // 生成 Minecraft 风格材质贴图 (Canvas Texture)
  createProceduralTexture(type) {
    const canvas = document.createElement('canvas');
    canvas.width = 64;
    canvas.height = 64;
    const ctx = canvas.getContext('2d');

    if (type === 'planks') {
      // 橡木地板
      ctx.fillStyle = '#9c7341';
      ctx.fillRect(0, 0, 64, 64);
      ctx.fillStyle = '#7a5528';
      for (let y = 0; y < 64; y += 16) {
        ctx.fillRect(0, y, 64, 2);
      }
      ctx.fillStyle = 'rgba(0,0,0,0.1)';
      for (let i = 0; i < 400; i++) {
        ctx.fillRect(Math.random() * 64, Math.random() * 64, 2, 1);
      }
    } else if (type === 'stone_bricks') {
      // 石砖墙
      ctx.fillStyle = '#737373';
      ctx.fillRect(0, 0, 64, 64);
      ctx.fillStyle = '#3a3a3a';
      ctx.fillRect(0, 0, 64, 2);
      ctx.fillRect(0, 32, 64, 2);
      ctx.fillRect(32, 0, 2, 32);
      ctx.fillRect(0, 32, 2, 32);
      ctx.fillRect(62, 32, 2, 32);
      ctx.fillStyle = 'rgba(0,0,0,0.15)';
      for (let i = 0; i < 300; i++) {
        ctx.fillRect(Math.random() * 64, Math.random() * 64, 2, 2);
      }
    } else if (type === 'ceiling') {
      // 深色橡木天花板
      ctx.fillStyle = '#422c16';
      ctx.fillRect(0, 0, 64, 64);
      ctx.fillStyle = '#2d1e0d';
      for (let y = 0; y < 64; y += 16) {
        ctx.fillRect(0, y, 64, 2);
      }
    }

    const texture = new window.THREE.CanvasTexture(canvas);
    texture.magFilter = window.THREE.NearestFilter;
    texture.minFilter = window.THREE.NearestFilter;
    texture.wrapS = window.THREE.RepeatWrapping;
    texture.wrapT = window.THREE.RepeatWrapping;
    return texture;
  }

  buildMinecraftRoom() {
    const roomWidth = 14;
    const roomLength = 18;
    const roomHeight = 5;

    // 地板 (橡木)
    const floorTex = this.createProceduralTexture('planks');
    floorTex.repeat.set(roomWidth / 2, roomLength / 2);
    const floorMat = new window.THREE.MeshStandardMaterial({ map: floorTex, roughness: 0.8 });
    const floor = new window.THREE.Mesh(new window.THREE.PlaneGeometry(roomWidth, roomLength), floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    this.scene.add(floor);

    // 天花板
    const ceilingTex = this.createProceduralTexture('ceiling');
    ceilingTex.repeat.set(roomWidth / 2, roomLength / 2);
    const ceilingMat = new window.THREE.MeshStandardMaterial({ map: ceilingTex, roughness: 0.9 });
    const ceiling = new window.THREE.Mesh(new window.THREE.PlaneGeometry(roomWidth, roomLength), ceilingMat);
    ceiling.position.y = roomHeight;
    ceiling.rotation.x = Math.PI / 2;
    this.scene.add(ceiling);

    // 墙壁 (石砖)
    const wallTex = this.createProceduralTexture('stone_bricks');
    wallTex.repeat.set(roomLength / 2, roomHeight / 2);
    const wallMat = new window.THREE.MeshStandardMaterial({ map: wallTex, roughness: 0.7 });

    // 后墙 (挂主画作的墙)
    const backWall = new window.THREE.Mesh(new window.THREE.PlaneGeometry(roomWidth, roomHeight), wallMat);
    backWall.position.set(0, roomHeight / 2, -roomLength / 2);
    backWall.receiveShadow = true;
    this.scene.add(backWall);

    // 前墙
    const frontWall = new window.THREE.Mesh(new window.THREE.PlaneGeometry(roomWidth, roomHeight), wallMat);
    frontWall.position.set(0, roomHeight / 2, roomLength / 2);
    frontWall.rotation.y = Math.PI;
    this.scene.add(frontWall);

    // 左墙
    const leftWall = new window.THREE.Mesh(new window.THREE.PlaneGeometry(roomLength, roomHeight), wallMat);
    leftWall.position.set(-roomWidth / 2, roomHeight / 2, 0);
    leftWall.rotation.y = Math.PI / 2;
    this.scene.add(leftWall);

    // 右墙
    const rightWall = new window.THREE.Mesh(new window.THREE.PlaneGeometry(roomLength, roomHeight), wallMat);
    rightWall.position.set(roomWidth / 2, roomHeight / 2, 0);
    rightWall.rotation.y = -Math.PI / 2;
    this.scene.add(rightWall);

    // 添加火把与点光源
    this.addTorch(-4, 2.5, -roomLength / 2 + 0.1, 0);
    this.addTorch(4, 2.5, -roomLength / 2 + 0.1, 0);
    this.addTorch(-roomWidth / 2 + 0.1, 2.5, 0, Math.PI / 2);
    this.addTorch(roomWidth / 2 - 0.1, 2.5, 0, -Math.PI / 2);

    // 吊顶荧石灯
    const glowLight = new window.THREE.PointLight(0xfff0c0, 1.2, 16);
    glowLight.position.set(0, roomHeight - 0.5, 0);
    glowLight.castShadow = true;
    this.scene.add(glowLight);

    const glowBlock = new window.THREE.Mesh(
      new window.THREE.BoxGeometry(1, 1, 1),
      new window.THREE.MeshBasicMaterial({ color: 0xffea88 })
    );
    glowBlock.position.set(0, roomHeight - 0.5, 0);
    this.scene.add(glowBlock);

    // 主画作装裱结构
    this.createMainPaintingFrame(roomLength);
  }

  addTorch(x, y, z, rotY) {
    const torchGroup = new window.THREE.Group();
    torchGroup.position.set(x, y, z);
    torchGroup.rotation.y = rotY;

    // 木棒
    const stick = new window.THREE.Mesh(
      new window.THREE.BoxGeometry(0.08, 0.4, 0.08),
      new window.THREE.MeshLambertMaterial({ color: 0x8b5a2b })
    );
    stick.position.y = 0.2;
    torchGroup.add(stick);

    // 火焰方块头
    const flame = new window.THREE.Mesh(
      new window.THREE.BoxGeometry(0.1, 0.12, 0.1),
      new window.THREE.MeshBasicMaterial({ color: 0xffaa22 })
    );
    flame.position.y = 0.44;
    torchGroup.add(flame);

    // 暖光点光源
    const light = new window.THREE.PointLight(0xffa033, 1.5, 8);
    light.position.y = 0.5;
    light.castShadow = true;
    torchGroup.add(light);

    this.torches.push({ light, baseIntensity: 1.5 });
    this.scene.add(torchGroup);
  }

  createMainPaintingFrame(roomLength) {
    const frameGroup = new window.THREE.Group();
    frameGroup.position.set(0, 2.5, -roomLength / 2 + 0.15);

    // 默认空白画布
    const dummyCanvas = document.createElement('canvas');
    dummyCanvas.width = 64;
    dummyCanvas.height = 64;
    const dummyCtx = dummyCanvas.getContext('2d');
    dummyCtx.fillStyle = '#333';
    dummyCtx.fillRect(0, 0, 64, 64);
    dummyCtx.fillStyle = '#eee';
    dummyCtx.font = '10px sans-serif';
    dummyCtx.fillText('Painting', 10, 35);

    this.mainTexture = new window.THREE.CanvasTexture(dummyCanvas);
    this.mainTexture.magFilter = window.THREE.NearestFilter;
    this.mainTexture.minFilter = window.THREE.NearestFilter;

    // 画布材质
    const paintingMat = new window.THREE.MeshStandardMaterial({
      map: this.mainTexture,
      roughness: 0.4
    });

    this.mainPaintingMesh = new window.THREE.Mesh(
      new window.THREE.PlaneGeometry(3.6, 3.6),
      paintingMat
    );
    this.mainPaintingMesh.position.z = 0.02;
    frameGroup.add(this.mainPaintingMesh);

    // 画框外围 (桦木画框)
    const frameMat = new window.THREE.MeshStandardMaterial({ color: 0x3d2714, roughness: 0.9 });
    const frameMesh = new window.THREE.Mesh(
      new window.THREE.BoxGeometry(3.9, 3.9, 0.08),
      frameMat
    );
    frameMesh.position.z = -0.01;
    frameGroup.add(frameMesh);

    // 聚光灯照射主画作
    const spot = new window.THREE.SpotLight(0xffffff, 2.0);
    spot.position.set(0, 4.5, -roomLength / 2 + 3);
    spot.target = this.mainPaintingMesh;
    spot.angle = Math.PI / 5;
    spot.penumbra = 0.4;
    spot.castShadow = true;
    this.scene.add(spot);

    this.scene.add(frameGroup);
  }

  // 更新展厅中的主画作贴图
  updatePaintingTexture(canvas, widthRatio = 1, heightRatio = 1) {
    if (!this.mainPaintingMesh || !canvas) return;

    const texture = new window.THREE.CanvasTexture(canvas);
    texture.magFilter = window.THREE.NearestFilter;
    texture.minFilter = window.THREE.NearestFilter;
    texture.needsUpdate = true;

    this.mainPaintingMesh.material.map = texture;
    this.mainPaintingMesh.material.needsUpdate = true;

    // 自适应宽高比例
    const baseSize = 3.6;
    if (widthRatio >= heightRatio) {
      const w = baseSize;
      const h = baseSize * (heightRatio / widthRatio);
      this.mainPaintingMesh.scale.set(1, h / baseSize, 1);
    } else {
      const h = baseSize;
      const w = baseSize * (widthRatio / heightRatio);
      this.mainPaintingMesh.scale.set(w / baseSize, 1, 1);
    }
  }

  setupControls() {
    const el = this.renderer.domElement;

    el.addEventListener('click', () => {
      el.requestPointerLock();
    });

    document.addEventListener('pointerlockchange', () => {
      this.isPointerLocked = (document.pointerLockElement === el);
    });

    document.addEventListener('mousemove', (e) => {
      if (!this.isPointerLocked) return;
      const sensitivity = 0.0022;
      this.cameraRotation.yaw -= e.movementX * sensitivity;
      this.cameraRotation.pitch -= e.movementY * sensitivity;

      // 俯仰角限制
      this.cameraRotation.pitch = Math.max(-Math.PI / 2.2, Math.min(Math.PI / 2.2, this.cameraRotation.pitch));

      this.camera.rotation.order = 'YXZ';
      this.camera.rotation.y = this.cameraRotation.yaw;
      this.camera.rotation.x = this.cameraRotation.pitch;
    });

    window.addEventListener('keydown', (e) => {
      switch (e.code) {
        case 'KeyW': case 'ArrowUp': this.moveForward = true; break;
        case 'KeyS': case 'ArrowDown': this.moveBackward = true; break;
        case 'KeyA': case 'ArrowLeft': this.moveLeft = true; break;
        case 'KeyD': case 'ArrowRight': this.moveRight = true; break;
      }
    });

    window.addEventListener('keyup', (e) => {
      switch (e.code) {
        case 'KeyW': case 'ArrowUp': this.moveForward = false; break;
        case 'KeyS': case 'ArrowDown': this.moveBackward = false; break;
        case 'KeyA': case 'ArrowLeft': this.moveLeft = false; break;
        case 'KeyD': case 'ArrowRight': this.moveRight = false; break;
      }
    });
  }

  onWindowResize() {
    if (!this.camera || !this.renderer) return;
    const width = this.container.clientWidth;
    const height = this.container.clientHeight;
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  }

  animate() {
    this.animId = requestAnimationFrame(this.animate);

    // 火把轻微闪烁动画
    const time = Date.now() * 0.008;
    this.torches.forEach((torch, idx) => {
      torch.light.intensity = torch.baseIntensity + Math.sin(time + idx * 2.1) * 0.2 + (Math.random() - 0.5) * 0.1;
    });

    // 玩家移动更新 (如果锁定或者漫游模式)
    if (this.isPointerLocked) {
      const speed = 0.08;
      const dir = new window.THREE.Vector3();

      if (this.moveForward) dir.z -= 1;
      if (this.moveBackward) dir.z += 1;
      if (this.moveLeft) dir.x -= 1;
      if (this.moveRight) dir.x += 1;

      dir.normalize();
      dir.applyAxisAngle(new window.THREE.Vector3(0, 1, 0), this.cameraRotation.yaw);

      this.camera.position.x += dir.x * speed;
      this.camera.position.z += dir.z * speed;

      // 房间碰撞限制
      this.camera.position.x = Math.max(-6, Math.min(6, this.camera.position.x));
      this.camera.position.z = Math.max(-7.5, Math.min(7.5, this.camera.position.z));
    } else if (this.autoRotate) {
      // 自动缓速环视主展台
      const t = Date.now() * 0.0005;
      this.camera.position.x = Math.sin(t) * 4;
      this.camera.position.z = 2 + Math.cos(t) * 2;
      this.camera.lookAt(0, 2.5, -8);
    }

    this.renderer.render(this.scene, this.camera);
  }

  destroy() {
    if (this.animId) cancelAnimationFrame(this.animId);
  }
}
