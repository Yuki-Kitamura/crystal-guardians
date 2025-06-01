// 高難易度コンテンツシステム
const ATTEMPT_BONUSES = {
    4: { 
        goldBonus: 0.1, 
        description: "4回目挑戦ボーナス: ゴールド+10%" 
    },
    5: { 
        goldBonus: 0.2, 
        damageBonus: 0.05, 
        description: "5回目挑戦ボーナス: ゴールド+20%, 攻撃力+5%" 
    },
    6: { 
        goldBonus: 0.3, 
        damageBonus: 0.1, 
        rangeBonus: 0.05, 
        description: "6回目挑戦ボーナス: ゴールド+30%, 攻撃力+10%, 射程+5%" 
    },
    7: { 
        goldBonus: 0.5, 
        damageBonus: 0.15, 
        rangeBonus: 0.1, 
        description: "7回目挑戦ボーナス: ゴールド+50%, 攻撃力+15%, 射程+10%" 
    }
};

const FAILURE_REASONS = {
    CRYSTAL_DESTROYED: "crystal_destroyed",
    TIME_LIMIT: "time_limit",
    INSUFFICIENT_DEFENSE: "insufficient_defense",
    POOR_POSITIONING: "poor_positioning",
    RESOURCE_SHORTAGE: "resource_shortage"
};

const STRATEGY_HINTS = {
    1: [
        "🏹 アーチャーを道路の曲がり角に配置すると効果的です",
        "⚔️ ウォリアーは敵の進路を塞ぐように配置しましょう",
        "💰 初期は安価なキャラクターで経済を回しましょう"
    ],
    2: [
        "🌪️ タイムメイジの減速効果を活用しましょう",
        "🎯 射程の長いキャラクターを後方に配置",
        "🔄 敵の種類に応じてキャラクターを使い分けましょう"
    ],
    3: [
        "🦇 空中ユニットに対応できるキャラクターを配置",
        "🛡️ 装甲敵には高火力キャラクターが有効",
        "⚡ 複数の攻撃ルートを想定した配置を"
    ]
};

class DifficultySystem {
    constructor() {
        this.mapAttempts = {}; // マップごとの挑戦回数
        this.mapFailures = {}; // マップごとの失敗履歴
        this.currentDifficulty = {};
        this.playerStats = {
            totalPlayTime: 0,
            totalGoldEarned: 0,
            enemiesDefeated: 0,
            mapsCompleted: 0
        };
        
        console.log("🎯 高難易度システム初期化完了");
    }

    // マップ難易度を取得（全マップ標準難易度に統一）
    getMapDifficulty(mapNumber) {
        // 全てのマップで標準難易度を使用
        return {
            enemyHpMultiplier: 1.0,
            enemySpeedMultiplier: 1.0,
            enemyCountMultiplier: 1.0,
            specialEnemyChance: 0.1,
            goldRewardMultiplier: 1.0,
            description: "標準難易度"
        };
    }

    // 挑戦回数ボーナスを取得
    getAttemptBonus(mapNumber) {
        const attempts = this.getAttemptCount(mapNumber);
        
        // 1〜3回目までは補正なし
        if (attempts <= 3) {
            return {
                goldBonus: 0,
                damageBonus: 0,
                rangeBonus: 0,
                description: attempts === 1 ? "初回挑戦" : `${attempts}回目挑戦`
            };
        }
        
        // 4回目以降は補正あり
        return ATTEMPT_BONUSES[attempts] || ATTEMPT_BONUSES[7];
    }

    // 挑戦回数を取得
    getAttemptCount(mapNumber) {
        return this.mapAttempts[mapNumber] || 1;
    }

    // 挑戦回数を増加
    incrementAttemptCount(mapNumber) {
        this.mapAttempts[mapNumber] = (this.mapAttempts[mapNumber] || 0) + 1;
        console.log(`🎯 マップ${mapNumber} 挑戦回数: ${this.mapAttempts[mapNumber]}`);
        return this.mapAttempts[mapNumber];
    }

    // 統合された難易度効果を計算
    getCombinedDifficultyEffects(mapNumber, weatherEffects) {
        const mapDifficulty = this.getMapDifficulty(mapNumber);
        const attemptBonus = this.getAttemptBonus(mapNumber);
        
        return {
            // 敵の強化
            enemyHpMultiplier: mapDifficulty.enemyHpMultiplier * (weatherEffects.enemyHpMultiplier || 1.0),
            enemySpeedMultiplier: mapDifficulty.enemySpeedMultiplier * (weatherEffects.enemySpeedMultiplier || 1.0),
            enemyCountMultiplier: mapDifficulty.enemyCountMultiplier,
            specialEnemyChance: mapDifficulty.specialEnemyChance,
            
            // プレイヤーのボーナス
            goldMultiplier: mapDifficulty.goldRewardMultiplier * 
                           (weatherEffects.goldMultiplier || 1.0) * 
                           (1 + (attemptBonus.goldBonus || 0)),
            towerDamageMultiplier: (weatherEffects.towerDamageMultiplier || 1.0) * 
                                  (1 + (attemptBonus.damageBonus || 0)),
            towerRangeMultiplier: (weatherEffects.towerRangeMultiplier || 1.0) * 
                                 (1 + (attemptBonus.rangeBonus || 0))
        };
    }

