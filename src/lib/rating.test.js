import test from 'node:test'
import assert from 'node:assert/strict'
import { calcRating, getRank, DEFAULT_STATE } from './rating.js'

const near = (a, b, eps = 1e-6) => assert.ok(Math.abs(a - b) < eps, `${a} != ${b}`)

test('Raw KDA = (K+A)/max(1,D)', () => {
  near(calcRating(DEFAULT_STATE).rawKda, 9)
  near(calcRating({ ...DEFAULT_STATE, d: 0 }).rawKda, 18)
})

test('KP% bị chặn ở 100 và teamKills >= K', () => {
  const res = calcRating({ ...DEFAULT_STATE, k: 20, a: 30, teamKills: 5 })
  assert.equal(res.kp, 100)
  assert.equal(res.teamKills, 20)
})

test('Perfect KDA khi D=0 và K+A>0', () => {
  assert.ok(calcRating({ ...DEFAULT_STATE, d: 0 }).perfect)
  assert.ok(!calcRating({ ...DEFAULT_STATE, d: 0, k: 0, a: 0 }).perfect)
})

test('Điểm mặc định theo công thức', () => {
  // carry, thắng, 8/2/10, team 25, 28% dmg, 18% taken, tower TB (+0.2)
  const res = calcRating(DEFAULT_STATE)
  const kda = ((8 * 1.2 + 10 * 0.6) / Math.pow(2, 0.75)) * 0.42
  const kp = (18 / 25) * 2.4
  const combat = (28 * 1.4 + 18 * 0.4) * 0.045
  const pen = -Math.max(0, 2 - 18 / 12) * 0.35
  near(res.rating, 4.2 + kda + kp + combat + 0.2 + pen)
})

test('Rating bị kẹp trong [3, 16]', () => {
  const low = calcRating({ ...DEFAULT_STATE, win: false, k: 0, a: 0, d: 20, dmgDealt: 0, dmgTaken: 0, tower: 'low' })
  assert.equal(low.rating, 3)
  const high = calcRating({ ...DEFAULT_STATE, k: 30, a: 40, d: 0, teamKills: 60, dmgDealt: 60, dmgTaken: 60, tower: 'super', badges: ['mega', 'quadra', 'legendary'] })
  assert.equal(high.rating, 16)
})

test('Phân hạng', () => {
  assert.equal(getRank(12, true).tier, 'SSS')
  assert.equal(getRank(10, true).mvp, 'win')
  assert.equal(getRank(10, false).mvp, 'lose')
  assert.equal(getRank(8, true).tier, 'A')
  assert.equal(getRank(6, true).tier, 'B')
  assert.equal(getRank(5, true).tier, 'C')
})
