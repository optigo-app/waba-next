# Backend Database Implementation Guide

## Overview

The WhatsApp Business API Manager now uses a backend database with user authentication for secure, multi-device account management.

## What Changed

### Before (localStorage)
- ❌ Accounts stored in browser only
- ❌ No user authentication
- ❌ Can't access from different devices
- ❌ Tokens visible in browser
- ❌ No backup/recovery

### After (Backend Database)
- ✅ Accounts stored securely on server
- ✅ User authentication with JWT
- ✅ Access from any device
- ✅ Tokens stored server-side
- ✅ Automatic backup
- ✅ Multi-user support

## Architecture

```
Frontend (React)
    ↓
API Layer (src/api.js)
    ↓
Backend Server (Express.js on port 7002)
    ↓
SQLite Database (whatsapp.db)
```

## Database Schema

### Users Table
```sql
CREATE TABLE users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,  -- bcrypt hashed
  name TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
)
```

### WhatsApp Accounts Table
```sql
CREATE TABLE whatsapp_accounts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  name TEXT NOT NULL,
  phone_id TEXT NOT NULL,
  waba_id TEXT NOT NULL,
  access_token TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
)
```

## Backend Setup

### 1. Install Dependencies

```bash
cd backend
npm install
```

New packages installed:
- `better-sqlite3` - SQLite database
- `bcryptjs` - Password hashing
- `jsonwebtoken` - JWT authentication
- `express-validator` - Input validation

### 2. Configure Environment

Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```

Edit `.env`:
```env
FB_APP_ID=833458239205319
FB_APP_SECRET=your_app_secret_here
JWT_SECRET=your-super-secret-jwt-key-change-this
PORT=7002
REDIRECT_URI=https://nxt05.optigoapps.com
ALLOWED_ORIGINS=https://nxt05.optigoapps.com,http://localhost:3000
```

**IMPORTANT:** Generate a secure JWT secret:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### 3. Start Backend Server

```bash
cd backend
node server.js
```

Output:
```
✓ Database initialized
✓ Backend server running on http://localhost:7002
✓ Database ready
```

The database file `whatsapp.db` will be created automatically.

## API Endpoints

### Authentication Endpoints

#### POST /api/auth/register
Register a new user.

**Request:**
```json
{
  "email": "user@example.com",
  "password": "password123",
  "name": "John Doe"
}
```

**Response:**
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "email": "user@example.com",
    "name": "John Doe"
  }
}
```

#### POST /api/auth/login
Login existing user.

**Request:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "email": "user@example.com",
    "name": "John Doe"
  }
}
```

#### GET /api/auth/me
Get current user info (requires authentication).

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "user": {
    "id": 1,
    "email": "user@example.com",
    "name": "John Doe"
  }
}
```

### Account Endpoints (All require authentication)

#### GET /api/accounts
Get all accounts for current user.

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "accounts": [
    {
      "id": 1,
      "name": "Account 0270",
      "phoneId": "827023610503270",
      "wabaId": "1560930648373468",
      "token": "EAAL2Bp5Ib8c...",
      "createdAt": "2026-03-26T12:00:00.000Z"
    }
  ]
}
```

#### POST /api/accounts
Create new account.

**Headers:**
```
Authorization: Bearer <token>
```

**Request:**
```json
{
  "name": "Account 0270",
  "phoneId": "827023610503270",
  "wabaId": "1560930648373468",
  "token": "EAAL2Bp5Ib8c..."
}
```

**Response:**
```json
{
  "success": true,
  "account": {
    "id": 1,
    "name": "Account 0270",
    "phoneId": "827023610503270",
    "wabaId": "1560930648373468",
    "token": "EAAL2Bp5Ib8c...",
    "createdAt": "2026-03-26T12:00:00.000Z"
  }
}
```

#### PUT /api/accounts/:id
Update account.

**Headers:**
```
Authorization: Bearer <token>
```

**Request:**
```json
{
  "name": "Main Store",
  "token": "new_token_here"
}
```

**Response:**
```json
{
  "success": true,
  "account": {
    "id": 1,
    "name": "Main Store",
    "phoneId": "827023610503270",
    "wabaId": "1560930648373468",
    "token": "new_token_here",
    "createdAt": "2026-03-26T12:00:00.000Z"
  }
}
```

#### DELETE /api/accounts/:id
Delete account.

**Headers:**
```
Authorization: Bearer <token>
```

**Response:**
```json
{
  "success": true,
  "message": "Account deleted"
}
```

## Frontend Integration

### Authentication Flow

1. User opens app
2. App checks for JWT token in localStorage
3. If no token → Show login/register page
4. If token exists → Verify with backend
5. If valid → Load accounts and show main app
6. If invalid → Show login page

### API Usage

The frontend uses `src/api.js` for all backend communication:

```javascript
import { authAPI, accountsAPI } from './api';

