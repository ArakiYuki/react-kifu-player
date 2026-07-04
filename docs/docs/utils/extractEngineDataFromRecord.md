---
sidebar_position: 4
---

# extractEngineDataFromRecord

パースされた `GameRecord` から、将棋エンジン（水匠、dlshogiなど）による評価値データや候補手（読み筋）のデータを抽出するユーティリティ関数です。

KIF形式やCSA形式で、ShogiGUIなどの検討ソフトが出力する **「コメント行に埋め込まれた評価値や読み筋」** の文字列を解析し、グラフ表示や候補手リスト表示に適した構造化データに変換します。
`useKifuPlayer` は内部でこの関数を利用して、`EvalGraph` や `CandidateList` コンポーネント用のデータを生成しています。

## インポート

```typescript
import { extractEngineDataFromRecord } from 'react-kifu-player';
```

## シグネチャ

```typescript
function extractEngineDataFromRecord(
  record: GameRecord
): { 
  evaluations: EvaluationPoint[], 
  candidates: CandidatesMap 
};
```

### 引数

- `record` (`GameRecord`)
  - `parseKifu` でパース済みのゲームレコードオブジェクト。

### 戻り値

- `evaluations` (`EvaluationPoint[]`)
  - 各手ごとの評価値（手数と評価値の数値）の配列です。
  - `EvalGraph` に渡すためのプロットデータとして利用されます。
- `candidates` (`CandidatesMap`)
  - 手数をキーとし、その局面での「候補手（読み筋）」の配列を持つマップ（オブジェクト）です。
  - `CandidateList` に渡すためのデータとして利用されます。

## 例

```typescript
import { parseKifu, extractEngineDataFromRecord } from 'react-kifu-player';

// ShogiGUI などがエクスポートしたエンジンコメント入りのKIF
const kifuString = `
手合割：平手
手数----指手---------消費時間--
   1 ２六歩(27)   ( 0:00/00:00:00)
*#評価値 120
*#読み筋 △８四歩(83) ▲２五歩(26) △８五歩(84)
   2 ８四歩(83)   ( 0:00/00:00:00)
`;

const record = parseKifu(kifuString);
const engineData = extractEngineDataFromRecord(record);

console.log(engineData.evaluations);
// [{ ply: 1, evaluation: 120 }]

console.log(engineData.candidates);
// { 
//   1: [{ 
//     moveText: "△８四歩", 
//     evaluation: 120, 
//     pv: ["△８四歩", "▲２五歩", "△８五歩"]
//   }] 
// }
```

## 応用例

`useKifuPlayer` を使わずに自作の棋譜ビューアーを作る場合でも、この関数を利用することで、簡単に評価値グラフ（`EvalGraph`）を表示するためのデータを取得することができます。
