import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/login")({
  head: () => ({
    meta: [{ title: "Acesso administrativo — Sakura" }],
  }),
  component: AdminLogin,
});

function AdminLogin() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate({ to: "/admin" });
    });
  }, [navigate]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    if (mode === "signup") {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: { emailRedirectTo: `${window.location.origin}/admin` },
      });
      setLoading(false);
      if (error) {
        if (error.message.toLowerCase().includes("weak") || error.message.toLowerCase().includes("pwned")) {
          return toast.error("Senha muito fraca ou vazada. Use uma senha forte (ex: Sakura@2026!).");
        }
        return toast.error(error.message);
      }
      toast.success("Conta criada! Você já pode entrar.");
      setMode("login");
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      setLoading(false);
      if (error) return toast.error("Credenciais inválidas.");
      navigate({ to: "/admin" });
    }
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex items-center justify-center px-6">
      <div className="w-full max-w-md">
        <Link to="/" className="block text-center mb-8">
          <span className="text-3xl font-display font-bold">鮨 Sakura</span>
        </Link>
        <div className="border border-border bg-card p-8">
          <p className="editorial-eyebrow mb-2">Acesso restrito</p>
          <h1 className="text-3xl font-display font-bold mb-6">
            {mode === "login" ? "Painel administrativo" : "Criar conta"}
          </h1>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-xs uppercase tracking-wider block mb-2">Email</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-background border border-border px-4 py-3"
              />
            </div>
            <div>
              <label className="text-xs uppercase tracking-wider block mb-2">Senha</label>
              <input
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-background border border-border px-4 py-3"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 bg-foreground text-background font-bold uppercase tracking-[0.2em] text-xs hover:bg-primary transition-colors disabled:opacity-40"
            >
              {loading ? "…" : mode === "login" ? "Entrar" : "Criar conta"}
            </button>
          </form>

          <button
            onClick={() => setMode(mode === "login" ? "signup" : "login")}
            className="text-xs text-muted-foreground hover:text-primary mt-6 w-full text-center uppercase tracking-wider"
          >
            {mode === "login" ? "Primeira vez? Criar conta" : "Já tenho conta"}
          </button>
        </div>
      </div>
    </div>
  );
}
