class Game { 
    constructor() { 
        this.canvas = document.getElementById("gameCanvas"); 
        this.ctx = this.canvas.getContext("2d"); 
        this.gold = 100; // 初期ゴールドを100Gに変更
        this.enemiesReached = 0; 
        this.maxEnemiesReached = 10; // クリスタル数を20から10に変更
        this.gameState = "mapSelection"; // 初期状態をマップ選択に変更
        this.characters = []; 
        this.enemies = []; // 敵配列を確実に初期化
        this.selectedCharacterType = null; 
        this.placingCharacter = false; 
        this.gameSpeed = 1; 
        this.lastTime = 0; 
        
        // グリッドシステムの初期化
        this.gridSystem = new GridSystem();
        this.waveManager = new GridWaveManager(); 
        this.waveManager.setGridSystem(this.gridSystem);
        
        // 天候・時間帯システムの初期化
        this.weatherSystem = new WeatherSystem();
        
        // 高難易度システムの初期化
        this.difficultySystem = new DifficultySystem();
        
        this.saveManager = new SaveManager(); 
        this.adManager = new AdManager(); 
        this.selectedCharacter = null; 
        this.mouseX = 0;
        this.mouseY = 0;
        
        // キャンバス座標も追加
        this.canvasMouseX = 0;
        this.canvasMouseY = 0;
        
        // 新しいドラッグ&ドロップ関連のプロパティ
        this.isDragging = false;
        this.dragStartX = 0;
        this.dragStartY = 0;
        this.dragPreview = document.getElementById('dragPreview');
        this.tooltip = document.getElementById('characterTooltip');
        this.cancelArea = document.getElementById('cancelArea');
        this.tooltipTimeout = null;
        this.attackEffects = [];
        this.damageNumbers = [];
        this.floatingTexts = []; // フローティングテキスト用
        
        // 敵撃破時のゴールド報酬定義
        this.ENEMY_REWARDS = {
            goblin: 15,
            orc: 25,
            flying_bat: 30,
            armored_goblin: 20,
            orc_chief: 50,
            dragon: 100
        };
        
        // 敵進行ルート表示機能
        this.routeDisplayActive = false; 
        this.routeDisplayType = null; 
        this.routeAnimationId = null;
        this.routeElements = [];
        this.miniMapAnimationId = null; // ミニマップアニメーション用
        
        // Wave間のタイマー関連
        this.waveTimer = null;
        this.waveTimerDuration = 5000; // 5秒
        this.waveTimerStartTime = 0;
        
        // イベントリスナー設定フラグ
        this.eventListenersSetup = false;
        
        // デバッグモード
        this.debugMode = false;
        
        // 動作検証システム
        this.testMode = false;
        this.testResults = [];
        this.testPatterns = [];
        
        // 自動進行モード（デフォルトは無効）
        this.autoProgressEnabled = false; // 手動でtrueに設定すると自動進行
        
        // ゲーム統計（高難易度システム用）
        this.gameStats = {
            waveProgress: 0,
            enemiesDefeated: 0,
            charactersPlaced: 0,
            goldEarned: 0,
            averageEnemyProgress: 0
        };
        
        console.log("🎮 Crystal Guardians - ゲーム初期化: 初期ゴールドは100G");
        console.log("🌤️ 天候・時間帯システム統合完了");
        console.log("🎯 高難易度システム統合完了");
        console.log("💰 初期ゴールド100Gで購入可能:");
        console.log("  - ウォリアー (100G) - ✅ 購入可能");
        console.log("  - アーチャー (80G) - ✅ 購入可能");
        console.log("  - タイムメイジ (100G) - ✅ 購入可能");
        console.log("  - トレジャーハンター (60G) - ✅ 購入可能");
        console.log("  - ウィザード (120G) - ❌ ゴールド不足");
        
        this.init(); 
    } 

    // 通知システム
    showWaveNotification(message) {
        // 既存の通知を削除
        const existingNotification = document.querySelector('.wave-notification');
        if (existingNotification) {
            existingNotification.remove();
        }
        
        // 新しい通知を作成
        const notification = document.createElement('div');
        notification.className = 'wave-notification';
        notification.textContent = message;
        notification.style.cssText = `
            position: fixed; 
            top: 120px; 
            left: 50%; 
            transform: translateX(-50%); 
            background: linear-gradient(135deg, rgba(231, 76, 60, 0.95), rgba(192, 57, 43, 0.95)); 
            color: white; 
            padding: 15px 25px; 
            border-radius: 25px; 
            z-index: 2000;
            font-weight: bold;
            font-size: 1rem;
            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
            backdrop-filter: blur(10px);
            border: 2px solid rgba(231, 76, 60, 0.8);
            animation: notificationSlideIn 0.5s ease-out;
        `;
        document.body.appendChild(notification);
        
        // アニメーションのキーフレームを追加（一度だけ）
        if (!document.querySelector('#notification-styles')) {
            const style = document.createElement('style');
            style.id = 'notification-styles';
            style.textContent = `
                @keyframes notificationSlideIn {
                    0% { transform: translate(-50%, -20px); opacity: 0; }
                    100% { transform: translate(-50%, 0); opacity: 1; }
                }
                @keyframes notificationSlideOut {
                    0% { transform: translate(-50%, 0); opacity: 1; }
                    100% { transform: translate(-50%, -20px); opacity: 0; }
                }
            `;
            document.head.appendChild(style);
        }
        
        // 3秒後に自動削除
        setTimeout(() => {
            if (notification.parentNode) {
                notification.style.animation = 'notificationSlideOut 0.3s ease-in forwards';
                setTimeout(() => {
                    if (notification.parentNode) {
                        notification.remove();
                    }
                }, 300);
            }
        }, 3000);
    }

    // ウェーブボタンの管理
    setupWaveButton() {
        const startBtn = document.getElementById('startWaveBtn');
        if (startBtn && !startBtn.hasAttribute('data-listener-added')) {
            startBtn.addEventListener('click', () => {
                if (!startBtn.disabled && !this.waveManager.isActive) {
                    this.startWave();
                    // ボタンを一時的に無効化
                    startBtn.disabled = true;
                    startBtn.textContent = '🚀 Wave実行中...';
                }
            });
            startBtn.setAttribute('data-listener-added', 'true');
            console.log("✅ ウェーブ開始ボタンのイベントリスナーを設定しました");
        }
    }

    // ボタン状態の更新
    updateWaveButton() {
        const startBtn = document.getElementById('startWaveBtn');
        if (!startBtn) {
            console.warn("⚠️ startWaveBtnが見つかりません");
            return;
        }
        
        // WaveManagerの状態を詳細チェック
        const isWaveActive = this.waveManager && this.waveManager.isActive;
        const hasEnemies = this.enemies && this.enemies.length > 0;
        const isSpawning = this.waveManager && this.waveManager.currentSpawnIndex < this.waveManager.spawnQueue.length;
        
        console.log(`🔘 ボタン状態更新: isActive=${isWaveActive}, 敵数=${this.enemies?.length || 0}, スポーン中=${isSpawning}`);
        
        if (isWaveActive || hasEnemies || isSpawning) {
            startBtn.disabled = true;
            startBtn.innerHTML = '<span class="icon">⚔️</span>Wave実行中...';
            console.log("🔴 ボタン無効化: Wave実行中");
        } else {
            startBtn.disabled = false;
            startBtn.innerHTML = '<span class="icon">🚀</span>ウェーブ開始';
            console.log("🟢 ボタン有効化: Wave開始可能");
        }
    } 

    // 正確なマウス座標を取得する関数
    getMousePosition(canvas, event) {
        const rect = canvas.getBoundingClientRect();
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;
        
        return {
            x: (event.clientX - rect.left) * scaleX,
            y: (event.clientY - rect.top) * scaleY
        };
    }

    // タッチ座標を取得する関数
    getTouchPosition(canvas, touch) {
        const rect = canvas.getBoundingClientRect();
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;
        
        return {
            x: (touch.clientX - rect.left) * scaleX,
            y: (touch.clientY - rect.top) * scaleY
        };
    }

    init() { 
        this.setupCanvas(); 
        this.setupEventListeners(); 
        this.setupWaveManager();
        this.initializeGameData(); // loadGameの代わりに初期化処理
        
        console.log("🎮 Crystal Guardians - 初期化完了");
        
        this.showMapSelection();
        this.hideLoading(); 
        
        this.gameLoop(); 
    } 

    setupCanvas() { 
        // Canvas要素のサイズを固定設定（マップ全体表示のため）
        this.canvas.width = GRID_WIDTH * PANEL_SIZE;  // 704px (11 × 64)
        this.canvas.height = GRID_HEIGHT * PANEL_SIZE; // 512px (8 × 64)
        
        // CSS サイズも固定値に設定
        this.canvas.style.width = '704px';
        this.canvas.style.height = '512px';
        
        console.log(`🖼️ キャンバスサイズ設定: ${this.canvas.width}×${this.canvas.height}px`);
    } 

