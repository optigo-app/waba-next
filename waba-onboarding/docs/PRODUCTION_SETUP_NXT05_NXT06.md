# Production Setup: nxt05 + nxt06

## Current Configuration

- **Frontend**: https://nxt05.optigoapps.com
- **Backend**: https://nxt06.optigoapps.com:7002

## ✅ Configuration Files Updated

### Frontend (.env)
```env
REACT_APP_BACKEND_URL=https://nxt06.optigoapps.com:7002
```

### Backend (backend/.env)
```env
FB_APP_ID=833458239205319
FB_APP_SECRET=0a8f214075bc51fed93f3dde0ebd1a12
JWT_SECRET=5217e5c82fa567c53d4457620f171f22d7f04bc5a836d349793e741fc7f636b5
REDIRECT_URI=https://nxt05.optigoapps.com
PORT=7002
ALLOWED_ORIGINS=https://nxt05.optigoapps.com,https://nxt06.optigoapps.com,http://localhost:3000
```

## 🔧 Steps to Fix Login Issue

### 1. Update Facebook App Settings

Go to: https://developers.facebook.com/apps/833458239205319

**Settings → Basic:**
- Add domain: `nxt05.optigoapps.com`
- Add domain: `nxt06.optigoapps.com`

**WhatsApp → Configuration:**
- Callback URL: `https://nxt05.optigoapps.com`
- Webhook URL: `https://nxt06.optigoapps.com:7002/webhook` (if needed)

**App Domains:**
- Add: `nxt05.optigoapps.com`
- Add: `nxt06.optigoapps.com`

### 2. Restart Backend Server

On nxt06.optigoapps.com:
```bash
cd /path/to/backend
pm2 restart whatsapp-backend
# or
sudo systemctl restart whatsapp-backend
```

### 3. Rebuild & Redeploy Frontend

On your local machine:
```bash
npm run build
```

Upload `build/` folder contents to nxt05.optigoapps.com

### 4. Check Backend is Running

Test backend health:
```bash
curl https://nxt06.optigoapps.com:7002/api/health
```

Should return:
```json
{
  "status": "ok",
  "message": "Backend server is running",
  "database": "connected"
}
```

### 5. Check CORS Configuration

Make sure Nginx on nxt06 allows CORS from nxt05:

```nginx
# In your Nginx config for port 7002
add_header 'Access-Control-Allow-Origin' 'https://nxt05.optigoapps.com' always;
add_header 'Access-Control-Allow-Methods' 'GET, POST, PUT, DELETE, OPTIONS' always;
add_header 'Access-Control-Allow-Headers' 'Authorization, Content-Type' always;
add_header 'Access-Control-Allow-Credentials' 'true' always;
```

Or let Express handle CORS (already configured in server.js)

### 6. Check SSL Certificates

Both domains need valid SSL certificates:
```bash
# Check nxt05
curl -I https://nxt05.optigoapps.com

# Check nxt06
curl -I https://nxt06.optigoapps.com:7002
```

### 7. Open Firewall Port

On nxt06 server:
```bash
sudo ufw allow 7002/tcp
sudo ufw status
```

### 8. Test Login Flow

1. Open: https://nxt05.optigoapps.com
2. Click "Register"
3. Fill in details
4. Click "Create Account"
5. Check browser console for errors

## 🐛 Troubleshooting

### "Failed to fetch" Error

**Check 1: Backend is running**
```bash
curl https://nxt06.optigoapps.com:7002/api/health
```

**Check 2: CORS is configured**
```bash
curl -H "Origin: https://nxt05.optigoapps.com" \
     -H "Access-Control-Request-Method: POST" \
     -H "Access-Control-Request-Headers: Content-Type" \
     -X OPTIONS \
     https://nxt06.optigoapps.com:7002/api/auth/login
```

Should return CORS headers.

**Check 3: Frontend is using correct URL**
- Open browser DevTools → Network tab
- Try to login
- Check the request URL (should be https://nxt06.optigoapps.com:7002)

### CORS Error

If you see CORS error in browser console:

1. Verify `ALLOWED_ORIGINS` in backend/.env includes nxt05
2. Restart backend server
3. Clear browser cache

### SSL Certificate Error

If you see SSL error:

1. Verify both domains have valid SSL certificates
2. Check certificate includes port 7002 for nxt06
3. Renew certificates if expired

### Database Connection Error

If backend can't connect to database:

1. Check database file exists: `backend/whatsapp.db`
2. Check file permissions
3. Check backend logs

## 📋 Quick Checklist

- [ ] Backend .env updated with nxt05 in ALLOWED_ORIGINS
- [ ] Backend .env has REDIRECT_URI=https://nxt05.optigoapps.com
- [ ] Frontend .env has REACT_APP_BACKEND_URL=https://nxt06.optigoapps.com:7002
- [ ] Facebook App has nxt05 and nxt06 in allowed domains
- [ ] Backend server restarted
- [ ] Frontend rebuilt and redeployed
- [ ] Port 7002 is open in firewall
- [ ] SSL certificates are valid for both domains
- [ ] Backend health check returns OK
- [ ] CORS is configured correctly

## 🧪 Test Commands

```bash
# Test backend health
curl https://nxt06.optigoapps.com:7002/api/health

# Test CORS
curl -H "Origin: https://nxt05.optigoapps.com" \
     -X OPTIONS \
     https://nxt06.optigoapps.com:7002/api/auth/login -v

# Test registration (replace with real data)
curl -X POST https://nxt06.optigoapps.com:7002/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"test123","name":"Test User"}'
```

## 📞 Support

If still having issues:
1. Check backend logs
2. Check Nginx error logs
3. Check browser console
4. Verify all environment variables are set correctly
