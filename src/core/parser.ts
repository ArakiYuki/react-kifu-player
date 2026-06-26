// =============================================================================
// Core: Kifu Parser - tsshogi wrapper
// =============================================================================
import {
  importKIF,
  importKI2,
  importCSA,
  importJKF,
  importJKFString,
  Record as TsshogiRecord,
  Color as TsshogiColor,
  PieceType,
  type ImmutablePosition,
  type ImmutableHand,
  type ImmutableNode,
  type Move as TsshogiMove,
  type SpecialMove,
  Square as TsshogiSquare,
  RecordMetadataKey,
  getBlackPlayerName,
  getWhitePlayerName,
} from 'tsshogi';

import type {
  GameRecord,
  GameHeader,
  Position,
  Board,
  HandPieces,
  BoardPiece,
  PieceKind,
  Color,
  MoveNode,
  Move,
  Coordinate,
  KifuFormat,
} from '../types';

// ---------------------------------------------------------------------------
// Piece type mapping: tsshogi -> react-kifu-player
// ---------------------------------------------------------------------------
const PIECE_TYPE_MAP: Record<string, PieceKind> = {
  [PieceType.PAWN]: 'FU',
  [PieceType.LANCE]: 'KY',
  [PieceType.KNIGHT]: 'KE',
  [PieceType.SILVER]: 'GI',
  [PieceType.GOLD]: 'KI',
  [PieceType.BISHOP]: 'KA',
  [PieceType.ROOK]: 'HI',
  [PieceType.KING]: 'OU',
  [PieceType.PROM_PAWN]: 'TO',
  [PieceType.PROM_LANCE]: 'NY',
  [PieceType.PROM_KNIGHT]: 'NK',
  [PieceType.PROM_SILVER]: 'NG',
  [PieceType.HORSE]: 'UM',
  [PieceType.DRAGON]: 'RY',
};

/** tsshogi の PieceType を内部の PieceKind に変換 */
function toPieceKind(pieceType: PieceType): PieceKind {
  const mapped = PIECE_TYPE_MAP[pieceType];
  if (!mapped) {
    throw new Error(`Unknown piece type: ${pieceType}`);
  }
  return mapped;
}

/** tsshogi の Color を内部の Color に変換 */
function toColor(color: TsshogiColor): Color {
  return color === TsshogiColor.BLACK ? 'black' : 'white';
}

// ---------------------------------------------------------------------------
// Position conversion
// ---------------------------------------------------------------------------

/** tsshogi の ImmutableHand を HandPieces に変換 */
function toHandPieces(hand: ImmutableHand): HandPieces {
  const result: HandPieces = {};
  const handTypes: Array<{ tsKey: PieceType; key: keyof HandPieces }> = [
    { tsKey: PieceType.PAWN, key: 'FU' },
    { tsKey: PieceType.LANCE, key: 'KY' },
    { tsKey: PieceType.KNIGHT, key: 'KE' },
    { tsKey: PieceType.SILVER, key: 'GI' },
    { tsKey: PieceType.GOLD, key: 'KI' },
    { tsKey: PieceType.BISHOP, key: 'KA' },
    { tsKey: PieceType.ROOK, key: 'HI' },
  ];

  for (const { tsKey, key } of handTypes) {
    const count = hand.count(tsKey);
    if (count > 0) {
      result[key] = count;
    }
  }
  return result;
}

/** tsshogi の ImmutablePosition を Position に変換 */
function toPosition(pos: ImmutablePosition): Position {
  const board: Board = Array.from({ length: 9 }, () =>
    Array.from({ length: 9 }, () => null)
  );

  // tsshogi Board.at(square) returns Piece | null
  // Square has file (1-9, right to left) and rank (1-9, top to bottom)
  for (let rank = 1; rank <= 9; rank++) {
    for (let file = 1; file <= 9; file++) {
      const sq = new TsshogiSquare(file, rank);
      const piece = pos.board.at(sq);
      if (piece) {
        const boardPiece: BoardPiece = {
          kind: toPieceKind(piece.type),
          color: toColor(piece.color),
        };
        // board[row][col]: row=rank-1, col=9-file (so file 9 -> col 0)
        board[rank - 1][9 - file] = boardPiece;
      }
    }
  }

  return {
    board,
    handBlack: toHandPieces(pos.blackHand),
    handWhite: toHandPieces(pos.whiteHand),
    turn: toColor(pos.color),
  };
}

// ---------------------------------------------------------------------------
// Move conversion
// ---------------------------------------------------------------------------

/** 指し手が通常の指し手かどうかを判定 */
function isNormalMove(move: TsshogiMove | SpecialMove): move is TsshogiMove {
  return 'to' in move && 'color' in move;
}

/** tsshogi の Node から内部の Move を抽出 */
function toMove(node: ImmutableNode): Move | null {
  const m = node.move;
  if (!m || !isNormalMove(m)) return null;

  // from: Square (盤上の移動) or PieceType (駒打ち)
  let from: Coordinate | null = null;
  let pieceKind: PieceKind;

  if (m.from instanceof TsshogiSquare) {
    from = { x: m.from.file, y: m.from.rank };
    pieceKind = toPieceKind(m.pieceType);
  } else {
    // 駒打ち: from is PieceType
    from = null;
    pieceKind = toPieceKind(m.pieceType);
  }

  const to: Coordinate = { x: m.to.file, y: m.to.rank };

  return {
    from,
    to,
    piece: pieceKind,
    promote: !!m.promote,
    captured: m.capturedPieceType ? toPieceKind(m.capturedPieceType) : undefined,
    displayText: node.displayText || '',
    color: toColor(m.color),
  };
}

