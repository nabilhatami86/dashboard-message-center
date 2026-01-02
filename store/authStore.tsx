import { create } from "zustand";
import { persist } from "zustand/middleware";
import { login as apiLogin, setAuthData, clearAuthData, getUserData } from "@/lib/api";

export type Role = "admin" | "agent";

export interface User {
  id: number;
  name: string;
  username: string;
  email: string;
  phone?: string;
  role: Role;
}

interface AuthState {
  user: User | null;
  token: string | null;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
  initialize: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,

      // Initialize from localStorage on app start
      initialize: () => {
        const userData = getUserData();
        const token = typeof window !== "undefined" ? localStorage.getItem("access_token") : null;
        if (userData && token) {
          set({ user: userData as User, token });
        }
      },

      // Login via backend API
      login: async (username, password) => {
        try {
          const response = await apiLogin(username, password);

          // Save to localStorage
          setAuthData(response);

          // Update Zustand state
          set({
            user: response.data as User,
            token: response.access_token,
          });

          return true;
        } catch (error) {
          console.error("Login failed:", error);
          return false;
        }
      },

      // Logout
      logout: () => {
        clearAuthData();
        set({ user: null, token: null });
      },
    }),
    {
      name: "auth-storage",
      partialize: (state) => ({
        user: state.user,
        token: state.token,
      }),
    }
  )
);
