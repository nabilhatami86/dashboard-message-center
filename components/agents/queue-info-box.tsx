import { AlertCircle } from "lucide-react";

export function QueueInfoBox() {
  return (
    <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
      <div className="flex gap-3">
        <AlertCircle className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
        <div className="text-sm text-blue-800">
          <p className="font-medium mb-1">Cara Kerja Ticket Queue:</p>
          <ul className="list-disc list-inside space-y-1 text-blue-700">
            <li>Chat masuk dari WhatsApp otomatis masuk ke queue</li>
            <li>Ticket ditampilkan berdasarkan urutan waktu (FIFO - First In First Out)</li>
            <li>Siapa cepat dia dapat! Klik &quot;AMBIL SEKARANG&quot; untuk claim ticket</li>
            <li>Setelah diambil, chat akan muncul di dashboard agent kamu</li>
            <li>Queue auto-refresh setiap 5 detik</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
