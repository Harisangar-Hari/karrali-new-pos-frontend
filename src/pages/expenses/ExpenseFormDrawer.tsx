import { useEffect, useState } from 'react';
import {
  Drawer,
  Input,
  InputNumber,
  DatePicker,
  Segmented,
  Button,
  Flex,
  Grid,
  Typography,
  App,
  Alert,
  Select,
  Tooltip,
} from 'antd';
import { Plus } from 'lucide-react';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import dayjs, { type Dayjs } from 'dayjs';
import {
  useCreateExpense,
  useUpdateExpense,
} from '@/hooks/queries/useExpenses';
import {
  useBankAccountsLookup,
  useExpenseCategoriesLookup,
} from '@/hooks/queries/useExpenseLookups';
import { useMyOpenSession } from '@/hooks/queries/useCashSession';
import { NoOpenSessionWarning } from '@/components/NoOpenSessionWarning';
import { CreateExpenseCategoryModal } from './CreateExpenseCategoryModal';
import { getErrorMessage } from '@/lib/api';
import type { ExpensePaymentMethod, ExpenseRow } from '@/types/expense';

const { useBreakpoint } = Grid;

const schema = z
  .object({
    CategoryId: z.string().uuid('Pick a category'),
    Amount: z.number({ required_error: 'Required' }).positive('Must be > 0'),
    Method: z.enum(['CASH', 'BANK']),
    BankAccountId: z.string().uuid().nullable().optional().or(z.literal('')),
    Description: z.string().min(1, 'Required').max(500),
    Payee: z.string().max(200).optional().or(z.literal('')),
    PaidAt: z.custom<Dayjs>((v) => dayjs.isDayjs(v), 'Required'),
    Notes: z.string().max(1000).optional().or(z.literal('')),
  })
  .superRefine((values, ctx) => {
    if (values.Method === 'BANK' && !values.BankAccountId) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Pick a bank account',
        path: ['BankAccountId'],
      });
    }
  });

type Form = z.infer<typeof schema>;

