# Capacitor 네이티브 빌드 가이드 (W14)

## 사전 조건
- **Android**: Android Studio + JDK 17 (설치는 개발자 머신에)
- **iOS** (Phase 2): macOS + Xcode 16+
- Node 20+ (현재 프로젝트는 22 사용 중)

## 셋업 상태 (2026-05-05 기준)
- [x] `@capacitor/core@^8.3.1`, `@capacitor/cli`, `@capacitor/android` 설치
- [x] `capacitor.config.json` (appId: `com.neondefense.app`)
- [x] `vendor/` 로컬 번들 (React/Babel/Tailwind — CDN 제거 완료)
- [x] `build.js` JSX → JS + dist/ 생성
- [x] `npx cap add android` 실행 → `android/` 네이티브 프로젝트 생성됨
- [x] `npm run android` / `android:sync` / `android:run` package.json 스크립트 추가
- [ ] iOS 플랫폼 추가 (Phase 2)
- [ ] AdMob 플러그인 (`@capacitor-community/admob`)
- [ ] Firebase Analytics/Crashlytics

## 일상 워크플로우

```bash
# 코드 수정 후 안드로이드 스튜디오 자동 오픈
npm run android

# 빌드 + sync 만 (Android Studio 이미 켜져 있을 때)
npm run android:sync

# 에뮬레이터/실기로 바로 실행 (개발자 머신에 SDK 셋업 필수)
npm run android:run
```

## 처음 안드로이드 빌드 (개발자 머신에서)
```bash
# 1. Android Studio 설치 (https://developer.android.com/studio)
# 2. JDK 17 + Android SDK 24+ 설치
# 3. ANDROID_HOME 환경변수 설정
# 4. 프로젝트 루트에서:
npm install
npm run android      # Android Studio가 열리면서 android/ 프로젝트 import

# 5. Android Studio 에서:
#    - Gradle Sync 자동 실행 (5~10분)
#    - 에뮬레이터 또는 USB 디바이스 선택
#    - ▶ Run 버튼
```

## 매 변경 후 반복

```bash
npm run android:sync   # build + cap sync 한 번에
# Android Studio 는 자동으로 변경 감지
```

## 출시 전 체크리스트
- [ ] 앱 아이콘 (iOS: 1024×1024, Android: 512×512 + adaptive)
- [ ] 스플래시 이미지 (다크 배경 `#0a0a0f` 일관성)
- [ ] iOS: bundle identifier에 Apple Developer 계정 연결
- [ ] Android: keystore 생성 → signingConfigs
- [ ] Privacy policy URL 설정 (App Store Connect / Play Console)
- [ ] AdMob SDK 연동 (W16) — capacitor 플러그인: `@capacitor-community/admob`
- [ ] Firebase Analytics/Crashlytics (W16)
- [ ] 연령등급 양식 작성 (W20)
- [ ] iOS App Transport Security 검토 (HTTPS 전용 ← CDN 제거로 자동 만족)

## 디바이스 테스트 주의
- **iOS WebView 오디오**: 첫 탭에서 `AudioContext.resume()` 호출 필수
  → 현재 `js/infra/sound.js` 확인 필요 (자동 동작하는지)
- **노치/세이프에어리어**: `env(safe-area-inset-*)` CSS 변수 사용
- **터치 이벤트**: 드래그 앤 드롭은 iOS에서 민감 — 탭 모드 PlacementUI 권장
