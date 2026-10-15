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
    Skeleton,
} from 'antd';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import dayjs, { type Dayjs } from 'dayjs';
import { useCreateCreditPayment } from '@/hooks/queries/useCreditPayments';
import { useCustomer } from '@/hooks/queries/useCustomers';
import { getErrorMessage } from '@/lib/api';
import { formatMoney } from '@/lib/format';
import type { CreditPaymentMethod } from '@/types/creditPayment';

const { useBreakpoint } = Grid;

const schema = z
    .object({
        Method: z.enum(['CASH', 'CHEQUE']),
        Amount: z.number({ required_error: 'Required' }).positive('Must be > 0'),
        PaidAt: z.custom<Dayjs>().nullable().optional(),
        ChequeNumber: z.string().max(32).optional().or(z.literal('')),
        BankName: z.string().max(100).optional().or(z.literal('')),
        BankBranch: z.string().max(100).optional().or(z.literal('')),
        ChequeIssueDate: z.custom<Dayjs>().nullable().optional(),
        ChequeDueDate: z.custom<Dayjs>().nullable().optional(),
        Notes: z.string().max(1000).optional().or(z.literal('')),
    })
    .superRefine((values, ctx) => {
        if (values.Method === 'CHEQUE') {
            if (!values.ChequeNumber) {
                ctx.addIssue({
                    code: z.ZodIssueCode.custom,
                    message: 'Required for cheque',
                    path: ['ChequeNumber'],
                });
            }
            if (!values.ChequeIssueDate) {
                ctx.addIssue({
                    code: z.ZodIssueCode.custom,
                    message: 'Required for cheque',
                    path: ['ChequeIssueDate'],
                });
            }
            if (!values.ChequeDueDate) {
                ctx.addIssue({
                    code: z.ZodIssueCode.custom,
                    message: 'Required for cheque',
                    path: ['ChequeDueDate'],
                });
            }
        }
    });

type Form = z.infer<typeof schema>;

