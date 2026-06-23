'use client'

import { useState } from 'react'

export default function SupportButton() {
  const [open, setOpen] = useState(false)
  const [copied, setCopied] = useState(false)

  function handleCopy() {
    navigator.clipboard.writeText('09333496704')
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        style={{
          position: 'fixed',
          bottom: 20,
          right: 20,
          zIndex: 50,
          background: 'var(--color-gold)',
          color: 'var(--color-ink)',
          border: 'none',
          borderRadius: 30,
          padding: '12px 18px',
          fontWeight: 700,
          fontSize: 14,
          cursor: 'pointer',
          boxShadow: '0 4px 14px rgba(30, 36, 51, 0.18)',
        }}
      >
        💛 Support This Tool
      </button>

      {open && (
        <div
          onClick={() => setOpen(false)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(30, 36, 51, 0.45)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 100,
            padding: 20,
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: '#fff',
              borderRadius: 'var(--radius-lg)',
              padding: 28,
              maxWidth: 380,
              width: '100%',
              boxShadow: '0 10px 40px rgba(0,0,0,0.2)',
              position: 'relative',
            }}
          >
            <button
              onClick={() => setOpen(false)}
              style={{
                position: 'absolute',
                top: 14,
                right: 16,
                border: 'none',
                background: 'none',
                fontSize: 18,
                cursor: 'pointer',
                color: 'var(--color-ink-soft)',
              }}
              aria-label="Close"
            >
              ✕
            </button>

            <h2 style={{ fontSize: 20, marginBottom: 12 }}>Support This Tool</h2>

            <p style={{ fontSize: 14, color: 'var(--color-ink-soft)', lineHeight: 1.6, marginBottom: 18 }}>
              This app is free for all students. If it has saved you time and made your
              learning lessons easier, consider sending a small token of appreciation!
              Every contribution helps keep this tool free and running. Salamat! 🙏
            </p>

            <div
              style={{
                background: 'var(--color-paper)',
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--radius-md)',
                padding: 16,
                marginBottom: 14,
              }}
            >
              <p style={{ fontSize: 13, color: 'var(--color-ink-soft)', marginBottom: 4 }}>
                GCash
              </p>
              <p style={{ fontSize: 18, fontWeight: 700, marginBottom: 2 }}>
                09333496704
              </p>
              <p style={{ fontSize: 14, color: 'var(--color-ink-soft)' }}>
                Hazsher Briz Munjilul
              </p>
            </div>

            <button
              onClick={handleCopy}
              className="btn-primary"
              style={{ width: '100%', padding: 12, fontSize: 14 }}
            >
              {copied ? '✓ Copied!' : 'Copy GCash Number'}
            </button>
          </div>
        </div>
      )}
    </>
  )
}