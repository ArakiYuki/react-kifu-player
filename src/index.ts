// =============================================================================
// react-kifu-player - Public API
// =============================================================================

// ---------------------------------------------------------------------------
// Components
// ---------------------------------------------------------------------------
export { KifuPlayer } from './components/KifuPlayer/KifuPlayer';
export { ShogiBoard } from './components/ShogiBoard/ShogiBoard';
export { ControlBar } from './components/ControlBar/ControlBar';
export { MoveList } from './components/MoveList/MoveList';
export { EvalGraph } from './components/EvalGraph/EvalGraph';
export { CandidateList } from './components/CandidateList/CandidateList';

// ---------------------------------------------------------------------------
// Hooks
// ---------------------------------------------------------------------------
export { useKifuPlayer } from './hooks/useKifuPlayer';
export type { UseKifuPlayerOptions, UseKifuPlayerReturn } from './hooks/useKifuPlayer';
export { useKeyboardNav } from './hooks/useKeyboardNav';
export type { UseKeyboardNavOptions } from './hooks/useKeyboardNav';
// v0.2.0
export { useShogiProblem } from './hooks/useShogiProblem';

// ---------------------------------------------------------------------------
// Core utilities
// ---------------------------------------------------------------------------
export { 
  parseKifu, 
  detectFormat,
  extractEngineDataFromRecord 
} from './core/parser';
// v0.2.0
export { extractProblemsFromKifu } from './utils/problemExtractor';
export { positionToSFEN } from './utils/sfen';

// ---------------------------------------------------------------------------
// Theme system
// ---------------------------------------------------------------------------
export {
  textTheme,
  richTheme,
  imageWoodTheme,
  imageDarkTheme,
  imageGlassTheme,
  registerTheme,
  getTheme,
  getThemeNames,
  mergeTheme,
  resolveTheme,
  useKifuTheme,
  ThemeProvider,
} from './themes';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
export type {
  // Board & Position
  PieceKind,
  Color,
  BoardPiece,
  Square,
  Board,
  HandPieces,
  Position,
  Coordinate,

  // Moves
  Move,
  MoveNode,

  // Game Record
  GameHeader,
  GameRecord,
  KifuFormat,

  // Evaluation & Analysis
  EvaluationPoint,
  Candidate,
  CandidatesMap,

  // Theme
  PieceImageSet,
  PieceMode,
  BoardTheme,
  PieceTheme,
  HandTheme,
  MoveListTheme,
  EvalGraphTheme,
  ControlBarTheme,
  KifuTheme,
  PartialKifuTheme,

  // Component Props
  KifuPlayerProps,
  ShogiBoardProps,
  MoveListProps,
  EvalGraphProps,
  ControlBarProps,

  // v0.2.0: Interactive Board
  BoardSquareCoord,
  HandSquareCoord,
  SquareClick,

  // v0.2.0: Problem Types
  ShogiProblem,
  UseShogiProblemOptions,
  UseShogiProblemReturn,
  ProblemStatus,
  ProblemResult,
  ExtractProblemsOptions,
} from './types';
