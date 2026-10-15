import { useEffect } from 'react';
import {
  Drawer,
  Input,
  Select,
  Switch,
  Button,
  Flex,
  Grid,
  Typography,
  App,
} from 'antd';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  useCreateTerminal,
  useUpdateTerminal,
} from '@/hooks/queries/useTerminals';
import { useWarehousesLookup } from '@/hooks/queries/useLookups';
import { getErrorMessage } from '@/lib/api';
import type { TerminalRow } from '@/types/terminal';

const { useBreakpoint } = Grid;

const schema = z.object({
  Name: z.string().min(1, 'Required').max(100),
  Code: z
    .string()
    .min(1, 'Required')
    .max(20)
    .regex(/^[A-Z0-9-]+$/, 'Uppercase letters, digits, and hyphens only'),
  WarehouseId: z.string().uuid('Pick a warehouse'),
  IsActive: z.boolean(),
});

type Form = z.infer<typeof schema>;

interface Props {
  open: boolean;
  terminal?: TerminalRow | null;
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

function buildDefaults(t?: TerminalRow | null): Form {
  if (!t) {
    return { Name: '', Code: '', WarehouseId: '', IsActive: true };
  }
  return {
    Name: t.Name,
    Code: t.Code,
    WarehouseId: t.WarehouseId,
    IsActive: t.IsActive,
  };
}

export function TerminalFormDrawer({ open, terminal, onClose }: Props) {
  const { message } = App.useApp();
  const screens = useBreakpoint();
  const isMobile = !screens.md;
  const isEdit = !!terminal;

  const { data: warehouses = [], isLoading: whLoading } = useWarehousesLookup();
  const createMutation = useCreateTerminal();
  const updateMutation = useUpdateTerminal(terminal?.Id ?? '');

  const {
    control,
    handleSubmit,
    reset,
    formState: { isSubmitting },
  } = useForm<Form>({
    resolver: zodResolver(schema),
    defaultValues: buildDefaults(terminal),
    mode: 'onTouched',
  });

  useEffect(() => {
    if (open) reset(buildDefaults(terminal));
  }, [open, terminal, reset]);

  const submitting =
    isSubmitting || createMutation.isPending || updateMutation.isPending;

  const onSubmit = async (values: Form) => {
    const payload = {
      Name: values.Name,
      Code: values.Code.trim(),
      WarehouseId: values.WarehouseId,
      IsActive: values.IsActive,
    };
    try {
      if (isEdit && terminal) {
        await updateMutation.mutateAsync(payload);
        message.success('Terminal updated');
      } else {
        await createMutation.mutateAsync(payload);
        message.success('Terminal created');
      }
      onClose();
    } catch (err) {
      message.error(getErrorMessage(err));
    }
  };

  const warehouseOptions = warehouses
    // Guard against binding to inactive warehouses — the backend rejects
    // it anyway, but filtering here keeps the UI honest.
    .filter((w) => w.IsActive !== false)
    .map((w) => ({
      label: w.Code ? `${w.Name} (${w.Code})` : w.Name,
      value: w.Id,
    }));

  return (
    <Drawer
      title={isEdit ? 'Edit terminal' : 'New terminal'}
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
            {isEdit ? 'Save changes' : 'Create terminal'}
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
                  placeholder="e.g. Main Terminal"
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
                  onChange={(e) =>
                    field.onChange(
                      e.target.value.toUpperCase().replace(/[^A-Z0-9-]/g, ''),
                    )
                  }
                  placeholder="e.g. MAIN-01"
                  maxLength={20}
                  status={fieldState.error ? 'error' : undefined}
                />
                <div style={ERR_STYLE}>{fieldState.error?.message ?? ''}</div>
                <Typography.Text type="secondary" style={{ fontSize: 11 }}>
                  Prefix for invoice numbering. Unique, cannot be reused after
                  deletion. Uppercase letters, digits, hyphens only.
                </Typography.Text>
              </>
            )}
          />
        </div>

        <div style={{ marginBottom: 12 }}>
          <label style={LABEL_STYLE}>Warehouse *</label>
          <Controller
            name="WarehouseId"
            control={control}
            render={({ field, fieldState }) => (
              <>
                <Select
                  value={field.value || undefined}
                  onChange={(v) => field.onChange(v ?? '')}
                  loading={whLoading}
                  placeholder="Pick a warehouse"
                  options={warehouseOptions}
                  showSearch
                  optionFilterProp="label"
                  style={{ width: '100%' }}
                  status={fieldState.error ? 'error' : undefined}
                />
                <div style={ERR_STYLE}>{fieldState.error?.message ?? ''}</div>
                <Typography.Text type="secondary" style={{ fontSize: 11 }}>
                  Sales from this terminal pull stock from the bound warehouse.
                </Typography.Text>
              </>
            )}
          />
        </div>

        <div style={{ marginBottom: 12 }}>
          <label style={LABEL_STYLE}>Active</label>
          <Controller
            name="IsActive"
            control={control}
            render={({ field }) => (
              <Switch checked={field.value} onChange={field.onChange} />
            )}
          />
        </div>
      </form>
    </Drawer>
  );
}