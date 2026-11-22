'use client'
import { useState } from 'react'
import { supabase } from '@/lib/supabase'

export default function AuthModal({ onClose }: { onClose: () => void }) {
  const [mode, setMode] = useState<'welcome' | 'login' | 'signup'>('welcome')
  const [f, setF] = useState({ name: '', email: '', phone: '', pw: '', pw2: '' })
  const [msg, setMsg] = useState(''); const [busy, setBusy] = useState(false)
  const set = (k: string) => (e: any) => setF({ ...f, [k]: e.target.value })
  const google = () => supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: location.origin } })
  async function submit(e: any) {
    e.preventDefault(); setMsg('')
    if (mode === 'signup') {
      if (f.pw.length < 8) return setMsg('Password must be at least 8 characters.')
      if (f.pw !== f.pw2) return setMsg('Passwords do not match.')
      if (!/^[6-9]\d{9}$/.test(f.phone)) return setMsg('Enter a valid 10-digit mobile number.')
    }
    setBusy(true)
    const r = mode === 'signup'
      ? await supabase.auth.signUp({ email: f.email, password: f.pw, options: { data: { full_name: f.name, phone: f.phone } } })
      : await supabase.auth.signInWithPassword({ email: f.email, password: f.pw })
    setBusy(false)
    if (r.error) return setMsg(r.error.message)
    if (mode === 'signup' && !r.data.session) return setMsg('Check your email to confirm your account.')
    if (mode === 'login') {
      const { data: profile, error } = await supabase.from('profiles').select('role').eq('id', r.data.user.id).single()
      if (error) return setMsg(`Signed in, but could not check account access: ${error.message}`)
      if (profile?.role === 'admin') {
        onClose()
        window.location.assign('/admin')
        return
      }
      setMsg('Login successful. This account is not assigned the admin role in Supabase.')
    }
    onClose()
  }
  const inp = 'w-full border border-neutral-300 px-3 py-3 mb-3 outline-none focus:border-black'
  return (<div className="fixed inset-0 z-[60] bg-black/70 flex items-center justify-center p-4" onClick={onClose}>
    <div onClick={e => e.stopPropagation()} className="bg-white w-full max-w-sm p-8 relative">
      <button onClick={onClose} aria-label="Close" className="absolute right-4 top-3 text-xl">✕</button>
      <h2 className="font-display text-3xl mb-1">{mode === 'welcome' ? 'Welcome to DRIPZY' : mode === 'login' ? 'Login' : 'Create account'}</h2>
      {mode === 'welcome' ? (<>
        <p className="text-neutral-600 mb-6">Save your favourites and check out faster.</p>
        <button onClick={() => setMode('login')} className="w-full bg-black text-white py-3 mb-3">Login</button>
        <button onClick={() => setMode('signup')} className="w-full border border-black py-3 mb-3">Create Account</button>
        <button onClick={google} className="w-full border py-3">Continue with Google</button>
      </>) : (<form onSubmit={submit} className="mt-5">
        {mode === 'signup' && <><input className={inp} placeholder="Full name" required value={f.name} onChange={set('name')} />
          <input className={inp} placeholder="Mobile number" required value={f.phone} onChange={set('phone')} /></>}
        <input className={inp} type="email" placeholder="Email" required value={f.email} onChange={set('email')} />
        <input className={inp} type="password" placeholder="Password" required value={f.pw} onChange={set('pw')} />
        {mode === 'signup' && <input className={inp} type="password" placeholder="Confirm password" required value={f.pw2} onChange={set('pw2')} />}
        {msg && <p className="text-red-600 text-sm mb-3">{msg}</p>}
        <button disabled={busy} className="w-full bg-black text-white py-3 mb-3 disabled:opacity-50">{busy ? 'Please wait…' : mode === 'login' ? 'Login' : 'Create account'}</button>
        <button type="button" onClick={google} className="w-full border py-3 mb-3">Continue with Google</button>
        <button type="button" className="text-sm underline" onClick={() => setMode(mode === 'login' ? 'signup' : 'login')}>
          {mode === 'login' ? 'New here? Create an account' : 'Have an account? Login'}</button>
      </form>)}
    </div></div>)
}
