import { useMemo, useState } from 'react'
import {
  Crosshair, Swords, Shield, HeartHandshake, ShieldHalf, Trophy, Skull, Zap,
  Lightbulb, AlertTriangle, CheckCircle2, Info, Github, RotateCcw, Sparkles, Flame,
} from 'lucide-react'
import { ROLES, TOWER_LEVELS, BADGES, PRESETS, DEFAULT_STATE, calcRating, getInsights } from './lib/rating.js'

const ROLE_ICONS = { carry: Crosshair, assassin: Swords, fighter: Shield, support: HeartHandshake, tank: ShieldHalf }

function Slider({ label, value, min, max, onChange, color = '#06B6D4', suffix = '' }) {
  const pct = ((value - min) / (max - min)) * 100
  return (
    <div>
      <div className="mb-2 flex items-center justify-between text-sm">
        <span className="text-slate-300">{label}</span>
        <span className="font-display text-lg font-bold" style={{ color }}>{value}{suffix}</span>
      </div>
      <input
        type="range" min={min} max={max} value={value} className="w-full"
        style={{ '--c': color, '--p': `${pct}%` }}
        onChange={(e) => onChange(Number(e.target.value))}
        aria-label={label}
      />
    </div>
  )
}

function Section({ title, children }) {
  return (
    <div className="space-y-4">
      <h3 className="font-display text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">{title}</h3>
      {children}
    </div>
  )
}

const INSIGHT_STYLE = {
  good: { Icon: CheckCircle2, cls: 'text-emerald-400 border-emerald-400/20 bg-emerald-400/5' },
  warn: { Icon: AlertTriangle, cls: 'text-amber-400 border-amber-400/20 bg-amber-400/5' },
  info: { Icon: Info, cls: 'text-cyan-400 border-cyan-400/20 bg-cyan-400/5' },
}

