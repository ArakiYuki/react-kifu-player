// =============================================================================
// Component: ShogiBoard - SVG-based shogi board
// =============================================================================
import React from 'react';
import type { ShogiBoardProps, BoardTheme, PieceTheme, HandTheme, BoardPiece, PieceKind, Color, HandPieces } from '../../types';
import { useKifuTheme } from '../../themes';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------
const CELL_SIZE = 44;
const BOARD_CELLS = 9;
const LABEL_MARGIN = 22;
const HAND_WIDTH = 50;

// 筋のラベル (右から左: 9, 8, 7, 6, 5, 4, 3, 2, 1)
const FILE_LABELS = ['９', '８', '７', '６', '５', '４', '３', '２', '１'];
// 段のラベル (上から下: 一, 二, ..., 九)
const RANK_LABELS = ['一', '二', '三', '四', '五', '六', '七', '八', '九'];

// 駒の表示名
const PIECE_DISPLAY: Record<PieceKind, string> = {
  FU: '歩', KY: '香', KE: '桂', GI: '銀', KI: '金', KA: '角', HI: '飛', OU: '玉',
  TO: 'と', NY: '杏', NK: '圭', NG: '全', UM: '馬', RY: '龍',
};

// 持ち駒の表示順
const HAND_ORDER: (keyof HandPieces)[] = ['HI', 'KA', 'KI', 'GI', 'KE', 'KY', 'FU'];

// 数字の漢数字
const KANJI_NUMS = ['', '一', '二', '三', '四', '五', '六', '七', '八', '九', '十', '十一', '十二', '十三', '十四', '十五', '十六', '十七', '十八'];

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

/** 盤面の罫線を描画 */
function BoardGrid({ theme }: { theme: BoardTheme }) {
  const boardSize = CELL_SIZE * BOARD_CELLS;
  const lines: React.ReactNode[] = [];

  // 縦線
  for (let i = 0; i <= BOARD_CELLS; i++) {
    lines.push(
      <line
        key={`v-${i}`}
        x1={i * CELL_SIZE}
        y1={0}
        x2={i * CELL_SIZE}
        y2={boardSize}
        stroke={theme.gridColor}
        strokeWidth={i === 0 || i === BOARD_CELLS ? theme.borderWidth : theme.gridWidth}
      />
    );
  }

  // 横線
  for (let i = 0; i <= BOARD_CELLS; i++) {
    lines.push(
      <line
        key={`h-${i}`}
        x1={0}
        y1={i * CELL_SIZE}
        x2={boardSize}
        y2={i * CELL_SIZE}
        stroke={theme.gridColor}
        strokeWidth={i === 0 || i === BOARD_CELLS ? theme.borderWidth : theme.gridWidth}
      />
    );
  }

  // 星 (目印)
  const starPositions = [
    [3, 3], [3, 6], [6, 3], [6, 6],
  ];
  for (const [col, row] of starPositions) {
    lines.push(
      <circle
        key={`star-${col}-${row}`}
        cx={col * CELL_SIZE}
        cy={row * CELL_SIZE}
        r={theme.starPointSize}
        fill={theme.starPointColor}
      />
    );
  }

  return <g>{lines}</g>;
}

/** 盤面のラベル (筋・段) を描画 */
function BoardLabels({ theme, reversed }: { theme: BoardTheme; reversed?: boolean }) {
  if (!theme.showLabels) return null;

  const labels: React.ReactNode[] = [];
  const boardSize = CELL_SIZE * BOARD_CELLS;

  // 筋ラベル (上)
  for (let i = 0; i < BOARD_CELLS; i++) {
    const text = reversed ? FILE_LABELS[8 - i] : FILE_LABELS[i];
    labels.push(
      <text
        key={`file-${i}`}
        x={i * CELL_SIZE + CELL_SIZE / 2}
        y={-8}
        textAnchor="middle"
        fontSize={theme.labelFontSize}
        fill={theme.labelColor}
        fontFamily="system-ui, sans-serif"
      >
        {text}
      </text>
    );
  }

  // 段ラベル (右)
  for (let i = 0; i < BOARD_CELLS; i++) {
    const text = reversed ? RANK_LABELS[8 - i] : RANK_LABELS[i];
    labels.push(
      <text
        key={`rank-${i}`}
        x={boardSize + 10}
        y={i * CELL_SIZE + CELL_SIZE / 2 + 4}
        textAnchor="start"
        fontSize={theme.labelFontSize}
        fill={theme.labelColor}
        fontFamily="system-ui, sans-serif"
      >
        {text}
      </text>
    );
  }

  return <g>{labels}</g>;
}

