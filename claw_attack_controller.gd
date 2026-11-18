extends Node2D

# ==============================================================================
# 基础攻击（C 键挥爪）与士兵血量（5 血 / 每次扣 1）完整代码
# ==============================================================================

const SOLDIER_MAX_HP: int = 5       # 每个士兵总血量为 5
const CLAW_BASE_DAMAGE: int = 1     # 一次基础攻击伤害为 1
const CLAW_COOLDOWN: float = 0.45   # 挥爪动作冷却时间

# 蓝龙状态变量
var dragon_pos: Vector2 = Vector2(320, 480)
var dragon_facing: int = 1          # 1 朝右，-1 朝左
var is_clawing: bool = false
var claw_anim_timer: float = 0.0
var claw_cd_timer: float = 0.0

# 士兵列表与伤害飘字列表
var soldiers: Array[Dictionary] = []
var damage_popups: Array[Dictionary] = []

func _ready() -> void:
	DisplayServer.window_set_size(Vector2i(1152, 648))
	spawn_test_soldiers()

func spawn_test_soldiers() -> void:
	soldiers.clear()
	var types = ["BLUE", "GRAY", "ORANGE", "BLACK"]
	for i in range(4):
		soldiers.append({
			"type": types[i],
			"pos": Vector2(460.0 + i * 95.0, 480.0),
			"hp": SOLDIER_MAX_HP,
			"max_hp": SOLDIER_MAX_HP,
			"hit_flash_timer": 0.0, # 受击闪白/红计时器
			"knockback_vx": 0.0     # 受击击退速度
		})

func _process(delta: float) -> void:
	# 1. 左右移动蓝龙方便调整攻击距离
	var move := 0.0
	if Input.is_key_pressed(KEY_D) or Input.is_key_pressed(KEY_RIGHT):
		move += 1.0
	if Input.is_key_pressed(KEY_A) or Input.is_key_pressed(KEY_LEFT):
		move -= 1.0
	if move != 0.0:
		dragon_facing = int(sign(move))
		dragon_pos.x = clamp(dragon_pos.x + move * 260.0 * delta, 120.0, 1020.0)

	# 2. 按 C 键触发基础攻击（抬爪向前挥舞）
	if claw_cd_timer > 0.0:
		claw_cd_timer -= delta
	if Input.is_key_just_pressed(KEY_C) and claw_cd_timer <= 0.0:
		trigger_claw_attack()

	# 3. 更新挥爪动作进度
	if is_clawing:
		claw_anim_timer -= delta
		if claw_anim_timer <= 0.0:
			is_clawing = false

	# 4. 更新士兵受击硬直、击退位移与飘字
	update_soldiers(delta)
	update_damage_popups(delta)

	# 按 R 键重新刷出满血士兵
	if Input.is_key_just_pressed(KEY_R):
		spawn_test_soldiers()

	queue_redraw()

# ==============================================================================
# 核心攻击与伤害计算逻辑
# ==============================================================================
func trigger_claw_attack() -> void:
	is_clawing = true
	claw_anim_timer = 0.28
	claw_cd_timer = CLAW_COOLDOWN

	# 计算龙爪向前挥舞的矩形判定范围（龙嘴/前爪前方 170 像素内）
	var reach_min_x = dragon_pos.x if dragon_facing == 1 else dragon_pos.x - 170.0
	var reach_max_x = dragon_pos.x + 170.0 if dragon_facing == 1 else dragon_pos.x

	for i in range(soldiers.size() - 1, -1, -1):
		var s = soldiers[i]
		if s["pos"].x >= reach_min_x and s["pos"].x <= reach_max_x:
			apply_claw_damage_to_soldier(s, i)

