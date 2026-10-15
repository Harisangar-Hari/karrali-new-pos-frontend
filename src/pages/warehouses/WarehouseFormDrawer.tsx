import { useEffect } from 'react';
import {
  Drawer,
  Input,
  Switch,
  Button,
  Flex,
  Grid,
  Typography,
  Alert,
  App,
} from 'antd';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  useCreateWarehouse,
  useUpdateWarehouse,
} from '@/hooks/queries/useWarehouses';
import { getErrorMessage } from '@/lib/api';
import type { WarehouseRow } from '@/types/warehouse';

const { useBreakpoint } = Grid;

const schema = z.object({
  Name: z.string().min(1, 'Required').max(100),
  Code: z
    .string()
    .min(1, 'Required')
    .max(20)
    .regex(/^\S+$/, 'No spaces allowed'),
  Address: z.string().max(500).optional().or(z.literal('')),
  IsActive: z.boolean(),
  IsDefault: z.boolean(),
});

type Form = z.infer<typeof schema>;

interface Props {
  open: boolean;
  warehouse?: WarehouseRow | null;
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

function buildDefaults(w?: WarehouseRow | null): Form {
  if (!w) {
    return {
      Name: '',
      Code: '',
      Address: '',
      IsActive: true,
      IsDefault: false,
    };
  }
  return {
    Name: w.Name,
    Code: w.Code,
    Address: w.Address ?? '',
    IsActive: w.IsActive,
    IsDefault: w.IsDefault,
  };
}

export function WarehouseFormDrawer({ open, warehouse, onClose }: Props) {
  const { message } = App.useApp();
  const screens = useBreakpoint();
  const isMobile = !screens.md;
  const isEdit = !!warehouse;

  const createMutation = useCreateWarehouse();
  const updateMutation = useUpdateWarehouse(warehouse?.Id ?? '');

  const {
    control,
    handleSubmit,
    reset,
    watch,
    formState: { isSubmitting },
  } = useForm<Form>({
    resolver: zodResolver(schema),
    defaultValues: buildDefaults(warehouse),
    mode: 'onTouched',
  });

  useEffect(() => {
    if (open) reset(buildDefaults(warehouse));
  }, [open, warehouse, reset]);

  const submitting =
    isSubmitting || createMutation.isPending || updateMutation.isPending;

  const isDefaultValue = watch('IsDefault');
  const isActiveValue = watch('IsActive');

  const onSubmit = async (values: Form) => {
    const payload = {
      Name: values.Name,
      Code: values.Code.trim(),
      Address: values.Address || undefined,
      IsActive: values.IsActive,
      IsDefault: values.IsDefault,
    };
    try {
      if (isEdit && warehouse) {
        await updateMutation.mutateAsync(payload);
        message.success('Warehouse updated');
      } else {
        await createMutation.mutateAsync(payload);
        message.success('Warehouse created');
      }
      onClose();
    } catch (err) {
      message.error(getErrorMessage(err));
    }
  };

  // Warn about special consequences of demoting/unsetting default.
  const showDefaultWarning =
    isEdit && warehouse?.IsDefault && isDefaultValue === false;

  return (
    <Drawer
      title={isEdit ? 'Edit warehouse' : 'New warehouse'}
      open={open}
      onClose={submitting ? undefined : onClose}
      width={isMobile ? '100%' : 460}
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
            onClick={handleSubmit(onSubmit)}
          >
            {isEdit ? 'Save changes' : 'Create warehouse'}
          </Button>
        </Flex>
      }
    >
      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        <div style={{ marginBottom: 12 }}>
          <label style={LABEL_STYLE}>Name *</label>
          <Controller
            name="Name"
            control={control}
            render={({ field, fieldState }) => (
              <>
                <Input
                  {...field}
                  placeholder="e.g. Main Warehouse"
                  status={fieldState.error ? 'error' : undefined}
                  autoFocus
                />
                <div style={ERR_STYLE}>{fieldState.error?.message ?? ''}</div>
              </>
            )}
          />
        </div>

        <div style={{ marginBottom: 12 }}>
          <label style={LABEL_STYLE}>Code *</label>
          <Controller
            name="Code"
            control={control}
            render={({ field, fieldState }) => (
              <>
                <Input
                  {...field}
                  onChange={(e) => field.onChange(e.target.value.toUpperCase())}
                  placeholder="e.g. MAIN"
                  maxLength={20}
                  status={fieldState.error ? 'error' : undefined}
                />
                <div style={ERR_STYLE}>{fieldState.error?.message ?? ''}</div>
                <Typography.Text type="secondary" style={{ fontSize: 11 }}>
                  Short identifier used in invoice numbering. Unique, cannot be
                  reused after deletion.
                </Typography.Text>
              </>
            )}
          />
        </div>

        <div style={{ marginBottom: 12 }}>
          <label style={LABEL_STYLE}>Address</label>
          <Controller
            name="Address"
            control={control}
            render={({ field }) => (
              <Input.TextArea
                {...field}
                value={field.value ?? ''}
                rows={2}
                maxLength={500}
                showCount
                placeholder="Optional"
              />
            )}
          />
        </div>

        <div style={{ marginBottom: 12 }}>
          <label style={LABEL_STYLE}>Active</label>
          <Controller
            name="IsActive"
            control={control}
            render={({ field }) => (
              <Flex vertical gap={4}>
                <Switch checked={field.value} onChange={field.onChange} />
                {!isActiveValue && (
                  <Typography.Text type="secondary" style={{ fontSize: 11 }}>
                    Inactive warehouses cannot receive new stock or sales.
                  </Typography.Text>
                )}
              </Flex>
            )}
          />
        </div>

        <div style={{ marginBottom: 12 }}>
          <label style={LABEL_STYLE}>Default warehouse</label>
          <Controller
            name="IsDefault"
            control={control}
            render={({ field }) => (
              <Flex vertical gap={6}>
                <Switch
                  checked={field.value}
                  onChange={field.onChange}
                  disabled={isEdit && warehouse?.IsDefault}
                />
                <Typography.Text type="secondary" style={{ fontSize: 11 }}>
                  Only one warehouse can be default. Turning this on will demote
                  the current default automatically.
                </Typography.Text>
              </Flex>
            )}
          />
        </div>

        {showDefaultWarning && (
          <Alert
            type="warning"
            showIcon
            message="Cannot unset the default"
            description="You cannot turn off the default flag unless another warehouse is already promoted to default. Save will fail otherwise."
            style={{ marginTop: 8 }}
          />
        )}
      </form>
    </Drawer>
  );
}