'use client'

import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { markWelcomeSeen } from '@/server/actions/onboarding.actions'

interface WelcomeScreenProps {
  businessName: string | null
}

export function WelcomeScreen({ businessName }: WelcomeScreenProps) {
  const router = useRouter()

  const handleContinue = async (destination: string) => {
    await markWelcomeSeen()
    router.push(destination)
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Skip Link */}
      <div className="absolute top-6 right-8 z-10">
        <button 
          onClick={() => handleContinue('/')}
          className="text-sm text-gray-500 hover:text-gray-900 underline underline-offset-4 transition-colors"
        >
          Skip
        </button>
      </div>

      <div className="max-w-6xl mx-auto px-8 py-16 lg:py-24">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Left Content */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
          >
            <p className="text-gray-500 mb-4">
              Welcome to <span className="font-medium text-gray-900">12img</span>
            </p>
            
            <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl leading-tight mb-6">
              <span className="font-semibold">We are excited to show you how we can take your photos further!</span>
              {' '}
              <span className="text-gray-500 font-normal">
                Upload 20 photos from a single session to get started.
              </span>
            </h1>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.5 }}
              className="mt-10"
            >
              <button
                onClick={() => handleContinue('/upload')}
                className="inline-flex items-center justify-center px-8 py-4 bg-sky-500 hover:bg-sky-600 text-white font-medium rounded-xl transition-colors shadow-lg shadow-sky-500/25"
              >
                Let&apos;s go!
              </button>
            </motion.div>

            {businessName && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="mt-8 text-sm text-gray-400"
              >
                Creating galleries for <span className="text-gray-600">{businessName}</span>
              </motion.p>
            )}
          </motion.div>

          {/* Right - Image Grid */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="relative"
          >
            <div className="grid grid-cols-3 gap-3">
              {/* Image 1 - Tall left */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="col-span-1 row-span-2 rounded-2xl overflow-hidden bg-stone-100 aspect-[3/4]"
              >
                <Image
                  src="/images/showcase/auth-hero.jpg"
                  alt="Photography sample"
                  width={300}
                  height={400}
                  className="w-full h-full object-cover"
                />
              </motion.div>

              {/* Image 2 - Top middle */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="col-span-1 rounded-2xl overflow-hidden bg-amber-50 aspect-square"
              >
                <div className="w-full h-full bg-gradient-to-br from-amber-100 to-orange-100 flex items-center justify-center">
                  <div className="w-16 h-16 rounded-full bg-amber-200/50" />
                </div>
              </motion.div>

              {/* Image 3 - Top right */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="col-span-1 rounded-2xl overflow-hidden bg-stone-100 aspect-square"
              >
                <Image
                  src="/images/showcase/auth-hero.jpg"
                  alt="Photography sample"
                  width={200}
                  height={200}
                  className="w-full h-full object-cover object-top"
                />
              </motion.div>

              {/* Image 4 - Bottom middle/right spanning */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
                className="col-span-2 rounded-2xl overflow-hidden bg-stone-50 aspect-[2/1]"
              >
                <Image
                  src="/images/showcase/auth-hero.jpg"
                  alt="Photography sample"
                  width={400}
                  height={200}
                  className="w-full h-full object-cover object-center"
                />
              </motion.div>
            </div>

            {/* Decorative elements */}
            <div className="absolute -z-10 -top-8 -right-8 w-64 h-64 bg-gradient-to-br from-sky-100/50 to-violet-100/50 rounded-full blur-3xl" />
          </motion.div>
        </div>
      </div>
    </div>
  )
}
