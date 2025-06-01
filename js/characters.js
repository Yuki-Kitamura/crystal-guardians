// グリッドベース攻撃範囲定数 (64px = 1グリッド)
const ATTACK_RANGES = {
    warrior: 96,     // 1.5グリッド
    archer: 192,     // 3グリッド  
    wizard: 160,     // 2.5グリッド
    timemage: 128,   // 2グリッド
    treasurehunter: 128  // 2グリッド
};

// グリッドベース攻撃システム
function canAttackTarget(tower, enemy) {
    const distance = Math.sqrt(
        Math.pow(tower.x - enemy.x, 2) + 
        Math.pow(tower.y - enemy.y, 2)
    );
    return distance <= ATTACK_RANGES[tower.type];
}

class Character { 
    constructor(x, y, type) { 
        this.x = x; 
        this.y = y; 
        this.type = type; 
        this.level = 1; 
        this.target = null; 
        this.lastAttack = 0; 
        this.lastAttackTime = 0; // 攻撃時間管理を統一
        this.range = ATTACK_RANGES[type] || 64; // グリッドベース射程
        this.damage = 10; 
        this.attackSpeed = 1000; 
        this.cost = 100; 
        this.sellValue = 50; 
        this.canAttackAir = false; 
        this.specialEffect = null; 
        this.selected = false; 
    } 

    update(enemies, currentTime) { 
        // 安全性チェック
        if (!Array.isArray(enemies)) {
            console.warn("⚠️ Character.update: enemies is not an array");
            return;
        }
        
        this.target = this.selectTarget(enemies); 
        if (this.target && currentTime - this.lastAttackTime >= this.attackSpeed) { 
            this.attack(enemies, currentTime); 
        } 
    } 

    selectTarget(enemies) { 
        // 安全性チェック：enemiesが配列でない場合は空配列として扱う
        if (!Array.isArray(enemies)) {
            console.warn("⚠️ selectTarget: enemies is not an array, using empty array");
            enemies = [];
        }
        
        let closestEnemy = null; 
        let closestDistance = Infinity; 
        
        for (const enemy of enemies) { 
            if (!enemy || !enemy.isAlive()) continue; 
            if (enemy.isFlying && !this.canAttackAir) continue; 
            
            const distance = this.getDistance(enemy); 
            if (distance <= this.range) {
                // 射線チェック：岩による遮蔽を確認
                if (this.hasLineOfSight(enemy)) {
                    if (distance < closestDistance) {
                        closestDistance = distance; 
                        closestEnemy = enemy; 
                    }
                }
            } 
        } 
        
        return closestEnemy; 
    }

    // 射線チェック（岩による遮蔽を確認）
    hasLineOfSight(enemy) {
        if (!window.game || !window.game.gridSystem) {
            return true; // グリッドシステムが利用できない場合はブロックしない
        }
        
        // 射線を複数のポイントに分割してチェック
        const steps = 10;
        for (let i = 1; i < steps; i++) {
            const t = i / steps;
            const checkX = this.x + (enemy.x - this.x) * t;
            const checkY = this.y + (enemy.y - this.y) * t;
            
            const panel = window.game.gridSystem.getPanelAt(checkX, checkY);
            if (panel && panel.blocksLineOfSight()) {
                return false; // 岩によって射線がブロックされている
            }
        }
        
        return true; // 射線は通っている
    }

