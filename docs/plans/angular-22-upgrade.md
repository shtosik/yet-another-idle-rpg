# Angular 20 → 22 upgrade plan

## Context
Project on Angular 20.3 (zoneless, standalone, signal stores, Karma). Angular 22 released 2026-06-03 (latest 22.2.3). v20 LTS ends soon; ecosystem libs (ngrx, ngrx-toolkit, ngx-leaflet, ngx-tooltip-directives, Material) all ship v22 builds. Goal: land on 22.x with green build + tests and no runtime regressions in game loop / UI refresh.

`ng update` only supports one major per step: **20 → 21 → 22**, commit after each.

## Must worry about

1. **Node version** — CLI 22 requires Node `^22.22.3 || ^24.15.0 || >=26`. Local is **v22.17.0** — upgrade Node first (recommend 24 LTS).
2. **TypeScript 6.0 required** (`>=6.0 <6.1`; v21 needs ≥5.9). Do NOT take TS 7 (`latest` tag) — pin `~6.0.x`.
   - `tsconfig.json` uses `"baseUrl": "./src"` and ~121 imports in 36 files rely on it (`from 'enums/...'`, `'data/...'`, `'interfaces/...'`). `baseUrl` is deprecated in TS 6 (errors unless `"ignoreDeprecations": "6.0"`).
   - Fix: drop `baseUrl`, add `"paths": { "*": ["./src/*"] }` (same resolution, no code changes). Fallback: `ignoreDeprecations: "6.0"` temporarily.
   - TS 6 may flag other options; run `tsc -p tsconfig.app.json --noEmit` after bump and fix whatever appears.
3. **Default change detection = OnPush (v22)**. 31/35 components already set it explicitly. Without explicit `changeDetection`:
   - `src/app/app.ts`
   - `components/game/dialogue/dialogue.component.ts`
   - `components/modals/quest-completed/quest-completed.component.ts`
   - `components/game/battle/battle-side-buttons/battle-side-buttons.component.ts`
   
   `ng update` migration auto-adds `ChangeDetectionStrategy.Eager` to these. Then review each: if state is read via signals/store, switch to `OnPush` (consistent with CLAUDE.md "OnPush throughout"); otherwise keep `Eager`.
   - `damage-popup.component.ts` uses `ChangeDetectionStrategy.Default` (now alias of `Eager`). Rename to `Eager` or convert to OnPush + signal inputs.
4. **Third-party bumps (all must move together to 22):**
   - `@ngrx/signals`, `@ngrx/store`, `@ngrx/effects`, `@ngrx/store-devtools` → `^22` (run `ng update @ngrx/signals@22 @ngrx/store@22`, which has its own migrations).
   - `@angular-architects/ngrx-toolkit` → `^22.0.0` (peer: ngrx 22). Verify `withDevtools` still works with `withGameStateSync` in `src/app/store/helpers/with-game-state-sync.hook.ts`.
   - `@bluehalo/ngx-leaflet` → `22.0.0`; `ngx-tooltip-directives` → `^22`.
   - `@angular/material` + `@angular/cdk` → `22` via `ng update @angular/material@22` (only `MatDialog` used + `mat.theme` in `src/custom-theme.scss` — low risk).
   - Note: ngx-leaflet/tooltip have no v21 builds verified — during 20→21 step use `--force`/`--legacy-peer-deps` or bump them only in step 22.
5. **Stricter template compiler (v22)** — new errors possible: duplicate input/output bindings on same element, elements matching multiple component selectors, template variables named `in`. Fix as build reports them. `nullishCoalescingNotNullable` diagnostics won't fire since `strictNullChecks: false`.

## Fine as is (verified)
- Zoneless already (`provideZonelessChangeDetection` in `app.config.ts`, no zone.js) — v21 zone scheduler changes irrelevant.
- No `ComponentFactoryResolver`, `NgModule`, `@angular/animations`, Hammer.js, `provideRoutes`, `withFetch`/`reportProgress`, `moduleId`/`interpolation` metadata, SSR.
- `[attr.data-tier]` bindings unaffected (change only hits `data-*` attributes matching inputs/outputs).
- Router: only `provideRouter(routes)`; `paramsInheritanceStrategy` default change → no nested param routes affected.
- `typeCheckHostBindings: true` already on (v21 default).
- Builders already `@angular/build:*` (application, dev-server, karma).
- `@Input/@Output` decorators (8 components) and `APP_INITIALIZER` still compile in 22 — deprecated, not removed.

## Steps
1. Branch `chore/angular-22`. Upgrade Node to 24 LTS. `npm ci` + `npm run build` + `npm test` baseline.
2. **v21:** `ng update @angular/core@21 @angular/cli@21 @angular/material@21`, then `ng update @ngrx/signals@21 @ngrx/store@21` (ngrx-toolkit `^21` if exists). Accept migrations. Build, test, smoke-test, commit.
3. **v22:** `ng update @angular/core@22 @angular/cli@22 @angular/material@22` (pulls TS 6.0) → accept Eager migration. Then ngrx 22, ngrx-toolkit 22, ngx-leaflet 22, ngx-tooltip-directives 22. Commit.
4. **tsconfig:** replace `baseUrl` with `paths` (step 2 above). Fix TS 6 / template compiler errors until `npm run build` clean.
5. **CD review:** audit 4 Eager components + damage-popup, convert to OnPush where state is signal-driven.
6. **Optional cleanup (separate commit):**
   - `APP_INITIALIZER` → `provideAppInitializer(() => i18next.use(...).init(...))` in `app.config.ts`.
   - Remove `connectInZone: true` from `provideStoreDevtools` (meaningless zoneless; check if ngrx 22 still accepts it).
   - Migrate `@Input/@Output` to `input()/output()` via `ng generate @angular/core:signal-input-migration` / `output-migration`.
   - Karma → Vitest (`ng g @angular/core:refactor-jasmine-vitest`, builder `@angular/build:unit-test`). Only `src/app/app.spec.ts` exists — trivial move, removes 5 karma deps.

## Verification
- `npm run build` (prod) — no errors, bundle budgets still pass.
- `npm test` green.
- `npm start` manual smoke: battle auto-attacks + damage popups render, spell casting, inventory equip/unequip (tier colors), skill tree, world map (Leaflet tiles + effects), town → NPC dialogue → quest-completed modal, shop modal (MatDialog), tooltips, save/reload persistence (`withGameStateSync`), Redux devtools shows store.
- Specifically watch for stale UI in the 4 formerly-default components and damage-popup.