    // マップ失敗時の処理
    onMapFailure(mapNumber, failureReason, gameStats) {
        this.incrementAttemptCount(mapNumber);
        
        // 失敗履歴を記録
        if (!this.mapFailures[mapNumber]) {
            this.mapFailures[mapNumber] = [];
        }
        
        const failureData = {
            reason: failureReason,
            timestamp: Date.now(),
            stats: { ...gameStats },
            attemptNumber: this.getAttemptCount(mapNumber)
        };
        
        this.mapFailures[mapNumber].push(failureData);
        
        // 失敗分析を表示
        this.showFailureAnalysis(mapNumber, failureReason, gameStats);
        
        // 戦略ヒントを提供
        this.provideStrategyHints(mapNumber);
        
        // 部分的な報酬を計算
        const partialReward = this.calculatePartialReward(mapNumber, gameStats);
        
        console.log(`💔 マップ${mapNumber}失敗: ${failureReason}, 挑戦回数: ${this.getAttemptCount(mapNumber)}`);
        
        return {
            partialReward,
            nextAttemptBonus: this.getAttemptBonus(mapNumber),
            hints: this.getStrategyHints(mapNumber)
        };
    }

    // 失敗分析を表示
    showFailureAnalysis(mapNumber, failureReason, gameStats) {
        const analysis = this.analyzeFailure(failureReason, gameStats);
        
        // 失敗分析モーダルを表示
        const modal = document.getElementById('failureAnalysisModal');
        if (modal) {
            document.getElementById('failureReason').textContent = analysis.reason;
            document.getElementById('failureDescription').textContent = analysis.description;
            document.getElementById('improvementSuggestions').innerHTML = 
                analysis.suggestions.map(s => `<li>${s}</li>`).join('');
            
            modal.style.display = 'flex';
        }
        
        return analysis;
    }

    // 失敗原因を分析
    analyzeFailure(failureReason, gameStats) {
        const analyses = {
            [FAILURE_REASONS.CRYSTAL_DESTROYED]: {
                reason: "クリスタル破壊",
                description: "敵がクリスタルに到達してしまいました",
                suggestions: [
                    "より多くの防御キャラクターを配置する",
                    "敵の進路を予測して戦略的に配置する",
                    "減速効果のあるキャラクターを活用する"
                ]
            },
            [FAILURE_REASONS.INSUFFICIENT_DEFENSE]: {
                reason: "防御力不足",
                description: "敵の攻撃力に対して防御が不十分でした",
                suggestions: [
                    "高火力キャラクターを優先的に配置する",
                    "射程の長いキャラクターを後方に配置する",
                    "敵の種類に応じてキャラクターを選択する"
                ]
            },
            [FAILURE_REASONS.RESOURCE_SHORTAGE]: {
                reason: "資源不足",
                description: "ゴールドが不足してキャラクターを配置できませんでした",
                suggestions: [
                    "初期は安価なキャラクターで経済を回す",
                    "敵撃破ボーナスを最大化する配置を心がける",
                    "トレジャーハンターを活用してゴールド収入を増やす"
                ]
            },
            [FAILURE_REASONS.POOR_POSITIONING]: {
                reason: "配置ミス",
                description: "キャラクターの配置が最適ではありませんでした",
                suggestions: [
                    "敵の進路を事前に確認する",
                    "射程範囲を考慮して配置する",
                    "複数の攻撃ルートをカバーする"
                ]
            }
        };
        
        return analyses[failureReason] || analyses[FAILURE_REASONS.INSUFFICIENT_DEFENSE];
    }

    // 戦略ヒントを提供
    provideStrategyHints(mapNumber) {
        const hints = this.getStrategyHints(mapNumber);
        
        // ヒント表示UI更新
        const hintsContainer = document.getElementById('strategyHints');
        if (hintsContainer) {
            hintsContainer.innerHTML = hints.map(hint => `<div class="hint-item">${hint}</div>`).join('');
        }
        
        return hints;
    }

