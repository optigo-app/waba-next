# Deployment Checklist for nxt05.optigoapps.com

## ✅ Pre-Deployment Checklist

### Facebook App Configuration
- [ ] Add `nxt05.optigoapps.com` to App Domains
- [ ] Add `https://nxt05.optigoapps.com/` to Valid OAuth Redirect URIs
- [ ] Add `https://nxt05.optigoapps.com` to WhatsApp Callback URL
- [ ] Get your App Secret from Settings → Basic

### Backend Deployment
- [ ] Choose hosting platform (Heroku/DigitalOcean/AWS/Own Server)
- [ ] Deploy backend code
- [ ] Set environment variables:
  - [ ] `FB_APP_ID=833458239205319`
  - [ ] `FB_APP_SECRET=your_secret`
  - [ ] `REDIRECT_URI=https://nxt05.optigoapps.com`
  - [ ] `ALLOWED_ORIGINS=https://nxt05.optigoapps.com`
- [ ] Test backend health endpoint
- [ ] Note your backend URL

### Frontend Configuration
- [ ] Update `.env.production` with backend URL
- [ ] Rebuild frontend: `npm run build`
- [ ] Deploy build folder to nxt05.optigoapps.com
- [ ] Verify HTTPS is working

## 🧪 Testing Checklist

- [ ] Open https://nxt05.optigoapps.com
- [ ] Check browser console for errors (F12)
- [ ] Click "🔗 Embedded Signup" tab
- [ ] Click "Login with Facebook"
- [ ] Complete signup flow
- [ ] Verify authorization code appears
- [ ] Verify access token is automatically generated
- [ ] Check that credentials are saved
- [ ] Try creating a template
- [ ] Try sending a message

## 🚀 Quick Deploy Commands

### If using Heroku:
```bash
# Backend
cd backend
heroku create your-backend-name
heroku config:set FB_APP_ID=833458239205319
heroku config:set FB_APP_SECRET=your_secret
heroku config:set REDIRECT_URI=https://nxt05.optigoapps.com
heroku config:set ALLOWED_ORIGINS=https://nxt05.optigoapps.com
git init
git add .
git commit -m "Deploy"
git push heroku main

# Frontend
cd ..
echo "REACT_APP_BACKEND_URL=https://your-backend-name.herokuapp.com" > .env.production
npm run build
# Upload build folder to nxt05.optigoapps.com
```

## 📝 Important URLs

- **Frontend**: https://nxt05.optigoapps.com
- **Backend**: https://your-backend-url.com (fill this in after deployment)
- **Backend Health Check**: https://your-backend-url.com/api/health
- **Meta Developer Console**: https://developers.facebook.com/
- **Meta Business Suite**: https://business.facebook.com/

## 🔧 Environment Variables Reference

### Backend
```
FB_APP_ID=833458239205319
FB_APP_SECRET=<get from Meta>
REDIRECT_URI=https://nxt05.optigoapps.com
ALLOWED_ORIGINS=https://nxt05.optigoapps.com,http://localhost:3000
PORT=7002
```

### Frontend (.env.production)
```
REACT_APP_BACKEND_URL=https://your-backend-url.com
REACT_APP_WA_TOKEN=<optional, can be set via UI>
REACT_APP_WA_WABA_ID=<optional, auto-filled from signup>
REACT_APP_WA_PHONE_ID=<optional, auto-filled from signup>
```

## ⚠️ Common Issues

| Issue | Solution |
|-------|----------|
| "Backend not available" | Check backend is running, verify URL in .env.production |
| "CORS error" | Add your domain to ALLOWED_ORIGINS in backend |
| "Invalid redirect URI" | Add exact URL to Facebook App settings |
| Token exchange fails | Verify App Secret is correct |
| Signup popup blocked | Allow popups in browser settings |

## 📞 Support

If you encounter issues:
1. Check browser console (F12)
2. Check backend logs on your hosting platform
3. Verify all environment variables are set
4. Test backend health endpoint
5. Check Facebook App settings match your URLs
