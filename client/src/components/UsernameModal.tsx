import { useState, useRef, useEffect } from 'react'
import { useUserProfile, validateUsername } from '../context/UserProfileContext'

interface UsernameModalProps {
  /** If true, user can cancel (edit mode). If false, modal is a blocker (initial setup). */
  canCancel?: boolean
  onComplete?: () => void
  onCancel?: () => void
}

export function UsernameModal({ canCancel = false, onComplete, onCancel }: UsernameModalProps) {
  const { username, setUsername } = useUserProfile()
  const [value, setValue] = useState(username ?? '')
  const [error, setError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const raw = e.target.value
    // Allow typing but strip invalid chars and cap length
    const cleaned = raw.replace(/[^a-zA-Z0-9]/g, '').slice(0, 30)
    setValue(cleaned)
    if (error) setError(null)
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const validationError = validateUsername(value)
    if (validationError) {
      setError(validationError)
      return
    }
    try {
      setUsername(value)
      onComplete?.()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to set username.')
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Escape' && canCancel) {
      onCancel?.()
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(4px)' }}
      onKeyDown={handleKeyDown}
    >
      <div
        className="w-full max-w-sm rounded-2xl p-6 space-y-5"
        style={{
          background: 'var(--color-surface-800)',
          border: '1px solid rgba(255,255,255,0.08)',
          boxShadow: 'var(--shadow-float)',
        }}
      >
        {/* Header */}
        <div className="space-y-1.5">
          <h2 className="text-white font-bold text-lg">
            {canCancel ? 'Change username' : 'Choose a username'}
          </h2>
          <p className="text-white/40 text-sm leading-relaxed">
            {canCancel
              ? 'Your username is how others see you in chat.'
              : 'Pick a username to get started. Letters and numbers only.'}
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <input
              ref={inputRef}
              type="text"
              value={value}
              onChange={handleChange}
              placeholder="e.g. coolbrah99"
              maxLength={30}
              autoComplete="off"
              spellCheck={false}
              className="w-full rounded-lg px-3.5 py-2.5 text-white text-sm font-medium outline-none transition-all"
              style={{
                background: 'var(--color-surface-700)',
                border: `1px solid ${error ? 'rgba(239,68,68,0.5)' : 'rgba(255,255,255,0.1)'}`,
                boxShadow: error ? '0 0 0 3px rgba(239,68,68,0.1)' : undefined,
              }}
              onFocus={e => {
                e.currentTarget.style.borderColor = error
                  ? 'rgba(239,68,68,0.7)'
                  : 'rgba(255,255,255,0.25)'
              }}
              onBlur={e => {
                e.currentTarget.style.borderColor = error
                  ? 'rgba(239,68,68,0.5)'
                  : 'rgba(255,255,255,0.1)'
              }}
            />
            <div className="flex items-center justify-between">
              <p className={`text-xs ${error ? 'text-red-400' : 'text-transparent'}`}>
                {error ?? '\u00a0'}
              </p>
              <p className="text-xs text-white/25">{value.length}/30</p>
            </div>
          </div>

          <div className="flex gap-2">
            {canCancel && (
              <button
                type="button"
                onClick={onCancel}
                className="flex-1 rounded-lg px-4 py-2.5 text-sm font-medium text-white/50 hover:text-white/80 transition-colors cursor-pointer"
                style={{
                  background: 'var(--color-surface-700)',
                  border: '1px solid rgba(255,255,255,0.06)',
                }}
              >
                Cancel
              </button>
            )}
            <button
              type="submit"
              className="flex-1 rounded-lg px-4 py-2.5 text-sm font-semibold text-white transition-all cursor-pointer disabled:opacity-40"
              style={{
                background: value.length > 0 ? 'var(--color-accent-500)' : 'var(--color-surface-600)',
              }}
              disabled={value.length === 0}
            >
              {canCancel ? 'Save' : 'Set Username'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
