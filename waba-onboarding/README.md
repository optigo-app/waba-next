# WhatsApp Business API Manager

A complete React application for managing WhatsApp Business API with backend database support, user authentication, and multi-account management.

## 🚀 Quick Start

### 1. Start Backend
```bash
cd backend
npm install
node server.js
```

### 2. Start Frontend
```bash
npm install
npm start
```

### 3. Register & Login
- Open http://localhost:3000
- Register a new account
- Login with your credentials

### 4. Add WhatsApp Account
- Go to "Signup" tab
- Click "Login with Facebook"
- Complete WhatsApp embedded signup

## ✨ Features

- 🔐 User authentication with JWT
- 💾 Backend database storage (SQLite)
- 📱 Multi-account management
- 📝 Template creation and management
- 📤 Message sending
- 🔄 Multi-device sync
- 🎨 Beautiful UI with modern design

## 📚 Documentation

All documentation is available in the `docs/` folder:

### Getting Started
- **[START_HERE.md](docs/START_HERE.md)** - Quick start guide
- **[QUICK_START.md](docs/QUICK_START.md)** - Detailed setup instructions

### Backend & Database
- **[BACKEND_DATABASE_GUIDE.md](docs/BACKEND_DATABASE_GUIDE.md)** - Complete backend guide
- **[DATABASE_IMPLEMENTATION_SUMMARY.md](docs/DATABASE_IMPLEMENTATION_SUMMARY.md)** - Technical overview
- **[BACKEND_SETUP_GUIDE.md](docs/BACKEND_SETUP_GUIDE.md)** - Backend setup

### Deployment
- **[DEPLOY_NXT06.md](docs/DEPLOY_NXT06.md)** - Production deployment guide
- **[NXT06_SETUP_SUMMARY.md](docs/NXT06_SETUP_SUMMARY.md)** - Deployment summary
- **[PRODUCTION_DEPLOYMENT.md](docs/PRODUCTION_DEPLOYMENT.md)** - Production checklist
- **[DEPLOYMENT_CHECKLIST.md](docs/DEPLOYMENT_CHECKLIST.md)** - Deployment steps

### Features & Configuration
- **[PROJECT_DOCUMENTATION.md](docs/PROJECT_DOCUMENTATION.md)** - Complete project docs
- **[API_REFERENCE.md](docs/API_REFERENCE.md)** - API endpoints reference
- **[MULTI_ACCOUNT_GUIDE.md](docs/MULTI_ACCOUNT_GUIDE.md)** - Multi-account usage
- **[EMBEDDED_SIGNUP_SETUP.md](docs/EMBEDDED_SIGNUP_SETUP.md)** - WhatsApp signup setup
- **[SETUP_CREDENTIALS.md](docs/SETUP_CREDENTIALS.md)** - Credentials configuration

### Additional Guides
- **[CONVERT_TO_WORD_GUIDE.md](docs/CONVERT_TO_WORD_GUIDE.md)** - Export docs to Word
- **[PANDOC_SETUP_HELP.md](docs/PANDOC_SETUP_HELP.md)** - Pandoc installation
- **[PORT_7002_SETUP.md](docs/PORT_7002_SETUP.md)** - Port configuration

## 🏗️ Architecture

```
Frontend (React)
    ↓
API Layer (src/api.js)
    ↓
Backend Server (Express.js on port 7002)
    ↓
SQLite Database (whatsapp.db)
```

## 🔧 Technology Stack

### Frontend
- React 18
- Modern CSS with custom styling
- Facebook SDK integration
- Fetch API for backend communication

### Backend
- Express.js
- SQLite (sql.js)
- JWT authentication
- bcryptjs for password hashing
- CORS enabled

## 📁 Project Structure

```
whatsapp/
├── src/                    # Frontend source
│   ├── App.js             # Main application
│   ├── AuthPage.js        # Login/Register
│   └── api.js             # Backend API client
├── backend/               # Backend server
│   ├── server.js          # Express server
│   ├── database.js        # Database operations
│   ├── auth.js            # JWT authentication
│   └── whatsapp.db        # SQLite database
├── docs/                  # Documentation
├── public/                # Static assets
└── build/                 # Production build
```

## 🌐 URLs

### Development
- Frontend: http://localhost:3000
- Backend: http://localhost:7002

### Production
- Frontend: https://nxt06.optigoapps.com
- Backend: https://nxt06.optigoapps.com:7002

## 🔐 Security Features

- Password hashing with bcrypt
- JWT token authentication (7-day expiry)
- CORS protection
- Input validation
- SQL injection prevention
- Secure credential storage

## 📊 Database

### Tables
- **users** - User accounts with authentication
- **whatsapp_accounts** - WhatsApp Business accounts per user

### View Database
```bash
cd backend
node view-db.js
```

## 🛠️ Development

### Install Dependencies
```bash
# Frontend
npm install

# Backend
cd backend
npm install
```

### Run Development Servers
```bash
# Terminal 1 - Backend
cd backend
node server.js

# Terminal 2 - Frontend
npm start
```

### Build for Production
```bash
npm run build
```

## 🚀 Deployment

See [DEPLOY_NXT06.md](docs/DEPLOY_NXT06.md) for complete deployment instructions.

Quick steps:
1. Deploy backend to server
2. Configure Nginx for port 7002
3. Build frontend: `npm run build`
4. Upload build to server
5. Update Facebook App settings

## 🆘 Troubleshooting

### Backend won't start
```bash
# Check if port is in use
netstat -ano | findstr :7002

# Kill process
taskkill /PID <PID> /F

# Restart backend
cd backend
node server.js
```

### Can't login
- Verify backend is running
- Check browser console for errors
- Try registering a new account

### Database errors
```bash
# View database
cd backend
node view-db.js

# Reset database (WARNING: deletes all data)
rm whatsapp.db
node server.js
```

## 📝 License

This project is private and proprietary.

## 🤝 Support

For issues and questions, refer to the documentation in the `docs/` folder.

## 🎯 Key Features

- ✅ User authentication & authorization
- ✅ Multi-account management
- ✅ WhatsApp embedded signup
- ✅ Template creation & management
- ✅ Message sending
- ✅ Backend database storage
- ✅ Multi-device sync
- ✅ Secure credential storage
- ✅ Production-ready architecture

---

**Built with ❤️ for WhatsApp Business API management**
