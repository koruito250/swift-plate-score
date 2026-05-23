import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Users, UserCheck, UserX, CalendarX, DollarSign, ArrowRight } from "lucide-react";

export const Route = createFileRoute("/corpmind/")({
  component: CorpmindDashboard,
});

interface Tenant {
  id: string;
  nome: string;
  login: string;
  valor_assinatura: number;
  data_expiracao: string;
  status: "ativo" | "bloqueado";
  created_at: string;
}

function CorpmindDashboard() {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("tenants")
        .select("*")
        .order("created_at", { ascending: false });
      setTenants((data ?? []) as Tenant[]);
      setLoading(false);
    })();
  }, []);

  if (loading)
    return (
      <div className="max-w-7xl mx-auto px-6 py-12">
        <p className="editorial-eyebrow">Carregando…</p>
      </div>
    );

  const today = new Date().toISOString().slice(0, 10);
  const total = tenants.length;
  const ativos = tenants.filter((t) => t.status === "ativo" && t.data_expiracao >= today).length;
  const bloqueados = tenants.filter((t) => t.status === "bloqueado").length;
  const vencidos = tenants.filter((t) => t.status === "ativo" && t.data_expiracao < today).length;
  const totalReceita = tenants
    .filter((t) => t.status === "ativo")
    .reduce((s, t) => s + Number(t.valor_assinatura ?? 0), 0);

  return (
    <div className="max-w-7xl mx-auto px-6 py-10 space-y-12">
      <div className="flex items-end justify-between flex-wrap gap-4">
        <div>
          <p className="editorial-eyebrow mb-2">Visão geral</p>
          <h1 className="text-5xl font-display font-bold">Dashboard CorpMind</h1>
          <p className="text-muted-foreground italic mt-2">
            Acompanhe seus clientes e receita em tempo real.
          </p>
        </div>
        <Link
          to="/corpmind/clientes"
          className="inline-flex items-center gap-2 px-5 py-3 bg-foreground text-background uppercase tracking-[0.2em] text-xs font-semibold hover:bg-primary"
        >
          Gerenciar clientes <ArrowRight className="h-4 w-4" />
        </Link>
      </div>

      <section className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <Kpi label="Total clientes" value={total} icon={<Users className="h-5 w-5" />} />
        <Kpi label="Ativos" value={ativos} icon={<UserCheck className="h-5 w-5" />} accent />
        <Kpi label="Bloqueados" value={bloqueados} icon={<UserX className="h-5 w-5" />} alert={bloqueados > 0} />
        <Kpi label="Vencidos" value={vencidos} icon={<CalendarX className="h-5 w-5" />} alert={vencidos > 0} />
        <Kpi
          label="Receita ativa"
          value={totalReceita.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
          icon={<DollarSign className="h-5 w-5" />}
          big
        />
      </section>

      <section>
        <h2 className="text-2xl font-display font-bold mb-4">Clientes recentes</h2>
        {tenants.length === 0 ? (
          <p className="text-muted-foreground italic">Nenhum cliente cadastrado ainda.</p>
        ) : (
          <div className="border border-border bg-card divide-y divide-border">
            {tenants.slice(0, 8).map((t) => {
              const expired = t.data_expiracao < today;
              const status =
                t.status === "bloqueado"
                  ? { label: "Bloqueado", cls: "bg-destructive/15 text-destructive" }
                  : expired
                    ? { label: "Vencido", cls: "bg-yellow-500/15 text-yellow-600" }
                    : { label: "Ativo", cls: "bg-emerald-500/15 text-emerald-600" };
              return (
                <div key={t.id} className="flex items-center justify-between px-5 py-4 gap-4">
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold truncate">{t.nome}</p>
                    <p className="text-xs text-muted-foreground">
                      @{t.login} · expira {new Date(t.data_expiracao).toLocaleDateString("pt-BR")}
                    </p>
                  </div>
                  <p className="font-display text-lg font-bold tabular-nums">
                    {Number(t.valor_assinatura).toLocaleString("pt-BR", {
                      style: "currency",
                      currency: "BRL",
                    })}
                  </p>
                  <span className={`text-[10px] uppercase tracking-wider px-2 py-1 font-semibold ${status.cls}`}>
                    {status.label}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}

function Kpi({
  label,
  value,
  icon,
  accent,
  alert,
  big,
}: {
  label: string;
  value: number | string;
  icon: React.ReactNode;
  accent?: boolean;
  alert?: boolean;
  big?: boolean;
}) {
  return (
    <div
      className={`border p-5 ${
        alert
          ? "border-primary bg-primary/5"
          : accent
            ? "border-foreground"
            : "border-border bg-card"
      } ${big ? "col-span-2 lg:col-span-1" : ""}`}
    >
      <div className="flex justify-between items-start text-muted-foreground mb-3">
        <span className="text-xs uppercase tracking-[0.2em]">{label}</span>
        {icon}
      </div>
      <p className="font-display text-3xl font-bold break-words">{value}</p>
    </div>
  );
}
