import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core'
import { NgOptimizedImage } from '@angular/common'
import { BattleStore } from '../../../../../store/battle/battle.store'
import { PlayerStore } from '../../../../../store/player/player.store'
import { SkillPointID } from '../../../../../../enums/ids/skill-tree-node-id.enum'
import { DamageElement } from '../../../../../../enums/damage-element.enum'
import { TranslatePipe } from '../../../../../pipes/i18next.pipe'

const WEAKNESS_ICONS: Record<DamageElement, string> = {
  [DamageElement.fire]: './assets/img/icons/fireWeakness.png',
  [DamageElement.water]: './assets/img/icons/waterWeakness.png',
  [DamageElement.air]: './assets/img/icons/airWeakness.png',
  [DamageElement.earth]: './assets/img/icons/earthWeakness.png',
  [DamageElement.light]: './assets/img/icons/lightWeakness.png',
  [DamageElement.dark]: './assets/img/icons/darkWeakness.png',
  [DamageElement.physical]: './assets/img/icons/physicalWeakness.png',
}

@Component({
  selector: 'app-monster-debuff-bar',
  templateUrl: './monster-debuff-bar.component.html',
  styleUrls: ['./monster-debuff-bar.component.sass'],
  imports: [NgOptimizedImage, TranslatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MonsterDebuffBarComponent {
  private battleStore = inject(BattleStore)
  private playerStore = inject(PlayerStore)

  weakness = computed(() => {
    const enemy = this.battleStore.enemy()
    if (!enemy || enemy.weakness === undefined) return null
    if (!this.playerStore.hasSkillUnlocked(SkillPointID.weaknesses)) return null
    return {
      element: enemy.weakness,
      icon: WEAKNESS_ICONS[enemy.weakness],
      nameKey: `app:elements.${DamageElement[enemy.weakness]}`,
    }
  })
}
