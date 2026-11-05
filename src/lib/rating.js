// Logic tính điểm thuần (không phụ thuộc React) để dễ test.

export const ROLES = {
  carry: { label: 'Xạ Thủ / Pháp Sư', hint: 'Chủ lực sát thương', wKill: 1.2, wAssist: 0.6, wDmg: 1.4, wTank: 0.4 },
  assassin: { label: 'Sát Thủ / Đi Rừng', hint: 'Gank & mục tiêu', wKill: 1.3, wAssist: 0.65, wDmg: 1.1, wTank: 0.6 },
  fighter: { label: 'Đấu Sĩ / Solo', hint: 'Đẩy lẻ & cân bằng', wKill: 1.0, wAssist: 0.75, wDmg: 1.0, wTank: 1.0 },
  support: { label: 'Trợ Thủ', hint: 'Bảo kê & giao tranh', wKill: 0.7, wAssist: 1.25, wDmg: 0.5, wTank: 1.1 },
  tank: { label: 'Đỡ Đòn', hint: 'Chống chịu mở giao tranh', wKill: 0.75, wAssist: 1.1, wDmg: 0.5, wTank: 1.45 },
}

export const TOWER_LEVELS = [
  { id: 'low', label: 'Thấp', bonus: 0 },
  { id: 'mid', label: 'Trung bình', bonus: 0.2 },
  { id: 'high', label: 'Cao', bonus: 0.45 },
  { id: 'super', label: 'Siêu cấp', bonus: 0.8 },
]

export const BADGES = [
  { id: 'firstBlood', label: 'Chiến công đầu', bonus: 0.2 },
  { id: 'triple', label: 'Triple Kill', bonus: 0.4 },
  { id: 'quadra', label: 'Quadra Kill', bonus: 0.8 },
  { id: 'mega', label: 'Mega Kill', bonus: 1.5 },
  { id: 'legendary', label: 'Thần Thánh (Legendary)', bonus: 0.6 },
  { id: 'topGold', label: 'Nhiều vàng nhất trận', bonus: 0.4 },
]

export const DEFAULT_STATE = {
  role: 'carry',
  win: true,
  k: 8,
  d: 2,
  a: 10,
  teamKills: 25,
  dmgDealt: 28,
  dmgTaken: 18,
  tower: 'mid',
  badges: [],
}

const clamp = (min, max, v) => Math.min(max, Math.max(min, v))

export function calcRating(s) {
  const r = ROLES[s.role]
  const { k, d, a } = s
  const teamKills = Math.max(s.teamKills, k)

  const rawKda = (k + a) / Math.max(1, d)
  const perfect = d === 0 && k + a > 0
  const kp = Math.min(100, ((k + a) / Math.max(1, teamKills)) * 100)

  const base = s.win ? 4.2 : 3.6
  let kda = Math.min(5.2, ((k * r.wKill + a * r.wAssist) / Math.max(1, Math.pow(d, 0.75))) * 0.42)
  if (d === 0 && k + a >= 5) kda += 0.5
  const kpScore = (kp / 100) * 2.4
  const combat = (s.dmgDealt * r.wDmg + s.dmgTaken * r.wTank) * 0.045
  const tower = TOWER_LEVELS.find((t) => t.id === s.tower)?.bonus ?? 0
  const badge = BADGES.filter((b) => s.badges.includes(b.id)).reduce((sum, b) => sum + b.bonus, 0)
  const deathPenalty = -Math.min(4.0, Math.max(0, d - s.dmgTaken / 12) * 0.35)

  const raw = base + kda + kpScore + combat + tower + badge + deathPenalty
  const rating = clamp(3.0, 16.0, raw)

  return {
    rawKda,
    perfect,
    kp,
    rating,
    teamKills,
    breakdown: {
      base,
      kda,
      kp: kpScore,
      combat,
      objectives: tower + badge,
      deathPenalty,
    },
    rank: getRank(rating, s.win),
  }
}

export function getRank(rating, win) {
  if (rating >= 12) return { tier: 'SSS', title: 'MVP Siêu Cấp', mvp: 'super', desc: 'Siêu cấp' }
  if (rating >= 9.5) {
    return {
      tier: rating >= 10.7 ? 'SS' : 'S',
      title: win ? 'MVP Thắng' : 'MVP Bại',
      mvp: win ? 'win' : 'lose',
      desc: win ? 'Xuất sắc' : 'Gánh vác trong thất bại',
    }
  }
  if (rating >= 7.5) return { tier: 'A', title: 'Tốt', mvp: null, desc: 'Tốt' }
  if (rating >= 5.5) return { tier: 'B', title: 'Đạt yêu cầu', mvp: null, desc: 'Đạt yêu cầu' }
  return { tier: 'C', title: 'Cảnh báo', mvp: null, desc: 'Điểm quá thấp có thể bị trừ uy tín' }
}

