#!/usr/bin/env node
// Static checks over game data, i18n, assets and doc references.
// Bundles the TS data modules with esbuild, imports the bundle, and prints
// one `file: problem` line per finding. Errors exit 1; warnings only print.
//
// Checks, in order (search for `// N.` to jump to one; add a new check as the next number):
//   1. Enum <-> data coverage: every enum id has data and every data key is an enum id
//   2. Cross-entity references: ids inside data point at existing entities
//   3. Dialogue graphs: node links resolve, no unreachable nodes
//   4. i18n: keys used by data and templates exist in src/assets/locales/en
//   5. Asset URLs: image paths in data exist
//   6. Doc references: backticked paths in agent-facing docs exist
//   7. Version and changelog format
//   8. Component styles and templates: no inline <svg>, no unused BEM classes
//   9. Codex skills mirror .claude/skills
//  10. Agent and skill frontmatter parses (description quoting)
//  11. docs/ideas/README.md statuses match each idea file's Status line
//  12. Docs: relative .md links resolve; lore, character and system docs name real IDs
//  13. NPC voice: lines stay in the world, no repeated phrases, no "Then…" narration
//  14. Quest hubs: per quest, turn-in before in progress before offer; a turn-in sits with the step's turnInNpc
//
// Usage: npm run validate

import { build } from 'esbuild'
import { existsSync, mkdirSync, readFileSync, readdirSync, statSync } from 'node:fs'
import { dirname, join, relative, resolve } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { changelogSections, compareVersions, NOTE_RE, NOTE_TYPES, parseVersion } from './release.mjs'
import { staleCodexSkills } from './sync-skills.mjs'

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const SRC = join(ROOT, 'src')
const LOCALES = join(SRC, 'assets', 'locales', 'en')

const errors = []
const warnings = []
const error = (file, msg) => errors.push(`${file}: ${msg}`)
const warn = (file, msg) => warnings.push(`${file}: ${msg}`)

// ---------------------------------------------------------------------------
// Bundle data modules

const ENTRY = `
export { ItemID } from 'enums/ids/item-id.enum'
export { EnemyID } from 'enums/ids/enemy-id.enum'
export { ZoneID } from 'enums/ids/zone-id.enum'
export { QuestID } from 'enums/ids/quest-id.enum'
export { RecipeID } from 'enums/ids/recipe-id.enum'
export { ShopID } from 'enums/ids/shop-id.enum'
export { SpellID } from 'enums/ids/spell-id.enum'
export { StationID } from 'enums/ids/station-id.enum'
export { SkillNodeID } from 'enums/ids/skill-node-id.enum'
export { SkillBranch } from 'enums/ids/skill-branch.enum'
export { SkillNodeType } from 'enums/skill-node-type.enum'
export { NpcID } from 'enums/map/npc-id.enum'
export { TownID } from 'enums/map/town-id.enum'
export { ReputationID } from 'enums/reputation-id.enum'
export { ProfessionID } from 'enums/ids/profession-id.enum'
export { QuestState } from 'enums/quest-state.enum'
export { default as PROFESSIONS_DATA } from 'data/professions-data'
export { FARM_SEEDS } from 'data/farming-data'
export { initialFarm, BASE_PLOTS, PLOT_REPUTATION_TIERS, PLOT_GRANT_QUESTS } from 'app/store/player/farm'
export { TownBuildingID } from 'enums/map/town-building-id.enum'
export { DamageElement } from 'enums/damage-element.enum'
export { ItemTier } from 'enums/items/item-tier.enum'
export { ItemType } from 'enums/items/item-type.enum'
export { default as ITEM_DATA } from 'data/items-data'
export { default as ENEMIES_DATA } from 'data/enemies-data'
export { default as ZONES_DATA } from 'data/zones-data'
export { default as QUEST_DATA } from 'data/quests-data'
export { default as RECIPES_DATA } from 'data/recipes-data'
export { default as SHOPS_DATA } from 'data/shops-data'
export { default as SPELLS_DATA } from 'data/spells-data'
export { default as STATIONS_DATA } from 'data/stations-data'
export { default as NPC_DATA } from 'data/npc-data'
export { default as TOWNS_DATA } from 'data/towns-data'
export { SITES_DATA } from 'data/sites-data'
export { ALL_SKILLS } from 'data/skill-tree-data'
export { UNLOCK_RULES, ZONE_UNLOCK_NOTIFICATIONS } from 'data/unlock-conditions'
export { WORLD_MAP_DATA } from 'data/world-map-data'
export { sellPrice } from 'app/store/shop/shop-prices'
export { REPUTATION_IDS, REPUTATION_TOWN } from 'app/store/player/reputation'
export { REPUTATION_TURN_INS } from 'data/reputation-turn-ins'
export { bundleKey } from 'app/store/quests/turn-in-cooldown'
export { TitleID } from 'enums/ids/title-id.enum'
export { CHANGELOG_NOTE_TYPES } from 'app/components/modals/changelog/changelog'
`

const outDir = join(ROOT, 'node_modules', '.cache', 'validate-data')
mkdirSync(outDir, { recursive: true })
const outFile = join(outDir, 'bundle.mjs')
await build({
  stdin: { contents: ENTRY, resolveDir: SRC, loader: 'ts' },
  bundle: true,
  format: 'esm',
  platform: 'node',
  tsconfig: join(ROOT, 'tsconfig.json'),
  outfile: outFile,
  logLevel: 'error',
})
const D = await import(pathToFileURL(outFile).href + `?t=${Date.now()}`)

const enumKeys = e => Object.keys(e).filter(k => isNaN(Number(k)))
const enumValues = e => enumKeys(e).map(k => e[k])
const idName = (e, v) => e[v] ?? `#${v}`

// ---------------------------------------------------------------------------
// 1. Enum <-> data coverage

const COVERAGE = [
  ['ItemID', D.ItemID, D.ITEM_DATA, 'src/data/items-data.ts', 'id'],
  ['EnemyID', D.EnemyID, D.ENEMIES_DATA, 'src/data/enemies-data.ts', 'id'],
  ['ZoneID', D.ZoneID, D.ZONES_DATA, 'src/data/zones-data.ts', 'id'],
  ['QuestID', D.QuestID, D.QUEST_DATA, 'src/data/quests-data.ts', 'questId'],
  ['RecipeID', D.RecipeID, D.RECIPES_DATA, 'src/data/recipes-data.ts', 'id'],
  ['ShopID', D.ShopID, D.SHOPS_DATA, 'src/data/shops-data.ts', 'id'],
  ['SpellID', D.SpellID, D.SPELLS_DATA, 'src/data/spells-data.ts', 'id'],
  ['StationID', D.StationID, D.STATIONS_DATA, 'src/data/stations-data.ts', 'id'],
  ['SkillNodeID', D.SkillNodeID, D.ALL_SKILLS, 'src/data/skill-tree-data.ts', 'id'],
  ['NpcID', D.NpcID, D.NPC_DATA, 'src/data/npc-data.ts', 'id'],
  ['TownID', D.TownID, D.TOWNS_DATA, 'src/data/towns-data.ts', 'id'],
  ['ProfessionID', D.ProfessionID, D.PROFESSIONS_DATA, 'src/data/professions-data.ts', 'id'],
]

