/**
 * Crystal Guardians - データアダプター
 * 既存のゲームシステムとデータマネージャーを統合するアダプター
 */

class GameDataAdapter {
    constructor(dataManager) {
        this.dataManager = dataManager;
        this.isReady = false;
        
        console.log("🔌 GameDataAdapter初期化");
    }

    /**
     * アダプターの初期化
     */
    async initialize() {
        try {
            console.log("🔧 データアダプター初期化中...");
            
            // データマネージャーの初期化を待つ
            if (!this.dataManager.isReady()) {
                await this.dataManager.initialize();
            }
            
            this.isReady = true;
            console.log("✅ データアダプター初期化完了");
            
            return true;
        } catch (error) {
            console.error("❌ データアダプター初期化失敗:", error);
            return false;
        }
    }

    // ===== キャラクター関連アダプター =====

    /**
     * キャラクターコストの取得（既存のgetCharacterCostメソッドと互換）
     */
    getCharacterCost(characterType) {
        try {
            const characterData = this.dataManager.getCharacter(characterType);
            if (characterData && characterData.cost) {
                return characterData.cost;
            }
            
            // フォールバック: 既存の固定値
            const fallbackCosts = { 
                warrior: 100, 
                archer: 80, 
                wizard: 120, 
                timemage: 100, 
                treasurehunter: 60 
            };
            
            return fallbackCosts[characterType] || 100;
        } catch (error) {
            console.error(`❌ キャラクターコスト取得エラー: ${characterType}`, error);
            return 100; // デフォルト値
        }
    }

    /**
     * キャラクター情報の取得
     */
    getCharacterInfo(characterType) {
        try {
            const characterData = this.dataManager.getCharacter(characterType);
            if (characterData) {
                return {
                    id: characterData.id,
                    name: characterData.name,
                    description: characterData.description,
                    cost: characterData.cost,
                    stats: characterData.stats,
                    abilities: characterData.abilities,
                    visual: characterData.visual,
                    upgrades: characterData.upgrades
                };
            }
            
            console.warn(`⚠️ キャラクター情報が見つかりません: ${characterType}`);
            return null;
        } catch (error) {
            console.error(`❌ キャラクター情報取得エラー: ${characterType}`, error);
            return null;
        }
    }

    /**
     * 全キャラクター情報の取得
     */
    getAllCharacterInfo() {
        try {
            return this.dataManager.getAllCharacters();
        } catch (error) {
            console.error("❌ 全キャラクター情報取得エラー:", error);
            return {};
        }
    }

    // ===== 敵関連アダプター =====

    /**
     * 敵情報の取得（EnemyFactoryと互換）
     */
    getEnemyInfo(enemyType) {
        try {
            const enemyData = this.dataManager.getEnemy(enemyType);
            if (enemyData) {
                return {
                    name: enemyData.name,
                    hp: enemyData.stats.hp,
                    speed: enemyData.stats.speed,
                    reward: enemyData.stats.reward,
                    armor: enemyData.stats.armor || 0,
                    isFlying: enemyData.abilities.isFlying,
                    hasSpecialAbility: enemyData.abilities.hasSpecialAbility,
                    specialAbility: enemyData.abilities.specialAbility,
                    icon: enemyData.visual.icon,
                    color: enemyData.visual.color,
                    size: enemyData.visual.size,
                    type: enemyData.type
                };
            }
            
            console.warn(`⚠️ 敵情報が見つかりません: ${enemyType}`);
            return null;
        } catch (error) {
            console.error(`❌ 敵情報取得エラー: ${enemyType}`, error);
            return null;
        }
    }

    /**
     * 敵の名前取得（EnemyFactory.getEnemyNameと互換）
     */
    getEnemyName(enemyType) {
        try {
            const enemyData = this.dataManager.getEnemy(enemyType);
            return enemyData ? enemyData.name : "不明";
        } catch (error) {
            console.error(`❌ 敵名前取得エラー: ${enemyType}`, error);
            return "不明";
        }
    }

    /**
     * 全敵情報の取得
     */
    getAllEnemyInfo() {
        try {
            return this.dataManager.getAllEnemies();
        } catch (error) {
            console.error("❌ 全敵情報取得エラー:", error);
            return {};
        }
    }

    // ===== マップ関連アダプター =====