func apply_claw_damage_to_soldier(s: Dictionary, index: int) -> void:
	# 伤害算法：当前血量扣除 1 点基础伤害
	s["hp"] = max(0, s["hp"] - CLAW_BASE_DAMAGE)
	
	# 触发士兵被攻击到后的视觉反馈：闪白硬直 + 向后击退 + 头顶飘出 -1
	s["hit_flash_timer"] = 0.18
	s["knockback_vx"] = dragon_facing * 240.0
	damage_popups.append({
		"pos": s["pos"] + Vector2(0, -92),
		"text": "-" + str(CLAW_BASE_DAMAGE),
		"timer": 0.65
	})

	# 血量归零（打满 5 下）时士兵被击败倒地移除
	if s["hp"] <= 0:
		soldiers.remove_at(index)

func update_soldiers(delta: float) -> void:
	for s in soldiers:
		if s["hit_flash_timer"] > 0.0:
			s["hit_flash_timer"] = max(0.0, s["hit_flash_timer"] - delta)
		if abs(s["knockback_vx"]) > 1.0:
			s["pos"].x = clamp(s["pos"].x + s["knockback_vx"] * delta, 80.0, 1080.0)
			s["knockback_vx"] = move_toward(s["knockback_vx"], 0.0, 950.0 * delta)

func update_damage_popups(delta: float) -> void:
	for i in range(damage_popups.size() - 1, -1, -1):
		damage_popups[i]["pos"].y -= 45.0 * delta
		damage_popups[i]["timer"] -= delta
		if damage_popups[i]["timer"] <= 0.0:
			damage_popups.remove_at(i)

# ==============================================================================
# 实时绘制：蓝龙挥爪动作、爪痕特效、士兵受击样子与 5 格血条
# ==============================================================================
func _draw() -> void:
	# 背景与地面
	draw_rect(Rect2(0, 0, 1152, 480), Color(0.13, 0.16, 0.22))
	draw_rect(Rect2(0, 480, 1152, 168), Color(0.24, 0.27, 0.32))
	draw_line(Vector2(0, 480), Vector2(1152, 480), Color(0.45, 0.55, 0.65), 4.0)

	# 1. 绘制蓝龙与 C 键挥爪动作
	draw_dragon_with_claw(dragon_pos, dragon_facing)

	# 2. 绘制士兵、受击闪光后仰姿态与 5 格血条
	for s in soldiers:
		draw_soldier_with_hp(s)

	# 3. 绘制头顶伤害数字 (-1)
	for pop in damage_popups:
		var alpha = clamp(pop["timer"] / 0.65, 0.0, 1.0)
		draw_string(ThemeDB.fallback_font, pop["pos"], pop["text"], HORIZONTAL_ALIGNMENT_CENTER, -1, 22, Color(1.0, 0.25, 0.25, alpha))

	# 顶部操作提示
	draw_rect(Rect2(20, 20, 680, 82), Color(0, 0, 0, 0.65))
	draw_string(ThemeDB.fallback_font, Vector2(36, 50), "基础攻击测试：按 [C 键] 抬爪向前挥舞（伤害 1，士兵血量 5）", HORIZONTAL_ALIGNMENT_LEFT, -1, 18, Color(0.4, 0.9, 1.0))
	draw_string(ThemeDB.fallback_font, Vector2(36, 80), "按 [A / D] 移动蓝龙靠近士兵   |   按 [R 键] 刷新满血士兵", HORIZONTAL_ALIGNMENT_LEFT, -1, 16, Color.YELLOW)

