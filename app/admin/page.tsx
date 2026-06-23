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

export default function AdminPage() {
  const router = useRouter()
  const supabase = createClient()

  const [checking, setChecking] = useState(true)
  const [isAdmin, setIsAdmin] = useState(false)
  const [reports, setReports] = useState<Report[]>([])
  const [previews, setPreviews] = useState<Record<string, ContentPreview>>({})
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'pending' | 'reviewed' | 'all'>('pending')

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
    }
    checkAdmin()
  }, [])

  async function loadReports() {
    setLoading(true)

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
    setLoading(false)
  }

  async function handleHide(report: Report) {
    const table = report.target_type === 'explanation' ? 'eh_explanations' : 'eh_comments'

    await supabase.from(table).update({ is_hidden: true }).eq('id', report.target_id)
    await supabase.from('eh_reports').update({ status: 'reviewed' }).eq('id', report.id)

    await loadReports()
  }

  async function handleUnhide(report: Report) {
    const table = report.target_type === 'explanation' ? 'eh_explanations' : 'eh_comments'

    await supabase.from(table).update({ is_hidden: false }).eq('id', report.target_id)
    await supabase.from('eh_reports').update({ status: 'reviewed' }).eq('id', report.id)

    await loadReports()
  }

  async function handleDismiss(report: Report) {
    await supabase.from('eh_reports').update({ status: 'reviewed' }).eq('id', report.id)
    await loadReports()
  }

  if (checking) {
    return <div style={{ padding: 40 }}>Checking access...</div>
  }

  if (!isAdmin) {
    return (
      <div style={{ padding: 40 }}>
        <h1 style={{ fontSize: 22, marginBottom: 8 }}>Not authorized</h1>
        <p style={{ color: 'var(--color-ink-soft)' }}>
          This page is only available to admins.
        </p>
      </div>
    )
  }

  const visibleReports = reports.filter((r) =>
    filter === 'all' ? true : r.status === filter
  )

  return (
    <div style={{ padding: 40, maxWidth: 800, margin: '0 auto' }}>
      <h1 style={{ fontSize: 26, marginBottom: 6 }}>Moderation Queue</h1>
      <p style={{ color: 'var(--color-ink-soft)', marginBottom: 20 }}>
        Review reported content. Hiding removes it from public view but keeps it stored.
      </p>

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

      {loading && <p>Loading reports...</p>}

      {!loading && visibleReports.length === 0 && (
        <p style={{ color: 'var(--color-ink-soft)' }}>No reports here. All clear.</p>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        {visibleReports.map((report) => {
          const preview = previews[report.target_id]

          return (
            <div
              key={report.id}
              style={{
                background: '#fff',
                border: '1px solid var(--color-border)',
                borderRadius: 10,
                padding: 18,
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
                <span
                  style={{
                    fontSize: 12,
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    color: 'var(--color-coral-dark)',
                  }}
                >
                  {report.target_type}
                </span>
                <span style={{ fontSize: 12, color: 'var(--color-ink-soft)' }}>
                  {new Date(report.created_at).toLocaleString()}
                </span>
              </div>

              {report.reason && (
                <p style={{ fontSize: 14, marginBottom: 10 }}>
                  <strong>Reason given:</strong> {report.reason}
                </p>
              )}

              <div
                style={{
                  background: '#f8f9fb',
                  borderRadius: 8,
                  padding: 12,
                  fontSize: 14,
                  marginBottom: 12,
                  maxHeight: 150,
                  overflowY: 'auto',
                }}
              >
                {preview ? preview.content : 'Content not found (may already be deleted).'}
              </div>

              {preview?.is_hidden && (
                <p style={{ fontSize: 13, color: 'crimson', marginBottom: 10 }}>
                  Currently hidden from public view.
                </p>
              )}

              <div style={{ display: 'flex', gap: 8 }}>
                {!preview?.is_hidden ? (
                  <button
                    onClick={() => handleHide(report)}
                    style={{
                      padding: '8px 14px',
                      borderRadius: 8,
                      border: 'none',
                      background: 'crimson',
                      color: '#fff',
                      fontWeight: 600,
                      cursor: 'pointer',
                      fontSize: 13,
                    }}
                  >
                    Hide Content
                  </button>
                ) : (
                  <button
                    onClick={() => handleUnhide(report)}
                    style={{
                      padding: '8px 14px',
                      borderRadius: 8,
                      border: '1px solid var(--color-border)',
                      background: '#fff',
                      fontWeight: 600,
                      cursor: 'pointer',
                      fontSize: 13,
                    }}
                  >
                    Unhide
                  </button>
                )}

                {report.status === 'pending' && (
                  <button
                    onClick={() => handleDismiss(report)}
                    style={{
                      padding: '8px 14px',
                      borderRadius: 8,
                      border: '1px solid var(--color-border)',
                      background: '#fff',
                      fontWeight: 600,
                      cursor: 'pointer',
                      fontSize: 13,
                    }}
                  >
                    Dismiss (no action needed)
                  </button>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}