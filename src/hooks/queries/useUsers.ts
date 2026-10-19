import {
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import { qk } from '@/config/queryKeys';
import {
  assignRoles,
  changeOwnPassword,
  createUser,
  deleteUser,
  getUser,
  listRoles,
  listUsers,
  resetPassword,
  updateUser,
} from '@/api/users';
import type {
  AssignRolesInput,
  ChangePasswordInput,
  CreateUserInput,
  QueryUserParams,
  ResetPasswordInput,
  UpdateUserInput,
} from '@/types/user';

export function useUsers(params: QueryUserParams) {
  return useQuery({
    queryKey: qk.users.list(params),
    queryFn: () => listUsers(params),
    placeholderData: (prev) => prev,
  });
}

export function useUser(id: string | null) {
  return useQuery({
    queryKey: qk.users.detail(id ?? ''),
    queryFn: () => getUser(id!),
    enabled: !!id,
  });
}

export function useRoles() {
  return useQuery({
    queryKey: qk.users.roles,
    queryFn: listRoles,
    staleTime: 5 * 60_000,
  });
}

export function useCreateUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateUserInput) => createUser(input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.users.all });
    },
  });
}

export function useUpdateUser(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: UpdateUserInput) => updateUser(id, input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.users.all });
      qc.invalidateQueries({ queryKey: qk.users.detail(id) });
    },
  });
}

export function useAssignRoles(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: AssignRolesInput) => assignRoles(id, input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.users.all });
      qc.invalidateQueries({ queryKey: qk.users.detail(id) });
    },
  });
}

export function useChangeOwnPassword() {
  return useMutation({
    mutationFn: (input: ChangePasswordInput) => changeOwnPassword(input),
  });
}

export function useResetPassword(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: ResetPasswordInput) => resetPassword(id, input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.users.all });
      qc.invalidateQueries({ queryKey: qk.users.detail(id) });
    },
  });
}

export function useDeleteUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteUser(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.users.all });
    },
  });
}