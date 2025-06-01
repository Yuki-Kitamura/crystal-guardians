// グリッドベースマップシステム
const GRID_WIDTH = 11;
const GRID_HEIGHT = 8;
const PANEL_SIZE = 64;

// パネルタイプの定義
const PANEL_TYPES = {
    ROAD: 'road',           // 道路パネル：敵が通過、配置不可
    BUILDABLE: 'buildable', // 配置可能パネル：タワー配置可能
    BLOCKED: 'blocked',     // 配置不可パネル：岩や水
    START: 'start',         // スタートパネル
    GOAL: 'goal',          // ゴールパネル
    ROCK: 'rock',          // 岩：配置不可、敵進行不可、射線ブロック
    WATER: 'water'         // 池：配置不可、地上敵進行不可、空中敵通過可能
};

// パネルの色定義
const PANEL_COLORS = {
    [PANEL_TYPES.ROAD]: '#8b4513',
    [PANEL_TYPES.BUILDABLE]: '#2d5016',
    [PANEL_TYPES.BLOCKED]: '#4a4a4a',
    [PANEL_TYPES.START]: '#27ae60',
    [PANEL_TYPES.GOAL]: '#3498db',
    [PANEL_TYPES.ROCK]: '#696969',
    [PANEL_TYPES.WATER]: '#1e90ff'
};

// パネルの枠線色
const PANEL_BORDER_COLORS = {
    [PANEL_TYPES.ROAD]: '#654321',
    [PANEL_TYPES.BUILDABLE]: '#34a853',
    [PANEL_TYPES.BLOCKED]: '#2c2c2c',
    [PANEL_TYPES.START]: '#1e8449',
    [PANEL_TYPES.GOAL]: '#2980b9',
    [PANEL_TYPES.ROCK]: '#2c2c2c',
    [PANEL_TYPES.WATER]: '#0066cc'
};

class GridPanel {
    constructor(gridX, gridY, type) {
        this.gridX = gridX;
        this.gridY = gridY;
        this.type = type;
        this.occupied = false;
        this.character = null;
        this.highlighted = false;
        this.hovered = false;
        this.highlightType = null;
    }

    getPixelPosition() {
        return {
            x: this.gridX * PANEL_SIZE + PANEL_SIZE / 2,
            y: this.gridY * PANEL_SIZE + PANEL_SIZE / 2
        };
    }

    getBounds() {
        return {
            x: this.gridX * PANEL_SIZE,
            y: this.gridY * PANEL_SIZE,
            width: PANEL_SIZE,
            height: PANEL_SIZE
        };
    }

    canBuild() {
        return this.type === PANEL_TYPES.BUILDABLE && !this.occupied;
    }

    isRoad() {
        return this.type === PANEL_TYPES.ROAD || this.type === PANEL_TYPES.START || this.type === PANEL_TYPES.GOAL;
    }

    // 地上ユニットの通過可能性をチェック
    isPassableForGround() {
        return this.type === PANEL_TYPES.ROAD || 
               this.type === PANEL_TYPES.START || 
               this.type === PANEL_TYPES.GOAL;
    }

    // 空中ユニットの通過可能性をチェック（岩は射線をブロック）
    isPassableForAir() {
        return this.type !== PANEL_TYPES.ROCK;
    }

    // 射線がブロックされるかチェック
    blocksLineOfSight() {
        return this.type === PANEL_TYPES.ROCK;
    }

    // 地形タイプを取得
    isRock() {
        return this.type === PANEL_TYPES.ROCK;
    }

    isWater() {
        return this.type === PANEL_TYPES.WATER;
    }
}

class GridSystem {
    constructor(mapNumber = 1) {
        this.currentMap = mapNumber;
        this.grid = [];
        this.hoveredPanel = null;
        this.selectedPanel = null;
        this.seed = 12345; // テクスチャ生成用のシード値
        this.initializeGrid();
        console.log(`🗺️ GridSystem初期化: マップ${mapNumber}`);
    }

    initializeGrid() {
        this.grid = [];
        for (let y = 0; y < GRID_HEIGHT; y++) {
            this.grid[y] = [];
            for (let x = 0; x < GRID_WIDTH; x++) {
                this.grid[y][x] = new GridPanel(x, y, PANEL_TYPES.BUILDABLE);
            }
        }
        
        // マップデータを読み込んで適用
        this.loadMap(this.currentMap);
        console.log(`🗺️ グリッド初期化完了: マップ${this.currentMap}のデータを適用`);
    }

