'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
export default function Settings() {
  const [s, setS] = useState<any>(null); const [msg, setMsg] = useState('')
  useEffect(() => { supabase.from('settings').select('value').eq('key', 'shipping').single().then(({ data }) => setS(data?.value)) }, [])
  if (!s) return <p>Loading…</p>; const set = (k: string) => (e: any) => setS({ ...s, [k]: e.target.value }); const inp = 'border px-3 py-2 w-full'
  async function save(e: any) { e.preventDefault()
    const v = { home_state: s.home_state, home_charge: +s.home_charge, other_charge: +s.other_charge, free_above: s.free_above === '' || s.free_above == null ? null : +s.free_above }
    const { error } = await supabase.from('settings').update({ value: v }).eq('key', 'shipping'); setMsg(error ? error.message : 'Saved.') }
  return (<form onSubmit={save} className="max-w-md space-y-3 text-sm"><h1 className="font-display text-3xl uppercase">Website Settings</h1><h2 className="font-semibold">Shipping rules</h2>
    <label>Home state<input className={inp} value={s.home_state} onChange={set('home_state')} /></label>
    <label>Shipping inside home state (₹)<input type="number" className={inp} value={s.home_charge} onChange={set('home_charge')} /></label>
    <label>Shipping elsewhere (₹)<input type="number" className={inp} value={s.other_charge} onChange={set('other_charge')} /></label>
    <label>Free shipping above (₹, optional)<input type="number" className={inp} value={s.free_above ?? ''} onChange={set('free_above')} /></label>
    {msg && <p>{msg}</p>}<button className="bg-black text-white px-6 py-2">Save</button></form>)
}
