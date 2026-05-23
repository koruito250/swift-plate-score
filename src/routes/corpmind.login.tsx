import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { bootstrapCorpmind } from "@/lib/corpmind.functions";

export const Route = createFileRoute("/corpmind/login")({
  head: () => ({ meta: [{ title: "CorpMind — Acesso" }] }),
  component: CorpmindLogin,
});

function CorpmindLogin() {
  const navigate = useNavigate();
  const [login, setLogin] = useState("corpmind");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    bootstrapCorpmind().catch(() => {});
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const email = `${login.trim().toLowerCase()}@corpmind.local`;
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
          <h1 className="text-3xl font-display font-bold mb-6">Painel master</h1>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-xs uppercase tracking-wider block mb-2">Login</label>
              <input
                type="text"
                required
                value={login}
                onChange={(e) => setLogin(e.target.value)}
                className="w-full bg-background border border-border px-4 py-3"
              />
            </div>
            <div>
              <label className="text-xs uppercase tracking-wider block mb-2">Senha</label>
              <input
                type="password"
                required
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
              {loading ? "…" : "Entrar"}
            </button>
          </form>

          <p className="text-xs text-muted-foreground italic mt-6 text-center">
            Acesso destinado à equipe CorpMind.
          </p>
        </div>
      </div>
    </div>
  );
}