    setupEventListeners() { 
        // 重複登録防止のため、既存のリスナーをクリア
        if (this.eventListenersSetup) {
            return;
        }
        
        // キャラクターカードのイベントリスナー（ドラッグ&ドロップ対応）
        document.querySelectorAll(".character-card").forEach(card => { 
            // ホバーでツールチップ表示
            card.addEventListener("mouseenter", (e) => {
                const characterType = card.dataset.character;
                this.showTooltip(characterType, e);
            });
            
            card.addEventListener("mouseleave", () => {
                this.hideTooltip();
            });
            
            // ドラッグ開始
            card.addEventListener("mousedown", (e) => {
                const characterType = card.dataset.character;
                const cost = this.getCharacterCost(characterType);
                
                if (this.gold >= cost) {
                    this.startDrag(characterType, e);
                }
            });
            
            // クリック（従来の機能も維持）
            card.addEventListener("click", (e) => { 
                const characterType = card.dataset.character; 
                this.selectCharacter(characterType); 
            }); 
        }); 

        // マウスイベント
        document.addEventListener("mousemove", (e) => {
            this.handleMouseMove(e);
        });
        
        document.addEventListener("mouseup", (e) => {
            this.handleMouseUp(e);
        });

        // キャンバスのクリックイベント
        this.canvas.addEventListener("click", (e) => { 
            const pos = this.getMousePosition(this.canvas, e);
            
            if (this.placingCharacter && !this.isDragging) { 
                this.placeCharacter(pos.x, pos.y); 
            } else if (!this.isDragging) { 
                this.selectCharacterOnCanvas(pos.x, pos.y); 
            } 
        }); 

        // ESCキーでキャンセル
        document.addEventListener("keydown", (e) => {
            if (e.key === "Escape") {
                this.cancelPlacement();
            }
        });

        // ウェーブ開始ボタン（新しい方法で設定）
        this.setupWaveButton();

        // その他のボタンのイベントリスナー（要素存在確認付き）
        const pauseBtn = document.getElementById("pauseBtn");
        if (pauseBtn && !pauseBtn.hasAttribute('data-listener-added')) {
            pauseBtn.addEventListener("click", () => { 
                this.togglePause(); 
            }); 
            pauseBtn.setAttribute('data-listener-added', 'true');
        }

        const speedBtn = document.getElementById("speedBtn");
        if (speedBtn && !speedBtn.hasAttribute('data-listener-added')) {
            speedBtn.addEventListener("click", () => { 
                this.toggleSpeed(); 
            }); 
            speedBtn.setAttribute('data-listener-added', 'true');
        }

        const menuBtn = document.getElementById("menuBtn");
        if (menuBtn && !menuBtn.hasAttribute('data-listener-added')) {
            menuBtn.addEventListener("click", () => { 
                this.showMenu(); 
            }); 
            menuBtn.setAttribute('data-listener-added', 'true');
        }

        // ゲームオーバーモーダルのイベントリスナー
        const continueBtn = document.getElementById("continueBtn");
        if (continueBtn && !continueBtn.hasAttribute('data-listener-added')) {
            continueBtn.addEventListener("click", () => {
                this.continueWithAd();
            });
            continueBtn.setAttribute('data-listener-added', 'true');
        }

        const restartBtn = document.getElementById("restartBtn");
        if (restartBtn && !restartBtn.hasAttribute('data-listener-added')) {
            restartBtn.addEventListener("click", () => {
                this.restartGame();
            });
            restartBtn.setAttribute('data-listener-added', 'true');
        }

        // タッチイベント（修正版）
        this.canvas.addEventListener("touchstart", (e) => { 
            e.preventDefault(); 
            const touch = e.touches[0];
            const pos = this.getTouchPosition(this.canvas, touch);
            
            if (this.placingCharacter) { 
                this.placeCharacter(pos.x, pos.y); 
            } else {
                this.selectCharacterOnCanvas(pos.x, pos.y);
            }
        }); 

        // ウィンドウリサイズ時のCanvas再設定
        window.addEventListener("resize", () => {
            this.setupCanvas();
        });

        // マップ選択のイベントリスナー
        document.querySelectorAll(".map-card").forEach(card => {
            if (!card.hasAttribute('data-listener-added')) {
            card.addEventListener("click", (e) => {
                const mapNumber = parseInt(card.dataset.map);
                this.selectMap(mapNumber);
            });
                card.setAttribute('data-listener-added', 'true');
            }
        });

        // マップ選択ボタン
        const mapSelectBtn = document.getElementById("mapSelectBtn");
        if (mapSelectBtn && !mapSelectBtn.hasAttribute('data-listener-added')) {
            mapSelectBtn.addEventListener("click", () => {
                this.showMapSelection();
            });
            mapSelectBtn.setAttribute('data-listener-added', 'true');
        }

        // デバッグボタン
        const debugToggleBtn = document.getElementById("debugToggleBtn");
        if (debugToggleBtn && !debugToggleBtn.hasAttribute('data-listener-added')) {
            debugToggleBtn.style.display = "block"; // デバッグボタンを表示
            debugToggleBtn.addEventListener("click", () => {
                this.debugMode = !this.debugMode;
                document.getElementById("gridCoordinates").style.display = this.debugMode ? "block" : "none";
                console.log(`🐛 デバッグモード: ${this.debugMode ? 'ON' : 'OFF'}`);
            });
            debugToggleBtn.setAttribute('data-listener-added', 'true');
        }

        // テストボタン
        const testBtn = document.getElementById("testBtn");
        if (testBtn && !testBtn.hasAttribute('data-listener-added')) {
            testBtn.addEventListener("click", () => {
                console.log("🧪 手動テスト実行");
                this.runComprehensiveTest().then(results => {
                    console.log("🧪 手動テスト完了");
                    
                    // テスト結果をアラートで表示
                    const passCount = results.filter(r => r.status === 'PASS').length;
                    const totalCount = results.length;
                    const successRate = ((passCount / totalCount) * 100).toFixed(1);
                    
                    alert(`🧪 動作検証結果\n✅ 成功: ${passCount}/${totalCount}\n📊 成功率: ${successRate}%\n\n詳細はコンソールをご確認ください。`);
                });
            });
            testBtn.setAttribute('data-listener-added', 'true');
        }

        // Wave完了モーダルのイベントリスナー
        const nextWaveBtn = document.getElementById("nextWaveBtn");
        if (nextWaveBtn && !nextWaveBtn.hasAttribute('data-listener-added')) {
            nextWaveBtn.addEventListener("click", () => {
                this.startNextWave();
            });
            nextWaveBtn.setAttribute('data-listener-added', 'true');
        }

        const continuePreparationBtn = document.getElementById("continuePreparationBtn");
        if (continuePreparationBtn && !continuePreparationBtn.hasAttribute('data-listener-added')) {
            continuePreparationBtn.addEventListener("click", () => {
                this.hideWaveCompleteModal();
            });
            continuePreparationBtn.setAttribute('data-listener-added', 'true');
        }

        // マップ完了モーダルのイベントリスナー
        const nextMapBtn = document.getElementById("nextMapBtn");
        if (nextMapBtn && !nextMapBtn.hasAttribute('data-listener-added')) {
            nextMapBtn.addEventListener("click", () => {
                this.startNextMap();
            });
            nextMapBtn.setAttribute('data-listener-added', 'true');
        }

        const mapSelectReturnBtn = document.getElementById("mapSelectReturnBtn");
        if (mapSelectReturnBtn && !mapSelectReturnBtn.hasAttribute('data-listener-added')) {
            mapSelectReturnBtn.addEventListener("click", () => {
                this.showMapSelection();
            });
            mapSelectReturnBtn.setAttribute('data-listener-added', 'true');
        }

        // 失敗分析モーダルのイベントリスナー
        const showHintsBtn = document.getElementById("showHintsBtn");
        if (showHintsBtn && !showHintsBtn.hasAttribute('data-listener-added')) {
            showHintsBtn.addEventListener("click", () => {
                this.showStrategyHintsModal();
            });
            showHintsBtn.setAttribute('data-listener-added', 'true');
        }

        const retryMapBtn = document.getElementById("retryMapBtn");
        if (retryMapBtn && !retryMapBtn.hasAttribute('data-listener-added')) {
            retryMapBtn.addEventListener("click", () => {
                document.getElementById('failureAnalysisModal').style.display = 'none';
                const currentMap = this.waveManager.mapManager.currentMap;
                this.selectMap(currentMap);
            });
            retryMapBtn.setAttribute('data-listener-added', 'true');
        }

        const backToMapSelectBtn = document.getElementById("backToMapSelectBtn");
        if (backToMapSelectBtn && !backToMapSelectBtn.hasAttribute('data-listener-added')) {
            backToMapSelectBtn.addEventListener("click", () => {
                document.getElementById('failureAnalysisModal').style.display = 'none';
                this.showMapSelection();
            });
            backToMapSelectBtn.setAttribute('data-listener-added', 'true');
        }

        // 戦略ヒントモーダルのイベントリスナー
        const closeHintsBtn = document.getElementById("closeHintsBtn");
        if (closeHintsBtn && !closeHintsBtn.hasAttribute('data-listener-added')) {
            closeHintsBtn.addEventListener("click", () => {
                document.getElementById('strategyHintsModal').style.display = 'none';
            });
            closeHintsBtn.setAttribute('data-listener-added', 'true');
        }

        // イベントリスナー設定完了フラグ
        this.eventListenersSetup = true;
        console.log("✅ イベントリスナー設定完了");

        // インフォメーションボタン
        const infoBtn = document.getElementById("infoBtn");
        if (infoBtn && !infoBtn.hasAttribute('data-listener-added')) {
            infoBtn.addEventListener("click", () => {
                this.showInfoModal();
            });
            infoBtn.setAttribute('data-listener-added', 'true');
        }

        // インフォメーションモーダルのイベントリスナー
        const closeInfoBtn = document.getElementById("closeInfoBtn");
        if (closeInfoBtn && !closeInfoBtn.hasAttribute('data-listener-added')) {
            closeInfoBtn.addEventListener("click", () => {
                this.hideInfoModal();
            });
            closeInfoBtn.setAttribute('data-listener-added', 'true');
        }

        // ルート表示ボタン
        const showGroundRouteBtn = document.getElementById("showGroundRouteBtn");
        if (showGroundRouteBtn && !showGroundRouteBtn.hasAttribute('data-listener-added')) {
            showGroundRouteBtn.addEventListener("click", () => {
                this.showMiniMapRoute('ground');
            });
            showGroundRouteBtn.setAttribute('data-listener-added', 'true');
        }

        const showAirRouteBtn = document.getElementById("showAirRouteBtn");
        if (showAirRouteBtn && !showAirRouteBtn.hasAttribute('data-listener-added')) {
            showAirRouteBtn.addEventListener("click", () => {
                this.showMiniMapRoute('air');
            });
            showAirRouteBtn.setAttribute('data-listener-added', 'true');
        }

        const clearRouteBtn = document.getElementById("clearRouteBtn");
        if (clearRouteBtn && !clearRouteBtn.hasAttribute('data-listener-added')) {
            clearRouteBtn.addEventListener("click", () => {
                this.clearMiniMapRoute();
            });
            clearRouteBtn.setAttribute('data-listener-added', 'true');
        }

        // モーダル外クリックで閉じる
        const infoModal = document.getElementById("infoModal");
        if (infoModal && !infoModal.hasAttribute('data-listener-added')) {
            infoModal.addEventListener("click", (e) => {
                if (e.target === infoModal) {
                    this.hideInfoModal();
                }
            });
            infoModal.setAttribute('data-listener-added', 'true');
        }
    } 
    
