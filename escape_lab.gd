extends Node2D

# ==============================================================================
# 第一部分：全局状态与核心数值（严格对应你的设定）
# ==============================================================================
enum State { CUTSCENE_BEAM, CUTSCENE_BLACK, CUTSCENE_FLASH, IN_CAGE, PLAYING, WIN, LOSE }
var state: State = State.CUTSCENE_BEAM

# 蓝龙核心数值
const MAX_HP: float = 20.0          # 总血量 20 颗
const MAX_BELLY: int = 10           # 最多吞 10 个人
const DIGEST_TIME: float = 10.0     # 每 10 秒自然消化 1 个人

var hp: float = 20.0
var belly_count: int = 0
var digest_timer: float = 0.0

# 感电持续伤害（蓝帽电击枪：命中0.5 + 持续5秒每秒0.5）
var shock_seconds_left: int = 0
var shock_tick_timer: float = 0.0

# 蓝龙位置、物理与动画状态
var dragon_pos: Vector2 = Vector2(220, 480)
var dragon_vel: Vector2 = Vector2.ZERO
var dragon_facing: int = 1          # 1朝右，-1朝左
var walk_cycle: float = 0.0         # 走路腿部摆动计时器
var action_anim: String = "IDLE"    # IDLE, WALK, EAT_HUMAN, EAT_GRENADE, BELLY_EXPLODE
var action_timer: float = 0.0
var belly_bulge_extra: float = 0.0  # 手雷在肚子里爆炸时突然鼓一下的额外半径

# 关卡实体列表
var enemies: Array[Dictionary] = []
var fireballs: Array[Dictionary] = []
var grenades: Array[Dictionary] = []
var electric_beams: Array[Dictionary] = []
var finish_x: float = 4200.0        # 第一关终点坐标

# 过场动画计时与字幕
var cutscene_timer: float = 0.0
var subtitle_index: int = 0
var subtitles: Array[String] = ["啊，是龙！", "快跑！", "快把他抓起来！"]

# 摄像机偏移（跟随巨龙前冲）
var camera_x: float = 0.0

func _ready() -> void:
	# 设置窗口大小与像素清晰度
	DisplayServer.window_set_size(Vector2i(1152, 648))
	reset_level_data()

func reset_level_data() -> void:
	hp = 20.0
	belly_count = 0
	digest_timer = 0.0
	shock_seconds_left = 0
	dragon_pos = Vector2(220, 480)
	dragon_vel = Vector2.ZERO
	action_anim = "IDLE"
	belly_bulge_extra = 0.0
	enemies.clear()
	fireballs.clear()
	grenades.clear()
	electric_beams.clear()
	
	# 生成第一关沿途所有兵种（蓝帽、灰帽、红帽、黑色特种兵）
	var layout = [
		{"type": "GRAY",  "x": 750.0},
		{"type": "BLUE",  "x": 1150.0},
		{"type": "RED",   "x": 1550.0},
		{"type": "BLACK", "x": 1950.0}, # 黑色特种兵（扔手雷）
		{"type": "GRAY",  "x": 2250.0},
		{"type": "BLUE",  "x": 2600.0},
		{"type": "BLACK", "x": 3000.0},
		{"type": "RED",   "x": 3350.0},
		{"type": "GRAY",  "x": 3650.0},
		{"type": "BLACK", "x": 3950.0}
	]
	for item in layout:
		enemies.append({
			"type": item["type"],
			"pos": Vector2(item["x"], 480.0),
			"cd": 7.0 if item["type"] == "BLACK" else 1.5,
			"walk_t": randf() * 6.0
		})

