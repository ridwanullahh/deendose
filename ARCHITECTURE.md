# DeenDose - System Architecture

## Overview

DeenDose is a fully automated Islamic content platform that publishes daily Quranic verses with authentic Hadiths and AI-validated Tafseer to multiple social media platforms simultaneously.

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                    Content Generation Pipeline               │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────────┐      ┌──────────────┐                    │
│  │ Quran.com API│──────│ Hadith API   │                    │
│  └──────────────┘      └──────────────┘                    │
│         │                     │                              │
│         └──────────┬──────────┘                              │
│                    ▼                                         │
│         ┌──────────────────────┐                            │
│         │  Theme Selector      │                            │
│         │  (Daily rotation)    │                            │
│         └──────────────────────┘                            │
│                    │                                         │
│                    ▼                                         │
│    ┌───────────────────────────────────┐                   │
│    │   Multi-Agent AI Validator        │                   │
│    │   (7-10 Critique Agents)          │                   │
│    ├───────────────────────────────────┤                   │
│    │ 1. Generator Agent                │                   │
│    │ 2. Web Search Validator           │                   │
│    │ 3. Theological Validator          │                   │
│    │ 4. Methodology Validator          │                   │
│    │ 5. Source Attribution Validator   │                   │
│    │ 6. Cross-Reference Validator      │                   │
│    │ 7. Synthesis Agent                │                   │
│    └───────────────────────────────────┘                   │
│                    │                                         │
│                    ▼                                         │
│         ┌──────────────────────┐                            │
│         │   Content Queue      │                            │
│         │   (14-day buffer)    │                            │
│         └──────────────────────┘                            │
│                    │                                         │
└────────────────────┼─────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│                   Publishing Pipeline                        │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│         ┌──────────────────────┐                            │
│         │  Daily Cron Trigger  │                            │
│         │  (6:00 AM daily)     │                            │
│         └──────────────────────┘                            │
│                    │                                         │
│                    ▼                                         │
│         ┌──────────────────────┐                            │
│         │  Auto Publisher      │                            │
│         └──────────────────────┘                            │
│                    │                                         │
│         ┌──────────┼───────────┐                            │
│         │          │           │                            │
│         ▼          ▼           ▼                            │
│    ┌────────┐ ┌────────┐ ┌─────────┐                       │
│    │Facebook│ │Twitter │ │Instagram│ ...                   │
│    └────────┘ └────────┘ └─────────┘                       │
│         │          │           │                            │
│         └──────────┼───────────┘                            │
│                    ▼                                         │
│         ┌──────────────────────┐                            │
│         │  Status Tracking     │                            │
│         └──────────────────────┘                            │
│                    │                                         │
│                    ▼                                         │
│         ┌──────────────────────┐                            │
│         │  Admin Notification  │                            │
│         └──────────────────────┘                            │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

## Core Components

### 1. API Integration Layer (`lib/api/`)

#### Quran API (`quran-api.ts`)
- Fetches verses from Quran.com API
- Theme-based verse selection
- Fallback to local backup (100+ verses)
- Caching with TTL expiration

#### Hadith API (`hadith-api.ts`)
- Fetches authentic Hadiths from Sunnah.com
- Collection-aware (Bukhari, Muslim, etc.)
- Theme-based Hadith selection
- Fallback to local backup

### 2. AI Validation System (`lib/ai/`)

#### Multi-Agent Validator (`multi-agent-validator.ts`)

**Chain of Critique Pattern:**

1. **Agent 1 - Content Generator**
   - Generates initial Tafseer based on classical sources
   - Uses structured prompt engineering
   - References Ibn Kathir, At-Tabari, As-Sa'di, etc.

2. **Agent 2 - Web Search Validator**
   - Queries trusted Islamic websites
   - Verifies against online scholarly sources
   - Uses SerpAPI for search
   - Trusted domains: dorar.net, islamqa.info, etc.

3. **Agent 3 - Theological Validator**
   - Checks Aqeedah soundness
   - Verifies alignment with Tawheed
   - Ensures no contradictions with Quran/Sunnah

4. **Agent 4 - Methodology Validator**
   - Validates Tafseer methodology
   - Ensures proper attribution
   - Checks for correct interpretation principles

5. **Agent 5 - Source Attribution Validator**
   - Verifies scholar citations
   - Ensures proper referencing
   - Checks against accepted scholars list

6. **Agent 6 - Cross-Reference Validator**
   - Checks consistency with related verses
   - Validates practical applications
   - Ensures logical coherence

7. **Agent 7 - Synthesis Agent**
   - Compiles final approved content
   - Addresses any remaining feedback
   - Produces polished output

**Retry Mechanism:**
- Up to 3 attempts per content item
- Different verses/Hadiths on retry
- Automatic rejection after max attempts

### 3. Content Pipeline (`lib/services/`)

#### Content Pipeline (`content-pipeline.ts`)

**Pre-Generation System:**
- Maintains 14-day rolling buffer
- Runs every 6 hours via cron
- Automatic theme rotation
- Status tracking: pending_review, approved, rejected, published

