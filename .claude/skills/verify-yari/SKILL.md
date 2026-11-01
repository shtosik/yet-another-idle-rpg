---
name: verify-yari
description: Launch Yet Another RPG Idle (YARI, the Angular web game) on a private dev server, drive it in the built-in browser like a player, and capture proof (screenshots, DOM text, save state). Use to prove a UI or game-behavior change works in the real app, not just in tests, or when asked to "check it in the game", "verify in the browser", "drive the app".
---

# Verify YARI

YARI is a browser-only idle RPG (Angular 20, no backend). The player touches one surface: the web page. All game state lives in the page's `localStorage` (one key per store: `playerStore`, `battleStore`, `questsStore`, `townsStore`, `campStore`, `shopStore`, `settingsStore`, `offlineStore`). There is no CLI, API or server state to check.

Tools (load deferred ones with ToolSearch): Bash `run_in_background` for the server, the built-in browser `mcp__Claude_Browser__*` (`preview_start`, `find`, `read_page`, `computer`, `javascript_tool`) for driving, TaskStop for teardown.

## Cost

- Drive only the feature files the change touches; all of them only for `/maintain-verification-skill`.
- Prove with text from `javascript_tool` (DOM `textContent`, store JSON). Take screenshots only to find a click target and one at the end as evidence.
- Run from a subagent (Agent tool, `model: "sonnet"` or `"haiku"`) that reports pass/fail, the evidence path and surprises, so page dumps stay out of the main context.

## Isolation

`localStorage` is per origin, and the origin includes the port. A server on a fresh port therefore starts with an empty save and never touches the user's save on `localhost:4200`. Always launch your own server with `--port 0`; never drive a server you did not start (other sessions share this checkout and may hold 4200 or other ports).

## Launch

1. Pick a run ID and evidence dir: `tmp/verify/<run-id>/` in the repo root (`/tmp` is gitignored), e.g. `tmp/verify/2026-10-31-equip/`. Create it.
2. Start the dev build (cheats on) in the background, logging into the evidence dir:

   ```bash
   npx ng serve --port 0 > tmp/verify/<run-id>/ng-serve.log 2>&1
   ```

   Bash tool with `run_in_background: true`. Keep the returned task ID: it is the only thing cleanup may kill.
3. Wait until the log has the URL (the `Local:` label has colour codes inside, so grep for `localhost:`), then read the port:

   ```bash
   sed 's/\x1b\[[0-9;]*m//g' tmp/verify/<run-id>/ng-serve.log | grep -o 'localhost:[0-9]*' | head -1
   ```

   First build takes roughly 10-30 s. A `[vite] Re-optimizing dependencies` line is normal. The server serves only the files under `src/assets/` that existed when it started: after adding an image there (a new icon gives 404), restart it (Cleanup step 2, then Launch again).
4. Open it: `mcp__Claude_Browser__preview_start` with `url: http://localhost:<port>/`. Keep the pane's own size (no `resize_window`): emulated sizes are scaled to fit the pane, the screenshot frame changes between calls, and coordinate clicks land on the wrong element. At the default ~1024 px width the page scrolls sideways and the battle column shrinks to ~2 px (the layout is built for ~1920 px): the battle pane cannot be screenshotted, but its DOM text reads fine. Clicks by `ref` (Drive) are unaffected. If the pane is hidden (`tabs_context` says so), `innerWidth` can read 0 and screenshots lag the DOM; trust `javascript_tool` reads over screenshots.
5. Ready means usable: `window.dev` exists (it arrives a moment after load, with the deferred cheat chunk) and the battle pane shows an enemy name. Doctor checks both.

## Doctor

Run before the first drive and after anything surprising. Read-only.

- Shell: `curl -s http://localhost:<port>/ | grep -o '<title>[^<]*'` prints `<title>Yet Another RPG Idle`. Any other output: wrong process on that port, relaunch.
- Browser (`javascript_tool`):

  ```js
  await new Promise(r => setTimeout(r, 3000));
  ({ port: location.port, dev: typeof window.dev, saves: Object.keys(localStorage),
     enemy: document.querySelector('app-enemy h2')?.textContent.trim(),
     kills: document.querySelector('app-battle-nav-bar')?.textContent.match(/Kill count:\s*\d+(\s*\/\s*\d+)?/)?.[0],
     hud: document.querySelector('app-player-hud')?.innerText.split('\n').join(' | ') })
  ```

  Healthy: `port` is yours, `dev` is `"object"`, `hud` reads `Lv <level> | <xp> / <xp needed> | <gold>`, `enemy` is a name (fresh save: a Horseshoe Beach enemy such as `Turtle`, `Seagull`, `Crab`; `undefined` for a moment between enemies is normal), `kills` matches (`Kill count: N / 10` on a fresh save; the `/ 10` disappears once the wave target is met). `dev` `"undefined"` after 3 s means a production build or a crashed bootstrap: check `read_console_messages` with `onlyErrors`.
- Fresh save expected but HUD shows level above 1, or kill count above a few: the port was reused and the pane kept that origin's old save. Run `dev.reset()` and re-run doctor.

## Drive

