import { provideZonelessChangeDetection } from '@angular/core'
import { ComponentFixture, TestBed } from '@angular/core/testing'
import { BattleComponent } from './battle.component'
import { BattleStore } from '../../../store/battle/battle.store'
import { PlayerStore } from '../../../store/player/player.store'
import { BattleManagerService } from '../../../services/battle-manager.service'
import { SpellID } from '../../../../enums/ids/spell-id.enum'
import { SkillNodeID } from '../../../../enums/ids/skill-node-id.enum'
import { ZoneID } from '../../../../enums/ids/zone-id.enum'
import { AnimationsService } from '../../../services/animations.service'
import { ArenaBossesService } from '../../../services/arena-bosses.service'
import { DamageElement } from '../../../../enums/damage-element.enum'
import i18next from 'i18next'

describe('Battle panel presentation', () => {
  let fixture: ComponentFixture<BattleComponent>
  let host: HTMLElement
  let battle: InstanceType<typeof BattleStore>
  let player: InstanceType<typeof PlayerStore>

  beforeAll(async () => {
    const namespaces = ['app', 'enemies', 'zones', 'spells', 'items']
    const translations = await Promise.all(namespaces.map(async namespace =>
      [namespace, await fetch(`/assets/locales/en/${namespace}.json`).then(response => response.json())],
    ))
    await i18next.init({ lng: 'en', resources: { en: Object.fromEntries(translations) }, defaultNS: 'app' })
  })

  beforeEach(() => {
    localStorage.clear()
    TestBed.configureTestingModule({ providers: [provideZonelessChangeDetection()] })
    battle = TestBed.inject(BattleStore)
    player = TestBed.inject(PlayerStore)
    fixture = TestBed.createComponent(BattleComponent)
    host = fixture.nativeElement
    // The existing 1536px game body leaves 372px for each outer column at desktop width.
    host.style.width = '372px'
    host.style.height = '728px'
  })

  afterEach(() => {
    fixture.destroy()
    localStorage.clear()
  })

  function element(selector: string): HTMLElement {
    const result = host.querySelector<HTMLElement>(selector)
    if (!result) throw new Error(`Missing battle element: ${selector}`)
    return result
  }

  function equipSpell(spellId: SpellID): void {
    player.levelUpSpell(spellId)
    battle.addSpell({ spellId, cooldownRemainingMs: 0 })
    player.updatePlayerStats([{ stat: 'maxMana', amount: 50 }, { stat: 'mana', amount: 50 }])
  }

  it('keeps five spell slots inside the fixed panel, including empty slots', () => {
    fixture.detectChanges()
    const panel = host.getBoundingClientRect()
    const slots = host.querySelectorAll<HTMLElement>('.spell-bar__slot')
    expect(slots.length).toBe(5)
    expect(host.querySelectorAll('.spell-bar__empty').length).toBe(5)
    slots.forEach(slot => {
      const rect = slot.getBoundingClientRect()
      expect(rect.left).toBeGreaterThanOrEqual(panel.left)
      expect(rect.right).toBeLessThanOrEqual(panel.right)
      expect(rect.bottom).toBeLessThanOrEqual(panel.bottom)
    })
    expect(host.scrollWidth).toBeLessThanOrEqual(host.clientWidth)
    expect(host.scrollHeight).toBeLessThanOrEqual(host.clientHeight)
  })

  it('matches spell readiness to actual cast eligibility through combat, cooldown and mana changes', () => {
    equipSpell(SpellID.fireStrike)
    fixture.detectChanges()
    expect(element('.spell').getAttribute('aria-disabled')).toBe('true')

    battle.startBattle(0)
    fixture.detectChanges()
    expect(element('.spell').classList.contains('spell--ready')).toBeTrue()

    battle.setSpellCooldown(SpellID.fireStrike, 1200)
    fixture.detectChanges()
    expect(element('.spell').getAttribute('aria-disabled')).toBe('true')
    expect(element('.spell__counter').textContent?.trim()).toBe('2')

    battle.tickSpellTimers(1200)
    player.updatePlayerStats([{ stat: 'mana', amount: -100 }])
    fixture.detectChanges()
    expect(element('.spell').classList.contains('spell--ready')).toBeFalse()
    expect(element('.spell__cost').classList.contains('spell__cost--low')).toBeTrue()
    expect(element('.spell').getAttribute('aria-label')).toContain('Not enough mana')
  })

  it('casts through a native button and keeps running effects distinct from ready spells', () => {
    equipSpell(SpellID.haste)
    fixture.detectChanges()
    expect(element('.spell').tagName).toBe('BUTTON')
    element('.spell').click()
    fixture.detectChanges()
    expect(battle.activeBuffs().some(buff => buff.spellId === SpellID.haste)).toBeTrue()
    expect(element('.spell').classList.contains('spell--active')).toBeTrue()
    expect(element('.spell').classList.contains('spell--ready')).toBeFalse()
    expect(element('.effect-icon').getAttribute('aria-label')).toContain('Haste')
  })

  it('shows labeled weaknesses only after the existing skill gate is unlocked', () => {
    battle.setZone(ZoneID.plains)
    battle.startBattle(0)
    fixture.detectChanges()
    expect(host.querySelector('.monster-debuff-bar')).toBeNull()

    player.updateUnlockedNodes(SkillNodeID.weaknesses, 1)
    fixture.detectChanges()
    const weaknessText = element('.monster-debuff-bar').textContent ?? ''
    expect(weaknessText.match(/Weak to/g)?.length).toBe(1)
    const weakness = battle.enemy()?.weakness
    if (weakness === undefined) throw new Error('Expected an elemental weakness')
    expect(element('.monster-debuff-bar__element').textContent?.trim())
      .toBe(i18next.t(`app:elements.${DamageElement[weakness]}`))
    expect(element('.monster-debuff-bar__element').title).not.toContain('Weak to')
  })

  it('keeps unavailable wave arrows visible and disables them', () => {
    fixture.detectChanges()
    const arrows = host.querySelectorAll<HTMLButtonElement>('.wave-button')
    expect(arrows.length).toBe(2)
    arrows.forEach(arrow => {
      expect(arrow.disabled).toBeTrue()
      expect(arrow.getAttribute('aria-label')).toBeTruthy()
      expect(getComputedStyle(arrow).visibility).toBe('visible')
    })
  })

  it('distinguishes boss and shiny fights while keeping the HP and controls apart', () => {
    for (let wave = 1; wave < battle.currentZoneData().maxWave; wave++) battle.changeWave(true)
    battle.startBattle(100)
    fixture.detectChanges()
    expect(element('.enemy__tag--boss').textContent).toContain('Boss')
    expect(element('.enemy__tags').textContent).not.toContain('Shiny')
    const enemy = battle.enemy()
    if (!enemy) throw new Error('Expected a boss fight')
    battle.updateEnemyHp(enemy.maxHp - 1)
    fixture.detectChanges()
    expect(element('.hp-bar').getAttribute('aria-valuenow')).toBe(String(enemy.maxHp - 1))
    const pane = element('.battle-pane').getBoundingClientRect()
    const hp = element('.hp-bar').getBoundingClientRect()
    expect(Math.abs((hp.left - pane.left) - (pane.right - hp.right))).toBeLessThan(1)
    expect(element('.enemy').getBoundingClientRect().right)
      .toBeLessThanOrEqual(element('app-battle-side-buttons').getBoundingClientRect().left)
  })

  it('keeps arena weak points clickable under popups and hides wave movement', () => {
    battle.startArenaRun(0)
    while (battle.arenaRun()?.wave !== 5) battle.recordArenaKill(0, 0)
    battle.startBattle(0)
    const bosses = TestBed.inject(ArenaBossesService)
    bosses.tick(0)
    bosses.tick(5000)
    fixture.detectChanges()
    expect(host.querySelector('.wave-button')).toBeNull()
    expect(element('.enemy__tag--boss').textContent).toContain('Boss')
    expect(element('.weak-point').getBoundingClientRect().width).toBeGreaterThan(24)
    element('.weak-point').click()
    fixture.detectChanges()
    expect(bosses.isDamageBoosted()).toBeTrue()
    expect(host.querySelector('.weak-point')).toBeNull()
  })

  it('shows every simultaneous hit without intercepting battle controls', () => {
    battle.startBattle(0)
    fixture.detectChanges()
    const animations = TestBed.inject(AnimationsService)
    animations.showDamage(7, true, false)
    animations.showDamage(4, false, true)
    animations.showDamage(9, true, true)
    fixture.detectChanges()
    const labels = Array.from(host.querySelectorAll('.hit-label'), label => label.textContent?.trim())
    expect(host.querySelectorAll('.damage-number').length).toBe(3)
    expect(labels).toEqual([
      'Crit!',
      i18next.t('app:damage.strong'),
      i18next.t('app:damage.strongCritical'),
    ])
    expect(getComputedStyle(element('app-damage-popup')).pointerEvents).toBe('none')
    expect(TestBed.inject(BattleManagerService).canMoveToNextWave()).toBeFalse()
  })
})
