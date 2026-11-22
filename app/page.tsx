import { supabase } from '@/lib/supabase'
import ProductCard from '@/components/ProductCard'
import Link from 'next/link'
import { Hero, Banner, BANNER_TYPES } from '@/components/Sections'

const sel = '*, product_images(url, sort_order)'
async function row(flag: string) {
  const { data } = await supabase.from('products').select(sel).eq('is_active', true).eq(flag, true).limit(8)
  return data ?? []
}
function Row({ title, items, href }: any) {
  if (!items.length) return null
  return (<section className="max-w-6xl mx-auto px-4 mt-16">
    <div className="flex justify-between items-end mb-6"><h2 className="font-display text-3xl uppercase">{title}</h2>
      <Link href={href} className="text-sm underline">View all</Link></div>
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">{items.map((p: any) => <ProductCard key={p.id} p={p} />)}</div></section>)
}
export default async function Home() {
  const { data: sections } = await supabase.from('live_sections').select('*')
  const [na, bs, tr] = await Promise.all([row('is_new_arrival'), row('is_best_seller'), row('is_trending')])
  const hasHero = sections?.some(s => s.type === 'hero')
  return (<main>
    {!hasHero && <Hero c={{ headline: 'Your style. Your rules.', subheading: 'New streetwear drops from DRIPZY.', button_text: 'Shop Now', button_link: '/products' }} />}
    {sections?.map(s => s.type === 'hero' ? <Hero key={s.id} c={s.config} />
      : BANNER_TYPES.includes(s.type) ? <Banner key={s.id} c={s.config} /> : null)}
    <Row title="New Arrivals" items={na} href="/products?new=1" />
    <Row title="Best Sellers" items={bs} href="/products" />
    <Row title="Trending Now" items={tr} href="/products" />
  </main>)
}
