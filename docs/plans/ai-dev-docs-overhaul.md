# AI dev docs overhaul

## Context
Agent-facing docs grew ad hoc: plan-mode outputs dumped in `docs/analysis/`, skills written against older code. Audit (2026-10-21) found:
- `CLAUDE.md` mostly right but wrong in places: pipe is `| i18next` not `| translate`; store folder `shop` not `shops`; 7 i18n namespaces missing from list; `NpcID` lives in `src/enums/map/`; shop no longer a modal; consumables/crafting/unlocks live in `PlayerStore`/`BattleStore`; damage math in `hit-resolution.ts`; zoneless CD unmentioned; 4 components not OnPush.
- 11 of 15 `docs/analysis/*` files are implemented or abandoned plans with no status marker (runes-as-spell-cost abandoned; map plan implemented differently; buff-spell analysis references removed methods). Agents read them as current truth.
- Skills: 3 obsolete one-offs (`fix-dialogue-bugs`, `fix-leaflet-tile-gaps`, `update-shiny-enemy-visuals`); `audit-dialogue`, `add-npc-dialogue`, `add-equipment-item`, `add-shiny-variant`, `add-shop` reference removed heuristics, moved files (`items-data.ts` now aggregator over `src/data/items/*`), wrong shapes (quest rewards, recipe fields).
- No docs for: persistence, game loop/combat, quests, stats/inventory/equipment, consumables & crafting, spells/buffs, zones/waves/unlocks, localization, towns, exploration guild.
- No shared `.claude/settings.json`, no lint, one broken scaffold spec — so agents have no cheap "done" check after adding content.
- Found bug: `dialogues/mawoodElarion` namespace not registered in `app.config.ts:20-32` (Elarion shows raw keys).

Goal: lean always-loaded `CLAUDE.md` with sharp pointers; one current reference doc per system; skills that are accurate and end on a checkable criterion (validation script green); code names that match the domain language in `GLOSSARY.md`.

## Decisions (grilled 2026-10-21)
- Claude Code only · distill + archive old plans · delete obsolete skills, revive useful · add settings.json, validation script, GLOSSARY, new add-* skills.
- **Work on main directly**, no worktree (no parallel work until done). One commit per step, no PR, `docs:`/`chore:`/`fix:`/`refactor:` prefixes.
- **Pre-release: save compatibility not required.** Renames and renumbers allowed; clear localStorage after a breaking state change. No "never renumber enums" rule.
- **Clean up naming mismatches during this plan** (glossary term vs identifier, file name vs symbol, misleading names/comments) — fix them, don't document workarounds. **Behavior bugs** found while writing docs are not fixed silently: list them in the system doc's "Known issues" and raise them with the owner in one batch at the end. Exception: the guild fix below (already decided).
- **Repo audit file** (`docs/analysis/repo-audit-2026-10.md`, untracked) is not committed. Its owner decisions are copied into systems docs as "Intended behavior" lines, then the file is deleted as the last step. No links to it anywhere.
- **No new ADRs.**
- **Tests out of scope.** Delete `src/app/app.spec.ts`; `npm test` is not part of "done" and skills don't mention it.
- Done = `npm run validate` + `npx ng build` green.

## Target layout
```
CLAUDE.md                 lean entry: commands, rules, gotchas, pointer table
GLOSSARY.md               domain language (done in grilling session): term, definition, _Avoid_, Code name only where it differs
README.md                 short human intro + link to CLAUDE.md / docs
docs/
  systems/                CURRENT reference, one per system (new)
  plans/                  forward plans only (keep angular-22-upgrade; archive asset-pipeline-rework)
  adr/                    decisions (unchanged)
  ideas/                  backlog (+ buffs-and-consumable-effects.md stub)
  design/, character/     lore/design (unchanged; add one-line README each)
  analysis/               research only: crab-anatomy-generation
  archive/                implemented/abandoned plans, each with header "Archived <date>: superseded by docs/systems/X.md"
```

