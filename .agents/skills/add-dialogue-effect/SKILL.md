---
name: add-dialogue-effect
description: Use when adding a new variant to the DialogueEffect or DialogueCondition unions (e.g. unlocking a zone, granting a recipe, reading a dialogue flag, checking reputation). Walks every touch-point so the variant compiles, runs and shows in the dialogue UI. Triggers on "add a new dialogue effect", "support recipe rewards from dialogue", "add a flag condition", "extend dialogue conditions with X".
---

# Add a dialogue effect or condition

Engine overview: `docs/systems/dialogue.md`. Settle with the user first: effect or condition, the `type` string, the payload shape, and which store it reads or writes.

Use the `action` discriminator for related behaviors (one `RecipeEffect` with `action: 'unlock' | 'forget'`), as `QuestEffect`, `ItemEffect` and `StatEffect` do.

## Effect

1. **Type** — add the interface to `src/types/dialogues/dialogue-effect.type.ts` and append it to `DialogueEffect`.
2. **Handler** — add an entry to `EFFECT_HANDLERS` in `src/app/services/dialogue-effect-handlers.ts` (the build fails until it exists):
   - `apply(effect, ctx)` calls a store method through the `DialogueContext`; add one to the store if missing (e.g. a recipe unlock goes through `PlayerStore`, which owns `unlockedRecipes`). A new store or service goes into `DialogueContext` and is injected where `DialogueManagerService` builds `ctx`.
   - `cost` (optional) — `gold` it spends, items it `adds` and `removes`; the option is disabled until they fit.
   - `canApply` (optional) — a one-time or stock check beyond the cost.
   - `label` — `DialogueLabel[]` (i18n key plus params; `[]` for no tag). New tag text goes under `app:dialogueTags`; entity names come from their namespace, e.g. `items:names.<ItemID key>`, `camp:` for recipes and stations.
3. **Spec** — a `cost` or `canApply` gets a case in `dialogue-effect-handlers.spec.ts` with a fake context.
4. **Style** (optional) — add a `[class.effect-<type>]` binding in `dialogue.component.html` next to `effect-quest`/`effect-stat`, and a color in `dialogue.component.sass`.

## Condition

1. **Type** — add the interface to `src/types/dialogues/dialogue-condition.type.ts` and append it inside the `{ hidden?: boolean } & (…)` union.
2. **Handler** — add an entry to `CONDITION_HANDLERS` in `src/app/services/dialogue-condition-handlers.ts` (the build fails until it exists): `evaluate(condition, ctx)` and `label` (the requirement tag when it appears in `requirementsNeeded`; `[]` for none). Routing-only conditions should be authored with `hidden: true`.

## Finish

- Add the new variant to the conditions or effects description in `docs/systems/dialogue.md`.
- Use it in one real dialogue and walk that branch in the dev server.

Done when `npm run check` passes and the new branch behaves as intended in the dev server.
