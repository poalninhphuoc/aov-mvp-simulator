import { useMemo, useState } from 'react'
import {
  Crosshair, Swords, Shield, HeartHandshake, ShieldHalf, Trophy, Skull, Zap,
  Check, X, AlertTriangle, Github, RotateCcw, Flame, Lock, Unlock,
} from 'lucide-react'
import {
  ROLES, TOWER_LEVELS, BADGES, PRESETS, DEFAULT_STATE, RANK_COLORS, RANK_DESC, calcRating,
} from './lib/rating.js'

const ROLE_ICONS = { carry: Crosshair, assassin: Swords, fighter: Shield, support: HeartHandshake, tank: ShieldHalf }

// Màu chữ hạng (gradient kim loại). SSS/SS/S/A/B/C theo bảng màu yêu cầu.
const TIER_GRADIENT = {
  SSS: 'linear-gradient(135deg,#EF4444 10%,#F59E0B 90%)',
  SS: 'linear-gradient(180deg,#FDE68A,#FBBF24 60%,#F59E0B)',
  S: 'linear-gradient(180deg,#FBBF24,#D97706 70%)',
  A: 'linear-gradient(180deg,#D8B4FE,#A855F7 70%)',
  B: 'linear-gradient(180deg,#93C5FD,#3B82F6 70%)',
  C: 'linear-gradient(180deg,#9CA3AF,#6B7280 70%)',
}

// Thang điểm: các ngưỡng hạng (khớp getRank trong rating.js)
const ZONES = [
  { tier: 'C', from: 3, to: 5.5 },
  { tier: 'B', from: 5.5, to: 7.8 },
  { tier: 'A', from: 7.8, to: 10 },
  { tier: 'S', from: 10, to: 12.3 },
  { tier: 'SS', from: 12.3, to: 14.2 },
  { tier: 'SSS', from: 14.2, to: 16 },
]

// Bảng màu biểu đồ phân rã: đã chạy validate_palette (dark): 6/6 PASS
const SERIES = {
  kda: '#3987e5',
  kp: '#d95926',
  dmg: '#199e70',
  tank: '#c98500',
  obj: '#9085e9',
  pen: '#e66767',
}

