extends Node2D

# ==============================================================================
# 像素级四足蓝龙专用渲染与动画控制器（100% 还原定稿造型与 0~10 人膨胀形态）
# ==============================================================================

# 蓝龙状态与数值
var belly_count: int = 0            # 当前腹中人数 (0 ~ 10)
var facing: int = 1                 # 朝向: 1向右, -1向左
var pos: Vector2 = Vector2(560, 460)
var walk_time: float = 0.0
var is_walking: bool = false

# 动作状态机: "IDLE" | "WALK" | "EAT_HUMAN" | "EAT_GRENADE" | "BELLY_EXPLODE"
var anim_state: String = "IDLE"
var anim_timer: float = 0.0
var anim_duration: float = 0.0

# 肚内手雷爆炸特效变量
var explode_bulge: float = 0.0      # 肚内爆炸瞬间向外猛鼓的额外像素
var explode_flash: float = 0.0      # 肚皮透出爆炸橘光的强度

# 像素画布配置（采用 3 倍像素放大，呈现纯正复古像素颗粒感）
const CANVAS_W: int = 260
const CANVAS_H: int = 160
const PIXEL_SCALE: float = 3.0

var img: Image
var tex: ImageTexture
var sprite: Sprite2D

# 调色板（严格还原照片里的钴蓝色鳞片、浅蓝腹甲、深蓝勾边与龙角）
const C_TRANSPARENT = Color(0, 0, 0, 0)
const C_OUTLINE     = Color(0.04, 0.08, 0.20) # 深海蓝黑像素描边
const C_SCALE_DARK  = Color(0.08, 0.25, 0.62) # 阴影蓝鳞片（后腿/内侧翼膜）
const C_SCALE_MAIN  = Color(0.14, 0.42, 0.88) # 主体钴蓝色鳞片
const C_SCALE_LIGHT = Color(0.28, 0.60, 0.98) # 背脊与肌肉高光
const C_BELLY_MAIN  = Color(0.36, 0.68, 1.00) # 胸腹与肚皮浅蓝色
const C_BELLY_DARK  = Color(0.22, 0.50, 0.86) # 肚皮阴影与撑起轮廓边缘
const C_HORN        = Color(0.65, 0.82, 0.98) # 龙角与利爪亮灰蓝
const C_EYE         = Color(1.00, 0.85, 0.15) # 锐利金黄色龙眼
const C_MOUTH_IN    = Color(0.65, 0.15, 0.25) # 张嘴时的暗红色口腔
const C_EXPLODE_GLOW= Color(1.00, 0.55, 0.10) # 手雷肚内爆炸透光

func _ready() -> void:
	DisplayServer.window_set_size(Vector2i(1152, 648))
	img = Image.create(CANVAS_W, CANVAS_H, false, Image.FORMAT_RGBA8)
	tex = ImageTexture.create_from_image(img)
	
	sprite = Sprite2D.new()
	sprite.texture = tex
	sprite.texture_filter = CanvasItem.TEXTURE_FILTER_NEAREST # 锁定锐利像素点，不模糊
	sprite.scale = Vector2(PIXEL_SCALE, PIXEL_SCALE)
	add_child(sprite)

func _process(delta: float) -> void:
	handle_demo_controls(delta)
	update_animation_timers(delta)
	render_dragon_pixel_frame()
	tex.update(img)
	sprite.position = pos + Vector2(0, -CANVAS_H * PIXEL_SCALE * 0.5 + 30)
	sprite.flip_h = (facing == -1)
	queue_redraw()

