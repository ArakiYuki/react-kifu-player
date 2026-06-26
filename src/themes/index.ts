// =============================================================================
// Theme System - Extensible theme definitions
// =============================================================================
import type { KifuTheme, PartialKifuTheme } from '../types';
import React, { createContext, useContext } from 'react';

import { textTheme, richTheme } from './baseThemes';
export { textTheme, richTheme };

import { imageWoodTheme, imageDarkTheme, imageGlassTheme } from './imageThemes';
export { imageWoodTheme, imageDarkTheme, imageGlassTheme };

/** 組み込みテーマのレジストリ */
const builtInThemes: Record<string, KifuTheme> = {
  text: textTheme,
  rich: richTheme,
  imageWood: imageWoodTheme,
  imageDark: imageDarkTheme,
  imageGlass: imageGlassTheme,
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
  theme: 'rich' | 'text' | 'imageWood' | 'imageDark' | 'imageGlass' | KifuTheme | PartialKifuTheme | undefined
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
