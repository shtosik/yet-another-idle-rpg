import { provideZonelessChangeDetection } from '@angular/core'
import { TestBed } from '@angular/core/testing'
import { GameClock } from './game-clock.service'
import { ArenaService } from './arena.service'
import { ModalService } from './modal.service'
import { OfflineProgressService } from './offline-progress.service'
import { TurnInCooldownService } from './turn-in-cooldown.service'
import { saveGameStateNow } from '../store/helpers/with-game-state-sync.hook'
import { BattleStore } from '../store/battle/battle.store'
import { OfflineStore } from '../store/offline/offline.store'
import { PlayerStore } from '../store/player/player.store'
import { QuestsStore } from '../store/quests/quests.store'
import { bundleKey, TURN_IN_COOLDOWN_MS } from '../store/quests/turn-in-cooldown'
import { ARENA } from '../../data/arena-data'
import { ItemID } from '../../enums/ids/item-id.enum'
import { NpcID } from '../../enums/map/npc-id.enum'
import { ProfessionID } from '../../enums/ids/profession-id.enum'

const MINUTE = 60_000
const HOUR = 60 * MINUTE
const T = 1_700_000_000_000

const saveOffline = (state: object) => localStorage.setItem('offlineStore', JSON.stringify({ v: 1, state }))
const configure = () => TestBed.configureTestingModule({ providers: [provideZonelessChangeDetection()] })
const hostAt = (ms: number) => spyOn(window, 'fetch').and.resolveTo(new Response(null, { headers: { Date: new Date(ms).toUTCString() } }))

describe('GameClock', () => {
  beforeEach(() => localStorage.clear())
  afterEach(() => localStorage.clear())

  it('starts from the saved gameMs, else from lastSeenAt, else 0', () => {
    saveOffline({ lastSeenAt: T, gameMs: 5000, killWindow: null })
    configure()
    expect(TestBed.inject(GameClock).nowMs()).toBe(5000)

    TestBed.resetTestingModule()
    saveOffline({ lastSeenAt: T, killWindow: null })
    configure()
    expect(TestBed.inject(GameClock).nowMs()).toBe(T)

    TestBed.resetTestingModule()
    localStorage.clear()
    configure()
    expect(TestBed.inject(GameClock).nowMs()).toBe(0)
  })

  it('advance moves nowMs and second; a negative advance is ignored', () => {
    configure()
    const clock = TestBed.inject(GameClock)
    clock.advance(2500)
    expect(clock.nowMs()).toBe(2500)
    expect(clock.second()).toBe(2)

    clock.advance(-1000)
    clock.advance(0)
    expect(clock.nowMs()).toBe(2500)
  })

  it('markSeen writes lastSeenAt and gameMs together', async () => {
    configure()
    hostAt(T)
    const offline = TestBed.inject(OfflineStore)
    const progress = TestBed.inject(OfflineProgressService)
    await progress.claim()
    const clock = TestBed.inject(GameClock)
    clock.advance(5000)

    progress.markSeen()

    expect(offline.lastSeenAt()).toBeGreaterThanOrEqual(T)
    expect(offline.gameMs()).toBe(5000)
  })

  it('an old save with wall timestamps and no gameMs loads with every cooldown and plot unchanged', () => {
    const key = bundleKey(NpcID.laHarparBartender, ItemID.crabMeat)
    configure()
    TestBed.inject(GameClock).advance(T)
    const player = TestBed.inject(PlayerStore)
    player.unlockProfession(ProfessionID.farming)
    player.grant([{ id: ItemID.turnipSeeds, amount: 1 }], 'lossy')
    player.plantSeed(ItemID.turnipSeeds, 1, 0)
    TestBed.inject(QuestsStore).recordTurnIn(key, T - HOUR)
    const arena = TestBed.inject(ArenaService)
    arena.enter(T - 10 * MINUTE)
    arena.leave(T - 10 * MINUTE)
    saveGameStateNow()
    // Saved before game time: lastSeenAt only.
    saveOffline({ lastSeenAt: T, killWindow: null })

    TestBed.resetTestingModule()
    configure()
    const loaded = TestBed.inject(PlayerStore)
    loaded.syncFarm()

    expect(TestBed.inject(GameClock).nowMs()).toBe(T)
    expect(loaded.farm().plots[0]).toEqual(jasmine.objectContaining({ plantedAt: T, progressMs: 0, syncedAt: T }))
    expect(TestBed.inject(TurnInCooldownService).remainingMs(key)).toBe(TURN_IN_COOLDOWN_MS - HOUR)
    expect(TestBed.inject(BattleStore).arenaReadyAt() - T).toBe(ARENA.entryCooldownMs - 10 * MINUTE)
    expect(TestBed.inject(ArenaService).isReady()).toBeFalse()
  })
})

