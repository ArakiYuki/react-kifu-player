// =============================================================================
// react-kifu-player - Public Type Definitions
// =============================================================================

// ---------------------------------------------------------------------------
// Board & Piece Types
// ---------------------------------------------------------------------------

/** 駒の種類 */
export type PieceKind =
  | 'FU'   // 歩
  | 'KY'   // 香
  | 'KE'   // 桂
  | 'GI'   // 銀
  | 'KI'   // 金
  | 'KA'   // 角
  | 'HI'   // 飛
  | 'OU'   // 玉/王
  | 'TO'   // と
  | 'NY'   // 成香
  | 'NK'   // 成桂
  | 'NG'   // 成銀
  | 'UM'   // 馬
  | 'RY';  // 龍

/** 手番 */
export type Color = 'black' | 'white';

/** 盤上の駒 */
export type BoardPiece = {
  kind: PieceKind;
  color: Color;
};

/** 盤面の1マス (null = 空きマス) */
export type Square = BoardPiece | null;

/**
 * 9x9盤面
 * board[row][col] で row=0が1段目(先手から見て上), col=0が9筋(先手から見て右)
 * つまり board[0][0] = 9一, board[8][8] = 1九
 */
export type Board = Square[][];

/** 持ち駒 (駒種 -> 枚数) */
export type HandPieces = Partial<Record<'FU' | 'KY' | 'KE' | 'GI' | 'KI' | 'KA' | 'HI', number>>;

/** 局面 (盤面 + 持ち駒 + 手番) */
export type Position = {
  board: Board;
  handBlack: HandPieces;
  handWhite: HandPieces;
  turn: Color;
};

// ---------------------------------------------------------------------------
// Move Types
// ---------------------------------------------------------------------------

/** 盤面座標 (1-9) */
export type Coordinate = {
  x: number;  // 筋 (1-9, 1=一筋/右端)
  y: number;  // 段 (1-9, 1=一段/上端)
};

/** 指し手 */
export type Move = {
  /** 移動元 (nullの場合は駒打ち) */
  from: Coordinate | null;
  /** 移動先 */
  to: Coordinate;
  /** 駒種 */
  piece: PieceKind;
  /** 成りフラグ */
  promote: boolean;
  /** 捕獲した駒 (ある場合) */
  captured?: PieceKind;
  /** 表示用テキスト ("▲７六歩" 等) */
  displayText: string;
  /** 手番 */
  color: Color;
};

/** 棋譜の1ノード (手 + メタ情報) */
export type MoveNode = {
  /** 手数 (0 = 開局) */
  ply: number;
  /** 指し手 (ply=0の場合はnull) */
  move: Move | null;
  /** コメント */
  comment: string | null;
  /** 消費時間 (秒) */
  timeSpent: number | null;
  /** 分岐 */
  branches: MoveNode[][];
};

// ---------------------------------------------------------------------------
// Game Record Types
// ---------------------------------------------------------------------------

/** 棋譜ヘッダー情報 */
export type GameHeader = {
  /** 先手 (下手) の名前 */
  blackName: string | null;
  /** 後手 (上手) の名前 */
  whiteName: string | null;
  /** 対局日 */
  date: string | null;
  /** 棋戦名 */
  event: string | null;
  /** 場所 */
  site: string | null;
  /** 戦型 */
  opening: string | null;
  /** その他のヘッダーフィールド */
  custom: Record<string, string>;
};

/** パース済み棋譜 */
export type GameRecord = {
  /** ヘッダー情報 */
  header: GameHeader;
  /** 指し手ツリー (本譜 + 分岐) */
  moves: MoveNode[];
  /** 開始局面 */
  initialPosition: Position;
  /** 入力フォーマット */
  format: KifuFormat;
};

/** 対応する棋譜フォーマット */
export type KifuFormat = 'kif' | 'ki2' | 'csa' | 'jkf' | 'sfen' | 'usi' | 'unknown';

// ---------------------------------------------------------------------------
// Evaluation & Analysis Types
// ---------------------------------------------------------------------------

