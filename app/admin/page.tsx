'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase-browser'

type Report = {
  id: string
  target_type: 'explanation' | 'comment'
  target_id: string
  reason: string | null
  status: string
  created_at: string
  reporter_id: string
}

type ContentPreview = {
  content: string
  is_hidden: boolean
  author_id: string
}

type SubmissionRow = {
  id: string
  style: string
  content: string
  is_hidden: boolean
  created_at: string
  eh_topics: { name: string } | null
  eh_profiles: { display_name: string } | null
}

export default function AdminPage() {
  const router = useRouter()
  const supabase = createClient()

  const [checking, setChecking] = useState(true)
  const [isAdmin, setIsAdmin] = useState(false)
  const [view, setView] = useState<'reports' | 'feed'>('feed')

  // Reports state
  const [reports, setReports] = useState<Report[]>([])
  const [previews, setPreviews] = useState<Record<string, ContentPreview>>({})
  const [loadingReports, setLoadingReports] = useState(true)
  const [filter, setFilter] = useState<'pending' | 'reviewed' | 'all'>('pending')

  // Feed state
  const [submissions, setSubmissions] = useState<SubmissionRow[]>([])
  const [loadingFeed, setLoadingFeed] = useState(true)

  useEffect(() => {
    async function checkAdmin() {
      const { data: authData } = await supabase.auth.getUser()
      if (!authData.user) {
        router.push('/login')
        return
      }

      const { data: profile } = await supabase
        .from('eh_profiles')
        .select('is_admin')
        .eq('id', authData.user.id)
        .single()

      if (!profile?.is_admin) {
        setChecking(false)
        setIsAdmin(false)
        return
      }

      setIsAdmin(true)
      setChecking(false)
      await loadReports()
      await loadFeed()
    }
    checkAdmin()
  }, [])

  async function loadReports() {
    setLoadingReports(true)

    const { data: reportData } = await supabase
      .from('eh_reports')
      .select('*')
      .order('created_at', { ascending: false })

    const allReports = (reportData as Report[]) || []
    setReports(allReports)

    const previewMap: Record<string, ContentPreview> = {}

    for (const r of allReports) {
      const table = r.target_type === 'explanation' ? 'eh_explanations' : 'eh_comments'
      const { data: contentRow } = await supabase
        .from(table)
        .select('content, is_hidden, author_id')
        .eq('id', r.target_id)
        .single()

      if (contentRow) {
        previewMap[r.target_id] = contentRow as ContentPreview
      }
    }

    setPreviews(previewMap)
    setLoadingReports(false)
  }

  async function loadFeed() {
    setLoadingFeed(true)

    const { data } = await supabase
      .from('eh_explanations')
      .select('id, style, content, is_hidden, created_at, eh_topics(name), eh_profiles(display_name)')
      .order('created_at', { ascending: false })
      .limit(50)

    setSubmissions((data as unknown as SubmissionRow[]) || [])
    setLoadingFeed(false)
  }

  async function handleHide(report: Report) {
    const table = report.target_type === 'explanation' ? 'eh_explanations' : 'eh_comments'
    await supabase.from(table).update({ is_hidden: true }).eq('id', report.target_id)
    await supabase.from('eh_reports').update({ status: 'reviewed' }).eq('id', report.id)
    await loadReports()
    await loadFeed()
  }

  async function handleUnhide(report: Report) {
    const table = report.target_type === 'explanation' ? 'eh_explanations' : 'eh_comments'
    await supabase.from(table).update({ is_hidden: false }).eq('id', report.target_id)
    await supabase.from('eh_reports').update({ status: 'reviewed' }).eq('id', report.id)
    await loadReports()
    await loadFeed()
  }

  async function handleDismiss(report: Report) {
    await supabase.from('eh_reports').update({ status: 'reviewed' }).eq('id', report.id)
    await loadReports()
  }

  async function handleFeedHide(id: string) {
    await supabase.from('eh_explanations').update({ is_hidden: true }).eq('id', id)
    await loadFeed()
  }

  async function handleFeedUnhide(id: string) {
    await supabase.from('eh_explanations').update({ is_hidden: false }).eq('id', id)
    await loadFeed()
  }

  if (checking) {
    return <div style={{ padding: 40 }}>Checking access...</div>
  }

  if (!isAdmin) {
    return (
      <div style={{ padding: 40 }}>
        <h1 style={{ fontSize: 22, marginBottom: 8 }}>Not authorized</h1>
        <p style={{ color: 'var(--color-ink-soft)' }}>This page is only available to admins.</p>
      </div>
    )
  }

  const visibleReports = reports.filter((r) => (filter === 'all' ? true : r.status === filter))

  return (
    <div style={{ padding: '48px 24px', maxWidth: 800, margin: '0 auto' }}>
      <h1 style={{ fontSize: 26, marginBottom: 16 }}>Moderation</h1>

      <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
        <button
          onClick={() => setView('feed')}
          style={{
            padding: '10px 16px',
            borderRadius: 8,
            border: view === 'feed' ? 'none' : '1px solid var(--color-border)',
            background: view === 'feed' ? 'var(--color-coral)' : '#fff',
            color: view === 'feed' ? '#fff' : 'var(--color-ink)',
            cursor: 'pointer',
            fontWeight: 700,
          }}
        >
          🕒 Recent Submissions
        </button>
        <button
          onClick={() => setView('reports')}
          style={{
            padding: '10px 16px',
            borderRadius: 8,
            border: view === 'reports' ? 'none' : '1px solid var(--color-border)',
            background: view === 'reports' ? 'var(--color-coral)' : '#fff',
            color: view === 'reports' ? '#fff' : 'var(--color-ink)',
            cursor: 'pointer',
            fontWeight: 700,
          }}
        >
          🚩 Reports {reports.filter((r) => r.status === 'pending').length > 0 && `(${reports.filter((r) => r.status === 'pending').length})`}
        </button>
      </div>

      {view === 'feed' && (
        <>
          <p style={{ color: 'var(--color-ink-soft)', marginBottom: 20 }}>
            Last 50 submissions, newest first. Spot-check anything that looks off — nothing here has been reported yet.
          </p>

          {loadingFeed && <p>Loading...</p>}
          {!loadingFeed && submissions.length === 0 && <p style={{ color: 'var(--color-ink-soft)' }}>No submissions yet.</p>}

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {submissions.map((s) => (
              <div
                key={s.id}
                style={{
                  background: '#fff',
                  border: '1px solid var(--color-border)',
                  borderRadius: 10,
                  padding: 16,
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontSize: 12, color: 'var(--color-ink-soft)' }}>
                  <span>
                    <strong>{s.eh_topics?.name || 'Unknown topic'}</strong> · {s.style} · by {s.eh_profiles?.display_name || 'Unknown'}
                  </span>
                  <span>{new Date(s.created_at).toLocaleString()}</span>
                </div>

                <div
                  style={{
                    background: '#f8f9fb',
                    borderRadius: 8,
                    padding: 10,
                    fontSize: 14,
                    marginBottom: 10,
                    maxHeight: 120,
                    overflowY: 'auto',
                    whiteSpace: 'pre-wrap',
                  }}
                >
                  {s.content}
                </div>

                {s.is_hidden && (
                  <p style={{ fontSize: 12, color: 'crimson', marginBottom: 8 }}>Currently hidden from public view.</p>
                )}

                <button
                  onClick={() => (s.is_hidden ? handleFeedUnhide(s.id) : handleFeedHide(s.id))}
                  style={{
                    padding: '6px 12px',
                    borderRadius: 8,
                    border: s.is_hidden ? '1px solid var(--color-border)' : 'none',
                    background: s.is_hidden ? '#fff' : 'crimson',
                    color: s.is_hidden ? 'var(--color-ink)' : '#fff',
                    fontWeight: 600,
                    cursor: 'pointer',
                    fontSize: 13,
                  }}
                >
                  {s.is_hidden ? 'Unhide' : 'Hide Content'}
                </button>
              </div>
            ))}
          </div>
        </>
      )}

      {view === 'reports' && (
        <>
          <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
            {(['pending', 'reviewed', 'all'] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                style={{
                  padding: '8px 14px',
                  borderRadius: 8,
                  border: filter === f ? 'none' : '1px solid var(--color-border)',
                  background: filter === f ? 'var(--color-coral)' : '#fff',
                  color: filter === f ? '#fff' : 'var(--color-ink)',
                  cursor: 'pointer',
                  fontWeight: 600,
                  fontSize: 14,
                  textTransform: 'capitalize',
                }}
              >
                {f}
              </button>
            ))}
          </div>

          {loadingReports && <p>Loading reports...</p>}
          {!loadingReports && visibleReports.length === 0 && (
            <p style={{ color: 'var(--color-ink-soft)' }}>No reports here. All clear.</p>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {visibleReports.map((report) => {
              const preview = previews[report.target_id]
              return (
                <div key={report.id} style={{ background: '#fff', border: '1px solid var(--color-border)', borderRadius: 10, padding: 18 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
                    <span style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', color: 'var(--color-coral-dark)' }}>
                      {report.target_type}
                    </span>
                    <span style={{ fontSize: 12, color: 'var(--color-ink-soft)' }}>
                      {new Date(report.created_at).toLocaleString()}
                    </span>
                  </div>

                  {report.reason && (
                    <p style={{ fontSize: 14, marginBottom: 10 }}><strong>Reason given:</strong> {report.reason}</p>
                  )}

                  <div style={{ background: '#f8f9fb', borderRadius: 8, padding: 12, fontSize: 14, marginBottom: 12, maxHeight: 150, overflowY: 'auto', whiteSpace: 'pre-wrap' }}>
                    {preview ? preview.content : 'Content not found (may already be deleted).'}
                  </div>

                  {preview?.is_hidden && (
                    <p style={{ fontSize: 13, color: 'crimson', marginBottom: 10 }}>Currently hidden from public view.</p>
                  )}

                  <div style={{ display: 'flex', gap: 8 }}>
                    {!preview?.is_hidden ? (
                      <button onClick={() => handleHide(report)} style={{ padding: '8px 14px', borderRadius: 8, border: 'none', background: 'crimson', color: '#fff', fontWeight: 600, cursor: 'pointer', fontSize: 13 }}>
                        Hide Content
                      </button>
                    ) : (
                      <button onClick={() => handleUnhide(report)} style={{ padding: '8px 14px', borderRadius: 8, border: '1px solid var(--color-border)', background: '#fff', fontWeight: 600, cursor: 'pointer', fontSize: 13 }}>
                        Unhide
                      </button>
                    )}

                    {report.status === 'pending' && (
                      <button onClick={() => handleDismiss(report)} style={{ padding: '8px 14px', borderRadius: 8, border: '1px solid var(--color-border)', background: '#fff', fontWeight: 600, cursor: 'pointer', fontSize: 13 }}>
                        Dismiss (no action needed)
                      </button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </>
      )}
    </div>
  )
}