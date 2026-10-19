import { useEffect, useMemo, useState } from 'react';
import {
  Drawer,
  Input,
  Button,
  Flex,
  Grid,
  Typography,
  App,
  Alert,
  Segmented,
  Switch,
  InputNumber,
  Space,
} from 'antd';
import { useUpsertSetting } from '@/hooks/queries/useSettings';
import { getErrorMessage } from '@/lib/api';
import type { SettingRow } from '@/types/setting';

const { useBreakpoint } = Grid;

type ValueKind = 'string' | 'number' | 'boolean' | 'json';

interface Props {
  open: boolean;
  setting?: SettingRow | null;
  onClose: () => void;
}

const LABEL_STYLE: React.CSSProperties = {
  display: 'block',
  marginBottom: 4,
  fontSize: 13,
  color: 'rgba(0,0,0,0.88)',
};
const ERR_STYLE: React.CSSProperties = {
  color: '#ff4d4f',
  fontSize: 12,
  marginTop: 4,
  minHeight: 16,
};

/**
 * Detect the most likely editor kind from an existing value.
 * Only used to pick the initial tab when editing.
 */
function detectKind(value: unknown): ValueKind {
  if (value === null) return 'json';
  if (typeof value === 'string') return 'string';
  if (typeof value === 'number') return 'number';
  if (typeof value === 'boolean') return 'boolean';
  return 'json';
}

/**
 * Pretty-print a value into the JSON textarea. Scalars show as plain
 * JSON so the editor round-trips cleanly.
 */
function toJsonText(value: unknown): string {
  return JSON.stringify(value, null, 2);
}