# ==============================================================================
# 交互测试按键（方便你立刻逐个预览照片里的所有动作与 1~10 人形态）
# ==============================================================================
func handle_demo_controls(delta: float) -> void:
	# 数字键或上下键切换 0~10 人肚子大小
	if Input.is_action_just_pressed("ui_up"):
		belly_count = min(10, belly_count + 1)
	if Input.is_action_just_pressed("ui_down"):
		belly_count = max(0, belly_count - 1)

	# 左右方向键 / A D 控制四足行走
	var move := 0.0
	if Input.is_key_pressed(KEY_D) or Input.is_key_pressed(KEY_RIGHT):
		move += 1.0
	if Input.is_key_pressed(KEY_A) or Input.is_key_pressed(KEY_LEFT):
		move -= 1.0

	if move != 0.0:
		facing = int(sign(move))
		pos.x = clamp(pos.x + move * 260.0 * delta, 200.0, 960.0)
		is_walking = true
		walk_time += delta * 9.0
		if anim_state == "IDLE":
			anim_state = "WALK"
	else:
		is_walking = false
		if anim_state == "WALK":
			anim_state = "IDLE"

	# 按 [1] 演示：挑起人 -> 前伸张嘴咬住 -> 仰头吞咽（肚子+1）
	if Input.is_key_just_pressed(KEY_1) and anim_state in ["IDLE", "WALK"]:
		start_action("EAT_HUMAN", 1.1)

	# 按 [2] 演示：低头直接吃掉手雷 -> 肚内闷爆鼓肚（瞬间消化清空）
	if Input.is_key_just_pressed(KEY_2) and anim_state in ["IDLE", "WALK"]:
		start_action("EAT_GRENADE", 0.65)

func start_action(new_state: String, duration: float) -> void:
	anim_state = new_state
	anim_timer = 0.0
	anim_duration = duration

func update_animation_timers(delta: float) -> void:
	if explode_bulge > 0.0:
		explode_bulge = max(0.0, explode_bulge - 35.0 * delta)
	if explode_flash > 0.0:
		explode_flash = max(0.0, explode_flash - 2.5 * delta)

	if anim_state in ["EAT_HUMAN", "EAT_GRENADE", "BELLY_EXPLODE"]:
		anim_timer += delta
		var progress = anim_timer / anim_duration
		
		# 吞人动作完成瞬间，肚子人数 +1
		if anim_state == "EAT_HUMAN" and progress >= 1.0:
			belly_count = min(10, belly_count + 1)
			anim_state = "IDLE"
			
		# 低头吃完手雷后，紧接着触发手雷在肚子里闷爆（肚子突然鼓一下 + 瞬间消化所有人）
		elif anim_state == "EAT_GRENADE" and progress >= 1.0:
			belly_count = 0
			explode_bulge = 14.0
			explode_flash = 1.0
			start_action("BELLY_EXPLODE", 0.55)
			
		elif anim_state == "BELLY_EXPLODE" and progress >= 1.0:
			anim_state = "IDLE"

