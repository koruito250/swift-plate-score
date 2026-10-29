import { pageMeta } from "@/lib/page-meta";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { PasswordInput } from "@/components/PasswordInput";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/admin/login")({
  head: () => pageMeta("Acesso do restaurante — CorpMind", "Entre no painel exclusivo do seu restaurante com seu login e senha."),
  component: AdminLogin,
});

function AdminLogin() {
  const navigate = useNavigate();
  const [login, setLogin] = useState("");
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
    const normalized = login.trim().toLowerCase();
    const email = normalized.includes("@") ? normalized : normalized === "corpmind" ? "corpmind@gmail.com" : `${normalized}@corpmind.local`;
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error || !data.user) {
      setLoading(false);
      return toast.error("Login ou senha inválidos.");
    }

    // super admin → CorpMind
    const { data: sa } = await supabase
      .from("super_admins")
      .select("user_id")
      .eq("user_id", data.user.id)
      .maybeSingle();
    if (sa) {
      setLoading(false);
      navigate({ to: "/corpmind" });
      return;
    }

    // valida tenant
    const { data: t } = await supabase
      .from("tenants")
      .select("status, data_expiracao")
      .eq("auth_user_id", data.user.id)
      .maybeSingle();

    if (!t) {
      await supabase.auth.signOut();
      setLoading(false);
      return toast.error("Conta sem cliente vinculado.");
    }
    if (t.status === "bloqueado") {
      await supabase.auth.signOut();
      setLoading(false);
      return toast.error("Acesso bloqueado. Entre em contato com a CorpMind.");
    }
    const today = new Date().toISOString().slice(0, 10);
    if (t.data_expiracao < today) {
      await supabase.auth.signOut();
      setLoading(false);
      return toast.error("Assinatura vencida. Entre em contato com a CorpMind.");
    }

    setLoading(false);
    navigate({ to: "/admin" });
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex items-center justify-center px-6">
      <div className="w-full max-w-md">
        <Link to="/" className="block text-center mb-8">
          <span className="text-3xl font-display font-bold">CorpMind</span>
        </Link>
        <div className="border border-border bg-card p-8">
          <p className="editorial-eyebrow mb-2">Acesso restrito</p>
          <h1 className="text-3xl font-display font-bold mb-6">Painel do cliente</h1>
          <nav aria-label="Tipo de acesso" className="grid grid-cols-2 border-b border-border mb-6 text-sm">
            <Link to="/admin/login" className="text-center py-3 border-b-2 border-primary font-semibold" aria-current="page">Cliente</Link>
            <Link to="/corpmind/login" className="text-center py-3 text-muted-foreground">Administrador geral</Link>
          </nav>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="client-login" className="text-xs uppercase tracking-wider block mb-2">Login</label>
              <input
                id="client-login"
                type="text"
                required
                value={login}
                onChange={(e) => setLogin(e.target.value)}
                className="w-full bg-background border border-border px-4 py-3"
                autoComplete="username"
              />
            </div>
            <div>
              <label htmlFor="client-password" className="text-xs uppercase tracking-wider block mb-2">Senha</label>
              <PasswordInput id="client-password" value={password} onChange={setPassword} />
            </div>
            <Button
              type="submit"
              disabled={loading}
              className="w-full h-auto rounded-none py-4 bg-foreground text-background font-bold uppercase tracking-[0.2em] text-xs hover:bg-primary transition-colors disabled:opacity-40"
            >
              {loading ? "…" : "Entrar"}
            </Button>
          </form>

          <p className="text-xs text-muted-foreground italic mt-6 text-center">
            Use o login e senha fornecidos pela CorpMind.
          </p>
        </div>
      </div>
    </div>
  );
}
