// =============================================================================
// Hook: useShogiProblem
// 次の一手問題の出題・判定を管理するフック (v0.2.0)
// =============================================================================
import { useState, useCallback, useMemo, useEffect } from 'react';
import {
  Position as TsshogiPosition,
  Square as TsshogiSquare,
} from 'tsshogi';
import type {
  UseShogiProblemOptions,
  UseShogiProblemReturn,
  ProblemStatus,
  ProblemResult,
  BoardSquareCoord,
  SquareClick,
  Position,
  Color,
  PieceKind,
  HandPieces,
  Coordinate,
} from '../types';

// ---------------------------------------------------------------------------
// tsshogi Position ユーティリティ
// ---------------------------------------------------------------------------

/** SFEN文字列から tsshogi の Position を作成 */
function createTsshogiPosition(sfen: string): TsshogiPosition | null {
  try {
    const pos = new TsshogiPosition();
    pos.resetBySFEN(sfen);
    return pos;
  } catch {
    return null;
  }
}

/** tsshogi の Position を内部 Position 型に変換 */
function convertTsshogiPosition(tPos: TsshogiPosition): Position {
  const PIECE_TYPE_TO_KIND: Record<string, PieceKind> = {
    pawn: 'FU', lance: 'KY', knight: 'KE', silver: 'GI', gold: 'KI',
    bishop: 'KA', rook: 'HI', king: 'OU',
    promPawn: 'TO', promLance: 'NY', promKnight: 'NK',
    promSilver: 'NG', horse: 'UM', dragon: 'RY',
  };

  const board: (import('../types').BoardPiece | null)[][] = [];

  for (let rank = 1; rank <= 9; rank++) {
    const row: (import('../types').BoardPiece | null)[] = [];
    for (let file = 9; file >= 1; file--) {
      const piece = tPos.board.at(new TsshogiSquare(file, rank));
      if (piece) {
        const kind = PIECE_TYPE_TO_KIND[piece.type];
        row.push(kind ? { kind, color: piece.color === 'black' ? 'black' : 'white' } : null);
      } else {
        row.push(null);
      }
    }
    board.push(row);
  }

  const handPieceTypes: Array<[string, keyof HandPieces]> = [
    ['pawn', 'FU'], ['lance', 'KY'], ['knight', 'KE'],
    ['silver', 'GI'], ['gold', 'KI'], ['bishop', 'KA'], ['rook', 'HI'],
  ];

  const handBlack: HandPieces = {};
  const handWhite: HandPieces = {};

  for (const [tType, kind] of handPieceTypes) {
    const blackCount = tPos.blackHand.count(tType as import('tsshogi').PieceType);
    const whiteCount = tPos.whiteHand.count(tType as import('tsshogi').PieceType);
    if (blackCount > 0) handBlack[kind] = blackCount;
    if (whiteCount > 0) handWhite[kind] = whiteCount;
  }

  return {
    board,
    handBlack,
    handWhite,
    turn: tPos.color === 'black' ? 'black' : 'white',
  };
}

// ---------------------------------------------------------------------------
// USI変換ヘルパー
// ---------------------------------------------------------------------------

const RANK_TO_USI_CHAR = 'abcdefghi';

function coordToUSIPart(x: number, y: number): string {
  return `${x}${RANK_TO_USI_CHAR[y - 1]}`;
}

function buildUSIMove(from: BoardSquareCoord, to: BoardSquareCoord, promote: boolean): string {
  return `${coordToUSIPart(from.x, from.y)}${coordToUSIPart(to.x, to.y)}${promote ? '+' : ''}`;
}

function buildDropUSIMove(piece: PieceKind, target: BoardSquareCoord): string {
  const PIECE_TO_USI: Partial<Record<PieceKind, string>> = {
    FU: 'P', KY: 'L', KE: 'N', GI: 'S', KI: 'G', KA: 'B', HI: 'R',
  };
  const pieceChar = PIECE_TO_USI[piece] || 'P';
  return `${pieceChar}*${coordToUSIPart(target.x, target.y)}`;
}

