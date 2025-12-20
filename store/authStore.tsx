import { create } from "zustand";

export type Role = "admin" | "agent";

export interface User {
  email: string;
  role: Role;
}

interface AuthState {
  user: User | null;
  login: (email: string, password: string) => boolean;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,

  login: (email, password) => {
    if (email === "admin" && password === "admin123") {
      set({ user: { email, role: "admin" } });
      return true;
    }

    if (email === "agent" && password === "agent123") {
      set({ user: { email, role: "agent" } });
      return true;
    }

    return false;
  },

  logout: () => {
    set({ user: null });
  },
}));
