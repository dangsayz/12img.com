# Client Portal + Auto-Contract Engine + Messaging System

## Complete Implementation Specification for 12IMG

---

## Table of Contents

1. [Architecture Overview](#1-architecture-overview)
2. [Task Execution Checklist](#2-task-execution-checklist)
3. [Database Schema](#3-database-schema)
4. [State Machines](#4-state-machines)
5. [API & Server Actions](#5-api--server-actions)
6. [RLS Policies](#6-rls-policies)
7. [Route Structure](#7-route-structure)
8. [UI Components](#8-ui-components)
9. [Integrations](#9-integrations)
10. [Performance & Security](#10-performance--security)
11. [Future Extensibility](#11-future-extensibility)

---

## 1. Architecture Overview

### System Boundaries (Hexagonal Architecture)

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           CLIENT PORTAL SUITE                            │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐       │
│  │  Contract Engine │  │  Messaging Core  │  │  Client Profiles │       │
│  │                  │  │                  │  │                  │       │
│  │  - Templates     │  │  - Threads       │  │  - CRUD          │       │
│  │  - Clauses       │  │  - Real-time     │  │  - Portal Access │       │
│  │  - Merge Fields  │  │  - Attachments   │  │  - Token Auth    │       │
│  │  - Signatures    │  │  - Read Receipts │  │                  │       │
│  │  - PDF Export    │  │  - Email Fallback│  │                  │       │
│  └────────┬─────────┘  └────────┬─────────┘  └────────┬─────────┘       │
│           │                     │                     │                  │
│           └─────────────────────┼─────────────────────┘                  │
│                                 │                                        │
│  ┌──────────────────────────────┴──────────────────────────────────────┐│
│  │                        DOMAIN SERVICES                               ││
│  │  - ContractService    - MessageService    - ClientService           ││
│  │  - SignatureService   - NotificationService                         ││
│  └──────────────────────────────────────────────────────────────────────┘│
│                                 │                                        │
│  ┌──────────────────────────────┴──────────────────────────────────────┐│
│  │                        INFRASTRUCTURE                                ││
│  │  - Supabase (Postgres + RLS + Realtime)                             ││
│  │  - Clerk (Auth)                                                      ││
│  │  - Resend (Email)                                                    ││
│  │  - Supabase Storage (Attachments + PDFs)                            ││
│  └──────────────────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────────────┘
```

### Domain Models

```typescript
// Core Entities
Client Profile → Contract → Signature
                    ↓
              Message Thread → Messages → Attachments
```

### Error Taxonomy

```typescript
type ErrorType = 'USER_ERROR' | 'SYSTEM_ERROR' | 'VALIDATION_ERROR'

interface ActionError {
  type: ErrorType
  code: string
  message: string
  field?: string
}
```

---

## 2. Task Execution Checklist

### Phase 1: Database Foundation
- [ ] **1.1** Create migration `031-client-profiles.sql`
- [ ] **1.2** Create migration `032-contracts.sql`
- [ ] **1.3** Create migration `033-messaging.sql`
- [ ] **1.4** Create migration `034-portal-tokens.sql`
- [ ] **1.5** Add all RLS policies

### Phase 2: Core Types & Services
- [ ] **2.1** Add types to `types/database.ts`
- [ ] **2.2** Create `lib/contracts/types.ts`
- [ ] **2.3** Create `lib/contracts/templates.ts`
- [ ] **2.4** Create `lib/contracts/clauses.ts`
- [ ] **2.5** Create `lib/contracts/merge-fields.ts`
- [ ] **2.6** Create `lib/contracts/pdf-generator.ts`

### Phase 3: Server Actions
- [ ] **3.1** Create `server/actions/client.actions.ts`
- [ ] **3.2** Create `server/actions/contract.actions.ts`
- [ ] **3.3** Create `server/actions/message.actions.ts`
- [ ] **3.4** Create `server/actions/portal.actions.ts`

### Phase 4: Photographer Dashboard Routes
- [ ] **4.1** Create `/dashboard/clients/page.tsx`
- [ ] **4.2** Create `/dashboard/clients/[id]/page.tsx`
- [ ] **4.3** Create `/dashboard/contracts/[id]/page.tsx`
- [ ] **4.4** Create `/dashboard/messages/[profileId]/page.tsx`

### Phase 5: Client Portal Routes
- [ ] **5.1** Create `/portal/[token]/page.tsx`
- [ ] **5.2** Create `/portal/[token]/contract/page.tsx`
- [ ] **5.3** Create `/portal/[token]/messages/page.tsx`
- [ ] **5.4** Update middleware for portal routes

### Phase 6: UI Components
- [ ] **6.1** Create `components/clients/ClientCard.tsx`
- [ ] **6.2** Create `components/clients/ClientForm.tsx`
- [ ] **6.3** Create `components/clients/ClientList.tsx`
- [ ] **6.4** Create `components/contracts/ContractBuilder.tsx`
- [ ] **6.5** Create `components/contracts/ClauseToggleList.tsx`
- [ ] **6.6** Create `components/contracts/LiveContractPreview.tsx`
- [ ] **6.7** Create `components/contracts/SignaturePad.tsx`
- [ ] **6.8** Create `components/contracts/ContractViewer.tsx`
- [ ] **6.9** Create `components/messaging/MessagingThread.tsx`
- [ ] **6.10** Create `components/messaging/MessageBubble.tsx`
- [ ] **6.11** Create `components/messaging/MessageInput.tsx`
- [ ] **6.12** Create `components/portal/PortalHeader.tsx`
- [ ] **6.13** Create `components/portal/PortalNav.tsx`

### Phase 7: Real-time & Integrations
- [ ] **7.1** Create `lib/realtime/messaging-channel.ts`
- [ ] **7.2** Create email templates for contracts
- [ ] **7.3** Create email templates for messages
- [ ] **7.4** Add Supabase storage bucket for attachments

### Phase 8: Testing
- [ ] **8.1** Create `__tests__/contracts.test.ts`
- [ ] **8.2** Create `__tests__/messaging.test.ts`
- [ ] **8.3** Create `__tests__/permissions.test.ts`

---

## 3. Database Schema

### Tables Overview

| Table | Purpose |
|-------|---------|
| `client_profiles` | Client information (name, email, event details) |
| `contract_templates` | Master contract templates |
| `contract_clauses` | Modular clause library |
| `contracts` | Generated contracts with merge data |
| `contract_signatures` | Signature records with timestamps |
| `messages` | Message content and metadata |
| `message_attachments` | File attachments for messages |
| `portal_tokens` | Secure client portal access tokens |

### State Enums

```sql
-- Contract lifecycle
CREATE TYPE contract_status AS ENUM ('draft', 'sent', 'viewed', 'signed', 'archived');

-- Message delivery
CREATE TYPE message_status AS ENUM ('sent', 'delivered', 'read');
```

---

## 4. State Machines

### Contract Lifecycle

```
     ┌─────────┐
     │  DRAFT  │ ← Only photographer can edit
     └────┬────┘
          │ send()
          ▼
     ┌─────────┐
     │  SENT   │ ← Client receives email
     └────┬────┘
          │ view()
          ▼
     ┌─────────┐
     │ VIEWED  │ ← Client opened contract
     └────┬────┘
          │ sign()
          ▼
     ┌─────────┐
     │ SIGNED  │ ← Immutable, legally binding
     └────┬────┘
          │ archive()
          ▼
     ┌──────────┐
     │ ARCHIVED │ ← Read-only historical
     └──────────┘
```

### Message Lifecycle

```
     ┌─────────┐
     │  SENT   │ ← Message created
     └────┬────┘
          │ (auto on receive)
          ▼
     ┌───────────┐
     │ DELIVERED │ ← Recipient online
     └────┬──────┘
          │ markRead()
          ▼
     ┌─────────┐
     │  READ   │ ← Confirmed viewed
     └─────────┘
```

---

## 5. API & Server Actions

### Client Actions
- `createClientProfile(data)` - Create new client
- `updateClientProfile(id, data)` - Update client info
- `deleteClientProfile(id)` - Soft delete client
- `getClientProfiles()` - List all clients
- `getClientProfile(id)` - Get single client

### Contract Actions
- `createContract(clientId, templateId, clauses)` - Generate contract
- `renderContract(contractId)` - Render with merge fields
- `sendContractToClient(contractId)` - Send via email
- `signContract(contractId, signatureData)` - Record signature
- `getContract(contractId)` - Get contract details
- `archiveContract(contractId)` - Archive signed contract
- `exportContractPdf(contractId)` - Generate PDF

### Message Actions
- `sendMessage(profileId, content, attachments?)` - Send message
- `fetchMessages(profileId, cursor?)` - Paginated messages
- `markMessageRead(messageId)` - Update read status
- `getUnreadCount(profileId)` - Unread message count

### Portal Actions
- `generatePortalToken(clientId)` - Create access token
- `validatePortalToken(token)` - Verify and get client
- `refreshPortalToken(token)` - Extend expiry

---

## 6. RLS Policies

### Core Principles
1. **Photographer isolation** - All rows tied to `photographer_id`
2. **Client access via tokens** - Portal uses signed tokens, not auth
3. **Immutable signatures** - No updates after signing
4. **Audit trail** - All changes logged

### Policy Matrix

| Table | SELECT | INSERT | UPDATE | DELETE |
|-------|--------|--------|--------|--------|
| client_profiles | owner | owner | owner | owner |
| contracts | owner/client | owner | owner (draft only) | owner (draft only) |
| contract_signatures | owner/client | client (once) | never | never |
| messages | owner/client | owner/client | sender (status only) | never |
| portal_tokens | owner | owner | owner | owner |

---

## 7. Route Structure

### Photographer Routes (Protected)
```
/dashboard/clients              → Client list
/dashboard/clients/new          → Create client
/dashboard/clients/[id]         → Client detail + contract + messages
/dashboard/contracts/[id]       → Contract builder/viewer
/dashboard/messages/[profileId] → Full messaging view
```

### Client Portal Routes (Token-based)
```
/portal/[token]                 → Portal dashboard
/portal/[token]/contract        → View/sign contract
/portal/[token]/messages        → Messaging thread
```

---

## 8. UI Components

### Design System Tokens
```css
/* 12IMG Design System */
--radius: 1rem;           /* rounded-2xl */
--shadow: 0 4px 6px -1px rgb(0 0 0 / 0.05);
--border: 1px solid rgb(245 245 244);  /* stone-100 */
--bg-primary: white;
--bg-secondary: rgb(250 250 249);      /* stone-50 */
--text-primary: rgb(28 25 23);         /* stone-900 */
--text-secondary: rgb(120 113 108);    /* stone-500 */
--accent: rgb(28 25 23);               /* stone-900 */
```

### Component Hierarchy
```
ClientPortal
├── PortalHeader
├── PortalNav
└── PortalContent
    ├── ContractViewer
    │   ├── ContractHeader
    │   ├── ContractBody
    │   ├── ClauseList
    │   └── SignaturePad
    └── MessagingThread
        ├── MessageList
        │   └── MessageBubble
        ├── TypingIndicator
        └── MessageInput
```

---

## 9. Integrations

### Email (Resend)
- Contract sent notification
- Contract signed confirmation
- New message notification (fallback)
- Portal access link

### Storage (Supabase)
- `contract-pdfs/` - Generated PDF contracts
- `message-attachments/` - Message file uploads
- `signatures/` - Signature image data

### Realtime (Supabase Channels)
- `messages:{profileId}` - New messages
- `typing:{profileId}` - Typing indicators
- `contract:{contractId}` - Status updates

---

## 10. Performance & Security

### Performance Budgets
| Metric | Target |
|--------|--------|
| TTI | < 1.5s |
| Interactions | < 100ms |
| Contract render | < 50ms |
| Message roundtrip | < 150ms |

### Security Measures
- Portal tokens: HMAC-SHA256 signed, 7-day expiry
- Signatures: Stored as immutable records with timestamp
- XSS prevention: DOMPurify for contract HTML
- Input validation: Zod schemas on all actions
- Rate limiting: 10 messages/minute per client

---

## 11. Future Extensibility

### Hooks for Future Features
- `invoices` table FK ready on `client_profiles`
- `gallery_id` FK ready on `contracts`
- `payment_status` enum on contracts
- Webhook events for external integrations
- Multi-language contract templates

---

## Implementation Order

Execute in this exact order to maintain dependencies:

1. **Database migrations** (all 4 files)
2. **Type definitions**
3. **Contract engine** (templates, clauses, merge)
4. **Server actions** (client → contract → message → portal)
5. **Photographer routes**
6. **UI components**
7. **Client portal routes**
8. **Real-time integration**
9. **Email templates**
10. **Tests**

---

*Document Version: 1.0*
*Last Updated: 2024-12-08*
