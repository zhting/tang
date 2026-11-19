extends Node2D

# ==============================================================================
# 生命值吐出概率系统（10血70% -> 0血倒下0%）+ 精细蓝龙吐人动画代码
# ==============================================================================

const SOLDIER_MAX_HP: int = 10      # 士兵满血为 10 滴血
const MAX_BELLY: int = 10           # 蓝龙最多吞 10 人

# 蓝龙状态
var dragon_pos: Vector2 = Vector2(280, 480)
var dragon_facing: int = 1
var belly_list: Array[Dictionary] = [] # 存储腹中每个人的详细数据（含被吞时的血量、挣扎计时）

# 蓝龙动作动画状态机: "IDLE" | "CLAW" | "SWALLOW" | "SPIT_OUT"
var dragon_anim: String = "IDLE"
var anim_timer: float = 0.0
var anim_duration: float = 0.0
var spitting_soldier_data: Dictionary = {} # 正在被吐出的人的数据

# 地面士兵列表与战斗提示日志
var ground_soldiers: Array[Dictionary] = []
var status_message: String = "按 [C] 抓伤士兵降血，按 [J] 吞下（血越少越不容易被吐出来，0血倒下必吞！）"

func _ready() -> void:
	DisplayServer.window_set_size(Vector2i(1152, 648))
	spawn_soldiers()

func spawn_soldiers() -> void:
	ground_soldiers.clear()
	belly_list.clear()
	var start_hps = [10, 8, 5, 2, 0] # 预设不同血量的士兵方便你直接测试不同概率
	var types = ["BLUE", "GRAY", "ORANGE", "BLACK", "BLUE"]
	for i in range(5):
		ground_soldiers.append({
			"type": types[i],
			"pos": Vector2(460.0 + i * 115.0, 480.0),
			"hp": start_hps[i],
			"max_hp": SOLDIER_MAX_HP,
			"is_downed": start_hps[i] <= 0, # 生命值降到 0 时人物倒下
			"stun_timer": 0.0,               # 被吐出来落地后的晕眩时间
			"hit_flash": 0.0
		})

# ==============================================================================
# 核心算法：根据被吞时的生命值计算吐出概率
# ==============================================================================
func calculate_spit_chance(current_hp: int) -> float:
	if current_hp <= 0:
		return 0.0 # 生命值降到 0 倒下后，被吞下吐出概率严格为 0%
	# 10血 -> 0.70 (70%), 9血 -> 0.65 (65%), 8血 -> 0.60 (60%) ... 1血 -> 0.25 (25%)
	var chance = 0.20 + (float(current_hp) * 0.05)
	return clamp(chance, 0.0, 1.0)

func _process(delta: float) -> void:
	handle_input(delta)
	update_dragon_animation(delta)
	update_belly_struggle(delta)
	update_ground_soldiers(delta)
	queue_redraw()

func handle_input(delta: float) -> void:
	# 左右移动调整位置
	var move := 0.0
	if Input.is_key_pressed(KEY_D) or Input.is_key_pressed(KEY_RIGHT):
		move += 1.0
	if Input.is_key_pressed(KEY_A) or Input.is_key_pressed(KEY_LEFT):
		move -= 1.0
	if move != 0.0 and dragon_anim == "IDLE":
		dragon_facing = int(sign(move))
		dragon_pos.x = clamp(dragon_pos.x + move * 260.0 * delta, 140.0, 1020.0)

	# [C 键] 基础挥爪攻击：每次扣 1 滴血，打到 0 血人物倒下
	if Input.is_key_just_pressed(KEY_C) and dragon_anim == "IDLE":
		start_dragon_anim("CLAW", 0.30)
		var reach_x = dragon_pos.x + dragon_facing * 150.0
		for s in ground_soldiers:
			if abs(s["pos"].x - reach_x) < 95.0 and not s["is_downed"]:
				s["hp"] = max(0, s["hp"] - 1)
				s["hit_flash"] = 0.18
				if s["hp"] == 0:
					s["is_downed"] = true
					status_message = "士兵生命值降至 0 已倒下！现在吞下他被吐出的概率为 0%！"
				else:
					var next_prob = int(round(calculate_spit_chance(s["hp"]) * 100))
					status_message = "挥爪命中！士兵剩余 %d 滴血（此时吞下有 %d%% 概率被吐出）" % [s["hp"], next_prob]

	# [J 键] 吞噬前方士兵
	if Input.is_key_just_pressed(KEY_J) and dragon_anim == "IDLE":
		try_swallow_soldier()

	# [R 键] 重置测试场景
	if Input.is_key_just_pressed(KEY_R):
		spawn_soldiers()
		status_message = "场景已重置！测试不同血量士兵被吞下的吐出概率。"

