/**
 * Crystal Guardians - モバイル最適化システム
 * タッチ操作、ジェスチャー、モバイル専用UIの制御
 */

class MobileOptimizer {
    constructor(game) {
        this.game = game;
        this.isMobile = this.detectMobile();
        this.isTablet = this.detectTablet();
        this.touchSupport = 'ontouchstart' in window;
        this.orientation = this.getOrientation();
        
        // タッチ操作関連
        this.touchStartTime = 0;
        this.touchStartPos = { x: 0, y: 0 };
        this.longPressTimer = null;
        this.longPressThreshold = 500; // 500ms
        this.tapThreshold = 300; // 300ms
        this.swipeThreshold = 50; // 50px
        
        // モバイルUI要素
        this.mobileControls = null;
        this.mobileCharacterSelector = null;
        this.mobileInfoPanel = null;
        this.mobileTooltip = null;
        this.mobileDragFeedback = null;
        
        // 状態管理
        this.isCharacterSelectorOpen = false;
        this.isInfoPanelOpen = false;
        this.selectedCharacterType = null;
        this.isDragging = false;
        this.currentTooltip = null;
        
        console.log(`📱 モバイル最適化システム初期化: モバイル=${this.isMobile}, タブレット=${this.isTablet}, タッチ=${this.touchSupport}`);
        
        if (this.isMobile || this.touchSupport) {
            this.init();
        }
    }

