# Tower Defense Game Design Document

> **Summary**: Next.js + PixiJS + TypeScript 기반 대규모 픽셀아트 타워 디펜스 웹 게임 상세 설계
>
> **Project**: webgame
> **Version**: 0.1.0
> **Author**: jungm
> **Date**: 2026-04-13
> **Status**: Draft
> **Planning Doc**: [tower-defense.plan.md](../../01-plan/features/tower-defense.plan.md)

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

### 1.1 Design Goals

1. **React-Game 분리**: React UI와 PixiJS 게임 엔진을 명확히 분리하여 각자의 라이프사이클을 독립적으로 관리
2. **데이터 드리븐**: 타워/적/스테이지/스킬/무기 데이터를 JSON으로 외부 관리하여 코드 변경 없이 밸런싱 가능
3. **성능 최적화**: 오브젝트 풀링, 스프라이트시트, 뷰포트 컬링으로 200+ 엔티티에서 60fps 유지
4. **점진적 확장**: Phase 1 Core → Phase 4 Polish까지 단계적으로 시스템을 추가 가능한 구조

### 1.2 Design Principles

- **Single Responsibility**: 각 System은 하나의 게임 로직만 담당
- **Immutable State Updates**: Zustand 스토어에서 항상 새 객체로 상태 업데이트
- **Data-Driven Design**: 게임 콘텐츠는 코드가 아닌 JSON 데이터로 정의
- **Separation of Concerns**: 렌더링(PixiJS) ↔ 로직(Systems) ↔ UI(React) 분리

---

## 2. Architecture Options

### 2.0 Architecture Comparison

| Criteria | Option A: Minimal | Option B: Full ECS | Option C: Pragmatic |
|----------|:-:|:-:|:-:|
| **Approach** | Game 클래스 1개에 집중 | Entity-Component-System 완전 구현 | Manager + System 패턴 |
| **New Files** | ~15 | ~60+ | ~35-40 |
| **Complexity** | Low | High | Medium |
| **Maintainability** | Low | Very High | High |
| **Effort** | Low | High | Medium |
| **Risk** | High (대규모 시 붕괴) | Low (과한 추상화) | Low (균형) |
| **Recommendation** | 프로토타입 전용 | AAA 게임 엔진 | **이 프로젝트 최적** |

**Selected**: Option C — **Rationale**: 25 스테이지, 24종 스킬, 강화 시스템 등 복잡한 RPG 요소를 다루되, ECS의 과도한 추상화 없이 기능별 System으로 분리하여 유지보수성과 개발 속도의 균형을 유지

### 2.1 Component Diagram

```
┌─────────────────────────────────────────────────────────┐
│                    Next.js App Router                     │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐   │
│  │  / (Menu)│ │ /stages  │ │  /shop   │ │ /skills  │   │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘   │
│  ┌─────────────────────────────────────────────────┐    │
│  │                /game (Game Page)                  │    │
│  │  ┌────────────────┐  ┌────────────────────────┐ │    │
│  │  │  React HUD     │  │   PixiJS Canvas        │ │    │
│  │  │  (overlay)     │  │   (game world)         │ │    │
│  │  └───────┬────────┘  └───────────┬────────────┘ │    │
│  └──────────┼───────────────────────┼──────────────┘    │
└─────────────┼───────────────────────┼───────────────────┘
              │                       │
    ┌─────────▼─────────┐   ┌────────▼──────────┐
    │  Zustand Stores   │◀──│  Game Engine       │
    │  (React State)    │──▶│  (PixiJS + Systems)│
    └───────────────────┘   └───────────────────┘
              │                       │
    ┌─────────▼─────────┐   ┌────────▼──────────┐
    │  LocalStorage     │   │  JSON Data Files   │
    │  (Save/Load)      │   │  (towers, enemies) │
    └───────────────────┘   └───────────────────┘
```

### 2.2 Data Flow

```
[User Input (click/key)]
    ↓
[React Event Handler / PixiJS Event]
    ↓
[Zustand Action / Game System]
    ↓
[Game State Update (immutable)]
    ↓
[PixiJS Re-render + React Re-render]
    ↓
[Visual Output (Canvas + HTML overlay)]
```

**게임 루프 내 시스템 실행 순서:**
```
GameLoop.update(deltaTime)
  ├── 1. InputSystem       → 유저 입력 처리
  ├── 2. WaveSystem        → 웨이브/스폰 관리
  ├── 3. EnemySystem       → 적 이동 + 상태 업데이트
  ├── 4. TowerSystem       → 타겟 탐색 + 공격 실행
  ├── 5. ProjectileSystem  → 투사체 이동 + 충돌
  ├── 6. CombatSystem      → 데미지 계산 + 상태이상 + 확률
  ├── 7. DropSystem        → 아이템 드롭 처리
  ├── 8. EconomySystem     → 골드/포인트 관리
  ├── 9. SkillSystem       → 액티브 스킬 쿨다운 + 효과
  └── 10. RenderSystem     → PixiJS 스프라이트 동기화
```

### 2.3 Dependencies

