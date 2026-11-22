export default function ProductCard({ p }: { p: any }) {
  const img = p.product_images?.sort((a: any, b: any) => a.sort_order - b.sort_order)[0]?.url
  const sale = p.discount_price && p.discount_price < p.price
  return (<a href={`/products/${p.slug}`} className="card block group">
    <div className="relative aspect-[3/4] bg-neutral-100 overflow-hidden">
      {img ? <img src={img} alt={p.name} className="w-full h-full object-cover" /> : <div className="w-full h-full grid place-items-center text-neutral-400">No image</div>}
      {p.is_sold_out ? <span className="absolute top-2 left-2 bg-neutral-800 text-white text-xs px-2 py-1">Sold out</span>
        : p.is_new_arrival && <span className="absolute top-2 left-2 bg-black text-white text-xs px-2 py-1">New</span>}
    </div>
    <h3 className="mt-3 text-sm font-medium">{p.name}</h3>
    <p className="text-sm">{sale ? <><b>₹{p.discount_price}</b> <s className="text-neutral-500">₹{p.price}</s></> : <b>₹{p.price}</b>}</p>
  </a>)
}