# ==============================================================================
# 核心像素绘图引擎：逐像素还原照片里的四足蓝龙、长翅膀、长尾巴与 0~10 肚型
# ==============================================================================
func render_dragon_pixel_frame() -> void:
	img.fill(C_TRANSPARENT)
	
	# 计算当前动作进度 (0.0 -> 1.0)
	var p = clamp(anim_timer / max(0.01, anim_duration), 0.0, 1.0)
	
	# 行走周期相位（严格四脚着地交替迈步）
	var leg_swing = sin(walk_time) * 5.0 if is_walking else 0.0
	var leg_lift_a = max(0.0, -cos(walk_time)) * 3.0 if is_walking else 0.0
	var leg_lift_b = max(0.0, cos(walk_time)) * 3.0 if is_walking else 0.0
	var body_bob = int(abs(sin(walk_time)) * 1.5) if is_walking else 0

	# 基准锚点（地面 Y = 148，留出顶部与尾部空间）
	var ground_y: int = 148
	var hip_pos := Vector2(105, 112 + body_bob)
	var shoulder_pos := Vector2(158, 110 + body_bob)

	# --------------------------------------------------------------------------
	# 1. 绘制远侧（里侧）前后腿（深色阴影，体现四足立体感）
	# --------------------------------------------------------------------------
	draw_dragon_leg(hip_pos + Vector2(-4 - leg_swing, 0), ground_y - int(leg_lift_b), C_SCALE_DARK, true)
	draw_dragon_leg(shoulder_pos + Vector2(-4 + leg_swing, 0), ground_y - int(leg_lift_a), C_SCALE_DARK, false)

	# --------------------------------------------------------------------------
	# 2. 绘制长尾巴（向后优雅弯曲上扬，带背脊尖刺）
	# --------------------------------------------------------------------------
	var tail_wag = sin(walk_time * 0.7) * 3.0
	for i in range(68):
		var t = float(i) / 68.0
		var tx = int(hip_pos.x - 8 - i * 1.35)
		var ty = int(hip_pos.y - 2 + sin(t * 3.8) * 10.0 - t * 18.0 + tail_wag * t)
		var radius = int(lerp(7.5, 1.5, t))
		draw_pixel_circle(tx, ty, radius, C_SCALE_MAIN, true)
		if i % 8 == 2 and i < 55:
			draw_pixel_triangle(tx, ty - radius, 3, 4, C_SCALE_LIGHT) # 尾部背刺

	# --------------------------------------------------------------------------
	# 3. 绘制躯干脊背与背刺
	# --------------------------------------------------------------------------
	for x in range(int(hip_pos.x), int(shoulder_pos.x) + 1):
		var t = float(x - hip_pos.x) / (shoulder_pos.x - hip_pos.x)
		var by = int(lerp(hip_pos.y, shoulder_pos.y, t))
		draw_pixel_circle(x, by, 10, C_SCALE_MAIN, true)
		draw_pixel_circle(x, by - 5, 4, C_SCALE_LIGHT, false)
		if (x - int(hip_pos.x)) % 9 == 4:
			draw_pixel_triangle(x, by - 10, 3, 4, C_SCALE_LIGHT)

	# --------------------------------------------------------------------------
	# 4. 绘制身下膨胀的肚子（严格在前后腿之间、身下垂坠、不朝前挺、不贴地）
	# --------------------------------------------------------------------------
	var belly_center_x = int((hip_pos.x + shoulder_pos.x) * 0.5) + 2
	# 0人时为紧凑流线腹甲(r=9)，10人时与上半身等大(r=23)，不贴地(留出地面间隙)
	var base_r = 9.0 + belly_count * 1.45 + explode_bulge
	var belly_center_y = int(116 + belly_count * 0.85 + explode_bulge * 0.35 + body_bob)
	
	var rx = int(base_r * 1.28)
	var ry = int(base_r * 0.96)
	var belly_fill = C_BELLY_MAIN.lerp(C_EXPLODE_GLOW, explode_flash)
	draw_pixel_ellipse(belly_center_x, belly_center_y, rx, ry, belly_fill, true)
	
	# 肚子下半部阴影弧线
	draw_pixel_ellipse(belly_center_x, belly_center_y + 2, rx - 2, ry - 2, C_BELLY_DARK.lerp(C_EXPLODE_GLOW, explode_flash), false)
	draw_pixel_ellipse(belly_center_x, belly_center_y - 1, rx - 3, ry - 3, belly_fill, false)

	# 绘制肚皮被吞入的人撑起的立体轮廓凸起（人越多越明显，且随呼吸微动）
	if belly_count > 0:
		for k in range(belly_count):
			var angle = k * 1.25 + Time.get_ticks_msec() * 0.003
			var bx = belly_center_x + int(cos(angle) * (rx * 0.55))
			var by = belly_center_y + int(sin(angle) * (ry * 0.45))
			draw_pixel_circle(bx, by, 3, C_BELLY_DARK, false)
			draw_pixel_circle(bx - 1, by - 1, 2, C_SCALE_LIGHT, false)

	# --------------------------------------------------------------------------
	# 5. 绘制近侧（外侧）前后粗壮四肢与龙爪（严格四脚着地）
	# --------------------------------------------------------------------------
	draw_dragon_leg(hip_pos + Vector2(3 + leg_swing, 0), ground_y - int(leg_lift_a), C_SCALE_MAIN, true)
	draw_dragon_leg(shoulder_pos + Vector2(3 - leg_swing, 0), ground_y - int(leg_lift_b), C_SCALE_MAIN, false)

	# --------------------------------------------------------------------------
	# 6. 绘制加长版帅气龙翼（从肩胛向后上方大幅展开，带翼骨与翼膜层次）
	# --------------------------------------------------------------------------
	var wing_flap = sin(walk_time * 0.8) * 3.0
	var wing_root := shoulder_pos + Vector2(-4, -8)
	var wing_elbow := wing_root + Vector2(-28, -32 + wing_flap)
	var wing_tip := wing_elbow + Vector2(-58, 12 + wing_flap * 1.4)
	
	# 翼膜多边形
	var membrane = PackedVector2Array([
		wing_root,
		wing_elbow,
		wing_tip,
		wing_tip + Vector2(14, 18),
		wing_elbow + Vector2(-8, 22),
		wing_root + Vector2(-14, 12)
	])
	fill_pixel_polygon(membrane, C_SCALE_DARK, C_OUTLINE)
	# 粗壮翼骨与翼尖爪
	draw_pixel_thick_line(wing_root, wing_elbow, 3, C_SCALE_MAIN)
	draw_pixel_thick_line(wing_elbow, wing_tip, 2, C_SCALE_MAIN)
	draw_pixel_triangle(int(wing_elbow.x), int(wing_elbow.y) - 3, 2, 4, C_HORN)

	# --------------------------------------------------------------------------
	# 7. 绘制颈部、龙头与动作特写（挑起咬人 -> 仰头吞咽下巴鼓起 / 低头直接吞雷）
	# --------------------------------------------------------------------------
	var neck_base := shoulder_pos + Vector2(6, -6)
	var head_pos := neck_base + Vector2(22, -26)
	var jaw_open: float = 0.0
	var swallow_lump_t: float = -1.0 # 吞咽时顺着下巴滑落的鼓包位置 (0.0 -> 1.0)
	var prey_pos := Vector2.ZERO
	var show_prey_type: String = ""

	if anim_state == "EAT_HUMAN":
		if p < 0.35:
			# 阶段1：把人挑起来扔到空中
			var t1 = p / 0.35
			head_pos = neck_base + Vector2(26, -22 - sin(t1 * PI) * 8)
			prey_pos = head_pos + Vector2(24, -10 - sin(t1 * PI) * 28)
			show_prey_type = "HUMAN"
		elif p < 0.65:
			# 阶段2：人落到嘴前，龙头往前一伸、张大嘴咬住
			var t2 = (p - 0.35) / 0.30
			head_pos = neck_base + Vector2(34, -24)
			jaw_open = 1.0 - t2 * 0.5
			prey_pos = head_pos + Vector2(14 * (1.0 - t2), 2)
			show_prey_type = "HUMAN"
		else:
			# 阶段3：仰头吞咽，能看到人顺着下巴咽下去
			var t3 = (p - 0.65) / 0.35
			head_pos = neck_base + Vector2(14, -38)
			swallow_lump_t = t3
	elif anim_state == "EAT_GRENADE":
		# 低头直接吃掉手雷（不抛起）
		var bite_p = sin(p * PI)
		head_pos = neck_base + Vector2(28, 28 * bite_p - 10 * (1.0 - bite_p))
		jaw_open = 1.0 if p < 0.55 else 0.0
		if p < 0.6:
			prey_pos = Vector2(neck_base.x + 36, ground_y - 5)
			show_prey_type = "GRENADE"

	# 绘制修长龙颈与浅蓝喉腹甲
	var neck_steps = 18
	for s in range(neck_steps + 1):
		var st = float(s) / neck_steps
		var nx = int(lerp(neck_base.x, head_pos.x, st))
		var ny = int(lerp(neck_base.y, head_pos.y, st))
		var nr = int(lerp(8.5, 6.0, st))
		draw_pixel_circle(nx, ny, nr, C_SCALE_MAIN, true)
		draw_pixel_circle(nx + 2, ny + 2, nr - 2, C_BELLY_MAIN, false)

	# 如果正在仰头吞咽，绘制顺着下巴/喉咙滑下去的人形鼓包
	if swallow_lump_t >= 0.0:
		var lx = int(lerp(head_pos.x + 4, neck_base.x + 4, swallow_lump_t))
		var ly = int(lerp(head_pos.y + 6, neck_base.y + 4, swallow_lump_t))
		draw_pixel_circle(lx, ly, 6, C_BELLY_MAIN, true)
		draw_pixel_circle(lx + 1, ly + 1, 4, C_SCALE_LIGHT, false)

	# 绘制冷峻帅气的龙头、向后延伸的双龙角、锐利龙眼与张合龙嘴
	draw_dragon_head(head_pos, jaw_open)

	# 绘制空中被挑起的小人 或 地上被低头咬住的手雷
	if show_prey_type == "HUMAN":
		draw_mini_human(prey_pos)
	elif show_prey_type == "GRENADE":
		draw_pixel_circle(int(prey_pos.x), int(prey_pos.y), 4, Color(0.2, 0.75, 0.25), true)

