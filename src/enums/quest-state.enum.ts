export enum QuestState {
  notStarted,
  /** Not started and its start requirements are met. */
  available,
  /** Started, not completed. */
  active,
  /** Active and the current step's requirements are met. */
  readyToAdvance,
  completed,
}
