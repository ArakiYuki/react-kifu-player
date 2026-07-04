---
sidebar_position: 2
---

# parseKifu

`react-kifu-player` のコアとなる棋譜パース用ユーティリティ関数です。
文字列として与えられた棋譜データ（KIF, KI2, CSA, JKFなど）を解析し、ライブラリ内部で共通して扱うことができる `GameRecord`（ゲームレコード）オブジェクトに変換します。

`useKifuPlayer` フックの内部でもこの関数が使われていますが、もしフックを使わずに独自で状態を管理したり、サーバーサイド等で事前に棋譜をパース・解析したい場合に便利です。

## インポート

```typescript
import { parseKifu } from 'react-kifu-player';
```

## シグネチャ

```typescript
function parseKifu(kifu: string): GameRecord;
```

### 引数

- `kifu` (`string`)
  - パースしたい棋譜データの文字列。
  - 対応しているフォーマットは以下の通りです：
    - `.kif` / `.kifu` (柿木将棋形式)
    - `.ki2`
    - `.csa` (CSA形式)
    - JKF (JSON Kifu Format) 文字列

### 戻り値

- `GameRecord`
  - 内部で統一された形式の棋譜データオブジェクトです。
  - 初期局面やヘッダー情報（対局者名、日時など）、および指し手（分岐を含むツリー構造）を保持します。

```typescript
export interface GameRecord {
  header: GameHeader;     // 棋戦名、対局者名、対局日などのメタデータ
  initialPosition: Position; // 初期局面
  moves: MoveNode[];      // 指し手のツリー（配列の最初の要素がルート（初期局面）ノード）
}
```

## 例

```typescript
import { parseKifu } from 'react-kifu-player';

const kifuString = `
手合割：平手
手数----指手---------消費時間--
   1 ２六歩(27)   ( 0:00/00:00:00)
   2 ８四歩(83)   ( 0:00/00:00:00)
`;

// 文字列から GameRecord オブジェクトを生成
const record = parseKifu(kifuString);

console.log(record.header.sente); // 先手の対局者名
console.log(record.initialPosition.board); // 初期局面の盤面配列
console.log(record.moves[0].children[0].move?.moveText); // "☗２六歩"
```

## エラーハンドリング

未知のフォーマットや、フォーマットが壊れている棋譜文字列を渡した場合、パースに失敗して `Error` がスローされることがあります。外部からの入力を扱う場合は `try...catch` で囲むことを推奨します。
