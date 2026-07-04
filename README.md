# react-kifu-player

モダンでカスタマイズ性の高い、React 用の将棋盤・棋譜再生コンポーネントライブラリです。
Headless UI パターンを採用しており、状態管理（Hook）と見た目（Component）が完全に分離されているため、プロジェクトに合わせて自由にレイアウトやデザインを構築できます。

**📚 [公式ドキュメントサイトはこちら (GitHub Pages)](https://arakiyuki.github.io/react-kifu-player/)**
豊富なコンポーネントの使用例や詳細なAPI仕様、ライブデモをご確認いただけます。

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
## 詳しい使い方とAPIリファレンス

各コンポーネントやフックの詳細なAPI仕様、応用的な使い方（エンジン解析のパース、次の一手問題の自動生成など）については、以下の公式ドキュメントサイトをご覧ください。

**👉 [公式ドキュメントサイトを開く](https://arakiyuki.github.io/react-kifu-player/)**

## ライセンス

MIT License

