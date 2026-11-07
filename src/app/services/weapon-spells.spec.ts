import { provideZonelessChangeDetection } from '@angular/core'
import { TestBed } from '@angular/core/testing'
import { BattleManagerService } from './battle-manager.service'
import { AnimationsService } from './animations.service'
import { BattleStore } from '../store/battle/battle.store'
import { PlayerStore } from '../store/player/player.store'
import { SpellID } from '../../enums/ids/spell-id.enum'
import { ItemID } from '../../enums/ids/item-id.enum'

describe('Weapon spells', () => {
  let service: BattleManagerService
  let battle: InstanceType<typeof BattleStore>
  let player: InstanceType<typeof PlayerStore>
  let hits: jasmine.Spy

  beforeEach(() => {
    localStorage.clear()
    TestBed.configureTestingModule({ providers: [provideZonelessChangeDetection()] })
    service = TestBed.inject(BattleManagerService)
    battle = TestBed.inject(BattleStore)
    player = TestBed.inject(PlayerStore)
    hits = spyOn(TestBed.inject(AnimationsService), 'showDamage')
    player.updatePlayerStats([{ stat: 'maxMana', amount: 100 }, { stat: 'mana', amount: 100 }])
    for (const spellId of [SpellID.doubleAttack, SpellID.volley]) {
      player.levelUpSpell(spellId)
      service.equipSpell(spellId)
    }
    battle.startBattle(0)
    battle.updateEnemyHp(100000)
  })

  afterEach(() => localStorage.clear())

  function equip(id: ItemID) {
    player.addItems([{ id, amount: 1 }])
    const item = player.inventory().gear.find(slot => slot?.id === id)
    if (!item) throw new Error('Test weapon missing')
    player.equipItem(item)
  }

  it('rejects unarmed and incompatible casts without costs; swapping keeps spells and cooldowns', () => {
    const mana = player.stats().mana
    service.castSpell(SpellID.doubleAttack)
    expect(service.canCast(SpellID.doubleAttack)).toBeFalse()
    expect(player.stats().mana).toBe(mana)
    expect(hits).not.toHaveBeenCalled()
    equip(ItemID.woodenBow)
    expect(service.canCast(SpellID.doubleAttack)).toBeFalse()
    expect(service.canCast(SpellID.volley)).toBeTrue()
    service.castSpell(SpellID.doubleAttack)
    expect(player.stats().mana).toBe(mana)
    equip(ItemID.machete)
    expect(service.canCast(SpellID.doubleAttack)).toBeTrue()
    expect(service.canCast(SpellID.volley)).toBeFalse()
    service.castSpell(SpellID.doubleAttack)
    expect(player.stats().mana).toBe(mana - 2)
    player.unequipItem('weapon')
    TestBed.tick()
    expect(battle.equippedSpells().find(s => s?.spellId === SpellID.doubleAttack)?.cooldownRemainingMs).toBe(60000)
    expect(battle.equippedSpells().some(s => s?.spellId === SpellID.volley)).toBeTrue()
  })

  it('Double Attack resolves two hits and consumes one Ambush charge per hit', () => {
    equip(ItemID.machete)
    battle.empower(SpellID.ambush, 5)
    service.castSpell(SpellID.doubleAttack)
    expect(hits).toHaveBeenCalledTimes(2)
    expect(battle.empowered()?.hitsLeft).toBe(3)
  })

  it('Volley resolves three hits for one cost without using Ambush', () => {
    equip(ItemID.woodenBow)
    battle.empower(SpellID.ambush, 5)
    const mana = player.stats().mana
    service.castSpell(SpellID.volley)
    expect(hits).toHaveBeenCalledTimes(3)
    expect(player.stats().mana).toBe(mana - 3)
    expect(battle.empowered()?.hitsLeft).toBe(5)
    expect(battle.equippedSpells().find(s => s?.spellId === SpellID.volley)?.cooldownRemainingMs).toBe(60000)
  })

  for (const spell of [{ id: SpellID.doubleAttack, weapon: ItemID.machete }, { id: SpellID.volley, weapon: ItemID.woodenBow }]) {
    it(`${SpellID[spell.id]} stops after a lethal first hit`, () => {
      equip(spell.weapon)
      battle.updateEnemyHp(1)
      service.castSpell(spell.id)
      expect(hits).toHaveBeenCalledTimes(1)
      expect(battle.isInCombat()).toBeFalse()
    })
  }

  it('rolls critical hits independently within a cast', () => {
    equip(ItemID.machete)
    player.updatePlayerStats([{ stat: 'critChance', amount: 50 }])
    spyOn(Math, 'random').and.returnValues(0.01, 0.99)
    service.castSpell(SpellID.doubleAttack)
    expect(hits.calls.argsFor(0)[1]).toBeTrue()
    expect(hits.calls.argsFor(1)[1]).toBeFalse()
  })

  it('leaves Ambush and War Cry available without a weapon', () => {
    for (const id of [SpellID.ambush, SpellID.warCry]) {
      player.levelUpSpell(id)
      service.equipSpell(id)
      expect(service.canCast(id)).toBeTrue()
    }
  })
})
