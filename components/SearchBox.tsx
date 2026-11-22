'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
export default function SearchBox() {
  const [q, setQ] = useState(''); const [s, setS] = useState<any[]>([]); const r = useRouter()
  useEffect(() => { if (q.trim().length < 2) return setS([])
    const t = setTimeout(async () => { const x = q.replace(/[%,()]/g, '')
      const { data } = await supabase.from('products').select('name,slug').eq('is_active', true).or(`name.ilike.%${x}%,description.ilike.%${x}%`).limit(5); setS(data ?? []) }, 250)
    return () => clearTimeout(t) }, [q])
  return (<form className="relative hidden md:block" onSubmit={e => { e.preventDefault(); r.push(`/products?q=${encodeURIComponent(q)}`); setS([]) }}>
    <input value={q} onChange={e => setQ(e.target.value)} placeholder="Search" className="bg-neutral-800 px-3 py-1 text-sm w-40 outline-none" />
    {!!s.length && <ul className="absolute top-9 left-0 w-64 bg-white text-black shadow z-50">{s.map(p => <li key={p.slug}><a href={`/products/${p.slug}`} className="block px-3 py-2 text-sm hover:bg-neutral-100">{p.name}</a></li>)}</ul>}
  </form>)
}
