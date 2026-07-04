import React from 'react';
import clsx from 'clsx';
import Link from '@docusaurus/Link';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import Layout from '@theme/Layout';
import Heading from '@theme/Heading';
import BrowserOnly from '@docusaurus/BrowserOnly';

import styles from './index.module.css';

function LiveDemo() {
  return (
    <BrowserOnly fallback={<div>Loading Demo...</div>}>
      {() => {
        // Docusaurus環境内でライブラリを動的に読み込む
        const { useKifuPlayer, ShogiBoard, ControlBar, ThemeProvider, resolveTheme } = require('react-kifu-player');
        
        // 簡単な初期局面
        const sampleKifu = `
手合割：平手
手数----指手---------消費時間--
   1 ２六歩(27)   ( 0:00/00:00:00)
   2 ８四歩(83)   ( 0:00/00:00:00)
   3 ２五歩(26)   ( 0:00/00:00:00)
   4 ８五歩(84)   ( 0:00/00:00:00)
   5 ７八金(69)   ( 0:00/00:00:00)
`;
        const player = useKifuPlayer(sampleKifu);
        const glassTheme = resolveTheme('imageGlass');

        return (
          <ThemeProvider value={glassTheme}>
            <div style={{ maxWidth: 450, margin: '0 auto', background: '#8bc0d0', padding: 20, borderRadius: 16, boxShadow: '0 10px 30px rgba(0,0,0,0.15)' }}>
              <ShogiBoard 
                position={player.position}
                lastMove={player.lastMoveCoords || undefined}
                onForward={player.forward}
                onBackward={player.backward}
              />
              <div style={{ marginTop: 16 }}>
                <ControlBar
                  currentPly={player.currentPly}
                  totalPlies={player.totalPlies}
                  onForward={player.forward}
                  onBackward={player.backward}
                  onGoToStart={player.goToStart}
                  onGoToEnd={player.goToEnd}
                />
              </div>
            </div>
          </ThemeProvider>
        );
      }}
    </BrowserOnly>
  );
}

function HomepageHeader() {
  const {siteConfig} = useDocusaurusContext();
  return (
    <header className={clsx('hero', styles.heroBanner)} style={{ backgroundColor: '#1b1b1d', color: '#fff', minHeight: '80vh', display: 'flex', alignItems: 'center' }}>
      <div className="container">
        <div className="row" style={{ alignItems: 'center' }}>
          <div className="col col--6">
            <Heading as="h1" className="hero__title" style={{ fontSize: '3rem', fontWeight: 800 }}>
              {siteConfig.title}
            </Heading>
            <p className="hero__subtitle" style={{ color: '#aaa', margin: '20px 0' }}>{siteConfig.tagline}</p>
            <p style={{ fontSize: '1.2rem', marginBottom: '30px' }}>
              完全Reactネイティブ。美しく、カスタマイズ可能な将棋UIコンポーネント。
              ヘッドレス設計で独自の将棋アプリ開発を加速します。
            </p>
            <div className={styles.buttons}>
              <Link
                className="button button--primary button--lg"
                to="/docs/intro"
                style={{ borderRadius: 30, padding: '0.8rem 2rem' }}>
                ドキュメントを読む
              </Link>
              <Link
                className="button button--secondary button--lg"
                href="https://github.com/ArakiYuki/react-kifu-player"
                style={{ borderRadius: 30, padding: '0.8rem 2rem', marginLeft: '1rem' }}>
                GitHub
              </Link>
            </div>
          </div>
          <div className="col col--6">
            <LiveDemo />
          </div>
        </div>
      </div>
    </header>
  );
}

export default function Home(): ReactNode {
  const {siteConfig} = useDocusaurusContext();
  return (
    <Layout
      title={siteConfig.title}
      description={siteConfig.tagline}>
      <HomepageHeader />
      <main style={{ padding: '4rem 0', textAlign: 'center', backgroundColor: '#f5f6f7' }}>
        <div className="container">
          <h2>なぜ react-kifu-player を選ぶのか？</h2>
          <div className="row" style={{ marginTop: '3rem' }}>
            <div className="col col--4">
              <h3>🎨 圧倒的な美しさ</h3>
              <p>ガラス調や木目調など、モダンなUIに馴染む高品質なテーマを標準搭載。CSSレスで簡単に適用できます。</p>
            </div>
            <div className="col col--4">
              <h3>⚛️ Reactネイティブ</h3>
              <p>状態とUIが完全に分離されており、DOM操作を伴わないクリーンなReactパラダイムで記述されています。</p>
            </div>
            <div className="col col--4">
              <h3>🛡️ TypeScript完全対応</h3>
              <p>厳密な型定義により、開発時の補完が強力に効きます。予期せぬバグを防ぎ、安全な開発をサポートします。</p>
            </div>
          </div>
        </div>
      </main>
    </Layout>
  );
}
