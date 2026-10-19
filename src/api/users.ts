import { api } from '@/lib/api';
import type { PaginatedResponse } from '@/types/common';
import type {
  AssignRolesInput,
  ChangePasswordInput,
  CreateUserInput,
  QueryUserParams,
  ResetPasswordInput,
  RoleOption,
  UpdateUserInput,
  UserRow,
} from '@/types/user';

function cleanParams<T extends object>(
  params: T | undefined,
): Record<string, unknown> {
  if (!params) return {};
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(params)) {
    if (v === undefined || v === null || v === '') continue;
    out[k] = v;
  }
  return out;
}

export async function listUsers(
  params?: QueryUserParams,
): Promise<PaginatedResponse<UserRow>> {
  const { data } = await api.get<PaginatedResponse<UserRow>>('/users', {
    params: cleanParams(params),
  });
  return data;
}

export async function getUser(id: string): Promise<UserRow> {
  const { data } = await api.get<UserRow>(`/users/${id}`);
  return data;
}

export async function listRoles(): Promise<RoleOption[]> {
  const { data } = await api.get<RoleOption[]>('/users/roles');
  return data;
}

export async function createUser(
  input: CreateUserInput,
): Promise<UserRow> {
  const { data } = await api.post<UserRow>('/users', input);
  return data;
}

export async function updateUser(
  id: string,
  input: UpdateUserInput,
): Promise<UserRow> {
  const { data } = await api.patch<UserRow>(`/users/${id}`, input);
  return data;
}

export async function assignRoles(
  id: string,
  input: AssignRolesInput,
): Promise<UserRow> {
  const { data } = await api.post<UserRow>(`/users/${id}/roles`, input);
  return data;
}

export async function changeOwnPassword(
  input: ChangePasswordInput,
): Promise<{ ok: true }> {
  const { data } = await api.post<{ ok: true }>(
    '/users/me/change-password',
    input,
  );
  return data;
}

export async function resetPassword(
  id: string,
  input: ResetPasswordInput,
): Promise<{ ok: true }> {
  const { data } = await api.post<{ ok: true }>(
    `/users/${id}/reset-password`,
    input,
  );
  return data;
}

export async function deleteUser(id: string): Promise<{ ok: true }> {
  const { data } = await api.delete<{ ok: true }>(`/users/${id}`);
  return data;
}