function Slider({ label, value, min, max, onChange, color = '#06B6D4', suffix = '' }) {
  const pct = ((value - min) / (max - min)) * 100
  // Chuỗi đang gõ: cho phép xoá trống / gõ lại từ đầu; chốt về giá trị hợp lệ khi rời ô.
  const [draft, setDraft] = useState(null)
  return (
    <div>
      <div className="mb-2.5 flex items-center justify-between text-[13px]">
        <span className="text-slate-400">{label}</span>
        <span className="flex items-baseline gap-0.5">
          <input
            type="number" min={min} max={max} value={draft ?? value} aria-label={`${label} (nhập số)`}
            onFocus={(e) => e.target.select()}
            onMouseUp={(e) => e.preventDefault()}
            onBlur={() => setDraft(null)}
            onKeyDown={(e) => { if (e.key === 'Enter') e.currentTarget.blur() }}
            onChange={(e) => {
              const raw = e.target.value
              setDraft(raw)
              if (raw === '' || Number.isNaN(Number(raw))) return
              onChange(Math.min(max, Math.max(min, Math.round(Number(raw)))))
            }}
            className="num w-12 rounded bg-white/[0.04] px-1.5 py-0.5 text-right font-display text-lg font-bold tabular-nums text-white outline-none transition focus:bg-white/10 focus:ring-1"
            style={{ '--tw-ring-color': color }}
          />
          {suffix && <span className="text-xs text-slate-500">{suffix}</span>}
          <span className="ml-1.5 inline-block h-1.5 w-1.5 rounded-full" style={{ background: color }} />
        </span>
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

function Section({ no, title, children, className = '' }) {
  return (
    <section className={`space-y-4 ${className}`}>
      <h3 className="flex items-center gap-3 font-display text-[13px] font-semibold uppercase tracking-[0.22em] text-slate-300">
        <span className="font-mono text-[11px] text-gold-500">{no}</span>
        <span>{title}</span>
        <span className="h-px flex-1 bg-white/10" />
      </h3>
      {children}
    </section>
  )
}

function Chip({ active, onClick, children, tone = 'gold', title }) {
  const on = tone === 'cyan' ? 'bg-cyan-400/15 text-cyan-200 ring-cyan-400/40' : 'bg-gold-500/15 text-gold-400 ring-gold-500/40'
  return (
    <button onClick={onClick} title={title}
      className={`flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium ring-1 transition ${
        active ? on : 'text-slate-400 ring-white/10 hover:bg-white/5 hover:text-slate-200'}`}>
      {children}
    </button>
  )
}

function Segmented({ options, value, onChange }) {
  return (
    <div className="inline-flex max-w-full overflow-hidden rounded-lg ring-1 ring-white/10">
      {options.map((o, i) => (
        <button key={String(o.value)} onClick={() => onChange(o.value)}
          className={`flex items-center justify-center gap-1.5 whitespace-nowrap px-3.5 py-1.5 text-xs font-semibold transition ${i > 0 ? 'border-l border-white/10' : ''} ${
            value === o.value ? o.cls : 'text-slate-400 hover:bg-white/5 hover:text-white'}`}>
          {o.icon}
          {o.sub ? (
            <span className="flex flex-col items-center leading-tight">
              {o.label}<span className="text-[10px] font-normal opacity-60">{o.sub}</span>
            </span>
          ) : o.label}
        </button>
      ))}
    </div>
  )
}

function Scoreline({ k, d, a, kda }) {
  const items = [['K', k, '#F59E0B'], ['D', d, '#E66767'], ['A', a, '#06B6D4']]
  return (
    <div className="flex items-stretch">
      {items.map(([l, v, c], i) => (
        <div key={l} className={`flex-1 ${i > 0 ? 'border-l border-white/10 pl-4' : ''}`}>
          <div className="text-[10px] font-semibold uppercase tracking-[0.25em]" style={{ color: c }}>{l}</div>
          <div className="font-display text-4xl font-bold leading-none text-white tabular-nums">{v}</div>
        </div>
      ))}
      <div className="flex-1 border-l border-white/10 pl-4">
        <div className="text-[10px] font-semibold uppercase tracking-[0.25em] text-slate-500">KDA</div>
        <div className="font-display text-4xl font-bold leading-none text-slate-300 tabular-nums">{kda.toFixed(1)}</div>
      </div>
    </div>
  )
}

const PRESET_RESULTS = PRESETS.map((p) => ({ p, r: calcRating(p.state) }))

function Ruler({ rating, tier }) {
  const pos = ((rating - 3) / 13) * 100
  return (
    <div>
      <div className="relative">
        <div className="flex gap-[2px]">
          {ZONES.map((z) => {
            const here = rating >= z.from && (rating < z.to || z.to === 16)
            return (
              <div key={z.tier} style={{ flex: z.to - z.from }} title={`${z.tier}: ${z.from}–${z.to}`}>
                <div className="h-2 rounded-sm transition-opacity"
                     style={{ background: RANK_COLORS[z.tier], opacity: here ? 1 : 0.28 }} />
              </div>
            )
          })}
        </div>
        <div className="absolute top-1/2 -translate-x-1/2 -translate-y-1/2 transition-all duration-500"
             style={{ left: `${pos}%` }}>
          <div className="h-4 w-4 rounded-full border-2 border-white shadow-[0_0_0_2px_#080b14,0_0_16px_var(--tier)]"
               style={{ background: RANK_COLORS[tier] }} />
        </div>
      </div>
      <div className="mt-2 flex gap-[2px] text-[11px] text-slate-500">
        {ZONES.map((z) => (
          <div key={z.tier} style={{ flex: z.to - z.from }} className="flex justify-between">
            <span className="tabular-nums">{z.from}</span>
            <span className="font-semibold" style={{ color: RANK_COLORS[z.tier] }}>{z.tier}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function Gates({ title, tier, gates, achieved }) {
  const passed = gates.filter((g) => g.ok).length
  const ok = passed === gates.length
  return (
    <div>
      <div className="mb-3 flex items-end justify-between">
        <span className="flex items-center gap-2 font-display text-xl font-bold" style={{ color: RANK_COLORS[tier] }}>
          {ok ? <Unlock size={15} /> : <Lock size={15} />} {title}
        </span>
        <span className={`text-[11px] font-semibold tracking-wider ${ok ? 'text-emerald-400' : 'text-slate-500'}`}>
          {ok ? (achieved ? 'ĐÃ ĐẠT' : 'ĐỦ ĐIỀU KIỆN') : `${passed}/${gates.length}`}
        </span>
      </div>
      <div className="mb-3 flex gap-1" aria-hidden="true">
        {gates.map((g, i) => (
          <span key={i} className={`h-1 flex-1 rounded-full ${g.ok ? 'bg-emerald-400' : 'bg-white/10'}`} />
        ))}
      </div>
      <ul className="space-y-2">
        {gates.map((g) => (
          <li key={g.label} className="flex items-start gap-2 text-[13px] leading-snug">
            <span className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full ${g.ok ? 'bg-emerald-400/15 text-emerald-400' : 'bg-red-400/15 text-red-400'}`}>
              {g.ok ? <Check size={11} strokeWidth={3} /> : <X size={11} strokeWidth={3} />}
            </span>
            <span className={g.ok ? 'text-slate-300' : 'text-slate-100'}>
              {g.label} <span className="text-slate-500">· {g.detail}</span>
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}

function Stat({ label, children, sub }) {
  return (
    <div>
      <div className="text-[11px] uppercase tracking-[0.25em] text-slate-500">{label}</div>
      <div className="font-display text-5xl font-bold leading-tight text-white">{children}</div>
      {sub && <div className="text-xs text-slate-500">{sub}</div>}
    </div>
  )
}

function Dashboard({ s, res }) {
  const { rank } = res
  const tier = rank.tier
  const b = res.breakdown
  const rows = [
    { key: 'kda', label: 'K/D/A (+ chết 0 mạng)', v: b.kda },
    { key: 'kp', label: 'Tham gia giao tranh (KP%)', v: b.kp },
    { key: 'dmg', label: 'Sát thương gây ra', v: b.dmg },
    { key: 'tank', label: 'Chống chịu', v: b.tank },
    { key: 'obj', label: 'Mục tiêu & Huy hiệu', v: b.objectives },
    { key: 'pen', label: 'Phạt nằm xuống', v: b.deathPenalty },
  ]
  const positive = rows.filter((r) => r.v > 0).reduce((t, r) => t + r.v, 0) || 1
  const maxAbs = Math.max(...rows.map((r) => Math.abs(r.v)), 0.01)
  const softCapped = res.rawTotal > 11

  return (
    <div className="space-y-12">
      {/* ---- Hero ---- */}
      <div className="rise">
        <div className="flex flex-wrap items-end gap-x-14 gap-y-6">
          <div>
            <div className="text-[11px] uppercase tracking-[0.3em] text-slate-500">Hạng</div>
            <div
              className="font-display text-[9rem] font-extrabold leading-[0.88] sm:text-[12rem]"
              style={{
                backgroundImage: TIER_GRADIENT[tier], WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent',
                filter: `drop-shadow(0 0 ${tier === 'SSS' ? 34 : 22}px ${RANK_COLORS[tier]}99)`,
              }}>
              {tier}
            </div>
            <div className="mt-2 font-display text-lg font-semibold uppercase tracking-[0.35em] text-slate-200">
              {RANK_DESC[tier]}
            </div>
          </div>

          <div className="flex flex-wrap gap-x-12 gap-y-5 pb-2">
            <Stat label="Điểm" sub={softCapped ? `thô ${res.rawTotal.toFixed(1)} → nén` : undefined}>
              {res.rating.toFixed(1)}
            </Stat>
            <Stat label="KDA thuần" sub={`${s.k} / ${s.d} / ${s.a}`}>{res.rawKda.toFixed(2)}</Stat>
            <Stat label="KP%" sub="tham gia giao tranh">
              {res.kp.toFixed(0)}<span className="text-2xl text-slate-500">%</span>
            </Stat>
          </div>
        </div>

        <div className="mt-8 flex flex-wrap items-center gap-3">
          {res.perfect && (
            <span className="perfect-glow inline-flex items-center gap-1.5 rounded-full bg-gold-500 px-3.5 py-1 text-[11px] font-bold tracking-[0.2em] text-ink-950">
              <Flame size={12} /> PERFECT KDA
            </span>
          )}
          {tier === 'C' && (
            <span className="inline-flex items-center gap-1.5 text-sm text-red-300">
              <AlertTriangle size={15} /> Điểm quá thấp có thể bị trừ uy tín.
            </span>
          )}
        </div>
        {rank.reason && (
          <p className="mt-3 flex items-start gap-2 text-sm leading-relaxed text-amber-300">
            <AlertTriangle size={16} className="mt-0.5 shrink-0" /> {rank.reason}
          </p>
        )}

        <div className="mt-8">
          <div className="mb-3 text-[11px] uppercase tracking-[0.3em] text-slate-500">Thang điểm 3.0 – 16.0</div>
          <Ruler rating={res.rating} tier={tier} />
        </div>
      </div>

      {/* ---- Gatekeeper ---- */}
      <Section no="A" title="Điều kiện mở khoá hạng">
        <div className="grid gap-x-12 gap-y-10 xl:grid-cols-3">
          <Gates title="Hạng SSS" tier="SSS" gates={rank.gates.sss} achieved={tier === 'SSS'} />
          <Gates title="Hạng SS" tier="SS" gates={rank.gates.ss} achieved={tier === 'SS'} />
          <Gates title="Hạng S" tier="S" gates={rank.gates.s} achieved={tier === 'S'} />
        </div>
      </Section>

      {/* ---- Breakdown ---- */}
      <Section no="B" title="Phân rã điểm số">
        <div className="flex items-baseline justify-between text-[13px]">
          <span className="text-slate-400">Điểm nền ({s.win ? 'Thắng' : 'Thua'})</span>
          <span className="font-semibold tabular-nums text-slate-300">+{b.base.toFixed(2)}</span>
        </div>

        <ul className="space-y-1">
          {rows.map((r) => {
            const share = r.v > 0 ? (r.v / positive) * 100 : null
            return (
              <li key={r.key} tabIndex={0}
                  className="group grid grid-cols-[minmax(0,13rem)_1fr_4.5rem] items-center gap-4 rounded-md px-2 py-2 outline-none transition hover:bg-white/[0.04] focus-visible:bg-white/[0.06]"
                  title={share != null ? `${r.label}: +${r.v.toFixed(2)} (${share.toFixed(0)}% tổng điểm cộng)` : `${r.label}: ${r.v.toFixed(2)}`}>
                <span className="flex items-center gap-2 text-[13px] text-slate-300">
                  <span className="h-2 w-2 shrink-0 rounded-[2px]" style={{ background: SERIES[r.key] }} />
                  {r.label}
                </span>
                <span className="relative h-2 border-l border-white/20">
                  <span className="absolute inset-y-0 left-0 rounded-r-[4px] transition-all duration-500 group-hover:brightness-125"
                        style={{ width: `${Math.max(1.5, (Math.abs(r.v) / maxAbs) * 100)}%`, background: SERIES[r.key] }} />
                </span>
                <span className="text-right text-[13px] font-semibold tabular-nums text-slate-100">
                  {r.v >= 0 ? '+' : '−'}{Math.abs(r.v).toFixed(2)}
                </span>
              </li>
            )
          })}
        </ul>

        <div className="flex items-baseline justify-between border-t border-white/10 pt-3 text-[13px]">
          <span className="text-slate-400">Tổng thô{softCapped ? ' (soft-cap trên 11.0)' : ''} → kẹp 3.0 – 16.0</span>
          <span className="font-display text-xl font-bold tabular-nums text-white">
            {res.rawTotal.toFixed(2)} <span className="text-slate-500">→</span> {res.rating.toFixed(2)}
          </span>
        </div>

        <details className="text-xs text-slate-500">
          <summary className="cursor-pointer select-none hover:text-slate-300">Xem dạng bảng</summary>
          <table className="mt-2 w-full max-w-md text-left tabular-nums">
            <thead><tr className="text-slate-400"><th className="py-1 font-medium">Thành phần</th><th className="py-1 text-right font-medium">Điểm</th></tr></thead>
            <tbody>
              <tr><td className="py-0.5">Điểm nền</td><td className="text-right">{b.base.toFixed(2)}</td></tr>
              {rows.map((r) => (<tr key={r.key}><td className="py-0.5">{r.label}</td><td className="text-right">{r.v.toFixed(2)}</td></tr>))}
              <tr className="text-slate-300"><td className="pt-1">Tổng thô</td><td className="pt-1 text-right">{res.rawTotal.toFixed(2)}</td></tr>
            </tbody>
          </table>
        </details>
      </Section>
    </div>
  )
}

export default function App() {
  const [s, setS] = useState(DEFAULT_STATE)
  const set = (patch) => setS((p) => ({ ...p, ...patch }))
  const setK = (k) => set({ k, teamKills: Math.max(s.teamKills, k) })
  const toggleBadge = (id) =>
    set({ badges: s.badges.includes(id) ? s.badges.filter((b) => b !== id) : [...s.badges, id] })
  const res = useMemo(() => calcRating(s), [s])

  return (
    <div className="flex min-h-screen w-full flex-col lg:h-screen lg:overflow-hidden"
         style={{ '--tier': RANK_COLORS[res.rank.tier] }}>
      <header className="flex shrink-0 flex-wrap items-center justify-between gap-4 border-b border-white/10 bg-ink-950/70 px-5 py-3.5 backdrop-blur lg:px-10">
        <div className="flex items-center gap-4">
          <div className="flex h-9 w-9 items-center justify-center rounded-md bg-gradient-to-br from-gold-400 to-gold-600 font-display text-lg font-extrabold text-ink-950">A</div>
          <div>
            <h1 className="font-display text-xl font-bold leading-none text-white sm:text-2xl">
              AOV True KDA & <span className="text-gold-500">MVP Rating</span> Simulator
            </h1>
            <p className="mt-1 hidden text-[11px] uppercase tracking-[0.3em] text-slate-500 sm:block">Liên Quân Mobile · Phân tích hạng S / SS / SSS</p>
          </div>
        </div>
        <a href="https://github.com/poalninhphuoc/aov-mvp-simulator" target="_blank" rel="noreferrer"
           className="flex items-center gap-2 rounded-md px-3 py-1.5 text-sm text-slate-400 ring-1 ring-white/10 transition hover:text-white hover:ring-white/25">
          <Github size={15} /> GitHub
        </a>
      </header>

      <main className="grid flex-1 lg:min-h-0 lg:grid-cols-[minmax(380px,5fr)_7fr] lg:grid-rows-1">
        {/* ===== Controls ===== */}
        <div className="bg-gradient-to-b from-white/[0.025] to-transparent px-5 py-8 lg:h-full lg:overflow-y-auto lg:border-r lg:border-white/10 lg:px-10">
          <div className="space-y-9">
            <Section no="01" title="Vai trò & Kết quả">
              <div className="flex flex-wrap gap-1.5">
                {Object.entries(ROLES).map(([id, r]) => {
                  const Icon = ROLE_ICONS[id]
                  return (
                    <Chip key={id} active={s.role === id} onClick={() => set({ role: id })} title={`${r.label} — ${r.hint}`}>
                      <Icon size={14} /> {r.label}
                    </Chip>
                  )
                })}
              </div>
              <p className="text-xs text-slate-500">{ROLES[s.role].hint}</p>
              <Segmented value={s.win} onChange={(win) => set({ win })} options={[
                { value: true, label: 'Thắng', icon: <Trophy size={13} />, cls: 'bg-gold-500 text-ink-950' },
                { value: false, label: 'Thua', icon: <Skull size={13} />, cls: 'bg-slate-600 text-white' },
              ]} />
            </Section>

            <Section no="02" title="K / D / A & Đội">
              <Scoreline k={s.k} d={s.d} a={s.a} kda={res.rawKda} />
              <Slider label="Hạ gục (K)" value={s.k} min={0} max={30} onChange={setK} color="#F59E0B" />
              <Slider label="Bị hạ gục (D)" value={s.d} min={0} max={20} onChange={(d) => set({ d })} color="#E66767" />
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
                <div className="mb-2 text-[13px] text-slate-400">Đẩy trụ / Mục tiêu lớn</div>
                <Segmented value={s.tower} onChange={(tower) => set({ tower })}
                  options={TOWER_LEVELS.map((t) => ({
                    value: t.id, label: t.label, sub: `${t.bonus > 0 ? `+${t.bonus}` : '0'}đ`, cls: 'bg-cyan-400/20 text-cyan-200',
                  }))} />
              </div>
            </Section>

            <Section no="04" title="Huy hiệu đột biến">
              <div className="flex flex-wrap gap-1.5">
                {BADGES.map((bd) => (
                  <Chip key={bd.id} active={s.badges.includes(bd.id)} onClick={() => toggleBadge(bd.id)}>
                    {s.badges.includes(bd.id) && <Check size={12} strokeWidth={3} />}
                    {bd.label} <span className="opacity-60">+{bd.bonus}đ</span>
                  </Chip>
                ))}
              </div>
            </Section>

            <Section no="05" title="Preset kiểm thử">
              <ul>
                {PRESET_RESULTS.map(({ p, r }) => {
                  const on = JSON.stringify(p.state) === JSON.stringify(s)
                  return (
                    <li key={p.id}>
                      <button onClick={() => setS(p.state)}
                        className={`group flex w-full items-center gap-3 border-b border-white/[0.06] px-2 py-2.5 text-left text-[13px] transition hover:bg-white/[0.04] ${on ? 'bg-white/[0.05] text-white' : 'text-slate-300'}`}>
                        <Zap size={13} className={on ? 'text-gold-500' : 'text-slate-600 group-hover:text-slate-400'} />
                        <span className="flex-1">{p.label}</span>
                        <span className="tabular-nums text-xs text-slate-500">{r.rating.toFixed(1)}</span>
                        <span className="w-9 rounded px-1 py-0.5 text-center font-display text-sm font-bold"
                              style={{ color: RANK_COLORS[r.rank.tier], background: `${RANK_COLORS[r.rank.tier]}1f` }}>
                          {r.rank.tier}
                        </span>
                      </button>
                    </li>
                  )
                })}
              </ul>
              <button onClick={() => setS(DEFAULT_STATE)}
                className="flex items-center gap-1.5 text-xs text-slate-500 transition hover:text-white">
                <RotateCcw size={12} /> Đặt lại mặc định
              </button>
            </Section>
          </div>
        </div>

        {/* ===== Results (live) ===== */}
        <div className="aura relative px-5 py-8 lg:h-full lg:overflow-y-auto lg:px-14">
          <Dashboard s={s} res={res} />
        </div>
      </main>

      <footer className="shrink-0 border-t border-white/10 px-5 py-3 text-center text-[11px] text-slate-600 lg:px-10">
        Công cụ mô phỏng không chính thức, không liên kết với Garena / Tencent. Công thức chỉ mang tính tham khảo.
      </footer>
    </div>
  )
}
