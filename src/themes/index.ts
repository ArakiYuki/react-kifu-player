// =============================================================================
// Theme System - Extensible theme definitions
// =============================================================================
import type { KifuTheme, PartialKifuTheme } from '../types';
import React, { createContext, useContext } from 'react';

// ---------------------------------------------------------------------------
// Built-in Themes
// ---------------------------------------------------------------------------

/** テキストテーマ (シンプル・白黒ベース) */
export const textTheme: KifuTheme = {
  name: 'text',
  board: {
    background: '#f5f0e6',
    gridColor: '#1a1a1a',
    gridWidth: 1,
    starPointColor: '#1a1a1a',
    starPointSize: 3,
    highlightColor: 'rgba(255, 200, 50, 0.4)',
    borderColor: '#333333',
    borderWidth: 2,
    labelColor: '#555555',
    labelFontSize: 11,
    showLabels: true,
  },
  piece: {
    mode: 'text',
    fontFamily: '"Noto Serif JP", "Yu Mincho", "HGS明朝E", serif',
    fontScale: 0.65,
    senteColor: '#1a1a1a',
    goteColor: '#1a1a1a',
    senteBackground: 'transparent',
    goteBackground: 'transparent',
    borderRadius: 0,
    shadow: 'none',
  },
  hand: {
    background: '#f5f0e6',
    textColor: '#1a1a1a',
    fontSize: 13,
    borderColor: '#cccccc',
  },
  moveList: {
    background: '#ffffff',
    textColor: '#333333',
    highlightColor: '#e6f0ff',
    highlightTextColor: '#1a5ccf',
    commentColor: '#667788',
    branchIndicatorColor: '#cc8800',
    fontSize: 13,
    fontFamily: '"Noto Sans JP", "Yu Gothic", sans-serif',
  },
  evalGraph: {
    backgroundColor: '#ffffff',
    lineColor: '#6366f1',
    branchLineColor: '#f59e0b',
    gridColor: '#e5e7eb',
    dotColor: '#3b82f6',
    currentLineColor: '#3b82f6',
    zeroLineColor: '#9ca3af',
    fontSize: 11,
    fontFamily: 'system-ui, sans-serif',
  },
  controlBar: {
    backgroundColor: 'transparent',
    buttonColor: '#555555',
    buttonHoverColor: '#333333',
    buttonActiveColor: '#1a5ccf',
    buttonSize: 36,
    gap: 8,
  },
};

/** リッチテーマ (木目風・高級感) */
export const richTheme: KifuTheme = {
  name: 'rich',
  board: {
    background: 'linear-gradient(135deg, #deb887 0%, #d2a56c 25%, #c49a5f 50%, #d4a862 75%, #e0be82 100%)',
    gridColor: '#2a1f0e',
    gridWidth: 1.2,
    starPointColor: '#2a1f0e',
    starPointSize: 3.5,
    highlightColor: 'rgba(255, 140, 0, 0.35)',
    borderColor: '#3d2b1f',
    borderWidth: 3,
    labelColor: '#3d2b1f',
    labelFontSize: 12,
    showLabels: true,
  },
  piece: {
    mode: 'text',
    fontFamily: '"Noto Serif JP", "Yu Mincho", "HGS明朝E", serif',
    fontScale: 0.6,
    senteColor: '#1a0a00',
    goteColor: '#1a0a00',
    senteBackground: 'linear-gradient(180deg, #f5e6c8 0%, #e8d5a8 50%, #d4c490 100%)',
    goteBackground: 'linear-gradient(180deg, #f5e6c8 0%, #e8d5a8 50%, #d4c490 100%)',
    borderRadius: 3,
    shadow: '0 1px 3px rgba(0,0,0,0.25)',
  },
  hand: {
    background: 'linear-gradient(135deg, #c4a265 0%, #b89555 50%, #c4a265 100%)',
    textColor: '#2a1f0e',
    fontSize: 14,
    borderColor: '#8b7340',
  },
  moveList: {
    background: '#faf6ee',
    textColor: '#2a1f0e',
    highlightColor: '#f0e0c0',
    highlightTextColor: '#8b4513',
    commentColor: '#6b7a5a',
    branchIndicatorColor: '#cc6600',
    fontSize: 14,
    fontFamily: '"Noto Serif JP", "Yu Mincho", serif',
  },
  evalGraph: {
    backgroundColor: '#faf6ee',
    lineColor: '#8b4513',
    branchLineColor: '#cc8800',
    gridColor: '#e0d5c0',
    dotColor: '#d2691e',
    currentLineColor: '#cd853f',
    zeroLineColor: '#b0a090',
    fontSize: 11,
    fontFamily: '"Noto Sans JP", system-ui, sans-serif',
  },
  controlBar: {
    backgroundColor: 'transparent',
    buttonColor: '#8b7340',
    buttonHoverColor: '#6b5630',
    buttonActiveColor: '#8b4513',
    buttonSize: 40,
    gap: 10,
  },
};

/** 組み込みテーマのレジストリ */
const builtInThemes: Record<string, KifuTheme> = {
  text: textTheme,
  rich: richTheme,
};

// ---------------------------------------------------------------------------
// Theme Registry (拡張用)
// ---------------------------------------------------------------------------

const customThemes: Record<string, KifuTheme> = {};

/** カスタムテーマを登録する */
export function registerTheme(name: string, theme: KifuTheme): void {
  customThemes[name] = { ...theme, name };
}

/** テーマを名前で取得する */
export function getTheme(name: string): KifuTheme {
  return customThemes[name] || builtInThemes[name] || textTheme;
}

/** 登録済みテーマ名の一覧を取得 */
export function getThemeNames(): string[] {
  return [...Object.keys(builtInThemes), ...Object.keys(customThemes)];
}

// ---------------------------------------------------------------------------
// Theme Merging (パーシャルテーマのマージ)
// ---------------------------------------------------------------------------

/** ベーステーマにパーシャルテーマをマージする */
export function mergeTheme(base: KifuTheme, partial: PartialKifuTheme): KifuTheme {
  return {
    name: partial.name || base.name,
    board: { ...base.board, ...(partial.board || {}) },
    piece: { ...base.piece, ...(partial.piece || {}) },
    hand: { ...base.hand, ...(partial.hand || {}) },
    moveList: { ...base.moveList, ...(partial.moveList || {}) },
    evalGraph: { ...base.evalGraph, ...(partial.evalGraph || {}) },
    controlBar: { ...base.controlBar, ...(partial.controlBar || {}) },
  };
}

/** テーマプロパティを解決する (文字列名 or オブジェクト -> KifuTheme) */
export function resolveTheme(
  theme: 'rich' | 'text' | KifuTheme | PartialKifuTheme | undefined
): KifuTheme {
  if (!theme) return textTheme;

  if (typeof theme === 'string') {
    return getTheme(theme);
  }

  // Full KifuTheme check
  if ('name' in theme && 'board' in theme && 'piece' in theme) {
    // Check if it's a complete theme or partial
    const t = theme as KifuTheme;
    if (t.board && 'background' in t.board && t.piece && 'mode' in t.piece) {
      return t;
    }
  }

  // Partial theme - merge with text theme as base
  return mergeTheme(textTheme, theme as PartialKifuTheme);
}

// ---------------------------------------------------------------------------
// Theme Context (React)
// ---------------------------------------------------------------------------

const ThemeContext = createContext<KifuTheme>(textTheme);

/** テーマコンテキストProvider */
export const ThemeProvider = ThemeContext.Provider;

/** テーマを取得するhook */
export function useKifuTheme(): KifuTheme {
  return useContext(ThemeContext);
}

export { ThemeContext };
