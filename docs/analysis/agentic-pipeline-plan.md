# Agentic pipeline: fill the "Core Game Logic & Feature Agent" gap + add-quest skill

## Context

User asked to establish a 3-role agentic pipeline (Lore/Narrative, Core Game Logic/Feature, Asset Generation) for this repo. Repo audit found 2 of 3 roles already built:

- **Lore & Narrative** → `.claude/agents/lore-writer.md` (exists, complete).
- **Asset Generation** → `.claude/agents/asset-generator.md`, routed via `/generate-2d-asset` (exists, complete, local ComfyUI/SDXL only).
- **Core Game Logic & Feature** → **missing**. Today this work just happens in the default Claude Code session via CLAUDE.md's thin "Role" line, with no dedicated subagent profile mirroring the other two.

A second, smaller gap surfaced during the audit: quests are a first-class content type (own enum, data file, store, dialogue wiring) but unlike shops/equipment/dialogue-effects/monster-weaknesses, there's no `/add-quest` skill to wire one in.

User confirmed via clarifying questions:
- Build the feature-agent gap as a **real new `.claude/agents/*.md` subagent** (not a CLAUDE.md edit) — mirrors the existing pattern, keeps main-thread context clean on big feature work.
- Asset generation stays **local-only** — no cloud provider work.
- **Add** the `/add-quest` skill.
- **Leave the 4 disabled maintenance skills alone** — out of scope.

Two deliverables, both new files, no existing files need edits.

## Deliverable 1 — `.claude/agents/game-engineer.md`

New subagent for engine/state/UI feature work — anything spanning multiple files, as opposed to single-entity content wiring (which the `/add-*` skills already cover).

**Frontmatter:**
```yaml
---
name: game-engineer
description: Core game-logic and feature engineer for this Angular 20 idle RPG. Implements and modifies NgRx signal stores, the game loop (GameIntervalService), battle mechanics (BattleManagerService), and new/changed UI components and tabs under src/app/components/game — any feature or bug fix that spans multiple files rather than filling in one data template. Triggers on phrases like "implement X feature", "add a new tab", "change how the game loop handles Y", "refactor the battle store", "fix this bug in the crafting system", "add a new mechanic".
tools: [Read, Edit, Write, Bash, Glob, Grep]
---
```
No `WebFetch` — defers generic Angular API questions to the existing `angular-developer` skill instead, keeping tool scope in parity with `lore-writer`/`asset-generator`.

**Body sections to write:**

1. **Opening framing** — owns `src/` engine/feature implementation, invoked explicitly for multi-file work, frees main-thread context on big changes.
2. **"Ground yourself before coding — every time"**:
   - Re-read CLAUDE.md's Architecture/State-management/Game-loop/Data-conventions sections before touching anything.
   - Find the closest sibling before creating anything new — new store → read 2 of `player.store.ts`/`battle.store.ts`/`quests.store.ts`/`shop.store.ts` for the `signalStore({providedIn:'root'}, withState(...), withGameStateSync(KEY, initialState), withDevtools(KEY), withComputed(...), withMethods(...))` shape; new tab → read a sibling under `src/app/components/game/`; new modal → read `quest-completed/` or `shop/` under `src/app/components/modals/`; game-loop change → read `GameIntervalService` in full first (100ms tick, attack-cooldown accumulator, 1s sub-tick) before adding new tick behavior; battle change → read `BattleManagerService` in full (damage calc, crits, spell effects, enemy-death handling incl. `activeQuestIds()` kill tracking, unlock checks) and extend in place.
   - If touching a documented system, read the matching `docs/analysis/*.md` first.
   - Grep for sibling `*.spec.ts` before deciding whether to add/update tests.
