'use client'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Hero, Banner, BANNER_TYPES } from '@/components/Sections'
export default function Preview() {
  const [secs, setSecs] = useState<any[]>([])
  useEffect(() => { supabase.from('site_sections').select('*').eq('is_visible', true).order('position').then(({ data }) => setSecs(data ?? [])) }, [])
  return (<div><p className="bg-yellow-200 text-sm px-3 py-2 mb-4">Draft preview. Visitors see this only after you press Publish.</p>
    {secs.map(s => s.type === 'hero' ? <Hero key={s.id} c={s.draft} /> : BANNER_TYPES.includes(s.type) ? <Banner key={s.id} c={s.draft} /> : null)}</div>)
}
