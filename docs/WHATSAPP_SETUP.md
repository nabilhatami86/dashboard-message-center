# 📱 WhatsApp Integration Setup Guide

## Cara Kerja Sistem

```
Customer kirim WhatsApp ke nomor admin
         ↓
WHAPI menerima pesan
         ↓
WHAPI kirim webhook ke Backend Python (POST /webhook/whapi)
         ↓
Backend Python:
  - Buat/update chat di database
  - Simpan message dengan sender="customer"
  - (Opsional) Balas otomatis jika mode="bot"
         ↓
Dashboard Admin/Agent:
  - Auto-refresh setiap 5 detik
  - Fetch chats dari backend (GET /chats/)
  - Tampilkan chat baru
         ↓
Admin/Agent balas via dashboard
         ↓
Backend kirim ke WHAPI
         ↓
Customer terima balasan di WhatsApp
```

---

## 🔧 Setup Backend Python (Sudah Ada)

Backend Anda sudah memiliki webhook handler di:
```
backend-dashboard-python/app/whapi/webhook.py
```

### Endpoints yang Sudah Tersedia:
1. **POST /webhook/whapi** - Menerima webhook dari WHAPI
2. **GET /chats/** - Ambil semua chat (dengan JWT token)
3. **POST /chats/messages** - Kirim pesan

---

## 🌐 Setup WHAPI Webhook

### 1. Login ke WHAPI Dashboard
   - Buka: https://panel.whapi.cloud/
   - Login dengan akun Anda

### 2. Configure Webhook URL
   - Pilih channel/nomor WhatsApp Anda
   - Pergi ke **Settings** → **Webhooks**
   - Set webhook URL:
     ```
     https://your-backend-domain.com/webhook/whapi
     ```

     **Contoh Development (dengan ngrok)**:
     ```
     https://abc123.ngrok.io/webhook/whapi
     ```

### 3. Enable Webhook Events
   Aktifkan events berikut:
   - ✅ **messages** - Untuk menerima pesan masuk
   - ✅ **messages.update** - Untuk update status pesan

### 4. Test Webhook
   - WHAPI biasanya ada tombol "Test Webhook"
   - Atau kirim pesan WhatsApp ke nomor admin
   - Cek backend logs untuk memastikan webhook diterima

---

## 🚀 Setup Backend (FastAPI)

### 1. Install Dependencies
```bash
cd backend-dashboard-python
pip install -r requirements.txt
```

### 2. Configure Environment Variables
Edit `.env`:
```env
# Database
DATABASE_URL=sqlite:///./dashboard.db  # atau PostgreSQL

# WHAPI Configuration
WHAPI_API_URL=https://gate.whapi.cloud
WHAPI_API_KEY=your_whapi_api_key_here
WHAPI_CHANNEL_ID=your_channel_id_here

# JWT Secret
SECRET_KEY=your-secret-key-here
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_HOURS=720

# OpenAI (optional untuk bot)
OPENAI_API_KEY=your_openai_key_here
```

### 3. Initialize Database
```bash
# Backend akan auto-create tables on startup
python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### 4. Create Admin User
```bash
# Via API
curl -X POST "http://localhost:8000/auth/register" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Admin User",
    "username": "admin",
    "email": "admin@example.com",
    "password": "admin123",
    "role": "admin"
  }'
```

---

## 📲 Test WhatsApp Integration

### 1. Kirim Pesan dari WhatsApp
   - Buka WhatsApp di HP Anda
   - Kirim pesan ke **nomor admin** yang terdaftar di WHAPI
   - Contoh: "Halo, saya butuh bantuan"

### 2. Cek Backend Logs
   ```bash
   # Backend logs akan menampilkan:
   INFO: Webhook received from WhatsApp
   INFO: Created/Updated chat for +6281234567890
   INFO: Saved customer message
   ```

### 3. Cek Dashboard
   - Login ke dashboard: `http://localhost:3000/login`
   - Masuk sebagai **admin** atau **agent**
   - Chat baru akan muncul di sidebar (maks 5 detik delay)
   - Klik chat untuk melihat pesan

### 4. Balas dari Dashboard
   - Ketik balasan di chat window
   - Klik Send atau tekan Enter
   - Pesan akan dikirim ke WhatsApp customer
   - Customer akan terima di HP mereka

---

## 🔄 Flow Lengkap

### Customer → Dashboard (Incoming)
1. Customer kirim WhatsApp: "Halo admin"
2. WHAPI → Webhook → Backend Python
3. Backend:
   ```python
   - get_or_create_chat(phone_number)
   - save_customer_message(text="Halo admin", sender="customer")
   - (optional) send_bot_reply() if mode="bot"
   ```
4. Dashboard auto-refresh (5 detik)
5. Frontend: GET /chats/ → Tampilkan chat baru

### Dashboard → Customer (Outgoing)
1. Admin/Agent ketik balasan di dashboard
2. Frontend: POST /chats/messages
   ```json
   {
     "chat_id": 1,
     "text": "Halo, ada yang bisa kami bantu?",
     "sender": "agent",
     "agent_id": 1
   }
   ```
3. Backend:
   ```python
   - save_message(sender="agent")
   - send_whapi_message(phone, text)
   ```
4. WHAPI kirim ke WhatsApp customer
5. Customer terima di HP

---

## 🐛 Troubleshooting

### Webhook Tidak Terima Pesan

**Problem**: Kirim WhatsApp tapi tidak muncul di dashboard

**Solusi**:
1. **Cek Webhook URL**
   ```bash
   # Test backend endpoint
   curl -X POST "http://localhost:8000/webhook/whapi" \
     -H "Content-Type: application/json" \
     -d '{
       "messages": [{
         "from": "6281234567890",
         "type": "text",
         "text": {
           "body": "Test message"
         }
       }]
     }'
   ```

2. **Cek WHAPI Configuration**
   - Login WHAPI dashboard
   - Verify webhook URL benar
   - Cek "Webhook logs" untuk error

3. **Cek Firewall/CORS**
   - Backend harus accessible dari internet
   - Jika development, gunakan ngrok/cloudflare tunnel

4. **Cek Backend Logs**
   ```bash
   # Lihat logs real-time
   tail -f backend.log
   ```

### Chat Tidak Muncul di Dashboard

**Problem**: Backend terima webhook tapi dashboard kosong

**Solusi**:
1. **Cek Database**
   ```bash
   sqlite3 dashboard.db
   SELECT * FROM chats;
   SELECT * FROM messages;
   ```

2. **Cek API Response**
   ```bash
   # Login dulu
   TOKEN=$(curl -X POST "http://localhost:8000/auth/login" \
     -H "Content-Type: application/json" \
     -d '{"identifier":"admin","password":"admin123"}' \
     | jq -r '.access_token')

   # Fetch chats
   curl "http://localhost:8000/chats/" \
     -H "Authorization: Bearer $TOKEN"
   ```

3. **Cek Frontend Console**
   - Buka browser DevTools (F12)
   - Tab Console → Lihat error
   - Tab Network → Cek API calls

### Pesan Tidak Terkirim ke WhatsApp

**Problem**: Kirim dari dashboard tapi customer tidak terima

**Solusi**:
1. **Cek WHAPI API Key**
   ```bash
   # Test WHAPI connection
   curl "https://gate.whapi.cloud/messages/text" \
     -H "Authorization: Bearer YOUR_WHAPI_API_KEY" \
     -H "Content-Type: application/json" \
     -d '{
       "to": "6281234567890",
       "body": "Test message"
     }'
   ```

2. **Cek WHAPI Channel Status**
   - Pastikan channel aktif
   - QR code sudah di-scan
   - WhatsApp Web connected

3. **Cek Backend Logs**
   - Error dari WHAPI API
   - Rate limit exceeded?
   - Invalid phone number format?

---

## 🔐 Production Setup

### 1. Deploy Backend
   **Opsi A: Railway**
   ```bash
   railway login
   railway init
   railway up
   ```

   **Opsi B: Heroku**
   ```bash
   heroku create
   git push heroku main
   ```

   **Opsi C: VPS**
   ```bash
   # Install supervisor untuk keep-alive
   sudo apt install supervisor

   # Config: /etc/supervisor/conf.d/dashboard.conf
   [program:dashboard-backend]
   command=/usr/bin/python -m uvicorn app.main:app --host 0.0.0.0 --port 8000
   directory=/var/www/backend-dashboard-python
   user=www-data
   autostart=true
   autorestart=true
   ```

### 2. Configure Domain
   - Point domain ke server IP
   - Setup Nginx reverse proxy
   - Install SSL (Let's Encrypt)

### 3. Update WHAPI Webhook
   ```
   https://api.yourdomain.com/webhook/whapi
   ```

### 4. Update Frontend .env
   ```env
   NEXT_PUBLIC_API_URL=https://api.yourdomain.com
   ```

---

## 📊 Monitoring

### Backend Logs
```bash
# Watch logs
tail -f /var/log/dashboard/backend.log

# Filter webhook events
grep "webhook" /var/log/dashboard/backend.log
```

### Database Stats
```sql
-- Count chats
SELECT COUNT(*) FROM chats;

-- Recent messages
SELECT * FROM messages ORDER BY created_at DESC LIMIT 10;

-- Active chats today
SELECT COUNT(*) FROM chats
WHERE DATE(created_at) = DATE('now');
```

---

## 🎯 Summary

Sistem Anda **SUDAH SIAP** untuk menerima chat WhatsApp:

✅ **Backend webhook handler** sudah ada
✅ **Database** untuk simpan chat & messages
✅ **Dashboard Admin** untuk lihat & balas chat
✅ **Dashboard Agent** untuk assigned chats
✅ **Auto-refresh** setiap 5 detik
✅ **WHAPI integration** untuk kirim/terima WhatsApp

**Yang Perlu Dilakukan**:
1. ✅ Setup WHAPI webhook URL
2. ✅ Configure backend environment variables
3. ✅ Test kirim WhatsApp
4. ✅ Login dashboard dan lihat chat muncul
5. ✅ Balas dari dashboard

**Selamat! Sistem WhatsApp → Dashboard sudah terintegrasi!** 🎉
