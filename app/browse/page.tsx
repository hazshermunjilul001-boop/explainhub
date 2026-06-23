import { supabase } from '@/lib/supabase'
import Link from 'next/link'

const GRADE_ORDER = ['1','2','3','4','5','6','7','8','9','10','9-10']

function gradeLabel(g: string) {
  if (g === '9-10') return 'TLE Specializations (Grades 9-10)'
  return `Grade ${g}`
}

export default async function BrowsePage({
  searchParams,
}: {
  searchParams: Promise<{ grade?: string; subject?: string }>
}) {
  const { grade, subject } = await searchParams

  // LEVEL 3: Topics within a specific grade + subject
  if (grade && subject) {
    const gradesToInclude = (grade === '9' || grade === '10') ? [grade, '9-10'] : [grade]

    const { data: topics } = await supabase
      .from('eh_topics')
      .select('id, name')
      .in('grade_level', gradesToInclude)
      .eq('subject_id', subject)
      .order('name', { ascending: true })
      .range(0, 4999)

    const { data: subjectRow } = await supabase
      .from('eh_subjects')
      .select('name')
      .eq('id', subject)
      .single()

    return (
      <div style={{ padding: '48px 24px', maxWidth: 700, margin: '0 auto' }}>
        <Link href={`/browse?grade=${grade}`} style={{ color: 'var(--color-coral)', fontWeight: 600, textDecoration: 'none' }}>
          ← Back to {gradeLabel(grade)} subjects
        </Link>
        <h1 style={{ fontSize: 28, margin: '16px 0 6px' }}>
          {subjectRow?.name} — {gradeLabel(grade)}
        </h1>
        <p style={{ color: 'var(--color-ink-soft)', marginBottom: 28 }}>
          {topics?.length || 0} topic{topics?.length === 1 ? '' : 's'}
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

  // LEVEL 2: Subjects within a specific grade
  if (grade) {
    const gradesToInclude = (grade === '9' || grade === '10') ? [grade, '9-10'] : [grade]

    const { data: rows } = await supabase
      .from('eh_topics')
      .select('subject_id, eh_subjects(id, name)')
      .in('grade_level', gradesToInclude)
      .range(0, 4999)

    const subjectMap = new Map<string, { id: string; name: string; count: number }>()
    rows?.forEach((r: any) => {
      if (!r.eh_subjects) return
      const id = r.eh_subjects.id
      if (!subjectMap.has(id)) {
        subjectMap.set(id, { id, name: r.eh_subjects.name, count: 0 })
      }
      subjectMap.get(id)!.count++
    })
    const subjects = Array.from(subjectMap.values()).sort((a, b) => a.name.localeCompare(b.name))

    return (
      <div style={{ padding: '48px 24px', maxWidth: 700, margin: '0 auto' }}>
        <Link href="/browse" style={{ color: 'var(--color-coral)', fontWeight: 600, textDecoration: 'none' }}>
          ← Back to all grades
        </Link>
        <h1 style={{ fontSize: 28, margin: '16px 0 6px' }}>{gradeLabel(grade)}</h1>
        <p style={{ color: 'var(--color-ink-soft)', marginBottom: 28 }}>
          Pick a subject to see its topics
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 14 }}>
          {subjects.map((s) => (
            <Link
              key={s.id}
              href={`/browse?grade=${grade}&subject=${s.id}`}
              style={{
                display: 'block',
                background: 'var(--color-card)',
                borderRadius: 'var(--radius-md)',
                boxShadow: 'var(--shadow-card)',
                padding: '20px',
                textDecoration: 'none',
                color: 'var(--color-ink)',
              }}
            >
              <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 4 }}>{s.name}</div>
              <div style={{ fontSize: 13, color: 'var(--color-ink-soft)' }}>{s.count} topics</div>
            </Link>
          ))}
        </div>
      </div>
    )
  }

  // LEVEL 1: All grade levels
  const { data: allTopics } = await supabase
    .from('eh_topics')
    .select('grade_level')
    .range(0, 4999)

  const gradeCounts = new Map<string, number>()
  let uncategorized = 0

  allTopics?.forEach((t) => {
    if (!t.grade_level) {
      uncategorized++
    } else {
      gradeCounts.set(t.grade_level, (gradeCounts.get(t.grade_level) || 0) + 1)
    }
  })

  const sortedGrades = GRADE_ORDER.filter((g) => gradeCounts.has(g))

  return (
    <div style={{ padding: '48px 24px', maxWidth: 700, margin: '0 auto' }}>
      <h1 style={{ fontSize: 30, marginBottom: 6 }}>Browse by Grade Level</h1>
      <p style={{ color: 'var(--color-ink-soft)', marginBottom: 28 }}>
        Pick a grade level, then a subject, to find topics.
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 14 }}>
        {sortedGrades.map((g) => (
          <Link
            key={g}
            href={`/browse?grade=${g}`}
            style={{
              display: 'block',
              background: 'var(--color-card)',
              borderRadius: 'var(--radius-md)',
              boxShadow: 'var(--shadow-card)',
              padding: '22px 18px',
              textAlign: 'center',
              textDecoration: 'none',
              color: 'var(--color-ink)',
            }}
          >
            <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 4 }}>{gradeLabel(g)}</div>
            <div style={{ fontSize: 13, color: 'var(--color-ink-soft)' }}>{gradeCounts.get(g)} topics</div>
          </Link>
        ))}
      </div>

      {uncategorized > 0 && (
        <p style={{ marginTop: 28, fontSize: 14, color: 'var(--color-ink-soft)' }}>
          Plus {uncategorized} uncategorized topic{uncategorized === 1 ? '' : 's'} (
          <Link href="/browse-all" style={{ color: 'var(--color-coral)' }}>view all topics →</Link>
          )
        </p>
      )}
    </div>
  )
}