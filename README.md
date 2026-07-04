# react-kifu-player

モダンでカスタマイズ性の高い、React 用の将棋盤・棋譜再生コンポーネントライブラリです。
Headless UI パターンを採用しており、状態管理（Hook）と見た目（Component）が完全に分離されているため、プロジェクトに合わせて自由にレイアウトやデザインを構築できます。

## 特徴

- 🧩 **Headless UI**: `useKifuPlayer` フックにより状態と操作ロジックのみを提供。UI の配置やスタイルは完全に自由です。
- 🎨 **高いカスタマイズ性**: 提供される標準コンポーネント（盤面、コントロールバー、棋譜リストなど）は、テーマ機能により見た目を柔軟に変更可能です。
- 🤖 **エンジン解析対応**: KIF 形式等のコメントに埋め込まれた水匠や dlshogi 等のエンジン解析結果（評価値、読み筋、候補手）を自動でパース。
- 📈 **評価値グラフと読み筋の分岐再生**: エンジンの評価値推移をグラフで表示できるだけでなく、読み筋（候補手）を盤面上で分岐棋譜として再生することができます。
- 🧩 **次の一手問題の自動生成 (v0.2.0)**: AIの解析付き棋譜から「逆転を許した痛い悪手」を自動抽出し、インタラクティブな次の一手問題（パズル）へと変換する機能を搭載しています。
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
import React from 'react';
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
  // テーマの取得 ('imageWood', 'imageDark', 'imageGlass', 'rich', 'text' から選択)
  const theme = resolveTheme('imageWood');
  
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
            playerNameSente={player.header?.blackName ? `☗${player.header.blackName}` : undefined}
            playerNameGote={player.header?.whiteName ? `☖${player.header.whiteName}` : undefined}
          />
          <ControlBar
            currentPly={player.currentPly}
            totalPlies={player.totalPlies}
            onForward={player.forward}
            onBackward={player.backward}
            onGoToStart={player.goToStart}
            onGoToEnd={player.goToEnd}
          />
        </div>

        {/* 右側: 棋譜リスト */}
        <div style={{ width: '300px' }}>
          <MoveList
            moves={player.moves}
            currentPly={player.currentPly}
            onPlyClick={player.goto}
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
  const theme = resolveTheme('imageWood');
  const player = useKifuPlayer(ANALYZED_KIF);

  return (
    <ThemeProvider value={theme}>
      <div style={{ display: 'flex', gap: '20px' }}>
        {/* 盤面領域 */}
        <div style={{ width: '460px' }}>
          <ShogiBoard 
            position={player.position}
            lastMove={player.lastMoveCoords || undefined}
            onForward={player.forward}
            onBackward={player.backward}
            showReverseButton={true}
            playerNameSente={player.header?.blackName}
            playerNameGote={player.header?.whiteName}
          />
          <ControlBar
            currentPly={player.currentPly}
            totalPlies={player.totalPlies}
            onForward={player.forward}
            onBackward={player.backward}
            onGoToStart={player.goToStart}
            onGoToEnd={player.goToEnd}
          />
          
          {/* 評価値グラフ */}
          <EvalGraph
            data={player.evaluations}
            currentPly={player.currentPly}
            branchData={player.variationEval ? [player.variationEval] : undefined}
            onPlyClick={player.goto}
          />
        </div>

        {/* 情報領域 */}
        <div style={{ width: '300px' }}>
          {/* 分岐再生中の表示 */}
          {player.isOnBranch ? (
            <div>
              <p>📖 読み筋再生中（{player.branchSourcePly}手目から分岐）</p>
              <button onClick={player.returnToMainLine}>本譜に戻る</button>
            </div>
          ) : (
            <>
              {/* 候補手リスト（クリックで読み筋を分岐再生） */}
              <CandidateList
                candidates={player.candidates}
                onCandidateClick={(c) => player.playVariation(c.readMoves, c.score)}
              />
            </>
          )}

          {/* 棋譜リスト */}
          <MoveList
            moves={player.moves}
            currentPly={player.currentPly}
            onPlyClick={player.goto}
          />
        </div>
      </div>
    </ThemeProvider>
  );
}
```

## 使い方（応用編２：次の一手問題の自動生成）

v0.2.0 から、エンジン解析付きの棋譜ファイルから「次の一手問題」を自動抽出してプレイアブルなUIを構築する機能が追加されました。
`extractProblemsFromKifu` ユーティリティで問題を抽出し、`useShogiProblem` フックに渡すだけで、インタラクティブなパズルアプリが完成します。

```tsx
import React, { useState } from 'react';
import { 
  extractProblemsFromKifu,
  useShogiProblem, 
  ShogiBoard, 
  ControlBar,
  CandidateList,
} from 'react-kifu-player';