for (const [name, e, data, file, idField] of COVERAGE) {
  const values = enumValues(e)
  const seen = new Set()
  for (const v of values) {
    if (seen.has(v)) error(file, `${name} value ${v} used by more than one key`)
    seen.add(v)
    const entry = data[v]
    if (!entry) { error(file, `${name}.${idName(e, v)} has no data entry`); continue }
    if (entry[idField] !== v) error(file, `${name}.${idName(e, v)} entry has ${idField}=${entry[idField]}, expected ${v}`)
  }
  for (const k of Object.keys(data)) {
    if (!seen.has(Number(k))) error(file, `data key ${k} is not a ${name} value`)
  }
}

// ---------------------------------------------------------------------------
// 2. Cross-entity references

const has = (data, id) => id !== undefined && data[id] !== undefined
const REPUTATION_ID_KEYS = Object.fromEntries(enumValues(D.ReputationID).map(v => [v, true]))
const REF_KEYS = {
  itemId: ['ItemID', D.ITEM_DATA],
  enemyId: ['EnemyID', D.ENEMIES_DATA],
  bossEnemyId: ['EnemyID', D.ENEMIES_DATA],
  questId: ['QuestID', D.QUEST_DATA],
  questRequirement: ['QuestID', D.QUEST_DATA],
  requiredActiveQuestId: ['QuestID', D.QUEST_DATA],
  zoneId: ['ZoneID', D.ZONES_DATA],
  nextZoneId: ['ZoneID', D.ZONES_DATA],
  previousZoneId: ['ZoneID', D.ZONES_DATA],
  shopId: ['ShopID', D.SHOPS_DATA],
  recipeId: ['RecipeID', D.RECIPES_DATA],
  stationId: ['StationID', D.STATIONS_DATA],
  spellId: ['SpellID', D.SPELLS_DATA],
  townId: ['TownID', D.TOWNS_DATA],
  reputationId: ['ReputationID', REPUTATION_ID_KEYS],
  professionId: ['ProfessionID', D.PROFESSIONS_DATA],
}

// Walks any data structure and checks every field whose name implies a reference.
function walkRefs(node, file, path) {
  if (Array.isArray(node)) { node.forEach((n, i) => walkRefs(n, file, `${path}[${i}]`)); return }
  if (!node || typeof node !== 'object') return
  for (const [k, v] of Object.entries(node)) {
    const ref = REF_KEYS[k]
    if (ref && typeof v === 'number' && !has(ref[1], v)) error(file, `${path}.${k} = ${v} is not a known ${ref[0]}`)
    if (k === 'itemIds' && Array.isArray(v)) {
      v.forEach(id => { if (!has(D.ITEM_DATA, id)) error(file, `${path}.itemIds has unknown ItemID ${id}`) })
    }
    if (typeof v === 'object' && k !== 'dialogue') walkRefs(v, file, `${path}.${k}`)
  }
}

walkRefs(D.ITEM_DATA, 'src/data/items', 'ITEM_DATA')
walkRefs(D.ENEMIES_DATA, 'src/data/enemies-data.ts', 'ENEMIES_DATA')
walkRefs(D.ZONES_DATA, 'src/data/zones-data.ts', 'ZONES_DATA')
walkRefs(D.QUEST_DATA, 'src/data/quests-data.ts', 'QUEST_DATA')
walkRefs(D.RECIPES_DATA, 'src/data/recipes-data.ts', 'RECIPES_DATA')
walkRefs(D.SHOPS_DATA, 'src/data/shops-data.ts', 'SHOPS_DATA')
walkRefs(D.SPELLS_DATA, 'src/data/spells-data.ts', 'SPELLS_DATA')
walkRefs(D.ALL_SKILLS, 'src/data/skill-tree-data.ts', 'ALL_SKILLS')
walkRefs(D.TOWNS_DATA, 'src/data/towns-data.ts', 'TOWNS_DATA')
walkRefs(D.UNLOCK_RULES, 'src/data/unlock-conditions.ts', 'UNLOCK_RULES')
walkRefs(D.WORLD_MAP_DATA, 'src/data/world-map-data.ts', 'WORLD_MAP_DATA')
for (const npc of Object.values(D.NPC_DATA)) {
  walkRefs(npc.dialogue, 'src/data/dialogues', `${idName(D.NpcID, npc.id)}.dialogue`)
}

// Reference fields named `id` (meaning depends on context).
for (const enemy of Object.values(D.ENEMIES_DATA)) {
  for (const drop of [...enemy.drops, ...(enemy.shinyDrops ?? [])]) {
    if (!has(D.ITEM_DATA, drop.id)) error('src/data/enemies-data.ts', `${idName(D.EnemyID, enemy.id)} drops unknown ItemID ${drop.id}`)
  }
}
for (const zone of Object.values(D.ZONES_DATA)) {
  for (const id of zone.enemies) {
    if (!has(D.ENEMIES_DATA, id)) error('src/data/zones-data.ts', `${idName(D.ZoneID, zone.id)} has unknown EnemyID ${id}`)
  }
  if (zone.enemies.includes(zone.bossEnemyId)) {
    warn('src/data/zones-data.ts', `${idName(D.ZoneID, zone.id)} lists its boss ${idName(D.EnemyID, zone.bossEnemyId)} as a regular enemy`)
  }
}
// Economy: no buy-sell profit at any pair of shops, and kinds that must never be sold stay at value <= 0.
const shops = Object.values(D.SHOPS_DATA)
for (const shop of shops) {
  if ((shop.currency ?? 'gold') !== 'gold') continue
  for (const entry of shop.items) {
    for (const buyer of shops) {
      const price = D.sellPrice(buyer.id, entry.itemId)
      if (price >= entry.price) {
        error('src/data/shops-data.ts', `${idName(D.ShopID, shop.id)} sells ${idName(D.ItemID, entry.itemId)} for ${entry.price}g but ${idName(D.ShopID, buyer.id)} buys it for ${price}g`)
      }
    }
  }
}
const UNSELLABLE_TYPES = new Set([D.ItemType.book, D.ItemType.stationUpgrade, D.ItemType.quest, D.ItemType.chest, D.ItemType.seed])
for (const item of Object.values(D.ITEM_DATA)) {
  const name = idName(D.ItemID, item.id)
  if (item.value > 0 && UNSELLABLE_TYPES.has(item.type)) {
    error('src/data/items', `${name} must be unsellable (value <= 0)`)
  }
}

// Unique gear: quest rewards and equipment whose only acquisition source is a chest.
const questGear = new Set(Object.values(D.QUEST_DATA).flatMap(quest => quest.rewards
  .filter(reward => reward.type === 'item').map(reward => reward.itemId)))
const outsideChests = new Set([
  ...questGear,
  ...shops.flatMap(shop => shop.items.map(item => item.itemId)),
  ...Object.values(D.ENEMIES_DATA).flatMap(enemy => [...enemy.drops, ...(enemy.shinyDrops ?? [])].map(drop => drop.id)),
  ...Object.values(D.RECIPES_DATA).map(recipe => recipe.itemId),
  ...Object.values(D.ZONES_DATA).flatMap(zone => zone.masteryReward.items.map(item => item.id)),
])
for (const npc of Object.values(D.NPC_DATA)) {
  for (const node of Object.values(npc.dialogue)) {
    const effects = (node.options ?? []).flatMap(option => (option.results ?? []).flatMap(result => result.effects ?? []))
    for (const effect of effects) if (effect.type === 'item' && effect.action === 'give') for (const item of effect.items) outsideChests.add(item.itemId)
  }
}
const chestOnly = new Set(Object.values(D.ITEM_DATA).filter(item => item.type === D.ItemType.chest)
  .flatMap(chest => chest.loot.filter(entry => 'itemId' in entry && !outsideChests.has(entry.itemId)).map(entry => entry.itemId)))