func start_dragon_anim(anim_name: String, duration: float) -> void:
	dragon_anim = anim_name
	anim_timer = 0.0
	anim_duration = duration

func update_dragon_animation(delta: float) -> void:
	if dragon_anim == "IDLE":
		return
	anim_timer += delta
	if anim_timer >= anim_duration:
		# 如果刚刚播完“吐出人物”动画，则让该士兵正式落回地面
		if dragon_anim == "SPIT_OUT" and not spitting_soldier_data.is_empty():
			var land_x = clamp(dragon_pos.x + dragon_facing * 175.0, 80.0, 1080.0)
			spitting_soldier_data["pos"] = Vector2(land_x, 480.0)
			spitting_soldier_data["stun_timer"] = 1.6 # 落地后进入 1.6 秒晕眩喘息硬直
			ground_soldiers.append(spitting_soldier_data)
			spitting_soldier_data = {}
		dragon_anim = "IDLE"

# ==============================================================================
# 吞下判定与腹中挣扎触发吐出逻辑
# ==============================================================================
func try_swallow_soldier() -> void:
	if belly_list.size() >= MAX_BELLY:
		status_message = "肚子已经装满 10 个人了！"
		return

	var mouth_x = dragon_pos.x + dragon_facing * 130.0
	for i in range(ground_soldiers.size() - 1, -1, -1):
		var s = ground_soldiers[i]
		if abs(s["pos"].x - mouth_x) < 105.0:
			ground_soldiers.remove_at(i)
			start_dragon_anim("SWALLOW", 0.55)
			
			var spit_prob = calculate_spit_chance(s["hp"])
			var roll = randf() # 生成 0.0 ~ 1.0 随机数进行概率判定
			var will_escape = (roll < spit_prob)
			
			# 加入腹中列表，若判定成功逃脱，将在 1.2 秒剧烈挣扎后触发精致吐出动画
			belly_list.append({
				"soldier": s,
				"will_spit_out": will_escape,
				"struggle_timer": 1.2
			})
			
			var pct = int(round(spit_prob * 100))
			if s["hp"] <= 0:
				status_message = "吞下了 0 血倒下的士兵！吐出概率为 0%，稳稳留在腹中！"
			elif will_escape:
				status_message = "吞下了 %d 血士兵（吐出概率 %d%%）—— 判定触发！他正在肚子里剧烈挣扎，即将被吐出！" % [s["hp"], pct]
			else:
				status_message = "吞下了 %d 血士兵（吐出概率 %d%%）—— 压制成功！未能挣脱，留在腹中！" % [s["hp"], pct]
			return

func update_belly_struggle(delta: float) -> void:
	if dragon_anim != "IDLE":
		return
	for i in range(belly_list.size() - 1, -1, -1):
		var entry = belly_list[i]
		if entry["will_spit_out"]:
			entry["struggle_timer"] -= delta
			if entry["struggle_timer"] <= 0.0:
				# 从腹中移除并触发精细吐出动画
				belly_list.remove_at(i)
				spitting_soldier_data = entry["soldier"]
				start_dragon_anim("SPIT_OUT", 0.85) # 0.85秒精细吐出全过程
				status_message = "咳呕！！蓝龙反刍张大龙嘴，将 %d 血士兵吐了出来！" % spitting_soldier_data["hp"]
				return

