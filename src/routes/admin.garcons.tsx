import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Trash2, Plus } from "lucide-react";

export const Route = createFileRoute("/admin/garcons")({
  component: Garcons,
});

interface Waiter { id: string; name: string; active: boolean }

function Garcons() {
  const [waiters, setWaiters] = useState<Waiter[]>([]);
  const [name, setName] = useState("");

  async function load() {
    const { data } = await supabase.from("waiters").select("*").order("name");
    setWaiters(data ?? []);
  }
  useEffect(() => { load(); }, []);

  async function add(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    const { error } = await supabase.from("waiters").insert({ name: name.trim() });
    if (error) return toast.error(error.message);
    setName("");
    toast.success("Garçom adicionado");
    load();
  }

  async function toggle(w: Waiter) {
    await supabase.from("waiters").update({ active: !w.active }).eq("id", w.id);
    load();
  }

  async function remove(id: string) {
    if (!confirm("Remover este garçom?")) return;
    await supabase.from("waiters").delete().eq("id", id);
    load();
  }

  return (
    <div className="max-w-4xl mx-auto px-6 py-10">
      <p className="editorial-eyebrow mb-2">Equipe</p>
      <h1 className="text-5xl font-display font-bold mb-8">Garçons</h1>

      <form onSubmit={add} className="flex gap-2 mb-8">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Nome do garçom"
          maxLength={80}
          className="flex-1 bg-card border border-border px-4 py-3"
        />
        <button type="submit" className="px-6 bg-foreground text-background uppercase tracking-wider text-xs font-semibold hover:bg-primary flex items-center gap-2">
          <Plus className="h-4 w-4" /> Adicionar
        </button>
      </form>

      <div className="border border-border bg-card divide-y divide-border">
        {waiters.length === 0 && <p className="p-6 text-center text-muted-foreground italic">Nenhum garçom cadastrado.</p>}
        {waiters.map((w) => (
          <div key={w.id} className="flex items-center justify-between px-5 py-4">
            <div>
              <p className="font-semibold text-lg">{w.name}</p>
              <p className="text-xs uppercase tracking-wider text-muted-foreground">
                {w.active ? "Ativo" : "Inativo"}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => toggle(w)} className="px-3 py-1 text-xs uppercase tracking-wider border border-border hover:border-foreground">
                {w.active ? "Desativar" : "Ativar"}
              </button>
              <button onClick={() => remove(w.id)} className="p-2 text-muted-foreground hover:text-primary">
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