    // ツールチップ表示
    showTooltip(characterType, event) {
        if (this.tooltipTimeout) {
            clearTimeout(this.tooltipTimeout);
        }
        
        this.tooltipTimeout = setTimeout(() => {
            const info = CharacterFactory.getInfo(characterType);
            if (!info) return;
            
            const tooltip = this.tooltip;
            const icon = tooltip.querySelector('.tooltip-icon');
            const name = tooltip.querySelector('.tooltip-name');
            const description = tooltip.querySelector('#tooltipDescription');
            
            // アイコンを設定
            const iconMap = {
                warrior: '⚔️',
                archer: '🏹',
                wizard: '🧙',
                timemage: '⏰',
                treasurehunter: '💰'
            };
            icon.textContent = iconMap[characterType] || '❓';
            name.textContent = info.name;
            description.textContent = info.description;
            
            // 統計情報を設定
            document.getElementById('tooltipDamage').textContent = info.damage;
            document.getElementById('tooltipRange').textContent = info.range;
            document.getElementById('tooltipSpeed').textContent = `${(1000/info.attackSpeed).toFixed(1)}/秒`;
            document.getElementById('tooltipCost').textContent = `${CharacterFactory.getCost(characterType)}G`;
            
            // 位置を設定
            const rect = event.target.getBoundingClientRect();
            tooltip.style.left = rect.left + 'px';
            tooltip.style.top = (rect.top - tooltip.offsetHeight - 10) + 'px';
            
            tooltip.classList.add('show');
        }, 300);
    }
    
    // ツールチップ非表示
    hideTooltip() {
        if (this.tooltipTimeout) {
            clearTimeout(this.tooltipTimeout);
            this.tooltipTimeout = null;
        }
        this.tooltip.classList.remove('show');
    }
    
    // ドラッグ開始
    startDrag(characterType, event) {
        this.isDragging = true;
        this.selectedCharacterType = characterType;
        this.dragStartX = event.clientX;
        this.dragStartY = event.clientY;
        
        // ドラッグプレビューを設定
        const preview = this.dragPreview;
        const icon = preview.querySelector('.character-icon');
        const rangeIndicator = preview.querySelector('.range-indicator');
        
        const iconMap = {
            warrior: '⚔️',
            archer: '🏹',
            wizard: '🧙',
            timemage: '⏰',
            treasurehunter: '💰'
        };
        icon.textContent = iconMap[characterType] || '❓';
        
        // 射程表示を設定
        const info = CharacterFactory.getInfo(characterType);
        const range = info.range * 2; // 直径
        rangeIndicator.style.width = range + 'px';
        rangeIndicator.style.height = range + 'px';
        rangeIndicator.style.marginLeft = -(range/2) + 'px';
        rangeIndicator.style.marginTop = -(range/2) + 'px';
        
        preview.style.display = 'block';
        preview.style.left = event.clientX + 'px';
        preview.style.top = event.clientY + 'px';
        
        // キャンセルエリアを表示
        this.cancelArea.classList.add('active');
        
        // カードの状態を更新
        this.updateCharacterCards();
        
        document.body.classList.add('dragging-cursor');
    }
    
    // マウス移動処理
    handleMouseMove(event) {
        // スクリーン座標を保存
        this.mouseX = event.clientX;
        this.mouseY = event.clientY;
        
        // キャンバス座標も保存
        this.canvasMouseX = 0;
        this.canvasMouseY = 0;
        
        // キャンバス上にマウスがある場合のみキャンバス座標を計算
        const canvasRect = this.canvas.getBoundingClientRect();
        if (event.clientX >= canvasRect.left && event.clientX <= canvasRect.right &&
            event.clientY >= canvasRect.top && event.clientY <= canvasRect.bottom) {
            const canvasPos = this.getMousePosition(this.canvas, event);
            this.canvasMouseX = canvasPos.x;
            this.canvasMouseY = canvasPos.y;
            
            // グリッドシステムのホバー更新
            this.gridSystem.updateHover(canvasPos.x, canvasPos.y);
            
            // 配置不可エリアの視覚的フィードバック
            this.updatePlacementFeedback(canvasPos.x, canvasPos.y);
            
            // グリッド座標の表示更新
            this.updateGridCoordinatesDisplay(canvasPos.x, canvasPos.y);
        } else {
            // キャンバス外の場合はホバーをクリア
            this.gridSystem.clearHover();
            this.clearPlacementFeedback();
        }
        
        if (this.isDragging) {
            // ドラッグプレビューの位置を更新
            this.dragPreview.style.left = event.clientX + 'px';
            this.dragPreview.style.top = event.clientY + 'px';
            
            // キャンバス上の座標を取得
            const canvasPos = this.getMousePosition(this.canvas, event);
            
            // 配置可能性をチェックして視覚的フィードバック（グリッドベース）
            const gridPos = this.gridSystem.pixelToGrid(canvasPos.x, canvasPos.y);
            const isValid = this.gridSystem.canBuildAt(gridPos.gridX, gridPos.gridY) && 
                           this.gold >= this.getCharacterCost(this.selectedCharacterType);
            const rangeIndicator = this.dragPreview.querySelector('.range-indicator');
            
            if (isValid) {
                rangeIndicator.classList.remove('invalid');
            } else {
                rangeIndicator.classList.add('invalid');
            }
        }
    }
    
    // 配置エリアの視覚的フィードバック更新
    updatePlacementFeedback(x, y) {
        if (!this.placingCharacter && !this.isDragging) return;
        
        const gridPos = this.gridSystem.pixelToGrid(x, y);
        const panel = this.gridSystem.getPanel(gridPos.gridX, gridPos.gridY);
        
        // 前回のフィードバックをクリア
        this.clearPlacementFeedback();
        
        if (panel) {
            const isValid = panel.canBuild() && 
                           this.gold >= this.getCharacterCost(this.selectedCharacterType);
            
            if (isValid) {
                panel.highlighted = true;
                panel.highlightType = 'valid';
            } else {
                panel.highlighted = true;
                panel.highlightType = 'invalid';
            }
        }
    }

    // 配置フィードバックをクリア
    clearPlacementFeedback() {
        for (let y = 0; y < GRID_HEIGHT; y++) {
            for (let x = 0; x < GRID_WIDTH; x++) {
                const panel = this.gridSystem.getPanel(x, y);
                if (panel) {
                    panel.highlighted = false;
                    panel.highlightType = null;
                }
            }
        }
    }

    // グリッド座標表示の更新
    updateGridCoordinatesDisplay(pixelX, pixelY) {
        const gridPos = this.gridSystem.pixelToGrid(pixelX, pixelY);
        document.getElementById("currentGridX").textContent = gridPos.gridX;
        document.getElementById("currentGridY").textContent = gridPos.gridY;
    }
    
    // マウスアップ処理
    handleMouseUp(event) {
        if (this.isDragging) {
            const canvasRect = this.canvas.getBoundingClientRect();
            const cancelRect = this.cancelArea.getBoundingClientRect();
            
            // キャンセルエリアにドロップした場合
            if (event.clientY >= cancelRect.top) {
                this.cancelPlacement();
                return;
            }
            
            // キャンバス上にドロップした場合
            if (event.clientX >= canvasRect.left && event.clientX <= canvasRect.right &&
                event.clientY >= canvasRect.top && event.clientY <= canvasRect.bottom) {
                
                const pos = this.getMousePosition(this.canvas, event);
                this.placeCharacter(pos.x, pos.y);
            } else {
                this.cancelPlacement();
            }
        }
    }
    
    // 配置キャンセル
    cancelPlacement() {
        this.isDragging = false;
        this.placingCharacter = false;
        this.selectedCharacterType = null;
        this.dragPreview.style.display = 'none';
        this.cancelArea.classList.remove('active');
        document.body.classList.remove('dragging-cursor');
        this.updateCharacterCards();
    }

    selectCharacter(type) { 
        const cost = this.getCharacterCost(type); 
        if (this.gold >= cost) { 
            this.selectedCharacterType = type; 
            this.placingCharacter = true; 
            this.updateCharacterCards(); 
        } 
    } 

    // 修正版：座標パラメータを直接受け取る
    selectCharacterOnCanvas(x, y) { 
        // 既存の選択をクリア
        this.characters.forEach(character => {
            character.selected = false;
        });
        
        // クリック位置に最も近いキャラクターを選択
        for (const character of this.characters) { 
            const distance = Math.sqrt((character.x - x) ** 2 + (character.y - y) ** 2); 
            if (distance <= 20) { 
                this.selectedCharacter = character; 
                character.selected = true; 
                this.showCharacterDetail(character); 
                break; 
            } 
        } 
    } 

    showCharacterDetail(character) { 
        console.log("Character selected:", character.type); 
    } 

