import { pageMeta } from "@/lib/page-meta";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { PasswordInput } from "@/components/PasswordInput";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/corpmind/login")({
  head: () => pageMeta("Acesso do administrador geral — CorpMind", "Acesso restrito à gestão geral de clientes e assinaturas CorpMind."),
  component: CorpmindLogin,
});

function CorpmindLogin() {
  const navigate = useNavigate();
  const [login, setLogin] = useState("corpmind@gmail.com");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const normalized = login.trim().toLowerCase();
    const email = normalized.includes("@") ? normalized : normalized === "corpmind" ? "corpmind@gmail.com" : `${normalized}@corpmind.local`;
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error || !data.user) return toast.error("Credenciais inválidas.");

    // valida que é super admin
    const { data: sa } = await supabase
      .from("super_admins")
      .select("user_id")
      .eq("user_id", data.user.id)
      .maybeSingle();
    if (!sa) {
      await supabase.auth.signOut();
      return toast.error("Acesso restrito ao CorpMind.");
    }
    navigate({ to: "/corpmind" });
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex items-center justify-center px-6">
      <div className="w-full max-w-md">
        <Link to="/" className="block text-center mb-8">
          <span className="text-3xl font-display font-bold">CorpMind</span>
        </Link>
        <div className="border border-border bg-card p-8">
          <p className="editorial-eyebrow mb-2">Acesso CorpMind</p>
          <h1 className="text-3xl font-display font-bold mb-6">Administrador geral</h1>
          <nav aria-label="Tipo de acesso" className="grid grid-cols-2 border-b border-border mb-6 text-sm">
            <Link to="/admin/login" className="text-center py-3 text-muted-foreground">Cliente</Link>
            <Link to="/corpmind/login" className="text-center py-3 border-b-2 border-primary font-semibold" aria-current="page">Administrador geral</Link>
          </nav>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="master-email" className="text-xs uppercase tracking-wider block mb-2">E-mail do administrador</label>
              <input
                id="master-email"
                type="text"
                required
                value={login}
                onChange={(e) => setLogin(e.target.value)}
                autoComplete="username"
                className="w-full bg-background border border-border px-4 py-3"
              />
            </div>
            <div>
              <label htmlFor="master-password" className="text-xs uppercase tracking-wider block mb-2">Senha</label>
              <PasswordInput id="master-password" value={password} onChange={setPassword} />
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
            Acesso destinado à equipe CorpMind.
          </p>
        </div>
      </div>
    </div>
  );
}
