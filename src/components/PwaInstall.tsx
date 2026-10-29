import { useEffect, useRef, useState } from "react";
import { Download, MoreVertical, PlusSquare, Share, Smartphone, MonitorDown, RefreshCw, WifiOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { INSTALL_DELAY_MS, installationPlatform } from "@/lib/pwa-policy";
import { registerAppWorker } from "@/lib/pwa-registration";
import icon from "@/assets/corpmind-icon.jpg";

interface InstallEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export function PwaInstall() {
  const [open, setOpen] = useState(false);
  const [manual, setManual] = useState(false);
  const [busy, setBusy] = useState(false);
  const [platform, setPlatform] = useState<"ios" | "android" | "desktop">("desktop");
  const [offline, setOffline] = useState(false);
  const [offlineReady, setOfflineReady] = useState(false);
  const [installed, setInstalled] = useState(false);
  const pending = useRef<InstallEvent | null>(null);

  useEffect(() => {
    const standalone = window.matchMedia("(display-mode: standalone)").matches
      || (navigator as Navigator & { standalone?: boolean }).standalone === true;
    setInstalled(standalone);
    setPlatform(installationPlatform(navigator.userAgent, navigator.maxTouchPoints));
    setOffline(!navigator.onLine);
    const timer = window.setTimeout(() => {
      // Already-installed apps have no installation action to offer.
      if (!standalone) {
        setOpen(true);
        console.info("[CorpMind PWA] Convite de instalação exibido após 2 segundos.");
      }
    }, INSTALL_DELAY_MS);
    const beforeInstall = (event: Event) => {
      event.preventDefault();
      pending.current = event as InstallEvent;
      console.info("[CorpMind PWA] Instalação automática disponível.");
    };
    const installedHandler = () => {
      pending.current = null;
      setInstalled(true);
      setOpen(false);
      console.info("[CorpMind PWA] Aplicativo instalado.");
    };
    const updateConnection = () => setOffline(!navigator.onLine);
    window.addEventListener("beforeinstallprompt", beforeInstall);
    window.addEventListener("appinstalled", installedHandler);
    window.addEventListener("online", updateConnection);
    window.addEventListener("offline", updateConnection);
    void registerAppWorker(() => {
      setOfflineReady(true);
      console.info("[CorpMind PWA] Tela offline disponível.");
    }, () => console.warn("[CorpMind PWA] Não foi possível ativar o acesso offline.")).catch(() => {
      console.warn("[CorpMind PWA] Não foi possível ativar o acesso offline.");
    });
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("beforeinstallprompt", beforeInstall);
      window.removeEventListener("appinstalled", installedHandler);
      window.removeEventListener("online", updateConnection);
      window.removeEventListener("offline", updateConnection);
    };
  }, []);

  async function install() {
    const event = pending.current;
    if (!event) {
      setManual(true);
      console.info(`[CorpMind PWA] Orientações manuais: ${platform}.`);
      return;
    }
    setBusy(true);
    try {
      await event.prompt();
      const choice = await event.userChoice;
      pending.current = null;
      if (choice.outcome === "accepted") setOpen(false);
      else setManual(true);
      console.info(`[CorpMind PWA] Convite ${choice.outcome === "accepted" ? "aceito" : "fechado"}.`);
    } catch {
      pending.current = null;
      setManual(true);
    } finally {
      setBusy(false);
    }
  }

  return <>
    {offline && <div role="status" className="fixed inset-x-0 bottom-0 z-40 flex items-center justify-center gap-2 border-t border-border bg-background px-4 py-3 text-center text-sm text-foreground"><WifiOff className="size-4 shrink-0" />Sem conexão. Conecte-se para salvar ou consultar dados.</div>}
    {!installed && !open && <Button variant="outline" size="icon" className="pwa-install-launcher fixed bottom-5 right-5 z-40 size-11 bg-background" aria-label="Instalar CorpMind" title="Instalar CorpMind" onClick={() => { setManual(false); setOpen(true); }}><Download /></Button>}
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-h-[85dvh] w-[calc(100%_-_2rem)] max-w-sm gap-5 overflow-y-auto rounded-lg p-6 sm:p-7">
        <div className="flex items-center gap-4"><img src={icon} alt="" width={64} height={64} className="size-16 shrink-0 rounded-lg" /><div><p className="text-xs font-medium uppercase text-primary">No seu dispositivo</p><DialogTitle className="mt-1 text-2xl">CorpMind</DialogTitle></div></div>
        <DialogDescription className="text-base leading-relaxed">Tenha o CorpMind na sua tela inicial, sempre a um toque de distância.</DialogDescription>
        {manual ? <div className="space-y-4 border-y border-border py-5">
          <p className="font-semibold">{platform === "ios" ? "Instalar pelo Safari" : platform === "android" ? "Instalar pelo Chrome" : "Instalar no computador"}</p>
          {platform === "ios" ? <>
            <Step n="1" icon={<Share className="size-5" />} text="Abra este endereço no Safari e toque em Compartilhar (quadrado com seta para cima)." />
            <Step n="2" icon={<PlusSquare className="size-5" />} text="Escolha Adicionar à Tela de Início. Se necessário, toque em Mais para encontrar a opção." />
            <Step n="3" icon={<Smartphone className="size-5" />} text="Ative Abrir como App, se aparecer, e confirme em Adicionar." />
          </> : platform === "android" ? <>
            <Step n="1" icon={<MoreVertical className="size-5" />} text="Abra o endereço no Chrome e toque nos três pontos, no canto superior direito." />
            <Step n="2" icon={<Download className="size-5" />} text="Toque em Instalar aplicativo ou Adicionar à tela inicial e confirme." />
          </> : <>
            <Step n="1" icon={<MonitorDown className="size-5" />} text="No Chrome ou Edge, procure o ícone de instalação à direita da barra de endereço (monitor com seta)." />
            <Step n="2" icon={<MoreVertical className="size-5" />} text="Ou abra o menu ⋮ e procure Instalar CorpMind. No Safari do Mac, use Arquivo → Adicionar ao Dock." />
          </>}
          <p className="text-xs leading-relaxed text-muted-foreground">Use o endereço publicado em uma janela do navegador, fora da prévia. Se a opção não aparecer, atualize o navegador. Alguns navegadores não oferecem instalação.</p>
        </div> : <div className="flex items-center gap-3 border-y border-border py-4 text-sm"><Smartphone className="size-5 text-primary" /><span>Seu restaurante, mais perto de você.</span></div>}
        <Button size="lg" className="w-full" disabled={busy} onClick={() => { if (manual) setOpen(false); else void install(); }}><Download />{busy ? "Aguarde…" : manual ? "Entendi" : "Instalar CorpMind"}</Button>
        {!manual && <Button variant="ghost" className="w-full" onClick={() => setOpen(false)}>Agora não</Button>}
        {offlineReady && <p className="flex items-center justify-center gap-2 text-xs text-muted-foreground"><RefreshCw className="size-3" />Atualizações automáticas ativadas</p>}
      </DialogContent>
    </Dialog>
  </>;
}

function Step({ n, icon: stepIcon, text }: { n: string; icon: React.ReactNode; text: string }) {
  return <div className="flex gap-3 text-sm leading-relaxed"><span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary/10 font-semibold text-primary">{n}</span><div className="min-w-0"><span className="mr-2 inline-flex align-middle text-primary">{stepIcon}</span>{text}</div></div>;
}