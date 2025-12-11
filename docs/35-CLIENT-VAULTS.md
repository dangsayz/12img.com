# Client Photo Vaults

## Overview

Client Photo Vaults is a revenue add-on that allows photographer's clients to pay for long-term storage of their photos after gallery expiry. This creates passive recurring revenue for 12IMG.

## Pricing

| Plan | Storage | Monthly | Annual | Your Cost | Profit Margin |
|------|---------|---------|--------|-----------|---------------|
| **Vault** | 50GB | $4/mo | $39/yr | ~$1/mo | ~75% |
| **Vault+** | 200GB | $8/mo | $79/yr | ~$4/mo | ~50% |

## User Flow

### For Photographers

1. **Invite Client**: From gallery settings, photographer creates vault invitation
2. **Share Link**: Copy/send the unique purchase link to client
3. **Track**: View all client vaults in `/dashboard/vaults`

### For Clients

1. **Receive Invitation**: Get purchase link from photographer
2. **Choose Plan**: Select Vault ($39/yr) or Vault+ ($79/yr)
3. **Pay via Stripe**: Secure checkout
4. **Access Photos**: Use unique access link to view/download anytime

## Technical Architecture

### Database Tables

- `vault_plans` - Available vault subscription plans
- `client_vaults` - Active vault subscriptions
- `vault_images` - Images stored in vaults
- `vault_access_tokens` - Secure client access tokens
- `vault_invitations` - Pending/completed invitations

### Storage

- Dedicated `client-vaults` Supabase storage bucket
- Images are **copied** from gallery (not moved) to ensure originals remain accessible
- Automatic storage tracking via database triggers

### Key Files

```
lib/config/vault-pricing.ts        # Pricing configuration
server/actions/vault.actions.ts    # All vault server actions
app/api/stripe/vault-checkout/     # Stripe checkout for vaults
app/vault/purchase/page.tsx        # Client purchase page
app/vault/view/page.tsx            # Client vault viewer
app/vault/success/page.tsx         # Post-purchase success
app/dashboard/vaults/page.tsx      # Photographer dashboard
components/vault/                   # UI components
  - VaultExpiryBanner.tsx          # Gallery expiry warning
  - VaultInviteForm.tsx            # Invitation form
  - VaultsDashboardContent.tsx     # Dashboard content
```

## Setup Instructions

### 1. Run Database Migration

```bash
# Apply the migration
psql $DATABASE_URL < database/migrations/060-client-vaults.sql
```

### 2. Create Stripe Products

Create two products in Stripe Dashboard:

**Vault ($39/year)**
- Product name: "Photo Vault"
- Monthly price: $4/month (price ID → `vault_plans.stripe_monthly_price_id`)
- Annual price: $39/year (price ID → `vault_plans.stripe_annual_price_id`)

**Vault+ ($79/year)**
- Product name: "Photo Vault+"
- Monthly price: $8/month
- Annual price: $79/year

Update `vault_plans` table with Stripe price IDs:

```sql
UPDATE vault_plans SET 
  stripe_monthly_price_id = 'price_xxx',
  stripe_annual_price_id = 'price_xxx'
WHERE id = 'vault';

UPDATE vault_plans SET 
  stripe_monthly_price_id = 'price_xxx',
  stripe_annual_price_id = 'price_xxx'
WHERE id = 'vault_plus';
```

### 3. Webhook Already Configured

The existing Stripe webhook at `/api/stripe/webhook` now handles vault subscriptions automatically via the `type: 'vault_subscription'` metadata.

## Server Actions

### For Photographers (authenticated)

```typescript
// Create invitation
createVaultInvitation(galleryId, clientEmail, clientName?)

// Get invitations for a gallery
getGalleryVaultInvitations(galleryId)

// Resend invitation
resendVaultInvitation(invitationId)

// Cancel invitation
cancelVaultInvitation(invitationId)

// Get all vaults
getPhotographerVaults()

// Get vault details
getVaultDetails(vaultId)
```

### For Clients (token-based, no auth)

```typescript
// Validate invitation before purchase
validateVaultInvitation(token)

// Access vault
getVaultByAccessToken(token)

// Get image URL
getVaultImageUrl(token, imageId)
```

## Components

### VaultExpiryBanner

Shows on public gallery when approaching expiry (within 14 days). Promotes vault storage.

```tsx
<VaultExpiryBanner
  galleryTitle="Wedding Photos"
  expiresAt={new Date('2024-01-15')}
  imageCount={500}
  vaultPurchaseUrl="/vault/purchase?token=xxx"
/>
```

### VaultInviteForm

For photographers to create vault invitations.

```tsx
<VaultInviteForm
  galleryId="gallery-123"
  galleryTitle="Wedding Photos"
  clientEmail="client@email.com"
  clientName="Sarah & John"
  onSuccess={(url) => console.log('Purchase URL:', url)}
/>
```

## Revenue Projections

| Scenario | Clients/mo | Conversion | Annual Revenue |
|----------|------------|------------|----------------|
| Conservative | 50 | 20% | **$3,900** |
| Moderate | 100 | 25% | **$9,750** |
| Growth | 200 | 30% | **$23,400** |

## Future Enhancements

- [ ] Automated expiry reminder emails
- [ ] Client vault mobile app
- [ ] Family sharing within vault
- [ ] Print ordering integration
- [ ] Vault gifting (photographer pays for client)
