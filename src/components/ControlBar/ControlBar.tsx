// =============================================================================
// Component: ControlBar - Playback controls
// =============================================================================
import React from 'react';
import type { ControlBarProps, ControlBarTheme } from '../../types';
import { useKifuTheme } from '../../themes';

/** SVGアイコン: 最初へ */
function IconGoToStart({ size, color }: { size: number; color: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path d="M6 6v12" stroke={color} strokeWidth="2.5" strokeLinecap="round" />
      <path d="M18 18L10 12l8-6v12z" fill={color} />
    </svg>
  );
}

/** SVGアイコン: 1手戻る */
function IconBackward({ size, color }: { size: number; color: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path d="M19 18L9 12l10-6v12z" fill={color} />
    </svg>
  );
}

/** SVGアイコン: 1手進む */
function IconForward({ size, color }: { size: number; color: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path d="M5 6l10 6-10 6V6z" fill={color} />
    </svg>
  );
}

/** SVGアイコン: 最後へ */
function IconGoToEnd({ size, color }: { size: number; color: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <path d="M6 6l8 6-8 6V6z" fill={color} />
      <path d="M18 6v12" stroke={color} strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  );
}

/** 操作ボタンコンポーネント */
export function ControlBar(props: ControlBarProps) {
  const contextTheme = useKifuTheme();
  const theme: ControlBarTheme = props.theme || contextTheme.controlBar;

  const {
    onBackward,
    onForward,
    onGoToStart,
    onGoToEnd,
    currentPly,
    totalPlies,
    className,
  } = props;

  const isAtStart = currentPly === 0;
  const isAtEnd = currentPly >= totalPlies;

  const buttonStyle: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: theme.buttonSize,
    height: theme.buttonSize,
    border: 'none',
    background: 'transparent',
    cursor: 'pointer',
    borderRadius: 6,
    transition: 'background-color 0.15s, opacity 0.15s',
    padding: 0,
  };

  const disabledStyle: React.CSSProperties = {
    ...buttonStyle,
    opacity: 0.3,
    cursor: 'default',
  };

  return (
    <div
      className={className}
      role="toolbar"
      aria-label="棋譜操作"
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: theme.gap,
        backgroundColor: theme.backgroundColor,
        padding: '4px 8px',
      }}
    >
      <button
        type="button"
        onClick={onGoToStart}
        disabled={isAtStart}
        style={isAtStart ? disabledStyle : buttonStyle}
        aria-label="開始局面へ"
        title="開始局面へ (Home)"
      >
        <IconGoToStart
          size={theme.buttonSize * 0.55}
          color={isAtStart ? theme.buttonColor : theme.buttonColor}
        />
      </button>

      <button
        type="button"
        onClick={onBackward}
        disabled={isAtStart}
        style={isAtStart ? disabledStyle : buttonStyle}
        aria-label="1手戻る"
        title="1手戻る (←)"
      >
        <IconBackward
          size={theme.buttonSize * 0.55}
          color={theme.buttonColor}
        />
      </button>

      {/* 手数表示 */}
      <span
        style={{
          fontSize: 13,
          fontFamily: 'system-ui, sans-serif',
          color: theme.buttonColor,
          minWidth: 60,
          textAlign: 'center',
          fontVariantNumeric: 'tabular-nums',
        }}
      >
        {currentPly} / {totalPlies}
      </span>

      <button
        type="button"
        onClick={onForward}
        disabled={isAtEnd}
        style={isAtEnd ? disabledStyle : buttonStyle}
        aria-label="1手進む"
        title="1手進む (→)"
      >
        <IconForward
          size={theme.buttonSize * 0.55}
          color={theme.buttonColor}
        />
      </button>

      <button
        type="button"
        onClick={onGoToEnd}
        disabled={isAtEnd}
        style={isAtEnd ? disabledStyle : buttonStyle}
        aria-label="最終局面へ"
        title="最終局面へ (End)"
      >
        <IconGoToEnd
          size={theme.buttonSize * 0.55}
          color={theme.buttonColor}
        />
      </button>
    </div>
  );
}