for (const item of Object.values(D.ITEM_DATA)) {
  if (item.type !== D.ItemType.equipment || item.unique) continue
  if (questGear.has(item.id) || chestOnly.has(item.id)) {
    warn('src/data/items', `${idName(D.ItemID, item.id)} is quest-reward or chest-only equipment; add unique: true`)
  }
}

for (const recipe of Object.values(D.RECIPES_DATA)) {
  for (const cost of recipe.itemsNeeded) {
    if (!has(D.ITEM_DATA, cost.id)) error('src/data/recipes-data.ts', `${idName(D.RecipeID, recipe.id)} needs unknown ItemID ${cost.id}`)
  }
  // Crafted gear must not sell for much more than its materials, or crafting turns drops and shop runes into gold.
  const item = D.ITEM_DATA[recipe.itemId]
  const materials = recipe.itemsNeeded.reduce((sum, cost) => sum + Math.max(0, D.ITEM_DATA[cost.id]?.value ?? 0) * cost.amount, 0)
  if (item?.type === D.ItemType.equipment && item.value * recipe.createsAmount > 2 * materials) {
    error('src/data/items', `${idName(D.ItemID, item.id)} sells for ${item.value * recipe.createsAmount}g per craft but its recipe's materials are worth ${materials}g (max 2×)`)
  }
  const station = D.STATIONS_DATA[recipe.stationId]
  if (station && recipe.stationLevel > station.maxLevel) {
    error('src/data/recipes-data.ts', `${idName(D.RecipeID, recipe.id)} needs ${idName(D.StationID, recipe.stationId)} level ${recipe.stationLevel} > maxLevel ${station.maxLevel}`)
  }
}
// Seeds live in the farming state, never in the inventory: each maps to a crop, and nothing may require holding one.
const seedItems = Object.values(D.ITEM_DATA).filter(item => item.type === D.ItemType.seed)
for (const item of seedItems) {
  const farmSeed = D.FARM_SEEDS[item.id]
  if (!farmSeed) error('src/data/farming-data.ts', `seed ${idName(D.ItemID, item.id)} has no FARM_SEEDS entry`)
  else if (D.ITEM_DATA[farmSeed.cropId]?.type === D.ItemType.seed || !has(D.ITEM_DATA, farmSeed.cropId)) error('src/data/farming-data.ts', `${idName(D.ItemID, item.id)} maps to a crop that is not an item or is a seed`)
}
for (const id of Object.keys(D.FARM_SEEDS)) {
  if (D.ITEM_DATA[id]?.type !== D.ItemType.seed) error('src/data/farming-data.ts', `FARM_SEEDS key ${idName(D.ItemID, Number(id))} is not a seed item`)
}
const isSeedId = id => D.ITEM_DATA[id]?.type === D.ItemType.seed
for (const recipe of Object.values(D.RECIPES_DATA)) {
  for (const cost of recipe.itemsNeeded) if (isSeedId(cost.id)) error('src/data/recipes-data.ts', `${idName(D.RecipeID, recipe.id)} needs seed ${idName(D.ItemID, cost.id)}; seeds are not in the inventory`)
}
for (const quest of Object.values(D.QUEST_DATA)) {
  for (const step of quest.steps) {
    for (const req of step.requirements ?? []) if (req.type === 'item' && isSeedId(req.itemId)) error('src/data/quests-data.ts', `${idName(D.QuestID, quest.questId)} has an item step that needs seed ${idName(D.ItemID, req.itemId)}; seeds are not in the inventory`)
  }
}
if (D.BASE_PLOTS + D.PLOT_REPUTATION_TIERS + D.PLOT_GRANT_QUESTS > D.initialFarm.plots.length) {
  error('src/app/store/player/farm.ts', `the plot count can reach ${D.BASE_PLOTS + D.PLOT_REPUTATION_TIERS + D.PLOT_GRANT_QUESTS}, more than the ${D.initialFarm.plots.length} plot slots`)
}

for (const town of Object.values(D.TOWNS_DATA)) {
  for (const b of town.buildings) {
    if (!enumValues(D.TownBuildingID).includes(b.buildingId)) error('src/data/towns-data.ts', `${idName(D.TownID, town.id)} has unknown TownBuildingID ${b.buildingId}`)
    // Entrance zones unlock when the building's quest starts (ENTRANCE_ZONES_BY_QUEST).
    if (b.zoneId !== undefined && b.questRequirement === undefined) {
      error('src/data/towns-data.ts', `${idName(D.TownID, town.id)}.${idName(D.TownBuildingID, b.buildingId)} is a zone entrance without questRequirement, so its zone never unlocks`)
    }
    for (const npc of b.npcs) {
      if (!has(D.NPC_DATA, npc.id)) error('src/data/towns-data.ts', `${idName(D.TownID, town.id)}.${idName(D.TownBuildingID, b.buildingId)} has unknown NpcID ${npc.id}`)
    }
  }
}
// A step's turnInNpc backs the quest panel's "Talk to" link: the NPC must stand in a town
// or on a Site and their dialogue must start, advance or end that quest.
const placedNpcs = new Set([
  ...Object.values(D.TOWNS_DATA).flatMap(t => t.buildings.flatMap(b => b.npcs.map(n => n.id))),
  ...Object.values(D.SITES_DATA).flatMap(site => site.npcs.map(n => n.id)),
])
const questsInDialogue = npcId => new Set(Object.values(D.NPC_DATA[npcId]?.dialogue ?? {})
  .flatMap(node => node.options ?? [])
  .flatMap(option => option.results ?? [])
  .flatMap(result => result.effects ?? [])
  .filter(effect => effect.type === 'quest')
  .map(effect => effect.questId))
for (const quest of Object.values(D.QUEST_DATA)) {
  quest.steps.forEach((step, i) => {
    const where = `${idName(D.QuestID, quest.questId)} step ${i + 1}`
    const npc = idName(D.NpcID, step.turnInNpc)
    if (!has(D.NPC_DATA, step.turnInNpc)) error('src/data/quests-data.ts', `${where} has unknown turnInNpc ${step.turnInNpc}`)
    else if (!placedNpcs.has(step.turnInNpc)) error('src/data/quests-data.ts', `${where}: turnInNpc ${npc} isn't in any town building or Site`)
    else if (!questsInDialogue(step.turnInNpc).has(quest.questId)) error('src/data/quests-data.ts', `${where}: turnInNpc ${npc}'s dialogue never starts, advances or ends this quest`)
  })
  for (const reward of quest.rewards.filter(r => r.type === 'reputation')) {
    if (!D.REPUTATION_IDS.includes(reward.reputationId)) error('src/data/quests-data.ts', `${idName(D.QuestID, quest.questId)} gives reputation in ${idName(D.ReputationID, reward.reputationId)}, which isn't in REPUTATION_IDS`)
    if (!(reward.amount > 0)) error('src/data/quests-data.ts', `${idName(D.QuestID, quest.questId)} gives ${reward.amount} reputation; it must be positive`)
  }
}

