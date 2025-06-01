// グリッドベースマップシステム
class GridMapManager {
    constructor() {
        this.currentMap = 1;
        this.currentWave = 1;
        this.totalMaps = 3;
        this.wavesPerMap = 3;
        this.maps = this.initializeMaps();
        this.waveInterval = 4000; // Wave間の間隔（4秒）
        this.totalGoldEarned = 0;
        
        // データアダプターとの統合
        this.dataAdapter = null;
        this.dataSystemReady = false;
        
        // データアダプターの初期化を試行
        this.initializeDataIntegration();
    }

    // データアダプターとの統合初期化
    initializeDataIntegration() {
        try {
            if (window.gameDataAdapter && window.gameDataAdapter.isDataReady()) {
                this.dataAdapter = window.gameDataAdapter;
                this.dataSystemReady = true;
                console.log("🗄️ GridMapManager: データアダプター統合完了");
                
                // データベースからマップデータを再読み込み
                this.maps = this.initializeMaps();
            } else {
                console.log("🗄️ GridMapManager: データアダプター未準備 - フォールバックモードで継続");
                
                // データアダプターが後で利用可能になった場合の再試行
                setTimeout(() => {
                    if (!this.dataSystemReady && window.gameDataAdapter && window.gameDataAdapter.isDataReady()) {
                        this.initializeDataIntegration();
                    }
                }, 1000);
            }
        } catch (error) {
            console.error("❌ GridMapManager: データ統合エラー:", error);
            this.dataSystemReady = false;
        }
    }

