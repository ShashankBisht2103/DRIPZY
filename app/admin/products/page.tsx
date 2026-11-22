'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
const FLAGS: [string, string][] = [['is_featured', 'Featured'], ['is_new_arrival', 'New'], ['is_best_seller', 'Best seller'], ['is_trending', 'Trending'], ['is_sold_out', 'Sold out'], ['is_active', 'Visible']]
const MAX_IMAGE_SIZE = 10 * 1024 * 1024
const IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp']
export default function Manage() {
  const [rows, setRows] = useState<any[]>([]); const [cats, setCats] = useState<any[]>([]); const [open, setOpen] = useState<string | null>(null); const [msg, setMsg] = useState('')
  const load = async () => {
    const { data, error } = await supabase.from('products').select('*, product_images(*), product_variants(*)').order('created_at', { ascending: false })
    if (error) setMsg(`Could not load products: ${error.message}`)
    else setRows(data ?? [])
  }
  useEffect(() => { load(); supabase.from('categories').select('id,name,parent_id').then(({ data, error }) => {
    if (error) setMsg(`Could not load categories: ${error.message}`)
    else setCats(data ?? [])
  }) }, [])
  const upd = async (id: string, patch: any) => { const { error } = await supabase.from('products').update(patch).eq('id', id); setMsg(error ? error.message : 'Saved.'); load() }
  const stock = async (vid: string, n: number) => {
    const { error } = await supabase.from('product_variants').update({ stock: Math.max(0, n) }).eq('id', vid)
    if (error) setMsg(`Could not update stock: ${error.message}`)
    else { setMsg('Stock saved.'); load() }
  }
  async function addImages(p: any, files: FileList | null) {
    if (!files) return
    const selected = Array.from(files)
    const invalidFile = selected.find(f => !IMAGE_TYPES.includes(f.type) || f.size > MAX_IMAGE_SIZE)
    if (invalidFile) return setMsg(`${invalidFile.name} must be a JPG, PNG, or WebP image no larger than 10 MB.`)
    for (const [i, f] of Array.from(files).entries()) {
      const path = `${p.id}/${Date.now()}-${i}-${f.name.replace(/[^\w.]/g, '_')}`
      const up = await supabase.storage.from('product-images').upload(path, f)
      if (up.error) return setMsg(`Could not upload ${f.name}: ${up.error.message}`)
      const { error } = await supabase.from('product_images').insert({ product_id: p.id, url: supabase.storage.from('product-images').getPublicUrl(path).data.publicUrl, sort_order: p.product_images.length + i })
      if (error) return setMsg(`Image uploaded, but its product record could not be saved: ${error.message}`)
    }
    setMsg('Images saved.')
    load()
  }
  const delImg = async (id: string) => {
    const { error } = await supabase.from('product_images').delete().eq('id', id)
    if (error) setMsg(`Could not delete image: ${error.message}`)
    else { setMsg('Image deleted.'); load() }
  }
  async function del(p: any) {
    if (!confirm(`Delete "${p.name}"? This cannot be undone.`)) return
    const { error } = await supabase.from('products').delete().eq('id', p.id)
    setMsg(error ? `Could not delete product: ${error.message}` : 'Deleted.')
    if (!error) load()
  }
  const inp = 'border px-2 py-1 w-full'
  return (<div><h1 className="font-display text-3xl uppercase mb-2">Manage Products</h1>{msg && <p className="text-sm mb-3">{msg}</p>}
    {rows.map(p => (<div key={p.id} className="border mb-3">
      <div className="flex items-center gap-3 p-3 cursor-pointer" onClick={() => setOpen(open === p.id ? null : p.id)}>
        <img src={p.product_images[0]?.url} className="w-12 h-16 object-cover bg-neutral-100" />
        <div className="flex-1"><b>{p.name}</b><p className="text-sm text-neutral-600">₹{p.discount_price ?? p.price} · {p.product_variants.reduce((s: number, v: any) => s + v.stock, 0)} in stock{!p.is_active && ' · hidden'}{p.is_sold_out && ' · sold out'}</p></div>
        <span>{open === p.id ? '▲' : '▼'}</span></div>
      {open === p.id && <Edit p={p} cats={cats} upd={upd} stock={stock} addImages={addImages} delImg={delImg} del={del} inp={inp} />}
    </div>))}</div>)
}
function Edit({ p, cats, upd, stock, addImages, delImg, del, inp }: any) {
  const [d, setD] = useState({ name: p.name, description: p.description ?? '', material: p.material ?? '', price: p.price, discount_price: p.discount_price ?? '', category_id: p.category_id ?? '', subcategory_id: p.subcategory_id ?? '' })
  const set = (k: string) => (e: any) => setD({ ...d, [k]: e.target.value })
  return (<div className="p-4 border-t space-y-3 text-sm">
    <input className={inp} value={d.name} onChange={set('name')} />
    <textarea className={inp} rows={3} value={d.description} onChange={set('description')} />
    <input className={inp} placeholder="Material" value={d.material} onChange={set('material')} />
    <div className="grid grid-cols-2 gap-2"><input className={inp} type="number" value={d.price} onChange={set('price')} />
      <input className={inp} type="number" placeholder="Discounted price" value={d.discount_price} onChange={set('discount_price')} />
      <select className={inp} value={d.category_id} onChange={set('category_id')}><option value="">No category</option>{cats.filter((c: any) => !c.parent_id).map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}</select>
      <select className={inp} value={d.subcategory_id} onChange={set('subcategory_id')}><option value="">No subcategory</option>{cats.filter((c: any) => c.parent_id).map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}</select></div>
    <button className="bg-black text-white px-5 py-2" onClick={() => upd(p.id, { ...d, price: +d.price, discount_price: d.discount_price === '' ? null : +d.discount_price, category_id: d.category_id || null, subcategory_id: d.subcategory_id || null })}>Save changes</button>
    <div className="flex gap-4 flex-wrap">{FLAGS.map(([k, l]) => <label key={k}><input type="checkbox" checked={p[k]} onChange={e => upd(p.id, { [k]: e.target.checked })} /> {l}</label>)}</div>
    <div><b>Stock</b><div className="grid grid-cols-3 gap-2 mt-1">{p.product_variants.map((v: any) => <label key={v.id}>{v.color} {v.size}
      <input type="number" className={inp} defaultValue={v.stock} onBlur={e => +e.target.value !== v.stock && stock(v.id, +e.target.value)} /></label>)}</div></div>
    <div><b>Images</b><div className="flex gap-2 my-2 flex-wrap">{p.product_images.map((m: any) => <div key={m.id} className="relative"><img src={m.url} className="w-16 h-20 object-cover" />
      <button onClick={() => delImg(m.id)} className="absolute top-0 right-0 bg-black text-white w-5 h-5 text-xs">✕</button></div>)}</div>
      <input type="file" multiple accept="image/jpeg,image/png,image/webp" onChange={e => addImages(p, e.target.files)} /></div>
    <button onClick={() => del(p)} className="text-red-600 underline">Delete product</button></div>)
}