func update_ground_soldiers(delta: float) -> void:
	for s in ground_soldiers:
		if s["hit_flash"] > 0.0:
			s["hit_flash"] = max(0.0, s["hit_flash"] - delta)
		if s["stun_timer"] > 0.0:
			s["stun_timer"] = max(0.0, s["stun_timer"] - delta)

# ==============================================================================
# 精细动画渲染：蓝龙反刍吐人（4阶段细节）+ 倒下/晕眩士兵 + 概率可视化
# ==============================================================================
func _draw() -> void:
	# 背景与实验室地面
	draw_rect(Rect2(0, 0, 1152, 480), Color(0.13, 0.16, 0.22))
	draw_rect(Rect2(0, 480, 1152, 168), Color(0.24, 0.27, 0.32))
	draw_line(Vector2(0, 480), Vector2(1152, 480), Color(0.45, 0.55, 0.65), 4.0)

	# 1. 绘制四足蓝龙（含反刍喉咙鼓起、张嘴喷吐全过程）
	draw_detailed_dragon(dragon_pos, dragon_facing)

	# 2. 绘制地面上的士兵（正常站立、被吐出落地晕眩、或 0 血倒下姿态）
	for s in ground_soldiers:
		draw_soldier_unit(s)

	# 3. 绘制顶部详细提示栏
	draw_rect(Rect2(16, 16, 1120, 92), Color(0, 0, 0, 0.72))
	draw_string(ThemeDB.fallback_font, Vector2(32, 46), status_message, HORIZONTAL_ALIGNMENT_LEFT, -1, 18, Color(0.45, 0.92, 1.0))
	draw_string(ThemeDB.fallback_font, Vector2(32, 78), "当前腹中人数：%d / 10   |   操作：[A/D] 移动   [C] 抓挠扣1血   [J] 吞下士兵   [R] 重置测试" % belly_list.size(), HORIZONTAL_ALIGNMENT_LEFT, -1, 16, Color.YELLOW)

