/**
 * Contract Templates
 * 
 * Premium contract template with world-class, magazine-quality formatting.
 * Uses merge fields for dynamic content.
 */

// ============================================
// DEFAULT TEMPLATE - PREMIUM EDITION
// ============================================

export const DEFAULT_CONTRACT_HEADER = `
<div class="contract-header">
  <!-- Elegant Masthead -->
  <div class="masthead">
    <div class="masthead-line"></div>
    <h1 class="masthead-title">Photography Services Agreement</h1>
    <p class="masthead-date">{{contract_date}}</p>
    <div class="masthead-line"></div>
  </div>
  
  <!-- Parties Section -->
  <div class="parties-section">
    <div class="party-card">
      <div class="party-label">The Photographer</div>
      <div class="party-name">{{photographer_name}}</div>
      <div class="party-details">
        <span class="party-detail">{{photographer_email}}</span>
        <span class="party-detail">{{photographer_phone}}</span>
      </div>
    </div>
    <div class="party-divider">
      <span class="ampersand">&</span>
    </div>
    <div class="party-card">
      <div class="party-label">The Client</div>
      <div class="party-name">{{client_name}}</div>
      <div class="party-details">
        <span class="party-detail">{{client_email}}</span>
        <span class="party-detail">{{client_phone}}</span>
      </div>
    </div>
  </div>
  
  <!-- Event Details Card -->
  <div class="event-card">
    <div class="event-header">
      <span class="event-type-badge">{{event_type_display}}</span>
    </div>
    <div class="event-grid">
      <div class="event-item event-item-featured">
        <span class="event-label">Date</span>
        <span class="event-value">{{event_date_formatted}}</span>
      </div>
      <div class="event-item">
        <span class="event-label">Location</span>
        <span class="event-value">{{event_location}}</span>
      </div>
      <div class="event-item">
        <span class="event-label">Venue</span>
        <span class="event-value">{{event_venue}}</span>
      </div>
    </div>
  </div>
  
  <!-- Investment Summary -->
  <div class="investment-card">
    <div class="investment-header">
      <span class="investment-label">Investment Summary</span>
    </div>
    <div class="investment-content">
      <div class="investment-package">
        <span class="package-name">{{package_name}}</span>
        <span class="package-hours">{{package_hours}} hours of coverage</span>
      </div>
      <div class="investment-amount">
        <span class="amount-value">{{package_price_formatted}}</span>
      </div>
    </div>
    <div class="investment-footer">
      <div class="payment-item">
        <span class="payment-label">Retainer Due</span>
        <span class="payment-value">{{retainer_amount}}</span>
      </div>
      <div class="payment-item">
        <span class="payment-label">Balance Due</span>
        <span class="payment-value">{{remaining_balance}}</span>
      </div>
    </div>
  </div>
  
  <!-- Terms Header -->
  <div class="terms-header">
    <div class="terms-line"></div>
    <span class="terms-title">Terms & Conditions</span>
    <div class="terms-line"></div>
  </div>
</div>
`

export const DEFAULT_CONTRACT_FOOTER = `
<div class="contract-footer">
  <!-- Agreement Section -->
  <div class="agreement-section">
    <div class="agreement-icon">
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
        <path d="M9 12l2 2 4-4"/>
        <circle cx="12" cy="12" r="10"/>
      </svg>
    </div>
    <div class="agreement-content">
      <h3 class="agreement-title">Mutual Agreement</h3>
      <p class="agreement-text">
        By signing below, both parties acknowledge that they have read, understood, and agree to 
        all terms and conditions set forth in this Photography Services Agreement. This document 
        constitutes the entire agreement between the Photographer and Client.
      </p>
    </div>
  </div>
  
  <!-- Signature Section -->
  <div class="signature-section">
    <div class="signature-card signature-photographer">
      <div class="signature-header">
        <span class="signature-label">Photographer</span>
        <span class="signature-status signed">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
            <path d="M20 6L9 17l-5-5"/>
          </svg>
          Signed
        </span>
      </div>
      <div class="signature-content">
        <div class="signature-line">
          <span class="signature-name elegant">{{photographer_name}}</span>
        </div>
        <div class="signature-underline"></div>
      </div>
      <div class="signature-date">{{contract_date}}</div>
    </div>
    
    <div class="signature-card signature-client {{client_signature_class}}">
      <div class="signature-header">
        <span class="signature-label">Client</span>
        <span class="signature-status {{client_status_class}}">{{client_status_text}}</span>
      </div>
      <div class="signature-content">
        {{client_signature_content}}
      </div>
      <div class="signature-date">{{client_signed_date}}</div>
    </div>
  </div>
  
  <!-- Footer Note -->
  <div class="footer-note">
    <p>This contract is legally binding upon execution by both parties.</p>
  </div>
</div>
`