| Component | Depends On | Purpose |
|-----------|-----------|---------|
| Game (core) | PixiJS Application | Canvas 렌더링 호스트 |
| Systems | Game, Entities, Data | 게임 로직 처리 |
| Managers | Systems, Stores | 고수준 오케스트레이션 |
| React Pages | Zustand Stores | UI 상태 구독 |
| Zustand Stores | Game Events | 게임→UI 데이터 동기화 |
| Save System | Zustand Stores, LocalStorage | 영속성 |

---

## 3. Data Model

### 3.1 Core Entity Definitions

```typescript
// === Game Session State (Zustand) ===
interface GameSessionState {
  readonly stageId: number;
  readonly currentWave: number;
  readonly totalWaves: number;
  readonly gold: number;
  readonly baseHealth: number;
  readonly maxBaseHealth: number;
  readonly gameSpeed: 1 | 2 | 3;
  readonly isPaused: boolean;
  readonly isGameOver: boolean;
  readonly towers: readonly TowerInstance[];
  readonly enemies: readonly EnemyInstance[];
  readonly projectiles: readonly ProjectileInstance[];
}

// === Player Persistent State (Zustand + LocalStorage) ===
interface PlayerState {
  readonly starPoints: number;
  readonly gems: number;
  readonly skills: readonly PlayerSkill[];
  readonly weapons: readonly WeaponInstance[];
  readonly inventory: readonly InventoryItem[];
  readonly stageProgress: readonly StageProgress[];
  readonly permanentUpgrades: Record<string, number>;
}

// === Tower Instance (in-game) ===
interface TowerInstance {
  readonly id: string;
  readonly towerId: TowerId;
  readonly position: Position;
  readonly upgradePath: UpgradePath | null;
  readonly upgradeLevel: number;
  readonly equippedWeaponId: string | null;
  readonly currentTarget: string | null;
  readonly attackCooldown: number;
}

// === Enemy Instance (in-game) ===
interface EnemyInstance {
  readonly id: string;
  readonly enemyId: EnemyId;
  readonly currentHealth: number;
  readonly maxHealth: number;
  readonly position: Position;
  readonly pathIndex: number;
  readonly pathProgress: number;
  readonly speed: number;
  readonly effects: readonly StatusEffect[];
  readonly isBoss: boolean;
  readonly bossPhase: number;
}

// === Projectile Instance ===
interface ProjectileInstance {
  readonly id: string;
  readonly sourceId: string;
  readonly targetId: string;
  readonly position: Position;
  readonly speed: number;
  readonly damage: number;
  readonly damageType: DamageType;
  readonly splashRadius: number;
  readonly effects: readonly StatusEffect[];
}
```

### 3.2 Entity Relationships

```
[Player] 1 ──── N [StageProgress]
    │
    ├── 1 ──── N [PlayerSkill]     (해금된 스킬)
    ├── 1 ──── N [WeaponInstance]   (보유 무기)
    ├── 1 ──── N [InventoryItem]    (보유 아이템)
    └── 1 ──── 1 [PermanentUpgrade] (영구 강화)

[GameSession] 1 ──── N [TowerInstance]
    │                      │
    │                      └── 0..1 ──── [WeaponInstance] (장착 무기)
    ├── 1 ──── N [EnemyInstance]
    │                └── 0..N [StatusEffect]
    └── 1 ──── N [ProjectileInstance]

[StageDefinition] 1 ──── N [WaveDefinition]
    └──────────────────── N [EnemyGroup]
```

### 3.3 JSON Data Schema

**towers.json 구조:**
```json
{
  "archer": {
    "id": "archer",
    "name": "Archer Tower",
    "description": "기본 원거리 공격 타워",
    "baseCost": 100,
    "damageType": "physical",
    "baseAttack": 15,
    "baseAttackSpeed": 1.0,
    "baseRange": 150,
    "splashRadius": 0,
    "specialEffect": "none",
    "upgrades": {
      "path1": [
        { "name": "속사", "cost": 150, "attackBonus": 5, "speedBonus": 0.3, "rangeBonus": 0, "specialEffect": "rapid_fire" },
        { "name": "속사 II", "cost": 300, "attackBonus": 10, "speedBonus": 0.5, "rangeBonus": 0, "specialEffect": "rapid_fire_2" },
        { "name": "머신건", "cost": 600, "attackBonus": 15, "speedBonus": 1.0, "rangeBonus": 20, "specialEffect": "machine_gun" }
      ],
      "path2": [
        { "name": "관통", "cost": 200, "attackBonus": 10, "speedBonus": 0, "rangeBonus": 20, "specialEffect": "pierce_1" }
      ],
      "path3": [
        { "name": "치명타", "cost": 200, "attackBonus": 20, "speedBonus": 0, "rangeBonus": 0, "specialEffect": "crit_10" }
      ]
    }
  }
}
```

