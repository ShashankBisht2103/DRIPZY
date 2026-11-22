'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import ProductCard from '@/components/ProductCard'
const TABS = [['profile', 'My Profile'], ['orders', 'My Orders'], ['wishlist', 'My Wishlist'], ['addresses', 'Saved Addresses']]
export default function Account() {
  const [tab, setTab] = useState('profile'); const [u, setU] = useState<any>(null); const [pr, setPr] = useState<any>({}); const [orders, setOrders] = useState<any[]>([]); const [wish, setWish] = useState<any[]>([]); const [addr, setAddr] = useState<any[]>([])
  const [na, setNa] = useState<any>({ name: '', phone: '', line1: '', city: '', state: '', pincode: '' }); const [msg, setMsg] = useState('')
  const load = async () => {
    const { data } = await supabase.auth.getUser(); setU(data.user); if (!data.user) return
    supabase.from('profiles').select('*').eq('id', data.user.id).single().then(r => setPr(r.data ?? {}))
    supabase.from('orders').select('*, order_items(*), order_events(*)').neq('status', 'pending_payment').order('created_at', { ascending: false }).then(r => setOrders(r.data ?? []))
    supabase.from('wishlist').select('product_id, products(*, product_images(url, sort_order))').then(r => setWish(r.data ?? []))
    supabase.from('addresses').select('*').then(r => setAddr(r.data ?? [])) }
  useEffect(() => { const t = new URLSearchParams(location.search).get('tab'); if (t) setTab(t); load() }, [])
  if (!u) return <main className="p-20 text-center">Please <button className="underline" onClick={() => window.dispatchEvent(new Event('dz:auth'))}>log in</button> to view your account.</main>
  const inp = 'border px-3 py-2 w-full'
  return (<main className="max-w-4xl mx-auto px-4 py-10"><h1 className="font-display text-4xl uppercase mb-6">My Account</h1>
    <div className="flex gap-4 border-b mb-6 text-sm flex-wrap">{TABS.map(([k, l]) => <button key={k} onClick={() => setTab(k)} className={`pb-2 ${tab === k ? 'border-b-2 border-black font-semibold' : ''}`}>{l}</button>)}
      <button className="pb-2 ml-auto" onClick={async () => { await supabase.auth.signOut(); location.href = '/' }}>Logout</button></div>
    {msg && <p className="text-sm mb-3">{msg}</p>}
    {tab === 'profile' && <div className="max-w-sm space-y-3"><p className="text-sm text-neutral-600">{u.email}</p>
      <input className={inp} placeholder="Full name" value={pr.full_name ?? ''} onChange={e => setPr({ ...pr, full_name: e.target.value })} />
      <input className={inp} placeholder="Mobile" value={pr.phone ?? ''} onChange={e => setPr({ ...pr, phone: e.target.value })} />
      <button className="bg-black text-white px-5 py-2" onClick={async () => { const { error } = await supabase.from('profiles').update({ full_name: pr.full_name, phone: pr.phone }).eq('id', u.id); setMsg(error ? error.message : 'Profile saved.') }}>Save</button>
      <div className="pt-4 border-t"><p className="text-sm font-semibold mb-2">Change password</p><input id="npw" type="password" minLength={8} placeholder="New password" className={inp} />
        <button className="border border-black px-4 py-2 mt-2 text-sm" onClick={async () => { const v = (document.getElementById('npw') as HTMLInputElement).value; if (v.length < 8) return setMsg('Use at least 8 characters.'); const { error } = await supabase.auth.updateUser({ password: v }); setMsg(error ? error.message : 'Password updated.') }}>Update password</button></div></div>}
    {tab === 'orders' && (orders.length ? orders.map(o => <div key={o.id} className="border p-4 mb-3 text-sm">
      <div className="flex justify-between"><b>{o.order_no}</b><span>₹{o.total} · <b className="uppercase">{o.status}</b></span></div>
      <p className="text-neutral-600">{o.order_items.map((i: any) => `${i.product_name} ${i.size}/${i.color} ×${i.qty}`).join(' · ')}</p>
      <ol className="mt-2 text-xs text-neutral-600">{[...o.order_events].sort((a: any, b: any) => +new Date(a.created_at) - +new Date(b.created_at)).map((e: any) => <li key={e.id}>{new Date(e.created_at).toLocaleString()}: {e.status}</li>)}</ol></div>) : <p className="text-neutral-500">No orders yet.</p>)}
    {tab === 'wishlist' && (wish.length ? <div className="grid grid-cols-2 md:grid-cols-4 gap-4">{wish.map(w => <div key={w.product_id}><ProductCard p={w.products} />
      <button className="text-xs underline mt-1" onClick={async () => { await supabase.from('wishlist').delete().eq('product_id', w.product_id); load() }}>Remove</button></div>)}</div> : <p className="text-neutral-500">Your wishlist is empty.</p>)}
    {tab === 'addresses' && <div>{addr.map(a => <div key={a.id} className="border p-3 mb-2 text-sm flex justify-between"><span>{a.name}, {a.phone}, {a.line1}, {a.city}, {a.state} {a.pincode}</span>
      <button className="text-red-600" onClick={async () => { await supabase.from('addresses').delete().eq('id', a.id); load() }}>Delete</button></div>)}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-4 max-w-lg">{Object.keys(na).map(k => <input key={k} className={inp} placeholder={k} value={na[k]} onChange={e => setNa({ ...na, [k]: e.target.value })} />)}
        <button className="bg-black text-white py-2 sm:col-span-2" onClick={async () => { await supabase.from('addresses').insert({ ...na, user_id: u.id }); setNa({ name: '', phone: '', line1: '', city: '', state: '', pincode: '' }); load() }}>Save address</button></div></div>}
  </main>)
}