    initializeMaps() {
        // データアダプターが利用可能な場合はそれを使用
        if (this.dataSystemReady && this.dataAdapter) {
            try {
                console.log("🗄️ データベースからマップデータを読み込み中...");
                const databaseMaps = this.dataAdapter.initializeMaps();
                
                if (databaseMaps && Object.keys(databaseMaps).length > 0) {
                    console.log("✅ データベースからマップデータ読み込み完了");
                    
                    // マップ設定を更新
                    this.totalMaps = Object.keys(databaseMaps).length;
                    
                    return databaseMaps;
                } else {
                    console.warn("⚠️ データベースマップデータが空 - フォールバックデータを使用");
                }
            } catch (error) {
                console.error("❌ データベースマップ読み込みエラー:", error);
            }
        }
        
        // フォールバック: 既存の固定データ
        console.log("🗄️ フォールバックマップデータを使用");
        return {
            1: {
                name: "森の小道",
                description: "シンプルな直線ルート。基本的な戦術を学ぶのに最適。",
                background: "#2d5016",
                pathColor: "#8b4513",
                difficulty: "初級",
                icon: "🌲",
                gridData: [
                    ['.', '.', '.', 'R', '.', '.', 'W', '.', '.', '.', '.'],
                    ['.', 'W', '.', '.', '.', 'R', '.', '.', 'W', '.', '.'],
                    ['.', '.', 'R', '.', 'W', '.', '.', 'R', '.', '.', '.'],
                    ['S', '-', '-', '-', '-', '-', '-', '-', '-', '-', 'G'],
                    ['.', '.', 'R', '.', 'W', '.', '.', 'R', '.', '.', '.'],
                    ['.', 'W', '.', '.', '.', 'R', '.', '.', 'W', '.', '.'],
                    ['.', '.', '.', 'R', '.', '.', 'W', '.', '.', '.', '.'],
                    ['.', '.', '.', '.', '.', '.', '.', '.', '.', '.', '.']
                ],
                waves: {
                    1: {
                        enemies: [
                            { type: "goblin", count: 8, interval: 1000, delay: 0 }
                        ],
                        reward: 50,
                        description: "ゴブリンの群れが森から現れた！"
                    },
                    2: {
                        enemies: [
                            { type: "goblin", count: 5, interval: 800, delay: 0 },
                            { type: "orc", count: 3, interval: 1500, delay: 4000 }
                        ],
                        reward: 80,
                        description: "ゴブリンとオークの混成部隊が攻撃してくる！"
                    },
                    3: {
                        enemies: [
                            { type: "goblin", count: 10, interval: 600, delay: 0 },
                            { type: "flying_bat", count: 4, interval: 2000, delay: 6000 }
                        ],
                        reward: 120,
                        description: "空からコウモリが襲来！アーチャーが必要だ！"
                    }
                }
            },
            2: {
                name: "曲がりくねった峡谷",
                description: "S字カーブの複雑なルート。敵の移動時間を活用せよ。",
                background: "#4a4a4a",
                pathColor: "#654321",
                difficulty: "中級",
                icon: "⛰️",
                gridData: [
                    ['.', '.', '.', 'R', '.', 'W', '.', '.', '.', '.', 'S'],
                    ['.', 'R', '.', '.', 'W', '.', '.', '.', '.', '-', '.'],
                    ['.', '.', 'W', '.', '.', 'R', '.', '.', '-', '.', '.'],
                    ['.', 'W', '.', '.', '.', '.', '.', '-', '.', 'R', '.'],
                    ['.', '.', 'R', 'W', '.', '.', '-', '.', '.', '.', '.'],
                    ['.', '.', '.', '.', 'R', '-', '.', 'W', '.', '.', '.'],
                    ['.', 'R', '.', '.', '-', '.', '.', '.', 'W', '.', '.'],
                    ['G', '-', '-', '-', '.', '.', '.', '.', '.', '.', '.']
                ],
                waves: {
                    1: {
                        enemies: [
                            { type: "orc", count: 6, interval: 1200, delay: 0 }
                        ],
                        reward: 90,
                        description: "オークの戦士団が峡谷を進軍中！"
                    },
                    2: {
                        enemies: [
                            { type: "orc", count: 4, interval: 1000, delay: 0 },
                            { type: "armored_goblin", count: 8, interval: 800, delay: 4000 }
                        ],
                        reward: 150,
                        description: "装甲を身に着けたゴブリンが現れた！"
                    },
                    3: {
                        enemies: [
                            { type: "orc_chief", count: 2, interval: 3000, delay: 0 },
                            { type: "flying_bat", count: 6, interval: 1000, delay: 6000 }
                        ],
                        reward: 200,
                        description: "オーク族長率いる精鋭部隊の襲撃！"
                    }
                }
            },
            3: {
                name: "分岐する遺跡",
                description: "分岐ルートで敵が分散。複数方向への対策が必要。",
                background: "#2c1810",
                pathColor: "#8b7355",
                difficulty: "上級",
                icon: "🏛️",
                gridData: [
                    ['S', '-', '-', '-', '-', '-', '|', '.', '.', '.', '.'],
                    ['.', '.', '.', 'R', '.', 'W', '|', '.', '.', '.', '.'],
                    ['.', 'R', '.', '.', 'W', '.', '|', 'R', '.', '.', '.'],
                    ['.', '.', 'W', '.', '.', 'R', '|', '.', '.', '.', '.'],
                    ['.', 'R', '.', '.', 'W', '.', '-', '-', '-', '-', 'G'],
                    ['.', '.', 'W', '.', '.', 'R', '|', '.', '.', '.', '.'],
                    ['.', 'R', '.', '.', 'W', '.', '|', 'R', '.', '.', '.'],
                    ['S', '-', '-', '-', '-', '-', '|', '.', '.', '.', '.']
                ],
                waves: {
                    1: {
                        enemies: [
                            { type: "armored_goblin", count: 8, interval: 1000, delay: 0 }
                        ],
                        reward: 160,
                        description: "重装甲ゴブリンが遺跡に侵入！"
                    },
                    2: {
                        enemies: [
                            { type: "armored_goblin", count: 6, interval: 800, delay: 0 },
                            { type: "orc_chief", count: 2, interval: 2000, delay: 5000 }
                        ],
                        reward: 220,
                        description: "装甲部隊と族長の混成攻撃！"
                    },
                    3: {
                        enemies: [
                            { type: "armored_goblin", count: 10, interval: 600, delay: 0 },
                            { type: "orc_chief", count: 3, interval: 1800, delay: 6000 },
                            { type: "flying_bat", count: 6, interval: 1200, delay: 12000 }
                        ],
                        reward: 350,
                        description: "総力戦！全軍による遺跡制圧作戦！"
                    }
                }
            }
        };
    }

