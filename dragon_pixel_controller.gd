extends Node2D

# ==============================================================================
# 像素级四足蓝龙专用渲染与动画控制器（100% 连续流体动作动力学引擎）
# 彻底消除硬切与跳帧，实现完全平滑、连贯无缝的四足步态、待机呼吸与挑咬吞爆全动作流
# ==============================================================================

# 蓝龙核心状态与数值
var belly_count: int = 0            # 目标腹中人数 (0 ~ 10)
var current_belly_size: float = 0.0 # 连续平滑插值腹部尺寸 (杜绝阶跃跳跃)
var belly_jiggle: float = 0.0       # 腹部果冻弹性物理偏移
var belly_jiggle_vel: float = 0.0   # 腹部果冻弹性速度

var facing: int = 1                 # 朝向: 1向右, -1向左
var pos: Vector2 = Vector2(560, 460)

# 时间与连续动力学变量
var global_time: float = 0.0        # 全局连续计时
var idle_time: float = 0.0          # 待机呼吸微动计时
var walk_time: float = 0.0          # 行走步态相位
var walk_weight: float = 0.0        # 行走权重平滑混合 (0.0=静止待机, 1.0=全步行走)
var is_walking: bool = false

# 动作状态机: "IDLE" | "WALK" | "EAT_HUMAN" | "EAT_GRENADE" | "BELLY_EXPLODE"
var anim_state: String = "IDLE"
var anim_timer: float = 0.0
var anim_duration: float = 0.0

# 肚内手雷爆炸特效变量
var explode_bulge: float = 0.0      # 肚内爆炸向外猛鼓的像素
var explode_flash: float = 0.0      # 肚皮透出橘红火光的强度
var eat_human_triggered: bool = false # 吞人动作入腹触发锁（鼓包滑入肚中瞬间平滑+1）

# 像素画布配置（采用 3 倍像素放大，呈现纯正复古像素颗粒感）
const CANVAS_W: int = 260
const CANVAS_H: int = 160
const PIXEL_SCALE: float = 3.0

var img: Image
var tex: ImageTexture
var sprite: Sprite2D

# 调色板（严格还原定稿钴蓝色鳞片、浅蓝腹甲、深蓝勾边与龙角）
const C_TRANSPARENT = Color(0, 0, 0, 0)
const C_OUTLINE     = Color(0.04, 0.08, 0.20) # 深海蓝黑像素描边
const C_SCALE_DARK  = Color(0.08, 0.25, 0.62) # 阴影蓝鳞片（内侧腿/内侧翼膜）
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
	global_time += delta
	idle_time += delta
	
	handle_demo_controls(delta)
	update_smooth_dynamics(delta)
	update_animation_timers(delta)
	render_dragon_pixel_frame()
	tex.update(img)
	
	sprite.position = pos + Vector2(0, -CANVAS_H * PIXEL_SCALE * 0.5 + 30)
	sprite.flip_h = (facing == -1)
	queue_redraw()

# ==============================================================================
# 平滑动力学更新（消除任何一帧跳跃与不连续感）
# ==============================================================================
func update_smooth_dynamics(delta: float) -> void:
	# 1. 行走权重平滑渐变（起步、急停完全丝滑过渡，没有顿挫）
	var target_walk = 1.0 if is_walking else 0.0
	walk_weight = lerp(walk_weight, target_walk, clamp(10.0 * delta, 0.0, 1.0))
	if is_walking:
		walk_time += delta * 8.5
	
	# 2. 腹部平滑尺寸与弹性果冻物理阻尼振荡器
	current_belly_size = lerp(current_belly_size, float(belly_count), clamp(8.5 * delta, 0.0, 1.0))
	belly_jiggle_vel += (-belly_jiggle * 60.0 - belly_jiggle_vel * 8.0) * delta
	belly_jiggle += belly_jiggle_vel * delta
	
	# 3. 爆炸突鼓与闪光平滑衰减
	if explode_bulge > 0.001:
		explode_bulge = max(0.0, explode_bulge - 28.0 * delta)
	else:
		explode_bulge = 0.0
		
	if explode_flash > 0.001:
		explode_flash = max(0.0, explode_flash - 2.2 * delta)
	else:
		explode_flash = 0.0

