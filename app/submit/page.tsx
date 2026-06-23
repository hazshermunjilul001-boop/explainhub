'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase-browser'

async function convertToWebP(file: File): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    const reader = new FileReader()

    reader.onload = (e) => {
      img.src = e.target?.result as string
    }

    img.onload = () => {
      const canvas = document.createElement('canvas')
      canvas.width = img.width
      canvas.height = img.height
      const ctx = canvas.getContext('2d')
      ctx?.drawImage(img, 0, 0)

      canvas.toBlob(
        (blob) => {
          if (blob) resolve(blob)
          else reject(new Error('Conversion failed'))
        },
        'image/webp',
        0.85
      )
    }

    img.onerror = reject
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

type Subject = { id: string; name: string }
type Topic = { id: string; name: string }

const GRADE_OPTIONS = ['1','2','3','4','5','6','7','8','9','10','9-10']

function gradeLabel(g: string) {
  if (g === '9-10') return 'TLE Specializations (Grades 9-10)'
  return `Grade ${g}`
}

const STYLES = [
  { value: 'analogy', label: '🧠 Analogy' },
  { value: 'diagram', label: '🖼️ Diagram (image upload)' },
  { value: 'mnemonic', label: '🔤 Mnemonic' },
  { value: 'link', label: '🔗 Quick Link' },
]