    getCurrentMapData() {
        return this.maps[this.currentMap];
    }

    getCurrentWaveData() {
        const mapData = this.getCurrentMapData();
        return mapData.waves[this.currentWave];
    }

    getMapGridData() {
        const mapData = this.getCurrentMapData();
        return mapData.gridData;
    }

    nextWave() {
        if (this.currentWave < this.wavesPerMap) {
            this.currentWave++;
            return { type: 'nextWave', mapComplete: false };
        } else if (this.currentMap < this.totalMaps) {
            this.currentMap++;
            this.currentWave = 1;
            return { type: 'nextMap', mapComplete: true };
        }
        return { type: 'gameComplete', mapComplete: true };
    }

    setMap(mapNumber) {
        if (mapNumber >= 1 && mapNumber <= this.totalMaps) {
            this.currentMap = mapNumber;
            this.currentWave = 1;
            this.totalGoldEarned = 0;
            return true;
        }
        return false;
    }

    getProgress() {
        const totalWaves = this.totalMaps * this.wavesPerMap;
        const completedWaves = (this.currentMap - 1) * this.wavesPerMap + (this.currentWave - 1);
        return {
            current: completedWaves,
            total: totalWaves,
            percentage: (completedWaves / totalWaves) * 100
        };
    }

    isGameComplete() {
        return this.currentMap > this.totalMaps;
    }

    reset() {
        this.currentMap = 1;
        this.currentWave = 1;
        this.totalGoldEarned = 0;
    }

    addGoldEarned(amount) {
        this.totalGoldEarned += amount;
    }
}

// グリッドベースWave管理クラス
class GridWaveManager {
    constructor() {
        this.mapManager = new GridMapManager();
        this.gridSystem = null; // Gameクラスから設定される
        this.enemies = [];
        this.spawnQueue = [];
        this.isActive = false;
        this.isPaused = false;
        this.lastSpawnTime = 0;
        this.waveStartTime = 0;
        this.currentSpawnIndex = 0;
        this.waveCompleteCallback = null;
        this.enemyReachedCallback = null;
        this.enemyDefeatedCallback = null;
        this.pathCache = null;
    }

    setGridSystem(gridSystem) {
        this.gridSystem = gridSystem;
        this.pathCache = null; // パスキャッシュをクリア
    }

    startWave() {
        if (this.isActive) {
            console.warn("⚠️ Wave開始失敗: 既にWaveが実行中です");
            return false;
        }
        
        const waveData = this.mapManager.getCurrentWaveData();
        if (!waveData) {
            console.error("❌ Wave開始失敗: Waveデータが見つかりません");
            return false;
        }

        console.log(`🎯 Wave開始: マップ${this.mapManager.currentMap} Wave${this.mapManager.currentWave}`);
        console.log(`📝 Wave情報:`, waveData);

        this.isActive = true;
        this.isPaused = false;
        this.waveStartTime = Date.now();
        this.currentSpawnIndex = 0;
        this.spawnQueue = this.createSpawnQueue(waveData.enemies);
        this.lastSpawnTime = Date.now();
        
        console.log(`✅ Wave開始成功: ${this.spawnQueue.length}体の敵を準備完了`);
        return true;
    }

    createSpawnQueue(enemyGroups) {
        const queue = [];
        
        enemyGroups.forEach(group => {
            for (let i = 0; i < group.count; i++) {
                queue.push({
                    type: group.type,
                    spawnTime: group.delay + (i * group.interval)
                });
            }
        });
        
        // スポーン時間でソート
        queue.sort((a, b) => a.spawnTime - b.spawnTime);
        return queue;
    }

