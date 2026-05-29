import { useState, FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { Eye, EyeOff, Lock, AlertCircle } from 'lucide-react'
import { adminAuthApi, setAdminToken } from '../services/api'

export default function AdminLogin() {
  const navigate = useNavigate()
  const [code, setCode]         = useState('')
  const [visible, setVisible]   = useState(false)
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState<string | null>(null)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!code.trim()) return
    setLoading(true)
    setError(null)
    try {
      const res = await adminAuthApi.login(code.trim())
      if (res.success && res.data.token) {
        setAdminToken(res.data.token)
        navigate('/admin', { replace: true })
      } else {
        setError('Invalid access code.')
      }
    } catch {
      setError('Invalid access code. Access denied.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-obsidian flex items-center justify-center p-4">
      {/* Subtle grid background */}
      <div
        className="fixed inset-0 pointer-events-none opacity-[0.03]"
        style={{
          backgroundImage:
            'linear-gradient(#c9a84c 1px, transparent 1px), linear-gradient(90deg, #c9a84c 1px, transparent 1px)',
          backgroundSize: '60px 60px',
        }}
      />

      <div className="w-full max-w-sm relative">
        {/* Logo */}
        <div className="flex flex-col items-center mb-10">
          <div className="mb-5">
            <svg width="56" height="56" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
              <polygon points="24,2 43,13 43,35 24,46 5,35 5,13" stroke="#c9a84c" strokeWidth="1.5" fill="none" />
              <polygon points="24,9 38,17 38,31 24,39 10,31 10,17" stroke="#c9a84c" strokeWidth="1" fill="#c9a84c" fillOpacity="0.08" />
              <polygon points="24,16 31,24 24,32 17,24" fill="#c9a84c" fillOpacity="0.7" />
              <circle cx="24" cy="24" r="2.5" fill="#c9a84c" />
            </svg>
          </div>
          <h1
            className="font-serif text-xl font-semibold tracking-[0.18em] text-off-white uppercase"
            style={{ letterSpacing: '0.15em' }}
          >
            Obsidian Capital
          </h1>
          <p className="text-xs font-medium tracking-[0.3em] mt-1" style={{ color: '#c9a84c', letterSpacing: '0.25em' }}>
            ADMIN PORTAL
          </p>
        </div>

        {/* Card */}
        <div className="bg-surface border border-border rounded-xl p-8 shadow-2xl">
          <div className="mb-6">
            <h2 className="text-base font-semibold text-off-white mb-1">Restricted Access</h2>
            <p className="text-xs text-off-white/40">Enter your admin access code to continue.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-off-white/50 mb-2">
                Access Code
              </label>
              <div className="relative">
                <div className="absolute left-3 top-1/2 -translate-y-1/2">
                  <Lock size={14} className="text-off-white/30" />
                </div>
                <input
                  type={visible ? 'text' : 'password'}
                  value={code}
                  onChange={(e) => { setCode(e.target.value); setError(null) }}
                  placeholder="Enter access code…"
                  autoComplete="off"
                  spellCheck={false}
                  className="w-full bg-surface-2 border border-border rounded-lg pl-9 pr-10 py-3 text-sm text-off-white placeholder-off-white/20 focus:outline-none focus:border-gold/50 transition-colors font-mono"
                />
                <button
                  type="button"
                  onClick={() => setVisible((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-off-white/30 hover:text-off-white/60 transition-colors"
                >
                  {visible ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
            </div>

            {error && (
              <div className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg bg-loss/10 border border-loss/25">
                <AlertCircle size={13} className="text-loss flex-shrink-0" />
                <span className="text-xs text-loss">{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !code.trim()}
              className="w-full py-3 rounded-lg text-sm font-semibold transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed"
              style={{
                background: loading || !code.trim() ? '#2a2a2a' : 'linear-gradient(135deg, #c9a84c, #e8c96e)',
                color: loading || !code.trim() ? '#f0ede8' : '#0a0a0a',
              }}
            >
              {loading ? 'Verifying…' : 'Access Admin Portal'}
            </button>
          </form>
        </div>

        <p className="text-center text-xs text-off-white/20 mt-6">
          Unauthorized access attempts are logged and reported.
        </p>
      </div>
    </div>
  )
}