# ==============================================================================
# 第二部分：每帧逻辑更新（过场视频 -> 笼中巨龙 -> 第一关前冲与战斗）
# ==============================================================================
func _process(delta: float) -> void:
	match state:
		State.CUTSCENE_BEAM:
			cutscene_timer += delta
			if cutscene_timer >= 2.2:
				cutscene_timer = 0.0
				state = State.CUTSCENE_BLACK
				
		State.CUTSCENE_BLACK:
			cutscene_timer += delta
			subtitle_index = int(cutscene_timer / 1.3)
			if subtitle_index >= subtitles.size():
				cutscene_timer = 0.0
				state = State.CUTSCENE_FLASH
				
		State.CUTSCENE_FLASH:
			cutscene_timer += delta
			if cutscene_timer >= 0.9:
				state = State.IN_CAGE
				
		State.IN_CAGE:
			# 按 D / 右方向键 / J / 空格 撞破牢笼开始第一关
			if Input.is_key_pressed(KEY_D) or Input.is_key_pressed(KEY_RIGHT) or Input.is_key_pressed(KEY_J) or Input.is_key_pressed(KEY_SPACE):
				state = State.PLAYING
				
		State.PLAYING:
			update_dragon(delta)
			update_status_timers(delta)
			update_enemies(delta)
			update_projectiles(delta)
			# 摄像机平滑跟随蓝龙向右推进
			camera_x = max(0.0, dragon_pos.x - 260.0)
			if dragon_pos.x >= finish_x:
				state = State.WIN
				
		State.WIN, State.LOSE:
			if Input.is_key_pressed(KEY_R):
				reset_level_data()
				state = State.PLAYING

	queue_redraw() # 触发每一帧实时像素动画重绘

# ==============================================================================
# 第三部分：巨龙移动、走路动作、挑起吃人与低头吞手雷
# ==============================================================================
func update_dragon(delta: float) -> void:
	# 1. 动作动画倒计时恢复
	if action_timer > 0.0:
		action_timer -= delta
		if action_timer <= 0.0:
			action_anim = "IDLE"
	if belly_bulge_extra > 0.0:
		belly_bulge_extra = max(0.0, belly_bulge_extra - 120.0 * delta)

	# 2. 左右移动（按 D/右键 一路往前冲，A/左键 后退微调）
	var move_dir := 0.0
	if Input.is_key_pressed(KEY_D) or Input.is_key_pressed(KEY_RIGHT):
		move_dir += 1.0
	if Input.is_key_pressed(KEY_A) or Input.is_key_pressed(KEY_LEFT):
		move_dir -= 1.0

	var speed = 320.0 * (1.0 - belly_count * 0.025) # 吃得越多略微变沉
	dragon_vel.x = move_dir * speed
	if move_dir != 0:
		dragon_facing = int(sign(move_dir))
		walk_cycle += delta * 10.0
		if action_timer <= 0.0:
			action_anim = "WALK"
	else:
		if action_timer <= 0.0:
			action_anim = "IDLE"

	# 3. 跳跃（W / 上键 / 空格）
	if (Input.is_key_pressed(KEY_W) or Input.is_key_pressed(KEY_UP) or Input.is_key_pressed(KEY_SPACE)) and dragon_pos.y >= 480.0:
		dragon_vel.y = -480.0

	dragon_vel.y += 1100.0 * delta
	dragon_pos += dragon_vel * delta
	if dragon_pos.y >= 480.0:
		dragon_pos.y = 480.0
		dragon_vel.y = 0.0

	# 4. 按 J 键或鼠标左键触发吞噬
	if Input.is_key_pressed(KEY_J) or Input.is_mouse_button_pressed(MOUSE_BUTTON_LEFT):
		if action_timer <= 0.0:
			try_swallow()

func try_swallow() -> void:
	var mouth_x = dragon_pos.x + dragon_facing * 115.0
	
	# 【优先级 1】有手雷的话，直接低头吃掉（不抛起）
	for g in grenades:
		if not g["swallowed"] and abs(g["pos"].x - mouth_x) < 110.0:
			g["swallowed"] = true
			action_anim = "EAT_GRENADE"
			action_timer = 0.45
			return

	# 【优先级 2】挑起吞吃士兵（上限 10 人）
	if belly_count >= MAX_BELLY:
		return
	for i in range(enemies.size() - 1, -1, -1):
		var e = enemies[i]
		if abs(e["pos"].x - mouth_x) < 115.0:
			enemies.remove_at(i)
			belly_count += 1
			action_anim = "EAT_HUMAN"
			action_timer = 0.55
			return

