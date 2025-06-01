# Crystal Guardians - データ管理システムガイド

## 概要
Crystal Guardiansのデータ管理システムは、ゲームの固定値データを効率的に管理し、将来のサーバー移行に対応できるよう設計されています。

## システム構成

### 1. データファイル構造
```
data/
├── characters.json    # キャラクター情報
├── enemies.json      # 敵情報
├── maps.json         # マップ・Wave情報
└── gameConfig.json   # ゲーム設定
```

### 2. システムコンポーネント
```
js/
├── dataManager.js    # データ管理の中核
├── dataAdapter.js    # 既存システムとの統合
└── game.js          # メインゲームロジック（統合済み）
```

## データファイルの編集

### キャラクターデータの編集
`data/characters.json` を編集してキャラクターの性能を調整できます。

```json
{
  "characters": {
    "warrior": {
      "id": "warrior",
      "name": "ウォリアー",
      "cost": 100,           // 購入コスト
      "stats": {
        "damage": 25,        // 攻撃力
        "range": 80,         // 射程
        "attackSpeed": 1000  // 攻撃間隔（ミリ秒）
      }
    }
  }
}
```

### 敵データの編集
`data/enemies.json` を編集して敵の強さを調整できます。

```json
{
  "enemies": {
    "goblin": {
      "stats": {
        "hp": 40,      // 体力
        "speed": 1.2,  // 移動速度
        "reward": 8    // 撃破報酬
      }
    }
  }
}
```

### マップ・Waveデータの編集
`data/maps.json` を編集してマップ構成やWave内容を調整できます。

```json
{
  "maps": {
    "1": {
      "waves": {
        "1": {
          "enemies": [
            {
              "type": "goblin",
              "count": 8,      // 出現数
              "interval": 1000, // 出現間隔
              "delay": 0       // 開始遅延
            }
          ],
          "reward": 50       // Wave完了報酬
        }
      }
    }
  }
}
```

## ゲームバランス調整

### 1. 経済バランス
```json
// gameConfig.json
{
  "gameConfig": {
    "gameSettings": {
      "initialGold": 100  // 初期ゴールド調整
    }
  }
}
```

### 2. 難易度調整
```json
// gameConfig.json
{
  "gameConfig": {
    "difficultySystem": {
      "mapDifficultyMultipliers": {
        "2": {
          "enemyHpMultiplier": 1.2,    // 敵HP倍率
          "enemySpeedMultiplier": 1.1, // 敵速度倍率
          "goldMultiplier": 1.1        // ゴールド倍率
        }
      }
    }
  }
}
```

## 開発者向け機能

### 1. データ整合性チェック
ブラウザのコンソールで以下のコマンドを実行：

```javascript
// データ整合性チェック
const validation = window.gameDataAdapter.validateGameData();
console.log(validation);

// データ統計表示
const stats = window.gameDataAdapter.getDataStats();
console.log(stats);

// データ構造ダンプ
window.gameDataAdapter.dumpDataStructure();
```

### 2. データの再読み込み
ゲーム実行中にデータファイルを変更した場合：

```javascript
// データの再読み込み
await window.gameDataAdapter.reloadData();
```

### 3. データソースの切り替え
```javascript
// ローカルからサーバーへ切り替え
await window.gameDataAdapter.switchDataSource('server');

// サーバーからローカルへ切り替え
await window.gameDataAdapter.switchDataSource('local');
```

## トラブルシューティング

### 1. データ読み込みエラー
**症状**: ゲーム開始時にデータが読み込まれない
**解決方法**:
1. ブラウザのコンソールでエラーメッセージを確認
2. JSONファイルの構文エラーをチェック
3. ファイルパスが正しいか確認

```javascript
// エラー詳細の確認
console.log(window.gameDataManager.getDataStats());
```

### 2. データ形式エラー
**症状**: 特定のキャラクターや敵が正しく動作しない
**解決方法**:
1. データ整合性チェックを実行
2. 必須フィールドが不足していないか確認
3. データ型が正しいか確認

