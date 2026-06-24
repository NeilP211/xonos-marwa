import { useState } from 'react'
import { COMPARE } from '../lib/compareConfig'
import { RANGES } from '../lib/data'
import { compareTaste } from '../lib/compare'
import Thumb from './Thumb'

// Fetch a target's published top.json (cross-site; GitHub Pages allows CORS).
async function fetchTargetTop(base) {
  const res = await fetch(`${base.replace(/\/?$/, '/')}data/top.json`, { cache: 'no-store' })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return res.json()
}

export default function Compare({ top, range }) {
  const [targetId, setTargetId] = useState('')
  const [state, setState] = useState({ status: 'idle' }) // idle | loading | done | error

  const rangeLabel = RANGES.find((r) => r.key === range)?.label || ''

  async function run(id) {
    setTargetId(id)
    if (!id) return setState({ status: 'idle' })
    const target = COMPARE.targets.find((t) => t.id === id)
    setState({ status: 'loading' })
    try {
      const theirTop = await fetchTargetTop(target.base)
      const result = compareTaste(top?.ranges?.[range], theirTop?.ranges?.[range])
      setState({ status: 'done', name: target.name, result })
    } catch {
      setState({ status: 'error', name: target.name })
    }
  }

  return (
    <div className="card col-6 compare">
      <h2>Compare Taste</h2>
      {COMPARE.targets.length === 0 ? (
        <p className="pulse-note" style={{ margin: 0 }}>No one to compare with yet.</p>
      ) : (
        <>
          <label className="scope">
            <span className="scope-lbl">{COMPARE.self} vs</span>
            <select value={targetId} onChange={(e) => run(e.target.value)}>
              <option value="">Choose someone…</option>
              {COMPARE.targets.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          </label>

          {state.status === 'loading' && <p className="pulse-note">Loading {state.name}…</p>}
          {state.status === 'error' && (
            <p className="pulse-note">Couldn't reach {state.name}'s Xonos. Try again later.</p>
          )}

          {state.status === 'done' && (
            <div className="cmp-body">
              <div className="cmp-score">
                <div className="big grad">{state.result.overlapPct}%</div>
                <div className="lbl">taste overlap ({rangeLabel}, by artist)</div>
              </div>

              <CmpGroup title={`Shared artists (${state.result.sharedArtists.length})`} round>
                {state.result.sharedArtists.slice(0, 12).map((a, i) => (
                  <Pill key={i} name={a.name} image={a.image} round />
                ))}
              </CmpGroup>

              <CmpGroup title={`Shared tracks (${state.result.sharedTracks.length})`}>
                {state.result.sharedTracks.slice(0, 12).map((t, i) => (
                  <Pill key={i} name={t.name} sub={(t.artists || []).join(', ')} image={t.image} />
                ))}
              </CmpGroup>

              {!state.result.sharedArtists.length && !state.result.sharedTracks.length && (
                <p className="pulse-note">No overlap in this range. Different worlds.</p>
              )}
            </div>
          )}
        </>
      )}
    </div>
  )
}

function CmpGroup({ title, children }) {
  if (!children || children.length === 0) return null
  return (
    <div className="cmp-group">
      <div className="lbl" style={{ color: 'var(--muted)', marginBottom: 8 }}>{title}</div>
      <div className="cmp-rows">{children}</div>
    </div>
  )
}

function Pill({ name, sub, image, round }) {
  return (
    <div className="tick">
      <Thumb name={name} image={image} round={round} />
      <div className="meta">
        <div className="name">{name}</div>
        {sub && <div className="sub">{sub}</div>}
      </div>
    </div>
  )
}
