# Setup Credentials Guide

## Option 1: Using Environment Variables (Recommended)

1. Open the `.env` file in your project root
2. Replace the placeholder values with your actual credentials:

```env
HTTPS=true

# WhatsApp Business API Credentials
REACT_APP_WA_TOKEN=EAAxxxxxxxxxxxxxxxxxxxxx
REACT_APP_WA_WABA_ID=123456789012345
REACT_APP_WA_PHONE_ID=827023610503270
```

3. **Restart your dev server** (important! Environment variables only load on startup)
   - Stop the server (Ctrl+C)
   - Run `npm start` again

4. Your credentials will now be automatically loaded

## Option 2: Hardcode Directly in Code (Not Recommended for Production)

If you want to hardcode directly in the code (only for testing):

1. Open `src/App.js`
2. Find this section (around line 1630):

```javascript
const [creds, setCreds] = useState({
  token:   process.env.REACT_APP_WA_TOKEN || "",
  wabaId:  process.env.REACT_APP_WA_WABA_ID || "",
  phoneId: process.env.REACT_APP_WA_PHONE_ID || "",
});
```

3. Replace with your actual values:

```javascript
const [creds, setCreds] = useState({
  token:   "EAAxxxxxxxxxxxxxxxxxxxxx",
  wabaId:  "123456789012345",
  phoneId: "827023610503270",
});
```

## Security Notes

- **Never commit `.env` file to Git** - It's already in `.gitignore`
- **Never share your Access Token** publicly
- For production, use proper secret management (AWS Secrets Manager, Azure Key Vault, etc.)
- Tokens expire - you may need to refresh them periodically

## What Changed

1. **Auto-load credentials**: The app now reads from environment variables on startup
2. **Auto-fetch templates**: When you open the "Manage Templates" tab, templates load automatically
3. **No manual button click needed**: Templates fetch immediately if credentials are present

## Testing

1. Set your credentials in `.env`
2. Restart the server
3. Open the app
4. Go to "📂 Manage Templates" tab
5. Templates should load automatically!
