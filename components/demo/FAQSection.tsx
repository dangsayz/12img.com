'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronDown, HelpCircle } from 'lucide-react'

const faqs = [
  {
    question: 'Can my clients download all images at once?',
    answer: 'Absolutely! Clients can download all photos as a single ZIP file with one click. We automatically generate the archive in the background so there\'s no waiting. Individual downloads are also available for each photo.',
  },
  {
    question: 'Do you compress image quality?',
    answer: 'Never. We deliver your photos at full resolution exactly as you uploaded them. No compression, no quality loss. Your work deserves to be seen at its best.',
  },
  {
    question: 'Is there password protection for galleries?',
    answer: 'Yes! You can set a custom password for each gallery. Only people with the password can view the photos. Perfect for keeping client galleries private until you\'re ready to share.',
  },
  {
    question: 'Can I use my own domain?',
    answer: 'Custom domains are available on our Pro plan. Your galleries can live at your-studio.com/gallery instead of 12img.com. It\'s a seamless brand experience for your clients.',
  },
  {
    question: 'How long do galleries stay online?',
    answer: 'Galleries stay online as long as you have an active subscription. We also create automatic backups so your clients always have access to their photos. Unlike other platforms, we never delete galleries without notice.',
  },
  {
    question: 'Can clients favorite and select photos?',
    answer: 'Yes! Clients can heart their favorite photos while browsing. You\'ll be able to see their selections, making it easy to coordinate album picks or print orders.',
  },
]

export function FAQSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(0)

  return (
    <section className="py-20 lg:py-28 bg-[#FAF8F5]">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <span className="inline-block px-3 py-1 rounded-full bg-white text-xs font-medium text-[#78716C] mb-4 border border-[#E8E4DC]">
            FAQ
          </span>
          <h2 className="text-3xl sm:text-4xl font-bold text-[#1C1917] mb-4">
            Common questions
          </h2>
          <p className="text-[#78716C]">
            Everything you need to know about 12img galleries.
          </p>
        </motion.div>

        {/* FAQ Accordion */}
        <div className="space-y-3">
          {faqs.map((faq, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.05 }}
              className="bg-white rounded-xl border border-[#E8E4DC] overflow-hidden"
            >
              <button
                onClick={() => setOpenIndex(openIndex === index ? null : index)}
                className="w-full flex items-center justify-between p-5 text-left hover:bg-[#FAFAF9] transition-colors"
                aria-expanded={openIndex === index}
              >
                <div className="flex items-center gap-3">
                  <HelpCircle className="w-5 h-5 text-[#A8A29E] flex-shrink-0" />
                  <span className="font-medium text-[#1C1917] pr-4">{faq.question}</span>
                </div>
                <ChevronDown 
                  className={`w-5 h-5 text-[#78716C] flex-shrink-0 transition-transform duration-200 ${
                    openIndex === index ? 'rotate-180' : ''
                  }`} 
                />
              </button>
              
              <AnimatePresence initial={false}>
                {openIndex === index && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >
                    <div className="px-5 pb-5 pl-13">
                      <div className="pl-8 text-[#78716C] leading-relaxed text-sm">
                        {faq.answer}
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </div>

        {/* Contact CTA */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="mt-12 text-center"
        >
          <p className="text-[#78716C] mb-2">Still have questions?</p>
          <a 
            href="mailto:hello@12img.com" 
            className="text-[#1C1917] font-medium hover:text-amber-600 transition-colors"
          >
            Get in touch →
          </a>
        </motion.div>
      </div>
    </section>
  )
}
