# Dialogue System — Bug-Fix Plan

> **Source:** `docs/analysis/dialogue-system-analysis.md` §5 and §6.
> **Audience:** the person who will sit down and apply these fixes.
> **Order:** the bugs are listed in the order they should be fixed. Earlier fixes set
> up the engine guarantees that later fixes rely on. **Do each bug in its own commit.**

Each bug below has the same four sections so you always know where you are:

- **What players see today** — the symptom in-game.
- **Where it lives** — files and line numbers.
- **How to fix it** — numbered, concrete steps.
- **How to verify** — a manual test that proves the fix landed.

---

## Bug 1 — Half the requirement types are silently treated as "met"

### What players see today
The Bartender's "I've got the 50 Crab Meat" option works even with **zero crab meat**.
Josh's beach turn-in works with **zero kills on wave 7**. The Trader's rat quest can be
turned in with **zero rats killed**. Any quest gate based on items, kill counts, or wave
kills is bypassable.

### Where it lives
`src/app/services/dialogue-manager.service.ts:92-134` — the `checkCondition` method.

The switch only handles `'stat'`, `'manyStat'`, and `'quest'`. Everything else falls
through to `default: return true`. So `'item'`, `'manyItems'`, `'killCount'`,
`'manyKillCount'`, `'waveKillCount'`, `'manyWaveKillCount'`, and `'manyQuestCompleted'`
all silently pass.

### How to fix it
1. Open `dialogue-manager.service.ts`. Scroll to `checkCondition` (line 92).
2. Look at the **`checkRequirement`** method just below it (line 136) — it already
   handles `'item'`, `'enemy'`, and `'wave'` correctly. Use the same store calls in
   your new cases.
3. Add these missing cases inside the `switch (c.type)`:
   - **`'item'`** — look up the item in `this.playerStore.inventory()`, return
     `item && item.amount >= c.amount`.
   - **`'manyItems'`** — loop over `c.itemIds`, for each id check `c.amounts[id]`
     against the inventory amount. Every entry must pass.
   - **`'killCount'`** — return
     `this.playerStore.enemyKillCounts()[c.enemyId] >= c.amount`.
   - **`'manyKillCount'`** — `c.enemiesRequired.every(...)` of the same check.
   - **`'waveKillCount'`** — return
     `this.playerStore.getKillCountByZoneAndWave(c.zoneId, c.waveNumber) >= c.amount`.
   - **`'manyWaveKillCount'`** — `c.wavesRequired.every(...)` of the same check.
   - **`'manyQuestCompleted'`** — `c.questsRequired.every(...)`, reusing the existing
     `'quest'` case logic per entry (extract a helper if it gets long).
4. **Change the `default` branch from `return true` to `return false`.** This is the
   single most important line in the fix. From now on, an unknown condition type is
   treated as "not met" — which is the safe default, and any future authoring mistake
   surfaces as a missing option instead of a free pass.

### How to verify
1. Start the dev server.
2. Open localStorage and clear `playerStore`/`questsStore` so you have a clean save.
3. Talk to the Bartender → accept the Meat Shortage quest.
4. **Without** killing crabs, try the "meatShortage" option. It must NOT advance the quest.
5. Kill enough crabs to collect 50 crab meat → the option should now work and remove the 50 meat.
6. Repeat the same check for Josh (waves on Horseshoe Beach) and the Trader (rats).

---

## Bug 2 — Requirement labels are red text, not a real gate

### What players see today
Even after Bug 1 is fixed, the option still **looks identical to a clickable one** and
**still fires on click**. Today the click on a "disabled" option runs the effects
anyway because nothing in the click path checks `requirementsNeeded`.

### Where it lives
- `src/app/services/dialogue-manager.service.ts:45-64` — `selectOption` only looks
  at `visibilityConditions`, never `requirementsNeeded`.
- `src/app/components/game/dialogue/dialogue.component.ts:100-108` — `isOptionDisabled`
  is computed, but...
- `src/app/components/game/dialogue/dialogue.component.html:31-34` — the template
  never reads it. No `[class.disabled]`, no `[attr.disabled]`, no guard on `(click)`.
- `src/app/components/game/dialogue/dialogue.component.sass` — no `.disabled` style.

### How to fix it
**Engine side — make `selectOption` refuse to fire:**
1. In `selectOption`, after the existing `validResult` is found, add:
   ```ts
   if (!this.checkConditions(validResult.requirementsNeeded)) {
     return // requirements not met — do nothing
   }
   ```
   Put it **before** the `applyEffects` call. Don't log an error — this is a legitimate
   player action (clicking a disabled-but-clickable option until the UI fix lands).

