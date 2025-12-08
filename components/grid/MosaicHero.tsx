'use client'

import { useEffect, useRef, useState, useMemo } from 'react'
import Image from 'next/image'
import { motion, AnimatePresence, useMotionValue, useSpring, useTransform } from 'framer-motion'
import { ChevronDown } from 'lucide-react'

interface MosaicHeroProps {
  images: Array<{
    id: string
    url: string
    thumbnailUrl: string
    width: number
    height: number
  }>
  title: string
  imageCount: number
  onScrollToGallery: () => void
}

// Particle system for ambient effect
function Particles() {
  const particles = useMemo(() => 
    Array.from({ length: 50 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 3 + 1,
      duration: Math.random() * 20 + 15,
      delay: Math.random() * 5,
    })), []
  )

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {particles.map((p) => (
        <motion.div
          key={p.id}
          className="absolute rounded-full bg-white/20"
          style={{
            width: p.size,
            height: p.size,
            left: `${p.x}%`,
            top: `${p.y}%`,
          }}
          animate={{
            y: [0, -30, 0],
            opacity: [0, 0.6, 0],
            scale: [0.5, 1, 0.5],
          }}
          transition={{
            duration: p.duration,
            delay: p.delay,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
      ))}
    </div>
  )
}

// Floating image with parallax and reveal effect
function FloatingImage({ 
  image, 
  index, 
  mouseX, 
  mouseY,
  isRevealed 
}: { 
  image: { url: string; thumbnailUrl: string; width: number; height: number }
  index: number
  mouseX: ReturnType<typeof useMotionValue<number>>
  mouseY: ReturnType<typeof useMotionValue<number>>
  isRevealed: boolean
}) {
  // Calculate position in a dynamic constellation pattern
  const positions = [
    { x: 15, y: 20, scale: 0.9, rotate: -3, z: 2 },
    { x: 75, y: 15, scale: 0.85, rotate: 2, z: 1 },
    { x: 50, y: 50, scale: 1.1, rotate: 0, z: 4 },  // Center hero
    { x: 20, y: 70, scale: 0.8, rotate: -2, z: 1 },
    { x: 80, y: 65, scale: 0.75, rotate: 3, z: 2 },
    { x: 35, y: 35, scale: 0.7, rotate: -1, z: 3 },
    { x: 65, y: 80, scale: 0.65, rotate: 1, z: 1 },
  ]
  
  const pos = positions[index % positions.length]
  
  // Parallax effect based on mouse
  const parallaxX = useTransform(mouseX, [0, 1], [-15 * pos.z, 15 * pos.z])
  const parallaxY = useTransform(mouseY, [0, 1], [-10 * pos.z, 10 * pos.z])
  
  const springX = useSpring(parallaxX, { stiffness: 50, damping: 20 })
  const springY = useSpring(parallaxY, { stiffness: 50, damping: 20 })

  const isHero = index === 2
  const aspectRatio = image.width / image.height
  const baseWidth = isHero ? 320 : 180 + (pos.scale * 60)
  const baseHeight = baseWidth / aspectRatio

  return (
    <motion.div
      className="absolute"
      style={{
        left: `${pos.x}%`,
        top: `${pos.y}%`,
        x: springX,
        y: springY,
        zIndex: pos.z * 10,
      }}
      initial={{ 
        opacity: 0, 
        scale: 0,
        rotate: pos.rotate + 180,
        filter: 'blur(20px)',
      }}
      animate={isRevealed ? { 
        opacity: 1, 
        scale: pos.scale,
        rotate: pos.rotate,
        filter: 'blur(0px)',
      } : {}}
      transition={{
        duration: 1.2,
        delay: index * 0.15,
        ease: [0.23, 1, 0.32, 1], // Custom easing
      }}
    >
      {/* Glow effect */}
      <motion.div
        className="absolute inset-0 -m-4 rounded-2xl"
        style={{
          background: `radial-gradient(ellipse at center, rgba(255,255,255,0.15) 0%, transparent 70%)`,
          filter: 'blur(20px)',
        }}
        animate={{
          opacity: [0.3, 0.6, 0.3],
          scale: [1, 1.1, 1],
        }}
        transition={{
          duration: 4 + index,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />
      
      {/* Image container with elegant frame */}
      <motion.div
        className="relative overflow-hidden bg-white/5 backdrop-blur-sm"
        style={{
          width: baseWidth,
          height: baseHeight,
          marginLeft: -baseWidth / 2,
          marginTop: -baseHeight / 2,
        }}
        whileHover={{ 
          scale: 1.05,
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
        }}
        transition={{ duration: 0.3 }}
      >
        {/* Subtle border glow */}
        <div className="absolute inset-0 border border-white/10 rounded-sm" />
        
        {/* Inner shadow for depth */}
        <div className="absolute inset-0 shadow-[inset_0_0_30px_rgba(0,0,0,0.3)]" />
        
        <Image
          src={image.thumbnailUrl || image.url}
          alt=""
          fill
          className="object-cover"
          sizes={isHero ? '320px' : '200px'}
        />
        
        {/* Shine effect on hover */}
        <motion.div
          className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/10 to-transparent"
          initial={{ x: '-100%', opacity: 0 }}
          whileHover={{ x: '100%', opacity: 1 }}
          transition={{ duration: 0.6 }}
        />
      </motion.div>
      
      {/* Connection lines to other images (constellation effect) */}
      {index < 3 && (
        <svg 
          className="absolute pointer-events-none" 
          style={{ 
            width: '200%', 
            height: '200%', 
            left: '-50%', 
            top: '-50%',
            zIndex: -1,
          }}
        >
          <motion.line
            x1="50%"
            y1="50%"
            x2={`${50 + (Math.random() - 0.5) * 80}%`}
            y2={`${50 + (Math.random() - 0.5) * 80}%`}
            stroke="rgba(255,255,255,0.1)"
            strokeWidth="1"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={isRevealed ? { pathLength: 1, opacity: 0.3 } : {}}
            transition={{ duration: 2, delay: index * 0.3 + 0.5 }}
          />
        </svg>
      )}
    </motion.div>
  )
}

export function MosaicHero({ images, title, imageCount, onScrollToGallery }: MosaicHeroProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [isRevealed, setIsRevealed] = useState(false)
  const [titleRevealed, setTitleRevealed] = useState(false)
  
  const mouseX = useMotionValue(0.5)
  const mouseY = useMotionValue(0.5)

  // Trigger reveal animation
  useEffect(() => {
    const timer1 = setTimeout(() => setIsRevealed(true), 300)
    const timer2 = setTimeout(() => setTitleRevealed(true), 800)
    return () => {
      clearTimeout(timer1)
      clearTimeout(timer2)
    }
  }, [])

  // Track mouse for parallax
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!containerRef.current) return
      const rect = containerRef.current.getBoundingClientRect()
      mouseX.set((e.clientX - rect.left) / rect.width)
      mouseY.set((e.clientY - rect.top) / rect.height)
    }
    
    window.addEventListener('mousemove', handleMouseMove)
    return () => window.removeEventListener('mousemove', handleMouseMove)
  }, [mouseX, mouseY])

  // Select hero images (up to 7)
  const heroImages = useMemo(() => images.slice(0, 7), [images])

  // Split title for character animation
  const titleChars = useMemo(() => title.split(''), [title])

  return (
    <div 
      ref={containerRef}
      className="relative h-screen w-full overflow-hidden bg-gradient-to-b from-stone-950 via-stone-900 to-stone-950"
    >
      {/* Animated gradient background */}
      <motion.div
        className="absolute inset-0"
        style={{
          background: 'radial-gradient(ellipse at 30% 20%, rgba(120, 119, 198, 0.15) 0%, transparent 50%), radial-gradient(ellipse at 70% 80%, rgba(255, 182, 193, 0.1) 0%, transparent 50%)',
        }}
        animate={{
          opacity: [0.5, 0.8, 0.5],
        }}
        transition={{
          duration: 8,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />

      {/* Particle system */}
      <Particles />

      {/* Floating images constellation */}
      <div className="absolute inset-0">
        {heroImages.map((img, i) => (
          <FloatingImage
            key={img.id}
            image={img}
            index={i}
            mouseX={mouseX}
            mouseY={mouseY}
            isRevealed={isRevealed}
          />
        ))}
      </div>

      {/* Vignette overlay */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,rgba(0,0,0,0.4)_100%)]" />

      {/* Title and info */}
      <div className="absolute inset-0 flex flex-col items-center justify-center z-20 pointer-events-none">
        {/* Gallery title with character reveal */}
        <motion.div
          className="relative mb-6"
          initial={{ opacity: 0 }}
          animate={titleRevealed ? { opacity: 1 } : {}}
        >
          {/* Backdrop blur for readability */}
          <div className="absolute inset-0 -m-8 bg-black/20 backdrop-blur-md rounded-3xl" />
          
          <h1 className="relative font-serif text-4xl sm:text-5xl md:text-6xl lg:text-7xl text-white tracking-tight">
            {titleChars.map((char, i) => (
              <motion.span
                key={i}
                className="inline-block"
                initial={{ 
                  opacity: 0, 
                  y: 50,
                  rotateX: -90,
                  filter: 'blur(10px)',
                }}
                animate={titleRevealed ? { 
                  opacity: 1, 
                  y: 0,
                  rotateX: 0,
                  filter: 'blur(0px)',
                } : {}}
                transition={{
                  duration: 0.8,
                  delay: i * 0.03,
                  ease: [0.23, 1, 0.32, 1],
                }}
              >
                {char === ' ' ? '\u00A0' : char}
              </motion.span>
            ))}
          </h1>
        </motion.div>

        {/* Image count with elegant reveal */}
        <motion.p
          className="text-white/60 text-lg sm:text-xl tracking-[0.3em] uppercase font-light"
          initial={{ opacity: 0, y: 20, letterSpacing: '0.5em' }}
          animate={titleRevealed ? { 
            opacity: 1, 
            y: 0, 
            letterSpacing: '0.3em',
          } : {}}
          transition={{ duration: 1, delay: 1.2 }}
        >
          {imageCount} photographs
        </motion.p>

        {/* Decorative line */}
        <motion.div
          className="w-16 h-px bg-gradient-to-r from-transparent via-white/40 to-transparent mt-8"
          initial={{ scaleX: 0, opacity: 0 }}
          animate={titleRevealed ? { scaleX: 1, opacity: 1 } : {}}
          transition={{ duration: 1.5, delay: 1.5 }}
        />
      </div>

      {/* Scroll indicator */}
      <motion.button
        className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center gap-2 text-white/50 hover:text-white/80 transition-colors pointer-events-auto"
        onClick={onScrollToGallery}
        initial={{ opacity: 0, y: -20 }}
        animate={titleRevealed ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.8, delay: 2 }}
      >
        <span className="text-xs tracking-[0.2em] uppercase">View Gallery</span>
        <motion.div
          animate={{ y: [0, 8, 0] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
        >
          <ChevronDown className="w-5 h-5" />
        </motion.div>
      </motion.button>

      {/* Bottom gradient fade */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-white to-transparent z-10" />
    </div>
  )
}
