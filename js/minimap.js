// ミニマップ機能
class MiniMapRenderer {
    constructor(game) {
        this.game = game;
        this.canvas = null;
        this.ctx = null;
        this.currentRouteType = null;
        this.animationId = null;
        this.lastUpdateTime = 0;
        
        this.initializeMiniMap();
    }

    // ミニマップの初期化
    initializeMiniMap() {
        this.canvas = document.getElementById('miniMapCanvas');
        if (this.canvas) {
            this.ctx = this.canvas.getContext('2d');
            console.log("🗺️ ミニマップキャンバス初期化完了");
            
            // ゲームのグリッドシステムが初期化されるまで待機
            if (this.game.gridSystem && this.game.gridSystem.currentMap) {
                this.drawBasicMiniMap();
            } else {
                // グリッドシステムの初期化を待つ
                setTimeout(() => {
                    if (this.game.gridSystem) {
                        this.drawBasicMiniMap();
                        console.log("🗺️ 遅延ミニマップ初期化完了");
                    }
                }, 100);
            }
        } else {
            console.error("❌ ミニマップキャンバスが見つかりません");
        }
    }

    // ルート表示
    showRoute(routeType) {
        console.log(`🗺️ ミニマップルート表示: ${routeType}`);
        
        this.currentRouteType = routeType;
        
        // アニメーションを開始
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
        }
        