## 1. Validation script `scripts/validate-data.mjs` → `npm run validate`
Add `esbuild` as explicit devDependency (pin to currently installed version). Bundle data modules with esbuild, then check, printing `file: problem` lines; errors exit 1, warnings only print:
- enum ↔ data map coverage (Item, Enemy, Zone, Quest, Recipe, Shop, Spell, NPC, Town, SkillNode, Station)
- cross-entity refs (drops, recipes, shop stock, quest rewards, zone enemies, town NPC refs)
- dialogue graph: `next` targets exist, start/firstMeet nodes exist; warn on unreachable
- i18n: keys referenced by data exist; every `src/assets/locales/en/**` namespace registered in `app.config.ts`
- asset urls exist on disk
- **doc refs**: every backticked `path` / `path:symbol` in `CLAUDE.md`, `docs/systems/*`, `.claude/skills/*` exists (required, not optional)

Plain CLI script, no `node:test` wrapper.

Fix current failures in the same step (no allowlist):
- Register `dialogues/mawoodElarion` namespace in `app.config.ts`.
- Add missing `playerStats` i18n keys in `app.json` (magicDamage, magicDamageMultiplier, maxMana, manaRegenRate, currentManaRegenTimer, spellCooldownReduction, shopRefreshCooldown, currentShopRefreshCooldown, increasedSpellDuration, shinyChance, inventorySlots); fix the case mismatch.
- Generate missing assets via `/generate-2d-asset`: `skills/origin.png` (space/cosmic theme), `enemies/unknown.png` (a question mark), `backgrounds/laHarparExplorationGuild.png`.
- Make building `url` optional for zone entrances (northLirold + entrance buildings in `towns-data.ts`) instead of `url: ''`.

## 2. Renames (before docs, so docs use new names)
`refactor(skill-tree):`
- `SkillPointID` → `SkillNodeID` (`skill-node-id.enum.ts`)
- `SkillPoint` interface → `SkillNode` (`skill-node.interface.ts`)
- `unlockedSkillPoints` → `unlockedNodes`, `UnlockedSkillPoints` → `UnlockedNodes`; `unspentSkillPoints` stays (it is the currency)
- `SkillRegion` → `SkillBranch` (`skill-branch.enum.ts`), node field `region` → `branch`; CSS class `skill-node--<key>` unchanged

`refactor(towns):` file `src/enums/map/town-tab-id.enum.ts` → `town-building-id.enum.ts` (symbol already `TownBuildingID`).

`fix(guild):` task monster pool = zones the player has unlocked (`PlayerStore.isZoneUnlocked`), bosses excluded, no hard-coded zone list, drop the `floor(totalTasksCompleted/5)+1` formula and the misnamed `unlockedZoneIds`/`unlockedZoneCount`.

## 3. `docs/systems/*.md` (distill from code + old docs)
Fixed template, short (aim ≤150 lines): **Purpose · Key files (path:symbol) · Data flow · Intended behavior (owner decisions) · Invariants & gotchas · Known issues (inline, from code) · How to extend (link skill)**. Written from code, old docs only as source of the "why". Use `GLOSSARY.md` terms.

Per system: read code → `refactor:` commit for any naming mismatches (build + validate green) → `docs:` commit for the doc.

