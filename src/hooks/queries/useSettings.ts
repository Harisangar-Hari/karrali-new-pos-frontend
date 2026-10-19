import {
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import { qk } from '@/config/queryKeys';
import {
  deleteSetting,
  getSetting,
  listSettings,
  upsertSetting,
} from '@/api/settings';
import type {
  QuerySettingParams,
  UpsertSettingInput,
} from '@/types/setting';

export function useSettings(params: QuerySettingParams = {}) {
  return useQuery({
    queryKey: qk.settings.list(params),
    queryFn: () => listSettings(params),
    // Settings rarely change; the invalidation on save is enough.
    staleTime: 60_000,
  });
}

export function useSetting(key: string | null) {
  return useQuery({
    queryKey: qk.settings.detail(key ?? ''),
    queryFn: () => getSetting(key!),
    enabled: !!key,
  });
}

export function useUpsertSetting() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ key, input }: { key: string; input: UpsertSettingInput }) =>
      upsertSetting(key, input),
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: qk.settings.all });
      qc.invalidateQueries({ queryKey: qk.settings.detail(vars.key) });
    },
  });
}

export function useDeleteSetting() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (key: string) => deleteSetting(key),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.settings.all });
    },
  });
}