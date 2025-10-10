# DeenDose - Fully Automated Islamic Content Platform

**Bismillah Ar-Rahman Ar-Roheem**

> A comprehensive, zero-intervention Islamic content platform featuring intelligent API integration, multi-agent AI validation, and automated daily publishing to all major social media platforms.

## 🌟 Features

### 🤖 Full Automation
- **Zero Manual Intervention**: Completely automated content generation and publishing
- **14-Day Buffer**: Pre-generates content 2 weeks in advance
- **Multi-Platform Simultaneous Publishing**: Posts to all platforms at once
- **Intelligent Failure Recovery**: Automatic retry with exponential backoff

### 📚 Authentic Content Sources
- **Quran.com API Integration**: Real verses with translations and audio
- **Sunnah.com API Integration**: Authentic Hadiths from Sahih collections
- **Theme-Based Selection**: Daily rotation (Tawheed, Salah, Character, etc.)
- **Offline Fallback**: 100+ backup verses and Hadiths

### 🧠 Multi-Agent AI Validation System
- **7-10 Critique Agents**: Chain-of-critique validation
- **Web Search Integration**: Verifies against trusted Islamic websites
- **Theological Validation**: Ensures soundness according to Quran & Sunnah
- **Methodology Validation**: Follows Ahlus Sunnah understanding
- **Source Attribution**: Proper citations to classical scholars
- **Automatic Rejection**: Failed content regenerated with different verses

### 📱 Social Media Platforms
- Facebook (with full formatting)
- Twitter/X (thread format)
- Instagram (with generated images)
- Telegram (HTML formatting)
- WhatsApp Business (broadcast messages)
- LinkedIn (professional tone)

### 🎛️ Admin Dashboard
- Content queue overview (14-day view)
- AI validation logs viewer
- Real-time publishing status
- Platform analytics and success rates
- Emergency manual controls
- Cron job monitoring
- System health checks

### ⏰ Automated Scheduling
- **Vercel Cron Jobs**: Server-side execution
- **Timezone-Aware**: Configurable publish time
- **Daily Publishing**: Single configured time per day
- **Background Generation**: Every 6 hours

## 🏗️ Architecture

```
Content APIs → Theme Selector → Multi-Agent AI → Content Queue → Auto Publisher → Social Platforms
     ↓              ↓                ↓               ↓                ↓              ↓
 Quran.com      Daily         7 Critique        14-Day          Simultaneous    All Enabled
 Sunnah.com     Rotation       Agents           Buffer           Publishing      Platforms
```

See [ARCHITECTURE.md](./ARCHITECTURE.md) for detailed system design.

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- GitHub account (for database)
- Vercel account (for hosting)
- API keys (see Setup)

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/yourusername/deendose.git
cd deendose
```

2. **Install dependencies**
```bash
npm install
```

3. **Configure environment**
```bash
cp .env.example .env.local
# Edit .env.local with your API keys
```

4. **Run locally**
```bash
npm run dev
```

5. **Deploy to Vercel**
```bash
vercel --prod
```

See [DEPLOYMENT.md](./DEPLOYMENT.md) for complete setup instructions.

## 📋 API Keys Required

- **GitHub** (Database): Personal Access Token
- **Quran.com**: API Key
- **Sunnah.com**: API Key
- **Google Gemini AI**: API Key
- **SerpAPI** (Optional): For web search validation
- **Social Media Platforms**: OAuth tokens for each platform
- **Cloudinary** (Optional): For image generation

## 🔧 Configuration

### Environment Variables

```env
# Core
GITHUB_OWNER=your-username
GITHUB_REPO=deendose-db
GITHUB_TOKEN=ghp_...

# Content APIs
QURAN_API_KEY=...
HADITH_API_KEY=...

# AI
GEMINI_API_KEY=...
SERP_API_KEY=...

# Social Media
FACEBOOK_ACCESS_TOKEN=...
TWITTER_BEARER_TOKEN=...
INSTAGRAM_ACCESS_TOKEN=...
# ... and more

# Automation
DAILY_PUBLISH_TIME=06:00
TIMEZONE=UTC
CONTENT_BUFFER_DAYS=14
AUTO_PUBLISH_ENABLED=true
```

See [.env.example](./.env.example) for complete list.

### Vercel Cron Configuration

```json
{
  "crons": [
    {
      "path": "/api/cron/daily-publish",
      "schedule": "0 6 * * *"
    },
    {
      "path": "/api/cron/content-generation",
      "schedule": "0 */6 * * *"
    }
  ]
}
```

## 📂 Project Structure

```
deendose/
├── app/
│   ├── api/
│   │   ├── cron/              # Cron job endpoints
│   │   ├── admin/             # Admin API routes
│   │   └── health/            # Health check endpoints
│   ├── admin/                 # Admin dashboard pages
│   └── page.tsx               # Public homepage
├── lib/
│   ├── api/                   # External API integrations
│   │   ├── quran-api.ts
│   │   └── hadith-api.ts
│   ├── ai/                    # AI validation system
│   │   └── multi-agent-validator.ts
│   ├── services/              # Business logic
│   │   ├── content-pipeline.ts
│   │   └── auto-publisher.ts
│   └── social/                # Social media publishers
│       ├── facebook-publisher.ts
│       ├── twitter-publisher.ts
│       ├── instagram-publisher.ts
│       ├── telegram-publisher.ts
│       ├── whatsapp-publisher.ts
│       └── linkedin-publisher.ts
├── components/
│   ├── admin/                 # Admin UI components
│   └── ui/                    # Shared UI components
├── public/
│   └── data/                  # Backup content
│       ├── quran-backup.json
│       └── hadith-backup.json
├── db/                        # GitHub database
└── docs/
    ├── DEPLOYMENT.md
    ├── ARCHITECTURE.md
    └── TROUBLESHOOTING.md
```

## 🛠️ Development

### Build
```bash
npm run build
```

### Lint
```bash
npm run lint
```

### Type Check
```bash
npm run type-check
```

## 🔍 Monitoring

### Health Check
```bash
curl https://your-domain.vercel.app/api/health/cron-status
```

### Admin Dashboard
Access at: `https://your-domain.vercel.app/admin`

### Logs
- AI validation logs: GitHub DB
- Publishing history: GitHub DB  
- Error logs: GitHub DB
- Cron logs: Vercel dashboard

## 🐛 Troubleshooting

Common issues and solutions in [TROUBLESHOOTING.md](./TROUBLESHOOTING.md)

## 📖 Documentation

- [Deployment Guide](./DEPLOYMENT.md) - Complete setup instructions
- [Architecture](./ARCHITECTURE.md) - System design and data flow
- [Admin Guide](./ADMIN_GUIDE.md) - Dashboard usage
- [AI Validation Methodology](./AI_VALIDATION_METHODOLOGY.md) - Critique agent details

## 🤝 Contributing

This is a da'wah project. Contributions are welcome, especially:
- Additional language translations
- More Islamic content sources
- Platform integrations (YouTube, TikTok, etc.)
- UI improvements
- Bug fixes

## 📜 License

This project is created for Islamic da'wah purposes. Use it ethically and responsibly.

## 🙏 Du'a

May Allah accept this work and make it a continuous source of benefit (Sadaqah Jariyah) for all who contribute and use it.

اللَّهُمَّ انْفَعْنَا بِمَا عَلَّمْتَنَا وَعَلِّمْنَا مَا يَنْفَعُنَا
*"O Allah, benefit us with what You have taught us and teach us what will benefit us."*

---

**Built with Next.js, React, TypeScript, and powered by Google Gemini AI**

For support and questions, please open an issue on GitHub.
