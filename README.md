# Invoicify Pro

<div align="center">

**A Professional Invoice and Estimate Generator with Google Sheets Integration and AI-Powered Assistance**

[![React](https://img.shields.io/badge/React-19.2.0-blue.svg)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8.2-blue.svg)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-6.2.0-646CFF.svg)](https://vitejs.dev/)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)

</div>

---

## 📋 Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Prerequisites](#prerequisites)
- [Installation & Setup](#installation--setup)
- [Environment Configuration](#environment-configuration)
- [Development](#development)
- [Production Deployment](#production-deployment)
- [Google Sheets Integration](#google-sheets-integration)
- [AI Features](#ai-features)
- [Usage Guide](#usage-guide)
- [Architecture](#architecture)
- [Contributing](#contributing)
- [License](#license)

---

## 📚 Documentation

- **[ENV_VARIABLES.md](ENV_VARIABLES.md)** - Complete environment variables reference
- **[PRODUCTION_SETUP.md](PRODUCTION_SETUP.md)** - Production deployment guide
- **[.env.example](.env.example)** - Environment configuration template
- **[.env.production.example](.env.production.example)** - Production environment template

---

## 🎯 Overview

**Invoicify Pro** is a comprehensive business management application designed for freelancers, small businesses, and enterprises. It streamlines invoice generation, expense tracking, client management, and project oversight with seamless Google Sheets synchronization and AI-powered assistance.

### Key Highlights

- 📄 **Invoice & Estimate Management** - Create, edit, and track invoices and estimates
- 💰 **Expense Tracking** - Monitor business expenses with recurring expense support
- 👥 **Client Management** - Maintain detailed client records and history
- 📊 **Project Tracking** - Manage projects with status tracking and deadlines
- 👔 **Staff Management** - Handle employee records, work logs, and payroll
- ⏰ **Smart Reminders** - Automated follow-ups for invoices and renewals
- ☁️ **Cloud Sync** - Real-time Google Sheets integration for data backup
- 🤖 **AI Assistant** - Gemini AI integration for intelligent document generation
- 🌓 **Dark Mode** - Professional UI with light and dark themes
- 📱 **Responsive Design** - Works seamlessly on desktop, tablet, and mobile

---

## ✨ Features

### Invoice & Estimate Management
- Create professional invoices and estimates
- Customizable line items with quantity, rate, and amount
- Automatic calculations for subtotals, taxes, and discounts
- Multiple status tracking (draft, pending, paid, overdue)
- Invoice preview and PDF generation
- Recurring invoice support with renewal dates
- Automatic follow-up reminders

### Financial Management
- Comprehensive expense tracking
- Recurring expense management
- Category-based organization
- Receipt attachment support
- Real-time financial dashboard
- Revenue and expense analytics
- Monthly/yearly financial reports

### Client & Project Management
- Detailed client profiles with contact information
- Client history and transaction tracking
- Project management with status tracking
- Deadline monitoring
- Budget tracking
- Client-project relationship management

### Staff & Payroll
- Employee database management
- Staff categorization (full-time, part-time, contract)
- Work log tracking
- Hourly rate and salary management
- Payroll run generation
- Bank details and payment information
- Staff photo and document management

### Data Synchronization
- Real-time Google Sheets integration
- Automatic data backup
- Bi-directional sync (local ↔ cloud)
- Offline-first architecture with sync on reconnection
- Conflict resolution and data integrity

### AI Integration
- Gemini AI-powered document generation
- Intelligent invoice creation from descriptions
- Automated line item suggestions
- Smart categorization
- Natural language processing for data entry

---

## 🛠 Tech Stack

### Frontend
- **React 19.2.0** - UI library with latest features
- **TypeScript 5.8.2** - Type-safe development
- **React Router DOM 7.9.6** - Client-side routing
- **Vite 6.2.0** - Fast build tool and dev server
- **Lucide React 0.554.0** - Modern icon library
- **Recharts 3.4.1** - Data visualization and charts
- **date-fns 4.1.0** - Date manipulation and formatting

### Backend Integration
- **Google Apps Script** - Google Sheets backend API
- **Google Gemini AI 1.30.0** - AI-powered assistance

### Development Tools
- **@vitejs/plugin-react** - Fast Refresh and JSX support
- **@types/node** - Node.js type definitions
- **PostCSS/Tailwind** - Utility-first CSS (implied by styling patterns)

### Storage & State Management
- **LocalStorage** - Client-side data persistence
- **Context API** - Global state management (Toast, Sync)
- **In-memory caching** - Performance optimization

---

## 📁 Project Structure

```
invoicify-pro/
├── backend/
│   └── Code.gs                 # Google Apps Script backend
├── components/
│   ├── InvoicePreview.tsx      # Invoice/estimate preview component
│   ├── LoadingOverlay.tsx      # Global loading indicator
│   ├── PaySlipPreview.tsx      # Payroll slip preview
│   └── Sidebar.tsx             # Navigation sidebar
├── context/
│   ├── SyncContext.tsx         # Sync state management
│   └── ToastContext.tsx        # Toast notification system
├── pages/
│   ├── BackendCode.tsx         # Backend code viewer/setup
│   ├── ClientList.tsx          # Client management
│   ├── Dashboard.tsx           # Analytics dashboard
│   ├── ExpenseTracker.tsx      # Expense management
│   ├── InvoiceEditor.tsx       # Invoice/estimate editor
│   ├── InvoiceList.tsx         # Invoice/estimate list
│   ├── ProjectList.tsx         # Project management
│   ├── ReminderList.tsx        # Reminder management
│   ├── Settings.tsx            # App settings and configuration
│   └── StaffList.tsx           # Staff and payroll management
├── services/
│   ├── dataService.ts          # Data operations and sync logic
│   └── geminiService.ts        # AI integration service
├── App.tsx                     # Root application component
├── index.html                  # HTML entry point
├── index.tsx                   # React entry point
├── metadata.json               # App metadata
├── package.json                # Dependencies and scripts
├── README.md                   # Project documentation
├── tsconfig.json               # TypeScript configuration
├── types.ts                    # TypeScript type definitions
└── vite.config.ts              # Vite configuration
```

---

## 📋 Prerequisites

Before setting up Invoicify Pro, ensure you have:

- **Node.js** (v18.x or higher) - [Download](https://nodejs.org/)
- **npm** (v9.x or higher) or **yarn** (v1.22.x or higher)
- **Git** - For version control
- **Google Account** - For Sheets integration (optional)
- **Gemini API Key** - For AI features (optional)
- **Modern Web Browser** - Chrome, Firefox, Safari, or Edge

---

## 🚀 Installation & Setup

### 1. Clone the Repository

```bash
git clone https://github.com/yourusername/invoicify-pro.git
cd invoicify-pro
```

### 2. Install Dependencies

```bash
npm install
```

Or using yarn:

```bash
yarn install
```

### 3. Environment Configuration
### 3. Environment Configuration

Create a `.env.local` file in the root directory:

```bash
# Copy the example file
cp .env.example .env.local

# Or on Windows
copy .env.example .env.local
```

**Required: Add your Gemini API Key**

Edit `.env.local` and add:

```env
# REQUIRED: Google Gemini AI API Key
GEMINI_API_KEY=your_actual_api_key_here
```

**To get a Gemini API Key:**
1. Visit [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Sign in with your Google account
3. Create a new API key
4. Copy and paste it into your `.env.local` file

> 📖 **Need help with environment variables?** See [ENV_VARIABLES.md](ENV_VARIABLES.md) for complete documentation

### 4. Start Development Server

```bash
npm run dev
```

The application will be available at `http://localhost:3000`

---

## 🌍 Environment Configuration

### Quick Reference

| Variable | Description | Required | Default |
|----------|-------------|----------|---------|
| `GEMINI_API_KEY` | Google Gemini AI API key | **YES** | - |
| `VITE_GOOGLE_SHEET_URL` | Google Sheets sync URL | Recommended | - |
| `VITE_PORT` | Development server port | No | 3000 |
| `VITE_HOST` | Development server host | No | 0.0.0.0 |

### Complete Documentation

- **[ENV_VARIABLES.md](ENV_VARIABLES.md)** - All variables explained with examples
- **[PRODUCTION_SETUP.md](PRODUCTION_SETUP.md)** - Platform-specific deployment guides
- **[.env.example](.env.example)** - Development template
- **[.env.production.example](.env.production.example)** - Production template

### Build-time Configuration

The `vite.config.ts` file handles environment variable injection:

```typescript
define: {
  'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
  'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
}
```

---

## 💻 Development

### Available Scripts

```bash
# Start development server with hot reload
npm run dev

# Build for production
npm run build

# Preview production build locally
npm run preview
```

### Development Workflow

1. **Start the dev server**: `npm run dev`
2. **Access the app**: Navigate to `http://localhost:3000`
3. **Make changes**: Files are watched and hot-reloaded
4. **Test features**: Use the built-in data service with LocalStorage
5. **Configure settings**: Go to Settings page to customize the app

### Code Quality

- Use **TypeScript** for type safety
- Follow **React best practices** and hooks patterns
- Use **functional components** with hooks
- Implement **error boundaries** for production
- Write **clean, documented code**

---

## 🚀 Production Deployment

### Building for Production

```bash
npm run build
```

This creates an optimized build in the `dist/` directory with:
- Minified JavaScript and CSS
- Code splitting for optimal loading
- Asset optimization
- Source maps for debugging

### Deployment Options

#### 1. Static Hosting (Recommended)

**Vercel** (Recommended):
```bash
npm install -g vercel
vercel --prod
```

**Netlify**:
```bash
npm install -g netlify-cli
netlify deploy --prod --dir=dist
```

**GitHub Pages**:
```bash
npm run build
# Configure vite.config.ts with base: '/repo-name/'
# Push dist/ to gh-pages branch
```

#### 2. Docker Deployment

Create `Dockerfile`:

```dockerfile
# Build stage
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Production stage
FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/nginx.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

Create `nginx.conf`:

```nginx
server {
    listen 80;
    server_name _;
    root /usr/share/nginx/html;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    # Enable gzip compression
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;
}
```

Build and run:

```bash
docker build -t invoicify-pro .
docker run -p 80:80 invoicify-pro
```

#### 3. Cloud Platform Deployment

**AWS S3 + CloudFront**:
```bash
npm run build
aws s3 sync dist/ s3://your-bucket-name
aws cloudfront create-invalidation --distribution-id YOUR_DIST_ID --paths "/*"
```

**Google Cloud Storage**:
```bash
npm run build
gsutil -m rsync -r dist/ gs://your-bucket-name
```

### Production Environment Variables

Set these in your hosting platform:

```env
GEMINI_API_KEY=your_production_api_key
NODE_ENV=production
```

### Performance Optimization

1. **Enable CDN** for static assets
2. **Configure caching headers** for optimal performance
3. **Enable HTTPS** for secure connections
4. **Set up monitoring** (Sentry, LogRocket, etc.)
5. **Configure CSP headers** for security

### Security Checklist

- ✅ Use HTTPS in production
- ✅ Sanitize user inputs
- ✅ Validate API keys server-side (if using backend)
- ✅ Implement rate limiting
- ✅ Enable CORS properly
- ✅ Keep dependencies updated
- ✅ Use environment variables for secrets

---

## 📊 Google Sheets Integration

### Setup Guide

#### 1. Create Google Sheet

1. Create a new Google Sheet
2. Name it "Invoicify Pro Data" (or any name)
3. Copy the Sheet URL

#### 2. Deploy Apps Script

1. Open your Google Sheet
2. Go to **Extensions** → **Apps Script**
3. Delete any existing code
4. Copy the contents from `backend/Code.gs` (when available)
5. Deploy as Web App:
   - Click **Deploy** → **New deployment**
   - Select type: **Web app**
   - Execute as: **Me**
   - Who has access: **Anyone**
   - Click **Deploy**
6. Copy the Web App URL

#### 3. Configure in App

1. Open Invoicify Pro
2. Go to **Settings**
3. Paste the Web App URL in **Google Sheet URL** field
4. Click **Save Settings**
5. Test sync by creating an invoice

### Sync Behavior

- **Auto-sync**: Enabled by default on data changes
- **Manual sync**: Click sync button in any list view
- **Offline mode**: Data stored locally until connection restored
- **Conflict resolution**: Latest timestamp wins

### Sheet Structure

The backend creates these sheets automatically:
- `Invoices` - Invoice and estimate records
- `Expenses` - Expense tracking
- `Clients` - Client database
- `Projects` - Project information
- `Reminders` - Reminder records
- `Staff` - Employee records
- `WorkLogs` - Staff work hour logs
- `Payroll` - Payroll run history

---

## 🤖 AI Features

### Gemini Integration

Invoicify Pro uses Google's Gemini AI for:

1. **Intelligent Invoice Generation**
   - Natural language input for invoice creation
   - Automatic line item extraction
   - Smart categorization

2. **Content Suggestions**
   - Invoice descriptions
   - Project summaries
   - Email templates

3. **Data Analysis**
   - Expense categorization
   - Spending pattern insights
   - Revenue forecasting

### Using AI Features

1. Ensure `GEMINI_API_KEY` is set in `.env`
2. Look for AI-powered buttons in the UI (sparkle icon ✨)
3. Input natural language descriptions
4. Review and edit AI-generated content

---

## 📖 Usage Guide

### Creating Your First Invoice

1. **Navigate to Create**: Click "Create Invoice" from sidebar
2. **Select Type**: Choose Invoice or Estimate
3. **Fill Client Details**: Enter client name, email, address
4. **Add Line Items**: Add services/products with quantities and rates
5. **Configure Options**: Set tax rate, discount, due date
6. **Enable Follow-ups**: Optionally enable renewal or follow-up reminders
7. **Save**: Click "Create Invoice"

### Managing Expenses

1. Go to **Expenses** page
2. Click **Add Expense**
3. Enter date, category, amount, and description
4. Optional: Mark as recurring and set frequency
5. Click **Save**

### Client Management

1. Navigate to **Clients**
2. Click **Add Client**
3. Fill in client information
4. Click **Save**
5. View client history by clicking on client name

### Project Tracking

1. Go to **Projects**
2. Click **Add Project**
3. Enter project details and link to client
4. Set deadline and budget
5. Update status as project progresses

### Staff & Payroll

1. Navigate to **Staff**
2. Add staff members with employment details
3. Log work hours in work logs
4. Generate payroll runs for payment processing
5. Export payslips for records

---

## 🏗 Architecture

### Design Patterns

- **Component-Based Architecture**: Modular React components
- **Context API**: Global state management for sync and notifications
- **Service Layer**: Abstracted data operations in `dataService.ts`
- **Offline-First**: LocalStorage as primary data source
- **Progressive Enhancement**: Features work without external services

### Data Flow

```
User Interface (React)
       ↓
Context Providers (Toast, Sync)
       ↓
Service Layer (dataService.ts)
       ↓
    ┌──────┴──────┐
    ↓             ↓
LocalStorage   Google Sheets
(Primary)      (Sync/Backup)
```

### State Management

- **Local State**: React `useState` for component state
- **Global State**: Context API for sync status and toasts
- **Persistent State**: LocalStorage with in-memory caching
- **Remote State**: Google Sheets as backup/sync source

---

## 🤝 Contributing

Contributions are welcome! Please follow these guidelines:

### Development Process

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

### Code Standards

- Follow TypeScript best practices
- Use meaningful variable and function names
- Add comments for complex logic
- Update documentation for new features
- Test thoroughly before submitting

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- React team for the amazing framework
- Google for Gemini AI and Apps Script
- Lucide for beautiful icons
- Recharts for data visualization
- All open-source contributors

---

## 📞 Support

For issues, questions, or suggestions:

- 🐛 [Report a bug](https://github.com/yourusername/invoicify-pro/issues)
- 💡 [Request a feature](https://github.com/yourusername/invoicify-pro/issues)
- 📧 Email: support@invoicifypro.com

---

<div align="center">

**Made with ❤️ by the Invoicify Pro Team**

⭐ Star us on GitHub if you find this project useful!

</div>