/** 1手分の評価値 */
export type EvaluationPoint = {
  /** 手数 */
  ply: number;
  /** 評価値 (先手視点、centipawn) */
  score: number;
  /** 詰みの場合の手数 (正=先手勝ち、負=後手勝ち) */
  mate: number | null;
  /** ラベル */
  label?: string;
};

/** 候補手 */
export type Candidate = {
  /** 候補手ID (1, 2, 3...) */
  id: number;
  /** 評価値 */
  score: number;
  /** 探索深さ */
  depth?: number;
  /** 探索ノード数 */
  nodes?: number;
  /** 読み筋 (USI or KIF形式の文字列) */
  readMoves: string;
  /** 表示用に整形された読み筋 */
  formattedMoves?: string;
};

/** 手数 -> 候補手リスト のマッピング */
export type CandidatesMap = Map<number, Candidate[]>;

// ---------------------------------------------------------------------------
// Theme Types
// ---------------------------------------------------------------------------

/** 駒の画像セット (駒種 -> 画像URL or Reactコンポーネント) */
export type PieceImageSet = Partial<Record<PieceKind, string>>;

/** テーマのピース表示モード */
export type PieceMode = 'text' | 'image' | 'custom';

/** 盤面テーマ設定 */
export type BoardTheme = {
  /** 盤面背景 (色, グラデーション, or 画像URL) */
  background: string;
  /** 罫線色 */
  gridColor: string;
  /** 罫線の太さ */
  gridWidth: number;
  /** 星(目印)の色 */
  starPointColor: string;
  /** 星のサイズ */
  starPointSize: number;
  /** 最終手ハイライト色 */
  highlightColor: string;
  /** 盤面外枠の色 */
  borderColor: string;
  /** 盤面外枠の太さ */
  borderWidth: number;
  /** 座標ラベル (筋・段) の色 */
  labelColor: string;
  /** 座標ラベルのフォントサイズ */
  labelFontSize: number;
  /** 座標ラベルを表示するか */
  showLabels: boolean;
};

/** 駒テーマ設定 */
export type PieceTheme = {
  /** 表示モード */
  mode: PieceMode;
  /** テキストモード時のフォントファミリー */
  fontFamily: string;
  /** テキストモード時のフォントサイズ (盤面マスに対する比率) */
  fontScale: number;
  /** 先手駒の文字色 */
  senteColor: string;
  /** 後手駒の文字色 */
  goteColor: string;
  /** 先手駒の背景色 */
  senteBackground: string;
  /** 後手駒の背景色 */
  goteBackground: string;
  /** 駒の角丸 */
  borderRadius: number;
  /** 駒の影 */
  shadow: string;
  /** カスタム画像セット (先手用) */
  senteImages?: PieceImageSet;
  /** カスタム画像セット (後手用。省略時は先手を180度回転) */
  goteImages?: PieceImageSet;
  /** カスタム駒レンダラー (完全自由描画) */
  customRenderer?: (piece: BoardPiece, size: number) => React.ReactNode;
};

/** 持ち駒エリアのテーマ */
export type HandTheme = {
  background: string;
  textColor: string;
  fontSize: number;
  borderColor: string;
};

/** 棋譜リストのテーマ */
export type MoveListTheme = {
  background: string;
  textColor: string;
  highlightColor: string;
  highlightTextColor: string;
  commentColor: string;
  branchIndicatorColor: string;
  fontSize: number;
  fontFamily: string;
};

/** 評価値グラフのテーマ */
export type EvalGraphTheme = {
  backgroundColor: string;
  lineColor: string;
  branchLineColor: string;
  gridColor: string;
  dotColor: string;
  currentLineColor: string;
  zeroLineColor: string;
  fontSize: number;
  fontFamily: string;
};

/** 操作バーのテーマ */
export type ControlBarTheme = {
  backgroundColor: string;
  buttonColor: string;
  buttonHoverColor: string;
  buttonActiveColor: string;
  buttonSize: number;
  gap: number;
};

/** 統合テーマ */
export type KifuTheme = {
  /** テーマ名 */
  name: string;
  /** 盤面テーマ */
  board: BoardTheme;
  /** 駒テーマ */
  piece: PieceTheme;
  /** 持ち駒テーマ */
  hand: HandTheme;
  /** 棋譜リストテーマ */
  moveList: MoveListTheme;
  /** 評価値グラフテーマ */
  evalGraph: EvalGraphTheme;
  /** 操作バーテーマ */
  controlBar: ControlBarTheme;
};

