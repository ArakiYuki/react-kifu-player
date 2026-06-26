// =============================================================================
// Hook: useKeyboardNav - Keyboard navigation for kifu playback
// =============================================================================
import { useEffect, useCallback, type RefObject } from 'react';

export type UseKeyboardNavOptions = {
  /** 1手進むコールバック */
  onForward: () => void;
  /** 1手戻るコールバック */
  onBackward: () => void;
  /** 開始局面へのコールバック */
  onGoToStart: () => void;
  /** 最終局面へのコールバック */
  onGoToEnd: () => void;
  /** キーボード操作を有効にするか */
  enabled?: boolean;
  /** フォーカス対象のRef (指定しない場合はwindow全体) */
  containerRef?: RefObject<HTMLElement | null>;
};

/**
 * キーボードナビゲーション hook
 *
 * - ← (ArrowLeft): 1手戻る
 * - → (ArrowRight): 1手進む
 * - Home: 開始局面へ
 * - End: 最終局面へ
 */
export function useKeyboardNav(options: UseKeyboardNavOptions): void {
  const {
    onForward,
    onBackward,
    onGoToStart,
    onGoToEnd,
    enabled = true,
    containerRef,
  } = options;

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      // Input/Textareaにフォーカスがある場合は無視
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
        return;
      }

      switch (e.key) {
        case 'ArrowRight':
          e.preventDefault();
          onForward();
          break;
        case 'ArrowLeft':
          e.preventDefault();
          onBackward();
          break;
        case 'Home':
          e.preventDefault();
          onGoToStart();
          break;
        case 'End':
          e.preventDefault();
          onGoToEnd();
          break;
      }
    },
    [onForward, onBackward, onGoToStart, onGoToEnd]
  );

  useEffect(() => {
    if (!enabled) return;

    const target = containerRef?.current || window;
    target.addEventListener('keydown', handleKeyDown as EventListener);

    return () => {
      target.removeEventListener('keydown', handleKeyDown as EventListener);
    };
  }, [enabled, handleKeyDown, containerRef]);
}
