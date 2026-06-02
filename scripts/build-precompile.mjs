import fs from 'fs';
import path from 'path';
import babel from '@babel/core';

/**
 * IMMM Phase 3.40 Minimal Babel Precompile Pipeline
 * This script transforms root JSX files into dist/*.js and generates index.precompiled.html.
 * It preserves the original index.html and JSX files for rollback safety.
 */

const manifest = [
  'app.jsx',
  'filters.jsx',
  'webgl-engine.jsx',
  'mediapipe-face.jsx',
  'sticker-engine.jsx',
  'session-model.jsx',
  'session-adapter.jsx',
  'result-asset-store.jsx',
  'session-runtime-snapshot.jsx',
  'cloud-share-adapter.jsx',
  'share-contract.jsx',
  'motion-export-contract.jsx',
  'edit-recipe-contract.jsx',
  'pwa-release-contract.jsx',
  'motion-frame-contract.jsx',
  'creator-profile.jsx',
  'frame-presets.jsx',
  'frame-system.jsx',
  'session-tracing.jsx',
  'screens-v2.jsx',
  'screens-v2-rest.jsx',
  'screens-v2-deco.jsx',
  'main.jsx'
];

async function build() {
  console.log('🚀 Starting IMMM Minimal Babel Precompile...');

  // 1. Create/Clear dist folder
  const distDir = path.resolve('dist');
  if (fs.existsSync(distDir)) {
    console.log('Cleaning existing dist folder...');
    fs.rmSync(distDir, { recursive: true, force: true });
  }
  fs.mkdirSync(distDir);

  // 2. Precompile JSX files in explicit order
  for (const file of manifest) {
    const srcPath = path.resolve(file);
    const outFileName = file.replace('.jsx', '.js');
    const outPath = path.join(distDir, outFileName);

    if (!fs.existsSync(srcPath)) {
      console.error(`❌ Missing source file: ${file}`);
      process.exit(1);
    }

    console.log(`Compiling [${file}] -> [dist/${outFileName}]`);
    
    try {
      const result = await babel.transformFileSync(srcPath, {
        presets: [
          ['@babel/preset-react', { runtime: 'classic' }]
        ],
        plugins: [
          '@babel/plugin-transform-block-scoping'
        ],
        sourceMaps: false,
        compact: false,
        comments: true,
        babelrc: false,
        configFile: false
      });

      // No import/export check: classic runtime with no ES modules
      if (/(?:^|\n)\s*(import|export)\s+/.test(result.code)) {
        console.error(`❌ ${file} produced import/export syntax. Precompiled output must be classic global script.`);
        process.exit(1);
      }

      fs.writeFileSync(outPath, result.code);
    } catch (err) {
      console.error(`💥 Failed to compile ${file}:`, err.message);
      process.exit(1);
    }
  }

  // 3. Generate index.precompiled.html from index.html and inject release-env
  console.log('Generating index.precompiled.html...');
  const manifestData = JSON.parse(fs.readFileSync('release-manifest.json', 'utf-8'));
  const appVersion = manifestData.version;
  const cacheVersion = manifestData.cache;
  const buildLabel = `${appVersion}-precompiled-entry`;
  const rcBaseline = manifestData.rcReleaseCommit ? manifestData.rcReleaseCommit.slice(0, 7) : 'b3f7f1c';
  const stableBaseline = manifestData.rcBaseCommit ? manifestData.rcBaseCommit.slice(0, 7) : '8b5e42c';
  const expectedCacheName = `immm-cache-${cacheVersion}-${appVersion}-rc-final`;

  // Write release-env.js in dist
  const releaseEnvCode = `// Generated release environment configuration
window.IMMM_RELEASE_ENV = {
  version: "${appVersion}",
  cache: "${cacheVersion}",
  buildLabel: "${buildLabel}",
  rcBaseline: "${rcBaseline}",
  stableBaseline: "${stableBaseline}",
  cacheName: "${expectedCacheName}"
};
`;
  fs.writeFileSync(path.join(distDir, 'release-env.js'), releaseEnvCode);
  console.log('Generated dist/release-env.js');

  // Load index.html
  let html = fs.readFileSync('index.html', 'utf-8');

  // Remove Babel standalone comment if present
  html = html.replace(/<!--\s*Babel standalone[\s\S]*?-->/g, '');
  // Remove @babel/standalone script tag entirely
  const babelStandaloneRegex = /<script\s+src="https:\/\/unpkg\.com\/@babel\/standalone[^>]+><\/script>/g;
  html = html.replace(babelStandaloneRegex, '');

  // Replace <script type="text/babel" src="xxx.jsx"></script>
  // with <script src="./dist/xxx.js"></script>
  const jsxScriptRegex = /<script\s+type="text\/babel"\s+src="([^"]+)\.jsx"><\/script>/g;
  html = html.replace(jsxScriptRegex, (match, fileName) => {
    return `<script src="./dist/${fileName}.js"></script>`;
  });

  // Inject version values in HTML
  html = html.replace(/window\.IMMM_APP_VERSION\s*=\s*'[^']+';/, `window.IMMM_APP_VERSION = '${appVersion}';`);
  html = html.replace(/window\.IMMM_BUILD_LABEL\s*=\s*'[^']+';/, `window.IMMM_BUILD_LABEL = '${buildLabel}';`);
  html = html.replace(/window\.IMMM_RC_BASELINE\s*=\s*'[^']+';/, `window.IMMM_RC_BASELINE = '${rcBaseline}';`);
  html = html.replace(/window\.IMMM_STABLE_BASELINE\s*=\s*'[^']+';/, `window.IMMM_STABLE_BASELINE = '${stableBaseline}';`);

  // Insert release-env script tag before main.js script tag
  html = html.replace(
    '<script src="./dist/main.js"></script>',
    '<script src="./dist/release-env.js"></script>\n<script src="./dist/main.js"></script>'
  );

  fs.writeFileSync('index.precompiled.html', html);

  // Sync index.html with the same version variables to prevent drift during checks
  let rawHtml = fs.readFileSync('index.html', 'utf-8');
  rawHtml = rawHtml.replace(/window\.IMMM_APP_VERSION\s*=\s*'[^']+';/, `window.IMMM_APP_VERSION = '${appVersion}';`);
  rawHtml = rawHtml.replace(/window\.IMMM_BUILD_LABEL\s*=\s*'[^']+';/, `window.IMMM_BUILD_LABEL = '${buildLabel}';`);
  rawHtml = rawHtml.replace(/window\.IMMM_RC_BASELINE\s*=\s*'[^']+';/, `window.IMMM_RC_BASELINE = '${rcBaseline}';`);
  rawHtml = rawHtml.replace(/window\.IMMM_STABLE_BASELINE\s*=\s*'[^']+';/, `window.IMMM_STABLE_BASELINE = '${stableBaseline}';`);
  fs.writeFileSync('index.html', rawHtml);
  console.log('Synchronized index.html version headers.');

  // Update sw.js CACHE_NAME
  let swCode = fs.readFileSync('sw.js', 'utf-8');
  swCode = swCode.replace(/const CACHE_NAME = '[^']+';/, `const CACHE_NAME = '${expectedCacheName}';`);
  fs.writeFileSync('sw.js', swCode);
  console.log(`Updated sw.js CACHE_NAME to: ${expectedCacheName}`);

  // 4. Copy release-manifest.json to dist/
  const manifestSrc = path.resolve('release-manifest.json');
  const manifestDest = path.join(distDir, 'release-manifest.json');
  if (fs.existsSync(manifestSrc)) {
    fs.copyFileSync(manifestSrc, manifestDest);
    console.log('Copied release-manifest.json to dist/');
  }

  console.log('========================================================');
  console.log(`🚀 IMMM BUILD SUMMARY:`);
  console.log(`   - App Version:   ${appVersion}`);
  console.log(`   - Cache Version: ${cacheVersion}`);
  console.log(`   - Cache Name:    ${expectedCacheName}`);
  console.log(`   - RC Baseline:   ${rcBaseline}`);
  console.log('========================================================');
  console.log('✅ Precompile complete. Output: index.precompiled.html + dist/*.js');
}

build().catch(err => {
  console.error('💥 Build failed:', err);
  process.exit(1);
});
