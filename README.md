# react-kifu-player

モダンでカスタマイズ性の高い、React 用の将棋盤・棋譜再生コンポーネントライブラリです。
Headless UI パターンを採用しており、状態管理（Hook）と見た目（Component）が完全に分離されているため、プロジェクトに合わせて自由にレイアウトやデザインを構築できます。

## 特徴

- 🧩 **Headless UI**: `useKifuPlayer` フックにより状態と操作ロジックのみを提供。UI の配置やスタイルは完全に自由です。
- 🎨 **高いカスタマイズ性**: 提供される標準コンポーネント（盤面、コントロールバー、棋譜リストなど）は、テーマ機能により見た目を柔軟に変更可能です。
- 🤖 **エンジン解析対応**: KIF 形式等のコメントに埋め込まれた水匠や dlshogi 等のエンジン解析結果（評価値、読み筋、候補手）を自動でパース。
- 📈 **評価値グラフと読み筋の分岐再生**: エンジンの評価値推移をグラフで表示できるだけでなく、読み筋（候補手）を盤面上で分岐棋譜として再生することができます。
- 🔄 **盤面反転**: ワンクリックで後手視点（盤面反転）に対応できます。
- 📄 **多様なフォーマット対応**: 内部パーサーに `tsshogi` を採用し、KIF, KI2, CSA, SFEN, USI などの各種フォーマットをサポートしています。

## インストール

npm, yarn, pnpm 等のパッケージマネージャーを使用してインストールしてください。

```bash
npm install react-kifu-player
# または
yarn add react-kifu-player
# または
pnpm add react-kifu-player
```

## 使い方（基本編）

最も簡単な使い方は、`useKifuPlayer` フックと標準のコンポーネントを組み合わせて配置することです。

```tsx
import React, { useState } from 'react';
import { 
  useKifuPlayer, 
  ShogiBoard, 
  ControlBar, 
  MoveList, 
  ThemeProvider,
  resolveTheme,
} from 'react-kifu-player';

const SAMPLE_KIF = `
# KIF形式などの文字列
手合割：平手
先手：先手太郎
後手：後手次郎
手数----指手---------消費時間--
   1 ７六歩(77)   ( 0:00/00:00:00)
   2 ３四歩(33)   ( 0:00/00:00:00)
   3 ２六歩(27)   ( 0:00/00:00:00)
`;

function App() {
  // テーマの取得 (デフォルトで 'rich' と 'text' を提供)
  const theme = resolveTheme('rich');
  
  // フックから棋譜の現在の状態と、操作メソッドを取得
  const player = useKifuPlayer(SAMPLE_KIF);

  return (
    <ThemeProvider value={theme}>
      <div style={{ display: 'flex', gap: '24px', padding: '24px' }}>
        {/* 左側: 盤面と操作ボタン */}
        <div style={{ width: '400px' }}>
          <ShogiBoard 
            position={player.position}
            lastMove={player.lastMoveCoords || undefined}
            onForward={player.forward}
            onBackward={player.backward}
            playerNameSente={player.header?.blackName ? `☗\${player.header.blackName}` : undefined}
            playerNameGote={player.header?.whiteName ? `☖\${player.header.whiteName}` : undefined}
          />
          <ControlBar
            currentPly={player.currentPly}
            totalPlies={player.totalPlies}
            onForward={player.forward}
            onBackward={player.backward}
            onFirst={player.gotoFirst}
            onLast={player.gotoLast}
          />
        </div>

        {/* 右側: 棋譜リスト */}
        <div style={{ width: '300px' }}>
          <MoveList
            moves={player.moves}
            currentPly={player.currentPly}
            onPlyClick={player.gotoPly}
          />
        </div>
      </div>
    </ThemeProvider>
  );
}

export default App;
```

## 使い方（応用編：エンジン解析と評価値グラフ）

KIF ファイルのコメント欄にエンジン解析結果（`*解析` 行）が含まれている場合、`react-kifu-player` は自動でそれを抽出し、評価値グラフや候補手リストとして表示できます。

```tsx
import React, { useState } from 'react';
import { 
  useKifuPlayer, 
  ShogiBoard, 
  ControlBar, 
  MoveList, 
  EvalGraph, 
  CandidateList,
  ThemeProvider,
  resolveTheme,
} from 'react-kifu-player';

// 解析結果を含むKIFデータを用意
const ANALYZED_KIF = `...`;

function App() {
  const [isReversed, setIsReversed] = useState(false);
  const theme = resolveTheme('rich');
  const player = useKifuPlayer(ANALYZED_KIF);

  return (
    <ThemeProvider value={theme}>
      <div>
        <button onClick={() => setIsReversed(!isReversed)}>外部の盤面反転ボタン</button>
        
        <div style={{ display: 'flex', gap: '20px' }}>
          {/* 盤面領域 */}
          <div style={{ width: '460px' }}>
            <ShogiBoard 
              position={player.position}
              lastMove={player.lastMoveCoords || undefined}
              onForward={player.forward}
              onBackward={player.backward}
              reversed={isReversed} // ★反転フラグを渡すだけ (未指定時用に internalReversed も ShogiBoard に備わっています)
              showReverseButton={true} // 盤面右上に反転ボタンを表示
              playerNameSente={player.header?.blackName}
              playerNameGote={player.header?.whiteName}
            />
            <ControlBar {...player} />
            
            {/* 評価値グラフ */}
            <EvalGraph
              data={player.evaluations}
              currentPly={player.currentPly}
              maxPly={player.totalPlies}
              branchData={player.variationEval ? [player.variationEval] : undefined}
              onPlyClick={player.gotoPly}
            />
          </div>

          {/* 情報領域 */}
          <div style={{ width: '300px' }}>
            {/* 候補手リスト（読み筋の分岐再生） */}
            <CandidateList
              candidates={player.candidates}
              onPlayBranch={player.playVariation} // クリックで読み筋を盤面に反映
              isOnBranch={player.isOnBranch}
              onReturnToMain={player.returnToMain} // 本譜に戻る
              branchSourcePly={player.branchSourcePly}
              variationEval={player.variationEval}
            />

            <MoveList
              moves={player.moves}
              currentPly={player.currentPly}
              onPlyClick={player.gotoPly}
            />
          </div>
        </div>
      </div>
    </ThemeProvider>
  );
}
```

