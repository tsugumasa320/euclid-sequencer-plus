# Euclidean Sequencer Plus - 仕様書

## 1. プロジェクト概要

### 1.1 目的
Webアプリベースの高機能Euclidean Sequencerの開発。Max/MSP v8で実装された高度なアルゴリズムをベースに、リアルタイム操作可能な6トラック808ドラムシーケンサーを構築する。

### 1.2 ターゲット
- 音楽制作者、ビートメイカー
- リズムパターン探索やライブパフォーマンス用途
- 教育目的でのEuclideanリズム学習

## 2. 技術仕様

### 2.1 技術スタック
- **フロントエンド**: React 18 + TypeScript
- **ビルドツール**: Vite
- **音響ライブラリ**: Tone.js
- **スタイリング**: CSS Modules + CSS Custom Properties
- **デプロイ**: GitHub Pages
- **CI/CD**: GitHub Actions

### 2.2 開発環境
- Node.js 18+
- TypeScript 5.0+
- ESLint + Prettier
- Git + GitHub

### 2.3 ブラウザサポート
- Chrome 88+
- Firefox 85+
- Safari 14+
- Edge 88+

## 3. 機能仕様

### 3.1 コア機能

#### 3.1.1 Euclideanアルゴリズム
**基本アルゴリズム**:
```
pattern[i] = (i * hits) % steps < hits
```

**拡張機能**:
- **バイアス機能**: 前半/後半の配置比率調整（0.0-1.0）
- **回転機能**: パターンの位相調整（±ステップ数）
- **中心寄せ配置**: より自然なリズム感

#### 3.1.2 トラック構成
- **6トラック**: Kick、Snare、Hi-hat、Crash、Perc、Clap
- **各トラック独立制御**:
  - Steps（1-32、デフォルト16）
  - Hits（0-Steps、デフォルト4）
  - Bias（0.0-1.0、デフォルト0.5）
  - Rotation（-Steps〜+Steps、デフォルト0）
  - Volume（0-100、デフォルト70）
  - Mute/Solo

#### 3.1.3 グローバルコントロール
- **BPM**: 60-200（デフォルト120）
- **スイング**: 0-100%（デフォルト0%）
- **タイムシグネチャー**: 4/4、3/4、5/4、7/4
- **マスターボリューム**: 0-100（デフォルト80）

### 3.2 UI仕様

#### 3.2.1 メインUI
```
┌─────────────────────────────────────────┐
│ ヘッダー: BPM | Swing | Time Sig | Play │
├─────────────────────────────────────────┤
│                                         │
│  ┌───┐ ┌───┐ ┌───┐                     │
│  │ ○ │ │ ○ │ │ ○ │  トラック1-3        │
│  └───┘ └───┘ └───┘  （円形表示）        │
│                                         │
│  ┌───┐ ┌───┐ ┌───┐                     │
│  │ ○ │ │ ○ │ │ ○ │  トラック4-6        │
│  └───┘ └───┘ └───┘                     │
│                                         │
├─────────────────────────────────────────┤
│ 選択トラック詳細コントロールパネル        │
└─────────────────────────────────────────┘
```

#### 3.2.2 円形トラック表示
- **中央**: トラック名とアイコン
- **外周**: ステップを円周上に配置
- **ビート表示**: アクティブステップをハイライト
- **現在位置**: プレイヘッドを回転表示
- **カラーコード**: トラックごとに色分け

#### 3.2.3 コントロールパネル
**各トラック**:
- Steps: スライダー（1-32）
- Hits: スライダー（0-Steps）
- Bias: スライダー（0.0-1.0）
- Rotation: スライダー（-Steps〜+Steps）
- Volume: スライダー（0-100）
- Mute/Solo: トグルボタン

**グローバル**:
- BPM: スライダー + 数値入力（60-200）
- Swing: スライダー（0-100%）
- Time Signature: ドロップダウン
- Master Volume: スライダー（0-100）

### 3.3 音響仕様

#### 3.3.1 808音源
- **Kick**: 低域重点、60Hzアタック
- **Snare**: 中高域、200Hz+スナップ
- **Hi-hat**: 高域フォーカス、8kHz+
- **Crash**: 広域、リバーブ付き
- **Perc**: 中域、ピッチ可変
- **Clap**: ステレオ広がり

#### 3.3.2 音響処理
- **サンプル形式**: WAV 44.1kHz 16bit
- **レイテンシー**: <20ms
- **ポリフォニー**: 無制限
- **エフェクト**: 各トラック音量制御、マスターミックス

## 4. アーキテクチャ設計

### 4.1 コンポーネント構成
```
App
├── Header (BPM, Swing, Transport)
├── TrackGrid
│   ├── TrackCircle × 6
│   └── SequencerEngine (Tone.js)
└── ControlPanel
    ├── TrackControls
    └── GlobalControls
```

### 4.2 状態管理
```typescript
interface AppState {
  transport: {
    isPlaying: boolean;
    bpm: number;
    swing: number;
    timeSignature: string;
  };
  tracks: Array<{
    id: string;
    name: string;
    steps: number;
    hits: number;
    bias: number;
    rotation: number;
    volume: number;
    muted: boolean;
    solo: boolean;
    pattern: boolean[];
  }>;
  masterVolume: number;
}
```

### 4.3 Euclidアルゴリズム実装
```typescript
interface EuclidParams {
  steps: number;
  hits: number;
  bias: number;
  rotation: number;
}

function generateEuclidPattern(params: EuclidParams): boolean[] {
  // 1. 基本Euclidアルゴリズム
  // 2. バイアス適用
  // 3. 回転適用
  // 4. パターン返却
}
```

## 5. 開発計画

### Phase 1: MVP (2-3時間)
1. プロジェクト環境構築（Vite + React + TypeScript）
2. Euclidアルゴリズム移植・テスト
3. 基本円形UI実装（1トラック）
4. Tone.js統合・基本再生機能

### Phase 2: コア機能 (3-4時間)
1. 6トラック対応
2. 808音源統合
3. リアルタイムパラメータ調整
4. バイアス・回転機能実装

### Phase 3: 高度機能 (2-3時間)
1. スイング機能実装
2. タイムシグネチャー対応
3. ミュート/ソロ機能
4. UI/UXブラッシュアップ

### Phase 4: 仕上げ (1-2時間)
1. GitHub Pages自動デプロイ設定
2. パフォーマンス最適化
3. レスポンシブ対応
4. ドキュメント整備

## 6. 品質保証

### 6.1 テスト戦略
- **ユニットテスト**: Euclidアルゴリズム
- **E2Eテスト**: 基本操作フロー
- **音響テスト**: レイテンシー・音質確認

### 6.2 パフォーマンス目標
- **初期ロード**: <3秒
- **操作レスポンス**: <100ms
- **音響レイテンシー**: <20ms

### 6.3 アクセシビリティ
- キーボード操作対応
- ARIAラベル設定
- カラーコントラスト確保

## 7. 将来拡張

### 7.1 機能拡張案
- パターンプリセット保存/読込み
- MIDI出力対応
- より多彩なエフェクト
- パフォーマンスモード

### 7.2 技術拡張案
- PWA対応
- WebMIDI API統合
- Web Audio Worklet活用
- リアルタイム協調編集

---

**作成日**: 2026-01-01  
**バージョン**: v1.0  
**レビュー予定日**: 実装開始前