| System doc | Sources to distill | Key code |
|---|---|---|
| `game-loop-and-combat.md` | CLAUDE.md para | `game-interval.service.ts`, `battle-manager.service.ts`, `hit-resolution.ts` |
| `persistence.md` | — | `store/helpers/with-game-state-sync.hook.ts`; storage keys; lodash `merge` over `initialState` (renamed keys linger as junk); pre-release TODO: save version + migrations before release |
| `player-stats-inventory-equipment.md` | add-equipment-item skill | `player.store.ts`, `store/player/inventory.ts`, `player-stat.type.ts` (stat units, accumulated-mutation gotcha). Intended: enemy drops lost on full inventory is intended; unequip/craft/quest turn-in blocked when no space, show why; gold spending blocked when insufficient (dialogue fees, shops, respec) |
| `dialogue.md` | `dialogue-system-analysis.md` (drop fixed §5), bartender analysis | `dialogue-manager.service.ts`, `npc-data.ts` (`firstMeetNodeId`/`startNodeId`) |
| `quests.md` | — | `quests-data.ts`, `quests.store.ts`, `quest-status.ts` (`active` = ready-to-advance gotcha). Intended: A Tale of a Captain is WIP (no `captainsLetter` source, empty rewards) |
| `skill-tree.md` | `skill-tree-system-analysis.md` | `skill-tree-data.ts`, `skill-tree-graph.ts`, `utils/skill-tree-*`. Intended: Overkill node TODO — overflow damage/kill lets player hit next monster without waiting for respawn |
| `spells-and-buffs.md` | `buff-spell-system-analysis.md`, `magic-shop-spellbook-plan.md` | `spells-data.ts`, `battle.store.ts` buffs/cooldowns, spellbook |
| `consumables-camp-crafting.md` | `ideas/consumables-buff-slots.md`, `ideas/batch-crafting.md` | `consumables-items.data.ts`, `BattleStore.setConsumable/tickConsumables`, `PlayerStore.craftItem`, `recipes-data.ts`, `stations-data.ts`, `store/camp`, Camp tab |
| `zones-waves-unlocks.md` | `unlock-system-plan.md` | `zones-data.ts` (`nextZoneId`), `PlayerStore.isZoneUnlocked`, `unlock-conditions.ts` `UNLOCK_RULES`. Zones unlock on previous boss kill; `UNLOCK_RULES` only covers towns and features |
| `towns-shops-guild.md` | `shop-feature-plan.md` | `towns-data.ts`, `towns.store.ts`, `shop.store.ts`, `exploration-guild.service.ts` |
| `enemies-shiny-pets-bestiary.md` | `shiny-monster-feature-plan.md`, `bestiary-plan.md` | `enemies-data.ts`, `utils/shiny-url.ts`, `pet-items.data.ts`, bestiary tab. Pets drop from normal and shiny enemies |
| `world-map.md` | `map-system-analysis.md`, `fix-leaflet-tile-gaps` skill (gotcha) | `world-map.component.ts`, `world-map-data.ts`, `scripts/tile-map.mjs` |
| `localization.md` | — | `app.config.ts` ns list, `pipes/i18next.pipe.ts`; "register new namespace" gotcha |
| `asset-pipeline.md` | move existing `docs/analysis/asset-pipeline.md` (git mv) | `scripts/asset-gen/*` |

Then `git mv` sources to `docs/archive/` with superseded header: bestiary-plan, buff-spell-system-analysis, dialogue-bug-fix-plan, dialogue-system-analysis, laHarparBartender-dialogue-analysis, magic-shop-spellbook-plan, map-system-analysis, runes-system-plan (header: abandoned, see ideas/README), shiny-monster-feature-plan, shop-feature-plan, skill-tree-system-analysis, unlock-system-plan, plans/asset-pipeline-rework.

Update every inbound link (grep `docs/analysis/` across `.claude/`, `docs/`, `scripts/`, `CLAUDE.md`; asset-generator agent + memory file `project-asset-pipeline.md` reference asset-pipeline path).

Add `docs/ideas/buffs-and-consumable-effects.md` stub: buffs come only from spells; food/potion consumable slots are separate; open question whether to unify.

At the end of this step: present the batch of behavior bugs collected in "Known issues" to the owner.

## 4. GLOSSARY review
`GLOSSARY.md` already written. Re-check every term against code after renames; add any term the systems docs introduce; keep it free of implementation details.

