import { create } from "zustand";

interface MobileSidebarStore {
  open: boolean;
  toggle: () => void;
  close: () => void;
}

export const useMobileSidebar = create<MobileSidebarStore>((set) => ({
  open: false,
  toggle: () => set((s) => ({ open: !s.open })),
  close: () => set({ open: false }),
}));