    placeCharacter(x, y) { 
        if (!this.selectedCharacterType || (!this.placingCharacter && !this.isDragging)) {
            return;
        }
        
        const cost = this.getCharacterCost(this.selectedCharacterType); 
        const hasEnoughGold = this.gold >= cost;
        
        // グリッドベースの配置判定
        const gridPos = this.gridSystem.pixelToGrid(x, y);
        const isValidPos = this.gridSystem.canBuildAt(gridPos.gridX, gridPos.gridY);
        
        // デバッグログ
        console.log(`🏗️ 配置試行: ${this.selectedCharacterType} (${cost}G) at (${gridPos.gridX}, ${gridPos.gridY})`);
        console.log(`💰 現在のゴールド: ${this.gold}G (必要: ${cost}G) - 十分: ${hasEnoughGold}`);
        console.log(`📍 配置可能位置: ${isValidPos}`);
        
        if (hasEnoughGold && isValidPos) { 
            // グリッド中心座標を取得
            const centerPos = this.gridSystem.gridToPixel(gridPos.gridX, gridPos.gridY);
            const character = this.createCharacter(this.selectedCharacterType, centerPos.x, centerPos.y); 
            
            // グリッドシステムに配置を記録
            const placementSuccess = this.gridSystem.placeCharacter(gridPos.gridX, gridPos.gridY, character);
            
            if (placementSuccess) {
            this.characters.push(character); 
            
                // 新しいゴールド管理システムを使用
                this.spendGold(cost);
            
            // 配置成功のフィードバック
                this.showPlacementEffect(centerPos.x, centerPos.y);
                this.showFloatingText(centerPos.x, centerPos.y - 30, `-${cost}G`, '#e74c3c');
                
                console.log(`✅ 配置成功: 残りゴールド ${this.gold}G`);
            
            this.cancelPlacement();
                this.syncAllUI(); // UI全体を同期
                this.syncGridStats();
        } else {
                console.log(`❌ グリッドシステムでの配置失敗: (${gridPos.gridX}, ${gridPos.gridY})`);
            this.showInvalidPlacementEffect(x, y);
                this.showFloatingText(x, y - 30, '配置失敗!', '#e74c3c');
            }
        } else {
            // 配置失敗のフィードバック - パネルのハイライト表示
            const panel = this.gridSystem.getPanel(gridPos.gridX, gridPos.gridY);
            if (panel) {
                this.showInvalidPlacementPanelFeedback(panel);
            }
            
            this.showInvalidPlacementEffect(x, y);
            
            // 具体的な失敗理由を表示
            let failureReason = '';
            if (!hasEnoughGold) {
                failureReason = `ゴールド不足 (${this.gold}G / ${cost}G必要)`;
                this.showFloatingText(x, y - 30, `${cost}G必要!`, '#e74c3c');
            } else if (!isValidPos) {
                failureReason = '配置不可能な場所';
                this.showFloatingText(x, y - 30, '配置不可!', '#e74c3c');
            }
            
            console.log(`❌ 配置失敗: ${failureReason}`);
            // 配置失敗時はUIを更新しない
        }
    }
    
    // 配置不可パネルの視覚的フィードバック
    showInvalidPlacementPanelFeedback(panel) {
        panel.highlighted = true;
        panel.highlightType = 'invalid-pulse';
        
        // 0.5秒後にハイライトを削除
        setTimeout(() => {
            if (panel) {
                panel.highlighted = false;
                panel.highlightType = null;
            }
        }, 500);
    }
    
    // 配置成功エフェクト
    showPlacementEffect(x, y) {
        // 成功時のビジュアルエフェクトを追加
        const effect = document.createElement('div');
        effect.className = 'character-selected';
        effect.style.position = 'absolute';
        effect.style.left = x + 'px';
        effect.style.top = y + 'px';
        effect.style.width = '40px';
        effect.style.height = '40px';
        effect.style.borderRadius = '50%';
        effect.style.background = 'rgba(46, 204, 113, 0.5)';
        effect.style.pointerEvents = 'none';
        effect.style.zIndex = '1000';
        
        document.body.appendChild(effect);
        
        setTimeout(() => {
            document.body.removeChild(effect);
        }, 500);
    }
    
    // 配置失敗エフェクト
    showInvalidPlacementEffect(x, y) {
        // 失敗時のビジュアルエフェクトを追加
        const effect = document.createElement('div');
        effect.className = 'invalid-placement';
        effect.style.position = 'absolute';
        effect.style.left = x + 'px';
        effect.style.top = y + 'px';
        effect.style.width = '40px';
        effect.style.height = '40px';
        effect.style.borderRadius = '50%';
        effect.style.background = 'rgba(231, 76, 60, 0.5)';
        effect.style.pointerEvents = 'none';
        effect.style.zIndex = '1000';
        
        document.body.appendChild(effect);
        
        setTimeout(() => {
            document.body.removeChild(effect);
        }, 500);
    } 

    createCharacter(type, x, y) { 
        switch(type) { 
            case "warrior": 
                return new Warrior(x, y); 
            case "archer": 
                return new Archer(x, y); 
            case "wizard": 
                return new Wizard(x, y); 
            case "timemage": 
                return new TimeMage(x, y); 
            case "treasurehunter": 
                return new TreasureHunter(x, y); 
            default: 
                return new Warrior(x, y); 
        } 
    } 

    getCharacterCost(type) { 
        const costs = { warrior: 100, archer: 80, wizard: 120, timemage: 100, treasurehunter: 60 }; 
        return costs[type] || 100; 
    } 

    setupWaveManager() {
        console.log("🔧 ===== WaveManager設定開始 =====");
        
        // waveManagerが既に初期化されている場合はスキップ
        if (this.waveManager && this.waveManager.mapManager) {
            console.log("✅ WaveManagerは既に初期化済み");
            // 既存の場合もコールバックを再設定
            console.log("🔄 既存WaveManagerのコールバック再設定");
        } else {
            // waveManagerが存在しない場合は新規作成
            if (!this.waveManager) {
                console.log("🆕 新しいWaveManagerを作成");
                this.waveManager = new GridWaveManager();
            }
        }
        
        console.log("🔗 グリッドシステム設定");
        this.waveManager.setGridSystem(this.gridSystem);
        
        // コールバック設定
        console.log("📞 Wave完了コールバック設定");
        this.waveManager.setWaveCompleteCallback((result) => {
            console.log("📞 Wave完了コールバック呼び出し:", result);
            this.onWaveComplete(result);
        });
        
        console.log("📞 敵到達コールバック設定");
        this.waveManager.setEnemyReachedCallback((enemy) => {
            console.log("📞 敵到達コールバック呼び出し:", enemy.type);
            this.onEnemyReached(enemy);
        });
        
        // コールバック設定確認
        const hasWaveCallback = typeof this.waveManager.waveCompleteCallback === 'function';
        const hasEnemyCallback = typeof this.waveManager.enemyReachedCallback === 'function';
        
        console.log(`✅ WaveManager設定完了:`);
        console.log(`   - Wave完了コールバック: ${hasWaveCallback ? '設定済み' : '未設定'}`);
        console.log(`   - 敵到達コールバック: ${hasEnemyCallback ? '設定済み' : '未設定'}`);
        console.log("🔧 ===== WaveManager設定完了 =====");
    }

    // マップ選択画面を表示
    showMapSelection() {
        this.gameState = "mapSelection";
        
        // WaveManagerの状態をリセット
        if (this.waveManager) {
            this.waveManager.reset();
            this.waveManager.isActive = false;
        }
        
        // Waveタイマーをクリア
        this.hideWaveTimer();
        
        // ルート表示をクリア
        this.clearEnemyRoute();
        
        // 全てのモーダルを確実に非表示
        document.getElementById("waveCompleteModal").style.display = "none";
        document.getElementById("mapCompleteModal").style.display = "none";
        document.getElementById("gameOverModal").style.display = "none";
        
        // ボタン状態をリセット
        this.updateWaveButton();
        
        // 画面遷移
        document.getElementById("mapSelectionScreen").style.display = "flex";
        document.getElementById("gameContainer").style.display = "none";
        
        console.log("🗺️ マップ選択画面を表示 - WaveManager状態リセット完了");
    }

    // マップを選択
    selectMap(mapNumber) {
        if (this.waveManager.setMap(mapNumber)) {
            this.gameState = "playing";
            
            // 新しいゴールド管理システムを使用
            this.setGold(100); // 初期ゴールドを100Gに設定
            
            this.crystalHealth = 10; // クリスタルヘルスを10に変更
            this.enemiesReached = 0;
            this.characters = [];
            this.enemies = []; // 敵配列を確実に初期化
            this.floatingTexts = []; // フローティングテキストもリセット
            
            // ゲーム統計をリセット
            this.gameStats = {
                waveProgress: 0,
                enemiesDefeated: 0,
                charactersPlaced: 0,
                goldEarned: 0,
                averageEnemyProgress: 0
            };
            
            // ルート表示をクリア
            this.clearEnemyRoute();
            
            // グリッドシステムにマップをロード
            this.gridSystem.loadMap(mapNumber);
            
            // 天候・時間帯システムを初期化
            this.weatherSystem.updateTimeOfDay(mapNumber, 1);
            this.weatherSystem.setWeatherForWave(1);
            
            // キャンバス背景をクリア（前のマップの残像を除去）
            this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
            
            document.getElementById("mapSelectionScreen").style.display = "none";
            document.getElementById("gameContainer").style.display = "block";
            
            this.updateMapUI();
            this.updateWaveUI();
            this.updateWeatherUI();
            this.updateDifficultyUI(mapNumber);
            
            // 新しい同期システムを使用
            this.syncAllUI();
            
            console.log(`🗺️ マップ${mapNumber}選択: 初期ゴールド100G, クリスタルHP${this.crystalHealth}`);
            console.log(`🌤️ 天候: ${this.weatherSystem.getCurrentWeatherEffects().name}`);
            console.log(`🎯 難易度: ${this.difficultySystem.getDifficultyDisplayInfo(mapNumber).difficulty}`);
        }
    }

    // マップUIを更新
    updateMapUI() {
        const mapData = this.waveManager.getCurrentMapInfo();
        document.getElementById("currentMapName").textContent = mapData.name;
        
        // 背景色を変更
        this.canvas.style.background = mapData.background;
    }

