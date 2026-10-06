/**
 * MACHINARIUM ENGINE - CHAPTER 8: THE TOWN SQUARE & THREE MUSICIANS
 * LEVEL LOGIC SYSTEM (1:1 MECHANICS REPLICATION)
 * 机械迷城 1:1 像素级交互逻辑 - 第八章：钟楼大广场与三位街头乐手
 */

class TownSquareLevel {
    constructor() {
        this.reset();
    }

    reset() {
        // 1:1 精确场景变量与状态扣细节
        this.gameState = {
            josef: {
                posX: 120,
                posY: 380,
                height: "normal", // normal, stretch, squat
                inventory: ["空罐子"]
            },
            musicians: {
                sax: {
                    status: "broken", // broken | fixed
                    itemInside: "fly",
                    fxPlayed: false,
                    screwsNeeded: 5,
                    screwsInstalled: 0,
                    name: "萨克斯手"
                },
                drum: {
                    status: "broken", // broken | fixed
                    headTorn: true,
                    fxPlayed: false,
                    oilDrumInstalled: false,
                    name: "破鼓手"
                },
                horn: {
                    status: "broken", // broken | fixed
                    mouseInside: true,
                    fxPlayed: false,
                    ratEscaped: false,
                    name: "大号手"
                }
            },
            tavern: {
                fliesCaptured: 0,
                fliesNeeded: 5,
                canTakeOilPod: false,
                oilPodStolen: false,
                ownerDistracted: false,
                flypaperUsed: false
            },
            oldMan: {
                winsNeeded: 5,
                currentMatch: "idle", // idle | playing | won | lost
                boardState: Array(11).fill(0).map(() => Array(11).fill(0)), // 0:空, 1:约瑟夫黄铜螺母, 2:老头黑铁螺栓
                turn: 1,
                winner: 0,
                screwsWon: false
            },
            clockTower: {
                pointerRed: "I",    // 初始位置 1点 (I ~ XII)
                pointerBlack: "VI", // 初始位置 6点 (I ~ XII, ∽)
                targetRed: "VII",
                targetBlack: "∽",
                grandmaOut: false,
                radioStolen: false
            },
            strayCat: {
                location: "alley_wall", // alley_wall | stunned | captured | inside_horn
                isElectrocuted: false,
                isCaptured: false
            },
            wires: {
                radioPlaced: false,
                sparking: false
            },
            flowerPot: {
                thrown: false,
                smashed: false,
                dialPicked: false,
                batteryPicked: false
            },
            bandConcert: {
                isPlaying: false
            },
            solved: false
        };
    }

    // 细节A：酒馆抓苍蝇与偷油桶逻辑判定
    interactTavernSwarm(itemUsed) {
        let res = this.gameState.tavern;
        let inv = this.gameState.josef.inventory;

        // 1. 在排污臭水桶挥舞空罐子捕捉苍蝇
        if ((itemUsed === "空罐子" || itemUsed === "捕捉苍蝇" || !itemUsed) && !res.ownerDistracted) {
            if (res.fliesCaptured < res.fliesNeeded) {
                res.fliesCaptured += 1;
                if (res.fliesCaptured >= 5) {
                    res.ownerDistracted = true;
                    res.canTakeOilPod = true;
                    // 罐子变更为装满苍蝇的罐子
                    const idx = inv.indexOf("空罐子");
                    if (idx !== -1) inv[idx] = "抓满苍蝇的罐子";
                    else if (!inv.includes("抓满苍蝇的罐子")) inv.push("抓满苍蝇的罐子");
                    return "【1:1细节还原】约瑟夫用罐子在臭水桶旁抓满5只绿头苍蝇！酒馆老板被满屋飞舞的苍蝇骚扰，拿出苍蝇拍开始疯狂挥动，视线完全离开柜台。";
                }
                return `约瑟夫挥动罐子，抓到了 ${res.fliesCaptured}/5 只苍蝇... 动作还不够快。`;
            }
        }

        // 2. 携带苍蝇罐在吧台放出苍蝇
        if (itemUsed === "抓满苍蝇的罐子") {
            res.ownerDistracted = true;
            res.canTakeOilPod = true;
            const idx = inv.indexOf("抓满苍蝇的罐子");
            if (idx !== -1) inv[idx] = "空罐子";
            return "【1:1细节还原】约瑟夫掀开罐盖！5只巨大绿头苍蝇在酒馆内尖啸盘旋！酒馆老板怒火中烧，抓起苍蝇拍疯狂跳跃扑打，视线完全离开柜台。";
        }

        // 3. 趁机偷取大油桶
        if (res.ownerDistracted && !res.oilPodStolen) {
            res.oilPodStolen = true;
            res.canTakeOilPod = false;
            if (!inv.includes("大油桶")) {
                inv.push("大油桶");
            }
            return "【核心道具入手】趁着老板疯狂拍苍蝇的动画间隙，约瑟夫悄悄溜进柜台下方，抱走了原本摆在地上的【大油桶】。";
        }

        if (res.oilPodStolen) {
            return "酒馆吧台空空如也，大油桶已被安全抱走。";
        }

        return "酒馆老板死死盯着柜台，此时无法下手。";
    }

