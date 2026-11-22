'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
export default function Cart() {
  const [items, setItems] = useState<any[] | null>(null); const [user, setUser] = useState<any>(null)
  const load = async () => {
    const { data: u } = await supabase.auth.getUser(); setUser(u.user)
    if (!u.user) return setItems([])
    const { data } = await supabase.from('cart_items').select('id,qty,product_variants(id,size,color,stock,products(name,slug,price,discount_price,product_images(url)))')
    setItems(data ?? [])
  }
  useEffect(() => { load() }, [])
  const price = (i: any) => i.product_variants.products.discount_price ?? i.product_variants.products.price
  const total = (items ?? []).reduce((s, i) => s + price(i) * i.qty, 0)
  const setQty = async (i: any, q: number) => { if (q < 1 || q > i.product_variants.stock) return; await supabase.from('cart_items').update({ qty: q }).eq('id', i.id); load() }
  const del = async (i: any) => { await supabase.from('cart_items').delete().eq('id', i.id); load() }
  if (!items) return <main className="p-20 text-center">Loading…</main>
  return (<main className="max-w-3xl mx-auto px-4 py-10">
    <h1 className="font-display text-4xl uppercase mb-6">Your Bag</h1>
    {!user ? <p>Please <button className="underline" onClick={() => window.dispatchEvent(new Event('dz:auth'))}>log in</button> to see your bag.</p>
      : !items.length ? <p>Your bag is empty. <Link href="/products" className="underline">Start shopping</Link></p> : <>
      {items.map(i => { const v = i.product_variants, p = v.products; return (
        <div key={i.id} className="flex gap-3 sm:gap-4 border-b py-4">
          <img src={p.product_images?.[0]?.url} className="w-16 h-24 sm:w-20 sm:h-28 object-cover bg-neutral-100" />
          <div className="flex-1"><Link href={`/products/${p.slug}`} className="font-medium">{p.name}</Link>
            <p className="text-sm text-neutral-600">{v.color} / {v.size}</p>
            <div className="flex items-center gap-3 mt-2"><button onClick={() => setQty(i, i.qty - 1)} className="border w-8 h-8">−</button>{i.qty}
              <button onClick={() => setQty(i, i.qty + 1)} className="border w-8 h-8">+</button>
              <button onClick={() => del(i)} className="text-sm underline ml-4">Remove</button></div></div>
          <b>₹{price(i) * i.qty}</b></div>) })}
      <p className="flex justify-between text-lg mt-6"><span>Subtotal</span><b>₹{total}</b></p>
      <p className="text-sm text-neutral-500">Shipping and coupons are applied at checkout.</p>
      <Link href="/checkout" className="block text-center bg-black text-white py-4 mt-6">Checkout</Link></>}
  </main>)
}
