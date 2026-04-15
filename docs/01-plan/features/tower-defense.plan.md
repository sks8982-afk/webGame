# Tower Defense Game Planning Document

> **Summary**: Next.js + PixiJS + TypeScript 기반 대규모 픽셀아트 타워 디펜스 웹 게임
>
> **Project**: webgame
> **Version**: 0.1.0
> **Author**: jungm
> **Date**: 2026-04-13
> **Status**: Draft

---

## Executive Summary

| Perspective | Content |
|-------------|---------|
| **Problem** | 브라우저에서 즐길 수 있는 본격적인 타워 디펜스 게임 부재. 기존 웹 TD 게임은 깊이가 얕고 RPG 요소가 부족함 |
| **Solution** | Bloons TD6/Kingdom Rush 수준의 타워 시스템 + 상점/스킬/무기 커스터마이징 RPG 요소를 결합한 픽셀아트 타워 디펜스 |
| **Function/UX Effect** | 20+ 스테이지 진행, 타워 배치 전략, 포인트 기반 상점에서 무기 교체/스킬 습득, 보스전으로 긴장감 있는 플레이 경험 |
| **Core Value** | "전략 + 성장" - 단순 배치를 넘어 캐릭터 빌드와 전략적 투자로 나만의 디펜스 스타일을 만드는 재미 |

---

## Context Anchor

| Key | Value |
|-----|-------|
| **WHY** | 브라우저 기반의 깊이 있는 타워 디펜스 + RPG 성장 요소가 결합된 게임이 필요 |
| **WHO** | 웹 브라우저에서 전략 게임을 즐기는 캐주얼~미드코어 게이머 |
| **RISK** | 대규모 스테이지(20+) 개발 시 콘텐츠 밸런싱 난이도, PixiJS 대량 스프라이트 성능 |
| **SUCCESS** | 20+ 스테이지 완성, 60fps 유지, 타워 8종+, 적 15종+, 상점/스킬 시스템 동작 |
| **SCOPE** | Phase 1: 핵심 엔진 → Phase 2: 콘텐츠 확장 → Phase 3: RPG 시스템 → Phase 4: 폴리싱 |

---

## 1. Overview

### 1.1 Purpose

브라우저에서 설치 없이 즐길 수 있는 본격 타워 디펜스 게임을 개발한다. Bloons TD6의 다양한 타워 시스템, Kingdom Rush의 전략적 배치, 그리고 RPG 게임의 상점/스킬/무기 시스템을 결합하여 높은 리플레이 밸류를 제공한다.

### 1.2 Background

**인기 디펜스 게임 분석:**

| 게임 | 핵심 메카닉 | 차용할 요소 |
|------|------------|------------|
| **Bloons TD6** | 다양한 타워 업그레이드 경로, 히어로 시스템 | 타워 업그레이드 트리 (3갈래 분기) |
| **Kingdom Rush** | 전략적 타워 배치, 특수 능력 | 경로 기반 맵 디자인, 스킬 쿨다운 |
| **Plants vs Zombies** | 그리드 기반 배치, 자원 관리 | 직관적 UI, 자원 수집 메카닉 |
| **Element TD 2** | 원소 조합 시스템 | 타워 시너지/조합 보너스 |
| **Vampire Survivors** | 성장 쾌감, 아이템 조합 | 스테이지 클리어 보상, 영구 업그레이드 |

### 1.3 Related Documents

- Design: `docs/02-design/features/tower-defense.design.md` (예정)
- 참고: Bloons TD6, Kingdom Rush, Element TD 2

---

## 2. Scope

### 2.1 In Scope

**Core Game:**
- [ ] 타워 배치/업그레이드/판매 시스템
- [ ] 웨이브 기반 적 스폰 시스템
- [ ] 경로 기반 맵 시스템 (20+ 스테이지)
- [ ] 골드/포인트 경제 시스템
- [ ] 보스 웨이브 시스템

