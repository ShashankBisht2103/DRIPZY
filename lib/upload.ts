import { supabase } from './supabase'
// Resizes to max 2000px and converts to WebP in the browser before upload (fast loading), then records it in `media`.
export async function uploadImage(file: File, folder = 'site', max = 2000): Promise<string> {
  if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) throw new Error('Only JPG, PNG or WebP images are allowed.')
  const bmp = await createImageBitmap(file); const k = Math.min(1, max / bmp.width)
  const c = document.createElement('canvas'); c.width = Math.round(bmp.width * k); c.height = Math.round(bmp.height * k)
  c.getContext('2d')!.drawImage(bmp, 0, 0, c.width, c.height)
  const blob: Blob = await new Promise(r => c.toBlob(b => r(b!), 'image/webp', 0.85))
  const path = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2, 7)}.webp`
  const { error } = await supabase.storage.from('site-media').upload(path, blob, { contentType: 'image/webp', cacheControl: '31536000' })
  if (error) throw error
  const url = supabase.storage.from('site-media').getPublicUrl(path).data.publicUrl
  await supabase.from('media').insert({ path, url, width: c.width, height: c.height })
  return url
}
