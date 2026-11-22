import crypto from 'crypto'
import { createClient } from '@supabase/supabase-js'

// Server-only. The service-role key and webhook secret never reach the browser.
const db = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

export async function POST(req: Request) {
  const raw = await req.text() // signature is computed over the raw body
  const sig = req.headers.get('x-razorpay-signature') ?? ''
  const expected = crypto.createHmac('sha256', process.env.RAZORPAY_WEBHOOK_SECRET!).update(raw).digest('hex')
  const ok = sig.length === expected.length && crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected))
  if (!ok) return new Response('invalid signature', { status: 400 })

  const evt = JSON.parse(raw)
  if (evt.event === 'payment.captured' || evt.event === 'order.paid') {
    const p = evt.payload.payment.entity
    await db.rpc('finalize_paid_order', { p_rzp_order: p.order_id, p_payment: p.id }) // idempotent
  } else if (evt.event === 'payment.failed') {
    await db.from('orders').update({ payment_status: 'failed' })
      .eq('razorpay_order_id', evt.payload.payment.entity.order_id)
  }
  return new Response('ok')
}
