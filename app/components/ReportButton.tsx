'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase-browser'

export default function ReportButton({
  targetType,
  targetId,
}: {
  targetType: 'explanation' | 'comment'
  targetId: string
}) {
  const supabase = createClient()
  const [open, setOpen] = useState(false)
  const [reason, setReason] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  async function handleReport() {
    const { data: authData } = await supabase.auth.getUser()
    if (!authData.user) {
      window.location.href = '/login'
      return
    }

    setSubmitting(true)
    setError('')

    const { error: reportError } = await supabase.from('eh_reports').insert({
      target_type: targetType,
      target_id: targetId,
      reporter_id: authData.user.id,
      reason: reason.trim() || null,
    })

    if (reportError) {
      if (reportError.code === '23505') {
        setError('You already reported this.')
      } else {
        setError(reportError.message)
      }
      setSubmitting(false)
      return
    }

    setSubmitted(true)
    setSubmitting(false)
  }

  if (submitted) {
    return (
      <span style={{ fontSize: 13, color: 'var(--color-ink-soft)' }}>
        Reported. Thanks for flagging this.
      </span>
    )
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        style={{
          background: 'none',
          border: 'none',
          color: 'var(--color-ink-soft)',
          cursor: 'pointer',
          fontSize: 13,
          padding: 0,
        }}
      >
        🚩 Report
      </button>
    )
  }

  return (
    <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
      <input
        type="text"
        value={reason}
        onChange={(e) => setReason(e.target.value)}
        placeholder="Why? (optional)"
        style={{
          fontSize: 13,
          padding: '6px 10px',
          borderRadius: 6,
          border: '1px solid var(--color-border)',
        }}
      />
      <button
        onClick={handleReport}
        disabled={submitting}
        style={{
          fontSize: 13,
          padding: '6px 10px',
          borderRadius: 6,
          border: 'none',
          background: 'crimson',
          color: '#fff',
          cursor: 'pointer',
        }}
      >
        {submitting ? '...' : 'Submit Report'}
      </button>
      <button
        onClick={() => setOpen(false)}
        style={{
          fontSize: 13,
          padding: '6px 10px',
          borderRadius: 6,
          border: '1px solid var(--color-border)',
          background: '#fff',
          cursor: 'pointer',
        }}
      >
        Cancel
      </button>
      {error && <span style={{ fontSize: 12, color: 'crimson' }}>{error}</span>}
    </div>
  )
}