**RPG/성장 시스템:**
- [ ] 상점 시스템 (무기, 스킬, 아이템 구매)
- [ ] 무기 교체 시스템 (타워별 장착 무기 변경)
- [ ] 스킬 트리 시스템 (패시브/액티브 스킬 습득)
- [ ] 영구 업그레이드 시스템 (스테이지 간 유지되는 강화)
- [ ] 포인트/재화 시스템 (스테이지 클리어 보상)

**UI/UX:**
- [ ] 메인 메뉴, 스테이지 선택, 게임 HUD
- [ ] 상점 UI, 인벤토리 UI, 스킬 트리 UI
- [ ] 일시정지, 배속 조절 (1x/2x/3x)
- [ ] 튜토리얼 시스템

### 2.2 Out of Scope

- 멀티플레이어/PvP
- 모바일 네이티브 앱
- 서버사이드 세이브 (로컬 스토리지 사용)
- 실시간 랭킹 시스템
- 과금/인앱결제

---

## 3. Requirements

### 3.1 Functional Requirements

| ID | Requirement | Priority | Status |
|----|-------------|----------|--------|
| **Core Game** |
| FR-01 | 맵 위에 타워를 배치/업그레이드/판매할 수 있다 | High | Pending |
| FR-02 | 적이 정해진 경로를 따라 이동하며, 기지에 도달하면 체력이 감소한다 | High | Pending |
| FR-03 | 웨이브 시스템: 각 스테이지는 N개 웨이브로 구성된다 | High | Pending |
| FR-04 | 적을 처치하면 골드를 획득한다 | High | Pending |
| FR-05 | 스테이지 클리어 시 별점(1-3성) 평가와 보상 포인트를 지급한다 | High | Pending |
| FR-06 | 보스 웨이브: 5스테이지마다 보스전이 등장한다 | Medium | Pending |
| **타워 시스템** |
| FR-07 | 최소 8종의 타워 (근거리, 원거리, 범위, 감속, 독, 전기, 폭발, 지원) | High | Pending |
| FR-08 | 각 타워는 3갈래 업그레이드 경로를 가진다 | Medium | Pending |
| FR-09 | 타워별 장착 무기를 상점에서 교체할 수 있다 | High | Pending |
| **적 시스템** |
| FR-10 | 최소 15종의 적 (일반, 빠른, 방어, 비행, 스텔스, 분열, 치유, 보스 등) | High | Pending |
| FR-11 | 적 속성 시스템: 물리/마법/원소 저항 | Medium | Pending |
| **상점/경제** |
| FR-12 | 상점에서 포인트로 무기, 스킬, 아이템을 구매한다 | High | Pending |
| FR-13 | 무기 시스템: 타워에 장착하여 공격력/효과를 변경한다 | High | Pending |
| FR-14 | 스킬 트리: 패시브 스킬(골드 보너스, 타워 강화 등)과 액티브 스킬(전체 공격, 힐 등) 습득 | High | Pending |
| FR-15 | 영구 업그레이드: 포인트로 기본 스탯을 영구 강화한다 | Medium | Pending |
| **UI/UX** |
| FR-16 | 메인 메뉴 → 스테이지 선택 → 게임 → 결과 화면 플로우 | High | Pending |
| FR-17 | 게임 내 HUD: 골드, 체력, 웨이브 정보, 타워 선택 패널 | High | Pending |
| FR-18 | 일시정지, 배속 조절(1x/2x/3x) | Medium | Pending |
| FR-19 | 세이브/로드 (로컬 스토리지) | Medium | Pending |
| FR-20 | 튜토리얼 (첫 3 스테이지에서 안내) | Low | Pending |

### 3.2 Non-Functional Requirements

