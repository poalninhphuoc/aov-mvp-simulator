import test from 'node:test'
import assert from 'node:assert/strict'
import { calcRating, DEFAULT_STATE, PRESETS } from './rating.js'

const near = (a, b, eps = 1e-6) => assert.ok(Math.abs(a - b) < eps, `${a} != ${b}`)
const st = (p) => ({ ...DEFAULT_STATE, ...p })

test('Raw KDA & KP%', () => {
  near(calcRating(DEFAULT_STATE).rawKda, 9)
  near(calcRating(st({ d: 0 })).rawKda, 18)
  const r = calcRating(st({ k: 20, a: 30, teamKills: 5 }))
  assert.equal(r.kp, 100)
  assert.equal(r.teamKills, 20)
  assert.ok(r.overKp)
})

test('Perfect KDA', () => {
  assert.ok(calcRating(st({ d: 0 })).perfect)
  assert.ok(!calcRating(st({ d: 0, k: 0, a: 0 })).perfect)
})

test('Điểm mặc định đúng công thức', () => {
  // carry, thắng, 8/2/10, team 25, dame 28, gánh 18, trụ thấp
  const kda = Math.sqrt((8 * 1.15 + 10 * 0.55) / Math.pow(2, 0.85)) * 1.15
  const kp = Math.pow(18 / 25, 1.3) * 2.2
  const combat = (28 * 1.45 + 18 * 0.35) * 0.042
  const pen = -Math.pow(Math.max(0, 2 - 18 / 30), 1.15) * 0.42
  const raw = 4.0 + kda + kp + combat + pen
  const expected = raw > 11 ? 11 + Math.pow(raw - 11, 0.78) : raw
  near(calcRating(DEFAULT_STATE).rating, expected)
})

test('Soft-cap trên 11 và kẹp [3, 16]', () => {
  const hi = calcRating(st({ k: 30, a: 40, d: 0, teamKills: 60, dmgDealt: 60, dmgTaken: 60, tower: 'ultra', badges: ['mega', 'quadra', 'legendary', 'topGold'] }))
  assert.ok(hi.rawTotal > 16)
  assert.ok(hi.rating <= 16)
  near(hi.rating, Math.min(16, 11 + Math.pow(hi.rawTotal - 11, 0.78)))
  const lo = calcRating(st({ win: false, k: 0, a: 0, d: 20, dmgDealt: 0, dmgTaken: 0 }))
  assert.equal(lo.rating, 3)
})

test('Hard-gate: đủ điểm SSS nhưng thua -> hạ xuống SS', () => {
  const p = PRESETS.find((x) => x.id === 'sss').state
  const win = calcRating(p)
  const lose = calcRating({ ...p, win: false })
  assert.equal(win.rank.tier, 'SSS')
  assert.ok(lose.rating >= 12.3)
  assert.equal(lose.rank.tier, 'SS')
})

test('Hard-gate: chết >= 6 thì giáng xuống A dù điểm >= 10', () => {
  const r = calcRating(st({ k: 25, a: 35, d: 6, teamKills: 50, dmgDealt: 50, dmgTaken: 40, tower: 'ultra', badges: ['mega', 'legendary', 'topGold'] }))
  assert.ok(r.rating >= 10)
  assert.equal(r.rank.tier, 'A')
  assert.ok(r.rank.reason)
})

test('Hạng thấp', () => {
  assert.equal(calcRating(st({ win: false, k: 0, a: 1, d: 12, dmgDealt: 2, dmgTaken: 5 })).rank.tier, 'C')
})

test('Preset chạy được và trả hạng hợp lệ', () => {
  for (const p of PRESETS) {
    const r = calcRating(p.state)
    assert.ok(['SSS', 'SS', 'S', 'A', 'B', 'C'].includes(r.rank.tier), p.id)
    console.log(p.id, r.rating.toFixed(2), r.rank.tier, r.rank.reason ?? '')
  }
})