# ==============================================================================
# 局部精密像素组件绘制函数
# ==============================================================================
func draw_dragon_head(hp: Vector2, jaw_open: float) -> void:
	var hx = int(hp.x)
	var hy = int(hp.y)
	# 后脑与向后拉长的双龙角
	draw_pixel_thick_line(Vector2(hx - 4, hy - 5), Vector2(hx - 20, hy - 14), 2, C_HORN)
	draw_pixel_thick_line(Vector2(hx - 2, hy - 2), Vector2(hx - 16, hy - 8), 2, C_SCALE_LIGHT)
	# 上颌与鼻吻（修长冷峻爬虫头型）
	draw_pixel_ellipse(hx + 4, hy - 2, 11, 6, C_SCALE_MAIN, true)
	draw_pixel_ellipse(hx + 12, hy - 1, 6, 4, C_SCALE_MAIN, true)
	# 下颌（根据 jaw_open 张开角度向下旋转）
	var jaw_drop = int(jaw_open * 9.0)
	if jaw_open > 0.1:
		draw_pixel_ellipse(hx + 8, hy + 2 + jaw_drop / 2, 8, 4, C_MOUTH_IN, false)
		draw_pixel_ellipse(hx + 6, hy + 3 + jaw_drop, 10, 3, C_BELLY_MAIN, true)
	# 尖锐龙牙
	if jaw_open > 0.2:
		set_px(hx + 14, hy + 3, Color.WHITE)
		set_px(hx + 10, hy + 3, Color.WHITE)
		set_px(hx + 13, hy + 1 + jaw_drop, Color.WHITE)
	# 锐利龙眼与眉脊
	draw_pixel_thick_line(Vector2(hx - 1, hy - 5), Vector2(hx + 6, hy - 4), 1, C_OUTLINE)
	set_px(hx + 2, hy - 3, C_EYE)
	set_px(hx + 3, hy - 3, C_EYE)