const ANALYZED_KIF = `...`; // エンジン評価値と読み筋が含まれたKIFデータ

// 1. KIFから「自分が先手で、評価値が500以上悪化した局面」を抽出
const problems = extractProblemsFromKifu(ANALYZED_KIF, {
  playerColor: 'black', 
  evalDropThreshold: 500,
  maxProblems: 10,
});

function ProblemApp() {
  const [problemIndex, setProblemIndex] = useState(0);
  const currentProblem = problems[problemIndex];

  // 2. 抽出した問題データをフックに渡す
  const problem = useShogiProblem(currentProblem);

  return (
    <div>
      <h3>第 {problemIndex + 1} 問</h3>
      
      {/* 盤面（インタラクティブモード） */}
      <ShogiBoard 
        position={problem.position}
        interactive={problem.status === 'playing' && !problem.playbackState}
        selectedSquare={problem.selectedSquare}
        highlightSquares={problem.legalMoveSquares}
        onSquareClick={problem.handleSquareClick}
        lastMove={problem.lastMove}
      />

      {/* 成り・不成りの選択ダイアログ */}
      {problem.promotionPending && (
        <div>
          <button onClick={() => problem.resolvePromotion(true)}>成る</button>
          <button onClick={() => problem.resolvePromotion(false)}>不成</button>
        </div>
      )}

      {/* 読み筋の再生コントロール */}
      {problem.playbackState && (
        <div>
          <ControlBar
            currentPly={problem.playbackState.currentPly}
            totalPlies={problem.playbackState.totalPlies}
            onForward={problem.forwardPlayback}
            onBackward={problem.backwardPlayback}
            onGoToStart={() => {}}
            onGoToEnd={() => {}}
          />
          <button onClick={problem.stopPlayback}>再生を終了する</button>
        </div>
      )}
      
      {/* ユーザーが手を指した後の正誤判定 */}
      {problem.status !== 'playing' && problem.result && (
        <div>
          <p>{problem.status === 'correct' ? '✅ 正解！' : '❌ 不正解...'}</p>
          <p>あなたの手: {problem.result.userMoveText}</p>
          <p>正解: {problem.result.correctMovesText?.join(', ')}</p>
          
          {/* 正解の読み筋を再生 */}
          {problem.result.correctMoveCandidates && (
            <CandidateList
              candidates={problem.result.correctMoveCandidates}
              onCandidateClick={(c) => problem.startPlayback(c)}
            />
          )}
          
          <button onClick={problem.reset}>もう一度解く</button>
          <button onClick={() => setProblemIndex(i => i + 1)}>次の問題へ</button>
        </div>
      )}
    </div>
  );
}
```

## コンポーネント API

### `useKifuPlayer(kifu: string, options?)`

棋譜文字列を受け取り、プレイヤーの状態と操作関数を返します。

**オプション引数 (`options`):**
- `initialPly`: 初期手数（デフォルト `0`）
- `onPlyChange`: 手数変更時のコールバック

**返り値の主要なプロパティ:**
- `position`: 現在の局面データ（盤面、持ち駒、手番など）
- `currentPly`: 現在の手数
- `totalPlies`: 総手数
- `header`: 棋譜のヘッダー情報（対局者名など）
- `moves`: 棋譜リスト（`MoveNode[]`）
- `evaluations`: パースされた評価値グラフデータ（`EvaluationPoint[]`）
- `candidates`: 現在の局面における AI の候補手リスト（`Candidate[]`）
- `currentComment`: 現在手のコメント
- `lastMoveCoords`: 最終手の座標（ハイライト用）
- `isOnBranch`: 読み筋（分岐）を再生中かどうか
- `branchSourcePly`: 分岐元の手数
- `variationEval`: 分岐再生時の評価値
- `error`: パースエラー

**返り値の主要な操作メソッド:**
- `forward()` / `backward()`: 1手進む / 戻る
- `goto(ply)`: 指定手数へ移動する
- `goToStart()` / `goToEnd()`: 初期配置 / 最終手へ移動する
- `playVariation(movesStr, score?)`: エンジンの読み筋を分岐として再生する
- `returnToMainLine()`: 分岐再生を終了し、本譜へ戻る

---

### `extractProblemsFromKifu(kifu, options)`

エンジン解析付きの棋譜から、「次の一手問題」データの配列（`ShogiProblem[]`）を抽出します。
指定した手番（`playerColor`）において、直前のAI評価値（自分視点）から指し手による評価値の落差が `evalDropThreshold` 以上あった「悪手」の局面を抽出します。抽出された配列は落差が大きい順にソートされています。

**オプション引数 (`options`):**
- `playerColor` (必須): 抽出対象とする自分の手番 (`'black'` または `'white'`)
- `evalDropThreshold`: 悪手と判定する評価値の落差しきい値（デフォルト `500`）
- `minAdvantage`: 手を指す前の時点での自分視点の評価値の最低ライン。すでに不利な局面での悪手を除外します（デフォルト `-200`）
- `correctMoveThreshold`: 最善手から何点差までのAI候補手を正解とするか（デフォルト `100`）
- `maxProblems`: 抽出する問題の最大件数。指定した場合、評価値の落差が大きい順に上位N件が返されます（デフォルト: 無制限）

---

### `useShogiProblem(problemOptions)`

次の一手問題を対話的に解くためのフックです。`extractProblemsFromKifu` で抽出した `ShogiProblem` オブジェクトをそのまま渡せます。盤面クリックの判定、合法手チェック、成りの判定、正解時の読み筋再生などを管理します。

**返り値の主要なプロパティ:**
- `position`: `ShogiBoard` に渡すための盤面状態
- `status`: 現在のステータス (`'playing'` | `'correct'` | `'incorrect'`)
- `result`: ユーザーが手を指した後の判定結果（`ProblemResult | null`）
- `selectedSquare`: 選択中のマス座標（`ShogiBoard` の `selectedSquare` にそのまま渡せます）
- `legalMoveSquares`: 合法手の移動先マス一覧（`ShogiBoard` の `highlightSquares` にそのまま渡せます）
- `lastMove`: 最後に指された手の座標

**返り値の操作メソッド:**
- `handleSquareClick(sq)`: マスクリック時のハンドラ（`ShogiBoard` の `onSquareClick` にそのまま渡せます）
- `reset()`: 問題を初期状態にリセットしてやり直す

**成り判定:**
- `promotionPending`: 成り・不成りの選択待ち状態（`null` でなければ選択UIを表示してください）
- `resolvePromotion(promote)`: `true` で成り、`false` で不成りを確定

**読み筋の再生（正解後に利用）:**
- `playbackState`: 再生中の状態（`{ currentPly, totalPlies } | null`）
- `startPlayback(candidate)`: 正解の読み筋（`Candidate`）の再生を開始する
- `stopPlayback()`: 再生を終了する
- `forwardPlayback()` / `backwardPlayback()`: 再生を1手進める / 戻す

---

### `ShogiBoard`

将棋盤面を描画する SVG ベースのコンポーネントです。

**主要な Props:**
- `position`: 局面状態（必須）
- `lastMove`: 最終手の座標（ハイライトに使用）
- `reversed`: `true` にすると盤面が後手視点に180度反転します。
- `showReverseButton`: `true` にすると盤面右上に反転用のボタンが描画されます。
- `playerNameSente` / `playerNameGote`: 対局者名（盤面の上下に表示されます）
- `onForward` / `onBackward`: 盤面の右・左半分をクリックした際に発火するコールバック

**インタラクティブモード（v0.2.0, 次の一手問題用）:**
- `interactive`: `true` にするとユーザーが駒を動かせるモードになります（`onForward`/`onBackward` は無効になります）
- `onSquareClick`: マスまたは持ち駒がクリックされた時のコールバック
- `selectedSquare`: 選択中のマス座標（黄色ハイライト表示）
- `highlightSquares`: 合法手の移動先マス座標リスト（青丸表示）

---

### `ControlBar`

再生操作のボタン群を描画するコンポーネントです。

**Props:**
- `currentPly`: 現在の手数（必須）
- `totalPlies`: 総手数（必須）
- `onForward` / `onBackward`: 1手進む / 戻るコールバック（必須）
- `onGoToStart` / `onGoToEnd`: 最初 / 最後へジャンプするコールバック（必須）

---

### `CandidateList`

AI候補手のリストを表示するコンポーネントです。

**Props:**
- `candidates`: 候補手配列 (`Candidate[]`, 必須)
- `onCandidateClick`: 候補手クリック時のコールバック（読み筋の分岐再生などに利用）
- `maxItems`: 最大表示件数（デフォルト `5`）

---

### `EvalGraph`

評価値の推移をグラフで描画する SVG ベースのコンポーネントです。

**Props:**
- `data`: 評価値データ配列 (`EvaluationPoint[]`, 必須)
- `currentPly`: 現在の手数（必須）
- `onPlyClick`: グラフクリック時のコールバック（手数ジャンプに利用）
- `branchData`: 分岐再生時の評価値データ（点線で表示されます）
- `maxScore`: 評価値の上限（デフォルト `2000`）

---

### `MoveList`

棋譜の指し手一覧を描画するコンポーネントです。

**Props:**
- `moves`: 指し手ノード配列 (`MoveNode[]`, 必須)
- `currentPly`: 現在の手数（必須）
- `onPlyClick`: 手数クリック時のコールバック

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