```javascript
// 特定のデータをチェック
const character = window.gameDataAdapter.getCharacterInfo('warrior');
console.log(character);
```

### 3. パフォーマンス問題
**症状**: ゲームの動作が重い
**解決方法**:
1. キャッシュの状態を確認
2. 不要なデバッグログを無効化
3. データファイルサイズを確認

```javascript
// キャッシュ状態の確認
console.log(window.gameDataManager.cache.size);

// キャッシュのクリア
window.gameDataManager.clearCache();
```

## ベストプラクティス

### 1. データ編集時の注意点
- **バックアップ**: 編集前に必ずバックアップを作成
- **段階的変更**: 大きな変更は段階的に実施
- **テスト**: 変更後は必ずゲームテストを実行

### 2. バランス調整のコツ
- **小さな変更**: 一度に大きく変更せず、10-20%程度の調整から開始
- **相対的調整**: 他の要素との相対的なバランスを考慮
- **プレイテスト**: 実際にプレイして体感を確認

### 3. データ管理のルール
- **命名規則**: 一貫した命名規則を使用
- **コメント**: 複雑な設定には説明コメントを追加
- **バージョン管理**: 重要な変更はバージョン番号を更新

## 新コンテンツの追加

### 1. 新キャラクターの追加
```json
// characters.json に追加
{
  "characters": {
    "new_character": {
      "id": "new_character",
      "name": "新キャラクター",
      "description": "新しいキャラクターの説明",
      "cost": 150,
      "stats": {
        "damage": 30,
        "range": 100,
        "attackSpeed": 800
      },
      "abilities": {
        "canAttackFlying": true,
        "hasSpecialAttack": false
      },
      "visual": {
        "icon": "🆕",
        "color": "#ff6b6b",
        "size": 25
      }
    }
  }
}
```

### 2. 新敵の追加
```json
// enemies.json に追加
{
  "enemies": {
    "new_enemy": {
      "id": "new_enemy",
      "name": "新しい敵",
      "stats": {
        "hp": 100,
        "speed": 1.0,
        "reward": 25
      },
      "abilities": {
        "isFlying": false,
        "hasSpecialAbility": true
      },
      "visual": {
        "icon": "👾",
        "color": "#8e44ad",
        "size": 26
      }
    }
  }
}
```

### 3. 新マップの追加
```json
// maps.json に追加
{
  "maps": {
    "4": {
      "id": 4,
      "name": "新しいマップ",
      "description": "新しい挑戦が待っている",
      "difficulty": "超級",
      "icon": "🌋",
      "gridData": [
        // 11x8のグリッドデータ
      ],
      "waves": {
        "1": {
          "enemies": [
            {
              "type": "new_enemy",
              "count": 5,
              "interval": 1500,
              "delay": 0
            }
          ],
          "reward": 100
        }
      }
    }
  }
}
```

## サーバー移行準備

### 1. データ検証
移行前にすべてのデータが正しい形式であることを確認：

```javascript
// 全データの検証
const validation = window.gameDataAdapter.validateGameData();
if (!validation.valid) {
    console.error('データに問題があります:', validation.issues);
}
```

### 2. 移行テスト
ローカルとサーバーの切り替えテスト：

```javascript
// サーバーモードでのテスト
await window.gameDataAdapter.switchDataSource('server');

// 問題があればローカルに戻す
await window.gameDataAdapter.switchDataSource('local');
```

### 3. パフォーマンス監視
移行後のパフォーマンス監視：

```javascript
// データ読み込み時間の測定
console.time('データ読み込み');
await window.gameDataManager.reloadData();
console.timeEnd('データ読み込み');
```

## まとめ

このデータ管理システムにより、以下の利点が得られます：

1. **効率的なバランス調整**: JSONファイルの編集だけで調整可能
2. **拡張性**: 新コンテンツの追加が容易
3. **保守性**: データとロジックの分離により保守が簡単
4. **将来性**: サーバー移行時の無停止移行が可能

データ編集時は必ずバックアップを取り、段階的に変更を行うことを推奨します。 