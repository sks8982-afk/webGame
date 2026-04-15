@AGENTS.md

# Tower Defense Web Game

## Project Overview
Next.js + PixiJS + TypeScript 기반 대규모 픽셀아트 타워 디펜스 웹 게임

## Tech Stack
- **Framework**: Next.js 16 (App Router)
- **Game Engine**: PixiJS 8
- **Language**: TypeScript (strict mode)
- **State Management**: Zustand
- **Styling**: Tailwind CSS (UI only, game은 PixiJS Canvas)
- **Testing**: Vitest
- **Art Style**: Pixel Art

## Architecture
- `src/app/` — Next.js App Router pages
- `src/game/` — PixiJS 게임 엔진 (React 외부)
- `src/components/` — React UI 컴포넌트
- `src/features/` — 기능별 모듈 (shop, skills, weapons, inventory, save)
- `src/stores/` — Zustand 전역 스토어
- `src/types/` — 공통 타입 정의
- `data/` — JSON 게임 데이터 (towers, enemies, stages, skills, weapons)

## Conventions
- camelCase: 변수, 함수
- PascalCase: 클래스, React 컴포넌트, 타입
- UPPER_SNAKE: 상수
- 게임 로직은 React와 분리 (src/game/)
- 게임 데이터는 JSON으로 외부 관리 (data/)
- 불변성 유지: 상태 업데이트 시 항상 새 객체 생성
