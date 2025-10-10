# Troubleshooting Guide

## Common Issues and Solutions

### Content Generation Issues

#### AI Validation Keeps Failing
**Symptoms**: Content rejected after 3 attempts
**Solutions**:
- Check Gemini API key validity
- Verify API quota not exceeded
- Review validation logs in admin panel
- Temporarily reduce AI_CRITIQUE_AGENTS to 5
- Check if web search is timing out

#### Quran/Hadith API Errors
**Symptoms**: "Failed to fetch" errors
**Solutions**:
- Verify API keys are correct
- Check API quota limits
- System will automatically fallback to backup JSON files
- Ensure backup files exist in `/public/data/`

### Publishing Issues

#### Posts Not Publishing
**Symptoms**: Cron runs but nothing posts
**Solutions**:
1. Check AUTO_PUBLISH_ENABLED=true
2. Verify content queue has approved posts
3. Check social media tokens haven't expired
4. Review error logs in GitHub DB
5. Test manual publish from admin panel

#### Facebook Publishing Fails
**Solutions**:
- Regenerate Page Access Token
- Ensure token has `pages_manage_posts` permission
- Convert short-lived to long-lived token
- Check Page ID is correct

#### Twitter/X Publishing Fails
**Solutions**:
- Verify all 5 Twitter credentials are set
- Check app has Read and Write permissions
- Regenerate access tokens if expired
- Verify bearer token is valid

#### Instagram Publishing Fails
**Solutions**:
- Must be Instagram Business Account
- Connected to Facebook Page
- Check INSTAGRAM_BUSINESS_ACCOUNT_ID
- Verify image URL is publicly accessible
- Cloudinary configured correctly

### Cron Job Issues

#### Cron Jobs Not Running
**Symptoms**: Health check shows "never_run"
**Solutions**:
1. Verify `vercel.json` cron configuration
2. Check CRON_SECRET matches in all places
3. Ensure endpoints are accessible
4. Review Vercel cron logs
5. Trigger manually to test

#### Publishing at Wrong Time
**Solutions**:
- Check TIMEZONE environment variable
- Verify DAILY_PUBLISH_TIME format (24-hour)
- Cron schedule in `vercel.json` matches
- Account for daylight saving time

### Database Issues

#### GitHub API Rate Limit
**Symptoms**: "API rate limit exceeded"
**Solutions**:
- Use authenticated requests (check GITHUB_TOKEN)
- Reduce cron frequency temporarily
- Implement additional caching
- Consider GitHub Apps instead of PAT

#### Data Not Persisting
**Solutions**:
- Verify GITHUB_TOKEN has write permissions
- Check repository exists and is accessible
- Ensure GITHUB_BRANCH is correct
- Review GitHub API error responses

### Token Expiration

#### Facebook Token Expired
**Solution**:
```bash
# Exchange for long-lived token (60 days)
curl "https://graph.facebook.com/v18.0/oauth/access_token?grant_type=fb_exchange_token&client_id=APP_ID&client_secret=APP_SECRET&fb_exchange_token=SHORT_TOKEN"
```

#### Instagram Token Expired
**Solution**:
```bash
# Refresh Instagram token
curl "https://graph.facebook.com/v18.0/oauth/access_token?grant_type=ig_exchange_token&client_secret=APP_SECRET&access_token=CURRENT_TOKEN"
```

### Performance Issues

#### Content Generation Slow
**Solutions**:
- Disable web search validation temporarily (WEB_SEARCH_ENABLED=false)
- Reduce CONTENT_BUFFER_DAYS to 7
- Increase cron frequency for generation
- Check Gemini API response times

#### Publishing Takes Too Long
**Solutions**:
- Reduce number of enabled platforms
- Increase delay between platforms
- Check network connectivity
- Review individual platform response times

### Validation Issues

#### All Content Rejected
**Symptoms**: No content passing AI validation
**Solutions**:
- Review validation logs for common rejection reasons
- Adjust AI temperature (try 0.4-0.5)
- Temporarily skip web search validation
- Check if trusted Islamic sites are accessible
- Review AI prompts in validator code

#### Web Search Failing
**Solutions**:
- Verify SERP_API_KEY is valid
- Check API quota
- Test trusted sites are accessible
- Temporarily disable: WEB_SEARCH_ENABLED=false
- Increase to 10 agents for fallback mode

### Deployment Issues

#### Build Fails on Vercel
**Solutions**:
- Check all TypeScript errors
- Verify all imports resolve
- Ensure all environment variables set
- Review build logs
- Test build locally first: `npm run build`

#### Environment Variables Not Working
**Solutions**:
- Re-deploy after adding variables
- Check variable names match exactly
- No quotes around values in Vercel
- Verify spelling and case sensitivity

### Emergency Procedures

#### Stop All Publishing
1. Set AUTO_PUBLISH_ENABLED=false
2. Disable cron jobs in Vercel
3. Or delete cron triggers temporarily

#### Clear Content Queue
1. Access GitHub repository
2. Navigate to db/content-queue.json
3. Delete file or clear contents
4. Regenerate content

#### Reset System
1. Backup GitHub database repository
2. Clear all db/*.json files
3. Run initialization: `/api/admin/initialize`
4. Trigger content generation
5. Approve first post manually

### Health Monitoring

#### Check System Health
```bash
curl https://your-domain.vercel.app/api/health/cron-status
```

Expected healthy response:
```json
{
  "overall": "healthy",
  "jobs": {
    "dailyPublish": { "status": "healthy" },
    "contentGeneration": { "status": "healthy" }
  },
  "warnings": [],
  "errors": []
}
```

### Logs and Debugging

#### View AI Validation Logs
1. Admin dashboard → AI Validation Logs tab
2. Or check GitHub DB: `db/ai-validation-logs.json`

#### View Publishing History
1. Admin dashboard → Publishing History tab
2. Or check GitHub DB: `db/publishing-history.json`

#### View Error Logs
1. Admin dashboard → Error Logs
2. Or check GitHub DB: `db/error-logs.json`

### Contact and Support

If issues persist:
1. Check GitHub Issues
2. Review documentation again
3. Test in isolation (one platform at a time)
4. Check Vercel deployment logs
5. Verify all API services are operational

### Prevention Tips

1. **Monitor Daily**: Check admin dashboard
2. **Token Rotation**: Refresh tokens before expiry
3. **Backup Content**: Regular GitHub commits
4. **Test Changes**: Use staging environment
5. **Health Alerts**: Set up Telegram notifications

---

**May Allah make it easy for you and grant success to this da'wah work.**