| Category | Criteria | Measurement Method |
|----------|----------|-------------------|
| Performance | 동시 200+ 엔티티에서 60fps 유지 | Chrome DevTools FPS 모니터 |
| Performance | 초기 로딩 3초 이내 | Lighthouse |
| Responsive | 1280x720 ~ 1920x1080 해상도 지원 | 수동 테스트 |
| Accessibility | 키보드 단축키 지원 | 수동 테스트 |
| Storage | 세이브 데이터 1MB 이내 | LocalStorage 용량 확인 |

---

## 4. Success Criteria

### 4.1 Definition of Done

- [ ] 20+ 스테이지 플레이 가능
- [ ] 8종 타워 모두 배치/업그레이드/판매 동작
- [ ] 15종 적이 올바른 경로를 따라 이동
- [ ] 상점에서 무기/스킬/아이템 구매 및 적용
- [ ] 스킬 트리에서 패시브/액티브 스킬 습득 및 발동
- [ ] 무기 교체 시 타워 공격 변경 반영
- [ ] 보스전 동작
- [ ] 세이브/로드 정상 동작
- [ ] 튜토리얼 완료

### 4.2 Quality Criteria

- [ ] 60fps 유지 (200+ 엔티티)
- [ ] 메모리 누수 없음 (30분 연속 플레이)
- [ ] 크롬/파이어폭스/엣지 호환
- [ ] TypeScript strict mode 에러 0

---

## 5. Risks and Mitigation

| Risk | Impact | Likelihood | Mitigation |
|------|--------|------------|------------|
| PixiJS 대량 스프라이트 성능 저하 | High | Medium | 오브젝트 풀링, 뷰포트 컬링, 스프라이트시트 최적화 |
| 20+ 스테이지 밸런싱 난이도 | High | High | JSON 기반 스테이지 데이터로 빠른 밸런스 조정 |
| 픽셀아트 에셋 제작 부담 | Medium | High | 무료 픽셀아트 에셋 활용 + 단계적 교체 |
| Next.js와 PixiJS Canvas 통합 이슈 | Medium | Medium | Next.js dynamic import로 CSR 처리 |
| 상점/스킬 복잡도로 인한 상태 관리 | Medium | Medium | Zustand로 게임 상태 중앙 관리 |
| 밸런스 붕괴 (무기/스킬 조합) | Medium | High | 수치 데이터 외부 JSON 관리, 밸런스 테스트 모드 |

---

## 6. Impact Analysis

### 6.1 Changed Resources

| Resource | Type | Change Description |
|----------|------|--------------------|
| 신규 프로젝트 | Project | Next.js 프로젝트 생성 |
| PixiJS 통합 | Library | Canvas 기반 게임 렌더링 |
| 게임 데이터 | JSON Config | 스테이지, 타워, 적, 상점 데이터 |

### 6.2 Current Consumers

신규 프로젝트이므로 기존 소비자 없음.

### 6.3 Verification

- [ ] Next.js + PixiJS 통합 POC 확인
- [ ] TypeScript strict mode 호환 확인

---

## 7. Architecture Considerations

### 7.1 Project Level Selection

| Level | Characteristics | Recommended For | Selected |
|-------|-----------------|-----------------|:--------:|
| **Starter** | Simple structure | Static sites | |
| **Dynamic** | Feature-based modules, BaaS integration | Web apps with backend | **v** |
| **Enterprise** | Strict layer separation, DI, microservices | High-traffic systems | |

> Dynamic 레벨 선택: 게임 특성상 기능 기반 모듈 구조가 적합하며, 백엔드 없이 클라이언트 중심

### 7.2 Key Architectural Decisions

