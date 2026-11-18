extends Node2D

# ==============================================================================
# 四种敌方士兵像素外形与双阶段 AI 动作渲染器（巡逻乱走 -> 靠近切换战斗形态）
# 严格按照复古像素颗粒感（3倍缩放、深色描边、战术服装与遮眼帽子）与双阶段 AI 架构编写
# ==============================================================================

enum EnemyType {
	BLUE_CAP,     # 蓝帽：拿电击枪，平举瞄准并爆出蓝白电火花
	GRAY_CAP,     # 灰帽：高速冲锋，身体大幅前倾、大步狂奔与尘土飞扬
	ORANGE_CAP,   # 橘/红帽：背部装配红色燃料罐，双手平端喷火枪蓄力
	BLACK_SPECOPS # 黑色特种兵：黑色强化战甲，单手高举手雷蓄力抛投
}

enum AIState {
	PATROL,       # 离得远：悠闲散步、随机左右乱走变向、偶尔驻足
	COMBAT        # 靠近龙：警惕转身、进入攻击射程并切换各自战斗形态
}

# 像素画布与调色板（严格还原遮眼帽子、深色轮廓描边与战术服装）
const SPRITE_W: int = 44
const SPRITE_H: int = 56
const PIXEL_SCALE: float = 3.0 # 3倍像素放大，与蓝龙像素颗粒完全一致

const C_CLEAR       = Color(0, 0, 0, 0)
const C_OUTLINE     = Color(0.05, 0.06, 0.10) # 深黑像素描边
const C_SKIN        = Color(0.90, 0.74, 0.62) # 下半张脸肤色（上半张脸被帽子遮住）
const C_UNIFORM     = Color(0.20, 0.24, 0.30) # 常规特工深灰蓝制服
const C_UNIFORM_DK  = Color(0.12, 0.15, 0.20) # 制服阴影与长裤
const C_SPECOPS     = Color(0.10, 0.11, 0.14) # 黑色特种兵装甲
const C_SPECOPS_LT  = Color(0.22, 0.24, 0.28) # 特种兵护甲高光

# 模拟蓝龙的位置（你可以按 A/D 移动这个标靶来测试“远离 -> 靠近”的形态切换）
var target_dragon_x: float = 200.0
var enemies: Array[Dictionary] = []

func _ready() -> void:
	DisplayServer.window_set_size(Vector2i(1152, 648))
	spawn_four_enemies()

func spawn_four_enemies() -> void:
	# 先清除可能存在的旧节点
	for e in enemies:
		if e.has("sprite") and is_instance_valid(e["sprite"]):
			e["sprite"].queue_free()
	enemies.clear()

	var configs = [
		{"type": EnemyType.BLUE_CAP,      "x": 560.0, "detect_range": 260.0},
		{"type": EnemyType.GRAY_CAP,      "x": 720.0, "detect_range": 290.0},
		{"type": EnemyType.ORANGE_CAP,    "x": 880.0, "detect_range": 270.0},
		{"type": EnemyType.BLACK_SPECOPS, "x": 1030.0, "detect_range": 310.0}
	]
	
	for cfg in configs:
		var img = Image.create(SPRITE_W, SPRITE_H, false, Image.FORMAT_RGBA8)
		var tex = ImageTexture.create_from_image(img)
		var sp = Sprite2D.new()
		sp.texture = tex
		sp.texture_filter = CanvasItem.TEXTURE_FILTER_NEAREST
		sp.scale = Vector2(PIXEL_SCALE, PIXEL_SCALE)
		add_child(sp)
		
		enemies.append({
			"type": cfg["type"],
			"state": AIState.PATROL,
			"pos": Vector2(cfg["x"], 490.0),
			"home_x": cfg["x"],
			"dir": -1,                      # -1朝左，1朝右
			"patrol_timer": randf() * 2.0,  # 左右乱走随机变向计时
			"walk_phase": randf() * 6.0,    # 走路/跑步腿部摆动相位
			"detect_range": cfg["detect_range"],
			"action_timer": 0.0,            # 举枪射击 / 举手雷蓄力计时
			"img": img,
			"tex": tex,
			"sprite": sp
		})

