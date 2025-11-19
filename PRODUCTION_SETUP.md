# Production Environment Setup Guide

This guide helps you configure environment variables for production deployment of Invoicify Pro.

## 📋 Quick Setup Checklist

### Required Variables ✅
- [x] `GEMINI_API_KEY` - Google Gemini AI API key

### Highly Recommended Variables ⭐
- [ ] `VITE_GOOGLE_SHEET_URL` - Google Sheets backend URL for cloud backup
- [ ] `VITE_SENTRY_DSN` - Error tracking and monitoring
- [ ] `VITE_GA_MEASUREMENT_ID` - Google Analytics for usage tracking

### Optional Variables 💡
- [ ] Payment integration keys (Stripe, PayPal)
- [ ] Email service keys (SendGrid, SMTP)
- [ ] Cloud storage keys (AWS S3, Cloudinary)

---

## 🚀 Platform-Specific Configuration

### Vercel

1. Go to your project settings
2. Navigate to **Environment Variables**
3. Add the following:

```bash
GEMINI_API_KEY=your_actual_key_here
NODE_ENV=production
VITE_GOOGLE_SHEET_URL=your_sheets_url_here
VITE_SENTRY_DSN=your_sentry_dsn_here
VITE_GA_MEASUREMENT_ID=your_ga_id_here
```

4. Select environments: Production, Preview (optional), Development (optional)
5. Click **Save**

**CLI Method:**
```bash
vercel env add GEMINI_API_KEY
vercel env add VITE_GOOGLE_SHEET_URL
```

### Netlify

1. Go to **Site Settings** → **Environment Variables**
2. Click **Add a variable**
3. Add each variable:

```bash
Key: GEMINI_API_KEY
Value: your_actual_key_here
Scopes: All scopes or Production

Key: NODE_ENV
Value: production
Scopes: All scopes or Production

Key: VITE_GOOGLE_SHEET_URL
Value: your_sheets_url_here
Scopes: All scopes or Production
```

**CLI Method:**
```bash
netlify env:set GEMINI_API_KEY "your_key_here"
netlify env:set VITE_GOOGLE_SHEET_URL "your_url_here"
```

### GitHub Pages

Create `.env.production` in your repository (DO NOT commit sensitive keys):

```bash
# Build with environment variables
GEMINI_API_KEY=your_key npm run build

# Or use GitHub Secrets in Actions
# Settings → Secrets and variables → Actions → New repository secret
```

**GitHub Actions Workflow** (`.github/workflows/deploy.yml`):
```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: [main]

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Install and Build
        env:
          GEMINI_API_KEY: ${{ secrets.GEMINI_API_KEY }}
          VITE_GOOGLE_SHEET_URL: ${{ secrets.VITE_GOOGLE_SHEET_URL }}
          VITE_SENTRY_DSN: ${{ secrets.VITE_SENTRY_DSN }}
        run: |
          npm ci
          npm run build
      
      - name: Deploy
        uses: peaceiris/actions-gh-pages@v3
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          publish_dir: ./dist
```

### Docker

Create `.env.production` file (add to `.gitignore`):

```bash
GEMINI_API_KEY=your_key_here
NODE_ENV=production
VITE_GOOGLE_SHEET_URL=your_url_here
```

**Docker Compose** (`docker-compose.yml`):
```yaml
version: '3.8'

services:
  invoicify:
    build: .
    ports:
      - "80:80"
    environment:
      - NODE_ENV=production
    env_file:
      - .env.production
```

**Docker Run:**
```bash
docker run -d \
  -p 80:80 \
  -e GEMINI_API_KEY=your_key \
  -e VITE_GOOGLE_SHEET_URL=your_url \
  invoicify-pro
```

### AWS Amplify

1. Go to **App Settings** → **Environment variables**
2. Add variables:

```bash
GEMINI_API_KEY=your_key_here
NODE_ENV=production
VITE_GOOGLE_SHEET_URL=your_url_here
```

3. Redeploy your app

### Render

1. Go to your **Web Service** dashboard
2. Navigate to **Environment**
3. Add environment variables:

```bash
GEMINI_API_KEY=your_key_here
NODE_ENV=production
VITE_GOOGLE_SHEET_URL=your_url_here
```

4. Click **Save Changes** (auto-redeploys)

### Railway

1. Go to your **Project** → **Variables**
2. Click **New Variable**
3. Add:

```bash
GEMINI_API_KEY=your_key_here
NODE_ENV=production
VITE_GOOGLE_SHEET_URL=your_url_here
```

**CLI Method:**
```bash
railway variables set GEMINI_API_KEY=your_key
railway variables set VITE_GOOGLE_SHEET_URL=your_url
```

---

## 🔑 Getting API Keys

### Google Gemini AI API Key (Required)

