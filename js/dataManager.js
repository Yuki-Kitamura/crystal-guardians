/**
 * Crystal Guardians - データ管理システム
 * ローカルJSONファイルとサーバーAPIの両方に対応した統一データ管理システム
 */

class GameDataManager {
    constructor() {
        this.config = null;
        this.characters = null;
        this.enemies = null;
        this.maps = null;
        this.cache = new Map();
        this.isInitialized = false;
        this.dataSource = 'local'; // 'local' または 'server'
        this.baseUrl = './data/';
        this.serverApiUrl = '/api/'; // サーバー導入時に使用
        this.fallbackData = {}; // フォールバックデータ
        
        console.log("🗄️ GameDataManager初期化開始");
    }

    /**
     * データマネージャーの初期化
     * 設定ファイルを読み込み、データソースを決定
     */
    async initialize() {
        try {
            console.log("🔧 データマネージャー初期化中...");
            
            // 設定ファイルを最初に読み込み
            this.config = await this.loadGameConfig();
            
            // 設定に基づいてデータソースを設定
            this.setupDataSource();
            
            // 全データを並列読み込み
            await this.loadAllData();
            
            this.isInitialized = true;
            console.log("✅ データマネージャー初期化完了");
            
            return true;
        } catch (error) {
            console.error("❌ データマネージャー初期化失敗:", error);
            
            // フォールバックモードで初期化
            await this.initializeFallbackMode();
            return false;
        }
    }

    /**
     * データソースの設定
     */
    setupDataSource() {
        if (this.config && this.config.gameConfig && this.config.gameConfig.dataSource) {
            const dataSourceConfig = this.config.gameConfig.dataSource;
            this.dataSource = dataSourceConfig.type || 'local';
            this.baseUrl = dataSourceConfig.baseUrl || './data/';
            this.serverApiUrl = dataSourceConfig.serverApiUrl || '/api/';
            
            console.log(`🔗 データソース設定: ${this.dataSource} (${this.dataSource === 'local' ? this.baseUrl : this.serverApiUrl})`);
        }
    }

    /**
     * 全データの並列読み込み
     */
    async loadAllData() {
        console.log("📦 全データ読み込み開始");
        
        const loadPromises = [
            this.loadCharacters(),
            this.loadEnemies(),
            this.loadMaps()
        ];

        const results = await Promise.allSettled(loadPromises);
        
        // 結果をチェック
        results.forEach((result, index) => {
            const dataTypes = ['characters', 'enemies', 'maps'];
            if (result.status === 'rejected') {
                console.error(`❌ ${dataTypes[index]}データ読み込み失敗:`, result.reason);
            } else {
                console.log(`✅ ${dataTypes[index]}データ読み込み成功`);
            }
        });

        console.log("📦 全データ読み込み完了");
    }

    /**
     * ゲーム設定の読み込み
     */
    async loadGameConfig() {
        const cacheKey = 'gameConfig';
        
        // キャッシュチェック
        if (this.cache.has(cacheKey)) {
            console.log("💾 ゲーム設定をキャッシュから取得");
            return this.cache.get(cacheKey);
        }

        try {
            const data = await this.fetchData('gameConfig.json');
            this.cache.set(cacheKey, data);
            console.log("✅ ゲーム設定読み込み完了");
            return data;
        } catch (error) {
            console.error("❌ ゲーム設定読み込み失敗:", error);
            return this.getDefaultGameConfig();
        }
    }

    /**
     * キャラクターデータの読み込み
     */
    async loadCharacters() {
        const cacheKey = 'characters';
        
        if (this.cache.has(cacheKey)) {
            console.log("💾 キャラクターデータをキャッシュから取得");
            this.characters = this.cache.get(cacheKey);
            return this.characters;
        }

        try {
            const data = await this.fetchData('characters.json');
            this.characters = data;
            this.cache.set(cacheKey, data);
            console.log("✅ キャラクターデータ読み込み完了");
            return data;
        } catch (error) {
            console.error("❌ キャラクターデータ読み込み失敗:", error);
            this.characters = this.getDefaultCharacters();
            return this.characters;
        }
    }

    /**
     * 敵データの読み込み
     */
    async loadEnemies() {
        const cacheKey = 'enemies';
        
        if (this.cache.has(cacheKey)) {
            console.log("💾 敵データをキャッシュから取得");
            this.enemies = this.cache.get(cacheKey);
            return this.enemies;
        }

        try {
            const data = await this.fetchData('enemies.json');
            this.enemies = data;
            this.cache.set(cacheKey, data);
            console.log("✅ 敵データ読み込み完了");
            return data;
        } catch (error) {
            console.error("❌ 敵データ読み込み失敗:", error);
            this.enemies = this.getDefaultEnemies();
            return this.enemies;
        }
    }