/** 1つの駒を描画 */
function PieceCell({
  piece,
  x,
  y,
  theme,
  cellSize,
}: {
  piece: BoardPiece;
  x: number;
  y: number;
  theme: PieceTheme;
  cellSize: number;
}) {
  const isGote = piece.color === 'white';
  const displayChar = PIECE_DISPLAY[piece.kind] || '?';
  const isPromoted = ['TO', 'NY', 'NK', 'NG', 'UM', 'RY'].includes(piece.kind);

  // テキストモード
  if (theme.mode === 'text') {
    const fontSize = cellSize * theme.fontScale;
    const color = isGote ? theme.goteColor : theme.senteColor;
    const bg = isGote ? theme.goteBackground : theme.senteBackground;
    const padding = 2;
    const pieceWidth = cellSize - padding * 2;
    const pieceHeight = cellSize - padding * 2;

    return (
      <g transform={`translate(${x}, ${y})`}>
        {/* 駒の背景 */}
        {bg && bg !== 'transparent' && (
          <rect
            x={padding}
            y={padding}
            width={pieceWidth}
            height={pieceHeight}
            rx={theme.borderRadius}
            ry={theme.borderRadius}
            fill={bg.startsWith('linear-gradient') ? undefined : bg}
            style={bg.startsWith('linear-gradient') ? { fill: '#e8d5a8' } : undefined}
          />
        )}

        {/* 駒の影 */}
        {theme.shadow && theme.shadow !== 'none' && (
          <rect
            x={padding + 1}
            y={padding + 1}
            width={pieceWidth}
            height={pieceHeight}
            rx={theme.borderRadius}
            ry={theme.borderRadius}
            fill="rgba(0,0,0,0.1)"
          />
        )}

        {/* 駒の文字 */}
        <text
          x={cellSize / 2}
          y={cellSize / 2}
          textAnchor="middle"
          dominantBaseline="central"
          fontSize={fontSize}
          fontFamily={theme.fontFamily}
          fontWeight="bold"
          fill={isPromoted ? '#cc0000' : color}
          transform={isGote ? `rotate(180, ${cellSize / 2}, ${cellSize / 2})` : undefined}
        >
          {displayChar}
        </text>
      </g>
    );
  }

  // 画像モード
  if (theme.mode === 'image') {
    const images = isGote ? (theme.goteImages || theme.senteImages) : theme.senteImages;
    const imgUrl = images?.[piece.kind];
    if (imgUrl) {
      return (
        <g transform={`translate(${x}, ${y})`}>
          <image
            href={imgUrl}
            x={2}
            y={2}
            width={cellSize - 4}
            height={cellSize - 4}
            transform={isGote ? `rotate(180, ${cellSize / 2}, ${cellSize / 2})` : undefined}
          />
        </g>
      );
    }
  }

  // カスタムレンダラー
  if (theme.mode === 'custom' && theme.customRenderer) {
    return (
      <g transform={`translate(${x}, ${y})`}>
        <foreignObject x={0} y={0} width={cellSize} height={cellSize}>
          {theme.customRenderer(piece, cellSize)}
        </foreignObject>
      </g>
    );
  }

  return null;
}

/** ハイライト (最終手) */
function HighlightSquare({
  x,
  y,
  color,
  cellSize,
}: {
  x: number;
  y: number;
  color: string;
  cellSize: number;
}) {
  return (
    <rect
      x={x}
      y={y}
      width={cellSize}
      height={cellSize}
      fill={color}
      pointerEvents="none"
    />
  );
}

