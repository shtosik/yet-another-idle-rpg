import { inject, Injectable } from '@angular/core'
import { SceneSpot } from '../../data/scene-spots'
import { ItemID } from '../../enums/ids/item-id.enum'
import { ZoneID } from '../../enums/ids/zone-id.enum'
import { QuestState } from '../../enums/quest-state.enum'
import { QuestProgression } from '../../types/quests/quest-progression.type'
import { PlayerStore } from '../store/player/player.store'
import { QuestsStore } from '../store/quests/quests.store'
import { GameNavigationService } from './game-navigation.service'
import { NoticesService } from './notices.service'
import { getQuestStatus } from './quest-status'
import { UnlockService } from './unlock.service'

export interface SpotState {
  progression: QuestProgression
  itemCount: (id: ItemID) => number
  isZoneUnlocked: (id: ZoneID) => boolean
}

/** A spot works during its quest step, while its item isn't held or its Zone is still locked. */
export function spotActive(spot: SceneSpot, state: SpotState): boolean {
  const status = getQuestStatus(state.progression, spot.when.questId)
  if (status.state !== QuestState.active || status.step !== spot.when.step) return false
  return 'itemId' in spot.gives ? state.itemCount(spot.gives.itemId) === 0 : !state.isZoneUnlocked(spot.gives.zoneId)
}

/** Pixel data of a mask, as `CanvasRenderingContext2D.getImageData` gives it. */
export interface MaskPixels {
  width: number
  height: number
  data: ArrayLike<number>
}

/** The mask colour (`#rrggbb`) at art pixel (x, y); null where the mask is transparent or outside it. */
export function maskColorAt(mask: MaskPixels, x: number, y: number): string | null {
  const [px, py] = [Math.floor(x), Math.floor(y)]
  if (px < 0 || py < 0 || px >= mask.width || py >= mask.height) return null
  const i = (py * mask.width + px) * 4
  if (mask.data[i + 3] === 0) return null
  return '#' + [0, 1, 2].map(c => mask.data[i + c].toString(16).padStart(2, '0')).join('')
}

/** Search spots and hidden passages: whether a spot works, and what using it does. */
@Injectable({ providedIn: 'root' })
export class SceneSpotsService {
  private playerStore = inject(PlayerStore)
  private questsStore = inject(QuestsStore)
  private unlockService = inject(UnlockService)
  private navigation = inject(GameNavigationService)
  private notices = inject(NoticesService)
  private masks = new Map<string, Promise<MaskPixels>>()

  isActive(spot: SceneSpot): boolean {
    return spotActive(spot, {
      progression: this.questsStore.questStepProgression(),
      itemCount: id => this.playerStore.itemCount(id),
      isZoneUnlocked: id => this.playerStore.isZoneUnlocked(id),
    })
  }

  /** Does nothing when the spot isn't active, so a click on scenery is never a tell. */
  use(spot: SceneSpot): void {
    if (!this.isActive(spot)) return
    if ('itemId' in spot.gives) {
      const report = this.playerStore.grant([{ id: spot.gives.itemId, amount: 1 }], 'atomic')
      if (!report.received.length) return // the Quest tab is uncapped, so this only guards odd saves
      this.notices.push({ type: 'found', spotId: spot.id })
    } else {
      this.unlockService.grant({ type: 'zone', zoneId: spot.gives.zoneId })
      this.navigation.fightIn(spot.gives.zoneId)
    }
  }

  /** The mask's pixels, loaded once per url. */
  mask(url: string): Promise<MaskPixels> {
    let mask = this.masks.get(url)
    if (!mask) {
      mask = loadMask(url)
      this.masks.set(url, mask)
    }
    return mask
  }
}

function loadMask(url: string): Promise<MaskPixels> {
  return new Promise((resolve, reject) => {
    const image = new Image()
    image.onload = () => {
      const canvas = document.createElement('canvas')
      canvas.width = image.naturalWidth
      canvas.height = image.naturalHeight
      const context = canvas.getContext('2d', { willReadFrequently: true })
      if (!context) return reject(new Error('no 2d context'))
      context.drawImage(image, 0, 0)
      resolve(context.getImageData(0, 0, canvas.width, canvas.height))
    }
    image.onerror = () => reject(new Error(`mask failed to load: ${url}`))
    image.src = url
  })
}
