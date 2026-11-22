'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
const STATUS = ['confirmed', 'packed', 'shipped', 'delivered', 'cancelled']
export default function Orders() {
  const [rows, setRows] = useState<any[]>([])
  const load = () => supabase.from('orders').select('*, order_items(*)').neq('status', 'pending_payment').order('created_at', { ascending: false }).then(({ data }) => setRows(data ?? []))
  useEffect(() => { load() }, [])
  async function setStatus(o: any, status: string) {
    await supabase.from('orders').update({ status }).eq('id', o.id)
    await supabase.from('order_events').insert({ order_id: o.id, status, note: 'Updated by admin' }); load() }
  return (<div><h1 className="font-display text-3xl uppercase mb-6">Orders</h1>
    {!rows.length && <p className="text-neutral-500">No paid orders yet.</p>}
    {rows.map(o => (<div key={o.id} className="border p-4 mb-3 text-sm">
      <div className="flex justify-between"><b>{o.order_no}</b><span>₹{o.total} · {o.payment_status}</span></div>
      <p className="text-neutral-600">{o.address.name}, {o.address.phone}, {o.address.line1}, {o.address.city}, {o.address.state} {o.address.pincode}</p>
      <p>{o.order_items.map((i: any) => `${i.product_name} ${i.size}/${i.color} ×${i.qty}`).join(' · ')}</p>
      <select value={o.status} onChange={e => setStatus(o, e.target.value)} className="border mt-2 p-1">{STATUS.map(s => <option key={s}>{s}</option>)}</select></div>))}
  </div>)
}
