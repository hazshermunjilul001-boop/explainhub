'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import OnboardingBanner from '@/app/components/OnboardingBanner'

type Topic = {
  id: string
  name: string
}

export default function Home() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<Topic[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const trimmed = query.trim()

    if (trimmed.length === 0) {
      setResults([])
      return
    }

    setLoading(true)

    const timer = setTimeout(async () => {
      const { data, error } = await supabase
        .from('eh_topics')
        .select('id, name')
        .ilike('name', `%${trimmed}%`)
        .order('name', { ascending: true })
        .limit(10)

      if (!error && data) {
        setResults(data)
      }
      setLoading(false)
    }, 300)

    return () => clearTimeout(timer)
  }, [query])

  return (
    <div>
      <div style={{ maxWidth: 640, margin: '0 auto', padding: '20px 24px 0' }}>
        <OnboardingBanner />
      </div>
      {/* HERO */}
      <section
        style={{
          padding: '64px 24px 56px',
          textAlign: 'center',
          borderBottom: '1px solid var(--color-border)',
        }}
      >
        <div style={{ maxWidth: 640, margin: '0 auto' }}>
          <div
            style={{
              display: 'inline-block',
              background: '#fff3e2',
              color: 'var(--color-coral-dark)',
              fontSize: 13,
              fontWeight: 600,
              padding: '6px 14px',
              borderRadius: 20,
              marginBottom: 20,
            }}
          >
            Built by Hazsher Briz Munjilul 'ASH'S INNOVATIONS', for DepEd students — free, forever
          </div>

          <h1 style={{ fontSize: 40, marginBottom: 14, lineHeight: 1.15 }}>
            One topic. Four ways to <span style={{ color: 'var(--color-coral)' }}>finally get it.</span>
          </h1>

          <p style={{ fontSize: 17, color: 'var(--color-ink-soft)', marginBottom: 32 }}>
            Not everyone learns the same way. Scroll through analogies, diagrams, mnemonics,
            and quick links from real students and teachers — until one of them just clicks.
          </p>

          <div style={{ position: 'relative', textAlign: 'left' }}>
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search a topic, e.g. Photosynthesis..."
              className="input-field"
              style={{ fontSize: 16, padding: '16px 18px' }}
            />

            {loading && (
              <p style={{ color: 'var(--color-ink-soft)', marginTop: 10, fontSize: 14 }}>
                Searching...
              </p>
            )}

            {!loading && query.trim().length > 0 && results.length === 0 && (
              <p style={{ color: 'var(--color-ink-soft)', marginTop: 10, fontSize: 14 }}>
                No topics found for "{query}" — be the first to add it!
              </p>
            )}

            {results.length > 0 && (
              <div
                style={{
                  position: 'absolute',
                  top: '100%',
                  left: 0,
                  right: 0,
                  background: '#fff',
                  border: '1px solid var(--color-border)',
                  borderRadius: 10,
                  marginTop: 6,
                  boxShadow: 'var(--shadow-card)',
                  zIndex: 10,
                  overflow: 'hidden',
                }}
              >
                {results.map((topic) => (
                  <Link
                    key={topic.id}
                    href={`/topic/${topic.id}`}
                    style={{
                      display: 'block',
                      padding: '14px 18px',
                      textDecoration: 'none',
                      color: 'var(--color-ink)',
                      fontWeight: 500,
                      borderBottom: '1px solid #f3f0e8',
                    }}
                  >
                    {topic.name}
                  </Link>
                ))}
              </div>
            )}
          </div>

          <p style={{ marginTop: 18 }}>
            <Link href="/browse" style={{ color: 'var(--color-coral)', fontWeight: 600, textDecoration: 'none' }}>
              Or browse all topics →
            </Link>
          </p>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section style={{ padding: '56px 24px', maxWidth: 900, margin: '0 auto' }}>
        <h2 style={{ fontSize: 26, textAlign: 'center', marginBottom: 8 }}>
          Four ways in, one "aha" moment
        </h2>
        <p style={{ textAlign: 'center', color: 'var(--color-ink-soft)', marginBottom: 36 }}>
          Every topic on ExplainHub can be explained in any of these styles. Read a few until one fits how you think.
        </p>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))',
            gap: 16,
          }}
        >
          <div className="explanation-card" data-style="analogy">
            <div style={{ fontSize: 22, marginBottom: 8 }}>🧠</div>
            <h3 style={{ fontSize: 16, marginBottom: 6 }}>Analogy</h3>
            <p style={{ fontSize: 14, color: 'var(--color-ink-soft)' }}>
              "Imagine a leaf is like a tiny kitchen..." — connect it to something you already know.
            </p>
          </div>

          <div className="explanation-card" data-style="diagram">
            <div style={{ fontSize: 22, marginBottom: 8 }}>🖼️</div>
            <h3 style={{ fontSize: 16, marginBottom: 6 }}>Diagram</h3>
            <p style={{ fontSize: 14, color: 'var(--color-ink-soft)' }}>
              See it laid out step by step or visually, for thinkers who need to see the shape of an idea.
            </p>
          </div>

          <div className="explanation-card" data-style="mnemonic">
            <div style={{ fontSize: 22, marginBottom: 8 }}>🔤</div>
            <h3 style={{ fontSize: 16, marginBottom: 6 }}>Mnemonic</h3>
            <p style={{ fontSize: 14, color: 'var(--color-ink-soft)' }}>
              A quick trick or rhyme that sticks in your head right before the exam.
            </p>
          </div>

          <div className="explanation-card" data-style="link">
            <div style={{ fontSize: 22, marginBottom: 8 }}>🔗</div>
            <h3 style={{ fontSize: 16, marginBottom: 6 }}>Quick Link</h3>
            <p style={{ fontSize: 14, color: 'var(--color-ink-soft)' }}>
              A trusted video or page someone already found helpful — no more digging through group chats.
            </p>
          </div>
        </div>
      </section>

      {/* WHY IT WORKS */}
      <section
        style={{
          padding: '56px 24px',
          background: '#fff',
          borderTop: '1px solid var(--color-border)',
          borderBottom: '1px solid var(--color-border)',
        }}
      >
        <div style={{ maxWidth: 700, margin: '0 auto', textAlign: 'center' }}>
          <h2 style={{ fontSize: 26, marginBottom: 16 }}>
            Writing it simply is how it sticks
          </h2>
          <p style={{ fontSize: 16, color: 'var(--color-ink-soft)', lineHeight: 1.7 }}>
            When you explain something in your own words — even just for a classmate — it sticks
            in your memory far better than copy-pasting notes ever could. ExplainHub isn't just a
            place to read explanations. It's a place to practice teaching what you've learned,
            and build something the whole school can search before exams.
          </p>
        </div>
      </section>

      {/* CTA */}
      <section style={{ padding: '56px 24px', textAlign: 'center' }}>
        <h2 style={{ fontSize: 24, marginBottom: 10 }}>Got a topic that finally clicked for you?</h2>
        <p style={{ color: 'var(--color-ink-soft)', marginBottom: 24 }}>
          Share how you understood it — it might be exactly what someone else needs.
        </p>
        <Link
          href="/submit"
          className="btn-primary"
          style={{
            display: 'inline-block',
            padding: '14px 28px',
            fontSize: 16,
            textDecoration: 'none',
          }}
        >
          Submit an Explanation
        </Link>
      </section>
    </div>
  )
}