interface Props {
    open: boolean;
    customerId: string | null;
    onClose: () => void;
    onSuccess?: () => void;
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

export function CreateCreditPaymentDrawer({
    open,
    customerId,
    onClose,
    onSuccess,
}: Props) {
    const { message } = App.useApp();
    const screens = useBreakpoint();
    const isMobile = !screens.md;

    const { data: customer, isLoading: custLoading } = useCustomer(
        open ? customerId : null,
    );
    const createMutation = useCreateCreditPayment();

    const [method, setMethod] = useState<CreditPaymentMethod>('CASH');

    const {
        control,
        handleSubmit,
        reset,
        watch,
        setValue,
        formState: { isSubmitting },
    } = useForm<Form>({
        resolver: zodResolver(schema),
        defaultValues: {
            Method: 'CASH',
            Amount: undefined as unknown as number,
            PaidAt: dayjs(),
            ChequeNumber: '',
            BankName: '',
            BankBranch: '',
            ChequeIssueDate: null,
            ChequeDueDate: null,
            Notes: '',
        },
        mode: 'onTouched',
    });

    useEffect(() => {
        if (open) {
            reset({
                Method: 'CASH',
                Amount: undefined as unknown as number,
                PaidAt: dayjs(),
                ChequeNumber: '',
                BankName: '',
                BankBranch: '',
                ChequeIssueDate: null,
                ChequeDueDate: null,
                Notes: '',
            });
            setMethod('CASH');
        }
    }, [open, reset]);

    // Keep the form's Method in sync with the Segmented toggle so the
    // superRefine kicks in.
    const watchedMethod = watch('Method');
    useEffect(() => {
        setMethod(watchedMethod);
    }, [watchedMethod]);

    const submitting = isSubmitting || createMutation.isPending;

    const onSubmit = async (values: Form) => {
        if (!customer) return;
        try {
            await createMutation.mutateAsync({
                CustomerId: customer.Id,
                Method: values.Method,
                Amount: values.Amount,
                PaidAt: values.PaidAt ? values.PaidAt.toISOString() : undefined,
                ChequeNumber:
                    values.Method === 'CHEQUE' ? values.ChequeNumber || undefined : undefined,
                BankName:
                    values.Method === 'CHEQUE' ? values.BankName || undefined : undefined,
                BankBranch:
                    values.Method === 'CHEQUE' ? values.BankBranch || undefined : undefined,
                ChequeIssueDate:
                    values.Method === 'CHEQUE' && values.ChequeIssueDate
                        ? values.ChequeIssueDate.toISOString()
                        : undefined,
                ChequeDueDate:
                    values.Method === 'CHEQUE' && values.ChequeDueDate
                        ? values.ChequeDueDate.toISOString()
                        : undefined,
                Notes: values.Notes || undefined,
            });
            message.success('Payment recorded');
            onSuccess?.();
            onClose();
        } catch (err) {
            message.error(getErrorMessage(err));
        }
    };

    const currentBalance = customer ? Number(customer.Balance) : 0;

    return (
        <Drawer
            title="Record credit payment"
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
                    <Button
                        type="primary"
                        loading={submitting}
                        disabled={!customer}
                        onClick={handleSubmit(onSubmit)}
                    >
                        Record payment
                    </Button>
                </Flex>
            }
        >
            {custLoading || !customer ? (
                <Skeleton active paragraph={{ rows: 6 }} />
            ) : (
                <form onSubmit={handleSubmit(onSubmit)} noValidate>
                    {/* Customer context */}
                    <Flex
                        vertical
                        gap={2}
                        style={{
                            padding: 12,
                            background: '#f0fdfa',
                            border: '1px solid #99f6e4',
                            borderRadius: 6,
                            marginBottom: 16,
                        }}
                    >
                        <Typography.Text strong>{customer.Name}</Typography.Text>
                        <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                            {customer.Code}
                            {customer.Phone ? ` · ${customer.Phone}` : ''}
                        </Typography.Text>
                        <Flex justify="space-between" style={{ marginTop: 6 }}>
                            <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                                Outstanding balance
                            </Typography.Text>
                            <Typography.Text
                                strong
                                style={{
                                    color: currentBalance > 0 ? '#dc2626' : '#16a34a',
                                }}
                            >
                                {formatMoney(customer.Balance)}
                            </Typography.Text>
                        </Flex>
                    </Flex>

                    {currentBalance <= 0 && (
                        <Alert
                            type="info"
                            showIcon
                            message="No outstanding balance"
                            description="This customer has nothing owing. Recording a payment will push their balance into negative (store credit)."
                            style={{ marginBottom: 12 }}
                        />
                    )}

                    {/* Method */}
                    <div style={{ marginBottom: 12 }}>
                        <label style={LABEL_STYLE}>Method</label>
                        <Controller
                            name="Method"
                            control={control}
                            render={({ field }) => (
                                <Segmented
                                    value={field.value}
                                    onChange={(v) => field.onChange(v)}
                                    options={[
                                        { label: 'Cash', value: 'CASH' },
                                        { label: 'Cheque', value: 'CHEQUE' },
                                    ]}
                                    block
                                />
                            )}
                        />
                    </div>

                    {/* Amount */}
                    <div style={{ marginBottom: 12 }}>
                        <label style={LABEL_STYLE}>Amount *</label>
                        <Controller
                            name="Amount"
                            control={control}
                            render={({ field, fieldState }) => (
                                <>
                                    <InputNumber
                                        value={field.value ?? undefined}
                                        onChange={(v) => field.onChange(v === null ? undefined : Number(v))}
                                        min={0.0001}
                                        precision={4}
                                        step={100}
                                        size="large"
                                        style={{ width: '100%' }}
                                        status={fieldState.error ? 'error' : undefined}
                                        placeholder="0.0000"
                                    />
                                    <div style={ERR_STYLE}>{fieldState.error?.message ?? ''}</div>
                                </>
                            )}
                        />
                        {currentBalance > 0 && (
                            <Button
                                size="small"
                                type="link"
                                style={{ padding: 0, fontSize: 12 }}
                                onClick={() => setValue('Amount', currentBalance)}
                            >
                                Pay full balance ({formatMoney(customer.Balance)})
                            </Button>
                        )}
                    </div>

                    {/* Date */}
                    <div style={{ marginBottom: 12 }}>
                        <label style={LABEL_STYLE}>Paid at</label>
                        <Controller
                            name="PaidAt"
                            control={control}
                            render={({ field }) => (
                                <DatePicker
                                    showTime
                                    value={field.value ?? null}
                                    onChange={(d) => field.onChange(d ?? null)}
                                    style={{ width: '100%' }}
                                />
                            )}
                        />
                    </div>

                    {method === 'CHEQUE' && (
                        <>
                            <Typography.Text
                                strong
                                style={{ display: 'block', marginTop: 4, marginBottom: 8 }}
                            >
                                Cheque details
                            </Typography.Text>

                            <div style={{ marginBottom: 12 }}>
                                <label style={LABEL_STYLE}>Cheque number *</label>
                                <Controller
                                    name="ChequeNumber"
                                    control={control}
                                    render={({ field, fieldState }) => (
                                        <>
                                            <Input
                                                {...field}
                                                value={field.value ?? ''}
                                                maxLength={32}
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
                                <div style={{ flex: 1, minWidth: 140 }}>
                                    <label style={LABEL_STYLE}>Bank</label>
                                    <Controller
                                        name="BankName"
                                        control={control}
                                        render={({ field }) => (
                                            <Input {...field} value={field.value ?? ''} maxLength={100} />
                                        )}
                                    />
                                </div>
                                <div style={{ flex: 1, minWidth: 140 }}>
                                    <label style={LABEL_STYLE}>Branch</label>
                                    <Controller
                                        name="BankBranch"
                                        control={control}
                                        render={({ field }) => (
                                            <Input {...field} value={field.value ?? ''} maxLength={100} />
                                        )}
                                    />
                                </div>
                            </Flex>

                            <Flex gap={12} wrap="wrap" style={{ marginTop: 12 }}>
                                <div style={{ flex: 1, minWidth: 140 }}>
                                    <label style={LABEL_STYLE}>Issue date *</label>
                                    <Controller
                                        name="ChequeIssueDate"
                                        control={control}
                                        render={({ field, fieldState }) => (
                                            <>
                                                <DatePicker
                                                    value={field.value ?? null}
                                                    onChange={(d) => field.onChange(d ?? null)}
                                                    style={{ width: '100%' }}
                                                    status={fieldState.error ? 'error' : undefined}
                                                />
                                                <div style={ERR_STYLE}>
                                                    {fieldState.error?.message ?? ''}
                                                </div>
                                            </>
                                        )}
                                    />
                                </div>
                                <div style={{ flex: 1, minWidth: 140 }}>
                                    <label style={LABEL_STYLE}>Due date *</label>
                                    <Controller
                                        name="ChequeDueDate"
                                        control={control}
                                        render={({ field, fieldState }) => (
                                            <>
                                                <DatePicker
                                                    value={field.value ?? null}
                                                    onChange={(d) => field.onChange(d ?? null)}
                                                    style={{ width: '100%' }}
                                                    status={fieldState.error ? 'error' : undefined}
                                                />
                                                <div style={ERR_STYLE}>
                                                    {fieldState.error?.message ?? ''}
                                                </div>
                                            </>
                                        )}
                                    />
                                </div>
                            </Flex>
                        </>
                    )}

                    <div style={{ marginTop: 12 }}>
                        <label style={LABEL_STYLE}>Notes</label>
                        <Controller
                            name="Notes"
                            control={control}
                            render={({ field }) => (
                                <Input.TextArea
                                    {...field}
                                    value={field.value ?? ''}
                                    rows={2}
                                    maxLength={1000}
                                    showCount
                                />
                            )}
                        />
                    </div>
                </form>
            )}
        </Drawer>
    );
}