1. Visit [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Sign in with your Google account
3. Click **Create API Key**
4. Copy the key and store it securely
5. Use it as `GEMINI_API_KEY`

**Free Tier:** 60 requests per minute

### Google Sheets Integration (Recommended)

1. Create a new Google Sheet
2. Go to **Extensions** → **Apps Script**
3. Paste your backend code from `backend/Code.gs`
4. Click **Deploy** → **New deployment**
5. Select type: **Web app**
6. Configure:
   - Execute as: **Me**
   - Who has access: **Anyone**
7. Click **Deploy** and copy the URL
8. Use it as `VITE_GOOGLE_SHEET_URL`

### Sentry (Error Monitoring)

1. Sign up at [sentry.io](https://sentry.io)
2. Create a new project
3. Select **React** as platform
4. Copy your DSN
5. Use it as `VITE_SENTRY_DSN`

**Implementation:**
```typescript
import * as Sentry from "@sentry/react";

Sentry.init({
  dsn: import.meta.env.VITE_SENTRY_DSN,
  environment: import.meta.env.MODE,
  tracesSampleRate: 1.0,
});
```

### Google Analytics 4

1. Go to [Google Analytics](https://analytics.google.com)
2. Create a new property
3. Set up a Data Stream for Web
4. Copy the Measurement ID (format: G-XXXXXXXXXX)
5. Use it as `VITE_GA_MEASUREMENT_ID`

**Implementation:**
```html
<!-- Add to index.html -->
<script async src="https://www.googletagmanager.com/gtag/js?id=G-XXXXXXXXXX"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'YOUR_MEASUREMENT_ID');
</script>
```

### Stripe (Optional - Payment Processing)

1. Sign up at [stripe.com](https://stripe.com)
2. Go to **Developers** → **API keys**
3. Copy **Publishable key** (starts with `pk_`)
4. Use it as `VITE_STRIPE_PUBLISHABLE_KEY`

### PayPal (Optional - Payment Processing)

1. Sign up at [PayPal Developer](https://developer.paypal.com)
2. Go to **My Apps & Credentials**
3. Create a new app
4. Copy **Client ID**
5. Use it as `VITE_PAYPAL_CLIENT_ID`

---

## 🔐 Security Best Practices

### DO ✅
- Use different API keys for development, staging, and production
- Rotate API keys regularly (every 3-6 months)
- Use environment-specific keys with minimal permissions
- Store secrets in your hosting platform's secure variable system
- Enable API key restrictions (IP whitelist, domain restrictions)
- Monitor API usage and set up alerts
- Use HTTPS in production
- Enable CORS properly

### DON'T ❌
- Commit `.env.local` or `.env.production` to version control
- Share API keys in public channels
- Use production keys in development
- Hardcode API keys in source code
- Use VITE_ prefix for server-side secrets (they're exposed to client)
- Give API keys more permissions than needed
- Ignore suspicious API usage patterns

---

## 📊 Monitoring & Validation

### Verify Environment Variables

Add this to your app during development:

```typescript
// services/config.ts
export const config = {
  geminiApiKey: import.meta.env.VITE_GEMINI_API_KEY || process.env.GEMINI_API_KEY,
  googleSheetUrl: import.meta.env.VITE_GOOGLE_SHEET_URL,
  environment: import.meta.env.MODE,
  isProduction: import.meta.env.PROD,
  isDevelopment: import.meta.env.DEV,
};

// Validate required variables
if (!config.geminiApiKey && config.isProduction) {
  console.error('CRITICAL: GEMINI_API_KEY is not set in production!');
}

export default config;
```

### Health Check Endpoint

Create a health check to verify services:

```typescript
// pages/HealthCheck.tsx (dev only)
export const HealthCheck = () => {
  const checks = {
    geminiKey: !!process.env.GEMINI_API_KEY,
    googleSheets: !!import.meta.env.VITE_GOOGLE_SHEET_URL,
    environment: import.meta.env.MODE,
  };

  return (
    <div className="p-4">
      <h2>Environment Health Check</h2>
      <pre>{JSON.stringify(checks, null, 2)}</pre>
    </div>
  );
};
```

---

## 🚨 Troubleshooting

### AI Features Not Working

**Problem:** "Error generating note" or AI features not responding

**Solution:**
1. Verify `GEMINI_API_KEY` is set correctly
2. Check API key permissions in Google AI Studio
3. Verify you haven't exceeded rate limits (60 req/min free tier)
4. Check browser console for error messages

### Google Sheets Sync Failing

**Problem:** Data not syncing to Google Sheets

**Solution:**
1. Verify `VITE_GOOGLE_SHEET_URL` is set
2. Check Apps Script deployment is accessible
3. Verify deployment permissions (Anyone can access)
4. Check CORS settings in Apps Script
5. Look for errors in browser network tab

### Build Failures

**Problem:** Build fails with environment variable errors

**Solution:**
1. Ensure all required variables are set in hosting platform
2. Check variable names match exactly (case-sensitive)
3. Verify no special characters need escaping
4. Clear build cache and rebuild

### Variables Not Updating

**Problem:** Changed variables but app still uses old values

**Solution:**
1. Redeploy your application
2. Clear browser cache
3. Use hard refresh (Ctrl+Shift+R or Cmd+Shift+R)
4. Check if variables are correctly set in hosting platform

---

## 📞 Support

For environment configuration issues:

1. Check the [README.md](README.md) for setup instructions
2. Review this guide for your specific platform
3. Check hosting platform documentation
4. Open an issue on GitHub with:
   - Platform you're deploying to
   - Error messages (without sensitive data)
   - Steps you've already tried

---

**Last Updated:** November 19, 2025
