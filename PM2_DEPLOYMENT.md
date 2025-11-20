# PM2 Production Deployment Guide

This guide explains how to deploy the Invoicify Pro application using PM2 on a production server.

## Prerequisites

1. **Node.js** (v16+ recommended)
2. **PM2** globally installed: `npm install -g pm2`
3. **Git** (for cloning the repository)

## Deployment Steps

### 1. Clone and Setup
```bash
# Clone the repository
git clone https://github.com/salmankavanur/invoicify-pro.git
cd invoicify-pro

# Install dependencies
npm install

# Build the application
npm run build
```

### 2. Configure Environment
Create a `.env` file in the project root with your environment variables:
```bash
GEMINI_API_KEY=your_gemini_api_key_here
VITE_PORT=5004
VITE_HOST=0.0.0.0
NODE_ENV=production
```

### 3. Update PM2 Config
The PM2 config is already set for your server path: `/home/digibayt.com/crm/invoicify-pro`
If you need to change it, edit `ecosystem.config.cjs` and update the `cwd` path.

### 4. Deploy with PM2

#### Start the application
```bash
npm run pm2:start
```

#### Or use PM2 directly
```bash
pm2 start ecosystem.config.cjs --env production
```

### 5. Useful PM2 Commands

```bash
# Check application status
npm run pm2:status

# View logs
npm run pm2:logs

# Restart application
npm run pm2:restart

# Stop application
npm run pm2:stop

# Delete application from PM2
npm run pm2:delete
```

## Configuration Details

### PM2 Ecosystem Config Features:
- **Port**: Application runs on port 5004
- **Host**: Binds to 0.0.0.0 (accessible from all interfaces)
- **Auto-restart**: Automatically restarts on crashes
- **Memory limit**: Restarts if memory usage exceeds 1GB
- **Logging**: Separate error, output, and combined logs
- **Build automation**: Automatically builds the app before starting

### File Locations:
- **Config**: `ecosystem.config.cjs`
- **Logs**: `./logs/` directory
- **Build output**: `./dist/` directory

## Production Checklist

- [ ] Environment variables configured
- [ ] PM2 installed globally
- [ ] Application built successfully
- [ ] Firewall allows port 5004
- [ ] PM2 config path updated
- [ ] Log directory exists
- [ ] Application accessible at http://your-server:5004

## Auto-start on Server Reboot

To make the application start automatically when the server reboots:

```bash
# Save current PM2 processes
pm2 save

# Generate startup script
pm2 startup

# Follow the instructions provided by the startup command
```

## Monitoring

Monitor your application with:
```bash
# Real-time monitoring
pm2 monit

# Web-based monitoring (optional)
pm2 install pm2-server-monit
```

## Troubleshooting

1. **Blocked request/Host not allowed**: The domain is already configured in `vite.config.ts` for `crm.digibayt.com`
2. **Port already in use**: Change port in ecosystem.config.cjs
3. **Permission denied**: Run with appropriate user permissions
4. **Build fails**: Check Node.js version and dependencies
5. **Can't access externally**: Check firewall settings

### If you get "Host not allowed" errors:
The Vite config already includes your domain `crm.digibayt.com` in the allowed hosts. If you need to add more domains:
1. Edit `vite.config.ts` 
2. Add domains to the `preview.allowedHosts` array
3. Rebuild: `npm run build`
4. Restart PM2: `pm2 restart invoicify-pro`

For more help, check the logs:
```bash
pm2 logs invoicify-pro
```