func draw_dragon_with_claw(p: Vector2, f: int) -> void:
	var c_main = Color(0.14, 0.42, 0.88)
	var c_dark = Color(0.08, 0.25, 0.62)
	var c_light = Color(0.32, 0.64, 0.98)

	# 长尾巴与长翅膀
	draw_colored_polygon(PackedVector2Array([p + Vector2(-f * 65, -65), p + Vector2(-f * 185, -105), p + Vector2(-f * 140, -58)]), c_main)
	draw_colored_polygon(PackedVector2Array([p + Vector2(-f * 10, -85), p + Vector2(-f * 115, -185), p + Vector2(-f * 155, -125), p + Vector2(-f * 75, -100)]), c_dark)

	# 躯干与龙头
	draw_rect(Rect2(p.x - 68, p.y - 90, 136, 42), c_main)
	draw_line(p + Vector2(f * 55, -78), p + Vector2(f * 88, -122), c_main, 22.0)
	draw_rect(Rect2(p.x + f * 88 - 20, p.y - 138, 42, 26), c_main)
	draw_circle(p + Vector2(f * 96, -128), 3.5, Color.YELLOW)

	# 三条支撑腿稳稳踩地
	draw_rect(Rect2(p.x - 56, p.y - 50, 16, 50), c_dark)
	draw_rect(Rect2(p.x - 32, p.y - 50, 16, 50), c_main)
	draw_rect(Rect2(p.x + 26, p.y - 50, 16, 50), c_dark)

	# 右前爪：平时踩地，按 C 键时高高抬起向前挥舞并产生亮蓝色爪痕气浪
	if is_clawing:
		var prog = 1.0 - (claw_anim_timer / 0.28) # 0.0 -> 1.0
		var paw_pos = p + Vector2(f * (55 + sin(prog * PI) * 55.0), -85 + prog * 35.0)
		draw_line(p + Vector2(f * 45, -72), paw_pos, c_main, 16.0)
		# 锋利三道龙爪尖
		for c_idx in range(-1, 2):
			draw_line(paw_pos + Vector2(0, c_idx * 6), paw_pos + Vector2(f * 18, c_idx * 8 + 4), Color.WHITE, 3.0)
		# 向前挥舞的亮蓝白月牙爪痕气浪
		var slash_x = p.x + f * (95 + prog * 65.0)
		draw_arc(Vector2(slash_x, p.y - 60), 42.0, -0.9 if f == 1 else PI - 0.9, 0.9 if f == 1 else PI + 0.9, 12, Color(0.5, 0.95, 1.0, 1.0 - prog * 0.6), 6.0)
	else:
		draw_rect(Rect2(p.x + 48, p.y - 50, 16, 50), c_main)

func draw_soldier_with_hp(s: Dictionary) -> void:
	var sx = s["pos"].x
	var sy = s["pos"].y
	var is_hit = s["hit_flash_timer"] > 0.0
	# 被攻击到后全身变红白闪烁，且身体向后仰倒硬直
	var lean = -8.0 if is_hit else 0.0

	var suit_col = Color(1.0, 0.35, 0.35) if is_hit else Color(0.22, 0.26, 0.32)
	var hat_col = Color.WHITE if is_hit else Color(0.2, 0.5, 1.0)
	if not is_hit:
		if s["type"] == "GRAY": hat_col = Color.GRAY
		elif s["type"] == "ORANGE": hat_col = Color(1.0, 0.4, 0.1)
		elif s["type"] == "BLACK":
			suit_col = Color(0.1, 0.1, 0.12)
			hat_col = Color(0.08, 0.08, 0.1)

	# 绘制受击后仰身体与双腿
	draw_rect(Rect2(sx - 10, sy - 24, 8, 24), suit_col)
	draw_rect(Rect2(sx + 2, sy - 24, 8, 24), suit_col)
	draw_rect(Rect2(sx - 12 + lean, sy - 54, 24, 30), suit_col)
	draw_circle(Vector2(sx + lean, sy - 63), 10.0, Color.WHITE if is_hit else Color(0.88, 0.74, 0.64))
	draw_rect(Rect2(sx - 13 + lean, sy - 74, 26, 12), hat_col)

	# 绘制头顶 5 格血条（每格代表 1 点血量）
	var bar_w = 40.0
	var bar_x = sx - bar_w * 0.5
	var bar_y = sy - 88.0
	draw_rect(Rect2(bar_x - 1, bar_y - 1, bar_w + 2, 8), Color.BLACK)
	for seg in range(s["max_hp"]):
		var seg_col = Color(0.2, 0.9, 0.35) if seg < s["hp"] else Color(0.25, 0.25, 0.25)
		draw_rect(Rect2(bar_x + seg * 8.0 + 1, bar_y, 6.0, 6.0), seg_col)
