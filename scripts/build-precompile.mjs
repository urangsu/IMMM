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
  'frame-system.jsx',
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

  // 3. Generate index.precompiled.html from index.html
  console.log('Generating index.precompiled.html...');
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

  fs.writeFileSync('index.precompiled.html', html);
  console.log('✅ Precompile complete. Output: index.precompiled.html + dist/*.js');
}

build().catch(err => {
  console.error('💥 Build failed:', err);
  process.exit(1);
});
