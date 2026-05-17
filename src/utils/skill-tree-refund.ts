import { SkillPointID } from 'enums/ids/skill-tree-node-id.enum'
import { SkillTreeGraph } from 'data/skill-tree-graph'
import { isRequirementMet } from 'utils/skill-tree-requirements'

export type CanRefundResult =
    | { ok: true; pointsReturned: number }
    | { ok: false; reason: 'not-allocated' | 'blocked-by'; blockers: SkillPointID[] }

export function canRefundSkillPoint(
    targetId: SkillPointID,
    levels: number | 'all',
    unlocked: Readonly<Record<number, number>>,
    graph: SkillTreeGraph,
): CanRefundResult {
    const currentLevel = unlocked[targetId] ?? 0
    if (currentLevel === 0) return { ok: false, reason: 'not-allocated', blockers: [] }

    const dropAmount = levels === 'all' ? currentLevel : Math.min(levels, currentLevel)
    const newLevel = currentLevel - dropAmount

    // Simulate the refund.
    const next = { ...unlocked, [targetId]: newLevel }

    // Only direct dependents need checking — transitive cases will be caught
    // when the player works top-down through the chain.
    const blockers: SkillPointID[] = []
    for (const dependentId of graph.forwardEdges.get(targetId) ?? []) {
        if ((unlocked[dependentId] ?? 0) === 0) continue
        const dep = graph.nodes.get(dependentId)
        if (!dep) continue
        if (!isRequirementMet(dep.unlockRequirements, next)) blockers.push(dependentId)
    }

    if (blockers.length > 0) return { ok: false, reason: 'blocked-by', blockers }
    return { ok: true, pointsReturned: dropAmount }
}
