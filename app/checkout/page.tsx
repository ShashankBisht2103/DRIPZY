'use client'
import { useState } from 'react'
import { supabase } from '@/lib/supabase'
export default function Checkout() {
  const [f, setF] = useState<any>({ name: '', phone: '', email: '', line1: '', line2: '', city: '', state: '', pincode: '', coupon: '' })
  const [err, setErr] = useState(''); const [busy, setBusy] = useState(false)
  const set = (k: string) => (e: any) => setF({ ...f, [k]: e.target.value })
  async function pay(e: any) {
    e.preventDefault(); setErr(''); setBusy(true)
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) { setBusy(false); return window.dispatchEvent(new Event('dz:auth')) }
    const { coupon, email, ...address } = f
    const r = await fetch('/api/checkout', { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` },
      body: JSON.stringify({ address, email, coupon }) })
    const d = await r.json(); setBusy(false)
    if (!r.ok) return setErr(d.error)
    await new Promise<void>(res => { const s = document.createElement('script'); s.src = 'https://checkout.razorpay.com/v1/checkout.js'; s.onload = () => res(); document.body.appendChild(s) })
    new (window as any).Razorpay({ key: d.key, amount: d.amount, currency: 'INR', name: 'DRIPZY', order_id: d.rzpOrderId,
      prefill: { name: f.name, email: f.email, contact: f.phone }, theme: { color: '#000000' },
      handler: () => { location.href = `/order/${d.orderId}` } }).open()   // order is confirmed by the webhook, not by this callback
  }
  const inp = 'w-full border border-neutral-300 px-3 py-3 outline-none focus:border-black'
  const field = (k: string, ph: string, req = true, cls = '') => <input className={`${inp} ${cls}`} placeholder={ph} required={req} value={f[k]} onChange={set(k)} />
  return (<main className="max-w-xl mx-auto px-4 py-10"><h1 className="font-display text-4xl uppercase mb-6">Checkout</h1>
    <form onSubmit={pay} className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      {field('name', 'Full name', true, 'sm:col-span-2')}{field('phone', 'Mobile number')}{field('email', 'Email')}
      {field('line1', 'Address line 1', true, 'sm:col-span-2')}{field('line2', 'Address line 2 (optional)', false, 'sm:col-span-2')}
      {field('city', 'City')}{field('state', 'State')}{field('pincode', 'PIN code')}{field('coupon', 'Coupon code (optional)', false)}
      {err && <p className="sm:col-span-2 text-red-600 text-sm">{err}</p>}
      <button disabled={busy} className="sm:col-span-2 bg-black text-white py-4 disabled:opacity-50">{busy ? 'Please wait…' : 'Pay securely with Razorpay'}</button>
      <p className="sm:col-span-2 text-xs text-neutral-500">Online payment only. Shipping outside Delhi is ₹100; the final total is calculated securely at payment.</p>
    </form></main>)
}
