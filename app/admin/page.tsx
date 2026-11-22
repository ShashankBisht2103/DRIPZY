'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import AdminProductForm from '@/components/AdminProductForm'
export default function Dashboard() {
  const [d, setD] = useState<any>(null)
  useEffect(() => { (async () => {
    const [o, c, p, v, cats] = await Promise.all([
      supabase.from('orders').select('order_no,total,created_at,status,order_items(product_name,qty)').eq('payment_status', 'paid').order('created_at', { ascending: false }),
      supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('role', 'customer'),
      supabase.from('products').select('id', { count: 'exact', head: true }),
      supabase.from('product_variants').select('size,color,stock,products(name)').lte('stock', 5).order('stock').limit(15),
      supabase.from('categories').select('id,name,parent_id').eq('is_active', true).order('sort_order')])
    const orders = o.data ?? []; const best: Record<string, number> = {}
    orders.forEach((x: any) => x.order_items.forEach((i: any) => { best[i.product_name] = (best[i.product_name] ?? 0) + i.qty }))
    const days = [...Array(7)].map((_, k) => { const t = new Date(Date.now() - (6 - k) * 864e5).toDateString()
      return { d: t.slice(4, 10), v: orders.filter((x: any) => new Date(x.created_at).toDateString() === t).reduce((s: number, x: any) => s + +x.total, 0) } })
    setD({ sales: orders.reduce((s: number, x: any) => s + +x.total, 0), n: orders.length, cust: c.count ?? 0, prods: p.count ?? 0, low: v.data ?? [], recent: orders.slice(0, 5), best: Object.entries(best).sort((a, b) => b[1] - a[1]).slice(0, 5), days, cats: cats.data ?? [] }) })() }, [])
  if (!d) return <p>Loading…</p>
  const max = Math.max(1, ...d.days.map((x: any) => x.v))
  const stat = (l: string, v: any) => <div className="border p-4"><p className="text-xs uppercase text-neutral-500">{l}</p><p className="text-2xl font-bold">{v}</p></div>
  return (<div className="max-w-4xl"><h1 className="font-display text-3xl uppercase mb-4">Dashboard</h1>
    <section className="border p-5 mb-8">
      <h2 className="font-semibold text-xl mb-1">Add a clothing product</h2>
      <div className="flex flex-wrap gap-2 mb-4">
        <Link href="/admin/categories" className="border border-black px-3 py-2 text-sm">+ Add / manage categories</Link>
        {d.cats.map((category: any) => {
          const subcategory = category.parent_id ? `&subcategory=${encodeURIComponent(category.id)}` : ''
          const parent = category.parent_id ? `&category=${encodeURIComponent(category.parent_id)}` : `&category=${encodeURIComponent(category.id)}`
          return <Link key={category.id} href={`/admin/products/new?name=${encodeURIComponent(category.name)}${parent}${subcategory}`} className="border px-3 py-2 text-sm hover:bg-black hover:text-white">{category.name}</Link>
        })}
      </div>
      <p className="text-sm text-neutral-600 mb-4">Add product details, photos, sizes, colours, and stock. The product will be published when saved.</p>
      <AdminProductForm />
    </section>
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">{stat('Total sales', '₹' + d.sales)}{stat('Orders', d.n)}{stat('Customers', d.cust)}{stat('Products', d.prods)}</div>
    <h2 className="font-semibold mt-8 mb-2">Revenue, last 7 days</h2>
    <div className="flex items-end gap-3 h-40 border-b">{d.days.map((x: any) => <div key={x.d} className="flex-1 text-center text-xs"><div className="bg-black mx-auto w-full" style={{ height: `${(x.v / max) * 120}px` }} title={'₹' + x.v} />{x.d}</div>)}</div>
    <div className="grid md:grid-cols-3 gap-6 mt-8 text-sm">
      <div><h2 className="font-semibold mb-2">Recent orders</h2>{d.recent.map((o: any) => <p key={o.order_no}>{o.order_no} · ₹{o.total} · {o.status}</p>)}</div>
      <div><h2 className="font-semibold mb-2">Best sellers</h2>{d.best.map(([n, q]: any) => <p key={n}>{n} · {q} sold</p>)}</div>
      <div><h2 className="font-semibold mb-2">Low stock (≤5)</h2>{d.low.map((v: any, i: number) => <p key={i}>{v.products?.name} {v.color}/{v.size}: {v.stock}</p>)}</div></div></div>)
}
