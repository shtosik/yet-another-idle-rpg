# Quest panel and reputation

**Scope:** M · **Status:** Accepted 2026-10-25; quest list and Reputation tab done

The quest list on the right showed only quest names: no progress, no cue for a turn-in, completed quests mixed in with active ones, no scrolling and no keyboard access.

## Rule: never spoil quest length
The panel shows the **current step only**. No step number, no step count, no reward preview. "Ready" means the current step's requirements are met, not that the quest is about to finish. Multi-step quests with mechanics beyond killing monsters are planned, so this matters more later.

## Done
- Two tabs at the top: **Quests** and **Reputation** (see below), each its own component (`quest-list/`, `reputation/`). The active tab isn't saved; arrow keys, Home and End move between tabs.
- Active quests only, ready ones sorted to the top with a **Ready** tag and highlight.
- Each requirement of the current step shows its progress: `current / target` with a thin bar (kill counts, wave kills, items, stats); single checks (a quest requirement) show Done / Not yet.
- Clicking a quest name shows the step description.
- Completed quests collapse behind a "Completed (N)" toggle at the bottom.
- The panel body scrolls; rows are buttons with `aria-expanded`.
- One requirement check (`QuestsStore.requirementProgress`) serves both the panel and dialogue.
- **Talk to the giver:** "Talk to {NPC}" opens that NPC's building and starts the conversation. The NPC is the current step's `turnInNpc` in quest data; `npm run validate` checks they stand in a town and their dialogue handles the quest. Shown once the Map and the NPC's town are unlocked.
- **Zone link on kill steps:** a location icon next to an unfinished enemy or wave requirement opens the battle in the first unlocked zone with that enemy (or the wave's zone); already being there keeps the current wave.
- **Pins:** a pin button (shown on hover, always when pinned) keeps a quest at the top, in pin order. Pins are saved and dropped when the quest completes.

## Rejected
- Toast when a step completes.
- Reward preview on hover (spoils).
- Grouping by town.
- "Step 2/3" or any step count (spoils).

## Reputation
Settled in [town reputation](town-reputation.md): one reputation per town, no faction or per-NPC reputation, and Guild rank stays separate. The tab shows **only the current tier and progress to the next tier** per discovered town ("No reputation yet." before any). No list of tier rewards.

## Touch-points
`quests` component, `QuestsStore`, `npc-places.ts`, `GameNavigationService` (`talkTo`, `fightIn`), `PlayerStore` (reputation).
