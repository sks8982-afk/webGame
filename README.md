# 타워 디펜스 | Pixel Art Edition

Next.js + PixiJS + TypeScript 기반 본격 픽셀아트 타워 디펜스 웹 게임

## 게임 특징

- **25개 스테이지** + **무한 모드**
- **8종 타워** (궁수/마법사/대포/냉기/독/테슬라/폭탄/지원)
- **18종 적** (일반 15 + 보스 5 — 오크치프/레드드래곤/리치킹/악마군주/혼돈황제)
- **24종 스킬** (공격/경제/방어/히든)
- **12종 무기** + 강화 시스템 (최대 +10, 확률 기반)
- **영구 강화 시스템** (23종 업그레이드)
- **업적 시스템** (15종)
- **3단계 난이도** (쉽게/보통/어렵게)
- **키보드 단축키** (1-8 타워, QWER/ASD 스킬)
- **13트랙 BGM** + 프로그래매틱 효과음

## 기술 스택

- **Framework**: Next.js 16 (App Router)
- **Game Engine**: PixiJS 8
- **Language**: TypeScript (strict mode)
- **State Management**: Zustand
- **Styling**: Tailwind CSS
- **Audio**: Web Audio API (SFX) + HTMLAudioElement (BGM)

## 로컬 개발

```bash
npm install
npm run dev
# http://localhost:3000
```

## 빌드

```bash
npm run build
npm start
```

## 조작법

| 입력 | 동작 |
|------|------|
| `1-8` | 타워 선택 |
| `Q W E R` `A S D` | 액티브 스킬 |
| `Space` | 일시정지 / 재개 |
| `Esc` | 선택 해제 |
| 그리드 클릭 | 선택한 타워 배치 |
| 설치된 타워 클릭 | 업그레이드 / 판매 패널 열기 |

## 라이선스

개인 프로젝트 (비상업)