**stages.json 구조:**
```json
{
  "1": {
    "id": 1,
    "name": "Green Valley",
    "description": "평화로운 녹색 골짜기",
    "mapFile": "maps/stage-01.json",
    "baseHealth": 20,
    "startingGold": 200,
    "isBossStage": false,
    "waves": [
      {
        "waveNumber": 1,
        "delayBeforeWave": 3,
        "groups": [
          { "enemyId": "goblin", "count": 5, "spawnInterval": 1.0, "delayBeforeGroup": 0 }
        ]
      },
      {
        "waveNumber": 2,
        "delayBeforeWave": 5,
        "groups": [
          { "enemyId": "goblin", "count": 8, "spawnInterval": 0.8, "delayBeforeGroup": 0 },
          { "enemyId": "wolf", "count": 3, "spawnInterval": 0.6, "delayBeforeGroup": 2 }
        ]
      }
    ],
    "starCriteria": {
      "oneStar": { "maxLivesLost": 15 },
      "twoStar": { "maxLivesLost": 5 },
      "threeStar": { "maxLivesLost": 0 }
    },
    "rewards": { "starPoints": 10, "gems": 0, "firstClearBonus": 20 }
  }
}
```

---

## 4. Game Systems Specification

### 4.1 System Interface

모든 시스템은 동일한 인터페이스를 구현:

```typescript
interface GameSystem {
  readonly name: string;
  init(game: Game): void;
  update(deltaTime: number): void;
  destroy(): void;
}
```

### 4.2 TowerSystem

| 책임 | 상세 |
|------|------|
| 타워 배치 | 맵 타워 슬롯에 타워 생성, 골드 차감 |
| 타겟 선택 | 사거리 내 적 탐색 (우선순위: First/Strongest/Closest) |
| 공격 실행 | 쿨다운 기반 공격, Projectile 생성 |
| 무기 효과 | 장착 무기에 따른 데미지/효과 수정 |
| 업그레이드 | 3갈래 업그레이드 적용 |
| 판매 | 타워 제거 + 환불 (기본 50%, 스킬로 최대 90%) |

### 4.3 EnemySystem

| 책임 | 상세 |
|------|------|
| 경로 이동 | path 포인트 배열 따라 보간 이동 |
| 속도 수정 | 상태이상(slow, freeze, stun) 반영 |
| 기지 도착 | 경로 끝 도달 시 기지 체력 감소 + 제거 |
| 특수 능력 | 비행, 스텔스, 분열, 치유, 부활 등 |
| 보스 페이즈 | 보스 HP 비율에 따라 페이즈 전환 |

### 4.4 CombatSystem

| 책임 | 상세 |
|------|------|
| 데미지 계산 | `finalDmg = (baseDmg + weaponBonus) * skillMultiplier - armor` |
| 크리티컬 | `Math.random() < critChance` → 데미지 * critMultiplier |
| 속성 저항 | 적의 damageType별 저항 적용 |
| 상태이상 | 독/화상 DOT, 감속, 빙결, 스턴 적용 |
| 회피 | Rogue 등 `Math.random() < dodgeChance` → 미스 |
| 분열 | Slime 처치 시 2개 소형 Slime 생성 |
| 부활 | Necromancer 주변 `Math.random() < reviveChance` → 적 재생성 |

**데미지 공식:**
```
rawDamage = towerBaseAttack + upgradeBonus + weaponBonus
skillMultiplier = 1 + (powerShotLevel * 0.10)
armorReduction = max(0, enemyArmor * (1 - armorPierceLevel * 0.15))

if (damageType === enemy.resistance) rawDamage *= 0.5
if (Math.random() < critChance) rawDamage *= critMultiplier

finalDamage = max(1, rawDamage * skillMultiplier - armorReduction)
```

### 4.5 DropSystem

| 책임 | 상세 |
|------|------|
| 드롭 판정 | 적 처치 시 `Math.random() < dropChance` |
| 등급 결정 | 가중 랜덤: Common 60%, Uncommon 25%, Rare 10%, Epic 4%, Legendary 1% |
| 럭키 골드 | `Math.random() < luckyGoldChance` → 골드 2-3배 |
| 보스 드롭 | 보스는 고정 보석 + 100% 전설 아이템 |
| 보물 상자 | 스테이지 클리어 시 10% 확률 출현 |

### 4.6 WaveSystem

| 책임 | 상세 |
|------|------|
| 웨이브 진행 | 웨이브 간 대기 → 스폰 → 적 전멸 → 다음 웨이브 |
| 적 스폰 | EnemyGroup별 간격/딜레이에 따라 순차 생성 |
| 보스 웨이브 | 5스테이지마다 보스 단독/혼합 웨이브 |
| 인터웨이브 | 웨이브 사이에 상점 접근/타워 재배치 허용 |
| 클리어 판정 | 마지막 웨이브 적 전멸 → 별점 계산 → 보상 |

### 4.7 SkillSystem

| 책임 | 상세 |
|------|------|
| 패시브 적용 | 스킬 레벨에 따라 스탯 수정 (CombatSystem에 전달) |
| 액티브 실행 | 쿨다운 체크 → 범위/효과 적용 → 쿨다운 시작 |
| 해금 조건 | 히든 스킬: 조건 충족 여부 매 클리어 시 체크 |
| 쿨다운 관리 | deltaTime 기반 쿨다운 감소 |

### 4.8 EnhanceSystem (무기 강화)

