import { useEffect, useMemo, useRef, useState } from 'react'
import type { FormEvent } from 'react'
import { adminApi, type Capture, type Stats } from './api'

function Login({ onLogin }: { onLogin: (username: string) => void }) {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
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
      <section className="login-card" style={{ margin: '0 auto' }}>
        <div className="login-brand" style={{ textAlign: 'center' }}>
          <img src="/anemoscan-logo.svg" alt="AnemoScan" style={{ display: 'block', width: 'min(360px, 100%)', height: 'auto', margin: '0 auto 18px' }} />
          <div className="admin-portal-title">Admin Portal</div>
        </div>
        <p className="muted login-description" style={{ textAlign: 'center' }}>Secure access to scan records, AI results and private images.</p>
        <form onSubmit={submit} className="login-form">
          <label>Username<input autoComplete="username" value={username} onChange={(e) => setUsername(e.target.value)} required /></label>
          <label>
            Password
            <span className="password-field" style={{ position: 'relative', display: 'block', width: '100%' }}>
              <input type={showPassword ? 'text' : 'password'} autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} required style={{ width: '100%', paddingRight: '46px' }} />
              <button type="button" className="password-toggle" aria-label={showPassword ? 'Hide password' : 'Show password'} title={showPassword ? 'Hide password' : 'Show password'} onClick={() => setShowPassword((visible) => !visible)} style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', width: '30px', height: '30px', display: 'grid', placeItems: 'center', padding: 0, border: 0, background: 'transparent', color: 'rgba(225,255,252,.62)' }}>
                {showPassword ? <svg viewBox="0 0 24 24" aria-hidden="true" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M3 3l18 18M10.6 10.6a3 3 0 004.2 4.2M9.9 4.2A10.9 10.9 0 0112 4c5.2 0 9.2 4.1 10 8-.3 1.3-1 2.6-2 3.7M6.2 6.2C4.4 7.7 3.2 9.5 2 12c.8 3.9 4.8 8 10 8 1.4 0 2.7-.3 3.9-.8" /></svg> : <svg viewBox="0 0 24 24" aria-hidden="true" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z" /><circle cx="12" cy="12" r="3" /></svg>}
              </button>
            </span>
          </label>
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

const resultOptions = [
  { value: 'all', label: 'All results' },
  { value: 'anemia', label: 'Anemia detected' },
  { value: 'no-anemia', label: 'No anemia' },
  { value: 'unanalyzed', label: 'Not analyzed' },
]

