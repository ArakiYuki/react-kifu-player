import fs from 'fs';
import path from 'path';

// ---------------------------------------------------------------------------
// Types and Constants
// ---------------------------------------------------------------------------

type ThemeType = 'wood' | 'dark' | 'glass';

interface PieceInfo {
  id: string;
  char: string;
  isPromoted: boolean;
}

const pieces: PieceInfo[] = [
  { id: 'FU', char: '歩', isPromoted: false },
  { id: 'KY', char: '香', isPromoted: false },
  { id: 'KE', char: '桂', isPromoted: false },
  { id: 'GI', char: '銀', isPromoted: false },
  { id: 'KI', char: '金', isPromoted: false },
  { id: 'KA', char: '角', isPromoted: false },
  { id: 'HI', char: '飛', isPromoted: false },
  { id: 'OU', char: '玉', isPromoted: false }, // 通常は玉のみで対応（王将を使いたい場合は要拡張）
  { id: 'TO', char: 'と', isPromoted: true },
  { id: 'NY', char: '杏', isPromoted: true },
  { id: 'NK', char: '圭', isPromoted: true },
  { id: 'NG', char: '全', isPromoted: true },
  { id: 'UM', char: '馬', isPromoted: true },
  { id: 'RY', char: '龍', isPromoted: true },
];

// 将棋駒の形状 (五角形) - 100x110のキャンバス
// 実際の将棋の駒に近い比率 (底辺が広く、肩が少し狭い)
const piecePolygon = "18,30 50,5 82,30 93,105 7,105";

// フォントファミリの定義 (多くの環境で明朝体が表示されるように)
const fontFamily = "'Noto Serif JP', 'Yu Mincho', 'Hiragino Mincho ProN', serif";

// ---------------------------------------------------------------------------
// SVG Generators
// ---------------------------------------------------------------------------

function generateWoodPiece(piece: PieceInfo): string {
  const textColor = piece.isPromoted ? '#d32f2f' : '#1a0a00';
  
  return `<svg width="100" height="110" viewBox="0 0 100 110" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <!-- 木目風の縦グラデーション -->
    <linearGradient id="woodGrad" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#fdf4e3" />
      <stop offset="50%" stop-color="#eecda3" />
      <stop offset="100%" stop-color="#d4aa70" />
    </linearGradient>
    <filter id="shadow" x="-10%" y="-10%" width="120%" height="120%">
      <feDropShadow dx="1" dy="2" stdDeviation="1" flood-opacity="0.4"/>
    </filter>
  </defs>
  
  <polygon 
    points="${piecePolygon}" 
    fill="url(#woodGrad)" 
    stroke="#8b7340" 
    stroke-width="1.5"
    filter="url(#shadow)"
  />
  
  <text 
    x="50" y="62" 
    font-family="${fontFamily}" font-size="52" font-weight="900" 
    fill="${textColor}" text-anchor="middle" dominant-baseline="central"
  >${piece.char}</text>
</svg>`;
}

function generateDarkPiece(piece: PieceInfo): string {
  const textColor = piece.isPromoted ? '#ffb74d' : '#e0e0e0';
  
  return `<svg width="100" height="110" viewBox="0 0 100 110" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="darkGrad" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#3a3a4a" />
      <stop offset="100%" stop-color="#1e1e2e" />
    </linearGradient>
    <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="2" stdDeviation="2" flood-color="#000000" flood-opacity="0.8"/>
    </filter>
  </defs>
  
  <polygon 
    points="${piecePolygon}" 
    fill="url(#darkGrad)" 
    stroke="#555577" 
    stroke-width="2"
    filter="url(#glow)"
  />
  
  <text 
    x="50" y="62" 
    font-family="${fontFamily}" font-size="52" font-weight="900" 
    fill="${textColor}" text-anchor="middle" dominant-baseline="central"
  >${piece.char}</text>
</svg>`;
}

