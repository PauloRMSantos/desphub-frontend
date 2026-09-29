"use client";

import { useState } from "react";
import { FileSignature, FileText, History } from "lucide-react";
import { useAuth } from "@/components/auth/auth-provider";
import { Segmented } from "@/components/ui/segmented";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Ban } from "lucide-react";
import { TemplatesTab } from "@/components/documents/templates-tab";
import { GenerateTab } from "@/components/documents/generate-tab";
import { HistoryTab } from "@/components/documents/history-tab";

type Tab = "generate" | "templates" | "history";

export default function DocumentsPage() {
  const { can } = useAuth();
  const canDocsRead = can("DOCUMENTS_READ");
  const canTemplatesRead = can("TEMPLATES_READ");
  const [tab, setTab] = useState<Tab>(
    canDocsRead ? "generate" : "templates",
  );

  const options = [
    canDocsRead && {
      value: "generate" as const,
      label: "Gerar",
      icon: <FileSignature size={16} />,
    },
    canTemplatesRead && {
      value: "templates" as const,
      label: "Modelos",
      icon: <FileText size={16} />,
    },
    canDocsRead && {
      value: "history" as const,
      label: "Histórico",
      icon: <History size={16} />,
    },
  ].filter(Boolean) as { value: Tab; label: string; icon: React.ReactNode }[];

  if (options.length === 0) {
    return (
      <Card className="fade-in">
        <EmptyState
          icon={<Ban size={30} />}
          title="Acesso negado"
          description="Você não tem permissão para acessar documentos."
        />
      </Card>
    );
  }

  const current = options.some((o) => o.value === tab) ? tab : options[0].value;

  return (
    <div className="fade-in flex flex-col gap-5">
      <Segmented value={current} onChange={setTab} options={options} />
      {current === "generate" && <GenerateTab />}
      {current === "templates" && <TemplatesTab />}
      {current === "history" && <HistoryTab />}
    </div>
  );
}