## 5. `CLAUDE.md` rewrite (target ~80 lines) + README
Keep: commands (+`validate`), role, communication, git workflow (verbatim — load-bearing), stack line (+zoneless, `inject()`, OnPush, signal inputs).
Cut: directory tree and namespace list (agent can `ls`/read `app.config.ts`). Replace with **gotchas only an agent can't see**:
- Pre-release: save compatibility not required; renames OK; clear localStorage after breaking state changes.
- New i18n namespace must be registered in `app.config.ts`; pipe is `| i18next`.
- Item data lives in `src/data/items/<category>-items.data.ts`; `items-data.ts` only merges.
- Stats are accumulated `+=` into persisted `stats`, not derived — equip/unequip/respec must mirror.
- `QuestState.active` means ready-to-advance.
- Owner decisions: gold spending blocked when insufficient; full inventory blocks unequip/craft/turn-in (drops lost is intended) — one line + link to systems doc.
- `docs/archive/` is history, never current truth; use `docs/systems/`.
- Change system X → update `docs/systems/X.md` in the same commit.
- Use `GLOSSARY.md` terms in code and docs.
- Done = `npm run validate` + `npx ng build` green.
Pointer table: "Touching X → read `docs/systems/X.md`" (front-loaded system names), plus skills list, GLOSSARY, ideas, ADRs.

`README.md`: what the game is, `npm install && npm start`, scripts, link to CLAUDE.md/docs. `docs/design/README.md`, `docs/character/README.md` one-liners on purpose (portrait briefs).

## 6. Skills
Follow the `writing-for-agents` guidance.
- Delete: `fix-dialogue-bugs`, `fix-leaflet-tile-gaps`, `update-shiny-enemy-visuals`; remove their `skillOverrides` from `settings.local.json`.
- Rewrite `audit-dialogue` → thin skill: run `npm run validate`, then manual checks the script can't (quest hub ordering turn-in → in-progress → offer, gated quest starts, dead-end nodes). Re-enable.
- Fix stale refs in `add-npc-dialogue` (firstMeetNodeId, close button, requirements enforced, ns registration), `add-equipment-item` (items/ files, reward/recipe shapes, drop rolls — refer to symbols not lines), `add-shiny-variant` (`additivePercentStats`, pet file, no onImgError), `add-shop` (inline `townsStore.openShop`, `input.required` shopId), `add-town-building` (`TownBuildingID`), `add-dialogue-effect` (crafting ns, PlayerStore recipes), `add-monster-weakness` (`resolveHit`).
- Replace hard-coded enum numbers/line numbers in all skills with "append next value" + symbol names.
- New skills (same shape as existing add-*: frontmatter triggers, steps, final step = validation green):
  - `add-enemy-and-zone` — EnemyID, enemies-data, drops, zone pool/boss/maxWave, `nextZoneId` chain, sprite via `/generate-2d-asset`, i18n.
  - `add-quest` — QuestID, quests-data steps/rewards, quest hub ordering in NPC tree, start gating, i18n.
  - `add-recipe-or-consumable` — RecipeID/recipes-data, station, consumable item + effect, recipe-item unlock, i18n.
- Every skill ends: "Done when `npm run validate` and `npx ng build` pass."

## 7. `.claude/settings.json` (committed)
Allow, each as both `Bash(...)` and `PowerShell(...)`: `npm run *`, `npx ng build*`, `npx tsc *`, `node scripts/*`, `git worktree add *`, `git worktree list`, read-only git (`git status/diff/log`). Not `git worktree remove` (keeps prompting — worktree removal wiped `node_modules` before). No hooks in v1; optional later: Stop hook running `npm run validate`. Personal stuff (statusline test, WebFetch domains) stays in `settings.local.json`.

## 8. Delete audit
After all owner decisions and relevant findings are in systems docs: delete `docs/analysis/repo-audit-2026-10.md` (untracked — irreversible).

## Verification
- `npm run validate` runs clean; deliberately break one ref (bad ItemID in a drop, unregistered ns, bad path in a systems doc) → exits 1 with clear line.
- `npx ng build` passes after every refactor/fix commit.
- `grep -r "docs/analysis/" .claude docs CLAUDE.md scripts` → only crab-anatomy links remain; no `repo-audit` references anywhere.
- `grep -r "SkillPointID\|SkillRegion\|unlockedSkillPoints\|town-tab-id" src .claude docs` → empty (archive excepted).
- Fresh Claude session: ask "add a new consumable" / "add NPC to Mawood" — confirm it picks right skill, reads right systems doc, ends on validate.
