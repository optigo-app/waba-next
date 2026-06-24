# Backend Setup Guide - Token Exchange

## Quick Start (5 minutes)

### Step 1: Get Your App Secret

1. Go to https://developers.facebook.com/
2. Select your app (App ID: 833458239205319)
3. Go to **Settings** → **Basic**
4. Click **Show** next to "App Secret"
5. Copy the secret

### Step 2: Setup Backend

```bash
# Navigate to backend folder
cd backend

# Install dependencies
npm install

# Create .env file
cp .env.example .env
```

### Step 3: Configure .env

Edit `backend/.env`:
```env
FB_APP_ID=833458239205319
FB_APP_SECRET=paste_your_app_secret_here
REDIRECT_URI=https://localhost:3000
PORT=3001
```

### Step 4: Start Backend Server

```bash
npm run dev
```

You should see: `Backend server running on http://localhost:7002`

### Step 5: Test It!

1. Keep the backend running
2. Go to your React app (https://localhost:3000)
3. Click **🔗 Embedded Signup** tab
4. Click **Login with Facebook**
5. Complete the signup

**What happens:**
- Authorization code is received
- Frontend automatically calls your backend
- Backend exchanges code for access token
- Access token is displayed and saved
- You're ready to use the API! ✅

## How It Works

```
┌─────────────┐         ┌──────────────┐         ┌─────────────┐
│   React     │         │   Backend    │         │  Facebook   │
│   Frontend  │         │   Server     │         │   Graph API │
└──────┬──────┘         └──────┬───────┘         └──────┬──────┘
       │                       │                        │
       │  1. User completes    │                        │
       │     embedded signup   │                        │
       │◄──────────────────────┼────────────────────────┤
       │                       │                        │
       │  2. Receive auth code │                        │
       │                       │                        │
       │  3. POST /api/exchange-token                   │
       ├──────────────────────►│                        │
       │     { code: "..." }   │                        │
       │                       │                        │
       │                       │  4. Exchange code      │
       │                       ├───────────────────────►│
       │                       │  (with App Secret)     │
       │                       │                        │
       │                       │  5. Return token       │
       │                       │◄───────────────────────┤
       │                       │                        │
       │  6. Return token      │                        │
       │◄──────────────────────┤                        │
       │                       │                        │
       │  7. Save & use token  │                        │
       │                       │                        │
```

## Troubleshooting

### Backend not starting?
- Make sure you're in the `backend` folder
- Run `npm install` again
- Check if port 3001 is available

### Token exchange failing?
- Verify App Secret is correct in `.env`
- Check backend console for error messages
- Ensure redirect URI matches Facebook app settings

### CORS errors?
- Backend has CORS enabled for all origins
- For production, restrict to your domain only

### "Backend server not available" message?
- Make sure backend is running on port 7002
- Check `http://localhost:7002/api/health` in browser
- Should return: `{"status":"ok","message":"Backend server is running"}`

## Production Deployment

For production, deploy your backend to:
- **Heroku**: Easy, free tier available
- **AWS Lambda**: Serverless, pay per use
- **DigitalOcean**: Simple VPS
- **Vercel/Netlify**: Serverless functions

Update the frontend API URL:
```javascript
// In src/App.js, change:
const tokenResponse = await fetch('http://localhost:7002/api/exchange-token', {
// To:
const tokenResponse = await fetch('https://your-backend.com/api/exchange-token', {
```

## Security Checklist

- ✅ App Secret stored in `.env` (never in code)
- ✅ `.env` in `.gitignore`
- ✅ HTTPS in production
- ⚠️ Add rate limiting (recommended)
- ⚠️ Add API authentication (recommended)
- ⚠️ Validate input data (recommended)

## Need Help?

Check the logs:
- Backend: Terminal where `npm run dev` is running
- Frontend: Browser console (F12)
- Facebook: https://developers.facebook.com/tools/debug/

Common issues are usually:
1. Wrong App Secret
2. Backend not running
3. Port conflicts
4. CORS issues (already handled)
