# DeenDose - Deployment Guide

Complete setup instructions for the fully automated Islamic content platform.

## Prerequisites

- GitHub account (for database)
- Vercel account (for hosting)
- API keys for all services (see below)

## Step 1: GitHub Database Setup

1. Create a new GitHub repository named `deendose-db`
2. Initialize with a README
3. Generate a Personal Access Token:
   - Go to Settings → Developer Settings → Personal Access Tokens
   - Create token with `repo` scope
   - Save token securely

## Step 2: API Keys Setup

### Quran.com API
- Visit https://quran.com/api
- Register for API key
- Add to environment variables

### Sunnah.com API
- Visit https://sunnah.com/api
- Request API access
- Add credentials to environment

### Google Gemini AI
- Visit https://makersuite.google.com/app/apikey
- Create API key
- Model: `gemini-1.5-pro` recommended

### SerpAPI (Web Search)
- Visit https://serpapi.com
- Sign up for free tier
- Get API key

## Step 3: Social Media OAuth Setup

### Facebook
1. Create app at https://developers.facebook.com
2. Add Facebook Login and Pages API products
3. Get Page Access Token:
   - Graph API Explorer → Select your page
   - Request `pages_manage_posts` permission
4. Generate long-lived token

### Twitter/X
1. Apply for developer account at https://developer.twitter.com
2. Create app with OAuth 1.0a
3. Generate API keys and tokens
4. Enable Read and Write permissions

### Instagram
1. Convert personal account to Business account
2. Connect to Facebook Page
3. Use Facebook Graph API
4. Get Instagram Business Account ID

### Telegram
1. Create bot via @BotFather
2. Get bot token
3. Add bot to your channel
4. Get channel ID

### WhatsApp Business API
1. Set up Meta Business account
2. Configure WhatsApp Business API
3. Get Phone Number ID and access token

### LinkedIn
1. Create LinkedIn app at https://www.linkedin.com/developers/
2. Request API access for ugcPosts
3. Generate OAuth tokens

### Cloudinary (Image Generation)
1. Sign up at https://cloudinary.com
2. Get Cloud Name, API Key, and API Secret
3. Create upload preset for DeenDose

## Step 4: Environment Variables

Copy `.env.example` to `.env.local` and fill in all values:

```bash
cp .env.example .env.local
```

Edit `.env.local` with all your API keys and credentials.

## Step 5: Vercel Deployment

1. Install Vercel CLI:
```bash
npm install -g vercel
```

2. Login to Vercel:
```bash
vercel login
```

3. Deploy:
```bash
vercel --prod
```

4. Add environment variables in Vercel dashboard:
   - Go to your project settings
   - Add all variables from `.env.local`

5. Configure Cron Jobs (automatically configured via `vercel.json`):
   - Daily Publishing: `0 6 * * *` (6 AM daily)
   - Content Generation: `0 */6 * * *` (Every 6 hours)

## Step 6: Initial Content Generation

After deployment, manually trigger content generation:

```bash
curl -X POST https://your-domain.vercel.app/api/cron/content-generation \
  -H "Authorization: Bearer YOUR_CRON_SECRET"
```

This will pre-generate 14 days of content.

## Step 7: Verify System Health

Check system status:
```bash
curl https://your-domain.vercel.app/api/health/cron-status
```

## Step 8: Monitor Automation

1. Access admin panel: `https://your-domain.vercel.app/admin`
2. Check automation control panel
3. Verify content queue is populated
4. Test manual publish if needed

## Timezone Configuration

Set your timezone in `.env`:
```
TIMEZONE=America/New_York
DAILY_PUBLISH_TIME=06:00
```

Available timezones:
- UTC
- America/New_York
- Europe/London
- Asia/Riyadh
- Asia/Dubai
- Europe/Istanbul

## Troubleshooting

### Content Generation Fails
- Check Gemini API key
- Verify Quran/Hadith API connectivity
- Review AI validation logs

### Publishing Fails
- Verify social media tokens
- Check token expiration dates
- Review platform-specific errors

### Cron Jobs Not Running
- Verify `CRON_SECRET` matches
- Check Vercel cron logs
- Ensure cron endpoints are accessible

## Backup and Recovery

GitHub repository serves as automatic backup:
- All content is version controlled
- Database changes are tracked
- Rollback via Git history

## Monitoring

Set up monitoring:
1. Telegram notifications for failures
2. Email alerts for critical errors
3. Weekly health check reports

## Security Best Practices

1. Rotate API keys quarterly
2. Use environment variables only (never commit secrets)
3. Enable 2FA on all service accounts
4. Monitor API usage and rate limits
5. Regular security audits

## Support

For issues or questions:
- Check TROUBLESHOOTING.md
- Review error logs in GitHub DB
- Check admin audit logs

## License

This platform is for Islamic da'wah purposes. Use responsibly and ethically.

May Allah accept this work and make it beneficial for the Ummah.