func _process(delta: float) -> void:
	# 按 A/D 或左右方向键控制模拟的“蓝龙”靠近或远离，观察四个人的形态变化
	var move := 0.0
	if Input.is_key_pressed(KEY_D) or Input.is_key_pressed(KEY_RIGHT):
		move += 1.0
	if Input.is_key_pressed(KEY_A) or Input.is_key_pressed(KEY_LEFT):
		move -= 1.0
	target_dragon_x = clamp(target_dragon_x + move * 340.0 * delta, 80.0, 1080.0)

	# 按 R 键重置四人位置与初始状态
	if Input.is_key_just_pressed(KEY_R):
		spawn_four_enemies()
		return

	for e in enemies:
		update_enemy_ai(e, delta)
		render_enemy_pixel_art(e)
		e["sprite"].position = e["pos"] + Vector2(0, -SPRITE_H * PIXEL_SCALE * 0.5)
		e["sprite"].flip_h = (e["dir"] == -1)

	queue_redraw()

# ==============================================================================
# 第一部分：双阶段行为状态机（远离时左右乱走巡逻 -> 靠近时切换战斗形态）
# ==============================================================================
func update_enemy_ai(e: Dictionary, delta: float) -> void:
	var dist_to_dragon = abs(e["pos"].x - target_dragon_x)
	var dir_to_dragon = -1 if target_dragon_x < e["pos"].x else 1

	# 判断距离：靠近警戒线时立刻切换战斗形态；远离时恢复慢速巡逻左右乱走
	if dist_to_dragon <= e["detect_range"]:
		if e["state"] != AIState.COMBAT:
			e["state"] = AIState.COMBAT
			e["action_timer"] = 0.0
		e["dir"] = dir_to_dragon
	else:
		e["state"] = AIState.PATROL

	# --- 状态 1：离得远，悠闲散步、左右乱走 ---
	if e["state"] == AIState.PATROL:
		e["patrol_timer"] -= delta
		if e["patrol_timer"] <= 0.0:
			# 随机决定向左走、向右走或短暂驻足张望
			e["patrol_timer"] = randf_range(1.2, 2.8)
			var choices = [-1, 1, -1, 1, 0]
			e["dir"] = choices[randi() % choices.size()]
		
		if e["dir"] != 0:
			e["pos"].x += e["dir"] * 48.0 * delta # 慢速悠闲巡逻步行
			e["walk_phase"] += delta * 6.5
			# 限制在各自巡逻点附近左右乱走，不走出屏幕
			if abs(e["pos"].x - e["home_x"]) > 95.0:
				e["dir"] = -1 if e["pos"].x > e["home_x"] else 1
		else:
			e["walk_phase"] = 0.0

	# --- 状态 2：靠近龙后，立刻变换各自战斗形态 ---
	elif e["state"] == AIState.COMBAT:
		e["action_timer"] += delta
		match e["type"]:
			EnemyType.BLUE_CAP:
				# 蓝帽：站定举起电击枪瞄准放电
				e["walk_phase"] = 0.0
				
			EnemyType.GRAY_CAP:
				# 灰帽：直接朝龙高速冲刺跑过去
				if dist_to_dragon > 45.0:
					e["pos"].x += e["dir"] * 250.0 * delta
					e["walk_phase"] += delta * 18.0 # 高频跑步摆腿
				else:
					e["walk_phase"] = 0.0
					
			EnemyType.ORANGE_CAP:
				# 橘帽：站定双手端起喷火枪，每3秒发射小火球
				e["walk_phase"] = 0.0
				if e["action_timer"] >= 3.0:
					e["action_timer"] = 0.0
					
			EnemyType.BLACK_SPECOPS:
				# 黑色特种兵：立刻高举手雷进入10秒投掷准备
				e["walk_phase"] = 0.0
				if e["action_timer"] >= 10.0:
					e["action_timer"] = 0.0

