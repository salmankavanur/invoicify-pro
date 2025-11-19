# Environment Variables Quick Reference

## 🚀 Quick Start

### Development
```bash
cp .env.example .env.local
# Edit .env.local and add your GEMINI_API_KEY
npm run dev
```

### Production
```bash
# Set these in your hosting platform:
GEMINI_API_KEY=your_key
NODE_ENV=production
VITE_GOOGLE_SHEET_URL=your_url
```

---

## 📊 Variable Priority

| Priority | Variable | Purpose | Required |
|----------|----------|---------|----------|
| 🔴 **Critical** | `GEMINI_API_KEY` | AI features | **YES** |
| 🔴 **Critical** | `NODE_ENV` | Environment mode | **YES** |
| 🟡 **High** | `VITE_GOOGLE_SHEET_URL` | Cloud backup | Recommended |
| 🟡 **High** | `VITE_SENTRY_DSN` | Error tracking | Recommended |
| 🟡 **High** | `VITE_GA_MEASUREMENT_ID` | Analytics | Recommended |
| 🟢 **Medium** | `VITE_ENABLE_AI` | Feature flag | Optional |
| 🟢 **Medium** | `VITE_ENABLE_SYNC` | Feature flag | Optional |
| ⚪ **Low** | Payment keys | Future use | Optional |
| ⚪ **Low** | Email keys | Future use | Optional |
| ⚪ **Low** | Storage keys | Future use | Optional |

---

## 🔑 Required Variables

### 1. GEMINI_API_KEY
- **Type:** API Key
- **Required:** ✅ YES
- **Used for:** AI-powered invoice generation, financial analysis
- **Get from:** https://makersuite.google.com/app/apikey
- **Example:** `AIzaSyD...`
- **Free tier:** 60 requests/minute

### 2. NODE_ENV
- **Type:** String
- **Required:** ✅ YES (production)
- **Values:** `development` | `production` | `staging`
- **Set to:** `production` for live deployment

---

## 🌟 Highly Recommended Variables

### 3. VITE_GOOGLE_SHEET_URL
- **Type:** URL
- **Required:** ⭐ Recommended
- **Used for:** Cloud sync and data backup
- **Get from:** Google Apps Script deployment
- **Example:** `https://script.google.com/macros/s/AKfy.../exec`
- **Without it:** Data only stored locally

### 4. VITE_SENTRY_DSN
- **Type:** DSN URL
- **Required:** ⭐ Recommended
- **Used for:** Error tracking and monitoring
- **Get from:** https://sentry.io
- **Example:** `https://abc123@o123.ingest.sentry.io/456`
- **Benefit:** Real-time error alerts

### 5. VITE_GA_MEASUREMENT_ID
- **Type:** Tracking ID
- **Required:** ⭐ Recommended
- **Used for:** Usage analytics
- **Get from:** https://analytics.google.com
- **Example:** `G-ABC123XYZ`
- **Benefit:** User behavior insights

---

## 💡 Feature Flags

| Variable | Default | Description |
|----------|---------|-------------|
| `VITE_ENABLE_AI` | `true` | Enable/disable AI features |
| `VITE_ENABLE_SYNC` | `true` | Enable/disable Google Sheets sync |
| `VITE_DEBUG` | `false` | Enable debug logging |

---

## ⚡ Performance Settings

| Variable | Default | Description |
|----------|---------|-------------|
| `VITE_API_RATE_LIMIT` | `60` | API requests per minute |
| `VITE_SESSION_TIMEOUT` | `60` | Session timeout (minutes) |
| `VITE_SYNC_INTERVAL` | `30000` | Sync interval (milliseconds) |
| `VITE_APP_VERSION` | `1.0.0` | App version for cache control |

---

## 🔐 Security Notes

### VITE_ Prefix
- Variables with `VITE_` prefix are **exposed to client-side code**
- Use for non-sensitive configuration only
- Never use for API secrets (except API keys that must be client-side)

### Without VITE_ Prefix
- Available only during **build time**
- Not exposed to browser
- Use for server-side secrets

### Best Practices
- ✅ Use different keys for dev/staging/prod
- ✅ Rotate keys every 3-6 months
- ✅ Enable API key restrictions (domain, IP)
- ✅ Monitor API usage regularly
- ❌ Never commit `.env.local` or `.env.production`
- ❌ Never hardcode keys in source code
- ❌ Never share keys in public channels

---

## 📝 Files Overview

| File | Purpose | Commit to Git? |
|------|---------|----------------|
| `.env.example` | Template with all variables | ✅ YES |
| `.env.local` | Local development config | ❌ NO |
| `.env.production.example` | Production template | ✅ YES |
| `.env.production` | Production secrets | ❌ NO |
| `PRODUCTION_SETUP.md` | Deployment guide | ✅ YES |
| `ENV_VARIABLES.md` | This reference | ✅ YES |

---

## 🚨 Troubleshooting

### "API Key not found" error
```bash
# Check if variable is set
echo $GEMINI_API_KEY  # Linux/Mac
echo %GEMINI_API_KEY% # Windows CMD
$env:GEMINI_API_KEY   # Windows PowerShell

# Verify in code (browser console)
console.log(process.env.GEMINI_API_KEY)
```

### Variables not loading
1. Check file name is `.env.local` (with dot prefix)
2. Restart dev server after changing `.env` files
3. Clear browser cache
4. Check for typos in variable names (case-sensitive)

### Production variables not working
1. Verify variables are set in hosting platform
2. Redeploy after changing variables
3. Check platform-specific variable syntax
4. Use platform's logs to debug

---

## 📱 Platform-Specific Syntax

### Vercel
```bash
# Dashboard or CLI
vercel env add GEMINI_API_KEY
```

### Netlify
```bash
# Dashboard or CLI
netlify env:set GEMINI_API_KEY "your_key"
```

### Docker
```bash
# .env file or docker run
docker run -e GEMINI_API_KEY=your_key app
```

### GitHub Actions
```yaml
env:
  GEMINI_API_KEY: ${{ secrets.GEMINI_API_KEY }}
```

---

## 📞 Need Help?

1. Check [README.md](README.md) for setup instructions
2. Review [PRODUCTION_SETUP.md](PRODUCTION_SETUP.md) for deployment
3. Search existing issues on GitHub
4. Create new issue with:
   - Platform you're using
   - Error messages (without sensitive data)
   - Steps already tried

---

**Last Updated:** November 19, 2025
