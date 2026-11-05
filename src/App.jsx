import { useMemo, useRef, useState } from 'react'
import {
  Crosshair, Swords, Shield, HeartHandshake, ShieldHalf, Trophy, Skull, Zap,
  Calculator, CheckCircle2, XCircle, AlertTriangle, Github, RotateCcw, Sparkles, Flame, Lock, Unlock,
} from 'lucide-react'
import {
  ROLES, TOWER_LEVELS, BADGES, PRESETS, DEFAULT_STATE, RANK_COLORS, RANK_DESC, calcRating,
} from './lib/rating.js'

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

function GateList({ title, tier, gates, achieved }) {
  const ok = gates.every((g) => g.ok)
  return (
    <div className="rounded-xl border border-white/10 bg-black/20 p-3">
      <div className="mb-2 flex items-center justify-between">
        <span className="flex items-center gap-2 font-display text-sm font-bold" style={{ color: RANK_COLORS[tier] }}>
          {ok ? <Unlock size={14} /> : <Lock size={14} />} {title}
        </span>
        <span className={`text-xs font-semibold ${ok ? 'text-emerald-400' : 'text-red-400'}`}>
          {ok ? (achieved ? 'ĐÃ ĐẠT' : 'ĐỦ ĐIỀU KIỆN') : `${gates.filter((g) => g.ok).length}/${gates.length}`}
        </span>
      </div>
      <ul className="space-y-1.5">
        {gates.map((g) => (
          <li key={g.label} className="flex items-start gap-2 text-xs">
            {g.ok
              ? <CheckCircle2 size={14} className="mt-0.5 shrink-0 text-emerald-400" />
              : <XCircle size={14} className="mt-0.5 shrink-0 text-red-400" />}
            <span className={g.ok ? 'text-slate-300' : 'text-slate-200'}>
              {g.label} <span className="text-slate-500">— {g.detail}</span>
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}

function Dashboard({ s, res, stale }) {
  const { rank } = res
  const tier = rank.tier
  const color = RANK_COLORS[tier]
  const isSSS = tier === 'SSS'

  const b = res.breakdown
  const rows = [
    { label: 'K/D/A (+ chết 0 mạng)', v: b.kda, color: '#F59E0B' },
    { label: 'Tham gia giao tranh (KP%)', v: b.kp, color: '#06B6D4' },
    { label: 'Sát thương gây ra', v: b.dmg, color: '#EF4444' },
    { label: 'Chống chịu', v: b.tank, color: '#8B5CF6' },
    { label: 'Mục tiêu & Huy hiệu', v: b.objectives, color: '#10B981' },
    { label: 'Phạt nằm xuống', v: b.deathPenalty, color: '#F87171' },
  ]
  const maxAbs = Math.max(...rows.map((r) => Math.abs(r.v)), 1)
  const softCapped = res.rawTotal > 11

  return (
        <div className="space-y-6 lg:sticky lg:top-6 lg:self-start">
          {stale && (
            <div className="flex items-start gap-2 rounded-xl border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-200">
              <AlertTriangle size={14} className="mt-0.5 shrink-0" /> Thông số đã thay đổi — bấm "Tính toán" để cập nhật kết quả.
            </div>
          )}
          {/* Hero */}
          <div className="glass relative overflow-hidden p-5 sm:p-6 transition-shadow duration-500"
               style={{ boxShadow: tier === 'SSS' || tier === 'SS' || tier === 'S' ? `0 0 ${isSSS ? 80 : 45}px -12px ${color}` : undefined }}>
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="text-xs uppercase tracking-[0.2em] text-slate-400">KDA thuần</div>
                <div className="font-display text-5xl font-bold text-white sm:text-6xl">{res.rawKda.toFixed(2)}</div>
                {res.perfect && (
                  <span className="perfect-glow mt-2 inline-flex items-center gap-1 rounded-full bg-gold-500 px-3 py-1 text-xs font-bold tracking-widest text-ink-950">
                    <Flame size={12} /> PERFECT KDA
                  </span>
                )}
                <div className="mt-2 text-xs text-slate-500">{s.k} / {s.d} / {s.a}</div>
              </div>

              <div className="text-right">
                <div className="text-xs uppercase tracking-[0.2em] text-slate-400">Điểm đánh giá</div>
                <div className="font-display text-5xl font-bold text-white sm:text-6xl">{res.rating.toFixed(1)}</div>
                {softCapped && <div className="text-[11px] text-slate-500">thô {res.rawTotal.toFixed(1)} → nén</div>}
              </div>
            </div>

            <div className="mt-5 flex items-center justify-center gap-4 rounded-xl border py-4 transition-all duration-500"
                 style={{ borderColor: `${color}66`, background: isSSS ? 'linear-gradient(90deg,#EF444422,#F59E0B22)' : `${color}14` }}>
              <span
                className={`font-display text-6xl font-extrabold leading-none ${isSSS ? 'bg-gradient-to-r from-red-500 to-amber-400 bg-clip-text text-transparent' : ''}`}
                style={isSSS ? { filter: 'drop-shadow(0 0 14px #EF4444)' } : { color, textShadow: tier === 'SS' ? `0 0 18px ${color}` : undefined }}>
                {tier}
              </span>
              <span className="text-left text-sm font-semibold uppercase tracking-widest" style={{ color: isSSS ? '#F59E0B' : color }}>
                {RANK_DESC[tier]}
              </span>
            </div>

            {rank.reason && (
              <div className="mt-3 flex items-start gap-2 rounded-xl border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-200">
                <AlertTriangle size={14} className="mt-0.5 shrink-0" /> {rank.reason}
              </div>
            )}
            {tier === 'C' && (
              <div className="mt-3 flex items-center gap-2 rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-300">
                <AlertTriangle size={14} /> Điểm quá thấp có thể bị trừ uy tín.
              </div>
            )}

            <div className="mt-5">
              <div className="mb-1.5 flex justify-between text-sm">
                <span className="text-slate-300">Tỷ lệ tham gia giao tranh (KP%)</span>
                <span className="font-display font-bold text-cyan-400">{res.kp.toFixed(0)}%</span>
              </div>
              <div className="h-2.5 overflow-hidden rounded-full bg-white/10">
                <div className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-cyan-300 transition-all duration-500" style={{ width: `${res.kp}%` }} />
              </div>
            </div>
          </div>

          {/* Gatekeeper */}
          <div className="glass p-5 sm:p-6">
            <h3 className="mb-4 font-display text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
              Điều kiện mở khoá hạng (Gatekeeper)
            </h3>
            <div className="space-y-3">
              <GateList title="Hạng SSS" tier="SSS" gates={rank.gates.sss} achieved={tier === 'SSS'} />
              <GateList title="Hạng SS" tier="SS" gates={rank.gates.ss} achieved={tier === 'SS'} />
              <GateList title="Hạng S" tier="S" gates={rank.gates.s} achieved={tier === 'S'} />
            </div>
          </div>

          {/* Breakdown */}
          <div className="glass p-5 sm:p-6">
            <h3 className="mb-4 font-display text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Phân rã điểm số</h3>
            <div className="mb-3 flex justify-between text-xs">
              <span className="text-slate-300">Điểm nền ({s.win ? 'Thắng' : 'Thua'})</span>
              <span className="font-semibold text-slate-400">+{b.base.toFixed(2)}</span>
            </div>
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
              Tổng thô {res.rawTotal.toFixed(2)}{softCapped ? ' → soft-cap trên 11.0' : ''} → kẹp trong khoảng 3.0 – 16.0.
            </p>
          </div>
        </div>
  )
}

export default function App() {
  const [s, setS] = useState(DEFAULT_STATE)
  const [submitted, setSubmitted] = useState(null)
  const set = (patch) => setS((p) => ({ ...p, ...patch }))
  const setK = (k) => set({ k, teamKills: Math.max(s.teamKills, k) })
  const toggleBadge = (id) =>
    set({ badges: s.badges.includes(id) ? s.badges.filter((b) => b !== id) : [...s.badges, id] })

  const res = useMemo(() => (submitted ? calcRating(submitted) : null), [submitted])
  const stale = submitted && JSON.stringify(submitted) !== JSON.stringify(s)
  const resultRef = useRef(null)
  const calculate = (state = s) => {
    setSubmitted(state)
    if (window.matchMedia('(max-width: 1023px)').matches) {
      setTimeout(() => resultRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50)
    }
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <header className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="mb-1 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.3em] text-gold-500">
            <Sparkles size={14} /> Arena of Valor · Liên Quân Mobile
          </div>
          <h1 className="font-display text-3xl font-bold text-white sm:text-4xl">
            AOV True KDA & <span className="bg-gradient-to-r from-gold-400 to-gold-600 bg-clip-text text-transparent">MVP Rating</span> Simulator
          </h1>
          <p className="mt-1 text-sm text-slate-400">Phân tích điểm MVP & xếp hạng S / SS / SSS — mã nguồn mở, công thức minh bạch.</p>
        </div>
        <a href="https://github.com/poalninhphuoc/aov-mvp-simulator" target="_blank" rel="noreferrer"
           className="flex items-center gap-2 rounded-lg border border-white/10 px-3 py-2 text-sm text-slate-300 transition hover:bg-white/5">
          <Github size={16} /> GitHub
        </a>
      </header>

      <div className={res ? 'grid gap-6 lg:grid-cols-2' : 'mx-auto max-w-2xl'}>
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
                className={`flex items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-semibold transition ${!s.win ? 'bg-slate-600 text-white' : 'text-slate-400 hover:text-white'}`}>
                <Skull size={16} /> Thua
              </button>
            </div>
          </Section>

          <Section title="Thông số trận đấu">
            <Slider label="Hạ gục (K)" value={s.k} min={0} max={30} onChange={setK} color="#F59E0B" />
            <Slider label="Bị hạ gục (D)" value={s.d} min={0} max={20} onChange={(d) => set({ d })} color="#EF4444" />
            <Slider label="Phụ trợ (A)" value={s.a} min={0} max={40} onChange={(a) => set({ a })} color="#06B6D4" />
            <div>
              <Slider label="Tổng mạng toàn đội" value={Math.max(1, s.teamKills, s.k)} min={Math.max(1, s.k)} max={60}
                onChange={(teamKills) => set({ teamKills })} color="#8B5CF6" />
              {s.k + s.a > s.teamKills && (
                <p className="mt-2 flex items-center gap-1.5 text-xs text-amber-400">
                  <AlertTriangle size={13} /> K + A ({s.k + s.a}) lớn hơn tổng mạng đội ({s.teamKills}) — KP% bị chặn ở 100%.
                </p>
              )}
            </div>
            <Slider label="% Sát thương lên tướng" value={s.dmgDealt} min={0} max={60} suffix="%" onChange={(dmgDealt) => set({ dmgDealt })} color="#F59E0B" />
            <Slider label="% Sát thương gánh chịu" value={s.dmgTaken} min={0} max={60} suffix="%" onChange={(dmgTaken) => set({ dmgTaken })} color="#06B6D4" />
            <div>
              <div className="mb-2 text-sm text-slate-300">Đẩy trụ / Mục tiêu lớn</div>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                {TOWER_LEVELS.map((t) => (
                  <button key={t.id} onClick={() => set({ tower: t.id })}
                    className={`rounded-lg border py-2 text-xs font-medium transition ${s.tower === t.id ? 'border-cyan-400 bg-cyan-400/15 text-cyan-300' : 'border-white/10 text-slate-400 hover:border-white/25'}`}>
                    {t.label} <span className="opacity-60">({t.bonus > 0 ? `+${t.bonus}` : '0'}đ)</span>
                  </button>
                ))}
              </div>
            </div>
          </Section>

          <Section title="Huy hiệu đột biến">
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

          <Section title="Preset kiểm thử">
            <div className="flex flex-wrap gap-2">
              {PRESETS.map((p) => (
                <button key={p.id} onClick={() => { setS(p.state); calculate(p.state) }}
                  className="flex items-center gap-1.5 rounded-full border border-cyan-400/30 bg-cyan-400/10 px-3 py-1.5 text-xs font-medium text-cyan-300 transition hover:bg-cyan-400/20">
                  <Zap size={12} /> {p.label}
                </button>
              ))}
              <button onClick={() => { setS(DEFAULT_STATE); setSubmitted(null) }}
                className="flex items-center gap-1.5 rounded-full border border-white/10 px-3 py-1.5 text-xs text-slate-400 transition hover:text-white">
                <RotateCcw size={12} /> Đặt lại
              </button>
            </div>
          </Section>

          <button onClick={() => calculate()}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-gold-500 to-gold-600 py-3.5 font-display text-lg font-bold uppercase tracking-widest text-ink-950 shadow-lg shadow-gold-500/20 transition hover:brightness-110 active:scale-[0.99]">
            <Calculator size={20} /> {res ? 'Tính toán lại' : 'Tính toán'}
          </button>
        </div>

        {res && (
          <div ref={resultRef} className="scroll-mt-4 lg:sticky lg:top-6 lg:self-start">
            <Dashboard s={submitted} res={res} stale={stale} />
          </div>
        )}
      </div>

      <footer className="mt-10 text-center text-xs text-slate-500">
        Công cụ mô phỏng không chính thức, không liên kết với Garena / Tencent. Công thức chỉ mang tính tham khảo.
      </footer>
    </div>
  )
}
