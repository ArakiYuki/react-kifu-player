// =============================================================================
// Utility: extractProblemsFromKifu
// 棋譜から次の一手問題を自動抽出するユーティリティ (v0.2.0)
// =============================================================================
import { parseKifu, extractEngineDataFromRecord, getTsshogiRecord } from '../core/parser';
import { computePositionAtPly } from '../core/game-state';
import { parseMoves } from 'tsshogi';
import type {
  ShogiProblem,
  ExtractProblemsOptions,
  Position,
  Candidate,
} from '../types';

// ---------------------------------------------------------------------------
// SFEN 文字列構築
// ---------------------------------------------------------------------------

const RANK_TO_USI = 'abcdefghi';

/** 内部 Position から SFEN 文字列を構築 */
function buildSFEN(pos: Position, ply: number): string {
  const PIECE_TO_SFEN: Record<string, string> = {
    FU: 'p', KY: 'l', KE: 'n', GI: 's', KI: 'g', KA: 'b', HI: 'r', OU: 'k',
    TO: '+p', NY: '+l', NK: '+n', NG: '+s', UM: '+b', RY: '+r',
  };

  // 盤面部分 (SFEN は 9筋→1筋, 1段→9段 の順)
  const boardParts: string[] = [];
  for (let rank = 1; rank <= 9; rank++) {
    let rowStr = '';
    let emptyCount = 0;
    for (let file = 9; file >= 1; file--) {
      const col = 9 - file;
      const piece = pos.board[rank - 1][col];
      if (!piece) {
        emptyCount++;
      } else {
        if (emptyCount > 0) { rowStr += emptyCount; emptyCount = 0; }
        const sfenBase = PIECE_TO_SFEN[piece.kind] || 'k';
        if (sfenBase.startsWith('+')) {
          // 成り駒: 先手は大文字の2文字 "+P"→"+P", 後手は小文字 "+p"
          rowStr += piece.color === 'black' ? '+' + sfenBase[1].toUpperCase() : sfenBase;
        } else {
          rowStr += piece.color === 'black' ? sfenBase.toUpperCase() : sfenBase;
        }
      }
    }
    if (emptyCount > 0) rowStr += emptyCount;
    boardParts.push(rowStr);
  }
  const boardStr = boardParts.join('/');

  // 手番
  const turnStr = pos.turn === 'black' ? 'b' : 'w';

  // 持ち駒
  const HAND_ORDER = ['HI', 'KA', 'KI', 'GI', 'KE', 'KY', 'FU'] as const;
  const HAND_SFEN: Record<string, string> = {
    HI: 'r', KA: 'b', KI: 'g', GI: 's', KE: 'n', KY: 'l', FU: 'p',
  };
  let handStr = '';
  for (const kind of HAND_ORDER) {
    const count = pos.handBlack[kind] ?? 0;
    if (count > 0) handStr += (count > 1 ? count : '') + HAND_SFEN[kind].toUpperCase();
  }
  for (const kind of HAND_ORDER) {
    const count = pos.handWhite[kind] ?? 0;
    if (count > 0) handStr += (count > 1 ? count : '') + HAND_SFEN[kind];
  }
  if (!handStr) handStr = '-';

  return `${boardStr} ${turnStr} ${handStr} ${ply + 1}`;
}

// ---------------------------------------------------------------------------
// KIF形式の指し手 → USI形式変換
// ---------------------------------------------------------------------------

/**
 * KIF形式の読み筋から最初の手をUSI形式で取得します。
 *
 * 対応形式:
 * - USI形式: "7g7f", "P*5e", "7g7f+" → そのまま返す
 * - KIF形式: "△同　歩(85)" → "8e8e" は無効なので "(移動元)" + 全角数字から変換
 *   例: "▲７六歩(77)" → from=7g, to=7f → "7g7f"
 *   例: "△４七桂成(35)" → from=3e, to=4g, promote → "3e4g+"
 *   例: "△同　歩(85)" → "同" は直前の to と同じマス (この関数では扱えない)
 */