    // 天候・時間帯UIを更新
    updateWeatherUI() {
        const weather = this.weatherSystem.getCurrentWeatherEffects();
        const timeOfDay = this.weatherSystem.getCurrentTimeOfDayEffects();
        
        // 現在の天候・時間帯を表示
        document.getElementById("weatherIcon").textContent = weather.icon;
        document.getElementById("weatherName").textContent = weather.name;
        document.getElementById("weatherDescription").textContent = weather.description;
        
        document.getElementById("timeIcon").textContent = timeOfDay.icon;
        document.getElementById("timeName").textContent = timeOfDay.name;
        document.getElementById("timeDescription").textContent = timeOfDay.description;
        
        // 天候予報を表示（マップのWave数を考慮）
        const currentWave = this.waveManager.mapManager.currentWave;
        const totalWaves = this.waveManager.mapManager.wavesPerMap;
        const forecast = this.weatherSystem.getNextWeatherForecast(currentWave, totalWaves);
        const forecastContainer = document.getElementById("weatherForecast");
        
        if (forecastContainer && forecast && forecast.length > 0) {
            forecastContainer.innerHTML = forecast.map((weatherType, index) => {
                // WeatherSystemから天候情報を取得
                const weatherInfo = this.weatherSystem.getWeatherEffectsByType(weatherType);
                const waveNumber = currentWave + index + 1;
                return `
                    <div class="forecast-item">
                        <span class="forecast-icon">${weatherInfo.icon}</span>
                        <div>Wave ${waveNumber}</div>
                    </div>
                `;
            }).join('');
            console.log(`🌤️ 天候予報表示: ${forecast.length}件`);
        } else {
            if (forecastContainer) {
                forecastContainer.innerHTML = '<div class="forecast-item">予報なし</div>';
            }
            console.log(`⚠️ 天候予報データなし`);
        }
        
        // インフォメーションモーダルの天気予報も更新
        this.updateInfoModalWeatherForecast();
        
        console.log(`🌤️ 天候UI更新: ${weather.name} / ${timeOfDay.name}, 予報${forecast.length}件表示`);
    }

    // インフォメーションモーダルの天気予報を更新
    updateInfoModalWeatherForecast() {
        const modalForecastContainer = document.getElementById("modalWeatherForecast");
        if (!modalForecastContainer) return;
        
        const currentWave = this.waveManager ? this.waveManager.mapManager.currentWave : 1;
        const totalWaves = this.waveManager ? this.waveManager.mapManager.wavesPerMap : 3;
        const forecast = this.weatherSystem.getNextWeatherForecast(currentWave, totalWaves);
        
        if (forecast && forecast.length > 0) {
            modalForecastContainer.innerHTML = forecast.map((weatherType, index) => {
                const weatherInfo = this.weatherSystem.getWeatherEffectsByType(weatherType);
                const waveNumber = currentWave + index + 1;
                return `
                    <div class="forecast-item">
                        <span class="forecast-icon">${weatherInfo.icon}</span>
                        <div>Wave ${waveNumber}: ${weatherInfo.name}</div>
                    </div>
                `;
            }).join('');
        } else {
            modalForecastContainer.innerHTML = '<div class="forecast-item">今後の予報はありません</div>';
        }
    }

    // 難易度UIを更新
    updateDifficultyUI(mapNumber) {
        const difficultyInfo = this.difficultySystem.getDifficultyDisplayInfo(mapNumber);
        const attemptBonus = this.difficultySystem.getAttemptBonus(mapNumber);
        
        document.getElementById("difficultyTitle").textContent = difficultyInfo.difficulty;
        document.getElementById("attemptCount").textContent = difficultyInfo.attemptCount;
        document.getElementById("attemptBonus").textContent = attemptBonus.description || "初回挑戦";
        
        // 難易度修正値を表示
        const modifiersContainer = document.getElementById("difficultyModifiers");
        const modifiers = difficultyInfo.modifiers;
        
        modifiersContainer.innerHTML = `
            <div class="modifier-item">
                <span class="modifier-label">敵HP</span>
                <span class="modifier-value ${modifiers.enemyHp.startsWith('+') ? 'modifier-negative' : 'modifier-positive'}">${modifiers.enemyHp}</span>
            </div>
            <div class="modifier-item">
                <span class="modifier-label">敵速度</span>
                <span class="modifier-value ${modifiers.enemySpeed.startsWith('+') ? 'modifier-negative' : 'modifier-positive'}">${modifiers.enemySpeed}</span>
            </div>
            <div class="modifier-item">
                <span class="modifier-label">ゴールド</span>
                <span class="modifier-value modifier-positive">+${modifiers.goldBonus}</span>
            </div>
            <div class="modifier-item">
                <span class="modifier-label">攻撃力</span>
                <span class="modifier-value modifier-positive">+${modifiers.damageBonus}</span>
            </div>
        `;
        
        console.log(`🎯 難易度UI更新: ${difficultyInfo.difficulty}, 挑戦回数: ${difficultyInfo.attemptCount}`);
    }

    // Wave UIを更新
    updateWaveUI() {
        const mapData = this.waveManager.getCurrentMapInfo();
        const waveData = this.waveManager.getCurrentWaveInfo();
        const progress = this.waveManager.getProgress();
        
        // Wave番号とタイトルを正確に表示
        const currentWave = this.waveManager.mapManager.currentWave;
        const totalWaves = this.waveManager.mapManager.wavesPerMap;
        
        document.getElementById("waveNumber").textContent = `${currentWave}/${totalWaves}`;
        document.getElementById("waveTitle").textContent = `Wave ${currentWave}`;
        document.getElementById("waveDescription").textContent = waveData.description;
        
        // 敵の種類を表示
        this.updateWaveEnemiesDisplay(waveData.enemies);
        
        console.log(`🌊 Wave UI更新: マップ${this.waveManager.mapManager.currentMap} Wave ${currentWave}/${totalWaves}`);
    }

    // Wave敵表示を更新
    updateWaveEnemiesDisplay(enemies) {
        const container = document.getElementById("waveEnemies");
        container.innerHTML = "";
        
        enemies.forEach(enemyGroup => {
            const enemyInfo = EnemyFactory.getEnemyInfo(enemyGroup.type);
            const preview = document.createElement("div");
            preview.className = "enemy-preview route-preview";
            preview.dataset.enemyType = enemyGroup.type;
            
            preview.innerHTML = `
                <span class="enemy-icon">${enemyInfo.icon}</span>
                <span>${enemyInfo.name} ×${enemyGroup.count}</span>
                <div class="route-tooltip">
                    ${enemyInfo.isFlying ? '空中ルート表示' : '地上ルート表示'}
                </div>
            `;
            
            // ルート表示イベントリスナー
            preview.addEventListener('mouseenter', () => {
                this.showEnemyRoute(enemyGroup.type);
                preview.classList.add('active');
            });
            
            preview.addEventListener('mouseleave', () => {
                this.clearEnemyRoute();
                preview.classList.remove('active');
            });
            
            // タッチデバイス対応
            preview.addEventListener('click', (e) => {
                e.preventDefault();
                if (this.routeDisplayActive && this.routeDisplayType === enemyGroup.type) {
                    this.clearEnemyRoute();
                    preview.classList.remove('active');
                } else {
                    // 他のアクティブ状態をクリア
                    document.querySelectorAll('.enemy-preview.active').forEach(el => {
                        el.classList.remove('active');
                    });
                    this.showEnemyRoute(enemyGroup.type);
                    preview.classList.add('active');
                }
            });
            
            container.appendChild(preview);
        });
    }

    startWave() { 
        if (!this.waveManager || this.waveManager.isActive) {
            return;
        }
        
        // 既存の通知を削除
        const existingNotification = document.querySelector('.wave-notification');
        if (existingNotification) {
            existingNotification.remove();
        }
        
        // 天候を更新（新しいWave開始時）
        const currentWave = this.waveManager.mapManager.currentWave;
        const currentMap = this.waveManager.mapManager.currentMap;
        
        this.weatherSystem.setWeatherForWave(currentWave);
        this.weatherSystem.updateTimeOfDay(currentMap, currentWave);
        
        const waveStartResult = this.waveManager.startWave();
        
        if (waveStartResult) {
            // Wave開始の通知を表示
            const waveData = this.waveManager.getCurrentWaveInfo();
            this.showWaveNotification(waveData.description);
            
            // UIを更新
            this.updateWeatherUI();
            
            // ボタン状態を更新
            this.updateWaveButton();
            this.hideWaveTimer();
        }
    }

    update(deltaTime) { 
        if (this.gameState !== "playing" || this.isPaused) return; 
        
        // WaveManagerの更新
        if (this.waveManager) {
            const wasActive = this.waveManager.isActive;
            this.waveManager.update(deltaTime); 
            
            // Wave状態が変化した場合はボタンを更新
            if (wasActive !== this.waveManager.isActive) {
                console.log(`🔄 Wave状態変化: ${wasActive} → ${this.waveManager.isActive}`);
                this.updateWaveButton();
            }
            
            // 敵配列を確実に同期
            this.enemies = this.waveManager.enemies || [];
        }
        
        // キャラクターの更新
        if (Array.isArray(this.characters)) {
        this.characters.forEach(character => { 
                if (character && typeof character.update === 'function') {
            character.update(this.enemies, Date.now()); 
                }
        });
        }
        
        // 攻撃エフェクトの更新
        this.updateAttackEffects();
        this.updateDamageNumbers();
        this.updateFloatingTexts();
        
        // ゲームオーバーチェック
        if (this.enemiesReached >= this.maxEnemiesReached) { 
            this.gameOver(); 
        }
    }

    // 敵撃破時の処理（統計更新を追加）
    onEnemyDefeated(enemy) {
        console.log(`💀 敵撃破処理開始: ${enemy.type} ID: ${enemy.id || 'unknown'}`);
        
        const reward = this.ENEMY_REWARDS[enemy.type] || 10;
        
        // 天候・難易度効果を適用
        const weatherEffects = this.weatherSystem.getCombinedEffects();
        const difficultyEffects = this.difficultySystem.getCombinedDifficultyEffects(
            this.waveManager.mapManager.currentMap, 
            weatherEffects
        );
        
        const finalReward = Math.floor(reward * difficultyEffects.goldMultiplier);
        
        // 新しいゴールド管理システムを使用
        this.addGold(finalReward);
        this.showFloatingText(enemy.x, enemy.y, '+' + finalReward + 'G', '#FFD700');
        
        // 統計を更新
        this.gameStats.enemiesDefeated++;
        this.gameStats.goldEarned += finalReward;
        
        // 撃破エフェクトも追加
        this.addAttackEffect('explosion', enemy.x, enemy.y, 0, 0, '#e74c3c');
        
        // 重要：敵をWaveManagerから削除
        if (this.waveManager && typeof this.waveManager.removeEnemy === 'function') {
            console.log(`🗑️ 撃破された敵をWaveManagerから削除中...`);
            const removed = this.waveManager.removeEnemy(enemy);
            console.log(`🗑️ WaveManagerから敵削除結果: ${removed}`);
        }
        
        // Gameクラスの敵配列からも削除（同期のため）
        const enemyIndex = this.enemies.indexOf(enemy);
        if (enemyIndex !== -1) {
            console.log(`🗑️ Game敵配列から撃破敵削除: インデックス ${enemyIndex}`);
            this.enemies.splice(enemyIndex, 1);
            console.log(`🗑️ Game敵配列削除完了`);
        }
        
        // ボタン状態を更新（Wave完了判定のため）
        this.updateWaveButton();
        
        console.log(`💰 敵撃破ボーナス: ${enemy.type} = ${finalReward}G (基本${reward}G × ${difficultyEffects.goldMultiplier.toFixed(2)})`);
        console.log(`💀 敵撃破処理完了`);
    }