// A reputation turn-in giver stands in the town they credit, and their dialogue uses the turn-in.
const townOfNpc = npcId => Object.values(D.TOWNS_DATA).find(t => t.buildings.some(b => b.npcs.some(n => n.id === npcId)))?.id
const effectsOf = npcId => Object.values(D.NPC_DATA[npcId]?.dialogue ?? {})
  .flatMap(node => node.options ?? []).flatMap(option => option.results ?? []).flatMap(result => result.effects ?? [])
for (const turnIn of D.REPUTATION_TURN_INS) {
  const npc = idName(D.NpcID, turnIn.npcId)
  const file = 'src/data/reputation-turn-ins.ts'
  if (!D.REPUTATION_IDS.includes(turnIn.reputationId)) error(file, `${npc}'s turn-in credits ${idName(D.ReputationID, turnIn.reputationId)}, which isn't in REPUTATION_IDS`)
  if (townOfNpc(turnIn.npcId) !== D.REPUTATION_TOWN[turnIn.reputationId]) error(file, `${npc}'s turn-in credits ${idName(D.ReputationID, turnIn.reputationId)}, but ${npc} doesn't stand there`)
  if (!has(D.ITEM_DATA, turnIn.itemId)) error(file, `${npc}'s turn-in has unknown ItemID ${turnIn.itemId}`)
  if (!(turnIn.bundleSize > 0 && turnIn.reputation > 0)) error(file, `${npc}'s turn-in needs a positive bundleSize and reputation`)
  if (!effectsOf(turnIn.npcId).some(e => e.type === 'reputationTurnIn')) error(file, `${npc}'s dialogue never uses their turn-in`)
  const cooldownKeys = Object.values(D.NPC_DATA[turnIn.npcId]?.dialogue ?? {})
    .flatMap(node => node.options ?? []).flatMap(option => option.results ?? []).flatMap(result => result.requirementsNeeded ?? [])
    .filter(c => c.type === 'turnInCooldown').map(c => c.key)
  if (!cooldownKeys.includes(D.bundleKey(turnIn.npcId, turnIn.itemId))) error(file, `${npc}'s turn-in option has no turnInCooldown requirement for its bundle key`)
}
for (const npc of Object.values(D.NPC_DATA)) {
  for (const effect of effectsOf(npc.id).filter(e => e.type === 'reputationTurnIn')) {
    if (effect.npcId !== npc.id) error(`src/data/dialogues (${idName(D.NpcID, npc.id)})`, `turn-in effect names ${idName(D.NpcID, effect.npcId)}, not this NPC`)
    if (!D.REPUTATION_TURN_INS.some(t => t.npcId === effect.npcId)) error(`src/data/dialogues (${idName(D.NpcID, npc.id)})`, 'turn-in effect has no REPUTATION_TURN_INS entry')
  }
}
for (const skill of Object.values(D.ALL_SKILLS)) {
  const reqs = []
  const collect = r => { if (!r) return; if (r.kind === 'node') reqs.push(r.id); else r.of.forEach(collect) }
  collect(skill.requires)
  for (const id of reqs) {
    if (!has(D.ALL_SKILLS, id)) error('src/data/skill-tree-data.ts', `${idName(D.SkillNodeID, skill.id)} requires unknown node ${id}`)
  }
  if (skill.anchor !== undefined && (!has(D.ALL_SKILLS, skill.anchor) || skill.anchor === skill.id)) {
    error('src/data/skill-tree-data.ts', `${idName(D.SkillNodeID, skill.id)} has anchor ${skill.anchor}, which isn't another node`)
  }
}
// Owner rule: a spell comes from exactly one source (a skill node, a spell scroll or a piece of gear), so a respec,
// a refund or taking gear off never has to guess which source a known spell came from.
const spellSources = new Map()
const addSpellSource = (spellId, source) => spellSources.set(spellId, [...(spellSources.get(spellId) ?? []), source])
for (const skill of Object.values(D.ALL_SKILLS)) {
  if (skill.type === D.SkillNodeType.spell) addSpellSource(skill.spellId, `skill node ${idName(D.SkillNodeID, skill.id)}`)
}
for (const item of Object.values(D.ITEM_DATA)) {
  if (item.type === D.ItemType.spellScroll) addSpellSource(item.spellId, `spell scroll ${idName(D.ItemID, item.id)}`)
  if (item.type === D.ItemType.equipment && item.spell !== undefined) addSpellSource(item.spell, `gear ${idName(D.ItemID, item.id)}`)
}
for (const [spellId, sources] of spellSources) {
  if (sources.length > 1) error('src/data/spells-data.ts', `${idName(D.SpellID, spellId)} has more than one source (${sources.join(', ')}); a spell may come from only one`)
}

// A spell perk is a battle node read only through SpellProps.perk; a stat or spell node would also apply its own effect.
for (const spell of Object.values(D.SPELLS_DATA)) {
  if (!spell.perk) continue
  const where = `${idName(D.SpellID, spell.id)} perk`
  const node = D.ALL_SKILLS[spell.perk.nodeId]
  if (!node) error('src/data/spells-data.ts', `${where} points at unknown node ${spell.perk.nodeId}`)
  else if (node.type !== D.SkillNodeType.battle) error('src/data/spells-data.ts', `${where}: node ${idName(D.SkillNodeID, node.id)} must be a battle node`)
  if (!spell.perk.cooldownPerLevel && !spell.perk.manaPerLevel) error('src/data/spells-data.ts', `${where} has neither cooldownPerLevel nor manaPerLevel`)
}

// ---------------------------------------------------------------------------
// 3. Dialogue graphs

for (const npc of Object.values(D.NPC_DATA)) {
  const name = idName(D.NpcID, npc.id)
  const file = `src/data/dialogues (${name})`
  const nodes = npc.dialogue
  const ids = new Set(Object.keys(nodes).map(Number))
  const starts = [npc.startNodeId ?? 0]
  if (npc.firstMeetNodeId !== undefined) starts.push(npc.firstMeetNodeId)
  for (const s of starts) if (!ids.has(s)) error(file, `start node ${s} does not exist`)

  const edges = new Map()
  for (const [key, node] of Object.entries(nodes)) {
    if (node.id !== Number(key)) error(file, `node key ${key} has id ${node.id}`)
    const targets = []
    if (!Array.isArray(node.options)) { error(file, `node ${key} has no options array`); continue }
    node.options.forEach((opt, i) => {
      if (!opt.results?.length) error(file, `node ${key} option ${i} has no results`)
      for (const r of opt.results ?? []) {
        if (r.next === undefined) { if (!r.closeDialogue) warn(file, `node ${key} option ${i} result has neither next nor closeDialogue`); continue }
        if (!ids.has(r.next)) error(file, `node ${key} option ${i} -> next ${r.next} does not exist`)
        targets.push(r.next)
      }
    })
    edges.set(Number(key), targets)
  }
  const reached = new Set()
  const queue = starts.filter(s => ids.has(s))
  while (queue.length) {
    const n = queue.pop()
    if (reached.has(n)) continue
    reached.add(n)
    queue.push(...(edges.get(n) ?? []))
  }
  for (const id of ids) if (!reached.has(id)) warn(file, `node ${id} is unreachable from start nodes`)
}

