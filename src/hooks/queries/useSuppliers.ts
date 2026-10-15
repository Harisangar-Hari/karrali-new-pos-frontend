import {
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import { qk } from '@/config/queryKeys';
import {
  createSupplier,
  deleteSupplier,
  getSupplier,
  listSuppliers,
  updateSupplier,
} from '@/api/suppliers';
import type {
  CreateSupplierInput,
  QuerySupplierParams,
  UpdateSupplierInput,
} from '@/types/supplier';

export function useSuppliers(params: QuerySupplierParams) {
  return useQuery({
    queryKey: qk.suppliers.list(params),
    queryFn: () => listSuppliers(params),
    placeholderData: (prev) => prev,
  });
}

export function useSupplier(id: string | null) {
  return useQuery({
    queryKey: qk.suppliers.detail(id ?? ''),
    queryFn: () => getSupplier(id!),
    enabled: !!id,
  });
}

export function useCreateSupplier() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateSupplierInput) => createSupplier(input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.suppliers.all });
    },
  });
}

export function useUpdateSupplier(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: UpdateSupplierInput) => updateSupplier(id, input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.suppliers.all });
      qc.invalidateQueries({ queryKey: qk.suppliers.detail(id) });
    },
  });
}

export function useDeleteSupplier() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteSupplier(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.suppliers.all });
    },
  });
}