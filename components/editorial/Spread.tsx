
import React from 'react'
import { cn } from '@/lib/utils/cn'
import { EditorialSpread, LayoutElement } from '@/lib/editorial/types'
import { EditorialImage } from './EditorialImage'
import { EditorialHeading, EditorialBody, PullQuote, BigLetter, Caption } from './Typography'

interface Props {
  spread: EditorialSpread
  debug?: boolean
}

export function Spread({ spread, debug }: Props) {
  const isViewportHeight = spread.height === 'viewport'
  
  // Theme configuration - neutral palette only
  const themeStyles = {
    light: 'bg-[#FAFAFA] text-neutral-900',
    dark: 'bg-[#0F172A] text-white selection:bg-white selection:text-black', // Navy
    accent: 'bg-stone-100 text-neutral-900', // Subtle warm gray instead of yellow
  }
  
  const currentTheme = spread.theme || 'light'
  const isDark = currentTheme === 'dark'

  return (
    <section 
      className={cn(
        "relative w-full overflow-hidden transition-colors duration-700",
        themeStyles[currentTheme],
        isViewportHeight ? "min-h-screen py-0" : "py-12 md:py-24",
        // Mobile: Stacked
        // Desktop: Grid
        "flex flex-col md:grid md:grid-cols-12 md:gap-x-5 md:gap-y-5",
        spread.template === 'cinematic-full' ? "md:gap-0" : ""
      )}
      style={{
        // On desktop, enforce height if viewport
        ...(isViewportHeight ? { height: '100vh' } : {})
      }}
    >
      {/* Debug Grid Overlay */}
      {debug && (
        <div className="absolute inset-0 pointer-events-none z-50 flex px-12 opacity-10">
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className="flex-1 border-x border-red-500 bg-red-100/20 h-full" />
          ))}
        </div>
      )}

      {spread.elements.map((element) => (
        <SpreadElement key={element.id} element={element} />
      ))}

      {/* Page Folio / Number - Only show for actual content pages (not title/quote spreads) */}
      {typeof spread.pageNumber === 'number' && spread.pageNumber > 0 && (
        <div className="absolute bottom-8 left-8 md:left-12 text-[10px] font-sans tracking-widest text-neutral-400 uppercase z-20 hidden md:block">
          Page {spread.pageNumber.toString().padStart(2, '0')}
        </div>
      )}
      
      {/* Page Shadow Simulation (Gutter Shadow) */}
      {!isViewportHeight && (
        <div className={cn(
          "absolute top-0 bottom-0 left-1/2 w-px -ml-px h-full hidden md:block pointer-events-none",
          isDark 
            ? "bg-gradient-to-r from-transparent via-white/10 to-transparent mix-blend-overlay"
            : "bg-gradient-to-r from-transparent via-neutral-900/5 to-transparent mix-blend-multiply"
        )} />
      )}
      
      {/* Hairline Divider (Top) */}
      {!isViewportHeight && spread.pageNumber && spread.pageNumber % 2 === 0 && (
        <div className={cn(
          "absolute top-12 left-12 right-12 h-px hidden md:block",
          isDark ? "bg-white/10" : "bg-neutral-900/10"
        )} />
      )}
    </section>
  )
}

function SpreadElement({ element }: { element: LayoutElement }) {
  // Compute styles for grid placement
  const gridStyle: React.CSSProperties = {
    gridColumn: `${element.span.colStart} / span ${element.span.colSpan}`,
    gridRow: element.span.rowStart 
      ? `${element.span.rowStart} / span ${element.span.rowSpan || 1}` 
      : 'auto',
  }

  // Mobile override: Reset grid placement to avoid breaking flow
  // We use a media query hack or just rely on the parent being flex-col on mobile
  // Since parent is flex-col on mobile, grid-column properties are ignored.
  
  const getAlign = (align?: 'start' | 'center' | 'end'): 'left' | 'center' | 'right' => {
    if (align === 'end') return 'right'
    if (align === 'center') return 'center'
    return 'left'
  }

  const renderContent = () => {
    switch (element.type) {
      case 'image':
        return (
          <div className={cn("w-full h-full", element.style?.fit === 'contain' ? 'p-8' : '')}>
            <EditorialImage 
              image={element.content} 
              fit={element.style?.fit} 
              className={element.style?.className}
            />
            {element.content.role === 'hero' && (
              <div className="mt-2 hidden md:block">
                {/* Optional caption for hero */}
              </div>
            )}
          </div>
        )
      
      case 'text':
        const { title, body, isTitle } = element.content
        return (
          <div className={cn("flex flex-col justify-center h-full px-6 md:px-0", element.style?.className)}>
            {title && isTitle ? (
              <EditorialHeading align={getAlign(element.style?.align)}>{title}</EditorialHeading>
            ) : title ? (
              <h3 className="font-serif text-2xl mb-4">{title}</h3>
            ) : null}
            
            {body && (
              <EditorialBody align={getAlign(element.style?.align)} dropCap={element.style?.fontSize === 'lg'}>
                {body}
              </EditorialBody>
            )}
            
            {element.content.subtitle && (
              <div className="mt-6 border-t border-neutral-900/10 pt-4">
                 <Caption>{element.content.subtitle}</Caption>
              </div>
            )}
          </div>
        )

      case 'quote':
        return (
          <div className="flex items-center justify-center h-full px-6 md:px-0">
            <PullQuote align={getAlign(element.style?.align)}>
              {element.content}
            </PullQuote>
          </div>
        )

      case 'letter':
        return (
          <div className="flex items-center justify-center h-full overflow-hidden">
            <BigLetter className={element.style?.className}>
              {element.content}
            </BigLetter>
          </div>
        )

      default:
        return null
    }
  }

  return (
    <div 
      className={cn(
        "relative",
        // Mobile spacing
        "mb-8 md:mb-0",
        element.style?.className
      )}
      style={{
        // Apply grid styles only on md+ via CSS variable injection or just inline style
        // React inline styles apply always.
        // But since parent is flex on mobile, grid props are ignored by browser layout engine.
        // EXCEPT if we set width/height.
        ...gridStyle
      }}
    >
      {renderContent()}
    </div>
  )
}