describe('offline claim on game time', () => {
  beforeEach(() => {
    localStorage.clear()
    configure()
    spyOn(TestBed.inject(ModalService), 'openWelcomeBack')
    spyOn(TestBed.inject(ModalService), 'openArenaResult')
  })
  afterEach(() => localStorage.clear())

  it('a 48 h gap moves crops, an Order cooldown and the arena wait by 24 h only', async () => {
    const key = bundleKey(NpcID.laHarparBartender, ItemID.crabMeat)
    const player = TestBed.inject(PlayerStore)
    const arena = TestBed.inject(ArenaService)
    TestBed.inject(OfflineStore).setLastSeen(0, 0)
    player.unlockProfession(ProfessionID.farming)
    player.grant([{ id: ItemID.turnipSeeds, amount: 1 }], 'lossy')
    player.plantSeed(ItemID.turnipSeeds, 1, 0)
    // Each would be over after 48 h, and is still waiting after 24 h.
    TestBed.inject(QuestsStore).recordTurnIn(key, 23 * HOUR)
    arena.enter(24 * HOUR)
    arena.leave(24 * HOUR)
    hostAt(48 * HOUR)

    await TestBed.inject(OfflineProgressService).claim()
    player.syncFarm()

    expect(TestBed.inject(GameClock).nowMs()).toBe(24 * HOUR)
    expect(player.farm().plots[0]?.syncedAt).toBe(24 * HOUR)
    expect(TestBed.inject(TurnInCooldownService).remainingMs(key)).toBe(TURN_IN_COOLDOWN_MS - HOUR)
    expect(arena.isReady()).toBeFalse()
  })

  it('a slow host answer: the arena time is measured where the absence ended, and stamping actions wait for the claim', async () => {
    const player = TestBed.inject(PlayerStore)
    const arena = TestBed.inject(ArenaService)
    const clock = TestBed.inject(GameClock)
    const progress = TestBed.inject(OfflineProgressService)
    TestBed.inject(OfflineStore).setLastSeen(0, 0)
    player.unlockProfession(ProfessionID.farming)
    player.grant([{ id: ItemID.turnipSeeds, amount: 1 }], 'lossy')
    arena.enter(0)
    let answer!: (response: Response) => void
    spyOn(window, 'fetch').and.returnValue(new Promise<Response>(resolve => (answer = resolve)))
    const applyOffline = spyOn(progress as never as { applyOffline: (ms: number, seed: number) => unknown }, 'applyOffline').and.callThrough()

    const claim = progress.claim()
    clock.advance(30_000) // online ticks while the host is slow
    expect(clock.isSettled()).toBeFalse()
    expect(player.plantSeed(ItemID.turnipSeeds, 1, 0)).toBeFalse()

    answer(new Response(null, { headers: { Date: new Date(HOUR).toUTCString() } }))
    await claim

    expect(clock.isSettled()).toBeTrue()
    // Within real ms the spec takes; measured after the wait it would be 30 s more.
    expect(applyOffline.calls.mostRecent().args[0]).toBeCloseTo(HOUR - ARENA.timeLimitMs, -2)
    expect(player.plantSeed(ItemID.turnipSeeds, 1, 0)).toBeTrue()
  })

  it('a device clock moved forward 3 h moves nothing; game time does', () => {
    const key = bundleKey(NpcID.laHarparBartender, ItemID.crabMeat)
    const player = TestBed.inject(PlayerStore)
    player.unlockProfession(ProfessionID.farming)
    player.grant([{ id: ItemID.turnipSeeds, amount: 1 }], 'lossy')
    player.plantSeed(ItemID.turnipSeeds, 1, 0)
    TestBed.inject(QuestsStore).recordTurnIn(key, 0)
    const cooldowns = TestBed.inject(TurnInCooldownService)
    spyOn(Date, 'now').and.returnValue(Date.now() + 3 * HOUR)

    player.syncFarm()
    expect(player.farm().plots[0]?.progressMs).toBe(0)
    expect(cooldowns.remainingMs(key)).toBe(TURN_IN_COOLDOWN_MS)

    TestBed.inject(GameClock).advance(3 * HOUR)
    player.syncFarm()
    expect(player.farm().plots[0]?.progressMs).toBeGreaterThan(0)
    expect(cooldowns.remainingMs(key)).toBe(0)
  })
})