// ---------------------------------------------------------------------------
// Record conversion
// ---------------------------------------------------------------------------

/** tsshogi の Record から MoveNode[] を生成 */
function buildMoveNodes(record: TsshogiRecord): MoveNode[] {
  const nodes: MoveNode[] = [];

  // Go to start
  record.goto(0);

  // First node (initial position)
  nodes.push({
    ply: 0,
    move: null,
    comment: record.current.comment || null,
    timeSpent: null,
    branches: [],
  });

  // Walk through the main line
  while (record.goForward()) {
    const current = record.current;
    const move = toMove(current);

    nodes.push({
      ply: current.ply,
      move,
      comment: current.comment || null,
      timeSpent: current.elapsedMs ? Math.floor(current.elapsedMs / 1000) : null,
      branches: [],
    });
  }

  return nodes;
}

/** ヘッダー情報の抽出 */
function extractHeader(record: TsshogiRecord): GameHeader {
  const metadata = record.metadata;
  return {
    blackName: getBlackPlayerName(metadata) || metadata.getStandardMetadata(RecordMetadataKey.BLACK_NAME) || null,
    whiteName: getWhitePlayerName(metadata) || metadata.getStandardMetadata(RecordMetadataKey.WHITE_NAME) || null,
    date: metadata.getStandardMetadata(RecordMetadataKey.DATE) || null,
    event: metadata.getStandardMetadata(RecordMetadataKey.TITLE) || null,
    site: metadata.getStandardMetadata(RecordMetadataKey.PLACE) || null,
    opening: metadata.getStandardMetadata(RecordMetadataKey.STRATEGY) || null,
    custom: {},
  };
}

// ---------------------------------------------------------------------------
// Format detection & parsing
// ---------------------------------------------------------------------------

/** 棋譜フォーマットを自動判別 */
export function detectFormat(kifu: string): KifuFormat {
  const trimmed = kifu.trim();

  // JKF (JSON)
  if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
    try {
      JSON.parse(trimmed);
      return 'jkf';
    } catch {
      // Not valid JSON
    }
  }

  // SFEN / USI
  if (trimmed.startsWith('sfen ') || trimmed.startsWith('position ')) {
    return 'sfen';
  }
  if (trimmed.startsWith('startpos')) {
    return 'usi';
  }

  // CSA
  if (
    trimmed.startsWith('V') ||
    trimmed.startsWith('N+') ||
    trimmed.startsWith('N-') ||
    trimmed.startsWith('P1') ||
    trimmed.startsWith('PI') ||
    /^[+-]\d{4}[A-Z]{2}/m.test(trimmed)
  ) {
    return 'csa';
  }

  // KI2 - usually has ▲ or △ at start of lines without move numbers
  if (/^[▲△▼▽][１-９一-九]/.test(trimmed)) {
    return 'ki2';
  }

  // KIF - has numbered moves and headers like "手合割" or "先手"
  if (
    /^(手合割|先手|後手|開始日時|棋戦)/.test(trimmed) ||
    /^\s*\d+\s+[１-９一-九]/.test(trimmed)
  ) {
    return 'kif';
  }

  return 'unknown';
}

/** 棋譜文字列をパースして GameRecord を返す */
export function parseKifu(kifuString: string): GameRecord {
  const normalized = kifuString.replace(/\r\n/g, '\n').replace(/\r/g, '\n').trim();
  const format = detectFormat(normalized);

  let record: TsshogiRecord | Error;

  switch (format) {
    case 'kif':
      record = importKIF(normalized);
      break;
    case 'ki2':
      record = importKI2(normalized);
      break;
    case 'csa':
      record = importCSA(normalized);
      break;
    case 'jkf':
      record = importJKFString(normalized);
      break;
    case 'sfen':
    case 'usi': {
      record = TsshogiRecord.newByUSI(normalized);
      break;
    }
    default:
      // Try all parsers in order
      record = tryAllParsers(normalized);
  }

  if (record instanceof Error) {
    throw new Error(`棋譜のパースに失敗しました: ${record.message}`);
  }

  return {
    header: extractHeader(record),
    moves: buildMoveNodes(record),
    initialPosition: toPosition(record.initialPosition),
    format,
  };
}

/** 全パーサーを順番に試行 */
function tryAllParsers(kifu: string): TsshogiRecord | Error {
  const parsers: Array<{ fn: (s: string) => TsshogiRecord | Error; name: KifuFormat }> = [
    { fn: importKIF, name: 'kif' },
    { fn: importCSA, name: 'csa' },
    { fn: importKI2, name: 'ki2' },
    { fn: importJKFString, name: 'jkf' },
    { fn: (s: string) => TsshogiRecord.newByUSI(s), name: 'usi' },
  ];

  let lastError: Error | null = null;
  for (const parser of parsers) {
    const result = parser.fn(kifu);
    if (!(result instanceof Error)) {
      return result;
    }
    lastError = result;
  }

  return lastError || new Error('No parser could handle the input');
}