    update(deltaTime) {
        if (!this.isActive || this.isPaused) return;

        const currentTime = Date.now();
        
        // 敵のスポーン処理
        this.processSpawnQueue(currentTime);
        
        // 敵の更新処理（逆順でループして安全に削除）
        for (let i = this.enemies.length - 1; i >= 0; i--) {
            const enemy = this.enemies[i];
            
            try {
                // 敵の更新
                if (enemy && typeof enemy.update === 'function') {
                    enemy.update(deltaTime);
                }
                
                // 敵がゴールに到達したかチェック（より確実な判定）
                if (enemy && typeof enemy.hasReachedGoal === 'function' && enemy.hasReachedGoal()) {
                    console.log(`🎯 敵${enemy.id || i}がゴール到達 - 処理開始`);
                    
                    // ゴール到達コールバック呼び出し（重複処理防止フラグは敵側で管理）
                    if (this.enemyReachedCallback) {
                        console.log(`📞 敵到達コールバック呼び出し: ${enemy.type}`);
                        try {
                            this.enemyReachedCallback(enemy);
                        } catch (callbackError) {
                            console.error(`❌ 敵到達コールバックエラー:`, callbackError);
                        }
                    }
                    
                    // 敵をWaveManagerから即座に削除
                    console.log(`🗑️ WaveManagerから敵削除: インデックス ${i}`);
                    this.enemies.splice(i, 1);
                    continue; // 削除後は次のループへ
                }
                
                // 敵が撃破されたかチェック
                if (enemy && enemy.hp <= 0) {
                    console.log(`💀 敵撃破: ${enemy.type} (ID: ${enemy.id || i})`);
                    
                    // 撃破コールバック呼び出し
                    if (this.enemyDefeatedCallback) {
                        try {
                            this.enemyDefeatedCallback(enemy);
                        } catch (callbackError) {
                            console.error(`❌ 敵撃破コールバックエラー:`, callbackError);
                        }
                    }
                    
                    // 敵をWaveManagerから即座に削除
                    console.log(`🗑️ WaveManagerから撃破敵削除: インデックス ${i}`);
                    this.enemies.splice(i, 1);
                    continue; // 削除後は次のループへ
                }
            } catch (error) {
                console.error(`❌ 敵更新エラー (インデックス ${i}, ID: ${enemy?.id || 'unknown'}):`, error);
                // エラーが発生した敵も削除
                this.enemies.splice(i, 1);
            }
        }
        
        // Wave完了チェック（即座に判定）
        const allEnemiesSpawned = this.currentSpawnIndex >= this.spawnQueue.length;
        const noEnemiesRemaining = this.enemies.length === 0;
        
        // デバッグ情報（Wave完了判定時のみ）
        if (allEnemiesSpawned && this.enemies.length <= 3) {
            console.log(`🔍 Wave完了判定: スポーン完了=${allEnemiesSpawned}, 残り敵=${this.enemies.length}体`);
        }
        
        // Wave完了判定を即座に実行（遅延なし）
        if (allEnemiesSpawned && noEnemiesRemaining && this.isActive) {
            console.log(`🎯 Wave完了条件満たしました - Wave完了処理を即座に実行`);
            this.completeWave();
        }
    }

    processSpawnQueue(currentTime) {
        const waveElapsed = currentTime - this.waveStartTime;

        // 敵のスポーン処理
        while (this.currentSpawnIndex < this.spawnQueue.length) {
            const nextSpawn = this.spawnQueue[this.currentSpawnIndex];
            
            if (waveElapsed >= nextSpawn.spawnTime) {
                this.spawnEnemy(nextSpawn.type);
                this.currentSpawnIndex++;
            } else {
                break;
            }
        }
    }

