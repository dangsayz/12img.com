'use client'

import Link from 'next/link'
import Image from 'next/image'
import { ArrowLeft, Plus, X } from 'lucide-react'
import { UploadZoneV2 } from './UploadZoneV2'

interface UploadInterfaceProps {
  gallery: {
    id: string
    title: string
    slug: string
  }
  images: any[]
}

export function UploadInterface({ gallery, images }: UploadInterfaceProps) {
  return (
    <div className="min-h-screen bg-white">
      {/* Minimal Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-sm border-b border-stone-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 sm:h-16 flex items-center justify-between">
          <div className="flex items-center gap-4 sm:gap-6">
            {/* Desktop: Back with text */}
            <Link 
              href={`/gallery/${gallery.id}`}
              className="hidden sm:flex items-center gap-2 text-stone-500 hover:text-stone-900 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="text-sm">Back</span>
            </Link>
            {/* Mobile: X button - large touch target */}
            <Link 
              href={`/gallery/${gallery.id}`}
              className="sm:hidden flex items-center justify-center w-10 h-10 -ml-2 text-stone-500 hover:text-stone-900 active:bg-stone-100 rounded-full transition-colors"
            >
              <X className="w-5 h-5" />
            </Link>
            <div className="h-4 w-px bg-stone-200 hidden sm:block" />
            <h1 className="text-sm font-medium text-stone-900 truncate max-w-[200px] sm:max-w-none">{gallery.title}</h1>
          </div>
          <p className="text-xs text-stone-400 tracking-wide uppercase">
            {images.length} Photos
          </p>
        </div>
      </header>

      {/* Main Content */}
      <main className="pt-16">
        {/* Hero Upload Zone */}
        <section className="border-b border-stone-100">
          <div className="max-w-4xl mx-auto px-6 py-16">
            <div className="text-center mb-10">
              <h2 className="text-2xl font-light text-stone-900 mb-2">Add to Collection</h2>
              <p className="text-sm text-stone-400">Drag and drop or click to browse</p>
            </div>
            <div className="bg-stone-50 border border-stone-200 p-8">
              <UploadZoneV2 
                galleryId={gallery.id} 
                onUploadComplete={() => {}} 
              />
            </div>
          </div>
        </section>

        {/* Gallery Grid - Editorial Mosaic */}
        <section className="py-16">
          <div className="max-w-7xl mx-auto px-6">
            {/* Section Header */}
            <div className="flex items-center justify-between mb-12">
              <div>
                <p className="text-xs text-stone-400 uppercase tracking-[0.2em] mb-1">Gallery</p>
                <h2 className="text-xl font-light text-stone-900">Your Collection</h2>
              </div>
            </div>

            {images.length > 0 ? (
              /* Pic-Time Style Mosaic - Groups of 5 with alternating hero positions */
              <div className="space-y-1">
                {(() => {
                  const rows: JSX.Element[] = []
                  let i = 0
                  let rowIndex = 0
                  
                  while (i < images.length) {
                    const remaining = images.length - i
                    const pattern = rowIndex % 2
                    
                    if (remaining >= 5) {
                      // Full pattern: 1 hero (2x2) + 4 small
                      const heroImg = images[i]
                      const smallImgs = images.slice(i + 1, i + 5)
                      
                      rows.push(
                        <div key={rowIndex} className="grid grid-cols-4 grid-rows-2 gap-1">
                          {pattern === 0 ? (
                            <>
                              {/* Hero left */}
                              <div className="col-span-2 row-span-2 relative bg-stone-100 overflow-hidden group cursor-pointer">
                                <div className="absolute inset-0">
                                  <Image src={heroImg.previewUrl || heroImg.thumbnailUrl} alt="" fill className="object-cover transition-transform duration-700 group-hover:scale-[1.03]" sizes="50vw" />
                                </div>
                                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300" />
                              </div>
                              {/* 4 small right */}
                              {smallImgs.map((img) => (
                                <div key={img.id} className="relative bg-stone-100 overflow-hidden group cursor-pointer">
                                  <div className="absolute inset-0">
                                    <Image src={img.previewUrl || img.thumbnailUrl} alt="" fill className="object-cover transition-transform duration-700 group-hover:scale-[1.03]" sizes="25vw" />
                                  </div>
                                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300" />
                                </div>
                              ))}
                            </>
                          ) : (
                            <>
                              {/* 4 small left */}
                              {smallImgs.slice(0, 2).map((img) => (
                                <div key={img.id} className="relative bg-stone-100 overflow-hidden group cursor-pointer">
                                  <div className="absolute inset-0">
                                    <Image src={img.previewUrl || img.thumbnailUrl} alt="" fill className="object-cover transition-transform duration-700 group-hover:scale-[1.03]" sizes="25vw" />
                                  </div>
                                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300" />
                                </div>
                              ))}
                              {/* Hero right */}
                              <div className="col-span-2 row-span-2 relative bg-stone-100 overflow-hidden group cursor-pointer">
                                <div className="absolute inset-0">
                                  <Image src={heroImg.previewUrl || heroImg.thumbnailUrl} alt="" fill className="object-cover transition-transform duration-700 group-hover:scale-[1.03]" sizes="50vw" />
                                </div>
                                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300" />
                              </div>
                              {smallImgs.slice(2, 4).map((img) => (
                                <div key={img.id} className="relative bg-stone-100 overflow-hidden group cursor-pointer">
                                  <div className="absolute inset-0">
                                    <Image src={img.previewUrl || img.thumbnailUrl} alt="" fill className="object-cover transition-transform duration-700 group-hover:scale-[1.03]" sizes="25vw" />
                                  </div>
                                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300" />
                                </div>
                              ))}
                            </>
                          )}
                        </div>
                      )
                      i += 5
                    } else if (remaining === 4) {
                      // 4 images: simple 4-column row
                      rows.push(
                        <div key={rowIndex} className="grid grid-cols-4 gap-1">
                          {images.slice(i, i + 4).map((img) => (
                            <div key={img.id} className="relative bg-stone-100 overflow-hidden group cursor-pointer aspect-square">
                              <Image src={img.previewUrl || img.thumbnailUrl} alt="" fill className="object-cover transition-transform duration-700 group-hover:scale-[1.03]" sizes="25vw" />
                              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300" />
                            </div>
                          ))}
                        </div>
                      )
                      i += 4
                    } else if (remaining === 3) {
                      // 3 images: 1 large + 2 small stacked
                      rows.push(
                        <div key={rowIndex} className="grid grid-cols-4 grid-rows-2 gap-1">
                          <div className="col-span-2 row-span-2 relative bg-stone-100 overflow-hidden group cursor-pointer">
                            <div className="absolute inset-0">
                              <Image src={images[i].previewUrl || images[i].thumbnailUrl} alt="" fill className="object-cover transition-transform duration-700 group-hover:scale-[1.03]" sizes="50vw" />
                            </div>
                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300" />
                          </div>
                          <div className="col-span-2 relative bg-stone-100 overflow-hidden group cursor-pointer">
                            <div className="absolute inset-0">
                              <Image src={images[i + 1].previewUrl || images[i + 1].thumbnailUrl} alt="" fill className="object-cover transition-transform duration-700 group-hover:scale-[1.03]" sizes="50vw" />
                            </div>
                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300" />
                          </div>
                          <div className="col-span-2 relative bg-stone-100 overflow-hidden group cursor-pointer">
                            <div className="absolute inset-0">
                              <Image src={images[i + 2].previewUrl || images[i + 2].thumbnailUrl} alt="" fill className="object-cover transition-transform duration-700 group-hover:scale-[1.03]" sizes="50vw" />
                            </div>
                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300" />
                          </div>
                        </div>
                      )
                      i += 3
                    } else if (remaining === 2) {
                      // 2 images: side by side
                      rows.push(
                        <div key={rowIndex} className="grid grid-cols-2 gap-1">
                          {images.slice(i, i + 2).map((img) => (
                            <div key={img.id} className="relative bg-stone-100 overflow-hidden group cursor-pointer aspect-[4/3]">
                              <Image src={img.previewUrl || img.thumbnailUrl} alt="" fill className="object-cover transition-transform duration-700 group-hover:scale-[1.03]" sizes="50vw" />
                              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300" />
                            </div>
                          ))}
                        </div>
                      )
                      i += 2
                    } else {
                      // 1 image: full width
                      rows.push(
                        <div key={rowIndex} className="relative bg-stone-100 overflow-hidden group cursor-pointer aspect-[21/9]">
                          <Image src={images[i].previewUrl || images[i].thumbnailUrl} alt="" fill className="object-cover transition-transform duration-700 group-hover:scale-[1.03]" sizes="100vw" />
                          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300" />
                        </div>
                      )
                      i += 1
                    }
                    rowIndex++
                  }
                  
                  return rows
                })()}
              </div>
            ) : (
              /* Empty State - Minimal */
              <div className="flex flex-col items-center justify-center py-32 text-center">
                <div className="w-16 h-16 border border-stone-200 flex items-center justify-center mb-6">
                  <Plus className="w-6 h-6 text-stone-300" />
                </div>
                <p className="text-stone-900 font-light text-lg mb-2">No photos yet</p>
                <p className="text-sm text-stone-400">
                  Upload images above to build your collection
                </p>
              </div>
            )}
          </div>
        </section>
      </main>
    </div>
  )
}
