import { notFound } from 'next/navigation'
const T = 'Replace this placeholder with your final policy text before launch.'
const PAGES: Record<string, [string, string]> = {
  about: ['About DRIPZY', 'DRIPZY is an Indian streetwear brand. Follow us on Instagram @weardripzy.'],
  contact: ['Contact Us', 'Instagram: @weardripzy. Add your support email and phone number here.'],
  privacy: ['Privacy Policy', T], terms: ['Terms & Conditions', T],
  shipping: ['Shipping Policy', 'Shipping is ₹100 for orders outside Delhi. ' + T],
  returns: ['Return & Refund Policy', T], faq: ['FAQ', 'Add your frequently asked questions here.'] }
export default function Page({ params }: { params: { slug: string } }) {
  const p = PAGES[params.slug]; if (!p) notFound()
  return <main className="max-w-2xl mx-auto px-4 py-16"><h1 className="font-display text-4xl uppercase mb-6">{p[0]}</h1><p className="text-neutral-700">{p[1]}</p></main>
}