export function getInsights(s, res) {
  const out = []
  const { kp } = res
  const r = s.role

  if (res.perfect) out.push({ type: 'good', text: 'Không chết lần nào — Perfect KDA! Đây là nền tảng để cày điểm MVP ổn định.' })
  if (r === 'support' && kp < 50) out.push({ type: 'warn', text: 'Bạn là Trợ thủ nhưng KP% đang dưới 50%, hãy lên đồ phụ trợ diện rộng và bám sát đồng đội để lấy thêm Assist.' })
  if (r === 'support' && kp >= 75) out.push({ type: 'good', text: 'KP% rất cao — đúng chất Trợ thủ luôn có mặt ở mọi giao tranh.' })
  if (r === 'tank' && s.dmgTaken >= 30 && s.d <= 4) out.push({ type: 'good', text: 'Tỷ lệ chống chịu / số mạng chết cực tốt, bù đắp việc ít mạng hạ gục.' })
  if (r === 'tank' && s.dmgTaken < 20) out.push({ type: 'warn', text: 'Đỡ Đòn nhưng gánh dưới 20% sát thương — hãy mở giao tranh và đứng trước để tăng điểm chống chịu.' })
  if ((r === 'carry' || r === 'assassin') && s.dmgDealt < 25) out.push({ type: 'warn', text: 'Vai trò sát thương nhưng % dame còn thấp — chú ý lên đồ và vị trí đứng để xả sát thương liên tục.' })
  if (r === 'fighter' && (s.tower === 'low' || s.tower === 'mid')) out.push({ type: 'info', text: 'Đấu Sĩ nên tận dụng đẩy lẻ — sát thương công trình cao giúp cộng thêm điểm mục tiêu.' })
  if (s.d >= 7) out.push({ type: 'warn', text: `Chết ${s.d} lần đang bị phạt khá nặng. Chơi an toàn hơn khi đồng đội chưa hồi sinh sẽ cải thiện điểm rõ rệt.` })
  if (kp < 40 && s.k + s.a > 0 && r !== 'support') out.push({ type: 'warn', text: 'KP% dưới 40% — hãy tham gia nhiều giao tranh tổng hơn thay vì chỉ farm.' })
  if (res.rating < 5.5) out.push({ type: 'warn', text: 'Điểm dưới 5.5 (hạng C) — cân nhắc giảm số mạng chết và tăng tham gia giao tranh.' })
  if (res.rating >= 12) out.push({ type: 'good', text: 'Màn trình diễn đỉnh cao! Bạn đang ở ngưỡng MVP Siêu Cấp.' })
  if (!s.win && res.rating >= 9.5) out.push({ type: 'info', text: 'Dù thua vẫn đạt MVP Bại — bạn đã gánh hết sức có thể.' })

  if (out.length === 0) out.push({ type: 'info', text: 'Chỉ số khá cân bằng. Thử tăng KP% hoặc sát thương công trình để lên hạng cao hơn.' })
  return out.slice(0, 3)
}

export const PRESETS = [
  { id: 'carry', label: 'Xạ thủ Gánh Team', state: { role: 'carry', win: true, k: 14, d: 1, a: 9, teamKills: 28, dmgDealt: 42, dmgTaken: 12, tower: 'high', badges: ['firstBlood', 'triple', 'topGold'] } },
  { id: 'support', label: 'Trợ thủ 0 mạng vẫn MVP', state: { role: 'support', win: true, k: 0, d: 0, a: 22, teamKills: 28, dmgDealt: 8, dmgTaken: 30, tower: 'low', badges: [] } },
  { id: 'fighter', label: 'Đấu sĩ Đẩy lẻ', state: { role: 'fighter', win: true, k: 7, d: 3, a: 6, teamKills: 22, dmgDealt: 24, dmgTaken: 28, tower: 'super', badges: ['firstBlood'] } },
  { id: 'feed', label: 'Feed nhưng cố gắng', state: { role: 'carry', win: false, k: 6, d: 11, a: 7, teamKills: 20, dmgDealt: 30, dmgTaken: 20, tower: 'mid', badges: [] } },
]
