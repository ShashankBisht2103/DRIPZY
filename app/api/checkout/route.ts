import { createClient } from '@supabase/supabase-js'
const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
const bad = (m: string, s = 400) => Response.json({ error: m }, { status: s })

export async function POST(req: Request) {
  const token = (req.headers.get('authorization') ?? '').replace('Bearer ', '')
  const { data: { user } } = await db.auth.getUser(token)
  if (!user) return bad('Please log in.', 401)
  const { address, email, coupon } = await req.json()
  for (const k of ['name', 'phone', 'line1', 'city', 'state', 'pincode'])
    if (!address?.[k]?.toString().trim()) return bad(`Missing ${k}`)
  if (!/^\d{6}$/.test(address.pincode)) return bad('PIN code must be 6 digits.')
  if (!/^[6-9]\d{9}$/.test(address.phone)) return bad('Enter a valid 10-digit mobile number.')

  // Prices and stock always come from the database, never from the browser.
  const { data: cart } = await db.from('cart_items').select('qty, product_variants(id,size,color,stock,products(name,price,discount_price,is_active,is_sold_out))').eq('user_id', user.id)
  if (!cart?.length) return bad('Your bag is empty.')
  let subtotal = 0; const lines: any[] = []
  for (const c of cart as any[]) {
    const v = c.product_variants, p = v.products
    if (!p.is_active || p.is_sold_out || v.stock < c.qty) return bad(`${p.name} (${v.size}) is no longer available in that quantity.`)
    const unit = p.discount_price ?? p.price; subtotal += unit * c.qty
    lines.push({ variant_id: v.id, product_name: p.name, size: v.size, color: v.color, unit_price: unit, qty: c.qty })
  }
  const { data: ship } = await db.from('settings').select('value').eq('key', 'shipping').single()
  const sh = ship!.value
  let shipping = address.state.trim().toLowerCase() === String(sh.home_state).toLowerCase() ? sh.home_charge : sh.other_charge
  if (sh.free_above && subtotal >= sh.free_above) shipping = 0
  let discount = 0, code = null
  if (coupon) {
    const { data: c } = await db.from('coupons').select('*').eq('code', coupon.trim().toUpperCase()).eq('is_active', true).maybeSingle()
    if (!c || (c.expires_at && new Date(c.expires_at) < new Date()) || subtotal < c.min_order) return bad('Invalid or expired coupon.')
    discount = Math.min(subtotal, c.percent_off ? Math.round(subtotal * c.percent_off / 100) : c.flat_off ?? 0); code = c.code
  }
  const total = subtotal + shipping - discount
  const { data: order, error } = await db.from('orders').insert({ user_id: user.id, subtotal, shipping, discount, total, coupon_code: code, address, email }).select().single()
  if (error) return bad(error.message, 500)
  await db.from('order_items').insert(lines.map(l => ({ ...l, order_id: order.id })))
  const r = await fetch('https://api.razorpay.com/v1/orders', { method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: 'Basic ' + Buffer.from(`${process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID}:${process.env.RAZORPAY_KEY_SECRET}`).toString('base64') },
    body: JSON.stringify({ amount: Math.round(total * 100), currency: 'INR', receipt: order.order_no }) })
  const rz = await r.json()
  if (!r.ok) return bad('Payment provider error. Try again.', 502)
  await db.from('orders').update({ razorpay_order_id: rz.id }).eq('id', order.id)
  return Response.json({ key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID, rzpOrderId: rz.id, amount: rz.amount, orderId: order.id, total, shipping, discount })
}
