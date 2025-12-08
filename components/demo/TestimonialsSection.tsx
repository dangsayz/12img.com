'use client'

import { motion } from 'framer-motion'
import { Star, Quote } from 'lucide-react'

const testimonials = [
  {
    name: 'Jessica Chen',
    studio: 'Luminous Photography',
    location: 'San Francisco, CA',
    quote: "The galleries are so elegant that my couples share them everywhere. It's like having a personal marketing team working for me.",
    rating: 5,
    initials: 'JC',
    gradient: 'from-rose-400 to-pink-500',
  },
  {
    name: 'Marcus Williams',
    studio: 'M.W. Wedding Films',
    location: 'Atlanta, GA',
    quote: "Switched from my previous gallery service last year. My clients love the mobile experience, and I'm saving $200+ annually.",
    rating: 5,
    initials: 'MW',
    gradient: 'from-amber-400 to-orange-500',
  },
  {
    name: 'Emma Rodriguez',
    studio: 'Everlasting Moments',
    location: 'Miami, FL',
    quote: "Setup took 30 seconds. Literally uploaded, shared the link, and my bride was already browsing. Game changer.",
    rating: 5,
    initials: 'ER',
    gradient: 'from-emerald-400 to-teal-500',
  },
]

export function TestimonialsSection() {
  return (
    <section className="py-20 lg:py-28 bg-white">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <span className="inline-block px-3 py-1 rounded-full bg-[#F5F5F4] text-xs font-medium text-[#78716C] mb-4">
            TESTIMONIALS
          </span>
          <h2 className="text-3xl sm:text-4xl font-bold text-[#1C1917] mb-4">
            Loved by photographers worldwide
          </h2>
          <p className="text-[#78716C] max-w-2xl mx-auto">
            See what wedding photographers are saying about delivering galleries with 12img.
          </p>
        </motion.div>

        {/* Testimonials Grid */}
        <div className="grid md:grid-cols-3 gap-6">
          {testimonials.map((testimonial, index) => (
            <motion.div
              key={testimonial.name}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ y: -4 }}
              className="relative bg-[#FAFAF9] rounded-2xl p-6 border border-[#E8E4DC] hover:border-[#D6D3D1] transition-all group"
            >
              {/* Quote Icon */}
              <div className="absolute top-4 right-4 opacity-10">
                <Quote className="w-8 h-8 text-[#1C1917]" />
              </div>

              {/* Rating */}
              <div className="flex gap-0.5 mb-4">
                {[...Array(testimonial.rating)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
                ))}
              </div>

              {/* Quote */}
              <p className="text-[#44403C] leading-relaxed mb-6 text-sm">
                "{testimonial.quote}"
              </p>

              {/* Author */}
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${testimonial.gradient} flex items-center justify-center text-white text-sm font-bold shadow-lg`}>
                  {testimonial.initials}
                </div>
                <div>
                  <p className="text-sm font-medium text-[#1C1917]">{testimonial.name}</p>
                  <p className="text-xs text-[#78716C]">{testimonial.studio}</p>
                  <p className="text-xs text-[#A8A29E]">{testimonial.location}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Bottom Stats */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="mt-16 flex flex-wrap items-center justify-center gap-8 lg:gap-16"
        >
          <div className="text-center">
            <p className="text-3xl font-bold text-[#1C1917]">10,000+</p>
            <p className="text-sm text-[#78716C]">Photographers</p>
          </div>
          <div className="w-px h-8 bg-[#E7E5E4] hidden sm:block" />
          <div className="text-center">
            <p className="text-3xl font-bold text-[#1C1917]">2.5M</p>
            <p className="text-sm text-[#78716C]">Photos Delivered</p>
          </div>
          <div className="w-px h-8 bg-[#E7E5E4] hidden sm:block" />
          <div className="text-center flex items-center gap-2">
            <p className="text-3xl font-bold text-[#1C1917]">4.9</p>
            <div className="flex">
              {[1,2,3,4,5].map(i => (
                <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
