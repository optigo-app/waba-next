# WhatsApp Business API Manager - Complete Documentation

## Project Overview

A comprehensive web application for managing WhatsApp Business API operations, including template creation, message sending, and embedded signup integration.

**Live URL**: https://nxt05.optigoapps.com

---

## Table of Contents

1. [Features](#features)
2. [Architecture](#architecture)
3. [APIs Used](#apis-used)
4. [Functionality Breakdown](#functionality-breakdown)
5. [Technical Stack](#technical-stack)
6. [Setup & Configuration](#setup--configuration)
7. [API Endpoints Reference](#api-endpoints-reference)

---

## Features

### 1. **Embedded Signup** 🔗
- Facebook OAuth integration for WhatsApp Business signup
- Automatic credential retrieval (Phone Number ID, WABA ID)
- Authorization code exchange for access token
- Account details fetching (status, quality score, message limits)

### 2. **Template Management** 📝
- Create WhatsApp message templates
- Support for multiple template types:
  - Text templates with variables
  - Image/Video/Document headers
  - Carousel templates (multiple images)
- Template preview in real-time
- Variable management with incremental insertion
- Image upload from local computer
- Template listing with filters (All, Approved, Pending, Rejected)

### 3. **Message Sending** 📤
- Send messages using approved templates
- Dynamic variable substitution
- Support for template and free-text messages
- Real-time message preview

### 4. **Credentials Management** ⚙️
- Secure storage of API credentials
- Access Token, WABA ID, Phone Number ID management
- Auto-fill from embedded signup
- Environment variable support

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Frontend (React)                         │
│                  https://nxt05.optigoapps.com               │
│                                                              │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐   │
│  │ Embedded │  │ Template │  │ Template │  │  Send    │   │
│  │  Signup  │  │  Create  │  │   List   │  │ Message  │   │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘   │
└─────────────────────────────────────────────────────────────┘
         │                    │                    │
         │                    │                    │
         ▼                    ▼                    ▼
┌─────────────────┐  ┌──────────────────────────────────────┐
│  Backend API    │  │    Facebook Graph API                │
│  (Port 7002)    │  │    https://graph.facebook.com        │
│                 │  │                                       │
│  - Token        │  │  - OAuth & Embedded Signup           │
│    Exchange     │  │  - Template Management               │
│  - CORS         │  │  - Message Sending                   │
│    Handling     │  │  - Media Upload                      │
└─────────────────┘  │  - Phone Number Details              │
         │            └──────────────────────────────────────┘
         │                             │
         └─────────────────────────────┘
```

---

## APIs Used

### 1. **Facebook Graph API (v19.0)**

Base URL: `https://graph.facebook.com/v19.0`

#### A. OAuth & Authentication

**1.1 Facebook Login (Embedded Signup)**
- **Endpoint**: Facebook SDK `FB.login()`
- **Purpose**: Initiate WhatsApp Business signup
- **Parameters**:
  - `config_id`: Configuration ID from Meta
  - `response_type`: 'code'
  - `extras`: { version: 'v3' }
- **Returns**: Authorization code
- **Used in**: Embedded Signup tab

**1.2 Token Exchange**
- **Endpoint**: `POST /oauth/access_token`
- **Purpose**: Exchange authorization code for access token
- **Parameters**:
  - `client_id`: Facebook App ID
  - `client_secret`: App Secret
  - `code`: Authorization code
  - `redirect_uri`: Callback URL
- **Returns**: Access token
- **Used in**: Backend server (automatic exchange)

#### B. Template Management

**2.1 Create Template**
- **Endpoint**: `POST /{waba_id}/message_templates`
- **Purpose**: Create new WhatsApp message template
- **Headers**:
  - `Authorization: Bearer {access_token}`
  - `Content-Type: application/json`
- **Body**:
  ```json
  {
    "name": "template_name",
    "language": "en_US",
    "category": "MARKETING",
    "components": [
      {
        "type": "HEADER",
        "format": "TEXT",
        "text": "Header text"
      },
      {
        "type": "BODY",
        "text": "Body with {{1}} variables",
        "example": {
          "body_text": [["sample_value"]]
        }
      },
      {
        "type": "FOOTER",
        "text": "Footer text"
      },
      {
        "type": "BUTTONS",
        "buttons": [
          {
            "type": "URL",
            "text": "Button text",
            "url": "https://example.com"
          }
        ]
      }
    ]
  }
  ```
- **Returns**: Template ID and status
- **Used in**: Create Template tab

**2.2 List Templates**
- **Endpoint**: `GET /{waba_id}/message_templates`
- **Purpose**: Retrieve all templates
- **Parameters**:
  - `fields`: name,status,category,language,components
  - `limit`: 100
- **Headers**:
  - `Authorization: Bearer {access_token}`
- **Returns**: Array of templates
- **Used in**: Manage Templates tab

**2.3 Create Carousel Template**
- **Endpoint**: `POST /{waba_id}/message_templates`
- **Purpose**: Create carousel template with multiple images
- **Body**:
  ```json
  {
    "name": "carousel_template",
    "language": "en_US",
    "category": "MARKETING",
    "components": [
      {
        "type": "CAROUSEL",
        "cards": [
          {
            "components": [
              {
                "type": "HEADER",
                "format": "IMAGE",
                "example": {
                  "header_handle": ["image_url_or_media_id"]
                }
              },
              {
                "type": "BODY",
                "text": "Card body text"
              }
            ]
          }
        ]
      }
    ]
  }
  ```
- **Used in**: Create Template tab (Carousel mode)

#### C. Media Management

**3.1 Upload Media**
- **Endpoint**: `POST /{waba_id}/media`
- **Purpose**: Upload images for carousel templates
- **Headers**:
  - `Authorization: Bearer {access_token}`
- **Body**: FormData with file
  - `file`: Image file
  - `messaging_product`: 'whatsapp'
- **Returns**: Media ID
- **Used in**: Create Template tab (image upload)

#### D. Messaging

**4.1 Send Template Message**
- **Endpoint**: `POST /{phone_number_id}/messages`
- **Purpose**: Send message using approved template
- **Headers**:
  - `Authorization: Bearer {access_token}`
  - `Content-Type: application/json`
- **Body**:
  ```json
  {
    "messaging_product": "whatsapp",
    "to": "recipient_phone_number",
    "type": "template",
    "template": {
      "name": "template_name",
      "language": {
        "code": "en_US"
      },
      "components": [
        {
          "type": "body",
          "parameters": [
            {
              "type": "text",
              "text": "variable_value"
            }
          ]
        }
      ]
    }
  }
  ```
- **Returns**: Message ID
- **Used in**: Send Message tab

**4.2 Send Text Message**
- **Endpoint**: `POST /{phone_number_id}/messages`
- **Purpose**: Send free-text message
- **Body**:
  ```json
  {
    "messaging_product": "whatsapp",
    "to": "recipient_phone_number",
    "type": "text",
    "text": {
      "body": "Message text"
    }
  }
  ```
- **Used in**: Send Message tab (free text mode)

#### E. Account Information

**5.1 Get Phone Number Details**
- **Endpoint**: `GET /{phone_number_id}`
- **Purpose**: Fetch phone number status and details
- **Parameters**:
  - `fields`: verified_name,code_verification_status,display_phone_number,quality_rating,messaging_limit_tier,two_factor_enabled
- **Headers**:
  - `Authorization: Bearer {access_token}`
- **Returns**:
  ```json
  {
    "verified_name": "Business Name",
    "code_verification_status": "VERIFIED",
    "display_phone_number": "+1234567890",
    "quality_rating": "GREEN",
    "messaging_limit_tier": "TIER_100K",
    "two_factor_enabled": true
  }
  ```
- **Used in**: Embedded Signup tab (account details card)

### 2. **Facebook SDK (JavaScript)**

**SDK URL**: `https://connect.facebook.net/en_US/sdk.js`

**Initialization**:
```javascript
FB.init({
  appId: '833458239205319',
  autoLogAppEvents: true,
  xfbml: true,
  version: 'v24.0'
});
```

**Methods Used**:
- `FB.login()`: Initiate OAuth flow
- `FB.api()`: Make Graph API calls

### 3. **Backend API (Custom)**

Base URL: `http://localhost:7002` (Development) or `https://nxt05.optigoapps.com:7002` (Production)

**3.1 Exchange Token**
- **Endpoint**: `POST /api/exchange-token`
- **Purpose**: Exchange authorization code for access token
- **Body**:
  ```json
  {
    "code": "authorization_code"
  }
  ```
- **Returns**:
  ```json
  {
    "success": true,
    "access_token": "EAAxxxxx...",
    "token_type": "bearer"
  }
  ```

**3.2 Health Check**
- **Endpoint**: `GET /api/health`
- **Purpose**: Check backend server status
- **Returns**:
  ```json
  {
    "status": "ok",
    "message": "Backend server is running"
  }
  ```

---

## Functionality Breakdown

### 1. Embedded Signup Flow

**Purpose**: Simplify WhatsApp Business account connection

**Steps**:
1. User clicks "Login with Facebook"
2. Facebook SDK loads and initializes
3. OAuth popup opens with WhatsApp signup flow
4. User completes signup and authorizes app
5. Facebook returns authorization code
6. Frontend sends code to backend
7. Backend exchanges code for access token (using App Secret)
8. Access token returned to frontend
9. Frontend listens for WhatsApp signup completion message
10. Phone Number ID and WABA ID received
11. All credentials saved to app state
12. User can optionally fetch account details

**Components**:
- Facebook SDK integration
- Message listener for signup events
- Backend token exchange API
- Credential storage and management

**Code Location**: `src/App.js` - `EmbeddedSignupPage` component

---

### 2. Template Creation

**Purpose**: Create WhatsApp message templates for Meta approval

**Features**:

#### A. Basic Template
- Template name (lowercase, underscores only)
- Category (Marketing, Utility, Authentication)
- Language selection (7 languages supported)
- Header types: None, Text, Image, Document, Video
- Body message with variable support
- Footer (optional)
- Buttons: None, Quick Reply, URL

#### B. Variable Management
- **Incremental Variables**: Click button to add {{1}}, {{2}}, {{3}} automatically
- **Variable Detection**: Automatically detects all {{n}} variables in body
- **Sample Values**: Input sample values for each variable
- **Preview**: Real-time preview with sample values substituted
- **Meta Submission**: Sample values sent to Meta as examples

#### C. Carousel Templates
- Select "Carousel" from header type
- Add 2-10 cards
- Each card has:
  - Image (upload from computer or URL)
  - Body text
- Image upload to Facebook Media API
- Automatic media ID retrieval
- Horizontal scrollable preview

**Workflow**:
1. Fill template details
2. Add body message with variables
3. Click incremental variable button to add {{1}}, {{2}}, etc.
4. Provide sample values for variables
5. Preview template in real-time
6. For carousel: Upload images and add card text
7. Click "Save" to create template
8. Template sent to Meta for approval

**API Calls**:
- `POST /{waba_id}/message_templates` - Create template
- `POST /{waba_id}/media` - Upload carousel images

**Code Location**: `src/App.js` - `TemplatePage` component

---

### 3. Template Management

**Purpose**: View and manage all templates

**Features**:
- **Auto-load**: Templates load automatically on page open
- **Filters**: All, Approved, Pending, Rejected
- **Search**: Search templates by name
- **Template Cards**: Display with:
  - Template name
  - Status badge (color-coded)
  - Category
  - Language
  - Body preview
  - "Use" button
- **Use Template**: Click to pre-fill Send Message tab

**Workflow**:
1. Page opens → Templates auto-fetch
2. Filter by status or search by name
3. Click "Use" on any template
4. Redirected to Send Message tab with template pre-selected

**API Calls**:
- `GET /{waba_id}/message_templates` - List all templates

**Code Location**: `src/App.js` - `TemplateListPage` component

---

### 4. Message Sending

**Purpose**: Send WhatsApp messages to recipients

**Features**:

#### A. Template Messages
- Select from approved templates
- Auto-fill variables with sample values
- Edit variable values before sending
- Preview message before sending

#### B. Free Text Messages
- Type any message
- No template required
- Instant sending

**Workflow**:
1. Enter recipient phone number (with country code)
2. Choose message type:
   - **Template**: Select template, fill variables
   - **Free Text**: Type message directly
3. Preview message
4. Click "Send Message"
5. View response (success/error)

**API Calls**:
- `POST /{phone_number_id}/messages` - Send message

**Code Location**: `src/App.js` - `SendPage` component

---

### 5. Settings Management

**Purpose**: Manage API credentials

**Features**:
- Access Token input (password field)
- WABA ID input
- Phone Number ID input
- "From Signup" badges for auto-filled values
- Save & Close button
- Clear button to reset all credentials

**Storage**:
- App state (React useState)
- Environment variables (.env) as defaults
- No localStorage (resets on page refresh)

**Code Location**: `src/App.js` - `SettingsPage` component

---

## Technical Stack

### Frontend
- **Framework**: React 19.2.4
- **Language**: JavaScript (ES6+)
- **Styling**: Inline CSS with CSS variables
- **Fonts**: Plus Jakarta Sans, JetBrains Mono
- **Build Tool**: Create React App (react-scripts 5.0.1)
- **HTTP Client**: Fetch API

### Backend
- **Runtime**: Node.js
- **Framework**: Express.js 4.18.2
- **HTTP Client**: Axios 1.6.0
- **CORS**: cors 2.8.5
- **Environment**: dotenv 16.3.1

### APIs & SDKs
- Facebook Graph API v19.0
- Facebook JavaScript SDK v24.0
- WhatsApp Business API

### Development Tools
- npm/npx
- Git
- VS Code (recommended)

---

## Setup & Configuration

### Prerequisites
- Node.js v16 or higher
- npm or yarn
- Facebook Developer Account
- WhatsApp Business Account

### Environment Variables

**Frontend (.env)**:
```env
HTTPS=true
REACT_APP_WA_TOKEN=your_access_token
REACT_APP_WA_WABA_ID=your_waba_id
REACT_APP_WA_PHONE_ID=your_phone_number_id
REACT_APP_BACKEND_URL=http://localhost:7002
```

**Backend (.env)**:
```env
FB_APP_ID=833458239205319
FB_APP_SECRET=your_app_secret
REDIRECT_URI=https://nxt05.optigoapps.com
ALLOWED_ORIGINS=https://nxt05.optigoapps.com,http://localhost:3000
PORT=7002
```

### Installation

**Frontend**:
```bash
npm install
npm start
```

**Backend**:
```bash
cd backend
npm install
npm run dev
```

---

## API Endpoints Reference

### Facebook Graph API Endpoints Used

| Endpoint | Method | Purpose | Auth Required |
|----------|--------|---------|---------------|
| `/oauth/access_token` | POST | Exchange code for token | No (uses App Secret) |
| `/{waba_id}/message_templates` | POST | Create template | Yes |
| `/{waba_id}/message_templates` | GET | List templates | Yes |
| `/{waba_id}/media` | POST | Upload media | Yes |
| `/{phone_number_id}/messages` | POST | Send message | Yes |
| `/{phone_number_id}` | GET | Get phone details | Yes |

### Backend API Endpoints

| Endpoint | Method | Purpose | Body |
|----------|--------|---------|------|
| `/api/health` | GET | Health check | None |
| `/api/exchange-token` | POST | Exchange auth code | `{ code: string }` |

---

## Data Flow Diagrams

### 1. Embedded Signup Flow

```
User → Click Login → FB SDK → OAuth Popup → User Authorizes
                                                    ↓
                                            Authorization Code
                                                    ↓
Frontend ← Code ← FB SDK ← Popup Closes ← User Completes
    ↓
    POST /api/exchange-token { code }
    ↓
Backend → POST /oauth/access_token (with App Secret)
    ↓
Facebook Graph API → Returns Access Token
    ↓
Backend → Returns Token to Frontend
    ↓
Frontend → Saves Token + Phone ID + WABA ID
    ↓
User Ready to Use API ✅
```

### 2. Template Creation Flow

```
User → Fill Form → Add Variables → Upload Images (if carousel)
                                            ↓
                                    POST /{waba_id}/media
                                            ↓
                                    Returns Media ID
                                            ↓
Frontend → Build Template Payload → POST /{waba_id}/message_templates
                                            ↓
                                    Facebook Graph API
                                            ↓
                                    Returns Template ID
                                            ↓
                                    Template Status: PENDING
                                            ↓
                                    Meta Reviews Template
                                            ↓
                                    Status: APPROVED ✅
```

### 3. Message Sending Flow

```
User → Enter Phone + Select Template → Fill Variables
                                            ↓
Frontend → Build Message Payload → POST /{phone_id}/messages
                                            ↓
                                    Facebook Graph API
                                            ↓
                                    WhatsApp Servers
                                            ↓
                                    Recipient Receives Message ✅
```

---

## Security Considerations

### 1. **Credentials Storage**
- Access tokens stored in app state (not localStorage)
- App Secret never exposed to frontend
- Environment variables for sensitive data

### 2. **CORS Configuration**
- Backend restricts origins to specific domains
- Production: Only nxt05.optigoapps.com allowed
- Development: localhost allowed

### 3. **Token Exchange**
- Authorization code exchange happens on backend
- App Secret used server-side only
- Tokens transmitted over HTTPS

### 4. **Input Validation**
- Phone numbers validated
- Template names sanitized
- File size limits for image uploads (5MB)

---

## Error Handling

### Common Errors

| Error | Cause | Solution |
|-------|-------|----------|
| "Backend not available" | Backend server not running | Start backend on port 7002 |
| "Invalid redirect URI" | URI not in Facebook settings | Add URI to Facebook App |
| "Token expired" | Access token expired | Generate new token |
| "Template creation failed" | Invalid template format | Check template structure |
| "CORS error" | Domain not allowed | Add domain to ALLOWED_ORIGINS |

---

## Performance Optimization

1. **Auto-loading**: Templates load automatically (no manual button click)
2. **Debouncing**: Search input debounced for better performance
3. **Image optimization**: Images compressed before upload
4. **Lazy loading**: Components load on-demand
5. **Caching**: Template list cached in state

---

## Future Enhancements

- [ ] Template editing functionality
- [ ] Template deletion
- [ ] Bulk message sending
- [ ] Message scheduling
- [ ] Analytics dashboard
- [ ] Webhook integration
- [ ] Contact management
- [ ] Message history
- [ ] Template analytics
- [ ] Multi-language support

---

## Support & Resources

- **Facebook Developer Docs**: https://developers.facebook.com/docs/whatsapp
- **WhatsApp Business API**: https://developers.facebook.com/docs/whatsapp/cloud-api
- **Graph API Reference**: https://developers.facebook.com/docs/graph-api

---

## License

Proprietary - All rights reserved

---

## Version History

- **v1.0.0** (Current) - Initial release with all core features
  - Embedded signup
  - Template creation (including carousel)
  - Template management
  - Message sending
  - Credentials management

---

**Last Updated**: 2024
**Maintained By**: Optigo Apps
**Production URL**: https://nxt05.optigoapps.com