    attack(enemies, currentTime) {
        // 安全性チェック：enemiesが配列でない場合は処理を中断
        if (!Array.isArray(enemies)) {
            console.warn("⚠️ attack: enemies is not an array, skipping attack");
            return;
        }
        
        if (currentTime - this.lastAttackTime < this.attackSpeed) {
            return;
        }

        const target = this.selectTarget(enemies);
        if (!target) return;

        // 天候・時間帯・難易度効果を取得
        let damageMultiplier = 1.0;
        let rangeMultiplier = 1.0;
        
        if (window.game && window.game.weatherSystem && window.game.difficultySystem) {
            const weatherEffects = window.game.weatherSystem.getCombinedEffects();
            const difficultyEffects = window.game.difficultySystem.getCombinedDifficultyEffects(
                window.game.waveManager.mapManager.currentMap,
                weatherEffects
            );
            
            damageMultiplier = difficultyEffects.towerDamageMultiplier || 1.0;
            rangeMultiplier = difficultyEffects.towerRangeMultiplier || 1.0;
        }

        // 実際のダメージ計算
        const finalDamage = Math.round(this.damage * damageMultiplier);
        target.takeDamage(finalDamage);

        // 攻撃エフェクトを追加
        if (window.game && window.game.addAttackEffect) {
            window.game.addAttackEffect("projectile", this.x, this.y, target.x, target.y);
        }

        // ダメージ数値を表示
        if (window.game && window.game.addDamageNumber) {
            window.game.addDamageNumber(target.x, target.y, finalDamage);
        }

        this.lastAttackTime = currentTime;

        // 敵撃破時の処理
        if (!target.isAlive() && window.game && window.game.onEnemyDefeated) {
            window.game.onEnemyDefeated(target);
        }
    } 

    getDistance(enemy) { 
        const dx = this.x - enemy.x; 
        const dy = this.y - enemy.y; 
        return Math.sqrt(dx * dx + dy * dy); 
    } 

    upgrade() { 
        const upgradeCost = this.level * 50; 
        this.level++; 
        this.damage = Math.floor(this.damage * 1.5); 
        this.sellValue += upgradeCost / 2; 
        return upgradeCost; 
    } 

    render(ctx) { 
        // キャラクター本体
        ctx.fillStyle = this.getColor(); 
        ctx.fillRect(this.x - 15, this.y - 15, 30, 30); 
        
        // アイコン
        ctx.fillStyle = "white"; 
        ctx.font = "16px Arial"; 
        ctx.textAlign = "center"; 
        ctx.fillText(this.getIcon(), this.x, this.y + 5); 
        
        // レベル表示
        ctx.fillStyle = "white"; 
        ctx.font = "10px Arial"; 
        ctx.textAlign = "center"; 
        ctx.fillText(this.level.toString(), this.x, this.y - 20); 
        
        // 選択時の攻撃範囲表示
        if (this.selected) { 
            ctx.strokeStyle = "rgba(46, 204, 113, 0.8)"; 
            ctx.lineWidth = 2; 
            ctx.beginPath(); 
            ctx.arc(this.x, this.y, this.range, 0, Math.PI * 2); 
            ctx.stroke(); 
            
            ctx.strokeStyle = "rgba(255, 255, 255, 0.8)"; 
            ctx.lineWidth = 3; 
            ctx.strokeRect(this.x - 18, this.y - 18, 36, 36); 
        } 
        
        // ターゲットライン
        if (this.target && this.target.isAlive()) { 
            ctx.strokeStyle = "rgba(255, 0, 0, 0.5)"; 
            ctx.lineWidth = 2; 
            ctx.beginPath(); 
            ctx.moveTo(this.x, this.y); 
            ctx.lineTo(this.target.x, this.target.y); 
            ctx.stroke(); 
        } 
    } 

    getColor() { 
        return "#3498db"; 
    } 

    getIcon() { 
        return "⚔️"; 
    } 

    getAttackColor() { 
        return "#f39c12"; 
    } 

    getDamageColor() { 
        return "#f39c12"; 
    } 
} 

class Warrior extends Character { 
    constructor(x, y) { 
        super(x, y, "warrior"); 
        this.damage = 45; 
        this.range = ATTACK_RANGES.warrior; 
        this.attackSpeed = 800; 
        this.cost = 100; 
        this.canAttackAir = false; 
    } 

    getColor() { 
        return "#e74c3c"; 
    } 

    getIcon() { 
        return "⚔️"; 
    } 

    getAttackColor() { 
        return "#e74c3c"; 
    } 

    getDamageColor() { 
        return "#e74c3c"; 
    } 
} 

class Archer extends Character { 
    constructor(x, y) { 
        super(x, y, "archer"); 
        this.damage = 25; 
        this.range = ATTACK_RANGES.archer; 
        this.attackSpeed = 1200; 
        this.cost = 80; 
        this.canAttackAir = true; 
    } 

    getColor() { 
        return "#27ae60"; 
    } 