    /**
     * マップデータの読み込み
     */
    async loadMaps() {
        const cacheKey = 'maps';
        
        if (this.cache.has(cacheKey)) {
            console.log("💾 マップデータをキャッシュから取得");
            this.maps = this.cache.get(cacheKey);
            return this.maps;
        }

        try {
            const data = await this.fetchData('maps.json');
            this.maps = data;
            this.cache.set(cacheKey, data);
            console.log("✅ マップデータ読み込み完了");
            return data;
        } catch (error) {
            console.error("❌ マップデータ読み込み失敗:", error);
            this.maps = this.getDefaultMaps();
            return this.maps;
        }
    }

    /**
     * データの取得（ローカル/サーバー対応）
     */
    async fetchData(filename) {
        const url = this.dataSource === 'local' 
            ? `${this.baseUrl}${filename}`
            : `${this.serverApiUrl}${filename.replace('.json', '')}`;

        console.log(`📡 データ取得: ${url}`);

        const response = await fetch(url);
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();
        
        // データの整合性チェック
        this.validateData(filename, data);
        
        return data;
    }

    /**
     * データの整合性チェック
     */
    validateData(filename, data) {
        if (!data || typeof data !== 'object') {
            throw new Error(`無効なデータ形式: ${filename}`);
        }

        // ファイル別の詳細チェック
        switch (filename) {
            case 'characters.json':
                if (!data.characters || typeof data.characters !== 'object') {
                    throw new Error('キャラクターデータの形式が無効です');
                }
                break;
            case 'enemies.json':
                if (!data.enemies || typeof data.enemies !== 'object') {
                    throw new Error('敵データの形式が無効です');
                }
                break;
            case 'maps.json':
                if (!data.maps || typeof data.maps !== 'object') {
                    throw new Error('マップデータの形式が無効です');
                }
                break;
            case 'gameConfig.json':
                if (!data.gameConfig || typeof data.gameConfig !== 'object') {
                    throw new Error('ゲーム設定の形式が無効です');
                }
                break;
        }

        console.log(`✅ データ整合性チェック完了: ${filename}`);
    }

    /**
     * フォールバックモードでの初期化
     */
    async initializeFallbackMode() {
        console.warn("⚠️ フォールバックモードで初期化中...");
        
        this.config = this.getDefaultGameConfig();
        this.characters = this.getDefaultCharacters();
        this.enemies = this.getDefaultEnemies();
        this.maps = this.getDefaultMaps();
        
        this.isInitialized = true;
        console.log("✅ フォールバックモード初期化完了");
    }

    // ===== データ取得メソッド =====

    /**
     * キャラクターデータの取得
     */
    getCharacter(characterId) {
        if (!this.isInitialized) {
            console.warn("⚠️ データマネージャーが初期化されていません");
            return null;
        }

        if (!this.characters || !this.characters.characters) {
            console.error("❌ キャラクターデータが利用できません");
            return null;
        }

        const character = this.characters.characters[characterId];
        if (!character) {
            console.warn(`⚠️ キャラクター '${characterId}' が見つかりません`);
            return null;
        }

        return { ...character }; // ディープコピーで返す
    }

    /**
     * 全キャラクターデータの取得
     */
    getAllCharacters() {
        if (!this.isInitialized || !this.characters) {
            return {};
        }
        return { ...this.characters.characters };
    }

    /**
     * 敵データの取得
     */
    getEnemy(enemyId) {
        if (!this.isInitialized) {
            console.warn("⚠️ データマネージャーが初期化されていません");
            return null;
        }

        if (!this.enemies || !this.enemies.enemies) {
            console.error("❌ 敵データが利用できません");
            return null;
        }

        const enemy = this.enemies.enemies[enemyId];
        if (!enemy) {
            console.warn(`⚠️ 敵 '${enemyId}' が見つかりません`);
            return null;
        }

        return { ...enemy }; // ディープコピーで返す
    }

    /**
     * 全敵データの取得
     */
    getAllEnemies() {
        if (!this.isInitialized || !this.enemies) {
            return {};
        }
        return { ...this.enemies.enemies };
    }

    /**
     * マップデータの取得
     */
    getMap(mapId) {
        if (!this.isInitialized) {
            console.warn("⚠️ データマネージャーが初期化されていません");
            return null;
        }

        if (!this.maps || !this.maps.maps) {
            console.error("❌ マップデータが利用できません");
            return null;
        }

        const map = this.maps.maps[mapId.toString()];
        if (!map) {
            console.warn(`⚠️ マップ '${mapId}' が見つかりません`);
            return null;
        }

        return JSON.parse(JSON.stringify(map)); // ディープコピーで返す
    }

