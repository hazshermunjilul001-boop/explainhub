'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase-browser'

export default function VoteButton({ explanationId }: { explanationId: string }) {
  const supabase = createClient()
  const [userId, setUserId] = useState<string | null>(null)
  const [voteCount, setVoteCount] = useState(0)
  const [hasVoted, setHasVoted] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const { data: authData } = await supabase.auth.getUser()
      const currentUserId = authData.user?.id || null
      setUserId(currentUserId)

      const { count } = await supabase
        .from('eh_votes')
        .select('*', { count: 'exact', head: true })
        .eq('explanation_id', explanationId)

      setVoteCount(count || 0)

      if (currentUserId) {
        const { data: existingVote } = await supabase
          .from('eh_votes')
          .select('id')
          .eq('explanation_id', explanationId)
          .eq('user_id', currentUserId)
          .maybeSingle()

        setHasVoted(!!existingVote)
      }

      setLoading(false)
    }
    load()
  }, [explanationId])

  async function handleClick() {
    if (!userId) {
      window.location.href = '/login'
      return
    }

    if (hasVoted) {
      await supabase
        .from('eh_votes')
        .delete()
        .eq('explanation_id', explanationId)
        .eq('user_id', userId)

      setHasVoted(false)
      setVoteCount((c) => c - 1)
    } else {
      await supabase
        .from('eh_votes')
        .insert({ explanation_id: explanationId, user_id: userId })

      setHasVoted(true)
      setVoteCount((c) => c + 1)
    }
  }

  if (loading) return null

  return (
    <button
      onClick={handleClick}
      style={{
        marginTop: 14,
        padding: '8px 14px',
        borderRadius: 8,
        border: hasVoted ? 'none' : '1px solid #ccc',
        background: hasVoted ? '#3730a3' : '#f5f5f5',
        color: hasVoted ? '#fff' : '#333',
        fontWeight: 600,
        cursor: 'pointer',
        fontSize: 14,
      }}
    >
      {hasVoted ? '✓ Helpful' : '👍 This helped me'} ({voteCount})
    </button>
  )
}