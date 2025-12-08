import { describe, it, expect } from 'vitest'
import {
  extractMergeFields,
  hasMergeFields,
  replaceMergeFields,
  validateMergeData,
  buildMergeDataFromClient,
  formatCurrency,
} from '../merge-fields'
import type { ClientProfile } from '../types'

describe('Merge Fields', () => {
  describe('extractMergeFields', () => {
    it('extracts all merge fields from template', () => {
      const template = 'Hello {{client_name}}, your event is on {{event_date}}'
      const fields = extractMergeFields(template)
      expect(fields).toEqual(['client_name', 'event_date'])
    })

    it('returns empty array for template without merge fields', () => {
      const template = 'Hello, this is a plain template'
      const fields = extractMergeFields(template)
      expect(fields).toEqual([])
    })

    it('handles duplicate fields', () => {
      const template = '{{client_name}} and {{client_name}} again'
      const fields = extractMergeFields(template)
      expect(fields).toEqual(['client_name'])
    })

    it('is case insensitive', () => {
      const template = '{{CLIENT_NAME}} and {{client_name}}'
      const fields = extractMergeFields(template)
      expect(fields).toEqual(['client_name'])
    })
  })

  describe('hasMergeFields', () => {
    it('returns true when template has merge fields', () => {
      expect(hasMergeFields('Hello {{name}}')).toBe(true)
    })

    it('returns false when template has no merge fields', () => {
      expect(hasMergeFields('Hello world')).toBe(false)
    })
  })

  describe('replaceMergeFields', () => {
    it('replaces merge fields with values', () => {
      const template = 'Hello {{client_name}}, your package is {{package_name}}'
      const data = {
        client_name: 'John Doe',
        package_name: 'Premium',
      }
      const result = replaceMergeFields(template, data)
      expect(result).toBe('Hello John Doe, your package is Premium')
    })

    it('keeps original field when value is missing', () => {
      const template = 'Hello {{client_name}}'
      const result = replaceMergeFields(template, {})
      expect(result).toBe('Hello {{client_name}}')
    })

    it('highlights missing fields when option is set', () => {
      const template = 'Hello {{client_name}}'
      const result = replaceMergeFields(template, {}, { highlightMissing: true })
      expect(result).toContain('[MISSING]')
      expect(result).toContain('text-red-500')
    })

    it('uses custom placeholder for missing fields', () => {
      const template = 'Hello {{client_name}}'
      const result = replaceMergeFields(
        template,
        {},
        { highlightMissing: true, missingPlaceholder: '[TBD]' }
      )
      expect(result).toContain('[TBD]')
    })
  })

  describe('validateMergeData', () => {
    it('returns valid when all fields have values', () => {
      const template = 'Hello {{client_name}}'
      const data = { client_name: 'John' }
      const result = validateMergeData(template, data)
      expect(result.isValid).toBe(true)
      expect(result.missingFields).toEqual([])
    })

    it('returns invalid with missing fields', () => {
      const template = 'Hello {{client_name}}, event on {{event_date}}'
      const data = { client_name: 'John' }
      const result = validateMergeData(template, data)
      expect(result.isValid).toBe(false)
      expect(result.missingFields).toEqual(['event_date'])
    })

    it('treats empty string as missing', () => {
      const template = 'Hello {{client_name}}'
      const data = { client_name: '' }
      const result = validateMergeData(template, data)
      expect(result.isValid).toBe(false)
      expect(result.missingFields).toEqual(['client_name'])
    })
  })

  describe('buildMergeDataFromClient', () => {
    const mockClient: ClientProfile = {
      id: '123',
      photographerId: '456',
      firstName: 'Jane',
      lastName: 'Smith',
      email: 'jane@example.com',
      phone: '555-1234',
      partnerFirstName: 'John',
      partnerLastName: 'Smith',
      partnerEmail: null,
      partnerPhone: null,
      eventType: 'wedding',
      eventDate: '2025-06-15',
      eventLocation: 'New York, NY',
      eventVenue: 'Central Park',
      packageName: 'Full Day',
      packagePrice: 5000,
      packageHours: 10,
      packageDescription: null,
      retainerFee: null,
      balanceDueDate: null,
      notes: null,
      isArchived: false,
      createdAt: '2024-01-01',
      updatedAt: '2024-01-01',
    }

    it('builds merge data from client profile', () => {
      const data = buildMergeDataFromClient(mockClient)
      
      expect(data.client_name).toBe('Jane & John Smith')
      expect(data.client_first_name).toBe('Jane')
      expect(data.client_email).toBe('jane@example.com')
      expect(data.event_type).toBe('wedding')
      expect(data.event_type_display).toBe('Wedding')
      expect(data.event_location).toBe('New York, NY')
      expect(data.event_venue).toBe('Central Park')
      expect(data.package_name).toBe('Full Day')
      expect(data.package_hours).toBe('10')
    })

    it('calculates retainer and balance', () => {
      const data = buildMergeDataFromClient(mockClient)
      
      expect(data.package_price_formatted).toBe('$5,000')
      expect(data.retainer_amount).toBe('$2,500')
      expect(data.remaining_balance).toBe('$2,500')
    })

    it('formats event date', () => {
      const data = buildMergeDataFromClient(mockClient)
      expect(data.event_date_formatted).toContain('June')
      expect(data.event_date_formatted).toContain('2025')
    })

    it('handles client without partner', () => {
      const singleClient = { ...mockClient, partnerFirstName: null, partnerLastName: null }
      const data = buildMergeDataFromClient(singleClient)
      expect(data.client_name).toBe('Jane Smith')
      expect(data.partner_name).toBe('')
    })

    it('applies overrides', () => {
      const data = buildMergeDataFromClient(mockClient, undefined, {
        delivery_weeks: '2-3',
        estimated_images: '500-700',
      })
      expect(data.delivery_weeks).toBe('2-3')
      expect(data.estimated_images).toBe('500-700')
    })

    it('includes photographer info when provided', () => {
      const data = buildMergeDataFromClient(mockClient, {
        name: 'Photo Studio',
        email: 'studio@example.com',
        website: 'https://photostudio.com',
      })
      expect(data.photographer_name).toBe('Photo Studio')
      expect(data.photographer_email).toBe('studio@example.com')
      expect(data.photographer_website).toBe('https://photostudio.com')
    })
  })

  describe('formatCurrency', () => {
    it('formats whole numbers without decimals', () => {
      expect(formatCurrency(5000)).toBe('$5,000')
    })

    it('formats numbers with decimals', () => {
      expect(formatCurrency(5000.5)).toBe('$5,000.50')
    })

    it('handles zero', () => {
      expect(formatCurrency(0)).toBe('$0')
    })
  })
})
