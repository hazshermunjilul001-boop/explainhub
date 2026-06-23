'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase-browser'
import type { User } from '@supabase/supabase-js'

export default function Navbar() {
  const router = useRouter()
  const supabase = createClient()
  const [user, setUser] = useState<User | null>(null)
  const [displayName, setDisplayName] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadUser() {
      const { data } = await supabase.auth.getUser()
      setUser(data.user ?? null)

      if (data.user) {
        const { data: profile } = await supabase
          .from('eh_profiles')
          .select('display_name')
          .eq('id', data.user.id)
          .single()

        if (profile) setDisplayName(profile.display_name)
      }
      setLoading(false)
    }

    loadUser()

    const { data: listener } = supabase.auth.onAuthStateChange(() => {
      loadUser()
    })

    return () => {
      listener.subscription.unsubscribe()
    }
  }, [])

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/')
    router.refresh()
  }

  return (
    <nav
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '16px 40px',
        borderBottom: '1px solid #ddd',
        background: '#fff',
      }}
    >
      <Link href="/" style={{ fontWeight: 'bold', fontSize: 20, color: '#111', textDecoration: 'none' }}>
        ExplainHub
      </Link>

      <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
        <Link href="/browse" style={{ color: '#333', textDecoration: 'none' }}>
          Browse
        </Link>
        <Link href="/submit" style={{ color: '#333', textDecoration: 'none' }}>
          Submit
        </Link>

        {loading ? null : user ? (
          <>
            <span style={{ color: '#666' }}>Hi, {displayName || 'there'}</span>
            <button
              onClick={handleLogout}
              style={{
                padding: '8px 14px',
                borderRadius: 6,
                border: '1px solid #ccc',
                background: '#f5f5f5',
                cursor: 'pointer',
              }}
            >
              Log Out
            </button>
          </>
        ) : (
          <>
            <Link href="/login" style={{ color: '#333', textDecoration: 'none' }}>
              Log In
            </Link>
            <Link
              href="/signup"
              style={{
                padding: '8px 14px',
                borderRadius: 6,
                background: '#3730a3',
                color: '#fff',
                textDecoration: 'none',
                fontWeight: 600,
              }}
            >
              Sign Up
            </Link>
          </>
        )}
      </div>
    </nav>
  )
}