    /**
     * マップデータの取得（GridMapManagerと互換）
     */
    getMapData(mapId) {
        try {
            const mapData = this.dataManager.getMap(mapId);
            if (mapData) {
                return {
                    id: mapData.id,
                    name: mapData.name,
                    description: mapData.description,
                    difficulty: mapData.difficulty,
                    icon: mapData.icon,
                    background: mapData.visual.background,
                    pathColor: mapData.visual.pathColor,
                    gridData: mapData.gridData,
                    waves: mapData.waves
                };
            }
            
            console.warn(`⚠️ マップデータが見つかりません: ${mapId}`);
            return null;
        } catch (error) {
            console.error(`❌ マップデータ取得エラー: ${mapId}`, error);
            return null;
        }
    }

    /**
     * Waveデータの取得
     */
    getWaveData(mapId, waveId) {
        try {
            const mapData = this.dataManager.getMap(mapId);
            if (mapData && mapData.waves && mapData.waves[waveId.toString()]) {
                return mapData.waves[waveId.toString()];
            }
            
            console.warn(`⚠️ Waveデータが見つかりません: マップ${mapId} Wave${waveId}`);
            return null;
        } catch (error) {
            console.error(`❌ Waveデータ取得エラー: マップ${mapId} Wave${waveId}`, error);
            return null;
        }
    }

    /**
     * 全マップデータの取得
     */
    getAllMapData() {
        try {
            return this.dataManager.getAllMaps();
        } catch (error) {
            console.error("❌ 全マップデータ取得エラー:", error);
            return {};
        }
    }

    // ===== ゲーム設定関連アダプター =====

    /**
     * ゲーム設定値の取得
     */
    getGameSetting(settingPath) {
        try {
            return this.dataManager.getConfigValue(settingPath);
        } catch (error) {
            console.error(`❌ ゲーム設定取得エラー: ${settingPath}`, error);
            return null;
        }
    }

    /**
     * 初期ゴールドの取得
     */
    getInitialGold() {
        return this.getGameSetting('gameSettings.initialGold') || 100;
    }

    /**
     * 最大敵到達数の取得
     */
    getMaxEnemiesReached() {
        return this.getGameSetting('gameSettings.maxEnemiesReached') || 10;
    }

    /**
     * グリッド設定の取得
     */
    getGridSettings() {
        const gridSettings = this.getGameSetting('gridSettings');
        return gridSettings || {
            gridWidth: 11,
            gridHeight: 8,
            panelSize: 64,
            canvasWidth: 704,
            canvasHeight: 512
        };
    }

    /**
     * パネルタイプの取得
     */
    getPanelTypes() {
        const panelTypes = this.getGameSetting('panelTypes');
        return panelTypes || {
            EMPTY: ".",
            WALL: "W",
            ROAD: "R",
            PATH: "-",
            VERTICAL_PATH: "|",
            START: "S",
            GOAL: "G"
        };
    }

    /**
     * 天候システム設定の取得
     */
    getWeatherSystemConfig() {
        return this.getGameSetting('weatherSystem') || { enabled: false };
    }

    /**
     * 難易度システム設定の取得
     */
    getDifficultySystemConfig() {
        return this.getGameSetting('difficultySystem') || { enabled: false };
    }

    /**
     * UI設定の取得
     */
    getUIConfig() {
        return this.getGameSetting('ui') || {};
    }

    /**
     * パフォーマンス設定の取得
     */
    getPerformanceConfig() {
        return this.getGameSetting('performance') || {};
    }

    // ===== 既存システムとの統合メソッド =====

    /**
     * GridMapManagerのinitializeMapsメソッドと互換
     */
    initializeMaps() {
        try {
            const allMaps = this.getAllMapData();
            const convertedMaps = {};
            
            Object.keys(allMaps).forEach(mapId => {
                const mapData = allMaps[mapId];
                convertedMaps[mapId] = {
                    name: mapData.name,
                    description: mapData.description,
                    background: mapData.visual.background,
                    pathColor: mapData.visual.pathColor,
                    difficulty: mapData.difficulty,
                    icon: mapData.icon,
                    gridData: mapData.gridData,
                    waves: mapData.waves
                };
            });
            
            return convertedMaps;
        } catch (error) {
            console.error("❌ マップ初期化エラー:", error);
            return {};
        }
    }

    /**
     * EnemyFactoryのcreateメソッドと統合するためのヘルパー
     */
    createEnemyWithData(enemyType) {
        try {
            const enemyInfo = this.getEnemyInfo(enemyType);
            if (!enemyInfo) {
                console.warn(`⚠️ 敵データが見つかりません: ${enemyType}`);
                return null;
            }
            
            // 既存のEnemyFactoryを使用してインスタンスを作成
            if (typeof EnemyFactory !== 'undefined' && EnemyFactory.create) {
                const enemy = EnemyFactory.create(enemyType);
                
                // データベースの値で上書き
                if (enemy && enemyInfo) {
                    enemy.hp = enemyInfo.hp;
                    enemy.maxHp = enemyInfo.hp;
                    enemy.speed = enemyInfo.speed;
                    enemy.reward = enemyInfo.reward;
                    enemy.isFlying = enemyInfo.isFlying;
                    enemy.color = enemyInfo.color;
                    enemy.icon = enemyInfo.icon;
                    enemy.size = enemyInfo.size;
                }
                
                return enemy;
            }
            
            console.warn("⚠️ EnemyFactoryが利用できません");
            return null;
        } catch (error) {
            console.error(`❌ 敵作成エラー: ${enemyType}`, error);
            return null;
        }
    }

