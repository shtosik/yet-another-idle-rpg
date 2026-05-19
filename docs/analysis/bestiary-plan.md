Bestiary System — Implementation Plan │
│ │
│ Context │
│ │
│ The game tracks per-monster kill counts (PlayerStore.enemyKillCounts) but has no UI surface for the player to see what they've encountered, their drops, or where to find them. We're adding a Bestiary panel: a list of all monsters (silhouettes until first kill) on the left, monster details on the │
│ right. It plugs into the existing GameTab view-routing pattern (alongside crafting, towns, map, skillTree). │
│ │
│ Decisions confirmed with user:                                                                                                                                                                                                                                                                              │
│ - Grid slot: grid-column: 2 / 4, grid-row: 1 / 1 (top row only). Stats + resources are replaced when active; equipment/quests stay on the right column. │
│ - Trigger: new GameTab.bestiary enum value + a new tab button in app-game-menu. │
│ - Locked silhouette: pure black via filter: brightness(0) AND no monster data rendered into the DOM (see §3 below for the anti-inspection strategy). │
│ - Zone-to-monster mapping: denormalized onto each enemy via a new zones: ZoneID[] field on the Enemy interface. │
│ │
│ --- │
│ 1. Files to create │
│ │
│ ┌──────────────────────────────────────────────────────────┬────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┐ │
│ │ Path │ Purpose │ │
│ ├──────────────────────────────────────────────────────────┼────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┤ │
│ │ src/app/components/game/bestiary/bestiary.component.ts │ Component logic │ │
│ ├──────────────────────────────────────────────────────────┼────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┤ │
│ │ src/app/components/game/bestiary/bestiary.component.html │ Template │ │
│ ├──────────────────────────────────────────────────────────┼────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┤ │
│ │ src/app/components/game/bestiary/bestiary.component.sass │ Styles │ │
│ ├──────────────────────────────────────────────────────────┼────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┤ │
│ │ src/interfaces/bestiary/monster-entry.interface.ts │ View-model interface (MonsterEntry)                                                                                │ │
│ ├──────────────────────────────────────────────────────────┼────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┤ │
│ │ src/assets/locales/en/bestiary.json │ i18n keys │ │
│ ├──────────────────────────────────────────────────────────┼────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┤ │
│ │ src/assets/img/enemies/unknown.png │ Generic silhouette asset used for all locked entries (no URL leak). Asset to be supplied — see §3 fallback if not. │ │
│ └──────────────────────────────────────────────────────────┴────────────────────────────────────────────────────────────────────────────────────────────────────────────────────┘ │
│ │
│ 2. Files to modify │
│ │
│ ┌────────────────────────────────────────────────────────────┬─────────────────────────────────────────────────────────────────────┐ │
│ │ Path │ Change │ │
│ ├────────────────────────────────────────────────────────────┼─────────────────────────────────────────────────────────────────────┤ │
│ │ src/enums/ids/game-tab.enum.ts │ Add bestiary = 6 │ │
│ ├────────────────────────────────────────────────────────────┼─────────────────────────────────────────────────────────────────────┤ │
│ │ src/interfaces/enemy.interface.ts │ Add zones: ZoneID[] field │ │
│ ├────────────────────────────────────────────────────────────┼─────────────────────────────────────────────────────────────────────┤ │
│ │ src/data/enemies-data.ts │ Populate zones on every enemy (cross-referenced from zones-data.ts) │ │
│ ├────────────────────────────────────────────────────────────┼─────────────────────────────────────────────────────────────────────┤ │
│ │ src/app/components/game/game.component.ts │ Import BestiaryComponent │ │
│ ├────────────────────────────────────────────────────────────┼─────────────────────────────────────────────────────────────────────┤ │
│ │ src/app/components/game/game.component.html │ Render <app-bestiary class="bestiary"/> when tab === bestiary │ │
│ ├────────────────────────────────────────────────────────────┼─────────────────────────────────────────────────────────────────────┤ │
│ │ src/app/components/game/game.component.sass │ Add .bestiary grid rule │ │
│ ├────────────────────────────────────────────────────────────┼─────────────────────────────────────────────────────────────────────┤ │
│ │ src/app/components/game/game-menu/game-menu.component.html │ New tab <li> for bestiary │ │
│ ├────────────────────────────────────────────────────────────┼─────────────────────────────────────────────────────────────────────┤ │
│ │ src/assets/locales/en/app.json │ Add gameTabs.bestiary: "Bestiary"                                   │ │
│ └────────────────────────────────────────────────────────────┴─────────────────────────────────────────────────────────────────────┘ │
│ │
│ --- │
│ 3. Anti-data-leak strategy (locked state)                                                                                                                                                                                                                                                                   │
│ │
│ The user wants locked monsters rendered as black silhouettes and their data not retrievable via DevTools. Three points of leakage exist; we close all three:                                                                                                                                                │
│ │
│ 1. Name / HP / drops / zones — gated behind @if (isUnlocked) in the template. The locked branch renders nothing but the image. Right-panel details only render when selectedMonster() is set, and selectMonster() rejects locked IDs. │
│ 2. alt attribute — set to literal "???" for locked items (no monster name in accessibility tree). │
│ 3. Sprite URL — ./assets/img/enemies/greenSlime.png betrays the identity. We bind src to a single generic silhouette asset (./assets/img/enemies/unknown.png) for all locked entries. If that asset is not provided yet, fall back to using the real sprite with filter: brightness(0) — visually identical │
│ but the URL stays in DOM. The template uses a ternary so the swap is trivial later. │
│ │
│ This makes the locked list functionally a <ul> of identical <img src="unknown.png" alt="???"> elements — nothing about the underlying enemy is recoverable without selling a kill. │
│ │
│ --- │
│ 4. Code │
│ │
│ 4.1 monster-entry.interface.ts │
│ │
│ import { EnemyID } from 'enums/ids/enemy-id.enum' │
│ import { ZoneID } from 'enums/ids/zone-id.enum' │
│ import { EnemyDrop } from 'interfaces/enemy-drop.interface' │
│ │
│ export interface MonsterEntry { │
│ id: EnemyID │
│ url: string │
│ maxHp: number │
│ zones: ZoneID[]                                                                                                                                                                                                                                                                                           │
│ drops: EnemyDrop[]                                                                                                                                                                                                                                                                                        │
│ killCount: number │
│ isUnlocked: boolean │
│ } │
│ │
│ 4.2 bestiary.component.ts │
│ │
│ import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core' │
│ import { CommonModule } from '@angular/common' │
│ import { TranslatePipe } from '../../../pipes/i18next.pipe' │
│ import { PlayerStore } from '../../../store/player/player.store' │
│ import { EnemyID } from 'enums/ids/enemy-id.enum' │
│ import { ItemID } from 'enums/ids/item-id.enum' │
│ import { ZoneID } from 'enums/ids/zone-id.enum' │
│ import ENEMIES_DATA from '../../../../data/enemies-data' │
│ import { MonsterEntry } from 'interfaces/bestiary/monster-entry.interface' │
│ │
│ const LOCKED_SPRITE = './assets/img/enemies/unknown.png' │
│ │
│ @Component({ │
│ selector: 'app-bestiary', │
│ templateUrl: './bestiary.component.html', │
│ styleUrls: ['./bestiary.component.sass'], │
│ imports: [CommonModule, TranslatePipe], │
│ changeDetection: ChangeDetectionStrategy.OnPush, │
│ })                                                                                                                                                                                                                                                                                                          │
│ export class BestiaryComponent { │
│ private playerStore = inject(PlayerStore)                                                                                                                                                                                                                                                                 │
│ │
│ readonly EnemyID = EnemyID │
│ readonly ItemID = ItemID │
│ readonly ZoneID = ZoneID │
│ readonly LOCKED_SPRITE = LOCKED_SPRITE │
│ │
│ selectedId = signal<EnemyID | null>(null)                                                                                                                                                                                                                                                                 │
│ │
│ monsters = computed<MonsterEntry[]>(() => { │
│ const kills = this.playerStore.enemyKillCounts()                                                                                                                                                                                                                                                        │
│ return Object.values(ENEMIES_DATA).map(e => { │
│ const killCount = kills[e.id] ?? 0 │
│ return { │
│ id: e.id, │
│ url: e.url, │
│ maxHp: e.maxHp, │
│ zones: e.zones, │
│ drops: e.drops, │
│ killCount, │
│ isUnlocked: killCount > 0, │
│ } │
│ })                                                                                                                                                                                                                                                                                                      │
│ })                                                                                                                                                                                                                                                                                                        │
│ │
│ selectedMonster = computed<MonsterEntry | null>(() => { │
│ const id = this.selectedId()                                                                                                                                                                                                                                                                            │
│ if (id === null) return null │
│ return this.monsters().find(m => m.id === id) ?? null │
│ })                                                                                                                                                                                                                                                                                                        │
│ │
│ selectMonster(entry: MonsterEntry) { │
│ if (!entry.isUnlocked) return // hard-gate at the handler too │
│ this.selectedId.set(entry.id)                                                                                                                                                                                                                                                                           │
│ } │
│ } │
│ │
│ 4.3 bestiary.component.html │
│ │
│ <section class="bestiary">                                                                                                                                                                                                                                                                                  │
│   <ul class="bestiary__list">                                                                                                                                                                                                                                                                               │
│ @for (monster of monsters(); track monster.id) { │
│       <li │
│ class="bestiary__item"                                                                                                                                                                                                                                                                              │
│         [class.bestiary__item--locked]="!monster.isUnlocked"                                                                                                                                                                                                                                                │
│         [class.bestiary__item--selected]="selectedId() === monster.id"                                                                                                                                                                                                                                      │
│         (click)="selectMonster(monster)"                                                                                                                                                                                                                                                                    │
│       >                                                                                                                                                                                                                                                                                                     │
│ @if (monster.isUnlocked) { │
│           <img │
│ class="bestiary__sprite"                                                                                                                                                                                                                                                                        │
│             [src]="monster.url"                                                                                                                                                                                                                                                                             │
│             [alt]="('enemies:names.' + EnemyID[monster.id]) | i18next"                                                                                                                                                                                                                                      │
│ />                                                                                                                                                                                                                                                                                                │
│           <span class="bestiary__name">                                                                                                                                                                                                                                                                     │
│ {{ ('enemies:names.' + EnemyID[monster.id]) | i18next }} │
│           </span>                                                                                                                                                                                                                                                                                           │
│           <span class="bestiary__kills">x{{ monster.killCount }}</span>                                                                                                                                                                                                                                     │
│ } @else { │
│           <img │
│ class="bestiary__sprite bestiary__sprite--locked"                                                                                                                                                                                                                                               │
│             [src]="LOCKED_SPRITE"                                                                                                                                                                                                                                                                           │
│ alt="???"                                                                                                                                                                                                                                                                                       │
│ />                                                                                                                                                                                                                                                                                                │
│           <span class="bestiary__name bestiary__name--locked">???</span>                                                                                                                                                                                                                                    │
│ } │
│       </li>                                                                                                                                                                                                                                                                                                 │
│ } │
│   </ul>                                                                                                                                                                                                                                                                                                     │
│ │
│   <div class="bestiary__details">                                                                                                                                                                                                                                                                           │
│ @if (selectedMonster(); as m) { │
│       <h2 class="bestiary__title">                                                                                                                                                                                                                                                                          │
│ {{ ('enemies:names.' + EnemyID[m.id]) | i18next }} │
│       </h2>                                                                                                                                                                                                                                                                                                 │
│       <img class="bestiary__detail-sprite" [src]="m.url" alt="" />                                                                                                                                                                                                                                          │
│ │
│       <dl class="bestiary__stats">                                                                                                                                                                                                                                                                          │
│         <dt>{{ 'bestiary:baseHp' | i18next }}</dt>                                                                                                                                                                                                                                                          │
│         <dd>{{ m.maxHp }}</dd>                                                                                                                                                                                                                                                                              │
│ │
│         <dt>{{ 'bestiary:foundIn' | i18next }}</dt>                                                                                                                                                                                                                                                         │
│         <dd>                                                                                                                                                                                                                                                                                                │
│ @if (m.zones.length) { │
│ @for (zone of m.zones; track zone; let last = $last) { │
│ {{ ('zones:names.' + ZoneID[zone]) | i18next }}{{ last ? '' : ', ' }} │
│ } │
│ } @else { │
│ {{ 'bestiary:noZone' | i18next }} │
│ } │
│         </dd>                                                                                                                                                                                                                                                                                               │
│       </dl>                                                                                                                                                                                                                                                                                                 │
│ │
│       <h3 class="bestiary__drops-title">{{ 'bestiary:dropTable' | i18next }}</h3>                                                                                                                                                                                                                           │
│ @if (m.drops.length) { │
│         <ul class="bestiary__drops">                                                                                                                                                                                                                                                                        │
│ @for (drop of m.drops; track drop.id) { │
│             <li class="bestiary__drop">                                                                                                                                                                                                                                                                     │
│               <span>{{ ('items:names.' + ItemID[drop.id]) | i18next }}</span>                                                                                                                                                                                                                               │
│               <span>{{ (100 / drop.chance) | number:'1.0-1' }}%</span>                                                                                                                                                                                                                                      │
│             </li>                                                                                                                                                                                                                                                                                           │
│ } │
│         </ul>                                                                                                                                                                                                                                                                                               │
│ } @else { │
│         <p class="bestiary__no-drops">{{ 'bestiary:noDrops' | i18next }}</p>                                                                                                                                                                                                                                │
│ } │
│ } @else { │
│       <p class="bestiary__placeholder">{{ 'bestiary:selectPrompt' | i18next }}</p>                                                                                                                                                                                                                          │
│ } │
│   </div>                                                                                                                                                                                                                                                                                                    │
│ </section>                                                                                                                                                                                                                                                                                                  │
│ │
│ ▎ Drop %: the codebase rolls drops with Math.ceil(Math.random() * chance) === chance, so chance represents 1-in-N. The display converts to 100 / chance. (e.g. chance: 4 → 25 %.)                                                                                                                           │
│ │
│ 4.4 bestiary.component.sass │
│ │
│ @use '../../../../styles/vars' as vars │
│ │
│ :host │
│ display: block │
│ width: 100% │
│ height: 100% │
│ │
│ .bestiary │
│ display: grid │
│ grid-template-columns: 50% 50% │
│ gap: 0.8rem │
│ height: 100% │
│ padding: 0.8rem │
│ border-radius: vars.$panelBorderRadius │
│ background: rgba(0, 0, 0, 0.35)                                                                                                                                                                                                                                                                           │
│ │
│ &__list │
│ list-style: none │
│ margin: 0 │
│ padding: 0.4rem │
│ overflow-y: auto │
│ display: grid │
│ grid-template-columns: repeat(auto-fill, minmax(4.5rem, 1fr))                                                                                                                                                                                                                                           │
│ gap: 0.5rem │
│ align-content: start │
│ │
│ &__item │
│ display: flex │
│ flex-direction: column │
│ align-items: center │
│ gap: 0.25rem │
│ padding: 0.4rem │
│ border-radius: 0.4rem │
│ background: rgba(255, 255, 255, 0.04)                                                                                                                                                                                                                                                                   │
│ cursor: pointer │
│ user-select: none │
│ transition: background 0.15s ease │
│ │
│ &:hover │
│ background: rgba(255, 255, 255, 0.10)                                                                                                                                                                                                                                                                 │
│ │
│ &--selected │
│ background: rgba(255, 215, 0, 0.18)                                                                                                                                                                                                                                                                   │
│ outline: 1px solid rgba(255, 215, 0, 0.6)                                                                                                                                                                                                                                                             │
│ │
│ &--locked │
│ cursor: not-allowed │
│ pointer-events: none │
│ opacity: 0.85 │
│ │
│ &__sprite │
│ width: 3.5rem │
│ height: 3.5rem │
│ object-fit: contain │
│ image-rendering: pixelated │
│ │
│ &--locked │
│ filter: brightness(0)   // fallback if generic asset is missing; redundant when src=unknown.png │
│ │
│ &__name │
│ font-size: 0.75rem │
│ text-align: center │
│ line-height: 1 │
│ │
│ &--locked │
│ color: #888 │
│ │
│ &__kills │
│ font-size: 0.65rem │
│ color: #aaa │
│ │
│ &__details │
│ display: flex │
│ flex-direction: column │
│ gap: 0.6rem │
│ padding: 0.8rem │
│ overflow-y: auto │
│ │
│ &__title │
│ margin: 0 │
│ font-size: 1.2rem │
│ │
│ &__detail-sprite │
│ width: 6rem │
│ height: 6rem │
│ object-fit: contain │
│ image-rendering: pixelated │
│ align-self: center │
│ │
│ &__stats │
│ display: grid │
│ grid-template-columns: max-content 1fr │
│ gap: 0.3rem 0.8rem │
│ margin: 0 │
│ │
│ dt │
│ color: #bbb │
│ dd │
│ margin: 0 │
│ │
│ &__drops │
│ list-style: none │
│ margin: 0 │
│ padding: 0 │
│ display: flex │
│ flex-direction: column │
│ gap: 0.2rem │
│ │
│ &__drop │
│ display: flex │
│ justify-content: space-between │
│ padding: 0.2rem 0.4rem │
│ background: rgba(255, 255, 255, 0.04)                                                                                                                                                                                                                                                                   │
│ border-radius: 0.25rem │
│ │
│ &__placeholder │
│ margin: auto │
│ color: #888 │
│ font-style: italic │
│ │
│ 4.5 game.component.sass — add grid rule │
│ │
│ Insert after .map block (around line 56):                                                                                                                                                                                                                                                                   │
│ │
│ .bestiary │
│ grid-column: 2 / 4 │
│ grid-row: 1 / 1 │
│ padding: 0 │
│ │
│ 4.6 game.component.html — render block │
│ │
│ Insert after the GameTab.map block (around line 40):                                                                                                                                                                                                                                                        │
│ │
│ @if (tab === GameTab.bestiary) { │
│   <app-bestiary class="bestiary"/>                                                                                                                                                                                                                                                                          │
│ } │
│ │
│ bestiary is mutually exclusive with the main / crafting / towns cluster, so equipment / quests will not render — matches the "stats + resources replaced" intent. │
│ │
│ 4.7 game.component.ts — register import │
│ │
│ Add BestiaryComponent to the imports array. │
│ │
│ 4.8 game-menu.component.html — new tab button │
│ │
│ Insert before the closing </ul>:                                                                                                                                                                                                                                                                            │
│ │
│ <li │
│ class="game-menu__tab"                                                                                                                                                                                                                                                                                  │
│     (click)="changeTab.emit(GameTab.bestiary)"                                                                                                                                                                                                                                                              │
│ >{{ ('gameTabs.' + GameTab[GameTab.bestiary]) | i18next }} │
│ </li>                                                                                                                                                                                                                                                                                                       │
│ │
│ 4.9 game-tab.enum.ts │
│ │
│ export enum GameTab { │
│ main = 1, │
│ skillTree = 2, │
│ crafting = 3, │
│ towns = 4, │
│ map = 5, │
│ bestiary = 6, │
│ } │
│ │
│ 4.10 enemy.interface.ts │
│ │
│ import { DamageElement } from 'enums/damage-element.enum' │
│ import { EnemyDrop } from './enemy-drop.interface' │
│ import { EnemyID } from 'enums/ids/enemy-id.enum' │
│ import { ZoneID } from 'enums/ids/zone-id.enum' │
│ │
│ export interface Enemy { │
│ id: EnemyID │
│ maxHp: number │
│ experience: number │
│ weakness: DamageElement │
│ drops: EnemyDrop[]                                                                                                                                                                                                                                                                                      │
│ url: string │
│ zones: ZoneID[]                                                                                                                                                                                                                                                                                         │
│ isBossEnemy?: boolean │
│ } │
│ │
│ 4.11 enemies-data.ts — populate zones │
│ │
│ Cross-referenced from zones-data.ts. Every enemy gets the array — bosses included (their boss zone, via bossEnemyId):                                                                                                                                                                                       │
│ │
│ ┌─────────────────────────────────┬─────────────────────────────────┐ │
│ │ Enemy │ Zones │ │
│ ├─────────────────────────────────┼─────────────────────────────────┤ │
│ │ greenSlime, redSlime, blueSlime │ [ZoneID.plains]                 │ │
│ ├─────────────────────────────────┼─────────────────────────────────┤ │
│ │ kingSlime │ [ZoneID.plains] (boss)          │ │
│ ├─────────────────────────────────┼─────────────────────────────────┤ │
│ │ crab, seagull, turtle │ [ZoneID.horseshoeBeach]         │ │
│ ├─────────────────────────────────┼─────────────────────────────────┤ │
│ │ gangsterCrab │ [ZoneID.horseshoeBeach] (boss)  │ │
│ ├─────────────────────────────────┼─────────────────────────────────┤ │
│ │ rat │ [ZoneID.tradersBasement]        │ │
│ ├─────────────────────────────────┼─────────────────────────────────┤ │
│ │ giantRat │ [ZoneID.tradersBasement] (boss) │ │
│ ├─────────────────────────────────┼─────────────────────────────────┤ │
│ │ wolf, deer, bandit, goblinScout │ [ZoneID.theLongPath]            │ │
│ ├─────────────────────────────────┼─────────────────────────────────┤ │
│ │ troll │ [ZoneID.theLongPath] (boss)     │ │
│ └─────────────────────────────────┴─────────────────────────────────┘ │
│ │
│ 4.12 app.json — add tab label │
│ │
│ "gameTabs": { │
│   "main": "Battle", │
│   "map": "Map", │
│   "skillTree": "Skill tree", │
│   "crafting": "Crafting", │
│   "towns": "Towns", │
│   "bestiary": "Bestiary"                                                                                                                                                                                                                                                                                    │
│ } │
│ │
│ 4.13 bestiary.json — new locale file │
│ │
│ { │
│   "baseHp": "Base HP", │
│   "foundIn": "Found in", │
│   "dropTable": "Drop Table", │
│   "selectPrompt": "Select a monster to view details", │
│   "noDrops": "No known drops.", │
│   "noZone": "Unknown"                                                                                                                                                                                                                                                                                       │
│ } │
│ │
│ The bestiary namespace will need to be registered in the i18next loader config alongside the other namespaces (enemies, zones, items, app, etc.) — usually in src/app/app.config.ts or wherever i18next is initialised. Add 'bestiary' to the ns array. │
│ │
│ --- │
│ 5. Existing patterns being reused │
│ │
│ - View-routing: gameTab: BehaviorSubject<GameTab> + changeTab() pattern from game.component.ts:74–76. │
│ - Selection state: signal<ID | null>(null) + .set() mirroring quests.component.ts:26. │
│ - List / details split layout: SASS structure cloned from crafting.component.sass:11–14 (display: grid; grid-template-columns; gap; height: 100%; padding; border-radius). │
│ - i18n lookup: 'enemies:names.' + EnemyID[id] | i18next for monster names; 'items:names.' + ItemID[id] | i18next for drop items (matching crafting.component.html:19); 'zones:names.' + ZoneID[id] | i18next for zones. │
│ - Kill counts source: PlayerStore.enemyKillCounts (signal) — set by BattleManagerService.processBattleEnd(). │
│ │
│ --- │
│ 6. Verification │
│ │
│ 1. Build / typecheck: npm run build (or ng build) — verify no TS errors from new zones field on Enemy (every entry in enemies-data.ts must include it; the Record<EnemyID, Enemy> typing will enforce this). │
│ 2. Run dev server: npm start and open the app. │
│ 3. Locked state golden path:                                                                                                                                                                                                                                                                                │
│ - Fresh save (reset state) → click the new Bestiary tab. │
│ - Confirm every monster shows as ??? with a black silhouette image. │
│ - DevTools → Elements: confirm no enemies:names.* strings, no maxHp values, no *.png paths other than unknown.png are present in the rendered list. │
│ - Confirm clicking a locked entry does nothing (right panel stays on placeholder). │
│ 4. Unlock flow:                                                                                                                                                                                                                                                                                             │
│ - Run battle until first kill of (say) Green Slime. │
│ - Return to Bestiary → Green Slime entry shows full-color sprite + name + kill count. │
│ - Other monsters still locked. │
│ 5. Details panel:                                                                                                                                                                                                                                                                                           │
│ - Click Green Slime → right panel shows name, base HP (2), "Found in: Plains", drop table with Slime Residue and computed percentage (~33 %). │
│ - Select Bandit (after unlock) → drops include 100 %-displayed entries (chance: 1 cases shown correctly; multi-drop list scrolls if needed). │
│ 6. Layout sanity:                                                                                                                                                                                                                                                                                           │
│ - Bestiary occupies the top center row (grid-column: 2 / 4, top row). │
│ - Battle column on left, equipment / quests on right are hidden (because the tab === main || crafting || towns block does not match bestiary) — confirm this matches user intent on revisit. │
│ - Tab button appears in the game menu and toggles correctly. │
│ │
│ --- │
│ 7. Open follow-ups (out of scope, flag if relevant)                                                                                                                                                                                                                                                         │
│ │
│ - Whether the right column (equipment, quests) should also be visible when the Bestiary is open. Current plan hides them for visual consistency with map / skillTree. Easy to change by adding || tab === GameTab.bestiary to the cluster condition in game.component.html:11. │
│ - Whether unknown.png should be created as a dedicated asset, or whether the brightness(0) fallback on the real sprites is acceptable (small URL leak in DOM). │
│ - Sort order in the list: currently Object.values(ENEMIES_DATA) (insertion order). Could be sorted by zone progression or maxHp if preferred.  
