---
name: add-quest
description: Use when adding a new quest to the game — a start-gated, step-based objective with requirements and rewards, offered and turned in through NPC dialogue. Covers QuestID registration, QUEST_DATA definition, dialogue wiring via the existing QuestEffect/QuestCondition types, and i18n. No store code changes needed — quest progression is fully generic. Triggers on phrases like "add a new quest", "give this NPC a quest to hand out", "create a quest for X", "chain a quest off Y", "add a turn-in for this quest".
---

# Add a Quest

A quest is almost entirely static data (`QUEST_DATA`) plus dialogue wiring. Runtime
progression is fully generic in `QuestsStore` — never edit `quests.store.ts` for a new
quest; it operates purely off whatever `QuestProps` you define.

## Prerequisites — read first

- `src/enums/ids/quest-id.enum.ts` — existing `QuestID` values and questline grouping.
- `src/data/quests-data.ts` — reference entries: `QuestID.meatShortage` (standalone),
  and the chain `signsOfRot → fetchesAndFangs → theSapThatBurns → theBlightedHeart`
  (chained).
- `src/app/store/quests/quests.store.ts` — confirm it's generic, don't touch it.
- `src/types/dialogues/dialogue-effect.type.ts` — `QuestEffect { type: 'quest',
  questId, action: 'start' | 'advance' | 'end' }`.
- `src/types/dialogues/dialogue-condition.type.ts` — `QuestCondition { type: 'quest',
  questId, questState, step? }` and `ManyQuestsCondition`.
- `src/data/dialogues/laHarparTown/laHarparBartender.ts` — inline single-option
  turn-in.
- `src/data/dialogues/mawoodTown/mawoodCorwin.ts` — offer/progress/complete node
  triad, questline chaining.
- `src/assets/locales/en/quests.json`.

## Step 1 — Register a QuestID

`src/enums/ids/quest-id.enum.ts` — add an entry under the right questline comment
group, or start a new one. Never renumber existing values.

```ts
export enum QuestID {
  // ...existing entries
  // Mawood — Sylvie
  silkAndWater = 8,
  theInfestation = 9,
  newQuestHere = 16,   // ← new
}
```

## Step 2 — Define the QUEST_DATA entry

`src/data/quests-data.ts` — add an entry to `QUEST_DATA`. Two shapes, pick the one
that fits:

**Shape A — standalone** (`meatShortage` model): gated on a stat, one `steps[]` entry,
mixed `StatReward`/`ItemReward`.

```ts
[QuestID.newQuestHere]: {
  questId: QuestID.newQuestHere,
  startRequirements: [{ type: 'stat', key: 'level', amount: 1 }],
  steps: [
    {
      description: 'Plain inline English describing the objective, not an i18n key.',
      requirements: [{ type: 'item', itemId: ItemID.someItem, amount: 10 }],
    },
  ],
  rewards: [
    { type: 'stat', key: 'experience', amount: 1000 },
    { type: 'stat', key: 'goldCoins', amount: 200 },
  ],
},
```

**Shape B — chained** (`fetchesAndFangs` model): gated on the prior quest's
completion.

```ts
[QuestID.newQuestHere]: {
  questId: QuestID.newQuestHere,
  startRequirements: [
    { type: 'quest', questId: QuestID.priorQuestInChain, step: QUEST_STEP_AFTER_COMPLETED },
  ],
  steps: [ /* same shape as above */ ],
  rewards: [ /* ... */ ],
},
```

`QUEST_STEP_AFTER_COMPLETED` goes inside the **new** quest's `startRequirements`,
referencing the **prior** quest's ID — never self-referenced.

`requirements[]` supports `'item'`, `'wave'` (`WaveKillCountRequirement`), `'enemy'`
(`EnemyKillCountRequirement`), `'quest'`, and `'stat'` — mix as needed within one step.

Every quest in this codebase today has exactly **one** `steps[]` entry. The type
supports multiple (`QuestStepProps[]`), but there's no reference dialogue wiring for a
step-2+ turn-in — if the user wants a genuinely multi-step quest with separate turn-ins
per step, flag that there's no pattern to copy and work it out with them before
guessing at the UX.

Step `description` is plain inline English, always — never an i18n key.

## Step 3 — Wire dialogue: offer and turn-in

**Offer** — an option whose result starts the quest, optionally gated by a
`QuestCondition`:

```ts
{
  responseKey: `${NS}:default.someOffer`,
  results: [
    {
      next: SomeConversationID.default,
      closeDialogue: true,
      effects: [{ type: 'quest', action: 'start', questId: QuestID.newQuestHere }],
    },
  ],
},
```

**Turn-in — Pattern A (Corwin-style, multi-node)**: use for a questline hub where
several quests' turn-ins/offers live under one option. Stack results
**most-specific-first** — turn-in-ready, then in-progress, then the offer fallback last:

```ts
{
  responseKey: `${NS}:default.work`,
  results: [
    // turn-in ready — routes to a dedicated "complete" node, doesn't apply effects here
    {
      visibilityConditions: [{ type: 'quest', questId: QuestID.newQuestHere, questState: QuestState.active, step: 1 }],
      next: SomeConversationID.newQuestComplete,
      requirementsNeeded: [{ type: 'item', itemId: ItemID.someItem, amount: 10 }],
    },
    // in progress — no requirementsNeeded, just a status message
    {
      visibilityConditions: [{ type: 'quest', questId: QuestID.newQuestHere, questState: QuestState.active }],
      next: SomeConversationID.newQuestProgress,
    },
    // offer fallback — no visibilityConditions, always matches last
    { next: SomeConversationID.newQuestOffer },
  ],
},
```

