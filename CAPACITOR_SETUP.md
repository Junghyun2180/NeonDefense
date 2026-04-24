# Capacitor 네이티브 빌드 가이드 (W14)

## 사전 조건
- **iOS**: macOS + Xcode 16+
- **Android**: Android Studio + JDK 17
- Node 20+ (현재 프로젝트는 22 사용 중)

## 원샷 셋업 (최초 1회)

```bash
# 1) Capacitor 설치
npm install @capacitor/core @capacitor/cli @capacitor/ios @capacitor/android

# 2) 웹 빌드 (이미 build.js 있음 — dist/ 생성)
npm run build

# 3) 네이티브 프로젝트 생성
npx cap add ios
npx cap add android

# 4) dist/ 를 네이티브로 복사
npx cap sync
```

## 매 변경 후 반복

```bash
npm run build && npx cap sync
```

## 실기 실행

```bash
# iOS Simulator
npx cap open ios
# Xcode에서 타겟 선택 → ▶

# Android 에뮬레이터/실기
npx cap open android
# Android Studio에서 ▶
```

## 현 프로젝트 확인 사항
- `capacitor.config.json` 작성 완료 (appId: `com.neondefense.app`)
- `index.html`이 이미 vendor/ (React/Babel/Tailwind) 사용 — CDN 제거 완료
- `build.js`가 JSX → JS 컴파일 + dist/ 생성

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
