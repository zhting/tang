extends Node2D

# ==========================================
# 全局游戏状态机
# ==========================================
enum GameState {
	CUTSCENE,       # 1. 开场小视频过场
	TRAPPED_IN_CAGE,# 2. 变身巨龙被困在笼子里（按攻击/移动键破笼）
	LEVEL_1_ACTIVE, # 3. 第一关实机前冲与吞噬战斗
	LEVEL_CLEAR,    # 4. 第一关通关
	GAME_OVER       # 5. 血量归零失败
}

var current_state: GameState = GameState.CUTSCENE

# ==========================================
# 主角蓝龙核心数值（人10倍大、20血、10人上限）
# ==========================================
const DRAGON_MAX_HP: float = 20.0
const MAX_BELLY_CAPACITY: int = 10
const NATURAL_DIGEST_INTERVAL: float = 10.0 # 每10秒自然消化1个人

var dragon_hp: float = 20.0
var swallowed_humans: int = 0
var natural_digest_timer: float = 0.0

# 感电持续伤害（蓝帽电击枪：命中0.5 + 持续5秒每秒0.5）
var electric_ticks_left: int = 0
var electric_tick_timer: float = 0.0

# 龙的移动与物理参数
@export var dragon_move_speed: float = 320.0
@export var dragon_jump_velocity: float = -460.0
var gravity: float = ProjectSettings.get_setting("physics/2d/default_gravity")

# ==========================================
# 敌人与投掷物数据结构（无需额外挂载多脚本，统一调度）
# ==========================================
enum EnemyType {
	BLUE_HAT,     # 蓝帽：电击枪（0.5伤害 + 5秒持续0.5/秒）
	GRAY_HAT,     # 灰帽：向玩家冲锋
	RED_ORANGE,   # 红/橘帽：喷火枪（火焰弹伤害 1）
	BLACK_SPECOPS # 黑色特种兵：10秒蓄力扔手雷（手雷5秒爆炸，伤害 5）
}

# 存储活跃中的敌人、火焰弹、手雷字典对象
var active_enemies: Array[Dictionary] = []
var active_fireballs: Array[Dictionary] = []
var active_grenades: Array[Dictionary] = []

# ==========================================
# 节点引用
# ==========================================
@onready var cutscene_layer: CanvasLayer = $CutsceneLayer
@onready var lab_panel: Sprite2D = $CutsceneLayer/LabPanel
@onready var black_rect: ColorRect = $CutsceneLayer/BlackRect
@onready var subtitle_label: Label = $CutsceneLayer/SubtitleLabel
@onready var white_flash_rect: ColorRect = $CutsceneLayer/WhiteFlashRect

@onready var world_2d: Node2D = $World2D
@onready var cage_node: Node2D = $World2D/CageNode
@onready var dragon: CharacterBody2D = $World2D/BlueDragon
@onready var dragon_sprite: Sprite2D = $World2D/BlueDragon/Sprite2D
@onready var swallow_area: Area2D = $World2D/BlueDragon/SwallowArea
@onready var enemies_container: Node2D = $World2D/EnemiesContainer
@onready var projectiles_container: Node2D = $World2D/ProjectilesContainer
@onready var finish_line: Area2D = $World2D/FinishLine

@onready var hud_layer: CanvasLayer = $HUDLayer
@onready var health_label: Label = $HUDLayer/HealthLabel
@onready var belly_label: Label = $HUDLayer/BellyLabel
@onready var hint_label: Label = $HUDLayer/HintLabel

func _ready() -> void:
	# 初始化界面显示状态
	world_2d.visible = false
	hud_layer.visible = false
	cutscene_layer.visible = true
	
	# 绑定第一关终点碰撞信号
	finish_line.body_entered.connect(_on_finish_line_entered)
	
	# 启动开场小视频流程
	play_opening_cutscene()

