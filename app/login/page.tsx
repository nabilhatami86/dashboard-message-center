"use client";

import { useState, useEffect, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { useAuthStore } from "@/store/authStore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function LoginPage() {
  const router = useRouter();
  const login = useAuthStore((state) => state.login);
  const user = useAuthStore((state) => state.user);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user) return;
    if (user.role === "admin") router.replace("/dashboard-admin");
    if (user.role === "agent") router.replace("/dashboard-agent");
  }, [user, router]);

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const success = login(email, password);
    if (!success) {
      setError("Email atau password salah");
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden bg-[#0A0C11]">
      {/* Background */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-br from-[#0A0C11] via-[#0E1322] to-[#05060A]" />
        <div className="absolute -top-40 -left-40 w-[30rem] h-[30rem] bg-blue-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-[-12rem] right-[-10rem] w-[34rem] h-[34rem] bg-indigo-500/10 rounded-full blur-3xl" />
      </div>

      {/* Card */}
      <motion.div
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="relative w-full max-w-md"
      >
        <div className="rounded-3xl bg-[#0F1320]/90 backdrop-blur-2xl border border-white/10 shadow-[0_40px_80px_-20px_rgba(0,0,0,0.8)]">
          <div className="p-10">
            {/* Logo */}
            <div className="flex justify-center mb-8">
              <div className="w-14 h-14 rounded-2xl bg-white/10 border border-white/15 flex items-center justify-center">
                <span className="text-white font-semibold tracking-widest text-lg">
                  AX
                </span>
              </div>
            </div>

            {/* Header */}
            <div className="text-center mb-10">
              <h1 className="text-3xl font-semibold text-white tracking-tight">
                Sign in
              </h1>
              <p className="text-sm text-white/50 mt-2">
                Access your secure workspace
              </p>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-1">
                <label className="text-xs uppercase tracking-wider text-white/40">
                  Email
                </label>
                <Input
                  className="h-12 rounded-xl bg-[#0B0E18] border border-white/10 text-white placeholder:text-white/30 focus:border-white/30 focus:ring-0"
                  placeholder="admin / agent"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={loading}
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs uppercase tracking-wider text-white/40">
                  Password
                </label>
                <Input
                  type="password"
                  className="h-12 rounded-xl bg-[#0B0E18] border border-white/10 text-white placeholder:text-white/30 focus:border-white/30 focus:ring-0"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={loading}
                  required
                />
              </div>

              {error && (
                <div className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">
                  {error}
                </div>
              )}

              <motion.div whileTap={{ scale: 0.97 }}>
                <Button
                  type="submit"
                  disabled={loading}
                  className="h-12 w-full rounded-xl bg-white text-black font-medium hover:bg-white/90"
                >
                  {loading ? "Authenticating..." : "Continue"}
                </Button>
              </motion.div>
            </form>

            {/* Demo */}
            <div className="mt-8 rounded-xl bg-white/5 border border-white/10 p-4">
              <p className="text-xs uppercase tracking-wider text-white/40 mb-2">
                Demo Account
              </p>
              <div className="text-xs text-white/70 space-y-1">
                <p>Admin — admin | admin123</p>
                <p>Agent — agent | agent123</p>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
