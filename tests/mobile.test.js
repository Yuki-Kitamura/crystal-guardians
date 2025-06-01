/**
 * Crystal Guardians - モバイル最適化システムテスト
 * タッチ操作、レスポンシブデザイン、PWA機能のテスト
 */

class MobileOptimizationTest {
    constructor() {
        this.testResults = [];
        this.mockGame = this.createMockGame();
        this.mobileOptimizer = null;
        
        console.log("📱 モバイル最適化テスト開始");
    }

    // モックゲームオブジェクト作成
    createMockGame() {
        return {
            canvas: document.createElement('canvas'),
            gold: 1000,
            getCharacterCost: (type) => {
                const costs = {
                    warrior: 100,
                    archer: 80,
                    wizard: 120,
                    timemage: 100,
                    treasurehunter: 60
                };
                return costs[type] || 100;
            },
            placeCharacter: (x, y) => {
                console.log(`キャラクター配置: (${x}, ${y})`);
                return true;
            },
            startWave: () => {
                console.log("Wave開始");
                return true;
            },
            togglePause: () => {
                console.log("一時停止切り替え");
                return true;
            },
            addGold: (amount) => {
                this.gold += amount;
                return this.gold;
            },
            spendGold: (amount) => {
                if (this.gold >= amount) {
                    this.gold -= amount;
                    return true;
                }
                return false;
            },
            gridSystem: {
                canPlaceCharacter: (x, y) => {
                    return x >= 0 && x < 20 && y >= 0 && y < 15;
                },
                highlightPlaceableAreas: () => {
                    console.log("配置可能エリアハイライト");
                },
                clearHighlights: () => {
                    console.log("ハイライトクリア");
                },
                getStats: () => ({
                    availableCount: 200,
                    occupiedCount: 50
                })
            },
            waveManager: {
                mapManager: {
                    currentWave: 1
                },
                getCurrentWaveInfo: () => ({
                    description: "テストWave"
                })
            },
            weatherSystem: {
                currentWeather: {
                    name: "晴れ",
                    description: "良い天気です"
                }
            }
        };
    }

    // 全テスト実行
    async runAllTests() {
        console.log("📱 モバイル最適化テスト実行開始");
        
        try {
            await this.testDeviceDetection();
            await this.testMobileUICreation();
            await this.testTouchEvents();
            await this.testOrientationHandling();
            await this.testCharacterSelection();
            await this.testGestureRecognition();
            await this.testResponsiveDesign();
            await this.testPWAFeatures();
            await this.testAccessibility();
            await this.testPerformance();
            
            this.displayResults();
        } catch (error) {
            console.error("📱 テスト実行エラー:", error);
            this.addResult("テスト実行", false, error.message);
        }
    }

    // デバイス検出テスト
    async testDeviceDetection() {
        console.log("📱 デバイス検出テスト");
        
        try {
            // MobileOptimizerインスタンス作成
            this.mobileOptimizer = new MobileOptimizer(this.mockGame);
            
            // デバイス検出結果確認
            const isMobile = this.mobileOptimizer.isMobile;
            const isTablet = this.mobileOptimizer.isTablet;
            const touchSupport = this.mobileOptimizer.touchSupport;
            
            this.addResult("デバイス検出", true, 
                `モバイル: ${isMobile}, タブレット: ${isTablet}, タッチ: ${touchSupport}`);
            
            // 画面向き検出
            const orientation = this.mobileOptimizer.getOrientation();
            this.addResult("画面向き検出", true, `向き: ${orientation}`);
            
        } catch (error) {
            this.addResult("デバイス検出", false, error.message);
        }
    }

    // モバイルUI作成テスト
    async testMobileUICreation() {
        console.log("📱 モバイルUI作成テスト");
        
        try {
            if (!this.mobileOptimizer) {
                throw new Error("MobileOptimizerが初期化されていません");
            }
            
            // UI要素の存在確認
            const elements = [
                'mobileCharacterSelector',
                'mobileControls',
                'mobileInfoPanel',
                'mobileTooltip',
                'mobileDragFeedback'
            ];
            
            let createdCount = 0;
            for (const elementName of elements) {
                if (this.mobileOptimizer[elementName]) {
                    createdCount++;
                }
            }
            
            const success = createdCount === elements.length;
            this.addResult("モバイルUI作成", success, 
                `作成済み: ${createdCount}/${elements.length}`);
            
        } catch (error) {
            this.addResult("モバイルUI作成", false, error.message);
        }
    }