| 책임 | 상세 |
|------|------|
| 강화 시도 | 보석 차감 → 성공률 판정 (`Math.random() < successRate`) |
| 성공 | enhanceLevel + 1 |
| 실패 | +1~+3: 유지, +4~+7: -1~2단계, +8~+9: 파괴 가능(10-20%) |
| 보호 아이템 | 보호 주문서 소모 → 실패 시 단계 하락/파괴 방지 |
| 축복 | 축복 주문서 소모 → 성공률 +10% |

---

## 5. UI/UX Design

### 5.1 Screen Layout — Game Page

```
┌─────────────────────────────────────────────────────┐
│  [💰 Gold: 500]  [❤️ HP: 20/20]  [🌊 Wave 3/10]   │  ← Top HUD
│  [⏸️] [▶️1x] [⏩2x] [⏩⏩3x]                        │
├─────────────────────────────────────────────────────┤
│                                                     │
│            PixiJS Canvas (Game World)               │
│                                                     │
│     🗼 🗼          👹→→→→→→→🏠                      │
│        🗼       👹→→→→→→→→→                         │
│                                                     │
├──────────────────────────┬──────────────────────────┤
│  Tower Panel             │  Selected Tower Info      │
│  [Archer][Mage][Cannon]  │  Name: Archer Lv.2       │
│  [Frost][Poison][Tesla]  │  ATK: 25  SPD: 1.3       │
│  [Bomb][Support]         │  [Upgrade] [Sell] [Weapon]│
└──────────────────────────┴──────────────────────────┘
```

### 5.2 Screen Layout — Shop Page

```
┌─────────────────────────────────────────────────────┐
│  Shop    [⭐ 150 SP]  [💎 30 Gems]    [← Back]     │
├────────┬────────────────────────────────────────────┤
│ Tabs:  │                                            │
│[Weapons]│  ┌─────────┐ ┌─────────┐ ┌─────────┐    │
│[Skills] │  │ 🔥Fire  │ │ ❄️Ice   │ │ ☠️Poison│    │
│[Items]  │  │ Arrow   │ │ Crystal │ │ Blade   │    │
│[Upgrade]│  │ ⭐50 SP │ │ ⭐80 SP │ │ ⭐60 SP │    │
│         │  │ [Buy]   │ │ [Buy]   │ │ [Owned] │    │
│         │  └─────────┘ └─────────┘ └─────────┘    │
│         │                                           │
│         │  Selected: Fire Arrow                     │
│         │  Rarity: Rare 🔵                          │
│         │  Effect: +15 ATK, Burn DOT                │
│         │  Equip on: Archer Tower                   │
│         │  Enhance: +3 [🔨 Enhance]                 │
└─────────┴───────────────────────────────────────────┘
```

### 5.3 Screen Layout — Skill Tree Page

```
┌─────────────────────────────────────────────────────┐
│  Skill Tree   [⭐ 150 SP]           [← Back]       │
├────────────┬────────────┬───────────────────────────┤
│ ⚔️ Attack  │ 💰 Economy │ 🛡️ Defense               │
├────────────┴────────────┴───────────────────────────┤
│                                                     │
│  [Power Shot Lv.2/3]                                │
│       ↓                                             │
│  [Rapid Fire Lv.1/2] ─→ [Critical Strike Lv.0/3]   │
│       ↓                                             │
│  [Armor Pierce Lv.0/3] ─→ [Chain Attack Lv.0/2]    │
│       ↓                                             │
│  [Meteor Strike 🔒]  [Thunder Storm 🔒]             │
│       ↓                                             │
│  [Berserk Mode 🔒]                                  │
│                                                     │
│  ─── Hidden ───                                     │
│  [🐉 Dragon's Breath] Condition: Beat Boss 10      │
└─────────────────────────────────────────────────────┘
```

### 5.4 User Flow

```
Main Menu
    ├── Stages → Select Stage → Game Play → Result → (Stages / Shop / Skills)
    ├── Shop → Buy/Enhance → Back
    ├── Skills → Learn/Upgrade → Back
    └── Settings → Audio/Keybinds → Back
```

### 5.5 Component List

| Component | Location | Responsibility |
|-----------|----------|----------------|
| `GameCanvas` | `src/components/game/GameCanvas.tsx` | PixiJS 마운트 + 게임 초기화 (dynamic import) |
| `GameHUD` | `src/components/hud/GameHUD.tsx` | 골드, 체력, 웨이브 표시 |
| `TowerPanel` | `src/components/hud/TowerPanel.tsx` | 타워 선택/배치 패널 |
| `TowerInfo` | `src/components/hud/TowerInfo.tsx` | 선택된 타워 정보/업그레이드/판매 |
| `SpeedControls` | `src/components/hud/SpeedControls.tsx` | 배속/일시정지 |
| `WaveIndicator` | `src/components/hud/WaveIndicator.tsx` | 웨이브 진행 표시 |
| `ShopPage` | `src/app/shop/page.tsx` | 상점 페이지 |
| `WeaponCard` | `src/components/shop/WeaponCard.tsx` | 무기 카드 |
| `EnhanceModal` | `src/components/shop/EnhanceModal.tsx` | 무기 강화 모달 |
| `SkillTreePage` | `src/app/skills/page.tsx` | 스킬 트리 페이지 |
| `SkillNode` | `src/components/skill-tree/SkillNode.tsx` | 스킬 노드 |
| `StageSelect` | `src/app/stages/page.tsx` | 스테이지 선택 |
| `StageCard` | `src/components/menu/StageCard.tsx` | 스테이지 카드 (별점 표시) |
| `ResultModal` | `src/components/game/ResultModal.tsx` | 클리어/실패 결과 |
| `MainMenu` | `src/app/page.tsx` | 메인 메뉴 |

