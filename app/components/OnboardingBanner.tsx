'use client'

import { useState, useEffect } from 'react'

export default function OnboardingBanner() {
  const [show, setShow] = useState(false)

  useEffect(() => {
    const seen = localStorage.getItem('eh_onboarding_seen')
    if (!seen) setShow(true)
  }, [])

  function dismiss() {
    localStorage.setItem('eh_onboarding_seen', 'true')
    setShow(false)
  }

  if (!show) return null

  return (
    <div
      style={{
        background: '#fff',
        border: '1px solid var(--color-border)',
        borderRadius: 'var(--radius-lg)',
        boxShadow: 'var(--shadow-card)',
        padding: '20px 22px',
        marginBottom: 28,
        position: 'relative',
      }}
    >
      <button
        onClick={dismiss}
        aria-label="Close"
        style={{
          position: 'absolute',
          top: 14,
          right: 16,
          border: 'none',
          background: 'none',
          fontSize: 16,
          cursor: 'pointer',
          color: 'var(--color-ink-soft)',
        }}
      >
        ✕
      </button>

      <h2 style={{ fontSize: 17, marginBottom: 10 }}>👋 New here? Here's how it works</h2>
      <p style={{ fontSize: 14, color: 'var(--color-ink-soft)', lineHeight: 1.6, marginBottom: 12 }}>
        Every topic can have explanations in up to four styles. Scroll through a few until one clicks for you:
      </p>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
        <span style={{ fontSize: 13, background: '#fff3e2', color: 'var(--color-coral-dark)', padding: '5px 10px', borderRadius: 16, fontWeight: 600 }}>
          🧠 Analogy
        </span>
        <span style={{ fontSize: 13, background: '#e8f0f7', color: '#2c5577', padding: '5px 10px', borderRadius: 16, fontWeight: 600 }}>
          🖼️ Diagram
        </span>
        <span style={{ fontSize: 13, background: '#fef3e0', color: '#8a5a10', padding: '5px 10px', borderRadius: 16, fontWeight: 600 }}>
          🔤 Mnemonic
        </span>
        <span style={{ fontSize: 13, background: '#e9f3ec', color: '#2f5e40', padding: '5px 10px', borderRadius: 16, fontWeight: 600 }}>
          🔗 Quick Link
        </span>
      </div>
    </div>
  )
}