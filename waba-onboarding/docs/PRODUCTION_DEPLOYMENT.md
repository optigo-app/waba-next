# Production Deployment Guide

Your frontend is hosted at: **https://nxt05.optigoapps.com**

## Step 1: Update Facebook App Settings

Go to https://developers.facebook.com/ and update your app settings:

### 1.1 Basic Settings
- Go to **Settings** → **Basic**
- **App Domains**: Add `nxt05.optigoapps.com`
- Click **Save Changes**

### 1.2 Facebook Login Settings
- Go to **Products** → **Facebook Login** → **Settings**
- **Valid OAuth Redirect URIs**: Add these URLs:
  ```
  https://nxt05.optigoapps.com/
  https://nxt05.optigoapps.com
  http://localhost:3000/
  http://localhost:3000
  ```
- Click **Save Changes**

### 1.3 WhatsApp Configuration
- Go to **WhatsApp** → **Configuration**
- **Callback URL**: Add `https://nxt05.optigoapps.com`
- Click **Save**

## Step 2: Deploy Backend Server

You need to host your backend somewhere. Here are the best options:

### Option A: Heroku (Easiest, Free Tier Available)

1. **Install Heroku CLI**: https://devcenter.heroku.com/articles/heroku-cli

2. **Create Heroku app:**
   ```bash
   cd backend
   heroku login
   heroku create your-app-name
   ```

3. **Set environment variables:**
   ```bash
   heroku config:set FB_APP_ID=833458239205319
   heroku config:set FB_APP_SECRET=your_app_secret_here
   heroku config:set REDIRECT_URI=https://nxt05.optigoapps.com
   heroku config:set ALLOWED_ORIGINS=https://nxt05.optigoapps.com,http://localhost:3000
   ```

4. **Deploy:**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git push heroku main
   ```

5. **Your backend URL**: `https://your-app-name.herokuapp.com`

### Option B: DigitalOcean App Platform

1. Go to https://cloud.digitalocean.com/apps
2. Click **Create App**
3. Connect your GitHub repo or upload code
4. Set environment variables in the dashboard
5. Deploy

### Option C: AWS Lambda (Serverless)

1. Use AWS Lambda + API Gateway
2. Deploy using Serverless Framework or AWS SAM
3. Set environment variables in Lambda console

### Option D: Your Own Server

If you have a VPS or server:

1. **Install Node.js** (v16 or higher)
2. **Upload backend folder** to your server
3. **Install dependencies:**
   ```bash
   cd backend
   npm install --production
   ```
4. **Create .env file** with your credentials
5. **Use PM2 to run:**
   ```bash
   npm install -g pm2
   pm2 start server.js --name whatsapp-backend
   pm2 save
   pm2 startup
   ```
6. **Setup Nginx reverse proxy** (optional but recommended)

## Step 3: Update Frontend Configuration

Once your backend is deployed, update the frontend:

### 3.1 Update .env for Production

Create `.env.production`:
```env
REACT_APP_WA_TOKEN=your_token_here
REACT_APP_WA_WABA_ID=your_waba_id_here
REACT_APP_WA_PHONE_ID=your_phone_id_here
REACT_APP_BACKEND_URL=https://your-backend-url.com
```

### 3.2 Rebuild and Deploy Frontend

```bash
npm run build
```

Upload the `build` folder to your hosting (nxt05.optigoapps.com).

## Step 4: Test the Complete Flow

1. Go to https://nxt05.optigoapps.com
2. Click **🔗 Embedded Signup**
3. Click **Login with Facebook**
4. Complete the signup
5. Authorization code should be automatically exchanged
6. Access token should appear
7. All credentials saved! ✅

## Quick Setup Example (Heroku)

```bash
# 1. Deploy backend to Heroku
cd backend
heroku create whatsapp-backend-api
heroku config:set FB_APP_ID=833458239205319
heroku config:set FB_APP_SECRET=your_secret_here
heroku config:set REDIRECT_URI=https://nxt05.optigoapps.com
heroku config:set ALLOWED_ORIGINS=https://nxt05.optigoapps.com
git init
git add .
git commit -m "Deploy backend"
git push heroku main

# 2. Update frontend .env.production
echo "REACT_APP_BACKEND_URL=https://whatsapp-backend-api.herokuapp.com" >> .env.production

# 3. Rebuild frontend
cd ..
npm run build

# 4. Deploy build folder to nxt05.optigoapps.com
```

## Environment Variables Summary

### Backend (.env)
```env
FB_APP_ID=833458239205319
FB_APP_SECRET=your_app_secret_here
REDIRECT_URI=https://nxt05.optigoapps.com
ALLOWED_ORIGINS=https://nxt05.optigoapps.com,http://localhost:3000
PORT=7002
```

### Frontend (.env.production)
```env
REACT_APP_WA_TOKEN=your_token_here
REACT_APP_WA_WABA_ID=your_waba_id_here
REACT_APP_WA_PHONE_ID=your_phone_id_here
REACT_APP_BACKEND_URL=https://your-backend-url.com
```

## Security Checklist for Production

- ✅ HTTPS enabled on both frontend and backend
- ✅ App Secret stored securely (never in frontend code)
- ✅ CORS restricted to your domain only
- ✅ Environment variables set on hosting platform
- ⚠️ Add rate limiting to backend API
- ⚠️ Add API authentication (optional but recommended)
- ⚠️ Monitor backend logs for errors
- ⚠️ Set up error tracking (Sentry, LogRocket, etc.)

## Troubleshooting

### "Backend server not available"
- Check if backend is running: `curl https://your-backend-url.com/api/health`
- Verify CORS settings allow your frontend domain
- Check backend logs for errors

### "Invalid redirect URI"
- Ensure `https://nxt05.optigoapps.com` is in Facebook App settings
- Check that REDIRECT_URI in backend .env matches exactly

### Token exchange fails
- Verify App Secret is correct
- Check backend logs for detailed error
- Ensure authorization code hasn't expired (valid for 10 minutes)

## Cost Estimate

- **Frontend**: Already hosted on nxt05.optigoapps.com (✅ Free)
- **Backend Options**:
  - Heroku: Free tier available (sleeps after 30 min inactivity)
  - DigitalOcean: $5/month
  - AWS Lambda: Pay per use (~$0-5/month for low traffic)
  - Your own server: Variable

## Need Help?

1. Check backend health: `https://your-backend-url.com/api/health`
2. Check frontend console (F12) for errors
3. Check backend logs on your hosting platform
4. Verify all environment variables are set correctly