function formatUSIToJapanese(usi: string, tsshogiPos: TsshogiPosition | null): string {
  if (!tsshogiPos) return usi;
  const move = tsshogiPos.createMoveByUSI(usi);
  if (!move) return usi;

  const FILE_NUMS = ['０', '１', '２', '３', '４', '５', '６', '７', '８', '９'];
  const RANK_KANJI = ['〇', '一', '二', '三', '四', '五', '六', '七', '八', '九'];
  
  const PIECE_NAMES: Record<string, string> = {
    pawn: '歩', lance: '香', knight: '桂', silver: '銀', gold: '金',
    bishop: '角', rook: '飛', king: '玉',
    promPawn: 'と', promLance: '成香', promKnight: '成桂',
    promSilver: '成銀', horse: '馬', dragon: '龍',
  };

  const toFile = move.to.file;
  const toRank = move.to.rank;
  const toStr = `${FILE_NUMS[toFile]}${RANK_KANJI[toRank]}`;

  // tsshogiのisDropプロパティがないのでtypeofで判定
  const isDrop = typeof move.from === 'string';
  const pieceTypeStr = isDrop ? move.from : move.pieceType;
  const pieceName = PIECE_NAMES[pieceTypeStr as string] || '?';

  if (isDrop) {
    return `${toStr}${pieceName}打`;
  }

  const promoteStr = move.promote ? '成' : '';
  return `${toStr}${pieceName}${promoteStr}`;
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

/**
 * 次の一手問題を管理するフック。
 *
 * @example
 * ```tsx
 * const problem = useShogiProblem({
 *   sfen: 'lnsgkgsnl/1r5b1/ppppppppp/9/9/9/PPPPPPPPP/1B5R1/LNSGKGSNL b - 1',
 *   playerColor: 'black',
 *   correctMoves: ['7g7f', '2g2f'],
 *   badMove: '8h7g',
 *   badMoveEval: -300,
 *   bestMoveEval: 200,
 * });
 *
 * return (
 *   <ShogiBoard
 *     position={problem.position}
 *     interactive={true}
 *     selectedSquare={problem.selectedSquare}
 *     highlightSquares={problem.legalMoveSquares}
 *     onSquareClick={problem.handleSquareClick}
 *   />
 * );
 * ```
 */
export function useShogiProblem(options: UseShogiProblemOptions): UseShogiProblemReturn {
  const { sfen, playerColor, correctMoves, correctMoveCandidates, badMove, badMoveEval, bestMoveEval } = options;

  const [currentSfen, setCurrentSfen] = useState(sfen);
  const [status, setStatus] = useState<ProblemStatus>('playing');
  const [selectedSquare, setSelectedSquare] = useState<BoardSquareCoord | null>(null);
  const [selectedHandPiece, setSelectedHandPiece] = useState<{ color: Color; piece: PieceKind } | null>(null);
  const [result, setResult] = useState<ProblemResult | null>(null);
  const [lastMove, setLastMove] = useState<{ from: Coordinate | null; to: Coordinate } | undefined>(undefined);

  // 再生用ステート
  const [playbackMoves, setPlaybackMoves] = useState<string[] | null>(null);
  const [playbackPly, setPlaybackPly] = useState<number>(0);

  // 成り判定用ステート
  const [promotionPending, setPromotionPending] = useState<{ from: BoardSquareCoord; to: BoardSquareCoord } | null>(null);

  // sfen が変わった時 (問題切り替え等) にリセットする
  useEffect(() => {
    setCurrentSfen(sfen);
    setStatus('playing');
    setSelectedSquare(null);
    setSelectedHandPiece(null);
    setResult(null);
    setLastMove(undefined);
    setPlaybackMoves(null);
    setPlaybackPly(0);
  }, [sfen]);

  // tsshogi の Position オブジェクト (合法手判定用)
  const tsshogiPos = useMemo(() => createTsshogiPosition(currentSfen), [currentSfen]);

  // 再生モード時の表示用 Position と lastMove
  const { displayTsshogiPos, displayLastMove } = useMemo(() => {
    if (playbackMoves !== null) {
      const pos = createTsshogiPosition(sfen); // 読み筋は問題出題時の sfen から
      if (!pos) return { displayTsshogiPos: tsshogiPos, displayLastMove: lastMove };
      
      let m = null;
      for (let i = 0; i < playbackPly; i++) {
        m = pos.createMoveByUSI(playbackMoves[i]);
        if (m) pos.doMove(m);
      }
      
      let pmove = undefined;
      if (m) {
        const fromCoord = typeof m.from === 'string' ? null : { x: m.from.file, y: m.from.rank };
        pmove = { from: fromCoord, to: { x: m.to.file, y: m.to.rank } };
      }
      return { displayTsshogiPos: pos, displayLastMove: pmove };
    }
    return { displayTsshogiPos: tsshogiPos, displayLastMove: lastMove };
  }, [playbackMoves, playbackPly, sfen, tsshogiPos, lastMove]);

  // 内部 Position (ShogiBoard への表示用)
  const position = useMemo<Position>(() => {
    if (!displayTsshogiPos) {
      return {
        board: Array.from({ length: 9 }, () => Array(9).fill(null)),
        handBlack: {},
        handWhite: {},
        turn: playerColor,
      };
    }
    return convertTsshogiPosition(displayTsshogiPos);
  }, [displayTsshogiPos, playerColor]);

  // 選択中の駒の合法手マス一覧
  const legalMoveSquares = useMemo<BoardSquareCoord[]>(() => {
    if (!tsshogiPos || status !== 'playing' || playbackMoves !== null || promotionPending !== null) return [];

    const legalSquares: BoardSquareCoord[] = [];

    if (selectedSquare) {
      const fromSq = new TsshogiSquare(selectedSquare.x, selectedSquare.y);
      for (let toFile = 1; toFile <= 9; toFile++) {
        for (let toRank = 1; toRank <= 9; toRank++) {
          const moveUSI = buildUSIMove(selectedSquare, { x: toFile, y: toRank }, false);
          const promoteMoveUSI = buildUSIMove(selectedSquare, { x: toFile, y: toRank }, true);
          const move = tsshogiPos.createMoveByUSI(moveUSI);
          const promoteMove = tsshogiPos.createMoveByUSI(promoteMoveUSI);
          
          if ((move && tsshogiPos.isValidMove(move)) || (promoteMove && tsshogiPos.isValidMove(promoteMove))) {
            legalSquares.push({ x: toFile, y: toRank });
          }
        }
      }
    } else if (selectedHandPiece) {
      for (let toFile = 1; toFile <= 9; toFile++) {
        for (let toRank = 1; toRank <= 9; toRank++) {
          const usiMove = buildDropUSIMove(selectedHandPiece.piece, { x: toFile, y: toRank });
          const m = tsshogiPos.createMoveByUSI(usiMove);
          if (m && tsshogiPos.isValidMove(m)) {
            legalSquares.push({ x: toFile, y: toRank });
          }
        }
      }
    }

    return legalSquares;
  }, [tsshogiPos, selectedSquare, selectedHandPiece, status, playbackMoves]);

  // 合法手判定と正誤判定
  const judgeMove = useCallback((usiMove: string) => {
    if (!tsshogiPos) return;

    const move = tsshogiPos.createMoveByUSI(usiMove);
    if (!move || !tsshogiPos.isValidMove(move)) {
      // 非合法手は無視
      setSelectedSquare(null);
      setSelectedHandPiece(null);
      return;
    }

    // USI形式を正規化して比較（+ を除外しない！）
    const normalize = (m: string) => m.toLowerCase();
    const normalizedUser = normalize(usiMove);
    const isCorrect = correctMoves.some(cm => normalize(cm) === normalizedUser);

    // 盤面が更新される前に日本語表記を作成
    const userMoveText = formatUSIToJapanese(usiMove, tsshogiPos);
    const badMoveText = badMove !== undefined ? formatUSIToJapanese(badMove, tsshogiPos) : undefined;
    const correctMovesText = correctMoves.map(m => formatUSIToJapanese(m, tsshogiPos));

    // 盤面を更新
    tsshogiPos.doMove(move);
    // 確実に有効なSFENをセットするために try-catch で保護（念のため）
    try {
      const nextSfen = tsshogiPos.getSFEN(1);
      setCurrentSfen(nextSfen);
    } catch (e) {
      console.error('Failed to get next SFEN', e);
    }
    const fromCoord = typeof move.from === 'string' ? null : { x: move.from.file, y: move.from.rank };
    setLastMove({ from: fromCoord, to: { x: move.to.file, y: move.to.rank } });

    setStatus(isCorrect ? 'correct' : 'incorrect');
    setSelectedSquare(null);
    setSelectedHandPiece(null);

    if (badMove !== undefined && badMoveText !== undefined) {
      const improvement = isCorrect && bestMoveEval !== undefined && badMoveEval !== undefined
        ? Math.abs(bestMoveEval - badMoveEval)
        : undefined;
      setResult({
        userMove: usiMove,
        userMoveText,
        badMove,
        badMoveText,
        correctMoves,
        correctMovesText,
        correctMoveCandidates,
        badMoveEval,
        bestMoveEval,
        evalImprovement: improvement,
      });
    }
  }, [tsshogiPos, correctMoves, badMove, badMoveEval, bestMoveEval]);

  // マスクリックハンドラ
  const handleSquareClick = useCallback((sq: SquareClick) => {
    if (status !== 'playing' || playbackMoves !== null || promotionPending !== null) return;

    // 持ち駒クリック
    if ('type' in sq && sq.type === 'hand') {
      if (sq.color !== playerColor) return;
      setSelectedSquare(null);
      setSelectedHandPiece({ color: sq.color, piece: sq.piece });
      return;
    }

    const target = sq as BoardSquareCoord;

    // 持ち駒が選択中 → 駒打ち
    if (selectedHandPiece) {
      const usiMove = buildDropUSIMove(selectedHandPiece.piece, target);
      judgeMove(usiMove);
      return;
    }

    // 盤上の駒が選択中 → 移動先を指定
    if (selectedSquare) {
      if (selectedSquare.x === target.x && selectedSquare.y === target.y) {
        setSelectedSquare(null);
        return;
      }

      if (!tsshogiPos) return;

      // 成り判定: 敵陣に入る or 敵陣から出る場合
      const isEnemyZone = (rank: number, color: Color) =>
        (color === 'black' && rank <= 3) || (color === 'white' && rank >= 7);
      const needsPromoteCheck =
        isEnemyZone(target.y, playerColor) || isEnemyZone(selectedSquare.y, playerColor);

      let usiMove: string;
      if (needsPromoteCheck) {
        const promoteMoveUSI = buildUSIMove(selectedSquare, target, true);
        const noPromoteMoveUSI = buildUSIMove(selectedSquare, target, false);
        const promoteMove = tsshogiPos.createMoveByUSI(promoteMoveUSI);
        const noPromoteMove = tsshogiPos.createMoveByUSI(noPromoteMoveUSI);
        const canPromote = promoteMove && tsshogiPos.isValidMove(promoteMove);
        const canNoPromote = noPromoteMove && tsshogiPos.isValidMove(noPromoteMove);

        if (canPromote && canNoPromote) {
          // 成り・不成りの両方が可能な場合はダイアログで選択させる
          setPromotionPending({ from: selectedSquare, to: target });
          return;
        } else if (canPromote && !canNoPromote) {
          usiMove = promoteMoveUSI;
        } else {
          usiMove = noPromoteMoveUSI;
        }
      } else {
        usiMove = buildUSIMove(selectedSquare, target, false);
      }

      judgeMove(usiMove);
      return;
    }

    // 何も選択されていない → 駒の選択
    const boardPiece = tsshogiPos?.board.at(new TsshogiSquare(target.x, target.y));
    if (!boardPiece || boardPiece.color !== playerColor) return;
    setSelectedSquare(target);
    setSelectedHandPiece(null);
  }, [status, playerColor, selectedSquare, selectedHandPiece, tsshogiPos, judgeMove]);

  const reset = useCallback(() => {
    setStatus('playing');
    setSelectedSquare(null);
    setSelectedHandPiece(null);
    setResult(null);
    setCurrentSfen(sfen);
    setLastMove(undefined);
    setPlaybackMoves(null);
    setPlaybackPly(0);
    setPromotionPending(null);
  }, [sfen]);

  // 成り判定コントロール
  const resolvePromotion = useCallback((promote: boolean) => {
    if (!promotionPending) return;
    const usiMove = buildUSIMove(promotionPending.from, promotionPending.to, promote);
    setPromotionPending(null);
    judgeMove(usiMove);
  }, [promotionPending, judgeMove]);

  // 再生コントロール
  const startPlayback = useCallback((candidate: import('../types').Candidate) => {
    // readMoves は USI 形式のスペース区切り文字列として格納されている想定
    // (extractProblemsFromKifu で KIF→USI 変換済み)
    const usis = candidate.readMoves.trim().split(/\s+/).filter(Boolean);
    if (usis.length > 0) {
      setPlaybackMoves(usis);
      setPlaybackPly(0);
    }
  }, []);

  const stopPlayback = useCallback(() => {
    setPlaybackMoves(null);
    setPlaybackPly(0);
  }, []);

  const forwardPlayback = useCallback(() => {
    setPlaybackPly(p => playbackMoves ? Math.min(p + 1, playbackMoves.length) : p);
  }, [playbackMoves]);

  const backwardPlayback = useCallback(() => {
    setPlaybackPly(p => Math.max(0, p - 1));
  }, []);

  return {
    position,
    lastMove: displayLastMove,
    status,
    selectedSquare,
    legalMoveSquares,
    handleSquareClick,
    result,
    reset,
    playbackState: playbackMoves ? { currentPly: playbackPly, totalPlies: playbackMoves.length } : null,
    startPlayback,
    stopPlayback,
    forwardPlayback,
    backwardPlayback,
    promotionPending,
    resolvePromotion,
  };
}