/** 持ち駒エリア */
function HandDisplay({
  hand,
  color,
  theme,
  handTheme,
  x,
  y,
  height,
  isBottom,
}: {
  hand: HandPieces;
  color: Color;
  theme: PieceTheme;
  handTheme: HandTheme;
  x: number;
  y: number;
  height: number;
  isBottom?: boolean;
}) {
  const isGote = color === 'white';
  const pieces: React.ReactNode[] = [];

  const labelText = isGote ? '☖後手' : '☗先手';
  
  // 描画方向 (isBottomがtrueなら下から上へ)
  const drawItems = [];
  
  for (const kind of HAND_ORDER) {
    const count = hand[kind];
    if (!count || count <= 0) continue;

    const displayChar = PIECE_DISPLAY[kind as PieceKind] || '?';
    const countStr = count > 1 ? KANJI_NUMS[count] : '';
    drawItems.push(`${displayChar}${countStr}`);
  }

  const hasAny = drawItems.length > 0;
  if (!hasAny) {
    drawItems.push('なし');
  }

  // Y座標の計算
  let currentY = isBottom ? height - 20 : 20;
  const direction = isBottom ? -22 : 22;

  // ラベルを描画
  pieces.push(
    <text
      key="label"
      x={x + HAND_WIDTH / 2}
      y={y + currentY}
      textAnchor="middle"
      fontSize={handTheme.fontSize - 1}
      fontWeight="bold"
      fill={handTheme.textColor}
      fontFamily="'Noto Sans JP', system-ui, sans-serif"
    >
      {labelText}
    </text>
  );

  currentY += direction;

  // 駒を描画
  drawItems.forEach((item, index) => {
    pieces.push(
      <text
        key={index}
        x={x + HAND_WIDTH / 2}
        y={y + currentY}
        textAnchor="middle"
        fontSize={item === 'なし' ? handTheme.fontSize - 2 : handTheme.fontSize}
        fill={handTheme.textColor}
        opacity={item === 'なし' ? 0.5 : 1}
        fontFamily={item === 'なし' ? "system-ui, sans-serif" : theme.fontFamily}
      >
        {item}
      </text>
    );
    currentY += direction;
  });

  return <g>{pieces}</g>;
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

/** SVGベースの将棋盤面コンポーネント */
export function ShogiBoard(props: ShogiBoardProps & { playerNameSente?: string; playerNameGote?: string }) {
  const contextTheme = useKifuTheme();
  const boardTheme = props.boardTheme || contextTheme.board;
  const pieceTheme = props.pieceTheme || contextTheme.piece;
  const handTheme = props.handTheme || contextTheme.hand;

  const { position, lastMove, onForward, onBackward, className, showReverseButton, playerNameSente, playerNameGote } = props;
  
  const [internalReversed, setInternalReversed] = React.useState(false);
  const isReversed = props.reversed ?? internalReversed;

  // 対局者名表示エリアの高さ
  const NAME_AREA_HEIGHT = (playerNameSente || playerNameGote) ? 28 : 0;

  const boardPixels = CELL_SIZE * BOARD_CELLS;
  const totalWidth = HAND_WIDTH + LABEL_MARGIN + boardPixels + LABEL_MARGIN + HAND_WIDTH;
  const totalHeight = NAME_AREA_HEIGHT + LABEL_MARGIN + boardPixels + LABEL_MARGIN + NAME_AREA_HEIGHT;

  // 盤面の開始位置
  const boardX = HAND_WIDTH + LABEL_MARGIN;
  const boardY = NAME_AREA_HEIGHT + LABEL_MARGIN;

  // クリックイベントのハンドリング
  const handleClick = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!onForward && !onBackward) return;
    
    // 反転ボタンがクリックされた場合は何もしない
    if ((e.target as Element).closest?.('.reverse-btn')) {
      return;
    }
    
    const svg = e.currentTarget;
    const rect = svg.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    
    // 盤面の中心を基準に右半分・左半分を判定
    if (clickX > rect.width / 2) {
      onForward?.();
    } else {
      onBackward?.();
    }
  };

  // 上下のプレイヤー名
  const topPlayerName = isReversed ? playerNameSente : playerNameGote;
  const bottomPlayerName = isReversed ? playerNameGote : playerNameSente;

  return (
    <svg
      viewBox={`0 0 ${totalWidth} ${totalHeight}`}
      width={props.width || '100%'}
      className={className}
      onClick={handleClick}
      style={{ maxWidth: totalWidth, userSelect: 'none', cursor: (onForward || onBackward) ? 'pointer' : 'default' }}
      role="img"
      aria-label="将棋盤面"
    >
      {/* 盤面背景 */}
      <rect
        x={boardX}
        y={boardY}
        width={boardPixels}
        height={boardPixels}
        fill={boardTheme.background.startsWith('linear') ? '#d2a56c' : boardTheme.background}
        stroke={boardTheme.borderColor}
        strokeWidth={boardTheme.borderWidth}
      />

      {/* 対局者名 (上部) */}
      {topPlayerName && (
        <text
          x={boardX}
          y={18}
          fontSize={15}
          fontWeight="bold"
          fill={handTheme.textColor}
          fontFamily="'Noto Sans JP', system-ui, sans-serif"
        >
          {topPlayerName}
        </text>
      )}

      {/* 対局者名 (下部) */}
      {bottomPlayerName && (
        <text
          x={boardX + boardPixels}
          y={totalHeight - 8}
          textAnchor="end"
          fontSize={15}
          fontWeight="bold"
          fill={handTheme.textColor}
          fontFamily="'Noto Sans JP', system-ui, sans-serif"
        >
          {bottomPlayerName}
        </text>
      )}

      {/* 盤面グリッド・駒 のグループ */}
      <g transform={`translate(${boardX}, ${boardY})`}>
        <g transform={isReversed ? `rotate(180, ${boardPixels / 2}, ${boardPixels / 2})` : undefined}>
          {/* ハイライト (最終手) */}
          {lastMove && (
            <>
              {lastMove.from && (
                <HighlightSquare
                  x={(9 - lastMove.from.x) * CELL_SIZE}
                  y={(lastMove.from.y - 1) * CELL_SIZE}
                  color={boardTheme.highlightColor}
                  cellSize={CELL_SIZE}
                />
              )}
              <HighlightSquare
                x={(9 - lastMove.to.x) * CELL_SIZE}
                y={(lastMove.to.y - 1) * CELL_SIZE}
                color={boardTheme.highlightColor}
                cellSize={CELL_SIZE}
              />
            </>
          )}

          {/* 罫線 */}
          <BoardGrid theme={boardTheme} />

          {/* 駒 */}
          {position.board.map((row, rowIdx) =>
            row.map((square, colIdx) => {
              if (!square) return null;
              return (
                <PieceCell
                  key={`${rowIdx}-${colIdx}`}
                  piece={square}
                  x={colIdx * CELL_SIZE}
                  y={rowIdx * CELL_SIZE}
                  theme={pieceTheme}
                  cellSize={CELL_SIZE}
                />
              );
            })
          )}
        </g>

        {/* ラベル (ラベルは回転させないため別処理) */}
        <BoardLabels theme={boardTheme} reversed={isReversed} />
      </g>

      {/* 後手持ち駒 */}
      <HandDisplay
        hand={position.handWhite}
        color="white"
        theme={pieceTheme}
        handTheme={handTheme}
        x={isReversed ? boardX + boardPixels + LABEL_MARGIN : 0}
        y={boardY}
        height={boardPixels}
        isBottom={isReversed}
      />

      {/* 先手持ち駒 */}
      <HandDisplay
        hand={position.handBlack}
        color="black"
        theme={pieceTheme}
        handTheme={handTheme}
        x={isReversed ? 0 : boardX + boardPixels + LABEL_MARGIN}
        y={boardY}
        height={boardPixels}
        isBottom={!isReversed}
      />
      
      {/* 盤面反転ボタン */}
      {showReverseButton && (
        <g 
          className="reverse-btn"
          transform={`translate(${totalWidth - 36}, 8)`} 
          onClick={(e) => {
            e.stopPropagation();
            setInternalReversed(prev => !prev);
          }}
          style={{ cursor: 'pointer' }}
        >
          <rect width="28" height="28" rx="6" fill={handTheme.background} stroke={handTheme.borderColor} strokeWidth="1" />
          <text 
            x="14" y="14" 
            textAnchor="middle" dominantBaseline="central" 
            fontSize="14" fill={handTheme.textColor}
            transform={isReversed ? 'rotate(180, 14, 14)' : undefined}
            style={{ transition: 'transform 0.3s' }}
          >
            🔃
          </text>
        </g>
      )}
    </svg>
  );
}
