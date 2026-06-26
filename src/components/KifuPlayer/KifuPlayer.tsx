// =============================================================================
// Component: KifuPlayer - All-in-one integrated component
// =============================================================================
import React, { useRef } from 'react';
import type { KifuPlayerProps } from '../../types';
import { resolveTheme, ThemeProvider } from '../../themes';
import { useKifuPlayer } from '../../hooks/useKifuPlayer';
import { useKeyboardNav } from '../../hooks/useKeyboardNav';
import { ShogiBoard } from '../ShogiBoard/ShogiBoard';
import { ControlBar } from '../ControlBar/ControlBar';
import { MoveList } from '../MoveList/MoveList';

/**
 * KifuPlayer - 棋譜再生の統合コンポーネント
 *
 * @example
 * ```tsx
 * // 最小利用
 * <KifuPlayer kifu={kifuString} />
 *
 * // フルカスタマイズ
 * <KifuPlayer
 *   kifu={kifuString}
 *   theme="rich"
 *   showMoveList={true}
 *   showControlBar={true}
 *   showEvalGraph={true}
 *   onPlyChange={(ply) => console.log(ply)}
 * />
 * ```
 */
export function KifuPlayer(props: KifuPlayerProps) {
  const {
    kifu,
    theme: themeProp,
    showEvalGraph = false,
    showMoveList = true,
    showCandidates = false,
    showControlBar = true,
    evaluations: externalEvals,
    candidates: externalCandidates,
    initialPly,
    onPlyChange,
    onBranchChange,
    width,
    className,
    style,
  } = props;

  const containerRef = useRef<HTMLDivElement>(null);

  // テーマの解決
  const resolvedTheme = resolveTheme(themeProp);

  // メインhook
  const player = useKifuPlayer(kifu, {
    initialPly,
    onPlyChange,
  });

  // キーボードナビゲーション
  useKeyboardNav({
    onForward: player.forward,
    onBackward: player.backward,
    onGoToStart: player.goToStart,
    onGoToEnd: player.goToEnd,
    containerRef,
  });

  // エラー表示
  if (player.error) {
    return (
      <div
        className={className}
        style={{
          padding: 16,
          color: '#dc2626',
          background: '#fef2f2',
          border: '1px solid #fecaca',
          borderRadius: 8,
          fontFamily: 'system-ui, sans-serif',
          fontSize: 14,
          ...style,
        }}
      >
        <strong>棋譜の読み込みエラー:</strong>
        <br />
        {player.error}
      </div>
    );
  }

  return (
    <ThemeProvider value={resolvedTheme}>
      <div
        ref={containerRef}
        className={className}
        tabIndex={0}
        role="application"
        aria-label="棋譜再生プレーヤー"
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 8,
          width: width || '100%',
          maxWidth: 600,
          outline: 'none',
          fontFamily: 'system-ui, sans-serif',
          ...style,
        }}
      >
        {/* ヘッダー (対局者名) */}
        {player.header && (player.header.blackName || player.header.whiteName) && (
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '6px 12px',
              fontSize: 14,
              color: resolvedTheme.moveList.textColor,
              fontFamily: resolvedTheme.moveList.fontFamily,
            }}
          >
            <span>☗ {player.header.blackName || '先手'}</span>
            <span>☖ {player.header.whiteName || '後手'}</span>
          </div>
        )}

        {/* メインエリア: 盤面 + 棋譜リスト */}
        <div
          style={{
            display: 'flex',
            gap: 8,
            alignItems: 'flex-start',
          }}
        >
          {/* 盤面 */}
          <div style={{ flex: showMoveList ? '1 1 auto' : '1 1 100%', minWidth: 0 }}>
            <ShogiBoard
              position={player.position}
              lastMove={player.lastMoveCoords || undefined}
              onForward={player.forward}
              onBackward={player.backward}
            />
          </div>

          {/* 棋譜リスト */}
          {showMoveList && (
            <div
              style={{
                flex: '0 0 180px',
                border: `1px solid ${resolvedTheme.moveList.highlightColor}`,
                borderRadius: 4,
                overflow: 'hidden',
              }}
            >
              <MoveList
                moves={player.moves}
                currentPly={player.currentPly}
                onPlyClick={player.goto}
              />
            </div>
          )}
        </div>

        {/* 操作バー */}
        {showControlBar && (
          <ControlBar
            onBackward={player.backward}
            onForward={player.forward}
            onGoToStart={player.goToStart}
            onGoToEnd={player.goToEnd}
            currentPly={player.currentPly}
            totalPlies={player.totalPlies}
          />
        )}

        {/* コメント表示 */}
        {player.currentComment && (
          <div
            style={{
              padding: '8px 12px',
              fontSize: 13,
              color: resolvedTheme.moveList.commentColor,
              fontFamily: resolvedTheme.moveList.fontFamily,
              background: resolvedTheme.moveList.background,
              borderRadius: 4,
              lineHeight: 1.5,
            }}
          >
            {player.currentComment}
          </div>
        )}

        {/* TODO: EvalGraph (Phase 2) */}
        {/* TODO: CandidatePanel (Phase 2) */}
      </div>
    </ThemeProvider>
  );
}
