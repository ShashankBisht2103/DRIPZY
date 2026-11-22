import './globals.css'
import Navbar from '@/components/Navbar'
export const metadata = {
  title: 'DRIPZY | Wear Drip',
  description: 'Premium Indian streetwear',
  viewport: { width: 'device-width', initialScale: 1, maximumScale: 5 }
}
export const revalidate = 0
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (<html lang="en"><body>
    <Navbar />{children}
    <footer className="bg-black text-neutral-400 mt-24 py-12 px-6 text-sm">
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row gap-6 justify-between items-start">
        <img src="/dripzy-logo.png" alt="DRIPZY" className="h-16" />
        <p>Instagram: <a className="text-white" href="https://instagram.com/weardripzy">@weardripzy</a></p>
        <nav className="flex flex-wrap gap-x-5 gap-y-2">{[['about','About Us'],['contact','Contact Us'],['privacy','Privacy Policy'],['terms','Terms & Conditions'],['shipping','Shipping Policy'],['returns','Return & Refund Policy'],['faq','FAQ']].map(([k,l])=><a key={k} href={`/p/${k}`} className="hover:text-white">{l}</a>)}</nav>
        <p>© {new Date().getFullYear()} DRIPZY. All rights reserved.</p>
      </div></footer>
  </body></html>)
}
