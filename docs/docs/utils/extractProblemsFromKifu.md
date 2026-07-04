---
sidebar_position: 3
---

# extractProblemsFromKifu

`extractProblemsFromKifu` は、**エンジン解析付き棋譜から「次の一手問題」を自動生成する**ユーティリティ関数です。

解析済み棋譜（KIFコメントに `** 解析 候補N ...` 形式でAI評価値が記録されているもの）を読み込み、「自分が悪手を指してしまった局面」を自動的に抽出して問題化します。

## なぜこれが必要か

`useShogiProblem` で問題を出題するには、課題局面のSFEN・正解手（USI形式）・プレイヤーの手番などのデータが必要です。
これらを手動で作成するのは大変ですが、**エンジン解析済みの棋譜さえあれば `extractProblemsFromKifu` が全て自動で用意してくれます。**

```
解析済みKIF → extractProblemsFromKifu → ShogiProblem[] → useShogiProblem
```

## 基本的な使い方

```tsx
import { extractProblemsFromKifu, useShogiProblem } from 'react-kifu-player';

// 解析コメント付きのKIF文字列（Floodgate棋譜・将棋所出力など）
const kifuString = `...`;

// 後手側の悪手を最大5問抽出する
const problems = extractProblemsFromKifu(kifuString, {
  playerColor: 'white',        // 問題にする手番 ('black' or 'white')
  evalDropThreshold: 300,      // 評価値が300以上落ちた手を悪手と判定
  correctMoveThreshold: 150,   // 最善手との差が150以内を全て正解とする
  maxProblems: 5,
});

// 問題を使って出題する
const problem = useShogiProblem(problems[0]);
```

## オプション

| パラメータ | 型 | デフォルト | 説明 |
| --- | --- | --- | --- |
| `playerColor` | `'black' \| 'white'` | ✅ 必須 | 悪手判定の対象となる手番。自分（問題を解くプレイヤー）の手番を指定します |
| `evalDropThreshold` | `number` | `500` | 悪手と判定する評価値落差のしきい値（正の値で指定）。`300` なら評価値が300以上落ちた手を抽出します |
| `correctMoveThreshold` | `number` | `100` | 複数正解を許容する範囲。AI最善手との評価値差がこの値以内の候補手を全て正解とします |
| `maxProblems` | `number` | 無制限 | 抽出する最大問題数。評価値落差（evalDrop）が大きい順（最悪手が先）にN件返されます |
| `minAdvantage` | `number` | `-200` | 問題抽出の対象とする局面の最低評価値。すでに大きく不利な局面での悪手は除外できます |

## 返り値の型: ShogiProblem

```ts
type ShogiProblem = {
  sfen: string;                        // 課題局面のSFEN文字列
  playerColor: 'black' | 'white';      // 解答プレイヤーの手番
  correctMoves: string[];              // 正解手のリスト（USI形式）
  correctMoveCandidates?: Candidate[]; // 正解手の読み筋データ（CandidateListに渡せる）
  badMove: string;                     // 当時の悪手（USI形式）
  badMoveEval: number;                 // 悪手を指した後の評価値
  bestMoveEval: number;                // AIが示した最善手の評価値
  evalDrop: number;                    // 評価値の落差（負の値）
  sourcePly?: number;                  // 元棋譜での手数（参考情報）
};
```

この `ShogiProblem` オブジェクトは **`useShogiProblem` にそのまま渡せます**（全てのフィールドが対応しています）。

## useShogiProblem との連携パターン

複数問題を切り替えながら出題する典型的なパターンです。

```tsx
import React from 'react';
import { extractProblemsFromKifu, useShogiProblem, ShogiBoard, CandidateList } from 'react-kifu-player';

const kifuString = `...（解析済みKIF）...`;

function ProblemApp() {
  const [index, setIndex] = React.useState(0);

  const problems = React.useMemo(() =>
    extractProblemsFromKifu(kifuString, {
      playerColor: 'white',
      evalDropThreshold: 300,
      correctMoveThreshold: 150,
      maxProblems: 5,
    }), []
  );

  const current = problems[index];

  // useShogiProblem は常に呼び出す（フックのルール）
  const problem = useShogiProblem(current ?? {
    sfen: 'lnsgkgsnl/1r5b1/ppppppppp/9/9/9/PPPPPPPPP/1B5R1/LNSGKGSNL b - 1',
    playerColor: 'black',
    correctMoves: [],
  });

  if (!current) return <div>問題がありません</div>;

  return (
    <div>
      <p>{index + 1} / {problems.length} 問目（評価値 -{Math.abs(current.evalDrop)} の悪手）</p>

      <ShogiBoard
        position={problem.position}
        lastMove={problem.lastMove}
        interactive={problem.status === 'playing'}
        onSquareClick={problem.handleSquareClick}
        selectedSquare={problem.selectedSquare}
        highlightSquares={problem.legalMoveSquares}
        reversed={current.playerColor === 'white'}
      />

      {problem.status === 'correct' && <p>🎉 正解！ AIも推奨した最善手です</p>}
      
      {problem.status === 'incorrect' && (
        <>
          <p>❌ 不正解。正解: {problem.result?.correctMovesText?.join(' / ')}</p>
          {/* 正解の読み筋を候補手リストで表示することも可能 */}
          {current.correctMoveCandidates && (
            <CandidateList
              candidates={current.correctMoveCandidates}
              onCandidateClick={(cand) => console.log('読み筋:', cand.readMoves)}
            />
          )}
        </>
      )}

      <button onClick={problem.reset}>やり直す</button>
      <button onClick={() => setIndex((i) => (i + 1) % problems.length)}>
        次の問題
      </button>
    </div>
  );
}
```

## 解析済み棋譜の作り方

`extractProblemsFromKifu` は棋譜のKIFコメントにエンジン評価値が含まれている必要があります。以下のツールで解析済み棋譜を生成できます。

- **将棋所 / ShogiGUI**: メニューから「エンジン解析」を実行し、解析コメント付きでKIF保存
- **Floodgate棋譜**: すでに解析済みコメントが付いているものが多い
- **やねうら王 / dlshogi**: CLI から解析出力を KIF コメントとして書き出す

解析コメントの形式（自動認識されます）:

```
** 解析 0 ○ 候補1 時間 00:10.0 深さ 22 ノード数 12345 評価値 450 読み筋 ▲７六歩 △８四歩 ...
** 解析 0   候補2 時間 00:10.0 深さ 18 ノード数 12345 評価値 380 読み筋 ▲２六歩 ...
```