### 5.6 Page UI Checklist

#### Game Page (`/game`)

- [ ] HUD: 골드 표시 (숫자, 증감 애니메이션)
- [ ] HUD: 기지 체력 (현재/최대, HP 바)
- [ ] HUD: 웨이브 정보 (현재/총, 다음 웨이브 타이머)
- [ ] HUD: 배속 버튼 (1x/2x/3x 토글)
- [ ] HUD: 일시정지 버튼
- [ ] Panel: 타워 선택 패널 (8종 아이콘 + 비용)
- [ ] Panel: 선택 타워 정보 (이름, 레벨, ATK, SPD, Range)
- [ ] Button: 업그레이드 (3경로 선택)
- [ ] Button: 판매 (환불 금액 표시)
- [ ] Button: 무기 교체
- [ ] Canvas: 타일맵 렌더링
- [ ] Canvas: 적 경로 표시
- [ ] Canvas: 타워 스프라이트 + 사거리 표시
- [ ] Canvas: 적 스프라이트 + HP 바
- [ ] Canvas: 투사체 애니메이션
- [ ] Canvas: 상태이상 이펙트 (독/화상/빙결/스턴)
- [ ] Canvas: 데미지 숫자 팝업 (크리티컬 시 빨간색)
- [ ] Canvas: 드롭 아이템 표시
- [ ] Modal: 액티브 스킬 버튼 (쿨다운 게이지)
- [ ] Modal: 결과 화면 (별점, 보상, 드롭 아이템)

#### Shop Page (`/shop`)

- [ ] Tab: 무기/스킬/아이템/영구강화 4탭
- [ ] Display: 보유 재화 (스타 포인트, 보석)
- [ ] Card: 아이템 카드 (아이콘, 이름, 등급 색상, 가격, 효과)
- [ ] Button: 구매 (재화 부족 시 비활성화)
- [ ] Badge: 보유/미보유 상태 표시
- [ ] Modal: 무기 강화 (현재 단계, 성공률, 비용, 강화 버튼)
- [ ] Animation: 강화 성공/실패 연출
- [ ] Display: 강화 보호 아이템 적용 옵션

#### Skill Tree Page (`/skills`)

- [ ] Tab: 공격/경제/방어 3계열
- [ ] Node: 스킬 노드 (아이콘, 이름, 레벨, 잠금 상태)
- [ ] Edge: 스킬 간 연결선 (선행 조건)
- [ ] Panel: 스킬 상세 (설명, 레벨별 효과, 비용)
- [ ] Button: 스킬 습득/업그레이드
- [ ] Display: 히든 스킬 영역 (조건 + 진행도)

#### Stage Select Page (`/stages`)

- [ ] Grid: 스테이지 카드 (25개)
- [ ] Card: 스테이지 번호, 이름, 별점(0-3), 보스 아이콘
- [ ] Lock: 미해금 스테이지 잠금 표시
- [ ] Display: 보유 재화
- [ ] Button: 스테이지 진입

---

## 6. Error Handling

### 6.1 Game Error Types

| Error | Cause | Handling |
|-------|-------|----------|
| Asset load failure | 스프라이트/맵 파일 누락 | fallback 플레이스홀더 + 콘솔 경고 |
| Invalid game data | JSON 파싱 실패 | 에러 화면 + 기본값 |
| Performance drop | 60fps 이하 | 자동 파티클 감소 |
| Save corruption | LocalStorage 깨짐 | 새 게임 제안 + 백업 복구 |
| Infinite loop | 잘못된 경로 데이터 | 최대 반복 제한 (1000) |

### 6.2 Error Boundary

```typescript
// React Error Boundary로 게임 크래시 격리
// GameCanvas 컴포넌트를 ErrorBoundary로 래핑
// 크래시 시 "게임 재시작" 버튼 제공
```

---

## 7. Security Considerations

- [ ] LocalStorage 세이브 데이터 무결성 체크 (간단한 checksum)
- [ ] 게임 데이터 JSON 변조 방지 (CRC 검증)
- [ ] XSS 방지 (사용자 입력 없으므로 최소 위험)
- [ ] 콘솔을 통한 치트 방지는 Out of Scope (클라이언트 게임 한계)

---

## 8. Test Plan

### 8.1 Test Scope

