import { ChangeDetectionStrategy, Component, computed, effect, inject, signal, untracked } from '@angular/core'
import { CommonModule } from '@angular/common'
import { I18nextPipe } from '../../../pipes/i18next.pipe'
import { HalfSizeSpriteDirective } from '../../shared/half-size-sprite/half-size-sprite.directive'
import { PlayerStore } from '../../../store/player/player.store'
import { EnemyID } from 'enums/ids/enemy-id.enum'
import { ItemID } from 'enums/ids/item-id.enum'
import { ZoneID } from 'enums/ids/zone-id.enum'
import ENEMIES_DATA from '../../../../data/enemies-data'
import { MonsterEntry } from 'interfaces/bestiary/monster-entry.interface'
import { toShinyUrl } from 'utils/shiny-url'
import { ZONES_BY_ENEMY } from '../../../../data/helpers/enemy-zones'
import ITEM_DATA from '../../../../data/items-data'
import { ItemTier } from 'enums/items/item-tier.enum'
import { DamageElement } from 'enums/damage-element.enum'
import { EnemyType } from 'enums/enemy-type.enum'
import { SkillNodeID } from 'enums/ids/skill-node-id.enum'
import { WEAKNESS_ICONS } from '../battle/enemy/monster-debuff-bar/monster-debuff-bar.component'

const LOCKED_SPRITE = './assets/img/enemies/unknown.png'

@Component({
    selector: 'app-bestiary',
    templateUrl: './bestiary.component.html',
    styleUrls: ['./bestiary.component.sass'],
    imports: [CommonModule, I18nextPipe, HalfSizeSpriteDirective],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BestiaryComponent {
    private playerStore = inject(PlayerStore)

    readonly EnemyID = EnemyID
    readonly ItemID = ItemID
    readonly ZoneID = ZoneID
    readonly LOCKED_SPRITE = LOCKED_SPRITE

    selectedId = signal<EnemyID | null>(null)
    showShiny = signal(false)

    monsters = computed<MonsterEntry[]>(() => {
        const kills = this.playerStore.enemyKillCounts()
        return Object.values(ENEMIES_DATA).map(e => {
            const killCount = kills[e.id] ?? 0
            return {
                id: e.id,
                url: e.url,
                maxHp: e.maxHp,
                experience: e.experience,
                gold: e.gold,
                weakness: e.weakness,
                enemyTypes: e.enemyTypes,
                zones: ZONES_BY_ENEMY[e.id] ?? [],
                drops: e.drops,
                shinyDrops: e.shinyDrops ?? [],
                killCount,
                isUnlocked: killCount > 0,
            }
        })
    })

    selectedMonster = computed<MonsterEntry | null>(() => {
        const id = this.selectedId()
        if (id === null) return null
        return this.monsters().find(m => m.id === id) ?? null
    })

    displayUrl = computed<string>(() => {
        const m = this.selectedMonster()
        if (!m) return ''
        return this.showShiny() ? toShinyUrl(m.url) : m.url
    })

    shinyUnlocked = computed<boolean>(() => (this.playerStore.stats().shinyChance ?? 0) > 0)
    /** Weaknesses stay hidden until the Weaknesses skill, as in battle. */
    weaknessKnown = computed(() => this.playerStore.hasSkillUnlocked(SkillNodeID.weaknesses))

    readonly WEAKNESS_ICONS = WEAKNESS_ICONS
    readonly DamageElement = DamageElement
    readonly EnemyType = EnemyType
    readonly ItemTier = ItemTier

    dropTier(itemId: ItemID): ItemTier {
        return ITEM_DATA[itemId].tier
    }

    constructor() {
        // Entries revealed while the tab is open count as seen too, so the navbar badge stays clear.
        effect(() => {
            if (this.playerStore.unseenEnemyCount()) untracked(() => this.playerStore.markEnemiesSeen())
        })
    }

    selectMonster(entry: MonsterEntry) {
        if (!entry.isUnlocked) return
        this.selectedId.set(entry.id)
        this.showShiny.set(false)
    }

    toggleShiny() {
        this.showShiny.update(v => !v)
    }
}
