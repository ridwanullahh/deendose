# DeenDose Database Schema

This directory contains the GitHub-based database for DeenDose platform.

## Collections

### api-cache
Caches API responses from Quran.com and Sunnah.com
- TTL-based expiration
- Reduces API calls

### content-queue
Stores pre-generated content awaiting approval/publishing
- Status: pending_review, approved, rejected, published
- 7-14 day rolling buffer

### ai-validation-logs
Logs from multi-agent AI validation system
- All agent decisions
- Sources checked
- Approval/rejection reasons

### publishing-history
Records of all published content
- Platform-specific results
- Success/failure tracking
- Post IDs from each platform

### cron-jobs
Tracks cron job execution
- Last run timestamps
- Status monitoring
- Error tracking

### error-logs
System-wide error logging
- Severity levels
- Stack traces
- Automatic alerts for critical errors

### admin-audit-logs
Tracks all admin actions
- User actions
- Timestamp
- Changes made

## Database Structure

All collections follow GitHub database pattern:
- Each document has unique `id` field
- Timestamps in ISO 8601 format
- JSON structure for complex objects

## Backup Strategy

GitHub repository serves as:
1. Primary database
2. Version control system
3. Automatic backup
4. Audit trail

## Initialization

Database is automatically initialized on first run via:
```typescript
import { initializeDatabase } from '@/lib/sdk'
await initializeDatabase()
```
