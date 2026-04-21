# 🚀 Quick Reference Card

## Initial Setup

```bash
# 1. Install dependencies
npm install

# 2. Setup database
createdb whatsapp_cms

# 3. Create environment file
cp .env.example .env.local

# 4. Edit .env.local with your credentials
# - DATABASE_URL (PostgreSQL connection)
# - META_PHONE_NUMBER_ID
# - WHATSAPP_ACCESS_TOKEN
# - META_VERIFY_TOKEN

# 5. Initialize database
npm run db:generate
npm run db:push

# 6. Start development server
npm run dev
```

**Result**: Server runs at http://localhost:3000

---

## Credentials Setup

### For Development

```bash
# .env.local file
DATABASE_URL=postgresql://user:password@localhost:5432/whatsapp_cms
META_PHONE_NUMBER_ID=120123456789
WHATSAPP_ACCESS_TOKEN=EAAB...your_token...
META_VERIFY_TOKEN=your_random_token_123
```

### For Meta Webhook Setup

1. Go to Meta Developer Portal
2. WhatsApp Product → Configuration
3. Webhook URL: `https://your-domain.com/api/webhook`
4. Verify Token: (use same as `META_VERIFY_TOKEN`)
5. Subscribe to: `messages`, `message_status`

---

## Common Commands

```bash
# Development
npm run dev              # Start dev server
npm run build            # Build for production
npm run preview          # Preview production build

# Database
npm run db:generate       # Create migration files
npm run db:push          # Apply migrations to database
npm run db:studio        # Open Drizzle visualization
npm run db:drop          # Reset database (CAREFUL!)

# Testing
npm run build            # Check for build errors
```

---

## API Endpoints Quick Test

### Login
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"password"}'
```

### Get Contacts
```bash
curl http://localhost:3000/api/contacts \
  -H "x-session-token: SESSION_TOKEN_HERE"
```

### Send Message
```bash
curl -X POST http://localhost:3000/api/messages/send \
  -H "Content-Type: application/json" \
  -H "x-session-token: SESSION_TOKEN_HERE" \
  -d '{
    "recipientPhoneNumber": "62812xxxxxxx",
    "messageText": "Hello!"
  }'
```

### Get Stats
```bash
curl http://localhost:3000/api/dashboard/stats \
  -H "x-session-token: SESSION_TOKEN_HERE"
```

---

## Password Management

### Change Admin Password

```bash
# Generate hash of new password
node -e "console.log(require('crypto').createHash('sha256').update('mynewpassword').digest('hex'))"

# Output: abc123def456...
# Add to .env.local
ADMIN_PASSWORD_HASH=abc123def456...
```

### Default Demo Password
- Username: `admin`
- Password: `password`
- Hash: `5e884898da28047151d0e56f8dc62927c95913f8a80e0bbda4b12aef2b79f21a`

---

## Environment Variables

### Required
- `DATABASE_URL` - PostgreSQL connection string
- `META_PHONE_NUMBER_ID` - From Meta Portal
- `WHATSAPP_ACCESS_TOKEN` - From Meta Portal
- `META_VERIFY_TOKEN` - Your random token

### Optional
- `ADMIN_PASSWORD_HASH` - Change default admin password
- `SESSION_SECRET` - Random string (32+ chars)
- `APP_URL` - Base app URL
- `NODE_ENV` - Set to 'production' for build

---

## Database Structure

| Table | Purpose | Key Fields |
|-------|---------|-----------|
| `messages` | Store all messages | id, contactId, content, direction, status |
| `contacts` | Customer information | id, phoneNumber, displayName, label |
| `templates` | WhatsApp templates | id, name, content, isApproved |
| `cannedResponses` | Quick replies | id, title, content, shortcut |
| `sessions` | User sessions | id, userId, token, expiresAt |
| `mediaCache` | Cached media | id, mediaId, localUrl, expiresAt |
| `activityLogs` | Audit trail | id, userId, action, timestamp |

---

## Troubleshooting

| Problem | Solution |
|---------|----------|
| Port 3000 in use | `lsof -i :3000` then `kill -9 PID` |
| Database error | Check PostgreSQL is running: `brew services list` |
| Build fails | Delete `dist/` folder, then `npm run build` |
| Webhook not working | Verify token matches Meta Portal config |
| Login fails | Check `ADMIN_PASSWORD_HASH` in .env.local |
| API timeout | Ensure `DATABASE_URL` is accessible |

---

## Useful Tools

```bash
# Check PostgreSQL is running
brew services list

# Start PostgreSQL
brew services start postgresql

# Stop PostgreSQL  
brew services stop postgresql

# View all databases
psql -l

# Connect to database
psql whatsapp_cms

# Database commands in psql
\dt               # List all tables
\d messages       # Describe table
SELECT * FROM messages LIMIT 5;  # Query
\q               # Quit
```

---

## Project Structure at a Glance

```
src/
├── api/              # API endpoints
├── components/       # React UI components
├── db/              # Database (schema + client)
├── lib/             # Utilities (Meta API, auth, webhooks)
├── pages/           # Astro pages (UI routes)
├── types/           # TypeScript types
└── styles/          # CSS files
```

---

## File Size Reference

Typical project sizes:
- `node_modules/` - ~500MB
- `dist/` (build) - ~50MB
- Source code - ~2MB
- Database - Depends on usage

---

## Performance Tips

1. **Database**: Indexes are configured on common queries
2. **API**: Add limit/offset for pagination
3. **Frontend**: React components are lazy-loaded
4. **Media**: Downloaded on-demand, not pre-cached

---

## Production Deployment

```bash
# 1. Build
npm run build

# 2. Start
node dist/server/entry.mjs

# 3. Or use process manager
pm2 start dist/server/entry.mjs --name whatsapp-cms
```

Environment variables for production:
- `NODE_ENV=production`
- Use strong `SESSION_SECRET`
- Update webhook URL to production domain
- Use production database credentials

---

## Support Resources

📚 **Documentation**
- [Astro Docs](https://docs.astro.build)
- [Drizzle ORM](https://orm.drizzle.team)
- [Meta WhatsApp API](https://developers.facebook.com/docs/whatsapp)

🔧 **Tools**
- [ngrok](https://ngrok.com) - For webhook testing locally
- [Drizzle Studio](https://local.drizzle.studio) - Database visualizer
- [Postman](https://postman.com) - API testing

---

**Version**: 1.0.0
**Last Updated**: April 21, 2026
**Status**: Ready to Use ✅
