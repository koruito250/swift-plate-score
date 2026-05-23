import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const CORPMIND_EMAIL = "corpmind@corpmind.local";
const CORPMIND_PASSWORD = "corpmind1234";

function loginToEmail(login: string) {
  return `${login.trim().toLowerCase()}@corpmind.local`;
}

// Cria o super admin "corpmind" se ainda não existir. Idempotente, público.
export const bootstrapCorpmind = createServerFn({ method: "POST" }).handler(
  async () => {
    const { count } = await supabaseAdmin
      .from("super_admins")
      .select("*", { count: "exact", head: true });
    if ((count ?? 0) > 0) return { ok: true, created: false };

    // Cria (ou recupera) o usuário corpmind
    const { data: existing } = await supabaseAdmin.auth.admin.listUsers();
    let userId = existing?.users.find((u) => u.email === CORPMIND_EMAIL)?.id;

    if (!userId) {
      const { data, error } = await supabaseAdmin.auth.admin.createUser({
        email: CORPMIND_EMAIL,
        password: CORPMIND_PASSWORD,
        email_confirm: true,
      });
      if (error) throw new Error(error.message);
      userId = data.user!.id;
    }

    const { error: insErr } = await supabaseAdmin
      .from("super_admins")
      .insert({ user_id: userId });
    if (insErr && !insErr.message.includes("duplicate")) throw new Error(insErr.message);

    return { ok: true, created: true };
  },
);

async function assertSuperAdmin(userId: string) {
  const { data } = await supabaseAdmin
    .from("super_admins")
    .select("user_id")
    .eq("user_id", userId)
    .maybeSingle();
  if (!data) throw new Error("Acesso negado.");
}

// Cria um novo cliente (tenant) com usuário Auth + linha em tenants.
export const createTenant = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z
      .object({
        nome: z.string().trim().min(1).max(120),
        login: z
          .string()
          .trim()
          .min(3)
          .max(40)
          .regex(/^[a-z0-9_-]+$/, "Login só pode ter letras minúsculas, números, _ e -"),
        password: z.string().min(6).max(100),
        valor_assinatura: z.number().min(0).max(1_000_000),
        data_expiracao: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    await assertSuperAdmin(context.userId);

    if (data.login === "corpmind" || data.login === "padrao") {
      throw new Error("Login reservado.");
    }

    const email = loginToEmail(data.login);

    // Cria usuário no Supabase Auth
    const { data: created, error } = await supabaseAdmin.auth.admin.createUser({
      email,
      password: data.password,
      email_confirm: true,
    });
    if (error) throw new Error(error.message);
    const userId = created.user!.id;

    const { data: tenant, error: tErr } = await supabaseAdmin
      .from("tenants")
      .insert({
        nome: data.nome,
        login: data.login.toLowerCase(),
        auth_user_id: userId,
        valor_assinatura: data.valor_assinatura,
        data_expiracao: data.data_expiracao,
        status: "ativo",
      })
      .select()
      .single();

    if (tErr) {
      // rollback: remove auth user criado
      await supabaseAdmin.auth.admin.deleteUser(userId);
      throw new Error(tErr.message);
    }

    return { tenant };
  });

export const updateTenant = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z
      .object({
        id: z.string().uuid(),
        nome: z.string().trim().min(1).max(120).optional(),
        valor_assinatura: z.number().min(0).max(1_000_000).optional(),
        data_expiracao: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
        status: z.enum(["ativo", "bloqueado"]).optional(),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    await assertSuperAdmin(context.userId);
    const { id, ...patch } = data;
    const { error } = await supabaseAdmin.from("tenants").update(patch).eq("id", id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const setTenantPassword = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) =>
    z.object({ id: z.string().uuid(), password: z.string().min(6).max(100) }).parse(d),
  )
  .handler(async ({ data, context }) => {
    await assertSuperAdmin(context.userId);
    const { data: tenant } = await supabaseAdmin
      .from("tenants")
      .select("auth_user_id")
      .eq("id", data.id)
      .single();
    if (!tenant?.auth_user_id) throw new Error("Cliente sem usuário.");
    const { error } = await supabaseAdmin.auth.admin.updateUserById(tenant.auth_user_id, {
      password: data.password,
    });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const deleteTenant = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    await assertSuperAdmin(context.userId);

    const { data: tenant } = await supabaseAdmin
      .from("tenants")
      .select("auth_user_id")
      .eq("id", data.id)
      .single();

    // apaga dados do tenant
    await supabaseAdmin.from("evaluations").delete().eq("tenant_id", data.id);
    await supabaseAdmin.from("waiters").delete().eq("tenant_id", data.id);
    await supabaseAdmin.from("tenants").delete().eq("id", data.id);
    if (tenant?.auth_user_id) {
      await supabaseAdmin.auth.admin.deleteUser(tenant.auth_user_id);
    }
    return { ok: true };
  });