**UI side — make disabled options look and behave disabled:**

2. In `dialogue.component.html` (around line 31), bind the disabled class and guard
   the click:
   ```html
   <li
     class="dialogue-modal__option-btn"
     [class.disabled]="isOptionDisabled(option)"
     (click)="!isOptionDisabled(option) && handleOptionClicked(option)"
   >
   ```
3. In `dialogue.component.sass`, under `.dialogue-modal__option-btn`, add:
   ```sass
   &.disabled
     opacity: 0.5
     cursor: not-allowed
     pointer-events: none
   ```
   `pointer-events: none` is a belt-and-braces — the engine guard in step 1 is
   the real protection.

### How to verify
1. With Bug 1's fix in place and zero crab meat, open the Bartender dialogue while
   the Meat Shortage quest is active.
2. The "I've got the 50 Crab Meat" option must render at 50% opacity and not respond
   to clicks.
3. Get 50 crab meat → the option becomes solid and clickable, and works.

---

## Bug 3 — Quest action `'end'` is dropped on the floor

### What players see today
The Trader's "Here are the rat tails" option does nothing useful. The dialogue
advances, but the `ratsWereRats` quest stays `active` forever — the player can hand
it in again and again, with no reward.

### Where it lives
- `src/app/services/dialogue-manager.service.ts:172-183` — `applyEffects` handles
  `'start'`, `'advance'`, `'fail'`, but not `'end'`.
- `src/app/store/quests/quests.store.ts` — no `endQuest` method exists.
- `src/data/dialogues/laHarparTown/laHarparTrader.ts:81` — actually uses `action: 'end'`.

### How to fix it
1. In `quests.store.ts`, add an `endQuest` method that mirrors the tail of `advanceQuest`:
   ```ts
   endQuest(questId: QuestID) {
     const questData = QUEST_DATA[questId]
     patchState(store, (state) => ({
       questStepProgression: {
         ...state.questStepProgression,
         [questId]: QUEST_STEP_AFTER_COMPLETED,
       },
     }))
     store.handleQuestCompleted(questData)
   }
   ```
2. In `dialogue-manager.service.ts`, in `applyEffects`, add the case:
   ```ts
   case 'end':
     this.questStore.endQuest(effect.questId)
     break
   ```

### How to verify
1. Start the Trader's rat quest, kill 50 rats.
2. Talk to the Trader → use the "I'm done with the rats" path (`default.opt1`).
3. The quest-completed modal should pop, rewards should be granted, and the same
   dialogue option should disappear (its `visibilityConditions` require the quest to
   be `active`).

---

## Bug 4 — The Trader's "quest offer" branch is logically broken

### What players see today
This is subtle — the Trader's `questOffer.opt1` has a hidden first result that fires
when the quest is in state `available` (i.e. *not yet started*) and the player happens
to have killed 50 rats. It routes to `questCompleted` but never starts or ends the
quest. So the player sees a "thanks, here's your reward" message but **gets nothing**
and **the quest never actually existed**.

This bug exists today regardless of Bugs 1–3 — fixing those alone leaves this one
intact because the data file authoring is wrong.

### Where it lives
`src/data/dialogues/laHarparTown/laHarparTrader.ts:175-200` — the `questOffer` node's
`opt1` results.

### How to fix it
The intent of the branch is clearly: "if the player already finished the work
(killed 50 rats) while the quest is active, let them complete it here too." That
means the `questState` should be `active` with `step: 1`, and the effect should be
`action: 'end'`.

Edit the first result inside `questOffer.opt1.results`:
```ts
{
  visibilityConditions: [
    {
      type: 'quest',
      questId: QuestID.ratsWereRats,
      questState: QuestState.active,   // was: QuestState.available
      step: 1,                          // was: not set
      hidden: true,
    },
  ],
  next: TraderConversationId.questCompleted,
  requirementsNeeded: [{ type: 'killCount', enemyId: EnemyID.rat, amount: 50 }],
  effects: [{ type: 'quest', action: 'end', questId: QuestID.ratsWereRats }],  // NEW
},
```

The fallback result (the second one, which starts the quest) stays as-is.

### How to verify
1. With a fresh save, talk to the Trader, accept the rat quest (`questOffer.opt1` →
   fallback path).
2. Kill 50 rats.
3. Talk to the Trader again. Use `questOffer.opt1` instead of the `default.opt1`
   turn-in. The dialogue should route to `questCompleted` AND the quest should
   actually end (reward modal pops).
