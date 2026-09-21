"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ShieldCheck, ShieldAlert, PlugZap, ExternalLink, X } from "lucide-react";
import { getGovbrSession, issuePairingToken } from "@/lib/data";
import { armCapture, onCourierReady } from "@/lib/govbr-courier";
import type { GovbrSessionState } from "@/types";
import { Card, CardBody } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";

const DETRAN_LOGIN_URL = "https://pcsdetran.rs.gov.br/consulta-veiculo?contabiliza=true";

function formatUntil(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const time = d.toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  });
  const sameDay = d.toDateString() === new Date().toDateString();
  return sameDay ? time : `${d.toLocaleDateString("pt-BR")} ${time}`;
}

export function GovbrConnection() {
  const [extReady, setExtReady] = useState(false);
  const [session, setSession] = useState<GovbrSessionState | null>(null);
  const [phase, setPhase] = useState<"idle" | "connecting">("idle");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const phaseRef = useRef(phase);
  phaseRef.current = phase;

  useEffect(() => onCourierReady(() => setExtReady(true)), []);

  const load = useCallback(async () => {
    try {
      const s = await getGovbrSession();
      setSession(s);
      return s;
    } catch {
      setSession((prev) => prev ?? { connected: false, expiresAt: null });
      return null;
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    const interval = phase === "connecting" ? 4000 : 30000;
    const id = window.setInterval(async () => {
      const s = await load();
      if (phaseRef.current === "connecting" && s?.connected) setPhase("idle");
    }, interval);
    return () => window.clearInterval(id);
  }, [phase, load]);

  async function connect() {
    setError(null);
    setBusy(true);
    try {
      const token = await issuePairingToken();
      const res = await armCapture(token, window.location.origin);
      if (!res.ok) {
        setError(res.error ?? "Não foi possível iniciar a conexão.");
        return;
      }
      setPhase("connecting");
      window.open(DETRAN_LOGIN_URL, "_blank", "noopener");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Falha ao conectar.");
    } finally {
      setBusy(false);
    }
  }

  const connected = session?.connected ?? false;
  const wasConnected = !connected && !!session?.expiresAt;

  return (
    <Card>
      <CardBody className="flex flex-wrap items-center gap-4">
        <Icon connected={connected} connecting={phase === "connecting"} />
        <div className="min-w-[180px] flex-1">
          <div className="text-[14px] font-bold text-text-1">Conta gov.br</div>
          <div className="text-[12.5px] text-text-2">
            {!extReady ? (
              "Instale a extensão DespHub para conectar sua conta."
            ) : phase === "connecting" ? (
              "Aguardando login no gov.br…"
            ) : connected ? (
              <>
                Conectado
                {session?.expiresAt && (
                  <> · até {formatUntil(session.expiresAt)}</>
                )}
              </>
            ) : wasConnected ? (
              "Sessão expirada. Reconecte para continuar consultando."
            ) : (
              "Conecte para o robô consultar o DETRAN-RS."
            )}
          </div>
          {error && (
            <div className="mt-1 text-[12px] font-medium text-danger">
              {error}
            </div>
          )}
        </div>

        {!extReady ? null : phase === "connecting" ? (
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" asChild>
              <a href={DETRAN_LOGIN_URL} target="_blank" rel="noopener noreferrer">
                <ExternalLink size={15} />
                Abrir DETRAN-RS
              </a>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setPhase("idle")}
            >
              <X size={15} />
              Cancelar
            </Button>
          </div>
        ) : connected ? null : (
          <Button size="sm" onClick={connect} disabled={busy}>
            {busy ? <Spinner /> : <PlugZap size={16} />}
            {wasConnected ? "Reconectar gov.br" : "Conectar gov.br"}
          </Button>
        )}
      </CardBody>
    </Card>
  );
}

function Icon({
  connected,
  connecting,
}: {
  connected: boolean;
  connecting: boolean;
}) {
  const base = "grid h-10 w-10 shrink-0 place-items-center rounded-xl";
  if (connecting)
    return (
      <span className={`${base} bg-info-bg text-link-blue`}>
        <Spinner size={18} />
      </span>
    );
  if (connected)
    return (
      <span className={`${base} bg-success-bg text-success`}>
        <ShieldCheck size={20} />
      </span>
    );
  return (
    <span className={`${base} bg-warning-bg text-warning`}>
      <ShieldAlert size={20} />
    </span>
  );
}
