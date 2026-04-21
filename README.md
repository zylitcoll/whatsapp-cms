# 📱 WhatsApp Business CMS

A complete CMS (Content Management System) for managing WhatsApp Business communications using Meta's WhatsApp Cloud API. Built with Astro, React, Tailwind CSS, and PostgreSQL.

## ✨ Features

### 1. **Fitur Konektivitas (The Core)**
- ✅ **Webhook Handler (GET)** - Endpoint untuk verifikasi token saat setup Meta Developer Portal
- ✅ **Webhook Receiver (POST)** - Menerima real-time events dari Meta (pesan, status, media)
- ✅ **Message Dispatcher** - Helper functions untuk mengirim berbagai tipe pesan
- ✅ **Media Proxy** - Download dan cache media dari Meta API

### 2. **Manajemen Pesan (Inbox)**
- ✅ **Unified Chat Window** - Interface interaktif untuk percakapan dengan pelanggan
- ✅ **Message Status Tracker** - Indikator sent, delivered, read
- ✅ **Interactive Message Support** - Tombol untuk quick replies dan interactive messages
- ✅ **History Loader** - Load riwayat chat dari database

### 3. **CRM & Manajemen Kontak**
- ✅ **Contact List** - Daftar semua nomor yang pernah menghubungi
- ✅ **Contact Profile** - Nama, foto profil, metadata, label
- ✅ **Search & Filter** - Pencarian berdasarkan nama atau nomor

### 4. **Fitur Efisiensi (Automation)**
- ✅ **Template Manager** - Dashboard untuk WhatsApp templates yang sudah di-approve
- ✅ **Canned Responses** - Quick replies untuk pertanyaan umum
- ✅ **Auto-Reply** - Simple bot untuk reply di luar jam kerja

### 5. **Backend & Real-time**
- ✅ **Database Integration** - PostgreSQL + Drizzle ORM untuk persistent storage
- ✅ **Authentication** - Session-based login dengan hashing
- ✅ **Activity Logging** - Catat semua aksi admin
- ✅ **API Routes** - RESTful API endpoints untuk semua operasi

## 🚀 Quick Start

### Prerequisites
- Node.js >= 22.12.0
- PostgreSQL database
- Meta WhatsApp Business Account

### Installation

```bash
# 1. Install dependencies
npm install

# 2. Setup environment
cp .env.example .env.local
# Edit .env.local dengan Meta API credentials

# 3. Initialize database
npm run db:generate
npm run db:push

# 4. Start development server
npm run dev
```

**Demo Login:**
- Username: `admin`
- Password: `password`

## 📁 Project Structure

```
src/
├── api/                    # API Routes (Astro SSR)
│   ├── webhook.ts         # Meta webhook handler
│   ├── messages-send.ts   # Send message endpoint
│   ├── messages-[id].ts   # Get conversation history
│   ├── contacts.ts        # Contact list
│   ├── templates.ts       # WhatsApp templates
│   ├── canned-responses.ts # Quick replies
│   ├── dashboard-stats.ts # Stats endpoint
│   ├── auth-login.ts      # Login endpoint
│   └── auth-logout.ts     # Logout endpoint
│
├── components/            # React Components (Islands)
│   ├── ContactList.tsx    # Contact sidebar
│   ├── ChatWindow.tsx     # Chat interface
│   ├── TemplateManager.tsx # Templates
│   ├── CannedResponses.tsx # Quick replies
│   └── DashboardStats.tsx  # Stats card
│
├── db/                    # Database
│   ├── schema.ts          # Drizzle ORM schema
│   └── client.ts          # Database connection
│
├── lib/                   # Utilities
│   ├── meta-api.ts        # Meta API client
│   ├── auth.ts            # Auth utilities
│   └── webhook-handler.ts # Webhook processor
│
├── pages/                 # Astro Pages
│   ├── index.astro        # Login page
│   └── dashboard.astro    # Dashboard page
└── types/                 # TypeScript definitions
    └── index.ts           # All types
```