| Decision | Options | Selected | Rationale |
|----------|---------|----------|-----------|
| Framework | Next.js / Vite / Plain | **Next.js 14 (App Router)** | SSG로 빠른 로딩, 라우팅 내장, 사용자 요청 |
| Game Engine | PixiJS / Phaser / Canvas API | **PixiJS 8** | 고성능 2D 렌더링, TypeScript 네이티브 지원 |
| Language | JavaScript / TypeScript | **TypeScript (strict)** | 복잡한 게임 로직의 타입 안전성 |
| State Mgmt | Zustand / Redux / Context | **Zustand** | 가볍고 게임 루프와 React 상태 분리 용이 |
| Styling | Tailwind / CSS Modules | **Tailwind CSS** | 빠른 UI 개발, 게임 외부 UI에 사용 |
| Data Format | JSON / YAML / DB | **JSON (정적 파일)** | 스테이지/타워/적 데이터를 JSON으로 관리 |
| Testing | Vitest / Jest | **Vitest** | Vite 기반 빠른 테스트, TS 네이티브 |
| Pixel Art | 직접 제작 / 에셋 팩 | **무료 에셋 + 커스텀** | 초기는 무료 에셋, 점진적 교체 |

### 7.3 Clean Architecture Approach

```
Selected Level: Dynamic

Folder Structure:
webgame/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── page.tsx            # 메인 메뉴
│   │   ├── game/page.tsx       # 게임 플레이
│   │   ├── shop/page.tsx       # 상점
│   │   ├── skills/page.tsx     # 스킬 트리
│   │   ├── stages/page.tsx     # 스테이지 선택
│   │   └── layout.tsx
│   ├── components/             # React UI 컴포넌트
│   │   ├── ui/                 # 공통 UI (Button, Modal, etc.)
│   │   ├── hud/                # 게임 내 HUD
│   │   ├── shop/               # 상점 UI
│   │   ├── skill-tree/         # 스킬 트리 UI
│   │   └── menu/               # 메뉴 UI
│   ├── game/                   # 게임 엔진 코어 (PixiJS)
│   │   ├── core/               # Game loop, Scene manager
│   │   │   ├── Game.ts
│   │   │   ├── GameLoop.ts
│   │   │   └── SceneManager.ts
│   │   ├── entities/           # 게임 엔티티
│   │   │   ├── Tower.ts
│   │   │   ├── Enemy.ts
│   │   │   ├── Projectile.ts
│   │   │   └── Effect.ts
│   │   ├── systems/            # ECS-like 시스템
│   │   │   ├── TowerSystem.ts      # 타워 배치/공격 로직
│   │   │   ├── EnemySystem.ts      # 적 이동/스폰 로직
│   │   │   ├── ProjectileSystem.ts # 투사체 로직
│   │   │   ├── WaveSystem.ts       # 웨이브 관리
│   │   │   └── EconomySystem.ts    # 골드/포인트 관리
│   │   ├── managers/           # 게임 매니저
│   │   │   ├── TowerManager.ts
│   │   │   ├── EnemyManager.ts
│   │   │   ├── MapManager.ts
│   │   │   └── EffectManager.ts
│   │   ├── rendering/          # 렌더링 레이어
│   │   │   ├── SpritePool.ts
│   │   │   ├── TileRenderer.ts
│   │   │   └── ParticleSystem.ts
│   │   └── utils/              # 게임 유틸리티
│   │       ├── pathfinding.ts
│   │       ├── collision.ts
│   │       └── objectPool.ts
│   ├── features/               # 기능별 모듈
│   │   ├── shop/               # 상점 기능
│   │   │   ├── shopStore.ts
│   │   │   ├── shopTypes.ts
│   │   │   └── shopData.ts
│   │   ├── skills/             # 스킬 시스템
│   │   │   ├── skillStore.ts
│   │   │   ├── skillTypes.ts
│   │   │   ├── skillTree.ts
│   │   │   └── skillData.ts
│   │   ├── weapons/            # 무기 시스템
│   │   │   ├── weaponStore.ts
│   │   │   ├── weaponTypes.ts
│   │   │   └── weaponData.ts
│   │   ├── inventory/          # 인벤토리
│   │   │   ├── inventoryStore.ts
│   │   │   └── inventoryTypes.ts
│   │   └── save/               # 세이브/로드
│   │       ├── saveStore.ts
│   │       └── saveManager.ts
│   ├── stores/                 # 전역 Zustand 스토어
│   │   ├── gameStore.ts        # 게임 상태 (진행중/일시정지/배속)
│   │   ├── playerStore.ts      # 플레이어 상태 (포인트, 레벨)
│   │   └── uiStore.ts          # UI 상태
│   ├── types/                  # 공통 타입 정의
│   │   ├── tower.ts
│   │   ├── enemy.ts
│   │   ├── weapon.ts
│   │   ├── skill.ts
│   │   ├── stage.ts
│   │   └── common.ts
│   └── lib/                    # 유틸리티
│       ├── constants.ts
│       ├── helpers.ts
│       └── sounds.ts
├── public/
│   ├── sprites/                # 픽셀아트 스프라이트시트
│   │   ├── towers/
│   │   ├── enemies/
│   │   ├── effects/
│   │   ├── weapons/
│   │   └── tiles/
│   ├── maps/                   # 맵 데이터 (Tiled JSON)
│   └── sounds/                 # 효과음/BGM
├── data/                       # 게임 데이터 (JSON)
│   ├── towers.json             # 타워 정의
│   ├── enemies.json            # 적 정의
│   ├── stages.json             # 스테이지 정의
│   ├── weapons.json            # 무기 정의
│   ├── skills.json             # 스킬 정의
│   ├── shop.json               # 상점 아이템
│   └── upgrades.json           # 영구 업그레이드
├── tests/                      # 테스트
│   ├── unit/
│   └── e2e/
└── docs/                       # PDCA 문서
```