| Type | Target | Tool | Phase |
|------|--------|------|-------|
| Unit | 게임 시스템 로직 (데미지 계산, 확률, 경로 이동) | Vitest | Do |
| Unit | Zustand 스토어 액션 | Vitest | Do |
| Integration | System 간 상호작용 (타워공격→적피격→골드) | Vitest | Do |
| E2E | 게임 플로우 (스테이지 선택→플레이→클리어) | Playwright | Do |

### 8.2 Unit Test Scenarios

| # | System | Test Description | Expected |
|---|--------|-----------------|----------|
| 1 | CombatSystem | 기본 데미지 계산 정확성 | `rawDmg - armor = finalDmg` |
| 2 | CombatSystem | 크리티컬 확률 30%일 때 1000회 시 250-350회 | 통계적 범위 내 |
| 3 | CombatSystem | 속성 저항 적용 | 저항 시 50% 데미지 감소 |
| 4 | DropSystem | 드롭 등급 분포 10000회 | Common ~60%, Legendary ~1% |
| 5 | EnhanceSystem | +5→+6 성공률 60% 검증 | 1000회 시 550-650 성공 |
| 6 | EnhanceSystem | +9→+10 실패 시 파괴 20% | 1000회 실패 중 180-220 파괴 |
| 7 | EnemySystem | 경로 이동 정확성 | 경로 포인트 순서대로 이동 |
| 8 | WaveSystem | 웨이브 스폰 타이밍 | 설정된 간격대로 스폰 |
| 9 | SkillSystem | 패시브 스킬 스탯 수정 | PowerShot Lv.2 → +20% ATK |
| 10 | SkillSystem | 액티브 스킬 쿨다운 | 사용 후 설정 시간동안 비활성화 |

### 8.3 E2E Scenarios

| # | Scenario | Steps | Success Criteria |
|---|----------|-------|-----------------|
| 1 | 기본 플레이 | 메뉴→Stage 1→타워 배치→웨이브 클리어 | 결과 화면 표시, 별점 1+ |
| 2 | 상점 구매 | 클리어→상점→무기 구매→인벤토리 확인 | 무기 보유, SP 차감 |
| 3 | 스킬 습득 | 스킬 트리→Power Shot 습득→게임에서 효과 확인 | ATK +10% 적용 |
| 4 | 무기 강화 | 상점→무기 선택→강화 시도→결과 확인 | 성공/실패 정상 |
| 5 | 세이브/로드 | 진행→새로고침→로드→상태 확인 | 골드/스킬/진행도 유지 |

### 8.4 Seed Data Requirements

| Entity | Minimum Count | Key Fields Required |
|--------|:------------:|---------------------|
| Tower Definitions | 8 | 전체 타워 JSON 데이터 |
| Enemy Definitions | 15 | 전체 적 JSON 데이터 |
| Stage Definitions | 5 (Phase 1) | Stage 1-5 맵+웨이브 데이터 |
| Skill Definitions | 24 | 전체 스킬 JSON 데이터 |
| Weapon Definitions | 10 | 최소 무기 JSON 데이터 |

---

## 9. Clean Architecture

### 9.1 Layer Structure

| Layer | Responsibility | Location |
|-------|---------------|----------|
| **Presentation** | React 페이지/컴포넌트, HUD | `src/app/`, `src/components/` |
| **Application** | Zustand 스토어, 게임 매니저 | `src/stores/`, `src/game/managers/` |
| **Domain** | 게임 시스템, 엔티티, 타입 | `src/game/systems/`, `src/game/entities/`, `src/types/` |
| **Infrastructure** | PixiJS 렌더링, LocalStorage, 에셋 로딩 | `src/game/rendering/`, `src/features/save/`, `src/game/core/` |

### 9.2 Dependency Rules

```
┌─────────────────────────────────────────────────────────┐
│   Presentation (React UI)                                │
│       ↓                                                  │
│   Application (Zustand Stores, Managers)                 │
│       ↓                                                  │
│   Domain (Systems, Entities, Types) ← Infrastructure     │
│                                       (PixiJS, Storage)  │
│                                                          │
│   Rule: Domain은 외부 의존성 없이 순수 로직만              │
│         Systems는 PixiJS를 직접 참조하지 않음              │
│         렌더링은 RenderSystem이 전담                       │
└─────────────────────────────────────────────────────────┘
```

### 9.3 This Feature's Layer Assignment

| Component | Layer | Location |
|-----------|-------|----------|
| GameCanvas | Presentation | `src/components/game/GameCanvas.tsx` |
| GameHUD, TowerPanel | Presentation | `src/components/hud/` |
| ShopPage, SkillTreePage | Presentation | `src/app/shop/`, `src/app/skills/` |
| gameStore, playerStore | Application | `src/stores/` |
| TowerManager, EnemyManager | Application | `src/game/managers/` |
| TowerSystem, CombatSystem | Domain | `src/game/systems/` |
| Tower, Enemy entities | Domain | `src/game/entities/` |
| All type definitions | Domain | `src/types/` |
| SpritePool, TileRenderer | Infrastructure | `src/game/rendering/` |
| saveManager | Infrastructure | `src/features/save/` |
| Game, GameLoop | Infrastructure | `src/game/core/` |

---

## 10. Coding Convention Reference

### 10.1 Naming Conventions

