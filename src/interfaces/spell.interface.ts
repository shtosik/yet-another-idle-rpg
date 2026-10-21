import { SpellID } from 'enums/ids/spell-id.enum'
import { DamageElement } from 'enums/damage-element.enum'
import { SpellType } from 'enums/spell-type.enum'
import { PlayerStat } from 'types/player/player-stat.type'

export type SpellProps = {
    id: SpellID;
    baseManaCost: number;
    baseCooldown: number;
    url: string;
    effect: SpellEffectProps;
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
};
