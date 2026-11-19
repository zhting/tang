extends Node2D

# ==============================================================================
# 连贯版蓝龙吞食动画引擎（8阶段平滑插值：叼起 -> 抛空 -> 张嘴咬住 -> 仰头喉咙下滑 -> 腹下渐胀）
# ==============================================================================

const TOTAL_SWALLOW_DURATION: float = 1.15 # 完整吞食过程总时长（秒）

var dragon_pos: Vector2 = Vector2(360, 480)
var dragon_facing: int = 1
var belly_count: int = 0                  # 当前腹中人数 (0~10)
var visual_belly_level: float = 0.0       # 用于平滑过渡肚子变大的浮点数值

# 连贯吞食状态机
var is_swallowing: bool = false
var swallow_time: float = 0.0

# 士兵对象（初始站在蓝龙正前方等待测试）
var target_soldier: Dictionary = {}

func _ready() -> void:
	DisplayServer.window_set_size(Vector2i(1152, 648))
	reset_soldier()

func reset_soldier() -> void:
	target_soldier = {
		"exists": true,
		"pos": Vector2(535, 480),
		"rotation": 0.0,
		"scale": 1.0
	}

func _process(delta: float) -> void:
	# 按 [J 键] 或 [空格键] 触发连贯吞食动画
	if (Input.is_key_just_pressed(KEY_J) or Input.is_key_just_pressed(KEY_SPACE)) and not is_swallowing:
		if target_soldier["exists"] and belly_count < 10:
			is_swallowing = true
			swallow_time = 0.0

	# 按 [R 键] 重新在前方生成一名士兵（或清零肚子）
	if Input.is_key_just_pressed(KEY_R) and not is_swallowing:
		if belly_count >= 10:
			belly_count = 0
			visual_belly_level = 0.0
		reset_soldier()

	# 更新连贯吞食时间轴
	if is_swallowing:
		swallow_time += delta
		if swallow_time >= TOTAL_SWALLOW_DURATION:
			is_swallowing = false
			belly_count = min(10, belly_count + 1)
			reset_soldier() # 自动补充下一名测试士兵方便连续观看叠加效果

	# 平滑插值肚子膨胀大小，避免突然跳变
	visual_belly_level = lerp(visual_belly_level, float(belly_count), delta * 10.0)

	queue_redraw()

