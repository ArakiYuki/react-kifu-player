// =============================================================================
// Core: Game State Manager
// =============================================================================
import type { GameRecord, Position, MoveNode, Move, Coordinate, Board, HandPieces, BoardPiece, PieceKind, Color } from '../types';

/** ゲーム状態 */
export type GameState = {
  /** 現在の手数 */
  currentPly: number;
  /** 現在の局面 */
  position: Position;
  /** 現在の指し手 */
  currentMove: Move | null;
  /** 現在のコメント */
  currentComment: string | null;
  /** 最終手の座標 (ハイライト用) */
  lastMoveCoords: { from: Coordinate | null; to: Coordinate } | null;
  /** 総手数 */
  totalPlies: number;
  /** 分岐情報 */
  branchInfo: {
    isOnBranch: boolean;
    branchIndex: number | null;
    sourcePly: number | null;
  };
};

// ---------------------------------------------------------------------------
// Initial position (平手)
// ---------------------------------------------------------------------------
const HIRATE_BOARD: Board = [
  // 1段目 (後手陣)
  [
    { kind: 'KY', color: 'white' }, { kind: 'KE', color: 'white' }, { kind: 'GI', color: 'white' },
    { kind: 'KI', color: 'white' }, { kind: 'OU', color: 'white' }, { kind: 'KI', color: 'white' },
    { kind: 'GI', color: 'white' }, { kind: 'KE', color: 'white' }, { kind: 'KY', color: 'white' },
  ],
  // 2段目
  [
    null, { kind: 'HI', color: 'white' }, null, null, null, null, null, { kind: 'KA', color: 'white' }, null,
  ],
  // 3段目
  [
    { kind: 'FU', color: 'white' }, { kind: 'FU', color: 'white' }, { kind: 'FU', color: 'white' },
    { kind: 'FU', color: 'white' }, { kind: 'FU', color: 'white' }, { kind: 'FU', color: 'white' },
    { kind: 'FU', color: 'white' }, { kind: 'FU', color: 'white' }, { kind: 'FU', color: 'white' },
  ],
  // 4-6段目 (空)
  [null, null, null, null, null, null, null, null, null],
  [null, null, null, null, null, null, null, null, null],
  [null, null, null, null, null, null, null, null, null],
  // 7段目
  [
    { kind: 'FU', color: 'black' }, { kind: 'FU', color: 'black' }, { kind: 'FU', color: 'black' },
    { kind: 'FU', color: 'black' }, { kind: 'FU', color: 'black' }, { kind: 'FU', color: 'black' },
    { kind: 'FU', color: 'black' }, { kind: 'FU', color: 'black' }, { kind: 'FU', color: 'black' },
  ],
  // 8段目
  [
    null, { kind: 'KA', color: 'black' }, null, null, null, null, null, { kind: 'HI', color: 'black' }, null,
  ],
  // 9段目 (先手陣)
  [
    { kind: 'KY', color: 'black' }, { kind: 'KE', color: 'black' }, { kind: 'GI', color: 'black' },
    { kind: 'KI', color: 'black' }, { kind: 'OU', color: 'black' }, { kind: 'KI', color: 'black' },
    { kind: 'GI', color: 'black' }, { kind: 'KE', color: 'black' }, { kind: 'KY', color: 'black' },
  ],
];

// ---------------------------------------------------------------------------
// Position manipulation (applying / undoing moves)
// ---------------------------------------------------------------------------

/** 成り駒 -> 元駒 のマップ */
const UNPROMOTE_MAP: Partial<Record<PieceKind, PieceKind>> = {
  TO: 'FU', NY: 'KY', NK: 'KE', NG: 'GI', UM: 'KA', RY: 'HI',
};

/** 元駒 -> 成り駒 のマップ */
const PROMOTE_MAP: Partial<Record<PieceKind, PieceKind>> = {
  FU: 'TO', KY: 'NY', KE: 'NK', GI: 'NG', KA: 'UM', HI: 'RY',
};

/** 盤面をディープコピー */
function cloneBoard(board: Board): Board {
  return board.map(row => row.map(sq => sq ? { ...sq } : null));
}

/** HandPiecesをコピー */
function cloneHand(hand: HandPieces): HandPieces {
  return { ...hand };
}

/** Positionをコピー */
function clonePosition(pos: Position): Position {
  return {
    board: cloneBoard(pos.board),
    handBlack: cloneHand(pos.handBlack),
    handWhite: cloneHand(pos.handWhite),
    turn: pos.turn,
  };
}

