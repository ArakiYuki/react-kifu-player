import type { Position, PieceKind, Color, HandPieces } from '../types';

const PIECE_KIND_TO_SFEN: Record<PieceKind, string> = {
  FU: 'P',
  KY: 'L',
  KE: 'N',
  GI: 'S',
  KI: 'G',
  KA: 'B',
  HI: 'R',
  OU: 'K',
  TO: '+P',
  NY: '+L',
  NK: '+N',
  NG: '+S',
  UM: '+B',
  RY: '+R',
};

const HAND_ORDER: Array<keyof HandPieces> = ['HI', 'KA', 'KI', 'GI', 'KE', 'KY', 'FU'];

/**
 * 内部の Position オブジェクトを SFEN (USI) 文字列に変換する
 */
export function positionToSFEN(pos: Position, moveCount: number = 1): string {
  let sfenBoard = '';
  for (let rank = 0; rank < 9; rank++) {
    let emptyCount = 0;
    for (let file = 8; file >= 0; file--) { // 9筋〜1筋 (配列インデックスは0が9筋、8が1筋)
      const sq = pos.board[rank][file];
      if (sq === null) {
        emptyCount++;
      } else {
        if (emptyCount > 0) {
          sfenBoard += emptyCount;
          emptyCount = 0;
        }
        let p = PIECE_KIND_TO_SFEN[sq.kind];
        if (sq.color === 'white') {
          p = p.toLowerCase();
        }
        sfenBoard += p;
      }
    }
    if (emptyCount > 0) {
      sfenBoard += emptyCount;
    }
    if (rank < 8) sfenBoard += '/';
  }

  const turn = pos.turn === 'black' ? 'b' : 'w';

  let sfenHand = '';
  // 先手の持ち駒 (大文字)
  for (const kind of HAND_ORDER) {
    const count = pos.handBlack[kind];
    if (count && count > 0) {
      sfenHand += count > 1 ? `${count}${PIECE_KIND_TO_SFEN[kind]}` : PIECE_KIND_TO_SFEN[kind];
    }
  }
  // 後手の持ち駒 (小文字)
  for (const kind of HAND_ORDER) {
    const count = pos.handWhite[kind];
    if (count && count > 0) {
      sfenHand += count > 1 ? `${count}${PIECE_KIND_TO_SFEN[kind].toLowerCase()}` : PIECE_KIND_TO_SFEN[kind].toLowerCase();
    }
  }
  
  if (sfenHand === '') {
    sfenHand = '-';
  }

  return `${sfenBoard} ${turn} ${sfenHand} ${moveCount}`;
}
