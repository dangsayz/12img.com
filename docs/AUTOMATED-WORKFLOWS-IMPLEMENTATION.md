# Automated Workflows Implementation Spec

> **Goal:** Time-based email automation triggered by event date proximity  
> **Target User:** Photographers who shoot 30+ events/year and need consistent client communication  
> **Competitive Edge:** Pixieset lacks this; 17hats, Honeybook, Dubsado have it

---

## Table of Contents

1. [Database Schema](#1-database-schema)
2. [Type Definitions](#2-type-definitions)
3. [Server Actions](#3-server-actions)
4. [Cron Job](#4-cron-job)
5. [UI Components](#5-ui-components)
6. [Landing Page Integration](#6-landing-page-integration)
7. [Plan Limits](#7-plan-limits)
8. [File Structure](#8-file-structure)
9. [Implementation Order](#9-implementation-order)

---

## 1. Database Schema

**Migration:** `database/migrations/051-automated-workflows.sql`

### Tables

#### `workflow_templates`
Reusable email templates (system + user-created)

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| user_id | UUID | Owner (NULL = system template) |
| name | TEXT | "What to Wear Guide" |
| description | TEXT | Template purpose |
| category | TEXT | 'pre_event' \| 'post_event' \| 'custom' |
| subject | TEXT | Email subject with merge fields |
| body_html | TEXT | Rich HTML body |
| body_text | TEXT | Plain text fallback |
| default_days_offset | INTEGER | -14 = 14 days before event |
| is_system | BOOLEAN | System vs user template |
| created_at | TIMESTAMPTZ | |
| updated_at | TIMESTAMPTZ | |

#### `scheduled_workflows`
Individual scheduled emails per client

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| user_id | UUID | Photographer |
| client_id | UUID | FK to client_profiles |
| template_id | UUID | FK to workflow_templates |
| days_offset | INTEGER | Days relative to event |
| scheduled_for | TIMESTAMPTZ | Computed send time |
| status | TEXT | 'pending' \| 'sent' \| 'skipped' \| 'failed' \| 'cancelled' |
| status_reason | TEXT | Why skipped/failed |
| email_subject | TEXT | Frozen subject at schedule time |
| email_body_html | TEXT | Frozen body at schedule time |
| email_body_text | TEXT | Frozen plain text |
| sent_at | TIMESTAMPTZ | When actually sent |
| email_log_id | UUID | FK to email_logs for tracking |
| created_at | TIMESTAMPTZ | |
| updated_at | TIMESTAMPTZ | |

#### `workflow_execution_log`
Audit trail for debugging

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| scheduled_workflow_id | UUID | FK to scheduled_workflows |
| action | TEXT | 'scheduled' \| 'sent' \| 'skipped' \| 'failed' \| 'cancelled' |
| details | JSONB | Error messages, metadata |
| executed_at | TIMESTAMPTZ | |

### Helper Functions

- `calculate_workflow_schedule(event_date, days_offset)` → TIMESTAMPTZ
- `get_active_workflow_count(user_id)` → INTEGER
- `get_custom_template_count(user_id)` → INTEGER

### Triggers

- `trigger_update_workflow_schedules` - Auto-updates scheduled_for when client event_date changes

### System Templates (Seeded)

1. **What to Wear Guide** (-14 days) - Style prep
2. **Planning Questionnaire** (-30 days) - Gather preferences  
3. **Timeline Reminder** (-7 days) - Final logistics
4. **Final Check-in** (-2 days) - Confirm details
5. **Post-Event Thank You** (+1 day) - Relationship building

---

## 2. Type Definitions

**File:** `lib/workflows/types.ts`

```typescript
// Status types
export type ScheduledWorkflowStatus = 'pending' | 'sent' | 'skipped' | 'failed' | 'cancelled';
export type WorkflowTemplateCategory = 'pre_event' | 'post_event' | 'custom';

// Domain models
export interface WorkflowTemplate {
  id: string;
  userId: string | null;
  name: string;
  description: string | null;
  category: WorkflowTemplateCategory;
  subject: string;
  bodyHtml: string;
  bodyText: string | null;
  defaultDaysOffset: number;
  isSystem: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ScheduledWorkflow {
  id: string;
  userId: string;
  clientId: string;
  templateId: string | null;
  daysOffset: number;
  scheduledFor: string;
  status: ScheduledWorkflowStatus;
  statusReason: string | null;
  emailSubject: string;
  emailBodyHtml: string;
  emailBodyText: string | null;
  sentAt: string | null;
  emailLogId: string | null;
  createdAt: string;
  updatedAt: string;
}

// Merge fields
export const WORKFLOW_MERGE_FIELDS = [
  '{{client_name}}', '{{client_first_name}}', '{{client_email}}',
  '{{event_type}}', '{{event_date}}', '{{event_date_formatted}}',
  '{{event_location}}', '{{days_until_event}}', '{{days_since_event}}',
  '{{photographer_name}}', '{{photographer_email}}', '{{photographer_phone}}',
  '{{photographer_business}}', '{{delivery_window}}', '{{package_name}}',
] as const;

// Plan limits
export const WORKFLOW_PLAN_LIMITS = {
  free: { activeWorkflows: 3, customTemplates: 0 },
  essential: { activeWorkflows: 10, customTemplates: 3 },
  pro: { activeWorkflows: Infinity, customTemplates: Infinity },
  studio: { activeWorkflows: Infinity, customTemplates: Infinity },
  elite: { activeWorkflows: Infinity, customTemplates: Infinity },
} as const;
```

---

## 3. Server Actions

**File:** `server/actions/workflow.actions.ts`

### Template Actions
- `getWorkflowTemplates()` - Get system + user templates
- `createWorkflowTemplate(data)` - Create custom template (checks plan limits)
- `updateWorkflowTemplate(id, data)` - Update own template
- `deleteWorkflowTemplate(id)` - Delete own template

### Scheduling Actions
- `getClientWorkflows(clientId)` - Get workflows for a client
- `getAllPendingWorkflows()` - Dashboard overview
- `scheduleWorkflow(clientId, formData)` - Schedule new workflow
- `cancelWorkflow(workflowId)` - Cancel pending workflow
- `previewWorkflow(clientId, formData)` - Preview with merge fields filled

### Utility Actions
- `getWorkflowLimits()` - Get current usage vs plan limits

---

## 4. Cron Job

**File:** `app/api/cron/send-workflows/route.ts`

**Schedule:** Every hour at minute 0 (`0 * * * *`)

### Logic Flow

1. Fetch pending workflows where `scheduled_for <= now`
2. For each workflow:
   - Validate client has email
   - Check if event date passed (skip pre-event if so)
   - Create email_log entry
   - Send via Resend
   - Update status to 'sent' or 'failed'
   - Log execution

### Skip Conditions
- Client has no email → status: 'skipped'
- Event date passed (for pre-event) → status: 'skipped'
- Send fails → status: 'failed' with error

---

## 5. UI Components

**Directory:** `components/workflows/`

### Components

| Component | Purpose |
|-----------|---------|
| `WorkflowList.tsx` | Display scheduled workflows with status |
| `WorkflowScheduler.tsx` | Modal to add new automation |
| `TemplateSelector.tsx` | Choose from available templates |
| `TemplatePreview.tsx` | Preview email with merge fields |
| `WorkflowTimeline.tsx` | Visual timeline of all automations |
| `TemplateEditor.tsx` | Create/edit custom templates |

### Client Detail Integration

Add "Automations" tab to `/dashboard/clients/[clientId]`:

```
ClientDetailContent.tsx
├── Overview Tab (existing)
├── Messages Tab (existing)
├── Contracts Tab (existing)
└── Automations Tab (NEW)
    ├── WorkflowTimeline (visual)
    ├── WorkflowList (detailed)
    └── "Add Automation" button → WorkflowScheduler modal
```

---

## 6. Landing Page Integration

### Features Section

Add new feature card in `components/landing/LandingPage.tsx`:

```tsx
{
  title: "Automated Workflows",
  description: "Never forget to send a timeline guide again. Set it once, it sends automatically.",
  icon: <Zap className="w-5 h-5" />,
  badge: "NEW",
}
```

### Pricing Matrix

Add row in `lib/config/pricing-v2.ts`:

```typescript
{
  feature: 'Automated Workflows',
  free: '3 active',
  essential: '10 active',
  pro: 'Unlimited',
  studio: 'Unlimited',
  elite: 'Unlimited',
}
```

---

## 7. Plan Limits

| Plan | Active Automations | Custom Templates |
|------|-------------------|------------------|
| Free | 3 | 0 (pre-built only) |
| Essential | 10 | 3 |
| Pro | Unlimited | Unlimited |
| Studio | Unlimited | Unlimited |
| Elite | Unlimited | Unlimited |

---

## 8. File Structure

```
lib/
└── workflows/
    └── types.ts                    # Type definitions

server/
└── actions/
    └── workflow.actions.ts         # Server actions

app/
├── api/
│   └── cron/
│       └── send-workflows/
│           └── route.ts            # Cron job
└── dashboard/
    └── clients/
        └── [clientId]/
            └── page.tsx            # Add Automations tab

components/
└── workflows/
    ├── WorkflowList.tsx
    ├── WorkflowScheduler.tsx
    ├── TemplateSelector.tsx
    ├── TemplatePreview.tsx
    ├── WorkflowTimeline.tsx
    └── TemplateEditor.tsx

database/
└── migrations/
    └── 051-automated-workflows.sql
```

---

## 9. Implementation Order

### Phase 1: Foundation (Day 1)
1. [ ] Create migration `051-automated-workflows.sql`
2. [ ] Create `lib/workflows/types.ts`
3. [ ] Create `server/actions/workflow.actions.ts`
4. [ ] Run migration

### Phase 2: Cron & Email (Day 1)
5. [ ] Create `app/api/cron/send-workflows/route.ts`
6. [ ] Add cron to `vercel.json`
7. [ ] Test with manual trigger

### Phase 3: UI Components (Day 2)
8. [ ] Create `components/workflows/WorkflowList.tsx`
9. [ ] Create `components/workflows/TemplateSelector.tsx`
10. [ ] Create `components/workflows/WorkflowScheduler.tsx`
11. [ ] Create `components/workflows/TemplatePreview.tsx`

### Phase 4: Integration (Day 2)
12. [ ] Add Automations tab to client detail page
13. [ ] Wire up all actions
14. [ ] Test full flow

### Phase 5: Landing Page (Day 3)
15. [ ] Add feature card to landing page
16. [ ] Add row to pricing matrix
17. [ ] Update pricing-v2.ts with limits

### Phase 6: Polish (Day 3)
18. [ ] Add empty states
19. [ ] Add loading states
20. [ ] Add error handling
21. [ ] Test edge cases

---

## Merge Field Reference

| Field | Example Value |
|-------|---------------|
| `{{client_name}}` | Sarah Johnson |
| `{{client_first_name}}` | Sarah |
| `{{client_email}}` | sarah@email.com |
| `{{event_type}}` | Wedding |
| `{{event_date}}` | 2025-03-15 |
| `{{event_date_formatted}}` | Saturday, March 15, 2025 |
| `{{event_location}}` | The Grand Ballroom |
| `{{days_until_event}}` | 14 |
| `{{days_since_event}}` | 1 |
| `{{photographer_name}}` | John Smith |
| `{{photographer_email}}` | john@studio.com |
| `{{photographer_phone}}` | (555) 123-4567 |
| `{{photographer_business}}` | Smith Photography |
| `{{delivery_window}}` | 14 |
| `{{package_name}}` | Premium Wedding |

---

## Ready to Execute

This spec is complete. Run implementation in order listed above.
