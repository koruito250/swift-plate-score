import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { StarRating } from "@/components/StarRating";
import { ChevronDown, ChevronUp, FileDown } from "lucide-react";
import jsPDF from "jspdf";

export const Route = createFileRoute("/admin/avaliacoes")({
  component: Avaliacoes,
});

interface Row {
  id: string;
  waiter_id: string | null;
  service_rating: number;
  overall_rating: number;
  food_quality_rating: number;
  food_time_rating: number;
  ambience_rating: number;
  bill_time_rating: number;
  comment: string | null;
  table_number: string | null;
  created_at: string;
  resolved: boolean;
  customer_name: string | null;
  customer_phone: string | null;
  customer_email: string | null;
}

function Avaliacoes() {
  const [rows, setRows] = useState<Row[]>([]);
  const [waiterNames, setWaiterNames] = useState<Map<string, string>>(new Map());
  const [filter, setFilter] = useState<"all" | "alerts">("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      supabase.from("evaluations").select("*").order("created_at", { ascending: false }),
      supabase.from("waiters").select("id, name"),
    ]).then(([{ data: e }, { data: w }]) => {
      setRows((e ?? []) as Row[]);
      setWaiterNames(new Map((w ?? []).map((x) => [x.id, x.name])));
    });
  }, []);

  const visible = filter === "alerts" ? rows.filter((r) => r.overall_rating <= 2) : rows;

  const toggleExpand = (id: string) => {
    setExpandedId((prev) => (prev === id ? null : id));
  };

  const toggleResolved = async (id: string, current: boolean) => {
    const next = !current;
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, resolved: next } : r)));
    const { error } = await supabase.from("evaluations").update({ resolved: next }).eq("id", id);
    if (error) {
      setRows((prev) => prev.map((r) => (r.id === id ? { ...r, resolved: current } : r)));
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-6 py-10">
      <div className="flex justify-between items-end mb-8">
        <div>
          <p className="editorial-eyebrow mb-2">Histórico</p>
          <h1 className="text-5xl font-display font-bold">Avaliações</h1>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setFilter("all")}
            className={`px-4 py-2 text-xs uppercase tracking-wider ${filter === "all" ? "bg-foreground text-background" : "border border-border"}`}>
            Todas ({rows.length})
          </button>
          <button onClick={() => setFilter("alerts")}
            className={`px-4 py-2 text-xs uppercase tracking-wider ${filter === "alerts" ? "bg-primary text-primary-foreground" : "border border-border"}`}>
            Alertas
          </button>
        </div>
      </div>

      <div className="border border-border bg-card divide-y divide-border">
        {visible.length === 0 && (
          <p className="p-8 text-center text-muted-foreground italic">Nenhuma avaliação ainda.</p>
        )}
        {visible.map((r) => {
          const isOpen = expandedId === r.id;
          return (
            <div key={r.id} className={`${r.overall_rating <= 2 ? "border-l-4 border-primary" : ""}`}>
              <button
                type="button"
                onClick={() => toggleExpand(r.id)}
                className="w-full text-left p-5 hover:bg-muted/30 transition-colors"
                aria-expanded={isOpen}
              >
                <div className="flex justify-between items-start gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-1">
                      <span className="font-display text-2xl font-bold">{r.overall_rating}/5</span>
                      <StarRating value={r.overall_rating} readOnly size="sm" />
                    </div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wider">
                      Mesa {r.table_number ?? "—"} · {r.waiter_id ? waiterNames.get(r.waiter_id) ?? "—" : "Sem garçom"} · {new Date(r.created_at).toLocaleString("pt-BR")}
                    </p>
                    {r.comment && !isOpen && (
                      <p className="text-sm italic mt-2 text-foreground/80 line-clamp-1">"{r.comment}"</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground uppercase tracking-wider shrink-0">
                    {isOpen ? "Fechar" : "Ver detalhes"}
                    {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </div>
                </div>
              </button>

              {isOpen && (
                <div className="px-5 pb-6 pt-2 bg-muted/10 space-y-5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <DetailRating label="Atendimento" value={r.service_rating} />
                    <DetailRating label="Tempo da comida" value={r.food_time_rating} />
                    <DetailRating label="Qualidade da comida" value={r.food_quality_rating} />
                    <DetailRating label="Ambiente" value={r.ambience_rating} />
                    <DetailRating label="Tempo da conta" value={r.bill_time_rating} />
                    <DetailRating label="Avaliação geral" value={r.overall_rating} />
                  </div>

                  <div>
                    <p className="text-xs uppercase tracking-wider text-muted-foreground mb-2">Comentário</p>
                    {r.comment ? (
                      <p className="text-sm italic text-foreground/90 border-l-2 border-border pl-3">"{r.comment}"</p>
                    ) : (
                      <p className="text-sm text-muted-foreground italic">Cliente não deixou comentário.</p>
                    )}
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                    <InfoCell label="Mesa" value={r.table_number ?? "—"} />
                    <InfoCell label="Garçom" value={r.waiter_id ? waiterNames.get(r.waiter_id) ?? "—" : "Sem garçom"} />
                    <InfoCell label="Data" value={new Date(r.created_at).toLocaleString("pt-BR")} />
                    <div className="border border-border bg-background px-3 py-2">
                      <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Status</p>
                      <div className="flex items-center justify-between gap-2 mt-1">
                        <span className={`text-sm font-medium ${r.resolved ? "text-primary" : ""}`}>
                          {r.resolved ? "Resolvido" : "Pendente"}
                        </span>
                        <button
                          type="button"
                          onClick={() => toggleResolved(r.id, r.resolved)}
                          className="text-[10px] uppercase tracking-wider px-2 py-1 border border-border hover:bg-foreground hover:text-background transition-colors"
                        >
                          {r.resolved ? "Reabrir" : "Resolver"}
                        </button>
                      </div>
                    </div>
                  </div>

                  <div>
                    <p className="text-xs uppercase tracking-wider text-muted-foreground mb-2">Dados do cliente</p>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                      <InfoCell label="Nome" value={r.customer_name ?? "—"} />
                      <InfoCell label="Telefone" value={r.customer_phone ?? "—"} />
                      <InfoCell label="E-mail" value={r.customer_email ?? "—"} />
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function DetailRating({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-center justify-between border border-border bg-background px-3 py-2">
      <span className="text-xs uppercase tracking-wider text-muted-foreground">{label}</span>
      <div className="flex items-center gap-2">
        <span className="font-display text-base font-bold">{value}/5</span>
        <StarRating value={value} readOnly size="sm" />
      </div>
    </div>
  );
}

function InfoCell({ label, value }: { label: string; value: string }) {
  return (
    <div className="border border-border bg-background px-3 py-2">
      <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className="text-sm font-medium truncate">{value}</p>
    </div>
  );
}
