# Multi-Account Management Guide

## Overview
The WhatsApp Business API Manager now supports managing multiple WhatsApp Business accounts in a single application. Each account has its own credentials and can be switched between easily.

## Features

### 1. Add Multiple Accounts
- Go to the **Signup** tab
- Complete the embedded signup process for each WhatsApp Business account
- Each account is automatically saved with its credentials

### 2. Account Manager (📱 Button)
Click the **📱** button in the header to:
- View all your accounts
- See which account is currently active
- Switch between accounts
- Rename accounts
- Delete accounts

### 3. Account Information
Each account stores:
- **Account Name** - Custom name (editable)
- **Phone Number ID** - WhatsApp phone number identifier
- **WABA ID** - WhatsApp Business Account ID
- **Access Token** - API authentication token

### 4. Active Account Indicator
- The active account name is shown in the header (green text)
- Active account is highlighted in the Account Manager
- All API operations use the active account's credentials

## How to Use

### Adding Your First Account
1. Click the **Signup** tab
2. Complete the Facebook embedded signup
3. Account is automatically created and activated
4. You're ready to use the API!

### Adding More Accounts
1. Click the **Signup** tab again
2. Complete signup for another WhatsApp Business account
3. New account is added and automatically activated
4. Previous accounts remain saved

### Switching Accounts
1. Click the **📱** button in the header
2. Click **Switch** on the account you want to use
3. All tabs now use the selected account's credentials

### Renaming Accounts
1. Open Account Manager (📱 button)
2. Click the **✏️** (edit) button on any account
3. Enter a new name and click **✓**
4. Helpful for identifying accounts (e.g., "Main Store", "Support Line")

### Deleting Accounts
1. Open Account Manager (📱 button)
2. Click the **🗑️** (delete) button on any account
3. Confirm deletion
4. Account and its credentials are permanently removed

### Updating Account Credentials
1. Switch to the account you want to update
2. Click the **⚙️** (settings) button
3. Update Token, WABA ID, or Phone ID
4. Click **Save Settings**

## Data Storage

### Local Storage
- All accounts are stored in your browser's localStorage
- Data persists across browser sessions
- Data is stored locally on your computer only
- Clearing browser data will remove all accounts

### Security Notes
- Access tokens are stored in browser localStorage
- Tokens are visible in the Account Manager (truncated)
- For production use, consider implementing:
  - Server-side credential storage
  - User authentication
  - Encrypted storage
  - Token refresh mechanism

## Account Structure

Each account is stored with this structure:
```json
{
  "id": "acc_1234567890",
  "name": "Account 0270",
  "phoneId": "827023610503270",
  "wabaId": "1560930648373468",
  "token": "EAAL2Bp5Ib8c...",
  "createdAt": "2026-03-26T12:00:00.000Z"
}
```

## Tips

1. **Descriptive Names**: Rename accounts with meaningful names like "Main Store", "Customer Support", "Marketing"
2. **Token Expiry**: Access tokens expire after ~60 days. Update them in Settings when needed
3. **Backup**: Export your account list periodically (future feature)
4. **Testing**: Use different accounts for testing vs production

## Troubleshooting

### No Accounts Showing
- Complete the Signup process first
- Check browser console for errors
- Clear localStorage and re-add accounts

### Can't Switch Accounts
- Ensure account has valid credentials
- Check that account wasn't deleted
- Refresh the page

### API Calls Failing
- Verify the active account has a valid token
- Check token hasn't expired
- Update credentials in Settings

### Lost Accounts After Browser Clear
- Accounts are stored in localStorage
- Clearing browser data removes them
- Re-add accounts via Signup tab

## Future Enhancements

Potential features for future versions:
- Export/Import account list
- Account groups/categories
- Token expiry warnings
- Automatic token refresh
- Cloud sync across devices
- Team collaboration features
- Account usage statistics
- Bulk operations across accounts

## Migration from Single Account

If you were using the old single-account setup:

1. Your old `.env` credentials are no longer used
2. Add your account via the Signup tab
3. Or manually add via Settings after creating a blank account
4. Old environment variables can be removed from `.env`

The app now uses localStorage instead of environment variables for account credentials.
