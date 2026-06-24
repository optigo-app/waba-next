# API Reference - Quick Guide

## Base URLs

- **Facebook Graph API**: `https://graph.facebook.com/v19.0`
- **Backend API**: `http://localhost:7002` (dev) / `https://nxt05.optigoapps.com:7002` (prod)

---

## Authentication

All Facebook Graph API requests require:
```
Authorization: Bearer {access_token}
```

---

## 1. Template APIs

### Create Template
```http
POST https://graph.facebook.com/v19.0/{waba_id}/message_templates
Authorization: Bearer {access_token}
Content-Type: application/json

{
  "name": "order_confirmation",
  "language": "en_US",
  "category": "MARKETING",
  "components": [
    {
      "type": "HEADER",
      "format": "TEXT",
      "text": "Order Confirmed ✅"
    },
    {
      "type": "BODY",
      "text": "Hello {{1}}, your order #{{2}} is confirmed!",
      "example": {
        "body_text": [["John", "ORD-123"]]
      }
    },
    {
      "type": "FOOTER",
      "text": "Reply STOP to unsubscribe"
    }
  ]
}
```

**Response**:
```json
{
  "id": "1234567890",
  "status": "PENDING",
  "category": "MARKETING"
}
```

### List Templates
```http
GET https://graph.facebook.com/v19.0/{waba_id}/message_templates?fields=name,status,category,language,components&limit=100
Authorization: Bearer {access_token}
```

**Response**:
```json
{
  "data": [
    {
      "name": "order_confirmation",
      "status": "APPROVED",
      "category": "MARKETING",
      "language": "en_US",
      "components": [...]
    }
  ]
}
```

### Create Carousel Template
```http
POST https://graph.facebook.com/v19.0/{waba_id}/message_templates
Authorization: Bearer {access_token}
Content-Type: application/json

{
  "name": "product_carousel",
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
                "header_handle": ["https://example.com/image1.jpg"]
              }
            },
            {
              "type": "BODY",
              "text": "Product 1 description"
            }
          ]
        },
        {
          "components": [
            {
              "type": "HEADER",
              "format": "IMAGE",
              "example": {
                "header_handle": ["https://example.com/image2.jpg"]
              }
            },
            {
              "type": "BODY",
              "text": "Product 2 description"
            }
          ]
        }
      ]
    }
  ]
}
```

---

## 2. Media APIs

### Upload Image
```http
POST https://graph.facebook.com/v19.0/{waba_id}/media
Authorization: Bearer {access_token}
Content-Type: multipart/form-data

file: [binary]
messaging_product: whatsapp
```

**Response**:
```json
{
  "id": "media_id_12345"
}
```

---

## 3. Messaging APIs

### Send Template Message
```http
POST https://graph.facebook.com/v19.0/{phone_number_id}/messages
Authorization: Bearer {access_token}
Content-Type: application/json

{
  "messaging_product": "whatsapp",
  "to": "919876543210",
  "type": "template",
  "template": {
    "name": "order_confirmation",
    "language": {
      "code": "en_US"
    },
    "components": [
      {
        "type": "body",
        "parameters": [
          {
            "type": "text",
            "text": "John"
          },
          {
            "type": "text",
            "text": "ORD-123"
          }
        ]
      }
    ]
  }
}
```

**Response**:
```json
{
  "messaging_product": "whatsapp",
  "contacts": [
    {
      "input": "919876543210",
      "wa_id": "919876543210"
    }
  ],
  "messages": [
    {
      "id": "wamid.HBgNOTE5ODc2NTQzMjEwFQIAERgSQzg5RjBGNEY0RjY5RTk5RTcwAA=="
    }
  ]
}
```

### Send Text Message
```http
POST https://graph.facebook.com/v19.0/{phone_number_id}/messages
Authorization: Bearer {access_token}
Content-Type: application/json

{
  "messaging_product": "whatsapp",
  "to": "919876543210",
  "type": "text",
  "text": {
    "body": "Hello! This is a test message."
  }
}
```

---

## 4. Account APIs

### Get Phone Number Details
```http
GET https://graph.facebook.com/v19.0/{phone_number_id}?fields=verified_name,code_verification_status,display_phone_number,quality_rating,messaging_limit_tier,two_factor_enabled
Authorization: Bearer {access_token}
```

**Response**:
```json
{
  "verified_name": "Optigo Apps",
  "code_verification_status": "VERIFIED",
  "display_phone_number": "+91 98765 43210",
  "quality_rating": "GREEN",
  "messaging_limit_tier": "TIER_100K",
  "two_factor_enabled": true,
  "id": "827023610503270"
}
```

---

## 5. OAuth APIs