---

## 8. Convention Prerequisites

### 8.1 Existing Project Conventions

- [ ] `CLAUDE.md` has coding conventions section — 없음 (생성 필요)
- [ ] ESLint configuration — 없음 (생성 필요)
- [ ] Prettier configuration — 없음 (생성 필요)
- [ ] TypeScript configuration — 없음 (생성 필요)

### 8.2 Conventions to Define/Verify

| Category | Current State | To Define | Priority |
|----------|---------------|-----------|:--------:|
| **Naming** | missing | camelCase 변수, PascalCase 클래스/컴포넌트, UPPER_SNAKE 상수 | High |
| **Folder structure** | missing | 위 7.3 구조 | High |
| **Import order** | missing | external → internal → types → styles | Medium |
| **Game data** | missing | JSON 스키마 정의 | High |
| **Error handling** | missing | try-catch + 에러 바운더리 | Medium |

### 8.3 Environment Variables Needed

| Variable | Purpose | Scope | To Be Created |
|----------|---------|-------|:-------------:|
| `NEXT_PUBLIC_GAME_VERSION` | 게임 버전 표시 | Client | v |

### 8.4 Pipeline Integration

| Phase | Status | Document Location | Command |
|-------|:------:|-------------------|---------|
| Phase 1 (Schema) | Pending | `docs/01-plan/schema.md` | `/phase-1-schema` |
| Phase 2 (Convention) | Pending | `docs/01-plan/conventions.md` | `/phase-2-convention` |

---

## 9. Game Design Detail

### 9.1 타워 설계 (8종)

| # | 타워 | 공격 유형 | 특수 효과 | 업그레이드 분기 |
|---|------|----------|----------|----------------|
| 1 | Archer Tower | 단일 물리 | 기본 타워 | 속사/관통/치명타 |
| 2 | Mage Tower | 단일 마법 | 마법 데미지 | 범위 폭발/연쇄 번개/시간 정지 |
| 3 | Cannon Tower | 범위 물리 | 스플래시 데미지 | 대구경/네이팜/지진 |
| 4 | Frost Tower | 범위 마법 | 감속 | 빙결/눈보라/절대영도 |
| 5 | Poison Tower | 지속 데미지 | 독 DOT | 맹독/역병/부식 |
| 6 | Tesla Tower | 연쇄 전기 | 체인 라이트닝 | 과전류/EMP/번개폭풍 |
| 7 | Bomb Tower | 범위 물리 | 폭발 | 지뢰/클러스터/핵폭탄 |
| 8 | Support Tower | 버프 | 근처 타워 강화 | 공속 버프/사거리 버프/골드 보너스 |

