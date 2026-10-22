import { useEffect, useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import { adminApi, type Capture, type Stats } from './api'

function Login({ onLogin }: { onLogin: (username: string) => void }) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  async function submit(event: FormEvent) {
    event.preventDefault()
    setError('')
    setBusy(true)
    try {
      const result = await adminApi.login(username.trim(), password)
      onLogin(result.username)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to sign in.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <main className="login-shell">
      <section className="login-card">
        <div className="login-brand">
          <div className="brand-mark">A</div>
          <p className="eyebrow">ANEMOSCAN</p>
          <h1>AnemoScan</h1>
          <div className="admin-portal-title">Admin Portal</div>
        </div>
        <p className="muted login-description">Secure access to scan records, AI results and private images.</p>
        <form onSubmit={submit} className="login-form">
          <label>Username<input autoComplete="username" value={username} onChange={(e) => setUsername(e.target.value)} required /></label>
          <label>Password<input type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} required /></label>
          {error && <div className="error-box">{error}</div>}
          <button className="primary-button" disabled={busy}>{busy ? 'Signing in…' : 'Sign in'}</button>
        </form>
      </section>
    </main>
  )
}

function StatCard({ label, value, detail }: { label: string; value: string | number; detail?: string }) {
  return <article className="stat-card"><span>{label}</span><strong>{value}</strong>{detail && <small>{detail}</small>}</article>
}

function ResultBadge({ capture }: { capture: Capture }) {
  if (capture.anemiaDetected === true) return <span className="badge badge-danger">Anemia detected</span>
  if (capture.anemiaDetected === false) return <span className="badge badge-success">No anemia</span>
  return <span className="badge badge-neutral">Not analyzed</span>
}

function Dashboard({ username, onLogout }: { username: string; onLogout: () => void }) {
  const [stats, setStats] = useState<Stats | null>(null)
  const [captures, setCaptures] = useState<Capture[]>([])
  const [selected, setSelected] = useState<Capture | null>(null)
  const [query, setQuery] = useState('')
  const [result, setResult] = useState('all')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  async function load() {
    setLoading(true)
    setError('')
    try {
      const [nextStats, nextCaptures] = await Promise.all([adminApi.stats(), adminApi.captures(query, result)])
      setStats(nextStats)
      setCaptures(nextCaptures.captures)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load dashboard.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { void load() }, [query, result])

  async function removeCapture(id: number) {
    if (!window.confirm('Delete this scan and its stored image? This cannot be undone.')) return
    try {
      await adminApi.deleteCapture(id)
      setSelected(null)
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to delete scan.')
    }
  }

  const anemiaRate = useMemo(() => {
    if (!stats || stats.totalScans === 0) return '—'
    return `${Math.round((stats.anemiaDetected / stats.totalScans) * 100)}%`
  }, [stats])

  return (
    <div className="app-shell">
      <header className="topbar"><div><div className="topbar-title">AnemoScan <span>Admin</span></div><div className="topbar-subtitle">Clinical scan management</div></div><div className="topbar-actions"><span className="user-pill">{username}</span><button className="ghost-button" onClick={onLogout}>Sign out</button></div></header>
      <main className="content">
        <div className="page-heading"><div><p className="eyebrow">OVERVIEW</p><h1>Scan dashboard</h1><p className="muted">Monitor stored conjunctival scans and their binary anemia results.</p></div><button className="ghost-button" onClick={() => void load()}>Refresh</button></div>
        {error && <div className="error-box wide">{error}</div>}
        <section className="stats-grid"><StatCard label="Total scans" value={stats?.totalScans ?? '—'} /><StatCard label="Unique patients" value={stats?.uniquePatients ?? '—'} /><StatCard label="Anemia detected" value={stats?.anemiaDetected ?? '—'} detail={stats ? anemiaRate + ' of scans' : undefined} /><StatCard label="No anemia" value={stats?.noAnemia ?? '—'} /><StatCard label="Unanalyzed" value={stats?.unanalyzed ?? '—'} /><StatCard label="Avg. probability" value={stats?.averageAnemiaProbability == null ? '—' : `${Math.round(stats.averageAnemiaProbability * 100)}%`} /></section>
        <section className="library-card">
          <div className="library-toolbar"><div><h2>Scan library</h2><p className="muted">Search by patient ID or scan name.</p></div><div className="toolbar-actions"><input className="search-input" placeholder="Search scans…" value={query} onChange={(e) => setQuery(e.target.value)} /><select value={result} onChange={(e) => setResult(e.target.value)}><option value="all">All results</option><option value="anemia">Anemia detected</option><option value="no-anemia">No anemia</option><option value="unanalyzed">Not analyzed</option></select></div></div>
          {loading ? <div className="empty-state">Loading scans…</div> : captures.length === 0 ? <div className="empty-state">No scans match this filter.</div> : <div className="scan-grid">{captures.map((capture) => <button className="scan-card" key={capture.id} onClick={() => setSelected(capture)}><div className="thumb-wrap"><img src={adminApi.imageUrl(capture.id)} alt="Conjunctival scan" /></div><div className="scan-card-body"><div className="scan-card-title"><strong>{capture.patientId}</strong><span>#{capture.scanNumber}</span></div><ResultBadge capture={capture} /><div className="scan-meta">{capture.age ? `${capture.age} yrs` : 'Age —'} · {capture.gender || 'Gender —'} · quality {Math.round(capture.overall)}</div>{capture.anemiaProbability != null && <div className="probability">AI probability <strong>{Math.round(capture.anemiaProbability * 100)}%</strong></div>}</div></button>)}</div>}
        </section>
      </main>
      {selected && <div className="modal-backdrop" onMouseDown={(e) => { if (e.target === e.currentTarget) setSelected(null) }}><aside className="detail-panel"><div className="detail-header"><div><p className="eyebrow">SCAN #{selected.scanNumber}</p><h2>{selected.patientId}</h2></div><button className="icon-button" onClick={() => setSelected(null)}>×</button></div><img className="detail-image" src={adminApi.imageUrl(selected.id)} alt="Conjunctival scan" /><div className="detail-result"><ResultBadge capture={selected} />{selected.anemiaProbability != null && <strong>{Math.round(selected.anemiaProbability * 100)}% probability</strong>}</div><dl className="detail-list"><div><dt>Scan name</dt><dd>{selected.name}</dd></div><div><dt>Patient</dt><dd>{selected.patientId}</dd></div><div><dt>Age / gender</dt><dd>{selected.age ?? '—'} / {selected.gender || '—'}</dd></div><div><dt>Quality</dt><dd>{Math.round(selected.overall)}/100</dd></div><div><dt>Created</dt><dd>{new Date(selected.createdAt).toLocaleString()}</dd></div><div><dt>Analyzed</dt><dd>{selected.analyzedAt ? new Date(selected.analyzedAt).toLocaleString() : 'Not analyzed'}</dd></div></dl><div className="detail-actions"><button className="danger-button" onClick={() => void removeCapture(selected.id)}>Delete scan</button></div></aside></div>}
    </div>
  )
}

export default function App() {
  const [username, setUsername] = useState<string | null>(null)
  const [checking, setChecking] = useState(true)
  useEffect(() => { adminApi.me().then((me) => setUsername(me.username)).catch(() => setUsername(null)).finally(() => setChecking(false)) }, [])
  if (checking) return <main className="loading-shell">Checking admin session…</main>
  if (!username) return <Login onLogin={setUsername} />
  return <Dashboard username={username} onLogout={() => { void adminApi.logout().finally(() => setUsername(null)) }} />
}
