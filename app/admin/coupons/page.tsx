'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
export default function Coupons() {
  const [r, setR] = useState<any[]>([]); const [f, setF] = useState({ code: '', percent_off: '', flat_off: '', min_order: '', expires_at: '' }); const [msg, setMsg] = useState('')
  const load = () => supabase.from('coupons').select('*').then(({ data }) => setR(data ?? [])); useEffect(() => { load() }, [])
  const set = (k: string) => (e: any) => setF({ ...f, [k]: e.target.value }); const inp = 'border px-2 py-2'
  async function add(e: any) { e.preventDefault()
    const { error } = await supabase.from('coupons').insert({ code: f.code.trim().toUpperCase(), percent_off: f.percent_off ? +f.percent_off : null, flat_off: f.flat_off ? +f.flat_off : null, min_order: +f.min_order || 0, expires_at: f.expires_at || null })
    setMsg(error ? error.message : 'Coupon created.'); load() }
  return (<div className="max-w-2xl"><h1 className="font-display text-3xl uppercase mb-4">Discounts & Coupons</h1>
    <form onSubmit={add} className="grid grid-cols-2 gap-2 mb-4 text-sm"><input required className={inp} placeholder="CODE" value={f.code} onChange={set('code')} />
      <input className={inp} type="number" placeholder="% off" value={f.percent_off} onChange={set('percent_off')} /><input className={inp} type="number" placeholder="or flat ₹ off" value={f.flat_off} onChange={set('flat_off')} />
      <input className={inp} type="number" placeholder="Min order ₹" value={f.min_order} onChange={set('min_order')} /><input className={inp} type="date" value={f.expires_at} onChange={set('expires_at')} />
      <button className="bg-black text-white">Create coupon</button></form>{msg && <p className="text-sm mb-3">{msg}</p>}
    {r.map(c => <div key={c.code} className="border p-2 mb-2 flex gap-4 items-center text-sm"><b className="flex-1">{c.code}</b><span>{c.percent_off ? c.percent_off + '%' : '₹' + c.flat_off} · min ₹{c.min_order}</span>
      <label><input type="checkbox" checked={c.is_active} onChange={async e => { await supabase.from('coupons').update({ is_active: e.target.checked }).eq('code', c.code); load() }} /> Active</label>
      <button className="text-red-600" onClick={async () => { await supabase.from('coupons').delete().eq('code', c.code); load() }}>Delete</button></div>)}</div>)
}