interface Props {
  open: boolean;
  expense?: ExpenseRow | null;
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

function buildDefaults(expense?: ExpenseRow | null): Form {
  if (!expense) {
    return {
      CategoryId: '',
      Amount: undefined as unknown as number,
      Method: 'CASH',
      BankAccountId: '',
      Description: '',
      Payee: '',
      PaidAt: dayjs(),
      Notes: '',
    };
  }
  return {
    CategoryId: expense.CategoryId,
    Amount: Number(expense.Amount),
    Method: expense.Method,
    BankAccountId: expense.BankAccountId ?? '',
    Description: expense.Description,
    Payee: expense.Payee ?? '',
    PaidAt: dayjs(expense.PaidAt),
    Notes: expense.Notes ?? '',
  };
}

export function ExpenseFormDrawer({ open, expense, onClose }: Props) {
  const { message } = App.useApp();
  const screens = useBreakpoint();
  const isMobile = !screens.md;
  const isEdit = !!expense;

  const { data: categories = [], isLoading: catLoading } =
    useExpenseCategoriesLookup();
  const { data: bankAccounts = [], isLoading: bankLoading } =
    useBankAccountsLookup();
  const { data: openSession, isLoading: sessionLoading } = useMyOpenSession();
  const hasSession = !!openSession;

  const createMutation = useCreateExpense();
  const updateMutation = useUpdateExpense(expense?.Id ?? '');

  const [method, setMethod] = useState<ExpensePaymentMethod>('CASH');
  const [newCategoryOpen, setNewCategoryOpen] = useState(false);

  const {
    control,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { isSubmitting },
  } = useForm<Form>({
    resolver: zodResolver(schema),
    defaultValues: buildDefaults(expense),
    mode: 'onTouched',
  });

  useEffect(() => {
    if (open) {
      const defaults = buildDefaults(expense);
      reset(defaults);
      setMethod(defaults.Method);
    }
  }, [open, expense, reset]);

  const watchedMethod = watch('Method');
  useEffect(() => {
    setMethod(watchedMethod);
    if (watchedMethod === 'CASH') {
      setValue('BankAccountId', '');
    }
  }, [watchedMethod, setValue]);

  const submitting =
    isSubmitting || createMutation.isPending || updateMutation.isPending;

  // Only block CASH creates when there's no open drawer. Bank expenses
  // and edits (which only touch description/payee/notes) never touch the
  // cash ledger, so they're exempt.
  const needsOpenSession = !isEdit && method === 'CASH';
  const blockedBySession = needsOpenSession && !sessionLoading && !hasSession;
  const canSubmit = !submitting && !blockedBySession;

  const onSubmit = async (values: Form) => {
    if (needsOpenSession && !hasSession) {
      message.error(
        'Open a cash drawer before recording a cash expense, or switch method to Bank.',
      );
      return;
    }
    try {
      if (isEdit && expense) {
        // Edit — only Description, Payee, Notes are sent.
        await updateMutation.mutateAsync({
          Description: values.Description,
          Payee: values.Payee || undefined,
          Notes: values.Notes || undefined,
        });
        message.success('Expense updated');
      } else {
        await createMutation.mutateAsync({
          CategoryId: values.CategoryId,
          Amount: values.Amount,
          Method: values.Method,
          BankAccountId:
            values.Method === 'BANK'
              ? values.BankAccountId || undefined
              : undefined,
          Description: values.Description,
          Payee: values.Payee || undefined,
          PaidAt: values.PaidAt.toISOString(),
          Notes: values.Notes || undefined,
        });
        message.success('Expense recorded');
      }
      onClose();
    } catch (err) {
      message.error(getErrorMessage(err));
    }
  };

  return (
    <>
      <Drawer
        title={isEdit ? `Edit expense ${expense?.Code ?? ''}` : 'Record expense'}
        open={open}
        onClose={submitting ? undefined : onClose}
        width={isMobile ? '100%' : 480}
        destroyOnClose
        maskClosable={!submitting}
        extra={
          <Flex gap={8}>
            <Button onClick={onClose} disabled={submitting}>
              Cancel
            </Button>
            <Tooltip
              title={
                blockedBySession
                  ? 'Open a cash drawer first, or switch method to Bank'
                  : undefined
              }
            >
              <Button
                type="primary"
                loading={submitting}
                disabled={!canSubmit}
                onClick={handleSubmit(onSubmit)}
              >
                {isEdit ? 'Save changes' : 'Record expense'}
              </Button>
            </Tooltip>
          </Flex>
        }
      >
        {isEdit && (
          <Alert
            type="info"
            showIcon
            message="Only description, payee, and notes can change"
            description="Amount, category, method, bank account, and paid date are frozen. To correct a mistake, delete and re-enter."
            style={{ marginBottom: 16 }}
          />
        )}

        {blockedBySession && (
          <NoOpenSessionWarning context="Recording a cash expense" />
        )}

        <form onSubmit={handleSubmit(onSubmit)} noValidate>
          {/* Category */}
          <div style={{ marginBottom: 12 }}>
            <Flex
              justify="space-between"
              align="center"
              style={{ marginBottom: 4 }}
            >
              <label style={{ ...LABEL_STYLE, marginBottom: 0 }}>
                Category *
              </label>
              {!isEdit && (
                <Button
                  type="link"
                  size="small"
                  icon={<Plus size={12} />}
                  onClick={() => setNewCategoryOpen(true)}
                  style={{ padding: 0, height: 'auto', fontSize: 12 }}
                >
                  New category
                </Button>
              )}
            </Flex>
            <Controller
              name="CategoryId"
              control={control}
              render={({ field, fieldState }) => (
                <>
                  <Select
                    value={field.value || undefined}
                    onChange={(v) => field.onChange(v ?? '')}
                    loading={catLoading}
                    placeholder="Pick a category"
                    options={categories.map((c) => ({
                      label: c.Name,
                      value: c.Id,
                    }))}
                    showSearch
                    optionFilterProp="label"
                    style={{ width: '100%' }}
                    disabled={isEdit}
                    status={fieldState.error ? 'error' : undefined}
                  />
                  <div style={ERR_STYLE}>
                    {fieldState.error?.message ?? ''}
                  </div>
                </>
              )}
            />
          </div>

          <Flex gap={12} wrap="wrap">
            <div style={{ flex: 1, minWidth: 160 }}>
              <label style={LABEL_STYLE}>Amount *</label>
              <Controller
                name="Amount"
                control={control}
                render={({ field, fieldState }) => (
                  <>
                    <InputNumber
                      value={field.value ?? undefined}
                      onChange={(v) =>
                        field.onChange(v === null ? undefined : Number(v))
                      }
                      min={0.0001}
                      precision={4}
                      step={100}
                      style={{ width: '100%' }}
                      status={fieldState.error ? 'error' : undefined}
                      disabled={isEdit}
                    />
                    <div style={ERR_STYLE}>
                      {fieldState.error?.message ?? ''}
                    </div>
                  </>
                )}
              />
            </div>
            <div style={{ flex: 1, minWidth: 160 }}>
              <label style={LABEL_STYLE}>Paid at *</label>
              <Controller
                name="PaidAt"
                control={control}
                render={({ field, fieldState }) => (
                  <>
                    <DatePicker
                      showTime
                      value={field.value ?? null}
                      onChange={(d) => field.onChange(d ?? null)}
                      style={{ width: '100%' }}
                      status={fieldState.error ? 'error' : undefined}
                      disabled={isEdit}
                    />
                    <div style={ERR_STYLE}>
                      {fieldState.error?.message ?? ''}
                    </div>
                  </>
                )}
              />
            </div>
          </Flex>

          {/* Method */}
          <div style={{ marginBottom: 12, marginTop: 12 }}>
            <label style={LABEL_STYLE}>Payment method *</label>
            <Controller
              name="Method"
              control={control}
              render={({ field }) => (
                <Segmented
                  value={field.value}
                  onChange={(v) => field.onChange(v)}
                  options={[
                    { label: 'Cash', value: 'CASH' },
                    { label: 'Bank', value: 'BANK' },
                  ]}
                  block
                  disabled={isEdit}
                />
              )}
            />
            <Typography.Text
              type="secondary"
              style={{ fontSize: 11, display: 'block', marginTop: 4 }}
            >
              {method === 'CASH'
                ? 'Drawer loses cash — writes a negative CashLedger entry.'
                : 'No cash drawer effect. Requires a bank account.'}
            </Typography.Text>
          </div>

          {/* Bank account — BANK only */}
          {method === 'BANK' && (
            <div style={{ marginBottom: 12 }}>
              <label style={LABEL_STYLE}>Bank account *</label>
              <Controller
                name="BankAccountId"
                control={control}
                render={({ field, fieldState }) => (
                  <>
                    <Select
                      value={field.value || undefined}
                      onChange={(v) => field.onChange(v ?? '')}
                      loading={bankLoading}
                      placeholder="Pick a bank account"
                      options={bankAccounts.map((a) => ({
                        label: a.Code ? `${a.Name} (${a.Code})` : a.Name,
                        value: a.Id,
                      }))}
                      showSearch
                      optionFilterProp="label"
                      style={{ width: '100%' }}
                      disabled={isEdit}
                      status={fieldState.error ? 'error' : undefined}
                    />
                    <div style={ERR_STYLE}>
                      {fieldState.error?.message ?? ''}
                    </div>
                  </>
                )}
              />
            </div>
          )}

          {/* Description */}
          <div style={{ marginBottom: 12 }}>
            <label style={LABEL_STYLE}>Description *</label>
            <Controller
              name="Description"
              control={control}
              render={({ field, fieldState }) => (
                <>
                  <Input.TextArea
                    {...field}
                    rows={2}
                    maxLength={500}
                    showCount
                    placeholder="e.g. October electricity bill"
                    status={fieldState.error ? 'error' : undefined}
                  />
                  <div style={ERR_STYLE}>
                    {fieldState.error?.message ?? ''}
                  </div>
                </>
              )}
            />
          </div>

          {/* Payee */}
          <div style={{ marginBottom: 12 }}>
            <label style={LABEL_STYLE}>Payee</label>
            <Controller
              name="Payee"
              control={control}
              render={({ field }) => (
                <Input
                  {...field}
                  value={field.value ?? ''}
                  maxLength={200}
                  placeholder="e.g. Ceylon Electricity Board"
                />
              )}
            />
          </div>

          {/* Notes */}
          <div style={{ marginBottom: 12 }}>
            <label style={LABEL_STYLE}>Notes</label>
            <Controller
              name="Notes"
              control={control}
              render={({ field }) => (
                <Input.TextArea
                  {...field}
                  value={field.value ?? ''}
                  rows={3}
                  maxLength={1000}
                  showCount
                  placeholder="Optional"
                />
              )}
            />
          </div>
        </form>
      </Drawer>

      <CreateExpenseCategoryModal
        open={newCategoryOpen}
        onClose={() => setNewCategoryOpen(false)}
        onCreated={(created) => {
          setValue('CategoryId', created.Id, { shouldValidate: true });
        }}
      />
    </>
  );
}