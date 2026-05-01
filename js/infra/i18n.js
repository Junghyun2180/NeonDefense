// Neon Defense - lightweight UI translation layer
// CDN/Babel 환경이라 전역 객체로 제공한다.
const I18n = (() => {
  const STORAGE_KEY = 'neonDefense_language_v1';
  const SUPPORTED = ['ko', 'en'];
  const attrOriginals = new WeakMap();
  const textOriginals = new WeakMap();
  let observer = null;
  let scheduled = false;

  const entries = [
    // Main shell
    ['HOME', '홈'],
    ['CODEX', '도감'],
    ['META', '메타'],
    ['PROFILE', '프로필'],
    ['RANK', '랭킹'],
    ['READY TO DEPLOY', '출격 준비'],
    ['ARSENAL DATA', '병기 데이터'],
    ['UPGRADE GRID', '업그레이드 그리드'],
    ['OPERATOR', '오퍼레이터'],
    ['LEADERBOARD', '리더보드'],
    ['Main menu', '메인 메뉴'],
    ['NEON DEFENSE', '네온 디펜스'],
    ['HOLO-PROJECTION · ARSENAL PREVIEW', '홀로 투영 · 병기 미리보기'],
    ['MISSION SELECT', '임무 선택'],
    ['INITIATE DEPLOYMENT', '출격 시작'],
    ['OPEN RUN SELECT', '런 선택 열기'],
    ['OPEN ENDLESS', '엔드리스 시작'],
    ['ALL SYSTEMS NOMINAL', '전 시스템 정상'],
    ['LAST SESSION', '마지막 세션'],
    ['NO ACTIVE CHECKPOINT', '활성 체크포인트 없음'],
    ['RESUME', '이어하기'],
    ['Stage star progress', '스테이지 별점 진행도'],
    ['Tier 4 fire tower preview', '티어 4 화염 타워 미리보기'],
    ['Tier 4 water tower preview', '티어 4 냉기 타워 미리보기'],
    ['Tier 4 electric tower preview', '티어 4 전격 타워 미리보기'],
    ['Tier 4 wind tower preview', '티어 4 질풍 타워 미리보기'],
    ['Tier 4 void tower preview', '티어 4 공허 타워 미리보기'],
    ['Tier 4 light tower preview', '티어 4 광휘 타워 미리보기'],

    // Codex/Profile/Meta/Rank
    ['COLLECTION SYSTEM UNAVAILABLE', '도감 시스템을 사용할 수 없음'],
    ['CATEGORY', '분류'],
    ['TOWER', '타워'],
    ['T4 ROLE', 'T4 역할'],
    ['SUPPORT', '서포트'],
    ['ENEMY', '적'],
    ['FILTER', '필터'],
    ['ALL', '전체'],
    ['OWN', '보유'],
    ['LCK', '잠김'],
    ['COMPLETION', '완성도'],
    ['GRID', '그리드'],
    ['AUTO-RECORD ON GENERATE', '생성 시 자동 기록'],
    ['NO CARDS MATCH FILTER', '조건에 맞는 카드 없음'],
    ['INSPECTOR', '상세 정보'],
    ['SELECT A CARD', '카드를 선택하세요'],
    ['UNKNOWN', '미확인'],
    ['GENERATED', '생성 횟수'],
    ['LEVEL', '레벨'],
    ['NEXT LV PROGRESS', '다음 레벨 진행도'],
    ['KILLS', '처치'],
    ['TIER', '티어'],
    ['ELEMENT', '속성'],
    ['FIRE', '화염'],
    ['WATER', '냉기'],
    ['ELECTRIC', '전격'],
    ['WIND', '질풍'],
    ['VOID', '공허'],
    ['LIGHT', '광휘'],
    ['LOCKED', '잠김'],
    ['GAME에서 처치 시 해금', '게임에서 처치 시 해금'],
    ['GAME에서 생성 시 해금', '게임에서 생성 시 해금'],
    ['5회 생성당 카드 LV +1 (MAX 10)', '5회 생성당 카드 레벨 +1 (최대 10)'],
    ['OPERATOR PROFILE', '오퍼레이터 프로필'],
    ['ACTIVE · STANDBY', '활성 · 대기'],
    ['CRYSTALS', '크리스탈'],
    ['HIGHEST SECTOR', '최고 섹터'],
    ['CAMPAIGN CLEARS', '캠페인 클리어'],
    ['TOTAL RUNS', '총 런 수'],
    ['BEST GRADE', '최고 등급'],
    ['ENDLESS HIGH', '엔드리스 최고'],
    ['FASTEST CLEAR', '최단 클리어'],
    ['ACHIEVEMENTS', '업적'],
    ['META PROGRESSION', '메타 진행도'],
    ['NODE LV', '노드 레벨'],
    ['UPGRADE NODES', '업그레이드 노드'],
    ['MAX LV REACHED', '최대 레벨 달성'],
    ['HIDDEN OBJECTIVE', '숨겨진 목표'],
    ['NO ACHIEVEMENTS MATCH FILTER', '조건에 맞는 업적 없음'],
    ['RECENT RUNS', '최근 기록'],
    ['NO RUN HISTORY YET', '아직 런 기록이 없습니다'],
    ['MODE', '모드'],
    ['STAGE', '스테이지'],
    ['GRADE', '등급'],
    ['TIME', '시간'],
    ['DATE', '날짜'],
    ['META UPGRADES UNAVAILABLE', '메타 업그레이드를 사용할 수 없음'],
    ['LOADING META PROGRESS…', '메타 진행도 불러오는 중...'],
    ['ECONOMY', '경제'],
    ['COMBAT', '전투'],
    ['SURVIVAL', '생존'],
    ['NEON CRYSTAL · BALANCE', '네온 크리스탈 · 잔액'],
    ['NODES MAXED', '최대 노드'],
    ['TOTAL NODE LV', '총 노드 레벨'],
    ['EARN ON CLEAR / SECTOR PROGRESSION', '클리어 / 섹터 진행으로 획득'],
    ['UPGRADE TREE · 3 BRANCHES', '업그레이드 트리 · 3개 분기'],
    ['NODE INSPECTOR', '노드 상세'],
    ['CURRENT', '현재'],
    ['NEXT', '다음'],
    ['COST', '비용'],
    ['NODE MAXED', '노드 최대'],
    ['MODE FILTER', '모드 필터'],
    ['CAMPAIGN', '캠페인'],
    ['STANDARD', '스탠다드'],
    ['DAILY', '일일'],
    ['ENDLESS', '엔드리스'],
    ['TOTAL ENTRIES', '전체 기록'],
    ['NO PODIUM ENTRIES YET', '아직 포디움 기록 없음'],
    ['FULL RANKINGS', '전체 순위'],
    ['NO RECORDS · PLAY TO SUBMIT YOUR FIRST ENTRY', '기록 없음 · 플레이하면 첫 기록이 등록됩니다'],
    ['LOCAL LEADERBOARD · MAX 10 PER MODE', '로컬 리더보드 · 모드당 최대 10개'],
    ['AUTO-RECORD ON CLEAR', '클리어 시 자동 기록'],
    ['LIVES', '목숨'],

    // Game HUD
    ['MAIN', '메인'],
    ['OPERATION', '작전'],
    ['ACTIVE', '교전 중'],
    ['STANDBY', '대기'],
    ['WAVE', '웨이브'],
    ['SECTOR', '섹터'],
    ['GOLD', '골드'],
    ['LIFE', '목숨'],
    ['ENDLESS', '엔드리스'],
    ['DAILY', '일일'],
    ['RUN', '런'],
    ['PATHS', '경로'],
    ['ABORT OPERATION', '작전 중단'],
    ['CANCEL', '취소'],
    ['EXIT', '나가기'],
    ['SPEED', '속도'],
    ['IN COMBAT', '전투 중'],
    ['DEPLOY', '출격'],
    ['Toggle BGM', 'BGM 토글'],
    ['Toggle SFX', '효과음 토글'],
    ['Help', '도움말'],
    ['Options', '옵션'],
    ['OPTIONS', '옵션'],
    ['Open Options', '옵션 열기'],
    ['SELECTED UNIT', '선택 유닛'],
    ['NO UNIT SELECTED', '선택된 유닛 없음'],
    ['ATK', '공격'],
    ['RNG', '사거리'],
    ['SPD', '속도'],
    ['DPS', 'DPS'],
    ['FUSE', '합성'],
    ['DECOMM', '해체'],
    ['SUPPRESSED', '억제됨'],
    ['EMPOWERED', '강화됨'],
    ['OPERATIONAL', '정상'],
    ['TARGET INTEL', '대상 정보'],
    ['BOSS', '보스'],
    ['MINI', '미니'],
    ['HP', '체력'],
    ['SHIELD', '실드'],
    ['ARMOR', '방어'],
    ['BOUNTY', '현상금'],
    ['SUPPORT UNIT', '서포트 유닛'],
    ['ACTIVE BUFFS', '활성 버프'],
    ['EMPTY', '비어 있음'],
    ['MORE', '개 더'],
    ['COMMANDER SKILLS', '커맨더 스킬'],
    ['ORBITAL', '궤도 포격'],
    ['FREEZE', '빙결'],
    ['OVERLOAD', '과부하'],
    ['RALLY', '집결'],
    ['ARSENAL', '병기고'],
    ['ARMORY', '장비고'],
    ['RESET T4 PRESET', 'T4 프리셋 초기화'],
    ['CANCEL PLACEMENT', '배치 취소'],
    ['TACTICAL MAP', '전술 지도'],
    ['THREAT LVL', '위협 레벨'],
    ['CURRENT WAVE', '현재 웨이브'],
    ['NEXT WAVE', '다음 웨이브'],
    ['MINIBOSS', '미니보스'],
    ['AUTO', '자동'],

    // Modals / run
    ['GAME OVER', '게임 오버'],
    ['VICTORY!', '승리!'],
    ['CAMPAIGN LEADERBOARD', '캠페인 리더보드'],
    ['CRYSTAL REWARDS', '크리스탈 보상'],
    ['RUN MODE', '런 모드'],
    ['Rush Mode', '러시 모드'],
    ['Standard Run', '스탠다드 런'],
    ['Daily Challenge', '일일 도전'],
    ['Endless Mode', '엔드리스 모드'],
    ['Boss Rush', '보스 러시'],
    ['RUN COMPLETE!', '런 완료!'],
    ['RUN FAILED', '런 실패'],
    ['REWARDS', '보상'],
    ['PITY', '천장'],
    ['TODAY', '오늘'],
    ['MAX', '최대'],

    // Korean originals that need English mode support
    ['Roguelike Run', '로그라이크 런'],
    ['Endless waves', '무한 웨이브'],
    ['Permanent buffs · score attack', '영구 버프 · 점수전'],
    ['fixed map', '확정 맵'],

    // Mission cards / tower roles (Home.jsx)
    ['Campaign', '캠페인'],
    ['Endless', '엔드리스'],
    ['Fire Burn', '화염 지속'],
    ['Cryo Control', '냉기 제어'],
    ['Electric Chain', '전격 연쇄'],
    ['Wind Strike', '질풍 타격'],
    ['Void Pierce', '공허 관통'],
    ['Light Precision', '광휘 정밀'],
    ['6 Elements × 4 Tiers', '6원소 × 4티어'],
    ['6 Elements × 3 Roles', '6원소 × 3역할'],
    ['4 Types × 3 Tiers', '4종 × 3티어'],
    ['8 Types', '8종'],

    // RunModeMenu / shared
    ['MAIN MENU', '메인 메뉴'],
    ['Run In Progress', '진행 중인 런'],
    ['Continue', '이어하기'],
    ['Casual / Quick Play', '캐주얼 / 빠른 한 판'],
    ['Already attempted today', '오늘 이미 도전함'],
    ["Today's special rules", '오늘의 특별 규칙'],
    ['Endless Challenge', '무한 도전'],
    ['Bosses only · limited resources', '보스만 출현 | 한정 자원'],
    ['Reward', '보상'],
    ['Difficulty', '난이도'],
    ['Feature', '특징'],
    ['Defeat', '패배'],
    ['Boss Kill', '보스 처치'],
    ['Best Record', '최고 기록'],
    ['Total Runs', '총 런 수'],
    ['Total Clears', '클리어 수'],
    ['Best Grade', '최고 등급'],
    ['Total Crystals Earned', '총 획득 크리스탈'],
    ['Free Draw', '🎰 무료 뽑기'],
    ['Mode Select', '모드 선택'],
    ['Upgrades', '업그레이드'],
    ['Achievements', '업적'],
    ['Daily Login Rewards', '일일 출석 보상'],
    ['Claim Reward', '보상 받기'],
    ['Confirm', '확인'],
    ['Clears', '클리어 수'],
    ['Active Run', '진행 중인 런'],
    ['Neon Crystals', '네온 크리스탈'],
    ['Current:', '현재:'],
    ['Next:', '다음:'],
    ['Perfect Waves', '퍼펙트 웨이브'],
    ['Total', '총 획득'],
    ['Show Details', '상세 통계 보기'],
    ['Hide Details', '상세 통계 접기'],
    ['Start New Run', '새 런 시작'],
    ['Restart', '다시 시작'],
    ['Try Again', '다시 도전'],
    ['Start New Game', '새 게임 시작'],
    ['New Game', '새 게임'],
    ['Saved Game', '저장된 게임'],
    ['No saved game found', '저장된 게임이 없습니다'],
    ['Save and Quit', '저장하고 나가기'],
    ['Continue Playing', '계속 플레이'],
    ['Tower Info', '타워 정보'],
    ['Enemy Info', '적 정보'],
    ['Support Tower', '서포트 타워'],
    ['Strategy Tips', '전략 팁'],
    ['Basics', '기본 조작'],
    ['Previous', '이전'],
    ['Skip Tutorial', '튜토리얼 건너뛰기'],
    ['Click to Select', '클릭하여 선택'],
    ['Max Stacks!', '최대 스택!'],
    ['Attack Towers', '공격 타워'],
    ['Estimated Refund:', '예상 환급:'],
    ['Unselected towers refund', '선택하지 않은 타워는'],
    ['refund', '환급'],
    ['Tower Carryover', '타워 캐리오버'],
    ['No T2+ towers', 'T2 이상 타워 없음'],
    ['No S2+ supports', 'S2 이상 서포트 없음'],
  ];

  const keyed = {
    'options.title': { ko: '옵션', en: 'Options' },
    'options.subtitle': { ko: '언어와 플레이 보조 설정', en: 'Language and play assists' },
    'options.language': { ko: '언어', en: 'Language' },
    'options.language.ko': { ko: '한국어', en: 'Korean' },
    'options.language.en': { ko: '영어', en: 'English' },
    'options.languageHelp': { ko: '기본 UI는 한국어로 표시되고, 영어로 즉시 전환할 수 있습니다.', en: 'The UI can switch between Korean and English instantly.' },
    'options.play': { ko: '플레이 보조', en: 'Play Assists' },
    'options.autoTower': { ko: '타워 자동 합성', en: 'Auto Fuse Towers' },
    'options.autoSupport': { ko: '서포트 자동 합성', en: 'Auto Fuse Supports' },
    'options.autoWave': { ko: '다음 웨이브 자동 시작', en: 'Auto Start Next Wave' },
    'options.maxSpeed': { ko: '최대 배속', en: 'Max Speed' },
    'options.close': { ko: '닫기', en: 'Close' },
    'options.on': { ko: '켜짐', en: 'On' },
    'options.off': { ko: '꺼짐', en: 'Off' },
    'options.open': { ko: '옵션 열기', en: 'Open Options' },
  };

  const textMap = new Map();
  entries.forEach(([en, ko]) => {
    textMap.set(en, { en, ko });
    textMap.set(ko, { en, ko });
  });

  const getInitialLanguage = () => {
    try {
      const settings = JSON.parse(localStorage.getItem('neonDefense_settings_v1') || '{}');
      if (SUPPORTED.includes(settings.language)) return settings.language;
      const stored = localStorage.getItem(STORAGE_KEY);
      if (SUPPORTED.includes(stored)) return stored;
    } catch {
      // ignore
    }
    return 'ko';
  };

  let currentLanguage = getInitialLanguage();

  const normalizeLanguage = (language) => SUPPORTED.includes(language) ? language : 'ko';

  const directTranslate = (core, language) => {
    const item = textMap.get(core);
    if (!item) return null;
    return item[language];
  };

  const translatePattern = (core, language) => {
    const enToKo = [
      [/^Day (\d+)$/, m => `${m[1]}일차`],
      [/^✨ Day (\d+) 보상 수령 가능!$/, m => `✨ ${m[1]}일차 보상 수령 가능!`],
      [/^🎉 Day (\d+) 보상 수령 완료!$/, m => `🎉 ${m[1]}일차 보상 수령 완료!`],
      [/^Stage (\d+) - Wave (\d+)$/, m => `스테이지 ${m[1]} - 웨이브 ${m[2]}`],
      [/^Stage (\d+) - Wave (\d+)까지 도달!$/, m => `스테이지 ${m[1]} - 웨이브 ${m[2]}까지 도달!`],
      [/^STAGE (\d+) · WAVE (\d+)$/, m => `스테이지 ${m[1]} · 웨이브 ${m[2]}`],
      [/^STAGE-(\d+) · ACTIVE$/, m => `스테이지-${m[1]} · 교전 중`],
      [/^STAGE-(\d+) · STANDBY$/, m => `스테이지-${m[1]} · 대기`],
      [/^STG (\d+) \/ (\d+)$/, m => `스테이지 ${m[1]} / ${m[2]}`],
      [/^BEST: SECTOR (\d+)$/, m => `최고: 섹터 ${m[1]}`],
      [/^BEST: STG (\d+)$/, m => `최고: 스테이지 ${m[1]}`],
      [/^LOCKED · 스테이지 (\d+) 클리어$/, m => `잠김 · 스테이지 ${m[1]} 클리어`],
      [/^TOP (\d+)$/, m => `상위 ${m[1]}`],
      [/^LAST (\d+)$/, m => `최근 ${m[1]}개`],
      [/^NEED ([\d,]+) MORE$/, m => `${m[1]} 더 필요`],
      [/^ALLOCATE · ([\d,]+) ◆$/, m => `배정 · ${m[1]} ◆`],
      [/^\+ (\d+) MORE$/, m => `+ ${m[1]}개 더`],
      [/^TIER (\d+)$/, m => `티어 ${m[1]}`],
      [/^(.+) GRID · ([\d/]+)$/, m => `${translateText(m[1], 'ko')} 그리드 · ${m[2]}`],
      [/^(.+) · TOP (\d+)$/, m => `${translateText(m[1], 'ko')} · 상위 ${m[2]}`],
      [/^RECENT RUNS · LAST (\d+)$/, m => `최근 기록 · 최근 ${m[1]}개`],
      [/^FULL RANKINGS · TOP (\d+)$/, m => `전체 순위 · 상위 ${m[1]}`],
      [/^(.+) · (.+)$/, m => {
        const left = directTranslate(m[1], 'ko');
        const right = directTranslate(m[2], 'ko') || translatePattern(m[2], 'ko');
        return left && right ? `${left} · ${right}` : null;
      }],
    ];
    const koToEn = [
      [/^(\d+)일차$/, m => `Day ${m[1]}`],
      [/^✨ (\d+)일차 보상 수령 가능!$/, m => `✨ Day ${m[1]} reward available!`],
      [/^🎉 (\d+)일차 보상 수령 완료!$/, m => `🎉 Day ${m[1]} reward claimed!`],
      [/^스테이지 (\d+) - 웨이브 (\d+)$/, m => `Stage ${m[1]} - Wave ${m[2]}`],
      [/^스테이지 (\d+) - 웨이브 (\d+)까지 도달!$/, m => `Reached Stage ${m[1]} - Wave ${m[2]}!`],
      [/^스테이지 (\d+) · 웨이브 (\d+)$/, m => `STAGE ${m[1]} · WAVE ${m[2]}`],
      [/^스테이지-(\d+) · 교전 중$/, m => `STAGE-${m[1]} · ACTIVE`],
      [/^스테이지-(\d+) · 대기$/, m => `STAGE-${m[1]} · STANDBY`],
      [/^스테이지 (\d+) \/ (\d+)$/, m => `STG ${m[1]} / ${m[2]}`],
      [/^최고: 섹터 (\d+)$/, m => `BEST: SECTOR ${m[1]}`],
      [/^최고: 스테이지 (\d+)$/, m => `BEST: STG ${m[1]}`],
      [/^잠김 · 스테이지 (\d+) 클리어$/, m => `LOCKED · Clear Stage ${m[1]}`],
      [/^상위 (\d+)$/, m => `TOP ${m[1]}`],
      [/^최근 (\d+)개$/, m => `LAST ${m[1]}`],
      [/^(\d+) 더 필요$/, m => `NEED ${m[1]} MORE`],
      [/^배정 · ([\d,]+) ◆$/, m => `ALLOCATE · ${m[1]} ◆`],
      [/^\+ (\d+)개 더$/, m => `+ ${m[1]} MORE`],
      [/^티어 (\d+)$/, m => `TIER ${m[1]}`],
      [/^(.+) 그리드 · ([\d/]+)$/, m => `${translateText(m[1], 'en')} GRID · ${m[2]}`],
      [/^(.+) · 상위 (\d+)$/, m => `${translateText(m[1], 'en')} · TOP ${m[2]}`],
      [/^최근 기록 · 최근 (\d+)개$/, m => `RECENT RUNS · LAST ${m[1]}`],
      [/^전체 순위 · 상위 (\d+)$/, m => `FULL RANKINGS · TOP ${m[1]}`],
      [/^(.+) · (.+)$/, m => {
        const left = directTranslate(m[1], 'en');
        const right = directTranslate(m[2], 'en') || translatePattern(m[2], 'en');
        return left && right ? `${left} · ${right}` : null;
      }],
    ];
    const patterns = language === 'ko' ? enToKo : koToEn;
    for (const [regex, format] of patterns) {
      const match = core.match(regex);
      if (match) return format(match);
    }
    return null;
  };

  const translateDecorated = (core, language) => {
    const match = core.match(/^([◇◆◈✕▲◷◎★▸▶⚔♥∞☼✦●▣]+)\s+(.+)$/);
    if (!match) return null;
    const translated = directTranslate(match[2], language) || translatePattern(match[2], language);
    return translated ? `${match[1]} ${translated}` : null;
  };

  const translateText = (text, language = currentLanguage) => {
    if (typeof text !== 'string' || text.trim() === '') return text;
    const match = text.match(/^(\s*)([\s\S]*?)(\s*)$/);
    const leading = match?.[1] || '';
    const core = match?.[2] || text;
    const trailing = match?.[3] || '';
    if (!core.trim()) return text;
    const compact = core.replace(/\s+/g, ' ').trim();
    const translated = directTranslate(compact, language) || translatePattern(compact, language) || translateDecorated(compact, language);
    if (!translated) return text;
    return leading + translated + trailing;
  };

  const shouldSkipTextNode = (node) => {
    const parent = node.parentElement;
    if (!parent) return true;
    const tag = parent.tagName;
    return ['SCRIPT', 'STYLE', 'TEXTAREA', 'INPUT', 'CODE', 'PRE'].includes(tag)
      || parent.isContentEditable;
  };

  const processTextNode = (node) => {
    if (shouldSkipTextNode(node)) return;
    if (!textOriginals.has(node)) {
      textOriginals.set(node, node.nodeValue);
    } else {
      const previousOriginal = textOriginals.get(node);
      const previousRendered = translateText(previousOriginal, currentLanguage);
      if (node.nodeValue !== previousRendered) {
        textOriginals.set(node, node.nodeValue);
      }
    }
    const original = textOriginals.get(node);
    const next = translateText(original, currentLanguage);
    if (node.nodeValue !== next) node.nodeValue = next;
  };

  const getAttrOriginals = (el) => {
    let originals = attrOriginals.get(el);
    if (!originals) {
      originals = {};
      attrOriginals.set(el, originals);
    }
    return originals;
  };

  const processAttributes = (el) => {
    if (!el || el.nodeType !== Node.ELEMENT_NODE) return;
    ['title', 'aria-label', 'alt', 'placeholder'].forEach(attr => {
      if (!el.hasAttribute(attr)) return;
      const originals = getAttrOriginals(el);
      if (!Object.prototype.hasOwnProperty.call(originals, attr)) {
        originals[attr] = el.getAttribute(attr);
      } else {
        const previousRendered = translateText(originals[attr], currentLanguage);
        if (el.getAttribute(attr) !== previousRendered) {
          originals[attr] = el.getAttribute(attr);
        }
      }
      const next = translateText(originals[attr], currentLanguage);
      if (el.getAttribute(attr) !== next) el.setAttribute(attr, next);
    });
  };

  const walk = (root) => {
    if (!root) return;
    if (root.nodeType === Node.TEXT_NODE) {
      processTextNode(root);
      return;
    }
    if (root.nodeType !== Node.ELEMENT_NODE && root.nodeType !== Node.DOCUMENT_NODE) return;
    if (root.nodeType === Node.ELEMENT_NODE) processAttributes(root);
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_TEXT);
    let node = walker.nextNode();
    while (node) {
      if (node.nodeType === Node.TEXT_NODE) processTextNode(node);
      else processAttributes(node);
      node = walker.nextNode();
    }
  };

  const translateApp = () => {
    const root = document.getElementById('root') || document.body;
    walk(root);
  };

  const scheduleTranslate = () => {
    if (scheduled) return;
    scheduled = true;
    requestAnimationFrame(() => {
      scheduled = false;
      translateApp();
    });
  };

  const startObserver = () => {
    const root = document.getElementById('root');
    if (!root || observer) return;
    observer = new MutationObserver(scheduleTranslate);
    observer.observe(root, {
      childList: true,
      subtree: true,
      characterData: true,
      attributes: true,
      attributeFilter: ['title', 'aria-label', 'alt', 'placeholder'],
    });
    translateApp();
  };

  const setLanguage = (language) => {
    const next = normalizeLanguage(language);
    currentLanguage = next;
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // storage unavailable
    }
    document.documentElement.lang = next;
    translateApp();
    window.dispatchEvent(new CustomEvent('neon-language-changed', { detail: { language: next } }));
  };

  const t = (key, values = {}) => {
    const item = keyed[key];
    let value = item ? item[currentLanguage] : key;
    Object.entries(values).forEach(([name, replacement]) => {
      value = value.replaceAll(`{${name}}`, replacement);
    });
    return value;
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', startObserver);
  } else {
    setTimeout(startObserver, 0);
  }
  document.documentElement.lang = currentLanguage;

  return {
    getLanguage: () => currentLanguage,
    setLanguage,
    translateApp,
    translateText,
    t,
  };
})();

window.I18n = I18n;