func draw_detailed_dragon(p: Vector2, f: int) -> void:
	var c_main = Color(0.14, 0.42, 0.88)
	var c_dark = Color(0.08, 0.25, 0.62)
	var c_belly = Color(0.35, 0.66, 0.98)
	var prog = clamp(anim_timer / max(0.01, anim_duration), 0.0, 1.0)

	# 长尾巴与长翅膀
	draw_colored_polygon(PackedVector2Array([p + Vector2(-f * 65, -65), p + Vector2(-f * 190, -108), p + Vector2(-f * 140, -58)]), c_main)
	draw_colored_polygon(PackedVector2Array([p + Vector2(-f * 10, -85), p + Vector2(-f * 120, -190), p + Vector2(-f * 160, -130), p + Vector2(-f * 75, -100)]), c_dark)

	# 躯干与身下膨胀肚子（严格在前后腿之间、身下垂坠）
	draw_rect(Rect2(p.x - 68, p.y - 90, 136, 42), c_main)
	var count = belly_list.size()
	# 如果正在吐出，肚子在前 0.4 秒从大缩小
	var spit_shrink = (1.0 - clamp(prog / 0.4, 0.0, 1.0)) if dragon_anim == "SPIT_OUT" else 0.0
	var effective_count = float(count) + spit_shrink
	var belly_r = 20.0 + effective_count * 3.5
	var belly_center = p + Vector2(0, -52 + effective_count * 1.5)
	draw_circle(belly_center, belly_r, c_belly)
	# 腹中若有人正在挣扎，肚皮轮廓剧烈起伏
	for idx in range(count):
		var shake = sin(Time.get_ticks_msec() * 0.025 + idx) * (5.0 if belly_list[idx]["will_spit_out"] else 1.5)
		var bump = belly_center + Vector2(cos(idx * 1.4) * belly_r * 0.5 + shake, sin(idx * 1.4) * belly_r * 0.4)
		draw_circle(bump, 6.5, c_main)

	# 四脚稳稳着地（挥爪时右前爪抬起劈砍）
	draw_rect(Rect2(p.x - 56, p.y - 50, 16, 50), c_dark)
	draw_rect(Rect2(p.x - 32, p.y - 50, 16, 50), c_main)
	draw_rect(Rect2(p.x + 26, p.y - 50, 16, 50), c_dark)
	if dragon_anim == "CLAW":
		var paw_p = p + Vector2(f * (60 + sin(prog * PI) * 50), -80 + prog * 30)
		draw_line(p + Vector2(f * 45, -72), paw_p, c_main, 16.0)
	else:
		draw_rect(Rect2(p.x + 48, p.y - 50, 16, 50), c_main)

	# 颈部与龙头姿态（重点刻画 SPIT_OUT 吐出人物的 4 阶段精细动态）
	var neck_base = p + Vector2(f * 55, -78)
	var head_pos = p + Vector2(f * 92, -124)
	var jaw_angle = 0.0
	var throat_lump_t = -1.0 # 喉咙里向上涌出的鼓包进度

	if dragon_anim == "SWALLOW":
		head_pos = p + Vector2(f * 80, -155) # 仰头吞咽
		throat_lump_t = 1.0 - prog

	elif dragon_anim == "SPIT_OUT":
		if prog < 0.30:
			# 阶段 1（反刍蓄力）：龙头微收，喉咙鼓包从胸腔快速向上涌向口腔！
			var t1 = prog / 0.30
			head_pos = p + Vector2(f * 85, -118)
			throat_lump_t = t1
		elif prog < 0.65:
			# 阶段 2（低头张大龙嘴喷吐）：龙头前伸压低，下颌大张，吐出气流线与士兵！
			var t2 = (prog - 0.30) / 0.35
			head_pos = p + Vector2(f * 108, -96)
			jaw_angle = 1.0
			# 喷吐风压气浪线条
			draw_line(head_pos + Vector2(f * 26, 2), head_pos + Vector2(f * 75, 12), Color(0.8, 0.95, 1.0, 0.8), 3.0)
			draw_line(head_pos + Vector2(f * 24, 12), head_pos + Vector2(f * 65, 26), Color(0.8, 0.95, 1.0, 0.6), 2.0)
			# 绘制正在被喷飞在半空中的士兵（抛物线飞向地面）
			var fly_pos = head_pos.lerp(p + Vector2(f * 175, -18), t2) + Vector2(0, -sin(t2 * PI) * 28.0)
			draw_ejected_soldier_in_air(fly_pos, f, t2)
		else:
			# 阶段 3（落地瞬间与龙头回正）：士兵刚落到地上，龙嘴缓缓闭合恢复常态
			var t3 = (prog - 0.65) / 0.35
			head_pos = (p + Vector2(f * 108, -96)).lerp(p + Vector2(f * 92, -124), t3)
			jaw_angle = 1.0 - t3
			draw_ejected_soldier_in_air(p + Vector2(f * 175, 0), f, 1.0)

	# 绘制龙颈
	draw_line(neck_base, head_pos, c_main, 22.0)
	# 绘制反刍时顺着喉咙向上涌动的鼓包
	if throat_lump_t >= 0.0:
		var lump_pos = neck_base.lerp(head_pos, throat_lump_t)
		draw_circle(lump_pos, 14.0, c_belly)
		draw_circle(lump_pos, 9.0, c_main)
	# 绘制上颌、下颌（随 jaw_angle 张开）与龙角龙眼
	draw_rect(Rect2(head_pos.x - 18, head_pos.y - 16, 42, 16), c_main)
	if jaw_angle > 0.1:
		# 张嘴时的暗红口腔与尖牙
		draw_rect(Rect2(head_pos.x - 10, head_pos.y, 32, int(jaw_angle * 16)), Color(0.65, 0.15, 0.22))
		draw_line(head_pos + Vector2(f * 18, 0), head_pos + Vector2(f * 15, 6), Color.WHITE, 2.5)
	draw_rect(Rect2(head_pos.x - 14, head_pos.y + int(jaw_angle * 14), 36, 9), c_belly)
	draw_line(head_pos + Vector2(-f * 10, -14), head_pos + Vector2(-f * 30, -32), c_belly, 4.5)
	draw_circle(head_pos + Vector2(f * 8, -7), 3.5, Color.YELLOW)