| Target | Rule | Example |
|--------|------|---------|
| React Components | PascalCase.tsx | `GameHUD.tsx`, `TowerPanel.tsx` |
| Game Classes | PascalCase.ts | `TowerSystem.ts`, `Enemy.ts` |
| Stores | camelCase.ts | `gameStore.ts`, `playerStore.ts` |
| Types | PascalCase | `TowerInstance`, `EnemyDefinition` |
| Constants | UPPER_SNAKE | `MAX_TOWERS`, `BASE_HEALTH` |
| JSON data keys | camelCase | `baseAttack`, `spawnInterval` |
| Folders | kebab-case | `skill-tree/`, `game-canvas/` |

### 10.2 Game-Specific Conventions

| Item | Convention |
|------|-----------|
| Entity ID 생성 | `crypto.randomUUID()` |
| 게임 시간 단위 | 초 (float) |
| 좌표 시스템 | 좌상단 원점, 픽셀 단위 |
| 확률 표현 | 0.0 ~ 1.0 (0% ~ 100%) |
| 데미지 최소값 | 항상 1 이상 (`Math.max(1, finalDmg)`) |
| 불변 업데이트 | 스프레드 연산자 `{ ...state, field: newValue }` |

---

## 11. Implementation Guide

### 11.1 File Structure (핵심 파일 목록)

```
src/
├── app/
│   ├── page.tsx               # 메인 메뉴
│   ├── layout.tsx             # 공통 레이아웃
│   ├── game/page.tsx          # 게임 페이지
│   ├── shop/page.tsx          # 상점
│   ├── skills/page.tsx        # 스킬 트리
│   └── stages/page.tsx        # 스테이지 선택
├── components/
│   ├── game/
│   │   ├── GameCanvas.tsx     # PixiJS 마운트 (dynamic import)
│   │   └── ResultModal.tsx    # 결과 모달
│   ├── hud/
│   │   ├── GameHUD.tsx        # 게임 HUD 컨테이너
│   │   ├── TowerPanel.tsx     # 타워 선택 패널
│   │   ├── TowerInfo.tsx      # 타워 상세 정보
│   │   ├── SpeedControls.tsx  # 배속/일시정지
│   │   └── WaveIndicator.tsx  # 웨이브 표시
│   ├── shop/
│   │   ├── WeaponCard.tsx     # 무기 카드
│   │   ├── SkillCard.tsx      # 스킬 카드
│   │   └── EnhanceModal.tsx   # 강화 모달
│   ├── skill-tree/
│   │   ├── SkillNode.tsx      # 스킬 노드
│   │   └── SkillTreeView.tsx  # 트리 뷰
│   ├── menu/
│   │   ├── StageCard.tsx      # 스테이지 카드
│   │   └── MainMenu.tsx       # 메인 메뉴
│   └── ui/
│       ├── Button.tsx         # 공통 버튼
│       ├── Modal.tsx          # 공통 모달
│       ├── ProgressBar.tsx    # HP/쿨다운 바
│       └── CurrencyDisplay.tsx # 재화 표시
├── game/
│   ├── core/
│   │   ├── Game.ts            # 메인 게임 클래스
│   │   ├── GameLoop.ts        # rAF 기반 게임 루프
│   │   └── AssetLoader.ts     # 스프라이트시트/사운드 로딩
│   ├── entities/
│   │   ├── Tower.ts           # 타워 엔티티
│   │   ├── Enemy.ts           # 적 엔티티
│   │   ├── Projectile.ts      # 투사체
│   │   └── Effect.ts          # 이펙트 (폭발, 상태이상)
│   ├── systems/
│   │   ├── TowerSystem.ts     # 타워 배치/공격
│   │   ├── EnemySystem.ts     # 적 이동/특수능력
│   │   ├── ProjectileSystem.ts # 투사체 이동/충돌
│   │   ├── CombatSystem.ts    # 데미지/크리/상태이상/확률
│   │   ├── WaveSystem.ts      # 웨이브 관리
│   │   ├── DropSystem.ts      # 아이템 드롭
│   │   ├── EconomySystem.ts   # 골드/포인트
│   │   ├── SkillSystem.ts     # 스킬 효과/쿨다운
│   │   └── EnhanceSystem.ts   # 무기 강화 로직
│   ├── managers/
│   │   ├── TowerManager.ts    # 타워 CRUD 오케스트레이션
│   │   ├── EnemyManager.ts    # 적 풀 관리
│   │   ├── MapManager.ts      # 맵/경로 관리
│   │   └── EffectManager.ts   # 파티클/이펙트
│   ├── rendering/
│   │   ├── SpritePool.ts      # 오브젝트 풀링
│   │   ├── TileRenderer.ts    # 타일맵 렌더링
│   │   └── ParticleSystem.ts  # 파티클
│   └── utils/
│       ├── pathfinding.ts     # 경로 보간
│       ├── collision.ts       # 충돌 검사
│       ├── objectPool.ts      # 제네릭 오브젝트 풀
│       └── random.ts          # 확률/랜덤 유틸
├── features/
│   ├── shop/
│   │   ├── shopStore.ts       # 상점 상태
│   │   └── shopData.ts        # 상점 아이템 로더
│   ├── skills/
│   │   ├── skillStore.ts      # 스킬 상태
│   │   └── skillData.ts       # 스킬 데이터 로더
│   ├── weapons/
│   │   ├── weaponStore.ts     # 무기/강화 상태
│   │   └── weaponData.ts      # 무기 데이터 로더
│   ├── inventory/
│   │   └── inventoryStore.ts  # 인벤토리 상태
│   └── save/
│       └── saveManager.ts     # LocalStorage 세이브/로드
├── stores/
│   ├── gameStore.ts           # 게임 세션 상태
│   ├── playerStore.ts         # 플레이어 영속 상태
│   └── uiStore.ts             # UI 상태 (선택된 타워, 모달)
├── types/
│   ├── common.ts
│   ├── tower.ts
│   ├── enemy.ts
│   ├── skill.ts
│   ├── weapon.ts
│   └── stage.ts
└── lib/
    ├── constants.ts           # 게임 상수
    └── helpers.ts             # 범용 유틸
```