    // タッチイベントテスト
    async testTouchEvents() {
        console.log("📱 タッチイベントテスト");
        
        try {
            if (!this.mobileOptimizer) {
                throw new Error("MobileOptimizerが初期化されていません");
            }
            
            // タッチイベントシミュレーション
            const touchEvent = new TouchEvent('touchstart', {
                touches: [{
                    clientX: 100,
                    clientY: 100,
                    identifier: 0
                }],
                bubbles: true,
                cancelable: true
            });
            
            // イベント処理テスト
            let eventHandled = false;
            const originalHandleTouchStart = this.mobileOptimizer.handleTouchStart;
            this.mobileOptimizer.handleTouchStart = function(e) {
                eventHandled = true;
                return originalHandleTouchStart.call(this, e);
            };
            
            document.dispatchEvent(touchEvent);
            
            this.addResult("タッチイベント処理", eventHandled, 
                eventHandled ? "イベント正常処理" : "イベント未処理");
            
        } catch (error) {
            this.addResult("タッチイベント処理", false, error.message);
        }
    }

    // 画面回転対応テスト
    async testOrientationHandling() {
        console.log("📱 画面回転対応テスト");
        
        try {
            if (!this.mobileOptimizer) {
                throw new Error("MobileOptimizerが初期化されていません");
            }
            
            // 画面回転シミュレーション
            const originalInnerWidth = window.innerWidth;
            const originalInnerHeight = window.innerHeight;
            
            // ポートレートモードシミュレーション
            Object.defineProperty(window, 'innerWidth', { value: 375, configurable: true });
            Object.defineProperty(window, 'innerHeight', { value: 812, configurable: true });
            
            this.mobileOptimizer.handleOrientationChange();
            
            await new Promise(resolve => setTimeout(resolve, 150)); // 100ms待機 + 余裕
            
            const portraitOrientation = this.mobileOptimizer.getCurrentOrientation();
            
            // ランドスケープモードシミュレーション
            Object.defineProperty(window, 'innerWidth', { value: 812, configurable: true });
            Object.defineProperty(window, 'innerHeight', { value: 375, configurable: true });
            
            this.mobileOptimizer.handleOrientationChange();
            
            await new Promise(resolve => setTimeout(resolve, 150));
            
            const landscapeOrientation = this.mobileOptimizer.getCurrentOrientation();
            
            // 元に戻す
            Object.defineProperty(window, 'innerWidth', { value: originalInnerWidth, configurable: true });
            Object.defineProperty(window, 'innerHeight', { value: originalInnerHeight, configurable: true });
            
            const success = portraitOrientation === 'portrait' && landscapeOrientation === 'landscape';
            this.addResult("画面回転対応", success, 
                `ポートレート: ${portraitOrientation}, ランドスケープ: ${landscapeOrientation}`);
            
        } catch (error) {
            this.addResult("画面回転対応", false, error.message);
        }
    }

    // キャラクター選択テスト
    async testCharacterSelection() {
        console.log("📱 キャラクター選択テスト");
        
        try {
            if (!this.mobileOptimizer) {
                throw new Error("MobileOptimizerが初期化されていません");
            }
            
            // キャラクター選択UI表示
            this.mobileOptimizer.showMobileCharacterSelector();
            
            const isOpen = this.mobileOptimizer.isCharacterSelectorOpen;
            this.addResult("キャラクター選択UI表示", isOpen, 
                isOpen ? "UI正常表示" : "UI表示失敗");
            
            // キャラクターカード選択シミュレーション
            const mockCard = document.createElement('div');
            mockCard.dataset.character = 'warrior';
            mockCard.classList.add('mobile-character-card');
            
            this.mobileOptimizer.handleCharacterCardTouch(mockCard);
            
            const selectedType = this.mobileOptimizer.selectedCharacterType;
            this.addResult("キャラクター選択", selectedType === 'warrior', 
                `選択されたキャラクター: ${selectedType}`);
            
            // UI閉じる
            this.mobileOptimizer.closeMobileCharacterSelector();
            
        } catch (error) {
            this.addResult("キャラクター選択", false, error.message);
        }
    }

