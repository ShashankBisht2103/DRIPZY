import Link from 'next/link'
export function Hero({ c }: { c: any }) {
  const pos = ({ left: 'items-start text-left', center: 'items-center text-center', right: 'items-end text-right' } as any)[c.text_position] ?? 'items-start text-left'
  const bg = c.background_image || c.desktop_image
  return (<section className="relative bg-black text-white overflow-hidden" style={{ height: c.height || 560 }}>
    {bg && <picture>{c.mobile_image && <source media="(max-width:767px)" srcSet={c.mobile_image} />}
      <img src={bg} alt="" className="absolute inset-0 w-full h-full object-cover opacity-80" /></picture>}
    {c.model_image && <img src={c.model_image} alt="" className="absolute right-0 bottom-0 h-full object-contain hidden md:block" />}
    <div className={`relative h-full max-w-6xl mx-auto px-6 flex flex-col justify-center gap-4 ${pos}`}>
      <h1 className="font-display text-5xl md:text-8xl uppercase leading-none">{c.headline}</h1>
      {c.subheading && <p className="text-lg max-w-md">{c.subheading}</p>}
      {c.button_text && <Link href={c.button_link || '/products'} className="bg-white text-black px-8 py-3 font-semibold">{c.button_text}</Link>}
    </div></section>)
}
export function Banner({ c }: { c: any }) {
  const imgs: string[] = c.images?.length ? c.images : c.desktop_image ? [c.desktop_image] : []
  const cols = imgs.length >= 3 ? 'md:grid-cols-3' : imgs.length === 2 ? 'md:grid-cols-2' : ''
  return (<section className={`max-w-6xl mx-auto px-4 mt-12 grid gap-4 ${cols}`}>
    {imgs.map((u, i) => (<Link key={i} href={c.button_link || '/products'} className="card block overflow-hidden relative">
      <img src={u} alt={c.headline || ''} className="w-full h-full object-cover" />
      {c.headline && i === 0 && <span className="absolute bottom-4 left-4 bg-white px-4 py-2 font-semibold">{c.headline}</span>}</Link>))}</section>)
}
export const BANNER_TYPES = ['full_banner', 'two_image', 'three_image', 'collection_banner', 'seasonal_campaign', 'model_gallery']