# ==============================================================================
# 核心渲染：8 阶段丝滑传导动作计算
# ==============================================================================
func _draw() -> void:
	# 背景与地面
	draw_rect(Rect2(0, 0, 1152, 480), Color(0.13, 0.16, 0.22))
	draw_rect(Rect2(0, 480, 1152, 168), Color(0.24, 0.27, 0.32))
	draw_line(Vector2(0, 480), Vector2(1152, 480), Color(0.45, 0.55, 0.65), 4.0)

	# 默认常态参数
	var p = dragon_pos
	var f = float(dragon_facing)
	var neck_base = p + Vector2(f * 58, -78)
	var head_pos = p + Vector2(f * 95, -122)
	var jaw_open: float = 0.0           # 0.0 闭嘴 -> 1.0 最大张嘴
	var head_tilt: float = 0.0          # 头部仰角（弧度）
	var throat_lump_progress: float = -1.0 # 喉咙吞咽鼓包位置 (0.0 下巴 -> 1.0 胸腔)
	var bite_spark: float = 0.0         # 咬住瞬间的气浪特效强度

	var soldier_pos = target_soldier["pos"]
	var soldier_rot = 0.0
	var show_soldier = target_soldier["exists"]

	if is_swallowing:
		var t = clamp(swallow_time / TOTAL_SWALLOW_DURATION, 0.0, 1.0)

		# --- 阶段 1 (0.00 ~ 0.18)：俯身探颈，张嘴叼起地上的士兵 ---
		if t < 0.18:
			var k = smoothstep(0.0, 0.18, t)
			head_pos = (p + Vector2(f * 95, -122)).lerp(p + Vector2(f * 135, -52), k)
			jaw_open = sin(k * PI) * 0.75
			head_tilt = k * 0.35
			soldier_pos = Vector2(535, 480)

		# --- 阶段 2 (0.18 ~ 0.42)：猛地甩头将人挑起，士兵呈抛物线飞向半空 ---
		elif t < 0.42:
			var k = (t - 0.18) / 0.24
			var ease_k = smoothstep(0.0, 1.0, k)
			# 龙头从低处快速向上甩起
			head_pos = (p + Vector2(f * 135, -52)).lerp(p + Vector2(f * 102, -145), ease_k)
			head_tilt = lerp(0.35, -0.45, ease_k)
			jaw_open = lerp(0.2, 0.85, ease_k) # 甩出后开始张大嘴准备迎击
			# 士兵被抛向斜上方空中并伴随失重旋转
			var start_s = Vector2(535, 470)
			var apex_s = p + Vector2(f * 155, -245)
			soldier_pos = start_s.lerp(apex_s, ease_k) + Vector2(0, -sin(k * PI) * 35.0)
			soldier_rot = k * PI * 1.3

		# --- 阶段 3 (0.42 ~ 0.62)：士兵下落，龙头前伸精准咬住 ---
		elif t < 0.62:
			var k = (t - 0.42) / 0.20
			var apex_s = p + Vector2(f * 155, -245)
			var mouth_target = p + Vector2(f * 128, -138)
			if k < 0.65:
				# 下落迎击阶段：大张龙嘴前伸锁定
				var sub_k = k / 0.65
				head_pos = (p + Vector2(f * 102, -145)).lerp(mouth_target, sub_k)
				head_tilt = -0.45
				jaw_open = 1.0
				soldier_pos = apex_s.lerp(mouth_target + Vector2(f * 16, -6), sub_k * sub_k)
				soldier_rot = 1.3 * PI + sub_k * 0.5
			else:
				# 咬住瞬间：上下颌猛然合拢，迸发气浪！
				var snap_k = (k - 0.65) / 0.35
				head_pos = mouth_target + Vector2(f * (1.0 - snap_k) * 8.0, 0)
				head_tilt = lerp(-0.45, -0.65, snap_k)
				jaw_open = lerp(1.0, 0.15, snap_k)
				bite_spark = 1.0 - snap_k
				soldier_pos = head_pos + Vector2(f * 14 * (1.0 - snap_k), 0)
				soldier_rot = 1.8 * PI

		# --- 阶段 4 (0.62 ~ 0.88)：仰头吞咽，清晰看到人形鼓包顺着下巴喉咙滑进胸腔 ---
		elif t < 0.88:
			var k = (t - 0.62) / 0.26
			show_soldier = false # 人已完全进入口腔，转为喉咙内的鼓包轮廓
			head_pos = p + Vector2(f * 82, -168)
			head_tilt = -0.85 # 高高仰起脖子
			jaw_open = 0.0
			throat_lump_progress = smoothstep(0.0, 1.0, k)
			# 吞咽快结束时，身下肚子提前开始平滑膨胀
			if k > 0.65:
				visual_belly_level = float(belly_count) + ((k - 0.65) / 0.35)

		# --- 阶段 5 (0.88 ~ 1.00)：龙头顺滑回落归位，肚子完成膨胀 ---
		else:
			var k = smoothstep(0.88, 1.0, t)
			show_soldier = false
			head_pos = (p + Vector2(f * 82, -168)).lerp(p + Vector2(f * 95, -122), k)
			head_tilt = lerp(-0.85, 0.0, k)
			visual_belly_level = float(belly_count) + 1.0

	# 绘制蓝龙完整身体（四脚稳踩地面、长翅膀、长尾巴、平滑膨胀腹下肚子）
	draw_smooth_dragon_body(p, f, neck_base, head_pos, head_tilt, jaw_open, throat_lump_progress, bite_spark)

	# 绘制士兵
	if show_soldier:
		draw_rotating_soldier(soldier_pos, soldier_rot)

	# 顶部操作提示
	draw_rect(Rect2(16, 16, 780, 82), Color(0, 0, 0, 0.72))
	draw_string(ThemeDB.fallback_font, Vector2(32, 46), "连贯吞食动画演示（当前腹中：%d / 10 人）" % belly_count, HORIZONTAL_ALIGNMENT_LEFT, -1, 20, Color(0.4, 0.9, 1.0))
	draw_string(ThemeDB.fallback_font, Vector2(32, 76), "按 [J 键] 或 [空格键] 播放完整 8 阶段丝滑吞食动画   |   按 [R 键] 重置", HORIZONTAL_ALIGNMENT_LEFT, -1, 16, Color.YELLOW)