func update_status_timers(delta: float) -> void:
	# 1. 电击枪持续伤害：每秒 0.5，持续 5 秒
	if shock_seconds_left > 0:
		shock_tick_timer += delta
		if shock_tick_timer >= 1.0:
			shock_tick_timer -= 1.0
			shock_seconds_left -= 1
			damage_dragon(0.5)

	# 2. 自然消化：存的人每 10 秒消化 1 个
	if belly_count > 0:
		digest_timer += delta
		if digest_timer >= DIGEST_TIME:
			digest_timer = 0.0
			belly_count -= 1
	else:
		digest_timer = 0.0

# ==============================================================================
# 第四部分：士兵 AI 与投掷物（电击枪、火焰弹、10秒抛手雷、5秒肚内炸雷）
# ==============================================================================
func update_enemies(delta: float) -> void:
	for e in enemies:
		var dist = e["pos"].x - dragon_pos.x
		var dir = -1.0 if dist > 0 else 1.0
		if abs(dist) > 850.0:
			continue

		match e["type"]:
			"BLUE": # 蓝帽：电击枪（0.5伤害 + 持续5秒每秒0.5）
				e["cd"] -= delta
				if e["cd"] <= 0.0 and abs(dist) < 420.0:
					e["cd"] = 3.2
					electric_beams.append({"x1": e["pos"].x, "x2": dragon_pos.x, "t": 0.25})
					damage_dragon(0.5)
					shock_seconds_left = 5
					shock_tick_timer = 0.0

			"GRAY": # 灰帽：发现主角后往龙身边冲
				if abs(dist) < 550.0:
					e["pos"].x += dir * 240.0 * delta
					e["walk_t"] += delta * 14.0

			"RED": # 红帽：喷火枪，每隔 3 秒发一个小火球（伤害 1）
				e["cd"] -= delta
				if e["cd"] <= 0.0 and abs(dist) < 520.0:
					e["cd"] = 3.0
					fireballs.append({"pos": Vector2(e["pos"].x + dir * 20, 445.0), "vx": dir * 340.0})

			"BLACK": # 黑色特种兵：手雷要 10 秒才能抛出来
				e["cd"] -= delta
				if e["cd"] <= 0.0 and abs(dist) < 600.0:
					e["cd"] = 10.0
					grenades.append({
						"pos": Vector2(e["pos"].x + dir * 20, 435.0),
						"vel": Vector2(dir * 240.0, -280.0),
						"fuse": 5.0,       # 抛出来后 5 秒会炸
						"swallowed": false
					})

func update_projectiles(delta: float) -> void:
	# 电击特效消散
	for i in range(electric_beams.size() - 1, -1, -1):
		electric_beams[i]["t"] -= delta
		if electric_beams[i]["t"] <= 0.0:
			electric_beams.remove_at(i)

	# 火焰弹飞行（伤害 1）
	for i in range(fireballs.size() - 1, -1, -1):
		var fb = fireballs[i]
		fb["pos"].x += fb["vx"] * delta
		if abs(fb["pos"].x - dragon_pos.x) < 65.0 and abs(fb["pos"].y - (dragon_pos.y - 60)) < 75.0:
			damage_dragon(1.0)
			fireballs.remove_at(i)
		elif abs(fb["pos"].x - dragon_pos.x) > 1000.0:
			fireballs.remove_at(i)

	# 手雷飞行与 5 秒引爆（地面炸扣5血；肚子里炸则肚子鼓一下并瞬间消化所有人）
	for i in range(grenades.size() - 1, -1, -1):
		var g = grenades[i]
		g["fuse"] -= delta
		if g["swallowed"]:
			g["pos"] = dragon_pos + Vector2(0, -45)
		else:
			if g["pos"].y < 474.0:
				g["vel"].y += 900.0 * delta
				g["pos"] += g["vel"] * delta
			else:
				g["pos"].y = 474.0

		if g["fuse"] <= 0.0:
			if g["swallowed"]:
				# 在龙肚子里爆炸：肚子突然鼓一下 + 之前存肚子里的人一块没了（直接消化）
				belly_count = 0
				digest_timer = 0.0
				belly_bulge_extra = 48.0
				action_anim = "BELLY_EXPLODE"
				action_timer = 0.4
			else:
				# 在地面爆炸：伤害为 5
				if abs(g["pos"].x - dragon_pos.x) < 180.0:
					damage_dragon(5.0)
			grenades.remove_at(i)

