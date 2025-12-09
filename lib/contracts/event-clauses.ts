/**
 * Event-Type Specific Contract Clauses
 * 
 * Professional, legally-sound clause templates tailored for each event type.
 * These provide photographers with world-class contract language that protects
 * both parties while remaining clear and fair.
 */

import type { ClauseCategory } from '@/types/database'

// ============================================
// TYPES
// ============================================

export interface ClauseTemplate {
  id: string
  title: string
  category: ClauseCategory
  content: string
  isRequired: boolean
  sortOrder: number
  eventTypes: ('all' | 'wedding' | 'engagement' | 'portrait' | 'family' | 'newborn' | 'maternity' | 'corporate' | 'event')[]
}

// ============================================
// UNIVERSAL CLAUSES (All Event Types)
// ============================================

const UNIVERSAL_CLAUSES: ClauseTemplate[] = [
  {
    id: 'payment-terms',
    title: 'Payment Terms',
    category: 'payment',
    content: `A non-refundable retainer of {{retainer_amount}} is due upon signing this agreement to secure the date. The remaining balance of {{remaining_balance}} is due {{payment_due_date}}.

Accepted payment methods: bank transfer, credit card, Venmo, or check. Late payments may result in postponement of image delivery until the balance is settled.`,
    isRequired: true,
    sortOrder: 1,
    eventTypes: ['all'],
  },
  {
    id: 'copyright-usage',
    title: 'Copyright & Image Usage',
    category: 'copyright',
    content: `The Photographer retains full copyright ownership of all images created under this agreement, in accordance with U.S. Copyright Law.

**Client License:** The Client receives a personal, non-exclusive, non-transferable license to:
- Print images for personal display
- Share images on personal social media with photographer credit
- Use images for personal announcements and invitations

**Photographer Rights:** The Photographer reserves the right to use images for:
- Portfolio and website display
- Marketing and promotional materials
- Social media and advertising
- Industry publications and competitions
- Educational purposes

The Client may request in writing to exclude specific images from the Photographer's portfolio.`,
    isRequired: true,
    sortOrder: 2,
    eventTypes: ['all'],
  },
  {
    id: 'liability-limitation',
    title: 'Limitation of Liability',
    category: 'liability',
    content: `In the unlikely event of total photographic failure due to equipment malfunction, memory card failure, theft, or circumstances beyond the Photographer's control, liability is limited to a full refund of all payments received under this agreement.

The Photographer is not liable for:
- Compromised coverage due to venue restrictions or poor lighting conditions
- Missed moments due to timeline changes not communicated to the Photographer
- Images affected by conditions outside the Photographer's control
- Any indirect, incidental, or consequential damages

The Client acknowledges that photography is inherently unpredictable and that the Photographer cannot guarantee specific shots or outcomes.`,
    isRequired: true,
    sortOrder: 3,
    eventTypes: ['all'],
  },
  {
    id: 'cancellation-policy',
    title: 'Cancellation & Rescheduling',
    category: 'cancellation',
    content: `**Client Cancellation:**
- More than 90 days before event: Retainer forfeited; no additional fees
- 30-90 days before event: 50% of total package price due
- Less than 30 days before event: 100% of total package price due

**Rescheduling:** One reschedule is permitted at no additional charge if requested more than 30 days in advance, subject to Photographer availability. Subsequent reschedules may incur a \${{hourly_rate}} rebooking fee.

**Photographer Cancellation:** If the Photographer must cancel due to illness, emergency, or circumstances beyond their control, all payments will be refunded in full. The Photographer will make reasonable efforts to secure a qualified replacement photographer.`,
    isRequired: true,
    sortOrder: 4,
    eventTypes: ['all'],
  },
  {
    id: 'force-majeure',
    title: 'Force Majeure',
    category: 'force_majeure',
    content: `Neither party shall be liable for failure to perform obligations due to circumstances beyond reasonable control, including but not limited to:
- Natural disasters, severe weather, or acts of God
- Pandemic, epidemic, or public health emergencies
- Government restrictions, venue closure, or travel bans
- Civil unrest, terrorism, or war
- Death or serious illness of immediate family members

In such events, the parties agree to work together in good faith to reschedule or reach a mutually agreeable resolution. If rescheduling is not possible, payments will be refunded less any non-recoverable expenses already incurred.`,
    isRequired: false,
    sortOrder: 10,
    eventTypes: ['all'],
  },
  {
    id: 'dispute-resolution',
    title: 'Dispute Resolution',
    category: 'dispute_resolution',
    content: `Any disputes arising from this agreement shall first be addressed through good-faith negotiation between the parties.

If negotiation fails, disputes will be submitted to binding arbitration in {{arbitration_location}} under the rules of the American Arbitration Association. The arbitrator's decision shall be final and binding.

This agreement shall be governed by and construed in accordance with the laws of {{governing_state}}, without regard to conflict of law principles.

Each party shall bear their own costs and attorney's fees unless the arbitrator determines otherwise.`,
    isRequired: false,
    sortOrder: 11,
    eventTypes: ['all'],
  },
]

