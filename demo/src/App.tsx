import React, { useState } from 'react';
import { KifuPlayer } from 'react-kifu-player';

// サンプル棋譜 (KIF形式)
const SAMPLE_KIF = `手合割：平手
先手：藤井聡太
後手：渡辺明
手数----指手---------消費時間--
   1 ７六歩(77)   ( 0:01/00:00:01)
   2 ３四歩(33)   ( 0:01/00:00:01)
   3 ２六歩(27)   ( 0:01/00:00:02)
   4 ８四歩(83)   ( 0:01/00:00:02)
   5 ２五歩(26)   ( 0:01/00:00:03)
   6 ８五歩(84)   ( 0:01/00:00:03)
   7 ７八金(69)   ( 0:01/00:00:04)
   8 ３二金(41)   ( 0:01/00:00:04)
   9 ２四歩(25)   ( 0:02/00:00:06)
  10 同　歩(23)   ( 0:01/00:00:05)
  11 同　飛(28)   ( 0:01/00:00:07)
  12 ２三歩打     ( 0:01/00:00:06)
  13 ２六飛(24)   ( 0:01/00:00:08)
  14 ８六歩(85)   ( 0:01/00:00:07)
  15 同　歩(87)   ( 0:01/00:00:09)
  16 同　飛(82)   ( 0:01/00:00:08)
  17 ８七歩打     ( 0:01/00:00:10)
  18 ８二飛(86)   ( 0:01/00:00:09)
  19 ６八銀(79)   ( 0:01/00:00:11)
  20 ６二銀(71)   ( 0:01/00:00:10)
`;

function App() {
  const [theme, setTheme] = useState<'text' | 'rich'>('rich');
  const [currentPly, setCurrentPly] = useState(0);

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#1a1a2e',
      color: '#e0e0e0',
      fontFamily: '"Noto Sans JP", system-ui, sans-serif',
      padding: 32,
    }}>
      {/* ヘッダー */}
      <div style={{ textAlign: 'center', marginBottom: 32 }}>
        <h1 style={{
          fontSize: 28,
          fontWeight: 700,
          background: 'linear-gradient(135deg, #f5d0a9, #e8a87c)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          marginBottom: 8,
        }}>
          react-kifu-player
        </h1>
        <p style={{ fontSize: 14, color: '#888' }}>
          リッチな将棋棋譜再生Reactコンポーネントライブラリ
        </p>
      </div>

      {/* テーマ切替 */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: 12, marginBottom: 24 }}>
        <button
          onClick={() => setTheme('text')}
          style={{
            padding: '8px 20px',
            border: theme === 'text' ? '2px solid #e8a87c' : '2px solid #444',
            borderRadius: 8,
            background: theme === 'text' ? 'rgba(232,168,124,0.15)' : 'transparent',
            color: theme === 'text' ? '#e8a87c' : '#888',
            cursor: 'pointer',
            fontSize: 14,
            fontWeight: 600,
            transition: 'all 0.2s',
          }}
        >
          テキストテーマ
        </button>
        <button
          onClick={() => setTheme('rich')}
          style={{
            padding: '8px 20px',
            border: theme === 'rich' ? '2px solid #e8a87c' : '2px solid #444',
            borderRadius: 8,
            background: theme === 'rich' ? 'rgba(232,168,124,0.15)' : 'transparent',
            color: theme === 'rich' ? '#e8a87c' : '#888',
            cursor: 'pointer',
            fontSize: 14,
            fontWeight: 600,
            transition: 'all 0.2s',
          }}
        >
          リッチテーマ
        </button>
      </div>

      {/* 手数表示 */}
      <div style={{ textAlign: 'center', marginBottom: 16, fontSize: 13, color: '#666' }}>
        現在の手数: {currentPly} (← → キーで操作可能)
      </div>

      {/* メインプレーヤー */}
      <div style={{ display: 'flex', justifyContent: 'center' }}>
        <div style={{
          background: '#252540',
          borderRadius: 16,
          padding: 24,
          boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
          maxWidth: 680,
          width: '100%',
        }}>
          <KifuPlayer
            kifu={SAMPLE_KIF}
            theme={theme}
            showMoveList={true}
            showControlBar={true}
            onPlyChange={setCurrentPly}
          />
        </div>
      </div>

      {/* 使い方サンプルコード */}
      <div style={{ textAlign: 'center', marginTop: 40, fontSize: 13, color: '#555' }}>
        <code style={{
          background: '#252540',
          padding: '12px 24px',
          borderRadius: 8,
          display: 'inline-block',
          fontFamily: 'monospace',
          color: '#aaa',
        }}>
          {`import { KifuPlayer } from 'react-kifu-player';`}
          <br />
          {`<KifuPlayer kifu={kifuString} theme="rich" />`}
        </code>
      </div>
    </div>
  );
}

export default App;
