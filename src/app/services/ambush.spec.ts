import { provideZonelessChangeDetection } from '@angular/core'
import { TestBed } from '@angular/core/testing'
import { BattleManagerService } from './battle-manager.service'
import { BattleStore } from '../store/battle/battle.store'
import { PlayerStore } from '../store/player/player.store'
import { SpellID } from '../../enums/ids/spell-id.enum'
import { ItemID } from '../../enums/ids/item-id.enum'
import { ItemTier } from '../../enums/items/item-tier.enum'

describe('Ambush and spell scrolls', () => {
  let service: BattleManagerService
  let battleStore: InstanceType<typeof BattleStore>
  let playerStore: InstanceType<typeof PlayerStore>

  beforeEach(() => {
    localStorage.clear()
    TestBed.configureTestingModule({ providers: [provideZonelessChangeDetection()] })
    service = TestBed.inject(BattleManagerService)
    battleStore = TestBed.inject(BattleStore)
    playerStore = TestBed.inject(PlayerStore)
  })

  afterEach(() => localStorage.clear())

  const useScroll = () => {
    playerStore.addItems([{ id: ItemID.ambushScroll, tier: ItemTier.rare, amount: 1 }])
    playerStore.useItem(playerStore.inventory().find(slot => slot?.id === ItemID.ambushScroll)!)
  }

  it('the scroll teaches Ambush once and is used up', () => {
    useScroll()
    expect(playerStore.knownSpellIds()).toContain(SpellID.ambush)
    expect(playerStore.inventory().some(slot => slot?.id === ItemID.ambushScroll)).toBeFalse()

    // A second scroll isn't wasted on a spell already known.
    useScroll()
    expect(playerStore.inventory().some(slot => slot?.id === ItemID.ambushScroll)).toBeTrue()
  })

  it('melee hits use up the 5 guaranteed crits; magic hits do not', () => {
    battleStore.empower(SpellID.ambush, 5)
    battleStore.startBattle(0)
    battleStore.updateEnemyHp(100000)

    service.doDamage(15)
    expect(battleStore.empowered()?.hitsLeft).toBe(5)

    for (let i = 0; i < 5; i++) service.doDamage()
    expect(battleStore.empowered()).toBeNull()
  })

  it('auto-attacks with a bow are not melee, so they keep the crits', () => {
    playerStore.addItems([{ id: ItemID.woodenBow, amount: 1 }])
    playerStore.equipItem(playerStore.inventory().find(slot => slot?.id === ItemID.woodenBow)!)
    battleStore.empower(SpellID.ambush, 5)
    battleStore.startBattle(0)
    battleStore.updateEnemyHp(100000)

    service.doDamage()
    expect(battleStore.empowered()?.hitsLeft).toBe(5)
  })
})