### Exchange Authorization Code
```http
POST https://graph.facebook.com/v19.0/oauth/access_token

client_id: 833458239205319
client_secret: {your_app_secret}
code: {authorization_code}
redirect_uri: https://nxt05.optigoapps.com
```

**Response**:
```json
{
  "access_token": "EAAxxxxxxxxxxxxxxxxxxxxx",
  "token_type": "bearer"
}
```

---

## 6. Backend APIs

### Exchange Token (Custom Backend)
```http
POST http://localhost:7002/api/exchange-token
Content-Type: application/json

{
  "code": "authorization_code_from_facebook"
}
```

**Response**:
```json
{
  "success": true,
  "access_token": "EAAxxxxxxxxxxxxxxxxxxxxx",
  "token_type": "bearer"
}
```

### Health Check
```http
GET http://localhost:7002/api/health
```

**Response**:
```json
{
  "status": "ok",
  "message": "Backend server is running"
}
```

---

## Template Component Types

### Header Types
- `TEXT`: Plain text header
- `IMAGE`: Image header
- `VIDEO`: Video header
- `DOCUMENT`: Document header

### Body
- Always required
- Supports variables: `{{1}}`, `{{2}}`, etc.
- Must provide example values

### Footer
- Optional
- Plain text only
- No variables

### Buttons
- `QUICK_REPLY`: Quick reply button
- `URL`: URL button with link
- `PHONE_NUMBER`: Call button

---

## Variable Format

Variables in templates use double curly braces:
- `{{1}}`, `{{2}}`, `{{3}}` - Numeric variables
- `{{name}}`, `{{amount}}` - Named variables (converted to numeric by Meta)

**Example**:
```
Template: "Hello {{1}}, your order #{{2}} is ready!"
Values: ["John", "ORD-123"]
Result: "Hello John, your order #ORD-123 is ready!"
```

---

## Quality Ratings

| Rating | Description | Action |
|--------|-------------|--------|
| GREEN | High quality | No action needed |
| YELLOW | Medium quality | Improve message quality |
| RED | Low quality | Risk of restrictions |

---

## Message Limits

| Tier | Daily Limit | How to Increase |
|------|-------------|-----------------|
| TIER_1K | 1,000 users | Send quality messages |
| TIER_10K | 10,000 users | Maintain good quality |
| TIER_100K | 100,000 users | Consistent quality |
| TIER_UNLIMITED | Unlimited | Enterprise tier |

---

## Error Codes

| Code | Message | Solution |
|------|---------|----------|
| 100 | Invalid parameter | Check request format |
| 190 | Access token expired | Generate new token |
| 200 | Permission denied | Check app permissions |
| 368 | Temporarily blocked | Wait and retry |
| 131031 | Template not approved | Wait for approval |

---

## Rate Limits

- **Template Creation**: 100 per hour
- **Message Sending**: Based on tier (1K-Unlimited per day)
- **API Calls**: 200 per hour per user

---

## Testing

### Test Phone Numbers
Add test numbers in Meta Business Manager:
1. Go to Business Settings
2. WhatsApp Accounts → Phone Numbers
3. Add test numbers

### Test Templates
Templates must be approved before sending to real users.
Use test numbers for testing pending templates.

---

## Best Practices

1. **Template Names**: Use lowercase with underscores
2. **Variables**: Always provide example values
3. **Images**: Max 5MB, JPG/PNG format
4. **Phone Numbers**: Include country code (e.g., 919876543210)
5. **Error Handling**: Always check response status
6. **Rate Limiting**: Implement exponential backoff
7. **Token Security**: Never expose access token in frontend

---

## Quick cURL Examples

**Create Template**:
```bash
curl -X POST "https://graph.facebook.com/v19.0/{waba_id}/message_templates" \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "hello_world",
    "language": "en_US",
    "category": "MARKETING",
    "components": [{
      "type": "BODY",
      "text": "Hello {{1}}!",
      "example": {"body_text": [["World"]]}
    }]
  }'
```

**Send Message**:
```bash
curl -X POST "https://graph.facebook.com/v19.0/{phone_id}/messages" \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json" \
  -d '{
    "messaging_product": "whatsapp",
    "to": "919876543210",
    "type": "template",
    "template": {
      "name": "hello_world",
      "language": {"code": "en_US"},
      "components": [{
        "type": "body",
        "parameters": [{"type": "text", "text": "John"}]
      }]
    }
  }'
```

---

## Resources

- **Graph API Explorer**: https://developers.facebook.com/tools/explorer
- **WhatsApp Docs**: https://developers.facebook.com/docs/whatsapp
- **Template Guidelines**: https://developers.facebook.com/docs/whatsapp/message-templates/guidelines

---

**Project**: WhatsApp Business API Manager  
**Version**: 1.0.0  
**Last Updated**: 2024