The `...Complete` node's own single option is where the effects actually apply — `end`
+ item-take, in the *next* node reached after clicking, not on the gated hub option
itself:

```ts
[SomeConversationID.newQuestComplete]: {
  id: SomeConversationID.newQuestComplete,
  messageKey: `${NS}:newQuestComplete.message`,
  options: [
    {
      responseKey: `${NS}:newQuestComplete.opt1`,
      results: [
        {
          next: SomeConversationID.default,
          effects: [
            { type: 'quest', action: 'end', questId: QuestID.newQuestHere },
            { type: 'item', action: 'take', items: [{ itemId: ItemID.someItem, amount: 10 }] },
          ],
        },
      ],
    },
  ],
},
```

To auto-chain into the next quest, add a `start` effect alongside the `end` effect in
that same `effects[]` array (see `questTheSapComplete` in `mawoodCorwin.ts` for a real
example that ends one quest and starts the next in one click).

**Turn-in — Pattern B (bartender-style, single option)**: valid only for single-step
quests. One gated option carries both the `requirementsNeeded` check and the
`advance`-action effect together — no separate complete node:

```ts
{
  responseKey: `${NS}:default.someOffer`,
  results: [
    {
      visibilityConditions: [{ type: 'quest', questId: QuestID.newQuestHere, step: 1, questState: QuestState.active }],
      next: SomeConversationID.default,
      requirementsNeeded: [{ type: 'item', itemId: ItemID.someItem, amount: 10 }],
      effects: [
        { type: 'quest', action: 'advance', questId: QuestID.newQuestHere },
        { type: 'item', action: 'take', items: [{ itemId: ItemID.someItem, amount: 10 }] },
      ],
    },
  ],
},
```

`action: 'advance'` on the only step auto-completes the quest (`QuestsStore.advanceQuest`
detects `currentProgress > steps.length` and finishes it) — equivalent in effect to
`'end'` for a single-step quest. Use `'end'` for Pattern A (dedicated complete node),
`'advance'` for Pattern B (all-in-one option).

## Step 4 — Add i18n keys

`src/assets/locales/en/quests.json` — add the display name under `names`:

```json
"names": {
  "newQuestHere": "New Quest Display Name"
}
```

Add the NPC's new dialogue keys (message + option response keys for any new nodes) to
that NPC's own locale bundle. Step descriptions stay inline in `quests-data.ts`, never
in i18n.

## Step 5 — (Optional) Gate quest availability

Same shape as `/add-shop` Step 5. Use `visibilityConditions` on the offering dialogue
result to hide the option entirely until met, or `requirementsNeeded` to show it
visible-but-disabled.

## Step 6 — Smoke test

1. Offer appears (respecting any gating) → accept → quests tab shows step 1 with the
   correct description.
2. A real trigger (kill count, wave clear, or picking up the required item) progresses
   the requirement.
3. Turn-in option appears once the requirement is satisfied.
4. Turn-in applies rewards → `QuestCompletedComponent` shows the correct rewards.
5. Quest moves from active to the "Completed" filter in the quests tab.
6. Chained quest (if any) becomes offerable, or auto-starts if chained via a combined
   `end`+`start` effect.
7. Reload the page → progression persists.
8. `npx tsc --noEmit` passes.

## How the runtime works (for debugging)

- `QuestsStore.questStepProgression` — persisted to `localStorage` key `questsStore`.
  Maps `QuestID` → current step number, or the sentinel `QUEST_STEP_AFTER_COMPLETED`
  (`9999`). Inspect in devtools.
- **No requirement type auto-progresses a quest.** `BattleManagerService.handleEnemyDeath`
  computes `activeQuestIds()` (any quest not at the completed sentinel) and feeds it
  into `playerStore.processBattleEnd`, but that only gates quest-specific item drops
  and updates generic kill/zone counters — it never advances quest step state directly.
  `ItemRequirement`, `WaveKillCountRequirement`, and `EnemyKillCountRequirement` are all
  checked the same way: via `requirementsNeeded` on the turn-in dialogue option, which
  reads the player's current counters/inventory at the moment the option is evaluated.
  The actual state transition (`advanceQuest`/`endQuest`) only happens when the player
  clicks through that gated dialogue option.
- `advanceQuest` increments the stored step; if it goes past `steps.length` it
  auto-completes via `handleQuestCompleted`. `endQuest` completes immediately
  regardless of step count — used by Pattern A's dedicated complete node.

## Common mistakes

- Missing `QuestID` enum entry — `Record<QuestID, QuestProps>` becomes incomplete and
  TypeScript will complain.
- Missing `action` on a `QuestEffect` — it's a required field.
- Putting `QUEST_STEP_AFTER_COMPLETED` on the wrong quest — it belongs in the **new**
  quest's `startRequirements`, referencing the **prior** quest's ID, never
  self-referenced.
- Putting the step `description` in an i18n file instead of inline in
  `quests-data.ts`.
- A turn-in option with `requirementsNeeded` but no preceding active-quest
  `visibilityConditions` check — it'll be evaluated (and shown gated) even when the
  quest was never started.
- Assuming a kill-count or wave-clear requirement auto-advances the quest without a
  `requirementsNeeded`-gated dialogue option to click through — it doesn't; every
  requirement type needs an explicit turn-in interaction.
- Referencing a reward `ItemID` that doesn't exist yet in `ITEM_DATA`.
- Assuming a multi-entry `steps[]` "just works" for turn-in UX — there's no reference
  implementation to copy; work it out explicitly instead of guessing.
