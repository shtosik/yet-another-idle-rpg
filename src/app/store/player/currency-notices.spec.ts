import { provideZonelessChangeDetection } from '@angular/core'
import { TestBed } from '@angular/core/testing'
import { PlayerStore } from './player.store'
import { emptyKillBatch } from './kill-rewards'
import { Notice, NoticesService } from '../../services/notices.service'
import { ZoneID } from '../../../enums/ids/zone-id.enum'
import { ReputationID } from '../../../enums/reputation-id.enum'
import { ProfessionID } from '../../../enums/ids/profession-id.enum'

/** Every gold and token change reports a currency notice except kill gold (owner decision, codebase-deepening-4). */
describe('PlayerStore reports notices', () => {
  let player: InstanceType<typeof PlayerStore>
  let pushed: Notice[]

  const currency = () => pushed.filter(n => n.type === 'currency').map(n => n.type === 'currency' && n.gain)

  beforeEach(() => {
    localStorage.clear()
    pushed = []
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection(), { provide: NoticesService, useValue: { push: (n: Notice) => pushed.push(n) } }],
    })
    player = TestBed.inject(PlayerStore)
  })

  afterEach(() => localStorage.clear())

  it('reports earned and spent gold', () => {
    player.changeResources({ goldCoins: 40 })
    player.spend('gold', 15)

    expect(currency().map(gain => gain && gain.gold)).toEqual([40, -15])
  })

  it('reports nothing for a refused spend', () => {
    player.spend('gold', 1_000_000)
    expect(currency()).toEqual([])
  })

  it('keeps kill gold silent, online and offline', () => {
    player.changeResources({ goldCoins: 10 }, { silent: true })
    player.applyKillBatch({ ...emptyKillBatch(ZoneID.horseshoeBeach, 1), gold: 25 })

    expect(currency()).toEqual([])
    expect(player.resources().goldCoins).toBe(35)
  })

  it('reports tier ups and expertise gains', () => {
    player.addReputation([{ reputationId: ReputationID.farmingGuild, amount: 1000 }])
    player.unlockProfession(ProfessionID.farming)
    player.applyProfessionXp(ProfessionID.farming, 620)

    const tierUp = pushed.find(n => n.type === 'tierUp')
    expect(tierUp?.type === 'tierUp' && tierUp.tierUps.length).toBe(1)
    const expertise = pushed.find(n => n.type === 'expertiseUp')
    expect(expertise?.type === 'expertiseUp' && expertise.gain.to).toBeGreaterThan(1)
  })
})
