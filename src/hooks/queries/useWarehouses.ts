import {
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import { qk } from '@/config/queryKeys';
import {
  createWarehouse,
  deleteWarehouse,
  getWarehouse,
  listWarehouses,
  updateWarehouse,
} from '@/api/warehouses';
import type {
  CreateWarehouseInput,
  QueryWarehouseParams,
  UpdateWarehouseInput,
} from '@/types/warehouse';

export function useWarehouses(params: QueryWarehouseParams) {
  return useQuery({
    queryKey: qk.warehouses.list(params),
    queryFn: () => listWarehouses(params),
    placeholderData: (prev) => prev,
  });
}

export function useWarehouse(id: string | null) {
  return useQuery({
    queryKey: qk.warehouses.detail(id ?? ''),
    queryFn: () => getWarehouse(id!),
    enabled: !!id,
  });
}

export function useCreateWarehouse() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateWarehouseInput) => createWarehouse(input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.warehouses.all });
    },
  });
}

export function useUpdateWarehouse(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: UpdateWarehouseInput) => updateWarehouse(id, input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.warehouses.all });
      qc.invalidateQueries({ queryKey: qk.warehouses.detail(id) });
    },
  });
}

export function useDeleteWarehouse() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteWarehouse(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.warehouses.all });
    },
  });
}