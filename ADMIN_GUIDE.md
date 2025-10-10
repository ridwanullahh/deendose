# Admin Guide - DeenDose Automation Control Panel

## Accessing the Admin Dashboard

Navigate to: `https://your-domain.vercel.app/admin`

## Dashboard Overview

The Automation Control Panel provides real-time monitoring and control over the entire content generation and publishing pipeline.

### Main Sections

1. **Statistics Cards** (Top)
2. **Emergency Controls**
3. **Content Queue** (14-day view)
4. **Publishing History**
5. **Platform Analytics**
6. **Cron Job Status**

---

## Statistics Cards

### Content Queue Card
- **Approved Posts Ready**: Number of posts ready to publish
- **Pending**: Posts awaiting review
- **Days Buffer**: How many days ahead content is available

**Healthy Status**: 7-14 days buffer maintained

### Publishing Status Card
- **Total Successful**: All-time successful publishes
- **Failed**: Failed publishing attempts

**Monitor**: If failures increase, check platform tokens

### System Health Card
- **Overall Status**: healthy, degraded, unhealthy
- **Warnings**: Non-critical issues
- **Errors**: Critical issues requiring attention

**Icons**:
- ✅ Green checkmark = Healthy
- ❌ Red X = Unhealthy

---

## Emergency Controls

### Publish Now Button
**Purpose**: Manually trigger immediate publishing

**Use When**:
- Cron job missed
- Testing after configuration changes
- Emergency post needed

**Action**: Publishes next approved content to all platforms immediately

### Generate Content Button
**Purpose**: Manually trigger content generation

**Use When**:
- Queue is running low
- Testing content generation
- After fixing validation issues

**Action**: Generates new content to fill 14-day buffer

### Pause Automation Button ⚠️
**Purpose**: Emergency stop for all automation

**Use When**:
- System issues detected
- Platform tokens expired
- Maintenance required

**Action**: Stops all cron jobs and automation

**Recovery**: Re-enable in Vercel settings or environment variables

---

## Content Queue Tab

### Overview
Shows upcoming 14 days of pre-generated content

### Columns
- **Scheduled Date**: When content will publish
- **Status**: pending_review, approved, rejected, published
- **Verse Reference**: Surah and Ayah number
- **Actions**: Approve, Reject, Edit

### Content Review Process

#### Approving Content
1. Click content item to view full details
2. Review verse, Hadith, and Tafseer
3. Check AI validation logs
4. Click "Approve" button

**Effect**: Content moves to approved queue for publishing

#### Rejecting Content
1. Click content item
2. Click "Reject" button
3. Enter rejection reason
4. System automatically regenerates replacement

**Reasons to Reject**:
- Theological inaccuracy
- Poor source attribution
- Logical inconsistencies
- Better verse available for date

#### Editing Content (Advanced)
1. Click "Edit" button
2. Modify summary, key points, or applications
3. Save changes
4. Re-validate if needed

**Note**: Manual edits bypass AI validation, use carefully

---

## Publishing History Tab

### Overview
Shows recent publishing activity (last 30 days)

### Information Displayed
- **Date Published**
- **Verse Reference**
- **Platforms**: Which platforms received the post
- **Success Rate**: Percentage successful
- **Post IDs**: Links to actual social media posts

### Platform Status Icons
- ✅ Green = Published successfully
- ❌ Red = Failed
- ⏳ Yellow = Pending/Retrying

### Troubleshooting Failed Posts
1. Click failed post to see error details
2. Common issues:
   - Token expired → Refresh token
   - Rate limit → Wait and retry
   - API error → Check platform status

---

## Platform Analytics Tab

### Metrics per Platform

#### Facebook
- Total posts attempted
- Successful posts
- Success rate percentage
- Average engagement (if available)

#### Twitter/X
- Thread posts count
- Success rate
- Engagement metrics

#### Instagram
- Image posts count
- Success rate
- Visual content performance

#### Telegram
- Message count
- Delivery rate

#### WhatsApp
- Broadcast messages sent
- Delivery confirmation

#### LinkedIn
- Professional posts count
- Success rate

### Interpreting Analytics

**Healthy Platform**: 90-100% success rate
**Warning**: 70-89% success rate → Check token
**Critical**: <70% success rate → Immediate attention needed

### Actions Based on Analytics
- Low success rate → Refresh OAuth tokens
- Consistent failures → Disable platform temporarily
- High engagement → Consider more frequent posting

---

## Cron Jobs Tab

### Monitored Jobs

#### Daily Publishing Job
- **Schedule**: Once daily at configured time (default 6 AM)
- **Last Run**: Timestamp of last execution
- **Next Run**: Scheduled next execution
- **Status**: Healthy, Warning, Error

**Healthy Indicators**:
- Last run within 26 hours
- Status: Success
- No errors logged

#### Content Generation Job
- **Schedule**: Every 6 hours
- **Last Run**: Recent timestamp
- **Buffer Maintained**: Queue stays full

**Healthy Indicators**:
- Last run within 7 hours
- Content buffer at 7-14 days

### Cron Job Troubleshooting

#### Job Never Runs
1. Check Vercel cron configuration
2. Verify CRON_SECRET matches
3. Test endpoint manually
4. Review Vercel function logs

#### Job Runs But Fails
1. View error logs
2. Check API quotas
3. Verify all credentials
4. Test individual components

#### Manual Trigger
Use emergency controls to test job execution outside schedule

---

## AI Validation Logs

### Viewing Logs
Navigate to: Settings → AI Validation Logs

