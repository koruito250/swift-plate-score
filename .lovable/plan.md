# Painel Super Admin CorpMind — Multi-tenant

Vou transformar o sistema atual (admin único) em um sistema **multi-tenant**, onde o **Super Admin (CorpMind)** cadastra clientes (restaurantes), e cada cliente tem seu próprio painel isolado.

## Arquitetura

```
CorpMind (super admin)                    → /corpmind/login  → /corpmind (dashboard)
  └─ cadastra/gerencia Clientes (tenants)
       └─ cada Cliente acessa             → /admin/login    → /admin/* (painel isolado)
            └─ vê apenas seus dados (garçons, avaliações, QR codes)
```

## Banco de dados (multi-tenant via `tenant_id`)

Nova tabela **`tenants`** (clientes do CorpMind):
- nome / empresa
- login (único)
- valor da assinatura (numeric)
- data de cadastro / data de expiração
- status (ativo / bloqueado)
- auth_user_id (referência ao usuário Supabase Auth criado para login)

Adicionar coluna `tenant_id` em: `waiters`, `evaluations` (e usar nos QR codes).

**RLS reescrita**: cada cliente só vê linhas onde `tenant_id` = seu próprio tenant. Função `get_current_tenant_id()` security definer. Super admin (role `super_admin` em `user_roles`) vê tudo.

Login do super admin **CorpMind / 1234** será criado via Supabase Auth (email fake `corpmind@corpmind.local`) e marcado com role `super_admin`.

## Rotas novas

- `/corpmind/login` — login exclusivo do super admin
- `/corpmind` — dashboard com cards:
  - Clientes cadastrados (total)
  - Clientes ativos
  - Clientes bloqueados
  - Clientes vencidos (data expiração < hoje)
  - **Valor total em R$** (soma das assinaturas)
- `/corpmind/clientes` — listar, criar, editar, bloquear/desbloquear, excluir clientes
  - Form de criação: nome/empresa, login, senha, valor assinatura, data expiração

## Rotas existentes (ajustes mínimos)

- `/admin/login` continua igual (mas autentica clientes-tenants, não mais admin global)
- `/admin`, `/admin/garcons`, `/admin/avaliacoes`, `/admin/qrcodes` — **sem mudança visual**, só passam a filtrar por `tenant_id` automaticamente via RLS
- `/avaliar` (cliente final escaneando QR) — continua público, insert recebe `tenant_id` via param do QR

## Design do dashboard CorpMind

Moderno e bonito, mas mantendo a identidade atual do projeto (mesmo design system, tokens em `src/styles.css`). Cards com ícones, gradiente sutil, números grandes, tabela limpa de clientes com badges de status (verde=ativo, amarelo=vencido, vermelho=bloqueado).

## Detalhes técnicos

- Migration: nova tabela `tenants`, enum `tenant_status`, coluna `tenant_id` em waiters/evaluations, função `get_current_tenant_id()`, novo valor `super_admin` no enum `app_role`, RLS reescrita.
- Criação de cliente: server function (`createServerFn` com `supabaseAdmin`) que cria o usuário no Supabase Auth + insere na tabela `tenants` (atômico).
- Bloqueio: flag `status='bloqueado'` impede o login redirecionando com mensagem.
- Vencimento: calculado em runtime (`expires_at < now()`), mostrado como badge "Vencido" — opcional bloquear acesso automaticamente (incluo isso).

## Pontos para você confirmar

1. **Dados existentes** (garçons/avaliações já cadastrados): posso atribuí-los a um tenant "Restaurante Padrão" criado automaticamente, ou prefere apagar tudo e começar limpo?
2. **Cliente vencido**: bloqueio automático no login, ou apenas mostro como "vencido" no dashboard e deixo logar?
3. **Senha do super admin**: "1234" tem só 4 caracteres e o Supabase exige mínimo 6. Posso usar **`corpmind1234`** como senha (login: `corpmind`)?