    // 细节B：钟楼大妈时间判定（红VII，黑∽）
    rotateClockPointers(color, step = 1) {
        let clock = this.gameState.clockTower;
        const romanNumbers = ["I","II","III","IV","V","VI","VII","VIII","IX","X","XI","XII","∽"];
        
        if (color === "red") {
            let curIdx = romanNumbers.indexOf(clock.pointerRed);
            if (curIdx === -1 || curIdx >= 12) curIdx = 0;
            let idx = ((curIdx + step) % 12 + 12) % 12;
            clock.pointerRed = romanNumbers[idx];
        } else if (color === "black") {
            // 黑指针支持特殊符号 ∽ 的咬合 (13个符号)
            let curIdx = romanNumbers.indexOf(clock.pointerBlack);
            if (curIdx === -1) curIdx = 5;
            let idx = ((curIdx + step) % 13 + 13) % 13;
            clock.pointerBlack = romanNumbers[idx];
        }

        // 精确验证 1:1 通关时间对齐
        if (clock.pointerRed === "VII" && clock.pointerBlack === "∽") {
            clock.grandmaOut = true;
            return "【场景动态突变】钟楼顶端大自鸣钟发出‘当当’两声闷响。坐在二楼阳台的机械大妈推开雕花铁门，快步走向了对面的大教堂，她的房间此时空无一人。";
        }
        return `当前时钟指针反馈：红针指向 [${clock.pointerRed}]，黑针指向 [${clock.pointerBlack}]。没有任何事情发生。`;
    }

    // 细节B2：趁老奶奶外出进入阳台偷取旧收音机
    stealRadio() {
        let clock = this.gameState.clockTower;
        let inv = this.gameState.josef.inventory;
        if (!clock.grandmaOut) {
            return "二楼阳台的老奶奶正坐在摇椅上警惕地张望，手边放着沉重的大铁手杖，无法靠近！";
        }
        if (clock.radioStolen) {
            return "阳台窗台上的旧收音机已经被你取走了。";
        }
        clock.radioStolen = true;
        if (!inv.includes("旧收音机")) {
            inv.push("旧收音机");
        }
        return "【核心道具入手】约瑟夫轻手轻脚爬上二楼阳台，顺利从窗台抱走了落满铁锈的【旧收音机】！";
    }

    // 细节C：电击流浪猫并驱赶大号手乐器里的老鼠
    handleCatElectricity(action) {
        let cat = this.gameState.strayCat;
        let horn = this.gameState.musicians.horn;
        let inv = this.gameState.josef.inventory;

        if (action === "放置收音机") {
            if (!this.gameState.clockTower.grandmaOut || !inv.includes("旧收音机")) {
                return "你需要先从空无一人的钟楼二楼阳台取得【旧收音机】。";
            }
            this.gameState.wires.radioPlaced = true;
            this.gameState.wires.sparking = true;
            cat.isElectrocuted = true;
            cat.location = "stunned";
            const idx = inv.indexOf("旧收音机");
            if (idx !== -1) inv.splice(idx, 1);
            return "【高压电火花粒子特效】约瑟夫把从大妈房间里偷来的旧收音机挂在了破损的裸露电线上。高压电流瞬间过载，整条胡同的路灯开始剧烈闪烁，趴在铁轨上的流浪猫瞬间被电得全身毛发直立，陷入眩晕状态。";
        }

        if (action === "捕捉") {
            if (!cat.isElectrocuted) {
                return "流浪猫依然高高蹲在暗处的墙头上，动作敏捷，无法靠近。";
            }
            if (cat.isCaptured) {
                return "流浪猫已经被收容在约瑟夫的胸腔铁盒里了。";
            }
            cat.isCaptured = true;
            cat.location = "captured";
            if (!inv.includes("眩晕流浪猫")) {
                inv.push("眩晕流浪猫");
            }
            return "约瑟夫迅速上前，一把抱住瘫软的【眩晕流浪猫】，将其塞进了胸口的铁舱内。";
        }

        if (action === "塞入大号" || action === "通大号" || action === "使用猫") {
            if (!cat.isCaptured && !inv.includes("眩晕流浪猫")) {
                return "大号内部卡着肥硕的铁皮老鼠，必须找到它的宿敌来驱赶它！";
            }
            if (!horn.mouseInside) {
                return "大号内部早已通畅，老鼠逃进了下水道！";
            }
            horn.mouseInside = false;
            horn.ratEscaped = true;
            horn.status = "fixed";
            horn.fxPlayed = true;
            cat.location = "inside_horn";
            const idx = inv.indexOf("眩晕流浪猫");
            if (idx !== -1) inv.splice(idx, 1);
            return "【1:1乐器联动】约瑟夫把猫强行塞进大号手的粗大喇叭口里！猫在乐器内部疯狂抓挠，潜伏在里面的铁皮大老鼠吓得魂飞魄散，连滚带爬地顺着下水道溜走。大号手乐器恢复通畅！";
        }

        return "流浪猫依然高高蹲在暗处的墙头上，动作敏捷，无法靠近。";
    }

