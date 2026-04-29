import { createFileRoute, Link, Outlet, useNavigate, useRouterState } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { LogOut } from "lucide-react";

export const Route = createFileRoute("/admin")({
  component: AdminLayout,
});

function AdminLayout() {
  const navigate = useNavigate();
  const path = useRouterState({ select: (s) => s.location.pathname });
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) navigate({ to: "/admin/login" });
    });
    supabase.auth.getSession().then(({ data }) => {
      if (!data.session) {
        navigate({ to: "/admin/login" });
      } else {
        setReady(true);
      }
    });
    return () => sub.subscription.unsubscribe();
  }, [navigate]);

  if (!ready) {
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
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b-2 border-foreground">
        <div className="max-w-7xl mx-auto px-6 py-5 flex items-center justify-between">
          <Link to="/" className="text-2xl font-display font-bold">鮨 Sakura</Link>
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
  );
}
