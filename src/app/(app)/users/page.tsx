"use client";

import { useState } from "react";
import {
  Plus,
  Check,
  Trash2,
  ShieldCheck,
  UserCog,
  Power,
  ChevronLeft,
  Ban,
  MailPen,
} from "lucide-react";
import { useResource } from "@/hooks/use-resource";
import { useAuth } from "@/components/auth/auth-provider";
import {
  getOffices,
  getOfficeUsers,
  createOfficeUser,
  updateOfficeUserPermissions,
  setOfficeUserActive,
  deleteOfficeUser,
  resetOfficeUserPassword,
} from "@/lib/data";
import type { CreateOfficeUserDTO, OfficeUser, Permission, Role } from "@/types";
import { PERMISSION_GROUPS } from "@/config/permissions";
import { Card, CardBody, CardHeader, CardTitle } from "@/components/ui/card";
import { Table } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Field, Label, ErrorText } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { Spinner } from "@/components/ui/spinner";
import { usePageActions } from "@/components/shell/topbar-actions";
import { useConfirm } from "@/components/providers/confirm-provider";
import { cn } from "@/lib/utils";

const ROLE_LABEL: Record<Role, string> = {
  DESPHUB_ADMIN: "Administrador",
  OFFICE_OWNER: "Dono",
  EMPLOYEE: "Funcionário",
};

type View = "list" | "new" | "perms";