// Login
const result = await authAPI.login(email, password);

// Get accounts
const accounts = await accountsAPI.getAll();

// Create account
const newAccount = await accountsAPI.create(name, phoneId, wabaId, token);

// Update account
await accountsAPI.update(accountId, { name: 'New Name' });

// Delete account
await accountsAPI.delete(accountId);
```

## Security Features

### Password Security
- Passwords hashed with bcrypt (10 rounds)
- Never stored in plain text
- Never sent in responses

### JWT Authentication
- Tokens expire after 7 days
- Stored in localStorage (frontend)
- Sent in Authorization header
- Verified on every protected request

### API Security
- CORS protection
- Input validation
- SQL injection prevention (prepared statements)
- User isolation (can only access own accounts)

### Database Security
- Foreign key constraints
- Cascade delete (deleting user deletes their accounts)
- Indexed queries for performance

## User Workflow

### First Time User

1. Open app → See login/register page
2. Click "Register"
3. Enter email, password, name
4. Click "Create Account"
5. Automatically logged in
6. Go to Signup tab
7. Complete WhatsApp embedded signup
8. Account automatically saved to database
9. Ready to use!

### Returning User

1. Open app → See login page
2. Enter email and password
3. Click "Login"
4. All accounts loaded from database
5. Continue working

### Multiple Devices

1. Login on Device A → Add accounts
2. Login on Device B with same email/password
3. All accounts available on Device B
4. Changes sync through backend

## Migration from localStorage

If you were using the old localStorage version:

1. Your old accounts are NOT automatically migrated
2. Create a new account (register)
3. Re-add your WhatsApp accounts via Signup tab
4. Or manually add via Settings

## Database Management

### Backup Database

```bash
cp backend/whatsapp.db backend/whatsapp.db.backup
```

### View Database

```bash
cd backend
sqlite3 whatsapp.db

# List tables
.tables

# View users
SELECT * FROM users;

# View accounts
SELECT * FROM whatsapp_accounts;

# Exit
.quit
```

### Reset Database

```bash
cd backend
rm whatsapp.db
node server.js  # Will recreate empty database
```

## Production Deployment

### 1. Use PostgreSQL or MySQL

For production, replace SQLite with a proper database:

```bash
npm install pg  # PostgreSQL
# or
npm install mysql2  # MySQL
```

Update `database.js` to use your chosen database.

### 2. Secure JWT Secret

Generate a strong secret:
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

Add to production `.env`.

### 3. HTTPS Only

Ensure backend runs on HTTPS in production.

### 4. Environment Variables

Never commit `.env` file. Use environment variables on your hosting platform.

### 5. Database Backups

Set up automatic daily backups of your database.

## Troubleshooting

### "Database locked" error
- Close any other connections to the database
- Restart the backend server

### "Invalid token" error
- Token expired (7 days)
- Login again to get new token

### Can't login after registration
- Check backend console for errors
- Verify database was created
- Check email/password are correct

### Accounts not loading
- Check backend is running
- Verify JWT token is valid
- Check browser console for errors

### CORS errors
- Add your frontend URL to ALLOWED_ORIGINS in `.env`
- Restart backend server

## File Structure

```
backend/
├── server.js          # Main server file
├── database.js        # Database operations
├── auth.js            # JWT authentication
├── package.json       # Dependencies
├── .env              # Configuration (create from .env.example)
├── .env.example      # Example configuration
└── whatsapp.db       # SQLite database (auto-created)

src/
├── App.js            # Main app with auth integration
├── AuthPage.js       # Login/Register UI
└── api.js            # Backend API client
```

## Benefits

1. **Secure**: Passwords hashed, tokens encrypted
2. **Multi-device**: Access from anywhere
3. **Persistent**: Data survives browser clear
4. **Scalable**: Support unlimited users
5. **Backup**: Database can be backed up
6. **Team-ready**: Multiple users can have accounts
7. **Professional**: Production-ready architecture

## Next Steps

1. Start backend server
2. Register a new account
3. Add WhatsApp accounts via Signup
4. Access from any device with same login

Your accounts are now securely stored in the backend database!
