import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { StarRating } from "@/components/StarRating";
import { toast } from "sonner";
import { Check, Download } from "lucide-react";
import { toPng } from "html-to-image";

export const Route = createFileRoute("/avaliar")({
  head: () => ({
    meta: [
      { title: "Avalie sua experiência — Sakura" },
      { name: "description", content: "Conte como foi sua experiência. Sua opinião molda nossa cozinha." },
    ],
  }),
  validateSearch: (s: Record<string, unknown>) => ({
    mesa: normalizeTableSearchParam(s.mesa),
  }),
  component: Avaliar,
});

interface Waiter { id: string; name: string }

function normalizeTableSearchParam(value: unknown) {
  const raw = Array.isArray(value) ? value[0] : value;
  if (raw === null || raw === undefined) return "";

  const normalized = String(raw).trim();
  if (!normalized) return "";

  return /^\d+$/.test(normalized) ? normalized.padStart(2, "0") : normalized;
}

const FIELDS = [
  { key: "service_rating", label: "Atendimento do garçom" },
  { key: "food_time_rating", label: "Tempo dos pratos" },
  { key: "food_quality_rating", label: "Qualidade da comida" },
  { key: "ambience_rating", label: "Ambiente" },
  { key: "bill_time_rating", label: "Tempo da conta" },
  { key: "overall_rating", label: "Nota geral" },
] as const;