function ResultDropdown({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement | null>(null)
  const selected = resultOptions.find((option) => option.value === value) ?? resultOptions[0]

  useEffect(() => {
    function handlePointerDown(event: PointerEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) setOpen(false)
    }
    document.addEventListener('pointerdown', handlePointerDown)
    return () => document.removeEventListener('pointerdown', handlePointerDown)
  }, [])

  return (
    <div ref={containerRef} style={{ position: 'relative', minWidth: 190 }}>
      <button type="button" aria-haspopup="listbox" aria-expanded={open} onClick={() => setOpen((current) => !current)} style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, border: '1px solid rgba(0,229,212,.28)', background: 'rgba(0,229,212,.05)', color: '#eafffd', borderRadius: 12, padding: '12px 13px', textAlign: 'left' }}>
        <span>{selected.label}</span><span aria-hidden="true" style={{ color: '#00e5d4', transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 150ms ease' }}>⌄</span>
      </button>
      {open && <div role="listbox" aria-label="Scan result filter" style={{ position: 'absolute', zIndex: 40, top: 'calc(100% + 6px)', left: 0, right: 0, overflow: 'hidden', border: '1px solid rgba(0,229,212,.32)', borderRadius: 12, background: 'rgba(6,14,26,.98)', boxShadow: '0 16px 36px rgba(0,0,0,.52)', backdropFilter: 'blur(12px)' }}>
        {resultOptions.map((option) => <button type="button" role="option" aria-selected={option.value === value} key={option.value} onClick={() => { onChange(option.value); setOpen(false) }} style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', border: 0, borderBottom: '1px solid rgba(0,229,212,.08)', padding: '11px 13px', color: option.value === value ? '#00e5d4' : 'rgba(225,255,252,.86)', background: option.value === value ? 'rgba(0,229,212,.10)' : 'transparent', textAlign: 'left' }}><span>{option.label}</span>{option.value === value && <span aria-hidden="true">✓</span>}</button>)}
      </div>}
    </div>
  )
}

function LoadingSpinner({ label = 'Loading…' }: { label?: string }) {
  return <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}><svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true"><circle cx="8" cy="8" r="6" fill="none" stroke="currentColor" strokeWidth="1.5" strokeDasharray="22 16"><animateTransform attributeName="transform" type="rotate" from="0 8 8" to="360 8 8" dur="0.8s" repeatCount="indefinite" /></circle></svg>{label}</span>
}

function Dashboard({ username, onLogout }: { username: string; onLogout: () => void }) {
  const [stats, setStats] = useState<Stats | null>(null)
  const [captures, setCaptures] = useState<Capture[]>([])
  const [selected, setSelected] = useState<Capture | null>(null)
  const [query, setQuery] = useState('')
  const [result, setResult] = useState('all')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [downloadBusy, setDownloadBusy] = useState<string | null>(null)

  async function load() {
    setLoading(true); setError('')
    try {
      const [nextStats, nextCaptures] = await Promise.all([adminApi.stats(), adminApi.captures(query, result)])
      setStats(nextStats); setCaptures(nextCaptures.captures)
    } catch (err) { setError(err instanceof Error ? err.message : 'Unable to load dashboard.') } finally { setLoading(false) }
  }

  useEffect(() => { void load() }, [query, result])

  async function removeCapture(id: number) {
    if (!window.confirm('Delete this scan and its stored image? This cannot be undone.')) return
    try { await adminApi.deleteCapture(id); setSelected(null); await load() } catch (err) { setError(err instanceof Error ? err.message : 'Unable to delete scan.') }
  }

  async function downloadCapture(kind: 'image' | 'report', capture: Capture) {
    const key = `${kind}-${capture.id}`; setDownloadBusy(key); setError('')
    try { if (kind === 'image') await adminApi.downloadImage(capture); else await adminApi.downloadReport(capture) } catch (err) { setError(err instanceof Error ? err.message : 'Unable to download file.') } finally { setDownloadBusy(null) }
  }

  async function downloadAll() {
    setDownloadBusy('all'); setError('')
    try { await adminApi.downloadAll() } catch (err) { setError(err instanceof Error ? err.message : 'Unable to download export.') } finally { setDownloadBusy(null) }
  }

  const anemiaRate = useMemo(() => {
    if (!stats || stats.totalScans === 0) return '—'
    return `${Math.round((stats.anemiaDetected / stats.totalScans) * 100)}%`
  }, [stats])

  return (
    <div className="app-shell">
      <header className="topbar"><div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}><img src="/anemoscan-mark.svg" alt="AnemoScan" style={{ width: 44, height: 44, flex: '0 0 auto' }} /><div style={{ minWidth: 0 }}><div className="topbar-title">AnemoScan <span>Admin</span></div><div className="topbar-subtitle">Clinical scan management</div></div></div><div className="topbar-actions"><span className="user-pill">{username}</span><button className="ghost-button" onClick={onLogout}>Sign out</button></div></header>
      <main className="content">
        <div className="page-heading"><div><p className="eyebrow">OVERVIEW</p><h1>Scan dashboard</h1><p className="muted">Monitor stored conjunctival scans and their binary anemia results.</p></div><div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}><button className="ghost-button" onClick={() => void load()} disabled={loading} aria-busy={loading} style={{ minWidth: 104 }}>{loading ? <LoadingSpinner label="Refreshing…" /> : 'Refresh'}</button><button className="ghost-button" onClick={() => void downloadAll()} disabled={downloadBusy === 'all'}>{downloadBusy === 'all' ? <LoadingSpinner label="Downloading…" /> : 'Download all (.zip)'}</button></div></div>
        {error && <div className="error-box wide">{error}</div>}
        <section className="stats-grid"><StatCard label="Total scans" value={stats?.totalScans ?? '—'} /><StatCard label="Unique patients" value={stats?.uniquePatients ?? '—'} /><StatCard label="Anemia detected" value={stats?.anemiaDetected ?? '—'} detail={stats ? anemiaRate + ' of scans' : undefined} /><StatCard label="No anemia" value={stats?.noAnemia ?? '—'} /><StatCard label="Unanalyzed" value={stats?.unanalyzed ?? '—'} /><StatCard label="Avg. probability" value={stats?.averageAnemiaProbability == null ? '—' : `${Math.round(stats.averageAnemiaProbability * 100)}%`} /></section>
        <section className="library-card"><div className="library-toolbar"><div><h2>Scan library</h2><p className="muted">Search by patient ID or scan name.</p></div><div className="toolbar-actions" style={{ flexWrap: 'wrap' }}><input className="search-input" placeholder="Search scans…" value={query} onChange={(e) => setQuery(e.target.value)} /><ResultDropdown value={result} onChange={setResult} /></div></div>{loading ? <div className="empty-state"><LoadingSpinner label="Loading scans…" /></div> : captures.length === 0 ? <div className="empty-state">No scans match this filter.</div> : <div className="scan-grid">{captures.map((capture) => <button className="scan-card" key={capture.id} onClick={() => setSelected(capture)}><div className="thumb-wrap"><img src={adminApi.imageUrl(capture.id)} alt="Conjunctival scan" /></div><div className="scan-card-body"><div className="scan-card-title"><strong>{capture.patientId}</strong><span>#{capture.scanNumber}</span></div><ResultBadge capture={capture} /><div className="scan-meta">{capture.age ? `${capture.age} yrs` : 'Age —'} · {capture.gender || 'Gender —'} · quality {Math.round(capture.overall)}</div>{capture.anemiaProbability != null && <div className="probability">AI probability <strong>{Math.round(capture.anemiaProbability * 100)}%</strong></div>}</div></button>)}</div>}</section>
      </main>
      {selected && <div className="modal-backdrop" onMouseDown={(e) => { if (e.target === e.currentTarget) setSelected(null) }}><aside className="detail-panel"><div className="detail-header"><div><p className="eyebrow">SCAN #{selected.scanNumber}</p><h2>{selected.patientId}</h2></div><button className="icon-button" onClick={() => setSelected(null)}>×</button></div><img className="detail-image" src={adminApi.imageUrl(selected.id)} alt="Conjunctival scan" /><div className="detail-result"><ResultBadge capture={selected} />{selected.anemiaProbability != null && <strong>{Math.round(selected.anemiaProbability * 100)}% probability</strong>}</div><dl className="detail-list"><div><dt>Scan name</dt><dd>{selected.name}</dd></div><div><dt>Patient</dt><dd>{selected.patientId}</dd></div><div><dt>Age / gender</dt><dd>{selected.age ?? '—'} / {selected.gender || '—'}</dd></div><div><dt>Quality</dt><dd>{Math.round(selected.overall)}/100</dd></div><div><dt>Created</dt><dd>{new Date(selected.createdAt).toLocaleString()}</dd></div><div><dt>Analyzed</dt><dd>{selected.analyzedAt ? new Date(selected.analyzedAt).toLocaleString() : 'Not analyzed'}</dd></div></dl><div className="detail-actions" style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}><button className="ghost-button" disabled={downloadBusy === `image-${selected.id}`} onClick={() => void downloadCapture('image', selected)}>{downloadBusy === `image-${selected.id}` ? <LoadingSpinner label="Downloading…" /> : 'Download image'}</button><button className="ghost-button" disabled={downloadBusy === `report-${selected.id}`} onClick={() => void downloadCapture('report', selected)}>{downloadBusy === `report-${selected.id}` ? <LoadingSpinner label="Preparing…" /> : 'Download report'}</button><button className="danger-button" onClick={() => void removeCapture(selected.id)}>Delete scan</button></div></aside></div>}
    </div>
  )
}

export default function App() {
  const [username, setUsername] = useState<string | null>(null)
  const [checking, setChecking] = useState(true)
  useEffect(() => { adminApi.me().then((me) => setUsername(me.username)).catch(() => setUsername(null)).finally(() => setChecking(false)) }, [])
  if (checking) return <main className="loading-shell"><LoadingSpinner label="Checking admin session…" /></main>
  if (!username) return <Login onLogin={setUsername} />
  return <Dashboard username={username} onLogout={() => { void adminApi.logout().finally(() => setUsername(null)) }} />
}