    loadMap(mapNumber) {
        console.log(`🗺️ マップ${mapNumber}読み込み開始`);
        this.currentMap = mapNumber; // currentMapプロパティを設定
        const mapData = this.getMapData(mapNumber);
        
        if (!mapData) {
            console.error(`❌ マップ${mapNumber}のデータが見つかりません`);
            return;
        }
        
        console.log(`📋 マップ${mapNumber}データ読み込み: ${mapData.length}行 x ${mapData[0]?.length || 0}列`);
        console.log(`📋 マップデータ詳細:`, mapData);
        
        let typeCount = {};
        let processedCells = 0;
        
        for (let y = 0; y < GRID_HEIGHT && y < mapData.length; y++) {
            console.log(`🔍 行${y}の処理開始: mapData[${y}] =`, mapData[y]);
            for (let x = 0; x < GRID_WIDTH && x < mapData[y].length; x++) {
                const char = mapData[y][x];
                
                // 重要なタイルの場合のみ詳細ログ
                if (char === 'S' || char === 'G' || char === 'R' || char === 'W' || char === '-') {
                    console.log(`🔍 セル(${x},${y}): 文字='${char}' (type: ${typeof char})`);
                }
                
                const type = this.charToType(char);
                
                if (char === 'S' || char === 'G' || char === 'R' || char === 'W' || char === '-') {
                    console.log(`🔍 セル(${x},${y}): 変換結果='${type}'`);
                }
                
                // グリッドが存在することを確認
                if (!this.grid[y] || !this.grid[y][x]) {
                    console.error(`❌ グリッドパネルが存在しません: (${x},${y})`);
                    continue;
                }
                
                if (char === 'S' || char === 'G' || char === 'R' || char === 'W' || char === '-') {
                    console.log(`🔍 セル(${x},${y}): 変更前のタイプ='${this.grid[y][x].type}'`);
                }
                
                this.grid[y][x].type = type;
                
                if (char === 'S' || char === 'G' || char === 'R' || char === 'W' || char === '-') {
                    console.log(`🔍 セル(${x},${y}): 変更後のタイプ='${this.grid[y][x].type}'`);
                }
                
                this.grid[y][x].occupied = false;
                this.grid[y][x].character = null;
                
                // タイプ別カウント
                typeCount[type] = (typeCount[type] || 0) + 1;
                processedCells++;
                
                // 重要なタイルの場合は特別にログ出力
                if (char === 'S' || char === 'G' || char === 'R' || char === 'W') {
                    console.log(`🎯 重要タイル確認: (${x},${y}) '${char}' → '${type}' → 実際のパネルタイプ='${this.grid[y][x].type}'`);
                }
            }
        }
        
        console.log(`✅ マップ${mapNumber}読み込み完了: ${processedCells}セル処理`);
        console.log(`📊 タイプ別カウント:`, typeCount);
        
        // 重要なタイルの位置を確認
        const startPanels = this.findAllPanelsByType(PANEL_TYPES.START);
        const goalPanels = this.findAllPanelsByType(PANEL_TYPES.GOAL);
        console.log(`🎯 スタート地点: ${startPanels.length}個, ゴール地点: ${goalPanels.length}個`);
        
        // 実際のグリッド状態をデバッグ出力
        if (startPanels.length === 0 || goalPanels.length === 0) {
            console.warn(`⚠️ 重要タイルが見つかりません。グリッド状態をデバッグ出力します:`);
            this.debugPrintMap();
        }
    }

    charToType(char) {
        // 重要な文字の場合のみログ出力
        if (char === 'S' || char === 'G' || char === 'R' || char === 'W' || char === '-' || char === '|') {
            console.log(`🔍 charToType呼び出し: 入力='${char}' (type: ${typeof char})`);
        }
        
        let result;
        switch (char) {
            case 'S': 
                result = PANEL_TYPES.START;
                break;
            case 'G': 
                result = PANEL_TYPES.GOAL;
                break;
            case '-': 
            case '|': 
                result = PANEL_TYPES.ROAD;
                break;
            case '.': 
                result = PANEL_TYPES.BUILDABLE;
                break;
            case 'X': 
                result = PANEL_TYPES.BLOCKED;
                break;
            case 'R': 
                result = PANEL_TYPES.ROCK;
                break;
            case 'W': 
                result = PANEL_TYPES.WATER;
                break;
            default: 
                result = PANEL_TYPES.BUILDABLE;
                console.warn(`⚠️ 未知の文字: '${char}' → デフォルトでbuildableに設定`);
                break;
        }
        
        // 重要な文字の場合のみログ出力
        if (char === 'S' || char === 'G' || char === 'R' || char === 'W' || char === '-' || char === '|') {
            console.log(`🔍 charToType結果: '${char}' → '${result}'`);
            console.log(`🔍 PANEL_TYPES.START = '${PANEL_TYPES.START}'`);
            console.log(`🔍 PANEL_TYPES.GOAL = '${PANEL_TYPES.GOAL}'`);
        }
        
        return result;
    }

    // マップデータを取得（stages.jsのGridMapManagerから取得）
    getMapData(mapNumber) {
        console.log(`🗺️ getMapData呼び出し: mapNumber=${mapNumber} (type: ${typeof mapNumber})`);
        
        // GridMapManagerのインスタンスを作成してマップデータを取得
        const mapManager = new GridMapManager();
        const mapData = mapManager.maps[mapNumber];
        
        if (!mapData || !mapData.gridData) {
            console.error(`❌ マップ${mapNumber}のデータが見つかりません`);
            return null;
        }
        
        const result = mapData.gridData;
        console.log(`🗺️ getMapData結果: mapNumber=${mapNumber}`);
        console.log(`🗺️ 返されるマップデータ:`, result);
        console.log(`🗺️ マップデータの最初の行:`, result[0]);
        console.log(`🗺️ マップデータの最初の要素:`, result[0][0], `(type: ${typeof result[0][0]})`);
        
        return result;
    }

