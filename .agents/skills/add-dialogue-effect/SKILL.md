---
name: add-dialogue-effect
description: Use when adding a new variant to the DialogueEffect or DialogueCondition unions (e.g. unlocking a zone, granting a recipe, reading a dialogue flag, checking reputation). Walks every touch-point so the variant compiles, runs and shows in the dialogue UI. Triggers on "add a new dialogue effect", "support recipe rewards from dialogue", "add a flag condition", "extend dialogue conditions with X".
---

# Add a dialogue effect or condition

Engine overview: `docs/systems/dialogue.md`. Settle with the user first: effect or condition, the `type` string, the payload shape, and which store it reads or writes.

Use the `action` discriminator for related behaviors (one `RecipeEffect` with `action: 'unlock' | 'forget'`), as `QuestEffect`, `ItemEffect` and `StatEffect` do.

## Effect

1. **Type** — add the interface to `src/types/dialogues/dialogue-effect.type.ts` and append it to `DialogueEffect`.
2. **Engine** — add a `case` to `applyEffects` in `src/app/services/dialogue-manager.service.ts`. Call a store method; add one to the store if missing (e.g. a recipe unlock goes through `PlayerStore`, which owns `unlockedRecipes`). Inject new dependencies with `inject()`.
3. **Label** — extend `getEffectLabel` in `src/app/components/game/dialogue/dialogue.component.ts`, using an i18n key (entity names via their namespace, e.g. `items:names.<ItemID key>`, `camp:` for recipes and stations).
4. **Style** (optional) — add a `[class.effect-<type>]` binding in `dialogue.component.html` next to `effect-quest`/`effect-stat`, and a color in `dialogue.component.sass`.

## Condition

1. **Type** — add the interface to `src/types/dialogues/dialogue-condition.type.ts` and append it inside the `{ hidden?: boolean } & (…)` union.
2. **Engine** — add a `case` to `checkCondition` in `dialogue-manager.service.ts`. The `default` returns `false`, so a missing case hides every result using the variant.
3. **Label** — extend `getConditionLabel` in `dialogue.component.ts` if the condition can appear in `requirementsNeeded`. Routing-only conditions should be authored with `hidden: true`.

## Finish

- Add the new variant to the conditions or effects description in `docs/systems/dialogue.md`.
- Use it in one real dialogue and walk that branch in the dev server.

Done when `npm run check` passes and the new branch behaves as intended in the dev server.