// ============================================
// WEDDING-SPECIFIC CLAUSES
// ============================================

const WEDDING_CLAUSES: ClauseTemplate[] = [
  {
    id: 'wedding-coverage',
    title: 'Wedding Day Coverage',
    category: 'scheduling',
    content: `This agreement covers {{package_hours}} hours of continuous photography coverage on {{event_date_formatted}}.

**Coverage Period:** {{start_time}} to {{end_time}}

Coverage includes:
- Getting ready preparations (as time permits)
- Ceremony documentation
- Family and wedding party portraits
- Reception highlights including first dance, toasts, and cake cutting
- Candid moments throughout the event

**Additional Hours:** Available at \${{hourly_rate}}/hour, subject to Photographer availability. Additional hours must be requested at least 24 hours in advance when possible.

The Photographer will arrive 15 minutes before the scheduled start time to prepare equipment.`,
    isRequired: true,
    sortOrder: 5,
    eventTypes: ['wedding'],
  },
  {
    id: 'wedding-timeline',
    title: 'Timeline & Cooperation',
    category: 'scheduling',
    content: `The Client agrees to provide a detailed timeline at least 14 days before the wedding date, including:
- Key ceremony times
- Portrait session windows
- Reception schedule and important moments
- Vendor contact information

The Client understands that adequate time must be allocated for portraits. The Photographer recommends:
- 30 minutes for couple portraits
- 20 minutes for wedding party
- 30 minutes for family formals

Rushed timelines may result in fewer images or missed moments. The Photographer is not responsible for shots missed due to timeline constraints not communicated in advance.`,
    isRequired: false,
    sortOrder: 6,
    eventTypes: ['wedding'],
  },
  {
    id: 'wedding-delivery',
    title: 'Image Delivery',
    category: 'delivery',
    content: `**Delivery Timeline:** The Client will receive access to a private online gallery within {{delivery_weeks}} weeks of the wedding date.

**Deliverables:**
- {{estimated_images}} professionally edited, high-resolution images
- Private online gallery with download capabilities
- Print release for personal use

**Gallery Access:** The online gallery will remain active for {{gallery_expiry_days}} days. The Client is responsible for downloading and backing up images before expiration. Gallery extensions may be available for an additional fee.

**Editing Style:** Images will be edited in the Photographer's signature style. The Photographer does not provide unedited RAW files or extensive retouching beyond standard color correction and exposure adjustments.`,
    isRequired: true,
    sortOrder: 7,
    eventTypes: ['wedding'],
  },
  {
    id: 'wedding-meals',
    title: 'Meals & Breaks',
    category: 'meals_breaks',
    content: `For coverage exceeding 5 hours, the Client agrees to provide a meal for the Photographer equivalent to guest meals, served at a seated location.

If a meal cannot be provided, a $50 meal allowance will be added to the final invoice.

The Photographer will take a 20-30 minute break during the meal service while remaining available for spontaneous moments.`,
    isRequired: false,
    sortOrder: 8,
    eventTypes: ['wedding'],
  },
  {
    id: 'wedding-second-shooter',
    title: 'Second Photographer',
    category: 'equipment',
    content: `{{#if second_shooter}}
A second photographer is included in this package to provide additional coverage and angles throughout the wedding day.

The second photographer will focus on:
- Alternate ceremony angles
- Guest reactions and candid moments
- Getting ready coverage (if occurring simultaneously)
- Reception details and candids

All images from the second photographer are edited and delivered alongside primary photographer images.
{{else}}
This package includes coverage by the primary Photographer only. A second photographer may be added for an additional fee, subject to availability.
{{/if}}`,
    isRequired: false,
    sortOrder: 9,
    eventTypes: ['wedding'],
  },
]

// ============================================
// ENGAGEMENT SESSION CLAUSES
// ============================================

