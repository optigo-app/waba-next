# nxt06.optigoapps.com Setup Summary

## ✅ Configuration Updated

All files have been updated to use **nxt06.optigoapps.com** instead of nxt05.

## Changed Files

### 1. Frontend Configuration (`.env`)
```env
REACT_APP_BACKEND_URL=https://nxt06.optigoapps.com:7002
```

### 2. Backend Configuration (`backend/.env.example`)
```env
REDIRECT_URI=https://nxt06.optigoapps.com
ALLOWED_ORIGINS=https://nxt06.optigoapps.com,http://localhost:3000
```

## Next Steps

### For Local Development (Testing)

1. **Update backend/.env:**
```bash
cd backend
cp .env.example .env
# Edit .env with your actual values
```

2. **Restart backend:**
```bash
cd backend
pm2 restart whatsapp-backend
# or
node server.js
```

3. **Restart frontend:**
```bash
npm start
```

### For Production Deployment

Follow the complete guide: `DEPLOY_NXT06.md`

**Quick steps:**
1. Upload backend to server
2. Install dependencies: `npm install`
3. Create production `.env` file
4. Start backend with PM2 or systemd
5. Configure Nginx for port 7002
6. Build frontend: `npm run build`
7. Upload build to server
8. Configure Nginx for frontend

## Important: Update Facebook App

Go to Facebook Developer Console and update:
- **Redirect URI**: `https://nxt06.optigoapps.com`
- **Allowed Domains**: `nxt06.optigoapps.com`

## URLs

- **Frontend**: https://nxt06.optigoapps.com
- **Backend**: https://nxt06.optigoapps.com:7002
- **Health Check**: https://nxt06.optigoapps.com:7002/api/health

## Testing

After deployment, test:
```bash
# Test backend
curl https://nxt06.optigoapps.com:7002/api/health

# Should return:
# {"status":"ok","message":"Backend server is running","database":"connected"}
```

## Files to Update on Server

1. `backend/.env` - Production environment variables
2. Nginx configuration - Add backend proxy on port 7002
3. SSL certificates - Ensure valid for nxt06.optigoapps.com

## Security Reminders

- Generate strong JWT_SECRET
- Keep FB_APP_SECRET secure
- Enable HTTPS for both frontend and backend
- Set up database backups
- Configure firewall to allow port 7002

## Support

See `DEPLOY_NXT06.md` for complete deployment instructions and troubleshooting.
