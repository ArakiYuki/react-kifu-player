---
sidebar_position: 3
---

# detectFormat

与えられた棋譜の文字列が、どのフォーマット（形式）で書かれているかを自動判定するユーティリティ関数です。
`parseKifu` は内部でこの関数を利用してフォーマットを判定し、適切なパーサーを呼び出しています。

## インポート

```typescript
import { detectFormat } from 'react-kifu-player';
```

## シグネチャ

```typescript
function detectFormat(kifu: string): KifuFormat;
```

### 引数

- `kifu` (`string`)
  - フォーマットを判定したい棋譜データの文字列。

### 戻り値

- `KifuFormat`
  - 以下のいずれかの文字列を返します。
  - `'kif'` : 柿木将棋形式（KIF/KIFU）
  - `'ki2'` : KI2形式
  - `'csa'` : CSA形式
  - `'jkf'` : JSON Kifu Format
  - `'sfen'` : SFEN形式（盤面状態のみ）
  - `'unknown'` : いずれの形式でもないと判定された場合

## 判定ロジックについて

判定は文字列のプレフィックスや特定の特徴的な文字列（例: `'V2.2'`, `手数----指手`, `'{"header":'` など）を含むかどうかを調べることで高速に行われます。

## 例

```typescript
import { detectFormat } from 'react-kifu-player';

const csaString = `V2.2
N+Sente
N-Gote
PI
+2726FU
-8384FU
`;

const format = detectFormat(csaString);
console.log(format); // "csa"
```
