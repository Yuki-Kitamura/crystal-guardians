// 天候・時間帯システム
const WEATHER_EFFECTS = {
    sunny: {
        name: "晴天",
        towerRangeMultiplier: 1.0,
        enemySpeedMultiplier: 1.0,
        goldMultiplier: 1.0,
        description: "通常の戦闘状況",
        icon: "☀️",
        color: "#FFD700"
    },
    rainy: {
        name: "雨天", 
        towerRangeMultiplier: 0.9,
        enemySpeedMultiplier: 0.85,
        goldMultiplier: 1.1,
        description: "射程-10%、敵速度-15%、ゴールド+10%",
        icon: "🌧️",
        color: "#4682B4"
    },
    foggy: {
        name: "濃霧",
        towerRangeMultiplier: 0.8,
        enemySpeedMultiplier: 1.0,
        goldMultiplier: 1.2,
        description: "射程-20%、ゴールド+20%",
        icon: "🌫️",
        color: "#708090"
    },
    windy: {
        name: "強風",
        towerRangeMultiplier: 1.1,
        enemySpeedMultiplier: 1.15,
        goldMultiplier: 0.9,
        description: "射程+10%、敵速度+15%、ゴールド-10%",
        icon: "💨",
        color: "#87CEEB"
    },
    storm: {
        name: "嵐",
        towerRangeMultiplier: 0.85,
        enemySpeedMultiplier: 0.8,
        goldMultiplier: 1.3,
        towerDamageMultiplier: 1.1,
        description: "射程-15%、敵速度-20%、攻撃力+10%、ゴールド+30%",
        icon: "⛈️",
        color: "#483D8B"
    }
};

const TIME_OF_DAY_EFFECTS = {
    dawn: {
        name: "夜明け",
        towerDamageMultiplier: 0.9,
        enemyHpMultiplier: 0.95,
        description: "攻撃力-10%、敵HP-5%",
        icon: "🌅",
        color: "#FF6347",
        lightingLevel: 0.7
    },
    day: {
        name: "昼間",
        towerDamageMultiplier: 1.0,
        enemyHpMultiplier: 1.0,
        description: "通常状態",
        icon: "🌞",
        color: "#FFD700",
        lightingLevel: 1.0
    },
    dusk: {
        name: "夕暮れ",
        towerDamageMultiplier: 1.1,
        enemyHpMultiplier: 1.05,
        description: "攻撃力+10%、敵HP+5%",
        icon: "🌇",
        color: "#FF4500",
        lightingLevel: 0.8
    },
    night: {
        name: "夜間",
        towerDamageMultiplier: 1.2,
        enemyHpMultiplier: 1.15,
        towerRangeMultiplier: 0.85,
        description: "攻撃力+20%、敵HP+15%、射程-15%",
        icon: "🌙",
        color: "#191970",
        lightingLevel: 0.5
    }
};

class WeatherSystem {
    constructor() {
        this.currentWeather = 'sunny';
        this.currentTimeOfDay = 'day';
        this.weatherHistory = [];
        this.timeProgression = 0;
        this.visualEffects = [];
        this.lightingLevel = 1.0;
        this.skyColor = '#87CEEB';
        
        // 天候予報システム
        this.weatherForecast = [];
        this.generateWeatherForecast(5);
        
        console.log("🌤️ 天候・時間帯システム初期化完了");
    }

    // 天候をランダムに決定
    generateRandomWeather() {
        const weatherTypes = Object.keys(WEATHER_EFFECTS);
        const weights = [40, 25, 15, 15, 5]; // 晴天が最も高確率
        
        let totalWeight = weights.reduce((sum, weight) => sum + weight, 0);
        let random = Math.random() * totalWeight;
        
        for (let i = 0; i < weatherTypes.length; i++) {
            random -= weights[i];
            if (random <= 0) {
                return weatherTypes[i];
            }
        }
        
        return 'sunny';
    }

    // 天候予報を生成
    generateWeatherForecast(count) {
        this.weatherForecast = [];
        for (let i = 0; i < count; i++) {
            this.weatherForecast.push(this.generateRandomWeather());
        }
    }

    // 次のWaveの天候を取得（残りWave数を考慮）
    getNextWeatherForecast(currentWave = 1, totalWaves = 3) {
        const remainingWaves = totalWaves - currentWave;
        const forecastCount = Math.min(remainingWaves, this.weatherForecast.length);
        return this.weatherForecast.slice(0, forecastCount);
    }

    // Wave開始時に天候を設定
    setWeatherForWave(waveNumber) {
        // 予報から天候を取得、なければランダム生成
        if (this.weatherForecast.length > 0) {
            this.currentWeather = this.weatherForecast.shift();
        } else {
            this.currentWeather = this.generateRandomWeather();
        }
        
        // 新しい予報を追加
        this.weatherForecast.push(this.generateRandomWeather());
        
        this.weatherHistory.push({
            wave: waveNumber,
            weather: this.currentWeather,
            timeOfDay: this.currentTimeOfDay
        });
        
        console.log(`🌤️ Wave ${waveNumber}: ${WEATHER_EFFECTS[this.currentWeather].name} (${this.currentWeather})`);
        return this.currentWeather;
    }