### Log Structure
Each entry contains:
- **Verse Reference**: Which verse was validated
- **Timestamp**: When validation occurred
- **Approved/Rejected**: Final decision
- **Agent Decisions**: All 7 agents' feedback

### Agent Breakdown

1. **Generator Agent**: Initial content created
2. **Web Search Validator**: External sources checked
3. **Theological Validator**: Aqeedah soundness
4. **Methodology Validator**: Correct Tafseer approach
5. **Source Attribution**: Scholar citations verified
6. **Cross-Reference**: Consistency checked
7. **Synthesis Agent**: Final compilation

### Common Rejection Reasons

**Theological Issues**:
- Contradicts Quran/Sunnah
- Weak Aqeedah
- Innovation (bid'ah) detected

**Methodological Issues**:
- Personal opinion without basis
- Wrong interpretation approach
- Sectarian methodology

**Source Issues**:
- No scholar citations
- Weak or fabricated sources
- Incorrect attributions

### Using Logs for Improvement
- Identify patterns in rejections
- Adjust AI parameters if needed
- Add more trusted sources
- Fine-tune agent prompts

---

## System Health Monitoring

### Health Check Endpoint
`GET /api/health/cron-status`

### Health Status Levels

#### Healthy
- All systems operational
- Cron jobs running on schedule
- No errors or warnings

#### Degraded
- Minor issues detected
- Some warnings present
- System still functional

#### Unhealthy
- Critical errors present
- Cron jobs failing
- Immediate action required

### Monitoring Schedule
- **Automatic**: Every hour via internal checks
- **Manual**: Click "Refresh" button
- **Alerts**: Telegram notifications for errors

---

## Token Management

### Token Expiration Tracking

Most OAuth tokens expire:
- Facebook Page Token: 60 days (long-lived)
- Instagram Token: 60 days
- Twitter Tokens: Don't expire (but can be revoked)
- LinkedIn Token: 60 days

### Refreshing Tokens

#### Facebook
1. Admin Panel → Platform Settings → Facebook
2. Click "Refresh Token"
3. Authorize via popup
4. New token saved automatically

#### Instagram
1. Same as Facebook (uses Facebook Graph API)

#### LinkedIn
1. Admin Panel → Platform Settings → LinkedIn
2. Click "Refresh Token"
3. Complete OAuth flow

### Token Security
- Never share tokens publicly
- Rotate regularly (quarterly)
- Use environment variables only
- Monitor for unusual activity

---

## Content Injection for Special Occasions

### Manual Content Injection
**Use Cases**:
- Eid al-Fitr
- Eid al-Adha
- Ramadan special posts
- Islamic New Year
- Day of Arafah

### Injection Process
1. Go to Content Queue
2. Click "Inject Manual Content"
3. Select special date
4. Choose verse and Hadith
5. Add custom Tafseer
6. Mark as "Approved"

**Note**: Manual content bypasses AI validation

### Special Occasion Templates
Pre-configured templates available for:
- Eid greetings
- Ramadan reflections
- Hajj virtues
- Friday special posts

---

## Error Handling and Alerts

### Error Log Levels

#### Info
- Routine operations
- Successful completions
- No action needed

#### Warning
- Minor issues
- Non-critical failures
- Monitor situation

#### Error
- Significant problems
- Component failures
- Action recommended

#### Critical
- System-wide failures
- Complete automation stopped
- Immediate action required

### Alert Destinations

#### Telegram Notifications
- Critical errors
- Daily publishing status
- Cron job failures

#### Email Alerts (Optional)
- Weekly summary
- Critical errors
- Token expiration warnings

### Responding to Alerts

1. **Assess Severity**: Critical vs Warning
2. **Check Logs**: Identify root cause
3. **Take Action**: Fix configuration, refresh tokens, etc.
4. **Verify Fix**: Test manually
5. **Monitor**: Ensure issue resolved

---

## Best Practices

### Daily Tasks
- [ ] Check system health card
- [ ] Review any warnings or errors
- [ ] Verify content buffer (7-14 days)
- [ ] Confirm previous day published successfully

### Weekly Tasks
- [ ] Review AI validation logs
- [ ] Check platform analytics
- [ ] Verify all platforms posting successfully
- [ ] Review content quality

### Monthly Tasks
- [ ] Refresh OAuth tokens (if needed)
- [ ] Review and adjust automation settings
- [ ] Check API quota usage
- [ ] Plan for special occasions

### Quarterly Tasks
- [ ] Rotate all API keys and secrets
- [ ] Review and update content themes
- [ ] Audit AI validation accuracy
- [ ] System security check

---

## Maintenance Mode

### Enabling Maintenance
1. Set `AUTO_PUBLISH_ENABLED=false`
2. Pause cron jobs in Vercel
3. Display maintenance message

### Performing Maintenance
- Update dependencies
- Refresh all tokens
- Clear old logs
- Test individual components

### Exiting Maintenance
1. Verify all systems operational
2. Set `AUTO_PUBLISH_ENABLED=true`
3. Re-enable cron jobs
4. Monitor first execution

---

## Support and Troubleshooting

### Getting Help
1. Check TROUBLESHOOTING.md
2. Review error logs
3. Search GitHub issues
4. Create new issue with details

### Providing Debug Information
When reporting issues, include:
- Error messages
- Timestamp
- Recent changes made
- Relevant log entries
- Platform(s) affected

---

**May Allah make this platform a means of spreading beneficial knowledge and a source of continuous reward (Sadaqah Jariyah).**

**Ameen.**
