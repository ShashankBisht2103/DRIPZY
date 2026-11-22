'use client'
import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'

const SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL']
const MAX_IMAGE_SIZE = 10 * 1024 * 1024
const IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp']

export default function AdminProductForm() {
  const searchParams = useSearchParams()
  const preselectedCategory = searchParams.get('category') || ''
  const preselectedSubcategory = searchParams.get('subcategory') || ''
  const categoryName = searchParams.get('name')
  const [cats, setCats] = useState<any[]>([])
  const [f, setF] = useState<any>({ name: '', description: '', material: '', price: '', discount_price: '', category_id: preselectedCategory, subcategory_id: preselectedSubcategory, colors: 'Black', is_featured: false, is_new_arrival: true, is_best_seller: false })
  const [sizes, setSizes] = useState<string[]>(['S', 'M', 'L'])
  const [stock, setStock] = useState<Record<string, number>>({})
  const [files, setFiles] = useState<File[]>([])
  const [msg, setMsg] = useState('')
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    supabase.from('categories').select('id,name,parent_id').order('sort_order').then(({ data, error }) => {
      if (error) setMsg(`Could not load categories: ${error.message}`)
      else setCats(data ?? [])
    })
  }, [])

  const set = (k: string) => (e: any) => setF({ ...f, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value })
  const colors = f.colors.split(',').map((c: string) => c.trim()).filter(Boolean)

  async function submit(e: any) {
    e.preventDefault()
    setMsg('')
    setBusy(true)
    try {
      if (!files.length) throw new Error('Choose at least one product photo.')
      if (!sizes.length) throw new Error('Select at least one size.')
      if (!colors.length) throw new Error('Enter at least one colour.')
      const invalidFile = files.find(file => !IMAGE_TYPES.includes(file.type) || file.size > MAX_IMAGE_SIZE)
      if (invalidFile) throw new Error(`${invalidFile.name} must be a JPG, PNG, or WebP image no larger than 10 MB.`)

      const slug = f.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') + '-' + Math.random().toString(36).slice(2, 6)
      const { data: p, error } = await supabase.from('products').insert({
        name: f.name,
        slug,
        description: f.description,
        material: f.material,
        price: +f.price,
        discount_price: f.discount_price ? +f.discount_price : null,
        category_id: f.category_id || null,
        subcategory_id: f.subcategory_id || null,
        is_featured: f.is_featured,
        is_new_arrival: f.is_new_arrival,
        is_best_seller: f.is_best_seller
      }).select().single()
      if (error) throw new Error(`Could not save product details: ${error.message}`)

      for (let i = 0; i < files.length; i++) {
        const path = `${p.id}/${Date.now()}-${i}-${files[i].name.replace(/[^\w.]/g, '_')}`
        const up = await supabase.storage.from('product-images').upload(path, files[i])
        if (up.error) throw new Error(`Could not upload ${files[i].name}: ${up.error.message}`)
        const { error: imageError } = await supabase.from('product_images').insert({
          product_id: p.id,
          url: supabase.storage.from('product-images').getPublicUrl(path).data.publicUrl,
          sort_order: i
        })
        if (imageError) throw new Error(`Image uploaded, but its product record could not be saved: ${imageError.message}`)
      }

      const variants = sizes.flatMap(s => colors.map((c: string) => ({
        product_id: p.id,
        size: s,
        color: c,
        stock: stock[`${s}|${c}`] ?? 0
      })))
      const { error: variantError } = await supabase.from('product_variants').insert(variants)
      if (variantError) throw new Error(`Product and photos saved, but sizes and stock could not be saved: ${variantError.message}`)
      setMsg('Product, photos, and details saved successfully.')
    } catch (er: any) {
      setMsg(er.message || 'Could not save product. Please try again.')
    } finally {
      setBusy(false)
    }
  }

  const inp = 'w-full border px-3 py-2'
  return (
    <form onSubmit={submit} className="max-w-2xl space-y-3">
      {categoryName && <div className="border-l-4 border-black bg-neutral-100 px-4 py-3 text-sm">
        Uploading into: <b>{categoryName}</b>
      </div>}
      <input className={inp} placeholder="Product name" required value={f.name} onChange={set('name')} />
      <textarea className={inp} placeholder="Description" rows={4} value={f.description} onChange={set('description')} />
      <input className={inp} placeholder="Material (e.g. 100% cotton, 240 GSM)" value={f.material} onChange={set('material')} />
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <input className={inp} type="number" min="0" placeholder="Price ₹" required value={f.price} onChange={set('price')} />
        <input className={inp} type="number" min="0" placeholder="Discounted price ₹" value={f.discount_price} onChange={set('discount_price')} />
        <select className={inp} value={f.category_id} onChange={set('category_id')}>
          <option value="">Category</option>{cats.filter(c => !c.parent_id).map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <select className={inp} value={f.subcategory_id} onChange={set('subcategory_id')}>
          <option value="">Subcategory</option>{cats.filter(c => c.parent_id).map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </div>
      <div>
        <p className="text-sm mb-1">Photos (JPG, PNG, WebP; up to 10 MB each)</p>
        <input type="file" multiple accept="image/jpeg,image/png,image/webp" onChange={e => setFiles(Array.from(e.target.files ?? []))} />
        <div className="flex gap-2 mt-2 flex-wrap">
          {files.map((x, i) => <img key={`${x.name}-${i}`} src={URL.createObjectURL(x)} alt={`Preview ${x.name}`} className="w-16 h-20 object-cover" />)}
        </div>
      </div>
      <div className="flex gap-3 flex-wrap">
        {SIZES.map(s => <label key={s}><input type="checkbox" checked={sizes.includes(s)} onChange={e => setSizes(e.target.checked ? [...sizes, s] : sizes.filter(x => x !== s))} /> {s}</label>)}
      </div>
      <input className={inp} placeholder="Colours, comma separated" value={f.colors} onChange={set('colors')} />
      <div className="grid grid-cols-1 gap-2 text-sm sm:grid-cols-2 md:grid-cols-3">
        {sizes.flatMap(s => colors.map((c: string) => <label key={s + c}>{c} {s} stock
          <input type="number" min="0" className={inp} value={stock[`${s}|${c}`] ?? 0} onChange={e => setStock({ ...stock, [`${s}|${c}`]: +e.target.value })} />
        </label>))}
      </div>
      <div className="flex gap-5 text-sm">
        {[
          ['is_featured', 'Featured'],
          ['is_new_arrival', 'New arrival'],
          ['is_best_seller', 'Best seller']
        ].map(([k, l]) => <label key={k}><input type="checkbox" checked={f[k]} onChange={set(k)} /> {l}</label>)}
      </div>
      {msg && <p role="status" className="text-sm">{msg}</p>}
      <button disabled={busy} className="bg-black text-white px-8 py-3 disabled:opacity-50">
        {busy ? 'Saving product…' : 'Save Product'}
      </button>
    </form>
  )
}
