// 적 스프라이트 좌우 미러링 (캐논 방향 = 오른쪽)
//
// 배경: AI 생성 PNG가 대부분 왼쪽을 향하고 있어, 게임의 facing 로직
// (canonical=right 가정)과 부호가 맞지 않음. 한 번 좌우 미러로 통일.
//
// 사용:
//   node scripts/mirror-enemies.js [--dry-run]
//   node scripts/mirror-enemies.js --revert     # 다시 원래대로
//
// 기본 동작: assets/enemies/*.png 를 모두 좌우 미러로 덮어쓰기

const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

const ROOT = path.resolve(__dirname, '..');
const ENEMY_DIR = path.join(ROOT, 'assets', 'enemies');

const args = process.argv.slice(2);
const DRY_RUN = args.includes('--dry-run');

(async () => {
  if (!fs.existsSync(ENEMY_DIR)) {
    console.error('not found:', ENEMY_DIR);
    process.exit(1);
  }
  const files = fs.readdirSync(ENEMY_DIR).filter(f => f.endsWith('.png'));
  console.log(`대상: ${files.length}개 PNG (${DRY_RUN ? 'DRY-RUN' : '실제 적용'})`);

  for (const file of files) {
    const filePath = path.join(ENEMY_DIR, file);
    const buf = await sharp(filePath).flop().png({ compressionLevel: 9 }).toBuffer();
    if (DRY_RUN) {
      console.log(`  [skip] ${file}`);
    } else {
      fs.writeFileSync(filePath, buf);
      console.log(`  ✓ ${file} (${buf.length} bytes)`);
    }
  }
  console.log(DRY_RUN ? '\n(dry-run 종료)' : '\n✅ 미러링 완료');
})().catch(e => { console.error(e); process.exit(1); });
