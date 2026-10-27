import { LaHarparBartenderDialogueType } from './laHarparTown/laHarparBartender'
import { LaHarparElaraDialogueType } from './laHarparTown/laHarparElara'
import { LaHarparJoshDialogueType } from './laHarparTown/laHarparJosh'
import { LaHarparTraderDialogueType } from './laHarparTown/laHarparTrader'
import { LaHarparMarvinDialogueType } from './laHarparTown/laHarparMarvin'
import { MawoodCorwinDialogueType } from './mawoodTown/mawoodCorwin'
import { MawoodSylvieDialogueType } from './mawoodTown/mawoodSylvie'
import { MawoodFinnDialogueType } from './mawoodTown/mawoodFinn'
import { MawoodBrennDialogueType } from './mawoodTown/mawoodBrenn'
import { MawoodMiloDialogueType } from './mawoodTown/mawoodMilo'
import { MawoodElarionDialogueType } from './mawoodTown/mawoodElarion'
import { NorthLiroldArenaMasterDialogueType } from './northLiroldTown/northLiroldArenaMaster'

export type DialogueType =
  | LaHarparBartenderDialogueType
  | LaHarparElaraDialogueType
  | LaHarparJoshDialogueType
  | LaHarparTraderDialogueType
  | LaHarparMarvinDialogueType
  | MawoodCorwinDialogueType
  | MawoodSylvieDialogueType
  | MawoodFinnDialogueType
  | MawoodBrennDialogueType
  | MawoodMiloDialogueType
  | MawoodElarionDialogueType
  | NorthLiroldArenaMasterDialogueType