4. Without Bug 3's fix in place, step 3 will silently advance the dialogue but skip
   the reward — that's why Bug 3 has to be fixed first.

---

## Bug 5 — First-visit routing skips the greeting for Elara and Josh

### What players see today
Open Elara's dialogue on a brand-new save → you land on **"apology"** instead of
the greeting. Open Josh's → you land on the **"pay for a beer"** node instead of
the greeting. The player has no idea why the conversation feels like it started
mid-sentence.

### Where it lives
`src/app/services/dialogue-manager.service.ts:72-84` — `startDialogue` uses a magic
heuristic:
```ts
const hasMet = this.questStore.dialogueFlags()[`met_${npcId}`]
const startId = hasMet ? 0 : 1
```

This assumes every NPC follows "0 = hub, 1 = first-meeting intro." Elara and Josh
never set a `met_` flag and don't have a separate first-meeting node, so they're
permanently routed to node id 1 — which happens to be `apology` / `payBeer`.

### How to fix it
1. **Extend the NPC registry type.** In `src/data/npc-data.ts`:
   ```ts
   export interface NPCProps {
     id: NpcID
     url: string
     dialogue: DialogueType
     startNodeId?: number      // default-visit entry. Defaults to 0.
     firstMeetNodeId?: number  // first-time entry. If absent, no intro routing.
   }
   ```
2. **Declare the intent per NPC.** Only Bartender, Trader, and Marvin actually have
   a first-meeting node. Add `firstMeetNodeId: 1` to those three entries. Leave
   Elara and Josh untouched (they'll default to `startNodeId = 0`).
3. **Rewrite `startDialogue`** in `dialogue-manager.service.ts`:
   ```ts
   startDialogue(npcId: NpcID) {
     const data = npcData[npcId]
     if (!data) return

     this.activeNpc.set(data)
     this.currentConversation.set(data.dialogue)

     const hasMet = !!this.questStore.dialogueFlags()[`met_${npcId}`]
     const useFirstMeet = !hasMet && data.firstMeetNodeId !== undefined
     const startId = useFirstMeet
       ? data.firstMeetNodeId
       : (data.startNodeId ?? 0)

     this.currentNodeId.set(startId)
   }
   ```

### How to verify
1. Wipe `questsStore` from localStorage (fresh save).
2. Open Elara → must show the greeting (`default.message`), not the apology.
3. Open Josh → must show the greeting (`greeting.message`), not "pay for a beer."
4. Open the Bartender → must still show `introduction1`. Close, re-open → must
   show `default`. Same checks for Trader (intro1 → default) and Marvin
   (introduction1 → default).
5. **Important — keep this fix in its own commit.** It's a routing behaviour change
   and a save-file consideration; isolating it makes it trivial to revert if it
   breaks something unexpected.

---

## After all five fixes — sweep tasks (optional, low-risk)

These are smaller cleanups documented in the analysis (§6 and §7). They aren't
shipping blockers but are quick wins to do in a follow-up pass:

- **Filter `hidden` conditions in the template** (`dialogue.component.html:41` — wrap
  the `@for` in `@if (!cond.hidden)`). Today hidden conditions are still drawn as red
  meta-tags.
- **Restore the close button** (`dialogue.component.html:5` is commented out). If a
  node has no goodbye option, the player gets trapped.
- **Cover all condition/effect types in `getConditionLabel` and `getEffectLabel`**
  (`dialogue.component.ts:41-86`) — currently most variants return `''`, producing
  empty `[]` tags in the meta row.
- **Implement `openShop`** in `dialogue-manager.service.ts:205` — currently a
  `console.log` stub. Until this is real, the Trader's "I want to buy" option does
  nothing.
- **De-duplicate `getActiveResult`** — same logic exists in `dialogue.component.ts:35`
  and `dialogue-manager.service.ts:35`. Pick one, delete the other.

---

## Suggested commit sequence

```
1. fix(dialogue): handle all condition variants in checkCondition
   - includes flipping default branch from true → false
2. fix(dialogue): enforce requirementsNeeded in engine + UI
3. feat(quests): add endQuest store method + handle 'end' in applyEffects
4. fix(trader): correct questOffer.opt1 to active+step:1 with end effect
5. refactor(dialogue): explicit startNodeId/firstMeetNodeId on NPCProps
6. (follow-up) chore(dialogue): UI polish — hidden conditions, close button, labels
```

Each commit is small (<30 lines), independently revertable, and matches a bug in this
plan. Don't combine.