    // デバイス検出
    detectMobile() {
        const userAgent = navigator.userAgent.toLowerCase();
        return /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent);
    }

    detectTablet() {
        const userAgent = navigator.userAgent.toLowerCase();
        return /ipad|android(?!.*mobile)|tablet/i.test(userAgent);
    }

    getOrientation() {
        return window.innerHeight > window.innerWidth ? 'portrait' : 'landscape';
    }

    // 初期化
    init() {
        this.createMobileUI();
        this.setupEventListeners();
        this.setupOrientationHandling();
        this.optimizeExistingUI();
        
        console.log("✅ モバイル最適化システム初期化完了");
    }

    // モバイル専用UI作成
    createMobileUI() {
        this.createMobileCharacterSelector();
        this.createMobileControls();
        this.createMobileInfoPanel();
        this.createMobileTooltip();
        this.createMobileDragFeedback();
        this.createGestureArea();
    }

    // モバイル専用キャラクター選択UI
    createMobileCharacterSelector() {
        const selector = document.createElement('div');
        selector.className = 'mobile-character-selector';
        selector.innerHTML = `
            <div class="mobile-character-grid">
                <div class="mobile-character-card" data-character="warrior">
                    <div class="mobile-character-icon">⚔️</div>
                    <div class="mobile-character-name">ウォリアー</div>
                    <div class="mobile-character-cost">100G</div>
                </div>
                <div class="mobile-character-card" data-character="archer">
                    <div class="mobile-character-icon">🏹</div>
                    <div class="mobile-character-name">アーチャー</div>
                    <div class="mobile-character-cost">80G</div>
                </div>
                <div class="mobile-character-card" data-character="wizard">
                    <div class="mobile-character-icon">🧙</div>
                    <div class="mobile-character-name">ウィザード</div>
                    <div class="mobile-character-cost">120G</div>
                </div>
                <div class="mobile-character-card" data-character="timemage">
                    <div class="mobile-character-icon">⏰</div>
                    <div class="mobile-character-name">タイムメイジ</div>
                    <div class="mobile-character-cost">100G</div>
                </div>
                <div class="mobile-character-card" data-character="treasurehunter">
                    <div class="mobile-character-icon">💰</div>
                    <div class="mobile-character-name">トレジャーハンター</div>
                    <div class="mobile-character-cost">60G</div>
                </div>
            </div>
            <div class="mobile-action-buttons">
                <button class="mobile-action-btn secondary" id="mobileCancelBtn">
                    <span>❌</span>キャンセル
                </button>
                <button class="mobile-action-btn success" id="mobileConfirmBtn" disabled>
                    <span>✅</span>配置
                </button>
            </div>
        `;
        
        document.body.appendChild(selector);
        this.mobileCharacterSelector = selector;
        
        // イベントリスナー設定
        this.setupCharacterSelectorEvents();
    }

    // モバイル専用コントロールパネル
    createMobileControls() {
        const controls = document.createElement('div');
        controls.className = 'mobile-controls';
        controls.innerHTML = `
            <div class="mobile-controls-header">
                <div class="mobile-controls-title">ゲームコントロール</div>
                <button class="mobile-controls-toggle" id="mobileControlsToggle">▼</button>
            </div>
            <div class="mobile-action-buttons">
                <button class="mobile-action-btn" id="mobileStartWaveBtn">
                    <span>🚀</span>Wave開始
                </button>
                <button class="mobile-action-btn secondary" id="mobilePauseBtn">
                    <span>⏸️</span>一時停止
                </button>
                <button class="mobile-action-btn secondary" id="mobileInfoBtn">
                    <span>ℹ️</span>情報
                </button>
            </div>
        `;
        
        document.body.appendChild(controls);
        this.mobileControls = controls;
        
        // イベントリスナー設定
        this.setupControlsEvents();
    }

    // モバイル専用情報パネル
    createMobileInfoPanel() {
        const panel = document.createElement('div');
        panel.className = 'mobile-info-panel';
        panel.innerHTML = `
            <div class="mobile-info-tabs">
                <button class="mobile-info-tab active" data-tab="wave">Wave</button>
                <button class="mobile-info-tab" data-tab="weather">天候</button>
                <button class="mobile-info-tab" data-tab="difficulty">難易度</button>
                <button class="mobile-info-tab" data-tab="grid">グリッド</button>
            </div>
            <div class="mobile-info-content" id="mobileInfoContent">
                <div class="wave-info">
                    <div class="wave-title">Wave 1</div>
                    <div class="wave-description">ゴブリンの群れが森から現れた！</div>
                </div>
            </div>
        `;
        
        document.body.appendChild(panel);
        this.mobileInfoPanel = panel;
        
        // イベントリスナー設定
        this.setupInfoPanelEvents();
    }

    // モバイル専用ツールチップ
    createMobileTooltip() {
        const tooltip = document.createElement('div');
        tooltip.className = 'mobile-tooltip';
        document.body.appendChild(tooltip);
        this.mobileTooltip = tooltip;
    }

    // モバイル専用ドラッグフィードバック
    createMobileDragFeedback() {
        const feedback = document.createElement('div');
        feedback.className = 'mobile-drag-feedback';
        feedback.innerHTML = '✅';
        document.body.appendChild(feedback);
        this.mobileDragFeedback = feedback;
    }

    // ジェスチャーエリア作成
    createGestureArea() {
        const gestureArea = document.createElement('div');
        gestureArea.className = 'mobile-gesture-area';
        
        const gameContainer = document.getElementById('gameContainer');
        if (gameContainer) {
            gameContainer.appendChild(gestureArea);
        }
        
        this.gestureArea = gestureArea;
    }

    // イベントリスナー設定
    setupEventListeners() {
        // タッチイベント
        document.addEventListener('touchstart', this.handleTouchStart.bind(this), { passive: false });
        document.addEventListener('touchmove', this.handleTouchMove.bind(this), { passive: false });
        document.addEventListener('touchend', this.handleTouchEnd.bind(this), { passive: false });
        
        // キャンバスタッチイベント
        if (this.game.canvas) {
            this.game.canvas.addEventListener('touchstart', this.handleCanvasTouchStart.bind(this), { passive: false });
            this.game.canvas.addEventListener('touchmove', this.handleCanvasTouchMove.bind(this), { passive: false });
            this.game.canvas.addEventListener('touchend', this.handleCanvasTouchEnd.bind(this), { passive: false });
        }
        
        // 画面回転イベント
        window.addEventListener('orientationchange', this.handleOrientationChange.bind(this));
        window.addEventListener('resize', this.handleResize.bind(this));
        
        // ビューポート変更イベント
        window.addEventListener('visualViewport', this.handleViewportChange.bind(this));
    }

    // キャラクター選択UIのイベント
    setupCharacterSelectorEvents() {
        // キャラクターカードのタッチイベント
        this.mobileCharacterSelector.querySelectorAll('.mobile-character-card').forEach(card => {
            card.addEventListener('touchstart', (e) => {
                e.preventDefault();
                this.handleCharacterCardTouch(card);
            });
        });
        
        // アクションボタンのイベント
        document.getElementById('mobileCancelBtn').addEventListener('click', () => {
            this.closeMobileCharacterSelector();
        });
        
        document.getElementById('mobileConfirmBtn').addEventListener('click', () => {
            this.confirmCharacterPlacement();
        });
    }

    // コントロールパネルのイベント
    setupControlsEvents() {
        document.getElementById('mobileControlsToggle').addEventListener('click', () => {
            this.toggleMobileControls();
        });
        
        document.getElementById('mobileStartWaveBtn').addEventListener('click', () => {
            if (this.game.startWave) {
                this.game.startWave();
            }
        });
        
        document.getElementById('mobilePauseBtn').addEventListener('click', () => {
            if (this.game.togglePause) {
                this.game.togglePause();
            }
        });
        
        document.getElementById('mobileInfoBtn').addEventListener('click', () => {
            this.toggleMobileInfoPanel();
        });
    }

    // 情報パネルのイベント
    setupInfoPanelEvents() {
        this.mobileInfoPanel.querySelectorAll('.mobile-info-tab').forEach(tab => {
            tab.addEventListener('click', () => {
                this.switchInfoTab(tab.dataset.tab);
            });
        });
    }

    // 画面回転対応
    setupOrientationHandling() {
        this.handleOrientationChange();
    }

    // 既存UIの最適化
    optimizeExistingUI() {
        // 既存のキャラクターパネルを非表示（ポートレートモード時）
        if (this.orientation === 'portrait' && window.innerWidth <= 768) {
            const characterPanel = document.querySelector('.character-panel');
            if (characterPanel) {
                characterPanel.style.display = 'none';
            }
        }
        
        // タッチターゲットサイズの調整
        this.adjustTouchTargets();
        
        // フォントサイズの調整
        this.adjustFontSizes();
    }

    // タッチイベントハンドラー
    handleTouchStart(e) {
        this.touchStartTime = Date.now();
        this.touchStartPos = {
            x: e.touches[0].clientX,
            y: e.touches[0].clientY
        };
        
        // 長押し検出開始
        this.longPressTimer = setTimeout(() => {
            this.handleLongPress(e);
        }, this.longPressThreshold);
    }

    handleTouchMove(e) {
        // 長押しタイマーをクリア（移動した場合）
        if (this.longPressTimer) {
            clearTimeout(this.longPressTimer);
            this.longPressTimer = null;
        }
        
        // ドラッグ中の処理
        if (this.isDragging) {
            this.handleDragMove(e);
        }
    }

    handleTouchEnd(e) {
        const touchEndTime = Date.now();
        const touchDuration = touchEndTime - this.touchStartTime;
        
        // 長押しタイマーをクリア
        if (this.longPressTimer) {
            clearTimeout(this.longPressTimer);
            this.longPressTimer = null;
        }
        
        // タップ判定
        if (touchDuration < this.tapThreshold) {
            this.handleTap(e);
        }
        
        // ドラッグ終了処理
        if (this.isDragging) {
            this.handleDragEnd(e);
        }
        
        // スワイプ判定
        this.handleSwipe(e);
    }

    // キャンバスタッチイベント
    handleCanvasTouchStart(e) {
        e.preventDefault();
        
        const touch = e.touches[0];
        const pos = this.getTouchPosition(touch);
        
        // キャラクター選択モードの場合
        if (this.selectedCharacterType) {
            this.showPlacementPreview(pos);
        }
    }

    handleCanvasTouchMove(e) {
        e.preventDefault();
        
        if (this.selectedCharacterType) {
            const touch = e.touches[0];
            const pos = this.getTouchPosition(touch);
            this.updatePlacementPreview(pos);
        }
    }

    handleCanvasTouchEnd(e) {
        e.preventDefault();
        
        if (this.selectedCharacterType) {
            const touch = e.changedTouches[0];
            const pos = this.getTouchPosition(touch);
            this.attemptCharacterPlacement(pos);
        }
    }

    // ジェスチャー処理
    handleTap(e) {
        // シングルタップ処理
        console.log("📱 タップ検出");
    }

    handleLongPress(e) {
        // 長押し処理
        console.log("📱 長押し検出");
        this.showMobileCharacterSelector();
        this.vibrate(50); // 短い振動フィードバック
    }

    handleSwipe(e) {
        const touchEndPos = {
            x: e.changedTouches[0].clientX,
            y: e.changedTouches[0].clientY
        };
        
        const deltaX = touchEndPos.x - this.touchStartPos.x;
        const deltaY = touchEndPos.y - this.touchStartPos.y;
        
        // スワイプ距離チェック
        if (Math.abs(deltaX) > this.swipeThreshold || Math.abs(deltaY) > this.swipeThreshold) {
            const direction = this.getSwipeDirection(deltaX, deltaY);
            this.handleSwipeGesture(direction);
        }
    }

    getSwipeDirection(deltaX, deltaY) {
        if (Math.abs(deltaX) > Math.abs(deltaY)) {
            return deltaX > 0 ? 'right' : 'left';
        } else {
            return deltaY > 0 ? 'down' : 'up';
        }
    }

    handleSwipeGesture(direction) {
        console.log(`📱 スワイプ検出: ${direction}`);
        
        switch (direction) {
            case 'up':
                this.showMobileInfoPanel();
                break;
            case 'down':
                this.hideMobileInfoPanel();
                break;
            case 'left':
                // 左スワイプ処理
                break;
            case 'right':
                // 右スワイプ処理
                break;
        }
    }

    // UI制御メソッド
    showMobileCharacterSelector() {
        this.mobileCharacterSelector.style.display = 'block';
        this.isCharacterSelectorOpen = true;
        this.updateCharacterCards();
    }

    closeMobileCharacterSelector() {
        this.mobileCharacterSelector.style.display = 'none';
        this.isCharacterSelectorOpen = false;
        this.selectedCharacterType = null;
        this.updateConfirmButton();
    }

    toggleMobileControls() {
        this.mobileControls.classList.toggle('show');
    }

    showMobileInfoPanel() {
        this.mobileInfoPanel.classList.add('show');
        this.isInfoPanelOpen = true;
    }

    hideMobileInfoPanel() {
        this.mobileInfoPanel.classList.remove('show');
        this.isInfoPanelOpen = false;
    }

    toggleMobileInfoPanel() {
        if (this.isInfoPanelOpen) {
            this.hideMobileInfoPanel();
        } else {
            this.showMobileInfoPanel();
        }
    }

    // キャラクター関連処理
    handleCharacterCardTouch(card) {
        const characterType = card.dataset.character;
        const cost = this.game.getCharacterCost(characterType);
        
        if (this.game.gold >= cost) {
            // 既存の選択をクリア
            this.mobileCharacterSelector.querySelectorAll('.mobile-character-card').forEach(c => {
                c.classList.remove('selected');
            });
            
            // 新しい選択を設定
            card.classList.add('selected');
            this.selectedCharacterType = characterType;
            this.updateConfirmButton();
            
            this.vibrate(30); // 軽い振動フィードバック
        } else {
            this.showMobileTooltip('ゴールドが不足しています');
            this.vibrate([100, 50, 100]); // エラー振動パターン
        }
    }

    confirmCharacterPlacement() {
        if (this.selectedCharacterType) {
            // キャラクター選択モードに移行
            this.closeMobileCharacterSelector();
            this.showMobileTooltip('配置したい場所をタップしてください');
            this.showPlacementMode();
        }
    }

    showPlacementMode() {
        // 配置モードのビジュアルフィードバック
        this.gestureArea.classList.add('active');
        
        // 配置可能エリアのハイライト
        this.highlightPlaceableAreas();
    }

    exitPlacementMode() {
        this.gestureArea.classList.remove('active');
        this.selectedCharacterType = null;
        this.clearPlaceableHighlights();
        this.hideMobileTooltip();
    }

    // 配置処理
    attemptCharacterPlacement(pos) {
        if (!this.selectedCharacterType) return;
        
        const gridPos = this.convertToGridPosition(pos);
        
        if (this.isValidPlacement(gridPos)) {
            this.placeCharacter(gridPos);
            this.showMobileDragFeedback(true);
            this.vibrate(50);
        } else {
            this.showMobileDragFeedback(false);
            this.vibrate([100, 50, 100]);
            this.showMobileTooltip('ここには配置できません');
        }
        
        this.exitPlacementMode();
    }

    // ユーティリティメソッド
    getTouchPosition(touch) {
        const rect = this.game.canvas.getBoundingClientRect();
        const scaleX = this.game.canvas.width / rect.width;
        const scaleY = this.game.canvas.height / rect.height;
        
        return {
            x: (touch.clientX - rect.left) * scaleX,
            y: (touch.clientY - rect.top) * scaleY
        };
    }

    convertToGridPosition(pos) {
        const gridX = Math.floor(pos.x / PANEL_SIZE);
        const gridY = Math.floor(pos.y / PANEL_SIZE);
        return { x: gridX, y: gridY };
    }

    isValidPlacement(gridPos) {
        // グリッドシステムを使用して配置可能性をチェック
        if (this.game.gridSystem) {
            return this.game.gridSystem.canPlaceCharacter(gridPos.x, gridPos.y);
        }
        return false;
    }

    placeCharacter(gridPos) {
        // ゲームシステムを使用してキャラクターを配置
        if (this.game.placeCharacter) {
            const pixelX = gridPos.x * PANEL_SIZE + PANEL_SIZE / 2;
            const pixelY = gridPos.y * PANEL_SIZE + PANEL_SIZE / 2;
            this.game.placeCharacter(pixelX, pixelY);
        }
    }

    // フィードバック表示
    showMobileTooltip(message, duration = 3000) {
        this.mobileTooltip.textContent = message;
        this.mobileTooltip.classList.add('show');
        
        setTimeout(() => {
            this.hideMobileTooltip();
        }, duration);
    }

    hideMobileTooltip() {
        this.mobileTooltip.classList.remove('show');
    }

    showMobileDragFeedback(success) {
        this.mobileDragFeedback.innerHTML = success ? '✅' : '❌';
        this.mobileDragFeedback.classList.toggle('invalid', !success);
        this.mobileDragFeedback.classList.add('show');
        
        setTimeout(() => {
            this.mobileDragFeedback.classList.remove('show');
        }, 1000);
    }

    // 振動フィードバック
    vibrate(pattern) {
        if ('vibrate' in navigator) {
            navigator.vibrate(pattern);
        }
    }

    // UI更新メソッド
    updateCharacterCards() {
        this.mobileCharacterSelector.querySelectorAll('.mobile-character-card').forEach(card => {
            const characterType = card.dataset.character;
            const cost = this.game.getCharacterCost(characterType);
            const canAfford = this.game.gold >= cost;
            
            card.classList.toggle('disabled', !canAfford);
            
            const costElement = card.querySelector('.mobile-character-cost');
            if (costElement) {
                costElement.textContent = `${cost}G`;
            }
        });
    }

    updateConfirmButton() {
        const confirmBtn = document.getElementById('mobileConfirmBtn');
        if (confirmBtn) {
            confirmBtn.disabled = !this.selectedCharacterType;
        }
    }

    switchInfoTab(tabName) {
        // タブの切り替え
        this.mobileInfoPanel.querySelectorAll('.mobile-info-tab').forEach(tab => {
            tab.classList.toggle('active', tab.dataset.tab === tabName);
        });
        
        // コンテンツの更新
        this.updateInfoContent(tabName);
    }

    updateInfoContent(tabName) {
        const content = document.getElementById('mobileInfoContent');
        if (!content) return;
        
        switch (tabName) {
            case 'wave':
                content.innerHTML = this.getWaveInfo();
                break;
            case 'weather':
                content.innerHTML = this.getWeatherInfo();
                break;
            case 'difficulty':
                content.innerHTML = this.getDifficultyInfo();
                break;
            case 'grid':
                content.innerHTML = this.getGridInfo();
                break;
        }
    }

    // 情報取得メソッド
    getWaveInfo() {
        if (this.game.waveManager) {
            const waveData = this.game.waveManager.getCurrentWaveInfo();
            return `
                <div class="wave-info">
                    <div class="wave-title">Wave ${this.game.waveManager.mapManager.currentWave}</div>
                    <div class="wave-description">${waveData.description}</div>
                </div>
            `;
        }
        return '<div>Wave情報を取得できません</div>';
    }

    getWeatherInfo() {
        if (this.game.weatherSystem) {
            const weather = this.game.weatherSystem.currentWeather;
            return `
                <div class="weather-info">
                    <div class="weather-name">${weather.name}</div>
                    <div class="weather-description">${weather.description}</div>
                </div>
            `;
        }
        return '<div>天候情報を取得できません</div>';
    }

    getDifficultyInfo() {
        return `
            <div class="difficulty-info">
                <div class="difficulty-title">標準難易度</div>
                <div class="difficulty-description">バランスの取れた難易度設定</div>
            </div>
        `;
    }

    getGridInfo() {
        if (this.game.gridSystem) {
            const stats = this.game.gridSystem.getStats();
            return `
                <div class="grid-info">
                    <div class="grid-stat">配置可能: ${stats.availableCount}</div>
                    <div class="grid-stat">使用中: ${stats.occupiedCount}</div>
                </div>
            `;
        }
        return '<div>グリッド情報を取得できません</div>';
    }

    // 画面回転・リサイズ処理
    handleOrientationChange() {
        setTimeout(() => {
            this.orientation = this.getOrientation();
            this.adjustLayoutForOrientation();
            console.log(`📱 画面回転: ${this.orientation}`);
        }, 100);
    }

    handleResize() {
        this.adjustLayoutForOrientation();
    }

    handleViewportChange() {
        // ビューポート変更時の処理（キーボード表示など）
        this.adjustForViewport();
    }

    adjustLayoutForOrientation() {
        const body = document.body;
        body.classList.toggle('portrait', this.orientation === 'portrait');
        body.classList.toggle('landscape', this.orientation === 'landscape');
        
        // レイアウト調整
        if (this.orientation === 'portrait' && window.innerWidth <= 768) {
            this.enablePortraitMode();
        } else {
            this.enableLandscapeMode();
        }
    }

    enablePortraitMode() {
        // ポートレートモード専用の調整
        const characterPanel = document.querySelector('.character-panel');
        if (characterPanel) {
            characterPanel.style.display = 'none';
        }
        
        if (this.mobileCharacterSelector) {
            this.mobileCharacterSelector.style.display = 'block';
        }
    }

    enableLandscapeMode() {
        // ランドスケープモード専用の調整
        const characterPanel = document.querySelector('.character-panel');
        if (characterPanel) {
            characterPanel.style.display = 'block';
        }
        
        if (this.mobileCharacterSelector) {
            this.mobileCharacterSelector.style.display = 'none';
        }
    }

    adjustForViewport() {
        // ビューポート調整（キーボード表示対応など）
        const visualViewport = window.visualViewport;
        if (visualViewport) {
            const heightDiff = window.innerHeight - visualViewport.height;
            if (heightDiff > 150) { // キーボードが表示されている可能性
                this.handleKeyboardShow();
            } else {
                this.handleKeyboardHide();
            }
        }
    }

    handleKeyboardShow() {
        // キーボード表示時の調整
        document.body.classList.add('keyboard-visible');
    }

    handleKeyboardHide() {
        // キーボード非表示時の調整
        document.body.classList.remove('keyboard-visible');
    }

    // タッチターゲット調整
    adjustTouchTargets() {
        const minTouchSize = 44; // iOS推奨サイズ
        
        document.querySelectorAll('.character-card, .control-btn, .start-wave-btn').forEach(element => {
            const rect = element.getBoundingClientRect();
            if (rect.width < minTouchSize || rect.height < minTouchSize) {
                element.style.minWidth = `${minTouchSize}px`;
                element.style.minHeight = `${minTouchSize}px`;
            }
        });
    }

    // フォントサイズ調整
    adjustFontSizes() {
        if (window.innerWidth <= 480) {
            document.body.classList.add('small-screen');
        } else {
            document.body.classList.remove('small-screen');
        }
    }

    // 配置可能エリアのハイライト
    highlightPlaceableAreas() {
        // グリッドシステムを使用して配置可能エリアをハイライト
        if (this.game.gridSystem) {
            this.game.gridSystem.highlightPlaceableAreas();
        }
    }

    clearPlaceableHighlights() {
        // ハイライトをクリア
        if (this.game.gridSystem) {
            this.game.gridSystem.clearHighlights();
        }
    }

    // 公開メソッド
    isActive() {
        return this.isMobile || this.touchSupport;
    }

    getCurrentOrientation() {
        return this.orientation;
    }

    // ゲームとの連携メソッド
    onGameStateChange(newState) {
        // ゲーム状態変更時の処理
        if (newState === 'playing') {
            this.mobileControls.classList.add('show');
        } else if (newState === 'mapSelection') {
            this.mobileControls.classList.remove('show');
            this.closeMobileCharacterSelector();
            this.hideMobileInfoPanel();
        }
    }

    onGoldChange(newGold) {
        // ゴールド変更時の処理
        this.updateCharacterCards();
    }

    onWaveStart() {
        // Wave開始時の処理
        this.closeMobileCharacterSelector();
        this.showMobileTooltip('Wave開始！', 2000);
    }

    onWaveComplete() {
        // Wave完了時の処理
        this.showMobileTooltip('Wave完了！', 2000);
        this.vibrate(100);
    }

    // クリーンアップ
    destroy() {
        // イベントリスナーの削除
        document.removeEventListener('touchstart', this.handleTouchStart);
        document.removeEventListener('touchmove', this.handleTouchMove);
        document.removeEventListener('touchend', this.handleTouchEnd);
        
        // UI要素の削除
        if (this.mobileCharacterSelector) {
            this.mobileCharacterSelector.remove();
        }
        if (this.mobileControls) {
            this.mobileControls.remove();
        }
        if (this.mobileInfoPanel) {
            this.mobileInfoPanel.remove();
        }
        if (this.mobileTooltip) {
            this.mobileTooltip.remove();
        }
        if (this.mobileDragFeedback) {
            this.mobileDragFeedback.remove();
        }
        
        console.log("📱 モバイル最適化システム終了");
    }
}

// グローバルインスタンス
window.MobileOptimizer = MobileOptimizer; 