export default function UsersPage() {
  const { user, can, isAdmin } = useAuth();
  const { confirm, notify } = useConfirm();
  const allowed = can("USERS_MANAGE");
  const newRole: Role = isAdmin ? "OFFICE_OWNER" : "EMPLOYEE";

  const [selectedOfficeId, setSelectedOfficeId] = useState<number | null>(null);
  const officeId = isAdmin ? (selectedOfficeId ?? 0) : (user?.officeId ?? 0);

  const offices = useResource(
    () => (isAdmin ? getOffices() : Promise.resolve([])),
    [isAdmin],
  );
  const users = useResource(
    () => (allowed && officeId ? getOfficeUsers(officeId) : Promise.resolve([])),
    [allowed, officeId],
  );
  const [view, setView] = useState<View>("list");
  const [selected, setSelected] = useState<OfficeUser | null>(null);

  usePageActions(
    () =>
      allowed ? (
        <Button
          disabled={isAdmin && !officeId}
          onClick={() => {
            setSelected(null);
            setView("new");
          }}
        >
          <Plus size={17} />
          Novo usuário
        </Button>
      ) : null,
    [allowed, isAdmin, officeId],
  );

  if (!allowed) {
    return (
      <Card className="fade-in">
        <EmptyState
          icon={<Ban size={30} />}
          title="Acesso negado"
          description="Você não tem permissão para gerenciar usuários."
        />
      </Card>
    );
  }

  if (view === "new") {
    return (
      <UserForm
        officeId={officeId}
        role={newRole}
        onDone={() => {
          users.reload();
          setView("list");
        }}
        onCancel={() => setView("list")}
      />
    );
  }

  if (view === "perms" && selected) {
    return (
      <PermissionsEditor
        officeId={officeId}
        user={selected}
        onDone={() => {
          users.reload();
          setView("list");
        }}
        onCancel={() => setView("list")}
      />
    );
  }

  async function toggleActive(u: OfficeUser) {
    await setOfficeUserActive(officeId, u.id, !u.active);
    users.reload();
  }

  async function remove(u: OfficeUser) {
    const ok = await confirm({
      title: "Excluir usuário",
      message: `Excluir o usuário "${u.name}"? Essa ação não pode ser desfeita.`,
      confirmText: "Excluir",
      tone: "danger",
    });
    if (!ok) return;
    await deleteOfficeUser(officeId, u.id);
    users.reload();
  }

  async function resetPassword(u: OfficeUser) {
    await resetOfficeUserPassword(officeId, u.id);
    await notify({
      title: "Redefinição enviada",
      message: `Foi enviada uma solicitação de redefinição de senha para ${u.email}. Peça para o usuário conferir também a caixa de spam.`,
    });
  }

  const list = users.data ?? [];

  return (
    <Card className="fade-in">
      {isAdmin && (
        <div className="border-b border-border p-4">
          <div className="max-w-sm">
            <Label>Escritório</Label>
            <div className="mt-1.5">
              <Select
                value={selectedOfficeId ?? ""}
                onChange={(e) =>
                  setSelectedOfficeId(
                    e.target.value ? Number(e.target.value) : null,
                  )
                }
              >
                <option value="">Selecione o escritório…</option>
                {(offices.data ?? []).map((o) => (
                  <option key={o.id} value={o.id}>
                    {o.name}
                  </option>
                ))}
              </Select>
            </div>
          </div>
        </div>
      )}

      {isAdmin && !officeId ? (
        <EmptyState
          icon={<UserCog size={30} />}
          title="Selecione um escritório"
          description="Escolha um escritório acima para ver e gerenciar seus usuários."
        />
      ) : users.loading ? (
        <div className="space-y-3 p-5">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-10 w-full" />
          ))}
        </div>
      ) : users.error ? (
        <EmptyState
          icon={<UserCog size={30} />}
          title="Não foi possível carregar"
          description="Verifique sua conexão e tente novamente."
          action={
            <Button variant="ghost" size="sm" onClick={users.reload}>
              Tentar novamente
            </Button>
          }
        />
      ) : list.length === 0 ? (
        <EmptyState
          icon={<UserCog size={30} />}
          title="Nenhum usuário"
          description="Cadastre o primeiro usuário do escritório."
        />
      ) : (
        <Table>
          <thead>
            <tr>
              <th>Usuário</th>
              <th>E-mail</th>
              <th>Papel</th>
              <th>Status</th>
              <th className="w-40" />
            </tr>
          </thead>
          <tbody>
            {list.map((u) => (
              <tr key={u.id}>
                <td className="font-semibold">{u.name}</td>
                <td className="text-text-2">{u.email}</td>
                <td>
                  <Badge tone="neutral" dot={false}>
                    {ROLE_LABEL[u.role]}
                  </Badge>
                </td>
                <td>
                  <Badge tone={u.active ? "success" : "neutral"}>
                    {u.active ? "Ativo" : "Inativo"}
                  </Badge>
                </td>
                <td>
                  <div className="flex justify-end gap-1">
                    {u.role === "EMPLOYEE" && (
                      <button
                        type="button"
                        aria-label="Permissões"
                        title="Permissões"
                        onClick={() => {
                          setSelected(u);
                          setView("perms");
                        }}
                        className="grid h-8 w-8 place-items-center rounded-[10px] text-text-3 hover:bg-surface-soft hover:text-text-1"
                      >
                        <ShieldCheck size={16} />
                      </button>
                    )}
                    <button
                      type="button"
                      aria-label={u.active ? "Desativar" : "Ativar"}
                      title={u.active ? "Desativar" : "Ativar"}
                      onClick={() => toggleActive(u)}
                      className="grid h-8 w-8 place-items-center rounded-[10px] text-text-3 hover:bg-surface-soft hover:text-text-1"
                    >
                      <Power size={16} />
                    </button>
                    <button
                      type="button"
                      aria-label="Redefinir senha"
                      title="Redefinir senha"
                      onClick={() => resetPassword(u)}
                      className="grid h-8 w-8 place-items-center rounded-[10px] text-text-3 hover:bg-surface-soft hover:text-text-1"
                      >
                      <MailPen size={16} />
                    </button>
                    <button
                      type="button"
                      aria-label="Excluir"
                      title="Excluir"
                      onClick={() => remove(u)}
                      className="grid h-8 w-8 place-items-center rounded-[10px] text-text-3 hover:bg-danger-bg hover:text-danger"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
      )}
    </Card>
  );
}