function extractFirstMoveUSI(readMoves: string): string | null {
  const trimmed = readMoves.trim();
  if (!trimmed) return null;

  // まず空白で区切って最初の「手」を取得
  const firstToken = trimmed.split(/\s+/)[0];
  if (!firstToken) return null;

  // --- USI形式の判定 ---
  // "7g7f", "7g7f+", "P*5e" などUSI形式
  const usiMatch = firstToken.match(/^([1-9][a-i][1-9][a-i]\+?|[A-Z]\*[1-9][a-i])$/);
  if (usiMatch) return usiMatch[1];

  // --- KIF形式の解析 ---
  // "▲" や "△" のプレフィックスを除去
  const withoutPrefix = firstToken.replace(/^[▲△☗☖]/, '');

  // "同　XX(from)" 形式は移動先が「同」なので、ここでは変換不可（nullを返す）
  // ただし後続処理で fromSquare を参照すればできるが、ここでは省略
  if (withoutPrefix.startsWith('同')) {
    // readMoves全体からfromを取得
    return parseKifSameSquare(trimmed);
  }

  return parseKifMove(withoutPrefix);
}

/** 全角数字→半角数字 */
function fullWidthToHalfWidth(ch: string): number {
  const fullWidthDigits = '１２３４５６７８９';
  const idx = fullWidthDigits.indexOf(ch);
  return idx >= 0 ? idx + 1 : -1;
}

/** 漢数字段→数字 */
function kanjiRankToNumber(ch: string): number {
  const kanjiRanks = '一二三四五六七八九';
  const idx = kanjiRanks.indexOf(ch);
  return idx >= 0 ? idx + 1 : -1;
}

/**
 * KIF形式の通常の指し手をUSI形式に変換
 * 例: "７六歩(77)" → "7g7f"
 * 例: "４七桂成(35)" → "3e4g+"
 */
function parseKifMove(kifMove: string): string | null {
  // 移動元座標 "(XY)" を探す
  const fromMatch = kifMove.match(/\((\d)(\d)\)/);
  if (!fromMatch) {
    // 持ち駒打ち: "()" がない場合は "打" が含まれる
    // 例: "５五角打" → 持ち駒打ち
    const dropMatch = kifMove.match(/^([１-９])([一二三四五六七八九])(.+?)打/);
    if (dropMatch) {
      const toFile = fullWidthToHalfWidth(dropMatch[1]);
      const toRank = kanjiRankToNumber(dropMatch[2]);
      if (toFile < 0 || toRank < 0) return null;
      const PIECE_TO_USI: Record<string, string> = {
        '歩': 'P', '香': 'L', '桂': 'N', '銀': 'S', '金': 'G', '角': 'B', '飛': 'R',
      };
      const pieceName = dropMatch[3];
      const usiPiece = PIECE_TO_USI[pieceName];
      if (!usiPiece) return null;
      return `${usiPiece}*${toFile}${RANK_TO_USI[toRank - 1]}`;
    }
    return null;
  }

  const fromFile = parseInt(fromMatch[1]);
  const fromRank = parseInt(fromMatch[2]);
  if (fromFile < 1 || fromFile > 9 || fromRank < 1 || fromRank > 9) return null;

  // 移動先の全角数字と漢数字を探す
  // 形式: "[全角数字][漢数字][駒名][成?](from)"
  const toMatch = kifMove.match(/^([１-９])([一二三四五六七八九])/);
  if (!toMatch) return null;

  const toFile = fullWidthToHalfWidth(toMatch[1]);
  const toRank = kanjiRankToNumber(toMatch[2]);
  if (toFile < 0 || toRank < 0) return null;

  const promote = /[歩香桂銀角飛]成/.test(kifMove);

  const fromUSI = `${fromFile}${RANK_TO_USI[fromRank - 1]}`;
  const toUSI = `${toFile}${RANK_TO_USI[toRank - 1]}`;

  return `${fromUSI}${toUSI}${promote ? '+' : ''}`;
}

/**
 * "△同　XX(from)" 形式の指し手をUSI形式に変換
 * 読み筋の2手目以降の「同」は「直前の手の移動先と同じ」を意味する
 * このケースでは readMoves 全体を見て判断する
 */