    // マップ進行に応じて時間帯を更新
    updateTimeOfDay(mapNumber, waveNumber) {
        const totalProgress = (mapNumber - 1) * 3 + (waveNumber - 1);
        const timeOfDayTypes = ['dawn', 'day', 'dusk', 'night'];
        const timeIndex = Math.floor(totalProgress / 2) % timeOfDayTypes.length;
        
        this.currentTimeOfDay = timeOfDayTypes[timeIndex];
        this.lightingLevel = TIME_OF_DAY_EFFECTS[this.currentTimeOfDay].lightingLevel;
        
        console.log(`🕐 時間帯更新: ${TIME_OF_DAY_EFFECTS[this.currentTimeOfDay].name} (明度: ${this.lightingLevel})`);
        return this.currentTimeOfDay;
    }

    // 現在の天候効果を取得
    getCurrentWeatherEffects() {
        return WEATHER_EFFECTS[this.currentWeather];
    }

    // 現在の時間帯効果を取得
    getCurrentTimeOfDayEffects() {
        return TIME_OF_DAY_EFFECTS[this.currentTimeOfDay];
    }

    // 統合された効果を計算
    getCombinedEffects() {
        const weather = this.getCurrentWeatherEffects();
        const timeOfDay = this.getCurrentTimeOfDayEffects();
        
        return {
            towerRangeMultiplier: (weather.towerRangeMultiplier || 1.0) * (timeOfDay.towerRangeMultiplier || 1.0),
            towerDamageMultiplier: (weather.towerDamageMultiplier || 1.0) * (timeOfDay.towerDamageMultiplier || 1.0),
            enemySpeedMultiplier: (weather.enemySpeedMultiplier || 1.0) * (timeOfDay.enemySpeedMultiplier || 1.0),
            enemyHpMultiplier: (weather.enemyHpMultiplier || 1.0) * (timeOfDay.enemyHpMultiplier || 1.0),
            goldMultiplier: weather.goldMultiplier || 1.0
        };
    }

    // 視覚効果を適用
    applyVisualEffects(ctx, canvasWidth, canvasHeight) {
        this.applyWeatherVisuals(ctx, canvasWidth, canvasHeight);
        this.applyTimeOfDayVisuals(ctx, canvasWidth, canvasHeight);
    }

    // 天候の視覚効果
    applyWeatherVisuals(ctx, canvasWidth, canvasHeight) {
        switch(this.currentWeather) {
            case 'rainy':
                this.renderRainEffect(ctx, canvasWidth, canvasHeight);
                break;
            case 'foggy':
                this.renderFogEffect(ctx, canvasWidth, canvasHeight);
                break;
            case 'windy':
                this.renderWindEffect(ctx, canvasWidth, canvasHeight);
                break;
            case 'storm':
                this.renderStormEffect(ctx, canvasWidth, canvasHeight);
                break;
        }
    }

    // 時間帯の視覚効果
    applyTimeOfDayVisuals(ctx, canvasWidth, canvasHeight) {
        // 全体的な明度調整
        if (this.lightingLevel < 1.0) {
            ctx.save();
            ctx.globalCompositeOperation = 'multiply';
            ctx.fillStyle = `rgba(0, 0, 0, ${1 - this.lightingLevel})`;
            ctx.fillRect(0, 0, canvasWidth, canvasHeight);
            ctx.restore();
        }

        // 時間帯特有の効果
        switch(this.currentTimeOfDay) {
            case 'dawn':
                this.renderDawnEffect(ctx, canvasWidth, canvasHeight);
                break;
            case 'dusk':
                this.renderDuskEffect(ctx, canvasWidth, canvasHeight);
                break;
            case 'night':
                this.renderNightEffect(ctx, canvasWidth, canvasHeight);
                break;
        }
    }

    // 雨の効果
    renderRainEffect(ctx, canvasWidth, canvasHeight) {
        if (!this.rainDrops) {
            this.rainDrops = [];
            for (let i = 0; i < 100; i++) {
                this.rainDrops.push({
                    x: Math.random() * canvasWidth,
                    y: Math.random() * canvasHeight,
                    speed: 3 + Math.random() * 2,
                    length: 10 + Math.random() * 5
                });
            }
        }

        ctx.save();
        ctx.strokeStyle = 'rgba(173, 216, 230, 0.6)';
        ctx.lineWidth = 1;
        
        this.rainDrops.forEach(drop => {
            ctx.beginPath();
            ctx.moveTo(drop.x, drop.y);
            ctx.lineTo(drop.x - 2, drop.y + drop.length);
            ctx.stroke();
            
            drop.y += drop.speed;
            drop.x -= 0.5;
            
            if (drop.y > canvasHeight) {
                drop.y = -drop.length;
                drop.x = Math.random() * canvasWidth;
            }
        });
        ctx.restore();
    }

