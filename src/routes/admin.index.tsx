import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AlertTriangle, TrendingUp, Users, Utensils } from "lucide-react";

export const Route = createFileRoute("/admin/")({
  component: Dashboard,
});

interface Evaluation {
  id: string;
  waiter_id: string | null;
  service_rating: number;
  food_time_rating: number;
  food_quality_rating: number;
  ambience_rating: number;
  bill_time_rating: number;
  overall_rating: number;
  comment: string | null;
  resolved: boolean;
  created_at: string;
  table_number: string | null;
}
interface Waiter { id: string; name: string }

function Dashboard() {
  const [evals, setEvals] = useState<Evaluation[]>([]);
  const [waiters, setWaiters] = useState<Waiter[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const [{ data: e }, { data: w }] = await Promise.all([
        supabase.from("evaluations").select("*").order("created_at", { ascending: false }),
        supabase.from("waiters").select("id, name"),
      ]);
      setEvals(e ?? []);
      setWaiters(w ?? []);
      setLoading(false);
    }
    load();

    const channel = supabase
      .channel("evals-realtime")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "evaluations" },
        (payload) => setEvals((prev) => [payload.new as Evaluation, ...prev]))
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  if (loading) {
    return <div className="max-w-7xl mx-auto px-6 py-12"><p className="editorial-eyebrow">Carregando…</p></div>;
  }

  const total = evals.length;
  const avg = (key: keyof Evaluation) =>
    total ? evals.reduce((s, e) => s + (e[key] as number), 0) / total : 0;

  const overall = avg("overall_rating");
  const promoters = evals.filter((e) => e.overall_rating >= 4).length;
  const detractors = evals.filter((e) => e.overall_rating <= 2).length;
  const nps = total ? Math.round(((promoters - detractors) / total) * 100) : 0;
  const satisfPct = total ? Math.round((promoters / total) * 100) : 0;
  const insatisfPct = total ? Math.round((detractors / total) * 100) : 0;

  const alerts = evals.filter((e) => e.overall_rating <= 2 && !e.resolved);

  // ranking
  const waiterMap = new Map(waiters.map((w) => [w.id, w.name]));
  const ranking = Array.from(
    evals.reduce((map, e) => {
      if (!e.waiter_id) return map;
      const cur = map.get(e.waiter_id) ?? { sum: 0, count: 0 };
      cur.sum += e.service_rating;
      cur.count += 1;
      map.set(e.waiter_id, cur);
      return map;
    }, new Map<string, { sum: number; count: number }>())
  )
    .map(([id, v]) => ({ id, name: waiterMap.get(id) ?? "—", avg: v.sum / v.count, count: v.count }))
    .sort((a, b) => b.avg - a.avg);

  async function resolve(id: string) {
    await supabase.from("evaluations").update({ resolved: true }).eq("id", id);
    setEvals((prev) => prev.map((e) => (e.id === id ? { ...e, resolved: true } : e)));
  }

  return (
    <div className="max-w-7xl mx-auto px-6 py-10 space-y-12">
      <div>
        <p className="editorial-eyebrow mb-2">Visão geral</p>
        <h1 className="text-5xl font-display font-bold">Dashboard</h1>
      </div>

      {alerts.length > 0 && (
        <section>
          <div className="flex items-center gap-3 mb-4">
            <AlertTriangle className="h-5 w-5 text-primary" />
            <h2 className="text-2xl font-display font-bold">
              {alerts.length} alerta{alerts.length > 1 ? "s" : ""} de cliente insatisfeito
            </h2>
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            {alerts.slice(0, 4).map((a) => (
              <div key={a.id} className="border-l-4 border-primary bg-primary/5 p-5">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <p className="font-bold text-lg">{a.overall_rating}/5 ⚠</p>
                    <p className="text-xs text-muted-foreground">
                      Mesa {a.table_number ?? "—"} ·{" "}
                      {a.waiter_id ? waiterMap.get(a.waiter_id) : "Sem garçom"} ·{" "}
                      {new Date(a.created_at).toLocaleString("pt-BR")}
                    </p>
                  </div>
                  <button
                    onClick={() => resolve(a.id)}
                    className="text-xs uppercase tracking-wider px-3 py-1 bg-foreground text-background hover:bg-primary"
                  >
                    Resolver
                  </button>
                </div>
                {a.comment && <p className="text-sm italic text-foreground/80">"{a.comment}"</p>}
              </div>
            ))}
          </div>
        </section>
      )}

      <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Kpi label="Nota média" value={overall.toFixed(1)} suffix="/5" icon={<TrendingUp className="h-5 w-5" />} />
        <Kpi label="NPS" value={nps.toString()} suffix="" icon={<Users className="h-5 w-5" />} accent={nps >= 50} />
        <Kpi label="Satisfeitos" value={`${satisfPct}%`} suffix="" icon={<Users className="h-5 w-5" />} />
        <Kpi label="Insatisfeitos" value={`${insatisfPct}%`} suffix="" icon={<AlertTriangle className="h-5 w-5" />} alert={insatisfPct > 20} />
      </section>

      <section className="grid md:grid-cols-2 gap-10">
        <div>
          <p className="editorial-eyebrow mb-3">Operação</p>
          <h3 className="text-2xl font-display font-bold mb-4">Notas por critério</h3>
          <div className="space-y-3">
            <Bar label="Atendimento" value={avg("service_rating")} />
            <Bar label="Tempo dos pratos" value={avg("food_time_rating")} />
            <Bar label="Qualidade da comida" value={avg("food_quality_rating")} />
            <Bar label="Ambiente" value={avg("ambience_rating")} />
            <Bar label="Tempo da conta" value={avg("bill_time_rating")} />
          </div>
        </div>

        <div>
          <p className="editorial-eyebrow mb-3">Equipe</p>
          <h3 className="text-2xl font-display font-bold mb-4">Ranking de garçons</h3>
          {ranking.length === 0 ? (
            <p className="text-muted-foreground italic">Nenhuma avaliação com garçom ainda.</p>
          ) : (
            <div className="space-y-2">
              {ranking.map((r, i) => (
                <div key={r.id} className="flex items-center justify-between border-b border-border py-3">
                  <div className="flex items-center gap-4">
                    <span className="font-display text-2xl text-primary w-8">{i + 1}</span>
                    <div>
                      <p className="font-semibold">{r.name}</p>
                      <p className="text-xs text-muted-foreground">{r.count} avaliações</p>
                    </div>
                  </div>
                  <p className="text-2xl font-display font-bold">{r.avg.toFixed(1)}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      <section>
        <div className="flex items-center gap-3 mb-4">
          <Utensils className="h-5 w-5 text-primary" />
          <h3 className="text-2xl font-display font-bold">Total de avaliações</h3>
          <span className="font-display text-3xl font-bold">{total}</span>
        </div>
      </section>
    </div>
  );
}

function Kpi({ label, value, suffix, icon, accent, alert }: { label: string; value: string; suffix: string; icon: React.ReactNode; accent?: boolean; alert?: boolean }) {
  return (
    <div className={`border p-5 ${alert ? "border-primary bg-primary/5" : accent ? "border-foreground" : "border-border bg-card"}`}>
      <div className="flex justify-between items-start text-muted-foreground mb-3">
        <span className="text-xs uppercase tracking-[0.2em]">{label}</span>
        {icon}
      </div>
      <p className="font-display text-4xl font-bold">{value}<span className="text-xl text-muted-foreground">{suffix}</span></p>
    </div>
  );
}

function Bar({ label, value }: { label: string; value: number }) {
  const pct = (value / 5) * 100;
  return (
    <div>
      <div className="flex justify-between text-sm mb-1">
        <span>{label}</span>
        <span className="font-semibold">{value.toFixed(1)}</span>
      </div>
      <div className="h-2 bg-muted">
        <div className="h-full bg-primary transition-all" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}