    gridToPixel(gridX, gridY) {
        return {
            x: gridX * PANEL_SIZE + PANEL_SIZE / 2,
            y: gridY * PANEL_SIZE + PANEL_SIZE / 2
        };
    }

    pixelToGrid(x, y) {
        return {
            gridX: Math.floor(x / PANEL_SIZE),
            gridY: Math.floor(y / PANEL_SIZE)
        };
    }

    getPanel(gridX, gridY) {
        if (gridX >= 0 && gridX < GRID_WIDTH && gridY >= 0 && gridY < GRID_HEIGHT) {
            return this.grid[gridY][gridX];
        }
        return null;
    }

    getPanelAt(pixelX, pixelY) {
        const gridPos = this.pixelToGrid(pixelX, pixelY);
        return this.getPanel(gridPos.gridX, gridPos.gridY);
    }

    canBuildAt(gridX, gridY) {
        const panel = this.getPanel(gridX, gridY);
        return panel && panel.canBuild();
    }

    placeCharacter(gridX, gridY, character) {
        const panel = this.getPanel(gridX, gridY);
        if (panel && panel.canBuild()) {
            panel.occupied = true;
            panel.character = character;
            return true;
        }
        return false;
    }

    removeCharacter(gridX, gridY) {
        const panel = this.getPanel(gridX, gridY);
        if (panel) {
            panel.occupied = false;
            panel.character = null;
            return true;
        }
        return false;
    }

    updateHover(pixelX, pixelY) {
        // 前回のホバー状態をクリア
        if (this.hoveredPanel) {
            this.hoveredPanel.hovered = false;
        }

        // 新しいホバー状態を設定
        this.hoveredPanel = this.getPanelAt(pixelX, pixelY);
        if (this.hoveredPanel) {
            this.hoveredPanel.hovered = true;
        }
    }

    clearHover() {
        if (this.hoveredPanel) {
            this.hoveredPanel.hovered = false;
            this.hoveredPanel = null;
        }
    }

    // パスファインディング：道路パネルを辿ってルートを生成
    generatePath() {
        const startPanels = this.findAllPanelsByType(PANEL_TYPES.START);
        const goalPanel = this.findPanelByType(PANEL_TYPES.GOAL);
        
        if (startPanels.length === 0 || !goalPanel) {
            console.error('❌ スタートまたはゴールパネルが見つかりません');
            console.log('スタートパネル数:', startPanels.length);
            console.log('ゴールパネル:', goalPanel);
            return [];
        }

        // 最初のスタート地点からのパスを生成（表示用）
        const startPanel = startPanels[0];
        console.log(`🗺️ パス生成開始: スタート(${startPanel.gridX}, ${startPanel.gridY}) → ゴール(${goalPanel.gridX}, ${goalPanel.gridY})`);
        
        const path = this.findPath(startPanel, goalPanel);
        
        if (path.length === 0) {
            console.error('❌ スタートからゴールへのパスが見つかりません');
            console.log('マップ:', this.currentMap);
            this.debugPrintMap();
        } else {
            console.log(`✅ パス生成成功: ${path.length}ポイント`);
        }

        return path;
    }

    findPanelByType(type) {
        for (let y = 0; y < GRID_HEIGHT; y++) {
            for (let x = 0; x < GRID_WIDTH; x++) {
                if (this.grid[y][x].type === type) {
                    return this.grid[y][x];
                }
            }
        }
        return null;
    }

    // 指定されたタイプの全てのパネルを検索
    findAllPanelsByType(type) {
        const panels = [];
        for (let y = 0; y < GRID_HEIGHT; y++) {
            for (let x = 0; x < GRID_WIDTH; x++) {
                if (this.grid[y][x].type === type) {
                    panels.push(this.grid[y][x]);
                }
            }
        }
        return panels;
    }

    findPath(startPanel, goalPanel) {
        const path = [];
        const visited = new Set();
        const queue = [{
            panel: startPanel,
            path: [startPanel.getPixelPosition()]
        }];

        while (queue.length > 0) {
            const current = queue.shift();
            const key = `${current.panel.gridX},${current.panel.gridY}`;

            if (visited.has(key)) continue;
            visited.add(key);

            if (current.panel === goalPanel) {
                return current.path;
            }

            // 隣接する道路パネルを探索
            const neighbors = this.getRoadNeighbors(current.panel);
            for (const neighbor of neighbors) {
                const neighborKey = `${neighbor.gridX},${neighbor.gridY}`;
                if (!visited.has(neighborKey)) {
                    queue.push({
                        panel: neighbor,
                        path: [...current.path, neighbor.getPixelPosition()]
                    });
                }
            }
        }

        return path;
    }

    getRoadNeighbors(panel) {
        const neighbors = [];
        const directions = [
            { dx: -1, dy: 0 }, // 左
            { dx: 1, dy: 0 },  // 右
            { dx: 0, dy: -1 }, // 上
            { dx: 0, dy: 1 }   // 下
        ];

        for (const dir of directions) {
            const newX = panel.gridX + dir.dx;
            const newY = panel.gridY + dir.dy;
            const neighbor = this.getPanel(newX, newY);
            
            if (neighbor && neighbor.isRoad()) {
                neighbors.push(neighbor);
            }
        }

        return neighbors;
    }

