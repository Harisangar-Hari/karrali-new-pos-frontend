import { useEffect } from 'react';
import {
  Drawer,
  Input,
  InputNumber,
  Select,
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
  useCreateCustomer,
  useUpdateCustomer,
} from '@/hooks/queries/useCustomers';
import { getErrorMessage } from '@/lib/api';
import {
  CUSTOMER_TYPES,
  type CustomerRow,
  type CustomerType,
} from '@/types/customer';

const { useBreakpoint } = Grid;

const schema = z.object({
  Name: z.string().min(1, 'Required').max(200),
  Type: z.enum(['RETAIL', 'WHOLESALE', 'VIP']),
  Phone: z.string().max(32).optional().or(z.literal('')),
  Email: z
    .union([z.string().email('Invalid email'), z.literal('')])
    .optional(),
  Address: z.string().max(500).optional().or(z.literal('')),
  TaxNumber: z.string().max(64).optional().or(z.literal('')),
  CreditLimit: z.number().min(0).optional(),
  PaymentTerms: z.string().max(100).optional().or(z.literal('')),
  Notes: z.string().max(2000).optional().or(z.literal('')),
  IsActive: z.boolean(),
  OpeningBalance: z.number().optional(),
});

type Form = z.infer<typeof schema>;

interface Props {
  open: boolean;
  customer?: CustomerRow | null;
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

function buildDefaults(c?: CustomerRow | null): Form {
  if (!c) {
    return {
      Name: '',
      Type: 'RETAIL',
      Phone: '',
      Email: '',
      Address: '',
      TaxNumber: '',
      CreditLimit: 0,
      PaymentTerms: '',
      Notes: '',
      IsActive: true,
      OpeningBalance: 0,
    };
  }
  return {
    Name: c.Name,
    Type: c.Type,
    Phone: c.Phone ?? '',
    Email: c.Email ?? '',
    Address: c.Address ?? '',
    TaxNumber: c.TaxNumber ?? '',
    CreditLimit: Number(c.CreditLimit),
    PaymentTerms: c.PaymentTerms ?? '',
    Notes: c.Notes ?? '',
    IsActive: c.IsActive,
    OpeningBalance: 0,
  };
}

export function CustomerFormDrawer({ open, customer, onClose }: Props) {
  const { message } = App.useApp();
  const screens = useBreakpoint();
  const isMobile = !screens.md;
  const isEdit = !!customer;

  const createMutation = useCreateCustomer();
  const updateMutation = useUpdateCustomer(customer?.Id ?? '');

  const {
    control,
    handleSubmit,
    reset,
    formState: { isSubmitting },
  } = useForm<Form>({
    resolver: zodResolver(schema),
    defaultValues: buildDefaults(customer),
    mode: 'onTouched',
  });

  useEffect(() => {
    if (open) reset(buildDefaults(customer));
  }, [open, customer, reset]);

  const submitting =
    isSubmitting || createMutation.isPending || updateMutation.isPending;

  const onSubmit = async (values: Form) => {
    const payload = {
      Name: values.Name,
      Type: values.Type,
      Phone: values.Phone || null,
      Email: values.Email || null,
      Address: values.Address || undefined,
      TaxNumber: values.TaxNumber || undefined,
      CreditLimit: values.CreditLimit ?? 0,
      PaymentTerms: values.PaymentTerms || undefined,
      Notes: values.Notes || undefined,
      IsActive: values.IsActive,
    };

    try {
      if (isEdit && customer) {
        await updateMutation.mutateAsync(payload);
        message.success('Customer updated');
      } else {
        await createMutation.mutateAsync({
          ...payload,
          OpeningBalance: values.OpeningBalance ?? 0,
        });
        message.success('Customer created');
      }
      onClose();
    } catch (err) {
      message.error(getErrorMessage(err));
    }
  };

  return (
    <Drawer
      title={isEdit ? 'Edit customer' : 'New customer'}
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
            {isEdit ? 'Save changes' : 'Create customer'}
          </Button>
        </Flex>
      }
    >
      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        {isEdit && customer && (
          <Typography.Paragraph type="secondary" style={{ fontSize: 12 }}>
            Code <strong>{customer.Code}</strong> · Balance{' '}
            <strong>{customer.Balance}</strong> (edit via Adjust balance)
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
                  placeholder="e.g. Nimal Perera"
                  status={fieldState.error ? 'error' : undefined}
                  autoFocus
                />
                <div style={ERR_STYLE}>{fieldState.error?.message ?? ''}</div>
              </>
            )}
          />
        </Field>

        <Field label="Type">
          <Controller
            name="Type"
            control={control}
            render={({ field }) => (
              <Select
                value={field.value}
                onChange={(v: CustomerType) => field.onChange(v)}
                options={CUSTOMER_TYPES.map((t) => ({ label: t, value: t }))}
                style={{ width: '100%' }}
              />
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
                      placeholder="0771234567"
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
                      placeholder="name@example.com"
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

        <Field label="Tax number">
          <Controller
            name="TaxNumber"
            control={control}
            render={({ field }) => (
              <Input {...field} value={field.value ?? ''} placeholder="Optional" />
            )}
          />
        </Field>

        <Divider orientation="left" plain>
          Credit
        </Divider>

        <Flex gap={12} wrap="wrap">
          <div style={{ flex: 1, minWidth: 160 }}>
            <Field label="Credit limit">
              <Controller
                name="CreditLimit"
                control={control}
                render={({ field }) => (
                  <InputNumber
                    value={field.value ?? 0}
                    onChange={(v) => field.onChange(v ?? 0)}
                    min={0}
                    precision={4}
                    step={100}
                    style={{ width: '100%' }}
                  />
                )}
              />
            </Field>
          </div>
          <div style={{ flex: 1, minWidth: 160 }}>
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

        <Typography.Text type="secondary" style={{ fontSize: 11 }}>
          0 credit limit means cash-only. Sales will block credit payments above
          the available amount.
        </Typography.Text>

        {!isEdit && (
          <>
            <Divider orientation="left" plain>
              Opening balance
            </Divider>
            <Field label="Opening balance">
              <Controller
                name="OpeningBalance"
                control={control}
                render={({ field }) => (
                  <InputNumber
                    value={field.value ?? 0}
                    onChange={(v) => field.onChange(v ?? 0)}
                    precision={4}
                    step={100}
                    style={{ width: '100%' }}
                    placeholder="Positive = customer owes us"
                  />
                )}
              />
            </Field>
            <Typography.Text type="secondary" style={{ fontSize: 11 }}>
              If non-zero, writes an OPENING entry to the customer ledger.
            </Typography.Text>
          </>
        )}

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