const ENGAGEMENT_CLAUSES: ClauseTemplate[] = [
  {
    id: 'engagement-session',
    title: 'Session Details',
    category: 'scheduling',
    content: `This agreement covers a {{package_hours}}-hour engagement photography session.

**Session Date:** {{event_date_formatted}}
**Location:** {{event_location}}

The session includes:
- Pre-session consultation to discuss vision, wardrobe, and locations
- Up to 2 location changes within the session timeframe
- Direction and posing guidance throughout
- {{estimated_images}} professionally edited images

**Wardrobe:** The Client may bring up to 2 outfit changes. The Photographer recommends coordinating colors and avoiding busy patterns or logos.`,
    isRequired: true,
    sortOrder: 5,
    eventTypes: ['engagement'],
  },
  {
    id: 'engagement-delivery',
    title: 'Image Delivery',
    category: 'delivery',
    content: `**Delivery Timeline:** Images will be delivered via private online gallery within {{delivery_weeks}} weeks of the session date.

**Deliverables:**
- {{estimated_images}} professionally edited, high-resolution images
- Private online gallery with download and print ordering capabilities
- Print release for personal use

**Save the Dates:** If images are needed for save-the-date cards, please communicate your deadline at booking. Rush delivery may be available for an additional fee.`,
    isRequired: true,
    sortOrder: 6,
    eventTypes: ['engagement'],
  },
  {
    id: 'engagement-weather',
    title: 'Weather Policy',
    category: 'force_majeure',
    content: `Outdoor sessions are weather-dependent. In the event of inclement weather:

**Light Rain/Overcast:** Sessions will proceed as planned. Overcast conditions often produce beautiful, soft lighting.

**Heavy Rain/Storms:** The session will be rescheduled at no additional charge. The Photographer will contact the Client at least 4 hours before the session if rescheduling is recommended.

**Extreme Heat/Cold:** The Photographer may suggest timeline adjustments to ensure comfort and safety.

The Photographer reserves the right to make the final call on weather-related rescheduling.`,
    isRequired: false,
    sortOrder: 7,
    eventTypes: ['engagement'],
  },
]

// ============================================
// PORTRAIT SESSION CLAUSES
// ============================================

const PORTRAIT_CLAUSES: ClauseTemplate[] = [
  {
    id: 'portrait-session',
    title: 'Portrait Session Details',
    category: 'scheduling',
    content: `This agreement covers a {{package_hours}}-hour portrait photography session.

**Session Date:** {{event_date_formatted}}
**Location:** {{event_location}}

**Session Includes:**
- Pre-session consultation
- Professional direction and posing guidance
- {{estimated_images}} professionally edited images
- Private online gallery with download capabilities

**Preparation:** The Client is encouraged to arrive camera-ready. The Photographer can provide wardrobe and styling recommendations upon request.`,
    isRequired: true,
    sortOrder: 5,
    eventTypes: ['portrait'],
  },
  {
    id: 'portrait-delivery',
    title: 'Image Delivery',
    category: 'delivery',
    content: `**Delivery Timeline:** Images will be delivered within {{delivery_weeks}} weeks of the session.

**Deliverables:**
- {{estimated_images}} professionally edited images
- High-resolution files suitable for printing
- Web-resolution files optimized for social media
- Private online gallery access for {{gallery_expiry_days}} days

**Retouching:** Standard editing includes color correction, exposure adjustment, and minor blemish removal. Advanced retouching (skin smoothing, body modifications, composite work) is available for an additional fee.`,
    isRequired: true,
    sortOrder: 6,
    eventTypes: ['portrait'],
  },
]

// ============================================
// FAMILY SESSION CLAUSES
// ============================================

const FAMILY_CLAUSES: ClauseTemplate[] = [
  {
    id: 'family-session',
    title: 'Family Session Details',
    category: 'scheduling',
    content: `This agreement covers a {{package_hours}}-hour family photography session.

**Session Date:** {{event_date_formatted}}
**Location:** {{event_location}}

**Session Includes:**
- Full family group portraits
- Individual family unit combinations
- Candid interaction moments
- {{estimated_images}} professionally edited images

**Children:** The Photographer is experienced with children of all ages. Sessions are kept relaxed and fun. Snacks and small toys are welcome to help keep little ones engaged.

**Pets:** Family pets are welcome! Please let the Photographer know in advance so appropriate time can be allocated.`,
    isRequired: true,
    sortOrder: 5,
    eventTypes: ['family'],
  },
  {
    id: 'family-delivery',
    title: 'Image Delivery',
    category: 'delivery',
    content: `**Delivery Timeline:** Your family gallery will be ready within {{delivery_weeks}} weeks.

**Deliverables:**
- {{estimated_images}} professionally edited images
- Mix of posed and candid moments
- High-resolution files for printing
- Private online gallery with print ordering

**Print Products:** The Photographer offers professional print products including albums, canvases, and framed prints. A product guide will be provided with your gallery.`,
    isRequired: true,
    sortOrder: 6,
    eventTypes: ['family'],
  },
]