    getIcon() { 
        return "🏹"; 
    } 

    getAttackColor() { 
        return "#27ae60"; 
    } 

    getDamageColor() { 
        return "#27ae60"; 
    } 
} 

class Wizard extends Character { 
    constructor(x, y) { 
        super(x, y, "wizard"); 
        this.damage = 35; 
        this.range = ATTACK_RANGES.wizard; 
        this.attackSpeed = 2000; 
        this.cost = 120; 
        this.canAttackAir = true; 
        this.areaOfEffect = 80; // 範囲攻撃半径
    } 

    attack(enemies, currentTime) { 
        // 安全性チェック：enemiesが配列でない場合は処理を中断
        if (!Array.isArray(enemies)) {
            console.warn("⚠️ Wizard.attack: enemies is not an array, skipping attack");
            return;
        }
        
        if (currentTime - this.lastAttackTime < this.attackSpeed) {
            return;
        }

        const target = this.selectTarget(enemies);
        if (!target || !target.isAlive()) return;

        if (window.game) { 
            window.game.addAttackEffect('explosion', target.x, target.y, 0, 0, this.getAttackColor()); 
        } 
        
        let hitCount = 0; 
        for (const e of enemies) { 
            if (this.getDistance(e) <= this.areaOfEffect && e.isAlive()) { 
                // 敵にダメージを与える前の生存状態を確認
                const wasAlive = e.isAlive();
                e.takeDamage(this.damage); 
                hitCount++; 
                
                if (window.game) { 
                    window.game.addDamageNumber(e.x, e.y - 20, this.damage, this.getDamageColor()); 
                    
                    // 敵が撃破された場合の処理
                    if (wasAlive && !e.isAlive()) {
                        window.game.onEnemyDefeated(e);
                    }
                } 
            } 
        } 
        this.lastAttackTime = currentTime; 
    } 

    getColor() { 
        return "#9b59b6"; 
    } 

    getIcon() { 
        return "🧙"; 
    } 

    getAttackColor() { 
        return "#9b59b6"; 
    } 

    getDamageColor() { 
        return "#9b59b6"; 
    } 
} 

class TimeMage extends Character { 
    constructor(x, y) { 
        super(x, y, "timemage"); 
        this.damage = 15; 
        this.range = ATTACK_RANGES.timemage; 
        this.attackSpeed = 1500; 
        this.cost = 100; 
        this.canAttackAir = true; 
        this.slowEffect = 0.3; 
        this.slowDuration = 4000; 
    } 

    attack(enemies, currentTime) { 
        // 安全性チェック：enemiesが配列でない場合は処理を中断
        if (!Array.isArray(enemies)) {
            console.warn("⚠️ TimeMage.attack: enemies is not an array, skipping attack");
            return;
        }
        
        if (currentTime - this.lastAttackTime < this.attackSpeed) {
            return;
        }

        const target = this.selectTarget(enemies);
        if (!target || !target.isAlive()) return;

        if (window.game) { 
            window.game.addAttackEffect('projectile', this.x, this.y, target.x, target.y, this.getAttackColor()); 
            window.game.addDamageNumber(target.x, target.y - 20, this.damage, this.getDamageColor()); 
        } 
        
        // 敵にダメージを与える前の生存状態を確認
        const wasAlive = target.isAlive();
        target.takeDamage(this.damage); 
        target.applySlow(this.slowEffect, this.slowDuration); 
        
        // 敵が撃破された場合の処理
        if (wasAlive && !target.isAlive() && window.game) {
            window.game.onEnemyDefeated(target);
        }
        
        this.lastAttackTime = currentTime; 
    } 

    getColor() { 
        return "#f39c12"; 
    } 

    getIcon() { 
        return "⏰"; 
    } 

    getAttackColor() { 
        return "#3498db"; 
    } 

    getDamageColor() { 
        return "#3498db"; 
    } 
} 

class TreasureHunter extends Character { 
    constructor(x, y) { 
        super(x, y, "treasurehunter"); 
        this.damage = 22; 
        this.range = ATTACK_RANGES.treasurehunter; 
        this.attackSpeed = 900; 
        this.cost = 60; 
        this.canAttackAir = false; 
        this.goldMultiplier = 2.0; 
    } 

