// =============================================================================
// Component: CandidateList - AI Candidate moves and evaluation
// =============================================================================
import React from 'react';
import type { Candidate } from '../../types';
import { useKifuTheme } from '../../themes';

export type CandidateListProps = {
  /** 候補手配列 (評価値順にソートされている想定) */
  candidates: Candidate[];
  /** 候補手をクリックした時のハンドラ (読み筋を再生するなど) */
  onCandidateClick?: (candidate: Candidate) => void;
  /** CSSクラス名 */
  className?: string;
  /** 最大表示件数 (デフォルト: 5) */
  maxItems?: number;
};

/**
 * 評価値 (score/mate) を文字列にフォーマットする
 */
function formatScore(score: number | undefined | null, mate?: number | null): { text: string; color: string } {
  if (mate != null) {
    if (mate > 0) return { text: `+詰${mate}`, color: '#d32f2f' };
    if (mate < 0) return { text: `-詰${Math.abs(mate)}`, color: '#1976d2' };
    return { text: '詰', color: '#d32f2f' };
  }
  
  if (score == null) return { text: '-', color: 'inherit' };
  
  const sign = score > 0 ? '+' : '';
  const text = `${sign}${score}`;
  // 先手有利(赤系)、後手有利(青系) - 一般的な将棋ソフトの表示に合わせる
  const color = score > 300 ? '#d32f2f' : (score < -300 ? '#1976d2' : 'inherit');
  
  return { text, color };
}

/** 候補手リストコンポーネント */
export function CandidateList(props: CandidateListProps) {
  const { candidates, onCandidateClick, className, maxItems = 5 } = props;
  const theme = useKifuTheme();
  
  const displayCandidates = candidates.slice(0, maxItems);

  if (!candidates || candidates.length === 0) {
    return (
      <div 
        className={className}
        style={{
          padding: '12px',
          color: theme.moveList.commentColor,
          fontFamily: theme.moveList.fontFamily,
          fontSize: theme.moveList.fontSize,
          backgroundColor: theme.moveList.background,
          textAlign: 'center',
          borderRadius: 4,
          border: `1px solid ${theme.board.borderColor}33`,
        }}
      >
        候補手データがありません
      </div>
    );
  }

  return (
    <div 
      className={className}
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 4,
        fontFamily: theme.moveList.fontFamily,
        fontSize: theme.moveList.fontSize,
      }}
    >
      {/* ヘッダー行 */}
      <div style={{
        display: 'flex',
        padding: '4px 8px',
        fontWeight: 'bold',
        color: theme.moveList.textColor,
        borderBottom: `1px solid ${theme.board.borderColor}66`,
        fontSize: theme.moveList.fontSize - 1,
      }}>
        <div style={{ width: '40px', flexShrink: 0 }}>順位</div>
        <div style={{ width: '60px', flexShrink: 0, textAlign: 'right', marginRight: '12px' }}>評価値</div>
        <div style={{ flex: 1, overflow: 'hidden' }}>読み筋</div>
      </div>

      {/* 候補手リスト */}
      {displayCandidates.map((candidate, idx) => {
        // mate情報がCandidateの型になければscoreから推測等の処理が可能ですが、
        // 型定義にmateがあればそれを使う想定 (現在はCandidate型にはscoreのみ定義されているためscoreだけ使用)
        // ※ 詰みスコアの表現はエンジンに依存します (例: 30000以上を詰みとする等)
        const isMate = Math.abs(candidate.score) > 29000;
        const mateVal = isMate ? (candidate.score > 0 ? 1 : -1) : null;
        
        const { text: scoreText, color: scoreColor } = formatScore(
          isMate ? null : candidate.score, 
          mateVal
        );

        return (
          <div
            key={candidate.id || idx}
            onClick={() => onCandidateClick?.(candidate)}
            style={{
              display: 'flex',
              padding: '6px 8px',
              backgroundColor: theme.moveList.background,
              color: theme.moveList.textColor,
              borderRadius: 4,
              cursor: onCandidateClick ? 'pointer' : 'default',
              transition: 'background-color 0.15s',
            }}
            onMouseEnter={(e) => {
              if (onCandidateClick) e.currentTarget.style.backgroundColor = theme.moveList.highlightColor;
            }}
            onMouseLeave={(e) => {
              if (onCandidateClick) e.currentTarget.style.backgroundColor = theme.moveList.background;
            }}
          >
            <div style={{ width: '40px', flexShrink: 0, color: theme.moveList.commentColor }}>
              #{idx + 1}
            </div>
            <div style={{ width: '60px', flexShrink: 0, textAlign: 'right', marginRight: '12px', color: scoreColor, fontWeight: 600 }}>
              {scoreText}
            </div>
            <div style={{ 
              flex: 1, 
              whiteSpace: 'nowrap', 
              overflow: 'hidden', 
              textOverflow: 'ellipsis',
              color: theme.moveList.textColor 
            }} title={candidate.formattedMoves || candidate.readMoves}>
              {candidate.formattedMoves || candidate.readMoves}
            </div>
          </div>
        );
      })}
    </div>
  );
}
