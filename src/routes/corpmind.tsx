import { createFileRoute, Link, Outlet, useNavigate, useRouterState } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { LogOut } from "lucide-react";

export const Route = createFileRoute("/corpmind")({
  component: CorpmindLayout,
});

function CorpmindLayout() {
  const navigate = useNavigate();
  const path = useRouterState({ select: (s) => s.location.pathname });
  const isLoginRoute = path === "/corpmind/login";
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (isLoginRoute) {
      setReady(true);
      return;
    }
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      if (!session) navigate({ to: "/corpmind/login" });
    });
    (async () => {
      const { data: sess } = await supabase.auth.getSession();
      if (!sess.session) {
        navigate({ to: "/corpmind/login" });
        return;
      }
      const { data: sa } = await supabase
        .from("super_admins")
        .select("user_id")
        .eq("user_id", sess.session.user.id)
        .maybeSingle();
      if (!sa) {
        await supabase.auth.signOut();
        navigate({ to: "/corpmind/login" });
        return;
      }
      setReady(true);
    })();
    return () => sub.subscription.unsubscribe();
  }, [navigate, isLoginRoute]);

  if (isLoginRoute) return <Outlet />;

  if (!ready) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="editorial-eyebrow">Carregando…</p>
      </div>
    );
  }

  const tabs = [
    { to: "/corpmind", label: "Dashboard" },
    { to: "/corpmind/clientes", label: "Clientes" },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b-2 border-foreground">
        <div className="max-w-7xl mx-auto px-6 py-5 flex items-center justify-between">
          <Link to="/corpmind" className="text-2xl font-display font-bold">
            CorpMind <span className="text-primary">·</span> Master
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
                navigate({ to: "/corpmind/login" });
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
