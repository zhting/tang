/**
 * gameEconomy.js - 积木小院 全局经济与药水系统
 * 负责管理：
 * 1. 奖杯 (Trophies): 关卡完成后获得，用于1:1兑换绿宝石
 * 2. 绿宝石 (Emeralds): 用于购买各类魔法药水 (2绿宝石/瓶)
 * 3. 四大药水库存: 加速药水、跳跃提升药水、悬浮药水、瞬移药水
 * 4. 开发者模式无限药水机制
 */

(function () {
    'use strict';

    const POTION_TYPES = {
        speed: { id: 'speed', name: '加速药水', icon: '⚡', color: '#FFA000', price: 2, desc: '效果持续 10 秒，极速冲刺与爬行' },
        jump: { id: 'jump', name: '跳跃提升药水', icon: '🦘', color: '#43A047', price: 2, desc: '跳跃高度达到自身两倍，持续 10 秒' },
        levitation: { id: 'levitation', name: '悬浮药水', icon: '🪶', color: '#00ACC1', price: 2, desc: '免疫重力在空中自由悬浮漫步，持续 10 秒' },
        teleport: { id: 'teleport', name: '瞬移药水', icon: '🔮', color: '#8E24AA', price: 2, desc: '一次性效果，点击屏幕任意位置直接瞬移' }
    };

    // 音频合成器（Web Audio API 无损生成）
    let audioCtx = null;
    function getAudioCtx() {
        if (!audioCtx) {
            const AC = window.AudioContext || window.webkitAudioContext;
            if (AC) audioCtx = new AC();
        }
        if (audioCtx && audioCtx.state === 'suspended') {
            audioCtx.resume();
        }
        return audioCtx;
    }

    function playSound(type) {
        try {
            const ctx = getAudioCtx();
            if (!ctx) return;
            const now = ctx.currentTime;

            if (type === 'villager_hrrr' || type === 'villager_huh') {
                // 原版村民标志性鼻音与喉音 "Huh~ / Hrrrm" 哼叫音效
                const osc1 = ctx.createOscillator();
                const osc2 = ctx.createOscillator();
                osc1.type = 'sawtooth';
                osc2.type = 'square';

                // 音高滑落：158Hz -> 124Hz (鼻音微降)
                osc1.frequency.setValueAtTime(158, now);
                osc1.frequency.exponentialRampToValueAtTime(124, now + 0.38);
                osc2.frequency.setValueAtTime(158.8, now);
                osc2.frequency.exponentialRampToValueAtTime(124.6, now + 0.38);

                // 喉音小颤音 LFO (14Hz 微振)
                const lfo = ctx.createOscillator();
                const lfoGain = ctx.createGain();
                lfo.frequency.setValueAtTime(14, now);
                lfoGain.gain.setValueAtTime(6.5, now);
                lfo.connect(osc1.frequency);
                lfo.connect(osc2.frequency);

                // 鼻腔带通滤波共振腔 (中心频率 720Hz -> 650Hz，Q=4.2 还原村民标志鼻音)
                const filter = ctx.createBiquadFilter();
                filter.type = 'bandpass';
                filter.frequency.setValueAtTime(720, now);
                filter.frequency.exponentialRampToValueAtTime(650, now + 0.38);
                filter.Q.setValueAtTime(4.2, now);

                const gain = ctx.createGain();
                gain.gain.setValueAtTime(0.01, now);
                gain.gain.linearRampToValueAtTime(0.28, now + 0.04);
                gain.gain.exponentialRampToValueAtTime(0.001, now + 0.38);

                osc1.connect(filter);
                osc2.connect(filter);
                filter.connect(gain);
                gain.connect(ctx.destination);

                lfo.start(now);
                osc1.start(now);
                osc2.start(now);

                lfo.stop(now + 0.38);
                osc1.stop(now + 0.38);
                osc2.stop(now + 0.38);

            } else if (type === 'item_pop') {
                // 物品掉落清脆弹出音
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                osc.type = 'triangle';
                osc.frequency.setValueAtTime(480, now);
                osc.frequency.exponentialRampToValueAtTime(840, now + 0.04);
                osc.frequency.exponentialRampToValueAtTime(320, now + 0.12);
                gain.gain.setValueAtTime(0.22, now);
                gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
                osc.connect(gain);
                gain.connect(ctx.destination);
                osc.start(now);
                osc.stop(now + 0.12);

            } else if (type === 'villager_no') {
                // 村民否定音效 "Hrr-hrr"
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                osc.type = 'sawtooth';
                osc.frequency.setValueAtTime(120, now);
                osc.frequency.linearRampToValueAtTime(90, now + 0.25);
                gain.gain.setValueAtTime(0.18, now);
                gain.gain.exponentialRampToValueAtTime(0.001, now + 0.28);
                osc.connect(gain);
                gain.connect(ctx.destination);
                osc.start(now);
                osc.stop(now + 0.3);

            } else if (type === 'trade_success') {
                // 交易成功清脆升级音
                const freqs = [523.25, 659.25, 783.99, 1046.50];
                freqs.forEach((f, i) => {
                    const osc = ctx.createOscillator();
                    const gain = ctx.createGain();
                    osc.type = 'triangle';
                    osc.frequency.setValueAtTime(f, now + i * 0.07);
                    gain.gain.setValueAtTime(0.18, now + i * 0.07);
                    gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.07 + 0.25);
                    osc.connect(gain);
                    gain.connect(ctx.destination);
                    osc.start(now + i * 0.07);
                    osc.stop(now + i * 0.07 + 0.28);
                });

            } else if (type === 'drink') {
                // 药水饮用咕噜声
                for (let i = 0; i < 3; i++) {
                    const osc = ctx.createOscillator();
                    const gain = ctx.createGain();
                    osc.type = 'sine';
                    osc.frequency.setValueAtTime(320 + i * 80, now + i * 0.09);
                    gain.gain.setValueAtTime(0.15, now + i * 0.09);
                    gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.09 + 0.12);
                    osc.connect(gain);
                    gain.connect(ctx.destination);
                    osc.start(now + i * 0.09);
                    osc.stop(now + i * 0.09 + 0.14);
                }
            } else if (type === 'teleport') {
                // 末影传送轰鸣音
                const osc = ctx.createOscillator();
                const gain = ctx.createGain();
                osc.type = 'sine';
                osc.frequency.setValueAtTime(220, now);
                osc.frequency.exponentialRampToValueAtTime(880, now + 0.18);
                osc.frequency.exponentialRampToValueAtTime(110, now + 0.4);
                gain.gain.setValueAtTime(0.28, now);
                gain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);
                osc.connect(gain);
                gain.connect(ctx.destination);
                osc.start(now);
                osc.stop(now + 0.48);
            }
        } catch (e) {}
    }

    const GameEconomy = {
        POTION_TYPES: POTION_TYPES,

        // 判断是否开启开发者/创造者模式
        isDevMode: function () {
            if (typeof isDevMode !== 'undefined' && isDevMode) return true;
            try {
                if (localStorage.getItem('creator_mode_active') === 'true') return true;
            } catch (e) {}
            return false;
        },

        // 获取奖杯数
        getTrophies: function () {
            try {
                const saved = localStorage.getItem('game_trophies');
                if (saved !== null) {
                    return Math.max(0, parseInt(saved, 10) || 0);
                }
                // 初次加载：根据玩家已通关关卡赠送初始奖杯福利（保底6个，方便立即测试体验）
                let earned = 0;
                const m7Norm = parseInt(localStorage.getItem('mode7_progress_normal') || '1', 10);
                const m7Easy = parseInt(localStorage.getItem('mode7_progress_easy') || '1', 10);
                earned = Math.max(0, m7Norm - 1) + Math.max(0, m7Easy - 1);
                const initial = Math.max(6, earned);
                localStorage.setItem('game_trophies', initial.toString());
                return initial;
            } catch (e) {
                return 6;
            }
        },

        // 增加奖杯 (每关通关触发)
        addTrophies: function (count) {
            count = Math.max(0, count || 1);
            const current = this.getTrophies();
            const updated = current + count;
            try {
                localStorage.setItem('game_trophies', updated.toString());
            } catch (e) {}
            this.notifyChange();
            return updated;
        },

        // 消耗奖杯
        spendTrophies: function (count) {
            const current = this.getTrophies();
            if (current < count) return false;
            const updated = current - count;
            try {
                localStorage.setItem('game_trophies', updated.toString());
            } catch (e) {}
            this.notifyChange();
            return true;
        },

        // 设置奖杯数 (供重置/测试)
        setTrophies: function (count) {
            const val = Math.max(0, parseInt(count, 10) || 0);
            try {
                localStorage.setItem('game_trophies', val.toString());
            } catch (e) {}
            this.notifyChange();
            return val;
        },

        // 获取绿宝石数
        getEmeralds: function () {
            try {
                const saved = localStorage.getItem('game_emeralds');
                if (saved !== null) {
                    return Math.max(0, parseInt(saved, 10) || 0);
                }
                // 默认初始赠送 4 颗绿宝石
                localStorage.setItem('game_emeralds', '4');
                return 4;
            } catch (e) {
                return 4;
            }
        },

        // 设置绿宝石数
        setEmeralds: function (count) {
            const val = Math.max(0, parseInt(count, 10) || 0);
            try {
                localStorage.setItem('game_emeralds', val.toString());
            } catch (e) {}
            this.notifyChange();
            return val;
        },

        // 增加绿宝石
        addEmeralds: function (count) {
            count = Math.max(0, count || 1);
            const current = this.getEmeralds();
            const updated = current + count;
            try {
                localStorage.setItem('game_emeralds', updated.toString());
            } catch (e) {}
            this.notifyChange();
            return updated;
        },

        // 消耗绿宝石
        spendEmeralds: function (count) {
            if (this.isDevMode()) return true; // 开发者模式免费
            const current = this.getEmeralds();
            if (current < count) return false;
            const updated = current - count;
            try {
                localStorage.setItem('game_emeralds', updated.toString());
            } catch (e) {}
            this.notifyChange();
            return true;
        },

        // 奖杯兑换绿宝石（1 奖杯 换 1 绿宝石）
        exchangeTrophyToEmerald: function (count) {
            count = parseInt(count, 10) || 1;
            if (count <= 0) return { success: false, msg: '兑换数量须大于0' };
            const trophies = this.getTrophies();
            if (trophies < count) {
                playSound('villager_no');
                return { success: false, msg: '奖杯数量不足！' };
            }
            this.spendTrophies(count);
            this.addEmeralds(count);
            playSound('trade_success');
            return { success: true, count: count };
        },

        // 获取药水库存对象
        getPotions: function () {
            try {
                const saved = localStorage.getItem('game_potions');
                if (saved) {
                    const parsed = JSON.parse(saved);
                    return {
                        speed: Math.max(0, parseInt(parsed.speed, 10) || 0),
                        jump: Math.max(0, parseInt(parsed.jump, 10) || 0),
                        levitation: Math.max(0, parseInt(parsed.levitation, 10) || 0),
                        teleport: Math.max(0, parseInt(parsed.teleport, 10) || 0)
                    };
                }
            } catch (e) {}
            // 默认库存：初始各药水均为0瓶，需在村民处交易购买
            const def = { speed: 0, jump: 0, levitation: 0, teleport: 0 };
            try {
                localStorage.setItem('game_potions', JSON.stringify(def));
            } catch (e) {}
            return def;
        },

        // 设置药水库存 (供重置/测试)
        setPotions: function (pots) {
            const val = {
                speed: Math.max(0, parseInt((pots && pots.speed), 10) || 0),
                jump: Math.max(0, parseInt((pots && pots.jump), 10) || 0),
                levitation: Math.max(0, parseInt((pots && pots.levitation), 10) || 0),
                teleport: Math.max(0, parseInt((pots && pots.teleport), 10) || 0)
            };
            try {
                localStorage.setItem('game_potions', JSON.stringify(val));
            } catch (e) {}
            this.notifyChange();
            return val;
        },

        // 获取某类药水数量
        getPotionCount: function (type) {
            if (this.isDevMode()) return 999; // 开发者模式无限药水
            const pots = this.getPotions();
            return pots[type] || 0;
        },

        // 购买药水 (2 绿宝石换 1 瓶)
        buyPotion: function (type) {
            if (!POTION_TYPES[type]) return { success: false, msg: '未知药水类型' };
            const price = POTION_TYPES[type].price; // 2
            if (!this.isDevMode()) {
                const emeralds = this.getEmeralds();
                if (emeralds < price) {
                    playSound('villager_no');
                    return { success: false, msg: '绿宝石不足！每瓶药水需 2 颗绿宝石' };
                }
                this.spendEmeralds(price);
            }

            const pots = this.getPotions();
            pots[type] = (pots[type] || 0) + 1;
            try {
                localStorage.setItem('game_potions', JSON.stringify(pots));
            } catch (e) {}
            playSound('trade_success');
            this.notifyChange();
            return { success: true, count: pots[type] };
        },

        // 获得/增加指定药水
        addPotion: function (type, count) {
            if (!POTION_TYPES[type]) return false;
            count = Math.max(1, count || 1);
            const pots = this.getPotions();
            pots[type] = (pots[type] || 0) + count;
            try {
                localStorage.setItem('game_potions', JSON.stringify(pots));
            } catch (e) {}
            this.notifyChange();
            return pots[type];
        },

        // 双击消耗 1 瓶药水
        consumePotion: function (type) {
            if (!POTION_TYPES[type]) return { success: false, msg: '未知药水类型' };
            if (this.isDevMode()) {
                // 开发者模式无限使用，不减数量
                playSound('drink');
                this.notifyChange();
                return { success: true, count: 999, isDev: true };
            }
            const pots = this.getPotions();
            if (!pots[type] || pots[type] <= 0) {
                return { success: false, msg: '药水已用完！' };
            }
            pots[type] -= 1;
            try {
                localStorage.setItem('game_potions', JSON.stringify(pots));
            } catch (e) {}
            playSound('drink');
            this.notifyChange();
            return { success: true, count: pots[type], isDev: false };
        },

        // 快捷音效播放接口
        playPotionDrinkSound: function () {
            playSound('drink');
        },
        playTeleportSound: function () {
            playSound('teleport');
        },

        // 播放音效代理
        playAudio: function (type) {
            playSound(type);
        },

        // 状态变更广播
        listeners: [],
        onChange: function (fn) {
            if (typeof fn === 'function') this.listeners.push(fn);
        },
        notifyChange: function () {
            const data = {
                trophies: this.getTrophies(),
                emeralds: this.getEmeralds(),
                potions: this.getPotions(),
                isDev: this.isDevMode()
            };
            this.listeners.forEach(fn => {
                try { fn(data); } catch (e) {}
            });
            // 派发 window 自定义事件
            if (typeof window !== 'undefined') {
                window.dispatchEvent(new CustomEvent('economyUpdated', { detail: data }));
            }
        }
    };

    window.GameEconomy = GameEconomy;
})();