# ==============================================================================
# 交互测试按键（支持实时连贯触发照片里的所有动作与 1~10 人形态）
# ==============================================================================
func handle_demo_controls(delta: float) -> void:
	# 上下键切换 0~10 人肚子大小（带弹性果冻动态反馈）
	if Input.is_action_just_pressed("ui_up"):
		belly_count = min(10, belly_count + 1)
		belly_jiggle_vel = 12.0
	if Input.is_action_just_pressed("ui_down"):
		belly_count = max(0, belly_count - 1)
		belly_jiggle_vel = -8.0

	# 左右方向键 / A D 控制四足行走
	var move := 0.0
	if Input.is_key_pressed(KEY_D) or Input.is_key_pressed(KEY_RIGHT):
		move += 1.0
	if Input.is_key_pressed(KEY_A) or Input.is_key_pressed(KEY_LEFT):
		move -= 1.0

	if move != 0.0:
		facing = int(sign(move))
		pos.x = clamp(pos.x + move * 240.0 * delta, 180.0, 980.0)
		is_walking = true
		if anim_state == "IDLE":
			anim_state = "WALK"
	else:
		is_walking = false
		if anim_state == "WALK":
			anim_state = "IDLE"

	# 按 [1] 触发：挑起人 -> 空中抛射 -> 前探迎面咬住 -> 仰头吞咽 -> 入腹胀大（全连贯无缝曲线）
	if Input.is_key_just_pressed(KEY_1) and anim_state in ["IDLE", "WALK"]:
		eat_human_triggered = false
		start_action("EAT_HUMAN", 1.25)

	# 按 [2] 触发：低头咬雷 -> 入喉吞咽 -> 肚内剧烈闷爆震颤+全身后坐力（消化清空）
	if Input.is_key_just_pressed(KEY_2) and anim_state in ["IDLE", "WALK"]:
		start_action("EAT_GRENADE", 0.75)

func start_action(new_state: String, duration: float) -> void:
	anim_state = new_state
	anim_timer = 0.0
	anim_duration = duration

func update_animation_timers(delta: float) -> void:
	if anim_state in ["EAT_HUMAN", "EAT_GRENADE", "BELLY_EXPLODE"]:
		anim_timer += delta
		var progress = anim_timer / max(0.001, anim_duration)
		
		# 吞人动作：鼓包滑入肚中瞬间 (progress >= 0.85)，人数 +1 且激起弹性抖动
		if anim_state == "EAT_HUMAN":
			if progress >= 0.85 and not eat_human_triggered:
				eat_human_triggered = true
				belly_count = min(10, belly_count + 1)
				belly_jiggle_vel = 14.0 # 触发弹性质感鼓动
			if progress >= 1.0:
				anim_state = "IDLE"
			
		# 吞手雷动作：手雷进入肚中瞬间，立即无缝连接肚内剧烈闷爆
		elif anim_state == "EAT_GRENADE":
			if progress >= 1.0:
				belly_count = 0
				explode_bulge = 16.0
				explode_flash = 1.0
				belly_jiggle_vel = 20.0
				start_action("BELLY_EXPLODE", 0.65)
			
		elif anim_state == "BELLY_EXPLODE":
			if progress >= 1.0:
				anim_state = "IDLE"

# ==============================================================================
# 缓动函数库（确保一切关键帧平滑衔接）
# ==============================================================================
func ease_smooth(t: float) -> float:
	t = clamp(t, 0.0, 1.0)
	return t * t * (3.0 - 2.0 * t)

func ease_out_quad(t: float) -> float:
	t = clamp(t, 0.0, 1.0)
	return 1.0 - (1.0 - t) * (1.0 - t)

func ease_in_quad(t: float) -> float:
	t = clamp(t, 0.0, 1.0)
	return t * t

