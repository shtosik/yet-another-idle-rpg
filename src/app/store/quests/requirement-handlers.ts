import i18next from 'i18next'
import {
  EnemyKillCountRequirement, ItemRequirement, PickedItemsRequirement, ProfessionLevelRequirement, QuestRequirement,
  ReputationRequirement, RequirementProps, StatRequirement, WaveKillCountRequirement,
} from '../../../data/quests-data'
import ITEM_DATA from '../../../data/items-data'
import { ZONES_BY_ENEMY } from '../../../data/helpers/enemy-zones'
import { EnemyID } from '../../../enums/ids/enemy-id.enum'
import { ItemID } from '../../../enums/ids/item-id.enum'
import { ProfessionID } from '../../../enums/ids/profession-id.enum'
import { QuestID } from '../../../enums/ids/quest-id.enum'
import { ZoneID } from '../../../enums/ids/zone-id.enum'
import { ReputationID } from '../../../enums/reputation-id.enum'
import { ItemType } from '../../../enums/items/item-type.enum'
import { QuestProgression } from '../../../types/quests/quest-progression.type'
import { reputationTierLabel } from '../../components/game/quests/reputation/reputation-text'
import { ItemStack } from '../player/inventory'
import { REPUTATION_THRESHOLDS } from '../player/reputation'
import type { PlayerStatsType } from '../player/stats'
import { OrderState } from './orders'
import { enemyName, itemName, professionName, questName, zoneName } from '../../i18n/names'

/** Lifetime kill counters at the moment the quest reached its current step. */
export interface KillBaseline {
  enemies: Partial<Record<EnemyID, number>>
  waves: Record<string, number> // key: waveKey(zoneId, wave)
}

export const waveKey = (zoneId: ZoneID, wave: number) => `${zoneId}-${wave}`

/** What a requirement reads, for one quest. Kill counts are since the quest reached its current step. */
export interface RequirementContext {
  stats: PlayerStatsType
  progression: QuestProgression
  /** The rolled items of this quest's order. */
  picks: OrderState['requirements']
  itemCount(id: ItemID): number
  enemyKills(enemyId: EnemyID): number
  waveKills(zoneId: ZoneID, wave: number): number
  professionLevel(id: ProfessionID): number
  reputation(id: ReputationID): number
  isZoneUnlocked(id: ZoneID): boolean
}

export interface Progress {
  current: number
  target: number
}

/** One line of the quest panel: a `pickedItems` requirement shows one per rolled item. */
export interface RequirementRow extends Progress {
  label: string
  /** An unlocked zone where this kill requirement can be done. */
  zoneId: ZoneID | null
}

/** Lifetime kill counters, read when a quest reaches a step. */
export interface LifetimeKills {
  enemy(enemyId: EnemyID): number
  wave(zoneId: ZoneID, wave: number): number
}

interface RequirementHandler<R extends RequirementProps> {
  /** Met when `current >= target`. */
  progress(req: R, ctx: RequirementContext): Progress
  rows(req: R, ctx: RequirementContext): RequirementRow[]
  /** Kill requirements: records where counting starts. */
  baseline?(req: R, lifetime: LifetimeKills, into: KillBaseline): void
  /** Items a turn-in takes. */
  consumed?(req: R, picks: OrderState['requirements']): ItemStack[]
}

const row = (label: string, progress: Progress, zoneId: ZoneID | null = null): RequirementRow[] => [{ label, zoneId, ...progress }]
const firstUnlocked = (zones: ZoneID[], ctx: RequirementContext) => zones.find(zoneId => ctx.isZoneUnlocked(zoneId)) ?? null

const item: RequirementHandler<ItemRequirement> = {
  progress: (req, ctx) => ({ current: ctx.itemCount(req.itemId), target: req.amount }),
  rows: (req, ctx) => row(ITEM_DATA[req.itemId].type === ItemType.quest
    ? i18next.t('quests:requirements.findItem', { item: itemName(req.itemId) })
    : itemName(req.itemId), item.progress(req, ctx)),
  consumed: req => [{ id: req.itemId, amount: req.amount }],
}

