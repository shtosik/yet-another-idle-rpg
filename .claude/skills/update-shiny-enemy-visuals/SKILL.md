---
name: update-shiny-enemy-visuals
description: Use when updating the enemy display component to reflect the shiny mechanic — adding a CSS shiny class to the sprite, wiring the isShinyEnemy signal, and adding an onerror fallback so missing shiny assets degrade gracefully to the regular sprite. Triggers on phrases like "add shiny visuals to the enemy", "style shiny enemies", "wire shiny state to the enemy component", "onerror fallback for shiny sprite", "add shiny indicator to monster".
---

# Update Shiny Enemy Visuals

The shiny mechanic rolls at spawn in `BattleStore.startBattle` and records two things:
`isShinyEnemy: boolean` on the store and a swapped `enemy.url` (the `-shiny.png` variant).
The enemy component at `src/app/components/game/battle/enemy/` needs to:

1. Bind a CSS class when the enemy is shiny (visual distinction beyond the sprite swap).
2. Fall back to the non-shiny URL if the `-shiny.png` asset is missing (avoids a broken-image icon).

## Files touched

| File | Change |
|---|---|
| `src/app/components/game/battle/enemy/enemy.component.ts` | Expose `isShinyEnemy` signal; add `onImgError` fallback method |
| `src/app/components/game/battle/enemy/enemy.component.html` | Bind `[class.shiny]` and `(error)` on the `<img>` |
| `src/app/components/game/battle/enemy/enemy.component.sass` | Add `.shiny img` styles |

## Step 1 — Component: expose signal + error handler

`enemy.component.ts`:

```ts
import { NgOptimizedImage } from '@angular/common'
import { ChangeDetectionStrategy, Component, ElementRef, inject, viewChild } from '@angular/core'
import { BattleStore } from '../../../../store/battle/battle.store'
import ENEMIES_DATA from '../../../../../data/enemies-data'
import { EnemyID } from '../../../../../enums/ids/enemy-id.enum'
import { TranslatePipe } from '../../../../pipes/i18next.pipe'

@Component({
  imports: [NgOptimizedImage, TranslatePipe],
  selector: 'app-enemy',
  templateUrl: 'enemy.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  styleUrls: ['./enemy.component.sass'],
})
export class EnemyComponent {
  battleStore = inject(BattleStore)
  currentEnemyHp = this.battleStore.currentEnemyHp
  currentEnemy = this.battleStore.enemy
  isShinyEnemy = this.battleStore.isShinyEnemy   // ← new

  enemyWindowRef = viewChild<ElementRef>('enemy')

  getEnemyNativeElement(): HTMLElement | null {
    return this.enemyWindowRef()?.nativeElement || null
  }

  // Falls back to the regular (non-shiny) sprite if the -shiny.png asset is missing.
  onImgError(event: Event): void {
    const img = event.target as HTMLImageElement
    const enemy = this.currentEnemy()
    if (!enemy) return
    // Strip -shiny suffix so we always land on the base asset.
    img.src = enemy.url.replace(/-shiny\.png$/i, '.png')
  }

  protected readonly ENEMIES_DATA = ENEMIES_DATA
  protected readonly EnemyID = EnemyID
}
```

Key points:
- `isShinyEnemy` is a direct reference to the store signal — no extra computed needed.
- `onImgError` strips the `-shiny` suffix from whatever URL is currently on the `<img>`. This means it degrades correctly even if the shiny asset never existed.

## Step 2 — Template: class binding + error handler

`enemy.component.html` — update the `<img>` tag:

```html
<img
  [ngSrc]="currentEnemy().url"
  [class.shiny]="isShinyEnemy()"
  (error)="onImgError($event)"
  alt=""
  disableOptimizedSrcset
  height="128"
  width="128"
>
```

- `[class.shiny]` toggles the `.shiny` CSS class on the element itself.
- `(error)` fires only when the browser fails to load the image URL — zero cost on normal enemies.

> **Note:** `NgOptimizedImage` intercepts `(error)` through its own `onError` output, not the native DOM event. If you see the fallback not firing, switch to `(ngSrcError)="onImgError($event)"` or drop `[ngSrc]` for `[src]` on the enemy component specifically (the image is small and static-sized, so optimization is low value here).

## Step 3 — Styles: shiny class

`enemy.component.sass` — add under the `.enemy` block:

```sass
  &.shiny img, img.shiny
    filter: drop-shadow(0 0 6px gold)
    animation: shimmer 1.2s ease-in-out infinite alternate

@keyframes shimmer
  from
    filter: drop-shadow(0 0 4px gold)
  to
    filter: drop-shadow(0 0 10px gold)
```

Adjust the glow radius and colour to taste. The `animation` is optional — remove it
for a static glow if performance or motion-sensitivity is a concern.

> The plan deliberately deferred "glow animation" to v2 polish. Whether to include it
> here is up to the implementer. The CSS class itself (`shiny`) must be wired regardless
> so future polish has a stable hook.

## Edge cases

- **Asset missing**: `onImgError` strips `-shiny.png` → browser retries with the base URL.
  If the base URL also 404s, the browser shows its broken-image placeholder — that's the
  enemy data being wrong, not a shiny issue.
- **isShinyEnemy resets**: `BattleStore.endBattle()` and `changeWave()` both set
  `isShinyEnemy: false`, so the CSS class drops as soon as the battle ends.
- **Boss shiny**: bosses are eligible — no special case needed here.