    // 地上ユニット用のパスファインディング（岩・池を避ける）
    generateGroundPath() {
        const startPanel = this.findPanelByType(PANEL_TYPES.START);
        const goalPanel = this.findPanelByType(PANEL_TYPES.GOAL);
        
        if (!startPanel || !goalPanel) {
            console.error('❌ 地上パス: スタートまたはゴールパネルが見つかりません');
            return [];
        }

        console.log(`🗺️ 地上パス生成開始: スタート(${startPanel.gridX}, ${startPanel.gridY}) → ゴール(${goalPanel.gridX}, ${goalPanel.gridY})`);
        
        const path = this.findPathForGround(startPanel, goalPanel);
        
        if (path.length === 0) {
            console.error('❌ 地上ユニット用パスが見つかりません');
        } else {
            console.log(`✅ 地上パス生成成功: ${path.length}ポイント`);
        }

        return path;
    }

    // 空中ユニット用のパスファインディング（直線ルート）
    generateAirPath() {
        const startPanel = this.findPanelByType(PANEL_TYPES.START);
        const goalPanel = this.findPanelByType(PANEL_TYPES.GOAL);
        
        if (!startPanel || !goalPanel) {
            console.error('❌ 空中パス: スタートまたはゴールパネルが見つかりません');
            return [];
        }

        const startPos = startPanel.getPixelPosition();
        const goalPos = goalPanel.getPixelPosition();
        
        // 空中ユニットは直線ルート（障害物を考慮しない）
        const path = [];
        const steps = 20;
        
        for (let i = 0; i <= steps; i++) {
            const t = i / steps;
            const x = startPos.x + (goalPos.x - startPos.x) * t;
            const y = startPos.y + (goalPos.y - startPos.y) * t;
            path.push({ x, y });
        }
        
        console.log(`✅ 空中パス生成成功: ${path.length}ポイント`);
        return path;
    }

    findPathForGround(startPanel, goalPanel) {
        console.log(`🔍 地上パスファインディング開始:`);
        console.log(`  - スタート: (${startPanel.gridX}, ${startPanel.gridY}) タイプ: ${startPanel.type}`);
        console.log(`  - ゴール: (${goalPanel.gridX}, ${goalPanel.gridY}) タイプ: ${goalPanel.type}`);
        
        const path = [];
        const visited = new Set();
        const queue = [{
            panel: startPanel,
            path: [startPanel.getPixelPosition()]
        }];

        let iterations = 0;
        const maxIterations = 1000; // 無限ループ防止

        while (queue.length > 0 && iterations < maxIterations) {
            iterations++;
            const current = queue.shift();
            const key = `${current.panel.gridX},${current.panel.gridY}`;

            if (visited.has(key)) continue;
            visited.add(key);

            console.log(`🔍 探索中: (${current.panel.gridX}, ${current.panel.gridY}) タイプ: ${current.panel.type}`);

            if (current.panel === goalPanel) {
                console.log(`✅ ゴール到達! パス長: ${current.path.length}, 反復回数: ${iterations}`);
                return current.path;
            }

            // 隣接する通過可能なパネルを探索
            const neighbors = this.getGroundPassableNeighbors(current.panel);
            console.log(`🔍 隣接パネル数: ${neighbors.length}`);
            
            for (const neighbor of neighbors) {
                const neighborKey = `${neighbor.gridX},${neighbor.gridY}`;
                if (!visited.has(neighborKey)) {
                    console.log(`  → 隣接パネル追加: (${neighbor.gridX}, ${neighbor.gridY}) タイプ: ${neighbor.type}`);
                    queue.push({
                        panel: neighbor,
                        path: [...current.path, neighbor.getPixelPosition()]
                    });
                }
            }
        }

        console.error(`❌ パスが見つかりませんでした! 反復回数: ${iterations}`);
        console.log(`🔍 訪問済みパネル数: ${visited.size}`);
        console.log(`🔍 訪問済みパネル:`, Array.from(visited));
        
        // デバッグ用：マップ構造を出力
        this.debugPrintMap();
        
        return [];
    }

    getGroundPassableNeighbors(panel) {
        const neighbors = [];
        const directions = [
            { dx: -1, dy: 0 }, // 左
            { dx: 1, dy: 0 },  // 右
            { dx: 0, dy: -1 }, // 上
            { dx: 0, dy: 1 }   // 下
        ];

        for (const dir of directions) {
            const newX = panel.gridX + dir.dx;
            const newY = panel.gridY + dir.dy;
            const neighbor = this.getPanel(newX, newY);
            
            // 地上ユニットが通過可能かチェック（岩・池を避ける）
            if (neighbor && neighbor.isPassableForGround()) {
                neighbors.push(neighbor);
            }
        }

        return neighbors;
    }

    // グリッドの描画
    render(ctx) {
        // 全グリッドパネルを確実に描画（0,0から10,7まで）
        for (let y = 0; y < GRID_HEIGHT; y++) {
            for (let x = 0; x < GRID_WIDTH; x++) {
                this.renderPanel(ctx, this.grid[y][x]);
            }
        }

        // グリッド線を描画
        this.renderGridLines(ctx);
    }

