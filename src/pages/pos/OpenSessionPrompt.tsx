import { useEffect } from 'react';
import {
    Button,
    Card,
    Col,
    Flex,
    Grid,
    Input,
    InputNumber,
    Row,
    Select,
    Typography,
    App,
} from 'antd';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Wallet } from 'lucide-react';
import { useOpenCashSession } from '@/hooks/queries/useCashSession';
import { useTerminalsLookup } from '@/hooks/queries/useTerminalsLookup';
import { getErrorMessage } from '@/lib/api';

const { useBreakpoint } = Grid;

const schema = z.object({
    TerminalId: z.string().uuid('Pick a terminal'),
    StartingCash: z.number({ required_error: 'Required' }).min(0),
    Notes: z.string().max(500).optional().or(z.literal('')),
});

type Form = z.infer<typeof schema>;

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

export function OpenSessionPrompt() {
    const { message } = App.useApp();
    const screens = useBreakpoint();
    const isMobile = !screens.md;
    const { data: terminals = [], isLoading } = useTerminalsLookup();
    const mutation = useOpenCashSession();

    const {
        control,
        handleSubmit,
        setValue,
        formState: { isSubmitting },
    } = useForm<Form>({
        resolver: zodResolver(schema),
        defaultValues: { TerminalId: '', StartingCash: 0, Notes: '' },
        mode: 'onTouched',
    });

    // Auto-select when there's exactly one terminal.
    useEffect(() => {
        const only = terminals[0];
        if (terminals.length === 1 && only) {
            setValue('TerminalId', only.Id);
        }
    }, [terminals, setValue]);

    const onSubmit = async (values: Form) => {
        try {
            await mutation.mutateAsync({
                TerminalId: values.TerminalId,
                StartingCash: values.StartingCash,
                Notes: values.Notes || undefined,
            });
            message.success('Cash drawer opened');
        } catch (err) {
            message.error(getErrorMessage(err));
        }
    };

    const submitting = isSubmitting || mutation.isPending;

    return (
        <Flex align="center" justify="center" style={{ minHeight: '60vh', padding: 16 }}>
            <Card style={{ width: '100%', maxWidth: 480 }}>
                <Flex vertical gap={4} align="center" style={{ marginBottom: 24 }}>
                    <Wallet size={40} color="#0d9488" />
                    <Typography.Title level={3} style={{ margin: '8px 0 0' }}>
                        Open cash drawer
                    </Typography.Title>
                    <Typography.Text type="secondary" style={{ textAlign: 'center' }}>
                        You need an open session before you can record sales.
                    </Typography.Text>
                </Flex>

                <form onSubmit={handleSubmit(onSubmit)} noValidate>
                    <Row gutter={[0, 12]}>
                        <Col span={24}>
                            <label style={LABEL_STYLE}>Terminal *</label>
                            <Controller
                                name="TerminalId"
                                control={control}
                                render={({ field, fieldState }) => (
                                    <>
                                        <Select
                                            value={field.value || undefined}
                                            onChange={(v) => field.onChange(v ?? '')}
                                            loading={isLoading}
                                            placeholder="Pick a terminal"
                                            options={terminals.map((t) => ({
                                                label: t.Name,
                                                value: t.Id,
                                            }))}
                                            showSearch
                                            optionFilterProp="label"
                                            style={{ width: '100%' }}
                                            status={fieldState.error ? 'error' : undefined}
                                        />
                                        <div style={ERR_STYLE}>
                                            {fieldState.error?.message ?? ''}
                                        </div>
                                    </>
                                )}
                            />
                        </Col>

                        <Col span={24}>
                            <label style={LABEL_STYLE}>Starting cash *</label>
                            <Controller
                                name="StartingCash"
                                control={control}
                                render={({ field, fieldState }) => (
                                    <>
                                        <InputNumber
                                            value={field.value}
                                            onChange={(v) => field.onChange(v ?? 0)}
                                            min={0}
                                            precision={4}
                                            step={100}
                                            style={{ width: '100%' }}
                                            status={fieldState.error ? 'error' : undefined}
                                        />
                                        <div style={ERR_STYLE}>
                                            {fieldState.error?.message ?? ''}
                                        </div>
                                    </>
                                )}
                            />
                        </Col>

                        <Col span={24}>
                            <label style={LABEL_STYLE}>Notes</label>
                            <Controller
                                name="Notes"
                                control={control}
                                render={({ field }) => (
                                    <Input.TextArea
                                        {...field}
                                        value={field.value ?? ''}
                                        rows={2}
                                        maxLength={500}
                                        placeholder="Optional"
                                    />
                                )}
                            />
                        </Col>
                    </Row>

                    <Button
                        type="primary"
                        htmlType="submit"
                        block
                        size="large"
                        loading={submitting}
                        style={{ marginTop: 20 }}
                    >
                        {isMobile ? 'Open drawer' : 'Open cash drawer & start shift'}
                    </Button>
                </form>
            </Card>
        </Flex>
    );
}