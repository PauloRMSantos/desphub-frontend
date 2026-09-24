"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { KeyRound, CheckCircle2, AlertTriangle, LogIn } from "lucide-react";
import { resetPassword } from "@/lib/data";
import { ApiError } from "@/lib/data/http";
import { Card, CardBody } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Field, Label, ErrorText } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";

const MIN_LENGTH = 6;

function Shell({ children }: { children: React.ReactNode }) {
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
        <Card>{children}</Card>
      </div>
    </main>
  );
}

function ResetPasswordForm() {
  const token = useSearchParams().get("token");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [touched, setTouched] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const errPass = touched && password.length < MIN_LENGTH;
  const errConfirm = touched && confirm !== password;

  if (!token) {
    return (
      <Shell>
        <CardBody className="flex flex-col items-center gap-4 text-center">
          <div className="grid h-12 w-12 place-items-center rounded-full bg-danger-bg text-danger">
            <AlertTriangle size={24} />
          </div>
          <div>
            <h1 className="font-head text-[24px] font-bold text-text-1">
              Link inválido
            </h1>
            <p className="mt-1 text-[13px] text-text-2">
              O link de redefinição está incompleto ou expirou. Solicite um novo
              ao administrador do escritório.
            </p>
          </div>
          <Button asChild block variant="ghost">
            <Link href="/login">Voltar ao login</Link>
          </Button>
        </CardBody>
      </Shell>
    );
  }

  if (done) {
    return (
      <Shell>
        <CardBody className="flex flex-col items-center gap-4 text-center">
          <div className="grid h-12 w-12 place-items-center rounded-full bg-success-bg text-success">
            <CheckCircle2 size={24} />
          </div>
          <div>
            <h1 className="font-head text-[24px] font-bold text-text-1">
              Senha redefinida
            </h1>
            <p className="mt-1 text-[13px] text-text-2">
              Sua senha foi atualizada com sucesso!
            </p>
          </div>
          <Button asChild block>
            <Link href="/login">
              <LogIn size={17} />
              Ir para o login
            </Link>
          </Button>
        </CardBody>
      </Shell>
    );
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setTouched(true);
    if (password.length < MIN_LENGTH || confirm !== password) return;
    setSubmitting(true);
    setError(null);
    try {
      await resetPassword(token!, password);
      setDone(true);
    } catch (err) {
      if (err instanceof ApiError && err.status === 400) {
        setError("Link inválido ou expirado. Solicite um novo.");
      } else {
        setError("Não foi possível redefinir a senha. Tente novamente.");
      }
      setSubmitting(false);
    }
  }

  return (
    <Shell>
      <CardBody className="flex flex-col gap-4">
        <div>
          <h1 className="font-head text-[26px] font-bold text-text-1">
            Redefinir senha
          </h1>
          <p className="mt-1 text-[13px] text-text-2">
            Escolha uma nova senha para acessar o DespHub.
          </p>
        </div>

        <form className="flex flex-col gap-4" onSubmit={submit}>
          <Field>
            <Label required>Nova senha</Label>
            <Input
              type="password"
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              state={errPass ? "error" : "default"}
              placeholder="Mínimo 6 caracteres"
            />
            {errPass && <ErrorText>Mínimo de 6 caracteres</ErrorText>}
          </Field>
          <Field>
            <Label required>Confirmar nova senha</Label>
            <Input
              type="password"
              autoComplete="new-password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              state={errConfirm ? "error" : "default"}
              placeholder="Repita a senha"
            />
            {errConfirm && <ErrorText>As senhas não coincidem</ErrorText>}
          </Field>

          {error && <ErrorText>{error}</ErrorText>}

          <Button block type="submit" disabled={submitting}>
            {submitting ? <Spinner /> : <KeyRound size={17} />}
            Redefinir senha
          </Button>
        </form>
      </CardBody>
    </Shell>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="grid h-dvh place-items-center bg-app">
          <Spinner size={28} />
        </div>
      }
    >
      <ResetPasswordForm />
    </Suspense>
  );
}
