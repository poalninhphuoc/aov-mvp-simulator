// Logic tính điểm & xếp hạng thuần (không phụ thuộc React) để dễ test.

export const ROLES = {
  carry: { label: 'Xạ Thủ / Pháp Sư', hint: 'Chủ lực sát thương', group: 'dps', wK: 1.15, wA: 0.55, wDmg: 1.45, wTank: 0.35 },
  assassin: { label: 'Sát Thủ / Rừng', hint: 'Gank & mục tiêu', group: 'dps', wK: 1.25, wA: 0.6, wDmg: 1.2, wTank: 0.5 },
  fighter: { label: 'Đấu Sĩ / Solo', hint: 'Đẩy lẻ & cân bằng', group: 'dps', wK: 1.0, wA: 0.7, wDmg: 1.05, wTank: 1.0 },
  support: { label: 'Trợ Thủ', hint: 'Bảo kê & giao tranh', group: 'sup', wK: 0.65, wA: 1.15, wDmg: 0.45, wTank: 1.15 },
  tank: { label: 'Đỡ Đòn', hint: 'Chống chịu mở giao tranh', group: 'sup', wK: 0.65, wA: 1.05, wDmg: 0.45, wTank: 1.45 },
}

export const TOWER_LEVELS = [
  { id: 'low', label: 'Thấp', bonus: 0 },
  { id: 'mid', label: 'Trung bình', bonus: 0.3 },
  { id: 'high', label: 'Cao', bonus: 0.6 },
  { id: 'ultra', label: 'Huỷ diệt', bonus: 1.0 },
]

export const BADGES = [
  { id: 'legendary', label: 'Thần Thánh (Legendary)', bonus: 0.6 },
  { id: 'triple', label: 'Triple Kill', bonus: 0.3 },
  { id: 'quadra', label: 'Quadra Kill', bonus: 0.7 },
  { id: 'mega', label: 'Mega Kill', bonus: 1.2 },
  { id: 'topGold', label: 'Vàng cao nhất trận', bonus: 0.4 },
]

export const RANK_COLORS = {
  SSS: '#EF4444',
  SS: '#FBBF24',
  S: '#D97706',
  A: '#A855F7',
  B: '#3B82F6',
  C: '#6B7280',
}

export const DEFAULT_STATE = {
  role: 'carry',
  win: true,
  k: 8,
  d: 2,
  a: 10,
  teamKills: 25,
  dmgDealt: 28,
  dmgTaken: 18,
  tower: 'low',
  badges: [],
}

export const PRESETS = [
  { id: 'normal', label: 'Trận Tốt Bình Thường (Hạng A/S)', state: { ...DEFAULT_STATE, k: 6, d: 3, a: 8, teamKills: 25, dmgDealt: 24, dmgTaken: 15 } },
  { id: 'ss', label: 'Gánh Team Chuẩn SS', state: { ...DEFAULT_STATE, k: 11, d: 1, a: 9, teamKills: 26, dmgDealt: 34, dmgTaken: 16, tower: 'high', badges: ['legendary'] } },
  { id: 'sss', label: 'Thần Thánh SSS (Out trình)', state: { ...DEFAULT_STATE, k: 16, d: 0, a: 12, teamKills: 32, dmgDealt: 42, dmgTaken: 20, tower: 'ultra', badges: ['mega', 'legendary', 'topGold'] } },
  { id: 'sup', label: 'Trợ Thủ SSS Hoàn Hảo', state: { ...DEFAULT_STATE, role: 'support', k: 2, d: 0, a: 26, teamKills: 30, dmgDealt: 12, dmgTaken: 38, tower: 'high', badges: ['legendary'] } },
]

const clamp = (min, max, v) => Math.min(max, Math.max(min, v))

export function calcScore(s) {
  const r = ROLES[s.role]
  const { k, d, a } = s
  const teamKills = Math.max(1, s.teamKills, k)

  const rawKda = (k + a) / Math.max(1, d)
  const kp = Math.min(100, ((k + a) / teamKills) * 100)

  const base = s.win ? 4.0 : 3.3
  const weightedKA = k * r.wK + a * r.wA
  const effectiveDeath = d === 0 ? 0.85 : Math.pow(d, 0.85)
  const kda = Math.min(5.6, Math.sqrt(weightedKA / effectiveDeath) * 1.15)
  const zeroDeath = d === 0 && k + a >= 8 ? 0.6 : 0
  const kpScore = Math.pow(kp / 100, 1.3) * 2.2
  const combat = (s.dmgDealt * r.wDmg + s.dmgTaken * r.wTank) * 0.042
  const tower = TOWER_LEVELS.find((t) => t.id === s.tower)?.bonus ?? 0
  const badge = BADGES.filter((b) => s.badges.includes(b.id)).reduce((t, b) => t + b.bonus, 0)

  const mitigation = r.group === 'sup' ? s.dmgTaken / 18 : s.dmgTaken / 30
  const unjustified = Math.max(0, d - mitigation)
  const deathPenalty = -Math.min(4.5, Math.pow(unjustified, 1.15) * 0.42)

  const rawTotal = base + kda + zeroDeath + kpScore + combat + tower + badge + deathPenalty
  const soft = rawTotal > 11 ? 11 + Math.pow(rawTotal - 11, 0.8) : rawTotal
  const rating = clamp(3.0, 16.0, soft)

  return {
    rawKda,
    perfect: d === 0 && k + a > 0,
    kp,
    teamKills,
    overKp: k + a > s.teamKills,
    rawTotal,
    rating,
    breakdown: { base, kda: kda + zeroDeath, kp: kpScore, dmg: s.dmgDealt * r.wDmg * 0.042, tank: s.dmgTaken * r.wTank * 0.042, objectives: tower + badge, deathPenalty },
  }
}

