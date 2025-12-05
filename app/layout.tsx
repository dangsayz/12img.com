import { ClerkProvider } from '@clerk/nextjs'
import { Inter, Cormorant_Garamond } from 'next/font/google'
import './globals.css'
import { Footer } from '@/components/landing/Footer'

const inter = Inter({ 
  subsets: ['latin'],
  variable: '--font-inter',
})

// Premium serif font for elegant titles
const cormorant = Cormorant_Garamond({ 
  subsets: ['latin'],
  weight: ['300', '400', '500', '600'],
  variable: '--font-cormorant',
})

export const metadata = {
  title: '12img',
  description: 'Minimal gallery delivery for photographers',
  icons: {
    icon: '/favicon.svg',
    apple: '/logo.svg',
  },
}

const clerkAppearance = {
  variables: {
    colorPrimary: '#212121',
    colorBackground: '#FFFFFF',
    colorInputBackground: '#FFFFFF',
    colorInputText: '#1C1C1C',
    colorText: '#1C1C1C',
    colorTextSecondary: '#6D6D6D',
    colorNeutral: '#1C1C1C',
    colorTextOnPrimaryBackground: '#FFFFFF',
    borderRadius: '12px',
    fontFamily: 'var(--font-inter), system-ui, sans-serif',
    spacingUnit: '16px',
  },
  elements: {
    card: {
      boxShadow: '0px 10px 36px rgba(0,0,0,0.09)',
      borderRadius: '24px',
      border: 'none',
    },
    socialButtonsBlockButton: {
      backgroundColor: '#FFFFFF',
      border: '1px solid #E5E5E5',
      borderRadius: '12px',
      '&:hover': {
        backgroundColor: '#F9F9F9',
      },
    },
    formFieldInput: {
      backgroundColor: '#FFFFFF',
      border: '1px solid #E5E5E5',
      borderRadius: '12px',
      '&:focus': {
        borderColor: '#212121',
        boxShadow: '0 0 0 1px #212121',
      },
    },
    formButtonPrimary: {
      backgroundColor: '#212121',
      borderRadius: '12px',
      boxShadow: '0px 4px 18px rgba(0,0,0,0.06)',
      '&:hover': {
        backgroundColor: '#3a3a3a',
      },
    },
    footerActionLink: {
      color: '#212121',
      fontWeight: '500',
    },
    badge: {
      display: 'none',
    },
    footer: {
      display: 'none',
    },
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <ClerkProvider appearance={clerkAppearance}>
      <html lang="en">
        <body className={`${inter.variable} ${cormorant.variable} font-sans antialiased`}>
          {children}
          <Footer />
        </body>
      </html>
    </ClerkProvider>
  )
}