**Theme Selection:**
- Monday: Tawheed
- Tuesday: Salah
- Wednesday: Character
- Thursday: Family
- Friday: Patience
- Saturday: Gratitude
- Sunday: Forgiveness
- Special: Ramadan (month 9), Hajj (month 12)

#### Auto Publisher (`auto-publisher.ts`)

**Publishing Flow:**
1. Fetch next approved content from queue
2. Format for each platform
3. Publish simultaneously (with 2s delays)
4. Retry with exponential backoff (3 attempts)
5. Track success/failure per platform
6. Send admin notifications

**Platform-Specific Formatting:**
- Facebook: Full content with hashtags
- Twitter: Thread format (multiple tweets)
- Instagram: Image + caption
- Telegram: HTML formatting
- WhatsApp: Broadcast message
- LinkedIn: Professional tone

### 4. Social Media Publishers (`lib/social/`)

Each platform has dedicated publisher:
- OAuth token management
- Platform-specific API calls
- Automatic token refresh
- Error handling
- Rate limiting compliance

### 5. Cron Jobs (`app/api/cron/`)

#### Daily Publish (`/api/cron/daily-publish`)
- Runs daily at configured time (default 6 AM)
- Publishes to all enabled platforms
- Sends notifications
- Updates database

#### Content Generation (`/api/cron/content-generation`)
- Runs every 6 hours
- Maintains content buffer
- Generates new content as needed
- Logs validation results

### 6. Database (GitHub-Based)

**Collections:**
- `content-queue`: Pre-generated content
- `api-cache`: API response caching
- `ai-validation-logs`: AI decision logs
- `publishing-history`: Publishing records
- `cron-jobs`: Cron execution tracking
- `error-logs`: System errors

**Benefits:**
- Version control
- Automatic backup
- Free hosting
- Git-based audit trail

### 7. Admin Dashboard (`components/admin/`)

**Automation Control Panel:**
- Queue overview (14-day view)
- AI validation logs viewer
- Publishing status monitor
- Platform analytics
- Emergency controls
- Manual content injection
- Cron job monitoring

## Data Flow

### Content Generation Flow

```
1. Cron Trigger (every 6 hours)
   ↓
2. Check queue buffer (need more content?)
   ↓
3. Select theme for target date
   ↓
4. Fetch Quran verse (API → fallback)
   ↓
5. Fetch Hadith (API → fallback)
   ↓
6. AI Validation (7 agents)
   ├─ Approved → Queue
   └─ Rejected → Retry (max 3x)
   ↓
7. Save to content-queue
   ↓
8. Log validation results
```

### Publishing Flow

```
1. Cron Trigger (daily at publish time)
   ↓
2. Fetch next approved content
   ↓
3. Format for each platform
   ↓
4. Publish simultaneously:
   ├─ Facebook → Log result
   ├─ Twitter → Log result
   ├─ Instagram → Log result
   ├─ Telegram → Log result
   ├─ WhatsApp → Log result
   └─ LinkedIn → Log result
   ↓
5. Aggregate results
   ↓
6. Update database (mark published)
   ↓
7. Send admin notification
   ↓
8. Save to publishing-history
```

## Error Handling

### Graceful Degradation
- API failures → Local backup
- Single platform failure → Continue with others
- AI validation failure → Retry with new content
- Cron failure → Alert admin

### Retry Strategy
- Exponential backoff
- Platform-specific retries
- Content regeneration on failure
- Maximum 3 attempts

### Monitoring
- Health check endpoint
- Cron status monitoring
- Platform connectivity checks
- Error log aggregation

## Security

### API Keys
- Environment variables only
- Vercel secrets management
- Token rotation support

### Cron Authentication
- Bearer token authentication
- Secret-based access control

### OAuth Tokens
- Automatic refresh
- Expiration tracking
- Secure storage

## Scalability

### Content Buffer
- Configurable days (default 14)
- Automatic refill
- Prevents gaps in publishing

### Rate Limiting
- Platform-specific delays
- API call throttling
- Retry backoff

### Caching
- API response caching
- TTL-based expiration
- Reduces API calls

## Performance

### Edge Runtime
- Fast cold starts
- Global CDN
- Low latency

### Concurrent Publishing
- Parallel platform posting
- Non-blocking operations
- Async error handling

## Monitoring & Observability

### Logs
- AI validation logs
- Publishing history
- Error logs
- Admin audit logs

### Health Checks
- Cron status
- API connectivity
- Queue buffer status
- Platform health

### Alerts
- Telegram notifications
- Email alerts (optional)
- Critical error tracking

## Future Enhancements

- Multi-language support
- Audio content generation
- Video posts for YouTube/TikTok
- Community engagement tracking
- Advanced analytics dashboard
- Mobile app integration

---

**Bismillah Ar-Rahman Ar-Roheem**

May Allah accept this work and make it a source of continuous benefit for the Muslim Ummah.