const gate = (label, ok, detail) => ({ label, ok, detail })

export function getGates(s, c) {
  const { k, d, a, dmgDealt, dmgTaken } = s
  const isSup = ROLES[s.role].group === 'sup'
  const r = c.rating

  const sss = [
    gate('Điểm ≥ 14.2', r >= 14.2, `Hiện ${r.toFixed(1)}`),
    gate('Phải Thắng', s.win, s.win ? 'Thắng' : 'Thua tối đa chỉ được SS'),
    gate(
      dmgTaken >= 35 ? 'Chết ≤ 2 (gánh ≥ 35%)' : 'Chết ≤ 1 (≤ 2 nếu gánh ≥ 35%)',
      d <= 1 || (d <= 2 && dmgTaken >= 35),
      `Chết ${d}`,
    ),
    gate('KP ≥ 72%', c.kp >= 72, `KP ${c.kp.toFixed(0)}%`),
    isSup
      ? gate('Thống trị: gánh ≥ 34% VÀ KP ≥ 80%', dmgTaken >= 34 && c.kp >= 80, `Gánh ${dmgTaken}%, KP ${c.kp.toFixed(0)}%`)
      : gate('Thống trị: dame ≥ 34% HOẶC ≥ 12 mạng', dmgDealt >= 34 || k >= 12, `Dame ${dmgDealt}%, K ${k}`),
  ]

  const ss = [
    gate('Điểm ≥ 12.3', r >= 12.3, `Hiện ${r.toFixed(1)}`),
    gate(
      'Chết ≤ 2 (≤ 3 nếu gánh ≥ 30% hoặc K+A ≥ 20)',
      d <= 2 || (d <= 3 && (dmgTaken >= 30 || k + a >= 20)),
      `Chết ${d}`,
    ),
    gate('KP ≥ 60%', c.kp >= 60, `KP ${c.kp.toFixed(0)}%`),
    gate('Nổi bật: dame ≥ 26% / gánh ≥ 28% / KP ≥ 75%', dmgDealt >= 26 || dmgTaken >= 28 || c.kp >= 75, `Dame ${dmgDealt}%, gánh ${dmgTaken}%, KP ${c.kp.toFixed(0)}%`),
  ]

  const sGate = [
    gate('Điểm ≥ 10.0', r >= 10, `Hiện ${r.toFixed(1)}`),
    gate('Chết ≤ 5', d <= 5, `Chết ${d}`),
  ]

  return { sss, ss, s: sGate }
}

const all = (g) => g.every((x) => x.ok)
const failed = (g) => g.filter((x) => !x.ok).map((x) => x.label)

export function getRank(s, c) {
  const g = getGates(s, c)
  const r = c.rating
  let tier
  let reason = null

  if (all(g.sss)) tier = 'SSS'
  else if (all(g.ss)) {
    tier = 'SS'
    if (r >= 14.2) reason = `Đủ điểm SSS (${r.toFixed(1)}) nhưng bị hạ xuống SS: trượt ${failed(g.sss).join('; ')}`
  } else if (all(g.s)) {
    tier = 'S'
    if (r >= 12.3) reason = `Đủ điểm SS (${r.toFixed(1)}) nhưng bị hạ xuống S: trượt ${failed(g.ss).join('; ')}`
  } else if (r >= 7.8) {
    tier = 'A'
    if (r >= 10 && s.d >= 6) reason = `Đủ điểm S (${r.toFixed(1)}) nhưng chết ${s.d} mạng (≥ 6) nên bị giáng xuống A`
  } else if (r >= 5.5) tier = 'B'
  else tier = 'C'

  return { tier, reason, gates: g }
}

export const RANK_DESC = {
  SSS: 'Thần thánh',
  SS: 'Xuất sắc',
  S: 'Rất tốt',
  A: 'Tốt',
  B: 'Đạt yêu cầu',
  C: 'Cần cải thiện',
}

export function calcRating(s) {
  const c = calcScore(s)
  return { ...c, rank: getRank(s, c) }
}