/** テーマのパーシャル (部分上書き用) */
export type PartialKifuTheme = {
  [K in keyof KifuTheme]?: K extends 'name'
    ? string
    : Partial<KifuTheme[K]>;
};

// ---------------------------------------------------------------------------
// Component Props Types
// ---------------------------------------------------------------------------

/** KifuPlayer コンポーネントのプロパティ */
export type KifuPlayerProps = {
  /** 棋譜文字列 (KIF/KI2/CSA/SFEN/USI形式) */
  kifu: string;
  /** テーマ名 or カスタムテーマオブジェクト */
  theme?: 'rich' | 'text' | KifuTheme | PartialKifuTheme;
  /** 評価値グラフを表示するか */
  showEvalGraph?: boolean;
  /** 棋譜リストを表示するか */
  showMoveList?: boolean;
  /** 候補手パネルを表示するか */
  showCandidates?: boolean;
  /** 操作バーを表示するか */
  showControlBar?: boolean;
  /** 外部から提供する評価値データ */
  evaluations?: EvaluationPoint[];
  /** 外部から提供する候補手データ */
  candidates?: CandidatesMap;
  /** 初期手数 */
  initialPly?: number;
  /** 手数変更コールバック */
  onPlyChange?: (ply: number) => void;
  /** 分岐変更コールバック */
  onBranchChange?: (branchIndex: number | null) => void;
  /** コンポーネントの幅 */
  width?: number | string;
  /** CSSクラス名 */
  className?: string;
  /** インラインスタイル */
  style?: React.CSSProperties;
};

/** ShogiBoard コンポーネントのプロパティ */
export type ShogiBoardProps = {
  /** 現在の局面 */
  position: Position;
  /** テーマ (盤面 + 駒) */
  boardTheme?: BoardTheme;
  pieceTheme?: PieceTheme;
  handTheme?: HandTheme;
  /** 盤面を反転するか（後手側視点） */
  reversed?: boolean;
  /** 盤面反転ボタンを盤面右上に表示するか */
  showReverseButton?: boolean;
  /** 最終手の座標 (ハイライト用) */
  lastMove?: { from: Coordinate | null; to: Coordinate };
  /** 盤面右半分クリック時 (進む) */
  onForward?: () => void;
  /** 盤面左半分クリック時 (戻る) */
  onBackward?: () => void;
  /** 幅 */
  width?: number | string;
  /** CSSクラス名 */
  className?: string;
};

/** MoveList コンポーネントのプロパティ */
export type MoveListProps = {
  /** 指し手ノード配列 */
  moves: MoveNode[];
  /** 現在の手数 */
  currentPly: number;
  /** 手数クリック時のコールバック */
  onPlyClick?: (ply: number) => void;
  /** テーマ */
  theme?: MoveListTheme;
  /** CSSクラス名 */
  className?: string;
};

/** EvalGraph コンポーネントのプロパティ */
export type EvalGraphProps = {
  /** 評価値データ */
  data: EvaluationPoint[];
  /** 現在の手数 */
  currentPly: number;
  /** 手数クリック時のコールバック */
  onPlyClick?: (ply: number) => void;
  /** 分岐時の評価値データ */
  branchData?: EvaluationPoint[];
  /** 評価値上限 */
  maxScore?: number;
  /** テーマ */
  theme?: EvalGraphTheme;
  /** CSSクラス名 */
  className?: string;
};

/** ControlBar コンポーネントのプロパティ */
export type ControlBarProps = {
  /** 1手戻る */
  onBackward: () => void;
  /** 1手進む */
  onForward: () => void;
  /** 開始局面へ */
  onGoToStart: () => void;
  /** 最終局面へ */
  onGoToEnd: () => void;
  /** 現在の手数 */
  currentPly: number;
  /** 総手数 */
  totalPlies: number;
  /** テーマ */
  theme?: ControlBarTheme;
  /** CSSクラス名 */
  className?: string;
};