3. **"Domain scope — what you own"**: NgRx signal store state/computed/methods; `GameIntervalService` tick logic; `BattleManagerService` damage/spell/crit/unlock logic; new/modified components/tabs/modals/shared UI; cross-cutting bug fixes/refactors; extending `DialogueEffect`/`DialogueCondition` unions *when part of a larger feature already in progress*; new services; routing/UI-chrome i18n (tab labels, buttons — not narrative content).
4. **"What you hand off instead"** (named explicitly): creative writing → `lore-writer`; art → `asset-generator`/`/generate-2d-asset`; single-instance mechanical wiring that already has a skill → name each (`/add-shop`, `/add-equipment-item`, `/add-npc-dialogue`, `/add-town-building`, `/add-dialogue-effect`, `/add-monster-weakness`, `/add-shiny-variant`, `/add-quest`) — rule of thumb: "wire one more instance of an existing content type" means run/follow that skill, never re-derive its wiring from scratch; generic Angular API questions → `angular-developer` skill.
5. **"Verification expectations"**: `inject()` only, never constructor DI; `ChangeDetectionStrategy.OnPush` on every touched component; signals + `computed()`, `patchState` with immutable spreads, never direct mutation; never renumber existing enum values; run `npx tsc --noEmit` before calling anything done; run `npm test` when touching areas with existing spec coverage, and say so when coverage is missing rather than skipping silently; for feel/behavior changes, tell the user to verify via `npm start` since this agent can't visually confirm gameplay.
6. **"Boundaries" closing section**: never write narrative/lore/character voice; never generate/place image assets; never bypass an existing `/add-*` skill's documented wiring for single-entity additions; never renumber enums; never commit (leave changes for review unless explicitly asked); stop and ask when a change is ambiguously "new mechanic" vs. "one more instance of existing content."

## Deliverable 2 — `.claude/skills/add-quest/SKILL.md`

Modeled structurally on `add-shop/SKILL.md` (frontmatter → framing paragraph → prerequisites → numbered steps → runtime debugging notes → smoke test → common mistakes).

**Frontmatter:**
```yaml
---
name: add-quest
description: Use when adding a new quest to the game — a start-gated, step-based objective with requirements and rewards, offered and turned in through NPC dialogue. Covers QuestID registration, QUEST_DATA definition, dialogue wiring via the existing QuestEffect/QuestCondition types, and i18n. No store code changes needed — quest progression is fully generic. Triggers on phrases like "add a new quest", "give this NPC a quest to hand out", "create a quest for X", "chain a quest off Y", "add a turn-in for this quest".
---
```

**Framing paragraph**: a quest is almost entirely static data (`QUEST_DATA`) + dialogue wiring. Runtime progression is fully generic in `QuestsStore` — never edit `quests.store.ts` for a new quest.