    renderPanel(ctx, panel) {
        const bounds = panel.getBounds();
        
        // テクスチャ描画を使用
        this.renderTexturedTile(ctx, bounds.x, bounds.y, panel.type);

        // ホバー時のハイライト
        if (panel.hovered) {
            ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
            ctx.fillRect(bounds.x, bounds.y, bounds.width, bounds.height);
        }

        // 配置フィードバックのハイライト
        if (panel.highlighted) {
            if (panel.highlightType === 'valid') {
                ctx.fillStyle = 'rgba(46, 204, 113, 0.4)';
                ctx.strokeStyle = 'rgba(46, 204, 113, 0.8)';
                ctx.lineWidth = 3;
                ctx.fillRect(bounds.x, bounds.y, bounds.width, bounds.height);
                ctx.strokeRect(bounds.x, bounds.y, bounds.width, bounds.height);
            } else if (panel.highlightType === 'invalid') {
                ctx.fillStyle = 'rgba(231, 76, 60, 0.4)';
                ctx.strokeStyle = 'rgba(231, 76, 60, 0.8)';
                ctx.lineWidth = 3;
                ctx.fillRect(bounds.x, bounds.y, bounds.width, bounds.height);
                ctx.strokeRect(bounds.x, bounds.y, bounds.width, bounds.height);
            } else if (panel.highlightType === 'invalid-pulse') {
                // アニメーション効果を追加
                const time = Date.now() * 0.01;
                const alpha = 0.3 + 0.3 * Math.sin(time);
                ctx.fillStyle = `rgba(231, 76, 60, ${alpha})`;
                ctx.strokeStyle = 'rgba(231, 76, 60, 1)';
                ctx.lineWidth = 4;
                ctx.fillRect(bounds.x, bounds.y, bounds.width, bounds.height);
                ctx.strokeRect(bounds.x, bounds.y, bounds.width, bounds.height);
                
                // X印を描画して配置不可を明確に示す
                ctx.strokeStyle = 'rgba(255, 255, 255, 0.9)';
                ctx.lineWidth = 3;
                ctx.beginPath();
                ctx.moveTo(bounds.x + 10, bounds.y + 10);
                ctx.lineTo(bounds.x + bounds.width - 10, bounds.y + bounds.height - 10);
                ctx.moveTo(bounds.x + bounds.width - 10, bounds.y + 10);
                ctx.lineTo(bounds.x + 10, bounds.y + bounds.height - 10);
                ctx.stroke();
            }
        }

        // 配置可能パネルの特別表示
        if (panel.type === PANEL_TYPES.BUILDABLE && !panel.occupied && !panel.highlighted) {
            ctx.strokeStyle = PANEL_BORDER_COLORS[panel.type];
            ctx.lineWidth = 2;
            ctx.strokeRect(bounds.x + 1, bounds.y + 1, bounds.width - 2, bounds.height - 2);
        }

        // スタート/ゴールパネルのアイコン
        if (panel.type === PANEL_TYPES.START || panel.type === PANEL_TYPES.GOAL) {
            ctx.fillStyle = 'white';
            ctx.font = '24px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            const icon = panel.type === PANEL_TYPES.START ? '🚪' : '💎';
            ctx.fillText(icon, bounds.x + bounds.width / 2, bounds.y + bounds.height / 2);
        }
    }

    // テクスチャ描画メインメソッド
    renderTexturedTile(ctx, x, y, tileType) {
        // 座標をシードとして使用してランダムパターンを一定にする
        this.textureSeed = (x * 31 + y * 17) % 1000;
        this.textureRandom = 0;
        
        switch(tileType) {
            case PANEL_TYPES.BUILDABLE:
                this.drawGrassTexture(ctx, x, y); // 配置可能は草地ベース
                break;
            case PANEL_TYPES.ROAD:
                this.drawRoadTexture(ctx, x, y);
                break;
            case PANEL_TYPES.START:
            case PANEL_TYPES.GOAL:
                this.drawRoadTexture(ctx, x, y); // スタート・ゴールも道路ベース
                break;
            case PANEL_TYPES.BLOCKED:
                this.drawRockTexture(ctx, x, y);
                break;
            case PANEL_TYPES.ROCK:
                this.drawRockTexture(ctx, x, y);
                break;
            case PANEL_TYPES.WATER:
                this.drawWaterTexture(ctx, x, y);
                break;
            default:
                this.drawGrassTexture(ctx, x, y);
        }
    }

    // シードベースの疑似乱数生成
    seededRandom() {
        this.textureSeed = (this.textureSeed * 9301 + 49297) % 233280;
        return this.textureSeed / 233280;
    }