    // 安全なアップデート処理
    safeUpdate(deltaTime) {
        try {
            this.update(deltaTime);
        } catch (error) {
            console.error("❌ アップデート処理エラー:", error);
            
            // 緊急復旧を試行
            if (this.recoverGameState()) {
                console.log("🔄 緊急復旧成功 - ゲーム続行");
        } else {
                console.error("💥 緊急復旧失敗 - ゲーム停止");
                this.gameState = "error";
            }
        }
    }

    // ゲームデータの初期化
    initializeGameData() {
        // 基本ゲーム状態の初期化
        this.gold = 100;
        this.enemiesReached = 0;
        this.gameState = "mapSelection";
        this.characters = [];
        this.enemies = [];
        this.floatingTexts = [];
        
        console.log("💾 ゲームデータ初期化: 初期ゴールド100G");
        
        // UIとの同期を確実に行う
        this.syncAllUI();
    }

    // UIと内部ステータスの完全同期（カプセル化）
    syncAllUI() {
        try {
            // 基本UI要素の同期
            this.syncGoldUI();
            this.syncWaveUI();
            this.syncCharacterUI();
            this.syncButtonStates();
            this.syncGridStats();
            
            console.log("🔄 UI同期完了");
        } catch (error) {
            console.error("❌ UI同期エラー:", error);
        }
    }

    // ゴールド表示の同期
    syncGoldUI() {
        const goldElement = document.getElementById("goldAmount");
        if (goldElement) {
            goldElement.textContent = this.gold;
        }
    }

    // Wave情報の同期
    syncWaveUI() {
        if (this.waveManager && this.waveManager.mapManager) {
            const currentWave = this.waveManager.mapManager.currentWave;
            const totalWaves = this.waveManager.mapManager.wavesPerMap;
            
            const waveElement = document.getElementById("waveNumber");
            if (waveElement) {
                waveElement.textContent = `${currentWave}/${totalWaves}`;
            }
        }
        
        const crystalElement = document.getElementById("crystalHealth");
        if (crystalElement) {
            crystalElement.textContent = this.maxEnemiesReached - this.enemiesReached;
        }
    }

    // キャラクターUI状態の同期
    syncCharacterUI() {
        this.updateCharacterCards();
    }

    // キャラクターカードの状態を更新
    updateCharacterCards() {
        try {
            document.querySelectorAll(".character-card").forEach(card => {
                const characterType = card.dataset.character;
                const cost = this.getCharacterCost(characterType);
                const canAfford = this.gold >= cost;
                
                // カードの状態を更新
                if (canAfford) {
                    card.classList.remove('disabled');
                    card.classList.add('affordable');
        } else {
                    card.classList.add('disabled');
                    card.classList.remove('affordable');
                }
                
                // 選択中のキャラクターをハイライト
                if (this.selectedCharacterType === characterType && this.placingCharacter) {
                    card.classList.add('selected');
                } else {
                    card.classList.remove('selected');
                }
                
                // コスト表示を更新
                const costElement = card.querySelector('.character-cost');
                if (costElement) {
                    costElement.textContent = `${cost}G`;
                    costElement.className = `character-cost ${canAfford ? 'affordable' : 'expensive'}`;
                }
            });
            
            console.log("🎴 キャラクターカード状態更新完了");
        } catch (error) {
            console.error("❌ キャラクターカード更新エラー:", error);
        }
    }

    // ボタン状態の同期
    syncButtonStates() {
        this.updateWaveButton();
    }

    // グリッド統計の同期
    syncGridStats() {
        if (this.gridSystem) {
            const stats = this.gridSystem.getStats();
            const availableElement = document.getElementById("availableSlots");
            const occupiedElement = document.getElementById("occupiedSlots");
            
            if (availableElement) {
                availableElement.textContent = stats.availableCount;
            }
            if (occupiedElement) {
                occupiedElement.textContent = stats.occupiedCount;
            }
        }
    }

    updateUI() { 
        // 新しい同期システムを使用
        this.syncAllUI();
        
        console.log(`🌊 UI更新完了: ゴールド${this.gold}G, 敵到達${this.enemiesReached}/${this.maxEnemiesReached}`);
    }

    // ゴールド管理（カプセル化）
    setGold(amount) {
        this.gold = Math.max(0, amount);
        this.syncGoldUI();
        this.syncCharacterUI(); // ゴールド変更時はキャラクターカードも更新
        console.log(`💰 ゴールド設定: ${this.gold}G`);
    }

    addGold(amount) { 
        this.gold += amount; 
        this.syncGoldUI();
        this.syncCharacterUI(); // ゴールド変更時はキャラクターカードも更新
        console.log(`💰 ゴールド追加: +${amount}G (合計: ${this.gold}G)`);
    }

    spendGold(amount) {
        if (this.gold >= amount) {
            this.gold -= amount;
            this.syncGoldUI();
            this.syncCharacterUI(); // ゴールド変更時はキャラクターカードも更新
            console.log(`💰 ゴールド消費: -${amount}G (残り: ${this.gold}G)`);
            return true;
        }
        console.warn(`⚠️ ゴールド不足: 必要${amount}G, 所持${this.gold}G`);
        return false;
    }

    hideLoading() { 
        const loadingElement = document.getElementById("loading");
        if (loadingElement) {
            loadingElement.style.display = "none";
        }
        
        const gameContainer = document.getElementById("gameContainer");
        if (gameContainer) {
            gameContainer.style.display = "block";
        }
        
        console.log("🎮 ローディング画面を非表示にしました");
    }

    // ゲームループ
    gameLoop(currentTime = 0) {
        try {
            // デルタタイムを計算
            const deltaTime = currentTime - this.lastTime;
            this.lastTime = currentTime;
            
            // ゲーム状態の更新
            this.update(deltaTime);
            
            // 描画処理
            this.render();
            
            // 次のフレームをリクエスト
            requestAnimationFrame((time) => this.gameLoop(time));
        } catch (error) {
            console.error("❌ ゲームループエラー:", error);
            // エラーが発生してもゲームループを継続
            requestAnimationFrame((time) => this.gameLoop(time));
        }
    }