# ==============================================================================
# 核心像素绘图引擎：100% 连续流体动作动画控制器
# ==============================================================================
func render_dragon_pixel_frame() -> void:
	img.fill(C_TRANSPARENT)
	
	# 当前动作进度 (0.0 -> 1.0)
	var p = clamp(anim_timer / max(0.001, anim_duration), 0.0, 1.0)
	
	# 待机自然呼吸微动（胸腔与脊背起伏）
	var breath = sin(idle_time * 2.2) * (1.0 - walk_weight * 0.8)
	# 行走自然起伏与左右重心摇摆（连续双步态起伏）
	var walk_bob = sin(walk_time * 2.0) * 2.0 * walk_weight
	var walk_sway_x = sin(walk_time) * 1.5 * walk_weight
	var body_bob_total = breath * 1.2 + walk_bob

	# 地面基准线 (Y = 148)
	var ground_y: int = 148
	var hip_pos := Vector2(105 + walk_sway_x * 0.4, 112 + body_bob_total)
	var shoulder_pos := Vector2(158 + walk_sway_x, 110 + body_bob_total)

	# 肚内闷爆全身后坐力位移 (爆炸时整个身躯向后仰、震颤)
	var explode_recoil: float = 0.0
	if anim_state == "BELLY_EXPLODE":
		explode_recoil = sin(clamp(p * PI * 1.8, 0.0, PI)) * exp(-p * 3.2)
		hip_pos += Vector2(-explode_recoil * 6.0, -explode_recoil * 3.0)
		shoulder_pos += Vector2(-explode_recoil * 7.5, -explode_recoil * 4.5)
	elif anim_state == "EAT_HUMAN":
		# 挑人俯身与吞咽时身体重心自然参与倾斜
		if p < 0.28:
			var t = ease_smooth(p / 0.28)
			shoulder_pos.y += sin(t * PI) * 2.2
		elif p >= 0.68 and p < 0.88:
			var t = ease_smooth((p - 0.68) / 0.20)
			shoulder_pos.x -= sin(t * PI) * 2.5 # 仰头吞咽时微后仰

	# --------------------------------------------------------------------------
	# 四足步态动力学（采用对角马步/对角协调步态，脚步沿平滑曲线迈出）
	# --------------------------------------------------------------------------
	# 腿部相位：内侧对角组(相位0) 与 外侧对角组(相位PI)
	var gait_inner_hind = calculate_foot_motion(walk_time + PI, ground_y)
	var gait_inner_fore = calculate_foot_motion(walk_time, ground_y)
	var gait_outer_hind = calculate_foot_motion(walk_time, ground_y)
	var gait_outer_fore = calculate_foot_motion(walk_time + PI, ground_y)

	# --------------------------------------------------------------------------
	# 1. 绘制远侧（内侧）前后腿（深色阴影，步态真实踩地与向前摆腿）
	# --------------------------------------------------------------------------
	var inner_hind_joint = hip_pos + Vector2(-4, 0)
	var inner_fore_joint = shoulder_pos + Vector2(-4, 0)
	draw_dragon_leg(inner_hind_joint, inner_hind_joint.x + 3 + gait_inner_hind.x, gait_inner_hind.y, C_SCALE_DARK, true)
	draw_dragon_leg(inner_fore_joint, inner_fore_joint.x + 3 + gait_inner_fore.x, gait_inner_fore.y, C_SCALE_DARK, false)

	# --------------------------------------------------------------------------
	# 2. 绘制长尾巴（向后优雅弯曲上扬，行云流水般的波浪动力学，带背刺）
	# --------------------------------------------------------------------------
	var tail_wave_idle = sin(idle_time * 2.0) * 3.5
	var tail_wave_walk = sin(walk_time * 1.0) * 6.5 * walk_weight
	var tail_total_wag = tail_wave_idle + tail_wave_walk - explode_recoil * 10.0
	
	for i in range(68):
		var t = float(i) / 68.0
		var tx = int(hip_pos.x - 8 - i * 1.35)
		# 引入随长度 t 递增的相位延迟，产生如游龙般的鞭状流动弧度
		var wave_lag = sin(idle_time * 2.4 - t * 3.5) * 4.0 * t
		var ty = int(hip_pos.y - 2 + sin(t * 3.8) * 10.0 - t * 18.0 + tail_total_wag * t + wave_lag)
		var radius = int(lerp(7.5, 1.5, t))
		draw_pixel_circle(tx, ty, radius, C_SCALE_MAIN, true)
		if i % 8 == 2 and i < 55:
			draw_pixel_triangle(tx, ty - radius, 3, 4, C_SCALE_LIGHT) # 尾部背刺

	# --------------------------------------------------------------------------
	# 3. 绘制躯干脊背与背刺
	# --------------------------------------------------------------------------
	for x in range(int(hip_pos.x), int(shoulder_pos.x) + 1):
		var t = float(x - hip_pos.x) / max(1.0, shoulder_pos.x - hip_pos.x)
		var by = int(lerp(hip_pos.y, shoulder_pos.y, t))
		draw_pixel_circle(x, by, 10, C_SCALE_MAIN, true)
		draw_pixel_circle(x, by - 5, 4, C_SCALE_LIGHT, false)
		if (x - int(hip_pos.x)) % 9 == 4:
			draw_pixel_triangle(x, by - 10, 3, 4, C_SCALE_LIGHT)

	# --------------------------------------------------------------------------
	# 4. 绘制身下膨胀的肚子（严格在前后腿之间、身下垂坠、不朝前挺、不贴地）
	# --------------------------------------------------------------------------
	var belly_center_x = int((hip_pos.x + shoulder_pos.x) * 0.5) + 2
	# 连续浮点半径计算，带平滑果冻抖动与爆炸冲击波
	var base_r = 9.0 + current_belly_size * 1.45 + explode_bulge + belly_jiggle
	var belly_center_y = int(116 + current_belly_size * 0.85 + explode_bulge * 0.35 + body_bob_total)
	
	var rx = int(max(4.0, base_r * 1.28))
	var ry = int(max(4.0, base_r * 0.96))
	var belly_fill = C_BELLY_MAIN.lerp(C_EXPLODE_GLOW, clamp(explode_flash, 0.0, 1.0))
	draw_pixel_ellipse(belly_center_x, belly_center_y, rx, ry, belly_fill, true)
	
	# 肚子下半部阴影弧线
	draw_pixel_ellipse(belly_center_x, belly_center_y + 2, max(2, rx - 2), max(2, ry - 2), C_BELLY_DARK.lerp(C_EXPLODE_GLOW, clamp(explode_flash, 0.0, 1.0)), false)
	draw_pixel_ellipse(belly_center_x, belly_center_y - 1, max(1, rx - 3), max(1, ry - 3), belly_fill, false)

	# --------------------------------------------------------------------------
	# 5. 绘制近侧（外侧）前后粗壮四肢与龙爪（真实迈步交替与抓地）
	# --------------------------------------------------------------------------
	var outer_hind_joint = hip_pos + Vector2(3, 0)
	var outer_fore_joint = shoulder_pos + Vector2(3, 0)
	draw_dragon_leg(outer_hind_joint, outer_hind_joint.x + 3 + gait_outer_hind.x, gait_outer_hind.y, C_SCALE_MAIN, true)
	draw_dragon_leg(outer_fore_joint, outer_fore_joint.x + 3 + gait_outer_fore.x, gait_outer_fore.y, C_SCALE_MAIN, false)

	# --------------------------------------------------------------------------
	# 6. 绘制加长版帅气龙翼（待机柔和呼吸、行走微煽、爆炸惊起舒展）
	# --------------------------------------------------------------------------
	var wing_breath = sin(idle_time * 1.8) * 2.2 * (1.0 - walk_weight * 0.7)
	var wing_walk = sin(walk_time * 0.9) * 5.0 * walk_weight
	var wing_explode = -explode_recoil * 12.0 if anim_state == "BELLY_EXPLODE" else 0.0
	var wing_flap = wing_breath + wing_walk + wing_explode

	var wing_root := shoulder_pos + Vector2(-4, -8)
	var wing_elbow := wing_root + Vector2(-28, -32 + wing_flap)
	var wing_tip := wing_elbow + Vector2(-58, 12 + wing_flap * 1.35)
	
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
	# 7. 头部、颈部与动作特写（挑人腾空 -> 接咬 -> 仰头滑喉入腹 / 低头吞雷 -> 肚内闷爆）
	# --------------------------------------------------------------------------
	var neck_base := shoulder_pos + Vector2(6, -6)
	var idle_head_offset := Vector2(22, -26) + Vector2(0, breath * 1.5 + walk_bob * 0.6)
	var head_pos := neck_base + idle_head_offset
	
	var jaw_open: float = 0.0
	var swallow_lump_t: float = -1.0 # 0.0~1.0 沿脖子连续滑落入腹
	var prey_pos := Vector2.ZERO
	var show_prey_type: String = ""

	if anim_state == "EAT_HUMAN":
		var human_ground_x = neck_base.x + 48.0
		var human_ground_y = float(ground_y - 4)

		if p < 0.28:
			# 阶段1：平滑俯身贴地，吻部伸向小人脚下准备挑起 (0.0 -> 0.28)
			var t1 = ease_smooth(p / 0.28)
			head_pos = neck_base + idle_head_offset.lerp(Vector2(32, 6), t1)
			jaw_open = lerp(0.0, 0.2, t1)
			show_prey_type = "HUMAN"
			prey_pos = Vector2(human_ground_x, human_ground_y)
			
		elif p < 0.50:
			# 阶段2：猛然扬头挑飞小人，小人沿平滑抛物线飞向空中 (0.28 -> 0.50)
			var t2 = (p - 0.28) / 0.22
			var t2_ease = ease_smooth(t2)
			head_pos = neck_base + Vector2(32, 6).lerp(Vector2(20, -22), t2_ease)
			jaw_open = lerp(0.2, 0.0, t2_ease)
			show_prey_type = "HUMAN"
			
			# 小人沿抛物线上升至顶点
			var throw_arc = sin(t2 * (PI * 0.5))
			var throw_x = lerp(human_ground_x, neck_base.x + 42.0, t2)
			var throw_y = lerp(human_ground_y, neck_base.y - 48.0, throw_arc)
			prey_pos = Vector2(throw_x, throw_y)
			
		elif p < 0.68:
			# 阶段3：小人从最高点下落，龙头前伸张大嘴迎面准确咬住 (0.50 -> 0.68)
			var t3 = (p - 0.50) / 0.18
			var t3_ease = ease_smooth(t3)
			head_pos = neck_base + Vector2(20, -22).lerp(Vector2(35, -20), t3_ease)
			
			# 龙嘴先大张迎合、再迅猛咬紧
			if t3 < 0.6:
				jaw_open = ease_smooth(t3 / 0.6)
			else:
				jaw_open = 1.0 - ease_smooth((t3 - 0.6) / 0.4)
			
			# 小人下落进龙嘴
			if t3 < 0.75:
				show_prey_type = "HUMAN"
				var mouth_catch_pos = head_pos + Vector2(14, 2)
				var apex_pos = Vector2(neck_base.x + 42.0, neck_base.y - 48.0)
				prey_pos = apex_pos.lerp(mouth_catch_pos, ease_in_quad(t3 / 0.75))
			else:
				# 咬入口中完全闭合，消失进嘴
				show_prey_type = ""
				
		elif p < 0.88:
			# 阶段4：仰头大口吞咽，喉结鼓包顺着修长龙颈平滑滑落入腹 (0.68 -> 0.88)
			var t4 = (p - 0.68) / 0.20
			var t4_ease = ease_smooth(t4)
			head_pos = neck_base + Vector2(35, -20).lerp(Vector2(14, -36), t4_ease)
			jaw_open = 0.0
			swallow_lump_t = t4 # 连续滑落 (0.0 -> 1.0)
			
		else:
			# 阶段5：吞咽完成，龙头从仰头姿势自然回落到呼吸待机 (0.88 -> 1.0)
			var t5 = (p - 0.88) / 0.12
			var t5_ease = ease_smooth(t5)
			head_pos = neck_base + Vector2(14, -36).lerp(idle_head_offset, t5_ease)
			jaw_open = 0.0

	elif anim_state == "EAT_GRENADE":
		var grenade_pos = Vector2(neck_base.x + 38.0, float(ground_y - 4))
		
		if p < 0.40:
			# 阶段1：平滑低头贴地，龙嘴大张覆盖手雷 (0.0 -> 0.40)
			var t1 = ease_smooth(p / 0.40)
			head_pos = neck_base + idle_head_offset.lerp(Vector2(32, 12), t1)
			jaw_open = ease_smooth(t1)
			show_prey_type = "GRENADE"
			prey_pos = grenade_pos
			
		elif p < 0.70:
			# 阶段2：大口咬紧手雷，闭嘴并顺势平滑抬头 (0.40 -> 0.70)
			var t2 = (p - 0.40) / 0.30
			var t2_ease = ease_smooth(t2)
			head_pos = neck_base + Vector2(32, 12).lerp(Vector2(26, -14), t2_ease)
			if t2 < 0.35:
				jaw_open = 1.0 - ease_smooth(t2 / 0.35)
			else:
				jaw_open = 0.0
			show_prey_type = ""
			
		else:
			# 阶段3：迅速将手雷吞咽入腹，头部顺滑回到中位衔接闷爆 (0.70 -> 1.0)
			var t3 = (p - 0.70) / 0.30
			var t3_ease = ease_smooth(t3)
			head_pos = neck_base + Vector2(26, -14).lerp(idle_head_offset, t3_ease)
			jaw_open = 0.0
			swallow_lump_t = t3

	elif anim_state == "BELLY_EXPLODE":
		# 肚内闷爆：爆炸使头部猛烈昂起后仰、龙嘴被震开呛烟
		head_pos = neck_base + idle_head_offset + Vector2(-explode_recoil * 14.0, -explode_recoil * 12.0)
		jaw_open = clamp(explode_recoil * 0.75, 0.0, 1.0)

	# --------------------------------------------------------------------------
	# 绘制修长龙颈与浅蓝喉腹甲（自适应贝塞尔/线性插值关节）
	# --------------------------------------------------------------------------
	var neck_steps = 18
	for s in range(neck_steps + 1):
		var st = float(s) / neck_steps
		var nx = int(lerp(neck_base.x, head_pos.x, st))
		var ny = int(lerp(neck_base.y, head_pos.y, st))
		var nr = int(lerp(8.5, 6.0, st))
		draw_pixel_circle(nx, ny, nr, C_SCALE_MAIN, true)
		draw_pixel_circle(nx + 2, ny + 2, nr - 2, C_BELLY_MAIN, false)

	# --------------------------------------------------------------------------
	# 绘制顺着龙颈一路滑进肚子里的立体鼓包 (彻底杜绝突变，全程可见)
	# --------------------------------------------------------------------------
	if swallow_lump_t >= 0.0:
		var lx = 0
		var ly = 0
		if swallow_lump_t < 0.72:
			# 顺着脖子从下巴滑向胸肩
			var lt = swallow_lump_t / 0.72
			lx = int(lerp(head_pos.x + 3, neck_base.x + 3, lt))
			ly = int(lerp(head_pos.y + 6, neck_base.y + 4, lt))
		else:
			# 从胸肩继续滑入肚子正中心
			var lt = (swallow_lump_t - 0.72) / 0.28
			lx = int(lerp(neck_base.x + 3, float(belly_center_x), lt))
			ly = int(lerp(neck_base.y + 4, float(belly_center_y) - 6.0, lt))
			
		draw_pixel_circle(lx, ly, 6, C_BELLY_MAIN, true)
		draw_pixel_circle(lx + 1, ly + 1, 4, C_SCALE_LIGHT, false)

	# 绘制帅气龙头、双龙角、锐利龙眼与张合龙嘴
	draw_dragon_head(head_pos, jaw_open)

	# 绘制被挑起的小人 或 地上被咬住的手雷
	if show_prey_type == "HUMAN":
		draw_mini_human(prey_pos)
	elif show_prey_type == "GRENADE":
		draw_pixel_circle(int(prey_pos.x), int(prey_pos.y), 4, Color(0.2, 0.75, 0.25), true)