    // 细节E：酒馆下棋老头五子棋对弈（11x11经典还原）
    playGomoku(row, col) {
        let om = this.gameState.oldMan;
        let inv = this.gameState.josef.inventory;
        if (om.winner === 1) {
            return { success: false, text: "你已经赢了老头，拿到了5枚黄铜螺母！" };
        }
        if (row < 0 || row >= 11 || col < 0 || col >= 11 || om.boardState[row][col] !== 0) {
            return { success: false, text: "此处无法落子。" };
        }

        // 约瑟夫落子 (黄铜螺母=1)
        om.boardState[row][col] = 1;
        if (this._checkGomokuFive(om.boardState, 1, row, col)) {
            om.winner = 1;
            om.currentMatch = "won";
            om.screwsWon = true;
            if (!inv.includes("黄铜螺母")) {
                inv.push("黄铜螺母");
            }
            return {
                success: true,
                winner: 1,
                action: "OLD_MAN_SMASH_TABLE",
                text: "【五子连珠战胜对手】下棋老头机器人数了数连成一线的5颗黄铜螺母，恼羞成怒地抱头猛砸棋盘桌面！整张铁桌震动，震落了5枚【黄铜螺母】！约瑟夫迅速将其收入囊中。"
            };
        }

        // 老头 AI 落子 (黑铁螺栓=2)
        const move = this._findBestGomokuMove(om.boardState);
        if (move) {
            om.boardState[move.r][move.c] = 2;
            if (this._checkGomokuFive(om.boardState, 2, move.r, move.c)) {
                om.winner = 2;
                om.currentMatch = "lost";
                return {
                    success: true,
                    winner: 2,
                    aiMove: move,
                    text: "老头机器人完成了五子连珠，洋洋得意地敲响酒杯！重开一局试试吧。"
                };
            }
        }

        return {
            success: true,
            winner: 0,
            aiMove: move,
            text: "落子成功，请继续布局。"
        };
    }

    _checkGomokuFive(board, player, r, c) {
        const dirs = [[1,0], [0,1], [1,1], [1,-1]];
        for (const [dr, dc] of dirs) {
            let count = 1;
            let step = 1;
            while (r + dr * step >= 0 && r + dr * step < 11 && c + dc * step >= 0 && c + dc * step < 11 && board[r + dr * step][c + dc * step] === player) {
                count++; step++;
            }
            step = 1;
            while (r - dr * step >= 0 && r - dr * step < 11 && c - dc * step >= 0 && c - dc * step < 11 && board[r - dr * step][c - dc * step] === player) {
                count++; step++;
            }
            if (count >= 5) return true;
        }
        return false;
    }

    _findBestGomokuMove(board) {
        let bestScore = -1;
        let bestMove = null;
        for (let r = 0; r < 11; r++) {
            for (let c = 0; c < 11; c++) {
                if (board[r][c] === 0) {
                    let score = 10 - (Math.abs(r - 5) + Math.abs(c - 5));
                    board[r][c] = 2;
                    if (this._checkGomokuFive(board, 2, r, c)) score += 10000;
                    board[r][c] = 1;
                    if (this._checkGomokuFive(board, 1, r, c)) score += 5000;
                    board[r][c] = 0;
                    if (score > bestScore) {
                        bestScore = score;
                        bestMove = { r, c };
                    }
                }
            }
        }
        return bestMove || { r: 5, c: 5 };
    }

