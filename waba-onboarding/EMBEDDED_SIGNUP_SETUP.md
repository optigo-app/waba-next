# WhatsApp Embedded Signup Setup Guide

## Overview
Your app now has an "Embedded Signup" tab that allows users to connect their WhatsApp Business Account through Facebook's OAuth flow.

## Configuration Steps

### 1. Get Your Facebook App ID
1. Go to [Meta for Developers](https://developers.facebook.com/)
2. Select your app or create a new one
3. Copy your **App ID** from the dashboard

### 2. Get Your Configuration ID
1. In your Meta App dashboard, go to **WhatsApp** → **API Setup**
2. Scroll to **Embedded Signup**
3. Click **Create Configuration** (if not already created)
4. Copy the **Configuration ID**

### 3. Update the Code
Open `src/App.js` and replace these placeholders in the `EmbeddedSignupPage` component:

```javascript
// Line ~1360 - Replace with your actual App ID
appId: 'YOUR_APP_ID',

// Line ~1390 - Replace with your actual Configuration ID
config_id: 'YOUR_CONFIG_ID',
```

### 4. Configure OAuth Settings in Meta
1. Go to your Meta App → **Settings** → **Basic**
2. Add your app domain to **App Domains**
3. Go to **WhatsApp** → **Configuration**
4. Add your redirect URI (e.g., `http://localhost:3000` for development)

### 5. Test the Flow
1. Run your app: `npm start`
2. Click on the **🔗 Embedded Signup** tab
3. Click **Launch WhatsApp Signup**
4. Follow the Facebook login and WhatsApp authorization flow

## What Happens After Signup?

The embedded signup flow will:
1. Authenticate the user with Facebook
2. Request WhatsApp Business permissions
3. Return an access token and account details
4. You can then use these credentials to make API calls

## Alternative: Using Direct Embed Link

If you have a direct embedded signup link from Meta, you can also use an iframe approach:

```javascript
<iframe
  src="YOUR_EMBED_SIGNUP_LINK"
  style={{ width: '100%', height: '600px', border: 'none', borderRadius: '12px' }}
  title="WhatsApp Embedded Signup"
/>
```

## Need Help?

- [Meta WhatsApp Business API Documentation](https://developers.facebook.com/docs/whatsapp/embedded-signup)
- [Embedded Signup Guide](https://developers.facebook.com/docs/whatsapp/embedded-signup/implementation)

## Security Notes

- Never commit your App ID or tokens to public repositories
- Use environment variables for production deployments
- Implement proper token storage and refresh mechanisms