export default function App() {
  const [s, setS] = useState(DEFAULT_STATE)
  const set = (patch) => setS((p) => ({ ...p, ...patch }))
  const res = useMemo(() => calcRating(s), [s])
  const insights = useMemo(() => getInsights(s, res), [s, res])

  const setK = (k) => set({ k, teamKills: Math.max(s.teamKills, k) })
  const toggleBadge = (id) =>
    set({ badges: s.badges.includes(id) ? s.badges.filter((b) => b !== id) : [...s.badges, id] })

  const { rank } = res
  const mvpColor = rank.mvp === 'lose' ? '#8B5CF6' : '#F59E0B'
  const scoreColor = rank.mvp ? mvpColor : res.rating >= 7.5 ? '#06B6D4' : res.rating >= 5.5 ? '#94A3B8' : '#EF4444'

  // Breakdown
  const b = res.breakdown
  const rows = [
    { label: 'Điểm nền', v: b.base, color: '#94A3B8' },
    { label: 'K/D/A (theo vai trò)', v: b.kda, color: '#F59E0B' },
    { label: 'Tham gia giao tranh (KP%)', v: b.kp, color: '#06B6D4' },
    { label: 'Sát thương & Chống chịu', v: b.combat, color: '#8B5CF6' },
    { label: 'Đẩy trụ & Huy hiệu', v: b.objectives, color: '#10B981' },
    { label: 'Phạt nằm xuống', v: b.deathPenalty, color: '#EF4444' },
  ]
  const maxAbs = Math.max(...rows.map((r) => Math.abs(r.v)), 1)

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <header className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="mb-1 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.3em] text-gold-500">
            <Sparkles size={14} /> Arena of Valor · Liên Quân Mobile
          </div>
          <h1 className="font-display text-3xl font-bold text-white sm:text-4xl">
            AOV KDA & <span className="bg-gradient-to-r from-gold-400 to-gold-600 bg-clip-text text-transparent">MVP Rating</span> Simulator
          </h1>
          <p className="mt-1 text-sm text-slate-400">Công cụ phân tích & mô phỏng điểm MVP — mã nguồn mở, công thức minh bạch.</p>
        </div>
        <a href="https://github.com/" target="_blank" rel="noreferrer"
           className="flex items-center gap-2 rounded-lg border border-white/10 px-3 py-2 text-sm text-slate-300 transition hover:bg-white/5">
          <Github size={16} /> GitHub
        </a>
      </header>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* ===== Left: controls ===== */}
        <div className="glass space-y-7 p-5 sm:p-6">
          <Section title="Vai trò">
            <div className="grid grid-cols-5 gap-2">
              {Object.entries(ROLES).map(([id, r]) => {
                const Icon = ROLE_ICONS[id]
                const active = s.role === id
                return (
                  <button key={id} onClick={() => set({ role: id })} title={`${r.label} — ${r.hint}`}
                    className={`flex flex-col items-center gap-1 rounded-xl border px-1 py-3 text-center transition-all ${
                      active ? 'border-gold-500 bg-gold-500/15 text-gold-400 shadow-lg shadow-gold-500/10' : 'border-white/10 text-slate-400 hover:border-white/25 hover:text-slate-200'}`}>
                    <Icon size={20} />
                    <span className="text-[11px] font-medium leading-tight">{r.label}</span>
                  </button>
                )
              })}
            </div>
            <p className="text-xs text-slate-500">{ROLES[s.role].hint}</p>
          </Section>

          <Section title="Kết quả trận đấu">
            <div className="grid grid-cols-2 gap-2 rounded-xl bg-black/30 p-1">
              <button onClick={() => set({ win: true })}
                className={`flex items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-semibold transition ${s.win ? 'bg-gold-500 text-ink-950' : 'text-slate-400 hover:text-white'}`}>
                <Trophy size={16} /> Thắng
              </button>
              <button onClick={() => set({ win: false })}
                className={`flex items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-semibold transition ${!s.win ? 'bg-neon text-white' : 'text-slate-400 hover:text-white'}`}>
                <Skull size={16} /> Thua
              </button>
            </div>
          </Section>

          <Section title="Chỉ số K / D / A">
            <Slider label="Hạ gục (K)" value={s.k} min={0} max={30} onChange={setK} color="#F59E0B" />
            <Slider label="Bị hạ gục (D)" value={s.d} min={0} max={20} onChange={(d) => set({ d })} color="#EF4444" />
            <Slider label="Phụ trợ (A)" value={s.a} min={0} max={40} onChange={(a) => set({ a })} color="#06B6D4" />
            <Slider label="Tổng mạng toàn đội" value={res.teamKills} min={Math.max(1, s.k)} max={60}
              onChange={(teamKills) => set({ teamKills })} color="#8B5CF6" />
          </Section>

          <Section title="Đóng góp (% Share)">
            <Slider label="% Sát thương gây ra lên tướng" value={s.dmgDealt} min={0} max={60} suffix="%" onChange={(dmgDealt) => set({ dmgDealt })} color="#F59E0B" />
            <Slider label="% Sát thương gánh chịu" value={s.dmgTaken} min={0} max={60} suffix="%" onChange={(dmgTaken) => set({ dmgTaken })} color="#06B6D4" />
            <div>
              <div className="mb-2 text-sm text-slate-300">Sát thương công trình / Đẩy trụ</div>
              <div className="grid grid-cols-4 gap-2">
                {TOWER_LEVELS.map((t) => (
                  <button key={t.id} onClick={() => set({ tower: t.id })}
                    className={`rounded-lg border py-2 text-xs font-medium transition ${s.tower === t.id ? 'border-cyan-400 bg-cyan-400/15 text-cyan-300' : 'border-white/10 text-slate-400 hover:border-white/25'}`}>
                    {t.label}
                  </button>
                ))}
              </div>
            </div>
          </Section>

          <Section title="Huy hiệu & Mục tiêu lớn">
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {BADGES.map((bd) => {
                const on = s.badges.includes(bd.id)
                return (
                  <label key={bd.id}
                    className={`flex cursor-pointer items-center justify-between gap-2 rounded-lg border px-3 py-2 text-sm transition ${on ? 'border-gold-500/60 bg-gold-500/10 text-gold-400' : 'border-white/10 text-slate-300 hover:border-white/25'}`}>
                    <span className="flex items-center gap-2">
                      <input type="checkbox" checked={on} onChange={() => toggleBadge(bd.id)} className="accent-amber-500" />
                      {bd.label}
                    </span>
                    <span className="text-xs opacity-70">+{bd.bonus}đ</span>
                  </label>
                )
              })}
            </div>
          </Section>

          <Section title="Mẫu nhanh">
            <div className="flex flex-wrap gap-2">
              {PRESETS.map((p) => (
                <button key={p.id} onClick={() => setS(p.state)}
                  className="flex items-center gap-1.5 rounded-full border border-cyan-400/30 bg-cyan-400/10 px-3 py-1.5 text-xs font-medium text-cyan-300 transition hover:bg-cyan-400/20">
                  <Zap size={12} /> {p.label}
                </button>
              ))}
              <button onClick={() => setS(DEFAULT_STATE)}
                className="flex items-center gap-1.5 rounded-full border border-white/10 px-3 py-1.5 text-xs text-slate-400 transition hover:text-white">
                <RotateCcw size={12} /> Đặt lại
              </button>
            </div>
          </Section>
        </div>

        {/* ===== Right: dashboard ===== */}
        <div className="space-y-6 lg:sticky lg:top-6 lg:self-start">
          <div className="glass relative overflow-hidden p-5 sm:p-6"
               style={{ boxShadow: rank.mvp ? `0 0 60px -15px ${mvpColor}88` : undefined }}>
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="text-xs uppercase tracking-[0.2em] text-slate-400">KDA thuần</div>
                <div className="font-display text-6xl font-bold text-white transition-all">{res.rawKda.toFixed(2)}</div>
                {res.perfect && (
                  <span className="perfect-glow mt-2 inline-flex items-center gap-1 rounded-full bg-gold-500 px-3 py-1 text-xs font-bold tracking-widest text-ink-950">
                    <Flame size={12} /> PERFECT KDA
                  </span>
                )}
                <div className="mt-2 text-xs text-slate-500">{s.k} / {s.d} / {s.a}</div>
              </div>

              <div className="text-right">
                <div className="text-xs uppercase tracking-[0.2em] text-slate-400">Điểm trận đấu</div>
                <div className="font-display text-6xl font-bold transition-colors" style={{ color: scoreColor }}>
                  {res.rating.toFixed(1)}
                </div>
                <div className="mt-1 flex items-center justify-end gap-2">
                  <span className="rounded-md border px-2 py-0.5 font-display text-lg font-bold"
                        style={{ color: scoreColor, borderColor: scoreColor }}>{rank.tier}</span>
                  <span className="text-sm text-slate-300">{rank.desc}</span>
                </div>
              </div>
            </div>

            {rank.mvp && (
              <div className="mt-4 flex items-center justify-center gap-2 rounded-xl border py-2.5 font-display text-lg font-bold uppercase tracking-widest"
                   style={{ color: mvpColor, borderColor: `${mvpColor}66`, background: `${mvpColor}14` }}>
                <Trophy size={18} /> {rank.title}
              </div>
            )}
            {rank.tier === 'C' && (
              <div className="mt-4 flex items-center gap-2 rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-300">
                <AlertTriangle size={16} /> {rank.desc}
              </div>
            )}

            <div className="mt-5">
              <div className="mb-1.5 flex justify-between text-sm">
                <span className="text-slate-300">Tỷ lệ tham gia giao tranh (KP%)</span>
                <span className="font-display font-bold text-cyan-400">{res.kp.toFixed(0)}%</span>
              </div>
              <div className="h-2.5 overflow-hidden rounded-full bg-white/10">
                <div className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-cyan-300 transition-all duration-500"
                     style={{ width: `${res.kp}%` }} />
              </div>
            </div>
          </div>

          <div className="glass p-5 sm:p-6">
            <h3 className="mb-4 font-display text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Phân rã điểm số</h3>
            <div className="space-y-3">
              {rows.map((r) => (
                <div key={r.label}>
                  <div className="mb-1 flex justify-between text-xs">
                    <span className="text-slate-300">{r.label}</span>
                    <span className="font-semibold" style={{ color: r.color }}>{r.v >= 0 ? '+' : ''}{r.v.toFixed(2)}</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-white/10">
                    <div className="h-full rounded-full transition-all duration-500"
                         style={{ width: `${(Math.abs(r.v) / maxAbs) * 100}%`, background: r.color }} />
                  </div>
                </div>
              ))}
            </div>
            <p className="mt-4 text-[11px] text-slate-500">
              Tổng thô {(rows.reduce((t, r) => t + r.v, 0)).toFixed(2)} → kẹp trong khoảng 3.0 – 16.0.
            </p>
          </div>

          <div className="glass p-5 sm:p-6">
            <h3 className="mb-4 flex items-center gap-2 font-display text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
              <Lightbulb size={14} className="text-gold-500" /> Góc tư vấn chiến thuật
            </h3>
            <ul className="space-y-2">
              {insights.map((i, idx) => {
                const { Icon, cls } = INSIGHT_STYLE[i.type]
                return (
                  <li key={idx} className={`flex gap-2.5 rounded-lg border p-3 text-sm ${cls}`}>
                    <Icon size={16} className="mt-0.5 shrink-0" />
                    <span className="text-slate-200">{i.text}</span>
                  </li>
                )
              })}
            </ul>
          </div>
        </div>
      </div>

      <footer className="mt-10 text-center text-xs text-slate-500">
        Công cụ mô phỏng không chính thức, không liên kết với Garena / Tencent. Công thức chỉ mang tính tham khảo.
      </footer>
    </div>
  )
}
