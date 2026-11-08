import { provideZonelessChangeDetection } from '@angular/core'
import { TestBed } from '@angular/core/testing'
import { SkillTreeService } from './skill-tree.service'
import { PlayerStore } from '../store/player/player.store'
import { SkillNodeID } from '../../enums/ids/skill-node-id.enum'

describe('SkillTreeService respec', () => {
  let tree: SkillTreeService
  let player: InstanceType<typeof PlayerStore>

  beforeEach(() => {
    localStorage.clear()
    TestBed.configureTestingModule({ providers: [provideZonelessChangeDetection()] })
    tree = TestBed.inject(SkillTreeService)
    player = TestBed.inject(PlayerStore)
    player.updateUnlockedNodes(SkillNodeID.packRat, 1)
  })

  afterEach(() => localStorage.clear())

  it('refuses without the gold and changes nothing', () => {
    const { goldCost } = tree.respecPreview()
    player.updatePlayerStats([{ stat: 'goldCoins', amount: goldCost - 1 - player.stats().goldCoins }])

    expect(tree.respecEntireTree()).toBeFalse()
    expect(player.unlockedNodes()[SkillNodeID.packRat]).toBe(1)
    expect(player.stats().goldCoins).toBe(goldCost - 1)
  })

  it('takes exactly its gold cost and returns the skill points', () => {
    const { goldCost, skillPointsToReturn } = tree.respecPreview()
    player.updatePlayerStats([{ stat: 'goldCoins', amount: goldCost + 10 - player.stats().goldCoins }])
    const points = player.stats().unspentSkillPoints

    expect(tree.respecEntireTree()).toBeTrue()
    expect(player.stats().goldCoins).toBe(10)
    expect(player.stats().unspentSkillPoints).toBe(points + skillPointsToReturn)
    expect(player.unlockedNodes()[SkillNodeID.packRat]).toBeFalsy()
  })
})
