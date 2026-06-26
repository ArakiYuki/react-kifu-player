// =============================================================================
// Hook: useKifuPlayer - Main integration hook
// =============================================================================
import { useState, useCallback, useMemo, useEffect } from 'react';
import { parseKifu } from '../core/parser';
import {
  createInitialState,
  forward as forwardState,
  backward as backwardState,
  goToStart as goToStartState,
  goToEnd as goToEndState,
  goTo as goToState,
  type GameState,
} from '../core/game-state';
import type {
  GameRecord,
  Position,
  Move,
  MoveNode,
  GameHeader,
  EvaluationPoint,
  Candidate,
  CandidatesMap,
  Coordinate,
} from '../types';

/** useKifuPlayer のオプション */
export type UseKifuPlayerOptions = {
  /** 初期手数 */
  initialPly?: number;
  /** 外部からの評価値データ */
  evaluations?: EvaluationPoint[];
  /** 外部からの候補手データ */
  candidates?: CandidatesMap;
  /** 手数変更コールバック */
  onPlyChange?: (ply: number) => void;
};

/** useKifuPlayer の戻り値 */
export type UseKifuPlayerReturn = {
  // --- 盤面状態 ---
  /** 現在の局面 */
  position: Position;
  /** 現在の手数 */
  currentPly: number;
  /** 総手数 */
  totalPlies: number;
  /** 現在の指し手 */
  currentMove: Move | null;
  /** 最終手の座標 (ハイライト用) */
  lastMoveCoords: { from: Coordinate | null; to: Coordinate } | null;

  // --- 操作 ---
  /** 1手進む */
  forward: () => void;
  /** 1手戻る */
  backward: () => void;
  /** 指定手数へジャンプ */
  goto: (ply: number) => void;
  /** 開始局面へ */
  goToStart: () => void;
  /** 最終局面へ */
  goToEnd: () => void;

  // --- 棋譜情報 ---
  /** パース済み棋譜全体 */
  record: GameRecord | null;
  /** 棋譜ヘッダー */
  header: GameHeader | null;
  /** 指し手ノード配列 */
  moves: MoveNode[];
  /** 現在手のコメント */
  currentComment: string | null;

  // --- 評価値 ---
  /** 評価値データ配列 */
  evaluations: EvaluationPoint[];
  /** 現在手の評価値 */
  currentEval: EvaluationPoint | null;

  // --- 候補手 ---
  /** 現在局面の候補手 */
  candidates: Candidate[];

  // --- 分岐 ---
  /** 分岐上にいるかどうか */
  isOnBranch: boolean;

  // --- エラー ---
  /** パースエラー */
  error: string | null;
};

/** 棋譜再生のメインhook */
export function useKifuPlayer(
  kifuString: string | null | undefined,
  options: UseKifuPlayerOptions = {}
): UseKifuPlayerReturn {
  const { initialPly = 0, evaluations: externalEvals, candidates: externalCandidates, onPlyChange } = options;

  // --- パース ---
  const { record, error } = useMemo(() => {
    if (!kifuString) {
      return { record: null, error: null };
    }
    try {
      const parsed = parseKifu(kifuString);
      return { record: parsed, error: null };
    } catch (e) {
      return { record: null, error: e instanceof Error ? e.message : String(e) };
    }
  }, [kifuString]);

  // --- 状態管理 ---
  const [state, setState] = useState<GameState>(() => {
    if (!record) {
      return {
        currentPly: 0,
        position: createEmptyPosition(),
        currentMove: null,
        currentComment: null,
        lastMoveCoords: null,
        totalPlies: 0,
        branchInfo: { isOnBranch: false, branchIndex: null, sourcePly: null },
      };
    }
    const initial = createInitialState(record);
    if (initialPly > 0) {
      return goToState(record, initialPly);
    }
    return initial;
  });

  // レコードが変わったら状態をリセット
  useEffect(() => {
    if (record) {
      const initial = initialPly > 0
        ? goToState(record, initialPly)
        : createInitialState(record);
      setState(initial);
    }
  }, [record, initialPly]);

  // --- 操作 ---
  const forward = useCallback(() => {
    if (!record) return;
    setState(prev => {
      const next = forwardState(record, prev);
      if (next !== prev && onPlyChange) {
        onPlyChange(next.currentPly);
      }
      return next;
    });
  }, [record, onPlyChange]);

  const backward = useCallback(() => {
    if (!record) return;
    setState(prev => {
      const next = backwardState(record, prev);
      if (next !== prev && onPlyChange) {
        onPlyChange(next.currentPly);
      }
      return next;
    });
  }, [record, onPlyChange]);

  const goto = useCallback((ply: number) => {
    if (!record) return;
    setState(() => {
      const next = goToState(record, ply);
      if (onPlyChange) {
        onPlyChange(next.currentPly);
      }
      return next;
    });
  }, [record, onPlyChange]);

  const goToStart = useCallback(() => {
    if (!record) return;
    setState(() => {
      const next = goToStartState(record);
      if (onPlyChange) {
        onPlyChange(next.currentPly);
      }
      return next;
    });
  }, [record, onPlyChange]);

  const goToEnd = useCallback(() => {
    if (!record) return;
    setState(() => {
      const next = goToEndState(record);
      if (onPlyChange) {
        onPlyChange(next.currentPly);
      }
      return next;
    });
  }, [record, onPlyChange]);

  // --- 評価値 ---
  const evaluations = externalEvals || [];
  const currentEval = useMemo(() => {
    return evaluations.find(e => e.ply === state.currentPly) || null;
  }, [evaluations, state.currentPly]);

  // --- 候補手 ---
  const candidates = useMemo(() => {
    if (!externalCandidates) return [];
    return externalCandidates.get(state.currentPly) || [];
  }, [externalCandidates, state.currentPly]);

  return {
    // 盤面状態
    position: state.position,
    currentPly: state.currentPly,
    totalPlies: state.totalPlies,
    currentMove: state.currentMove,
    lastMoveCoords: state.lastMoveCoords,

    // 操作
    forward,
    backward,
    goto,
    goToStart,
    goToEnd,

    // 棋譜情報
    record,
    header: record?.header || null,
    moves: record?.moves || [],
    currentComment: state.currentComment,

    // 評価値
    evaluations,
    currentEval,

    // 候補手
    candidates,

    // 分岐
    isOnBranch: state.branchInfo.isOnBranch,

    // エラー
    error,
  };
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** 空の局面を生成 (棋譜がない場合の初期値) */
function createEmptyPosition(): Position {
  return {
    board: Array.from({ length: 9 }, () =>
      Array.from({ length: 9 }, () => null)
    ),
    handBlack: {},
    handWhite: {},
    turn: 'black',
  };
}
