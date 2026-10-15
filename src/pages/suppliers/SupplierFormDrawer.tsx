import { useEffect } from 'react';
import {
  Drawer,
  Input,
  Switch,
  Button,
  Flex,
  Grid,
  Divider,
  Typography,
  App,
} from 'antd';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  useCreateSupplier,
  useUpdateSupplier,
} from '@/hooks/queries/useSuppliers';
import { getErrorMessage } from '@/lib/api';
import type { SupplierRow } from '@/types/supplier';

const { useBreakpoint } = Grid;

const schema = z.object({
  Name: z.string().min(1, 'Required').max(200),
  Phone: z.string().max(32).optional().or(z.literal('')),
  Email: z.union([z.string().email('Invalid email'), z.literal('')]).optional(),
  Address: z.string().max(500).optional().or(z.literal('')),
  TaxNumber: z.string().max(64).optional().or(z.literal('')),
  PaymentTerms: z.string().max(100).optional().or(z.literal('')),
  BankName: z.string().max(100).optional().or(z.literal('')),
  BankAccountNo: z.string().max(50).optional().or(z.literal('')),
  BankBranch: z.string().max(100).optional().or(z.literal('')),
  BankSwift: z.string().max(20).optional().or(z.literal('')),
  Notes: z.string().max(2000).optional().or(z.literal('')),
  IsActive: z.boolean(),
});

type Form = z.infer<typeof schema>;