func damage_dragon(amount: float) -> void:
	hp = max(0.0, hp - amount)
	if hp <= 0.0:
		state = State.LOSE

# ==============================================================================
# 第五部分：实时像素级动画渲染（开场视频 + 四足蓝龙走路/吃人/吃雷/爆炸 + 帽子兵）
# ==============================================================================
func _draw() -> void:
	match state:
		State.CUTSCENE_BEAM:
			draw_rect(Rect2(0, 0, 1152, 648), Color(0.08, 0.12, 0.18))
			# 被绑在架子上的人与电光束
			draw_rect(Rect2(260, 220, 40, 180), Color(0.4, 0.45, 0.5))
			draw_circle(Vector2(280, 250), 16, Color(0.9, 0.75, 0.65))
			draw_rect(Rect2(268, 268, 24, 70), Color(0.2, 0.5, 0.9))
			var flash_alpha = clamp(1.0 - cutscene_timer * 0.4, 0.2, 1.0)
			draw_line(Vector2(950, 120), Vector2(280, 290), Color(0.4, 0.9, 1.0, flash_alpha), 28.0)
			draw_rect(Rect2(0, 0, 1152, 648), Color(1, 1, 1, flash_alpha * 0.65))

		State.CUTSCENE_BLACK:
			draw_rect(Rect2(0, 0, 1152, 648), Color.BLACK)
			var idx = min(subtitle_index, subtitles.size() - 1)
			draw_string(ThemeDB.fallback_font, Vector2(460, 520), subtitles[idx], HORIZONTAL_ALIGNMENT_CENTER, 240, 32, Color.WHITE)

		State.CUTSCENE_FLASH:
			draw_rect(Rect2(0, 0, 1152, 648), Color(1, 1, 1, 1.0 - cutscene_timer))

		State.IN_CAGE, State.PLAYING, State.WIN, State.LOSE:
			draw_game_world()
			draw_hud_overlay()

func draw_game_world() -> void:
	# 实验室背景与地面
	draw_rect(Rect2(0, 0, 1152, 480), Color(0.14, 0.18, 0.24))
	draw_rect(Rect2(0, 480, 1152, 168), Color(0.25, 0.28, 0.32))
	draw_line(Vector2(0, 480), Vector2(1152, 480), Color(0.5, 0.6, 0.7), 4.0)

	# 终点线标识
	var fx = finish_x - camera_x
	if fx > -100 and fx < 1300:
		draw_rect(Rect2(fx, 220, 24, 260), Color(0.2, 0.9, 0.4))
		draw_string(ThemeDB.fallback_font, Vector2(fx - 30, 200), "第一关终点", HORIZONTAL_ALIGNMENT_LEFT, -1, 22, Color.GREEN)

	# 绘制巨型四足蓝龙（严格四脚着地、长翅膀、长尾巴、腹部在身下随1~10人膨胀）
	draw_quadruped_blue_dragon(dragon_pos - Vector2(camera_x, 0))

	# 如果还在笼子里，绘制铁栅栏牢笼
	if state == State.IN_CAGE:
		var cx = dragon_pos.x - camera_x - 140
		draw_rect(Rect2(cx, 250, 280, 230), Color(0.6, 0.65, 0.7), false, 6.0)
		for bar in range(7):
			draw_line(Vector2(cx + bar * 46, 250), Vector2(cx + bar * 46, 480), Color(0.55, 0.6, 0.65), 5.0)

	# 绘制所有遮眼帽子士兵与黑色特种兵
	for e in enemies:
		draw_hat_soldier(e, camera_x)

	# 绘制电击枪光束、火焰弹、手雷
	for b in electric_beams:
		draw_line(Vector2(b["x1"] - camera_x, 442), Vector2(b["x2"] - camera_x, 420), Color(0.3, 0.85, 1.0), 6.0)
	for fb in fireballs:
		draw_circle(fb["pos"] - Vector2(camera_x, 0), 11.0, Color(1.0, 0.4, 0.05))
	for g in grenades:
		if not g["swallowed"]:
			var gp = g["pos"] - Vector2(camera_x, 0)
			draw_circle(gp, 9.0, Color(0.15, 0.55, 0.2))
			draw_string(ThemeDB.fallback_font, gp + Vector2(-10, -14), "%.1fs" % g["fuse"], HORIZONTAL_ALIGNMENT_LEFT, -1, 14, Color.YELLOW)

