'use client'

import { motion, MotionValue, useTransform } from 'framer-motion'

interface BackgroundGrid3DProps {
  progress: MotionValue<number>
}

export function BackgroundGrid3D({ progress }: BackgroundGrid3DProps) {
  const rotateZ = useTransform(progress, [0, 1], [0, 20])
  const rotateX = useTransform(progress, [0, 0.5], [45, 60])
  const scale = useTransform(progress, [0, 0.5], [1.5, 1])
  const opacity = useTransform(progress, [0.1, 0.3], [0, 1])

  return (
    <motion.div
      style={{
        rotateX,
        rotateZ,
        scale,
        opacity,
      }}
      className="absolute inset-0 -z-10 flex items-center justify-center transform-style-3d"
    >
      {/* Main Grid */}
      <div className="absolute h-[200%] w-[200%] bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)]" />

      {/* Floating Orbs for Parallax */}
      <motion.div 
        style={{ y: useTransform(progress, [0, 1], [0, -100]) }}
        className="absolute top-1/4 left-1/4 h-64 w-64 rounded-full bg-pastel-pink/20 blur-3xl" 
      />
      <motion.div 
        style={{ y: useTransform(progress, [0, 1], [0, -50]) }}
        className="absolute bottom-1/4 right-1/4 h-96 w-96 rounded-full bg-pastel-blue/20 blur-3xl" 
      />
    </motion.div>
  )
}
