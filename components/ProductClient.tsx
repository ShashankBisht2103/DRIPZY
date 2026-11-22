'use client'
import { useState } from 'react'
import { supabase } from '@/lib/supabase'
const ORDER = ['XS', 'S', 'M', 'L', 'XL', 'XXL']
export default function ProductClient({ p }: { p: any }) {
  const imgs = [...p.product_images].sort((a: any, b: any) => a.sort_order - b.sort_order)
  const [i, setI] = useState(0); const [zoom, setZoom] = useState(false)
  const colors = [...new Set<string>(p.product_variants.map((v: any) => v.color))]
  const [color, setColor] = useState(colors[0] ?? ''); const [size, setSize] = useState(''); const [msg, setMsg] = useState('')
  const vs = p.product_variants.filter((v: any) => v.color === color)
  const sizes = ORDER.filter(s => vs.some((v: any) => v.size === s))
  const variant = vs.find((v: any) => v.size === size)
  const sale = p.discount_price && p.discount_price < p.price
  async function needUser() {
    const { data } = await supabase.auth.getUser()
    if (!data.user) { window.dispatchEvent(new Event('dz:auth')); return null }
    return data.user
  }
  async function add(buy = false) {
    if (!variant) return setMsg('Select a size first.')
    if (variant.stock < 1) return setMsg('This size is out of stock.')
    const u = await needUser(); if (!u) return
    const { data: ex } = await supabase.from('cart_items').select('id,qty').eq('variant_id', variant.id).maybeSingle()
    const r = ex ? await supabase.from('cart_items').update({ qty: Math.min(ex.qty + 1, variant.stock) }).eq('id', ex.id)
      : await supabase.from('cart_items').insert({ user_id: u.id, variant_id: variant.id, qty: 1 })
    if (r.error) return setMsg(r.error.message)
    if (buy) location.href = '/checkout'; else setMsg('Added to bag.')
  }
  async function wish() {
    const u = await needUser(); if (!u) return
    await supabase.from('wishlist').upsert({ user_id: u.id, product_id: p.id }); setMsg('Saved to wishlist.')
  }
  return (<div className="grid md:grid-cols-2 gap-10">
    <div>
      <div onClick={() => setZoom(!zoom)} className="aspect-[3/4] bg-neutral-100 overflow-hidden cursor-zoom-in">
        {imgs[i] && <img src={imgs[i].url} alt={p.name} className={`w-full h-full object-cover transition-transform duration-300 ${zoom ? 'scale-150' : ''}`} />}</div>
      <div className="flex gap-2 mt-2">{imgs.map((m: any, k: number) => (
        <img key={m.id} src={m.url} onClick={() => setI(k)} className={`w-16 h-20 object-cover cursor-pointer ${k === i ? 'ring-2 ring-black' : ''}`} />))}</div>
    </div>
    <div>
      <h1 className="font-display text-4xl uppercase">{p.name}</h1>
      <p className="text-xl my-3">{sale ? <><b>₹{p.discount_price}</b> <s className="text-neutral-500">₹{p.price}</s></> : <b>₹{p.price}</b>}</p>
      <p className="font-semibold mt-6 mb-2">Colour: {color}</p>
      <div className="flex gap-2">{colors.map(c => <button key={c} onClick={() => { setColor(c); setSize('') }} className={`px-3 py-1 border ${c === color ? 'bg-black text-white' : ''}`}>{c}</button>)}</div>
      <p className="font-semibold mt-6 mb-2">Size</p>
      <div className="flex gap-2 flex-wrap">{sizes.map(s => { const v = vs.find((x: any) => x.size === s)
        return <button key={s} disabled={v.stock < 1} onClick={() => setSize(s)} className={`w-12 h-12 border disabled:opacity-30 disabled:line-through ${s === size ? 'bg-black text-white' : ''}`}>{s}</button> })}</div>
      {variant && variant.stock <= 5 && variant.stock > 0 && <p className="text-sm text-red-600 mt-2">Only {variant.stock} left</p>}
      {msg && <p className="text-sm mt-4">{msg}</p>}
      <div className="flex gap-3 mt-6">
        <button onClick={() => add()} className="flex-1 bg-black text-white py-4">Add to Bag</button>
        <button onClick={() => add(true)} className="flex-1 border border-black py-4">Buy Now</button>
        <button onClick={wish} aria-label="Wishlist" className="border w-14 text-xl">♡</button></div>
      <details className="mt-8 border-t pt-4"><summary className="cursor-pointer font-semibold">Size guide</summary>
        <table className="text-sm mt-3 w-full text-left"><thead><tr><th>Size</th><th>Chest (in)</th><th>Length (in)</th></tr></thead><tbody>
          {[['S', 38, 27], ['M', 40, 28], ['L', 42, 29], ['XL', 44, 30], ['XXL', 46, 31]].map(r => <tr key={r[0]}><td>{r[0]}</td><td>{r[1]}</td><td>{r[2]}</td></tr>)}</tbody></table></details>
      <details open className="mt-4 border-t pt-4"><summary className="font-semibold cursor-pointer">Description</summary><p className="mt-2 text-neutral-700 whitespace-pre-line">{p.description}</p></details>
      {p.material && <details className="mt-4 border-t pt-4"><summary className="font-semibold cursor-pointer">Material</summary><p className="mt-2 text-neutral-700">{p.material}</p></details>}
    </div></div>)
}
