# Codex引き継ぎドキュメント - Euclidean Sequencer Plus

## プロジェクト概要
Web ベースの Euclidean シーケンサーを React + TypeScript + Vite + Tone.js で実装。6トラック（Kick, Snare, Hi-hat, Crash, Perc, Clap）の808スタイルドラムマシンとして完成済み。

## 現在の状態
**✅ 実装完了・実用レベル達成**
- 全88テスト合格（100%通過率）
- TypeScript ビルドエラー解決済み
- moistpeace.com 参考サイトの lookahead スケジューリング完全移植
- ポリフォニック再生対応済み

## 技術スタック
- **Frontend**: React 18 + TypeScript + Vite
- **Audio**: Tone.js (Web Audio API)
- **Testing**: Vitest + @testing-library/react
- **Deployment**: GitHub Pages + GitHub Actions

## 重要なファイル構成

```
src/
├── hooks/
│   ├── useAudio.ts           # コアオーディオエンジン（moistpeace.com移植）
│   └── useAudio.test.ts      # 20テスト（タイミング、スイング検証）
├── utils/
│   ├── euclidAlgorithm.ts    # Max v8 Euclidアルゴリズム移植
│   ├── drumSounds.ts         # PolySynthベースドラムマシン
│   └── *.test.ts            # 各32テスト
├── components/
│   ├── TrackCircle.tsx       # 円形ビジュアライザー
│   ├── ControlPanel.tsx      # リアルタイム制御UI
│   └── TransportBar.tsx      # 再生制御
└── types.ts                  # TypeScript型定義
```

## 実装済み機能
1. **Euclidアルゴリズム**: バイアス・回転付きパターン生成
2. **ポリフォニック再生**: 同時発音対応
3. **リアルタイム制御**: BPM, スイング, ボリューム, ミュート, ソロ
4. **視覚化**: 円形ステップ表示 + 現在位置インジケーター
5. **タイミング精度**: 25ms lookahead スケジューリング

## 解決済み重要課題
- **音途切れ** → PolySynth実装で解決
- **ステップ進行不良** → moistpeace.com方式で解決  
- **ビジュアライズ失敗** → CSS変数 → hex color修正で解決
- **音量バランス** → クラッシュ音量20%削減で解決

## 開発・デプロイ手順
```bash
# 開発環境起動
npm run dev          # localhost:5173

# テスト実行  
npm test            # 88テスト実行

# 本番ビルド
npm run build       # dist/ 生成

# プレビュー
npm run preview     # 本番同等環境
```

## テスト体系
- **euclidAlgorithm**: 17テスト - パターン生成ロジック
- **useAudio**: 20テスト - タイミング・スケジューリング
- **drumSounds**: 15テスト - 音源・ポリフォニック
- **UI Components**: 36テスト - リアルタイム制御・表示

## GitHub Pages 自動デプロイ
- `.github/workflows/deploy.yml` 設定済み
- `main` ブランチ push で自動デプロイ
- URL: `https://tsugumasayutani.github.io/euclid-sequencer-plus/`

## 次のステップ候補
1. **追加音色**: より多くのドラムサウンド
2. **パターン保存**: LocalStorage 実装
3. **MIDI出力**: Web MIDI API 連携
4. **エフェクト**: リバーブ・ディストーション
5. **シーケンス長**: 16ステップ以外対応

## 重要な技術詳細

### コアスケジューリングコード (`useAudio.ts:70-80`)
```typescript
const nextStep = useCallback(() => {
  const bpm = Math.max(40, Math.min(300, transport.bpm));
  const swing = Math.max(0, Math.min(0.30, transport.swing / 100 * 0.30));
  const base = 60 / bpm / 4; // 16分音符
  const even = (currentStepRef.current % 2 === 0);
  const interval = base * (even ? (1 + swing) : (1 - swing));
  nextTimeRef.current += interval;
  currentStepRef.current = (currentStepRef.current + 1) & 15;
}, [transport.bpm, transport.swing]);
```

### Euclidアルゴリズム (`euclidAlgorithm.ts`)
Max v8のオリジナルアルゴリズムを完全移植。バイアスと回転機能付き。

### PolySynthドラムマシン (`drumSounds.ts`)
```typescript
const kickPolySynth = new Tone.PolySynth(Tone.MembraneSynth, {
  pitchDecay: 0.08,
  octaves: 2,
  oscillator: { type: 'sine' },
  envelope: {
    attack: 0.001,
    decay: 0.5,
    sustain: 0.01,
    release: 1.2
  }
});
```

## 最終調査で修正した技術課題
1. **PolySynth mock追加** → drumSounds.test.ts 15/15テスト合格
2. **NodeJS.Timeout型修正** → number型に変更（ブラウザ環境対応）
3. **未使用関数削除** → TypeScript警告解決
4. **maxPolyphony設定削除** → Tone.js型エラー解決

## 状態
**実用レベル完成・追加機能開発可能**

最後のユーザー要求「徹底的に調査して。レポートをまとめて」を完了。全ての技術的課題が解決され、moistpeace.com参考サイトの精密な移植により、プロフェッショナル品質のWebアプリケーションとして完成している。