### 9.2 적 설계 (15+종)

| # | 적 | 속도 | 체력 | 특수 능력 |
|---|------|------|------|-----------|
| 1 | Goblin | 보통 | 낮음 | 없음 |
| 2 | Wolf | 빠름 | 낮음 | 고속 이동 |
| 3 | Orc Warrior | 느림 | 높음 | 물리 방어 |
| 4 | Dark Mage | 보통 | 보통 | 마법 저항 |
| 5 | Bat | 빠름 | 낮음 | 비행 (지상 타워 무시) |
| 6 | Ghost | 보통 | 보통 | 스텔스 (감지 타워 필요) |
| 7 | Slime | 보통 | 보통 | 분열 (처치 시 2마리로) |
| 8 | Healer | 느림 | 보통 | 주변 적 치유 |
| 9 | Shield Bearer | 느림 | 매우 높음 | 앞의 적 보호 |
| 10 | Rogue | 매우 빠름 | 낮음 | 회피 30% |
| 11 | Golem | 매우 느림 | 매우 높음 | 물리+마법 방어 |
| 12 | Dragon Whelp | 빠름 | 높음 | 비행 + 불 저항 |
| 13 | Necromancer | 보통 | 보통 | 죽은 적 부활 |
| 14 | Berserker | 보통→빠름 | 높음 | 체력 낮으면 속도/공격 증가 |
| 15 | Mimic | 보통 | 보통 | 랜덤 적 능력 복사 |

**보스 (5스테이지마다):**
- Stage 5: Orc Chief (소환 능력)
- Stage 10: Dragon (비행 + 범위 공격)
- Stage 15: Lich King (부활 + 디버프)
- Stage 20: Demon Lord (다단계 변신)
- Stage 25: Final Boss (모든 능력 조합)

### 9.3 상점/RPG 시스템

**재화 종류:**
| 재화 | 획득 방법 | 용도 |
|------|----------|------|
| **골드** | 적 처치, 웨이브 클리어 | 게임 내 타워 구매/업그레이드 |
| **스타 포인트** | 스테이지 클리어 (1-3성) | 상점 아이템 구매 |
| **보석** | 보스 처치, 업적 달성 | 희귀 아이템, 영구 업그레이드 |

**상점 카테고리:**
1. **무기 상점**: 타워에 장착하는 무기 (공격력 변경, 특수 효과 추가)
2. **스킬 상점**: 액티브/패시브 스킬 구매
3. **아이템 상점**: 소모성 아이템 (폭탄, 힐, 버프 물약 등)
4. **영구 강화**: 기본 스탯 영구 증가

**무기 시스템 예시:**
| 무기 | 장착 대상 | 효과 |
|------|----------|------|
| 불꽃 화살 | Archer Tower | +화상 DOT |
| 얼음 수정 | Mage Tower | +빙결 확률 |
| 독날 | 모든 타워 | +독 데미지 |
| 축복의 오라 | Support Tower | +버프 범위 |

**스킬 트리 (3계열, 20종+ 스킬):**

**공격 계열 (8종):**
| # | 스킬 | 유형 | 효과 |
|---|------|------|------|
| 1 | Power Shot | 패시브 | 타워 기본 공격력 +10/20/30% |
| 2 | Rapid Fire | 패시브 | 공격 속도 +15/30% |
| 3 | Critical Strike | 패시브 | 크리티컬 확률 10/20/30%, 크리 데미지 150/200/250% |
| 4 | Armor Pierce | 패시브 | 적 방어력 15/30/50% 무시 |
| 5 | Chain Attack | 패시브 | 공격이 25/50% 확률로 인접 적에게 연쇄 |
| 6 | Meteor Strike | 액티브 | 지정 영역에 대규모 화염 데미지 (쿨다운 60초) |
| 7 | Thunder Storm | 액티브 | 맵 전체 적에게 전기 데미지 (쿨다운 90초) |
| 8 | Berserk Mode | 액티브 | 15초간 모든 타워 공속/데미지 2배 (쿨다운 120초) |

