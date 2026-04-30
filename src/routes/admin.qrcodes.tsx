import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import QRCode from "qrcode";
import { Download, Printer } from "lucide-react";

export const Route = createFileRoute("/admin/qrcodes")({
  component: QRCodes,
});

function QRCodes() {
  const [baseUrl, setBaseUrl] = useState("");
  const [start, setStart] = useState(1);
  const [end, setEnd] = useState(10);
  const [items, setItems] = useState<{ label: string; value: string; url: string; dataUrl: string }[]>([]);
  const printRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const host = window.location.hostname;
    // Detecta ambientes do editor/preview do Lovable (que exigem login)
    // e sugere a URL pública estável do projeto publicado.
    const isLovableEditor =
      host.includes("lovable.dev") ||
      host.includes("lovableproject.com") ||
      host.startsWith("id-preview--");

    const publicUrl = "https://project--fccaebc3-d59a-4c38-8947-4c97be5b8298.lovable.app/avaliar";
    const defaultUrl = isLovableEditor ? publicUrl : `${window.location.origin}/avaliar`;

    // Persiste escolha do admin
    const saved = typeof window !== "undefined" ? window.localStorage.getItem("qr_base_url") : null;
    setBaseUrl(saved || defaultUrl);
  }, []);

  useEffect(() => {
    if (baseUrl) window.localStorage.setItem("qr_base_url", baseUrl);
  }, [baseUrl]);

  const tables = useMemo(() => {
    if (end < start) return [];
    return Array.from({ length: end - start + 1 }, (_, i) => {
      const n = start + i;
      return { value: String(n), label: String(n).padStart(2, "0") };
    });
  }, [start, end]);

  async function generate() {
    if (!baseUrl) return;
    const out = await Promise.all(
      tables.map(async (t) => {
        const url = `${baseUrl}?mesa=${encodeURIComponent(t.label)}`;
        const dataUrl = await QRCode.toDataURL(url, {
          width: 600,
          margin: 2,
          color: { dark: "#1a1a1a", light: "#fafaf7" },
        });
        return { label: t.label, value: t.value, url, dataUrl };
      })
    );
    setItems(out);
  }

  function downloadOne(label: string, dataUrl: string) {
    const a = document.createElement("a");
    a.href = dataUrl;
    a.download = `qr-mesa-${label}.png`;
    a.click();
  }

  function printAll() {
    window.print();
  }

  return (
    <div className="max-w-7xl mx-auto px-6 py-10 space-y-10">
      <style>{`
        @media print {
          body * { visibility: hidden; }
          .print-area, .print-area * { visibility: visible; }
          .print-area { position: absolute; inset: 0; padding: 1rem; }
          .no-print { display: none !important; }
          .print-card { break-inside: avoid; page-break-inside: avoid; }
        }
      `}</style>

      <div className="no-print">
        <p className="editorial-eyebrow mb-2">Operação</p>
        <h1 className="text-5xl font-display font-bold">QR Codes das Mesas</h1>
        <p className="text-muted-foreground italic mt-2">
          Gere, baixe e imprima os QR Codes para colar nas mesas.
        </p>
      </div>

      <section className="no-print border border-border bg-card p-6 space-y-4">
        <div>
          <label className="text-xs uppercase tracking-wider font-medium block mb-2">
            URL pública de avaliação
          </label>
          <input
            type="url"
            value={baseUrl}
            onChange={(e) => setBaseUrl(e.target.value)}
            placeholder="https://seusite.com/avaliar"
            className="w-full bg-background border border-border px-3 py-2 font-mono text-sm"
          />
          <p className="text-xs text-muted-foreground italic mt-2">
            Use a URL <strong>publicada</strong> do site (ex: <code>seudominio.com.br/avaliar</code>).
            Não use a URL do editor — ela exige login do Lovable.
          </p>
        </div>
        <div className="grid sm:grid-cols-3 gap-4">
          <div>
            <label className="text-xs uppercase tracking-wider font-medium block mb-2">Mesa inicial</label>
            <input
              type="number"
              value={start}
              min={1}
              onChange={(e) => setStart(Number(e.target.value))}
              className="w-full bg-background border border-border px-3 py-2"
            />
          </div>
          <div>
            <label className="text-xs uppercase tracking-wider font-medium block mb-2">Mesa final</label>
            <input
              type="number"
              value={end}
              min={start}
              onChange={(e) => setEnd(Number(e.target.value))}
              className="w-full bg-background border border-border px-3 py-2"
            />
          </div>
          <div className="flex items-end">
            <button
              onClick={generate}
              className="w-full py-2 bg-foreground text-background font-bold uppercase tracking-[0.2em] text-xs hover:bg-primary transition-colors"
            >
              Gerar {tables.length} QR{tables.length === 1 ? "" : "s"}
            </button>
          </div>
        </div>
      </section>

      {items.length > 0 && (
        <>
          <div className="no-print flex items-center justify-between">
            <p className="text-sm text-muted-foreground">{items.length} QR Code(s) gerado(s)</p>
            <button
              onClick={printAll}
              className="inline-flex items-center gap-2 px-4 py-2 border border-foreground text-xs uppercase tracking-[0.2em] font-medium hover:bg-foreground hover:text-background transition-colors"
            >
              <Printer className="h-4 w-4" /> Imprimir todos
            </button>
          </div>

          <div ref={printRef} className="print-area grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {items.map((it) => (
              <div key={it.label} className="print-card border border-foreground/20 bg-card p-5 text-center">
                <p className="font-display text-3xl font-bold mb-3">Mesa {it.label}</p>
                <img src={it.dataUrl} alt={`QR mesa ${it.label}`} className="w-full h-auto" />
                <p className="text-sm mt-3 italic">
                  Aponte a câmera para avaliar
                </p>
                <button
                  onClick={() => downloadOne(it.label, it.dataUrl)}
                  className="no-print mt-3 inline-flex items-center gap-1 text-xs uppercase tracking-wider text-primary hover:underline"
                >
                  <Download className="h-3 w-3" /> Baixar PNG
                </button>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
