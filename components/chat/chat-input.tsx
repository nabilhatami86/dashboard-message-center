import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function ChatInput() {
  return (
    <div className="border-t p-3 flex gap-2">
      <Input placeholder="Ketik pesan..." />
      <Button>Kirim</Button>
    </div>
  );
}
