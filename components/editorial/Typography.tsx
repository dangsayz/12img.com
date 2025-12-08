
import React from 'react'
import { cn } from '@/lib/utils/cn'

interface TextProps {
  children: React.ReactNode
  className?: string
  align?: 'left' | 'center' | 'right' | 'justify'
}

export function EditorialHeading({ children, className, align = 'left' }: TextProps) {
  return (
    <h1 className={cn(
      // Migra serif font - matches landing page
      "font-serif text-[clamp(2.5rem,8vw,5rem)] font-light leading-[1.1] tracking-tight text-neutral-800",
      {
        'text-left': align === 'left',
        'text-center': align === 'center',
        'text-right': align === 'right',
      },
      className
    )}>
      {children}
    </h1>
  )
}

export function EditorialSubheading({ children, className, align = 'left' }: TextProps) {
  return (
    <h3 className={cn(
      "font-serif text-2xl sm:text-3xl md:text-4xl italic font-light text-neutral-600",
      {
        'text-left': align === 'left',
        'text-center': align === 'center',
        'text-right': align === 'right',
      },
      className
    )}>
      {children}
    </h3>
  )
}

export function EditorialBody({ children, className, align = 'left', dropCap = false }: TextProps & { dropCap?: boolean }) {
  return (
    <div className={cn(
      "font-serif text-lg sm:text-xl leading-relaxed text-neutral-800",
      {
        'text-left': align === 'left',
        'text-center': align === 'center',
        'text-right': align === 'right',
        'text-justify': align === 'justify',
      },
      className
    )}>
      {dropCap && typeof children === 'string' ? (
        <>
          <span className="float-left text-6xl sm:text-7xl leading-[0.8] pr-3 pt-1 font-serif font-light">
            {children.charAt(0)}
          </span>
          {children.slice(1)}
        </>
      ) : children}
    </div>
  )
}

export function PullQuote({ children, className, align = 'center' }: TextProps) {
  return (
    <blockquote className={cn(
      "relative py-8 sm:py-12 my-8 sm:my-12",
      {
        'text-left': align === 'left',
        'text-center': align === 'center',
        'text-right': align === 'right',
      },
      className
    )}>
      <div className="font-serif text-3xl sm:text-4xl md:text-5xl lg:text-6xl leading-tight text-neutral-900 italic">
        "{children}"
      </div>
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-12 h-px bg-neutral-900/20" />
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-12 h-px bg-neutral-900/20" />
    </blockquote>
  )
}

export function BigLetter({ children, className }: { children: string, className?: string }) {
  return (
    <div className={cn(
      "font-serif text-[12rem] sm:text-[16rem] md:text-[20rem] leading-none font-thin text-neutral-900 opacity-10 select-none pointer-events-none",
      className
    )}>
      {children}
    </div>
  )
}

export function Caption({ children, className }: TextProps) {
  return (
    <p className={cn(
      // Apple-inspired: Light weight, generous letter-spacing
      "font-sans text-[11px] sm:text-xs font-medium tracking-[0.2em] uppercase text-neutral-400",
      className
    )}>
      {children}
    </p>
  )
}