    // 草地テクスチャ描画（高品質版）
    drawGrassTexture(ctx, x, y) {
        // 多層グラデーション草地
        const gradient1 = ctx.createLinearGradient(x, y, x, y + PANEL_SIZE);
        gradient1.addColorStop(0, '#4a7c59');
        gradient1.addColorStop(0.3, '#228B22');
        gradient1.addColorStop(0.7, '#32CD32');
        gradient1.addColorStop(1, '#228B22');
        
        ctx.fillStyle = gradient1;
        ctx.fillRect(x, y, PANEL_SIZE, PANEL_SIZE);
        
        // 草の詳細テクスチャ
        ctx.fillStyle = '#2d5a27';
        for(let i = 0; i < 15; i++) {
            const grassX = x + this.seededRandom() * PANEL_SIZE;
            const grassY = y + this.seededRandom() * PANEL_SIZE;
            ctx.beginPath();
            ctx.arc(grassX, grassY, 1 + this.seededRandom(), 0, 2 * Math.PI);
            ctx.fill();
        }
        
        // 明るい草色のアクセント
        ctx.fillStyle = '#3d6b47';
        for(let i = 0; i < 12; i++) {
            const grassX = x + this.seededRandom() * PANEL_SIZE;
            const grassY = y + this.seededRandom() * PANEL_SIZE;
            ctx.beginPath();
            ctx.arc(grassX, grassY, 0.5 + this.seededRandom() * 0.5, 0, 2 * Math.PI);
            ctx.fill();
        }
        
        // 花の追加（30%の確率）
        if(this.seededRandom() < 0.3) {
            const flowerColors = ['#FF69B4', '#FFFF00', '#FF4500', '#9370DB'];
            ctx.fillStyle = flowerColors[Math.floor(this.seededRandom() * flowerColors.length)];
            ctx.beginPath();
            ctx.arc(x + this.seededRandom() * PANEL_SIZE, y + this.seededRandom() * PANEL_SIZE, 2, 0, 2 * Math.PI);
            ctx.fill();
        }
        
        // 土の部分
        ctx.fillStyle = '#8B4513';
        for(let i = 0; i < 4; i++) {
            const dirtX = x + this.seededRandom() * PANEL_SIZE;
            const dirtY = y + this.seededRandom() * PANEL_SIZE;
            ctx.fillRect(dirtX, dirtY, 2 + this.seededRandom() * 2, 1);
        }
    }

    // 道路テクスチャ描画（高品質版）
    drawRoadTexture(ctx, x, y) {
        // 石畳風道路
        const gradient = ctx.createRadialGradient(x + 32, y + 32, 0, x + 32, y + 32, 45);
        gradient.addColorStop(0, '#D2B48C');
        gradient.addColorStop(0.5, '#A0522D');
        gradient.addColorStop(1, '#8B4513');
        
        ctx.fillStyle = gradient;
        ctx.fillRect(x, y, PANEL_SIZE, PANEL_SIZE);
        
        // 石畳パターン
        ctx.strokeStyle = '#654321';
        ctx.lineWidth = 1;
        for(let i = 0; i < 4; i++) {
            for(let j = 0; j < 4; j++) {
                const stoneX = x + i * 16;
                const stoneY = y + j * 16;
                ctx.strokeRect(stoneX, stoneY, 16, 16);
                
                // 石の質感
                ctx.fillStyle = `rgba(139, 69, 19, ${0.1 + this.seededRandom() * 0.2})`;
                ctx.fillRect(stoneX + 2, stoneY + 2, 12, 12);
                
                // 石の凹凸表現
                ctx.fillStyle = `rgba(210, 180, 140, ${0.3 + this.seededRandom() * 0.3})`;
                ctx.fillRect(stoneX + 4, stoneY + 4, 8, 8);
            }
        }
        
        // 道路の境界線
        ctx.strokeStyle = '#654321';
        ctx.lineWidth = 2;
        ctx.strokeRect(x, y, PANEL_SIZE, PANEL_SIZE);
        
        // 砂利の質感
        ctx.fillStyle = '#CD853F';
        for(let i = 0; i < 25; i++) {
            const gravelX = x + this.seededRandom() * PANEL_SIZE;
            const gravelY = y + this.seededRandom() * PANEL_SIZE;
            ctx.beginPath();
            ctx.arc(gravelX, gravelY, 0.5 + this.seededRandom() * 0.5, 0, 2 * Math.PI);
            ctx.fill();
        }
        
        // 風化効果
        ctx.fillStyle = 'rgba(101, 67, 33, 0.3)';
        for(let i = 0; i < 8; i++) {
            const weatherX = x + this.seededRandom() * PANEL_SIZE;
            const weatherY = y + this.seededRandom() * PANEL_SIZE;
            ctx.fillRect(weatherX, weatherY, 3 + this.seededRandom() * 2, 1);
        }
    }

