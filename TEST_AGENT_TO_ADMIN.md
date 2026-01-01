# 🧪 Testing Agent to Admin Chat

## 📋 Konteks Sistem
Ini adalah sistem komunikasi internal untuk **Warung Madura** dimana:
- **Agent** = Pemilik warung yang mengalami kendala
- **Admin** = Support center yang membantu agent menyelesaikan masalah
- **Tipe Masalah**: Stock barang, kendala operasional, pertanyaan sistem, dll.

---

## 🎯 Skenario Testing

### Skenario 1: Agent Tanya Stock Habis
```
Agent: "Min, stock indomie goreng habis. Kapan bisa restock?"
Bot AI: "Baik, saya catat stock Indomie Goreng habis. Untuk restock biasanya 1-2 hari kerja. Admin akan segera membantu Anda."
```

### Skenario 2: Agent Tanya Masalah Pembayaran
```
Agent: "Admin, ada customer bayar tapi belum masuk ke sistem"
Bot AI: "Terima kasih laporannya. Tim admin akan segera cek transaksi pembayaran Anda. Mohon tunggu sebentar."
```

### Skenario 3: Agent Lapor Kendala Sistem
```
Agent: "Sistemnya error, gak bisa input pesanan baru"
Bot AI: "Maaf atas kendalanya. Tim teknis akan segera memeriksa masalah sistem Anda. Mohon tunggu max 15 menit."
```

### Skenario 4: Agent Tanya Promo
```
Agent: "Min, ada promo bulan ini gak? Customer banyak yang nanya"
Bot AI: "Untuk info promo terbaru, admin akan segera informasikan ke Anda. Terima kasih sudah bertanya."
```

### Skenario 5: Agent Komplain Pengiriman
```
Agent: "Pengiriman kemarin telat 3 jam, customer komplain"
Bot AI: "Mohon maaf atas keterlambatan pengiriman. Admin akan koordinasi dengan tim logistik dan segera menghubungi Anda."
```

---

## 🤖 Bot AI Response Template

### Template untuk Masalah Stock
```
"Baik, stock {nama_produk} dicatat. Restock biasanya {waktu}. Admin akan segera membantu koordinasi stock Anda."
```

### Template untuk Masalah Teknis
```
"Maaf atas kendala {jenis_masalah}. Tim teknis akan segera memeriksa. Mohon tunggu max {estimasi_waktu}."
```

### Template untuk Pertanyaan Umum
```
"Terima kasih pertanyaannya tentang {topik}. Admin akan segera memberikan informasi yang Anda butuhkan."
```

### Template untuk Komplain
```
"Mohon maaf atas {masalah}. Admin akan segera koordinasi dan menghubungi Anda untuk solusinya."
```

### Template untuk Permintaan Bantuan
```
"Baik, saya catat permintaan Anda. Admin akan segera membantu menyelesaikan masalah ini."
```

---

## 📊 Data Testing Chat

Berikut contoh data testing yang bisa digunakan:

