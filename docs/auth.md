# Auth Components

Komponen untuk proteksi route dan inisialisasi auth.

---

## ProtectedRoute

Bungkus halaman yang butuh login. Redirect otomatis ke `/login` jika belum auth, atau ke halaman yang sesuai jika role tidak cocok.

```tsx
import ProtectedRoute from "@/components/auth/ProtectedRoute";

// Halaman khusus admin
export default function AdminPage() {
  return (
    <ProtectedRoute requiredRole="admin">
      <AdminDashboardContent />
    </ProtectedRoute>
  );
}

// Halaman khusus agent
export default function AgentPage() {
  return (
    <ProtectedRoute requiredRole="agent">
      <AgentDashboardContent />
    </ProtectedRoute>
  );
}

// Bisa juga terima array role
<ProtectedRoute requiredRole={["admin", "agent"]}>
  <SharedPage />
</ProtectedRoute>
```

| Prop | Tipe | Keterangan |
|------|------|-----------|
| `children` | `ReactNode` | Konten halaman yang diproteksi |
| `requiredRole` | `"admin" \| "agent" \| Role[]` | Role yang diizinkan masuk |

**Alur redirect:**
- Belum login → `/login`
- Login tapi role salah: admin masuk halaman agent → `/dashboard-agent`, agent masuk halaman admin → `/dashboard-admin`

---

## AuthInitializer

Komponen invisible yang restore auth state dari localStorage saat pertama kali app dibuka. Dipasang di `layout.tsx`, tidak perlu dipakai di tempat lain.

```tsx
import AuthInitializer from "@/components/auth/AuthInitializer";

// Di app/layout.tsx
export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <AuthInitializer />
        {children}
      </body>
    </html>
  );
}
```

Tidak ada props. Komponen ini hanya memanggil `useAuthStore().initialize()` saat mount.

---

## useAuthStore

Bukan komponen, tapi sering dipakai bareng ProtectedRoute. State management auth dengan Zustand.

```tsx
import { useAuthStore } from "@/store/authStore";

// Di dalam komponen
const user  = useAuthStore((state) => state.user);
const token = useAuthStore((state) => state.token);
const logout = useAuthStore((state) => state.logout);

// Cek role
if (user?.role !== "admin") redirect("/dashboard-agent");

// Logout
<button onClick={() => { logout(); router.push("/login"); }}>
  Logout
</button>
```

Field `user`: `{ id, name, email, role: "admin" | "agent" }`