    // 霧の効果
    renderFogEffect(ctx, canvasWidth, canvasHeight) {
        ctx.save();
        ctx.globalAlpha = 0.3;
        ctx.fillStyle = 'rgba(192, 192, 192, 0.5)';
        
        // 複数の霧レイヤー
        for (let i = 0; i < 3; i++) {
            const time = Date.now() * 0.001 + i;
            const offsetX = Math.sin(time * 0.5) * 20;
            const offsetY = Math.cos(time * 0.3) * 10;
            
            ctx.fillRect(offsetX, offsetY, canvasWidth, canvasHeight);
        }
        ctx.restore();
    }

    // 風の効果
    renderWindEffect(ctx, canvasWidth, canvasHeight) {
        if (!this.windParticles) {
            this.windParticles = [];
            for (let i = 0; i < 50; i++) {
                this.windParticles.push({
                    x: Math.random() * canvasWidth,
                    y: Math.random() * canvasHeight,
                    speed: 2 + Math.random() * 3,
                    size: 1 + Math.random() * 2
                });
            }
        }

        ctx.save();
        ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
        
        this.windParticles.forEach(particle => {
            ctx.beginPath();
            ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
            ctx.fill();
            
            particle.x += particle.speed;
            particle.y += Math.sin(Date.now() * 0.01 + particle.x * 0.01) * 0.5;
            
            if (particle.x > canvasWidth) {
                particle.x = -particle.size;
                particle.y = Math.random() * canvasHeight;
            }
        });
        ctx.restore();
    }

    // 嵐の効果
    renderStormEffect(ctx, canvasWidth, canvasHeight) {
        this.renderRainEffect(ctx, canvasWidth, canvasHeight);
        this.renderWindEffect(ctx, canvasWidth, canvasHeight);
        
        // 稲妻効果
        if (Math.random() < 0.02) {
            ctx.save();
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
            ctx.lineWidth = 3;
            ctx.shadowColor = '#FFFFFF';
            ctx.shadowBlur = 10;
            
            const startX = Math.random() * canvasWidth;
            const segments = 5 + Math.floor(Math.random() * 5);
            let currentX = startX;
            let currentY = 0;
            
            ctx.beginPath();
            ctx.moveTo(currentX, currentY);
            
            for (let i = 0; i < segments; i++) {
                currentX += (Math.random() - 0.5) * 40;
                currentY += canvasHeight / segments;
                ctx.lineTo(currentX, currentY);
            }
            
            ctx.stroke();
            ctx.restore();
        }
    }

    // 夜明けの効果
    renderDawnEffect(ctx, canvasWidth, canvasHeight) {
        const gradient = ctx.createLinearGradient(0, 0, 0, canvasHeight);
        gradient.addColorStop(0, 'rgba(255, 99, 71, 0.1)');
        gradient.addColorStop(1, 'rgba(255, 165, 0, 0.05)');
        
        ctx.save();
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, canvasWidth, canvasHeight);
        ctx.restore();
    }

    // 夕暮れの効果
    renderDuskEffect(ctx, canvasWidth, canvasHeight) {
        const gradient = ctx.createLinearGradient(0, 0, 0, canvasHeight);
        gradient.addColorStop(0, 'rgba(255, 69, 0, 0.15)');
        gradient.addColorStop(1, 'rgba(128, 0, 128, 0.1)');
        
        ctx.save();
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, canvasWidth, canvasHeight);
        ctx.restore();
    }

    // 夜間の効果
    renderNightEffect(ctx, canvasWidth, canvasHeight) {
        // 星空効果
        if (!this.stars) {
            this.stars = [];
            for (let i = 0; i < 30; i++) {
                this.stars.push({
                    x: Math.random() * canvasWidth,
                    y: Math.random() * canvasHeight * 0.5,
                    brightness: Math.random(),
                    twinkleSpeed: 0.02 + Math.random() * 0.03
                });
            }
        }

        ctx.save();
        this.stars.forEach(star => {
            const brightness = 0.3 + Math.sin(Date.now() * star.twinkleSpeed) * 0.3;
            ctx.fillStyle = `rgba(255, 255, 255, ${brightness})`;
            ctx.beginPath();
            ctx.arc(star.x, star.y, 1, 0, Math.PI * 2);
            ctx.fill();
        });
        ctx.restore();
    }

    // 天候・時間帯情報をリセット
    reset() {
        this.currentWeather = 'sunny';
        this.currentTimeOfDay = 'day';
        this.weatherHistory = [];
        this.timeProgression = 0;
        this.visualEffects = [];
        this.lightingLevel = 1.0;
        this.rainDrops = null;
        this.windParticles = null;
        this.stars = null;
        this.generateWeatherForecast(5);
        
        console.log("🌤️ 天候・時間帯システムリセット");
    }

    // 天候タイプから天候効果情報を取得
    getWeatherEffectsByType(weatherType) {
        return WEATHER_EFFECTS[weatherType] || WEATHER_EFFECTS['sunny'];
    }

    // 時間帯タイプから時間帯効果情報を取得
    getTimeOfDayEffectsByType(timeOfDayType) {
        return TIME_OF_DAY_EFFECTS[timeOfDayType] || TIME_OF_DAY_EFFECTS['day'];
    }
} 