# ==============================================================================
# 第二部分：逐像素绘制四种人类外形与动作姿态（默认朝右绘制，flip_h自动翻转朝左）
# ==============================================================================
func render_enemy_pixel_art(e: Dictionary) -> void:
	var img: Image = e["img"]
	img.fill(C_CLEAR)
	
	var t: EnemyType = e["type"]
	var st: AIState = e["state"]
	var phase: float = e["walk_phase"]
	var is_running: bool = (st == AIState.COMBAT and t == EnemyType.GRAY_CAP)
	
	# 基准中心点（X = 22, 脚底 Y = 53）
	var cx: int = 22
	var foot_y: int = 53
	var body_lean: int = 2 if is_running else 0 # 灰帽冲锋时身体明显前倾
	var bob: int = int(abs(sin(phase)) * (2.0 if is_running else 1.0)) if phase > 0.0 else 0

	# 确定服装与帽子颜色
	var suit_main = C_SPECOPS if t == EnemyType.BLACK_SPECOPS else C_UNIFORM
	var suit_dark = C_SPECOPS if t == EnemyType.BLACK_SPECOPS else C_UNIFORM_DK
	var hat_color = Color(0.18, 0.50, 1.0) # 默认蓝帽
	if t == EnemyType.GRAY_CAP:
		hat_color = Color(0.55, 0.58, 0.62)
	elif t == EnemyType.ORANGE_CAP:
		hat_color = Color(1.0, 0.42, 0.08)
	elif t == EnemyType.BLACK_SPECOPS:
		hat_color = Color(0.08, 0.09, 0.12)

	# --------------------------------------------------------------------------
	# 1. 绘制双腿动作（慢速巡逻走路 vs 灰帽高速跑步迈大步）
	# --------------------------------------------------------------------------
	var stride = (7.0 if is_running else 4.0) if phase > 0.0 else 0.0
	var leg_l_offset = int(sin(phase) * stride)
	var leg_r_offset = -leg_l_offset
	var lift_l = int(max(0.0, -cos(phase)) * (4.0 if is_running else 2.0)) if phase > 0.0 else 0
	var lift_r = int(max(0.0, cos(phase)) * (4.0 if is_running else 2.0)) if phase > 0.0 else 0

	# 里侧腿（阴影色）
	draw_limb(img, Vector2(cx - 1, 38 + bob), Vector2(cx - 1 + leg_l_offset, foot_y - lift_l), 3, suit_dark)
	# 外侧腿（主色）
	draw_limb(img, Vector2(cx + 1, 38 + bob), Vector2(cx + 1 + leg_r_offset, foot_y - lift_r), 3, suit_main)

	# 冲锋时脚下扬起尘土粒子（灰帽专属）
	if is_running and int(phase * 2.0) % 2 == 0:
		draw_circle_px(img, cx - 10, foot_y - 2, 2, Color(0.75, 0.75, 0.75), false)
		draw_circle_px(img, cx - 14, foot_y - 4, 1, Color(0.65, 0.65, 0.65), false)

	# --------------------------------------------------------------------------
	# 2. 如果是橘帽火焰兵，背部绘制红色喷火器燃料罐
	# --------------------------------------------------------------------------
	if t == EnemyType.ORANGE_CAP:
		draw_rect_px(img, cx - 8 + body_lean, 23 + bob, 5, 13, Color(0.85, 0.18, 0.12), true)
		draw_rect_px(img, cx - 7 + body_lean, 25 + bob, 2, 9, Color(1.0, 0.55, 0.20), false)

	# --------------------------------------------------------------------------
	# 3. 绘制躯干与战术背心护甲
	# --------------------------------------------------------------------------
	var torso_x = cx - 5 + body_lean
	var torso_y = 22 + bob
	draw_rect_px(img, torso_x, torso_y, 10, 16, suit_main, true)
	if t == EnemyType.BLACK_SPECOPS:
		# 黑色特种兵胸甲高光线条
		draw_rect_px(img, torso_x + 2, torso_y + 2, 6, 8, C_SPECOPS_LT, false)

	# --------------------------------------------------------------------------
	# 4. 绘制头部与压低遮住眼睛的帽子（不露脸神秘造型）
	# --------------------------------------------------------------------------
	var head_x = cx + body_lean
	var head_y = 15 + bob
	# 下半张脸（只露出下巴和嘴部轮廓）
	draw_circle_px(img, head_x, head_y, 5, C_SKIN, true)
	# 压低帽檐遮住眼睛！
	draw_rect_px(img, head_x - 6, head_y - 6, 12, 6, hat_color, true) # 帽冠
	draw_rect_px(img, head_x - 5, head_y - 1, 14, 3, hat_color, true) # 向前伸出的压低帽檐（彻底遮眼）
	# 帽檐下方的眼睛阴影线
	draw_rect_px(img, head_x - 3, head_y + 1, 8, 1, C_OUTLINE, false)

	# --------------------------------------------------------------------------
	# 5. 绘制手臂与形态变换（巡逻垂手 vs 靠近后举电击枪 / 跑步摆臂 / 端喷火枪 / 高举手雷）
	# --------------------------------------------------------------------------
	var shoulder = Vector2(cx + 1 + body_lean, 25 + bob)

	if st == AIState.PATROL:
		# 【离得远：慢速走路姿态】手臂随步伐自然前后微摆，武器收在身侧
		var arm_swing = int(sin(phase) * 3.0) if phase > 0.0 else 0
		draw_limb(img, shoulder, shoulder + Vector2(-arm_swing, 11), 2, suit_main)
		if t == EnemyType.BLUE_CAP:
			# 垂手拿着电击枪
			draw_rect_px(img, int(shoulder.x - arm_swing), int(shoulder.y + 10), 6, 3, Color(0.30, 0.70, 1.00), true)
		elif t == EnemyType.ORANGE_CAP:
			# 垂手提着喷火枪管
			draw_rect_px(img, int(shoulder.x - arm_swing - 2), int(shoulder.y + 10), 10, 3, Color(0.35, 0.35, 0.40), true)

	elif st == AIState.COMBAT:
		# 【靠近龙：立刻变换各自战斗形态】
		match t:
			EnemyType.BLUE_CAP:
				# 蓝帽形态：双臂平举电击枪，枪口闪烁高频蓝白电流！
				draw_limb(img, shoulder, shoulder + Vector2(9, 0), 2, suit_main)
				draw_rect_px(img, int(shoulder.x + 7), int(shoulder.y - 2), 9, 4, Color(0.25, 0.55, 0.95), true)
				# 枪口电弧闪烁特效
				var spark_r = 2 + (int(e["action_timer"] * 18.0) % 3)
				draw_circle_px(img, int(shoulder.x + 18), int(shoulder.y), spark_r, Color(0.50, 0.95, 1.00), false)
				set_px(img, int(shoulder.x + 20), int(shoulder.y - 2), Color.WHITE)
				set_px(img, int(shoulder.x + 19), int(shoulder.y + 3), Color.WHITE)

			EnemyType.GRAY_CAP:
				# 灰帽形态：双臂剧烈前后摆动，全力冲锋姿态
				var run_arm = int(sin(phase) * 6.0)
				draw_limb(img, shoulder, shoulder + Vector2(run_arm, 7), 2, suit_main)

			EnemyType.ORANGE_CAP:
				# 橘帽形态：双手端起厚重喷火枪，枪口持续燃着火苗（每3秒喷火球）
				draw_limb(img, shoulder, shoulder + Vector2(8, 2), 2, suit_main)
				draw_rect_px(img, int(shoulder.x + 5), int(shoulder.y), 13, 4, Color(0.30, 0.32, 0.36), true)
				draw_rect_px(img, int(shoulder.x + 15), int(shoulder.y - 1), 3, 6, Color(0.85, 0.25, 0.10), true)
				# 枪口点火苗与蓄力火球提示
				var flame_size = 3 if e["action_timer"] > 2.5 else 2
				draw_circle_px(img, int(shoulder.x + 20), int(shoulder.y + 1), flame_size, Color(1.0, 0.45, 0.05), false)
				set_px(img, int(shoulder.x + 20), int(shoulder.y + 1), Color.YELLOW)

			EnemyType.BLACK_SPECOPS:
				# 黑色特种兵形态：立刻高举右手握住手雷，准备抛投！
				var throw_bob = int(sin(e["action_timer"] * 6.0) * 1.5)
				var hand_pos = shoulder + Vector2(4, -12 + throw_bob)
				draw_limb(img, shoulder, hand_pos, 2, C_SPECOPS)
				# 手中高举的绿色手雷（带保险拉环高光）
				draw_circle_px(img, int(hand_pos.x + 1), int(hand_pos.y - 3), 3, Color(0.18, 0.65, 0.25), true)
				set_px(img, int(hand_pos.x + 2), int(hand_pos.y - 6), Color.YELLOW)

	e["tex"].update(img)