    attack(enemies, currentTime) { 
        // 安全性チェック：enemiesが配列でない場合は処理を中断
        if (!Array.isArray(enemies)) {
            console.warn("⚠️ TreasureHunter.attack: enemies is not an array, skipping attack");
            return;
        }
        
        if (currentTime - this.lastAttackTime < this.attackSpeed) {
            return;
        }

        const target = this.selectTarget(enemies);
        if (!target || !target.isAlive()) return;

        if (window.game) { 
            window.game.addAttackEffect('projectile', this.x, this.y, target.x, target.y, this.getAttackColor()); 
            window.game.addDamageNumber(target.x, target.y - 20, this.damage, this.getDamageColor()); 
        } 
        
        // 敵にダメージを与える前の生存状態を確認
        const wasAlive = target.isAlive();
        target.takeDamage(this.damage); 
        
        // 敵が撃破された場合の処理（ボーナスゴールド追加）
        if (wasAlive && !target.isAlive() && window.game) {
            // 通常の撃破ボーナス
            window.game.onEnemyDefeated(target);
            
            // トレジャーハンターの追加ボーナス
            const bonusGold = Math.floor((window.game.ENEMY_REWARDS[target.type] || 10) * (this.goldMultiplier - 1)); 
            if (bonusGold > 0) {
                window.game.addGold(bonusGold); 
                window.game.showFloatingText(target.x, target.y - 35, `+${bonusGold}G`, "#f1c40f"); 
            }
        }
        
        this.lastAttackTime = currentTime; 
    }

    getColor() { 
        return "#f1c40f"; 
    } 

    getIcon() { 
        return "💰"; 
    } 

    getAttackColor() { 
        return "#f1c40f"; 
    } 

    getDamageColor() { 
        return "#f1c40f"; 
    } 
} 

class CharacterFactory { 
    static create(type, x, y) { 
        switch (type) { 
            case "warrior": return new Warrior(x, y); 
            case "archer": return new Archer(x, y); 
            case "wizard": return new Wizard(x, y); 
            case "timemage": return new TimeMage(x, y); 
            case "treasurehunter": return new TreasureHunter(x, y); 
            default: throw new Error(`Unknown character type: ${type}`); 
        } 
    } 

    static getCost(type) { 
        const costs = { 
            warrior: 100, 
            archer: 80, 
            wizard: 120, 
            timemage: 100, 
            treasurehunter: 60 
        }; 
        return costs[type] || 100; 
    } 

    static getInfo(type) { 
        const info = { 
            warrior: { 
                name: "ウォリアー", 
                description: "高い攻撃力と素早い攻撃速度を持つ近接戦士。地上の敵に特化。", 
                damage: 45, 
                range: ATTACK_RANGES.warrior, 
                attackSpeed: 800, 
                canAttackAir: false 
            }, 
            archer: { 
                name: "アーチャー", 
                description: "長射程で空中の敵も攻撃可能。バランスの取れた遠距離攻撃ユニット。", 
                damage: 25, 
                range: ATTACK_RANGES.archer, 
                attackSpeed: 1200, 
                canAttackAir: true 
            }, 
            wizard: { 
                name: "ウィザード", 
                description: "強力な範囲魔法攻撃で複数の敵を同時に攻撃。高コストだが高威力。", 
                damage: 35, 
                range: ATTACK_RANGES.wizard, 
                attackSpeed: 2000, 
                canAttackAir: true 
            }, 
            timemage: { 
                name: "タイムメイジ", 
                description: "敵の動きを大幅に遅くする時間魔法の使い手。サポート特化。", 
                damage: 15, 
                range: ATTACK_RANGES.timemage, 
                attackSpeed: 1500, 
                canAttackAir: true 
            }, 
            treasurehunter: { 
                name: "トレジャーハンター", 
                description: "敵を倒すと追加ゴールドを獲得。経済効率に優れた高速攻撃ユニット。", 
                damage: 22, 
                range: ATTACK_RANGES.treasurehunter, 
                attackSpeed: 900, 
                canAttackAir: false 
            } 
        }; 
        return info[type] || null; 
    } 
}