func draw_smooth_dragon_body(p: Vector2, f: float, neck_base: Vector2, head_pos: Vector2, tilt: float, jaw: float, lump_t: float, spark: float) -> void:
	var c_main = Color(0.14, 0.42, 0.88)
	var c_dark = Color(0.08, 0.25, 0.62)
	var c_belly = Color(0.35, 0.66, 0.98)

	# 1. 长尾巴与加长龙翼
	draw_colored_polygon(PackedVector2Array([p + Vector2(-f * 68, -68), p + Vector2(-f * 195, -112), p + Vector2(-f * 145, -60)]), c_main)
	draw_colored_polygon(PackedVector2Array([p + Vector2(-f * 12, -88), p + Vector2(-f * 125, -195), p + Vector2(-f * 168, -132), p + Vector2(-f * 80, -102)]), c_dark)

	# 2. 躯干与身下平滑膨胀肚子（严格在前后腿之间、身下垂坠、不朝前挺、不贴地）
	draw_rect(Rect2(p.x - 70, p.y - 92, 140, 44), c_main)
	var belly_r = 21.0 + visual_belly_level * 3.5
	var belly_center = p + Vector2(0, -52 + visual_belly_level * 1.5)
	draw_circle(belly_center, belly_r, c_belly)
	for i in range(int(round(visual_belly_level))):
		var bump = belly_center + Vector2(cos(i * 1.35) * belly_r * 0.52, sin(i * 1.35) * belly_r * 0.42)
		draw_circle(bump, 6.0, c_main)

	# 3. 严格四脚着地（全程稳踩地面）
	draw_rect(Rect2(p.x - 58, p.y - 50, 16, 50), c_dark)
	draw_rect(Rect2(p.x - 34, p.y - 50, 16, 50), c_main)
	draw_rect(Rect2(p.x + 28, p.y - 50, 16, 50), c_dark)
	draw_rect(Rect2(p.x + 50, p.y - 50, 16, 50), c_main)

	# 4. 弯曲龙颈（使用二次贝塞尔曲线连接肩部与龙头，仰头或俯身时脖颈自然弯曲）
	var ctrl_pt = neck_base.lerp(head_pos, 0.5) + Vector2(f * 14, 12)
	var prev_pt = neck_base
	for s in range(1, 13):
		var st = float(s) / 12.0
		var q0 = neck_base.lerp(ctrl_pt, st)
		var q1 = ctrl_pt.lerp(head_pos, st)
		var curr_pt = q0.lerp(q1, st)
		var thickness = lerp(24.0, 18.0, st)
		draw_line(prev_pt, curr_pt, c_main, thickness)
		prev_pt = curr_pt

	# 5. 喉咙吞咽鼓包（顺着弯曲龙颈从下巴一路滑向胸腔）
	if lump_t >= 0.0:
		var lt = clamp(lump_t, 0.0, 1.0)
		var q0 = head_pos.lerp(ctrl_pt, lt)
		var q1 = ctrl_pt.lerp(neck_base, lt)
		var lump_pos = q0.lerp(q1, lt)
		draw_circle(lump_pos, 15.0, c_belly)
		draw_circle(lump_pos, 10.0, c_main)

	# 6. 龙头与旋转开合下颌
	draw_set_transform(head_pos, tilt * f, Vector2(f, 1.0))
	# 上颌与龙角
	draw_rect(Rect2(-18, -16, 44, 16), c_main)
	draw_line(Vector2(-10, -14), Vector2(-32, -32), c_belly, 4.5)
	draw_circle(Vector2(8, -7), 3.5, Color.YELLOW)
	# 张嘴口腔与下颌
	if jaw > 0.05:
		draw_rect(Rect2(-10, 0, 34, int(jaw * 18)), Color(0.65, 0.15, 0.22))
		draw_line(Vector2(20, 0), Vector2(17, 6), Color.WHITE, 2.5)
	draw_set_transform(head_pos, (tilt + jaw * 0.55) * f, Vector2(f, 1.0))
	draw_rect(Rect2(-14, 0, 38, 9), c_belly)
	draw_set_transform(Vector2.ZERO, 0.0, Vector2.ONE)

	# 7. 咬住瞬间的冲击气浪环
	if spark > 0.05:
		draw_arc(head_pos + Vector2(f * 26, 0), 28.0 * (1.2 - spark * 0.4), -1.2, 1.2, 12, Color(0.7, 0.95, 1.0, spark), 3.5)

func draw_rotating_soldier(pos: Vector2, rot: float) -> void:
	draw_set_transform(pos, rot, Vector2.ONE)
	var suit = Color(0.22, 0.28, 0.36)
	draw_rect(Rect2(-8, -22, 7, 22), suit)
	draw_rect(Rect2(1, -22, 7, 22), suit)
	draw_rect(Rect2(-11, -50, 22, 28), suit)
	draw_circle(Vector2(0, -59), 9.0, Color(0.88, 0.74, 0.64))
	draw_rect(Rect2(-12, -70, 24, 11), Color(0.2, 0.5, 1.0)) # 遮眼蓝帽
	draw_set_transform(Vector2.ZERO, 0.0, Vector2.ONE)