    spawnEnemy(type) {
        try {
            const enemy = EnemyFactory.create(type);
            
            // 敵オブジェクトの安全性チェック
            if (!enemy || typeof enemy.update !== 'function') {
                console.error(`❌ 無効な敵オブジェクトが作成されました: ${type}`);
                return;
            }
            
            // マップ番号を設定（初期位置設定より先に実行）
            if (typeof enemy.setMapNumber === 'function') {
                enemy.setMapNumber(this.mapManager.currentMap);
            }
            
            // グリッドシステムの参照を設定
            if (this.gridSystem && typeof enemy.setGridSystem === 'function') {
                enemy.setGridSystem(this.gridSystem);
            }
            
            if (this.gridSystem) {
                if (enemy.isFlying) {
                    // 空中ユニット：初期位置をスタート地点に設定してから自由パスを使用
                    console.log(`✈️ 空中敵スポーン処理開始: ${type}`);
                    
                    const startPanels = this.gridSystem.findAllPanelsByType(PANEL_TYPES.START);
                    if (startPanels.length > 0) {
                        // ランダムにスタート地点を選択
                        const randomIndex = Math.floor(Math.random() * startPanels.length);
                        const selectedStart = startPanels[randomIndex];
                        const startPos = selectedStart.getPixelPosition();
                        enemy.x = startPos.x;
                        enemy.y = startPos.y;
                        console.log(`✈️ 空中敵初期位置設定: (${startPos.x}, ${startPos.y})`);
                    }
                    
                    if (typeof enemy.setFreePath === 'function') {
                        enemy.setFreePath(this.mapManager.currentMap);
                    }
                } else {
                    // 地上ユニット：複数のスタート地点に対応
                    console.log(`🏃 地上敵スポーン処理開始: ${type}`);
                    
                    // GridSystemのメソッド存在確認
                    if (typeof this.gridSystem.findAllPanelsByType !== 'function') {
                        console.error(`❌ GridSystem.findAllPanelsByTypeメソッドが存在しません`);
                        console.log(`🔍 GridSystemの利用可能メソッド:`, Object.getOwnPropertyNames(this.gridSystem));
                        return;
                    }
                    
                    const startPanels = this.gridSystem.findAllPanelsByType(PANEL_TYPES.START);
                    console.log(`📍 検出されたスタート地点: ${startPanels.length}個`);
                    
                    // 各スタート地点の詳細情報を出力
                    startPanels.forEach((panel, index) => {
                        console.log(`  スタート${index + 1}: (${panel.gridX}, ${panel.gridY}) タイプ: ${panel.type}`);
                    });
                    
                    if (startPanels.length > 0) {
                        // ランダムにスタート地点を選択
                        const randomIndex = Math.floor(Math.random() * startPanels.length);
                        const selectedStart = startPanels[randomIndex];
                        console.log(`🎯 選択されたスタート地点: インデックス${randomIndex} → (${selectedStart.gridX}, ${selectedStart.gridY})`);
                        
                        // GridSystemのメソッド存在確認
                        if (typeof this.gridSystem.generatePathFromStart !== 'function') {
                            console.error(`❌ GridSystem.generatePathFromStartメソッドが存在しません`);
                            return;
                        }
                        
                        const path = this.gridSystem.generatePathFromStart(selectedStart);
                        
                        if (path && path.length > 0) {
                            if (typeof enemy.setPath === 'function') {
                                // 敵の初期位置を選択されたスタート地点に設定
                                const startPos = selectedStart.getPixelPosition();
                                enemy.x = startPos.x;
                                enemy.y = startPos.y;
                                enemy.setPath(path);
                                console.log(`✅ 敵パス設定完了: スタート(${startPos.x}, ${startPos.y}) → ${path.length}ポイント`);
                            }
                        } else {
                            console.error(`❌ ${type} のパスが見つかりませんでした`);
                            console.log(`🔍 選択されたスタート地点: (${selectedStart.gridX}, ${selectedStart.gridY})`);
                            console.log(`🔍 利用可能なゴール地点:`, this.gridSystem.findAllPanelsByType(PANEL_TYPES.GOAL));
                            return;
                        }
                    } else {
                        console.error(`❌ スタート地点が見つかりません: ${type}`);
                        console.log(`🔍 現在のマップ番号: ${this.mapManager.currentMap}`);
                        console.log(`🔍 GridSystemの状態:`, this.gridSystem);
                        return;
                    }
                }
            } else {
                console.error(`❌ グリッドシステムが利用できません: ${type}`);
                return;
            }
            
            this.enemies.push(enemy);
            console.log(`✅ 敵スポーン成功: ${type} (ID: ${enemy.id}) 位置: (${enemy.x}, ${enemy.y})`);
            
        } catch (error) {
            console.error(`❌ 敵スポーンエラー: ${type}`, error);
        }
    }