**경제 계열 (6종):**
| # | 스킬 | 유형 | 효과 |
|---|------|------|------|
| 9 | Gold Rush | 패시브 | 적 처치 시 골드 +10/20/30% |
| 10 | Interest | 패시브 | 웨이브 종료 시 보유 골드의 5/10% 이자 |
| 11 | Bargain Hunter | 패시브 | 상점 아이템 가격 10/20% 할인 |
| 12 | Treasure Hunter | 패시브 | 적 처치 시 5/10/15% 확률로 2배 골드 |
| 13 | Salvage | 패시브 | 타워 판매 시 환불률 50→70/80/90% |
| 14 | Lucky Star | 패시브 | 스테이지 클리어 시 보너스 스타 포인트 획득 확률 +20% |

**방어 계열 (6종):**
| # | 스킬 | 유형 | 효과 |
|---|------|------|------|
| 15 | Fortify | 패시브 | 기지 최대 체력 +5/10/15 |
| 16 | Regeneration | 패시브 | 웨이브 종료 시 기지 체력 1/2/3 회복 |
| 17 | Thorn Armor | 패시브 | 기지에 도달한 적에게 반사 데미지 |
| 18 | Slow Aura | 패시브 | 기지 주변 적 이동속도 10/20% 감소 |
| 19 | Guardian Angel | 액티브 | 10초간 기지 무적 (쿨다운 180초) |
| 20 | Earthquake | 액티브 | 맵 전체 적 3초 스턴 + 데미지 (쿨다운 120초) |

**히든/보너스 스킬 (해금 조건 필요, 4종):**
| # | 스킬 | 해금 조건 | 효과 |
|---|------|----------|------|
| 21 | Dragon's Breath | 보스 10 클리어 | 화염 타워 범위 2배 + 화상 DOT |
| 22 | Midas Touch | 골드 10000 보유 달성 | 적 처치 시 10% 확률로 10배 골드 |
| 23 | Time Warp | 스테이지 15 3성 클리어 | 10초간 적 이동 80% 감속 (쿨다운 90초) |
| 24 | Armageddon | 최종 보스 클리어 | 맵 전체 적에게 최대 체력 50% 데미지 (쿨다운 300초) |

### 9.4 확률/랜덤 시스템

| 시스템 | 확률 요소 | 설명 |
|--------|----------|------|
| **크리티컬 타격** | 10-30% | 타워 공격 시 크리티컬 데미지 발생 확률 |
| **드롭 아이템** | 5-15% | 적 처치 시 아이템 드롭 (일반/레어/에픽) |
| **럭키 골드** | 5-15% | 골드 2배/3배 획득 확률 |
| **회피** | 10-30% | 특정 적(Rogue)의 공격 회피 확률 |
| **분열** | 100% (Slime) | Slime 처치 시 확정 분열 |
| **부활** | 30-50% | Necromancer 주변 적 부활 확률 |
| **무기 강화 성공률** | 70-95% | 강화 단계별 성공 확률 (실패 시 유지/하락) |
| **상점 리프레시** | 랜덤 | 웨이브마다 상점 아이템 랜덤 갱신 |
| **보스 특수 패턴** | 랜덤 | 보스가 랜덤 패턴으로 특수 공격 |
| **보물 상자** | 10% | 스테이지 클리어 시 보물 상자 출현 |

