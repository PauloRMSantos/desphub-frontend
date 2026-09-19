"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { LogIn } from "lucide-react";
import { useAuth } from "@/components/auth/auth-provider";
import { ApiError } from "@/lib/data/http";
import { Card, CardBody } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Field, Label, ErrorText } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";

export default function LoginPage() {
  const router = useRouter();
  const { user, loading, login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && user) router.replace("/");
  }, [loading, user, router]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim() || !password) {
      setError("Informe e-mail e senha.");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await login(email.trim(), password);
      router.replace("/");
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        setError("E-mail ou senha inválidos.");
      } else {
        setError("Não foi possível entrar. Tente novamente.");
      }
      setSubmitting(false);
    }
  }

  return (
    <main className="grid min-h-dvh place-items-center bg-app px-4">
      <div className="w-full max-w-[400px]">
        <div className="mb-6 flex justify-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/desphub-logo-horizontal.svg"
            alt="DespHub"
            className="h-10 w-auto dark:hidden"
          />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/desphub-logo-reverse.svg"
            alt="DespHub"
            className="hidden h-10 w-auto dark:block"
          />
        </div>

        <Card>
          <CardBody className="flex flex-col gap-4">
            <div>
              <h1 className="font-head text-[26px] font-bold text-text-1">
                Entrar
              </h1>
              <p className="mt-1 text-[13px] text-text-2">
                Acesse o painel do escritório.
              </p>
            </div>

            <form className="flex flex-col gap-4" onSubmit={submit}>
              <Field>
                <Label required>E-mail</Label>
                <Input
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="voce@escritorio.com.br"
                />
              </Field>
              <Field>
                <Label required>Senha</Label>
                <Input
                  type="password"
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                />
              </Field>

              {error && <ErrorText>{error}</ErrorText>}

              <Button block type="submit" disabled={submitting}>
                {submitting ? <Spinner /> : <LogIn size={17} />}
                Entrar
              </Button>
            </form>
          </CardBody>
        </Card>
      </div>
    </main>
  );
}