export default function SubmitPage() {
  const router = useRouter()
  const supabase = createClient()

  const [checkingAuth, setCheckingAuth] = useState(true)
  const [userId, setUserId] = useState<string | null>(null)

  const [grade, setGrade] = useState('')
  const [subjectId, setSubjectId] = useState('')
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [topicId, setTopicId] = useState('')
  const [topics, setTopics] = useState<Topic[]>([])

  const [showNewTopic, setShowNewTopic] = useState(false)
  const [newTopicName, setNewTopicName] = useState('')

  const [style, setStyle] = useState('analogy')
  const [content, setContent] = useState('')

  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [uploadingImage, setUploadingImage] = useState(false)

  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    async function checkAuth() {
      const { data } = await supabase.auth.getUser()
      if (!data.user) {
        router.push('/login')
        return
      }
      setUserId(data.user.id)
      setCheckingAuth(false)
    }
    checkAuth()
  }, [])

  useEffect(() => {
    setSubjectId('')
    setTopicId('')
    setSubjects([])
    setTopics([])

    if (!grade) return

    async function loadSubjects() {
      const gradesToInclude = grade === '9' || grade === '10' ? [grade, '9-10'] : [grade]

      const { data: rows } = await supabase
        .from('eh_topics')
        .select('subject_id, eh_subjects(id, name)')
        .in('grade_level', gradesToInclude)
        .range(0, 4999)

      const map = new Map<string, Subject>()
      rows?.forEach((r: any) => {
        if (r.eh_subjects) map.set(r.eh_subjects.id, r.eh_subjects)
      })
      setSubjects(Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name)))
    }
    loadSubjects()
  }, [grade])

  useEffect(() => {
    setTopicId('')
    setTopics([])

    if (!grade || !subjectId) return

    async function loadTopics() {
      const gradesToInclude = grade === '9' || grade === '10' ? [grade, '9-10'] : [grade]

      const { data } = await supabase
        .from('eh_topics')
        .select('id, name')
        .in('grade_level', gradesToInclude)
        .eq('subject_id', subjectId)
        .order('name', { ascending: true })
        .range(0, 4999)

      setTopics(data || [])
    }
    loadTopics()
  }, [grade, subjectId])

  function handleImageSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      setError('Please select an image file.')
      return
    }

    setImageFile(file)
    setImagePreview(URL.createObjectURL(file))
    setError('')
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    if (!userId) return

    if (!grade) {
      setError('Please select a grade level.')
      return
    }
    if (!showNewTopic && !topicId) {
      setError('Please select a topic, or choose to add a new one.')
      return
    }
    if (showNewTopic && newTopicName.trim().length === 0) {
      setError('Please enter a topic name.')
      return
    }
    if (style !== 'diagram' && content.trim().length < 10) {
      setError('Your explanation is too short. Add a bit more detail.')
      return
    }
    if (style === 'diagram' && !imageFile) {
      setError('Please upload a diagram image.')
      return
    }

    setSubmitting(true)

    let finalTopicId = topicId

    if (showNewTopic) {
      const trimmedName = newTopicName.trim()
      const { data: newTopic, error: topicError } = await supabase
        .from('eh_topics')
        .insert({
          name: trimmedName,
          name_normalized: trimmedName.toLowerCase(),
          created_by: userId,
          subject_id: subjectId || null,
          grade_level: grade,
        })
        .select('id')
        .single()

      if (topicError || !newTopic) {
        setError(topicError?.message || 'Could not create topic.')
        setSubmitting(false)
        return
      }
      finalTopicId = newTopic.id
    }

    let imageUrl: string | null = null

    if (style === 'diagram' && imageFile) {
      setUploadingImage(true)

      try {
        const webpBlob = await convertToWebP(imageFile)
        const fileName = `${userId}-${Date.now()}.webp`

        const { error: uploadError } = await supabase.storage
          .from('diagrams')
          .upload(fileName, webpBlob, { contentType: 'image/webp' })

        if (uploadError) {
          setError('Image upload failed: ' + uploadError.message)
          setUploadingImage(false)
          setSubmitting(false)
          return
        }

        const { data: publicUrlData } = supabase.storage
          .from('diagrams')
          .getPublicUrl(fileName)

        imageUrl = publicUrlData.publicUrl
      } catch (err) {
        setError('Could not process image. Try a different file.')
        setUploadingImage(false)
        setSubmitting(false)
        return
      }

      setUploadingImage(false)
    }

    const { error: explError } = await supabase
      .from('eh_explanations')
      .insert({
        topic_id: finalTopicId,
        author_id: userId,
        style,
        content: content.trim() || (style === 'diagram' ? 'See diagram above.' : ''),
        image_url: imageUrl,
      })

    if (explError) {
      setError(explError.message)
      setSubmitting(false)
      return
    }

    setSuccess(true)
    setSubmitting(false)

    setTimeout(() => {
      router.push(`/topic/${finalTopicId}`)
    }, 1200)
  }

  if (checkingAuth) {
    return <div style={{ padding: 40 }}>Checking login...</div>
  }

  return (
    <div style={{ padding: '48px 24px', maxWidth: 600, margin: '0 auto' }}>
      <h1 style={{ fontSize: 28, marginBottom: 8 }}>
        Submit an Explanation
      </h1>
      <p style={{ color: 'var(--color-ink-soft)', marginBottom: 24 }}>
        Pick the grade, subject, and topic — then explain it your own way.
      </p>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div>
          <label style={{ display: 'block', marginBottom: 6, fontWeight: 600 }}>Grade Level</label>
          <select
            value={grade}
            onChange={(e) => setGrade(e.target.value)}
            className="input-field"
            required
          >
            <option value="">Select grade level...</option>
            {GRADE_OPTIONS.map((g) => (
              <option key={g} value={g}>{gradeLabel(g)}</option>
            ))}
          </select>
        </div>

        {grade && (
          <div>
            <label style={{ display: 'block', marginBottom: 6, fontWeight: 600 }}>Subject</label>
            <select
              value={subjectId}
              onChange={(e) => setSubjectId(e.target.value)}
              className="input-field"
              required
            >
              <option value="">Select subject...</option>
              {subjects.map((s) => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>
        )}

        {grade && subjectId && !showNewTopic && (
          <div>
            <label style={{ display: 'block', marginBottom: 6, fontWeight: 600 }}>Topic</label>
            <select
              value={topicId}
              onChange={(e) => setTopicId(e.target.value)}
              className="input-field"
            >
              <option value="">Select topic...</option>
              {topics.map((t) => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
            <button
              type="button"
              onClick={() => setShowNewTopic(true)}
              style={{
                marginTop: 8,
                background: 'none',
                border: 'none',
                color: 'var(--color-coral)',
                fontWeight: 600,
                fontSize: 13,
                cursor: 'pointer',
                padding: 0,
              }}
            >
              Can't find your topic? Add a new one →
            </button>
          </div>
        )}

        {grade && subjectId && showNewTopic && (
          <div>
            <label style={{ display: 'block', marginBottom: 6, fontWeight: 600 }}>New Topic Name</label>
            <input
              type="text"
              value={newTopicName}
              onChange={(e) => setNewTopicName(e.target.value)}
              placeholder="e.g. Photosynthesis"
              className="input-field"
              required
            />
            <button
              type="button"
              onClick={() => { setShowNewTopic(false); setNewTopicName('') }}
              style={{
                marginTop: 8,
                background: 'none',
                border: 'none',
                color: 'var(--color-ink-soft)',
                fontSize: 13,
                cursor: 'pointer',
                padding: 0,
              }}
            >
              ← Back to existing topics
            </button>
          </div>
        )}

        <div>
          <label style={{ display: 'block', marginBottom: 6, fontWeight: 600 }}>Style</label>
          <select
            value={style}
            onChange={(e) => setStyle(e.target.value)}
            className="input-field"
          >
            {STYLES.map((s) => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </select>
        </div>

        {style === 'diagram' && (
          <div>
            <label style={{ display: 'block', marginBottom: 6, fontWeight: 600 }}>Diagram Image</label>
            <input
              type="file"
              accept="image/jpeg,image/jpg,image/png,image/webp"
              onChange={handleImageSelect}
              className="input-field"
            />
            <p style={{ fontSize: 12, color: 'var(--color-ink-soft)', marginTop: 4 }}>
              JPG, PNG, or WebP — it will be automatically converted to WebP to save space.
            </p>
            {imagePreview && (
              <img
                src={imagePreview}
                alt="Preview"
                style={{ marginTop: 10, maxWidth: '100%', borderRadius: 8, border: '1px solid var(--color-border)' }}
              />
            )}
          </div>
        )}

        <div>
          <label style={{ display: 'block', marginBottom: 6, fontWeight: 600 }}>
            {style === 'diagram' ? 'Caption (optional)' : 'Your explanation'}
          </label>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={style === 'diagram' ? 3 : 6}
            placeholder={style === 'diagram' ? 'Optional caption for your diagram...' : 'Write it your way...'}
            required={style !== 'diagram'}
            className="input-field"
            style={{ fontFamily: 'inherit' }}
          />
        </div>

        {error && <p style={{ color: 'crimson' }}>{error}</p>}
        {success && <p style={{ color: 'green' }}>Submitted! Redirecting...</p>}

        <button type="submit" disabled={submitting} className="btn-primary" style={{ padding: 14, fontSize: 15 }}>
          {uploadingImage ? 'Uploading image...' : submitting ? 'Submitting...' : 'Submit Explanation'}
        </button>
      </form>
    </div>
  )
}