func draw_ejected_soldier_in_air(pos: Vector2, f: int, t: float) -> void:
	# 绘制正在被龙嘴吐出来飞在半空中的士兵（四肢张开失重姿态）
	var col = Color(0.22, 0.28, 0.36)
	draw_circle(pos + Vector2(0, -24), 9.0, Color(0.9, 0.75, 0.64))
	draw_rect(Rect2(pos.x - 11, pos.y - 34, 22, 9), Color(0.2, 0.5, 1.0)) # 遮眼帽子
	draw_rect(Rect2(pos.x - 10, pos.y - 16, 20, 22), col)
	draw_line(pos + Vector2(0, -10), pos + Vector2(-f * 16, -20 + t * 10), col, 5.0)
	draw_line(pos + Vector2(0, 6), pos + Vector2(-f * 14, 18), col, 5.0)

func draw_soldier_unit(s: Dictionary) -> void:
	var sx = s["pos"].x
	var sy = s["pos"].y
	var hp_val: int = s["hp"]
	var prob_pct = int(round(calculate_spit_chance(hp_val) * 100))
	var suit_col = Color.WHITE if s["hit_flash"] > 0.0 else Color(0.22, 0.26, 0.32)
	var hat_col = Color(0.2, 0.5, 1.0)
	if s["type"] == "GRAY": hat_col = Color.GRAY
	elif s["type"] == "ORANGE": hat_col = Color(1.0, 0.4, 0.1)
	elif s["type"] == "BLACK":
		if s["hit_flash"] <= 0.0: suit_col = Color(0.1, 0.1, 0.12)
		hat_col = Color(0.08, 0.08, 0.1)

	if s["is_downed"]:
		# 【0 滴血倒下形态】：平躺在地面失去反抗，吐出概率为 0%
		draw_rect(Rect2(sx - 30, sy - 14, 48, 14), suit_col)
		draw_circle(Vector2(sx + 24, sy - 9), 9.0, Color(0.85, 0.7, 0.6))
		draw_rect(Rect2(sx + 20, sy - 18, 14, 12), hat_col)
		draw_string(ThemeDB.fallback_font, Vector2(sx - 42, sy - 30), "0血倒下(吐出0%)", HORIZONTAL_ALIGNMENT_LEFT, -1, 13, Color(0.3, 1.0, 0.4))
	else:
		# 【存活站立 / 被吐出落地晕眩形态】
		var crouch = 8.0 if s["stun_timer"] > 0.0 else 0.0 # 被吐出来落地时呈半蹲晕眩姿态
		draw_rect(Rect2(sx - 10, sy - 22 + crouch * 0.5, 8, 22 - crouch * 0.5), suit_col)
		draw_rect(Rect2(sx + 2, sy - 22 + crouch * 0.5, 8, 22 - crouch * 0.5), suit_col)
		draw_rect(Rect2(sx - 12, sy - 52 + crouch, 24, 30), suit_col)
		draw_circle(Vector2(sx, sy - 61 + crouch), 10.0, Color(0.88, 0.74, 0.64))
		draw_rect(Rect2(sx - 13, sy - 72 + crouch, 26, 11), hat_col)
		# 若刚被吐出落地，头顶显示晕眩旋转星星
		if s["stun_timer"] > 0.0:
			var star_x = sin(Time.get_ticks_msec() * 0.015) * 12.0
			draw_string(ThemeDB.fallback_font, Vector2(sx + star_x - 6, sy - 82 + crouch), "★", HORIZONTAL_ALIGNMENT_LEFT, -1, 16, Color.YELLOW)
		# 头顶实时显示当前血量与被吐出概率提示
		draw_string(ThemeDB.fallback_font, Vector2(sx - 44, sy - 86 + crouch), "%d血 (吐出%d%%)" % [hp_val, prob_pct], HORIZONTAL_ALIGNMENT_LEFT, -1, 13, Color.WHITE)