    /**
     * 全マップデータの取得
     */
    getAllMaps() {
        if (!this.isInitialized || !this.maps) {
            return {};
        }
        return JSON.parse(JSON.stringify(this.maps.maps));
    }

    /**
     * ゲーム設定の取得
     */
    getGameConfig() {
        if (!this.isInitialized || !this.config) {
            return this.getDefaultGameConfig().gameConfig;
        }
        return { ...this.config.gameConfig };
    }

    /**
     * 特定の設定値の取得
     */
    getConfigValue(path) {
        if (!this.isInitialized || !this.config) {
            return null;
        }

        const keys = path.split('.');
        let value = this.config.gameConfig;
        
        for (const key of keys) {
            if (value && typeof value === 'object' && key in value) {
                value = value[key];
            } else {
                return null;
            }
        }

        return value;
    }

    // ===== キャッシュ管理 =====

    /**
     * キャッシュのクリア
     */
    clearCache() {
        this.cache.clear();
        console.log("🗑️ キャッシュをクリアしました");
    }

    /**
     * データの再読み込み
     */
    async reloadData() {
        console.log("🔄 データ再読み込み開始");
        this.clearCache();
        await this.loadAllData();
        console.log("✅ データ再読み込み完了");
    }

    // ===== フォールバックデータ =====

    getDefaultGameConfig() {
        return {
            gameConfig: {
                version: "1.0.0",
                gameSettings: {
                    initialGold: 100,
                    maxEnemiesReached: 10,
                    gameSpeed: 1,
                    autoProgressEnabled: false
                },
                gridSettings: {
                    gridWidth: 11,
                    gridHeight: 8,
                    panelSize: 64,
                    canvasWidth: 704,
                    canvasHeight: 512
                },
                dataSource: {
                    type: "local",
                    baseUrl: "./data/",
                    fallbackEnabled: true,
                    cacheEnabled: true
                }
            }
        };
    }

    getDefaultCharacters() {
        return {
            characters: {
                warrior: {
                    id: "warrior",
                    name: "ウォリアー",
                    cost: 100,
                    stats: { damage: 25, range: 80, attackSpeed: 1000 },
                    visual: { icon: "⚔️", color: "#e74c3c", size: 24 }
                },
                archer: {
                    id: "archer",
                    name: "アーチャー",
                    cost: 80,
                    stats: { damage: 20, range: 150, attackSpeed: 800 },
                    visual: { icon: "🏹", color: "#27ae60", size: 22 }
                }
            }
        };
    }

    getDefaultEnemies() {
        return {
            enemies: {
                goblin: {
                    id: "goblin",
                    name: "ゴブリン",
                    stats: { hp: 40, speed: 1.2, reward: 8 },
                    visual: { icon: "👺", color: "#27ae60", size: 18 }
                }
            }
        };
    }

    getDefaultMaps() {
        return {
            maps: {
                "1": {
                    id: 1,
                    name: "森の小道",
                    waves: {
                        "1": {
                            enemies: [{ type: "goblin", count: 5, interval: 1000, delay: 0 }],
                            reward: 50
                        }
                    }
                }
            }
        };
    }

    // ===== ユーティリティメソッド =====

    /**
     * 初期化状態の確認
     */
    isReady() {
        return this.isInitialized;
    }

    /**
     * データソースの切り替え
     */
    async switchDataSource(newSource) {
        if (newSource !== 'local' && newSource !== 'server') {
            console.error("❌ 無効なデータソース:", newSource);
            return false;
        }

        console.log(`🔄 データソース切り替え: ${this.dataSource} → ${newSource}`);
        
        this.dataSource = newSource;
        this.clearCache();
        
        try {
            await this.loadAllData();
            console.log("✅ データソース切り替え完了");
            return true;
        } catch (error) {
            console.error("❌ データソース切り替え失敗:", error);
            return false;
        }
    }

    /**
     * データの統計情報取得
     */
    getDataStats() {
        return {
            isInitialized: this.isInitialized,
            dataSource: this.dataSource,
            cacheSize: this.cache.size,
            charactersCount: this.characters ? Object.keys(this.characters.characters || {}).length : 0,
            enemiesCount: this.enemies ? Object.keys(this.enemies.enemies || {}).length : 0,
            mapsCount: this.maps ? Object.keys(this.maps.maps || {}).length : 0
        };
    }
}

// グローバルインスタンス
window.gameDataManager = new GameDataManager(); 