## コンポーネント API

### `useKifuPlayer(kifu: string)`

棋譜文字列を受け取り、プレイヤーの状態と操作関数を返します。

**返り値の主要なプロパティ:**
- `position`: 現在の局面データ（盤面、持ち駒、手番など）
- `currentPly`: 現在の手数
- `totalPlies`: 総手数
- `header`: 棋譜のヘッダー情報（対局者名など）
- `moves`: 棋譜リスト
- `evaluations`: パースされた評価値グラフデータ
- `candidates`: 現在の局面における AI の候補手リスト
- `isOnBranch`: 読み筋（分岐）を再生中かどうか

**返り値の主要な操作メソッド:**
- `forward()` / `backward()`: 1手進む / 戻る
- `gotoPly(ply)`: 指定手数へ移動する
- `gotoFirst()` / `gotoLast()`: 初期配置 / 最終手へ移動する
- `playVariation(movesString, sourcePly, evalPoint)`: エンジンの読み筋を分岐として再生する
- `returnToMain()`: 分岐再生を終了し、本譜へ戻る

### `ShogiBoard`

将棋盤面を描画する SVG ベースのコンポーネントです。

**主要な Props:**
- `position`: 局面状態（必須）
- `lastMove`: 最終手の座標（ハイライトに使用）
- `reversed`: `true` にすると盤面が後手視点に180度反転します。
- `showReverseButton`: `true` にすると盤面右上に反転用のボタンが描画されます。
- `playerNameSente` / `playerNameGote`: 対局者名（盤面の上下に表示されます）
- `onForward` / `onBackward`: 盤面の右・左半分をクリックした際に発火するコールバック

## カスタマイズ（テーマ設定）

`react-kifu-player` のデザインは完全に「テーマ」によって制御されており、`ThemeProvider` を介して提供します。

### 組み込みテーマ

ライブラリにはデフォルトで以下の5つのテーマが用意されており、`resolveTheme(name)` で呼び出せます。

- **`imageWood`**: 【推奨】木目調の盤と駒。美しく本格的な画像駒（自動生成SVGのため完全ライセンスフリー）
- **`imageDark`**: ダークモードに合う黒基調のスタイリッシュな画像駒テーマ
- **`imageGlass`**: 半透明でモダンなグラスモーフィズム調の画像駒テーマ
- **`rich`**: グラデーションや影を用いた、リッチで美しいテキストベーステーマ
- **`text`**: シンプルなフラットデザインのテキストベーステーマ

※ **画像駒のライセンスについて**: `imageWood`, `imageDark`, `imageGlass` で使用されている将棋駒のSVG画像は、プログラムによって数式から完全オリジナルで自動生成されたものです。外部の素材やフォントデータ（アウトライン等）を一切流用していないため、**クレジット表記などのライセンス上の制約なし（MITライセンス下）で自由にお使いいただけます**。

```tsx
import { resolveTheme, ThemeProvider } from 'react-kifu-player';

// 'imageWood' テーマを取得
const theme = resolveTheme('imageWood');

<ThemeProvider value={theme}>
  <ShogiBoard ... />
</ThemeProvider>
```

### テーマの一部を上書きする

既存のリッチテーマをベースに、盤面の色や駒のフォントだけを変えたい場合は、オブジェクトを上書き（マージ）して使用します。

```tsx
const baseTheme = resolveTheme('rich');
const myCustomTheme = {
  ...baseTheme,
  board: {
    ...baseTheme.board,
    background: '#ffeedd', // 盤面の色だけを変更
  },
  piece: {
    ...baseTheme.piece,
    fontFamily: '"Yu Mincho", serif', // 駒のフォントを明朝体に変更
  }
};
```

### 独自のカスタム画像を利用する

ライブラリ組み込みの `imageTheme` ではなく、全く独自の画像ファイルを使いたい場合は、`piece.mode` を `'image'` に設定し、`senteImages` (および `goteImages`) に各駒の画像URLをマッピングします。

```tsx
const imageTheme = {
  ...baseTheme,
  piece: {
    ...baseTheme.piece,
    mode: 'image', // モードを画像に変更
    senteImages: {
      FU: '/images/sente_fu.png',
      KY: '/images/sente_kyo.png',
      // ... 他の駒の種類（KE, GI, KI, KA, HI, OU, TO, NY, NK, NG, UM, RY）
    },
    goteImages: {
      // 省略すると先手の画像を自動で180度回転させて使用します
      FU: '/images/gote_fu.png',
    }
  }
};
```

### テーマオブジェクトの全体構成

テーマは以下の6つのセクションに分かれており、それぞれ個別に色、フォント、サイズを調整できます。
独自のデザインシステムに組み込む際も非常に簡単です。

1. **`board`**: 盤面の背景、罫線、座標ラベルなど
2. **`piece`**: 盤上の駒（テキスト色、背景色、影、角丸、画像など）
3. **`hand`**: 持ち駒エリアのテキストや背景
4. **`moveList`**: 棋譜リストの背景やハイライト色
5. **`evalGraph`**: 評価値グラフの線、背景、点線の色
6. **`controlBar`**: 再生・戻るなどの操作ボタン群の色

## ライセンス

MIT