# ==============================================================================
# 第三部分：底层像素绘制工具（自动描边）
# ==============================================================================
func set_px(img: Image, x: int, y: int, c: Color) -> void:
	if x >= 0 and x < SPRITE_W and y >= 0 and y < SPRITE_H:
		img.set_pixel(x, y, c)

func draw_rect_px(img: Image, x: int, y: int, w: int, h: int, col: Color, outline: bool) -> void:
	if outline:
		for py in range(y - 1, y + h + 1):
			for px in range(x - 1, x + w + 1):
				if px >= 0 and px < SPRITE_W and py >= 0 and py < SPRITE_H:
					if img.get_pixel(px, py) == C_CLEAR:
						set_px(img, px, py, C_OUTLINE)
	for py in range(y, y + h):
		for px in range(x, x + w):
			set_px(img, px, py, col)

func draw_circle_px(img: Image, cx: int, cy: int, r: int, col: Color, outline: bool) -> void:
	if outline:
		for dy in range(-r - 1, r + 2):
			for dx in range(-r - 1, r + 2):
				if dx * dx + dy * dy <= (r + 1) * (r + 1):
					var px = cx + dx
					var py = cy + dy
					if px >= 0 and px < SPRITE_W and py >= 0 and py < SPRITE_H:
						if img.get_pixel(px, py) == C_CLEAR:
							set_px(img, px, py, C_OUTLINE)
	for dy in range(-r, r + 1):
		for dx in range(-r, r + 1):
			if dx * dx + dy * dy <= r * r:
				set_px(img, cx + dx, cy + dy, col)

