import type { Status, Prioritaet } from '../data/types'
import { statusFarbe, prioritaetFarbe } from '../data/helpers'

export function StatusBadge({ status }: { status: Status }) {
  const farbe = statusFarbe(status)
  return (
    <span
      className="badge"
      style={{ background: `${farbe}1a`, color: farbe }}
    >
      <span className="badge-dot" style={{ background: farbe }} />
      {status}
    </span>
  )
}

export function PrioPill({ prio }: { prio: Prioritaet }) {
  const farbe = prioritaetFarbe(prio)
  return (
    <span
      className="prio-pill"
      style={{ background: `${farbe}1a`, color: farbe }}
    >
      {prio}
    </span>
  )
}

export function Progress({ value, color }: { value: number; color?: string }) {
  return (
    <div className="progress">
      <div
        className="progress-bar"
        style={{ width: `${value}%`, background: color ?? 'var(--primary)' }}
      />
    </div>
  )
}
