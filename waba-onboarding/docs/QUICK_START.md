# Quick Start Guide - Backend Database Version

## Prerequisites
- Node.js installed
- npm installed

## Setup (5 minutes)

### 1. Install Backend Dependencies
```bash
cd backend
npm install
```

### 2. Configure Backend
```bash
# Copy example env file
cp .env.example .env

# Generate JWT secret
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Edit `backend/.env` and paste the generated secret:
```env
FB_APP_ID=833458239205319
FB_APP_SECRET=your_app_secret_here
JWT_SECRET=paste_generated_secret_here
PORT=7002
REDIRECT_URI=https://nxt05.optigoapps.com
ALLOWED_ORIGINS=https://nxt05.optigoapps.com,http://localhost:3000
```

### 3. Start Backend
```bash
node server.js
```

You should see:
```
✓ Database initialized
✓ Backend server running on http://localhost:7002
✓ Database ready
```

### 4. Install Frontend Dependencies (if needed)
```bash
cd ..
npm install
```

### 5. Start Frontend
```bash
npm start
```

Browser opens to `http://localhost:3000`

## First Use

### 1. Register Account
- Click "Register" tab
- Enter email, password, name
- Click "Create Account"
- You're automatically logged in!

### 2. Add WhatsApp Account
- Click "Signup" tab
- Click "Login with Facebook"
- Complete WhatsApp embedded signup
- Account automatically saved to database

### 3. Start Using
- Go to "Manage Templates" to see your templates
- Go to "Create Template" to make new ones
- Go to "Send Message" to send messages

## Access from Another Device

1. Open app on another device
2. Login with same email/password
3. All your accounts are there!

## Key Features

✅ Secure user authentication
✅ Multi-device account sync
✅ Unlimited WhatsApp accounts
✅ Persistent storage (survives browser clear)
✅ Account management UI
✅ Easy switching between accounts

## Troubleshooting

### Backend won't start
```bash
# Check if port 7002 is in use
netstat -ano | findstr :7002

# Kill the process if needed
taskkill /PID <process_id> /F
```

### Can't login
- Verify backend is running
- Check email/password
- Try registering a new account

### Accounts not loading
- Check backend console for errors
- Verify JWT_SECRET is set in .env
- Try logout and login again

## Production Deployment

### Backend
1. Deploy to your server (e.g., DigitalOcean, AWS, Heroku)
2. Set environment variables
3. Use PostgreSQL/MySQL instead of SQLite
4. Enable HTTPS
5. Set up database backups

### Frontend
1. Update `REACT_APP_BACKEND_URL` in `.env`
2. Build: `npm run build`
3. Deploy build folder to hosting (Netlify, Vercel, etc.)

## Documentation

- `BACKEND_DATABASE_GUIDE.md` - Complete implementation guide
- `DATABASE_IMPLEMENTATION_SUMMARY.md` - Technical summary
- `backend/setup.md` - Backend setup details

## Support

Need help? Check:
1. Backend console for errors
2. Browser console for errors
3. Documentation files
4. Verify .env configuration

## What's Different from Before?

### Old Version (localStorage)
- Accounts stored in browser only
- No login required
- Can't access from other devices
- Lost if browser data cleared

### New Version (Backend Database)
- Accounts stored on server
- Login required
- Access from any device
- Persistent and secure

## Next Steps

1. ✅ Setup complete
2. ✅ Register account
3. ✅ Add WhatsApp accounts
4. 🔄 Use the app
5. 🔄 Deploy to production

Enjoy your secure, multi-device WhatsApp Business API Manager!