// ============================================
// NEWBORN SESSION CLAUSES
// ============================================

const NEWBORN_CLAUSES: ClauseTemplate[] = [
  {
    id: 'newborn-session',
    title: 'Newborn Session Details',
    category: 'scheduling',
    content: `This agreement covers a newborn photography session, ideally scheduled within the first 14 days of life when babies are sleepiest and most poseable.

**Tentative Date:** {{event_date_formatted}} (subject to baby's arrival)
**Location:** {{event_location}}

**Session Duration:** Newborn sessions typically last 2-3 hours to allow for feeding, soothing, and diaper changes. Please allow flexibility in your schedule.

**Session Includes:**
- Baby-only posed portraits
- Parent and sibling portraits with baby
- Detail shots (tiny fingers, toes, etc.)
- {{estimated_images}} professionally edited images

**Safety First:** The Photographer is trained in newborn safety and posing. Baby's comfort and safety are the top priority at all times.`,
    isRequired: true,
    sortOrder: 5,
    eventTypes: ['newborn'],
  },
  {
    id: 'newborn-scheduling',
    title: 'Flexible Scheduling',
    category: 'scheduling',
    content: `Babies arrive on their own schedule! The session date is tentative based on your due date.

**Booking:** Your session is reserved for approximately 2 weeks after your due date. The exact date will be confirmed once baby arrives.

**Notification:** Please contact the Photographer within 24-48 hours of birth to schedule your session.

**Rescheduling:** If baby arrives early or late, or if there are health concerns for mother or baby, the session will be rescheduled at no additional charge.

**Illness Policy:** If baby or any family member is ill on the session date, please reschedule. The health of your family and the Photographer is paramount.`,
    isRequired: true,
    sortOrder: 6,
    eventTypes: ['newborn'],
  },
  {
    id: 'newborn-delivery',
    title: 'Image Delivery',
    category: 'delivery',
    content: `**Delivery Timeline:** Your newborn gallery will be ready within {{delivery_weeks}} weeks.

**Deliverables:**
- {{estimated_images}} professionally edited images
- Artistic editing with soft, timeless tones
- High-resolution files for printing
- Private online gallery with print ordering

**Sneak Peek:** A small preview of 3-5 images will be shared within 1 week of your session.`,
    isRequired: true,
    sortOrder: 7,
    eventTypes: ['newborn'],
  },
]

// ============================================
// MATERNITY SESSION CLAUSES
// ============================================

const MATERNITY_CLAUSES: ClauseTemplate[] = [
  {
    id: 'maternity-session',
    title: 'Maternity Session Details',
    category: 'scheduling',
    content: `This agreement covers a maternity photography session, ideally scheduled between 28-36 weeks of pregnancy when the bump is beautifully visible and mom is still comfortable.

**Session Date:** {{event_date_formatted}}
**Location:** {{event_location}}

**Session Includes:**
- Solo maternity portraits
- Partner portraits (if applicable)
- Sibling portraits (if applicable)
- {{estimated_images}} professionally edited images

**Wardrobe:** The Photographer can provide guidance on flattering maternity wardrobe options. Flowy dresses, form-fitting gowns, and neutral colors photograph beautifully.`,
    isRequired: true,
    sortOrder: 5,
    eventTypes: ['maternity'],
  },
  {
    id: 'maternity-comfort',
    title: 'Comfort & Safety',
    category: 'scheduling',
    content: `Your comfort is the priority throughout the session.

**Breaks:** Please communicate if you need to sit, rest, or take a break at any time.

**Poses:** All poses will be comfortable and safe for pregnancy. The Photographer will never ask you to do anything that feels uncomfortable.

**Rescheduling:** If you are placed on bed rest or have pregnancy complications, the session will be rescheduled or converted to a newborn session credit at no additional charge.

**Early Arrival:** If baby decides to arrive before your session, your retainer will be applied toward a newborn session.`,
    isRequired: true,
    sortOrder: 6,
    eventTypes: ['maternity'],
  },
  {
    id: 'maternity-delivery',
    title: 'Image Delivery',
    category: 'delivery',
    content: `**Delivery Timeline:** Your maternity gallery will be ready within {{delivery_weeks}} weeks.

**Deliverables:**
- {{estimated_images}} professionally edited images
- Soft, glowing editing style
- High-resolution files for printing
- Private online gallery access

**Prints:** Maternity images make beautiful wall art and album additions. The Photographer offers professional print products to preserve these special memories.`,
    isRequired: true,
    sortOrder: 7,
    eventTypes: ['maternity'],
  },
]