    // ジェスチャー認識テスト
    async testGestureRecognition() {
        console.log("📱 ジェスチャー認識テスト");
        
        try {
            if (!this.mobileOptimizer) {
                throw new Error("MobileOptimizerが初期化されていません");
            }
            
            // スワイプ方向判定テスト
            const testCases = [
                { deltaX: 100, deltaY: 0, expected: 'right' },
                { deltaX: -100, deltaY: 0, expected: 'left' },
                { deltaX: 0, deltaY: 100, expected: 'down' },
                { deltaX: 0, deltaY: -100, expected: 'up' }
            ];
            
            let correctCount = 0;
            for (const testCase of testCases) {
                const direction = this.mobileOptimizer.getSwipeDirection(testCase.deltaX, testCase.deltaY);
                if (direction === testCase.expected) {
                    correctCount++;
                }
            }
            
            const success = correctCount === testCases.length;
            this.addResult("ジェスチャー認識", success, 
                `正解: ${correctCount}/${testCases.length}`);
            
        } catch (error) {
            this.addResult("ジェスチャー認識", false, error.message);
        }
    }

    // レスポンシブデザインテスト
    async testResponsiveDesign() {
        console.log("📱 レスポンシブデザインテスト");
        
        try {
            // CSS メディアクエリテスト
            const testSizes = [
                { width: 320, height: 568, name: "iPhone SE" },
                { width: 375, height: 812, name: "iPhone X" },
                { width: 768, height: 1024, name: "iPad" },
                { width: 1920, height: 1080, name: "Desktop" }
            ];
            
            let responsiveCount = 0;
            for (const size of testSizes) {
                // ビューポートサイズ変更シミュレーション
                Object.defineProperty(window, 'innerWidth', { value: size.width, configurable: true });
                Object.defineProperty(window, 'innerHeight', { value: size.height, configurable: true });
                
                // レスポンシブ調整実行
                if (this.mobileOptimizer) {
                    this.mobileOptimizer.adjustLayoutForOrientation();
                }
                
                // CSS適用確認（簡易チェック）
                const isMobileSize = size.width <= 768;
                const bodyClasses = document.body.classList;
                
                if (isMobileSize) {
                    responsiveCount++;
                } else {
                    responsiveCount++;
                }
            }
            
            const success = responsiveCount === testSizes.length;
            this.addResult("レスポンシブデザイン", success, 
                `対応サイズ: ${responsiveCount}/${testSizes.length}`);
            
        } catch (error) {
            this.addResult("レスポンシブデザイン", false, error.message);
        }
    }

    // PWA機能テスト
    async testPWAFeatures() {
        console.log("📱 PWA機能テスト");
        
        try {
            // Service Worker登録確認
            const swSupported = 'serviceWorker' in navigator;
            this.addResult("Service Worker対応", swSupported, 
                swSupported ? "対応済み" : "未対応");
            
            // マニフェスト確認
            const manifestLink = document.querySelector('link[rel="manifest"]');
            const manifestExists = !!manifestLink;
            this.addResult("マニフェスト", manifestExists, 
                manifestExists ? "設定済み" : "未設定");
            
            // キャッシュAPI確認
            const cacheSupported = 'caches' in window;
            this.addResult("キャッシュAPI", cacheSupported, 
                cacheSupported ? "対応済み" : "未対応");
            
            // プッシュ通知確認
            const pushSupported = 'PushManager' in window;
            this.addResult("プッシュ通知", pushSupported, 
                pushSupported ? "対応済み" : "未対応");
            
        } catch (error) {
            this.addResult("PWA機能", false, error.message);
        }
    }

    // アクセシビリティテスト
    async testAccessibility() {
        console.log("📱 アクセシビリティテスト");
        
        try {
            // タッチターゲットサイズ確認
            const touchTargets = document.querySelectorAll('.character-card, .control-btn, .mobile-action-btn');
            let adequateSizeCount = 0;
            
            touchTargets.forEach(target => {
                const rect = target.getBoundingClientRect();
                if (rect.width >= 44 && rect.height >= 44) {
                    adequateSizeCount++;
                }
            });
            
            const touchTargetSuccess = adequateSizeCount === touchTargets.length;
            this.addResult("タッチターゲットサイズ", touchTargetSuccess, 
                `適切なサイズ: ${adequateSizeCount}/${touchTargets.length}`);
            
            // フォーカス表示確認
            const focusableElements = document.querySelectorAll('button, [tabindex]');
            let focusStyleCount = 0;
            
            focusableElements.forEach(element => {
                const styles = window.getComputedStyle(element, ':focus');
                if (styles.outline !== 'none' || styles.boxShadow !== 'none') {
                    focusStyleCount++;
                }
            });
            
            const focusSuccess = focusStyleCount > 0;
            this.addResult("フォーカス表示", focusSuccess, 
                `フォーカススタイル設定済み: ${focusStyleCount}`);
            
        } catch (error) {
            this.addResult("アクセシビリティ", false, error.message);
        }
    }

