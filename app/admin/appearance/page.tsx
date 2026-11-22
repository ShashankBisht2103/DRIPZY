'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { uploadImage } from '@/lib/upload'
const TYPES: [string, string][] = [['hero', 'Hero banner'], ['full_banner', 'Full-width banner'], ['two_image', 'Two-image section'], ['three_image', 'Three-image layout'], ['collection_banner', 'New collection banner'], ['seasonal_campaign', 'Seasonal campaign'], ['model_gallery', 'Model gallery']]
const SINGLE: [string, string][] = [['desktop_image', 'Desktop image'], ['mobile_image', 'Mobile image'], ['background_image', 'Background image'], ['model_image', 'Model photograph (PNG cut-out works best)']]
export default function Appearance() {
  const [secs, setSecs] = useState<any[]>([]); const [sel, setSel] = useState<string | null>(null); const [vers, setVers] = useState<any[]>([]); const [msg, setMsg] = useState(''); const [drag, setDrag] = useState<string | null>(null)
  const load = async () => {
    const { data } = await supabase.from('site_sections').select('*').order('position'); setSecs(data ?? [])
    const { data: v } = await supabase.from('site_versions').select('id,label,created_at').order('created_at', { ascending: false }).limit(10); setVers(v ?? []) }
  useEffect(() => { load() }, [])
  const add = async (type: string) => { await supabase.from('site_sections').insert({ type, position: secs.length, draft: { headline: 'New section' } }); load() }
  async function drop(to: string) {
    if (!drag || drag === to) return
    const a = [...secs]; const i = a.findIndex(s => s.id === drag), j = a.findIndex(s => s.id === to); a.splice(j, 0, a.splice(i, 1)[0])
    await Promise.all(a.map((s, k) => supabase.from('site_sections').update({ position: k }).eq('id', s.id))); setDrag(null); load() }
  const patch = async (id: string, p: any) => { const { error } = await supabase.from('site_sections').update(p).eq('id', id); if (error) setMsg(error.message); load() }
  const del = async (id: string) => { if (confirm('Delete this section?')) { await supabase.from('site_sections').delete().eq('id', id); setSel(null); load() } }
  async function publish() {
    if (!confirm('Publish all drafts to the live website?')) return
    const { error } = await supabase.rpc('publish_site'); setMsg(error ? error.message : 'Published. The live website is updated.'); load() }
  async function restore(id: string) {
    if (!confirm('Restore this version? Current sections will be replaced (then publish to make it live).')) return
    const { error } = await supabase.rpc('restore_site_version', { v: id }); setMsg(error ? error.message : 'Restored as draft/previous state. Review, then Publish.'); setSel(null); load() }
  const iso = (v: string) => (v ? new Date(v).toISOString() : null)
  const local = (v: string | null) => (v ? new Date(new Date(v).getTime() - new Date(v).getTimezoneOffset() * 60000).toISOString().slice(0, 16) : '')
  const cur = secs.find(s => s.id === sel)
  return (<div className="max-w-3xl"><h1 className="font-display text-3xl uppercase mb-1">Website Appearance & Images</h1>
    <p className="text-sm text-neutral-600 mb-4">Edit drafts, preview, then publish. Order, visibility and schedule take effect on the live site immediately.</p>
    <div className="flex flex-wrap gap-2 mb-4"><a href="/admin/preview" target="_blank" className="border border-black px-4 py-2 text-sm">Preview Changes</a>
      <button onClick={publish} className="bg-black text-white px-4 py-2 text-sm">Publish Changes</button>
      <select className="border text-sm p-2" value="" onChange={e => e.target.value && restore(e.target.value)}><option value="">Restore Previous Version…</option>{vers.map(v => <option key={v.id} value={v.id}>{new Date(v.created_at).toLocaleString()}</option>)}</select>
      <select className="border text-sm p-2" value="" onChange={e => e.target.value && add(e.target.value)}><option value="">+ Add section…</option>{TYPES.map(([k, l]) => <option key={k} value={k}>{l}</option>)}</select></div>
    {msg && <p className="text-sm mb-3">{msg}</p>}
    {secs.map(s => (<div key={s.id} draggable onDragStart={() => setDrag(s.id)} onDragOver={e => e.preventDefault()} onDrop={() => drop(s.id)}
      className={`border p-3 mb-2 bg-white ${sel === s.id ? 'ring-2 ring-black' : ''}`}>
      <div className="flex items-center gap-3 text-sm"><span className="cursor-grab">⠿</span>
        <b className="flex-1 cursor-pointer" onClick={() => setSel(sel === s.id ? null : s.id)}>{TYPES.find(t => t[0] === s.type)?.[1]}: {s.draft.headline || '(no headline)'}</b>
        <span className="text-xs">{JSON.stringify(s.draft) === JSON.stringify(s.published) ? 'Live' : s.published ? 'Draft changes' : 'Draft only'}</span>
        <label><input type="checkbox" checked={s.is_visible} onChange={e => patch(s.id, { is_visible: e.target.checked })} /> Show</label>
        <button onClick={() => del(s.id)} className="text-red-600">Delete</button></div>
      <div className="flex gap-3 mt-2 text-xs"><label>Start <input type="datetime-local" className="border" defaultValue={local(s.publish_at)} onBlur={e => patch(s.id, { publish_at: iso(e.target.value) })} /></label>
        <label>End <input type="datetime-local" className="border" defaultValue={local(s.unpublish_at)} onBlur={e => patch(s.id, { unpublish_at: iso(e.target.value) })} /></label></div>
    </div>))}
    {!secs.length && <p className="text-neutral-500">No sections yet. Add a Hero banner to begin.</p>}
    {cur && <Editor key={cur.id} s={cur} onSave={async (d: any) => { await patch(cur.id, { draft: d }); setMsg('Draft saved.') }} />}
  </div>)
}
function Editor({ s, onSave }: { s: any; onSave: (d: any) => void }) {
  const [d, setD] = useState<any>(s.draft); const [busy, setBusy] = useState(false); const [err, setErr] = useState('')
  const set = (k: string) => (e: any) => setD({ ...d, [k]: e.target.value }); const inp = 'border px-2 py-1 w-full'
  async function up(k: string, files: FileList | null, multi = false) {
    if (!files?.length) return; setBusy(true); setErr('')
    try { const urls = await Promise.all(Array.from(files).map(f => uploadImage(f, s.type))); setD((p: any) => multi ? { ...p, [k]: [...(p[k] ?? []), ...urls] } : { ...p, [k]: urls[0] }) } catch (e: any) { setErr(e.message) }
    setBusy(false) }
  const isHero = s.type === 'hero'
  return (<div className="border p-4 mt-4 space-y-3 text-sm"><b>Edit section (draft)</b>
    <input className={inp} placeholder="Headline e.g. OWN THE STREET" value={d.headline ?? ''} onChange={set('headline')} />
    <input className={inp} placeholder="Subheading" value={d.subheading ?? ''} onChange={set('subheading')} />
    <div className="grid grid-cols-2 gap-2"><input className={inp} placeholder="Button text" value={d.button_text ?? ''} onChange={set('button_text')} />
      <input className={inp} placeholder="Button link e.g. /products?cat=jackets" value={d.button_link ?? ''} onChange={set('button_link')} /></div>
    {isHero && <div className="grid grid-cols-2 gap-2"><select className={inp} value={d.text_position ?? 'left'} onChange={set('text_position')}><option value="left">Text left</option><option value="center">Text centre</option><option value="right">Text right</option></select>
      <input className={inp} type="number" placeholder="Height px (e.g. 560)" value={d.height ?? ''} onChange={set('height')} /></div>}
    {(isHero ? SINGLE : SINGLE.slice(0, 1)).map(([k, l]) => <div key={k}><p>{l}</p>{d[k] && <img src={d[k]} className="h-24 my-1" />}
      <input type="file" accept="image/jpeg,image/png,image/webp" onChange={e => up(k, e.target.files)} /></div>)}
    {!isHero && <div><p>Images (use 1 to 3, in order)</p><div className="flex gap-2 my-1">{(d.images ?? []).map((u: string, i: number) => <div key={i} className="relative"><img src={u} className="h-24" />
      <button onClick={() => setD({ ...d, images: d.images.filter((_: any, j: number) => j !== i) })} className="absolute top-0 right-0 bg-black text-white w-5 h-5 text-xs">✕</button></div>)}</div>
      <input type="file" multiple accept="image/jpeg,image/png,image/webp" onChange={e => up('images', e.target.files, true)} /></div>}
    {err && <p className="text-red-600">{err}</p>}
    <button disabled={busy} onClick={() => onSave({ ...d, height: d.height ? +d.height : undefined })} className="bg-black text-white px-5 py-2 disabled:opacity-50">{busy ? 'Uploading…' : 'Save as Draft'}</button></div>)
}