# ==========================================
# 第一部分：开场小视频过场动画流程
# ==========================================
func play_opening_cutscene() -> void:
	current_state = GameState.CUTSCENE
	black_rect.color = Color(0, 0, 0, 0)
	white_flash_rect.color = Color(1, 1, 1, 0)
	subtitle_label.text = ""
	
	# 1. 画面极亮闪光（电光束射中被绑在架子上的人）
	lab_panel.modulate = Color(2.5, 2.5, 3.0, 1.0) # 强高光过曝效果
	var tween = create_tween()
	tween.tween_property(lab_panel, "modulate", Color(1, 1, 1, 1), 1.2)
	await tween.finished
	await get_tree().create_timer(0.8).timeout
	
	# 2. 画面慢慢变黑
	var fade_black = create_tween()
	fade_black.tween_property(black_rect, "color:a", 1.0, 1.5)
	await fade_black.finished
	
	# 3. 屏幕完全变黑后，底部白色字幕依次显示
	var lines = [
		"啊，是龙！",
		"快跑！",
		"快把他抓起来！"
	]
	for line in lines:
		subtitle_label.text = line
		await get_tree().create_timer(1.4).timeout
	
	subtitle_label.text = ""
	
	# 4. 屏幕变白闪屏，切换为巨龙被困在笼子里的实机画面
	var flash_white = create_tween()
	flash_white.tween_property(white_flash_rect, "color:a", 1.0, 0.35)
	await flash_white.finished
	
	# 切换底层场景：巨龙（人10倍大）出现在铁笼中
	cutscene_layer.visible = true
	black_rect.color.a = 0.0
	lab_panel.visible = false
	world_2d.visible = true
	hud_layer.visible = true
	setup_level_1_entities()
	update_hud()
	
	# 白光慢慢消散，进入困在笼子里的状态
	var fade_out_white = create_tween()
	fade_out_white.tween_property(white_flash_rect, "color:a", 0.0, 1.0)
	await fade_out_white.finished
	
	cutscene_layer.visible = false
	current_state = GameState.TRAPPED_IN_CAGE
	hint_label.text = "你已变成巨龙并被困在笼中！按 [吞噬/攻击键] 或 [前冲键] 撞破牢笼！"

# ==========================================
# 第二部分：第一关地图与沿途士兵初始化
# ==========================================
func setup_level_1_entities() -> void:
	active_enemies.clear()
	active_fireballs.clear()
	active_grenades.clear()
	
	var spawn_plan = [
		{"type": EnemyType.GRAY_HAT,      "x": 900.0},
		{"type": EnemyType.BLUE_HAT,      "x": 1350.0},
		{"type": EnemyType.RED_ORANGE,    "x": 1800.0},
		{"type": EnemyType.BLACK_SPECOPS, "x": 2250.0}, # 黑色特种兵（扔手雷）
		{"type": EnemyType.GRAY_HAT,      "x": 2500.0},
		{"type": EnemyType.BLUE_HAT,      "x": 2950.0},
		{"type": EnemyType.BLACK_SPECOPS, "x": 3400.0},
		{"type": EnemyType.RED_ORANGE,    "x": 3850.0},
		{"type": EnemyType.GRAY_HAT,      "x": 4200.0},
		{"type": EnemyType.BLACK_SPECOPS, "x": 4650.0}
	]
	
	for item in spawn_plan:
		spawn_soldier(item["type"], Vector2(item["x"], dragon.global_position.y))

func spawn_soldier(type: EnemyType, pos: Vector2) -> void:
	var node = ColorRect.new()
	node.size = Vector2(36, 72)
	node.position = pos - Vector2(18, 72)
	
	match type:
		EnemyType.BLUE_HAT:
			node.color = Color(0.2, 0.5, 1.0)
		EnemyType.GRAY_HAT:
			node.color = Color(0.5, 0.5, 0.5)
		EnemyType.RED_ORANGE:
			node.color = Color(1.0, 0.4, 0.1)
		EnemyType.BLACK_SPECOPS:
			node.color = Color(0.1, 0.1, 0.12)
			
	enemies_container.add_child(node)
	
	var initial_timer = 7.0 if type == EnemyType.BLACK_SPECOPS else 0.0
	active_enemies.append({
		"type": type,
		"node": node,
		"pos": pos,
		"timer": initial_timer
	})

# ==========================================
# 第三部分：主循环（状态控制、物理移动、AI、手雷与消化）
# ==========================================
func _physics_process(delta: float) -> void:
	match current_state:
		GameState.TRAPPED_IN_CAGE:
			if Input.is_action_just_pressed("swallow") or Input.is_action_pressed("move_right"):
				break_out_of_cage()
				
		GameState.LEVEL_1_ACTIVE:
			process_dragon_movement(delta)
			process_dragon_status(delta)
			process_enemies_ai(delta)
			process_projectiles_and_grenades(delta)
			update_hud()

func break_out_of_cage() -> void:
	if is_instance_valid(cage_node):
		cage_node.queue_free()
	current_state = GameState.LEVEL_1_ACTIVE
	hint_label.text = "破笼而出！一路往前冲！按 [吞噬键] 挑起吃人，有手雷时低头直接吃掉！"

