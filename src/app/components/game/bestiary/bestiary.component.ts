import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core'
import { CommonModule } from '@angular/common'
import { TranslatePipe } from '../../../pipes/i18next.pipe'
import { PlayerStore } from '../../../store/player/player.store'
import { EnemyID } from 'enums/ids/enemy-id.enum'
import { ItemID } from 'enums/ids/item-id.enum'
import { ZoneID } from 'enums/ids/zone-id.enum'
import ENEMIES_DATA from '../../../../data/enemies-data'
import { MonsterEntry } from 'interfaces/bestiary/monster-entry.interface'

const LOCKED_SPRITE = './assets/img/enemies/unknown.png'

const toShinyUrl = (url: string): string => url.replace(/\.png$/i, '-shiny.png')

@Component({
    selector: 'app-bestiary',
    templateUrl: './bestiary.component.html',
    styleUrls: ['./bestiary.component.sass'],
    imports: [CommonModule, TranslatePipe],
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
                zones: e.zones,
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

    selectMonster(entry: MonsterEntry) {
        if (!entry.isUnlocked) return
        this.selectedId.set(entry.id)
        this.showShiny.set(false)
    }

    toggleShiny() {
        this.showShiny.update(v => !v)
    }
}
