import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { StarRating } from "@/components/StarRating";

export const Route = createFileRoute("/admin/avaliacoes")({
  component: Avaliacoes,
});

interface Row {
  id: string;
  waiter_id: string | null;
  service_rating: number;
  overall_rating: number;
  food_quality_rating: number;
  comment: string | null;
  table_number: string | null;
  created_at: string;
  resolved: boolean;
}

function Avaliacoes() {
  const [rows, setRows] = useState<Row[]>([]);
  const [waiterNames, setWaiterNames] = useState<Map<string, string>>(new Map());
  const [filter, setFilter] = useState<"all" | "alerts">("all");

  useEffect(() => {
    Promise.all([
      supabase.from("evaluations").select("*").order("created_at", { ascending: false }),
      supabase.from("waiters").select("id, name"),
    ]).then(([{ data: e }, { data: w }]) => {
      setRows(e ?? []);
      setWaiterNames(new Map((w ?? []).map((x) => [x.id, x.name])));
    });
  }, []);

  const visible = filter === "alerts" ? rows.filter((r) => r.overall_rating <= 2) : rows;

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
        {visible.map((r) => (
          <div key={r.id} className={`p-5 ${r.overall_rating <= 2 ? "border-l-4 border-primary" : ""}`}>
            <div className="flex justify-between items-start gap-4 mb-2">
              <div>
                <div className="flex items-center gap-3 mb-1">
                  <span className="font-display text-2xl font-bold">{r.overall_rating}/5</span>
                  <StarRating value={r.overall_rating} readOnly size="sm" />
                </div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider">
                  Mesa {r.table_number ?? "—"} · {r.waiter_id ? waiterNames.get(r.waiter_id) ?? "—" : "Sem garçom"} · {new Date(r.created_at).toLocaleString("pt-BR")}
                </p>
              </div>
            </div>
            {r.comment && <p className="text-sm italic mt-2 text-foreground/80">"{r.comment}"</p>}
          </div>
        ))}
      </div>
    </div>
  );
}
