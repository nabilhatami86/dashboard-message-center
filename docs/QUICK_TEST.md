# 🧪 Quick Test - WhatsApp Integration

## ✅ Sistem Sudah Siap!

Backend Anda **SUDAH MENERIMA** chat dari WhatsApp! Saya sudah verify ada data di database.

---

## 📱 Test Chat WhatsApp → Dashboard

### 1. **Kirim Pesan dari WhatsApp**
```
1. Buka WhatsApp di HP Anda
2. Kirim pesan ke nomor admin yang terdaftar di WHAPI
   Contoh: "Halo, saya butuh bantuan"
3. Tunggu 5-10 detik
```

### 2. **Login ke Dashboard**
```bash
# Buka browser
http://localhost:3000/login

# Login sebagai Admin
Username: admin
Password: admin123
```

### 3. **Lihat Chat Muncul**
```
✅ Chat akan muncul di sidebar kiri
✅ Klik chat untuk lihat pesan
✅ Auto-refresh setiap 5 detik
```

### 4. **Balas dari Dashboard**
```
1. Klik chat di sidebar
2. Ketik balasan: "Halo, ada yang bisa kami bantu?"
3. Tekan Enter atau klik Send
4. Customer akan terima di WhatsApp mereka
```

---

## 🔍 Debug Jika Tidak Muncul

### Cek 1: Backend Running
```bash
# Pastikan backend jalan
curl http://localhost:8000/docs

# Jika tidak jalan, start backend
cd backend-dashboard-python
python -m uvicorn app.main:app --reload --port 8000
```

### Cek 2: Ada Data di Database
```bash
# Login dulu
curl -X POST "http://localhost:8000/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"identifier":"admin","password":"admin123"}'

# Copy access_token dari response, lalu:
curl "http://localhost:8000/chats/" \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### Cek 3: Browser Console
```
1. Buka browser DevTools (F12)
2. Tab Console → Lihat error
3. Tab Network → Cek API calls
   - GET /chats/ → Should return 200
   - Response should have chats array
```

### Cek 4: WHAPI Webhook
```
1. Login ke WHAPI dashboard
2. Check webhook logs
3. Verify webhook URL correct
4. Test send webhook manually
```

---

## 📊 Data yang Sudah Ada

Saya sudah verify ada **9 chats** di database Anda:

| ID | Nama | Channel | Messages | Status |
|----|------|---------|----------|--------|
| 8 | 6287731624016 | WhatsApp | 12 msg | ✅ Active |
| 7 | نبيل | WhatsApp | 3 unread | ✅ Active |
| 9 | Test Messages | WhatsApp | 1 unread | ✅ Active |
| ... | ... | ... | ... | ... |

**Contoh Chat ID 8**:
- Phone: `6287731624016`
- Messages: 12 messages
- Last: "apa" (customer)
- Bot sudah auto-reply

---

## 🎯 Expected Flow

```
WhatsApp Customer (HP)
    ↓
"Halo admin" → Kirim
    ↓
WHAPI Webhook
    ↓
Backend Python (localhost:8000)
    ├─ Save to database (chats table)
    ├─ Save message (messages table)
    └─ Auto-reply if mode="bot"
    ↓
Frontend Dashboard (localhost:3000)
    ├─ Auto-refresh (5 detik)
    ├─ GET /chats/ with JWT token
    ├─ GET /chats/{id} for each chat (messages)
    └─ Display in sidebar
    ↓
Admin klik chat
    ↓
Lihat pesan customer
    ↓
Ketik balasan → Send
    ↓
POST /chats/messages
    ↓
Backend → WHAPI → WhatsApp Customer
    ↓
Customer terima di HP ✅
```

---

## 🚀 Ready to Test!

**Your system is READY!**

1. ✅ Backend webhook active
2. ✅ Database has chats
3. ✅ Frontend updated to fetch messages
4. ✅ Auto-refresh enabled

**Just do this**:
1. Send WhatsApp → Nomor admin di WHAPI
2. Login dashboard → `http://localhost:3000/login`
3. See chat appear (wait max 5 seconds)
4. Click & reply!

---

## 📝 Notes

- **Auto-refresh**: 5 detik (bisa diubah di `dashboard-agent/page.tsx` line 62)
- **JWT Token**: Expire setelah 720 jam (30 hari)
- **WHAPI**: Pastikan channel aktif & QR code scanned
- **Phone Format**: Backend auto-handle format (6287xxx atau +62 87xxx)

**Selamat mencoba!** 🎉
