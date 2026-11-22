'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
export default function Categories() {
  const [cats, setCats] = useState<any[]>([]); const [name, setName] = useState(''); const [parent, setParent] = useState(''); const [msg, setMsg] = useState('')
  const load = () => supabase.from('categories').select('*').order('sort_order').then(({ data }) => setCats(data ?? []))
  useEffect(() => { load() }, [])
  async function upload(file: File) {
    const path = `categories/${Date.now()}-${file.name.replace(/[^\w.]/g, '_')}`
    const { error } = await supabase.storage.from('site-media').upload(path, file); if (error) { setMsg(error.message); return null }
    return supabase.storage.from('site-media').getPublicUrl(path).data.publicUrl }
  async function create(e: any) {
    e.preventDefault(); const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
    const sibs = cats.filter(c => (c.parent_id ?? '') === parent)
    const { error } = await supabase.from('categories').insert({ name: name.trim(), slug, parent_id: parent || null, sort_order: sibs.length })
    setMsg(error ? (error.code === '23505' ? 'A category with that name already exists.' : error.message) : 'Category created. It now appears in the site menu.'); setName(''); load() }
  const patch = async (id: string, p: any) => { const { error } = await supabase.from('categories').update(p).eq('id', id); if (error) setMsg(error.message); load() }
  async function move(c: any, dir: number) {
    const sibs = cats.filter(x => x.parent_id === c.parent_id).sort((a, b) => a.sort_order - b.sort_order)
    const i = sibs.findIndex(x => x.id === c.id), j = i + dir; if (j < 0 || j >= sibs.length) return
    ;[sibs[i], sibs[j]] = [sibs[j], sibs[i]]
    await Promise.all(sibs.map((x, k) => supabase.from('categories').update({ sort_order: k }).eq('id', x.id))); load() }
  async function del(c: any) {
    if (!confirm(`Delete "${c.name}" and its subcategories? Products stay but lose this category.`)) return
    await supabase.from('categories').delete().eq('id', c.id); load() }
  const row = (c: any, sub = false) => (<div key={c.id} className={`flex flex-wrap items-center gap-2 sm:gap-3 border p-2 mb-2 ${sub ? 'ml-4 sm:ml-8' : ''}`}>
    <label className="cursor-pointer"><div className="w-12 h-12 bg-neutral-100 overflow-hidden grid place-items-center text-xs text-neutral-400">{c.image_url ? <img src={c.image_url} className="w-full h-full object-cover" /> : 'Image'}</div>
      <input type="file" hidden accept="image/jpeg,image/png,image/webp" onChange={async e => { const f = e.target.files?.[0]; if (f) { const u = await upload(f); if (u) patch(c.id, { image_url: u }) } }} /></label>
    <input defaultValue={c.name} className="border px-2 py-1 w-full flex-1 sm:w-auto" onBlur={e => e.target.value.trim() && e.target.value !== c.name && patch(c.id, { name: e.target.value.trim() })} />
    <label className="text-xs"><input type="checkbox" checked={c.show_in_sidebar} onChange={e => patch(c.id, { show_in_sidebar: e.target.checked })} /> Menu</label>
    <button onClick={() => move(c, -1)}>↑</button><button onClick={() => move(c, 1)}>↓</button>
    {sub
      ? <Link href={`/admin/products/new?category=${encodeURIComponent(c.parent_id)}&subcategory=${encodeURIComponent(c.id)}&name=${encodeURIComponent(c.name)}`} className="bg-black text-white px-3 py-1.5 text-sm">Upload to {c.name}</Link>
      : <Link href={`/admin/products/new?category=${encodeURIComponent(c.id)}&name=${encodeURIComponent(c.name)}`} className="bg-black text-white px-3 py-1.5 text-sm">Upload to {c.name}</Link>}
    <button onClick={() => del(c)} className="text-red-600 text-sm">Delete</button></div>)
  const top = cats.filter(c => !c.parent_id)
  return (<div className="max-w-2xl"><h1 className="font-display text-3xl uppercase mb-4">Manage Categories</h1>
    <form onSubmit={create} className="flex flex-col sm:flex-row gap-2 mb-2"><input required className="border px-3 py-2 flex-1" placeholder="New category name (e.g. Cargo Pants)" value={name} onChange={e => setName(e.target.value)} />
      <select className="border px-2" value={parent} onChange={e => setParent(e.target.value)}><option value="">Top level</option>{top.map(c => <option key={c.id} value={c.id}>Under {c.name}</option>)}</select>
      <button className="bg-black text-white px-5">Add</button></form>
    {msg && <p className="text-sm mb-4">{msg}</p>}
    {!cats.length && <p className="text-neutral-500 mt-6">No categories yet. Create the first one above: All Products is added automatically.</p>}
    {top.map(c => <div key={c.id}>{row(c)}{cats.filter(s => s.parent_id === c.id).map(s => row(s, true))}</div>)}</div>)
}
