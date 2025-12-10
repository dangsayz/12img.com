# 12img Monitoring & Alerting Setup

## Why This Matters

The Vercel Image Optimization 402 error was a **silent failure** - the app looked fine but images didn't load. Without monitoring, you'd only find out when a customer complains.

## Health Check Endpoints

### 1. Basic Health Check
```
GET https://www.12img.com/api/health
```
Returns 200 if the app is running. Use for basic uptime monitoring.

### 2. Gallery Health Check (IMPORTANT)
```
GET https://www.12img.com/api/health/gallery
```
Tests the full image loading pipeline:
- Database connectivity
- Storage bucket access
- Signed URL generation
- Image transform capability

Returns 200 if all checks pass, 500 if any fail.

## Recommended Monitoring Setup

### Option 1: UptimeRobot (Free)
1. Go to https://uptimerobot.com
2. Create account
3. Add monitors:
   - **Basic**: `https://www.12img.com/api/health` (every 5 min)
   - **Gallery**: `https://www.12img.com/api/health/gallery` (every 15 min)
4. Set up alerts via email/SMS/Slack

### Option 2: Checkly (Better, Free tier)
1. Go to https://www.checklyhq.com
2. Create account
3. Add API checks with assertions
4. Can also add browser checks to test actual page rendering

### Option 3: Better Stack (Formerly Logtail)
1. Go to https://betterstack.com
2. Combines uptime monitoring + log aggregation
3. Beautiful status pages

## What Each Service Monitors

| Service | What It Catches |
|---------|-----------------|
| Vercel | Deployment failures, build errors |
| UptimeRobot | Site down, 5xx errors |
| Health/Gallery | Image pipeline broken, storage issues, DB down |
| Supabase Dashboard | Database issues, storage quota |

## Alert Channels

Set up multiple channels so you don't miss alerts:
1. **Email** - Always on
2. **SMS** - For critical (site down)
3. **Slack/Discord** - For team visibility
4. **Push notifications** - UptimeRobot app

## Vercel-Specific Monitoring

### Image Optimization Quota
The 402 error was caused by exceeding Vercel's image optimization quota.

**To monitor:**
1. Go to Vercel Dashboard → Usage
2. Check "Image Optimization" usage
3. Set up billing alerts at 80% usage

**Current fix:** Using `unoptimized` prop bypasses Vercel's optimization entirely.

### Function Invocations
Monitor serverless function usage to avoid surprise bills.

## Supabase Monitoring

### Storage Quota
1. Go to Supabase Dashboard → Storage
2. Check usage vs limits
3. Set up alerts in Project Settings → Alerts

### Database Connections
Monitor connection pool usage, especially during high traffic.

## Quick Setup Checklist

- [ ] Create UptimeRobot account
- [ ] Add monitor for `/api/health` (5 min interval)
- [ ] Add monitor for `/api/health/gallery` (15 min interval)
- [ ] Configure email alerts
- [ ] Configure SMS for critical alerts
- [ ] Check Vercel usage dashboard
- [ ] Check Supabase storage usage
- [ ] Test alerts by temporarily breaking something

## Testing Your Monitoring

After setup, verify alerts work:
1. Temporarily return 500 from `/api/health`
2. Wait for alert
3. Confirm you received notification
4. Revert the change

## Future Improvements

1. **Synthetic monitoring** - Automated browser tests that actually load galleries
2. **Real User Monitoring (RUM)** - Track actual user experience
3. **Error tracking** - Sentry for JavaScript errors
4. **Log aggregation** - Centralized logs for debugging