function parseKifSameSquare(readMoves: string): string | null {
  // "同" の直前にある手の移動先座標を探す
  // readMoves 例: "△同　歩(85) ▲同　飛(88) ..."
  // 最初の手が "同" の場合は readMoves より前の手が必要で、ここでは判断不可
  // そのため nullを返し、スキップする
  // TODO: 将来的には前の手のコンテキストを渡して変換できるようにする
  void readMoves;
  return null;
}

// ---------------------------------------------------------------------------
// KIF読み筋 → USI変換
// ---------------------------------------------------------------------------

/**
 * KIF形式の読み筋文字列を USI 形式のスペース区切り文字列に変換します。
 * 「同」の処理のために、直前の手 (lastMove) のコンテキストが必要です。
 *
 * @param position - tsshogi の ImmutablePosition (読み筋の開始局面)
 * @param readMoves - KIF形式の読み筋文字列 (例: "△同　歩(85) ▲同　飛(88)")
 * @param lastMove - 直前の指し手 (tsshogi の Move)。「同」の解決に必要
 * @returns USI形式のスペース区切り文字列 (例: "8e8f 8h8f")、変換失敗時は null
 */
function convertReadMovesToUSI(
  position: import('tsshogi').ImmutablePosition,
  readMoves: string,
  lastMove?: import('tsshogi').Move,
): string | null {
  try {
    const [moves] = parseMoves(position, readMoves.trim(), lastMove);
    if (moves.length === 0) return null;
    const usis = moves.map(m => m.usi).filter(Boolean);
    return usis.length > 0 ? usis.join(' ') : null;
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// Main function
// ---------------------------------------------------------------------------

/**
 * エンジン解析付きの棋譜から、自分の悪手局面を自動抽出し
 * 「次の一手問題」データの配列として返します。
 *
 * @param kifuString - KIF/KI2/CSA 形式の棋譜文字列（エンジン解析コメント付き）
 * @param options - 抽出オプション
 * @returns ShogiProblem の配列（evalDrop の大きい順でソート済み）
 *
 * @example
 * ```ts
 * import { extractProblemsFromKifu } from 'react-kifu-player';
 *
 * const problems = extractProblemsFromKifu(kifuString, {
 *   playerColor: 'black',      // 自分が先手の場合
 *   evalDropThreshold: 500,    // 評価値が500以上落ちた手を抽出
 *   correctMoveThreshold: 100, // AI最善手から100点差以内を全て正解
 * });
 *
 * // problems[0].sfen        → 課題局面のSFEN
 * // problems[0].correctMoves → 正解手のリスト (USI形式)
 * // problems[0].badMove      → 当時の悪手 (USI形式)
 * // problems[0].evalDrop     → 評価値の落差
 * ```
 */
export function extractProblemsFromKifu(
  kifuString: string,
  options: ExtractProblemsOptions,
): ShogiProblem[] {
  const {
    playerColor,
    evalDropThreshold = 500,
    correctMoveThreshold = 100,
    maxProblems,
    minAdvantage = -200,
  } = options;

  // 棋譜をパース
  const record = parseKifu(kifuString);
  const { evaluations, candidates } = extractEngineDataFromRecord(record);

  // 評価値を手数でインデックス化 (先手視点)
  const evalByPly = new Map<number, number>();
  for (const ev of evaluations) {
    if (ev.score !== null && ev.score !== undefined) {
      evalByPly.set(ev.ply, ev.score);
    }
  }

  const problems: ShogiProblem[] = [];

  for (const node of record.moves) {
    if (!node.move) continue; // 開局ノードはスキップ

    const ply = node.ply;
    const moveColor = node.move.color;

    // 自分の手番のみ対象
    if (moveColor !== playerColor) continue;

    // この手を指す「前」の評価値 = 1手前のノードの評価値 (AIが提示した最善手)
    const prevEval = evalByPly.get(ply - 1);
    // この手を指した「後」の評価値 = 現在のノードの評価値
    const afterEval = evalByPly.get(ply);

    if (prevEval === undefined || afterEval === undefined) continue;

    // 手を指す前の自分視点の評価値を計算
    // 先手: prevEval そのまま (先手視点)
    // 後手: -prevEval (後手から見た有利度)
    const playerPerspectiveEval = playerColor === 'black' ? prevEval : -prevEval;

    // すでに不利な局面（自分視点で minAdvantage 未満）はスキップ
    // 例: minAdvantage = -200 の場合、自分から見て -200 より悪い局面は除外
    if (playerPerspectiveEval < minAdvantage) continue;

    // 評価値の落差を計算 (先手視点)
    // 先手: afterEval - prevEval (負が悪化)
    // 後手: -(afterEval - prevEval) = prevEval - afterEval (負が悪化)
    const evalDrop = playerColor === 'black'
      ? afterEval - prevEval
      : prevEval - afterEval;

    // しきい値未満の落差はスキップ
    if (evalDrop > -evalDropThreshold) continue;

    // この局面の SFEN (手を指す前の局面)
    const prevPosition = computePositionAtPly(record, ply - 1);
    const sfen = buildSFEN(prevPosition, ply - 1);

    // 手を指す前の候補手リストを取得
    const prevCandidates = candidates.get(ply - 1) ?? [];

    // AI最善手の評価値
    const bestMoveEval = prevEval;

    // KIF読み筋をUSI形式に変換するために、tsshogiのRecordコンテキストを取得
    const tsshogiRecord = getTsshogiRecord(kifuString);
    tsshogiRecord.goto(ply - 1);
    const currentMove = tsshogiRecord.current.move;
    const lastMove = currentMove && 'to' in currentMove ? currentMove : undefined;

    // 正解手: 最善手から correctMoveThreshold 点以内の候補手
    const correctMoves: string[] = [];
    const correctMoveCandidates: Candidate[] = [];
    for (const cand of prevCandidates) {
      const firstMoveUSI = extractFirstMoveUSI(cand.readMoves);
      if (!firstMoveUSI) continue;

      // 評価値の差を計算
      const candEvalDiff = Math.abs(cand.score - bestMoveEval);

      if (candEvalDiff <= correctMoveThreshold) {
        // 重複チェック
        if (!correctMoves.includes(firstMoveUSI)) {
          correctMoves.push(firstMoveUSI);

          // 読み筋をUSI形式に変換して Candidate に格納
          const usiReadMoves = convertReadMovesToUSI(
            tsshogiRecord.position,
            cand.readMoves,
            lastMove,
          );
          correctMoveCandidates.push({
            ...cand,
            readMoves: usiReadMoves ?? cand.readMoves,
          });
        }
      }
    }

    // 正解手が1件もない場合はスキップ
    if (correctMoves.length === 0) continue;

    // 実際に指した悪手のUSI変換
    const badMoveFrom = node.move.from;
    const badMoveTo = node.move.to;
    let badMoveUSI: string;

    if (badMoveFrom) {
      const fromPart = `${badMoveFrom.x}${RANK_TO_USI[badMoveFrom.y - 1]}`;
      const toPart = `${badMoveTo.x}${RANK_TO_USI[badMoveTo.y - 1]}`;
      badMoveUSI = `${fromPart}${toPart}${node.move.promote ? '+' : ''}`;
    } else {
      // 駒打ち
      const PIECE_TO_USI: Partial<Record<string, string>> = {
        FU: 'P', KY: 'L', KE: 'N', GI: 'S', KI: 'G', KA: 'B', HI: 'R',
      };
      const pieceUSI = PIECE_TO_USI[node.move.piece] || 'P';
      const toPart = `${badMoveTo.x}${RANK_TO_USI[badMoveTo.y - 1]}`;
      badMoveUSI = `${pieceUSI}*${toPart}`;
    }

    // 評価値をプレイヤー視点に変換して格納
    // (先手: そのまま、後手: 符号反転)
    const playerBestMoveEval = playerColor === 'black' ? bestMoveEval : -bestMoveEval;
    const playerBadMoveEval = playerColor === 'black' ? afterEval : -afterEval;

    problems.push({
      sfen,
      playerColor,
      correctMoves,
      correctMoveCandidates,
      badMove: badMoveUSI,
      badMoveEval: playerBadMoveEval,
      bestMoveEval: playerBestMoveEval,
      evalDrop,
      sourcePly: ply,
    });
  }

  // evalDrop の絶対値が大きい順にソート（最悪手が先頭）
  problems.sort((a, b) => a.evalDrop - b.evalDrop);

  // maxProblems で件数を制限
  return maxProblems !== undefined ? problems.slice(0, maxProblems) : problems;
}
