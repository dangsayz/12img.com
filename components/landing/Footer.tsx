import Link from 'next/link'
import { Instagram } from 'lucide-react'

export function Footer() {
  return (
    <footer className="bg-[#141414] text-white/60 py-20 px-6">
      <div className="max-w-[1280px] mx-auto grid md:grid-cols-4 gap-12">
        {/* Brand */}
        <div className="col-span-1">
           <div className="flex items-center gap-2 mb-6 text-white">
              <div className="w-6 h-6 bg-white flex items-center justify-center text-black font-bold text-[10px] tracking-tighter">
                12
              </div>
              <span className="font-serif text-lg font-medium tracking-tight">img</span>
           </div>
           <p className="text-sm leading-relaxed mb-6">
             Minimal gallery delivery for professional photographers.
           </p>
        </div>
        
        {/* Product */}
        <div>
          <h4 className="text-white font-medium mb-6">Product</h4>
          <ul className="space-y-4 text-sm">
            <li><Link href="/" className="hover:text-white transition-colors">Client Galleries</Link></li>
            <li><Link href="/pricing" className="hover:text-white transition-colors">Pricing</Link></li>
            <li><Link href="/view-reel/demo" className="hover:text-white transition-colors">Sample Galleries</Link></li>
          </ul>
        </div>

        {/* Resources */}
        <div>
          <h4 className="text-white font-medium mb-6">Resources</h4>
          <ul className="space-y-4 text-sm">
            <li><Link href="/help" className="hover:text-white transition-colors">Help Center</Link></li>
            <li><Link href="/blog" className="hover:text-white transition-colors">Blog</Link></li>
            <li><Link href="/terms" className="hover:text-white transition-colors">Terms of Service</Link></li>
          </ul>
        </div>

        {/* Social */}
        <div>
          <h4 className="text-white font-medium mb-6">Social</h4>
          <div className="flex gap-4">
             <Link href="https://www.instagram.com/12images" target="_blank" className="w-8 h-8 flex items-center justify-center bg-white/10 hover:bg-white/20 transition-colors rounded-full">
               <Instagram className="w-4 h-4 text-white" />
             </Link>
          </div>
        </div>
      </div>
      
      <div className="max-w-[1280px] mx-auto mt-20 pt-8 border-t border-white/10 text-xs flex justify-between">
         <p>© {new Date().getFullYear()} 12IMG. All rights reserved.</p>
         <p>Made for photographers.</p>
      </div>
    </footer>
  )
}