// ============================================
// TEMPLATE STYLES
// ============================================

export const CONTRACT_STYLES = `
<style>
  /* ============================================
     PREMIUM CONTRACT STYLES
     World-class, magazine-quality formatting
     ============================================ */
  
  @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;1,400&family=Inter:wght@400;500;600&family=Dancing+Script:wght@400;500;600;700&family=Great+Vibes&display=swap');
  
  :root {
    --contract-primary: #1c1917;
    --contract-secondary: #57534e;
    --contract-muted: #a8a29e;
    --contract-border: #e7e5e4;
    --contract-bg: #fafaf9;
    --contract-accent: #292524;
    --contract-success: #059669;
    --contract-warning: #d97706;
  }
  
  .contract-document {
    font-family: 'Inter', system-ui, -apple-system, sans-serif;
    line-height: 1.7;
    color: var(--contract-primary);
    max-width: 800px;
    margin: 0 auto;
    padding: 3rem 2rem;
    background: white;
  }
  
  /* ============================================
     MASTHEAD - Elegant Header
     ============================================ */
  
  .masthead {
    text-align: center;
    margin-bottom: 3rem;
  }
  
  .masthead-line {
    height: 1px;
    background: linear-gradient(90deg, transparent, var(--contract-border), transparent);
    margin: 1rem 0;
  }
  
  .masthead-title {
    font-family: 'Cormorant Garamond', Georgia, serif;
    font-size: 2rem;
    font-weight: 500;
    letter-spacing: 0.02em;
    color: var(--contract-primary);
    margin: 1.5rem 0 0.5rem;
  }
  
  .masthead-date {
    font-size: 0.8125rem;
    color: var(--contract-muted);
    letter-spacing: 0.05em;
    text-transform: uppercase;
  }
  
  /* ============================================
     PARTIES SECTION
     ============================================ */
  
  .parties-section {
    display: flex;
    align-items: stretch;
    gap: 1rem;
    margin-bottom: 2.5rem;
  }
  
  .party-card {
    flex: 1;
    padding: 1.5rem;
    background: var(--contract-bg);
    border-radius: 12px;
    text-align: center;
  }
  
  .party-label {
    font-size: 0.6875rem;
    text-transform: uppercase;
    letter-spacing: 0.12em;
    color: var(--contract-muted);
    margin-bottom: 0.75rem;
  }
  
  .party-name {
    font-family: 'Cormorant Garamond', Georgia, serif;
    font-size: 1.375rem;
    font-weight: 600;
    color: var(--contract-primary);
    margin-bottom: 0.5rem;
  }
  
  .party-details {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
  }
  
  .party-detail {
    font-size: 0.8125rem;
    color: var(--contract-secondary);
  }
  
  .party-detail:empty {
    display: none;
  }
  
  .party-divider {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 0 0.5rem;
  }
  
  .ampersand {
    font-family: 'Cormorant Garamond', Georgia, serif;
    font-size: 2rem;
    font-style: italic;
    color: var(--contract-muted);
  }
  
  /* ============================================
     EVENT CARD
     ============================================ */
  
  .event-card {
    border: 1px solid var(--contract-border);
    border-radius: 12px;
    overflow: hidden;
    margin-bottom: 2rem;
  }
  
  .event-header {
    padding: 1rem 1.5rem;
    background: var(--contract-bg);
    border-bottom: 1px solid var(--contract-border);
  }
  
  .event-type-badge {
    display: inline-block;
    padding: 0.375rem 1rem;
    background: var(--contract-accent);
    color: white;
    font-size: 0.75rem;
    font-weight: 500;
    text-transform: uppercase;
    letter-spacing: 0.08em;
    border-radius: 100px;
  }
  
  .event-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 1px;
    background: var(--contract-border);
  }
  
  .event-item {
    padding: 1.25rem 1.5rem;
    background: white;
    text-align: center;
  }
  
  .event-item-featured {
    background: linear-gradient(135deg, #fafaf9 0%, white 100%);
  }
  
  .event-label {
    display: block;
    font-size: 0.6875rem;
    text-transform: uppercase;
    letter-spacing: 0.1em;
    color: var(--contract-muted);
    margin-bottom: 0.5rem;
  }
  
  .event-value {
    display: block;
    font-size: 0.9375rem;
    font-weight: 500;
    color: var(--contract-primary);
  }
  
  .event-value:empty::after {
    content: '—';
    color: var(--contract-muted);
  }
  
  /* ============================================
     INVESTMENT CARD
     ============================================ */
  
  .investment-card {
    background: var(--contract-accent);
    border-radius: 12px;
    overflow: hidden;
    margin-bottom: 2.5rem;
    color: white;
  }
  
  .investment-header {
    padding: 1rem 1.5rem;
    border-bottom: 1px solid rgba(255,255,255,0.1);
  }
  
  .investment-label {
    font-size: 0.6875rem;
    text-transform: uppercase;
    letter-spacing: 0.12em;
    color: rgba(255,255,255,0.6);
  }
  
  .investment-content {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1.5rem;
  }
  
  .investment-package {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
  }
  
  .package-name {
    font-family: 'Cormorant Garamond', Georgia, serif;
    font-size: 1.25rem;
    font-weight: 500;
  }
  
  .package-hours {
    font-size: 0.8125rem;
    color: rgba(255,255,255,0.6);
  }
  
  .package-hours:empty {
    display: none;
  }
  
  .investment-amount {
    text-align: right;
  }
  
  .amount-value {
    font-family: 'Cormorant Garamond', Georgia, serif;
    font-size: 2rem;
    font-weight: 400;
    letter-spacing: -0.02em;
  }
  
  .investment-footer {
    display: flex;
    border-top: 1px solid rgba(255,255,255,0.1);
  }
  
  .payment-item {
    flex: 1;
    padding: 1rem 1.5rem;
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-size: 0.875rem;
  }
  
  .payment-item:first-child {
    border-right: 1px solid rgba(255,255,255,0.1);
  }
  
  .payment-label {
    color: rgba(255,255,255,0.6);
  }
  
  .payment-value {
    font-weight: 500;
  }
  
  /* ============================================
     TERMS HEADER
     ============================================ */
  
  .terms-header {
    display: flex;
    align-items: center;
    gap: 1.5rem;
    margin-bottom: 2rem;
  }
  
  .terms-line {
    flex: 1;
    height: 1px;
    background: var(--contract-border);
  }
  
  .terms-title {
    font-size: 0.75rem;
    text-transform: uppercase;
    letter-spacing: 0.15em;
    color: var(--contract-muted);
    white-space: nowrap;
  }
  
  /* ============================================
     CONTRACT CLAUSES
     ============================================ */
  
  .contract-clauses {
    margin-bottom: 3rem;
  }
  
  .contract-clause {
    margin-bottom: 2rem;
    padding-bottom: 2rem;
    border-bottom: 1px solid var(--contract-border);
  }
  
  .contract-clause:last-child {
    border-bottom: none;
    margin-bottom: 0;
    padding-bottom: 0;
  }
  
  .contract-clause-title {
    font-size: 0.9375rem;
    font-weight: 600;
    color: var(--contract-primary);
    margin-bottom: 0.75rem;
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }
  
  .contract-clause-title::before {
    content: '';
    width: 4px;
    height: 4px;
    background: var(--contract-accent);
    border-radius: 50%;
  }
  
  .contract-clause-content {
    font-size: 0.875rem;
    line-height: 1.8;
    color: var(--contract-secondary);
  }
  
  .contract-clause-content p {
    margin-bottom: 0.75rem;
  }
  
  .contract-clause-content p:last-child {
    margin-bottom: 0;
  }
  
  /* ============================================
     AGREEMENT SECTION
     ============================================ */
  
  .agreement-section {
    display: flex;
    gap: 1.25rem;
    padding: 1.5rem;
    background: linear-gradient(135deg, #f0fdf4 0%, #ecfdf5 100%);
    border: 1px solid #bbf7d0;
    border-radius: 12px;
    margin-bottom: 2rem;
  }
  
  .agreement-icon {
    flex-shrink: 0;
    width: 40px;
    height: 40px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: white;
    border-radius: 10px;
    color: var(--contract-success);
    box-shadow: 0 1px 3px rgba(0,0,0,0.05);
  }
  
  .agreement-content {
    flex: 1;
  }
  
  .agreement-title {
    font-size: 0.9375rem;
    font-weight: 600;
    color: #166534;
    margin-bottom: 0.5rem;
  }
  
  .agreement-text {
    font-size: 0.8125rem;
    line-height: 1.6;
    color: #15803d;
  }
  
  /* ============================================
     SIGNATURE SECTION
     ============================================ */
  
  .signature-section {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 1.5rem;
    margin-bottom: 2rem;
  }
  
  .signature-card {
    padding: 1.75rem;
    border-radius: 16px;
    border: 1px solid var(--contract-border);
    position: relative;
    overflow: hidden;
  }
  
  .signature-photographer {
    background: linear-gradient(135deg, var(--contract-bg) 0%, #f5f5f4 100%);
    border-color: #d6d3d1;
  }
  
  .signature-client {
    background: white;
    border: 2px dashed #d6d3d1;
  }
  
  .signature-client.signed {
    background: linear-gradient(135deg, #f0fdf4 0%, #ecfdf5 100%);
    border: 1px solid #86efac;
    border-style: solid;
  }
  
  .signature-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1.25rem;
  }
  
  .signature-label {
    font-size: 0.6875rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.12em;
    color: var(--contract-muted);
  }
  
  .signature-status {
    display: inline-flex;
    align-items: center;
    gap: 0.375rem;
    font-size: 0.6875rem;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    padding: 0.375rem 0.75rem;
    border-radius: 100px;
  }
  
  .signature-status.signed {
    background: #dcfce7;
    color: #166534;
  }
  
  .signature-status.pending {
    background: #fef3c7;
    color: #92400e;
  }
  
  .signature-status.awaiting {
    background: #fef3c7;
    color: #92400e;
  }
  
  .signature-content {
    min-height: 70px;
    display: flex;
    flex-direction: column;
    justify-content: flex-end;
    margin-bottom: 0.75rem;
  }
  
  .signature-line {
    display: flex;
    align-items: flex-end;
    min-height: 50px;
  }
  
  .signature-underline {
    height: 2px;
    background: var(--contract-primary);
    margin-top: 0.25rem;
  }
  
  .signature-pending .signature-underline {
    background: transparent;
    border-bottom: 2px dashed var(--contract-muted);
    height: 0;
  }
  
  /* Elegant handwriting signature font */
  .signature-name.elegant {
    font-family: 'Great Vibes', 'Dancing Script', cursive;
    font-size: 2rem;
    font-weight: 400;
    color: var(--contract-primary);
    line-height: 1.2;
    letter-spacing: 0.02em;
  }
  
  /* Client signature when signed */
  .signature-client.signed .signature-name.elegant {
    color: #166534;
  }
  
  /* Signature image display */
  .signature-image {
    max-height: 50px;
    max-width: 100%;
    object-fit: contain;
  }
  
  .signature-placeholder {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    min-height: 50px;
    color: var(--contract-muted);
  }
  
  .signature-placeholder-icon {
    width: 24px;
    height: 24px;
    opacity: 0.5;
  }
  
  .signature-placeholder-text {
    font-size: 0.8125rem;
    font-style: italic;
  }
  
  .signature-cta {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    margin-top: 0.75rem;
    padding: 0.625rem 1rem;
    background: var(--contract-accent);
    color: white;
    font-size: 0.8125rem;
    font-weight: 500;
    border-radius: 8px;
    text-decoration: none;
    transition: all 0.2s ease;
  }
  
  .signature-cta:hover {
    background: #1c1917;
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
  }
  
  .signature-date {
    font-size: 0.8125rem;
    color: var(--contract-muted);
    margin-top: 0.5rem;
  }
  
  .signature-client.signed .signature-date {
    color: #166534;
  }
  
  /* ============================================
     FOOTER NOTE
     ============================================ */
  
  .footer-note {
    text-align: center;
    padding-top: 1.5rem;
    border-top: 1px solid var(--contract-border);
  }
  
  .footer-note p {
    font-size: 0.75rem;
    color: var(--contract-muted);
    letter-spacing: 0.02em;
  }
  
  /* ============================================
     PRINT STYLES
     ============================================ */
  
  @media print {
    .contract-document {
      padding: 0;
      max-width: none;
    }
    
    .no-print {
      display: none !important;
    }
    
    .investment-card {
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
  }
  
  /* ============================================
     RESPONSIVE
     ============================================ */
  
  @media (max-width: 640px) {
    .contract-document {
      padding: 1.5rem 1rem;
    }
    
    .parties-section {
      flex-direction: column;
    }
    
    .party-divider {
      padding: 0.5rem 0;
    }
    
    .ampersand {
      font-size: 1.5rem;
    }
    
    .event-grid {
      grid-template-columns: 1fr;
    }
    
    .investment-content {
      flex-direction: column;
      gap: 1rem;
      text-align: center;
    }
    
    .investment-footer {
      flex-direction: column;
    }
    
    .payment-item:first-child {
      border-right: none;
      border-bottom: 1px solid rgba(255,255,255,0.1);
    }
    
    .signature-section {
      grid-template-columns: 1fr;
    }
  }
</style>
`