func draw_dragon_leg(joint_pos: Vector2, foot_y: int, col: Color, is_hind: bool) -> void:
	var jx = int(joint_pos.x)
	var jy = int(joint_pos.y)
	var knee_x = jx - 5 if is_hind else jx + 3
	var knee_y = int(lerp(jy, foot_y, 0.52))
	# 大腿肌肉
	draw_pixel_thick_line(Vector2(jx, jy), Vector2(knee_x, knee_y), 5, col)
	# 小腿与踝关节
	draw_pixel_thick_line(Vector2(knee_x, knee_y), Vector2(jx + 1, foot_y - 3), 4, col)
	# 龙爪脚掌（贴紧地面）
	draw_pixel_ellipse(jx + 4, foot_y - 2, 6, 3, col, true)
	set_px(jx + 10, foot_y - 1, C_HORN)
	set_px(jx + 9, foot_y - 2, C_HORN)

func draw_mini_human(p: Vector2) -> void:
	var x = int(p.x)
	var y = int(p.y)
	draw_pixel_circle(x, y - 8, 3, Color(0.9, 0.75, 0.65), true)
	draw_pixel_ellipse(x, y - 10, 4, 2, Color(0.2, 0.5, 1.0), true) # 遮眼帽子
	draw_pixel_thick_line(Vector2(x, y - 5), Vector2(x, y + 3), 3, Color(0.25, 0.3, 0.35))
	draw_pixel_thick_line(Vector2(x - 4, y - 3), Vector2(x + 4, y - 5), 1, Color(0.25, 0.3, 0.35))
	draw_pixel_thick_line(Vector2(x, y + 3), Vector2(x - 3, y + 9), 1, Color(0.2, 0.25, 0.3))
	draw_pixel_thick_line(Vector2(x, y + 3), Vector2(x + 3, y + 8), 1, Color(0.2, 0.25, 0.3))

# ==============================================================================
# 底层像素图元辅助工具（自动添加像素黑蓝描边）
# ==============================================================================
func set_px(x: int, y: int, c: Color) -> void:
	if x >= 0 and x < CANVAS_W and y >= 0 and y < CANVAS_H:
		img.set_pixel(x, y, c)

