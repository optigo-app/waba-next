# Deployment Guide for nxt06.optigoapps.com

## Overview
This guide will help you deploy the WhatsApp Business API Manager to nxt06.optigoapps.com with backend database support.

## Architecture
- **Frontend**: https://nxt06.optigoapps.com (React app)
- **Backend**: https://nxt06.optigoapps.com:7002 (Express.js + SQLite)

## Prerequisites
- Server access to nxt06.optigoapps.com
- Node.js installed on server
- SSL certificate for HTTPS
- Facebook App configured

## Step 1: Update Facebook App Settings

1. Go to: https://developers.facebook.com/apps/833458239205319
2. Update **Redirect URIs** to include:
   - `https://nxt06.optigoapps.com`
3. Update **Allowed Domains** to include:
   - `nxt06.optigoapps.com`

## Step 2: Backend Deployment

### 2.1 Upload Backend Files
Upload the `backend` folder to your server:
```bash
/var/www/whatsapp/backend/
```

### 2.2 Install Dependencies
```bash
cd /var/www/whatsapp/backend
npm install
```

### 2.3 Create Production .env File
```bash
cd /var/www/whatsapp/backend
cp .env.example .env
nano .env
```

Edit with your production values:
```env
FB_APP_ID=833458239205319
FB_APP_SECRET=your_actual_app_secret_here
JWT_SECRET=generate_a_secure_random_string_here
PORT=7002
REDIRECT_URI=https://nxt06.optigoapps.com
ALLOWED_ORIGINS=https://nxt06.optigoapps.com
```

**Generate JWT Secret:**
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### 2.4 Start Backend Server

**Option A: Using PM2 (Recommended)**
```bash
npm install -g pm2
pm2 start server.js --name whatsapp-backend
pm2 save
pm2 startup
```

**Option B: Using systemd**
Create `/etc/systemd/system/whatsapp-backend.service`:
```ini
[Unit]
Description=WhatsApp Backend API
After=network.target

[Service]
Type=simple
User=www-data
WorkingDirectory=/var/www/whatsapp/backend
ExecStart=/usr/bin/node server.js
Restart=always
Environment=NODE_ENV=production

[Install]
WantedBy=multi-user.target
```

Start the service:
```bash
sudo systemctl enable whatsapp-backend
sudo systemctl start whatsapp-backend
sudo systemctl status whatsapp-backend
```

### 2.5 Configure Nginx for Backend

Add to your Nginx configuration:
```nginx
# Backend API
server {
    listen 7002 ssl http2;
    server_name nxt06.optigoapps.com;

    ssl_certificate /path/to/ssl/certificate.crt;
    ssl_certificate_key /path/to/ssl/private.key;

    location / {
        proxy_pass http://localhost:7002;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

Restart Nginx:
```bash
sudo nginx -t
sudo systemctl restart nginx
```

### 2.6 Open Firewall Port
```bash
sudo ufw allow 7002/tcp
```

## Step 3: Frontend Deployment

### 3.1 Build Frontend
On your local machine:
```bash
npm run build
```

### 3.2 Upload Build Files
Upload the `build` folder contents to:
```bash
/var/www/nxt06.optigoapps.com/
```

### 3.3 Configure Nginx for Frontend

```nginx
server {
    listen 80;
    listen 443 ssl http2;
    server_name nxt06.optigoapps.com;

    ssl_certificate /path/to/ssl/certificate.crt;
    ssl_certificate_key /path/to/ssl/private.key;

    root /var/www/nxt06.optigoapps.com;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    # Cache static assets
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

Restart Nginx:
```bash
sudo nginx -t
sudo systemctl restart nginx
```

## Step 4: Test Deployment

### 4.1 Test Backend
```bash
curl https://nxt06.optigoapps.com:7002/api/health
```

Expected response:
```json
{
  "status": "ok",
  "message": "Backend server is running",
  "database": "connected"
}
```

### 4.2 Test Frontend
Open browser: https://nxt06.optigoapps.com

You should see the login/register page.

### 4.3 Test Full Flow
1. Register a new account
2. Login
3. Go to Signup tab
4. Click "Login with Facebook"
5. Complete WhatsApp signup
6. Verify account is saved

## Step 5: Database Backup

### 5.1 Manual Backup
```bash
cd /var/www/whatsapp/backend
cp whatsapp.db whatsapp.db.backup-$(date +%Y%m%d)
```

### 5.2 Automated Daily Backup
Create `/etc/cron.daily/backup-whatsapp-db`:
```bash
#!/bin/bash
cd /var/www/whatsapp/backend
cp whatsapp.db /backups/whatsapp.db.$(date +%Y%m%d)
# Keep only last 30 days
find /backups -name "whatsapp.db.*" -mtime +30 -delete
```

Make it executable:
```bash
sudo chmod +x /etc/cron.daily/backup-whatsapp-db
```

## Step 6: Monitoring

### 6.1 Check Backend Logs
**PM2:**
```bash
pm2 logs whatsapp-backend
```

**systemd:**
```bash
sudo journalctl -u whatsapp-backend -f
```

### 6.2 Check Backend Status
**PM2:**
```bash
pm2 status
```

**systemd:**
```bash
sudo systemctl status whatsapp-backend
```

## Troubleshooting

### Backend won't start
```bash
# Check logs
pm2 logs whatsapp-backend --lines 100

# Check if port is in use
sudo netstat -tulpn | grep 7002

# Restart backend
pm2 restart whatsapp-backend
```

### CORS errors
- Verify ALLOWED_ORIGINS in backend/.env includes nxt06.optigoapps.com
- Restart backend after changing .env

### Database errors
```bash
# Check database file permissions
ls -la /var/www/whatsapp/backend/whatsapp.db

# Fix permissions if needed
sudo chown www-data:www-data /var/www/whatsapp/backend/whatsapp.db
```

### SSL certificate issues
```bash
# Test SSL
openssl s_client -connect nxt06.optigoapps.com:7002

# Renew Let's Encrypt certificate
sudo certbot renew
```

## Security Checklist

- ✅ Strong JWT_SECRET generated
- ✅ FB_APP_SECRET kept secure
- ✅ HTTPS enabled for both frontend and backend
- ✅ Firewall configured
- ✅ Database backups enabled
- ✅ CORS properly configured
- ✅ .env file not committed to git
- ✅ File permissions set correctly

## Maintenance

### Update Application
```bash
# Backup database first
cd /var/www/whatsapp/backend
cp whatsapp.db whatsapp.db.backup

# Pull latest code
git pull

# Update backend
cd backend
npm install
pm2 restart whatsapp-backend

# Update frontend
npm run build
# Upload new build files
```

### View Database
```bash
cd /var/www/whatsapp/backend
node view-db.js
```

## Support

For issues:
1. Check backend logs
2. Check Nginx error logs: `sudo tail -f /var/log/nginx/error.log`
3. Verify all environment variables are set
4. Test backend health endpoint
5. Check database file exists and has correct permissions

## Summary

Your deployment should now be:
- ✅ Frontend: https://nxt06.optigoapps.com
- ✅ Backend: https://nxt06.optigoapps.com:7002
- ✅ Database: SQLite with automatic backups
- ✅ SSL: Enabled on both
- ✅ Monitoring: PM2 or systemd

Users can now access the app from anywhere and their accounts will be stored securely in the backend database!
