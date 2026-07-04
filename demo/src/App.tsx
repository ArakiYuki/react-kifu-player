import React, { useState } from 'react';
import {
  useKifuPlayer,
  useShogiProblem,
  extractProblemsFromKifu,
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
  const [mode, setMode] = useState<'player' | 'problem'>('player');
  const [problemIndex, setProblemIndex] = useState(0);
  const theme = resolveTheme(themeName);

  // Headless UI パターン：フックから状態と操作を取得する
  // KIFコメント内の解析データが自動抽出されます
  const player = useKifuPlayer(SAMPLE_KIF);

  // 次の一手問題を抽出 (自分が後手の場合を想定した例)
  const problems = React.useMemo(() => {
    try {
      return extractProblemsFromKifu(SAMPLE_KIF, {
        playerColor: 'white',
        evalDropThreshold: 300,
        correctMoveThreshold: 150,
        maxProblems: 5,
      });
    } catch {
      return [];
    }
  }, []);

  const currentProblem = problems[problemIndex];

  // 次の一手問題フック
  const problem = useShogiProblem(currentProblem ? {
    sfen: currentProblem.sfen,
    playerColor: currentProblem.playerColor,
    correctMoves: currentProblem.correctMoves,
    correctMoveCandidates: currentProblem.correctMoveCandidates,
    badMove: currentProblem.badMove,
    badMoveEval: currentProblem.badMoveEval,
    bestMoveEval: currentProblem.bestMoveEval,
  } : {
    sfen: 'lnsgkgsnl/1r5b1/ppppppppp/9/9/9/PPPPPPPPP/1B5R1/LNSGKGSNL b - 1',
    playerColor: 'black',
    correctMoves: ['7g7f'],
  });


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

  const isDarkTheme = themeName === 'imageDark';

  return (
    <ThemeProvider value={theme}>
      <div style={{
        minHeight: '100vh',
        backgroundColor: isDarkTheme ? '#0a0a0a' : themeName === 'imageGlass' ? '#e0f7fa' : '#f4f6f8',
        color: isDarkTheme ? '#e0e0e0' : '#333333',
        fontFamily: '"Noto Sans JP", system-ui, sans-serif',
        padding: 32,
        transition: 'background-color 0.3s ease, color 0.3s ease',
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
          <p style={{ fontSize: 14, color: isDarkTheme ? '#aaa' : '#666' }}>
            状態（Hook）と見た目（Component）を分離して自由にレイアウトするデモ
          </p>

          <div style={{ marginTop: 20, display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
            {(['text', 'rich', 'imageWood', 'imageDark', 'imageGlass'] as const).map(t => (
              <button
                key={t}
                onClick={() => setThemeName(t)}
                style={{
                  padding: '8px 20px',
                  border: themeName === t ? '2px solid #e8a87c' : `2px solid ${isDarkTheme ? '#444' : '#ccc'}`,
                  borderRadius: 8,
                  background: themeName === t ? 'rgba(232,168,124,0.15)' : 'transparent',
                  color: themeName === t ? '#e8a87c' : (isDarkTheme ? '#aaa' : '#666'),
                  cursor: 'pointer',
                  fontWeight: 'bold',
                }}
              >
                {t} Theme
              </button>
            ))}
          </div>

          {/* モード切り替えタブ */}
          <div style={{ marginTop: 16, display: 'flex', gap: 8, justifyContent: 'center' }}>
            {(['player', 'problem'] as const).map(m => (
              <button
                key={m}
                onClick={() => setMode(m)}
                style={{
                  padding: '6px 24px',
                  border: mode === m ? '2px solid #7ec8e3' : `2px solid ${isDarkTheme ? '#444' : '#ccc'}`,
                  borderRadius: 20,
                  background: mode === m ? 'rgba(126,200,227,0.2)' : 'transparent',
                  color: mode === m ? '#7ec8e3' : (isDarkTheme ? '#aaa' : '#666'),
                  cursor: 'pointer',
                  fontWeight: 'bold',
                  fontSize: 14,
                }}
              >
                {m === 'player' ? '▶ 棋譜再生' : '🧩 次の一手問題'}
              </button>
            ))}
          </div>
        </div>

        {/* 問題モード */}
        {mode === 'problem' && (
          <div style={{ maxWidth: 600, margin: '0 auto', padding: '0 16px' }}>
            <div style={{ background: isDarkTheme ? '#2a2a3e' : '#ffffff', borderRadius: 12, padding: 24, boxShadow: isDarkTheme ? '0 8px 32px rgba(0,0,0,0.3)' : '0 8px 32px rgba(0,0,0,0.1)' }}>
              {problems.length === 0 ? (
                <p style={{ textAlign: 'center', color: isDarkTheme ? '#aaa' : '#666' }}>
                  この棋譜から問題を抽出できませんでした。<br />
                  エンジン解析コメント付きのKIFファイルが必要です。
                </p>
              ) : (
                <>
                  {/* 問題インジケーター */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                    <span style={{ color: '#aaa', fontSize: 13 }}>
                      問題 {problemIndex + 1} / {problems.length}
                      {currentProblem && (
                        <span style={{ marginLeft: 8, color: '#e8a87c' }}>
                          （{currentProblem.playerColor === 'black' ? '先手' : '後手'}番）
                        </span>
                      )}
                    </span>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button
                        onClick={() => { setProblemIndex(Math.max(0, problemIndex - 1)); problem.reset(); }}
                        disabled={problemIndex === 0}
                        style={{ padding: '4px 12px', borderRadius: 6, border: '1px solid #444', background: 'transparent', color: '#aaa', cursor: problemIndex === 0 ? 'not-allowed' : 'pointer' }}
                      >◀ 前</button>
                      <button
                        onClick={() => { setProblemIndex(Math.min(problems.length - 1, problemIndex + 1)); problem.reset(); }}
                        disabled={problemIndex === problems.length - 1}
                        style={{ padding: '4px 12px', borderRadius: 6, border: '1px solid #444', background: 'transparent', color: '#aaa', cursor: problemIndex === problems.length - 1 ? 'not-allowed' : 'pointer' }}
                      >次 ▶</button>
                    </div>
                  </div>

                  {/* 問題文 */}
                  <p style={{ textAlign: 'center', color: isDarkTheme ? '#ccc' : '#555', marginBottom: 16, fontSize: 15, fontWeight: 'bold' }}>
                    {currentProblem?.playerColor === 'black' ? '▲先手' : '△後手'}番の最善手を探せ！
                  </p>

                  {/* 盤面エリア */}
                  <div style={{ position: 'relative' }}>
                    <ShogiBoard
                      position={problem.position}
                      interactive={problem.status === 'playing' && !problem.playbackState}
                      selectedSquare={problem.selectedSquare}
                      highlightSquares={problem.legalMoveSquares}
                      onSquareClick={problem.handleSquareClick}
                      lastMove={problem.lastMove}
                      showReverseButton
                    />

                    {/* 成り判定ダイアログ */}
                    {problem.promotionPending && (
                      <div style={{
                        position: 'absolute',
                        top: 0, left: 0, right: 0, bottom: 0,
                        background: 'rgba(0, 0, 0, 0.6)',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        zIndex: 10,
                      }}>
                        <div style={{
                          background: isDarkTheme ? '#1a1a2e' : '#ffffff',
                          padding: '24px 32px',
                          borderRadius: 12,
                          boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
                          textAlign: 'center',
                          border: '2px solid #e8a87c',
                        }}>
                          <h3 style={{ margin: '0 0 16px', color: isDarkTheme ? '#fff' : '#333' }}>成りますか？</h3>
                          <div style={{ display: 'flex', gap: 16 }}>
                            <button
                              onClick={() => problem.resolvePromotion(true)}
                              style={{ padding: '8px 24px', fontSize: 16, fontWeight: 'bold', background: '#e8a87c', color: isDarkTheme ? '#1a1a2e' : '#fff', border: 'none', borderRadius: 8, cursor: 'pointer' }}
                            >
                              成る
                            </button>
                            <button
                              onClick={() => problem.resolvePromotion(false)}
                              style={{ padding: '8px 24px', fontSize: 16, fontWeight: 'bold', background: 'transparent', color: '#e8a87c', border: '2px solid #e8a87c', borderRadius: 8, cursor: 'pointer' }}
                            >
                              不成
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                  
                  {/* 再生用コントロールバー (読み筋再生時) */}
                  {problem.playbackState && (
                    <div style={{ marginTop: 16, background: isDarkTheme ? '#252540' : '#f0f0f0', padding: 12, borderRadius: 8 }}>
                      <ControlBar
                        currentPly={problem.playbackState.currentPly}
                        totalPlies={problem.playbackState.totalPlies}
                        onForward={problem.forwardPlayback}
                        onBackward={problem.backwardPlayback}
                        onGoToStart={() => {
                          for (let i = 0; i < problem.playbackState!.currentPly; i++) {
                            problem.backwardPlayback();
                          }
                        }}
                        onGoToEnd={() => {
                          for (let i = problem.playbackState!.currentPly; i < problem.playbackState!.totalPlies; i++) {
                            problem.forwardPlayback();
                          }
                        }}
                      />
                      <div style={{ textAlign: 'center', marginTop: 12 }}>
                        <button
                          onClick={problem.stopPlayback}
                          style={{ padding: '6px 20px', borderRadius: 6, border: '1px solid #e8a87c', background: 'rgba(232, 168, 124, 0.1)', color: '#e8a87c', cursor: 'pointer', fontWeight: 'bold' }}
                        >
                          再生を終了する
                        </button>
                      </div>
                    </div>
                  )}

                  {/* 判定結果 */}
                  {problem.status !== 'playing' && problem.result && !problem.playbackState && (
                    <div style={{
                      marginTop: 16,
                      padding: 16,
                      borderRadius: 8,
                      background: problem.status === 'correct' ? 'rgba(50, 200, 100, 0.15)' : 'rgba(220, 80, 80, 0.15)',
                      border: `1px solid ${problem.status === 'correct' ? '#32c864' : '#dc5050'}`,
                    }}>
                      <p style={{ fontWeight: 'bold', fontSize: 18, color: problem.status === 'correct' ? '#32c864' : '#dc5050', margin: '0 0 8px' }}>
                        {problem.status === 'correct' ? '✅ 正解！' : '❌ 不正解...'}
                      </p>
                      
                      
                          <p style={{ color: isDarkTheme ? '#ccc' : '#555', margin: '4px 0', fontSize: 14 }}>
                            あなたの手: <code style={{ color: '#7ec8e3', fontWeight: 'bold' }}>{problem.result.userMoveText || problem.result.userMove}</code>
                          </p>
                          <p style={{ color: isDarkTheme ? '#ccc' : '#555', margin: '4px 0', fontSize: 14 }}>
                            正解: <code style={{ color: '#e8a87c', fontWeight: 'bold' }}>{(problem.result.correctMovesText || problem.result.correctMoves).join(', ')}</code>
                          </p>
                          <p style={{ color: isDarkTheme ? '#ccc' : '#555', margin: '4px 0', fontSize: 14 }}>
                            当時の悪手: <code style={{ color: '#dc5050', fontWeight: 'bold' }}>{problem.result.badMoveText || problem.result.badMove}</code>
                          </p>
                          {problem.result.bestMoveEval !== undefined && problem.result.badMoveEval !== undefined && (
                            <p style={{ color: isDarkTheme ? '#ccc' : '#555', margin: '4px 0', fontSize: 14 }}>
                              評価値: 最善手 <strong style={{ color: '#e8a87c' }}>
                                {problem.result.bestMoveEval > 29000 ? `詰${30000 - problem.result.bestMoveEval}` : 
                                 problem.result.bestMoveEval < -29000 ? `-詰${problem.result.bestMoveEval + 30000}` : 
                                 problem.result.bestMoveEval}
                              </strong> vs
                              当時の悪手後 <strong style={{ color: '#dc5050' }}>
                                {problem.result.badMoveEval > 29000 ? `詰${30000 - problem.result.badMoveEval}` : 
                                 problem.result.badMoveEval < -29000 ? `-詰${problem.result.badMoveEval + 30000}` : 
                                 problem.result.badMoveEval}
                              </strong>
                              {problem.result.evalImprovement !== undefined && (
                                <span style={{ color: '#32c864', marginLeft: 8 }}>（{problem.result.evalImprovement}点の差）</span>
                              )}
                            </p>
                          )}
                          {problem.result.correctMoveCandidates && problem.result.correctMoveCandidates.length > 0 && (
                            <div style={{ marginTop: 12, background: isDarkTheme ? 'rgba(0,0,0,0.2)' : 'rgba(0,0,0,0.05)', padding: '8px 12px', borderRadius: 6 }}>
                              <p style={{ color: isDarkTheme ? '#ccc' : '#555', margin: '0 0 6px', fontSize: 13, fontWeight: 'bold' }}>💡 正解の読み筋 (クリックで再生):</p>
                              <CandidateList
                                candidates={problem.result.correctMoveCandidates}
                                onCandidateClick={(cand) => problem.startPlayback(cand)}
                                theme={theme.candidateList}
                              />
                            </div>
                          )}
                      
                      <button
                        onClick={problem.reset}
                        style={{ marginTop: 12, padding: '6px 20px', borderRadius: 6, border: '1px solid #7ec8e3', background: 'rgba(126,200,227,0.1)', color: '#7ec8e3', cursor: 'pointer', fontWeight: 'bold' }}
                      >
                        もう一度解く
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        )}

        {/* 再生モード */}
        {mode === 'player' && (
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
                background: isDarkTheme ? '#252540' : '#ffffff',
                borderRadius: 12,
                padding: 16,
                boxShadow: isDarkTheme ? '0 8px 32px rgba(0,0,0,0.3)' : '0 8px 32px rgba(0,0,0,0.1)',
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
                  background: isDarkTheme ? '#1a1a2e' : '#f8f9fa',
                  border: isDarkTheme ? '1px solid #444' : '1px solid #ddd',
                  borderRadius: 8,
                  height: 100,
                  overflowY: 'auto',
                  fontSize: 14,
                  lineHeight: 1.6,
                  color: isDarkTheme ? '#e0e0e0' : '#333',
                }}>
                  {player.currentComment ? (
                    <div style={{ whiteSpace: 'pre-wrap' }}>{player.currentComment}</div>
                  ) : (
                    <div style={{ color: isDarkTheme ? '#666' : '#999', fontStyle: 'italic' }}>コメントはありません</div>
                  )}
                </div>
              </div>
            </div>

            {/* 右カラム: 評価値・候補手・棋譜リスト */}
            <div style={{ flex: '1 1 300px', display: 'flex', flexDirection: 'column', gap: 16, minWidth: 0 }}>
              {/* 評価値グラフ */}
              <div style={{
                background: isDarkTheme ? '#252540' : '#ffffff',
                borderRadius: 12,
                padding: 16,
                boxShadow: isDarkTheme ? '0 8px 32px rgba(0,0,0,0.3)' : '0 8px 32px rgba(0,0,0,0.1)',
                flexShrink: 0,
              }}>
                <div style={{ fontSize: 13, color: isDarkTheme ? '#aaa' : '#666', marginBottom: 8, fontWeight: 'bold' }}>評価値グラフ</div>
                <EvalGraph
                  data={player.evaluations}
                  currentPly={player.currentPly}
                  onPlyClick={player.goto}
                  branchData={player.variationEval ? [player.variationEval] : undefined}
                />
              </div>

              {/* 候補手リスト / 分岐再生中の情報 */}
              <div style={{
                background: isDarkTheme ? '#252540' : '#ffffff',
                borderRadius: 12,
                padding: 16,
                boxShadow: isDarkTheme ? '0 8px 32px rgba(0,0,0,0.3)' : '0 8px 32px rgba(0,0,0,0.1)',
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
                    <div style={{ fontSize: 13, color: isDarkTheme ? '#aaa' : '#666' }}>
                      {player.branchSourcePly}手目から分岐
                    </div>
                    {player.variationEval && (
                      <div style={{ fontSize: 14, color: isDarkTheme ? '#e0e0e0' : '#333' }}>
                        評価値: <span style={{
                          fontWeight: 'bold',
                          color: player.variationEval.score > 300 ? '#d32f2f'
                            : player.variationEval.score < -300 ? '#1976d2'
                              : (isDarkTheme ? '#e0e0e0' : '#333')
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
                    <div style={{ fontSize: 13, color: isDarkTheme ? '#aaa' : '#666', marginBottom: 8, fontWeight: 'bold' }}>AI候補手</div>
                    <CandidateList
                      candidates={player.candidates}
                      onCandidateClick={(c) => player.playVariation(c.readMoves, c.score)}
                    />
                  </>
                )}
              </div>

              {/* 棋譜リスト */}
              <div style={{
                background: isDarkTheme ? '#252540' : '#ffffff',
                borderRadius: 12,
                padding: 16,
                boxShadow: isDarkTheme ? '0 8px 32px rgba(0,0,0,0.3)' : '0 8px 32px rgba(0,0,0,0.1)',
                flex: 1,
                minHeight: 200,
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden'
              }}>
                <div style={{ fontSize: 13, color: isDarkTheme ? '#aaa' : '#666', marginBottom: 8, fontWeight: 'bold' }}>棋譜リスト</div>
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
        )}

      </div>
    </ThemeProvider>

  );
}

export default App;
