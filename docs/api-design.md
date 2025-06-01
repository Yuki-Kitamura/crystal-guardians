# Crystal Guardians - API設計とデータベーススキーマ

## 概要
Crystal Guardiansのサーバー移行時に使用するAPIエンドポイントとデータベーススキーマの設計書です。

## APIエンドポイント設計

### 基本設定
- **ベースURL**: `https://api.crystal-guardians.com/v1`
- **認証**: JWT Token (将来的にユーザー機能追加時)
- **レスポンス形式**: JSON
- **エラーハンドリング**: HTTP ステータスコード + エラーメッセージ

### エンドポイント一覧

#### 1. ゲーム設定
```
GET /api/v1/config
```
**説明**: ゲーム全体の設定を取得
**レスポンス例**:
```json
{
  "version": "1.0.0",
  "gameSettings": {
    "initialGold": 100,
    "maxEnemiesReached": 10,
    "gameSpeed": 1
  },
  "gridSettings": {
    "gridWidth": 11,
    "gridHeight": 8,
    "panelSize": 64
  }
}
```

#### 2. キャラクター情報
```
GET /api/v1/characters
GET /api/v1/characters/{characterId}
```
**説明**: 全キャラクター情報または特定キャラクター情報を取得
**レスポンス例**:
```json
{
  "characters": {
    "warrior": {
      "id": "warrior",
      "name": "ウォリアー",
      "cost": 100,
      "stats": {
        "damage": 25,
        "range": 80,
        "attackSpeed": 1000
      }
    }
  }
}
```

#### 3. 敵情報
```
GET /api/v1/enemies
GET /api/v1/enemies/{enemyId}
```
**説明**: 全敵情報または特定敵情報を取得

#### 4. マップ情報
```
GET /api/v1/maps
GET /api/v1/maps/{mapId}
GET /api/v1/maps/{mapId}/waves/{waveId}
```
**説明**: マップ情報とWave情報を取得

#### 5. ゲーム統計 (将来拡張)
```
POST /api/v1/stats/game-result
GET /api/v1/stats/leaderboard
```
**説明**: ゲーム結果の送信とリーダーボード取得

## データベーススキーマ設計