# ==============================================================================
# 真实四足步态计算辅助函数（支持前后脚交替抬起与抓地滑步）
# ==============================================================================
func calculate_foot_motion(phi: float, g_y: int) -> Vector2:
	var u = fposmod(phi, TAU) / TAU # 0.0 ~ 1.0
	var stride_len = 10.0 * walk_weight
	var off_x: float = 0.0
	var foot_y: float = float(g_y)
	
	if u < 0.5:
		# 支撑相（脚掌着地向后蹬推）
		var st = u / 0.5
		off_x = lerp(stride_len, -stride_len, st)
		foot_y = float(g_y)
	else:
		# 摆动相（脚掌抬起离开地面向前迈步）
		var sw = (u - 0.5) / 0.5
		off_x = lerp(-stride_len, stride_len, sw)
		foot_y = float(g_y) - sin(sw * PI) * 5.5 * walk_weight
		
	return Vector2(off_x, foot_y)

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
	# 下颌（根据 jaw_open 连续角度向下旋转）
	var jaw_drop = int(jaw_open * 10.0)
	if jaw_open > 0.05:
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

func draw_dragon_leg(joint_pos: Vector2, foot_x: float, foot_y: float, col: Color, is_hind: bool) -> void:
	var jx = int(joint_pos.x)
	var jy = int(joint_pos.y)
	var fx = int(foot_x)
	var fy = int(foot_y)
	
	# 根据脚掌位置动态计算膝关节自然折叠弯曲度
	var knee_x = int(lerp(float(jx), float(fx), 0.45)) + (-4 if is_hind else 4)
	var knee_y = int(lerp(float(jy), float(fy), 0.50)) - 1
	
	# 大腿肌肉
	draw_pixel_thick_line(Vector2(jx, jy), Vector2(knee_x, knee_y), 5, col)
	# 小腿与踝关节
	draw_pixel_thick_line(Vector2(knee_x, knee_y), Vector2(fx, fy - 2), 4, col)
	# 龙爪脚掌（抓紧地面）
	draw_pixel_ellipse(fx + 3, fy - 2, 6, 3, col, true)
	set_px(fx + 9, fy - 1, C_HORN)
	set_px(fx + 8, fy - 2, C_HORN)

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
		var span = int(lerp(float(w), 0.0, float(y) / max(1, h)))
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
	draw_rect(Rect2(20, 20, 750, 120), Color(0, 0, 0, 0.70))
	
	var state_desc = "待机自然呼吸"
	if anim_state == "WALK": state_desc = "四足交替行进步态"
	elif anim_state == "EAT_HUMAN": state_desc = "平滑挑空+前探迎面接咬+仰头滑喉吞咽中..."
	elif anim_state == "EAT_GRENADE": state_desc = "平滑低头吞入延时手雷..."
	elif anim_state == "BELLY_EXPLODE": state_desc = "肚内剧烈闷爆震颤、全身后坐力与瞬间清空！"
	
	draw_string(ThemeDB.fallback_font, Vector2(36, 48), "四足蓝龙连续高保真动画控制器（腹中人数：%d / 10 | 动作：%s）" % [belly_count, state_desc], HORIZONTAL_ALIGNMENT_LEFT, -1, 18, Color(0.4, 0.85, 1.0))
	draw_string(ThemeDB.fallback_font, Vector2(36, 78), "[A / D 或 左右键] 四足平滑迈步   [上 / 下方向键] 腹部果冻弹性缩放", HORIZONTAL_ALIGNMENT_LEFT, -1, 15, Color.WHITE)
	draw_string(ThemeDB.fallback_font, Vector2(36, 105), "[1 键] 连贯挑人腾空+接咬+滑喉入腹鼓胀   [2 键] 低头吞雷+滑喉+肚内剧烈闷爆消化", HORIZONTAL_ALIGNMENT_LEFT, -1, 15, Color(1.0, 0.85, 0.3))
