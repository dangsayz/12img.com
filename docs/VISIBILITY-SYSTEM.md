# Gallery Visibility System

## Overview

The unified visibility system provides **3 independent controls** that work together:

1. **Profile Visibility** – Who can see your profile page
2. **Gallery Visibility** – Who can access a specific gallery
3. **Authentication** – Password/PIN requirements

---

## Profile Visibility Modes

| Mode | Profile Page | Gallery List | Direct Gallery Links |
|------|--------------|--------------|---------------------|
| `PRIVATE` | Hidden | Hidden | See gallery settings |
| `PUBLIC` | Visible | Shows galleries with `show_on_profile=true` | See gallery settings |
| `PUBLIC_LOCKED` | Visible after PIN | Shows galleries after PIN | See gallery settings |

---

## Gallery Visibility Modes

| Mode | Who Can Access | Use Case |
|------|----------------|----------|
| `public` | Anyone with link | Portfolio work, published galleries |
| `client_only` | Linked clients via portal token | Client deliveries, private sessions |
| `private` | Owner only | Drafts, archived work, personal |

---

## Gallery Flags

### `show_on_profile`
- **true**: Gallery appears in public profile gallery list
- **false**: Gallery hidden from profile (direct link still works based on visibility_mode)

**Example**: A public gallery you don't want cluttering your portfolio but still want shareable.

### `respect_profile_visibility`
- **true**: Direct gallery links respect profile-level visibility
- **false**: Direct links work regardless of profile being PRIVATE

**Example**: Profile is PRIVATE (no public portfolio) but you want one specific gallery shareable.

### `inherit_profile_pin`
- **true**: If profile is PUBLIC_LOCKED, gallery uses profile PIN (no double auth)
- **false**: Gallery uses its own `password_hash` (separate password required)

**Example**: Avoid asking visitors for both profile PIN and gallery password.

---

## Access Matrix

| Profile Mode | Gallery Mode | `show_on_profile` | `respect_profile_visibility` | Result |
|--------------|--------------|-------------------|------------------------------|--------|
| PUBLIC | public | true | - | Shows on profile, accessible via direct link |
| PUBLIC | public | false | - | Hidden from profile, accessible via direct link |
| PUBLIC | client_only | true | - | Shows on profile with lock, only clients can open |
| PUBLIC | client_only | false | - | Hidden from profile, only clients can access |
| PUBLIC | private | - | - | Never shown, only owner can access |
| PRIVATE | public | - | false | Direct link works (bypasses private profile) |
| PRIVATE | public | - | true | Direct link blocked (respects profile) |
| PRIVATE | client_only | - | - | Only clients via portal token |
| PUBLIC_LOCKED | public | true | - | After profile PIN, gallery accessible |
| PUBLIC_LOCKED | public | - | - | If `inherit_profile_pin=true`, same PIN works |

---

## Client-Only Access Flow

1. **Photographer** creates gallery with `visibility_mode = 'client_only'`
2. **Photographer** links client via `gallery_client_access` table
3. **Client** receives portal token (email link)
4. **Client** accesses portal → sees linked galleries
5. Gallery checks `can_client_access_gallery(gallery_id, client_id)`

```sql
-- Link a client to a gallery
INSERT INTO gallery_client_access (gallery_id, client_profile_id, created_by)
VALUES ('gallery-uuid', 'client-uuid', 'photographer-user-uuid');
```

---

## Authentication Priority

When checking access, authentication is evaluated in this order:

1. **Owner?** → Always access, no auth needed
2. **Archived?** → No access (except owner)
3. **Profile private + respect_profile_visibility?** → Blocked
4. **Gallery visibility_mode = private?** → Blocked
5. **Gallery visibility_mode = client_only?** → Must be linked client
6. **inherit_profile_pin + profile PUBLIC_LOCKED?** → Need profile PIN
7. **Gallery has password_hash?** → Need gallery password
8. **Gallery is_locked?** → Need gallery PIN

---

## Common Scenarios

### Scenario 1: Portfolio Photographer
- Profile: `PUBLIC`
- Galleries: `visibility_mode = 'public'`, `show_on_profile = true`
- Result: Full public portfolio, all galleries visible

### Scenario 2: Client Work Only
- Profile: `PRIVATE`
- Galleries: `visibility_mode = 'client_only'`
- Result: No public presence, clients access via portal tokens

### Scenario 3: Mixed Portfolio + Private Clients
- Profile: `PUBLIC`
- Portfolio galleries: `visibility_mode = 'public'`, `show_on_profile = true`
- Client galleries: `visibility_mode = 'client_only'`, `show_on_profile = false`
- Result: Public portfolio, client work hidden but accessible via portal

### Scenario 4: Private Profile, One Public Gallery
- Profile: `PRIVATE`
- Gallery: `visibility_mode = 'public'`, `respect_profile_visibility = false`
- Result: No profile page, but direct gallery link works

### Scenario 5: PIN-Protected Portfolio
- Profile: `PUBLIC_LOCKED` (PIN: 1234)
- Galleries: `inherit_profile_pin = true`
- Result: One PIN unlocks everything, no double auth

---

## Database Schema

### galleries table (new columns)
```sql
visibility_mode TEXT DEFAULT 'public'  -- 'public', 'client_only', 'private'
show_on_profile BOOLEAN DEFAULT true
respect_profile_visibility BOOLEAN DEFAULT false
inherit_profile_pin BOOLEAN DEFAULT true
```

### gallery_client_access table (new)
```sql
gallery_id UUID REFERENCES galleries(id)
client_profile_id UUID REFERENCES client_profiles(id)
can_view BOOLEAN DEFAULT true
can_download BOOLEAN DEFAULT true
can_favorite BOOLEAN DEFAULT true
notify_on_upload BOOLEAN DEFAULT true
```

---

## Migration Notes

- Existing `is_public = true` → `visibility_mode = 'public'`
- Existing `is_public = false` → `visibility_mode = 'private'`, `show_on_profile = false`
- `is_public` column kept for backwards compatibility but deprecated
- New code should use `visibility_mode` and helper functions
