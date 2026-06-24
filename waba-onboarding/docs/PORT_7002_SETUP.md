# Quick Setup Guide - Port 7002

## Backend Server Configuration

Your backend will run on **port 7002**.

### Local Development

1. **Start backend:**
   ```bash
   cd backend
   npm install
   npm run dev
   ```
   Server runs at: `http://localhost:7002`

2. **Test health check:**
   ```bash
   curl http://localhost:7002/api/health
   ```
   Should return: `{"status":"ok","message":"Backend server is running"}`

### Production Deployment

If hosting backend on the same server as frontend (nxt05.optigoapps.com):

1. **Backend URL**: `https://nxt05.optigoapps.com:7002`
2. **Update frontend .env.production:**
   ```env
   REACT_APP_BACKEND_URL=https://nxt05.optigoapps.com:7002
   ```

### Nginx Configuration (If using Nginx)

If you're using Nginx as a reverse proxy, add this to your config:

```nginx
# Backend API proxy
location /api/ {
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
```

Then your frontend can use: `https://nxt05.optigoapps.com/api/exchange-token`

### Firewall Configuration

Make sure port 7002 is open:

**Ubuntu/Debian:**
```bash
sudo ufw allow 7002
sudo ufw reload
```

**CentOS/RHEL:**
```bash
sudo firewall-cmd --permanent --add-port=7002/tcp
sudo firewall-cmd --reload
```

### PM2 Configuration (Production)

Run backend with PM2:

```bash
cd backend
npm install -g pm2
pm2 start server.js --name whatsapp-backend
pm2 save
pm2 startup
```

Check status:
```bash
pm2 status
pm2 logs whatsapp-backend
```

### Environment Variables

**Backend (.env):**
```env
FB_APP_ID=833458239205319
FB_APP_SECRET=your_app_secret_here
REDIRECT_URI=https://nxt05.optigoapps.com
ALLOWED_ORIGINS=https://nxt05.optigoapps.com,http://localhost:3000
PORT=7002
```

**Frontend (.env.production):**
```env
REACT_APP_BACKEND_URL=https://nxt05.optigoapps.com:7002
# Or if using Nginx proxy:
# REACT_APP_BACKEND_URL=https://nxt05.optigoapps.com
```

### Testing

1. **Local test:**
   ```bash
   curl http://localhost:7002/api/health
   ```

2. **Production test:**
   ```bash
   curl https://nxt05.optigoapps.com:7002/api/health
   ```

3. **Token exchange test:**
   ```bash
   curl -X POST http://localhost:7002/api/exchange-token \
     -H "Content-Type: application/json" \
     -d '{"code":"test_code"}'
   ```

### Troubleshooting

| Issue | Solution |
|-------|----------|
| Port already in use | Kill process: `lsof -ti:7002 \| xargs kill -9` |
| Connection refused | Check if backend is running: `pm2 status` |
| CORS error | Verify ALLOWED_ORIGINS includes your domain |
| 502 Bad Gateway | Backend not running or wrong port in Nginx config |

### Quick Commands

```bash
# Start backend
cd backend && npm run dev

# Check if port is in use
lsof -i :7002

# Kill process on port 7002
lsof -ti:7002 | xargs kill -9

# View backend logs (PM2)
pm2 logs whatsapp-backend

# Restart backend (PM2)
pm2 restart whatsapp-backend
```

## Summary

- **Local Backend**: `http://localhost:7002`
- **Production Backend**: `https://nxt05.optigoapps.com:7002`
- **Health Check**: `/api/health`
- **Token Exchange**: `/api/exchange-token`
- **Frontend**: `https://nxt05.optigoapps.com`