### 1. game_config テーブル
```sql
CREATE TABLE game_config (
    id SERIAL PRIMARY KEY,
    version VARCHAR(20) NOT NULL,
    config_data JSONB NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### 2. characters テーブル
```sql
CREATE TABLE characters (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    cost INTEGER NOT NULL,
    stats JSONB NOT NULL,
    abilities JSONB NOT NULL,
    visual JSONB NOT NULL,
    upgrades JSONB,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### 3. enemies テーブル
```sql
CREATE TABLE enemies (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    stats JSONB NOT NULL,
    abilities JSONB NOT NULL,
    visual JSONB NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### 4. maps テーブル
```sql
CREATE TABLE maps (
    id INTEGER PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    difficulty VARCHAR(20),
    icon VARCHAR(10),
    visual JSONB NOT NULL,
    grid_data JSONB NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### 5. waves テーブル
```sql
CREATE TABLE waves (
    id SERIAL PRIMARY KEY,
    map_id INTEGER REFERENCES maps(id),
    wave_number INTEGER NOT NULL,
    description TEXT,
    reward INTEGER NOT NULL,
    enemies JSONB NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(map_id, wave_number)
);
```

### 6. game_sessions テーブル (将来拡張)
```sql
CREATE TABLE game_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    player_id UUID,
    map_id INTEGER REFERENCES maps(id),
    start_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    end_time TIMESTAMP,
    result VARCHAR(20), -- 'victory', 'defeat', 'abandoned'
    final_gold INTEGER,
    enemies_defeated INTEGER,
    waves_completed INTEGER,
    session_data JSONB
);
```

## 移行戦略

### フェーズ1: ローカルJSONデータベース
- [x] JSONファイルでのデータ管理
- [x] GameDataManagerの実装
- [x] 既存システムとの統合

### フェーズ2: サーバー準備
- [ ] APIサーバーの構築
- [ ] データベースの構築
- [ ] データ移行スクリプト作成

### フェーズ3: 段階的移行
- [ ] 設定データのサーバー移行
- [ ] キャラクター・敵データの移行
- [ ] マップデータの移行
- [ ] 完全サーバー移行

### フェーズ4: 拡張機能
- [ ] ユーザー認証システム
- [ ] ゲーム統計・リーダーボード
- [ ] リアルタイム更新機能

## データ整合性チェック

### 1. 必須フィールドチェック
```javascript
// キャラクターデータの検証
function validateCharacterData(character) {
    const required = ['id', 'name', 'cost', 'stats', 'visual'];
    return required.every(field => character[field] !== undefined);
}
```

### 2. データ型チェック
```javascript
// 数値フィールドの検証
function validateNumericFields(data) {
    const numericFields = ['cost', 'damage', 'range', 'hp'];
    return numericFields.every(field => 
        typeof data[field] === 'number' && data[field] >= 0
    );
}
```

### 3. 参照整合性チェック
```javascript
// Wave内の敵タイプが存在するかチェック
function validateWaveEnemies(wave, availableEnemies) {
    return wave.enemies.every(enemy => 
        availableEnemies.includes(enemy.type)
    );
}
```

## パフォーマンス最適化

### 1. キャッシュ戦略
- **ブラウザキャッシュ**: 静的データの長期キャッシュ
- **メモリキャッシュ**: 頻繁にアクセスされるデータ
- **CDN**: 地理的分散によるレスポンス向上

### 2. データ圧縮
- **JSON圧縮**: 不要な空白の除去
- **Gzip圧縮**: HTTP レベルでの圧縮
- **差分更新**: 変更されたデータのみ送信

### 3. 非同期読み込み
- **並列読み込み**: 複数データの同時取得
- **遅延読み込み**: 必要時のみデータ取得
- **プリロード**: 予測される次のデータの事前読み込み

## セキュリティ考慮事項

### 1. データ検証
- **入力検証**: 全ての入力データの検証
- **型安全性**: TypeScriptによる型チェック
- **範囲チェック**: 数値の妥当性検証

### 2. アクセス制御
- **CORS設定**: 適切なオリジン制限
- **レート制限**: API呼び出し頻度の制限
- **認証**: 将来的なユーザー機能での認証

### 3. データ保護
- **HTTPS**: 全通信の暗号化
- **データマスキング**: 機密情報の保護
- **監査ログ**: アクセス履歴の記録

## 監視・運用

### 1. ヘルスチェック
```
GET /api/v1/health
```
**レスポンス**:
```json
{
  "status": "healthy",
  "timestamp": "2024-01-01T00:00:00Z",
  "version": "1.0.0",
  "database": "connected"
}
```

### 2. メトリクス収集
- **レスポンス時間**: API応答速度の監視
- **エラー率**: 失敗リクエストの割合
- **スループット**: 秒間リクエスト数

### 3. ログ管理
- **アクセスログ**: 全APIアクセスの記録
- **エラーログ**: 例外・エラーの詳細記録
- **パフォーマンスログ**: 処理時間の記録

## 互換性保証

### 1. バージョニング
- **APIバージョン**: URLパスでのバージョン管理
- **データバージョン**: データ構造の後方互換性
- **移行期間**: 旧バージョンのサポート期間

### 2. フォールバック機能
- **ローカルキャッシュ**: サーバー障害時の代替データ
- **デフォルト値**: データ取得失敗時の安全な値
- **グレースフル劣化**: 機能の段階的無効化

### 3. 移行支援
- **データ変換**: 旧形式から新形式への自動変換
- **検証ツール**: データ整合性の自動チェック
- **ロールバック**: 問題発生時の迅速な復旧 