function generateGlassPiece(piece: PieceInfo): string {
  // グラスモーフィズム調：全体的に半透明で、白い枠線と輝き
  const textColor = piece.isPromoted ? '#ff4081' : '#ffffff';
  
  return `<svg width="100" height="110" viewBox="0 0 100 110" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="glassGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="rgba(255, 255, 255, 0.4)" />
      <stop offset="100%" stop-color="rgba(255, 255, 255, 0.1)" />
    </linearGradient>
    <filter id="blur">
      <feGaussianBlur stdDeviation="1.5" />
    </filter>
    <!-- ドロップシャドウ -->
    <filter id="glassShadow" x="-10%" y="-10%" width="120%" height="120%">
      <feDropShadow dx="0" dy="4" stdDeviation="3" flood-opacity="0.15"/>
    </filter>
  </defs>
  
  <polygon 
    points="${piecePolygon}" 
    fill="url(#glassGrad)" 
    stroke="rgba(255, 255, 255, 0.6)" 
    stroke-width="1.5"
    filter="url(#glassShadow)"
  />
  
  <!-- ガラスのハイライト（左上） -->
  <polygon 
    points="18,37 48,10 50,10 20,38" 
    fill="rgba(255, 255, 255, 0.5)" 
  />
  
  <text 
    x="50" y="62" 
    font-family="${fontFamily}" font-size="52" font-weight="900" 
    fill="${textColor}" text-anchor="middle" dominant-baseline="central"
    filter="url(#blur)" opacity="0.4"
  >${piece.char}</text>
  
  <text 
    x="50" y="62" 
    font-family="${fontFamily}" font-size="52" font-weight="900" 
    fill="${textColor}" text-anchor="middle" dominant-baseline="central"
  >${piece.char}</text>
</svg>`;
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  const woodDir = path.join(process.cwd(), 'src/assets/pieces/wood');
  const darkDir = path.join(process.cwd(), 'src/assets/pieces/dark');
  const glassDir = path.join(process.cwd(), 'src/assets/pieces/glass');

  fs.mkdirSync(woodDir, { recursive: true });
  fs.mkdirSync(darkDir, { recursive: true });
  fs.mkdirSync(glassDir, { recursive: true });

  const imports: string[] = [];
  const woodImageMap: string[] = [];
  const darkImageMap: string[] = [];
  const glassImageMap: string[] = [];

  for (const piece of pieces) {
    const woodSvg = generateWoodPiece(piece);
    const darkSvg = generateDarkPiece(piece);
    const glassSvg = generateGlassPiece(piece);

    fs.writeFileSync(path.join(woodDir, `${piece.id}.svg`), woodSvg, 'utf-8');
    fs.writeFileSync(path.join(darkDir, `${piece.id}.svg`), darkSvg, 'utf-8');
    fs.writeFileSync(path.join(glassDir, `${piece.id}.svg`), glassSvg, 'utf-8');

    imports.push(`import wood_${piece.id} from '../assets/pieces/wood/${piece.id}.svg';`);
    imports.push(`import dark_${piece.id} from '../assets/pieces/dark/${piece.id}.svg';`);
    imports.push(`import glass_${piece.id} from '../assets/pieces/glass/${piece.id}.svg';`);

    woodImageMap.push(`  ${piece.id}: wood_${piece.id},`);
    darkImageMap.push(`  ${piece.id}: dark_${piece.id},`);
    glassImageMap.push(`  ${piece.id}: glass_${piece.id},`);
  }

  const outPath = path.join(process.cwd(), 'src/themes/imageThemes.ts');
  const code = `// =============================================================================
// Auto-generated SVG Image Themes
// Generated by scripts/generate_pieces.ts
// =============================================================================
import type { KifuTheme } from '../types';
import { richTheme, textTheme } from './baseThemes';

${imports.join('\n')}

// ---------------------------------------------------------------------------
// Theme Images
// ---------------------------------------------------------------------------

const woodImages: Record<string, string> = {
${woodImageMap.join('\n')}
};

const darkImages: Record<string, string> = {
${darkImageMap.join('\n')}
};

const glassImages: Record<string, string> = {
${glassImageMap.join('\n')}
};

// ---------------------------------------------------------------------------
// Themes
// ---------------------------------------------------------------------------

/** Wood Theme: 木目調のグラデーション画像駒 */
export const imageWoodTheme: KifuTheme = {
  ...richTheme,
  name: 'imageWood',
  piece: {
    ...richTheme.piece,
    mode: 'image',
    senteImages: woodImages,
  },
};

/** Dark Theme: 黒基調のスタイリッシュな駒とダーク盤面 */
export const imageDarkTheme: KifuTheme = {
  ...textTheme,
  name: 'imageDark',
  board: {
    ...textTheme.board,
    background: '#121212',
    gridColor: '#444444',
    starPointColor: '#444444',
    highlightColor: 'rgba(255, 255, 255, 0.1)',
    borderColor: '#333333',
    labelColor: '#666666',
  },
  hand: {
    ...textTheme.hand,
    background: '#1e1e1e',
    textColor: '#e0e0e0',
    borderColor: '#333333',
  },
  piece: {
    ...textTheme.piece,
    mode: 'image',
    senteImages: darkImages,
  },
};

/** Glass Theme: 半透明・グラスモーフィズム調 */
export const imageGlassTheme: KifuTheme = {
  ...richTheme,
  name: 'imageGlass',
  board: {
    ...richTheme.board,
    background: 'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)',
    gridColor: 'rgba(0,0,0,0.2)',
    starPointColor: 'rgba(0,0,0,0.2)',
    highlightColor: 'rgba(255, 255, 255, 0.4)',
    borderColor: 'rgba(255,255,255,0.5)',
    labelColor: 'rgba(0,0,0,0.4)',
  },
  hand: {
    ...richTheme.hand,
    background: 'rgba(255,255,255,0.3)',
    textColor: '#333',
    borderColor: 'rgba(255,255,255,0.5)',
  },
  piece: {
    ...richTheme.piece,
    mode: 'image',
    senteImages: glassImages,
  },
};
`;

  fs.writeFileSync(outPath, code, 'utf-8');
  console.log('Successfully generated src/themes/imageThemes.ts and SVG files.');
}

main().catch(console.error);
