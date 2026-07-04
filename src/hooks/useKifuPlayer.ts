// =============================================================================
// Hook: useKifuPlayer - Main integration hook
import { useState, useCallback, useMemo, useEffect } from 'react';
import { parseKifu, extractEngineDataFromRecord, parseVariationMoves } from '../core/parser';
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
  /** 候補手などの指し手文字列をパースして一時的な分岐として再生する */
  playVariation: (movesStr: string, candidateScore?: number) => void;
  /** 一時的な分岐再生から本譜に戻る */
  returnToMainLine: () => void;

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
  /** 分岐再生時の評価値（分岐元の手数 + 分岐先の評価値）*/
  variationEval: EvaluationPoint | null;

  // --- 候補手 ---
  /** 現在局面の候補手 */
  candidates: Candidate[];

  // --- 分岐 ---
  /** 分岐上にいるかどうか */
  isOnBranch: boolean;
  /** 分岐元の手数 */
  branchSourcePly: number | null;

  // --- エラー ---
  /** パースエラー */
  error: string | null;
};

/** 棋譜再生のメインhook */
export function useKifuPlayer(
  kifuString: string | null | undefined,
  options: UseKifuPlayerOptions = {}
): UseKifuPlayerReturn {
  const { initialPly = 0, onPlyChange } = options;

  // --- パース ---
  const { record, extractedEvals, extractedCandidates, error } = useMemo(() => {
    if (!kifuString) {
      return { record: null, extractedEvals: [], extractedCandidates: new Map(), error: null };
    }
    try {
      const parsed = parseKifu(kifuString);
      const engineData = extractEngineDataFromRecord(parsed);
      return { 
        record: parsed, 
        extractedEvals: engineData.evaluations, 
        extractedCandidates: engineData.candidates, 
        error: null 
      };
    } catch (e) {
      return { record: null, extractedEvals: [], extractedCandidates: new Map(), error: e instanceof Error ? e.message : String(e) };
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
  // 抽出したデータ
  const evaluations = extractedEvals;
  const currentEval = useMemo(() => {
    return evaluations.find(e => e.ply === state.currentPly) || null;
  }, [evaluations, state.currentPly]);

  // --- 候補手 ---
  const candidates = useMemo(() => {
    return extractedCandidates.get(state.currentPly) || [];
  }, [extractedCandidates, state.currentPly]);

  // 注意: forward/backward が record (本譜) 依存のため、分岐再生中は forward/backward で
  // 本譜の手に戻ってしまう問題を防ぐため、playVariation 用の一時レコード状態が必要です。
  // そのため、activeRecord を状態として持ちます。
  const [activeRecord, setActiveRecord] = useState<GameRecord | null>(null);

  useEffect(() => {
    setActiveRecord(record);
  }, [record]);

  // 上書き: forward, backward 等は activeRecord を使う
  // 分岐再生中は branchInfo を保持する
  const forwardActive = useCallback(() => {
    const r = activeRecord || record;
    if (!r) return;
    setState(prev => {
      const next = forwardState(r, prev);
      if (next !== prev) {
        // 分岐情報を保持
        if (prev.branchInfo.isOnBranch) {
          next.branchInfo = prev.branchInfo;
        }
        if (onPlyChange) onPlyChange(next.currentPly);
      }
      return next;
    });
  }, [activeRecord, record, onPlyChange]);

  const backwardActive = useCallback(() => {
    const r = activeRecord || record;
    if (!r) return;
    setState(prev => {
      const next = backwardState(r, prev);
      if (next !== prev) {
        // 分岐情報を保持
        if (prev.branchInfo.isOnBranch) {
          next.branchInfo = prev.branchInfo;
        }
        if (onPlyChange) onPlyChange(next.currentPly);
      }
      return next;
    });
  }, [activeRecord, record, onPlyChange]);

  const gotoActive = useCallback((ply: number) => {
    const r = activeRecord || record;
    if (!r) return;
    setState(prev => {
      const next = goToState(r, ply);
      // 分岐情報を保持
      if (prev.branchInfo.isOnBranch) {
        next.branchInfo = prev.branchInfo;
      }
      if (onPlyChange) onPlyChange(next.currentPly);
      return next;
    });
  }, [activeRecord, record, onPlyChange]);

  // 分岐再生時に選択された候補手の評価値を保持する
  const [variationScore, setVariationScore] = useState<{ sourcePly: number; score: number } | null>(null);

  const playVariation = useCallback((movesStr: string, candidateScore?: number) => {
    if (!kifuString || !record) return;
    const sourcePly = state.currentPly;
    const variationNodes = parseVariationMoves(kifuString, sourcePly, movesStr);
    if (variationNodes.length === 0) return;

    const tempRecord: GameRecord = {
      ...record,
      moves: [
        ...record.moves.slice(0, sourcePly + 1),
        ...variationNodes,
      ],
    };

    setActiveRecord(tempRecord);

    // 候補手の評価値を保存
    if (candidateScore !== undefined) {
      setVariationScore({ sourcePly, score: candidateScore });
    }

    setState(() => {
      const next = goToState(tempRecord, sourcePly + 1);
      next.branchInfo = {
        isOnBranch: true,
        branchIndex: 0,
        sourcePly,
      };
      if (onPlyChange) onPlyChange(next.currentPly);
      return next;
    });
  }, [kifuString, record, state.currentPly, onPlyChange]);

  const returnToMainLine = useCallback(() => {
    if (!record) return;
    setActiveRecord(record);
    setVariationScore(null);
    setState(prev => {
      if (!prev.branchInfo.isOnBranch || prev.branchInfo.sourcePly === null) return prev;
      const sourcePly = prev.branchInfo.sourcePly;
      const next = goToState(record, sourcePly);
      if (onPlyChange) {
        onPlyChange(next.currentPly);
      }
      return next;
    });
  }, [record, onPlyChange]);

  return {
    // 盤面状態
    position: state.position,
    currentPly: state.currentPly,
    totalPlies: state.totalPlies,
    currentMove: state.currentMove,
    lastMoveCoords: state.lastMoveCoords,

    // 操作
    forward: forwardActive,
    backward: backwardActive,
    goto: gotoActive,
    goToStart,
    goToEnd,
    playVariation,
    returnToMainLine,

    // 棋譜情報
    record: activeRecord || record,
    header: record?.header || null,
    moves: (activeRecord || record)?.moves || [],
    currentComment: state.currentComment,

    // 評価値
    evaluations,
    currentEval,
    variationEval: variationScore ? {
      ply: variationScore.sourcePly,
      score: variationScore.score,
      mate: null,
    } : null,

    // 候補手
    candidates,

    // 分岐
    isOnBranch: state.branchInfo.isOnBranch,
    branchSourcePly: state.branchInfo.sourcePly,

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
