---
name: add-dialogue-effect
description: Use when adding a new variant to the DialogueEffect or DialogueCondition discriminated unions (e.g. unlocking a zone, granting a recipe, checking a town reputation, reading a dialogue flag). Walks all five touch-points required so the new variant compiles, runs, and shows up in the dialogue UI. Triggers on phrases like "add a new dialogue effect", "support recipe rewards from dialogue", "add a flag condition", "extend dialogue conditions with X".
---

# Add a New Dialogue Effect or Condition

The `DialogueEffect` and `DialogueCondition` unions are touched in five places. Miss any
one and the variant either fails to compile, falls through silently (see analysis §5.1),
or works at runtime but never shows up in the UI.

Use this skill when adding **either** an effect (causes a state change on the player or
quest) **or** a condition (gates visibility / requirement). The procedure is symmetric.

## When invoked
Ask the user:
1. Effect or condition?
2. The `type` discriminator string (e.g., `'recipe'`, `'flag'`, `'reputation'`).
3. The shape of its payload.
4. Which store the runtime needs to read/write.

## Effect — five touch-points

### 1. Type
`src/types/dialogues/dialogue-effect.type.ts`
Add the new interface and append it to the `DialogueEffect` union.

```ts
export interface RecipeEffect {
  type: 'recipe'
  action: 'unlock' | 'forget'
  recipeId: RecipeID
}

export type DialogueEffect =
  | QuestEffect | StatEffect | ItemEffect | ShopEffect | DialogueFlagEffect
  | RecipeEffect    // ← new
```

### 2. Engine handler
`src/app/services/dialogue-manager.service.ts` — extend `applyEffects` with the new case.

```ts
case 'recipe':
  if (effect.action === 'unlock') this.recipeStore.unlockRecipe(effect.recipeId)
  else this.recipeStore.forgetRecipe(effect.recipeId)
  break
```

Inject any new store at the top of the service (`private recipeStore = inject(RecipeStore)`).

### 3. Store method
If the target store doesn't already have a mutator, add one. Don't reach into the
state shape from the dialogue service — go through a store method.

### 4. UI label
`src/app/components/game/dialogue/dialogue.component.ts` — extend `getEffectLabel`.

```ts
if (effect.type === 'recipe' && effect.action === 'unlock') {
  const recipe = i18next.t(`recipes:names.${RecipeID[effect.recipeId]}`)
  return `Recipe unlocked: ${recipe}`
}
```

### 5. UI styling (optional)
`src/app/components/game/dialogue/dialogue.component.html` — add a `[class.effect-recipe]`
binding alongside `effect-quest`/`effect-stat`, and a colour in `dialogue.component.sass`.

## Condition — five touch-points

### 1. Type
`src/types/dialogues/dialogue-condition.type.ts`
Add the interface and append to the union. Reminder: the union is wrapped with
`{ hidden?: boolean } & (...)` — your new variant inherits `hidden` for free.

```ts
interface FlagCondition {
  type: 'flag'
  name: string
  negate?: boolean
}

export type DialogueCondition = { hidden?: boolean } & (
  | QuestCondition | StatCondition | /* ... */
  | FlagCondition   // ← new
)
```

### 2. Engine handler
`src/app/services/dialogue-manager.service.ts` — extend `checkCondition`.

**CRITICAL:** after analysis-doc fix 1 ([`fix-dialogue-bugs` skill](../fix-dialogue-bugs/SKILL.md)),
the `default` case returns `false`. Forgetting your new case **breaks all visibility**
for that variant, not silently passes. Verify the default is `false` before you start;
if it still returns `true`, your case might appear to work but every author after you
will hit a foot-gun.

```ts
case 'flag': {
  const has = !!this.questStore.dialogueFlags()[c.name]
  return c.negate ? !has : has
}
```

### 3. UI label
`src/app/components/game/dialogue/dialogue.component.ts` — extend `getConditionLabel`.

```ts
if (condition.type === 'flag') {
  return condition.negate ? `(not ${condition.name})` : `(${condition.name})`
}
```

Most flag conditions probably want `hidden: true` (internal routing only). The UI
should respect `hidden` — see [`audit-dialogue` skill](../audit-dialogue/SKILL.md) §15.

### 4. (No store method usually needed for conditions — they're read-only.)

### 5. Author-facing docs
Add an example in `docs/analysis/dialogue-system-analysis.md` §4 (Effects table) or §5
(condition handling list), and update `add-npc-dialogue` skill's "known condition types"
note so future authors don't reach for an obsolete subset.

## Verification

1. `npx tsc --noEmit` — ensure exhaustive discriminated-union narrowing still compiles.
2. Author one usage in a real NPC dialogue and walk through it in dev mode.
3. Confirm the meta-tag shows up in the UI (effects) or that visibility/disabled state
   responds correctly (conditions).

## Don't
- Don't add a variant whose data shape duplicates another's (e.g. a separate
  `RecipeUnlockEffect` and `RecipeForgetEffect`). Use the `action` discriminator pattern
  established by `QuestEffect`/`ItemEffect`/`StatEffect`.
- Don't bypass the store — mutating signal state from inside the dialogue manager makes
  state changes invisible to dev-tools and untestable.
- Don't forget the i18n key for the UI label. Defaulting to `''` is a footgun — players
  see a stray `[]` in the meta row.
