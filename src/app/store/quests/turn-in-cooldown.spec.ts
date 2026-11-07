import { formatCooldown, TURN_IN_COOLDOWN_MS, turnInRemainingMs } from './turn-in-cooldown'

describe('turn-in cooldown maths', () => {
  const START = 1_000_000

  it('is ready when the turn-in never ran', () => {
    expect(turnInRemainingMs(undefined, 0, START)).toBe(0)
  })

  it('counts down from the full cooldown and ends at it', () => {
    expect(turnInRemainingMs(START, 0, START)).toBe(TURN_IN_COOLDOWN_MS)
    expect(turnInRemainingMs(START, 0, START + 60_000)).toBe(TURN_IN_COOLDOWN_MS - 60_000)
    expect(turnInRemainingMs(START, 0, START + TURN_IN_COOLDOWN_MS)).toBe(0)
  })

  it('counts a clock set back as no time passed', () => {
    expect(turnInRemainingMs(START, 0, START - 5 * 60 * 60 * 1000)).toBe(TURN_IN_COOLDOWN_MS)
  })

  it('shortens a running cooldown when the stat is gained later', () => {
    const now = START + TURN_IN_COOLDOWN_MS / 2
    expect(turnInRemainingMs(START, 0, now)).toBe(TURN_IN_COOLDOWN_MS / 2)
    expect(turnInRemainingMs(START, 0.5, now)).toBe(0)
  })

  it('never reduces by more than 75%', () => {
    expect(turnInRemainingMs(START, 0.75, START)).toBe(TURN_IN_COOLDOWN_MS / 4)
    expect(turnInRemainingMs(START, 5, START)).toBe(TURN_IN_COOLDOWN_MS / 4)
    expect(turnInRemainingMs(START, -1, START)).toBe(TURN_IN_COOLDOWN_MS)
  })

  it('formats the wait', () => {
    expect(formatCooldown(72 * 60 * 1000)).toBe('1 h 12 m')
    expect(formatCooldown(12 * 60 * 1000 + 5000)).toBe('12 m 05 s')
    expect(formatCooldown(900)).toBe('1 s')
  })
})
