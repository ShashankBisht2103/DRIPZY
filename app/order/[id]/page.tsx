'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
export default function Order({ params }: { params: { id: string } }) {
  const [o, setO] = useState<any>(null)
  useEffect(() => { let n = 0
    const t = setInterval(async () => { const { data } = await supabase.from('orders').select('*, order_items(*)').eq('id', params.id).maybeSingle()
      setO(data); if (data?.payment_status === 'paid' || ++n > 20) clearInterval(t) }, 2000); return () => clearInterval(t) }, [params.id])
  if (!o) return <main className="p-20 text-center">Loading order…</main>
  return (<main className="max-w-xl mx-auto px-4 py-16">
    {o.payment_status === 'paid' ? <><h1 className="font-display text-4xl uppercase">Order confirmed</h1><p className="mt-2">Thank you! Order ID <b>{o.order_no}</b></p></>
      : <><h1 className="font-display text-4xl uppercase">Confirming payment…</h1><p className="mt-2">Order {o.order_no}. This page updates once your payment is verified.</p></>}
    <ul className="mt-6 border-t">{o.order_items.map((i: any) => <li key={i.id} className="flex justify-between py-2 border-b text-sm"><span>{i.product_name} ({i.color}/{i.size}) × {i.qty}</span><span>₹{i.unit_price * i.qty}</span></li>)}</ul>
    <p className="flex justify-between mt-4"><span>Total paid</span><b>₹{o.total}</b></p>
  </main>)
}