### 11.2 Implementation Order

**Module 1: Core Engine (Phase 1)**
1. [ ] `Game.ts`, `GameLoop.ts` — 게임 루프 기반
2. [ ] `AssetLoader.ts` — 에셋 로딩 시스템
3. [ ] `MapManager.ts`, `TileRenderer.ts` — 맵 렌더링
4. [ ] `Tower.ts`, `TowerSystem.ts` — 타워 배치/공격
5. [ ] `Enemy.ts`, `EnemySystem.ts` — 적 이동
6. [ ] `Projectile.ts`, `ProjectileSystem.ts` — 투사체
7. [ ] `CombatSystem.ts` — 기본 데미지 계산
8. [ ] `WaveSystem.ts` — 웨이브 스폰
9. [ ] `EconomySystem.ts` — 골드 관리
10. [ ] `GameCanvas.tsx`, `GameHUD.tsx` — React 연동
11. [ ] `gameStore.ts` — Zustand 게임 상태

**Module 2: Content & Upgrades (Phase 2)**
12. [ ] 나머지 타워 5종 JSON 데이터
13. [ ] 나머지 적 10종 JSON 데이터
14. [ ] 타워 업그레이드 트리 구현
15. [ ] 보스 시스템 (페이즈 전환)
16. [ ] `SpritePool.ts` — 오브젝트 풀링 최적화
17. [ ] `ParticleSystem.ts` — 이펙트/파티클

**Module 3: RPG Systems (Phase 3)**
18. [ ] `DropSystem.ts` — 드롭/확률 시스템
19. [ ] `SkillSystem.ts` — 24종 스킬
20. [ ] `EnhanceSystem.ts` — 무기 강화
21. [ ] `shopStore.ts`, `ShopPage` — 상점 UI
22. [ ] `skillStore.ts`, `SkillTreePage` — 스킬 트리 UI
23. [ ] `weaponStore.ts`, `EnhanceModal` — 무기/강화 UI
24. [ ] `inventoryStore.ts` — 인벤토리
25. [ ] `saveManager.ts` — 세이브/로드

**Module 4: Polish (Phase 4)**
26. [ ] Stage 16-25 맵/웨이브 데이터
27. [ ] 보스 3종 추가 (15, 20, 25)
28. [ ] 튜토리얼 시스템
29. [ ] 사운드/BGM
30. [ ] 밸런싱
31. [ ] 성능 최적화

### 11.3 Session Guide

#### Module Map

| Module | Scope Key | Description | Estimated Turns |
|--------|-----------|-------------|:---------------:|
| Core Engine | `module-1` | 게임 루프, 맵, 타워/적/투사체, 웨이브, 전투, HUD | 80-100 |
| Content & Upgrades | `module-2` | 나머지 타워/적, 업그레이드 트리, 보스, 파티클 | 60-80 |
| RPG Systems | `module-3` | 드롭, 스킬, 강화, 상점/스킬UI, 인벤토리, 세이브 | 80-100 |
| Polish | `module-4` | 추가 스테이지, 보스, 튜토리얼, 사운드, 밸런싱 | 60-80 |

#### Recommended Session Plan

| Session | Phase | Scope | Turns |
|---------|-------|-------|:-----:|
| Session 1 | Plan + Design | 전체 (완료) | 30-35 |
| Session 2 | Do | `--scope module-1` (Core Engine Part 1: Loop, Map, Tower) | 40-50 |
| Session 3 | Do | `--scope module-1` (Core Engine Part 2: Enemy, Combat, Wave, HUD) | 40-50 |
| Session 4 | Do | `--scope module-2` (Content & Upgrades) | 60-80 |
| Session 5 | Do | `--scope module-3` (RPG Systems) | 80-100 |
| Session 6 | Do | `--scope module-4` (Polish) | 60-80 |
| Session 7 | Check + Act | Gap analysis + iteration | 30-40 |
| Session 8 | Report | Completion report | 10-15 |

---

## Version History

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 0.1 | 2026-04-13 | Initial draft — Option C (Pragmatic Modular) selected | jungm |