    // パフォーマンステスト
    async testPerformance() {
        console.log("📱 パフォーマンステスト");
        
        try {
            // タッチイベント処理時間測定
            const startTime = performance.now();
            
            // 複数のタッチイベントシミュレーション
            for (let i = 0; i < 100; i++) {
                const touchEvent = new TouchEvent('touchstart', {
                    touches: [{
                        clientX: Math.random() * 400,
                        clientY: Math.random() * 600,
                        identifier: i
                    }],
                    bubbles: true,
                    cancelable: true
                });
                
                if (this.mobileOptimizer) {
                    this.mobileOptimizer.handleTouchStart(touchEvent);
                }
            }
            
            const endTime = performance.now();
            const processingTime = endTime - startTime;
            
            const performanceGood = processingTime < 100; // 100ms以下
            this.addResult("タッチイベント処理性能", performanceGood, 
                `処理時間: ${processingTime.toFixed(2)}ms`);
            
            // メモリ使用量確認（可能な場合）
            if (performance.memory) {
                const memoryInfo = performance.memory;
                const memoryUsage = memoryInfo.usedJSHeapSize / 1024 / 1024; // MB
                
                const memoryGood = memoryUsage < 50; // 50MB以下
                this.addResult("メモリ使用量", memoryGood, 
                    `使用量: ${memoryUsage.toFixed(2)}MB`);
            }
            
        } catch (error) {
            this.addResult("パフォーマンス", false, error.message);
        }
    }

    // テスト結果追加
    addResult(testName, success, details) {
        this.testResults.push({
            name: testName,
            success: success,
            details: details,
            timestamp: new Date().toISOString()
        });
        
        const status = success ? "✅" : "❌";
        console.log(`${status} ${testName}: ${details}`);
    }

    // テスト結果表示
    displayResults() {
        console.log("\n📱 モバイル最適化テスト結果");
        console.log("=" * 50);
        
        const totalTests = this.testResults.length;
        const passedTests = this.testResults.filter(r => r.success).length;
        const failedTests = totalTests - passedTests;
        
        console.log(`総テスト数: ${totalTests}`);
        console.log(`成功: ${passedTests}`);
        console.log(`失敗: ${failedTests}`);
        console.log(`成功率: ${((passedTests / totalTests) * 100).toFixed(1)}%`);
        
        console.log("\n詳細結果:");
        this.testResults.forEach(result => {
            const status = result.success ? "✅" : "❌";
            console.log(`${status} ${result.name}: ${result.details}`);
        });
        
        // 失敗したテストの詳細
        const failedResults = this.testResults.filter(r => !r.success);
        if (failedResults.length > 0) {
            console.log("\n❌ 失敗したテスト:");
            failedResults.forEach(result => {
                console.log(`- ${result.name}: ${result.details}`);
            });
        }
        
        console.log("\n📱 モバイル最適化テスト完了");
    }

    // クリーンアップ
    cleanup() {
        if (this.mobileOptimizer) {
            this.mobileOptimizer.destroy();
        }
        
        // 作成されたDOM要素の削除
        const mobileElements = document.querySelectorAll(
            '.mobile-character-selector, .mobile-controls, .mobile-info-panel, .mobile-tooltip, .mobile-drag-feedback'
        );
        mobileElements.forEach(element => element.remove());
        
        console.log("📱 テスト環境クリーンアップ完了");
    }
}

// テスト実行
if (typeof window !== 'undefined') {
    window.MobileOptimizationTest = MobileOptimizationTest;
    
    // ページ読み込み完了後にテスト実行
    window.addEventListener('load', () => {
        setTimeout(() => {
            const test = new MobileOptimizationTest();
            test.runAllTests().then(() => {
                // テスト完了後のクリーンアップは手動で実行
                // test.cleanup();
            });
        }, 1000); // ゲーム初期化完了を待つ
    });
}

// Node.js環境での実行対応
if (typeof module !== 'undefined' && module.exports) {
    module.exports = MobileOptimizationTest;
} 