    getPath() {
        if (!this.gridSystem) return [];
        
        // パスをキャッシュして再利用
        if (!this.pathCache) {
            this.pathCache = this.gridSystem.generatePath();
        }
        
        return this.pathCache;
    }

    completeWave() {
        if (!this.isActive) {
            console.warn("⚠️ Wave完了処理: 既にWaveが非アクティブです");
            return;
        }
        
        console.log(`✅ Wave完了: マップ${this.mapManager.currentMap} Wave${this.mapManager.currentWave}`);
        
        // 現在のWaveデータを取得（状態更新前に）
        const waveData = this.mapManager.getCurrentWaveData();
        
        // 次のWave情報を取得（状態更新前に）
        const nextWaveInfo = this.mapManager.nextWave();
        
        // Wave状態を確実にリセット
        this.isActive = false;
        this.isPaused = false;
        this.currentSpawnIndex = 0;
        this.spawnQueue = [];
        
        if (this.waveCompleteCallback) {
            this.waveCompleteCallback({
                reward: waveData.reward,
                nextWave: nextWaveInfo
            });
        }
        
        console.log(`🎯 Wave完了処理完了: isActive=${this.isActive}, 次の状態=${nextWaveInfo.type}`);
    }

    // 互換性のためのメソッド
    getWave(waveNumber) {
        return this.mapManager.getCurrentWaveData();
    }

    getCurrentMapInfo() {
        return this.mapManager.getCurrentMapData();
    }

    getCurrentWaveInfo() {
        return this.mapManager.getCurrentWaveData();
    }

    getProgress() {
        return this.mapManager.getProgress();
    }

    setMap(mapNumber) {
        this.reset();
        this.pathCache = null; // パスキャッシュをクリア
        return this.mapManager.setMap(mapNumber);
    }

    pauseWave() {
        this.isPaused = true;
    }

    resumeWave() {
        this.isPaused = false;
    }

    reset() {
        this.isActive = false;
        this.isPaused = false;
        this.enemies = [];
        this.spawnQueue = [];
        this.currentSpawnIndex = 0;
        this.pathCache = null;
    }

    // 敵管理メソッド
    addEnemy(enemy) {
        this.enemies.push(enemy);
    }

    removeEnemy(enemyOrIndex) {
        // 敵オブジェクトが渡された場合はインデックスを検索
        if (typeof enemyOrIndex === 'object' && enemyOrIndex !== null) {
            const index = this.enemies.indexOf(enemyOrIndex);
            if (index !== -1) {
                console.log(`🗑️ WaveManager: 敵オブジェクトを削除 (インデックス ${index})`);
                this.enemies.splice(index, 1);
                return true;
            } else {
                console.warn(`⚠️ WaveManager: 敵オブジェクトが見つかりません`);
                return false;
            }
        }
        // インデックスが渡された場合
        else if (typeof enemyOrIndex === 'number') {
            if (enemyOrIndex >= 0 && enemyOrIndex < this.enemies.length) {
                console.log(`🗑️ WaveManager: 敵をインデックスで削除 (${enemyOrIndex})`);
                this.enemies.splice(enemyOrIndex, 1);
                return true;
            } else {
                console.warn(`⚠️ WaveManager: 無効なインデックス ${enemyOrIndex}`);
                return false;
            }
        }
        
        console.warn(`⚠️ WaveManager: 無効な引数タイプ`, typeof enemyOrIndex);
        return false;
    }

    getEnemies() {
        // 有効な敵オブジェクトのみを返す
        return this.enemies.filter(enemy => 
            enemy && 
            typeof enemy.update === 'function' && 
            typeof enemy.render === 'function'
        );
    }

    clearEnemies() {
        this.enemies = [];
    }

    // コールバック設定
    setWaveCompleteCallback(callback) {
        this.waveCompleteCallback = callback;
    }

    setEnemyReachedCallback(callback) {
        this.enemyReachedCallback = callback;
    }

    setEnemyDefeatedCallback(callback) {
        this.enemyDefeatedCallback = callback;
    }
}

// 後方互換性のため
class MapManager extends GridMapManager {}
class WaveManager extends GridWaveManager {}