'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import AuthModal from './AuthModal'
import SearchBox from './SearchBox'

export default function Navbar() {
  const [open, setOpen] = useState(false)
  const [auth, setAuth] = useState(false)
  const [cats, setCats] = useState<any[]>([])
  const [user, setUser] = useState<any>(null)
  const [isAdmin, setIsAdmin] = useState(false)
  useEffect(() => {
    supabase.from('categories').select('id,name,slug,parent_id').eq('show_in_sidebar', true).order('sort_order')
      .then(({ data }) => setCats(data ?? []))
    supabase.auth.getUser().then(({ data }) => setUser(data.user))
    const { data: s } = supabase.auth.onAuthStateChange(async (event, sess) => {
      setUser(sess?.user ?? null)
      if (event === 'SIGNED_IN' && sess?.user) {
        const { data: profile } = await supabase.from('profiles').select('role').eq('id', sess.user.id).single()
        if (profile?.role === 'admin') window.location.assign('/admin')
      }
    })
    const ev = () => setAuth(true); window.addEventListener('dz:auth', ev)
    const t = setTimeout(() => { if (!localStorage.getItem('dz_seen')) { setAuth(true); localStorage.setItem('dz_seen', '1') } }, 25000)
    return () => { window.removeEventListener('dz:auth', ev); s.subscription.unsubscribe(); clearTimeout(t) }
  }, [])
  useEffect(() => {
    if (!user) { setIsAdmin(false); return }
    let active = true
    supabase.from('profiles').select('role').eq('id', user.id).single().then(({ data, error }) => {
      if (!active) return
      if (error) console.error('Could not check account role:', error.message)
      setIsAdmin(data?.role === 'admin')
    })
    return () => { active = false }
  }, [user])
  const top = cats.filter(c => !c.parent_id)
  return (<>
    <header className="sticky top-0 z-40 bg-black text-white">
      <div className="max-w-6xl mx-auto px-3 sm:px-4 h-16 flex items-center gap-2 sm:gap-4 md:gap-6">
        <button aria-label="Menu" onClick={() => setOpen(true)} className="text-2xl">☰</button>
        <Link href="/" aria-label="DRIPZY home"><img src="/dripzy-logo.png" alt="DRIPZY" className="h-9 sm:h-12" /></Link>
        <nav className="hidden md:flex gap-6 text-sm ml-6">
          <Link href="/">Home</Link><Link href="/products?new=1">New Arrivals</Link><Link href="/products">All Products</Link>
        </nav>
        <div className="ml-auto flex items-center gap-2 sm:gap-3 md:gap-4 text-sm">
          <SearchBox /><Link href="/account?tab=wishlist" aria-label="Wishlist" className="text-lg">♡</Link><Link href="/account" aria-label="Account"><span className="hidden sm:inline">Account</span><span className="sm:hidden">A</span></Link>{isAdmin && <Link href="/admin" className="hidden sm:inline">Admin</Link>}<Link href="/cart" aria-label="Shopping bag"><span className="hidden sm:inline">Bag</span><span className="sm:hidden">B</span></Link>{user ? <button className="hidden sm:inline" onClick={() => supabase.auth.signOut()}>Logout</button> : <button onClick={() => setAuth(true)}>Login</button>}
        </div>
      </div>
    </header>
    <div className={`fixed inset-0 z-50 ${open ? '' : 'pointer-events-none'}`}>
      <div onClick={() => setOpen(false)} className={`absolute inset-0 bg-black/60 transition-opacity ${open ? 'opacity-100' : 'opacity-0'}`} />
      <aside className={`absolute left-0 top-0 h-full w-80 bg-white p-6 overflow-y-auto transition-transform duration-300 ${open ? 'translate-x-0' : '-translate-x-full'}`}>
        <button onClick={() => setOpen(false)} className="text-2xl mb-6">✕</button>
        <ul className="space-y-1 text-lg font-semibold">
          {isAdmin && <li><Link onClick={() => setOpen(false)} href="/admin" className="block py-2 text-red-700">Admin Dashboard</Link></li>}
          <li><Link onClick={() => setOpen(false)} href="/products" className="block py-2">All Products</Link></li>
          {top.map(c => (<li key={c.id}>
            <Link onClick={() => setOpen(false)} href={`/products?cat=${c.slug}`} className="block py-2">{c.name}</Link>
            {cats.filter(s => s.parent_id === c.id).map(s => (
              <Link key={s.id} onClick={() => setOpen(false)} href={`/products?cat=${s.slug}`} className="block py-1 pl-4 text-sm font-normal text-neutral-600">{s.name}</Link>))}
          </li>))}
        </ul>
      </aside>
    </div>
    {auth && <AuthModal onClose={() => setAuth(false)} />}
  </>)
}