## 🔌 API Endpoints

### Webhooks
- `GET /api/webhook` - Verify webhook from Meta
- `POST /api/webhook` - Receive webhook events

### Messages
- `POST /api/messages/send` - Send message
- `GET /api/messages/:contactId` - Get conversation history

### Contacts
- `GET /api/contacts` - List all contacts

### Templates & Replies
- `GET /api/templates` - List WhatsApp templates
- `GET /api/canned-responses` - List quick replies

### Dashboard
- `GET /api/dashboard/stats` - Get statistics

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout

## 🔑 Configuration

### Environment Variables (.env.local)

```bash
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/whatsapp_cms

# Meta WhatsApp API
META_PHONE_NUMBER_ID=120123456789
WHATSAPP_ACCESS_TOKEN=EAABs8Co1234ABCD...
META_VERIFY_TOKEN=your_random_verify_token
META_API_VERSION=v18.0

# Admin Authentication
ADMIN_PASSWORD_HASH=5e884898da28...
ADMIN_USERNAME=admin

# Session
SESSION_SECRET=min_32_character_random_string

# URLs
APP_URL=http://localhost:3000
PUBLIC_APP_URL=http://localhost:3000

# Environment
NODE_ENV=development
```

### Meta Webhook Setup

1. Go to Meta Developer Portal → WhatsApp Product
2. Configuration → Webhook:
   - **Callback URL:** `https://your-domain.com/api/webhook`
   - **Verify Token:** (same as `META_VERIFY_TOKEN`)
3. Subscribe to: `messages`, `message_status`
4. Test webhook verification

## 🧪 Testing

### Test Login
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"password"}'
```

### Test Send Message
```bash
curl -X POST http://localhost:3000/api/messages/send \
  -H "Content-Type: application/json" \
  -H "x-session-token: SESSION_TOKEN" \
  -d '{
    "recipientPhoneNumber": "62812xxxxxxx",
    "messageText": "Hello!"
  }'
```

### Test Get Contacts
```bash
curl http://localhost:3000/api/contacts \
  -H "x-session-token: SESSION_TOKEN"
```

## 📊 Database Schema

| Table | Purpose |
|-------|---------|
| `messages` | Store all sent/received messages |
| `contacts` | Manage customer information |
| `templates` | WhatsApp approved templates |
| `cannedResponses` | Quick reply templates |
| `mediaCache` | Cached media files |
| `sessions` | User sessions |
| `activityLogs` | Admin activity tracking |

## 📝 Common Commands

```bash
# Development
npm run dev           # Start dev server
npm run build         # Build for production

# Database
npm run db:generate   # Generate migrations
npm run db:push       # Apply migrations
npm run db:studio     # Open Drizzle Studio
npm run db:drop       # Reset database
```

## 🚀 Deployment

### Build
```bash
npm run build
```

### Deploy to Vercel
```bash
npm install -g vercel
vercel
```

### Environment for Production
- Set `PUBLIC_APP_URL` to your domain
- Use strong `SESSION_SECRET`
- Update `DATABASE_URL` to production database
- Ensure `WHATSAPP_ACCESS_TOKEN` is up-to-date
- Set webhook URL to production domain in Meta Portal

## 🐛 Troubleshooting

| Issue | Solution |
|-------|----------|
| Webhook not receiving | Verify `META_VERIFY_TOKEN` matches Meta Portal |
| Database error | Check `DATABASE_URL` and PostgreSQL is running |
| Message send fails | Verify access token, phone number format |
| Login fails | Check `ADMIN_PASSWORD_HASH` configuration |

## 📚 Resources

- [WordPress Cloud API Docs](https://developers.facebook.com/docs/whatsapp/cloud-api)
- [Astro Documentation](https://docs.astro.build)
- [Drizzle ORM](https://orm.drizzle.team)
- [PostgreSQL](https://www.postgresql.org/docs/)

## 📄 License

MIT License

---

For detailed setup instructions, see [SETUP.md](SETUP.md)