    // 岩場テクスチャ描画（高品質版）
    drawRockTexture(ctx, x, y) {
        // 岩場の複雑なテクスチャ
        const gradient = ctx.createRadialGradient(x + 32, y + 32, 0, x + 32, y + 32, 45);
        gradient.addColorStop(0, '#708090');
        gradient.addColorStop(0.5, '#2F4F4F');
        gradient.addColorStop(1, '#191970');
        
        ctx.fillStyle = gradient;
        ctx.fillRect(x, y, PANEL_SIZE, PANEL_SIZE);
        
        // 大きな岩の詳細
        for(let i = 0; i < 8; i++) {
            const rockX = x + this.seededRandom() * PANEL_SIZE;
            const rockY = y + this.seededRandom() * PANEL_SIZE;
            const size = 3 + this.seededRandom() * 8;
            
            ctx.fillStyle = '#696969';
            ctx.beginPath();
            ctx.arc(rockX, rockY, size, 0, 2 * Math.PI);
            ctx.fill();
            
            // ハイライト
            ctx.fillStyle = '#A9A9A9';
            ctx.beginPath();
            ctx.arc(rockX - 1, rockY - 1, size * 0.3, 0, 2 * Math.PI);
            ctx.fill();
            
            // 影
            ctx.fillStyle = '#2F2F2F';
            ctx.beginPath();
            ctx.arc(rockX + 1, rockY + 1, size * 0.2, 0, 2 * Math.PI);
            ctx.fill();
        }
        
        // 中程度の岩
        ctx.fillStyle = '#808080';
        for(let i = 0; i < 15; i++) {
            const rockX = x + this.seededRandom() * PANEL_SIZE;
            const rockY = y + this.seededRandom() * PANEL_SIZE;
            const size = 2 + this.seededRandom() * 4;
            ctx.beginPath();
            ctx.arc(rockX, rockY, size, 0, 2 * Math.PI);
            ctx.fill();
        }
        
        // 小さな砂利
        ctx.fillStyle = '#778899';
        for(let i = 0; i < 30; i++) {
            const gravelX = x + this.seededRandom() * PANEL_SIZE;
            const gravelY = y + this.seededRandom() * PANEL_SIZE;
            ctx.beginPath();
            ctx.arc(gravelX, gravelY, 0.5 + this.seededRandom() * 1, 0, 2 * Math.PI);
            ctx.fill();
        }
        
        // クラックパターン
        ctx.strokeStyle = '#1C1C1C';
        ctx.lineWidth = 1;
        for(let i = 0; i < 6; i++) {
            ctx.beginPath();
            ctx.moveTo(x + this.seededRandom() * PANEL_SIZE, y + this.seededRandom() * PANEL_SIZE);
            ctx.lineTo(x + this.seededRandom() * PANEL_SIZE, y + this.seededRandom() * PANEL_SIZE);
            ctx.stroke();
        }
        
        // 影の効果
        ctx.fillStyle = 'rgba(28, 28, 28, 0.4)';
        for(let i = 0; i < 6; i++) {
            const shadowX = x + this.seededRandom() * PANEL_SIZE;
            const shadowY = y + this.seededRandom() * PANEL_SIZE;
            ctx.fillRect(shadowX, shadowY, 4 + this.seededRandom() * 3, 1);
        }
    }

    // 水場テクスチャ描画（高品質版）
    drawWaterTexture(ctx, x, y) {
        // 水場の複雑なテクスチャ
        const gradient = ctx.createRadialGradient(x + 32, y + 32, 0, x + 32, y + 32, 45);
        gradient.addColorStop(0, '#1e90ff');
        gradient.addColorStop(0.5, '#0066cc');
        gradient.addColorStop(1, '#000080');
        
        ctx.fillStyle = gradient;
        ctx.fillRect(x, y, PANEL_SIZE, PANEL_SIZE);
        
        // 水の詳細テクスチャ
        ctx.fillStyle = '#000080';
        for(let i = 0; i < 15; i++) {
            const waterX = x + this.seededRandom() * PANEL_SIZE;
            const waterY = y + this.seededRandom() * PANEL_SIZE;
            ctx.beginPath();
            ctx.arc(waterX, waterY, 1 + this.seededRandom(), 0, 2 * Math.PI);
            ctx.fill();
        }
        
        // 明るい水色のアクセント
        ctx.fillStyle = '#1e90ff';
        for(let i = 0; i < 12; i++) {
            const waterX = x + this.seededRandom() * PANEL_SIZE;
            const waterY = y + this.seededRandom() * PANEL_SIZE;
            ctx.beginPath();
            ctx.arc(waterX, waterY, 0.5 + this.seededRandom() * 0.5, 0, 2 * Math.PI);
            ctx.fill();
        }
        
        // 魚の追加（30%の確率）
        if(this.seededRandom() < 0.3) {
            const fishColors = ['#FF69B4', '#FFFF00', '#FF4500', '#9370DB'];
            ctx.fillStyle = fishColors[Math.floor(this.seededRandom() * fishColors.length)];
            ctx.beginPath();
            ctx.arc(x + this.seededRandom() * PANEL_SIZE, y + this.seededRandom() * PANEL_SIZE, 2, 0, 2 * Math.PI);
            ctx.fill();
        }
        
        // 砂の部分
        ctx.fillStyle = '#8B4513';
        for(let i = 0; i < 4; i++) {
            const sandX = x + this.seededRandom() * PANEL_SIZE;
            const sandY = y + this.seededRandom() * PANEL_SIZE;
            ctx.fillRect(sandX, sandY, 2 + this.seededRandom() * 2, 1);
        }
    }

    renderGridLines(ctx) {
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
        ctx.lineWidth = 0.5;

        // 縦線（0から11まで = 12本）
        for (let x = 0; x <= GRID_WIDTH; x++) {
            const pixelX = x * PANEL_SIZE;
            ctx.beginPath();
            ctx.moveTo(pixelX, 0);
            ctx.lineTo(pixelX, GRID_HEIGHT * PANEL_SIZE);
            ctx.stroke();
        }

        // 横線（0から8まで = 9本）
        for (let y = 0; y <= GRID_HEIGHT; y++) {
            const pixelY = y * PANEL_SIZE;
            ctx.beginPath();
            ctx.moveTo(0, pixelY);
            ctx.lineTo(GRID_WIDTH * PANEL_SIZE, pixelY);
            ctx.stroke();
        }
        
        // 外周線を強調
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.lineWidth = 1;
        ctx.strokeRect(0.5, 0.5, (GRID_WIDTH * PANEL_SIZE) - 1, (GRID_HEIGHT * PANEL_SIZE) - 1);
    }

