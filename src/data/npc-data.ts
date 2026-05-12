// import LA_HARPAR_BARTENDER from "./dialogues/laHarparTown/laHarparBartender";
// import LA_HARPAR_ELARA from "./dialogues/laHarparTown/laHarparElara";
// import LA_HARPAR_JOSH from "./dialogues/laHarparTown/laHarparJosh";
// import LA_HARPAR_TRADER from "./dialogues/laHarparTown/laHarparTrader";
// import {DialogueProps} from "./dialogues/types";

import { NpcID } from '../enums/map/npc-id.enum'
import LA_HARPAR_BARTENDER from './dialogues/laHarparTown/laHarparBartender'
import { DialogueType } from './dialogues/types'
import LA_HARPAR_JOSH from './dialogues/laHarparTown/laHarparJosh'
import LA_HARPAR_TRADER from './dialogues/laHarparTown/laHarparTrader'
import LA_HARPAR_ELARA from './dialogues/laHarparTown/laHarparElara'
import LA_HARPAR_MARVIN from './dialogues/laHarparTown/laHarparMarvin'

export interface NPCProps {
  id: NpcID
  url: string
  dialogue: DialogueType
}

const NPC_Data: Record<number, NPCProps> = {
  [NpcID.laHarparBartender]: {
    id: NpcID.laHarparBartender,
    url: './assets/img/avatars/laHarpar/laHarparBartender.png',
    dialogue: LA_HARPAR_BARTENDER,
  },
  [NpcID.laHarparJosh]: {
    id: NpcID.laHarparJosh,
    url: './assets/img/avatars/laHarpar/laHarparJosh.png',
    dialogue: LA_HARPAR_JOSH,
  },
  [NpcID.laHarparTrader]: {
    id: NpcID.laHarparTrader,
    url: './assets/img/avatars/laHarpar/laHarparTrader.png',
    dialogue: LA_HARPAR_TRADER,
  },
  [NpcID.laHarparElara]: {
    id: NpcID.laHarparElara,
    url: './assets/img/avatars/laHarpar/laHarparElara.png',
    dialogue: LA_HARPAR_ELARA,
  },
  [NpcID.laHarparMarvin]: {
    id: NpcID.laHarparMarvin,
    url: './assets/img/avatars/laHarpar/laHarparMarvin.png',
    dialogue: LA_HARPAR_MARVIN,
  },
}
export default NPC_Data
