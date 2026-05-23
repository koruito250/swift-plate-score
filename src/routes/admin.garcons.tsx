import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Trash2, Plus, Pencil, Check, X } from "lucide-react";
import { useTenant } from "@/lib/tenant-context";

export const Route = createFileRoute("/admin/garcons")({
  component: Garcons,
});

interface Waiter { id: string; name: string; active: boolean }

function Garcons() {
  const [waiters, setWaiters] = useState<Waiter[]>([]);
  const [name, setName] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");

  function startEdit(w: Waiter) {
    setEditingId(w.id);
    setEditingName(w.name);
  }

  function cancelEdit() {
    setEditingId(null);
    setEditingName("");
  }

  async function saveEdit(id: string) {
    const trimmed = editingName.trim();
    if (!trimmed) {
      toast.error("Nome não pode ficar vazio");
      return;
    }
    const { error } = await supabase.from("waiters").update({ name: trimmed }).eq("id", id);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Garçom atualizado");
    cancelEdit();
    load();
  }

  async function load() {
    const { data } = await supabase.from("waiters").select("*").order("name");
    setWaiters(data ?? []);
  }
  useEffect(() => { load(); }, []);

  async function add(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) {
      toast.error("Digite o nome do garçom");
      return;
    }
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      toast.error("Sessão expirada. Faça login novamente.");
      return;
    }
    const { error } = await supabase.from("waiters").insert({ name: trimmed });
    if (error) {
      console.error("Erro ao adicionar garçom:", error);
      toast.error(error.message);
      return;
    }
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
          <div key={w.id} className="flex items-center justify-between px-5 py-4 gap-3">
            {editingId === w.id ? (
              <input
                autoFocus
                value={editingName}
                onChange={(e) => setEditingName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") saveEdit(w.id);
                  if (e.key === "Escape") cancelEdit();
                }}
                maxLength={80}
                className="flex-1 bg-background border border-border px-3 py-2 text-lg font-semibold"
              />
            ) : (
              <div className="flex-1">
                <p className="font-semibold text-lg">{w.name}</p>
                <p className="text-xs uppercase tracking-wider text-muted-foreground">
                  {w.active ? "Ativo" : "Inativo"}
                </p>
              </div>
            )}
            <div className="flex items-center gap-2">
              {editingId === w.id ? (
                <>
                  <button onClick={() => saveEdit(w.id)} className="p-2 text-foreground hover:text-primary" title="Salvar">
                    <Check className="h-4 w-4" />
                  </button>
                  <button onClick={cancelEdit} className="p-2 text-muted-foreground hover:text-foreground" title="Cancelar">
                    <X className="h-4 w-4" />
                  </button>
                </>
              ) : (
                <>
                  <button onClick={() => toggle(w)} className="px-3 py-1 text-xs uppercase tracking-wider border border-border hover:border-foreground">
                    {w.active ? "Desativar" : "Ativar"}
                  </button>
                  <button onClick={() => startEdit(w)} className="p-2 text-muted-foreground hover:text-foreground" title="Editar">
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button onClick={() => remove(w.id)} className="p-2 text-muted-foreground hover:text-primary" title="Remover">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