// ============================================
// TEMPLATE BUILDER
// ============================================

export interface TemplateSection {
  id: string
  type: 'header' | 'clause' | 'footer' | 'custom'
  content: string
  sortOrder: number
}

/**
 * Build a complete contract document from sections
 */
export function buildContractDocument(
  sections: TemplateSection[],
  options: {
    includeStyles?: boolean
    wrapInDocument?: boolean
  } = {}
): string {
  const { includeStyles = true, wrapInDocument = true } = options
  
  const sortedSections = [...sections].sort((a, b) => a.sortOrder - b.sortOrder)
  const content = sortedSections.map(s => s.content).join('\n')
  
  if (!wrapInDocument) {
    return content
  }
  
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Photography Services Agreement</title>
      ${includeStyles ? CONTRACT_STYLES : ''}
    </head>
    <body>
      <div class="contract-document">
        ${content}
      </div>
    </body>
    </html>
  `.trim()
}

/**
 * Wrap clause content in styled container
 */
export function wrapClause(title: string, content: string): string {
  return `
    <div class="contract-clause">
      <h4 class="contract-clause-title">${title}</h4>
      <div class="contract-clause-content">${content}</div>
    </div>
  `.trim()
}

// ============================================
// TEMPLATE PRESETS
// ============================================

export const TEMPLATE_PRESETS = {
  minimal: {
    name: 'Minimal',
    description: 'Clean and simple contract layout',
    headerContent: DEFAULT_CONTRACT_HEADER,
    footerContent: DEFAULT_CONTRACT_FOOTER,
  },
  detailed: {
    name: 'Detailed',
    description: 'Comprehensive contract with all sections',
    headerContent: DEFAULT_CONTRACT_HEADER,
    footerContent: DEFAULT_CONTRACT_FOOTER,
  },
} as const

export type TemplatePreset = keyof typeof TEMPLATE_PRESETS
