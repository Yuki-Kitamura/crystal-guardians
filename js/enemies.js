// 敵クラスの基底クラス
// グリッドシステムから動的にスタート・ゴール位置を取得するため、
// 固定座標定数は使用しません

class Enemy { 
    constructor() { 
        // 初期位置はグリッドシステムから動的に設定されるため、デフォルト値のみ設定
        this.x = 0; 
        this.y = 0;
        
        this.hp = 50; 
        this.maxHp = 50; 
        this.speed = 1; 
        this.reward = 10; 
        this.isFlying = false; 
        this.slowEffect = 1; 
        this.slowEndTime = 0;
        this.pathIndex = 0;
        this.pathProgress = 0;
        this.currentPath = [];
        this.type = "basic";
        this.size = 20;
        this.color = "#e74c3c";
        this.icon = "👹";
        this.mapNumber = 1;
        this.gridSystem = null;
        
        // 敵の一意識別子を追加（ゴール到達判定の重複防止）
        this.id = `enemy_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        this.hasReachedGoalFlag = false; // ゴール到達フラグ（重複処理防止）
        
        // 天候・難易度効果でHPを調整（初期化後に適用）
        this.applyDifficultyEffects();
    }
    
    // 難易度効果を適用
    applyDifficultyEffects() {
        if (window.game && window.game.weatherSystem && window.game.difficultySystem) {
            const weatherEffects = window.game.weatherSystem.getCombinedEffects();
            const difficultyEffects = window.game.difficultySystem.getCombinedDifficultyEffects(
                window.game.waveManager.mapManager.currentMap,
                weatherEffects
            );
            
            const hpMultiplier = difficultyEffects.enemyHpMultiplier || 1.0;
            this.maxHp = Math.floor(this.maxHp * hpMultiplier);
            this.hp = this.maxHp;
        }
    }

    // マップ番号を設定（移動パスに影響）
    setMapNumber(mapNumber) {
        this.mapNumber = mapNumber;
    }

    // グリッドシステムを設定
    setGridSystem(gridSystem) {
        this.gridSystem = gridSystem;
    }
    
    // グリッドシステムからゴール位置を取得
    getGoalPosition() {
        if (this.gridSystem) {
            const goalPanel = this.gridSystem.findPanelByType(PANEL_TYPES.GOAL);
            if (goalPanel) {
                return goalPanel.getPixelPosition();
            }
        }
        
        // フォールバック: グリッドシステムが利用できない場合の固定座標
        console.warn("⚠️ グリッドシステムが利用できません。フォールバック座標を使用します。");
        const fallbackPositions = {
            1: { x: 608, y: 224 }, // マップ1: (9,3)
            2: { x: 672, y: 352 }, // マップ2: (10,5)
            3: { x: 608, y: 224 }  // マップ3: (9,3)
        };
        return fallbackPositions[this.mapNumber] || fallbackPositions[1];
    }

    // 自由移動用の直線パスを生成
    generateDirectPath(targetX, targetY) {
        // 現在の敵の位置を開始点として使用
        const startX = this.x;
        const startY = this.y;
        
        // マップ番号に基づいた一貫性のある迂回ルート生成（ルート表示と同じロジック）
        let midOffsetX, midOffsetY;
        switch(this.mapNumber) {
            case 1:
                midOffsetX = 100;
                midOffsetY = -80;
                break;
            case 2:
                midOffsetX = -120;
                midOffsetY = 60;
                break;
            case 3:
                midOffsetX = 80;
                midOffsetY = -100;
                break;
            default:
                midOffsetX = 0;
                midOffsetY = 0;
        }
        
        const midX = (startX + targetX) / 2 + midOffsetX;
        const midY = (startY + targetY) / 2 + midOffsetY;
        
        // 3点を通る滑らかなカーブを生成（ベジェ曲線）
        const route = [];
        const segments = 20;
        
        for (let i = 0; i <= segments; i++) {
            const t = i / segments;
            
            // ベジェ曲線で滑らかなパスを生成
            const x = Math.pow(1-t, 2) * startX + 
                     2 * (1-t) * t * midX + 
                     Math.pow(t, 2) * targetX;
            const y = Math.pow(1-t, 2) * startY + 
                     2 * (1-t) * t * midY + 
                     Math.pow(t, 2) * targetY;
            
            route.push({ x, y });
        }
        
        return route;
    }

    move() { 
        const currentTime = Date.now(); 
        let currentSpeed = this.speed; 
        
        // 減速効果
        if (currentTime < this.slowEndTime) { 
            currentSpeed *= this.slowEffect; 
        }
        
        // 天候・難易度効果を適用
        if (window.game && window.game.weatherSystem && window.game.difficultySystem) {
            const weatherEffects = window.game.weatherSystem.getCombinedEffects();
            const difficultyEffects = window.game.difficultySystem.getCombinedDifficultyEffects(
                window.game.waveManager.mapManager.currentMap,
                weatherEffects
            );
            
            currentSpeed *= difficultyEffects.enemySpeedMultiplier || 1.0;
        }
        
        // パスが設定されている場合のみ移動
        if (this.currentPath && this.currentPath.length > 0) {
            this.moveAlongPath(currentSpeed);
        } else {
            // パスが設定されていない場合は停止（直進フォールバックを完全に削除）
            console.warn(`⚠️ 敵${this.id}にパスが設定されていません - 移動停止`);
            // 緊急時：ゴール位置に直接移動
            if (this.gridSystem) {
                const goalPosition = this.getGoalPosition();
                const dx = goalPosition.x - this.x;
                const dy = goalPosition.y - this.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                
                if (distance > currentSpeed) {
                    this.x += (dx / distance) * currentSpeed;
                    this.y += (dy / distance) * currentSpeed;
                } else {
                    this.x = goalPosition.x;
                    this.y = goalPosition.y;
                }
            }
        }
    }
    
    moveAlongPath(speed) {
        if (this.pathIndex >= this.currentPath.length - 1) {
            // パスの最後に到達した場合、ゴールに向かって移動
            const target = this.getGoalPosition();
            const dx = target.x - this.x;
            const dy = target.y - this.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            // ゴール到達チェック
            if (distance <= 15) {
                this.x = target.x;
                this.y = target.y;
                return;
            }
            
            if (distance > speed) {
                this.x += (dx / distance) * speed;
                this.y += (dy / distance) * speed;
            } else {
                this.x = target.x;
                this.y = target.y;
            }
            return;
        }
        
        // パス上を移動
        const currentPoint = this.currentPath[this.pathIndex];
        const nextPoint = this.currentPath[this.pathIndex + 1];
        
        if (!currentPoint || !nextPoint) {
            console.warn(`⚠️ 無効なパスポイント: ${this.pathIndex}/${this.currentPath.length}`);
            return;
        }
        
        const dx = nextPoint.x - currentPoint.x;
        const dy = nextPoint.y - currentPoint.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance === 0) {
            this.pathIndex++;
            return;
        }
        
        this.pathProgress += speed / distance;
        
        if (this.pathProgress >= 1) {
            this.pathProgress = 0;
            this.pathIndex++;
            if (this.pathIndex < this.currentPath.length) {
                this.x = this.currentPath[this.pathIndex].x;
                this.y = this.currentPath[this.pathIndex].y;
            }
        } else {
            this.x = currentPoint.x + dx * this.pathProgress;
            this.y = currentPoint.y + dy * this.pathProgress;
        }
        
        // 位置の安全性チェック
        const mapWidth = 11 * 64;
        const mapHeight = 8 * 64;
        if (this.x < 0 || this.x > mapWidth || this.y < 0 || this.y > mapHeight) {
            console.warn(`⚠️ 敵が異常な位置に移動: (${this.x}, ${this.y}) - 修正します`);
            // 前の有効な位置に戻す
            if (this.pathIndex > 0 && this.currentPath[this.pathIndex - 1]) {
                this.x = this.currentPath[this.pathIndex - 1].x;
                this.y = this.currentPath[this.pathIndex - 1].y;
                console.log(`🔄 前の有効位置に復帰: (${this.x}, ${this.y})`);
            } else {
                // パスの最初の位置に戻す
                if (this.currentPath && this.currentPath.length > 0) {
                    this.x = this.currentPath[0].x;
                    this.y = this.currentPath[0].y;
                    console.log(`🔄 パス開始位置に復帰: (${this.x}, ${this.y})`);
                }
            }
        }
    }
    
    setPath(path) {
        this.currentPath = path;
        this.pathIndex = 0;
        this.pathProgress = 0;
        this.hasReachedGoalFlag = false; // ゴール到達フラグをリセット
        
        // 初期位置は既にWaveManagerのspawnEnemyで設定済みのため、ここでは変更しない
        console.log(`🎯 敵${this.id}のパス設定完了: 現在位置(${this.x}, ${this.y}) → ${path.length}ポイント`);
    }

    // 空中ユニット用の自由パス設定
    setFreePath(mapNumber) {
        this.mapNumber = mapNumber;
        this.hasReachedGoalFlag = false; // ゴール到達フラグをリセット
        
        // 初期位置が(0,0)の場合はスタート地点を取得
        if (this.x === 0 && this.y === 0 && this.gridSystem) {
            const startPanels = this.gridSystem.findAllPanelsByType(PANEL_TYPES.START);
            if (startPanels.length > 0) {
                // ランダムにスタート地点を選択
                const randomIndex = Math.floor(Math.random() * startPanels.length);
                const selectedStart = startPanels[randomIndex];
                const startPos = selectedStart.getPixelPosition();
                this.x = startPos.x;
                this.y = startPos.y;
                console.log(`✈️ 空中敵${this.id}の初期位置をスタート地点に設定: (${this.x}, ${this.y})`);
            }
        }
        
        console.log(`✈️ 空中敵${this.id}の初期位置確認: (${this.x}, ${this.y})`);
        
        // ゴール位置を取得
        const goalPosition = this.getGoalPosition();
        
        // 直線パスを生成
        this.currentPath = this.generateDirectPath(goalPosition.x, goalPosition.y);
        this.pathIndex = 0;
        this.pathProgress = 0;
        
        console.log(`✈️ 空中敵${this.id}の自由パス設定: スタート(${this.x}, ${this.y}) → ゴール(${goalPosition.x}, ${goalPosition.y})`);
    }

    takeDamage(damage) { 
        this.hp -= damage; 
        if (this.hp < 0) this.hp = 0; 
    } 

    isAlive() { 
        return this.hp > 0; 
    } 

    applySlow(effect, duration) { 
        this.slowEffect = effect; 
        this.slowEndTime = Date.now() + duration; 
    }

    // 敵の更新処理
    update(deltaTime) {
        this.move();
        
        // 移動後にゴール到達チェック（安全装置）
        if (this.hasReachedGoal()) {
            // ゴール位置に強制移動
            const target = this.getGoalPosition();
            this.x = target.x;
            this.y = target.y;
        }
    }

    // ゴールに到達したかチェック（改善版）
    hasReachedGoal() {
        // 既にゴール到達処理済みの場合は重複処理を防ぐ
        if (this.hasReachedGoalFlag) {
            return false;
        }
        
        const target = this.getGoalPosition();
        
        // 座標の安全性チェック
        if (isNaN(this.x) || isNaN(this.y) || isNaN(target.x) || isNaN(target.y)) {
            console.warn(`⚠️ 無効な座標でゴール判定: 敵${this.id}(${this.x}, ${this.y}) ゴール(${target.x}, ${target.y})`);
            return false;
        }
        
        const distance = Math.sqrt(
            Math.pow(this.x - target.x, 2) + 
            Math.pow(this.y - target.y, 2)
        );
        
        // より緩い距離判定でゴール到達を確実に検出
        if (distance <= 20) { // 12から20に変更してより確実に
            console.log(`🎯 敵${this.id}がゴール到達: 距離=${distance.toFixed(2)}`);
            this.hasReachedGoalFlag = true; // フラグを設定して重複処理を防ぐ
            return true;
        }
        
        // パスの最後に到達している場合もゴール到達とみなす
        if (this.currentPath && this.pathIndex >= this.currentPath.length - 1) {
            console.log(`🎯 敵${this.id}がパス終端到達: パスインデックス=${this.pathIndex}/${this.currentPath.length}`);
            this.hasReachedGoalFlag = true;
            return true;
        }
        
        // 安全装置: 敵が画面外に出た場合もゴール到達とみなす
        const mapWidth = 11 * 64; // 704px
        const mapHeight = 8 * 64;  // 512px
        if (this.x < -50 || this.x > mapWidth + 50 || this.y < -50 || this.y > mapHeight + 50) {
            console.log(`🎯 敵${this.id}が画面外到達: 位置(${this.x}, ${this.y})`);
            this.hasReachedGoalFlag = true; // フラグを設定して重複処理を防ぐ
            return true;
        }
        
        return false;
    }
    
    render(ctx) {
        // 敵の本体
        ctx.fillStyle = this.color;
        const halfSize = this.size / 2;
        ctx.fillRect(this.x - halfSize, this.y - halfSize, this.size, this.size);
        
        // HPバー
        const hpBarWidth = this.size;
        const hpWidth = hpBarWidth * (this.hp / this.maxHp);
        ctx.fillStyle = "#27ae60";
        ctx.fillRect(this.x - halfSize, this.y - halfSize - 8, hpWidth, 4);
        ctx.fillStyle = "#e74c3c";
        ctx.fillRect(this.x - halfSize + hpWidth, this.y - halfSize - 8, hpBarWidth - hpWidth, 4);
        
        // 敵のアイコン
        ctx.fillStyle = "white";
        ctx.font = `${Math.floor(this.size * 0.6)}px Arial`;
        ctx.textAlign = "center";
        ctx.fillText(this.icon, this.x, this.y + this.size * 0.2);
        
        // 減速エフェクト
        if (Date.now() < this.slowEndTime) {
            ctx.strokeStyle = "rgba(52, 152, 219, 0.8)";
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size * 0.7, 0, Math.PI * 2);
            ctx.stroke();
        }
        
        // 空中ユニットの影
        if (this.isFlying) {
            ctx.fillStyle = "rgba(0, 0, 0, 0.3)";
            ctx.beginPath();
            ctx.ellipse(this.x, this.y + halfSize + 5, halfSize * 0.8, halfSize * 0.4, 0, 0, Math.PI * 2);
            ctx.fill();
        }
    }
} 

// ゴブリン（基本的な敵）
class Goblin extends Enemy { 
    constructor() { 
        super(); 
        this.hp = 40; 
        this.maxHp = 40; 
        this.speed = 1.2; 
        this.reward = 8; 
        this.isFlying = false;
        this.type = "goblin";
        this.size = 18;
        this.color = "#27ae60";
        this.icon = "👺";
    } 
} 

// オーク（中程度の敵）
class Orc extends Enemy { 
    constructor() { 
        super(); 
        this.hp = 80; 
        this.maxHp = 80; 
        this.speed = 0.8; 
        this.reward = 15; 
        this.isFlying = false;
        this.type = "orc";
        this.size = 24;
        this.color = "#8e44ad";
        this.icon = "👹";
    } 
} 

// 装甲ゴブリン（防御力が高い）
class ArmoredGoblin extends Enemy { 
    constructor() { 
        super(); 
        this.hp = 120; 
        this.maxHp = 120; 
        this.speed = 0.9; // 0.6から0.9に変更（ウォーリア1人で5匹程度倒せるように調整）
        this.reward = 20; 
        this.isFlying = false;
        this.type = "armored_goblin";
        this.size = 22;
        this.color = "#34495e";
        this.icon = "🛡️";
    } 
} 

// オーク族長（強力なボス級）
class OrcChief extends Enemy { 
    constructor() { 
        super(); 
        this.hp = 200; 
        this.maxHp = 200; 
        this.speed = 0.5; 
        this.reward = 35; 
        this.isFlying = false;
        this.type = "orc_chief";
        this.size = 30;
        this.color = "#c0392b";
        this.icon = "👑";
    } 
} 

// 飛行コウモリ（空中ユニット）
class FlyingBat extends Enemy { 
    constructor() { 
        super(); 
        this.hp = 30; 
        this.maxHp = 30; 
        this.speed = 1.8; 
        this.reward = 12; 
        this.isFlying = true;
        this.type = "flying_bat";
        this.size = 16;
        this.color = "#9b59b6";
        this.icon = "🦇";
        this.altitude = 0; // 浮遊高度
        this.bobPhase = Math.random() * Math.PI * 2; // 浮遊アニメーション用
    }
    
    move() {
        // 基本移動
        super.move();
        
        // 浮遊アニメーション
        this.bobPhase += 0.1;
        this.altitude = Math.sin(this.bobPhase) * 3;
    }
    
    render(ctx) {
        // 影を先に描画
        ctx.fillStyle = "rgba(0, 0, 0, 0.3)";
        ctx.beginPath();
        ctx.ellipse(this.x, this.y + 20, this.size * 0.6, this.size * 0.3, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // 本体を少し上に浮かせて描画
        const originalY = this.y;
        this.y -= 8 + this.altitude; // 浮遊効果
        
        // 敵の本体
        ctx.fillStyle = this.color;
        const halfSize = this.size / 2;
        ctx.fillRect(this.x - halfSize, this.y - halfSize, this.size, this.size);
        
        // HPバー
        const hpBarWidth = this.size;
        const hpWidth = hpBarWidth * (this.hp / this.maxHp);
        ctx.fillStyle = "#27ae60";
        ctx.fillRect(this.x - halfSize, this.y - halfSize - 8, hpWidth, 4);
        ctx.fillStyle = "#e74c3c";
        ctx.fillRect(this.x - halfSize + hpWidth, this.y - halfSize - 8, hpBarWidth - hpWidth, 4);
        
        // 敵のアイコン
        ctx.fillStyle = "white";
        ctx.font = `${Math.floor(this.size * 0.6)}px Arial`;
        ctx.textAlign = "center";
        ctx.fillText(this.icon, this.x, this.y + this.size * 0.2);
        
        // 減速エフェクト
        if (Date.now() < this.slowEndTime) {
            ctx.strokeStyle = "rgba(52, 152, 219, 0.8)";
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.size * 0.7, 0, Math.PI * 2);
            ctx.stroke();
        }
        
        // 飛行エフェクト（羽ばたき）
        const wingPhase = Date.now() * 0.02;
        ctx.strokeStyle = "rgba(155, 89, 182, 0.5)";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.ellipse(this.x - halfSize, this.y, halfSize * 0.8, halfSize * 0.3 * Math.abs(Math.sin(wingPhase)), 0, 0, Math.PI * 2);
        ctx.stroke();
        ctx.beginPath();
        ctx.ellipse(this.x + halfSize, this.y, halfSize * 0.8, halfSize * 0.3 * Math.abs(Math.sin(wingPhase)), 0, 0, Math.PI * 2);
        ctx.stroke();
        
        // Y座標を元に戻す
        this.y = originalY;
    }
} 

// ドラゴン（最強のボス）
class Dragon extends Enemy { 
    constructor() { 
        super(); 
        this.hp = 800; 
        this.maxHp = 800; 
        this.speed = 0.3; 
        this.reward = 100; 
        this.isFlying = false;
        this.type = "dragon";
        this.size = 40;
        this.color = "#8b0000";
        this.icon = "🐉";
    }
    
    render(ctx) {
        // ドラゴンは特別なエフェクト付き
        super.render(ctx);
        
        // 炎のオーラエフェクト
        const time = Date.now() * 0.005;
        ctx.save();
        ctx.globalAlpha = 0.3 + Math.sin(time) * 0.2;
        ctx.strokeStyle = "#ff4500";
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size * 0.8 + Math.sin(time * 2) * 5, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
    }
} 

// 基本敵（後方互換性のため）
class BasicEnemy extends Goblin { 
    constructor() { 
        super();
        this.type = "basic";
    } 
} 

class FastEnemy extends Enemy { 
    constructor() { 
        super(); 
        this.hp = 30; 
        this.maxHp = 30; 
        this.speed = 2; 
        this.reward = 15; 
        this.isFlying = false;
        this.type = "fast";
        this.size = 16;
        this.color = "#f39c12";
        this.icon = "💨";
    } 
} 

class TankEnemy extends Enemy { 
    constructor() { 
        super(); 
        this.hp = 150; 
        this.maxHp = 150; 
        this.speed = 0.5; 
        this.reward = 30; 
        this.isFlying = false;
        this.type = "tank";
        this.size = 28;
        this.color = "#2c3e50";
        this.icon = "🛡️";
    } 
}

// 敵ファクトリークラス
class EnemyFactory {
    static create(type) {
        // データアダプターが利用可能な場合はそれを使用
        if (window.gameDataAdapter && window.gameDataAdapter.isDataReady()) {
            try {
                const enemy = window.gameDataAdapter.createEnemyWithData(type);
                if (enemy) {
                    console.log(`🗄️ データベースから敵作成: ${type}`);
                    return enemy;
                }
            } catch (error) {
                console.error(`❌ データベース敵作成エラー: ${type}`, error);
            }
        }
        
        // フォールバック: 既存の固定クラス
        console.log(`🗄️ フォールバック敵作成: ${type}`);
        switch (type) {
            case "goblin":
                return new Goblin();
            case "orc":
                return new Orc();
            case "armored_goblin":
                return new ArmoredGoblin();
            case "orc_chief":
                return new OrcChief();
            case "flying_bat":
                return new FlyingBat();
            case "dragon":
                return new Dragon();
            case "basic":
                return new BasicEnemy();
            case "fast":
                return new FastEnemy();
            case "tank":
                return new TankEnemy();
            default:
                return new Goblin();
        }
    }
    
    static getEnemyInfo(type) {
        // データアダプターが利用可能な場合はそれを使用
        if (window.gameDataAdapter && window.gameDataAdapter.isDataReady()) {
            try {
                const enemyInfo = window.gameDataAdapter.getEnemyInfo(type);
                if (enemyInfo) {
                    console.log(`🗄️ データベースから敵情報取得: ${type}`);
                    return enemyInfo;
                }
            } catch (error) {
                console.error(`❌ データベース敵情報取得エラー: ${type}`, error);
            }
        }
        
        // フォールバック: 既存の固定データ
        console.log(`🗄️ フォールバック敵情報取得: ${type}`);
        const enemy = this.create(type);
        return {
            name: this.getEnemyName(type),
            hp: enemy.maxHp,
            speed: enemy.speed,
            reward: enemy.reward,
            isFlying: enemy.isFlying,
            icon: enemy.icon,
            color: enemy.color
        };
    }
    
    static getEnemyName(type) {
        // データアダプターが利用可能な場合はそれを使用
        if (window.gameDataAdapter && window.gameDataAdapter.isDataReady()) {
            try {
                const enemyName = window.gameDataAdapter.getEnemyName(type);
                if (enemyName && enemyName !== "不明") {
                    return enemyName;
                }
            } catch (error) {
                console.error(`❌ データベース敵名前取得エラー: ${type}`, error);
            }
        }
        
        // フォールバック: 既存の固定データ
        const names = {
            "goblin": "ゴブリン",
            "orc": "オーク",
            "armored_goblin": "装甲ゴブリン",
            "orc_chief": "オーク族長",
            "flying_bat": "飛行コウモリ",
            "dragon": "ドラゴン",
            "basic": "基本敵",
            "fast": "高速敵",
            "tank": "重装敵"
        };
        return names[type] || "不明";
    }
}