interface Props {
  open: boolean;
  supplier?: SupplierRow | null;
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

function buildDefaults(s?: SupplierRow | null): Form {
  if (!s) {
    return {
      Name: '',
      Phone: '',
      Email: '',
      Address: '',
      TaxNumber: '',
      PaymentTerms: '',
      BankName: '',
      BankAccountNo: '',
      BankBranch: '',
      BankSwift: '',
      Notes: '',
      IsActive: true,
    };
  }
  return {
    Name: s.Name,
    Phone: s.Phone ?? '',
    Email: s.Email ?? '',
    Address: s.Address ?? '',
    TaxNumber: s.TaxNumber ?? '',
    PaymentTerms: s.PaymentTerms ?? '',
    BankName: s.BankName ?? '',
    BankAccountNo: s.BankAccountNo ?? '',
    BankBranch: s.BankBranch ?? '',
    BankSwift: s.BankSwift ?? '',
    Notes: s.Notes ?? '',
    IsActive: s.IsActive,
  };
}

export function SupplierFormDrawer({ open, supplier, onClose }: Props) {
  const { message } = App.useApp();
  const screens = useBreakpoint();
  const isMobile = !screens.md;
  const isEdit = !!supplier;

  const createMutation = useCreateSupplier();
  const updateMutation = useUpdateSupplier(supplier?.Id ?? '');

  const {
    control,
    handleSubmit,
    reset,
    formState: { isSubmitting },
  } = useForm<Form>({
    resolver: zodResolver(schema),
    defaultValues: buildDefaults(supplier),
    mode: 'onTouched',
  });

  useEffect(() => {
    if (open) reset(buildDefaults(supplier));
  }, [open, supplier, reset]);

  const submitting =
    isSubmitting || createMutation.isPending || updateMutation.isPending;

  const onSubmit = async (values: Form) => {
    const payload = {
      Name: values.Name,
      Phone: values.Phone || null,
      Email: values.Email || null,
      Address: values.Address || undefined,
      TaxNumber: values.TaxNumber || undefined,
      PaymentTerms: values.PaymentTerms || undefined,
      BankName: values.BankName || undefined,
      BankAccountNo: values.BankAccountNo || undefined,
      BankBranch: values.BankBranch || undefined,
      BankSwift: values.BankSwift || undefined,
      Notes: values.Notes || undefined,
      IsActive: values.IsActive,
    };

    try {
      if (isEdit && supplier) {
        await updateMutation.mutateAsync(payload);
        message.success('Supplier updated');
      } else {
        await createMutation.mutateAsync(payload);
        message.success('Supplier created');
      }
      onClose();
    } catch (err) {
      message.error(getErrorMessage(err));
    }
  };

  return (
    <Drawer
      title={isEdit ? 'Edit supplier' : 'New supplier'}
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
            onClick={handleSubmit(onSubmit)}
          >
            {isEdit ? 'Save changes' : 'Create supplier'}
          </Button>
        </Flex>
      }
    >
      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        {isEdit && supplier && (
          <Typography.Paragraph type="secondary" style={{ fontSize: 12 }}>
            Code <strong>{supplier.Code}</strong>
          </Typography.Paragraph>
        )}

        <Divider orientation="left" plain>
          Basics
        </Divider>

        <Field label="Name *">
          <Controller
            name="Name"
            control={control}
            render={({ field, fieldState }) => (
              <>
                <Input
                  {...field}
                  placeholder="e.g. Ceylon Beverages (Pvt) Ltd"
                  status={fieldState.error ? 'error' : undefined}
                  autoFocus
                />
                <div style={ERR_STYLE}>{fieldState.error?.message ?? ''}</div>
              </>
            )}
          />
        </Field>

        <Flex gap={12} wrap="wrap">
          <div style={{ flex: 1, minWidth: 200 }}>
            <Field label="Phone">
              <Controller
                name="Phone"
                control={control}
                render={({ field, fieldState }) => (
                  <>
                    <Input
                      {...field}
                      value={field.value ?? ''}
                      placeholder="0112345678"
                      status={fieldState.error ? 'error' : undefined}
                    />
                    <div style={ERR_STYLE}>{fieldState.error?.message ?? ''}</div>
                  </>
                )}
              />
            </Field>
          </div>
          <div style={{ flex: 1, minWidth: 200 }}>
            <Field label="Email">
              <Controller
                name="Email"
                control={control}
                render={({ field, fieldState }) => (
                  <>
                    <Input
                      {...field}
                      value={field.value ?? ''}
                      placeholder="orders@example.lk"
                      status={fieldState.error ? 'error' : undefined}
                    />
                    <div style={ERR_STYLE}>{fieldState.error?.message ?? ''}</div>
                  </>
                )}
              />
            </Field>
          </div>
        </Flex>

        <Field label="Address">
          <Controller
            name="Address"
            control={control}
            render={({ field }) => (
              <Input.TextArea
                {...field}
                value={field.value ?? ''}
                rows={2}
                maxLength={500}
              />
            )}
          />
        </Field>

        <Flex gap={12} wrap="wrap">
          <div style={{ flex: 1, minWidth: 200 }}>
            <Field label="Tax number">
              <Controller
                name="TaxNumber"
                control={control}
                render={({ field }) => (
                  <Input
                    {...field}
                    value={field.value ?? ''}
                    placeholder="Optional"
                  />
                )}
              />
            </Field>
          </div>
          <div style={{ flex: 1, minWidth: 200 }}>
            <Field label="Payment terms">
              <Controller
                name="PaymentTerms"
                control={control}
                render={({ field }) => (
                  <Input
                    {...field}
                    value={field.value ?? ''}
                    placeholder="e.g. Net 30"
                  />
                )}
              />
            </Field>
          </div>
        </Flex>

        <Divider orientation="left" plain>
          Bank details
        </Divider>

        <Flex gap={12} wrap="wrap">
          <div style={{ flex: 1, minWidth: 200 }}>
            <Field label="Bank name">
              <Controller
                name="BankName"
                control={control}
                render={({ field }) => (
                  <Input
                    {...field}
                    value={field.value ?? ''}
                    placeholder="e.g. Commercial Bank"
                  />
                )}
              />
            </Field>
          </div>
          <div style={{ flex: 1, minWidth: 200 }}>
            <Field label="Branch">
              <Controller
                name="BankBranch"
                control={control}
                render={({ field }) => (
                  <Input
                    {...field}
                    value={field.value ?? ''}
                    placeholder="e.g. Colombo Main"
                  />
                )}
              />
            </Field>
          </div>
        </Flex>

        <Flex gap={12} wrap="wrap">
          <div style={{ flex: 1, minWidth: 200 }}>
            <Field label="Account number">
              <Controller
                name="BankAccountNo"
                control={control}
                render={({ field }) => (
                  <Input
                    {...field}
                    value={field.value ?? ''}
                    placeholder="Optional"
                  />
                )}
              />
            </Field>
          </div>
          <div style={{ flex: 1, minWidth: 200 }}>
            <Field label="SWIFT">
              <Controller
                name="BankSwift"
                control={control}
                render={({ field }) => (
                  <Input
                    {...field}
                    value={field.value ?? ''}
                    placeholder="Optional"
                    maxLength={20}
                  />
                )}
              />
            </Field>
          </div>
        </Flex>

        <Divider orientation="left" plain>
          Notes & status
        </Divider>

        <Field label="Notes">
          <Controller
            name="Notes"
            control={control}
            render={({ field }) => (
              <Input.TextArea
                {...field}
                value={field.value ?? ''}
                rows={3}
                maxLength={2000}
                showCount
              />
            )}
          />
        </Field>

        <Field label="Active">
          <Controller
            name="IsActive"
            control={control}
            render={({ field }) => (
              <Switch checked={field.value} onChange={field.onChange} />
            )}
          />
        </Field>
      </form>
    </Drawer>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div style={{ marginBottom: 12 }}>
      <label style={LABEL_STYLE}>{label}</label>
      {children}
    </div>
  );
}