func draw_limb(img: Image, a: Vector2, b: Vector2, r: int, col: Color) -> void:
	var steps = int(a.distance_to(b)) + 1
	for i in range(steps + 1):
		var pt = a.lerp(b, float(i) / max(1, steps))
		draw_circle_px(img, int(pt.x), int(pt.y), r, col, true)

# ==============================================================================
# 第四部分：界面提示与警戒范围可视化（方便观察“靠近变形态”的触发边界）
# ==============================================================================
func _draw() -> void:
	# 绘制深科技感实验室背景与地面
	draw_rect(Rect2(0, 0, 1152, 490), Color(0.14, 0.17, 0.22))
	draw_rect(Rect2(0, 490, 1152, 158), Color(0.24, 0.27, 0.32))
	draw_line(Vector2(0, 490), Vector2(1152, 490), Color(0.45, 0.55, 0.65), 4.0)

	# 绘制每个士兵的警戒检测范围（黄色半透明虚线区域，方便观察边界）
	for e in enemies:
		var rx: float = e["detect_range"]
		var left_bound: float = e["pos"].x - rx
		var right_bound: float = e["pos"].x + rx
		draw_line(Vector2(left_bound, 488), Vector2(right_bound, 488), Color(1.0, 0.82, 0.2, 0.35), 2.0)
		draw_line(Vector2(left_bound, 480), Vector2(left_bound, 492), Color(1.0, 0.82, 0.2, 0.6), 2.0)
		draw_line(Vector2(right_bound, 480), Vector2(right_bound, 492), Color(1.0, 0.82, 0.2, 0.6), 2.0)

	# 绘制模拟蓝龙位置的警戒标记线
	draw_line(Vector2(target_dragon_x, 260), Vector2(target_dragon_x, 490), Color(0.2, 0.6, 1.0, 0.65), 3.0)
	draw_circle(Vector2(target_dragon_x, 490), 6.0, Color(0.3, 0.8, 1.0))
	draw_string(ThemeDB.fallback_font, Vector2(target_dragon_x - 45, 250), "蓝龙触发点", HORIZONTAL_ALIGNMENT_LEFT, -1, 16, Color(0.4, 0.85, 1.0))

	# 显示每个人的当前状态标签（巡逻乱走 vs 战斗形态）
	var names = ["蓝帽(电击枪)", "灰帽(冲锋)", "橘帽(喷火枪)", "黑衣特种兵(手雷)"]
	for i in range(enemies.size()):
		var e = enemies[i]
		var is_combat = (e["state"] == AIState.COMBAT)
		var state_txt = "【战斗形态】" if is_combat else "巡逻乱走中..."
		var col = Color(1.0, 0.40, 0.30) if is_combat else Color(0.75, 0.85, 0.90)
		draw_string(ThemeDB.fallback_font, Vector2(e["pos"].x - 52, 310), names[i], HORIZONTAL_ALIGNMENT_LEFT, -1, 15, Color.WHITE)
		draw_string(ThemeDB.fallback_font, Vector2(e["pos"].x - 48, 332), state_txt, HORIZONTAL_ALIGNMENT_LEFT, -1, 14, col)

	# 顶部操作说明面板
	draw_rect(Rect2(20, 20, 780, 92), Color(0, 0, 0, 0.70))
	draw_string(ThemeDB.fallback_font, Vector2(36, 50), "四种人类外形与双阶段动作演示（离远慢慢左右乱走 -> 靠近瞬间切换战斗形态）", HORIZONTAL_ALIGNMENT_LEFT, -1, 18, Color(0.4, 0.9, 1.0))
	draw_string(ThemeDB.fallback_font, Vector2(36, 80), "按 [A / D 或 左右方向键] 移动蓝色触发线靠近/远离他们   |   按 [R 键] 重置位置", HORIZONTAL_ALIGNMENT_LEFT, -1, 16, Color.YELLOW)
	draw_string(ThemeDB.fallback_font, Vector2(36, 102), "警戒范围：黄色底线标记各兵种警戒感知距离，进入该范围立刻进入战斗状态", HORIZONTAL_ALIGNMENT_LEFT, -1, 13, Color.LIGHT_GRAY)
