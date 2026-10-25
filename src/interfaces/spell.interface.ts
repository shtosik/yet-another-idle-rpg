import { SpellID } from 'enums/ids/spell-id.enum'
import { DamageElement } from 'enums/damage-element.enum'
import { SpellType } from 'enums/spell-type.enum'
import { PlayerStat } from 'types/player/player-stat.type'
import { SkillNodeID } from 'enums/ids/skill-node-id.enum'

export type SpellProps = {
    id: SpellID;
    baseManaCost: number;
    baseCooldown: number;
    url: string;
    effect: SpellEffectProps;
    /** Skill node whose levels make this spell cheaper or faster (`BattleManagerService.manaCost`, `spellCooldown`). */
    perk?: SpellPerk;
};

export type SpellPerk = {
    nodeId: SkillNodeID;
    /** Seconds off the cooldown per node level. */
    cooldownPerLevel?: number;
    /** Mana off the cost per node level (never below 1). */
    manaPerLevel?: number;
};

export type SpellEffectProps = SpellMeleeEffectProps | SpellMagicEffectProps | SpellBuffEffectProps;

export type SpellMeleeEffectProps = {
    type: SpellType.melee;
};

export type SpellMagicEffectProps = {
    type: SpellType.magic;
    baseDamage: number;
    damageType: DamageElement;
};

export type SpellBuffEffectProps = {
    type: SpellType.buff
    duration: number;
    stat: PlayerStat;
    amount: number;
    /** `amount` is a fraction of the stat (0.2 = 20% better) instead of a flat value. */
    percent?: boolean;
};
