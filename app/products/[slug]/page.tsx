import { supabase } from '@/lib/supabase'
import ProductClient from '@/components/ProductClient'
import ProductCard from '@/components/ProductCard'
import { notFound } from 'next/navigation'
export default async function Page({ params }: { params: { slug: string } }) {
  const { data: p } = await supabase.from('products').select('*, product_images(*), product_variants(*)').eq('slug', params.slug).eq('is_active', true).maybeSingle()
  if (!p) notFound()
  const { data: rel } = await supabase.from('products').select('*, product_images(url, sort_order)').eq('is_active', true)
    .eq('category_id', p.category_id).neq('id', p.id).limit(4)
  return (<main className="max-w-6xl mx-auto px-4 py-10"><ProductClient p={p} />
    {!!rel?.length && <section className="mt-20"><h2 className="font-display text-3xl uppercase mb-6">You may also like</h2>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">{rel.map(r => <ProductCard key={r.id} p={r} />)}</div></section>}</main>)
}
