import { createFileRoute, Link, Outlet, useNavigate, useRouterState } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { LogOut } from "lucide-react";
import { TenantContext, type TenantInfo } from "@/lib/tenant-context";
import { toast } from "sonner";

export const Route = createFileRoute("/admin")({
  component: AdminLayout,
});

function AdminLayout() {
  const navigate = useNavigate();
  const path = useRouterState({ select: (s) => s.location.pathname });
  const isLoginRoute = path === "/admin/login";
  const [ready, setReady] = useState(false);
  const [tenant, setTenant] = useState<TenantInfo | null>(null);

  useEffect(() => {
    if (isLoginRoute) {
      setReady(true);
      return;
    }
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) navigate({ to: "/admin/login" });
    });
    (async () => {
      const { data: sess } = await supabase.auth.getSession();
      if (!sess.session) {
        navigate({ to: "/admin/login" });
        return;
      }
      const userId = sess.session.user.id;

      // se for super admin → vai pro painel CorpMind
      const { data: sa } = await supabase
        .from("super_admins")
        .select("user_id")
        .eq("user_id", userId)
        .maybeSingle();
      if (sa) {
        navigate({ to: "/corpmind" });
        return;
      }

      // busca tenant
      const { data: t } = await supabase
        .from("tenants")
        .select("id, nome, login, valor_assinatura, data_expiracao, status")
        .eq("auth_user_id", userId)
        .maybeSingle();

      if (!t) {
        await supabase.auth.signOut();
        toast.error("Conta sem cliente vinculado.");
        navigate({ to: "/admin/login" });
        return;
      }

      const today = new Date().toISOString().slice(0, 10);
      if (t.status === "bloqueado") {
        await supabase.auth.signOut();
        toast.error("Cliente bloqueado. Entre em contato com a CorpMind.");
        navigate({ to: "/admin/login" });
        return;
      }
      if (t.data_expiracao < today) {
        await supabase.auth.signOut();
        toast.error("Assinatura vencida. Entre em contato com a CorpMind.");
        navigate({ to: "/admin/login" });
        return;
      }

      setTenant({
        id: t.id,
        nome: t.nome,
        login: t.login,
        valor_assinatura: Number(t.valor_assinatura),
        data_expiracao: t.data_expiracao,
        status: t.status as "ativo" | "bloqueado",
      });
      setReady(true);
    })();
    return () => sub.subscription.unsubscribe();
  }, [navigate, isLoginRoute]);

  if (isLoginRoute) {
    return <Outlet />;
  }

  if (!ready || !tenant) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="editorial-eyebrow">Carregando…</p>
      </div>
    );
  }

  const tabs = [
    { to: "/admin", label: "Dashboard" },
    { to: "/admin/avaliacoes", label: "Avaliações" },
    { to: "/admin/garcons", label: "Garçons" },
    { to: "/admin/qrcodes", label: "QR Codes" },
  ];

  return (
    <TenantContext.Provider value={tenant}>
      <div className="min-h-screen bg-background text-foreground">
        <header className="border-b-2 border-foreground">
          <div className="max-w-7xl mx-auto px-6 py-5 flex items-center justify-between gap-4 flex-wrap">
            <Link to="/" className="text-2xl font-display font-bold truncate">
              {tenant.nome}
            </Link>
            <nav className="flex items-center gap-1">
              {tabs.map((t) => {
                const active = path === t.to;
                return (
                  <Link
                    key={t.to}
                    to={t.to}
                    className={`px-4 py-2 text-xs uppercase tracking-[0.2em] font-medium transition-colors ${
                      active ? "bg-foreground text-background" : "hover:text-primary"
                    }`}
                  >
                    {t.label}
                  </Link>
                );
              })}
              <button
                onClick={async () => {
                  await supabase.auth.signOut();
                  navigate({ to: "/admin/login" });
                }}
                className="ml-2 p-2 text-muted-foreground hover:text-primary"
                aria-label="Sair"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </nav>
          </div>
        </header>
        <Outlet />
      </div>
    </TenantContext.Provider>
  );
}