const pickedItems: RequirementHandler<PickedItemsRequirement> = {
  // Items held, capped per pick, against the total asked: met only when every pick is.
  progress: (_, ctx) => ctx.picks.length === 0 ? { current: 0, target: 1 } : {
    current: ctx.picks.reduce((sum, p) => sum + Math.min(ctx.itemCount(p.itemId), p.amount), 0),
    target: ctx.picks.reduce((sum, p) => sum + p.amount, 0),
  },
  rows: (_, ctx) => ctx.picks.flatMap(({ itemId, amount }) => row(itemName(itemId), { current: ctx.itemCount(itemId), target: amount })),
  consumed: (_, picks) => picks.map(p => ({ id: p.itemId, amount: p.amount })),
}

const enemy: RequirementHandler<EnemyKillCountRequirement> = {
  progress: (req, ctx) => ({ current: ctx.enemyKills(req.enemyId), target: req.amount }),
  rows: (req, ctx) => row(enemyName(req.enemyId), enemy.progress(req, ctx), firstUnlocked(ZONES_BY_ENEMY[req.enemyId] ?? [], ctx)),
  baseline: (req, lifetime, into) => { into.enemies[req.enemyId] = lifetime.enemy(req.enemyId) },
}

const wave: RequirementHandler<WaveKillCountRequirement> = {
  progress: (req, ctx) => ({ current: ctx.waveKills(req.zoneId, req.wave), target: req.amount }),
  rows: (req, ctx) => row(
    i18next.t('quests:requirements.wave', { wave: req.wave, zone: zoneName(req.zoneId) }),
    wave.progress(req, ctx),
    firstUnlocked([req.zoneId], ctx),
  ),
  baseline: (req, lifetime, into) => { into.waves[waveKey(req.zoneId, req.wave)] = lifetime.wave(req.zoneId, req.wave) },
}

const stat: RequirementHandler<StatRequirement> = {
  progress: (req, ctx) => ({ current: ctx.stats[req.key], target: req.amount }),
  rows: (req, ctx) => row(i18next.t(`app:playerStats.${req.key}`), stat.progress(req, ctx)),
}

const quest: RequirementHandler<QuestRequirement> = {
  progress: (req, ctx) => {
    const step = ctx.progression[req.questId]
    return { current: step && (req.step === undefined || step === req.step) ? 1 : 0, target: 1 }
  },
  rows: (req, ctx) => row(questName(req.questId), quest.progress(req, ctx)),
}

const professionLevel: RequirementHandler<ProfessionLevelRequirement> = {
  progress: (req, ctx) => ({ current: ctx.professionLevel(req.professionId), target: req.level }),
  rows: (req, ctx) => row(
    i18next.t('quests:requirements.professionLevel', { profession: professionName(req.professionId) }),
    professionLevel.progress(req, ctx),
  ),
}

const reputation: RequirementHandler<ReputationRequirement> = {
  progress: (req, ctx) => ({ current: ctx.reputation(req.reputationId), target: REPUTATION_THRESHOLDS[req.tier] }),
  rows: (req, ctx) => row(reputationTierLabel(req.reputationId, req.tier), reputation.progress(req, ctx)),
}

/** Every requirement type in one place: a new type fails to compile until it has an entry. */
const REQUIREMENT_HANDLERS: { [T in RequirementProps['type']]: RequirementHandler<Extract<RequirementProps, { type: T }>> } = {
  item, pickedItems, enemy, wave, stat, quest, professionLevel, reputation,
}

const handlerOf = <R extends RequirementProps>(req: R) => REQUIREMENT_HANDLERS[req.type] as unknown as RequirementHandler<R>

export const requirementProgress = (req: RequirementProps, ctx: RequirementContext): Progress => handlerOf(req).progress(req, ctx)

export const requirementRows = (req: RequirementProps, ctx: RequirementContext): RequirementRow[] => handlerOf(req).rows(req, ctx)

export function killBaseline(requirements: RequirementProps[], lifetime: LifetimeKills): KillBaseline {
  const baseline: KillBaseline = { enemies: {}, waves: {} }
  for (const req of requirements) handlerOf(req).baseline?.(req, lifetime, baseline)
  return baseline
}

export const consumedItems = (requirements: RequirementProps[], picks: OrderState['requirements']): ItemStack[] =>
  requirements.flatMap(req => handlerOf(req).consumed?.(req, picks) ?? [])