    // ===== データ更新・管理メソッド =====

    /**
     * データの再読み込み
     */
    async reloadData() {
        try {
            console.log("🔄 データアダプター: データ再読み込み開始");
            await this.dataManager.reloadData();
            console.log("✅ データアダプター: データ再読み込み完了");
            return true;
        } catch (error) {
            console.error("❌ データアダプター: データ再読み込み失敗", error);
            return false;
        }
    }

    /**
     * データソースの切り替え
     */
    async switchDataSource(newSource) {
        try {
            console.log(`🔄 データアダプター: データソース切り替え → ${newSource}`);
            const success = await this.dataManager.switchDataSource(newSource);
            
            if (success) {
                console.log("✅ データアダプター: データソース切り替え完了");
            } else {
                console.error("❌ データアダプター: データソース切り替え失敗");
            }
            
            return success;
        } catch (error) {
            console.error("❌ データアダプター: データソース切り替えエラー", error);
            return false;
        }
    }

    /**
     * データ統計の取得
     */
    getDataStats() {
        return this.dataManager.getDataStats();
    }

    /**
     * 準備状態の確認
     */
    isDataReady() {
        return this.isReady && this.dataManager.isReady();
    }

    // ===== デバッグ・開発支援メソッド =====

    /**
     * データ整合性チェック
     */
    validateGameData() {
        const issues = [];
        
        try {
            // キャラクターデータのチェック
            const characters = this.getAllCharacterInfo();
            Object.keys(characters).forEach(charId => {
                const char = characters[charId];
                if (!char.cost || !char.stats || !char.visual) {
                    issues.push(`キャラクター '${charId}' のデータが不完全です`);
                }
            });
            
            // 敵データのチェック
            const enemies = this.getAllEnemyInfo();
            Object.keys(enemies).forEach(enemyId => {
                const enemy = enemies[enemyId];
                if (!enemy.stats || !enemy.visual) {
                    issues.push(`敵 '${enemyId}' のデータが不完全です`);
                }
            });
            
            // マップデータのチェック
            const maps = this.getAllMapData();
            Object.keys(maps).forEach(mapId => {
                const map = maps[mapId];
                if (!map.gridData || !map.waves) {
                    issues.push(`マップ '${mapId}' のデータが不完全です`);
                }
            });
            
            if (issues.length === 0) {
                console.log("✅ データ整合性チェック: 問題なし");
                return { valid: true, issues: [] };
            } else {
                console.warn("⚠️ データ整合性チェック: 問題が見つかりました", issues);
                return { valid: false, issues: issues };
            }
            
        } catch (error) {
            console.error("❌ データ整合性チェックエラー:", error);
            return { valid: false, issues: [`チェック実行エラー: ${error.message}`] };
        }
    }

    /**
     * データ構造の出力（デバッグ用）
     */
    dumpDataStructure() {
        console.log("📊 データ構造ダンプ:");
        console.log("キャラクター:", Object.keys(this.getAllCharacterInfo()));
        console.log("敵:", Object.keys(this.getAllEnemyInfo()));
        console.log("マップ:", Object.keys(this.getAllMapData()));
        console.log("統計:", this.getDataStats());
    }
}

// グローバルインスタンス（データマネージャー初期化後に作成）
window.gameDataAdapter = null;

// データマネージャー初期化後にアダプターを作成する関数
window.initializeGameDataAdapter = async function() {
    if (window.gameDataManager) {
        window.gameDataAdapter = new GameDataAdapter(window.gameDataManager);
        const success = await window.gameDataAdapter.initialize();
        
        if (success) {
            console.log("✅ GameDataAdapter グローバルインスタンス作成完了");
            
            // データ整合性チェック実行
            const validation = window.gameDataAdapter.validateGameData();
            if (!validation.valid) {
                console.warn("⚠️ データに問題があります:", validation.issues);
            }
            
            return window.gameDataAdapter;
        } else {
            console.error("❌ GameDataAdapter初期化失敗");
            return null;
        }
    } else {
        console.error("❌ GameDataManagerが利用できません");
        return null;
    }
}; 