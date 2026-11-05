import { useMemo, useRef, useState } from 'react'
import {
  Crosshair, Swords, Shield, HeartHandshake, ShieldHalf, Trophy, Skull, Zap, Calculator,
  CheckCircle2, XCircle, AlertTriangle, Github, RotateCcw, Flame, Lock, Unlock,
} from 'lucide-react'
import {
  ROLES, TOWER_LEVELS, BADGES, PRESETS, DEFAULT_STATE, RANK_COLORS, RANK_DESC, calcRating,
} from './lib/rating.js'

const ROLE_ICONS = { carry: Crosshair, assassin: Swords, fighter: Shield, support: HeartHandshake, tank: ShieldHalf }

function Slider({ label, value, min, max, onChange, color = '#06B6D4', suffix = '' }) {
  const pct = ((value - min) / (max - min)) * 100
  return (
    <div>
      <div className="mb-2 flex items-baseline justify-between text-sm">
        <span className="text-slate-300">{label}</span>
        <span className="font-display text-xl font-bold tabular-nums" style={{ color }}>{value}{suffix}</span>
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

function Section({ no, title, children }) {
  return (
    <section className="space-y-4">
      <h3 className="flex items-baseline gap-3 border-b border-white/10 pb-2 font-display text-sm font-semibold uppercase tracking-[0.2em] text-slate-300">
        <span className="text-gold-500">{no}</span>{title}
      </h3>
      {children}
    </section>
  )
}

function Gates({ title, tier, gates, achieved }) {
  const ok = gates.every((g) => g.ok)
  return (
    <div>
      <div className="mb-2 flex items-center justify-between border-b border-white/10 pb-2">
        <span className="flex items-center gap-2 font-display text-lg font-bold" style={{ color: RANK_COLORS[tier] }}>
          {ok ? <Unlock size={15} /> : <Lock size={15} />} {title}
        </span>
        <span className={`text-xs font-semibold ${ok ? 'text-emerald-400' : 'text-slate-400'}`}>
          {ok ? (achieved ? 'ĐÃ ĐẠT' : 'ĐỦ ĐIỀU KIỆN') : `${gates.filter((g) => g.ok).length}/${gates.length}`}
        </span>
      </div>
      <ul className="space-y-2">
        {gates.map((g) => (
          <li key={g.label} className="flex items-start gap-2 text-sm">
            {g.ok
              ? <CheckCircle2 size={16} className="mt-0.5 shrink-0 text-emerald-400" />
              : <XCircle size={16} className="mt-0.5 shrink-0 text-red-400" />}
            <span className="text-slate-200">{g.label} <span className="text-slate-500">— {g.detail}</span></span>
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
    <div className="space-y-10">
      {stale && (
        <div className="flex items-center gap-2 text-sm text-amber-300">
          <AlertTriangle size={15} /> Thông số đã thay đổi — bấm "Tính toán lại" để cập nhật kết quả.
        </div>
      )}

      {/* Hero: no box, just type */}
      <div>
        <div className="flex flex-wrap items-end gap-x-12 gap-y-6">
          <div>
            <div className="text-xs uppercase tracking-[0.25em] text-slate-400">Hạng</div>
            <div
              className={`font-display text-[9rem] font-extrabold leading-[0.9] sm:text-[12rem] ${isSSS ? 'bg-gradient-to-r from-red-500 to-amber-400 bg-clip-text text-transparent' : ''}`}
              style={isSSS ? { filter: 'drop-shadow(0 0 28px rgba(239,68,68,0.7))' } : { color, textShadow: tier === 'SS' || tier === 'S' ? `0 0 36px ${color}88` : undefined }}>
              {tier}
            </div>
            <div className="mt-1 font-display text-lg font-semibold uppercase tracking-[0.3em]" style={{ color: isSSS ? '#F59E0B' : color }}>
              {RANK_DESC[tier]}
            </div>
          </div>

          <div className="flex gap-10 pb-2">
            <div>
              <div className="text-xs uppercase tracking-[0.25em] text-slate-400">Điểm</div>
              <div className="font-display text-6xl font-bold tabular-nums text-white">{res.rating.toFixed(1)}</div>
              {softCapped && <div className="text-xs text-slate-500">thô {res.rawTotal.toFixed(1)} → nén</div>}
            </div>
            <div>
              <div className="text-xs uppercase tracking-[0.25em] text-slate-400">KDA thuần</div>
              <div className="font-display text-6xl font-bold tabular-nums text-white">{res.rawKda.toFixed(2)}</div>
              <div className="text-xs text-slate-500">{s.k} / {s.d} / {s.a}</div>
            </div>
          </div>
        </div>

        {res.perfect && (
          <span className="perfect-glow mt-4 inline-flex items-center gap-1.5 rounded-full bg-gold-500 px-4 py-1 text-xs font-bold tracking-widest text-ink-950">
            <Flame size={13} /> PERFECT KDA
          </span>
        )}
        {rank.reason && (
          <p className="mt-4 flex items-start gap-2 text-sm text-amber-300">
            <AlertTriangle size={16} className="mt-0.5 shrink-0" /> {rank.reason}
          </p>
        )}
        {tier === 'C' && (
          <p className="mt-4 flex items-center gap-2 text-sm text-red-300">
            <AlertTriangle size={16} /> Điểm quá thấp có thể bị trừ uy tín.
          </p>
        )}

        <div className="mt-6">
          <div className="mb-2 flex justify-between text-sm">
            <span className="text-slate-300">Tỷ lệ tham gia giao tranh (KP%)</span>
            <span className="font-display text-lg font-bold text-cyan-400">{res.kp.toFixed(0)}%</span>
          </div>
          <div className="h-2.5 overflow-hidden rounded-full bg-white/10">
            <div className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-cyan-300 transition-all duration-500" style={{ width: `${res.kp}%` }} />
          </div>
        </div>
      </div>

      <Section no="A" title="Điều kiện mở khoá hạng">
        <div className="grid gap-x-10 gap-y-8 xl:grid-cols-3">
          <Gates title="Hạng SSS" tier="SSS" gates={rank.gates.sss} achieved={tier === 'SSS'} />
          <Gates title="Hạng SS" tier="SS" gates={rank.gates.ss} achieved={tier === 'SS'} />
          <Gates title="Hạng S" tier="S" gates={rank.gates.s} achieved={tier === 'S'} />
        </div>
      </Section>

      <Section no="B" title="Phân rã điểm số">
        <div className="grid gap-x-10 gap-y-4 md:grid-cols-2">
          <div className="flex justify-between text-sm md:col-span-2">
            <span className="text-slate-300">Điểm nền ({s.win ? 'Thắng' : 'Thua'})</span>
            <span className="font-semibold tabular-nums text-slate-400">+{b.base.toFixed(2)}</span>
          </div>
          {rows.map((r) => (
            <div key={r.label}>
              <div className="mb-1.5 flex justify-between text-sm">
                <span className="text-slate-300">{r.label}</span>
                <span className="font-semibold tabular-nums" style={{ color: r.color }}>{r.v >= 0 ? '+' : ''}{r.v.toFixed(2)}</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-white/10">
                <div className="h-full rounded-full transition-all duration-500" style={{ width: `${(Math.abs(r.v) / maxAbs) * 100}%`, background: r.color }} />
              </div>
            </div>
          ))}
        </div>
        <p className="text-xs text-slate-500">
          Tổng thô {res.rawTotal.toFixed(2)}{softCapped ? ' → soft-cap trên 11.0' : ''} → kẹp trong khoảng 3.0 – 16.0.
        </p>
      </Section>
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

  const formCls = res
    ? 'space-y-9'
    : 'grid gap-x-12 gap-y-10 md:grid-cols-2 xl:grid-cols-4'

  return (
    <div className="flex min-h-screen w-full flex-col">
      <header className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 px-5 py-4 lg:px-10">
        <div className="flex items-baseline gap-4">
          <h1 className="font-display text-2xl font-bold text-white sm:text-3xl">
            AOV True KDA & <span className="bg-gradient-to-r from-gold-400 to-gold-600 bg-clip-text text-transparent">MVP Rating</span> Simulator
          </h1>
          <span className="hidden text-xs uppercase tracking-[0.3em] text-slate-500 md:inline">Liên Quân Mobile</span>
        </div>
        <a href="https://github.com/poalninhphuoc/aov-mvp-simulator" target="_blank" rel="noreferrer"
           className="flex items-center gap-2 text-sm text-slate-400 transition hover:text-white">
          <Github size={16} /> GitHub
        </a>
      </header>

      <main className={`flex-1 ${res ? 'grid lg:grid-cols-[minmax(380px,5fr)_7fr]' : ''}`}>
        {/* ===== Controls ===== */}
        <div className={`px-5 py-8 lg:px-10 ${res ? 'lg:border-r lg:border-white/10' : ''}`}>
          <div className={formCls}>
            <Section no="01" title="Vai trò">
              <div className="grid grid-cols-5 gap-1.5">
                {Object.entries(ROLES).map(([id, r]) => {
                  const Icon = ROLE_ICONS[id]
                  const active = s.role === id
                  return (
                    <button key={id} onClick={() => set({ role: id })} title={`${r.label} — ${r.hint}`}
                      className={`flex flex-col items-center gap-1 rounded-lg px-1 py-3 text-center transition ${
                        active ? 'bg-gold-500/20 text-gold-400' : 'text-slate-400 hover:bg-white/5 hover:text-slate-200'}`}>
                      <Icon size={20} />
                      <span className="text-[11px] font-medium leading-tight">{r.label}</span>
                    </button>
                  )
                })}
              </div>
              <p className="text-xs text-slate-500">{ROLES[s.role].hint}</p>

              <div className="grid grid-cols-2 gap-1.5 pt-2">
                <button onClick={() => set({ win: true })}
                  className={`flex items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-semibold transition ${s.win ? 'bg-gold-500 text-ink-950' : 'text-slate-400 hover:bg-white/5 hover:text-white'}`}>
                  <Trophy size={16} /> Thắng
                </button>
                <button onClick={() => set({ win: false })}
                  className={`flex items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-semibold transition ${!s.win ? 'bg-slate-600 text-white' : 'text-slate-400 hover:bg-white/5 hover:text-white'}`}>
                  <Skull size={16} /> Thua
                </button>
              </div>
            </Section>

            <Section no="02" title="K / D / A & Đội">
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
            </Section>

            <Section no="03" title="Đóng góp">
              <Slider label="% Sát thương lên tướng" value={s.dmgDealt} min={0} max={60} suffix="%" onChange={(dmgDealt) => set({ dmgDealt })} color="#F59E0B" />
              <Slider label="% Sát thương gánh chịu" value={s.dmgTaken} min={0} max={60} suffix="%" onChange={(dmgTaken) => set({ dmgTaken })} color="#06B6D4" />
              <div>
                <div className="mb-2 text-sm text-slate-300">Đẩy trụ / Mục tiêu lớn</div>
                <div className="grid grid-cols-2 gap-1.5">
                  {TOWER_LEVELS.map((t) => (
                    <button key={t.id} onClick={() => set({ tower: t.id })}
                      className={`rounded-lg py-2 text-xs font-medium transition ${s.tower === t.id ? 'bg-cyan-400/20 text-cyan-300' : 'text-slate-400 hover:bg-white/5'}`}>
                      {t.label} <span className="opacity-60">({t.bonus > 0 ? `+${t.bonus}` : '0'}đ)</span>
                    </button>
                  ))}
                </div>
              </div>
            </Section>

            <Section no="04" title="Huy hiệu & Preset">
              <div className="space-y-1">
                {BADGES.map((bd) => {
                  const on = s.badges.includes(bd.id)
                  return (
                    <label key={bd.id}
                      className={`flex cursor-pointer items-center justify-between gap-2 rounded-lg px-3 py-2 text-sm transition ${on ? 'bg-gold-500/15 text-gold-400' : 'text-slate-300 hover:bg-white/5'}`}>
                      <span className="flex items-center gap-2">
                        <input type="checkbox" checked={on} onChange={() => toggleBadge(bd.id)} className="accent-amber-500" />
                        {bd.label}
                      </span>
                      <span className="text-xs opacity-70">+{bd.bonus}đ</span>
                    </label>
                  )
                })}
              </div>
              <div className="flex flex-wrap gap-2 pt-2">
                {PRESETS.map((p) => (
                  <button key={p.id} onClick={() => { setS(p.state); calculate(p.state) }}
                    className="flex items-center gap-1.5 rounded-full bg-cyan-400/10 px-3 py-1.5 text-xs font-medium text-cyan-300 transition hover:bg-cyan-400/20">
                    <Zap size={12} /> {p.label}
                  </button>
                ))}
                <button onClick={() => { setS(DEFAULT_STATE); setSubmitted(null) }}
                  className="flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs text-slate-400 transition hover:text-white">
                  <RotateCcw size={12} /> Đặt lại
                </button>
              </div>
            </Section>
          </div>

          <button onClick={() => calculate()}
            className="mt-10 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-gold-500 to-gold-600 py-4 font-display text-xl font-bold uppercase tracking-[0.2em] text-ink-950 transition hover:brightness-110 active:scale-[0.995]">
            <Calculator size={22} /> {res ? 'Tính toán lại' : 'Tính toán'}
          </button>
        </div>

        {/* ===== Results ===== */}
        {res && (
          <div ref={resultRef} className="scroll-mt-4 px-5 py-8 lg:sticky lg:top-0 lg:max-h-screen lg:self-start lg:overflow-y-auto lg:px-12">
            <Dashboard s={submitted} res={res} stale={stale} />
          </div>
        )}
      </main>

      <footer className="border-t border-white/10 px-5 py-4 text-center text-xs text-slate-500 lg:px-10">
        Công cụ mô phỏng không chính thức, không liên kết với Garena / Tencent. Công thức chỉ mang tính tham khảo.
      </footer>
    </div>
  )
}