// ============================================
// CORPORATE/HEADSHOT CLAUSES
// ============================================

const CORPORATE_CLAUSES: ClauseTemplate[] = [
  {
    id: 'corporate-session',
    title: 'Corporate Photography Details',
    category: 'scheduling',
    content: `This agreement covers corporate photography services as follows:

**Date:** {{event_date_formatted}}
**Location:** {{event_location}}
**Duration:** {{package_hours}} hours

**Services Include:**
- Professional headshots and/or event coverage
- On-site lighting and backdrop setup (if applicable)
- Direction for natural, professional expressions
- {{estimated_images}} professionally edited images

**Team Sessions:** For team headshots, please allocate approximately 10-15 minutes per person for optimal results.`,
    isRequired: true,
    sortOrder: 5,
    eventTypes: ['corporate'],
  },
  {
    id: 'corporate-usage',
    title: 'Commercial Usage Rights',
    category: 'usage_rights',
    content: `**License Granted:** The Client receives a non-exclusive, perpetual license to use delivered images for:
- Company website and internal communications
- LinkedIn and professional social media profiles
- Marketing materials and brochures
- Press releases and media kits

**Restrictions:** Images may not be:
- Resold or sublicensed to third parties
- Used in a manner that misrepresents the Photographer's work
- Altered in a way that damages the Photographer's reputation

**Extended Licensing:** Advertising, billboard, or broadcast usage requires an extended license agreement and additional fees.`,
    isRequired: true,
    sortOrder: 6,
    eventTypes: ['corporate'],
  },
  {
    id: 'corporate-delivery',
    title: 'Delivery & Formats',
    category: 'delivery',
    content: `**Delivery Timeline:** Images will be delivered within {{delivery_weeks}} business days.

**Deliverables:**
- High-resolution files (300 DPI, suitable for print)
- Web-optimized files (72 DPI, optimized for digital use)
- Standard crop ratios for common platforms
- Consistent editing across all images

**Rush Delivery:** Available for an additional 50% fee. Please inquire about availability.

**Revisions:** One round of minor adjustments (cropping, exposure tweaks) is included. Additional editing requests may incur fees.`,
    isRequired: true,
    sortOrder: 7,
    eventTypes: ['corporate'],
  },
]

// ============================================
// EVENT PHOTOGRAPHY CLAUSES
// ============================================

const EVENT_CLAUSES: ClauseTemplate[] = [
  {
    id: 'event-coverage',
    title: 'Event Coverage Details',
    category: 'scheduling',
    content: `This agreement covers photography services for the following event:

**Event:** {{package_name}}
**Date:** {{event_date_formatted}}
**Location:** {{event_location}}
**Venue:** {{event_venue}}
**Duration:** {{package_hours}} hours of coverage

**Coverage Includes:**
- Candid event documentation
- Key moments and speakers
- Venue and decor details
- Guest interactions and networking moments
- {{estimated_images}} professionally edited images`,
    isRequired: true,
    sortOrder: 5,
    eventTypes: ['event'],
  },
  {
    id: 'event-access',
    title: 'Venue Access & Restrictions',
    category: 'scheduling',
    content: `The Client agrees to:
- Provide the Photographer with necessary venue access and credentials
- Communicate any photography restrictions in advance
- Introduce the Photographer to key personnel and speakers
- Provide a schedule of key moments to be captured

The Photographer will:
- Remain unobtrusive while capturing candid moments
- Respect any restricted areas or photography limitations
- Coordinate with venue staff and other vendors professionally`,
    isRequired: false,
    sortOrder: 6,
    eventTypes: ['event'],
  },
  {
    id: 'event-delivery',
    title: 'Image Delivery',
    category: 'delivery',
    content: `**Delivery Timeline:** Event images will be delivered within {{delivery_weeks}} weeks.

**Deliverables:**
- {{estimated_images}} professionally edited images
- High-resolution files for print and digital use
- Web-resolution files for social media
- Private online gallery or direct file transfer

**Same-Day Delivery:** A selection of 10-20 edited images can be provided within 24 hours for an additional fee. Please inquire at booking.`,
    isRequired: true,
    sortOrder: 7,
    eventTypes: ['event'],
  },
]

