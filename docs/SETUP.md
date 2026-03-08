# Setup Guide - Dashboard Message Center

## 🚀 Quick Start

### 1. Setup Environment Variables

Buat file `.env.local` dari template:

```bash
cp .env.example .env.local
```

Edit `.env.local` dan sesuaikan URL backend Python:

```env
NEXT_PUBLIC_API_URL=http://localhost:8000
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Jalankan Backend Python

Pastikan backend Python sudah berjalan di port yang sesuai (default: 8000).

### 4. Jalankan Frontend

```bash
npm run dev
```

Buka browser di `http://localhost:3000`

---

## 🔐 Login System

### Flow Login

1. **Akses halaman `/login`**
2. **Masukkan credentials**
   - Username: sesuai database backend
   - Password: sesuai database backend
3. **Backend akan authenticate**
   - POST request ke `/auth/login`
   - Mendapat JWT token dan user data
4. **Token disimpan di localStorage**
5. **Auto redirect** berdasarkan role:
   - Admin → `/dashboard-admin`
   - Agent → `/dashboard-agent`

### Demo Credentials

Gunakan credentials yang sudah ada di database backend Python:

```
Admin:
  Username: admin
  Password: admin123

Agent:
  Username: agent1
  Password: agent123
```

---

## 📁 Struktur Integrasi

### Frontend → Backend Flow

```
Login Page
   ↓
POST /auth/login (username, password)
   ↓
Backend Python authenticates
   ↓
Returns: { access_token, data: { id, name, username, email, role } }
   ↓
Save to localStorage & Zustand store
   ↓
Redirect to dashboard based on role
```

### Dashboard Agent → Backend Flow

```
Dashboard Agent loads
   ↓
GET /chats/ (with JWT token in header)
   ↓
Backend returns chats assigned to agent
   ↓
Display chats in UI
   ↓
Agent sends message
   ↓
POST /chats/messages { chat_id, text, sender: "agent", agent_id }
   ↓
Backend sends message via WhatsApp (WHAPI)
   ↓
Auto refresh every 5 seconds for new messages
```

---

## 🔑 Authentication Components

### 1. **AuthStore** (`store/authStore.tsx`)
- Zustand state management untuk auth
- Menyimpan user data dan token
- Persist di localStorage
- Functions: `login()`, `logout()`, `initialize()`

### 2. **ProtectedRoute** (`components/auth/ProtectedRoute.tsx`)
- HOC untuk protect pages
- Auto redirect ke `/login` jika belum login
- Role-based access control

### 3. **AuthInitializer** (`components/auth/AuthInitializer.tsx`)
- Auto-load auth state dari localStorage saat app start
- Sudah ditambahkan di root layout

### 4. **API Layer** (`lib/api.ts`)
- `login()` - Login ke backend
- `getChats()` - Fetch chats dengan JWT token
- `sendMessage()` - Kirim pesan via backend
- `getAdminChat()` - Admin chat (localStorage sementara)

---

## 🎯 Fitur Dashboard Agent

### Customer Chat Mode
- Fetch chats dari backend Python
- Kirim pesan ke customer → backend → WhatsApp
- Real-time updates (auto-refresh 5 detik)
- Lihat customer details

### Admin Chat Mode
- Chat internal dengan admin
- Toggle dengan sidebar icon
- Sementara menggunakan localStorage

### Logout
- Klik icon Logout di sidebar bawah
- Clear token & user data
- Redirect ke `/login`

---

## 🎯 Fitur Dashboard Admin

### Sekarang Terintegrasi dengan Backend! ✅
- **Fetch all chats** dari backend (admin melihat semua chat)
- **Send messages** ke customer via backend → WhatsApp
- **Simulate customer messages** untuk testing
- **Real-time updates** (auto-refresh 5 detik)
- **Assign to agent mode** (optimistic update)
- **Change chat mode** (bot/agent/paused/closed)
- **Logout button** (top-right corner)

---

## 🔧 Troubleshooting

### Login gagal
- **Cek backend Python running**: `http://localhost:8000/docs`
- **Cek credentials di database**
- **Cek CORS settings di backend**
- **Lihat browser console untuk error**

### Token expired
- Logout dan login ulang
- Backend belum implement token refresh

### Chats tidak muncul
- **Cek koneksi ke backend**
- **Cek JWT token valid**
- **Untuk agent**: pastikan ada chat assigned ke user

### WhatsApp tidak terkirim
- **Cek WHAPI configuration di backend**
- **Cek WHAPI API key valid**
- **Lihat backend logs**

---

## 📝 Implementation Status

### ✅ Completed Features
1. ✅ **Login System** - Terintegrasi dengan backend Python (`/auth/login`)
2. ✅ **Protected Routes** - Role-based access control (admin/agent)
3. ✅ **Dashboard Agent** - Fetch & send messages via backend API
4. ✅ **Dashboard Admin** - Fetch & send messages via backend API
5. ✅ **Admin Chat Feature** - Agent dapat chat dengan admin (internal)
6. ✅ **Real-time Updates** - Auto-refresh setiap 5 detik
7. ✅ **WhatsApp Integration** - Send via backend → WHAPI
8. ✅ **Optimistic UI** - Instant feedback, revert on error
9. ✅ **Auth Persistence** - Zustand + localStorage
10. ✅ **Logout Functionality** - Clear auth & redirect

### ⏳ Future Improvements
1. ⏳ **Admin Chat Backend** - Currently uses localStorage, needs backend API
2. ⏳ **Token Refresh** - Auto-refresh JWT before expiry
3. ⏳ **WebSocket** - Replace polling with real-time WebSocket
4. ⏳ **Update Chat Mode API** - Backend endpoint for assign/pause/resume
5. ⏳ **Agent Selection** - Dropdown to select specific agent
6. ⏳ **File Upload** - Support image/file attachments
7. ⏳ **Notification** - Browser notifications for new messages
8. ⏳ **Message Read Receipts** - Sync read status with backend

---

## 🆘 Support

Jika ada masalah, cek:
1. Browser console untuk frontend errors
2. Backend logs untuk API errors
3. Network tab untuk API request/response
4. localStorage untuk token & user data

Happy coding! 🎉