export function SettingFormDrawer({ open, setting, onClose }: Props) {
  const { message } = App.useApp();
  const screens = useBreakpoint();
  const isMobile = !screens.md;
  const isEdit = !!setting;

  const upsertMutation = useUpsertSetting();

  const [key, setKey] = useState('');
  const [description, setDescription] = useState('');
  const [kind, setKind] = useState<ValueKind>('string');
  // For string/number/boolean editors
  const [scalarValue, setScalarValue] = useState<string | number | boolean>('');
  // For the raw JSON editor
  const [jsonText, setJsonText] = useState('');
  const [jsonError, setJsonError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  // Reset on open
  useEffect(() => {
    if (!open) return;
    if (setting) {
      setKey(setting.Key);
      setDescription(setting.Description ?? '');
      const k = detectKind(setting.Value);
      setKind(k);
      if (k === 'string') setScalarValue(String(setting.Value));
      else if (k === 'number') setScalarValue(Number(setting.Value));
      else if (k === 'boolean') setScalarValue(Boolean(setting.Value));
      setJsonText(toJsonText(setting.Value));
      setJsonError(null);
      setFormError(null);
    } else {
      setKey('');
      setDescription('');
      setKind('string');
      setScalarValue('');
      setJsonText('""');
      setJsonError(null);
      setFormError(null);
    }
  }, [open, setting]);

  // Re-validate the JSON whenever it changes
  useEffect(() => {
    if (kind !== 'json') {
      setJsonError(null);
      return;
    }
    if (!jsonText.trim()) {
      setJsonError('Value is required');
      return;
    }
    try {
      JSON.parse(jsonText);
      setJsonError(null);
    } catch (err) {
      setJsonError(err instanceof Error ? err.message : 'Invalid JSON');
    }
  }, [jsonText, kind]);

  const submitting = upsertMutation.isPending;

  // Compose the value to send based on kind
  const composedValue = useMemo<unknown>(() => {
    switch (kind) {
      case 'string':
        return String(scalarValue ?? '');
      case 'number':
        return typeof scalarValue === 'number'
          ? scalarValue
          : Number(scalarValue) || 0;
      case 'boolean':
        return Boolean(scalarValue);
      case 'json':
        if (jsonError) return undefined;
        try {
          return JSON.parse(jsonText);
        } catch {
          return undefined;
        }
    }
  }, [kind, scalarValue, jsonText, jsonError]);

  const canSubmit =
    !submitting &&
    key.trim().length > 0 &&
    composedValue !== undefined &&
    !jsonError;

  const handleSubmit = async () => {
    setFormError(null);
    if (!key.trim()) {
      setFormError('Key is required');
      return;
    }
    if (composedValue === undefined || jsonError) {
      setFormError('Fix the value errors before saving');
      return;
    }
    try {
      await upsertMutation.mutateAsync({
        key: key.trim(),
        input: {
          Value: composedValue,
          Description: description.trim() || undefined,
        },
      });
      message.success(
        isEdit ? `Setting "${key}" updated` : `Setting "${key}" created`,
      );
      onClose();
    } catch (err) {
      message.error(getErrorMessage(err));
    }
  };

  return (
    <Drawer
      title={isEdit ? `Edit setting — ${setting?.Key}` : 'New setting'}
      open={open}
      onClose={submitting ? undefined : onClose}
      width={isMobile ? '100%' : 520}
      destroyOnClose
      maskClosable={!submitting}
      extra={
        <Flex gap={8}>
          <Button onClick={onClose} disabled={submitting}>
            Cancel
          </Button>
          <Button
            type="primary"
            loading={submitting}
            disabled={!canSubmit}
            onClick={handleSubmit}
          >
            {isEdit ? 'Save changes' : 'Create setting'}
          </Button>
        </Flex>
      }
    >
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSubmit();
        }}
        noValidate
      >
        <Alert
          type="info"
          showIcon
          message="Settings are untyped JSON"
          description="Values can be a string, number, boolean, object, or array — pick the shape that matches how the app consumes the key."
          style={{ marginBottom: 16 }}
        />

        {/* Key */}
        <div style={{ marginBottom: 12 }}>
          <label style={LABEL_STYLE}>Key *</label>
          <Input
            value={key}
            onChange={(e) => setKey(e.target.value)}
            maxLength={100}
            placeholder="e.g. Company.Name"
            disabled={isEdit}
            autoFocus={!isEdit}
          />
          {isEdit ? (
            <Typography.Text type="secondary" style={{ fontSize: 11 }}>
              Key is immutable — to rename, create a new setting and delete the
              old one.
            </Typography.Text>
          ) : (
            <Typography.Text type="secondary" style={{ fontSize: 11 }}>
              Use dot notation by convention: <code>Company.Name</code>,{' '}
              <code>Loyalty.Enabled</code>.
            </Typography.Text>
          )}
        </div>

        {/* Description */}
        <div style={{ marginBottom: 12 }}>
          <label style={LABEL_STYLE}>Description</label>
          <Input.TextArea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={2}
            maxLength={500}
            showCount
            placeholder="What this setting controls (optional, for admins)"
            disabled={submitting}
          />
        </div>

        {/* Value kind toggle */}
        <div style={{ marginBottom: 12 }}>
          <label style={LABEL_STYLE}>Value type *</label>
          <Segmented
            value={kind}
            onChange={(v) => setKind(v as ValueKind)}
            block
            options={[
              { label: 'Text', value: 'string' },
              { label: 'Number', value: 'number' },
              { label: 'Boolean', value: 'boolean' },
              { label: 'JSON', value: 'json' },
            ]}
          />
        </div>

        {/* Value editor */}
        {kind === 'string' && (
          <div style={{ marginBottom: 12 }}>
            <label style={LABEL_STYLE}>Value</label>
            <Input.TextArea
              value={String(scalarValue)}
              onChange={(e) => setScalarValue(e.target.value)}
              rows={3}
              maxLength={5000}
              placeholder="e.g. Karrali POS"
              disabled={submitting}
            />
          </div>
        )}

        {kind === 'number' && (
          <div style={{ marginBottom: 12 }}>
            <label style={LABEL_STYLE}>Value</label>
            <InputNumber
              value={typeof scalarValue === 'number' ? scalarValue : 0}
              onChange={(v) => setScalarValue(v ?? 0)}
              style={{ width: '100%' }}
              precision={4}
              disabled={submitting}
            />
          </div>
        )}

        {kind === 'boolean' && (
          <div style={{ marginBottom: 12 }}>
            <label style={LABEL_STYLE}>Value</label>
            <Space>
              <Switch
                checked={Boolean(scalarValue)}
                onChange={(v) => setScalarValue(v)}
                disabled={submitting}
              />
              <Typography.Text>
                {Boolean(scalarValue) ? 'true' : 'false'}
              </Typography.Text>
            </Space>
          </div>
        )}

        {kind === 'json' && (
          <div style={{ marginBottom: 12 }}>
            <label style={LABEL_STYLE}>Value (JSON)</label>
            <Input.TextArea
              value={jsonText}
              onChange={(e) => setJsonText(e.target.value)}
              rows={8}
              spellCheck={false}
              placeholder={'{\n  "Currency": "LKR",\n  "Threshold": 5\n}'}
              status={jsonError ? 'error' : undefined}
              disabled={submitting}
              style={{ fontFamily: 'monospace', fontSize: 12 }}
            />
            <div style={ERR_STYLE}>{jsonError ?? ''}</div>
            {!jsonError && jsonText.trim() && (
              <Typography.Text
                type="secondary"
                style={{ fontSize: 11, display: 'block', marginTop: 4 }}
              >
                ✓ Valid JSON
              </Typography.Text>
            )}
          </div>
        )}

        {formError && (
          <Alert
            type="error"
            showIcon
            message={formError}
            style={{ marginTop: 8 }}
          />
        )}
      </form>
    </Drawer>
  );
}