function Avaliar() {
  const { mesa } = Route.useSearch();
  const [waiters, setWaiters] = useState<Waiter[]>([]);
  const [waiterId, setWaiterId] = useState<string>("");
  const [tableNumber, setTableNumber] = useState(mesa);
  const [comment, setComment] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [ratings, setRatings] = useState<Record<string, number>>({});
  const [now, setNow] = useState<string>("");

  useEffect(() => {
    console.log("[Avaliar] mesa from URL:", mesa, "| full URL:", window.location.href);
    if (mesa && mesa !== tableNumber) setTableNumber(mesa);
    supabase.from("waiters").select("id, name").eq("active", true).order("name")
      .then(({ data }) => setWaiters(data ?? []));
    setNow(new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mesa]);

  const setRating = (key: string, v: number) => setRatings((r) => ({ ...r, [key]: v }));

  const allRated = FIELDS.every((f) => ratings[f.key] > 0);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!allRated) {
      toast.error("Por favor, avalie todos os itens.");
      return;
    }
    const trimmedName = customerName.trim();
    const trimmedPhone = customerPhone.trim();
    const trimmedEmail = customerEmail.trim();
    if (!trimmedName) {
      toast.error("Por favor, informe seu nome.");
      return;
    }
    if (!trimmedPhone) {
      toast.error("Por favor, informe seu telefone.");
      return;
    }
    if (!trimmedEmail) {
      toast.error("Por favor, informe seu e-mail.");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      toast.error("E-mail inválido.");
      return;
    }
    setSubmitting(true);
    const payload = {
      waiter_id: waiterId || null,
      table_number: tableNumber || null,
      service_rating: ratings.service_rating,
      food_time_rating: ratings.food_time_rating,
      food_quality_rating: ratings.food_quality_rating,
      ambience_rating: ratings.ambience_rating,
      bill_time_rating: ratings.bill_time_rating,
      overall_rating: ratings.overall_rating,
      comment: comment.trim() || null,
      customer_name: trimmedName.slice(0, 100),
      customer_phone: trimmedPhone.slice(0, 30),
      customer_email: trimmedEmail.slice(0, 255),
    };
    const { error } = await supabase.from("evaluations").insert(payload);
    setSubmitting(false);
    if (error) {
      toast.error("Não foi possível enviar. Tente novamente.");
      return;
    }
    setSubmitted(true);
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-6">
        <div className="max-w-md text-center">
          <div className="w-16 h-16 rounded-full bg-primary text-primary-foreground flex items-center justify-center mx-auto mb-6">
            <Check className="h-8 w-8" strokeWidth={3} />
          </div>
          <p className="editorial-eyebrow mb-4">Recebido</p>
          <h1 className="text-4xl font-display font-bold mb-4">Obrigado.</h1>
          <p className="text-muted-foreground italic mb-6">
            Sua opinião é essencial para mantermos o padrão de excelência.
          </p>
          <div className="border-2 border-primary bg-primary/5 px-6 py-5">
            <p className="editorial-eyebrow text-primary mb-2">Recompensa</p>
            <p className="text-lg font-display font-bold leading-snug">
              🎉 Parabéns! Você ganhou <span className="text-primary">5% de desconto</span> na sua próxima visita.
            </p>
            <p className="text-xs text-muted-foreground italic mt-2">
              Apresente esta tela ou informe seu nome ao garçom na próxima vinda.
            </p>
            <div className="mt-4 pt-3 border-t border-primary/30 flex justify-between items-center text-xs">
              <span className="editorial-eyebrow text-foreground/70">Emitido em</span>
              <span className="font-mono font-semibold text-foreground">
                {new Date().toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" })}
              </span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="max-w-2xl mx-auto px-6 py-10">
        <div className="editorial-rule pb-4 mb-8 flex justify-between items-end">
          <div>
            <p className="editorial-eyebrow">Avaliação</p>
            <Link to="/" className="text-2xl font-display font-bold">鮨 Sakura</Link>
          </div>
          <p className="text-xs text-muted-foreground">
            {tableNumber ? `Mesa ${tableNumber}` : "Mesa —"}{now ? ` · ${now}` : ""}
          </p>
        </div>

        <h1 className="text-5xl font-display font-bold leading-tight mb-3">
          Como foi <em className="text-primary">tudo</em>?
        </h1>
        <p className="text-muted-foreground mb-10 italic">
          Avalie sua experiência e ganhe benefícios.
        </p>

        <form onSubmit={handleSubmit} className="space-y-7">
          {FIELDS.map((f) => (
            <div key={f.key}>
              <div className="flex justify-between items-baseline mb-2">
                <p className="text-sm uppercase tracking-wider font-medium">{f.label}</p>
                <p className="text-xs text-muted-foreground">
                  {ratings[f.key] ? `${ratings[f.key]}/5` : "Toque"}
                </p>
              </div>
              <StarRating value={ratings[f.key] ?? 0} onChange={(v) => setRating(f.key, v)} />
            </div>
          ))}

          <div className="space-y-3 pt-4 border-t border-foreground/15">
            <div>
              <label className="text-sm uppercase tracking-wider font-medium block mb-2">
                Garçom
              </label>
              <select
                value={waiterId}
                onChange={(e) => setWaiterId(e.target.value)}
                className="w-full bg-card border border-border px-4 py-3 text-foreground"
              >
                <option value="">— Selecione —</option>
                {waiters.map((w) => (
                  <option key={w.id} value={w.id}>{w.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-sm uppercase tracking-wider font-medium block mb-2">
                Mesa {mesa && <span className="text-xs text-primary normal-case tracking-normal italic ml-2">(detectada pelo QR Code)</span>}
              </label>
              <input
                type="text"
                value={tableNumber}
                onChange={(e) => setTableNumber(e.target.value)}
                placeholder="Ex: 12"
                readOnly={!!mesa}
                className={`w-full bg-card border border-border px-4 py-3 text-foreground ${mesa ? "opacity-70 cursor-not-allowed" : ""}`}
              />
            </div>

            <div className="pt-4 border-t border-foreground/10">
              <p className="editorial-eyebrow mb-1">Seus dados</p>
              <p className="text-xs text-muted-foreground italic mb-3">
                Obrigatório — para que possamos entrar em contato se necessário.
              </p>
              <div className="space-y-3">
                <div>
                  <label className="text-sm uppercase tracking-wider font-medium block mb-2">Nome *</label>
                  <input
                    type="text"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    maxLength={100}
                    required
                    placeholder="Como podemos te chamar?"
                    className="w-full bg-card border border-border px-4 py-3 text-foreground"
                  />
                </div>
                <div>
                  <label className="text-sm uppercase tracking-wider font-medium block mb-2">Telefone *</label>
                  <input
                    type="tel"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    maxLength={30}
                    required
                    placeholder="(11) 99999-9999"
                    className="w-full bg-card border border-border px-4 py-3 text-foreground"
                  />
                </div>
                <div>
                  <label className="text-sm uppercase tracking-wider font-medium block mb-2">E-mail *</label>
                  <input
                    type="email"
                    value={customerEmail}
                    onChange={(e) => setCustomerEmail(e.target.value)}
                    maxLength={255}
                    required
                    placeholder="voce@email.com"
                    className="w-full bg-card border border-border px-4 py-3 text-foreground"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="text-sm uppercase tracking-wider font-medium block mb-2">
                Comentário
              </label>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                rows={4}
                maxLength={1000}
                placeholder="Conte mais sobre sua experiência…"
                className="w-full bg-card border border-border px-4 py-3 text-foreground resize-none"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting || !allRated}
            className="w-full py-5 bg-foreground text-background font-bold uppercase tracking-[0.25em] text-sm hover:bg-primary transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {submitting ? "Enviando…" : "Enviar avaliação →"}
          </button>
        </form>
      </div>
    </div>
  );
}