// ---------------------------------------------------------------------------
// 4. i18n

const walkFiles = (dir, ext) => readdirSync(dir).flatMap(f => {
  const p = join(dir, f)
  return statSync(p).isDirectory() ? walkFiles(p, ext) : p.endsWith(ext) ? [p] : []
})

const namespaces = new Map()
for (const f of walkFiles(LOCALES, '.json')) {
  const ns = relative(LOCALES, f).replace(/\\/g, '/').replace(/\.json$/, '')
  try { namespaces.set(ns, JSON.parse(readFileSync(f, 'utf8'))) } catch (e) { error(relative(ROOT, f), `invalid JSON: ${e.message}`) }
}

const appConfig = readFileSync(join(SRC, 'app', 'app.config.ts'), 'utf8')
const translationsBlock = appConfig.match(/const translations = \[([\s\S]*?)\]/)?.[1] ?? ''
const registered = new Set([...translationsBlock.matchAll(/'([^']+)'/g)].map(m => m[1]))
for (const ns of namespaces.keys()) {
  if (!registered.has(ns)) error('src/app/app.config.ts', `namespace '${ns}' has a locale file but is not registered in translations`)
}
for (const ns of registered) {
  if (!namespaces.has(ns)) error('src/app/app.config.ts', `namespace '${ns}' is registered but has no locale file`)
}

const lookup = (fullKey) => {
  const [ns, key] = fullKey.split(':')
  let node = namespaces.get(ns)
  if (node === undefined) return undefined
  for (const part of key.split('.')) {
    if (node === null || typeof node !== 'object') return undefined
    node = node[part]
  }
  return node
}
const requireKey = (file, key) => { if (typeof lookup(key) !== 'string') error(file, `missing i18n key '${key}'`) }

// Literal keys anywhere in data.
const KEY_RE = /^([\w/-]+):([\w.-]+)$/
function walkKeys(node, file) {
  if (typeof node === 'string') {
    const m = node.match(KEY_RE)
    if (m && namespaces.has(m[1])) requireKey(file, node)
    else if (m && /^[a-z]/i.test(m[1]) && m[1] !== 'order') // a TurnInKey, not an i18n key error(file, `i18n key '${node}' uses unknown namespace '${m[1]}'`)
    return
  }
  if (Array.isArray(node)) { node.forEach(n => walkKeys(n, file)); return }
  if (node && typeof node === 'object') Object.values(node).forEach(v => walkKeys(v, file))
}
walkKeys(D.SHOPS_DATA, 'src/data/shops-data.ts')
walkKeys(D.UNLOCK_RULES, 'src/data/unlock-conditions.ts')
walkKeys(D.ZONE_UNLOCK_NOTIFICATIONS, 'src/data/unlock-conditions.ts')
walkKeys(D.WORLD_MAP_DATA, 'src/data/world-map-data.ts')
for (const npc of Object.values(D.NPC_DATA)) walkKeys(npc.dialogue, `src/data/dialogues (${idName(D.NpcID, npc.id)})`)

// Keys the UI builds from entity enum names.
const ENTITY_KEYS = [
  [D.ItemID, k => [`items:names.${k}`], 'src/assets/locales/en/items.json'],
  [D.EnemyID, k => [`enemies:names.${k}`], 'src/assets/locales/en/enemies.json'],
  [D.ZoneID, k => [`zones:names.${k}`], 'src/assets/locales/en/zones.json'],
  [D.QuestID, k => [`quests:names.${k}`], 'src/assets/locales/en/quests.json'],
  [D.NpcID, k => [`npc:names.${k}`], 'src/assets/locales/en/npc.json'],
  [D.SpellID, k => [`spells:names.${k}.name`, `spells:names.${k}.desc`], 'src/assets/locales/en/spells.json'],
  [D.SkillBranch, k => [`skill-tree:branches.${k}`], 'src/assets/locales/en/skill-tree.json'],
  [D.SkillNodeID, k => [`skill-tree:nodes.${k}.name`, `skill-tree:nodes.${k}.desc`], 'src/assets/locales/en/skill-tree.json'],
  [D.TownID, k => [`map:towns.${k}`], 'src/assets/locales/en/map.json'],
  [D.ReputationID, k => [`map:reputations.${k}`], 'src/assets/locales/en/map.json'],
  [D.TownBuildingID, k => [`map:buildings.${k}`], 'src/assets/locales/en/map.json'],
  [D.ProfessionID, k => [`app:professions.${k}`], 'src/assets/locales/en/app.json'],
  [D.TitleID, k => [`app:titles.${k}`], 'src/assets/locales/en/app.json'],
  [D.DamageElement, k => [`app:elements.${k}`], 'src/assets/locales/en/app.json'],
  [D.ItemTier, k => [`items:tiers.${k}`], 'src/assets/locales/en/items.json'],
]
for (const [e, keysFor, file] of ENTITY_KEYS) {
  for (const k of enumKeys(e)) keysFor(k).forEach(key => requireKey(file, key))
}
for (const station of Object.values(D.STATIONS_DATA)) {
  const k = idName(D.StationID, station.id)
  requireKey('src/assets/locales/en/camp.json', `camp:stations.${k}.name`)
  for (let lvl = 1; lvl <= station.maxLevel; lvl++) requireKey('src/assets/locales/en/camp.json', `camp:stations.${k}.levels.${lvl}`)
}
for (const item of Object.values(D.ITEM_DATA)) {
  if (item.stationId !== undefined) {
    const k = idName(D.ItemID, item.id)
    requireKey('src/assets/locales/en/unlocks.json', `unlocks:stations.${k}.title`)
    requireKey('src/assets/locales/en/unlocks.json', `unlocks:stations.${k}.body`)
  }
}

// Every PlayerStat needs a label.
const statSource = readFileSync(join(SRC, 'types', 'player', 'player-stat.type.ts'), 'utf8')
for (const stat of new Set([...statSource.matchAll(/'(\w+)'/g)].map(m => m[1]))) requireKey('src/assets/locales/en/app.json', `app:playerStats.${stat}`)

// ---------------------------------------------------------------------------
// 5. Asset URLs

const checkedUrls = new Set()
function checkUrl(url, file, where) {
  if (checkedUrls.has(url)) return
  checkedUrls.add(url)
  const p = join(SRC, url.replace(/^\.?\//, ''))
  if (!existsSync(p)) error(file, `${where}: asset '${url}' does not exist`)
}
function walkUrls(node, file, path) {
  if (typeof node === 'string') { if (/^\.?\/?assets\//.test(node)) checkUrl(node, file, path); return }
  if (Array.isArray(node)) { node.forEach((n, i) => walkUrls(n, file, `${path}[${i}]`)); return }
  if (node && typeof node === 'object') {
    for (const [k, v] of Object.entries(node)) {
      if (k === 'url' && v === '') error(file, `${path}.url is empty`)
      if (k !== 'dialogue') walkUrls(v, file, `${path}.${k}`)
    }
  }
}
walkUrls(D.ITEM_DATA, 'src/data/items', 'ITEM_DATA')
walkUrls(D.ENEMIES_DATA, 'src/data/enemies-data.ts', 'ENEMIES_DATA')
walkUrls(D.ZONES_DATA, 'src/data/zones-data.ts', 'ZONES_DATA')
walkUrls(D.SPELLS_DATA, 'src/data/spells-data.ts', 'SPELLS_DATA')
walkUrls(D.ALL_SKILLS, 'src/data/skill-tree-data.ts', 'ALL_SKILLS')
walkUrls(D.NPC_DATA, 'src/data/npc-data.ts', 'NPC_DATA')
walkUrls(D.TOWNS_DATA, 'src/data/towns-data.ts', 'TOWNS_DATA')
walkUrls(D.WORLD_MAP_DATA, 'src/data/world-map-data.ts', 'WORLD_MAP_DATA')
for (const enemy of Object.values(D.ENEMIES_DATA)) {
  if (enemy.shinyDrops?.length) checkUrl(enemy.url.replace(/\.png$/i, '-shiny.png'), 'src/data/enemies-data.ts', `${idName(D.EnemyID, enemy.id)} shiny sprite`)
}

// Literal asset paths in components and services.
for (const f of [...walkFiles(join(SRC, 'app'), '.ts'), ...walkFiles(join(SRC, 'app'), '.html')]) {
  for (const [, url] of readFileSync(f, 'utf8').matchAll(/['"`](\.?\/?assets\/[^'"`$]+\.(?:png|svg|jpg|webp))['"`]/g)) {
    checkUrl(url, relative(ROOT, f).replace(/\\/g, '/'), 'literal')
  }
}

// ---------------------------------------------------------------------------
// 6. Doc references: backticked paths in agent-facing docs must exist.

const DOC_FILES = [
  join(ROOT, 'AGENTS.md'),
  join(ROOT, 'CLAUDE.md'),
  join(ROOT, 'CODING_STANDARDS.md'),
  join(ROOT, 'docs', 'git-workflow.md'),
  ...(existsSync(join(ROOT, 'docs', 'systems')) ? walkFiles(join(ROOT, 'docs', 'systems'), '.md') : []),
  // angular-developer is a vendored generic skill; its paths describe other projects.
  ...walkFiles(join(ROOT, '.claude', 'skills'), '.md').filter(f => !/[\\/]angular-developer[\\/]/.test(f)),
  ...walkFiles(join(ROOT, '.claude', 'agents'), '.md'),
].filter(existsSync)

// worktrees: .claude/worktrees holds whole checkouts of other branches.
const IGNORED_DIRS = new Set(['node_modules', '.git', '.angular', 'dist', '.cache', 'worktrees'])
const allFiles = []
;(function collect(dir) {
  for (const f of readdirSync(dir)) {
    if (IGNORED_DIRS.has(f)) continue
    const p = join(dir, f)
    if (statSync(p).isDirectory()) collect(p)
    else allFiles.push(relative(ROOT, p).replace(/\\/g, '/'))
  }
})(ROOT)
const allDirs = new Set(allFiles.flatMap(f => f.split('/').slice(0, -1).map((_, i, a) => a.slice(0, i + 1).join('/'))))

// A file name with a known extension, or a multi-segment path rooted at a top-level repo dir.
const PATH_RE = /^[\w.][\w./-]*\.(ts|mjs|js|json|md|html|scss|png)$|^(src|docs|scripts|\.claude|public)(\/[\w.-]+)+\/?$/
/** Per-machine files docs may name; they are never in git. */
const LOCAL_ONLY_PATHS = new Set(['.claude/launch.json', '.claude/worktrees'])
function resolveDocPath(p) {
  const clean = p.replace(/\/$/, '')
  if (existsSync(join(ROOT, clean))) return join(ROOT, clean)
  if (existsSync(join(SRC, clean))) return join(SRC, clean)
  if (existsSync(join(SRC, 'app', clean))) return join(SRC, 'app', clean)
  // Bare file names and partial paths: match the end of any tracked path.
  const hit = allFiles.find(f => f === clean || f.endsWith('/' + clean))
  if (hit) return join(ROOT, hit)
  const dirHit = [...allDirs].find(d => d === clean || d.endsWith('/' + clean))
  return dirHit ? join(ROOT, dirHit) : undefined
}

for (const doc of DOC_FILES) {
  const rel = relative(ROOT, doc).replace(/\\/g, '/')
  const text = readFileSync(doc, 'utf8').replace(/```[\s\S]*?```/g, '')
  for (const [, token] of text.matchAll(/`([^`\s]+)`/g)) {
    if (/[*<>{}$]|^https?:|^\.\.?\/|^\/|^~/.test(token)) continue
    const [path, symbol] = token.split(/:(?=[A-Za-z_])/)
    if (!PATH_RE.test(path) || LOCAL_ONLY_PATHS.has(path)) continue
    const resolved = resolveDocPath(path)
    if (!resolved) { error(rel, `references missing path '${path}'`); continue }
    if (symbol && statSync(resolved).isFile()) {
      const name = symbol.split('.').pop().replace(/\(.*$/, '')
      if (!readFileSync(resolved, 'utf8').includes(name)) error(rel, `'${path}' does not contain '${symbol}'`)
    }
  }
}

// ---------------------------------------------------------------------------
// 7. Version and changelog: package.json `version` is MAJOR.MINOR.PATCH and CHANGELOG.md has its section.

{
  const { version } = JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf8'))
  if (!parseVersion(version)) error('package.json', `version '${version}' is not MAJOR.MINOR.PATCH`)

  const sections = changelogSections(readFileSync(join(ROOT, 'CHANGELOG.md'), 'utf8'))
  if (sections[0]?.version !== 'Unreleased') error('CHANGELOG.md', `first section must be '## [Unreleased]'`)
  const released = sections.filter(s => s.version && s.version !== 'Unreleased')
  if (!released.some(s => s.version === version)) error('CHANGELOG.md', `no '## [${version}] - YYYY-MM-DD' section for package.json version`)
  released.forEach((s, i) => {
    if (!parseVersion(s.version)) error('CHANGELOG.md', `'${s.version}' is not MAJOR.MINOR.PATCH`)
    else if (i > 0 && parseVersion(released[i - 1].version) && compareVersions(released[i - 1].version, s.version) <= 0)
      error('CHANGELOG.md', `${s.version} must come after ${released[i - 1].version} (newest first)`)
    if (!/^\d{4}-\d{2}-\d{2}$/.test(s.date ?? '')) error('CHANGELOG.md', `${s.version} needs a date: '## [${s.version}] - YYYY-MM-DD'`)
    if (!s.body) error('CHANGELOG.md', `${s.version} has no entries`)
  })
  // Note types live in three places: release notes labels, the game's parser, and the badge labels.
  const types = Object.keys(NOTE_TYPES)
  const sameTypes = (other) => other.length === types.length && types.every(t => other.includes(t))
  if (!sameTypes([...D.CHANGELOG_NOTE_TYPES]))
    error('src/app/components/modals/changelog/changelog.ts', `CHANGELOG_NOTE_TYPES (${D.CHANGELOG_NOTE_TYPES.join(', ')}) differ from NOTE_TYPES in scripts/release.mjs (${types.join(', ')})`)
  const badges = lookup('app:changelog.badge') ?? {}
  if (!sameTypes(Object.keys(badges))) error('src/assets/locales/en/app.json', `changelog.badge keys (${Object.keys(badges).join(', ')}) differ from note types (${types.join(', ')})`)
  for (const t of types) {
    if (badges[t] !== undefined && badges[t] !== NOTE_TYPES[t]) error('scripts/release.mjs', `NOTE_TYPES.${t} '${NOTE_TYPES[t]}' differs from app.json changelog.badge.${t} '${badges[t]}'`)
  }

  for (const s of sections.filter(s => s.version)) {
    for (const line of s.lines.filter(l => l.trim())) {
      const note = NOTE_RE.exec(line)
      if (!note) error('CHANGELOG.md', `[${s.version}] '${line}' is not '- [type] text'`)
      else if (!Object.hasOwn(NOTE_TYPES, note[1])) error('CHANGELOG.md', `[${s.version}] unknown note type '${note[1]}' (${Object.keys(NOTE_TYPES).join(', ')})`)
    }
  }
}

// ---------------------------------------------------------------------------
// 8. Component styles and templates: icons are files, not inline <svg>; every BEM class
//    (block__element, block--modifier) a component's styles define is used by its template or code.

const repoPath = f => relative(ROOT, f).replace(/\\/g, '/')
const escapeRegExp = s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
const APP = join(SRC, 'app')

for (const f of walkFiles(APP, '.html')) {
  if (/<svg[\s>]/i.test(readFileSync(f, 'utf8'))) error(repoPath(f), 'inline <svg>: use an icon file under src/assets/img/icons/ with <img ngSrc>')
}
for (const f of walkFiles(APP, '.ts')) {
  // Inline templates in any quote style: template: `…`, '…' or "…".
  if (/template:\s*(['"`])(?:(?!\1)[\s\S])*?<svg[\s>]/i.test(readFileSync(f, 'utf8'))) error(repoPath(f), 'inline <svg> in the template: use an icon file under src/assets/img/icons/ with <img ngSrc>')
}

{
  const sass = await import('sass')
  const BEM_CLASS = /\.(-?[a-z][\w-]*?(?:__|--)[\w-]+)/gi
  const styleFiles = [...walkFiles(APP, '.component.sass'), ...walkFiles(APP, '.component.scss')]
  for (const styleFile of styleFiles) {
    const base = styleFile.replace(/\.s[ac]ss$/, '')
    const source = ['.html', '.ts'].map(ext => base + ext).filter(existsSync).map(f => readFileSync(f, 'utf8')).join('\n')
    let css
    try {
      css = sass.compile(styleFile, { loadPaths: [join(SRC, 'styles')], style: 'expanded' }).css
    } catch (e) {
      error(repoPath(styleFile), `doesn't compile: ${e.message.split('\n')[0]}`)
      continue
    }
    for (const name of new Set([...css.matchAll(BEM_CLASS)].map(m => m[1]))) {
      // Whole names only: `.btn--a` isn't used by `btn--ab`.
      if (new RegExp(`(^|[^\\w-])${escapeRegExp(name)}(?![\\w-])`).test(source)) continue
      // A modifier built at runtime ('hud__currency--' + x, `map-marker--${x}`, badge--{{ x }}) leaves its prefix
      // right before a quote, `${` or `{{`.
      const modifierAt = name.lastIndexOf('--')
      const prefix = escapeRegExp(name.slice(0, modifierAt + 2))
      if (modifierAt > 0 && new RegExp(`(^|[^\\w-])${prefix}(?=['"\`]|\\$\\{|\\{\\{)`).test(source)) continue
      error(repoPath(styleFile), `.${name} is styled but neither the template nor the component code uses it`)
    }
  }
}

// ---------------------------------------------------------------------------
// 9. Codex skills: .agents/skills mirrors the shared skills in .claude/skills.

for (const p of staleCodexSkills()) error(p, 'out of sync with .claude/skills: run `npm run sync-skills`')

// ---------------------------------------------------------------------------
// 10. Agent and skill frontmatter: an unquoted YAML value can't contain ': ' or ' #'. Claude Code drops a file
//     whose frontmatter doesn't parse without any error, so the agent or skill silently goes missing.

for (const f of [...walkFiles(join(ROOT, '.claude', 'agents'), '.md'), ...walkFiles(join(ROOT, '.claude', 'skills'), 'SKILL.md')]) {
  const frontmatter = /^---\r?\n([\s\S]*?)\r?\n---/.exec(readFileSync(f, 'utf8'))?.[1] ?? ''
  // A plain value may wrap onto indented lines; they are part of the same value.
  for (const [, key, value] of frontmatter.matchAll(/^([\w-]+):[ \t]+(.+(?:\r?\n[ \t]+(?!- ).+)*)/gm)) {
    if (/^["'[{>|]/.test(value)) continue
    if (/: | #/.test(value)) error(repoPath(f), `frontmatter '${key}' has ': ' or ' #' unquoted, so it doesn't parse: wrap the value in double quotes`)
  }
}

// ---------------------------------------------------------------------------
// 11. Idea statuses: docs/ideas/README.md lists one status word per idea; the idea file's **Status:** line starts with it.

{
  const IDEAS = join(ROOT, 'docs', 'ideas')
  const STATUSES = ['Proposed', 'Accepted', 'In progress', 'Done', 'Noted', 'Open']
  const readme = 'docs/ideas/README.md'
  for (const [, file, status] of readFileSync(join(IDEAS, 'README.md'), 'utf8').matchAll(/^\|[^|]*\]\((?:\.\/)?([\w.-]+\.md)\)[^|]*\|[^|]*\|\s*([^|]*?)\s*\|/gm)) {
    const validStatus = STATUSES.includes(status)
    if (!validStatus) error(readme, `${file}: status '${status}' is not one of ${STATUSES.join(', ')}`)
    if (!existsSync(join(IDEAS, file))) { error(readme, `links missing file ${file}`); continue }
    const line = /\*\*Status:\*\*[ \t]*([^\r\n]*)/.exec(readFileSync(join(IDEAS, file), 'utf8'))?.[1]
    if (line === undefined) error(`docs/ideas/${file}`, `no '**Status:** ${validStatus ? status : '<status>'}' line`)
    else if (validStatus && !line.startsWith(status)) error(`docs/ideas/${file}`, `Status line '${line.slice(0, 40)}…' doesn't start with '${status}', the README status`)
  }
}

// ---------------------------------------------------------------------------
// 12. Docs: relative .md links point at a file, everywhere but the archive; lore, character and system docs name real IDs.

{
  const SHIPPED_NAMES = /^docs\/(lore|character|systems)\//
  // Characters with a doc but no data yet; remove an ID when it ships.
  const PLANNED_IDS = new Set(['NpcID.liroldVarrow'])
  const ENUMS = { ItemID: D.ItemID, NpcID: D.NpcID }
  for (const doc of walkFiles(join(ROOT, 'docs'), '.md')) {
    const rel = relative(ROOT, doc).replace(/\\/g, '/')
    if (rel.startsWith('docs/archive/')) continue
    const text = readFileSync(doc, 'utf8')
    for (const [, target] of text.replace(/```[\s\S]*?```/g, '').matchAll(/\]\((?!https?:)([^)\s#]+\.md)(?:#[^)\s]*)?(?:\s+["'][^"']*["'])?\)/g)) {
      if (!existsSync(resolve(dirname(doc), target))) error(rel, `links missing file '${target}'`)
    }
    if (!SHIPPED_NAMES.test(rel)) continue
    for (const [, name, member] of text.matchAll(/\b(ItemID|NpcID)\.(\w+)/g)) {
      if (ENUMS[name][member] === undefined && !PLANNED_IDS.has(`${name}.${member}`)) error(rel, `names unknown ${name}.${member}`)
    }
  }
}

// ---------------------------------------------------------------------------
// 13. NPC voice: lines stay in the world, no NPC repeats a phrase, no NPC narrates with "Then…". The owner kept
//     correcting these by hand in the Forge and Farm dialogue; the rules are in .claude/agents/lore-keeper.md.

{
  const OUT_OF_WORLD = /\b(?:buttons?|tabs?|menus?|screens?|click(?:s|ed)?|panels?|tooltips?|inventory|cooldowns?|xp|drop (?:rate|chance)s?|quest log|waves?|(?:from|in|on) (?:the|this|that|your) list|list (?:on the )?(?:left|right|above|below))\b|\d+\s*%|\bpercent\b/gi
  const REPEAT_WORDS = 5
  const MAX_THEN_OPENERS = 1
  // Shipped before this check, each with the one term or `npc: phrase` it may keep; reword a line and drop it here. Add nothing new.
  const OUT_OF_WORLD_BASELINE = { 'laHarparJosh.workInfo.message': 'wave', 'mawoodMilo.questWhatLurksProgress.message': 'waves', 'mawoodSylvie.questInfestationProgress.message': 'waves' }
  const REPEAT_BASELINE = new Set([
    'farmWarden: in a store under your', 'farmWarden: a store under your name', 'farmWarden: up on the top terrace',
    'laHarparBartender: a tavern are you blind', 'laHarparMarvin: we map the unknown and', 'liroldArenaMaster: last name on the card',
    'liroldPhurgo: i was going to fix', 'liroldPhurgo: was going to fix that','liroldPhurgo: i want to know what', 'liroldPhurgo: at the end of a', 'liroldPhurgo: the end of a shift',
    'mawoodCorwin: saplings in the outer wilds', 'mawoodFinn: three pelts from the elder', 'mawoodMilo: the further you can see', 'mawoodMilo: further you can see the',
    'mawoodSylvie: and ten vials of clean', 'mawoodSylvie: ten vials of clean water',
  ])
  const THEN_BASELINE = { mawoodMilo: 2 }
  const leaves = (value, path) => typeof value === 'string' ? [[path, value]] : Object.entries(value).flatMap(([k, v]) => leaves(v, `${path}.${k}`))
  for (const f of walkFiles(join(LOCALES, 'dialogues'), '.json')) {
    const npc = f.replace(/^.*[\\/]|\.json$/g, '')
    const file = repoPath(f)
    const strings = leaves(JSON.parse(readFileSync(f, 'utf8')), npc)
    for (const [path, text] of strings) {
      const hit = [...text.matchAll(OUT_OF_WORLD)].find(m => m[0].toLowerCase() !== OUT_OF_WORLD_BASELINE[path])
      if (hit) error(file, `${path} says '${hit[0]}': NPCs are people in the world, so teach it in fiction ("choose a seed and plant it"), not by naming UI or game terms`)
    }
    // NPC lines only: player options ("I'll let you get on") may recur.
    const messages = strings.filter(([path]) => path.endsWith('.message'))
    const firstSeen = new Map()
    for (const [path, text] of messages) {
      const words = text.toLowerCase().replace(/[^\p{L}\p{N}' ]+/gu, ' ').split(/\s+/).filter(Boolean)
      for (let i = 0; i + REPEAT_WORDS <= words.length; i++) {
        const phrase = words.slice(i, i + REPEAT_WORDS).join(' ')
        const first = firstSeen.get(phrase)
        if (first === undefined) firstSeen.set(phrase, path)
        else if (!REPEAT_BASELINE.has(`${npc}: ${phrase}`)) { error(file, `'${phrase}' is in ${first === path ? `${path} twice` : `both ${first} and ${path}`}: state a fact or phrase once, in the node that owns it`); break }
      }
    }
    const thens = messages.flatMap(([, text]) => text.match(/(?:^|[.!?…—]\s+)(?:and )?then\b/gi) ?? []).length
    if (thens > (THEN_BASELINE[npc] ?? MAX_THEN_OPENERS)) error(file, `${thens} sentences open with "Then": at most ${MAX_THEN_OPENERS} per NPC, people don't narrate in sequence; skip the connector or jump to what mattered`)
  }
}

// ---------------------------------------------------------------------------
// 14. Quest hubs. An option's results are tried top to bottom and the first visible one wins, so a result shown for a
//     quest state alone (say `active`) hides that quest's narrower results below it (its `readyToAdvance` turn-in).
//     Order: readyToAdvance, active, available. A turn-in (quest advance or end) must sit on the NPC the quest data
//     names as that step's turnInNpc.

{
  const RANK = { [D.QuestState.readyToAdvance]: 0, [D.QuestState.active]: 1, [D.QuestState.available]: 2 }
  for (const npc of Object.values(D.NPC_DATA)) {
    const name = idName(D.NpcID, npc.id)
    const file = `src/data/dialogues (${name})`
    for (const [key, node] of Object.entries(npc.dialogue)) {
      for (const [i, option] of (node.options ?? []).entries()) {
        // Results above that show for a quest state alone, with nothing else narrowing them.
        const broad = []
        for (const result of option.results ?? []) {
          const conditions = result.visibilityConditions ?? []
          for (const c of conditions.filter(c => c.type === 'quest' && c.questState in RANK)) {
            const shadow = broad.find(b => b.questId === c.questId && RANK[b.questState] > RANK[c.questState] && (b.step === undefined || b.step === c.step))
            if (shadow) error(file, `node ${key} option ${i}: ${idName(D.QuestID, c.questId)} ${idName(D.QuestState, c.questState)} sits below ${idName(D.QuestState, shadow.questState)}, which shows first; order turn-in, in progress, offer`)
          }
          if (conditions.length === 1 && conditions[0].type === 'quest' && conditions[0].questState in RANK) broad.push(conditions[0])

          for (const effect of (result.effects ?? []).filter(e => e.type === 'quest' && e.action !== 'start')) {
            const steps = D.QUEST_DATA[effect.questId]?.steps ?? []
            const ready = conditions.find(c => c.type === 'quest' && c.questId === effect.questId && c.questState === D.QuestState.readyToAdvance)
            const step = ready?.step ?? (effect.action === 'end' ? steps.length : undefined)
            const npcs = step === undefined ? steps.map(s => s.turnInNpc) : [steps[step - 1]?.turnInNpc]
            if (!npcs.includes(npc.id)) error(file, `node ${key} option ${i}: turns in ${idName(D.QuestID, effect.questId)}${step === undefined ? '' : ` step ${step}`}, whose turnInNpc is ${npcs.map(n => idName(D.NpcID, n)).join(' or ')}`)
          }
        }
      }
    }
  }
}

// ---------------------------------------------------------------------------

for (const w of warnings) console.log(`warning ${w}`)
for (const e of errors) console.log(`error   ${e}`)
console.log(`\nvalidate-data: ${errors.length} error(s), ${warnings.length} warning(s)`)
process.exit(errors.length ? 1 : 0)