func draw_pixel_circle(cx: int, cy: int, r: int, col: Color, outline: bool) -> void:
	if outline:
		for dy in range(-r - 1, r + 2):
			for dx in range(-r - 1, r + 2):
				if dx * dx + dy * dy <= (r + 1) * (r + 1):
					if img.get_pixel(clamp(cx + dx, 0, CANVAS_W - 1), clamp(cy + dy, 0, CANVAS_H - 1)) == C_TRANSPARENT:
						set_px(cx + dx, cy + dy, C_OUTLINE)
	for dy in range(-r, r + 1):
		for dx in range(-r, r + 1):
			if dx * dx + dy * dy <= r * r:
				set_px(cx + dx, cy + dy, col)

func draw_pixel_ellipse(cx: int, cy: int, rx: int, ry: int, col: Color, outline: bool) -> void:
	if rx <= 0 or ry <= 0:
		return
	if outline:
		for dy in range(-ry - 1, ry + 2):
			for dx in range(-rx - 1, rx + 2):
				var v = float(dx * dx) / ((rx + 1) * (rx + 1)) + float(dy * dy) / ((ry + 1) * (ry + 1))
				if v <= 1.0:
					if img.get_pixel(clamp(cx + dx, 0, CANVAS_W - 1), clamp(cy + dy, 0, CANVAS_H - 1)) == C_TRANSPARENT:
						set_px(cx + dx, cy + dy, C_OUTLINE)
	for dy in range(-ry, ry + 1):
		for dx in range(-rx, rx + 1):
			var v = float(dx * dx) / (rx * rx) + float(dy * dy) / (ry * ry)
			if v <= 1.0:
				set_px(cx + dx, cy + dy, col)

func draw_pixel_thick_line(a: Vector2, b: Vector2, r: int, col: Color) -> void:
	var steps = int(a.distance_to(b)) + 1
	for i in range(steps + 1):
		var pt = a.lerp(b, float(i) / max(1, steps))
		draw_pixel_circle(int(pt.x), int(pt.y), r, col, true)

func draw_pixel_triangle(tx: int, ty: int, w: int, h: int, col: Color) -> void:
	for y in range(h):
		var span = int(lerp(w, 0, float(y) / max(1, h)))
		for x in range(-span, span + 1):
			set_px(tx + x, ty - y, col)

func fill_pixel_polygon(pts: PackedVector2Array, fill_col: Color, out_col: Color) -> void:
	for y in range(CANVAS_H):
		for x in range(CANVAS_W):
			if Geometry2D.is_point_in_polygon(Vector2(x, y), pts):
				set_px(x, y, fill_col)
	for i in range(pts.size()):
		var a = pts[i]
		var b = pts[(i + 1) % pts.size()]
		var steps = int(a.distance_to(b)) + 1
		for s in range(steps + 1):
			var pt = a.lerp(b, float(s) / max(1, steps))
			set_px(int(pt.x), int(pt.y), out_col)

# ==============================================================================
# 界面操作提示与地面绘制
# ==============================================================================
func _draw() -> void:
	draw_rect(Rect2(0, 0, 1152, 490), Color(0.12, 0.16, 0.22))
	draw_rect(Rect2(0, 490, 1152, 158), Color(0.22, 0.25, 0.30))
	draw_line(Vector2(0, 490), Vector2(1152, 490), Color(0.45, 0.55, 0.65), 4.0)
	draw_rect(Rect2(20, 20, 680, 115), Color(0, 0, 0, 0.65))
	draw_string(ThemeDB.fallback_font, Vector2(36, 50), "四足蓝龙像素形态实时预览（当前腹中人数：%d / 10）" % belly_count, HORIZONTAL_ALIGNMENT_LEFT, -1, 20, Color(0.4, 0.85, 1.0))
	draw_string(ThemeDB.fallback_font, Vector2(36, 82), "[A / D 或 左右键] 四足行走   [上 / 下方向键] 实时切换 0~10 人肚子大小", HORIZONTAL_ALIGNMENT_LEFT, -1, 16, Color.WHITE)
	draw_string(ThemeDB.fallback_font, Vector2(36, 112), "[1 键] 演示挑起咬人并仰头吞咽   [2 键] 演示低头吃手雷 + 肚内闷爆鼓肚消化", HORIZONTAL_ALIGNMENT_LEFT, -1, 16, Color.YELLOW)
