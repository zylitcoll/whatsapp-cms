# 🏗️ WhatsApp CMS - Setup & Configuration Guide

## Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Setup Environment
```bash
cp .env.example .env.local

# Edit .env.local dengan credentials kamu
nano .env.local
```

### 3. Initialize Database
```bash
# Generate migration files
npm run db:generate

# Run migrations ke PostgreSQL
npm run db:push
```

### 4. Start Development
```bash
npm run dev
```

Visit `http://localhost:3000` dan login dengan:
- Username: `admin`
- Password: `password`

---

## 🔑 Configuration Details

### Database Setup

**Option 1: Local PostgreSQL**
```bash
brew install postgresql
createdb whatsapp_cms

# Update .env.local
DATABASE_URL=postgresql://user:password@localhost:5432/whatsapp_cms
```

**Option 2: Remote Database (Supabase, Railway, etc)**
```
DATABASE_URL=postgresql://user:password@host:5432/whatsapp_cms
```

### Meta WhatsApp API Setup

1. **Create Business App**: https://developers.facebook.com/apps
2. **Setup WhatsApp Product**
3. **Get Credentials**:
   - Go to WhatsApp → API Setup
   - Copy `Phone Number ID` → `META_PHONE_NUMBER_ID`
   - Copy `Access Token` → `WHATSAPP_ACCESS_TOKEN`
   - Generate random token → `META_VERIFY_TOKEN`

**Example .env.local:**
```bash
META_PHONE_NUMBER_ID=120123456789
WHATSAPP_ACCESS_TOKEN=EAABs8Co1234ABCD1234...
META_VERIFY_TOKEN=super_secret_random_token_123
META_API_VERSION=v18.0
```

### Webhook Configuration

1. In Meta Developer Portal:
   - Go to WhatsApp Product → Configuration
   - Callback URL: `https://your-domain.com/api/webhook`
   - Verify Token: (masukkan `META_VERIFY_TOKEN` dari env)
   - Subscribe to: `messages`, `message_status`

2. **For Local Testing** (gunakan ngrok):
```bash
# Install ngrok
brew install ngrok

# Start ngrok tunnel
ngrok http 3000

# Copy URL dan set di Meta Portal
# e.g., https://abc123.ngrok.io/api/webhook
```

---

## 📊 Database Guidelines

### Backup Database
```bash
# PostgreSQL backup
pg_dump whatsapp_cms > backup_$(date +%Y%m%d).sql

# Restore
psql whatsapp_cms < backup_20240101.sql
```

### View Database Schema
```bash
# Open Drizzle Studio
npm run db:studio

# Or via psql
psql -U user -d whatsapp_cms
\d  # list tables
\d messages  # describe table
```

---

## 🔐 Security Best Practices

1. **Never commit .env.local** (added to .gitignore)
2. **Use strong SESSION_SECRET** (min 32 chars):
   ```bash
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   ```
3. **Rotate access tokens regularly**
4. **Use HTTPS in production** (required by Meta)
5. **Validate all webhook signatures**

---

## 🚀 Deployment Checklist

Before going to production:

- [ ] Database is on secure, backed-up server
- [ ] All credentials moved to environment variables
- [ ] SESSION_SECRET is strong random string
- [ ] Webhook URL points to production domain
- [ ] SSL/HTTPS certificate configured
- [ ] CORS/firewall rules set correctly
- [ ] Database backups scheduled
- [ ] Monitoring/logging configured
- [ ] Rate limiting implemented
- [ ] Admin password changed from default

---

## 🆘 Common Issues & Solutions

### Issue: "Database connection refused"
```bash
# Check PostgreSQL is running
brew services list

# Start if stopped
brew services start postgresql

# Test connection
psql -U postgres
```

### Issue: "Webhook verification failed"
- Verify `META_VERIFY_TOKEN` matches exactly in Meta Portal
- Check callback URL is publicly accessible
- For ngrok: URL changes each session, update in Meta Portal

### Issue: "WhatsApp message send fails"
- Verify `WHATSAPP_ACCESS_TOKEN` is not expired
- Check `META_PHONE_NUMBER_ID` is correct
- Recipient number format must be: `62812xxxxxxx` (no +)
- Check recipient has WhatsApp account

### Issue: "Login always fails"
- Verify `ADMIN_PASSWORD_HASH` matches 'password'
- Or update password hash:
  ```bash
  node -e "console.log(require('crypto').createHash('sha256').update('mypassword').digest('hex'))"
  ```

---

## 📱 Testing API Endpoints

### Test Login
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"password"}'

# Response:
# {"success":true,"data":{"sessionToken":"...","username":"admin","role":"admin"}}
```

### Test Send Message
```bash
# Set SESSION_TOKEN from login response
curl -X POST http://localhost:3000/api/messages/send \
  -H "Content-Type: application/json" \
  -H "x-session-token: YOUR_SESSION_TOKEN" \
  -d '{
    "recipientPhoneNumber": "62812xxxxxxx",
    "messageText": "Hello from CMS!"
  }'
```

### Test Get Contacts
```bash
curl http://localhost:3000/api/contacts \
  -H "x-session-token: YOUR_SESSION_TOKEN"
```

---

## 🔄 Workflow

### Incoming Message Flow
1. Meta sends webhook to `/api/webhook`
2. Signature verified → processWebhookEvent()
3. Message stored in database
4. Contact created/updated
5. Auto-reply triggered (if configured)
6. UI updates in real-time

### Outgoing Message Flow
1. User types message in chat
2. API call to `/api/messages/send`
3. Session verified
4. Meta API called via `metaApi.sendTextMessage()`
5. Message ID returned
6. Stored in database with status "sent"
7. Webhook updates status to delivered/read

---

## 📈 Performance Tips

1. **Database Indexes**: Schema sudah include indexes on frequently queried fields
2. **Pagination**: All list endpoints support limit/offset
3. **Caching**: Consider adding Redis for session caching
4. **Lazy Loading**: Media downloaded on-demand
5. **Connection Pool**: Drizzle uses pg pooling automatically

---

## 🎯 Next Steps

1. **Setup Database** ✓
2. **Configure Meta API** ✓
3. **Setup Webhook** ✓
4. **Test Login** ✓
5. **Send First Message** ✓
6. **Add Custom Features** (templates, automation)
7. **Deploy to Production**

---

**Happy Coding! 🚀**
