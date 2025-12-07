import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Satoshi', 'system-ui', 'sans-serif'],
        serif: ['var(--font-migra)', 'Instrument Serif', 'Times New Roman', 'serif'],
        display: ['var(--font-migra)', 'Instrument Serif', 'Times New Roman', 'serif'],
      },
      colors: {
        background: 'var(--background)',
        foreground: 'var(--foreground)',
        glass: 'rgba(255, 255, 255, 0.1)',
        'glass-border': 'rgba(255, 255, 255, 0.2)',
        // Ruanta / Soft UI Tokens (Strict Spec)
        ruanta: {
          bg: '#F2F2F2',
          surface: {
            primary: 'rgba(255, 255, 255, 0.62)',
            secondary: 'rgba(255, 255, 255, 0.45)',
          },
          accent: {
            green: '#C8FF57',
            lavender: '#D4C7FF',
            charcoal: '#212121',
          },
          text: {
            primary: '#1C1C1C',
            secondary: '#6D6D6D',
          },
          border: 'rgba(255, 255, 255, 0.28)',
        },
        // Soft UI Tokens (Legacy - Keeping for compatibility)
        soft: {
          bg: '#F2F3F5',
          panel: '#FFFFFF',
          surface: '#F7F8FA',
          accent: '#18181B', // Zinc-900
          lime: '#D1E662',
        },
        pastel: {
          pink: '#FFE5E5',
          orange: '#FFF4E5',
          blue: '#E5F4FF',
          purple: '#F4E5FF',
        }
      },
      borderRadius: {
        'ruanta-lg': '28px',
        'ruanta-md': '18px',
        'ruanta-pill': '9999px',
      },
      boxShadow: {
        soft: '0 8px 30px rgba(0, 0, 0, 0.04)',
        'soft-xl': '0 20px 40px rgba(0, 0, 0, 0.04)',
        'soft-2xl': '0 30px 60px rgba(0, 0, 0, 0.05)',
        glow: '0 0 20px rgba(255, 229, 229, 0.5)',
        
        // Ruanta Strict Shadows
        'ruanta-lg': '0px 10px 36px rgba(0,0,0,0.09)',
        'ruanta-md': '0px 4px 18px rgba(0,0,0,0.06)',
        'ruanta-float': '0px 18px 40px rgba(0,0,0,0.08)',

        // New Soft UI Shadows
        'neumorphic-sm': '0 2px 8px -1px rgba(0,0,0,0.04), inset 0 1px 0 rgba(255,255,255,1)',
        'neumorphic-md': '0 12px 24px -4px rgba(0,0,0,0.06), inset 0 1px 0 rgba(255,255,255,1)',
        'neumorphic-lg': '0 24px 48px -8px rgba(0,0,0,0.08), inset 0 1px 0 rgba(255,255,255,1)',
        'neumorphic-float': '0 32px 64px -12px rgba(0,0,0,0.12), inset 0 1px 0 rgba(255,255,255,0.8)',
        'inner-light': 'inset 0 2px 4px 0 rgba(255,255,255,0.6)',
      },
      animation: {
        'border-beam': 'border-beam 4s linear infinite',
        float: 'float 6s ease-in-out infinite',
        'pulse-slow': 'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'spin-slow': 'spin 3s linear infinite',
        shake: 'shake 0.5s ease-in-out',
        shimmer: 'shimmer 1.5s infinite',
      },
      keyframes: {
        'border-beam': {
          '100%': { offsetDistance: '100%' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        shake: {
          '0%, 100%': { transform: 'translateX(0)' },
          '10%, 30%, 50%, 70%, 90%': { transform: 'translateX(-4px)' },
          '20%, 40%, 60%, 80%': { transform: 'translateX(4px)' },
        },
        shimmer: {
          '100%': { transform: 'translateX(100%)' },
        },
      },
    },
  },
  plugins: [
    function ({ addUtilities }: { addUtilities: any }) {
      addUtilities({
        '.transform-style-3d': {
          'transform-style': 'preserve-3d',
        },
        '.backface-hidden': {
          'backface-visibility': 'hidden',
        },
        '.perspective-1000': {
          perspective: '1000px',
        },
        '.rotate-x-60': {
          transform: 'rotateX(60deg)',
        },
      })
    },
  ],
}

export default config
