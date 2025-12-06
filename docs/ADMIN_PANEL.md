# 12img Admin Panel — Implementation Plan

## Overview
Production-grade admin control plane for 12img SaaS platform.

---

## Phase 1: Foundation ✅
- [x] Database migrations for admin tables
- [x] RBAC system with role guards
- [x] Admin layout shell
- [x] Middleware protection

## Phase 2: User Management
- [ ] User list with pagination/filters
- [ ] User detail view
- [ ] Suspend/reactivate actions
- [ ] Limit overrides
- [ ] Impersonation

## Phase 3: Gallery & Storage
- [ ] Global gallery browser
- [ ] Storage analytics dashboard
- [ ] Orphan file cleanup
- [ ] Bulk operations

## Phase 4: Billing & Subscriptions
- [ ] Subscription overview
- [ ] Plan overrides
- [ ] Stripe webhook viewer
- [ ] Manual reconciliation

## Phase 5: Email System
- [ ] Email templates (React Email)
- [ ] Broadcast composer
- [ ] Invitation system
- [ ] Email logs

## Phase 6: System Monitoring
- [ ] Real-time analytics
- [ ] Error logs viewer
- [ ] Audit log browser
- [ ] Health checks

## Phase 7: Admin Tools
- [ ] Global search
- [ ] Task runner
- [ ] Feature flags
- [ ] Maintenance mode

---

## File Structure

```
app/
├── admin/
│   ├── layout.tsx              # Admin shell with sidebar
│   ├── page.tsx                # Dashboard overview
│   ├── users/
│   │   ├── page.tsx            # User list
│   │   └── [id]/page.tsx       # User detail
│   ├── galleries/
│   │   └── page.tsx            # Gallery browser
│   ├── storage/
│   │   └── page.tsx            # Storage analytics
│   ├── billing/
│   │   └── page.tsx            # Subscription management
│   ├── emails/
│   │   ├── page.tsx            # Email composer
│   │   └── templates/page.tsx  # Template manager
│   ├── logs/
│   │   ├── page.tsx            # Audit logs
│   │   └── errors/page.tsx     # Error logs
│   └── settings/
│       ├── page.tsx            # Admin settings
│       └── flags/page.tsx      # Feature flags

server/
├── admin/
│   ├── guards.ts               # RBAC capability guards
│   ├── users.ts                # User management
│   ├── galleries.ts            # Gallery operations
│   ├── storage.ts              # Storage analytics
│   ├── billing.ts              # Billing operations
│   ├── emails.ts               # Email system
│   └── audit.ts                # Audit logging

lib/
├── admin/
│   ├── types.ts                # Admin type definitions
│   ├── constants.ts            # Role definitions
│   └── utils.ts                # Admin utilities

components/
├── admin/
│   ├── AdminShell.tsx          # Layout wrapper
│   ├── AdminSidebar.tsx        # Navigation sidebar
│   ├── AdminHeader.tsx         # Top bar
│   ├── DataTable.tsx           # Reusable data table
│   ├── StatCard.tsx            # Analytics cards
│   └── ActionMenu.tsx          # Action dropdowns

database/
├── migrations/
│   ├── 007-admin-roles.sql
│   ├── 008-audit-logs.sql
│   └── 009-feature-flags.sql
```

---

## Role Hierarchy

| Role | Permissions |
|------|-------------|
| `super_admin` | Full access, can manage other admins |
| `admin` | User management, billing, storage |
| `support` | Read-only + limited write (suspend users) |

---

## Security Requirements

1. **Server-only operations** — No admin actions on client
2. **Audit logging** — Every action logged with admin ID, target, metadata
3. **Session timeout** — 30 min idle timeout for admin sessions
4. **MFA required** — super_admin must have MFA enabled
5. **IP allowlist** — Optional restriction for admin access
6. **Rate limiting** — Prevent abuse of admin endpoints

---

## Getting Started

1. Run migrations: `007-admin-roles.sql`, `008-audit-logs.sql`
2. Add your Clerk user ID to `profiles.role = 'super_admin'`
3. Access `/admin` — middleware will enforce RBAC
4. Start with user management, expand from there
