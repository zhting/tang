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

# 基础攻击与士兵血量机制
const SOLDIER_MAX_HP: int = 10      # 每个士兵总血量为 10
const CLAW_BASE_DAMAGE: int = 1     # 一次基础攻击伤害为 1
const CLAW_COOLDOWN: float = 0.45   # 挥爪动作冷却时间

var is_clawing: bool = false
var claw_anim_timer: float = 0.0
var claw_cd_timer: float = 0.0
var damage_popups: Array[Dictionary] = []

var hp: float = 20.0
var belly_count: int = 0
var digest_timer: float = 0.0
var belly_list: Array[Dictionary] = [] # 存储腹中士兵数据（含血量、挣扎计时、是否判定吐出）
var spitting_soldier_data: Dictionary = {} # 正在被吐出的士兵数据

# 核心概率算法：10血 70%，每少1血降5%，0血倒下严格为 0%
func calculate_spit_chance(current_hp: int) -> float:
	if current_hp <= 0:
		return 0.0
	var chance = 0.20 + (float(current_hp) * 0.05)
	return clamp(chance, 0.0, 1.0)

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
	is_clawing = false
	claw_anim_timer = 0.0
	claw_cd_timer = 0.0
	damage_popups.clear()
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
		var detect := 260.0
		if item["type"] == "GRAY": detect = 290.0
		elif item["type"] == "RED": detect = 270.0
		elif item["type"] == "BLACK": detect = 310.0

		enemies.append({
			"type": item["type"],
			"pos": Vector2(item["x"], 480.0),
			"home_x": item["x"],
			"hp": SOLDIER_MAX_HP,
			"max_hp": SOLDIER_MAX_HP,
			"is_downed": false,
			"stun_timer": 0.0,
			"hit_flash_timer": 0.0,
			"knockback_vx": 0.0,
			"state": "PATROL", # PATROL 漫步左右乱走 vs COMBAT 靠近切换战斗形态
			"dir": -1,
			"facing": -1,
			"patrol_timer": randf_range(1.0, 2.5),
			"detect_range": detect,
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
			update_damage_popups(delta)
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
			if action_anim == "SPIT_OUT" and not spitting_soldier_data.is_empty():
				var land_x = clamp(dragon_pos.x + dragon_facing * 175.0, 80.0, finish_x + 200.0)
				spitting_soldier_data["pos"] = Vector2(land_x, 480.0)
				spitting_soldier_data["stun_timer"] = 1.6
				spitting_soldier_data["knockback_vx"] = 0.0
				enemies.append(spitting_soldier_data)
				spitting_soldier_data = {}
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

	# 4. 按 C 键触发基础攻击（抬爪向前挥击）
	if claw_cd_timer > 0.0:
		claw_cd_timer -= delta
	if Input.is_key_just_pressed(KEY_C) and claw_cd_timer <= 0.0:
		trigger_claw_attack()
	if is_clawing:
		claw_anim_timer -= delta
		if claw_anim_timer <= 0.0:
			is_clawing = false

	# 5. 按 J 键或鼠标左键触发吞噬
	if Input.is_key_pressed(KEY_J) or Input.is_mouse_button_pressed(MOUSE_BUTTON_LEFT):
		if action_timer <= 0.0:
			try_swallow()

# ==============================================================================
# 核心基础攻击（挥爪）与伤害计算
# ==============================================================================
func trigger_claw_attack() -> void:
	is_clawing = true
	claw_anim_timer = 0.28
	claw_cd_timer = CLAW_COOLDOWN

	# 计算向前挥爪判定范围（龙前方 170 像素内）
	var reach_min_x = dragon_pos.x if dragon_facing == 1 else dragon_pos.x - 170.0
	var reach_max_x = dragon_pos.x + 170.0 if dragon_facing == 1 else dragon_pos.x

	for i in range(enemies.size() - 1, -1, -1):
		var e = enemies[i]
		if e["pos"].x >= reach_min_x and e["pos"].x <= reach_max_x:
			apply_claw_damage_to_soldier(e, i)

func apply_claw_damage_to_soldier(s: Dictionary, index: int) -> void:
	s["hit_flash_timer"] = 0.18
	s["knockback_vx"] = dragon_facing * 240.0
	var cur_hp: int = s.get("hp", SOLDIER_MAX_HP)
	s["hp"] = max(0, cur_hp - 1)
	if s["hp"] <= 0:
		s["is_downed"] = true

func update_damage_popups(delta: float) -> void:
	for i in range(damage_popups.size() - 1, -1, -1):
		damage_popups[i]["pos"].y -= 45.0 * delta
		damage_popups[i]["timer"] -= delta
		if damage_popups[i]["timer"] <= 0.0:
			damage_popups.remove_at(i)

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
	if belly_list.size() >= MAX_BELLY:
		return
	for i in range(enemies.size() - 1, -1, -1):
		var e = enemies[i]
		if abs(e["pos"].x - mouth_x) < 115.0:
			enemies.remove_at(i)
			var spit_prob = calculate_spit_chance(e.get("hp", SOLDIER_MAX_HP))
			var roll = randf()
			var will_escape = (roll < spit_prob)
			belly_list.append({
				"soldier": e,
				"will_spit_out": will_escape,
				"struggle_timer": 1.2
			})
			belly_count = belly_list.size()
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
	if belly_list.size() > 0:
		digest_timer += delta
		if digest_timer >= DIGEST_TIME:
			digest_timer = 0.0
			belly_list.pop_front()
			belly_count = belly_list.size()
	else:
		digest_timer = 0.0

	# 3. 腹中挣扎判定与吐出
	if action_anim != "SPIT_OUT":
		for i in range(belly_list.size() - 1, -1, -1):
			var entry = belly_list[i]
			if entry["will_spit_out"]:
				entry["struggle_timer"] -= delta
				if entry["struggle_timer"] <= 0.0:
					belly_list.remove_at(i)
					belly_count = belly_list.size()
					spitting_soldier_data = entry["soldier"]
					action_anim = "SPIT_OUT"
					action_timer = 0.85
					break

# ==============================================================================
# 第四部分：士兵 AI 与投掷物（电击枪、火焰弹、10秒抛手雷、5秒肚内炸雷）
# ==============================================================================
func update_enemies(delta: float) -> void:
	for e in enemies:
		# 受击硬直闪烁与击退位移
		if e.get("hit_flash_timer", 0.0) > 0.0:
			e["hit_flash_timer"] = max(0.0, e["hit_flash_timer"] - delta)
		if abs(e.get("knockback_vx", 0.0)) > 1.0:
			e["pos"].x = clamp(e["pos"].x + e["knockback_vx"] * delta, 80.0, finish_x + 200.0)
			e["knockback_vx"] = move_toward(e["knockback_vx"], 0.0, 950.0 * delta)

		var dist_to_dragon = abs(e["pos"].x - dragon_pos.x)
		var dir_to_dragon = -1.0 if dragon_pos.x < e["pos"].x else 1.0

		if dist_to_dragon > 1100.0:
			continue

		# 晕眩硬直计时
		if e.get("stun_timer", 0.0) > 0.0:
			e["stun_timer"] = max(0.0, e["stun_timer"] - delta)
			continue

		# 0血倒下形态：失去行动能力，等待被吞下
		if e.get("is_downed", false):
			continue

		# 靠近警戒线切换战斗形态，远离恢复巡逻漫步
		if dist_to_dragon <= e["detect_range"]:
			if e["state"] != "COMBAT":
				e["state"] = "COMBAT"
			e["facing"] = dir_to_dragon
			e["dir"] = dir_to_dragon
		else:
			e["state"] = "PATROL"

		# 状态 1：PATROL 慢速左右漫步
		if e["state"] == "PATROL":
			e["patrol_timer"] -= delta
			if e["patrol_timer"] <= 0.0:
				e["patrol_timer"] = randf_range(1.2, 2.8)
				var choices = [-1.0, 1.0, -1.0, 1.0, 0.0]
				e["dir"] = choices[randi() % choices.size()]
				if e["dir"] != 0.0:
					e["facing"] = e["dir"]

			if e["dir"] != 0.0:
				e["pos"].x += e["dir"] * 48.0 * delta
				e["walk_t"] += delta * 6.5
				if abs(e["pos"].x - e["home_x"]) > 95.0:
					e["dir"] = -1.0 if e["pos"].x > e["home_x"] else 1.0
					e["facing"] = e["dir"]
			else:
				e["walk_t"] = 0.0

		# 状态 2：COMBAT 战斗形态
		elif e["state"] == "COMBAT":
			match e["type"]:
				"BLUE": # 蓝帽：平举电击枪瞄准放电（0.5伤害 + 持续5秒每秒0.5）
					e["walk_t"] = 0.0
					e["cd"] -= delta
					if e["cd"] <= 0.0:
						e["cd"] = 3.2
						electric_beams.append({"x1": e["pos"].x, "x2": dragon_pos.x, "t": 0.25})
						damage_dragon(0.5)
						shock_seconds_left = 5
						shock_tick_timer = 0.0

				"GRAY": # 灰帽：冲锋奔跑扑向龙（速度放慢为 160.0）
					if dist_to_dragon > 45.0:
						e["pos"].x += e["dir"] * 160.0 * delta
						e["walk_t"] += delta * 10.0
					else:
						e["walk_t"] = 0.0

				"RED": # 红/橘帽：双手端平火枪，每 3 秒发一个小火球（伤害 1）
					e["walk_t"] = 0.0
					e["cd"] -= delta
					if e["cd"] <= 0.0:
						e["cd"] = 3.0
						fireballs.append({"pos": Vector2(e["pos"].x + e["facing"] * 24.0, 442.0), "vx": e["facing"] * 340.0})

				"BLACK": # 黑色特种兵：高举手雷蓄力 10 秒抛掷
					e["walk_t"] = 0.0
					e["cd"] -= delta
					if e["cd"] <= 0.0:
						e["cd"] = 10.0
						grenades.append({
							"pos": Vector2(e["pos"].x + e["facing"] * 20.0, 420.0),
							"vel": Vector2(e["facing"] * 240.0, -280.0),
							"fuse": 5.0, # 抛出来后 5 秒会炸
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

	# 绘制伤害飘字 (-1)
	for pop in damage_popups:
		var alpha = clamp(pop["timer"] / 0.65, 0.0, 1.0)
		var pop_x = pop["pos"].x - camera_x
		if pop_x > -50 and pop_x < 1200:
			draw_string(ThemeDB.fallback_font, Vector2(pop_x, pop["pos"].y), pop["text"], HORIZONTAL_ALIGNMENT_CENTER, -1, 22, Color(1.0, 0.25, 0.25, alpha))

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

	# 4. 四条腿严格四脚着地（走路交替迈步动画）
	var step1 = sin(walk_cycle) * 14.0 if action_anim == "WALK" else 0.0
	var step2 = -step1
	draw_rect(Rect2(p.x - 62 + step1, p.y - 52, 18, 52), col_dark) # 后左腿
	draw_rect(Rect2(p.x - 36 + step2, p.y - 52, 18, 52), col_main) # 后右腿
	draw_rect(Rect2(p.x + 28 + step2, p.y - 52, 18, 52), col_dark) # 前左腿

	# 右前爪：平时踩地，按 C 键挥击与月牙气浪
	if is_clawing:
		var prog = 1.0 - (claw_anim_timer / 0.28)
		var paw_pos = p + Vector2(f * (55 + sin(prog * PI) * 55.0), -85 + prog * 35.0)
		draw_line(p + Vector2(f * 45, -72), paw_pos, col_main, 16.0)
		for c_idx in range(-1, 2):
			draw_line(paw_pos + Vector2(0, c_idx * 6), paw_pos + Vector2(f * 18, c_idx * 8 + 4), Color.WHITE, 3.0)
		var slash_x = p.x + f * (95 + prog * 65.0)
		draw_arc(Vector2(slash_x, p.y - 60), 42.0, -0.9 if f == 1 else PI - 0.9, 0.9 if f == 1 else PI + 0.9, 12, Color(0.5, 0.95, 1.0, 1.0 - prog * 0.6), 6.0)
	else:
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
	if sx < -80 or sx > 1230:
		return
	var sy = e["pos"].y
	var f = float(e.get("facing", -1))
	var is_combat = (e.get("state", "PATROL") == "COMBAT")
	var is_running = (is_combat and e["type"] == "GRAY")
	var phase = e["walk_t"]
	var bob = abs(sin(phase)) * (5.0 if is_running else 2.5) if phase > 0.0 else 0.0
	var is_hit = e.get("hit_flash_timer", 0.0) > 0.0
	var lean = -8.0 * f if is_hit else ((6.0 * f) if is_running else 0.0)
	var suit_main = Color(1.0, 0.35, 0.35) if is_hit else (Color(0.10, 0.11, 0.14) if e["type"] == "BLACK" else Color(0.20, 0.24, 0.30))
	var suit_dark = Color(0.85, 0.25, 0.25) if is_hit else (Color(0.06, 0.07, 0.09) if e["type"] == "BLACK" else Color(0.12, 0.15, 0.20))
	var hat_col = Color.WHITE if is_hit else Color(0.18, 0.50, 1.00) # BLUE
	if not is_hit:
		if e["type"] == "GRAY": hat_col = Color(0.55, 0.58, 0.62)
		elif e["type"] == "RED": hat_col = Color(1.00, 0.42, 0.08)
		elif e["type"] == "BLACK": hat_col = Color(0.08, 0.09, 0.12)

	# 1. 双腿步态（深色内腿 + 浅色外腿）
	var stride = (18.0 if is_running else 9.0) if phase > 0.0 else 0.0
	var leg_l = sin(phase) * stride
	var leg_r = -leg_l
	var lift_l = max(0.0, -cos(phase)) * (10.0 if is_running else 5.0) if phase > 0.0 else 0.0
	var lift_r = max(0.0, cos(phase)) * (10.0 if is_running else 5.0) if phase > 0.0 else 0.0

	# 内腿
	draw_line(Vector2(sx - 3 + lean, sy - 28 - bob), Vector2(sx - 3 + lean + leg_l, sy - lift_l), suit_dark, 7.0)
	# 外腿
	draw_line(Vector2(sx + 3 + lean, sy - 28 - bob), Vector2(sx + 3 + lean + leg_r, sy - lift_r), suit_main, 7.0)

	# 2. 橘帽背后红色燃料罐
	if e["type"] == "RED":
		draw_rect(Rect2(sx - f * 20 + lean, sy - 56 - bob, 12, 28), Color(0.85, 0.18, 0.12))
		draw_rect(Rect2(sx - f * 17 + lean, sy - 52 - bob, 5, 20), Color(1.0, 0.55, 0.20))

	# 3. 躯干
	draw_rect(Rect2(sx - 12 + lean, sy - 58 - bob, 24, 34), suit_main)
	draw_rect(Rect2(sx - 12 + lean, sy - 58 - bob, 24, 34), Color(0.05, 0.06, 0.10), false, 2.0)
	if e["type"] == "BLACK":
		# 特种兵胸甲高光
		draw_rect(Rect2(sx - 7 + lean, sy - 52 - bob, 14, 18), Color(0.22, 0.24, 0.28))

	# 4. 头部与遮眼压低战术帽子
	var head_y = sy - 68 - bob
	var head_x = sx + lean
	draw_circle(Vector2(head_x, head_y), 11.0, Color.WHITE if is_hit else Color(0.90, 0.74, 0.62)) # 肤色下巴（受击闪白）
	# 压低帽子
	draw_rect(Rect2(head_x - 14, head_y - 14, 28, 14), hat_col) # 帽冠
	draw_rect(Rect2(head_x - 14, head_y - 14, 28, 14), Color(0.05, 0.06, 0.10), false, 2.0)
	draw_rect(Rect2(head_x - 12 + (2 * f), head_y - 1, 30 * f if f < 0 else 30, 7), hat_col) # 压低长帽檐遮眼
	# 帽檐下方眼部阴影线
	draw_line(Vector2(head_x - 8, head_y + 3), Vector2(head_x + 8, head_y + 3), Color(0.05, 0.06, 0.10), 3.0)

	# 5. 手臂与武器
	var shoulder = Vector2(head_x + f * 4, sy - 50 - bob)
	if not is_combat:
		# 巡逻：手臂自然下垂微摆
		var swing = sin(phase) * 6.0 if phase > 0.0 else 0.0
		var hand = shoulder + Vector2(-f * swing, 24)
		draw_line(shoulder, hand, suit_main, 6.0)
		if e["type"] == "BLUE":
			draw_rect(Rect2(hand.x - 4, hand.y - 2, 12, 6), Color(0.30, 0.70, 1.00))
		elif e["type"] == "RED":
			draw_rect(Rect2(hand.x - 6, hand.y - 2, 20, 6), Color(0.35, 0.35, 0.40))
	else:
		# 战斗形态
		match e["type"]:
			"BLUE":
				# 平举电击枪
				var hand = shoulder + Vector2(f * 22, 0)
				draw_line(shoulder, hand, suit_main, 6.0)
				draw_rect(Rect2(hand.x - 2, hand.y - 5, 20 * f if f < 0 else 20, 10), Color(0.25, 0.55, 0.95))
				draw_circle(hand + Vector2(f * 24, 0), 4.0, Color(0.5, 0.95, 1.0))
			"GRAY":
				# 冲锋挥臂
				var run_arm = sin(phase) * 14.0
				draw_line(shoulder, shoulder + Vector2(f * run_arm, 18), suit_main, 6.0)
			"RED":
				# 双手端喷火枪
				var hand = shoulder + Vector2(f * 20, 5)
				draw_line(shoulder, hand, suit_main, 6.0)
				draw_rect(Rect2(hand.x - 4, hand.y - 6, 28 * f if f < 0 else 28, 11), Color(0.30, 0.32, 0.36))
				draw_circle(hand + Vector2(f * 28, 0), 6.0, Color(1.0, 0.45, 0.05))
			"BLACK":
				# 高举绿色手雷
				var hand = shoulder + Vector2(f * 10, -26)
				draw_line(shoulder, hand, suit_main, 6.0)
				draw_circle(hand + Vector2(0, -6), 7.0, Color(0.18, 0.65, 0.25))
				draw_circle(hand + Vector2(0, -12), 2.5, Color.YELLOW)

	# 6. 头顶状态与吐出概率显示
	if e.get("is_downed", false):
		draw_string(ThemeDB.fallback_font, Vector2(sx - 42, sy - 28), "0血倒下(吐出0%)", HORIZONTAL_ALIGNMENT_LEFT, -1, 13, Color(0.3, 1.0, 0.4))
	else:
		if e.get("stun_timer", 0.0) > 0.0:
			var star_x = sin(Time.get_ticks_msec() * 0.015) * 12.0
			draw_string(ThemeDB.fallback_font, Vector2(sx + star_x - 6, sy - 82), "★", HORIZONTAL_ALIGNMENT_LEFT, -1, 16, Color.YELLOW)
		var hp_val: int = e.get("hp", SOLDIER_MAX_HP)
		var prob_pct: int = int(round(calculate_spit_chance(hp_val) * 100))
		draw_string(ThemeDB.fallback_font, Vector2(sx - 38, sy - 86), "%d血 (吐出%d%%)" % [hp_val, prob_pct], HORIZONTAL_ALIGNMENT_LEFT, -1, 13, Color.WHITE)

func draw_hud_overlay() -> void:
	# 左上角状态栏（20颗心血量 + 10人肚子容量）
	draw_rect(Rect2(16, 16, 440, 92), Color(0, 0, 0, 0.65))
	draw_string(ThemeDB.fallback_font, Vector2(28, 44), "巨龙血量：%.1f / 20.0" % hp, HORIZONTAL_ALIGNMENT_LEFT, -1, 18, Color(1.0, 0.35, 0.35))
	draw_string(ThemeDB.fallback_font, Vector2(28, 70), "腹中人数：%d / 10" % belly_count, HORIZONTAL_ALIGNMENT_LEFT, -1, 18, Color(0.4, 0.85, 1.0))
	draw_string(ThemeDB.fallback_font, Vector2(28, 94), "操作：[D]前冲  [W/空格]跳跃  [C]挥爪攻击  [J]挑吃/吞雷", HORIZONTAL_ALIGNMENT_LEFT, -1, 13, Color.YELLOW)
	if state == State.WIN:
		draw_rect(Rect2(320, 240, 520, 120), Color(0, 0, 0, 0.85))
		draw_string(ThemeDB.fallback_font, Vector2(360, 295), "第一关通关成功！按 [R] 键重新游玩", HORIZONTAL_ALIGNMENT_LEFT, -1, 26, Color.GREEN)
	elif state == State.LOSE:
		draw_rect(Rect2(320, 240, 520, 120), Color(0, 0, 0, 0.85))
		draw_string(ThemeDB.fallback_font, Vector2(360, 295), "血量耗尽，挑战失败！按 [R] 键重开", HORIZONTAL_ALIGNMENT_LEFT, -1, 26, Color.RED)
