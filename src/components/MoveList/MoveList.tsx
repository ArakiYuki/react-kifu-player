// =============================================================================
// Component: MoveList - Game record move list with comments
// =============================================================================
import React, { useEffect, useRef } from 'react';
import type { MoveListProps, MoveListTheme, MoveNode } from '../../types';
import { useKifuTheme } from '../../themes';

/** 棋譜リストコンポーネント */
export function MoveList(props: MoveListProps) {
  const contextTheme = useKifuTheme();
  const theme: MoveListTheme = props.theme || contextTheme.moveList;

  const { moves, currentPly, onPlyClick, className } = props;
  const listRef = useRef<HTMLDivElement>(null);
  const activeRef = useRef<HTMLDivElement>(null);

  // 現在手にスクロール
  useEffect(() => {
    if (activeRef.current && listRef.current) {
      const container = listRef.current;
      const active = activeRef.current;
      const containerRect = container.getBoundingClientRect();
      const activeRect = active.getBoundingClientRect();

      // アクティブ要素がコンテナの表示範囲外にある場合のみスクロール
      if (
        activeRect.top < containerRect.top ||
        activeRect.bottom > containerRect.bottom
      ) {
        active.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      }
    }
  }, [currentPly]);

  return (
    <div
      ref={listRef}
      className={className}
      role="list"
      aria-label="棋譜リスト"
      style={{
        background: theme.background,
        fontFamily: theme.fontFamily,
        fontSize: theme.fontSize,
        color: theme.textColor,
        overflowY: 'auto',
        maxHeight: 400,
        padding: '4px 0',
      }}
    >
      {/* 開始局面 */}
      <MoveItem
        key="start"
        ply={0}
        label="開始局面"
        comment={moves[0]?.comment || null}
        isActive={currentPly === 0}
        hasBranch={false}
        theme={theme}
        onClick={onPlyClick}
        activeRef={currentPly === 0 ? activeRef : undefined}
      />

      {/* 指し手一覧 */}
      {moves.slice(1).map((node, idx) => {
        const ply = idx + 1;
        const isActive = currentPly === ply;
        const hasBranch = node.branches && node.branches.length > 0;
        const label = node.move
          ? `${ply} ${node.move.displayText}`
          : `${ply} ...`;

        return (
          <MoveItem
            key={ply}
            ply={ply}
            label={label}
            comment={node.comment}
            isActive={isActive}
            hasBranch={hasBranch}
            theme={theme}
            onClick={onPlyClick}
            activeRef={isActive ? activeRef : undefined}
          />
        );
      })}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Sub-component: MoveItem
// ---------------------------------------------------------------------------

function MoveItem({
  ply,
  label,
  comment,
  isActive,
  hasBranch,
  theme,
  onClick,
  activeRef,
}: {
  ply: number;
  label: string;
  comment: string | null;
  isActive: boolean;
  hasBranch: boolean;
  theme: MoveListTheme;
  onClick?: (ply: number) => void;
  activeRef?: React.RefObject<HTMLDivElement | null>;
}) {
  return (
    <div
      ref={activeRef}
      role="listitem"
      onClick={() => onClick?.(ply)}
      style={{
        padding: '3px 12px',
        cursor: onClick ? 'pointer' : 'default',
        backgroundColor: isActive ? theme.highlightColor : 'transparent',
        color: isActive ? theme.highlightTextColor : theme.textColor,
        transition: 'background-color 0.12s',
        display: 'flex',
        alignItems: 'baseline',
        gap: 6,
        lineHeight: 1.6,
      }}
    >
      {/* 分岐インジケーター */}
      {hasBranch && (
        <span
          style={{
            color: theme.branchIndicatorColor,
            fontSize: theme.fontSize - 2,
            fontWeight: 'bold',
          }}
          title="分岐あり"
        >
          ⑂
        </span>
      )}

      {/* 指し手テキスト */}
      <span style={{ fontWeight: isActive ? 600 : 400 }}>{label}</span>

      {/* コメント */}
      {comment && (
        <span
          style={{
            color: theme.commentColor,
            fontSize: theme.fontSize - 2,
            marginLeft: 'auto',
            maxWidth: '50%',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
          title={comment}
        >
          {comment}
        </span>
      )}
    </div>
  );
}
