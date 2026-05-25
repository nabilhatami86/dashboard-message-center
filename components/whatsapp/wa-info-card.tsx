import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function WaInfoCard() {
  return (
    <Card className="mt-6">
      <CardHeader>
        <CardTitle>Informasi</CardTitle>
      </CardHeader>
      <CardContent>
        <ul className="list-disc list-inside space-y-2 text-sm text-muted-foreground">
          <li>WhatsApp akan tetap terhubung selama service berjalan</li>
          <li>Jika QR code expired, klik &quot;Refresh QR&quot; untuk generate QR baru</li>
          <li>Logout akan menghapus session dan memerlukan scan QR ulang</li>
          <li>
            Pastikan Baileys service berjalan di{" "}
            <code className="px-1 py-0.5 bg-muted rounded">localhost:3001</code>
          </li>
        </ul>
      </CardContent>
    </Card>
  );
}