**Prerequisites — read first**: `src/enums/ids/quest-id.enum.ts`; `src/data/quests-data.ts` (reference entries `QuestID.meatShortage` for standalone, the `signsOfRot → fetchesAndFangs → theSapThatBurns → theBlightedHeart` chain for chained questlines); `src/app/store/quests/quests.store.ts` (confirm generic, don't touch); `src/types/dialogues/dialogue-effect.type.ts` (`QuestEffect{type:'quest',questId,action:'start'|'advance'|'end'|'fail'}`) and `dialogue-condition.type.ts` (`QuestCondition`, `ManyQuestsCondition`) — no new plumbing needed; reference dialogue files `laHarparTown/laHarparBartender.ts` (inline single-option turn-in) and `mawoodTown/mawoodCorwin.ts` (offer/progress/complete node triad, questline chaining); `src/assets/locales/en/quests.json`.

**Steps:**
1. Register a `QuestID` under the right questline comment group (or a new one); never renumber.
2. Define the `QUEST_DATA` entry — show both shapes: Shape A standalone (`meatShortage` model: `startRequirements` gated on a stat, one `steps[]` entry, mixed `StatReward`/`ItemReward`); Shape B chained (`fetchesAndFangs` model: `startRequirements: [{type:'quest', questId: <prior>, step: QUEST_STEP_AFTER_COMPLETED}]`). Note explicitly: chaining in this codebase = one `QuestID` per questline stage with a single-entry `steps[]`, not multiple `QuestStepProps` in one `QuestProps` (structurally supported but no existing quest/dialogue demonstrates a step-2+ turn-in — flag to user if they want that). Step `description` is plain inline English, never an i18n key.
3. Wire dialogue offer + turn-in: offer option sets `effects:[{type:'quest',action:'start',questId}]`, optionally gated by a `QuestCondition`. Two turn-in patterns with real code shape — Pattern A (Corwin-style: stacked most-specific-first results in the hub's options — turn-in-ready / in-progress / offer fallback — turn-in applies `action:'end'` + item-take effect); Pattern B (bartender-style: one gated option with `action:'advance'`, valid only for single-step quests). To auto-chain, add a `start` effect for the next quest alongside the `end` effect in the same `effects[]` array.
4. i18n: add display name to `quests.json` under `names`; add the NPC's new dialogue keys to its own locale bundle; reminder that step descriptions stay inline, not in i18n.
5. (Optional) Gate quest availability via `visibilityConditions` (fully hidden) or `requirementsNeeded` (visible, disabled) — same shape as `add-shop` Step 5.

**"How the runtime works"**: `BattleManagerService.handleEnemyDeath` computes `activeQuestIds()` (any quest not at the completed/failed sentinel) and feeds it into `playerStore.processBattleEnd`, which is what auto-progresses `WaveKillCountRequirement`/`EnemyKillCountRequirement` with zero dialogue wiring; `ItemRequirement` is only checked via `requirementsNeeded`, actually consumed by the turn-in dialogue's item-take effect; persistence via `withGameStateSync('questsStore', ...)`, inspectable in devtools/`localStorage['questsStore']`.

**Smoke test**: offer appears (respecting gating) → accept → quests tab shows step 1 with correct description → real trigger (kill/wave/item) progresses the requirement → turn-in option appears once satisfied → `QuestCompletedComponent` shows correct rewards → quest moves to "Completed" filter → chained quest (if any) becomes offerable/auto-starts → reload persists progression → `npx tsc --noEmit` passes.

**Common mistakes**: missing `QuestID` enum entry (incomplete `Record<QuestID,QuestProps>`); missing `action` on `QuestEffect` (required field); confusing which quest's ID the `QUEST_STEP_AFTER_COMPLETED` sentinel belongs to (goes on the **prior** quest inside the **new** quest's `startRequirements`, never self-referenced); putting step description in i18n instead of inline; `requirementsNeeded` on a turn-in option without a preceding active-quest `visibilityConditions` check; referencing a reward `ItemID` that doesn't exist yet in `ITEM_DATA`; assuming multi-entry `steps[]` "just works" for turn-in UX with no reference implementation to copy.

## Resolved open questions (from design pass)
- No `WebFetch` on `game-engineer` — parity with existing agents, defers to `angular-developer` skill.
- Quest step descriptions being non-i18n (unlike quest names) is documented as existing convention to preserve, not treated as a bug to fix.
- `/add-quest` doesn't get a dedicated step for "needs a brand-new DialogueEffect/DialogueCondition variant" edge case — covered implicitly via `game-engineer`'s hand-off list pointing to `/add-dialogue-effect`.

## Verification
- Both are new Markdown files — no build/test impact. Verify by:
  1. Confirming frontmatter is valid YAML and matches the schema other `.claude/agents/*.md` and `.claude/skills/*/SKILL.md` files use (no `model:` field, consistent `tools:` array syntax).
  2. Spot-checking that every file path, type name, and method name mentioned resolves to a real symbol (`QuestEffect`, `QuestCondition`, `activeQuestIds()`, `signalStore(...)` pipeline args, etc.) — these were pulled from actual reads of `quests-data.ts`, `dialogue-effect.type.ts`, `dialogue-condition.type.ts`, `quests.store.ts`, `battle-manager.service.ts`, `game-interval.service.ts` during design.
  3. Dry-run: next session, invoke `/add-quest` (or describe a quest to add) and confirm the skill's steps map cleanly onto a real addition without needing extra research; separately, describe a multi-file feature task and confirm `game-engineer` gets selected/invoked appropriately and its "ground yourself" step correctly identifies sibling files.

## Critical files referenced
- `.claude/agents/lore-writer.md`, `.claude/agents/asset-generator.md` — style/structure templates for the new agent.
- `.claude/skills/add-shop/SKILL.md` — style/structure template for the new skill.
- `src/data/quests-data.ts`, `src/app/store/quests/quests.store.ts`, `src/types/dialogues/dialogue-effect.type.ts`, `src/types/dialogues/dialogue-condition.type.ts` — quest system ground truth.
- `src/data/dialogues/mawoodTown/mawoodCorwin.ts`, `src/data/dialogues/laHarparTown/laHarparBartender.ts` — real dialogue wiring examples to cite.
- `CLAUDE.md` — architecture source for `game-engineer`'s domain-knowledge sections.