function UserForm({
  officeId,
  role,
  onDone,
  onCancel,
}: {
  officeId: number;
  role: Role;
  onDone: () => void;
  onCancel: () => void;
}) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [touched, setTouched] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isEmployee = role === "EMPLOYEE";
  const errName = touched && !name.trim();
  const errEmail = touched && !email.trim();
  const errPass = touched && password.length < 6;

  function toggle(p: Permission) {
    setPermissions((prev) =>
      prev.includes(p) ? prev.filter((x) => x !== p) : [...prev, p],
    );
  }

  async function submit() {
    setTouched(true);
    if (!name.trim() || !email.trim() || password.length < 6) return;
    setSaving(true);
    setError(null);
    const payload: CreateOfficeUserDTO = {
      name: name.trim(),
      email: email.trim(),
      password,
      role,
      permissions: isEmployee ? permissions : [],
    };
    try {
      await createOfficeUser(officeId, payload);
      onDone();
    } catch {
      setError("Não foi possível criar o usuário.");
      setSaving(false);
    }
  }

  return (
    <div className="fade-in max-w-[760px]">
      <Button variant="ghost" size="sm" className="mb-3.5" onClick={onCancel}>
        <ChevronLeft size={15} />
        Voltar à lista
      </Button>
      <Card>
        <CardHeader>
          <UserCog size={18} className="text-link-blue" />
          <CardTitle>Novo {ROLE_LABEL[role].toLowerCase()}</CardTitle>
        </CardHeader>
        <CardBody className="flex flex-col gap-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field>
              <Label required>Nome</Label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                state={errName ? "error" : "default"}
              />
              {errName && <ErrorText>Campo obrigatório</ErrorText>}
            </Field>
            <Field>
              <Label required>E-mail</Label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                state={errEmail ? "error" : "default"}
              />
              {errEmail && <ErrorText>Campo obrigatório</ErrorText>}
            </Field>
          </div>
          <Field>
            <Label required>Senha</Label>
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              state={errPass ? "error" : "default"}
              placeholder="Mínimo 6 caracteres"
            />
            {errPass && <ErrorText>Mínimo de 6 caracteres</ErrorText>}
          </Field>

          {isEmployee && (
            <div>
              <Label>Permissões</Label>
              <div className="mt-2">
                <PermissionPicker selected={permissions} onToggle={toggle} />
              </div>
            </div>
          )}

          {error && <ErrorText>{error}</ErrorText>}

          <div className="flex justify-end gap-3">
            <Button variant="ghost" onClick={onCancel} disabled={saving}>
              Cancelar
            </Button>
            <Button onClick={submit} disabled={saving}>
              {saving ? <Spinner /> : <Check size={16} />}
              Criar usuário
            </Button>
          </div>
        </CardBody>
      </Card>
    </div>
  );
}

function PermissionsEditor({
  officeId,
  user,
  onDone,
  onCancel,
}: {
  officeId: number;
  user: OfficeUser;
  onDone: () => void;
  onCancel: () => void;
}) {
  const [permissions, setPermissions] = useState<Permission[]>(
    user.permissions,
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function toggle(p: Permission) {
    setPermissions((prev) =>
      prev.includes(p) ? prev.filter((x) => x !== p) : [...prev, p],
    );
  }

  async function submit() {
    setSaving(true);
    setError(null);
    try {
      await updateOfficeUserPermissions(officeId, user.id, permissions);
      onDone();
    } catch {
      setError("Não foi possível salvar as permissões.");
      setSaving(false);
    }
  }

  return (
    <div className="fade-in max-w-[760px]">
      <Button variant="ghost" size="sm" className="mb-3.5" onClick={onCancel}>
        <ChevronLeft size={15} />
        Voltar à lista
      </Button>
      <Card>
        <CardHeader>
          <ShieldCheck size={18} className="text-link-blue" />
          <CardTitle>Permissões — {user.name}</CardTitle>
        </CardHeader>
        <CardBody className="flex flex-col gap-4">
          <PermissionPicker selected={permissions} onToggle={toggle} />
          {error && <ErrorText>{error}</ErrorText>}
          <div className="flex justify-end gap-3">
            <Button variant="ghost" onClick={onCancel} disabled={saving}>
              Cancelar
            </Button>
            <Button onClick={submit} disabled={saving}>
              {saving ? <Spinner /> : <Check size={16} />}
              Salvar permissões
            </Button>
          </div>
        </CardBody>
      </Card>
    </div>
  );
}

function PermissionPicker({
  selected,
  onToggle,
}: {
  selected: Permission[];
  onToggle: (p: Permission) => void;
}) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      {PERMISSION_GROUPS.map((group) => (
        <div
          key={group.label}
          className="rounded-lg border border-border p-3.5"
        >
          <div className="mb-2 text-[11px] font-bold uppercase tracking-[0.8px] text-text-3">
            {group.label}
          </div>
          <div className="flex flex-col gap-2">
            {group.items.map((item) => {
              const active = selected.includes(item.value);
              return (
                <button
                  key={item.value}
                  type="button"
                  onClick={() => onToggle(item.value)}
                  className="flex items-center gap-2.5 text-left text-[13.5px] text-text-1"
                >
                  <span
                    className={cn(
                      "grid h-5 w-5 shrink-0 place-items-center rounded-md border transition-colors",
                      active
                        ? "border-orange bg-orange text-white"
                        : "border-border-strong",
                    )}
                  >
                    {active && <Check size={13} />}
                  </span>
                  {item.label}
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