func process_dragon_movement(delta: float) -> void:
	if not dragon.is_on_floor():
		dragon.velocity.y += gravity * delta

	var dir := Input.get_axis("move_left", "move_right")
	if dir == 0 and Input.is_action_pressed("auto_run"):
		dir = 1.0

	var speed_factor = 1.0 - (swallowed_humans * 0.025)
	dragon.velocity.x = dir * dragon_move_speed * speed_factor
	
	if dir != 0:
		dragon_sprite.flip_h = dir < 0
		swallow_area.scale.x = -1 if dir < 0 else 1

	if Input.is_action_just_pressed("jump") and dragon.is_on_floor():
		dragon.velocity.y = dragon_jump_velocity

	if Input.is_action_just_pressed("swallow"):
		perform_dragon_swallow()

	dragon.move_and_slide()

func perform_dragon_swallow() -> void:
	var mouth_pos = dragon.global_position + Vector2(120.0 * (-1 if dragon_sprite.flip_h else 1), 0)
	
	# 1. 优先低头吃手雷
	for i in range(active_grenades.size() - 1, -1, -1):
		var g = active_grenades[i]
		if not g["swallowed"] and g["pos"].distance_to(mouth_pos) <= 180.0:
			g["swallowed"] = true
			g["node"].visible = false
			hint_label.text = "蓝龙低头一口吃掉了手雷！等待肚内引爆消化！"
			return

	# 2. 没有手雷时，挑起吞人
	if swallowed_humans >= MAX_BELLY_CAPACITY:
		hint_label.text = "肚子已经装满 10 个人了！快吃颗手雷炸掉消化！"
		return

	for i in range(active_enemies.size() - 1, -1, -1):
		var enemy = active_enemies[i]
		if enemy["pos"].distance_to(mouth_pos) <= 200.0:
			play_swallow_human_sequence(enemy)
			active_enemies.remove_at(i)
			return

func play_swallow_human_sequence(enemy: Dictionary) -> void:
	if is_instance_valid(enemy["node"]):
		enemy["node"].queue_free()
	swallowed_humans += 1
	update_dragon_belly_visual()
	hint_label.text = "挑起咬住并吞下了 1 名士兵！（腹中：" + str(swallowed_humans) + "/10）"

func process_dragon_status(delta: float) -> void:
	if electric_ticks_left > 0:
		electric_tick_timer += delta
		if electric_tick_timer >= 1.0:
			electric_tick_timer -= 1.0
			electric_ticks_left -= 1
			apply_damage_to_dragon(0.5, "电击持续感电伤害 (-0.5)")

	if swallowed_humans > 0:
		natural_digest_timer += delta
		if natural_digest_timer >= NATURAL_DIGEST_INTERVAL:
			natural_digest_timer = 0.0
			swallowed_humans -= 1
			update_dragon_belly_visual()
			hint_label.text = "自然消化了 1 个人！剩余腹中人数：" + str(swallowed_humans)
	else:
		natural_digest_timer = 0.0

func process_enemies_ai(delta: float) -> void:
	for enemy in active_enemies:
		var dist = enemy["pos"].distance_to(dragon.global_position)
		var dir = sign(dragon.global_position.x - enemy["pos"].x)
		
		match enemy["type"]:
			EnemyType.BLUE_HAT:
				if dist < 420.0:
					enemy["timer"] += delta
					if enemy["timer"] >= 3.0:
						enemy["timer"] = 0.0
						apply_damage_to_dragon(0.5, "被蓝帽电击枪击中！(-0.5，进入5秒感电)")
						electric_ticks_left = 5
						electric_tick_timer = 0.0

			EnemyType.GRAY_HAT:
				if dist < 600.0:
					enemy["pos"].x += dir * 350.0 * delta
					enemy["node"].position.x = enemy["pos"].x - 18

			EnemyType.RED_ORANGE:
				if dist < 550.0:
					enemy["timer"] += delta
					if enemy["timer"] >= 3.0:
						enemy["timer"] = 0.0
						spawn_fireball(enemy["pos"] + Vector2(0, -40), dir)

			EnemyType.BLACK_SPECOPS:
				if dist < 650.0:
					enemy["timer"] += delta
					if enemy["timer"] >= 10.0:
						enemy["timer"] = 0.0
						throw_grenade(enemy["pos"] + Vector2(0, -50), dir)

