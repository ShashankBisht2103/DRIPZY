'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [ok, setOk] = useState<boolean | null>(null)
  const [email, setEmail] = useState('')
  useEffect(() => { (async () => {
    const { data: u } = await supabase.auth.getUser()
    if (!u.user) { setEmail(''); return setOk(false) }
    setEmail(u.user.email ?? '')
    const { data, error } = await supabase.from('profiles').select('role').eq('id', u.user.id).single()
    if (error) console.error('Could not check admin role:', error.message)
    setOk(data?.role === 'admin') })() }, [])   // UI gate only; the database enforces admin access through RLS
  if (ok === null) return <main className="p-20 text-center">Checking access…</main>
  if (!ok) return <main className="p-20 text-center"><p>You don’t have admin access for {email || 'this account'}.</p><p className="text-sm mt-3 text-neutral-600">Make sure this account is assigned <b>role = 'admin'</b> in Supabase.</p></main>
  return (<div className="flex min-h-[80vh] flex-col md:flex-row"><aside className="bg-neutral-100 p-3 sm:p-4 md:w-52 md:p-6 flex md:block gap-2 overflow-x-auto md:overflow-visible text-sm font-medium md:space-y-3">
    <Link href="/admin" className="whitespace-nowrap rounded px-3 py-2 md:block md:px-0 md:py-0 hover:bg-white md:hover:bg-transparent">Dashboard</Link><Link href="/admin/products/new" className="whitespace-nowrap rounded px-3 py-2 md:block md:px-0 md:py-0 hover:bg-white md:hover:bg-transparent">Add New Product</Link><Link href="/admin/products" className="whitespace-nowrap rounded px-3 py-2 md:block md:px-0 md:py-0 hover:bg-white md:hover:bg-transparent">Manage Products</Link><Link href="/admin/categories" className="whitespace-nowrap rounded px-3 py-2 md:block md:px-0 md:py-0 hover:bg-white md:hover:bg-transparent">Manage Categories</Link><Link href="/admin/appearance" className="whitespace-nowrap rounded px-3 py-2 md:block md:px-0 md:py-0 hover:bg-white md:hover:bg-transparent">Website Appearance</Link><Link href="/admin/orders" className="whitespace-nowrap rounded px-3 py-2 md:block md:px-0 md:py-0 hover:bg-white md:hover:bg-transparent">Orders</Link><Link href="/admin/customers" className="whitespace-nowrap rounded px-3 py-2 md:block md:px-0 md:py-0 hover:bg-white md:hover:bg-transparent">Customers</Link><Link href="/admin/coupons" className="whitespace-nowrap rounded px-3 py-2 md:block md:px-0 md:py-0 hover:bg-white md:hover:bg-transparent">Discounts &amp; Coupons</Link><Link href="/admin/settings" className="whitespace-nowrap rounded px-3 py-2 md:block md:px-0 md:py-0 hover:bg-white md:hover:bg-transparent">Website Settings</Link></aside>
    <section className="flex-1 min-w-0 p-4 sm:p-6 md:p-8">{children}</section></div>)
}
