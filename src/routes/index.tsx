import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, QrCode, BarChart3, Bell } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Sakura — Avaliação inteligente para restaurantes" },
      { name: "description", content: "QR Code na mesa, alertas em tempo real e ranking de garçons. Transforme cada cliente em insight." },
    ],
  }),
  component: Landing,
});

function Landing() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-foreground/15">
        <div className="max-w-6xl mx-auto px-6 py-5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-2xl font-display font-bold">鮨 Sakura</span>
          </div>
          <nav className="flex items-center gap-3 text-sm">
            <Link to="/avaliar" search={{ mesa: "" }} className="hover:text-primary transition-colors">Avaliar</Link>
            <Link
              to="/admin/login"
              className="px-4 py-2 bg-foreground text-background uppercase tracking-[0.2em] text-xs font-medium hover:bg-primary transition-colors"
            >
              Painel admin
            </Link>
          </nav>
        </div>
      </header>

      <section className="max-w-6xl mx-auto px-6 pt-20 pb-24">
        <p className="editorial-eyebrow mb-6">Edição n.º 01 — Inteligência de salão</p>
        <h1 className="text-6xl md:text-8xl font-display font-bold leading-[0.95] tracking-tight">
          Cada cliente,<br />
          uma <em className="text-primary">história</em>.<br />
          Cada nota, um <em className="text-primary">insight</em>.
        </h1>
        <div className="mt-12 grid md:grid-cols-[1fr_auto] gap-10 items-end">
          <p className="text-lg text-muted-foreground max-w-xl leading-relaxed">
            Sistema completo de avaliação para restaurantes. QR Code na mesa, alertas
            em tempo real para clientes insatisfeitos, ranking de garçons e dashboard
            que conecta satisfação com faturamento.
          </p>
          <Link
            to="/avaliar"
            search={{ mesa: "" }}
            className="inline-flex items-center gap-3 px-8 py-4 bg-primary text-primary-foreground uppercase tracking-[0.2em] text-xs font-semibold hover:bg-foreground transition-colors"
          >
            Demonstração <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

      <section className="border-t-2 border-foreground">
        <div className="max-w-6xl mx-auto px-6 py-20 grid md:grid-cols-3 gap-12">
          <Pillar
            n="01"
            icon={<QrCode className="h-6 w-6" />}
            title="Cliente"
            text="QR Code na mesa abre uma ficha rápida e elegante. Notas, comentário, identificação do garçom."
          />
          <Pillar
            n="02"
            icon={<BarChart3 className="h-6 w-6" />}
            title="Painel"
            text="Dashboard em tempo real com NPS, ranking de equipe, tempo médio de atendimento e conta."
          />
          <Pillar
            n="03"
            icon={<Bell className="h-6 w-6" />}
            title="Alertas"
            text="Nota ≤ 2 dispara alerta vermelho na hora. Recupere o cliente antes da porta da rua."
          />
        </div>
      </section>

      <footer className="border-t border-foreground/15">
        <div className="max-w-6xl mx-auto px-6 py-8 text-xs uppercase tracking-[0.2em] text-muted-foreground flex justify-between">
          <span>© Sakura</span>
          <span>Editorial · Inteligência · Hospitalidade</span>
        </div>
      </footer>
    </div>
  );
}

function Pillar({ n, icon, title, text }: { n: string; icon: React.ReactNode; title: string; text: string }) {
  return (
    <div>
      <div className="flex items-baseline justify-between mb-4">
        <span className="font-display text-4xl text-primary">{n}</span>
        <span className="text-foreground/60">{icon}</span>
      </div>
      <h3 className="text-2xl font-display font-bold mb-2">{title}</h3>
      <p className="text-muted-foreground leading-relaxed">{text}</p>
    </div>
  );
}