    // 细节F：修复萨克斯手
    repairSaxophone(itemUsed) {
        let sax = this.gameState.musicians.sax;
        let inv = this.gameState.josef.inventory;
        if (sax.status === "fixed") {
            return "萨克斯手按键完整，正吹奏着美妙的蒸汽爵士旋律。";
        }
        if (itemUsed === "黄铜螺母" || inv.includes("黄铜螺母")) {
            sax.status = "fixed";
            sax.screwsInstalled = 5;
            sax.fxPlayed = true;
            const idx = inv.indexOf("黄铜螺母");
            if (idx !== -1) inv.splice(idx, 1);
            return "【1:1乐器联动】约瑟夫把在下棋赢来的5枚黄铜螺母逐一旋紧在萨克斯管壁的音孔上！萨克斯手如释重负，抬手吹出了一段欢快的蓝调滑音！";
        }
        return "萨克斯手的按键螺母在酒馆赌博时输光了，没有螺母封住气孔，发不出完整的音阶。";
    }

    // 细节G：修复破鼓手
    repairDrum(itemUsed) {
        let drum = this.gameState.musicians.drum;
        let inv = this.gameState.josef.inventory;
        if (drum.status === "fixed") {
            return "破鼓手拥有了结实的底鼓油桶，正敲出震耳欲聋的鼓点。";
        }
        if (itemUsed === "大油桶" || inv.includes("大油桶")) {
            drum.status = "fixed";
            drum.headTorn = false;
            drum.oilDrumInstalled = true;
            drum.fxPlayed = true;
            const idx = inv.indexOf("大油桶");
            if (idx !== -1) inv.splice(idx, 1);
            return "【1:1乐器联动】约瑟夫将从酒馆柜台扛出来的沉重【大油桶】稳稳放在鼓架底座！鼓手抄起双槌猛敲油桶铁皮，沉稳有力的重低音回荡在广场上空！";
        }
        return "鼓手的鼓面彻底撕裂成了两半，急需一个坚硬耐砸的厚重铁桶来作为共鸣底鼓。";
    }

    // 细节D：三位乐手完全修复后的联合动画判定
    checkBandPerformance() {
        let mus = this.gameState.musicians;
        if (mus.sax.status === "fixed" && mus.drum.status === "fixed" && mus.horn.status === "fixed") {
            this.gameState.bandConcert.isPlaying = true;
            this.gameState.flowerPot.thrown = true;
            this.gameState.flowerPot.smashed = true;
            return {
                audioTrigger: "PLAY_STREET_BAND_JAZZ_LOOP",
                npcAnimation: "GRANDMA_ANGRY_THROW_POT",
                rewardItem: "获得道具：收音机调频拨盘 + 废旧锌锰电池",
                description: "【全场景终极交互通关】萨克斯、破鼓、大号同时奏响了激昂的蒸汽爵士乐！狂欢的声浪引发了周围居民的极度不满，二楼愤怒的机械大妈猛地推开窗户，尖叫着砸下一个巨大的重质黏土花盆。花盆在青石板上摔得粉碎，露出了里面隐藏的【调频拨盘】与【废旧电池】！"
            };
        }
        return "乐队乐器尚未找齐，乐手们依然在垂头丧气地叹气。";
    }

    // 细节H：拾取花盆碎片中摔出的通关战利品
    pickPotRewards() {
        let pot = this.gameState.flowerPot;
        let inv = this.gameState.josef.inventory;
        if (!pot.smashed) {
            return "青石板路面光洁，尚未有任何碎裂花盆。";
        }
        let rewards = [];
        if (!pot.dialPicked) {
            pot.dialPicked = true;
            if (!inv.includes("调频拨盘")) inv.push("调频拨盘");
            rewards.push("调频拨盘");
        }
        if (!pot.batteryPicked) {
            pot.batteryPicked = true;
            if (!inv.includes("废旧锌锰电池")) inv.push("废旧锌锰电池");
            rewards.push("废旧锌锰电池");
        }
        if (rewards.length > 0) {
            this.gameState.solved = true;
            return `【核心解谜道具入手】约瑟夫在破碎花盆的黑色沃土中翻寻出了：【${rewards.join('】与【')}】！第八章全要素1:1通关完毕！`;
        }
        return "花盆泥土里的道具已经被你悉数捡起。";
    }
}

// 引擎实例化接口分配
const mach_chapter8 = new TownSquareLevel();
if (typeof window !== "undefined") {
    window.TownSquareLevel = TownSquareLevel;
    window.mach_chapter8 = mach_chapter8;
}
if (typeof module !== "undefined" && module.exports) {
    module.exports = { TownSquareLevel, mach_chapter8 };
}
console.log("《机械迷城》第八章全细节像素级状态机载入成功。");