    // マップ別戦略ヒントを取得
    getStrategyHints(mapNumber) {
        const baseHints = STRATEGY_HINTS[Math.min(mapNumber, 3)] || STRATEGY_HINTS[3];
        const attemptCount = this.getAttemptCount(mapNumber);
        
        // 挑戦回数に応じて追加ヒント
        const additionalHints = [];
        if (attemptCount >= 3) {
            additionalHints.push("🎯 天候効果を活用した戦略を考えてみましょう");
        }
        if (attemptCount >= 4) {
            additionalHints.push("⏰ 時間帯による効果も考慮に入れましょう");
        }
        if (attemptCount >= 5) {
            additionalHints.push("🔄 挑戦回数ボーナスを最大限活用しましょう");
        }
        
        return [...baseHints, ...additionalHints];
    }

    // 部分的な報酬を計算
    calculatePartialReward(mapNumber, gameStats) {
        const baseReward = 20; // 基本報酬
        const attemptCount = this.getAttemptCount(mapNumber);
        
        // 進行度に応じた報酬
        const progressReward = Math.floor(gameStats.waveProgress * 30);
        
        // 挑戦回数に応じたボーナス
        const attemptBonus = Math.min(attemptCount * 5, 25);
        
        // 敵撃破数に応じた報酬
        const defeatReward = Math.floor(gameStats.enemiesDefeated * 2);
        
        const totalReward = baseReward + progressReward + attemptBonus + defeatReward;
        
        console.log(`💰 部分報酬計算: 基本${baseReward} + 進行${progressReward} + 挑戦${attemptBonus} + 撃破${defeatReward} = ${totalReward}G`);
        
        return {
            total: totalReward,
            breakdown: {
                base: baseReward,
                progress: progressReward,
                attempt: attemptBonus,
                defeats: defeatReward
            }
        };
    }

    // マップ成功時の処理
    onMapSuccess(mapNumber, gameStats) {
        // 挑戦回数をリセット
        this.mapAttempts[mapNumber] = 0;
        
        // 統計更新
        this.playerStats.mapsCompleted++;
        this.playerStats.totalGoldEarned += gameStats.goldEarned || 0;
        this.playerStats.enemiesDefeated += gameStats.enemiesDefeated || 0;
        
        console.log(`🎉 マップ${mapNumber}クリア! 統計更新完了`);
        
        return {
            bonusReward: this.calculateSuccessBonus(mapNumber, gameStats),
            newRecord: this.checkNewRecord(mapNumber, gameStats)
        };
    }

    // 成功ボーナスを計算
    calculateSuccessBonus(mapNumber, gameStats) {
        const difficulty = this.getMapDifficulty(mapNumber);
        const baseBonus = 50 * mapNumber;
        const difficultyBonus = Math.floor(baseBonus * (difficulty.enemyHpMultiplier - 1));
        
        return baseBonus + difficultyBonus;
    }

    // 新記録チェック
    checkNewRecord(mapNumber, gameStats) {
        // 実装は後で追加（記録システムが必要）
        return false;
    }

    // プレイヤー統計を取得
    getPlayerStats() {
        return { ...this.playerStats };
    }

    // 難易度システムをリセット
    reset() {
        this.mapAttempts = {};
        this.mapFailures = {};
        this.currentDifficulty = {};
        
        console.log("🎯 難易度システムリセット");
    }

    // 失敗理由を判定
    determineFailureReason(gameStats) {
        if (gameStats.enemiesReached >= gameStats.maxEnemiesReached) {
            return FAILURE_REASONS.CRYSTAL_DESTROYED;
        }
        
        if (gameStats.charactersPlaced < 3) {
            return FAILURE_REASONS.RESOURCE_SHORTAGE;
        }
        
        if (gameStats.averageEnemyProgress > 0.8) {
            return FAILURE_REASONS.INSUFFICIENT_DEFENSE;
        }
        
        return FAILURE_REASONS.POOR_POSITIONING;
    }

    // 難易度情報を表示用に取得
    getDifficultyDisplayInfo(mapNumber) {
        const difficulty = this.getMapDifficulty(mapNumber);
        const attemptBonus = this.getAttemptBonus(mapNumber);
        const attemptCount = this.getAttemptCount(mapNumber);
        
        return {
            mapNumber,
            difficulty: difficulty.description,
            attemptCount,
            bonusDescription: attemptBonus.description,
            modifiers: {
                enemyHp: `${Math.round((difficulty.enemyHpMultiplier - 1) * 100)}%`,
                enemySpeed: `${Math.round((difficulty.enemySpeedMultiplier - 1) * 100)}%`,
                goldBonus: `${Math.round((attemptBonus.goldBonus || 0) * 100)}%`,
                damageBonus: `${Math.round((attemptBonus.damageBonus || 0) * 100)}%`
            }
        };
    }
} 