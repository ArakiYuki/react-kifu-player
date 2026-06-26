// =============================================================================
// Component: EvalGraph - Evaluation score graph
// =============================================================================
import React, { useMemo } from 'react';
import type { EvalGraphProps, EvalGraphTheme } from '../../types';
import { useKifuTheme } from '../../themes';

/**
 * 評価値を一定の範囲にクリップし、グラフ描画用のY座標(0〜1)に変換する
 */
function normalizeScore(score: number | undefined | null, mate: number | null | undefined, maxScore: number): number {
  if (mate != null) {
    // 詰みがある場合
    return mate > 0 ? 1 : 0;
  }
  
  if (score == null) {
    return 0.5; // 不明な場合は中央
  }

  // maxScore (例: 2000) でクリップ
  const clamped = Math.max(-maxScore, Math.min(maxScore, score));
  // -2000 〜 2000 を 0 〜 1 に変換 (先手優勢が上)
  return (clamped + maxScore) / (maxScore * 2);
}

/** 評価値グラフコンポーネント */
export function EvalGraph(props: EvalGraphProps) {
  const contextTheme = useKifuTheme();
  const theme: EvalGraphTheme = props.theme || contextTheme.evalGraph;

  const {
    data,
    currentPly,
    onPlyClick,
    branchData,
    maxScore = 2000,
    className,
  } = props;

  // グラフの描画領域サイズ
  const width = 1000;
  const height = 200;
  const paddingX = 20;
  const paddingY = 20;

  const drawWidth = width - paddingX * 2;
  const drawHeight = height - paddingY * 2;

  // x軸の最大値 (最後の手数)
  const maxPly = data.length > 0 ? Math.max(10, data[data.length - 1]?.ply || 0) : 10;

  // データのポイント座標を計算
  const points = useMemo(() => {
    if (data.length === 0) return [];
    
    return data.map(point => {
      const x = paddingX + (point.ply / maxPly) * drawWidth;
      const normalized = normalizeScore(point.score, point.mate, maxScore);
      const y = paddingY + (1 - normalized) * drawHeight;
      return { x, y, ply: point.ply };
    });
  }, [data, maxScore, maxPly, drawWidth, drawHeight]);

  // SVGパスの生成
  const linePath = useMemo(() => {
    if (points.length === 0) return '';
    return points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
  }, [points]);

  // 分岐の点線パスを計算
  const branchPath = useMemo(() => {
    if (!branchData || branchData.length === 0) return null;

    // branchData[0].ply は分岐元の手数
    const branchPly = branchData[0].ply;
    
    // 分岐元のポイント（本譜上の点）を探す
    const sourcePoint = points.find(p => p.ply === branchPly);
    if (!sourcePoint) return null;
    
    // 分岐先（候補手の評価値）のY座標を計算
    const branchNorm = normalizeScore(branchData[0].score, branchData[0].mate, maxScore);
    const branchY = paddingY + (1 - branchNorm) * drawHeight;
    // X座標は分岐元の1手先
    const branchX = paddingX + ((branchPly + 1) / maxPly) * drawWidth;
    
    // 現在手が分岐元より進んでいる場合は、現在の手数まで直線を伸ばす
    const endPly = Math.max(branchPly + 1, currentPly);
    const endX = paddingX + (endPly / maxPly) * drawWidth;

    return {
      d: `M ${sourcePoint.x} ${sourcePoint.y} L ${branchX} ${branchY} ${endX > branchX ? `L ${endX} ${branchY}` : ''}`,
      endX: endX,
      endY: branchY,
    };
  }, [branchData, points, maxPly, maxScore, drawWidth, drawHeight]);

  // 現在手のX座標
  const currentPoint = points.find(p => p.ply === currentPly);
  const currentX = currentPoint 
    ? currentPoint.x 
    : paddingX + (currentPly / maxPly) * drawWidth;

  // 領域クリック時のハンドラ (最も近い手数を探す)
  const handleClick = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!onPlyClick || points.length === 0) return;
    
    const svg = e.currentTarget;
    const rect = svg.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const svgClickX = (clickX / rect.width) * width;
    
    let closest = points[0];
    let minDistance = Math.abs(svgClickX - points[0].x);
    
    for (let i = 1; i < points.length; i++) {
      const dist = Math.abs(svgClickX - points[i].x);
      if (dist < minDistance) {
        minDistance = dist;
        closest = points[i];
      }
    }
    
    onPlyClick(closest.ply);
  };

  return (
    <div 
      className={className} 
      style={{ 
        width: '100%', 
        backgroundColor: theme.backgroundColor,
        fontFamily: theme.fontFamily,
        position: 'relative'
      }}
    >
      <svg
        viewBox={`0 0 ${width} ${height}`}
        style={{ width: '100%', height: 'auto', display: 'block', cursor: onPlyClick ? 'pointer' : 'default' }}
        onClick={handleClick}
        role="img"
        aria-label="評価値グラフ"
      >
        {/* 背景の横線 */}
        <g stroke={theme.gridColor} strokeWidth="1" strokeDasharray="4 4">
          <line x1={paddingX} y1={paddingY} x2={width - paddingX} y2={paddingY} />
          <line x1={paddingX} y1={height - paddingY} x2={width - paddingX} y2={height - paddingY} />
        </g>
        
        {/* 0の線 (形勢互角) */}
        <line 
          x1={paddingX} 
          y1={paddingY + drawHeight / 2} 
          x2={width - paddingX} 
          y2={paddingY + drawHeight / 2} 
          stroke={theme.zeroLineColor} 
          strokeWidth="1.5" 
        />

        {/* 評価値の折れ線（本譜） */}
        {linePath && (
          <path
            d={linePath}
            fill="none"
            stroke={theme.lineColor}
            strokeWidth="3"
            strokeLinejoin="round"
            strokeLinecap="round"
          />
        )}

        {/* 分岐の点線（候補手の評価値） */}
        {branchPath && (
          <>
            <path
              d={branchPath.d}
              fill="none"
              stroke="#ff6b6b"
              strokeWidth="2.5"
              strokeDasharray="8 4"
              strokeLinejoin="round"
              strokeLinecap="round"
              opacity={0.85}
            />
            <circle
              cx={branchPath.endX}
              cy={branchPath.endY}
              r="5"
              fill="#ff6b6b"
              opacity={0.85}
            />
          </>
        )}

        {/* 現在手の縦線インジケーター */}
        {currentX >= paddingX && currentX <= width - paddingX && (
          <line
            x1={currentX}
            y1={paddingY}
            x2={currentX}
            y2={height - paddingY}
            stroke={theme.currentLineColor}
            strokeWidth="2"
          />
        )}
        
        {/* 現在手のドット */}
        {currentPoint && (
          <circle
            cx={currentPoint.x}
            cy={currentPoint.y}
            r="5"
            fill={theme.currentLineColor}
          />
        )}
      </svg>
    </div>
  );
}