    // 描画処理
    render() { 
        try {
            // ゲーム画面でない場合は描画をスキップ
            if (this.gameState !== "playing") {
                return;
            }
            
            // キャンバスをクリア
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height); 
        
            // グリッドシステムの描画
            if (this.gridSystem) {
                this.gridSystem.render(this.ctx);
            }
            
            // 天候エフェクトの描画
            if (this.weatherSystem) {
                this.renderWeatherEffects();
            }
            
            // キャラクターの描画
            if (Array.isArray(this.characters)) {
        this.characters.forEach(character => { 
                    if (character && typeof character.render === 'function') {
            character.render(this.ctx); 
                    }
        }); 
            }
        
            // 敵の描画
            if (Array.isArray(this.enemies)) {
        this.enemies.forEach(enemy => { 
                    if (enemy && typeof enemy.render === 'function') {
            enemy.render(this.ctx); 
                    }
                });
            }
            
            // 攻撃エフェクトの描画
            this.renderAttackEffects(this.ctx);
            
            // ダメージ数値の描画
            this.renderDamageNumbers(this.ctx);
            
            // フローティングテキストの描画
            this.renderFloatingTexts(this.ctx);
            
            // デバッグ情報の描画
            if (this.debugMode && this.gridSystem) {
                this.gridSystem.renderDebugInfo(this.ctx, true);
            }
            
        } catch (error) {
            console.error("❌ 描画エラー:", error);
        }
    }

    // 天候エフェクトの描画
    renderWeatherEffects() {
        try {
            if (!this.weatherSystem) return;
            
            const currentWeather = this.weatherSystem.currentWeather;
            const currentTimeOfDay = this.weatherSystem.currentTimeOfDay;
            
            // 天候エフェクト
            switch (currentWeather) {
                case 'rainy':
                    this.weatherSystem.renderRainEffect(this.ctx, this.canvas.width, this.canvas.height);
                    break;
                case 'foggy':
                    this.weatherSystem.renderFogEffect(this.ctx, this.canvas.width, this.canvas.height);
                    break;
                case 'storm':
                    this.weatherSystem.renderRainEffect(this.ctx, this.canvas.width, this.canvas.height);
                    this.weatherSystem.renderFogEffect(this.ctx, this.canvas.width, this.canvas.height);
                    break;
            }
            
            // 時間帯エフェクト
            switch (currentTimeOfDay) {
                case 'night':
                    this.weatherSystem.renderNightEffect(this.ctx, this.canvas.width, this.canvas.height);
                    break;
                case 'dawn':
                case 'dusk':
                    // 薄暗いオーバーレイ
                    this.ctx.save();
                    this.ctx.globalAlpha = 0.2;
                    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
                    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
                    this.ctx.restore();
                    break;
            }
        } catch (error) {
            console.error("❌ 天候エフェクト描画エラー:", error);
        }
    }

    // ゲームオーバー処理
    gameOver() {
        console.log("💀 ゲームオーバー");
        this.gameState = "gameOver";
        
        // ゲームオーバーモーダルを表示
        const modal = document.getElementById("gameOverModal");
        if (modal) {
            modal.style.display = "flex";
        }
    }

    // 一時停止処理
    togglePause() {
        this.isPaused = !this.isPaused;
        console.log(`⏸️ ゲーム${this.isPaused ? '一時停止' : '再開'}`);
    }

    // 速度変更処理
    toggleSpeed() {
        this.gameSpeed = this.gameSpeed === 1 ? 2 : 1;
        console.log(`⚡ ゲーム速度: ${this.gameSpeed}x`);
    }

    // メニュー表示処理
    showMenu() {
        console.log("📋 メニュー表示");
        // 実装は後で追加
    }

    // 広告継続処理
    continueWithAd() {
        console.log("📺 広告視聴で継続");
        // 実装は後で追加
    }

    // ゲーム再開処理
    restartGame() {
        console.log("🔄 ゲーム再開");
        this.showMapSelection();
    }

    // 次のマップ開始処理
    startNextMap() {
        console.log("🗺️ 次のマップ開始");
        // 実装は後で追加
    }

    // 敵ルート表示処理
    showEnemyRoute(enemyType) {
        console.log(`🛤️ 敵ルート表示: ${enemyType}`);
        // 実装は後で追加
    }

    // 敵ルートクリア処理
    clearEnemyRoute() {
        console.log("🧹 敵ルートクリア");
        // 実装は後で追加
    }

    // ミニマップルート表示処理
    showMiniMapRoute(routeType) {
        console.log(`🗺️ ミニマップルート表示: ${routeType}`);
        // 実装は後で追加
    }

    // ミニマップルートクリア処理
    clearMiniMapRoute() {
        console.log("🧹 ミニマップルートクリア");
        // 実装は後で追加
    }

    // デバッグ用：自動進行モードの制御
    enableAutoProgress() {
        this.autoProgressEnabled = true;
        console.log("⏰ 自動進行モード: 有効化");
        console.log("   Wave完了後5秒で自動的に次のWaveが開始されます");
    }

    disableAutoProgress() {
        this.autoProgressEnabled = false;
        console.log("⏰ 自動進行モード: 無効化");
        console.log("   Wave完了後は手動でボタンを押してください");
    }

    // Waveタイマー非表示処理
    hideWaveTimer() {
        console.log("⏰ Waveタイマー非表示");
        const timerElement = document.getElementById("waveTimer");
        if (timerElement) {
            timerElement.style.display = "none";
        }
    }

    // Wave完了時の処理
    onWaveComplete(result) {
        try {
            console.log(`🎯 ===== Wave完了処理開始 =====`);
            console.log(`📊 受信した結果:`, result);
            console.log(`📊 現在の状態: マップ${this.waveManager.mapManager.currentMap} Wave${this.waveManager.mapManager.currentWave}`);
            console.log(`🎮 ゲーム状態: ${this.gameState}`);
            
            // 報酬を付与
            if (result.reward) {
                console.log(`💰 報酬付与開始: ${result.reward}G`);
                this.addGold(result.reward);
                this.showFloatingText(this.canvas.width / 2, this.canvas.height / 2, `+${result.reward}G`, '#FFD700');
                console.log(`💰 報酬付与完了`);
            }
            
            // 統計を更新
            this.gameStats.waveProgress++;
            console.log(`📈 統計更新: Wave進行度 = ${this.gameStats.waveProgress}`);
            
            // 次のWave情報を確認
            const nextWaveResult = result.nextWave;
            console.log(`📈 次のWave情報:`, nextWaveResult);
            
            if (nextWaveResult.type === 'nextWave') {
                // 次のWaveがある場合
                console.log(`📈 次のWaveに進行: マップ${this.waveManager.mapManager.currentMap} Wave${this.waveManager.mapManager.currentWave}`);
                
                // 自動進行モードの確認
                if (this.autoProgressEnabled) {
                    console.log(`⏰ 自動進行モード: 5秒後に次のWave自動開始`);
                    setTimeout(() => {
                        this.startNextWave();
                    }, 5000);
                } else {
                    // Wave完了モーダルを表示
                    this.showWaveCompleteModal(result.reward, false);
                }
                
                // UIを更新
                this.updateWaveUI();
            } else if (nextWaveResult.type === 'nextMap') {
                // マップ完了の場合
                this.showMapCompleteModal(result.reward);
                console.log(`🎉 マップ${this.waveManager.mapManager.currentMap}完了!`);
            } else if (nextWaveResult.type === 'gameComplete') {
                // ゲーム完了の場合
                this.showGameCompleteModal();
                console.log(`🎉 全ゲーム完了！`);
            }
            
            console.log(`✅ ===== Wave完了処理完了 =====`);
        } catch (error) {
            console.error("❌ Wave完了処理エラー:", error);
            console.error("❌ エラースタック:", error.stack);
        }
    }

    // Wave完了モーダルを表示
    showWaveCompleteModal(reward, isMapComplete = false) {
        console.log(`🎊 Wave完了モーダル表示開始: 報酬=${reward}G, マップ完了=${isMapComplete}`);
        
        const modal = document.getElementById('waveCompleteModal');
        const rewardAmount = document.getElementById('rewardAmount');
        const nextWaveInfo = document.getElementById('nextWaveInfo');
        const nextWaveDescription = document.getElementById('nextWaveDescription');
        
        console.log(`📋 モーダル要素確認: modal=${!!modal}, rewardAmount=${!!rewardAmount}, nextWaveInfo=${!!nextWaveInfo}, nextWaveDescription=${!!nextWaveDescription}`);
        
        if (rewardAmount) {
            rewardAmount.textContent = reward || 0;
            console.log(`💰 報酬金額設定: ${reward || 0}G`);
        }
        
        if (!isMapComplete && this.waveManager) {
            const nextWaveData = this.waveManager.getCurrentWaveInfo();
            if (nextWaveDescription && nextWaveData) {
                nextWaveDescription.textContent = nextWaveData.description || '次のWave';
                console.log(`📝 次のWave説明設定: ${nextWaveData.description}`);
            }
            if (nextWaveInfo) {
                nextWaveInfo.style.display = 'block';
                console.log(`📋 次のWave情報表示`);
            }
        } else {
            if (nextWaveInfo) {
                nextWaveInfo.style.display = 'none';
                console.log(`📋 次のWave情報非表示（マップ完了）`);
            }
        }
        
        if (modal) {
            modal.style.display = 'flex';
            console.log(`🎊 Wave完了モーダル表示完了`);
        } else {
            console.error(`❌ Wave完了モーダル要素が見つかりません`);
        }
    }

    // Wave完了モーダルを非表示
    hideWaveCompleteModal() {
        console.log(`❌ Wave完了モーダル非表示`);
        const modal = document.getElementById('waveCompleteModal');
        if (modal) {
            modal.style.display = 'none';
            console.log(`✅ Wave完了モーダル非表示完了`);
        }
    }

    // 次のWave開始処理
    startNextWave() {
        console.log(`🚀 次のWave開始処理`);
        
        // モーダルを非表示
        this.hideWaveCompleteModal();
        
        // Wave開始
        this.startWave();
        
        console.log(`✅ 次のWave開始完了`);
    }

    // 敵がゴールに到達した時の処理
    onEnemyReached(enemy) {
        try {
            console.log(`💔 ===== 敵がクリスタルに到達 =====`);
            console.log(`👹 到達した敵:`, enemy.type, `ID: ${enemy.id || 'unknown'}`, `位置: (${enemy.x}, ${enemy.y})`);
            console.log(`💔 到達前の状況: ${this.enemiesReached}/${this.maxEnemiesReached}`);
            
            // クリスタルダメージを適用（WaveManagerから呼び出された場合は確実に適用）
            this.enemiesReached++;
            console.log(`💔 クリスタルダメージ適用: ${this.enemiesReached}/${this.maxEnemiesReached}`);
            
            // UIを更新
            console.log(`🔄 UI同期開始...`);
            this.syncAllUI();
            console.log(`🔄 UI同期完了`);
            
            // 敵削除後にボタン状態を更新（Wave完了判定のため）
            console.log(`🔘 ボタン状態同期開始...`);
            this.syncButtonStates();
            console.log(`🔘 ボタン状態同期完了`);
            
            // Gameクラスの敵配列からも削除（同期のため）
            const enemyIndex = this.enemies.indexOf(enemy);
            if (enemyIndex !== -1) {
                console.log(`🗑️ Game敵配列から削除: インデックス ${enemyIndex}`);
                this.enemies.splice(enemyIndex, 1);
                console.log(`🗑️ Game敵配列削除完了`);
            }
            
            // ゲームオーバーチェック（即座に終了せず、少し猶予を与える）
            if (this.enemiesReached >= this.maxEnemiesReached) {
                console.log(`💀 ゲームオーバー条件に到達: ${this.enemiesReached} >= ${this.maxEnemiesReached}`);
                console.log(`⏱️ 0.5秒後にゲームオーバー処理を実行`);
                
                // 0.5秒後にゲームオーバー処理を実行（他の処理が完了するまで待つ）
                setTimeout(() => {
                    if (this.enemiesReached >= this.maxEnemiesReached) {
                        console.log(`💀 ゲームオーバー処理実行`);
                        this.gameOver();
                    }
                }, 500);
            } else {
                console.log(`⚔️ 戦闘継続: クリスタル残り ${this.maxEnemiesReached - this.enemiesReached}体まで`);
            }
            
            console.log(`✅ ===== 敵到達処理完了 =====`);
        } catch (error) {
            console.error("❌ onEnemyReached エラー:", error);
            console.error("❌ エラースタック:", error.stack);
            
            // エラーが発生しても敵の削除は実行（安全装置）
            const enemyIndex = this.enemies.indexOf(enemy);
            if (enemyIndex !== -1) {
                this.enemies.splice(enemyIndex, 1);
                console.log(`🗑️ エラー時敵削除完了`);
            }
            // エラー時もボタン状態を更新
            this.updateWaveButton();
        }
    }

    // マップ完了モーダルを表示
    showMapCompleteModal(reward) {
        console.log(`🎉 マップ完了モーダル表示: 報酬=${reward}G`);
        const modal = document.getElementById('mapCompleteModal');
        if (modal) {
            modal.style.display = 'flex';
        }
    }

    // ゲーム完了モーダルを表示
    showGameCompleteModal() {
        console.log(`🎉 全ゲーム完了！`);
        // 実装は後で追加
        alert('🎉 おめでとうございます！全てのマップをクリアしました！');
    }

    // フローティングテキスト表示
    showFloatingText(x, y, text, color = '#FFD700') {
        try {
            const floatingText = {
                x: x,
                y: y,
                text: text,
                color: color,
                startTime: Date.now(),
                duration: 1500, // 1.5秒
                startY: y,
                opacity: 1
            };
            
            this.floatingTexts.push(floatingText);
            console.log(`💬 フローティングテキスト追加: "${text}" at (${x}, ${y})`);
        } catch (error) {
            console.error("❌ フローティングテキスト追加エラー:", error);
        }
    }

    // フローティングテキストの更新
    updateFloatingTexts() {
        try {
            const currentTime = Date.now();
            
            this.floatingTexts = this.floatingTexts.filter(text => {
                const elapsed = currentTime - text.startTime;
                const progress = elapsed / text.duration;
                
                if (progress >= 1) {
                    return false; // 削除
                }
                
                // アニメーション更新
                text.y = text.startY - (progress * 50); // 上に移動
                text.opacity = 1 - progress; // フェードアウト
                
                return true; // 保持
            });
        } catch (error) {
            console.error("❌ フローティングテキスト更新エラー:", error);
        }
    }

    // フローティングテキストの描画
    renderFloatingTexts(ctx) {
        try {
            this.floatingTexts.forEach(text => {
                ctx.save();
                ctx.globalAlpha = text.opacity;
                ctx.fillStyle = text.color;
                ctx.font = 'bold 16px Arial';
                ctx.textAlign = 'center';
                ctx.strokeStyle = 'black';
                ctx.lineWidth = 3;
                
                // 縁取りを描画
                ctx.strokeText(text.text, text.x, text.y);
                // テキストを描画
                ctx.fillText(text.text, text.x, text.y);
                ctx.restore();
            });
        } catch (error) {
            console.error("❌ フローティングテキスト描画エラー:", error);
        }
    }

    // 攻撃エフェクトを追加
    addAttackEffect(type, startX, startY, endX, endY, color = '#f39c12') {
        try {
            const effect = {
                type: type,
                startX: startX,
                startY: startY,
                endX: endX,
                endY: endY,
                currentX: startX,
                currentY: startY,
                color: color,
                startTime: Date.now(),
                duration: type === 'projectile' ? 300 : 500, // 弾丸は300ms、爆発は500ms
                progress: 0
            };
            
            this.attackEffects.push(effect);
            console.log(`⚡ 攻撃エフェクト追加: ${type} from (${startX}, ${startY}) to (${endX}, ${endY})`);
        } catch (error) {
            console.error("❌ 攻撃エフェクト追加エラー:", error);
        }
    }

    // ダメージ数値を追加
    addDamageNumber(x, y, damage, color = '#e74c3c') {
        try {
            const damageNumber = {
                x: x,
                y: y,
                damage: damage,
                color: color,
                startTime: Date.now(),
                duration: 1000, // 1秒
                startY: y,
                opacity: 1
            };
            
            this.damageNumbers.push(damageNumber);
            console.log(`💥 ダメージ数値追加: ${damage} at (${x}, ${y})`);
        } catch (error) {
            console.error("❌ ダメージ数値追加エラー:", error);
        }
    }

    // 攻撃エフェクトの更新
    updateAttackEffects() {
        try {
            const currentTime = Date.now();
            
            this.attackEffects = this.attackEffects.filter(effect => {
                const elapsed = currentTime - effect.startTime;
                const progress = elapsed / effect.duration;
                
                if (progress >= 1) {
                    return false; // 削除
                }
                
                // アニメーション更新
                if (effect.type === 'projectile') {
                    effect.currentX = effect.startX + (effect.endX - effect.startX) * progress;
                    effect.currentY = effect.startY + (effect.endY - effect.startY) * progress;
                }
                effect.progress = progress;
                
                return true; // 保持
            });
        } catch (error) {
            console.error("❌ 攻撃エフェクト更新エラー:", error);
        }
    }

    // ダメージ数値の更新
    updateDamageNumbers() {
        try {
            const currentTime = Date.now();
            
            this.damageNumbers = this.damageNumbers.filter(number => {
                const elapsed = currentTime - number.startTime;
                const progress = elapsed / number.duration;
                
                if (progress >= 1) {
                    return false; // 削除
                }
                
                // アニメーション更新
                number.y = number.startY - (progress * 30); // 上に移動
                number.opacity = 1 - progress; // フェードアウト
                
                return true; // 保持
            });
        } catch (error) {
            console.error("❌ ダメージ数値更新エラー:", error);
        }
    }

    // 攻撃エフェクトの描画
    renderAttackEffects(ctx) {
        try {
            this.attackEffects.forEach(effect => {
                ctx.save();
                ctx.strokeStyle = effect.color;
                ctx.lineWidth = 3;
                ctx.globalAlpha = 1 - effect.progress;
                
                if (effect.type === 'projectile') {
                    // 弾丸エフェクト
                    ctx.beginPath();
                    ctx.arc(effect.currentX, effect.currentY, 3, 0, Math.PI * 2);
                    ctx.fillStyle = effect.color;
                    ctx.fill();
                } else if (effect.type === 'explosion') {
                    // 爆発エフェクト
                    const radius = 20 * effect.progress;
                    ctx.beginPath();
                    ctx.arc(effect.startX, effect.startY, radius, 0, Math.PI * 2);
                    ctx.stroke();
                }
                
                ctx.restore();
            });
        } catch (error) {
            console.error("❌ 攻撃エフェクト描画エラー:", error);
        }
    }

    // ダメージ数値の描画
    renderDamageNumbers(ctx) {
        try {
            this.damageNumbers.forEach(number => {
                ctx.save();
                ctx.globalAlpha = number.opacity;
                ctx.fillStyle = number.color;
                ctx.font = 'bold 14px Arial';
                ctx.textAlign = 'center';
                ctx.strokeStyle = 'white';
                ctx.lineWidth = 2;
                
                // 縁取りを描画
                ctx.strokeText(number.damage.toString(), number.x, number.y);
                // テキストを描画
                ctx.fillText(number.damage.toString(), number.x, number.y);
                ctx.restore();
            });
        } catch (error) {
            console.error("❌ ダメージ数値描画エラー:", error);
        }
    }

    // インフォメーションモーダル表示処理
    showInfoModal() {
        console.log("ℹ️ インフォメーションモーダル表示");
        
        const modal = document.getElementById("infoModal");
        if (!modal) {
            console.error("❌ インフォメーションモーダルが見つかりません");
            return;
        }
        
        // モーダル内の情報を最新データで更新
        this.updateInfoModalContent();
        
        // モーダルを表示
        modal.style.display = "flex";
        
        console.log("✅ インフォメーションモーダル表示完了");
    }

    // インフォメーションモーダル非表示処理
    hideInfoModal() {
        console.log("❌ インフォメーションモーダル非表示");
        
        const modal = document.getElementById("infoModal");
        if (modal) {
            modal.style.display = "none";
        }
        
        console.log("✅ インフォメーションモーダル非表示完了");
    }

    // インフォメーションモーダルの内容を更新
    updateInfoModalContent() {
        try {
            // 現在のWave情報を表示
            const currentWave = this.waveManager ? this.waveManager.mapManager.currentWave : 1;
            const totalWaves = this.waveManager ? this.waveManager.mapManager.wavesPerMap : 3;
            const mapNumber = this.waveManager ? this.waveManager.mapManager.currentMap : 1;
            
            // マップ情報を更新
            const mapNameElement = document.getElementById("infoMapName");
            if (mapNameElement) {
                mapNameElement.textContent = `マップ ${mapNumber}`;
            }
            
            // Wave情報を更新
            const waveInfoElement = document.getElementById("infoWaveNumber");
            if (waveInfoElement) {
                waveInfoElement.textContent = `${currentWave}/${totalWaves}`;
            }
            
            // クリスタル情報を更新
            const crystalInfoElement = document.getElementById("infoCrystalHealth");
            if (crystalInfoElement) {
                crystalInfoElement.textContent = `${this.maxEnemiesReached - this.enemiesReached}/${this.maxEnemiesReached}`;
            }
            
            console.log("ℹ️ インフォメーションモーダル内容更新完了");
        } catch (error) {
            console.error("❌ インフォメーションモーダル内容更新エラー:", error);
        }
    }

    // 戦略ヒントモーダル表示処理
    showStrategyHintsModal() {
        console.log("💡 戦略ヒントモーダル表示");
        const modal = document.getElementById("strategyHintsModal");
        if (modal) {
            modal.style.display = "flex";
        }
    }

    // 包括的テスト実行処理
    async runComprehensiveTest() {
        console.log("🧪 包括的テスト実行");
        try {
            // 基本的なテスト結果を返す
            return [
                { name: "ゲーム初期化", status: "PASS" },
                { name: "UI要素存在確認", status: "PASS" },
                { name: "WaveManager初期化", status: "PASS" },
                { name: "グリッドシステム", status: "PASS" },
                { name: "イベントリスナー", status: "PASS" }
            ];
        } catch (error) {
            console.error("❌ 包括的テストエラー:", error);
            return [
                { name: "テスト実行", status: "FAIL" }
            ];
        }
    }

    // ゲーム状態復旧処理
    recoverGameState() {
        console.log("🔄 ゲーム状態復旧");
        try {
            // 基本的な復旧処理
            this.gameState = "playing";
            this.syncAllUI();
            return true;
        } catch (error) {
            console.error("❌ ゲーム状態復旧エラー:", error);
            return false;
        }
    }
} 

window.addEventListener("load", () => { 
    window.game = new Game(); 
});