- Click with `find` (accessible name or visible text) then `computer` `left_click` or `right_click` on the returned `ref`. That is a real pointer click, scrolled into view by the tool, so off-screen targets work at any pane width. Use `javascript_tool` only to read state or to call `window.dev`.
- Set up preconditions with `window.dev` (AGENTS.md rule: never edit `localStorage` to set state). Commands, from `src/app/components/game/dev-cheats/dev-cheats.component.ts`, take enum numbers: `dev.tab(GameTab)`, `dev.unlock('camp'|'skillTree'|'map'|'spellbook'|'towns')`, `dev.unlockAll()` (features, towns, zones), `dev.reset()`, `dev.giveItem(ItemID, amount?, tier?)`, `dev.equip(ItemID, tier?)`, `dev.unequip(slot)`, `dev.setZone(ZoneID)`, `dev.grantStat(stat, amount)`, `dev.learnSkill(SkillNodeID)`, `dev.openShop(ShopID)`, `dev.setKills(EnemyID, n)`, `dev.addShinyKills(ZoneID, n)`, `dev.completeQuest(QuestID)`, `dev.addReputation(TownID, amount)`. Look IDs up in `src/enums/ids/*.enum.ts` (e.g. `GameTab.map = 5`, `ItemID.machete = 26`).
- Read game state with `dev.state()` (every store plus derived `stats`, live), e.g. `dev.state().battle.currentZoneId`, instead of parsing `localStorage`. Prove what the player sees (kill count, XP, gold) from the DOM, and compare it with `dev.state()`. Read `localStorage` only to prove a change was saved.
- Never use a `dev` call for the step under test: it sets the state the player's action should produce.
- Read text with `textContent` of the specific element, not `innerText`: the UI uppercases some labels (tabs, panel titles) with CSS. Read a container's `textContent` only with a regex that tolerates missing separators: the HUD's reads `Lv 18 / 1004` (level 1, 8 / 100 XP, 4 gold), so read its parts (`.hud__level`, `.hud__xp-text`, `.hud__currency--gold`).
- Handles (all reachable by `ref`, no coordinate clicks needed):
  - game tabs: `button "<label>"` (`Battle`, `Skill tree`, `Camp`, `Spellbook`, `Map`, `Bestiary`, `Settings`; the active one has `aria-current="page"`). Locked tabs are all named `Locked`; `find` "Locked" lists them in menu order.
  - inventory items: `button "<name> ×<amount>"` (e.g. `Machete ×1`); equipment slots: `button "<Slot>: <name|Empty>"` (e.g. `Weapon: Empty`).
  - NPC portraits: `button "<NPC>"`; town buildings: `button "<building>"`; the map's `button "Towns"` and its town buttons.
  - dialogue options: `li`s with no role; `find` their text (`find` "Looks quite empty") returns a `generic` ref that clicks fine.
  - close buttons (`app-close-button button`): no name; `read_page` with `filter: "interactive"` lists them as bare `button [ref_N]` in DOM order (in a building: the building's close comes before the portraits, the dialogue's after).
- `find` right after a view change can return nothing while the view animates in; wait ~500 ms and retry before calling a handle missing.
- Saves are batched: each store is written to `localStorage` at most once per second. Poll the store for up to ~2 s after an action before calling a save missing.
- Per-feature recipes: `features/README.md`.

## Evidence

Everything goes in `tmp/verify/<run-id>/`.

- Screenshot: `computer` `screenshot` prints `source: <path>`; copy that file into the evidence dir with a descriptive name (`cp "<path>" tmp/verify/<run-id>/equip-after.jpg`).
- DOM proof: return the relevant `textContent` or a `read_page` dump from the browser and write it to `tmp/verify/<run-id>/<feature>.txt` with the Write tool.
- Save proof (side effect): read the store key after the action, e.g. `JSON.parse(localStorage.getItem('playerStore')).state.equipment` (saves are an envelope `{v, state}`), and reload the page to show the change survives (the second, read-only view).

Proof standards: drive the real player path (clicks), not `dev` calls or store methods, for the step under test. Capture the state before and after the action, not only the final screen. Check the saved store as well as the screen. Never weaken a journey to make it pass: a missing precondition is a failure with its reason.

## Cleanup

1. `mcp__Claude_Browser__tabs_close` the tab you opened (closes the pane if it was the last). If you set a size with `resize_window` anyway, reset it with `preset: "desktop"` first.
2. TaskStop the server's background task ID from Launch. On Windows this kills the shell but leaves `node ... ng.js serve --port 0` listening, so also kill the process that owns your port, after checking it is yours (PowerShell tool):

   ```powershell
   $p = (Get-NetTCPConnection -LocalPort <port> -State Listen -ErrorAction SilentlyContinue | Select-Object -First 1).OwningProcess
   if ($p) { (Get-CimInstance Win32_Process -Filter "ProcessId=$p").CommandLine }   # must contain "ng.js" serve --port 0
   if ($p) { taskkill /PID $p /T /F }
   ```

   Never kill `node` or `ng` by name: other sessions run their own servers.
3. Confirm the port is free: `curl -s -o /dev/null -w '%{http_code}' http://localhost:<port>/` prints `000`.
4. Keep `tmp/verify/<run-id>/` (screenshots, `.txt` proof, `ng-serve.log`). Delete it only when the user asks.
