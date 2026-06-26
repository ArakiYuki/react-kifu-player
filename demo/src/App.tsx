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

// 実データをロード (Viteの?rawインポートを利用)
import SAMPLE_KIF from '../demo.kifu?raw';

function App() {
  const [themeName, setThemeName] = useState<'text' | 'rich' | 'imageWood' | 'imageDark' | 'imageGlass'>('imageWood');
  const theme = resolveTheme(themeName);
  
  // Headless UI パターン：フックから状態と操作を取得する
  // KIFコメント内の解析データが自動抽出されます
  const player = useKifuPlayer(SAMPLE_KIF);

  console.log('Current theme senteImages:', theme.piece.senteImages);

  // キーボード操作での手数移動
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Input要素などの編集中は無効化
      if (document.activeElement && ['INPUT', 'TEXTAREA'].includes(document.activeElement.tagName)) {
        return;
      }
      
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
        e.preventDefault();
        player.forward();
      } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
        e.preventDefault();
        player.backward();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [player]);

  return (
    <ThemeProvider value={theme}>
      <div style={{
        minHeight: '100vh',
        backgroundColor: themeName === 'imageDark' ? '#0a0a0a' : themeName === 'imageGlass' ? '#1a1a2e' : '#9a9af4ff',
        color: themeName === 'imageDark' ? '#ffffff' : '#e0e0e0',
        fontFamily: '"Noto Sans JP", system-ui, sans-serif',
        padding: 32,
        transition: 'background-color 0.3s ease',
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
            react-kifu-player (Headless UI Demo)
          </h1>
          <p style={{ fontSize: 14, color: themeName === 'imageDark' ? '#aaa' : '#888' }}>
            状態（Hook）と見た目（Component）を分離して自由にレイアウトするデモ
          </p>

          <div style={{ marginTop: 20, display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
            {(['text', 'rich', 'imageWood', 'imageDark', 'imageGlass'] as const).map(t => (
              <button
                key={t}
                onClick={() => setThemeName(t)}
                style={{
                  padding: '8px 20px',
                  border: themeName === t ? '2px solid #e8a87c' : '2px solid #444',
                  borderRadius: 8,
                  background: themeName === t ? 'rgba(232,168,124,0.15)' : 'transparent',
                  color: themeName === t ? '#e8a87c' : '#888',
                  cursor: 'pointer',
                  fontWeight: 'bold',
                }}
              >
                {t} Theme
              </button>
            ))}
          </div>
        </div>

        <div style={{ 
          maxWidth: 1200, 
          margin: '0 auto',
          display: 'flex',
          gap: 32,
          alignItems: 'flex-start',
          flexWrap: 'wrap',
        }}>
          {/* 左カラム: 盤面と操作ボタン */}
          <div style={{ flex: '0 0 auto', width: 460 }}>
            <div style={{
              background: '#252540',
              borderRadius: 12,
              padding: 16,
              boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
            }}>
              <ShogiBoard 
                position={player.position}
                lastMove={player.lastMoveCoords || undefined}
                onForward={player.forward}
                onBackward={player.backward}
                playerNameSente={player.header?.blackName ? `☗${player.header.blackName}` : undefined}
                playerNameGote={player.header?.whiteName ? `☖${player.header.whiteName}` : undefined}
              />
              <div style={{ marginTop: 12 }}>
                <ControlBar
                  currentPly={player.currentPly}
                  totalPlies={player.totalPlies}
                  onForward={player.forward}
                  onBackward={player.backward}
                  onGoToStart={player.goToStart}
                  onGoToEnd={player.goToEnd}
                />
              </div>

              {/* コメント表示欄 */}
              <div style={{
                marginTop: 16,
                padding: '12px 16px',
                background: '#1a1a2e',
                border: '1px solid #444',
                borderRadius: 8,
                height: 100,
                overflowY: 'auto',
                fontSize: 14,
                lineHeight: 1.6,
                color: '#e0e0e0',
              }}>
                {player.currentComment ? (
                  <div style={{ whiteSpace: 'pre-wrap' }}>{player.currentComment}</div>
                ) : (
                  <div style={{ color: '#666', fontStyle: 'italic' }}>コメントはありません</div>
                )}
              </div>
            </div>
          </div>

          {/* 右カラム: 評価値・候補手・棋譜リスト */}
          <div style={{ flex: '1 1 300px', display: 'flex', flexDirection: 'column', gap: 16, minWidth: 0 }}>
            {/* 評価値グラフ */}
            <div style={{
              background: '#252540',
              borderRadius: 12,
              padding: 16,
              boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
              flexShrink: 0,
            }}>
              <div style={{ fontSize: 13, color: '#aaa', marginBottom: 8, fontWeight: 'bold' }}>評価値グラフ</div>
              <EvalGraph 
                data={player.evaluations}
                currentPly={player.currentPly}
                onPlyClick={player.goto}
                branchData={player.variationEval ? [player.variationEval] : undefined}
              />
            </div>

            {/* 候補手リスト / 分岐再生中の情報 */}
            <div style={{
              background: '#252540',
              borderRadius: 12,
              padding: 16,
              boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
              height: 200,
              flexShrink: 0,
              overflow: 'auto',
            }}>
              {player.isOnBranch ? (
                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  height: '100%',
                  gap: 10,
                }}>
                  <div style={{ 
                    fontSize: 15, 
                    fontWeight: 'bold', 
                    color: '#ff6b6b',
                    letterSpacing: 1,
                  }}>
                    📖 読み筋再生中
                  </div>
                  <div style={{ fontSize: 13, color: '#aaa' }}>
                    {player.branchSourcePly}手目から分岐
                  </div>
                  {player.variationEval && (
                    <div style={{ fontSize: 14, color: '#e0e0e0' }}>
                      評価値: <span style={{ 
                        fontWeight: 'bold',
                        color: player.variationEval.score > 300 ? '#d32f2f' 
                             : player.variationEval.score < -300 ? '#1976d2' 
                             : '#e0e0e0'
                      }}>
                        {player.variationEval.score > 0 ? '+' : ''}{player.variationEval.score}
                      </span>
                    </div>
                  )}
                  <button
                    onClick={player.returnToMainLine}
                    style={{
                      marginTop: 8,
                      padding: '8px 24px',
                      background: '#d32f2f',
                      color: '#fff',
                      border: 'none',
                      borderRadius: 8,
                      cursor: 'pointer',
                      fontWeight: 'bold',
                      fontSize: 14,
                      boxShadow: '0 4px 12px rgba(211,47,47,0.4)',
                      transition: 'transform 0.1s',
                    }}
                  >
                    本譜に戻る
                  </button>
                </div>
              ) : (
                <>
                  <div style={{ fontSize: 13, color: '#aaa', marginBottom: 8, fontWeight: 'bold' }}>AI候補手</div>
                  <CandidateList 
                    candidates={player.candidates} 
                    onCandidateClick={(c) => player.playVariation(c.readMoves, c.score)}
                  />
                </>
              )}
            </div>

            {/* 棋譜リスト */}
            <div style={{
              background: '#252540',
              borderRadius: 12,
              padding: 16,
              boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
              flex: 1,
              minHeight: 200,
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden'
            }}>
              <div style={{ fontSize: 13, color: '#aaa', marginBottom: 8, fontWeight: 'bold' }}>棋譜リスト</div>
              <div style={{ flex: 1, border: `1px solid ${theme.moveList.highlightColor}`, borderRadius: 4, overflow: 'hidden' }}>
                <MoveList 
                  moves={player.moves}
                  currentPly={player.currentPly}
                  onPlyClick={player.goto}
                />
              </div>
            </div>
          </div>
        </div>

      </div>
    </ThemeProvider>
  );
}

export default App;
