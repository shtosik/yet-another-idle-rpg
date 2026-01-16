import { SpellID } from '../enums/ids/spell-id.enum'
import { SpellType } from '../enums/spell-type.enum'
import { PlayerStat } from '../types/player/player-stat.type'

export type SpellProps = {
  id: number;
  baseManaCost: number;
  baseCooldown: number;
  url: string;
  effect: SpellEffectProps;
};

export type SpellEffectProps = SpellMeleeEffectProps | SpellMagicEffectProps | SpellSupportStatBuffEffectProps;

export type SpellMeleeEffectProps = {
  type: SpellType.melee;
};

export type SpellMagicEffectProps = {
  type: SpellType.magic;
  baseDamage: number;
};

export type SpellSupportStatBuffEffectProps = {
  type: SpellType.buff
  duration: number;
  stat: PlayerStat;
  amount: number;
};

const SPELLS_DATA: Record<SpellID, SpellProps> = {
  [SpellID.fireStrike]: {
    id: 0,
    baseManaCost: 2,
    baseCooldown: 60,
    url: './assets/img/skills/fireStrike.png',
    effect: {
      type: SpellType.magic,
      baseDamage: 15,
    },
  },
  [SpellID.haste]: {
    id: 1,
    baseManaCost: 5,
    baseCooldown: 10,
    url: './assets/img/skills/haste.png',
    effect: {
      type: SpellType.buff,
      duration: 5,
      stat: 'attackSpeed',
      amount: 0.3,
    },
  },
  [SpellID.doubleAttack]: {
    id: 2,
    baseManaCost: 2,
    baseCooldown: 60,
    url: './assets/img/skills/doubleAttack.png',
    effect: {
      type: SpellType.melee,
    },
  },
}

export default SPELLS_DATA