**드롭 등급 시스템:**
| 등급 | 확률 | 색상 | 효과 |
|------|------|------|------|
| Common | 60% | 흰색 | 소량 골드/경험치 |
| Uncommon | 25% | 초록 | 소모성 아이템 |
| Rare | 10% | 파랑 | 무기/스킬 조각 |
| Epic | 4% | 보라 | 완성 무기/스킬 |
| Legendary | 1% | 주황 | 전설 등급 장비 |

### 9.5 무기 강화 시스템

| 강화 단계 | 성공률 | 실패 시 | 비용 (보석) |
|-----------|--------|--------|------------|
| +1 → +2 | 95% | 유지 | 10 |
| +2 → +3 | 90% | 유지 | 20 |
| +3 → +4 | 80% | 유지 | 40 |
| +4 → +5 | 70% | -1단계 | 80 |
| +5 → +6 | 60% | -1단계 | 150 |
| +6 → +7 | 50% | -2단계 | 300 |
| +7 → +8 | 40% | -2단계 | 500 |
| +8 → +9 | 30% | 파괴 가능(10%) | 800 |
| +9 → +10 | 20% | 파괴 가능(20%) | 1500 |

**강화 보호 아이템:**
- 보호 주문서: 실패 시 단계 하락 방지
- 축복 주문서: 성공률 +10%
- 파괴 방지: +8 이상 파괴 방지

### 9.6 보스 스테이지 상세

| 스테이지 | 보스 | 체력 | 특수 능력 | 패턴 |
|----------|------|------|----------|------|
| 5 | Orc Chief | 5000 | 소환: 3마리 Orc 소환 (30초마다) | Phase 1: 일반 이동 → Phase 2(50%HP): 방어력 2배 |
| 10 | Red Dragon | 15000 | 비행 + 화염 브레스 (타워 일시 비활성화) | 3패턴 랜덤: 돌진/브레스/소환 |
| 15 | Lich King | 30000 | 죽은 적 부활(50%), 주변 타워 디버프 | Phase 1→2→3, 부활 횟수 증가 |
| 20 | Demon Lord | 50000 | 3단계 변신, 각 형태 다른 능력 | 인간형→악마형→거대화, 각각 HP 바 |
| 25 | Chaos Emperor | 100000 | 모든 보스 능력 + 맵 변형 | 5페이즈, 랜덤 능력 조합 |

**보스 보상:**
- 보스 처치 시 고정 보석 지급 (50/100/200/500/1000)
- 전용 전설 아이템 드롭 (100%)
- 히든 스킬 해금 조건 진행

---

## 10. Development Phases

### Phase 1: Core Engine (스테이지 1-5)
- Next.js + PixiJS 프로젝트 세팅
- 게임 루프, 씬 매니저
- 맵 렌더링 (타일맵)
- 타워 배치/공격 기본 로직
- 적 경로 이동
- 웨이브 시스템
- 기본 HUD
- **타워 3종, 적 5종, 5스테이지**

### Phase 2: Content Expansion (스테이지 6-15)
- 나머지 타워 5종 추가
- 나머지 적 10종 추가
- 타워 업그레이드 트리
- 보스 시스템 (Stage 5, 10 보스)
- 맵 다양화 (10개 추가)
- 효과/파티클 시스템

### Phase 3: RPG Systems
- 상점 시스템 (무기/스킬/아이템)
- 무기 장착/교체 시스템
- 스킬 트리 (3계열)
- 영구 업그레이드
- 인벤토리 시스템
- 세이브/로드

### Phase 4: Polish & Full Content
- 나머지 스테이지 (16-25)
- 보스 3종 추가 (Stage 15, 20, 25)
- 튜토리얼
- 사운드/BGM
- 밸런싱
- 성능 최적화
- UI 폴리싱

---

## 11. Next Steps

1. [ ] Design 문서 작성 (`/pdca design tower-defense`)
2. [ ] Next.js + PixiJS + TypeScript 프로젝트 초기화
3. [ ] Phase 1 구현 시작

---

## Version History

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 0.1 | 2026-04-13 | Initial draft | jungm |
