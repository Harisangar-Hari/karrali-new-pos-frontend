import { api } from '@/lib/api';
import type {
  QuerySettingParams,
  SettingRow,
  UpsertSettingInput,
} from '@/types/setting';

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

export async function listSettings(
  params?: QuerySettingParams,
): Promise<SettingRow[]> {
  const { data } = await api.get<SettingRow[]>('/settings', {
    params: cleanParams(params),
  });
  return data;
}

export async function getSetting(key: string): Promise<SettingRow> {
  const { data } = await api.get<SettingRow>(
    `/settings/${encodeURIComponent(key)}`,
  );
  return data;
}

export async function upsertSetting(
  key: string,
  input: UpsertSettingInput,
): Promise<SettingRow> {
  const { data } = await api.put<SettingRow>(
    `/settings/${encodeURIComponent(key)}`,
    input,
  );
  return data;
}

export async function deleteSetting(key: string): Promise<{ ok: true }> {
  const { data } = await api.delete<{ ok: true }>(
    `/settings/${encodeURIComponent(key)}`,
  );
  return data;
}