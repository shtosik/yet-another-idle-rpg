import { SkillNode, NodeRequirement } from 'interfaces/skill-tree/skill-node.interface'

export function isRequirementMet(
    req: NodeRequirement | null,
    unlocked: Readonly<Record<number, number>>,
): boolean {
    if (req === null) return true
    switch (req.kind) {
        case 'node': return (unlocked[req.id] ?? 0) >= req.minLevel
        case 'all':  return req.of.every(r => isRequirementMet(r, unlocked))
        case 'any':  return req.of.some(r  => isRequirementMet(r, unlocked))
    }
}

export type CanBuyResult =
    | { ok: true }
    | { ok: false; reason: 'maxed' | 'cost' | 'locked' }

export function canBuyNode(
    node: SkillNode,
    unlocked: Readonly<Record<number, number>>,
    unspentSkillPoints: number,
): CanBuyResult {
    const currentLevel = unlocked[node.id] ?? 0
    if (currentLevel >= node.maxLevel) return { ok: false, reason: 'maxed' }
    if (unspentSkillPoints < node.skillPointCost) return { ok: false, reason: 'cost' }
    if (currentLevel === 0 && !isRequirementMet(node.requires, unlocked)) {
        return { ok: false, reason: 'locked' }
    }
    return { ok: true }
}