func spawn_fireball(start_pos: Vector2, dir: float) -> void:
	var fb_node = ColorRect.new()
	fb_node.size = Vector2(20, 20)
	fb_node.color = Color(1.0, 0.3, 0.0)
	fb_node.position = start_pos
	projectiles_container.add_child(fb_node)
	active_fireballs.append({
		"node": fb_node,
		"pos": start_pos,
		"vel_x": dir * 380.0
	})

func throw_grenade(start_pos: Vector2, dir: float) -> void:
	var g_node = ColorRect.new()
	g_node.size = Vector2(18, 18)
	g_node.color = Color(0.2, 0.8, 0.2)
	g_node.position = start_pos
	projectiles_container.add_child(g_node)
	active_grenades.append({
		"node": g_node,
		"pos": start_pos,
		"vel": Vector2(dir * 280.0, -300.0),
		"fuse": 5.0,
		"swallowed": false
	})
	hint_label.text = "警告！黑色特种兵抛出了手雷，5秒内低头吃掉它！"

func process_projectiles_and_grenades(delta: float) -> void:
	for i in range(active_fireballs.size() - 1, -1, -1):
		var fb = active_fireballs[i]
		fb["pos"].x += fb["vel_x"] * delta
		fb["node"].position = fb["pos"]
		if fb["pos"].distance_to(dragon.global_position) < 90.0:
			apply_damage_to_dragon(1.0, "被火焰弹击中！(-1 血)")
			fb["node"].queue_free()
			active_fireballs.remove_at(i)
		elif abs(fb["pos"].x - dragon.global_position.x) > 1200.0:
			fb["node"].queue_free()
			active_fireballs.remove_at(i)

	var ground_y = dragon.global_position.y
	for i in range(active_grenades.size() - 1, -1, -1):
		var g = active_grenades[i]
		g["fuse"] -= delta
		if g["swallowed"]:
			g["pos"] = dragon.global_position
		else:
			if g["pos"].y < ground_y - 10.0:
				g["vel"].y += gravity * delta
				g["pos"] += g["vel"] * delta
				g["node"].position = g["pos"]

		if g["fuse"] <= 0.0:
			if g["swallowed"]:
				trigger_belly_grenade_explosion()
			else:
				if g["pos"].distance_to(dragon.global_position) <= 220.0:
					apply_damage_to_dragon(5.0, "手雷在身边爆炸！受到 5 点巨额伤害！")
			if is_instance_valid(g["node"]):
				g["node"].queue_free()
			active_grenades.remove_at(i)

func trigger_belly_grenade_explosion() -> void:
	var digested_count = swallowed_humans
	swallowed_humans = 0
	natural_digest_timer = 0.0
	update_dragon_belly_visual()
	var bulge_tween = create_tween()
	var orig_scale = dragon_sprite.scale
	bulge_tween.tween_property(dragon_sprite, "scale", Vector2(orig_scale.x * 1.15, orig_scale.y * 1.28), 0.12)
	bulge_tween.tween_property(dragon_sprite, "scale", orig_scale, 0.25)
	hint_label.text = "轰！手雷在肚子里闷爆，肚子猛鼓一下，腹中 " + str(digested_count) + " 人瞬间全部消化！"

func update_dragon_belly_visual() -> void:
	if dragon_sprite.hframes >= 11:
		dragon_sprite.frame = swallowed_humans

func apply_damage_to_dragon(amount: float, reason: String) -> void:
	dragon_hp = max(0.0, dragon_hp - amount)
	hint_label.text = reason
	update_hud()
	if dragon_hp <= 0.0:
		current_state = GameState.GAME_OVER
		hint_label.text = "血量耗尽（0/20），蓝龙倒下了！按 R 键重新开始第一关。"

func _on_finish_line_entered(body: Node2D) -> void:
	if body == dragon and current_state == GameState.LEVEL_1_ACTIVE:
		current_state = GameState.LEVEL_CLEAR
		hint_label.text = "恭喜通关第一关！巨龙成功冲出实验室封锁线！"

func update_hud() -> void:
	health_label.text = "龙之血量：%.1f / 20.0 颗心" % dragon_hp
	var digest_info = ""
	if swallowed_humans > 0:
		var left_sec = ceil(NATURAL_DIGEST_INTERVAL - natural_digest_timer)
		digest_info = "（" + str(left_sec) + "秒后自然消化1人）"
	belly_label.text = "腹中人数：%d / 10 %s" % [swallowed_humans, digest_info]
