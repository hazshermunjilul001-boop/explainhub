import { supabase } from '@/lib/supabase'
import Link from 'next/link'

export default async function BrowseAllPage() {
  const { data: topics } = await supabase
    .from('eh_topics')
    .select('id, name')
    .order('name', { ascending: true })
    .range(0, 4999)

  return (
    <div style={{ padding: '48px 24px', maxWidth: 700, margin: '0 auto' }}>
      <Link href="/browse" style={{ color: 'var(--color-coral)', fontWeight: 600, textDecoration: 'none' }}>
        ← Back to grade levels
      </Link>
      <h1 style={{ fontSize: 28, margin: '16px 0 6px' }}>All Topics</h1>
      <p style={{ color: 'var(--color-ink-soft)', marginBottom: 28 }}>
        {topics?.length || 0} topics total
      </p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {topics?.map((t) => (
          <Link
            key={t.id}
            href={`/topic/${t.id}`}
            style={{
              display: 'block',
              background: 'var(--color-card)',
              borderRadius: 'var(--radius-md)',
              boxShadow: 'var(--shadow-card)',
              padding: '14px 18px',
              textDecoration: 'none',
              color: 'var(--color-ink)',
              fontWeight: 600,
            }}
          >
            {t.name}
          </Link>
        ))}
      </div>
    </div>
  )
}