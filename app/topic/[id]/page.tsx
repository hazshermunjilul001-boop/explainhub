import { supabase } from '@/lib/supabase'
import VoteButton from '@/app/components/VoteButton'
import Comments from '@/app/components/Comments'
import ReportButton from '@/app/components/ReportButton'
import Link from 'next/link'

const STYLE_LABELS: Record<string, string> = {
  analogy: '🧠 Analogy',
  diagram: '🖼️ Diagram',
  mnemonic: '🔤 Mnemonic',
  link: '🔗 Quick Link',
}

const Anchor = 'a'

export default async function TopicDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>
  searchParams: Promise<{ sort?: string }>
}) {
  const { id } = await params
  const { sort } = await searchParams
  const sortMode = sort === 'helpful' ? 'helpful' : 'newest'

  const { data: topic, error: topicError } = await supabase
    .from('eh_topics')
    .select('id, name')
    .eq('id', id)
    .single()

  if (topicError || !topic) {
    return <div style={{ padding: 40 }}>Topic not found.</div>
  }

  const { data: explanations, error: explError } = await supabase
    .from('eh_explanations')
    .select('id, style, content, image_url, created_at')
    .eq('topic_id', id)
    .order('created_at', { ascending: false })

  if (explError) {
    return <div style={{ padding: 40 }}>Error: {explError.message}</div>
  }

  // Get vote counts for all explanations on this topic in one query
  const explanationIds = explanations?.map((e) => e.id) || []
  let voteCounts: Record<string, number> = {}

  if (explanationIds.length > 0) {
    const { data: votes } = await supabase
      .from('eh_votes')
      .select('explanation_id')
      .in('explanation_id', explanationIds)

    votes?.forEach((v) => {
      voteCounts[v.explanation_id] = (voteCounts[v.explanation_id] || 0) + 1
    })
  }

  const sortedExplanations = [...(explanations || [])].sort((a, b) => {
    if (sortMode === 'helpful') {
      return (voteCounts[b.id] || 0) - (voteCounts[a.id] || 0)
    }
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  })

  return (
    <div style={{ padding: '48px 24px', maxWidth: 700, margin: '0 auto' }}>
      <h1 style={{ fontSize: 28, marginBottom: 8 }}>{topic.name}</h1>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexWrap: 'wrap', gap: 10 }}>
        <p style={{ color: 'var(--color-ink-soft)', margin: 0 }}>
          {explanations?.length} explanation{explanations?.length === 1 ? '' : 's'} — scroll until one clicks for you
        </p>

        {explanations && explanations.length > 1 && (
          <div style={{ display: 'flex', gap: 6 }}>
            <Link
              href={`/topic/${id}?sort=newest`}
              style={{
                fontSize: 13,
                padding: '6px 12px',
                borderRadius: 8,
                border: sortMode === 'newest' ? 'none' : '1px solid var(--color-border)',
                background: sortMode === 'newest' ? 'var(--color-coral)' : '#fff',
                color: sortMode === 'newest' ? '#fff' : 'var(--color-ink)',
                textDecoration: 'none',
                fontWeight: 600,
              }}
            >
              Newest
            </Link>
            <Link
              href={`/topic/${id}?sort=helpful`}
              style={{
                fontSize: 13,
                padding: '6px 12px',
                borderRadius: 8,
                border: sortMode === 'helpful' ? 'none' : '1px solid var(--color-border)',
                background: sortMode === 'helpful' ? 'var(--color-coral)' : '#fff',
                color: sortMode === 'helpful' ? '#fff' : 'var(--color-ink)',
                textDecoration: 'none',
                fontWeight: 600,
              }}
            >
              Most Helpful
            </Link>
          </div>
        )}
      </div>

      {explanations?.length === 0 && (
        <div
          style={{
            background: '#fff',
            border: '1px dashed var(--color-border)',
            borderRadius: 'var(--radius-lg)',
            padding: 32,
            textAlign: 'center',
            color: 'var(--color-ink-soft)',
          }}
        >
          No explanations yet — be the first to explain this topic!
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
        {sortedExplanations.map((exp) => {
          const isLink = exp.style === 'link'

          return (
            <div key={exp.id} className="explanation-card" data-style={exp.style}>
              <div
                style={{
                  display: 'inline-block',
                  background: '#f3f0e8',
                  color: 'var(--color-ink)',
                  fontSize: 12,
                  fontWeight: 700,
                  padding: '4px 10px',
                  borderRadius: 6,
                  marginBottom: 12,
                }}
              >
                {STYLE_LABELS[exp.style] || exp.style}
              </div>

              {isLink ? (
                <Anchor
                  href={exp.content}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ color: 'var(--color-coral)', wordBreak: 'break-all', lineHeight: 1.6 }}
                >
                  {exp.content}
                </Anchor>
              ) : exp.style === 'diagram' && exp.image_url ? (
                <div>
                  <img
                    src={exp.image_url}
                    alt="Diagram"
                    style={{ maxWidth: '100%', borderRadius: 8, marginBottom: exp.content ? 10 : 0 }}
                  />
                  {exp.content && (
                    <p style={{ lineHeight: 1.6, fontSize: 14, color: 'var(--color-ink-soft)', whiteSpace: 'pre-wrap' }}>
                      {exp.content}
                    </p>
                  )}
                </div>
              ) : (
                <p style={{ lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>{exp.content}</p>
              )}

              <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginTop: 14 }}>
                <VoteButton explanationId={exp.id} />
                <ReportButton targetType="explanation" targetId={exp.id} />
              </div>
              <Comments explanationId={exp.id} />
            </div>
          )
        })}
      </div>
    </div>
  )
}