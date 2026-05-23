import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Plus, Trash2, Lock, Unlock, KeyRound, Pencil, X } from "lucide-react";
import {
  createTenant,
  updateTenant,
  deleteTenant,
  setTenantPassword,
} from "@/lib/corpmind.functions";

export const Route = createFileRoute("/corpmind/clientes")({
  component: CorpmindClientes,
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

function CorpmindClientes() {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Tenant | null>(null);
  const [passwordFor, setPasswordFor] = useState<Tenant | null>(null);

  const createFn = useServerFn(createTenant);
  const updateFn = useServerFn(updateTenant);
  const deleteFn = useServerFn(deleteTenant);
  const passFn = useServerFn(setTenantPassword);

  async function load() {
    const { data } = await supabase
      .from("tenants")
      .select("*")
      .order("created_at", { ascending: false });
    setTenants((data ?? []) as Tenant[]);
  }
  useEffect(() => {
    load();
  }, []);

  const today = new Date().toISOString().slice(0, 10);

  return (
    <div className="max-w-7xl mx-auto px-6 py-10 space-y-8">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <p className="editorial-eyebrow mb-2">Gestão</p>
          <h1 className="text-5xl font-display font-bold">Clientes</h1>
        </div>
        <button
          onClick={() => {
            setEditing(null);
            setShowForm(true);
          }}
          className="inline-flex items-center gap-2 px-5 py-3 bg-foreground text-background uppercase tracking-[0.2em] text-xs font-semibold hover:bg-primary"
        >
          <Plus className="h-4 w-4" /> Novo cliente
        </button>
      </div>

      <div className="border border-border bg-card overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-muted/30">
            <tr className="text-left text-xs uppercase tracking-wider text-muted-foreground">
              <th className="px-4 py-3">Nome / Empresa</th>
              <th className="px-4 py-3">Login</th>
              <th className="px-4 py-3">Assinatura</th>
              <th className="px-4 py-3">Expira em</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3 text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {tenants.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground italic">
                  Nenhum cliente cadastrado.
                </td>
              </tr>
            )}
            {tenants.map((t) => {
              const expired = t.data_expiracao < today;
              const status =
                t.status === "bloqueado"
                  ? { label: "Bloqueado", cls: "bg-destructive/15 text-destructive" }
                  : expired
                    ? { label: "Vencido", cls: "bg-yellow-500/15 text-yellow-600" }
                    : { label: "Ativo", cls: "bg-emerald-500/15 text-emerald-600" };
              return (
                <tr key={t.id} className="hover:bg-muted/20">
                  <td className="px-4 py-3 font-semibold">{t.nome}</td>
                  <td className="px-4 py-3 font-mono text-xs">@{t.login}</td>
                  <td className="px-4 py-3 tabular-nums">
                    {Number(t.valor_assinatura).toLocaleString("pt-BR", {
                      style: "currency",
                      currency: "BRL",
                    })}
                  </td>
                  <td className="px-4 py-3">
                    {new Date(t.data_expiracao).toLocaleDateString("pt-BR")}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-[10px] uppercase tracking-wider px-2 py-1 font-semibold ${status.cls}`}>
                      {status.label}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={async () => {
                          await updateFn({
                            data: {
                              id: t.id,
                              status: t.status === "ativo" ? "bloqueado" : "ativo",
                            },
                          });
                          toast.success(t.status === "ativo" ? "Cliente bloqueado" : "Cliente ativado");
                          load();
                        }}
                        className="p-2 text-muted-foreground hover:text-foreground"
                        title={t.status === "ativo" ? "Bloquear" : "Desbloquear"}
                      >
                        {t.status === "ativo" ? <Lock className="h-4 w-4" /> : <Unlock className="h-4 w-4" />}
                      </button>
                      <button
                        onClick={() => setPasswordFor(t)}
                        className="p-2 text-muted-foreground hover:text-foreground"
                        title="Redefinir senha"
                      >
                        <KeyRound className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => {
                          setEditing(t);
                          setShowForm(true);
                        }}
                        className="p-2 text-muted-foreground hover:text-foreground"
                        title="Editar"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        onClick={async () => {
                          if (
                            !confirm(
                              `Excluir cliente "${t.nome}"? Todos os garçons e avaliações serão apagados.`,
                            )
                          )
                            return;
                          try {
                            await deleteFn({ data: { id: t.id } });
                            toast.success("Cliente excluído");
                            load();
                          } catch (e) {
                            toast.error((e as Error).message);
                          }
                        }}
                        className="p-2 text-muted-foreground hover:text-primary"
                        title="Excluir"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {showForm && (
        <TenantFormModal
          tenant={editing}
          onClose={() => setShowForm(false)}
          onSave={async (vals) => {
            try {
              if (editing) {
                await updateFn({
                  data: {
                    id: editing.id,
                    nome: vals.nome,
                    valor_assinatura: vals.valor_assinatura,
                    data_expiracao: vals.data_expiracao,
                  },
                });
                toast.success("Cliente atualizado");
              } else {
                await createFn({ data: vals });
                toast.success("Cliente criado");
              }
              setShowForm(false);
              load();
            } catch (e) {
              toast.error((e as Error).message);
            }
          }}
        />
      )}

      {passwordFor && (
        <PasswordModal
          tenant={passwordFor}
          onClose={() => setPasswordFor(null)}
          onSave={async (pw) => {
            try {
              await passFn({ data: { id: passwordFor.id, password: pw } });
              toast.success("Senha redefinida");
              setPasswordFor(null);
            } catch (e) {
              toast.error((e as Error).message);
            }
          }}
        />
      )}
    </div>
  );
}

function TenantFormModal({
  tenant,
  onClose,
  onSave,
}: {
  tenant: Tenant | null;
  onClose: () => void;
  onSave: (v: {
    nome: string;
    login: string;
    password: string;
    valor_assinatura: number;
    data_expiracao: string;
  }) => Promise<void>;
}) {
  const [nome, setNome] = useState(tenant?.nome ?? "");
  const [login, setLogin] = useState(tenant?.login ?? "");
  const [password, setPassword] = useState("");
  const [valor, setValor] = useState(String(tenant?.valor_assinatura ?? "0"));
  const [data, setData] = useState(
    tenant?.data_expiracao ??
      new Date(Date.now() + 30 * 24 * 3600 * 1000).toISOString().slice(0, 10),
  );
  const [saving, setSaving] = useState(false);

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
      <div className="bg-background border border-border w-full max-w-md p-6 relative">
        <button onClick={onClose} className="absolute top-3 right-3 p-2 text-muted-foreground hover:text-foreground">
          <X className="h-4 w-4" />
        </button>
        <h2 className="text-2xl font-display font-bold mb-1">
          {tenant ? "Editar cliente" : "Novo cliente"}
        </h2>
        <p className="text-xs text-muted-foreground italic mb-5">
          {tenant ? "Login não pode ser alterado." : "Defina login e senha de acesso."}
        </p>

        <form
          onSubmit={async (e) => {
            e.preventDefault();
            setSaving(true);
            await onSave({
              nome: nome.trim(),
              login: login.trim().toLowerCase(),
              password,
              valor_assinatura: Number(valor) || 0,
              data_expiracao: data,
            });
            setSaving(false);
          }}
          className="space-y-3"
        >
          <Field label="Nome / Empresa">
            <input
              required
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              maxLength={120}
              className="w-full bg-card border border-border px-3 py-2"
            />
          </Field>
          <Field label="Login (somente letras minúsculas, números, _ e -)">
            <input
              required
              value={login}
              disabled={!!tenant}
              onChange={(e) => setLogin(e.target.value.toLowerCase())}
              pattern="[a-z0-9_-]{3,40}"
              className="w-full bg-card border border-border px-3 py-2 font-mono disabled:opacity-60"
            />
          </Field>
          {!tenant && (
            <Field label="Senha (mín. 6 caracteres)">
              <input
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-card border border-border px-3 py-2"
              />
            </Field>
          )}
          <div className="grid grid-cols-2 gap-3">
            <Field label="Valor assinatura (R$)">
              <input
                type="number"
                step="0.01"
                min="0"
                required
                value={valor}
                onChange={(e) => setValor(e.target.value)}
                className="w-full bg-card border border-border px-3 py-2 tabular-nums"
              />
            </Field>
            <Field label="Data de expiração">
              <input
                type="date"
                required
                value={data}
                onChange={(e) => setData(e.target.value)}
                className="w-full bg-card border border-border px-3 py-2"
              />
            </Field>
          </div>
          <button
            type="submit"
            disabled={saving}
            className="w-full mt-4 py-3 bg-foreground text-background uppercase tracking-[0.2em] text-xs font-bold hover:bg-primary disabled:opacity-40"
          >
            {saving ? "Salvando…" : tenant ? "Salvar alterações" : "Criar cliente"}
          </button>
        </form>
      </div>
    </div>
  );
}

function PasswordModal({
  tenant,
  onClose,
  onSave,
}: {
  tenant: Tenant;
  onClose: () => void;
  onSave: (pw: string) => Promise<void>;
}) {
  const [pw, setPw] = useState("");
  const [saving, setSaving] = useState(false);
  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
      <div className="bg-background border border-border w-full max-w-sm p-6 relative">
        <button onClick={onClose} className="absolute top-3 right-3 p-2 text-muted-foreground hover:text-foreground">
          <X className="h-4 w-4" />
        </button>
        <h2 className="text-xl font-display font-bold mb-1">Redefinir senha</h2>
        <p className="text-xs text-muted-foreground italic mb-4">Cliente: {tenant.nome}</p>
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            setSaving(true);
            await onSave(pw);
            setSaving(false);
          }}
        >
          <input
            type="password"
            required
            minLength={6}
            value={pw}
            onChange={(e) => setPw(e.target.value)}
            placeholder="Nova senha (mín. 6)"
            className="w-full bg-card border border-border px-3 py-2 mb-3"
          />
          <button
            type="submit"
            disabled={saving}
            className="w-full py-3 bg-foreground text-background uppercase tracking-[0.2em] text-xs font-bold hover:bg-primary disabled:opacity-40"
          >
            {saving ? "Salvando…" : "Salvar"}
          </button>
        </form>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="text-xs uppercase tracking-wider block mb-1">{label}</label>
      {children}
    </div>
  );
}
