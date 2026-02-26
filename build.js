#!/usr/bin/env node
/**
 * Neon Defense 빌드 스크립트
 *
 * 동작:
 *   1. JSX 파일을 Babel로 JS로 컴파일
 *   2. 정적 에셋(css, audio, 일반 js) 복사
 *   3. index.html에서 Babel CDN 제거 + type="text/babel" 제거 + .jsx → .js
 *   4. dist/ 폴더 → neon-defense.zip 압축
 *
 * 사용법:
 *   npm install
 *   npm run build      (또는: node build.js)
 */

'use strict';

const fs = require('fs');
const path = require('path');
const babel = require('@babel/core');

const ROOT = __dirname;
const DIST = path.join(ROOT, 'dist');
const ZIP_PATH = path.join(ROOT, 'neon-defense.zip');

// 복사할 디렉토리/파일 목록 (jsx 제외한 모든 정적 파일)
const STATIC_DIRS = ['css', 'audio'];

// ─────────────────────────────────────────────
// 메인
// ─────────────────────────────────────────────
async function main() {
  console.log('');
  console.log('╔══════════════════════════════════╗');
  console.log('║   Neon Defense 빌드 시작          ║');
  console.log('╚══════════════════════════════════╝');
  console.log('');

  step(1, 'dist/ 초기화');
  cleanDist();

  step(2, '정적 파일 복사 (css, audio)');
  for (const dir of STATIC_DIRS) {
    const src = path.join(ROOT, dir);
    if (fs.existsSync(src)) {
      copyDir(src, path.join(DIST, dir));
      console.log(`     ✓ ${dir}/`);
    }
  }

  step(3, 'JS 파일 복사 + JSX 컴파일');
  processJsDir(path.join(ROOT, 'js'), path.join(DIST, 'js'));

  step(4, 'index.html 변환');
  buildIndexHtml();

  step(5, 'zip 압축');
  await createZip();

  console.log('');
  console.log('╔══════════════════════════════════╗');
  console.log('║   ✅ 빌드 완료!                   ║');
  console.log('╚══════════════════════════════════╝');
  console.log('');
  console.log('  📁 dist/             — 빌드 결과물');
  console.log('  📦 neon-defense.zip  — 업로드용 zip');
  console.log('');
}

// ─────────────────────────────────────────────
// 함수 구현
// ─────────────────────────────────────────────

function step(n, msg) {
  console.log(`\n[${n}/5] ${msg}`);
}

function cleanDist() {
  if (fs.existsSync(DIST)) {
    fs.rmSync(DIST, { recursive: true, force: true });
  }
  fs.mkdirSync(DIST, { recursive: true });
  console.log('     ✓ dist/ 초기화');
}

/** 디렉토리를 재귀적으로 복사 */
function copyDir(src, dest) {
  fs.mkdirSync(dest, { recursive: true });
  for (const name of fs.readdirSync(src)) {
    const srcPath = path.join(src, name);
    const destPath = path.join(dest, name);
    if (fs.statSync(srcPath).isDirectory()) {
      copyDir(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

/** js/ 디렉토리: .jsx → Babel 컴파일 → .js 저장, .js → 그대로 복사 */
function processJsDir(srcDir, destDir) {
  fs.mkdirSync(destDir, { recursive: true });

  for (const name of fs.readdirSync(srcDir)) {
    const srcPath = path.join(srcDir, name);
    const destPath = path.join(destDir, name);

    if (fs.statSync(srcPath).isDirectory()) {
      processJsDir(srcPath, destPath);
      continue;
    }

    if (name.endsWith('.jsx')) {
      // JSX → JS 컴파일
      try {
        const result = babel.transformFileSync(srcPath, {
          presets: ['@babel/preset-react'],
          // 소스맵 없이 깔끔하게 출력
          sourceMaps: false,
          comments: true,
          compact: false,
        });
        const outPath = destPath.replace(/\.jsx$/, '.js');
        fs.writeFileSync(outPath, result.code, 'utf8');
        const rel = path.relative(path.join(ROOT, 'js'), srcPath);
        console.log(`     ⚡ ${rel} → ${rel.replace(/\.jsx$/, '.js')}`);
      } catch (err) {
        console.error(`     ❌ 컴파일 실패: ${srcPath}`);
        console.error(`        ${err.message}`);
        process.exit(1);
      }
    } else if (name.endsWith('.js')) {
      // 일반 JS는 그대로 복사
      fs.copyFileSync(srcPath, destPath);
      const rel = path.relative(path.join(ROOT, 'js'), srcPath);
      console.log(`     • ${rel}`);
    }
    // 그 외 파일(.md 등)은 무시
  }
}

/**
 * index.html 변환:
 *  - Babel standalone CDN 스크립트 태그 제거
 *  - <script type="text/babel" src="...xxx.jsx"> → <script src="...xxx.js">
 */
function buildIndexHtml() {
  let html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');

  // Babel standalone CDN 제거 (런타임 JSX 변환 불필요)
  html = html.replace(
    /[ \t]*<script src="https:\/\/cdnjs\.cloudflare\.com\/ajax\/libs\/babel-standalone[^"]*"><\/script>\n?/g,
    ''
  );

  // type="text/babel" 제거 + .jsx → .js 변환
  // <script type="text/babel" src="path/to/file.jsx">
  // → <script src="path/to/file.js">
  html = html.replace(
    /<script type="text\/babel" src="([^"]+)\.jsx"/g,
    '<script src="$1.js"'
  );

  fs.writeFileSync(path.join(DIST, 'index.html'), html, 'utf8');
  console.log('     ✓ index.html → Babel CDN 제거, .jsx → .js 변환 완료');
}

/** dist/ 폴더를 zip으로 압축 */
function createZip() {
  return new Promise((resolve, reject) => {
    let archiver;
    try {
      archiver = require('archiver');
    } catch {
      console.error('     ❌ archiver 패키지가 없습니다. npm install 을 먼저 실행하세요.');
      process.exit(1);
    }

    // 기존 zip 삭제
    if (fs.existsSync(ZIP_PATH)) {
      fs.unlinkSync(ZIP_PATH);
    }

    const output = fs.createWriteStream(ZIP_PATH);
    const archive = archiver('zip', { zlib: { level: 9 } });

    output.on('close', () => {
      const sizeKb = Math.round(archive.pointer() / 1024);
      console.log(`     ✓ neon-defense.zip 생성 완료 (${sizeKb} KB)`);
      resolve();
    });

    archive.on('warning', (err) => {
      if (err.code !== 'ENOENT') reject(err);
    });

    archive.on('error', reject);

    archive.pipe(output);
    // dist/ 폴더 내부 파일들을 zip 루트에 배치
    archive.directory(DIST + path.sep, false);
    archive.finalize();
  });
}

// ─────────────────────────────────────────────
// 실행
// ─────────────────────────────────────────────
main().catch((err) => {
  console.error('\n❌ 빌드 실패:', err.message);
  process.exit(1);
});