func draw_quadruped_blue_dragon(p: Vector2) -> void:
	var f = float(dragon_facing)
	var col_main = Color(0.12, 0.42, 0.88)
	var col_dark = Color(0.07, 0.26, 0.62)
	var col_belly = Color(0.32, 0.62, 0.98)

	# 1. 长尾巴（随行走摆动）
	var tail_wag = sin(walk_cycle) * 10.0
	var tail_pts = PackedVector2Array([
		p + Vector2(-f * 70, -68),
		p + Vector2(-f * 155, -85 + tail_wag),
		p + Vector2(-f * 210, -115 - tail_wag),
		p + Vector2(-f * 145, -62 + tail_wag)
	])
	draw_colored_polygon(tail_pts, col_main)

	# 2. 长翅膀（在背部展开并微扇）
	var wing_flap = sin(walk_cycle * 0.8) * 14.0
	var wing_pts = PackedVector2Array([
		p + Vector2(-f * 15, -90),
		p + Vector2(-f * 110, -195 + wing_flap),
		p + Vector2(-f * 165, -140 + wing_flap),
		p + Vector2(-f * 85, -110)
	])
	draw_colored_polygon(wing_pts, col_dark)

	# 3. 躯干与身下膨胀的肚子（严格在前后腿之间、身下垂坠、不朝前挺、不贴地）
	draw_rect(Rect2(p.x - 75, p.y - 95, 150, 44), col_main)
	var belly_r = 22.0 + belly_count * 3.4 + belly_bulge_extra
	var belly_center = p + Vector2(0, -52 + belly_count * 1.6)
	draw_circle(belly_center, belly_r, col_belly)

	# 如果肚子里有人，画出肚皮被顶起的轮廓小凸起
	for k in range(belly_count):
		var ang = k * 1.1 + walk_cycle * 0.3
		var bump = belly_center + Vector2(cos(ang) * (belly_r * 0.55), sin(ang) * (belly_r * 0.45))
		draw_circle(bump, 6.0, col_main)

	# 4. 四条腿严格四脚着地（走路交替迈步动画）
	var step1 = sin(walk_cycle) * 14.0 if action_anim == "WALK" else 0.0
	var step2 = -step1
	draw_rect(Rect2(p.x - 62 + step1, p.y - 52, 18, 52), col_dark) # 后左腿
	draw_rect(Rect2(p.x - 36 + step2, p.y - 52, 18, 52), col_main) # 后右腿
	draw_rect(Rect2(p.x + 28 + step2, p.y - 52, 18, 52), col_dark) # 前左腿
	draw_rect(Rect2(p.x + 52 + step1, p.y - 52, 18, 52), col_main) # 前右腿

	# 5. 颈部与龙头（根据吞人/低头吃手雷动作变化）
	var head_offset = Vector2(f * 95, -125)
	if action_anim == "EAT_GRENADE":
		head_offset = Vector2(f * 115, -24) # 低头直接吃地上/刚抛出的手雷
	elif action_anim == "EAT_HUMAN":
		head_offset = Vector2(f * 85, -165) # 仰头吞咽士兵，下巴吞咽鼓起
	draw_line(p + Vector2(f * 60, -82), p + head_offset, col_main, 24.0)
	draw_rect(Rect2(p.x + head_offset.x - 22, p.y + head_offset.y - 18, 46, 30), col_main)
	# 龙角与锐利眼睛
	draw_line(p + head_offset + Vector2(-f * 10, -16), p + head_offset + Vector2(-f * 32, -36), col_belly, 5.0)
	draw_circle(p + head_offset + Vector2(f * 8, -6), 4.0, Color.YELLOW)

