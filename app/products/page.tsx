import { supabase } from '@/lib/supabase'
import ProductCard from '@/components/ProductCard'
import Link from 'next/link'

export default async function Products({ searchParams }: { searchParams: { cat?: string; new?: string; sort?: string; q?: string; size?: string; min?: string; max?: string } }) {
  let q = supabase.from('products').select('*, product_images(url, sort_order)' + (searchParams.size ? ', product_variants!inner(size)' : '')).eq('is_active', true)
  if (searchParams.size) q = q.eq('product_variants.size', searchParams.size)
  if (searchParams.min) q = q.gte('price', +searchParams.min)
  if (searchParams.max) q = q.lte('price', +searchParams.max)
  let title = 'All Products'
  if (searchParams.cat) {
    const { data: c } = await supabase.from('categories').select('id,name').eq('slug', searchParams.cat).maybeSingle()
    if (c) { title = c.name; q = q.or(`category_id.eq.${c.id},subcategory_id.eq.${c.id}`) }
  }
  if (searchParams.new) { q = q.eq('is_new_arrival', true); title = 'New Arrivals' }
  if (searchParams.q) { const t = searchParams.q.replace(/[%,()]/g, ''); q = q.or(`name.ilike.%${t}%,description.ilike.%${t}%,material.ilike.%${t}%`) }
  const s = searchParams.sort
  q = s === 'low' ? q.order('price') : s === 'high' ? q.order('price', { ascending: false }) : q.order('created_at', { ascending: false })
  const { data, error } = await q
  const products: any[] = !error && Array.isArray(data) ? data : []
  const base = (v: string) => `/products?${new URLSearchParams({ ...(searchParams.cat ? { cat: searchParams.cat } : {}), sort: v })}`
  return (<main className="max-w-6xl mx-auto px-4 py-10">
    <div className="flex justify-between items-end mb-8"><h1 className="font-display text-4xl uppercase">{title}</h1>
      <div className="text-sm flex gap-4"><Link href={base('new')}>Newest</Link><Link href={base('low')}>Price ↑</Link><Link href={base('high')}>Price ↓</Link></div></div>
    <form className="flex flex-wrap gap-2 mb-6 text-sm">{searchParams.cat && <input type="hidden" name="cat" value={searchParams.cat} />}{searchParams.q && <input type="hidden" name="q" value={searchParams.q} />}
      <select name="size" defaultValue={searchParams.size ?? ''} className="border p-2"><option value="">Any size</option>{['XS','S','M','L','XL','XXL'].map(x => <option key={x}>{x}</option>)}</select>
      <input name="min" type="number" placeholder="Min ₹" defaultValue={searchParams.min} className="border p-2 w-24" /><input name="max" type="number" placeholder="Max ₹" defaultValue={searchParams.max} className="border p-2 w-24" />
      <button className="bg-black text-white px-4">Filter</button></form>
    {products?.length ? <div className="grid grid-cols-2 md:grid-cols-4 gap-4">{products.map(p => <ProductCard key={p.id} p={p} />)}</div>
      : <p className="text-neutral-500 py-20 text-center">No products here yet. Add some from the admin dashboard.</p>}
  </main>)
}