```json
{
  "chats": [
    {
      "id": 1,
      "name": "Warung Pak Budi",
      "channel": "WhatsApp",
      "online": true,
      "unread": 2,
      "mode": "bot",
      "profile": {
        "phone": "081234567890",
        "email": "warung.pakbudi@gmail.com",
        "address": "Jl. Madura No. 12, Surabaya",
        "lastActive": "Online"
      },
      "messages": [
        {
          "id": 1,
          "text": "Min, stock indomie goreng habis",
          "sender": "customer",
          "time": "09:15",
          "status": "read"
        },
        {
          "id": 2,
          "text": "Baik, saya catat stock Indomie Goreng habis. Untuk restock biasanya 1-2 hari kerja. Admin akan segera membantu Anda.",
          "sender": "agent",
          "time": "09:15",
          "status": "sent"
        },
        {
          "id": 3,
          "text": "Urgent min, banyak yang minta",
          "sender": "customer",
          "time": "09:20",
          "status": "read"
        }
      ]
    },
    {
      "id": 2,
      "name": "Warung Bu Siti",
      "channel": "WhatsApp",
      "online": false,
      "unread": 0,
      "mode": "agent",
      "profile": {
        "phone": "082345678901",
        "email": "warung.busiti@gmail.com",
        "address": "Jl. Raya Madura No. 45, Bangkalan",
        "lastActive": "15 minutes ago"
      },
      "messages": [
        {
          "id": 4,
          "text": "Admin, ada customer bayar tapi belum masuk ke sistem",
          "sender": "customer",
          "time": "08:45",
          "status": "read"
        },
        {
          "id": 5,
          "text": "Terima kasih laporannya. Tim admin akan segera cek transaksi pembayaran Anda. Mohon tunggu sebentar.",
          "sender": "agent",
          "time": "08:45",
          "status": "read"
        },
        {
          "id": 6,
          "text": "Sudah saya cek, transaksi Anda sudah masuk kok. Coba refresh sistemnya.",
          "sender": "agent",
          "time": "08:50",
          "status": "read"
        },
        {
          "id": 7,
          "text": "Oke min, sudah muncul. Terima kasih",
          "sender": "customer",
          "time": "08:52",
          "status": "read"
        }
      ]
    },
    {
      "id": 3,
      "name": "Warung Mas Agus",
      "channel": "Telegram",
      "online": true,
      "unread": 1,
      "mode": "bot",
      "profile": {
        "phone": "083456789012",
        "email": "warung.masagus@gmail.com",
        "address": "Jl. Pamekasan No. 78, Sampang",
        "lastActive": "Online"
      },
      "messages": [
        {
          "id": 8,
          "text": "Sistemnya error, gak bisa input pesanan baru",
          "sender": "customer",
          "time": "10:05",
          "status": "read"
        },
        {
          "id": 9,
          "text": "Maaf atas kendalanya. Tim teknis akan segera memeriksa masalah sistem Anda. Mohon tunggu max 15 menit.",
          "sender": "agent",
          "time": "10:05",
          "status": "sent"
        }
      ]
    }
  ]
}
```

---

## 🔧 Cara Menggunakan Data Testing

### Option 1: Manual Input via Dashboard
1. Login sebagai admin
2. Buat chat baru untuk setiap warung
3. Simulasikan pesan dari customer (warung)
4. Test bot response

### Option 2: Import ke Backend Database
```bash
# Jalankan script SQL untuk insert data testing
# Atau gunakan API endpoint untuk create chat & messages
curl -X POST "http://localhost:8000/chats/" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "customer_name": "Warung Pak Budi",
    "customer_phone": "081234567890",
    "channel": "WhatsApp"
  }'
```

### Option 3: Update Frontend Mock Data
Untuk testing tanpa backend, tambahkan mock data di `dashboard-admin/page.tsx`

---

## 📝 Checklist Testing

- [ ] Bot auto-reply ke pesan agent tentang stock
- [ ] Bot auto-reply ke pesan agent tentang masalah teknis
- [ ] Bot auto-reply ke pesan agent tentang komplain
- [ ] Admin bisa assign chat dari bot ke agent mode
- [ ] Admin bisa balas pesan agent secara manual
- [ ] Agent bisa lihat status message (sent/read)
- [ ] Notifikasi unread message untuk admin
- [ ] Search/filter chat berdasarkan nama warung

---

## 🎯 Expected Bot Behavior

1. **Mode BOT**:
   - Auto-reply segera ke setiap pesan agent
   - Berikan response supportif & informatif
   - Catat masalah yang dilaporkan

2. **Mode AGENT**:
   - Admin bisa reply manual
   - Bot tidak auto-reply
   - Admin bisa lihat history conversation

3. **Mode PAUSED**:
   - Chat dijeda sementara
   - Pesan tetap masuk tapi tidak auto-reply
   - Admin bisa resume kapan saja

---

## 🚀 Next Steps

1. Update bot AI responses di backend Python
2. Test setiap skenario dengan data di atas
3. Fine-tune response untuk lebih natural
4. Tambahkan keyword detection untuk routing otomatis
5. Setup notification untuk urgent cases

**Selamat Testing!** 🎉