func draw_hat_soldier(e: Dictionary, cam_x: float) -> void:
	var sx = e["pos"].x - cam_x
	if sx < -60 or sx > 1220:
		return
	var sy = e["pos"].y
	var leg = sin(e["walk_t"]) * 8.0
	# 身体与双腿（人类高度约 68px，蓝龙约其数倍大）
	var suit_col = Color(0.12, 0.12, 0.14) if e["type"] == "BLACK" else Color(0.24, 0.28, 0.34)
	draw_rect(Rect2(sx - 12 + leg, sy - 24, 8, 24), suit_col)
	draw_rect(Rect2(sx + 4 - leg, sy - 24, 8, 24), suit_col)
	draw_rect(Rect2(sx - 14, sy - 54, 28, 32), suit_col)
	# 头部与压低遮住眼睛的帽子
	draw_circle(Vector2(sx, sy - 64), 11.0, Color(0.88, 0.74, 0.64))
	var hat_col = Color.BLUE
	if e["type"] == "GRAY": hat_col = Color.GRAY
	elif e["type"] == "RED": hat_col = Color(1.0, 0.35, 0.05)
	elif e["type"] == "BLACK": hat_col = Color(0.08, 0.08, 0.1)
	# 帽子压低遮眼
	draw_rect(Rect2(sx - 14, sy - 76, 28, 13), hat_col)
	draw_rect(Rect2(sx - 18, sy - 65, 32, 4), hat_col)

func draw_hud_overlay() -> void:
	# 左上角状态栏（20颗心血量 + 10人肚子容量）
	draw_rect(Rect2(16, 16, 480, 96), Color(0, 0, 0, 0.65))
	draw_string(ThemeDB.fallback_font, Vector2(28, 44), "巨龙血量：%.1f / 20.0 颗心" % hp, HORIZONTAL_ALIGNMENT_LEFT, -1, 20, Color(1.0, 0.35, 0.35))
	var digest_str = "（%d秒后消化1人）" % int(ceil(DIGEST_TIME - digest_timer)) if belly_count > 0 else ""
	draw_string(ThemeDB.fallback_font, Vector2(28, 74), "腹中人数：%d / 10 %s" % [belly_count, digest_str], HORIZONTAL_ALIGNMENT_LEFT, -1, 20, Color(0.4, 0.85, 1.0))
	if state == State.IN_CAGE:
		draw_string(ThemeDB.fallback_font, Vector2(260, 180), "你已被困在笼子里！按 [D / 右键 / J] 撞破牢笼前冲！", HORIZONTAL_ALIGNMENT_LEFT, -1, 26, Color.YELLOW)
	elif state == State.PLAYING:
		draw_string(ThemeDB.fallback_font, Vector2(28, 102), "操作：[D]一直往前冲  [W/空格]跳跃  [J/左键]挑起吞人 或 低头直接吃手雷", HORIZONTAL_ALIGNMENT_LEFT, -1, 15, Color.LIGHT_GRAY)
	elif state == State.WIN:
		draw_rect(Rect2(320, 240, 520, 120), Color(0, 0, 0, 0.85))
		draw_string(ThemeDB.fallback_font, Vector2(360, 295), "第一关通关成功！按 [R] 键重新游玩", HORIZONTAL_ALIGNMENT_LEFT, -1, 26, Color.GREEN)
	elif state == State.LOSE:
		draw_rect(Rect2(320, 240, 520, 120), Color(0, 0, 0, 0.85))
		draw_string(ThemeDB.fallback_font, Vector2(360, 295), "血量耗尽，挑战失败！按 [R] 键重开", HORIZONTAL_ALIGNMENT_LEFT, -1, 26, Color.RED)