/** 成り駒を元の駒種に戻す (持ち駒に加える用) */
function unpromote(kind: PieceKind): PieceKind {
  return UNPROMOTE_MAP[kind] || kind;
}

/** 指し手を局面に適用して新しい局面を返す */
export function applyMove(position: Position, move: Move): Position {
  const pos = clonePosition(position);
  const { board, handBlack, handWhite } = pos;

  const toRow = move.to.y - 1;
  const toCol = 9 - move.to.x;

  if (move.from) {
    // 盤上の移動
    const fromRow = move.from.y - 1;
    const fromCol = 9 - move.from.x;

    // 移動先に駒があれば取る
    const captured = board[toRow][toCol];
    if (captured) {
      const capturedBase = unpromote(captured.kind);
      const hand = move.color === 'black' ? handBlack : handWhite;
      hand[capturedBase as keyof HandPieces] = (hand[capturedBase as keyof HandPieces] || 0) + 1;
    }

    // 駒を移動
    const piece = board[fromRow][fromCol];
    if (piece) {
      board[fromRow][fromCol] = null;
      board[toRow][toCol] = {
        kind: move.promote ? (PROMOTE_MAP[piece.kind] || piece.kind) : piece.kind,
        color: move.color,
      };
    }
  } else {
    // 駒打ち
    board[toRow][toCol] = {
      kind: move.piece,
      color: move.color,
    };
    // 持ち駒から減らす
    const hand = move.color === 'black' ? handBlack : handWhite;
    const baseKind = move.piece as keyof HandPieces;
    if (hand[baseKind] && hand[baseKind]! > 0) {
      hand[baseKind] = hand[baseKind]! - 1;
      if (hand[baseKind] === 0) {
        delete hand[baseKind];
      }
    }
  }

  // 手番交代
  pos.turn = move.color === 'black' ? 'white' : 'black';

  return pos;
}

// ---------------------------------------------------------------------------
// Game State creation & navigation
// ---------------------------------------------------------------------------

/** GameRecordから初期GameStateを生成 */
export function createInitialState(record: GameRecord): GameState {
  return {
    currentPly: 0,
    position: record.initialPosition,
    currentMove: null,
    currentComment: record.moves[0]?.comment || null,
    lastMoveCoords: null,
    totalPlies: record.moves.length - 1, // moves[0]は開局なので-1
    branchInfo: {
      isOnBranch: false,
      branchIndex: null,
      sourcePly: null,
    },
  };
}

/** 指定手数の局面を計算 (開局から順番に指し手を適用) */
export function computePositionAtPly(record: GameRecord, targetPly: number): Position {
  let pos = record.initialPosition;

  for (let i = 1; i <= targetPly && i < record.moves.length; i++) {
    const move = record.moves[i].move;
    if (move) {
      pos = applyMove(pos, move);
    }
  }

  return pos;
}

/** 指定手数のGameStateを計算 */
export function computeStateAtPly(record: GameRecord, targetPly: number): GameState {
  const clampedPly = Math.max(0, Math.min(targetPly, record.moves.length - 1));
  const position = computePositionAtPly(record, clampedPly);
  const moveNode = record.moves[clampedPly];
  const move = moveNode?.move || null;

  return {
    currentPly: clampedPly,
    position,
    currentMove: move,
    currentComment: moveNode?.comment || null,
    lastMoveCoords: move ? { from: move.from, to: move.to } : null,
    totalPlies: record.moves.length - 1,
    branchInfo: {
      isOnBranch: false,
      branchIndex: null,
      sourcePly: null,
    },
  };
}

/** 1手進める */
export function forward(record: GameRecord, currentState: GameState): GameState {
  if (currentState.currentPly >= currentState.totalPlies) return currentState;
  return computeStateAtPly(record, currentState.currentPly + 1);
}

/** 1手戻す */
export function backward(record: GameRecord, currentState: GameState): GameState {
  if (currentState.currentPly <= 0) return currentState;
  return computeStateAtPly(record, currentState.currentPly - 1);
}

/** 開始局面へ */
export function goToStart(record: GameRecord): GameState {
  return computeStateAtPly(record, 0);
}

/** 最終局面へ */
export function goToEnd(record: GameRecord): GameState {
  return computeStateAtPly(record, record.moves.length - 1);
}

/** 指定手数へジャンプ */
export function goTo(record: GameRecord, ply: number): GameState {
  return computeStateAtPly(record, ply);
}