// ============================================
// TRAVEL CLAUSE (Shared)
// ============================================

const TRAVEL_CLAUSE: ClauseTemplate = {
  id: 'travel-accommodation',
  title: 'Travel & Accommodation',
  category: 'travel',
  content: `**Local Coverage:** Travel within {{travel_radius}} miles of the Photographer's location is included at no additional charge.

**Extended Travel:** For locations beyond {{travel_radius}} miles:
- Mileage fee: \${{travel_rate}} per mile (round trip)
- Or actual airfare/transportation costs

**Destination Events:** For events requiring overnight stay, the Client agrees to cover:
- Round-trip transportation (flight, train, or mileage)
- Hotel accommodations (minimum 3-star equivalent)
- Reasonable meal expenses during travel

Travel arrangements should be confirmed at least 30 days before the event date.`,
  isRequired: false,
  sortOrder: 9,
  eventTypes: ['wedding', 'engagement', 'corporate', 'event'],
}

// ============================================
// EXPORT: GET CLAUSES BY EVENT TYPE
// ============================================

export function getClausesForEventType(eventType: string): ClauseTemplate[] {
  const allClauses = [
    ...UNIVERSAL_CLAUSES,
    ...WEDDING_CLAUSES,
    ...ENGAGEMENT_CLAUSES,
    ...PORTRAIT_CLAUSES,
    ...FAMILY_CLAUSES,
    ...NEWBORN_CLAUSES,
    ...MATERNITY_CLAUSES,
    ...CORPORATE_CLAUSES,
    ...EVENT_CLAUSES,
    TRAVEL_CLAUSE,
  ]

  return allClauses
    .filter(clause => 
      clause.eventTypes.includes('all') || 
      clause.eventTypes.includes(eventType as any)
    )
    .sort((a, b) => a.sortOrder - b.sortOrder)
}

export function getRequiredClausesForEventType(eventType: string): ClauseTemplate[] {
  return getClausesForEventType(eventType).filter(c => c.isRequired)
}

export function getOptionalClausesForEventType(eventType: string): ClauseTemplate[] {
  return getClausesForEventType(eventType).filter(c => !c.isRequired)
}

// ============================================
// EXPORT: ALL CLAUSES
// ============================================

export const ALL_CLAUSE_TEMPLATES: ClauseTemplate[] = [
  ...UNIVERSAL_CLAUSES,
  ...WEDDING_CLAUSES,
  ...ENGAGEMENT_CLAUSES,
  ...PORTRAIT_CLAUSES,
  ...FAMILY_CLAUSES,
  ...NEWBORN_CLAUSES,
  ...MATERNITY_CLAUSES,
  ...CORPORATE_CLAUSES,
  ...EVENT_CLAUSES,
  TRAVEL_CLAUSE,
]

// ============================================
// EXPORT: EVENT TYPE DEFAULTS
// ============================================

export const EVENT_TYPE_DEFAULTS: Record<string, {
  deliveryWeeks: string
  estimatedImages: string
  retainerAmount: string
}> = {
  wedding: {
    deliveryWeeks: '6-8',
    estimatedImages: '400-600',
    retainerAmount: '50%',
  },
  engagement: {
    deliveryWeeks: '2-3',
    estimatedImages: '40-60',
    retainerAmount: '50%',
  },
  portrait: {
    deliveryWeeks: '2',
    estimatedImages: '20-30',
    retainerAmount: '100%',
  },
  family: {
    deliveryWeeks: '2-3',
    estimatedImages: '30-50',
    retainerAmount: '100%',
  },
  newborn: {
    deliveryWeeks: '3',
    estimatedImages: '25-40',
    retainerAmount: '50%',
  },
  maternity: {
    deliveryWeeks: '2',
    estimatedImages: '20-30',
    retainerAmount: '100%',
  },
  corporate: {
    deliveryWeeks: '1',
    estimatedImages: '10-20 per person',
    retainerAmount: '50%',
  },
  event: {
    deliveryWeeks: '2-3',
    estimatedImages: '100-200',
    retainerAmount: '50%',
  },
  other: {
    deliveryWeeks: '2-3',
    estimatedImages: '50-100',
    retainerAmount: '50%',
  },
}
