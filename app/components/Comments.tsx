'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase-browser'

type Comment = {
  id: string
  content: string
  created_at: string
  author_id: string
  eh_profiles: { display_name: string } | null
}

export default function Comments({ explanationId }: { explanationId: string }) {
  const supabase = createClient()
  const [userId, setUserId] = useState<string | null>(null)
  const [comments, setComments] = useState<Comment[]>([])
  const [newComment, setNewComment] = useState('')
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [expanded, setExpanded] = useState(false)

  async function loadComments() {
    const { data } = await supabase
      .from('eh_comments')
      .select('id, content, created_at, author_id, eh_profiles(display_name)')
      .eq('explanation_id', explanationId)
      .order('created_at', { ascending: true })

    setComments((data as unknown as Comment[]) || [])
    setLoading(false)
  }

  useEffect(() => {
    async function init() {
      const { data: authData } = await supabase.auth.getUser()
      setUserId(authData.user?.id || null)
      await loadComments()
    }
    init()
  }, [explanationId])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!userId) {
      window.location.href = '/login'
      return
    }
    if (newComment.trim().length === 0) return

    setSubmitting(true)

    const { error } = await supabase.from('eh_comments').insert({
      explanation_id: explanationId,
      author_id: userId,
      content: newComment.trim(),
    })

    if (!error) {
      setNewComment('')
      await loadComments()
    }
    setSubmitting(false)
  }

  if (loading) return null

  return (
    <div style={{ marginTop: 14 }}>
      <button
        onClick={() => setExpanded(!expanded)}
        style={{
          background: 'none',
          border: 'none',
          color: '#3730a3',
          cursor: 'pointer',
          fontSize: 14,
          fontWeight: 600,
          padding: 0,
        }}
      >
        💬 {comments.length} comment{comments.length === 1 ? '' : 's'} {expanded ? '▲' : '▼'}
      </button>

      {expanded && (
        <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 10 }}>
          {comments.map((c) => (
            <div
              key={c.id}
              style={{
                background: '#f8f9fb',
                borderRadius: 8,
                padding: '10px 12px',
                fontSize: 14,
              }}
            >
              <strong>{c.eh_profiles?.display_name || 'Someone'}</strong>
              <p style={{ marginTop: 4 }}>{c.content}</p>
            </div>
          ))}

          {comments.length === 0 && (
            <p style={{ fontSize: 13, color: '#999' }}>No comments yet.</p>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'flex', gap: 8, marginTop: 4 }}>
            <input
              type="text"
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Add a comment..."
              style={{
                flex: 1,
                padding: 10,
                borderRadius: 8,
                border: '1px solid #ccc',
                fontSize: 14,
              }}
            />
            <button
              type="submit"
              disabled={submitting}
              style={{
                padding: '10px 16px',
                borderRadius: 8,
                border: 'none',
                background: '#3730a3',
                color: '#fff',
                fontWeight: 600,
                cursor: 'pointer',
                fontSize: 14,
              }}
            >
              Post
            </button>
          </form>
        </div>
      )}
    </div>
  )
}