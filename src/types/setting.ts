/**
 * Value is arbitrary JSON (primitive, array, or object). Never
 * validated on the backend — shape is the caller's responsibility
 * per key.
 */
export type SettingValue = unknown;

export interface SettingRow {
  Key: string;
  Value: SettingValue;
  Description: string | null;
  UpdatedAt: string;
  UpdatedByUserId: string | null;
}

export interface UpsertSettingInput {
  Value: unknown;
  Description?: string;
}

export interface QuerySettingParams {
  search?: string;
}

/**
 * Detects the "shape" of a JSON value for display purposes.
 * Used in the list view to show a small tag next to each setting.
 */
export type SettingShape =
  | 'string'
  | 'number'
  | 'boolean'
  | 'null'
  | 'array'
  | 'object';

export function getSettingShape(value: unknown): SettingShape {
  if (value === null) return 'null';
  if (Array.isArray(value)) return 'array';
  return typeof value as 'string' | 'number' | 'boolean' | 'object';
}

/**
 * Compact preview string for the list view.
 * - Primitives → their string form
 * - Objects / arrays → JSON, truncated to `maxLen`
 */
export function previewValue(value: unknown, maxLen = 60): string {
  if (value === null) return 'null';
  if (typeof value === 'string') {
    return value.length > maxLen ? `"${value.slice(0, maxLen)}…"` : `"${value}"`;
  }
  if (typeof value === 'number' || typeof value === 'boolean') {
    return String(value);
  }
  const json = JSON.stringify(value);
  return json.length > maxLen ? `${json.slice(0, maxLen)}…` : json;
}