    // デバッグ情報の描画
    renderDebugInfo(ctx, showCoordinates = false) {
        if (!showCoordinates) return;

        ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        ctx.font = '10px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        for (let y = 0; y < GRID_HEIGHT; y++) {
            for (let x = 0; x < GRID_WIDTH; x++) {
                const bounds = this.grid[y][x].getBounds();
                ctx.fillText(
                    `${x},${y}`,
                    bounds.x + bounds.width / 2,
                    bounds.y + bounds.height / 2
                );
            }
        }
    }

    // 統計情報の取得
    getStats() {
        let buildableCount = 0;
        let occupiedCount = 0;

        for (let y = 0; y < GRID_HEIGHT; y++) {
            for (let x = 0; x < GRID_WIDTH; x++) {
                const panel = this.grid[y][x];
                if (panel.type === PANEL_TYPES.BUILDABLE) {
                    buildableCount++;
                    if (panel.occupied) {
                        occupiedCount++;
                    }
                }
            }
        }

        return {
            buildableCount,
            occupiedCount,
            availableCount: buildableCount - occupiedCount
        };
    }

    // デバッグ用：マップをコンソールに出力
    debugPrintMap() {
        console.log('🔍 現在のマップ構造詳細:');
        console.log(`📐 グリッドサイズ: ${GRID_WIDTH} x ${GRID_HEIGHT}`);
        console.log(`🗺️ 現在のマップ番号: ${this.currentMap}`);
        
        // タイプ別カウント
        let typeCount = {};
        let detailedGrid = [];
        
        for (let y = 0; y < GRID_HEIGHT; y++) {
            let row = '';
            let detailRow = [];
            for (let x = 0; x < GRID_WIDTH; x++) {
                const panel = this.grid[y][x];
                if (!panel) {
                    row += 'N ';
                    detailRow.push('NULL');
                    continue;
                }
                
                typeCount[panel.type] = (typeCount[panel.type] || 0) + 1;
                detailRow.push(panel.type);
                
                if (panel.type === PANEL_TYPES.START) row += 'S ';
                else if (panel.type === PANEL_TYPES.GOAL) row += 'G ';
                else if (panel.type === PANEL_TYPES.ROAD) row += '- ';
                else if (panel.type === PANEL_TYPES.ROCK) row += 'R ';
                else if (panel.type === PANEL_TYPES.WATER) row += 'W ';
                else if (panel.type === PANEL_TYPES.BLOCKED) row += 'X ';
                else if (panel.type === PANEL_TYPES.BUILDABLE) row += '. ';
                else row += '? ';
            }
            console.log(`Row ${y}: ${row}`);
            detailedGrid.push(detailRow);
        }
        
        console.log('📊 タイプ別カウント:', typeCount);
        console.log('🔍 詳細グリッド:', detailedGrid);
        
        // PANEL_TYPES定数の確認
        console.log('🏷️ PANEL_TYPES定数:', PANEL_TYPES);
    }

    // 指定されたスタート地点からのパスを生成
    generatePathFromStart(startPanel) {
        const goalPanels = this.findAllPanelsByType(PANEL_TYPES.GOAL);
        
        if (!startPanel || goalPanels.length === 0) {
            console.error('❌ スタートまたはゴールパネルが見つかりません');
            console.log('スタートパネル:', startPanel);
            console.log('ゴールパネル数:', goalPanels.length);
            return [];
        }

        // 複数のゴールがある場合は、最も近いゴールを選択
        let targetGoal = goalPanels[0];
        let shortestDistance = Infinity;
        
        if (goalPanels.length > 1) {
            for (const goalPanel of goalPanels) {
                const distance = Math.abs(startPanel.gridX - goalPanel.gridX) + 
                               Math.abs(startPanel.gridY - goalPanel.gridY);
                if (distance < shortestDistance) {
                    shortestDistance = distance;
                    targetGoal = goalPanel;
                }
            }
            console.log(`🎯 複数ゴール検出: ${goalPanels.length}個中、最も近いゴール(${targetGoal.gridX}, ${targetGoal.gridY})を選択`);
        }

        console.log(`🗺️ 個別パス生成: スタート(${startPanel.gridX}, ${startPanel.gridY}) → ゴール(${targetGoal.gridX}, ${targetGoal.gridY})`);
        
        const path = this.findPathForGround(startPanel, targetGoal);
        
        if (path.length === 0) {
            console.error('❌ 個別パスが見つかりません');
            console.log('デバッグ情報:');
            console.log('- スタートパネルタイプ:', startPanel.type);
            console.log('- ゴールパネルタイプ:', targetGoal.type);
            console.log('- スタート座標:', `(${startPanel.gridX}, ${startPanel.gridY})`);
            console.log('- ゴール座標:', `(${targetGoal.gridX}, ${targetGoal.gridY})`);
            this.debugPrintMap();
        } else {
            console.log(`✅ 個別パス生成成功: ${path.length}ポイント`);
        }

        return path;
    }
} 