        this.animate();
    }

    // ルート表示をクリア
    clearRoute() {
        console.log("🧹 ミニマップルートクリア");
        
        this.currentRouteType = null;
        
        // アニメーションを停止
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }
        
        // 基本マップを再描画
        this.drawBasicMiniMap();
    }

    // アニメーションループ
    animate() {
        const currentTime = Date.now();
        
        // 基本マップを描画
        this.drawBasicMiniMap();
        
        // ルートを描画
        if (this.currentRouteType === 'ground') {
            this.drawDynamicGroundRoute(currentTime);
        } else if (this.currentRouteType === 'air') {
            this.drawDynamicAirRoute(currentTime);
        }
        
        // キャラクターを描画
        this.drawCharacters();
        
        // 次のフレームをリクエスト
        this.animationId = requestAnimationFrame(() => this.animate());
    }

    // 基本ミニマップを描画
    drawBasicMiniMap() {
        if (!this.ctx || !this.game.gridSystem) return;
        
        const width = this.canvas.width;
        const height = this.canvas.height;
        const cellWidth = width / GRID_WIDTH;
        const cellHeight = height / GRID_HEIGHT;
        
        // 背景をクリア
        this.ctx.clearRect(0, 0, width, height);
        
        // グリッドを描画
        for (let y = 0; y < GRID_HEIGHT; y++) {
            for (let x = 0; x < GRID_WIDTH; x++) {
                const panel = this.game.gridSystem.getPanel(x, y);
                if (!panel) continue;
                
                const pixelX = x * cellWidth;
                const pixelY = y * cellHeight;
                
                // パネルタイプに応じて色を設定
                let color = '#2d5016'; // デフォルト（草地）
                
                switch (panel.type) {
                    case PANEL_TYPES.START:
                        color = '#e74c3c'; // 赤（スタート）
                        break;
                    case PANEL_TYPES.GOAL:
                        color = '#3498db'; // 青（ゴール）
                        break;
                    case PANEL_TYPES.ROAD:
                        color = '#8b4513'; // 茶色（道路）
                        break;
                    case PANEL_TYPES.ROCK:
                        color = '#7f8c8d'; // 灰色（岩）
                        break;
                    case PANEL_TYPES.WATER:
                        color = '#3498db'; // 青（水）
                        break;
                    case PANEL_TYPES.BUILDABLE:
                        color = '#27ae60'; // 緑（建設可能）
                        break;
                }
                
                // パネルを描画
                this.ctx.fillStyle = color;
                this.ctx.fillRect(pixelX, pixelY, cellWidth, cellHeight);
                
                // 境界線を描画
                this.ctx.strokeStyle = 'rgba(0, 0, 0, 0.2)';
                this.ctx.lineWidth = 0.5;
                this.ctx.strokeRect(pixelX, pixelY, cellWidth, cellHeight);
            }
        }
        
        // スタートとゴールにアイコンを描画
        this.drawStartGoalIcons(cellWidth, cellHeight);
    }

    // スタートとゴールのアイコンを描画
    drawStartGoalIcons(cellWidth, cellHeight) {
        if (!this.game.gridSystem) return;
        
        // スタート地点
        const startPanels = this.game.gridSystem.findAllPanelsByType(PANEL_TYPES.START);
        startPanels.forEach(panel => {
            const x = panel.gridX * cellWidth + cellWidth / 2;
            const y = panel.gridY * cellHeight + cellHeight / 2;
            
            this.ctx.fillStyle = 'white';
            this.ctx.font = `${Math.min(cellWidth, cellHeight) * 0.6}px Arial`;
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';
            this.ctx.fillText('S', x, y);
        });
        
        // ゴール地点
        const goalPanel = this.game.gridSystem.findPanelByType(PANEL_TYPES.GOAL);
        if (goalPanel) {
            const x = goalPanel.gridX * cellWidth + cellWidth / 2;
            const y = goalPanel.gridY * cellHeight + cellHeight / 2;
            
            this.ctx.fillStyle = 'white';
            this.ctx.font = `${Math.min(cellWidth, cellHeight) * 0.6}px Arial`;
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';
            this.ctx.fillText('G', x, y);
        }
    }

    // 動的地上ルートを描画
    drawDynamicGroundRoute(currentTime) {
        try {
            if (!this.game.gridSystem) return;
            
            const width = this.canvas.width;
            const height = this.canvas.height;
            const cellWidth = width / GRID_WIDTH;
            const cellHeight = height / GRID_HEIGHT;
            
            // 全てのスタート地点からのルートを描画
            const startPanels = this.game.gridSystem.findAllPanelsByType(PANEL_TYPES.START);
            const goalPanel = this.game.gridSystem.findPanelByType(PANEL_TYPES.GOAL);
            
            if (startPanels.length === 0 || !goalPanel) {
                console.warn("⚠️ スタートまたはゴール地点が見つかりません");
                return;
            }
            
            // ルートごとに異なる色を使用
            const routeColors = ['#00bcd4', '#ff9800', '#9c27b0', '#4caf50'];
            
            startPanels.forEach((startPanel, index) => {
                const path = this.game.gridSystem.generatePathFromStart(startPanel);
                
                if (path && path.length > 1) {
                    const color = routeColors[index % routeColors.length];
                    this.drawAnimatedRouteLine(path, color, currentTime + index * 500, cellWidth, cellHeight);
                }
            });
            
        } catch (error) {
            console.error("❌ 動的地上ルート描画エラー:", error);
        }
    }

    // 動的空中ルートを描画
    drawDynamicAirRoute(currentTime) {
        try {
            if (!this.game.gridSystem) return;
            
            const width = this.canvas.width;
            const height = this.canvas.height;
            const cellWidth = width / GRID_WIDTH;
            const cellHeight = height / GRID_HEIGHT;
            
            // 全てのスタート地点とゴール地点を取得
            const startPanels = this.game.gridSystem.findAllPanelsByType(PANEL_TYPES.START);
            const goalPanel = this.game.gridSystem.findPanelByType(PANEL_TYPES.GOAL);
            
            if (startPanels.length === 0 || !goalPanel) {
                console.warn("⚠️ スタートまたはゴール位置が見つかりません");
                return;
            }
            
            const goalPos = goalPanel.getPixelPosition();
            const goalX = goalPos.x / PANEL_SIZE * cellWidth;
            const goalY = goalPos.y / PANEL_SIZE * cellHeight;
            
            // 空中ルートの色
            const airRouteColors = ['#e91e63', '#9c27b0', '#673ab7', '#3f51b5'];
            
            startPanels.forEach((startPanel, index) => {
                const startPos = startPanel.getPixelPosition();
                const startX = startPos.x / PANEL_SIZE * cellWidth;
                const startY = startPos.y / PANEL_SIZE * cellHeight;
                
                const color = airRouteColors[index % airRouteColors.length];
                
                // 直線的な空中ルートを描画
                this.drawAnimatedAirLine(startX, startY, goalX, goalY, color, currentTime + index * 300);
            });
            
        } catch (error) {
            console.error("❌ 動的空中ルート描画エラー:", error);
        }
    }

    // アニメーション付きルート線を描画
    drawAnimatedRouteLine(path, color, timeOffset, cellWidth, cellHeight) {
        if (!path || path.length < 2) return;
        
        const time = (Date.now() + timeOffset) * 0.003;
        
        // パスをミニマップ座標に変換
        const miniMapPath = path.map(point => {
            const gridPos = this.game.gridSystem.pixelToGrid(point.x, point.y);
            return {
                x: gridPos.gridX * cellWidth + cellWidth / 2,
                y: gridPos.gridY * cellHeight + cellHeight / 2
            };
        });
        
        // 基本線を描画
        this.ctx.save();
        this.ctx.strokeStyle = color;
        this.ctx.lineWidth = 3;
        this.ctx.lineCap = 'round';
        this.ctx.lineJoin = 'round';
        this.ctx.globalAlpha = 0.8;
        
        this.ctx.beginPath();
        this.ctx.moveTo(miniMapPath[0].x, miniMapPath[0].y);
        
        for (let i = 1; i < miniMapPath.length; i++) {
            this.ctx.lineTo(miniMapPath[i].x, miniMapPath[i].y);
        }
        
        this.ctx.stroke();
        
        // アニメーション効果（流れる点線）
        this.ctx.strokeStyle = '#ffffff';
        this.ctx.lineWidth = 1.5;
        this.ctx.globalAlpha = 0.9;
        this.ctx.setLineDash([4, 4]);
        this.ctx.lineDashOffset = -time * 15;
        
        this.ctx.beginPath();
        this.ctx.moveTo(miniMapPath[0].x, miniMapPath[0].y);
        
        for (let i = 1; i < miniMapPath.length; i++) {
            this.ctx.lineTo(miniMapPath[i].x, miniMapPath[i].y);
        }
        
        this.ctx.stroke();
        
        this.ctx.setLineDash([]);
        this.ctx.restore();
        
        // 方向矢印を描画
        this.drawMiniMapArrows(miniMapPath, color, time);
    }

    // アニメーション付き空中線を描画
    drawAnimatedAirLine(startX, startY, goalX, goalY, color, timeOffset) {
        const time = (Date.now() + timeOffset) * 0.004;
        
        // ベジェ曲線で滑らかな空中ルートを描画
        const midX = (startX + goalX) / 2;
        const midY = (startY + goalY) / 2 - 20; // 少し上に湾曲
        
        this.ctx.save();
        this.ctx.strokeStyle = color;
        this.ctx.lineWidth = 2.5;
        this.ctx.lineCap = 'round';
        this.ctx.globalAlpha = 0.8;
        
        // 影効果
        this.ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
        this.ctx.shadowBlur = 2;
        
        this.ctx.beginPath();
        this.ctx.moveTo(startX, startY);
        this.ctx.quadraticCurveTo(midX, midY, goalX, goalY);
        this.ctx.stroke();
        
        // アニメーション効果
        this.ctx.shadowColor = 'transparent';
        this.ctx.strokeStyle = '#ffffff';
        this.ctx.lineWidth = 1;
        this.ctx.globalAlpha = 0.9;
        this.ctx.setLineDash([3, 3]);
        this.ctx.lineDashOffset = -time * 20;
        
        this.ctx.beginPath();
        this.ctx.moveTo(startX, startY);
        this.ctx.quadraticCurveTo(midX, midY, goalX, goalY);
        this.ctx.stroke();
        
        this.ctx.setLineDash([]);
        this.ctx.restore();
        
        // 空中ルート用の矢印を描画
        this.drawAirRouteArrows(startX, startY, midX, midY, goalX, goalY, color, time);
    }

    // ミニマップ用矢印を描画
    drawMiniMapArrows(path, color, time) {
        if (!path || path.length < 2) return;
        
        const arrowSpacing = 30; // ミニマップ用に調整
        let totalDistance = 0;
        
        // パス全体の距離を計算
        for (let i = 1; i < path.length; i++) {
            const dx = path[i].x - path[i-1].x;
            const dy = path[i].y - path[i-1].y;
            totalDistance += Math.sqrt(dx * dx + dy * dy);
        }
        
        const arrowCount = Math.floor(totalDistance / arrowSpacing);
        
        for (let a = 0; a < arrowCount; a++) {
            const targetDistance = (a + 0.5) * arrowSpacing + (time * 15) % arrowSpacing;
            let currentDistance = 0;
            
            for (let i = 1; i < path.length; i++) {
                const dx = path[i].x - path[i-1].x;
                const dy = path[i].y - path[i-1].y;
                const segmentDistance = Math.sqrt(dx * dx + dy * dy);
                
                if (currentDistance + segmentDistance >= targetDistance) {
                    const t = (targetDistance - currentDistance) / segmentDistance;
                    const arrowX = path[i-1].x + dx * t;
                    const arrowY = path[i-1].y + dy * t;
                    const angle = Math.atan2(dy, dx);
                    
                    this.drawMiniMapArrow(arrowX, arrowY, angle, color, time);
                    break;
                }
                
                currentDistance += segmentDistance;
            }
        }
    }

    // 空中ルート用矢印を描画
    drawAirRouteArrows(startX, startY, midX, midY, goalX, goalY, color, time) {
        // ベジェ曲線上の複数点に矢印を配置
        const arrowCount = 3;
        
        for (let i = 0; i < arrowCount; i++) {
            const t = (i + 1) / (arrowCount + 1) + Math.sin(time + i) * 0.1;
            
            // ベジェ曲線上の点を計算
            const x = Math.pow(1-t, 2) * startX + 2 * (1-t) * t * midX + Math.pow(t, 2) * goalX;
            const y = Math.pow(1-t, 2) * startY + 2 * (1-t) * t * midY + Math.pow(t, 2) * goalY;
            
            // 接線の角度を計算
            const dx = 2 * (1-t) * (midX - startX) + 2 * t * (goalX - midX);
            const dy = 2 * (1-t) * (midY - startY) + 2 * t * (goalY - midY);
            const angle = Math.atan2(dy, dx);
            
            this.drawMiniMapArrow(x, y, angle, color, time + i);
        }
    }

    // ミニマップ用の個別矢印を描画
    drawMiniMapArrow(x, y, angle, color, time) {
        this.ctx.save();
        this.ctx.translate(x, y);
        this.ctx.rotate(angle);
        
        const scale = 0.7 + 0.3 * Math.sin(time * 2);
        const alpha = 0.8 + 0.2 * Math.sin(time * 3);
        
        this.ctx.scale(scale, scale);
        this.ctx.globalAlpha = alpha;
        
        const arrowSize = 4; // ミニマップ用に小さく
        
        // 矢印本体
        this.ctx.fillStyle = color;
        this.ctx.beginPath();
        this.ctx.moveTo(arrowSize, 0);
        this.ctx.lineTo(-arrowSize/2, arrowSize/2);
        this.ctx.lineTo(-arrowSize/2, -arrowSize/2);
        this.ctx.closePath();
        this.ctx.fill();
        
        // 矢印の輪郭
        this.ctx.strokeStyle = '#ffffff';
        this.ctx.lineWidth = 0.5;
        this.ctx.stroke();
        
        this.ctx.restore();
    }

    // キャラクターを描画
    drawCharacters() {
        if (!this.game.characters || !Array.isArray(this.game.characters)) return;
        
        const width = this.canvas.width;
        const height = this.canvas.height;
        const cellWidth = width / GRID_WIDTH;
        const cellHeight = height / GRID_HEIGHT;
        
        this.game.characters.forEach(character => {
            if (!character) return;
            
            // キャラクターの位置をミニマップ座標に変換
            const gridPos = this.game.gridSystem.pixelToGrid(character.x, character.y);
            const miniX = gridPos.gridX * cellWidth + cellWidth / 2;
            const miniY = gridPos.gridY * cellHeight + cellHeight / 2;
            
            // キャラクタータイプに応じて色を設定
            let characterColor = '#f39c12'; // デフォルト
            
            switch (character.type) {
                case 'warrior':
                    characterColor = '#e74c3c'; // 赤
                    break;
                case 'archer':
                    characterColor = '#27ae60'; // 緑
                    break;
                case 'wizard':
                    characterColor = '#9b59b6'; // 紫
                    break;
                case 'timemage':
                    characterColor = '#3498db'; // 青
                    break;
                case 'treasurehunter':
                    characterColor = '#f1c40f'; // 黄
                    break;
            }
            
            // キャラクターを円で描画
            this.ctx.fillStyle = characterColor;
            this.ctx.beginPath();
            this.ctx.arc(miniX, miniY, Math.min(cellWidth, cellHeight) * 0.2, 0, Math.PI * 2);
            this.ctx.fill();
            
            // 輪郭を描画
            this.ctx.strokeStyle = '#ffffff';
            this.ctx.lineWidth = 1;
            this.ctx.stroke();
        });
    }

    // 更新処理
    update() {
        // 基本マップを更新（ルート表示中でない場合のみ）
        if (!this.currentRouteType) {
            this.drawBasicMiniMap();
            this.drawCharacters();
        }
    }
} 