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
import MAWOOD_CORWIN from './dialogues/mawoodTown/mawoodCorwin'
import MAWOOD_SYLVIE from './dialogues/mawoodTown/mawoodSylvie'
import MAWOOD_FINN from './dialogues/mawoodTown/mawoodFinn'
import MAWOOD_BRENN from './dialogues/mawoodTown/mawoodBrenn'
import MAWOOD_MILO from './dialogues/mawoodTown/mawoodMilo'
import MAWOOD_ELARION from './dialogues/mawoodTown/mawoodElarion'

export interface NPCProps {
  id: NpcID
  url: string
  dialogue: DialogueType
  startNodeId?: number
  firstMeetNodeId?: number
}

const NPC_Data: Record<number, NPCProps> = {
  [NpcID.laHarparBartender]: {
    id: NpcID.laHarparBartender,
    url: './assets/img/avatars/laHarpar/laHarparBartender.png',
    dialogue: LA_HARPAR_BARTENDER,
    firstMeetNodeId: 1,
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
    firstMeetNodeId: 1,
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
    firstMeetNodeId: 1,
  },
  [NpcID.mawoodCorwin]: {
    id: NpcID.mawoodCorwin,
    url: './assets/img/avatars/mawood/mawoodCorwin.png',
    dialogue: MAWOOD_CORWIN,
    firstMeetNodeId: 1,
  },
  [NpcID.mawoodSylvie]: {
    id: NpcID.mawoodSylvie,
    url: './assets/img/avatars/mawood/mawoodSylvie.png',
    dialogue: MAWOOD_SYLVIE,
    firstMeetNodeId: 1,
  },
  [NpcID.mawoodFinn]: {
    id: NpcID.mawoodFinn,
    url: './assets/img/avatars/mawood/mawoodFinn.png',
    dialogue: MAWOOD_FINN,
    firstMeetNodeId: 1,
  },
  [NpcID.mawoodBrenn]: {
    id: NpcID.mawoodBrenn,
    url: './assets/img/avatars/mawood/mawoodBrenn.png',
    dialogue: MAWOOD_BRENN,
    firstMeetNodeId: 1,
  },
  [NpcID.mawoodMilo]: {
    id: NpcID.mawoodMilo,
    url: './assets/img/avatars/mawood/mawoodMilo.png',
    dialogue: MAWOOD_MILO,
    firstMeetNodeId: 1,
  },
  [NpcID.mawoodElarion]: {
    id: NpcID.mawoodElarion,
    url: './assets/img/avatars/mawood/mawoodElarion.png',
    dialogue: MAWOOD_ELARION,
    firstMeetNodeId: 1,
  },
}
export default NPC_Data
