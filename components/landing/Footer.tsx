import Link from 'next/link'

export function Footer() {
  return (
    <footer className="bg-soft-bg pt-16 pb-8">
      <div className="container mx-auto px-4 max-w-5xl">
        {/* Main footer content */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-[#2D2D2D] flex items-center justify-center text-white font-semibold text-sm">
                12
              </div>
              <span className="text-xl font-bold tracking-tighter text-gray-900">12img</span>
            </Link>
            <p className="mt-3 text-sm text-gray-500 leading-relaxed">
              Beautiful client galleries for wedding photographers.
            </p>
          </div>

          {/* Product */}
          <div>
            <h4 className="font-semibold text-gray-900 mb-4">Product</h4>
            <ul className="space-y-2.5">
              <li>
                <a href="#features" className="text-sm text-gray-500 hover:text-gray-900 transition-colors">
                  Features
                </a>
              </li>
              <li>
                <a href="#pricing" className="text-sm text-gray-500 hover:text-gray-900 transition-colors">
                  Pricing
                </a>
              </li>
              <li>
                <Link href="/sign-up" className="text-sm text-gray-500 hover:text-gray-900 transition-colors">
                  Get Started
                </Link>
              </li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h4 className="font-semibold text-gray-900 mb-4">Support</h4>
            <ul className="space-y-2.5">
              <li>
                <a href="mailto:hello@12img.com" className="text-sm text-gray-500 hover:text-gray-900 transition-colors">
                  Contact
                </a>
              </li>
              <li>
                <Link href="/help" className="text-sm text-gray-500 hover:text-gray-900 transition-colors">
                  Help Center
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="font-semibold text-gray-900 mb-4">Legal</h4>
            <ul className="space-y-2.5">
              <li>
                <Link href="/privacy" className="text-sm text-gray-500 hover:text-gray-900 transition-colors">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/terms" className="text-sm text-gray-500 hover:text-gray-900 transition-colors">
                  Terms of Service
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="pt-8 border-t border-gray-200 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-gray-400">
            © {new Date().getFullYear()} 12img. All rights reserved.
          </p>
          <p className="text-xs text-gray-400">
            Made with ♥ for wedding photographers
          </p>
        </div>
      </div>
    </footer>
  )
}
