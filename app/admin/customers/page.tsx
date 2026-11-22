'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
export default function Customers() {
  const [r, setR] = useState<any[]>([])
  useEffect(() => { supabase.from('profiles').select('*').eq('role', 'customer').order('created_at', { ascending: false }).then(({ data }) => setR(data ?? [])) }, [])
  return (<div><h1 className="font-display text-3xl uppercase mb-4">Customers</h1>
    <table className="text-sm w-full max-w-3xl text-left"><thead><tr><th>Name</th><th>Phone</th><th>Joined</th></tr></thead><tbody>
      {r.map(c => <tr key={c.id} className="border-t"><td className="py-2">{c.full_name}</td><td>{c.phone}</td><td>{new Date(c.created_at).toLocaleDateString()}</td></tr>)}</tbody></table></div>)
}
