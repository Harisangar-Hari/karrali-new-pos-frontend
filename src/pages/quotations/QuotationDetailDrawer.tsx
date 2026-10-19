import { useState } from 'react';
import {
  Drawer,
  Descriptions,
  Flex,
  Grid,
  Skeleton,
  Table,
  Tag,
  Typography,
  Divider,
  Button,
  Alert,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { useNavigate } from 'react-router-dom';
import {
  Send,
  CheckCircle2,
  XCircle,
  Ban,
  Pencil,
  Trash2,
  ShoppingCart,
  ExternalLink,
} from 'lucide-react';
import {
  useDeleteQuotation,
  useQuotation,
  useSendQuotation,
  useAcceptQuotation,
} from '@/hooks/queries/useQuotations';
import { usePermission } from '@/hooks/usePermission';
import { ConvertQuotationModal } from './ConvertQuotationModal';
import { QuotationStatusModal } from './QuotationStatusModal';
import { formatMoney, formatDate, formatDateTime } from '@/lib/format';
import { getErrorMessage } from '@/lib/api';
import { App } from 'antd';
import type {
  QuotationEffectiveStatus,
  QuotationItemRow,
} from '@/types/quotation';

const { useBreakpoint } = Grid;

interface Props {
  quotationId: string | null;
  onClose: () => void;
}

const STATUS_COLOR: Record<QuotationEffectiveStatus, string> = {
  DRAFT: 'default',
  SENT: 'blue',
  ACCEPTED: 'green',
  REJECTED: 'red',
  CANCELLED: 'default',
  CONVERTED: 'purple',
  EXPIRED: 'orange',
};

export function QuotationDetailDrawer({ quotationId, onClose }: Props) {
  const { message, modal } = App.useApp();
  const navigate = useNavigate();
  const screens = useBreakpoint();
  const isMobile = !screens.md;

  const { data, isLoading } = useQuotation(quotationId);
  const canUpdate = usePermission('quotations.update');
  const canConvert = usePermission('quotations.convert');
  const canDelete = usePermission('quotations.delete');

  const sendMutation = useSendQuotation();
  const acceptMutation = useAcceptQuotation();
  const deleteMutation = useDeleteQuotation();

  const [convertOpen, setConvertOpen] = useState(false);
  const [statusAction, setStatusAction] = useState<
    'reject' | 'cancel' | null
  >(null);

  const itemColumns: ColumnsType<QuotationItemRow> = [
    {
      title: 'Product',
      key: 'product',
      render: (_: unknown, row) => (
        <Flex vertical gap={2}>
          <Typography.Text>{row.Product.Name}</Typography.Text>
          {row.Product.SKU && (
            <Typography.Text type="secondary" style={{ fontSize: 11 }}>
              {row.Product.SKU}
            </Typography.Text>
          )}
        </Flex>
      ),
    },
    {
      title: 'Qty',
      dataIndex: 'Qty',
      key: 'Qty',
      align: 'right',
    },
    {
      title: 'Unit price',
      dataIndex: 'UnitPrice',
      key: 'UnitPrice',
      align: 'right',
      render: (v: string) => formatMoney(v),
    },
    {
      title: 'Disc',
      dataIndex: 'Discount',
      key: 'Discount',
      align: 'right',
      render: (v: string) =>
        Number(v) > 0 ? (
          <Typography.Text style={{ color: '#16a34a' }}>
            −{Number(v).toFixed(2)}%
          </Typography.Text>
        ) : (
          <Typography.Text type="secondary">—</Typography.Text>
        ),
    },
    {
      title: 'Line total',
      dataIndex: 'LineTotal',
      key: 'LineTotal',
      align: 'right',
      render: (v: string) => (
        <Typography.Text strong>{formatMoney(v)}</Typography.Text>
      ),
    },
  ];

  const handleSend = async () => {
    if (!data) return;
    try {
      await sendMutation.mutateAsync(data.Id);
      message.success('Quotation marked as SENT');
    } catch (err) {
      message.error(getErrorMessage(err));
    }
  };

  const handleAccept = async () => {
    if (!data) return;
    try {
      await acceptMutation.mutateAsync(data.Id);
      message.success('Quotation accepted');
    } catch (err) {
      message.error(getErrorMessage(err));
    }
  };

  const confirmDelete = () => {
    if (!data) return;
    modal.confirm({
      title: 'Delete quotation?',
      content: (
        <div>
          <p>
            <strong>{data.Code}</strong> will be soft-deleted. Only DRAFT
            quotations can be deleted.
          </p>
        </div>
      ),
      okText: 'Delete',
      okButtonProps: { danger: true },
      async onOk() {
        try {
          await deleteMutation.mutateAsync(data.Id);
          message.success('Quotation deleted');
          onClose();
        } catch (err) {
          message.error(getErrorMessage(err));
          throw err;
        }
      },
    });
  };

  // Compute available actions based on status
  const status = data?.EffectiveStatus;
  const canSend = canUpdate && status === 'DRAFT';
  const canAccept = canUpdate && status === 'SENT';
  const canReject = canUpdate && status === 'SENT';
  const canCancel =
    canUpdate && (status === 'DRAFT' || status === 'SENT');
  const canConvertNow = canConvert && status === 'ACCEPTED';
  const canEditNow =
    canUpdate && (status === 'DRAFT' || status === 'SENT');
  const canDeleteNow = canDelete && status === 'DRAFT';

  const hasAnyAction =
    canSend ||
    canAccept ||
    canReject ||
    canCancel ||
    canConvertNow ||
    canEditNow ||
    canDeleteNow;

  return (
    <>
      <Drawer
        title={data ? `Quotation ${data.Code}` : 'Quotation'}
        open={!!quotationId}
        onClose={onClose}
        width={isMobile ? '100%' : 720}
        destroyOnClose
      >
        {isLoading || !data ? (
          <Skeleton active paragraph={{ rows: 12 }} />
        ) : (
          <Flex vertical gap={16}>
            {/* Expired warning */}
            {data.EffectiveStatus === 'EXPIRED' && (
              <Alert
                type="warning"
                showIcon
                message="Quotation has expired"
                description={`Valid until ${data.ValidUntil ? formatDate(data.ValidUntil) : '—'}. Cannot be sent, accepted, or converted — only viewed or cancelled.`}
              />
            )}

            {/* Converted banner */}
            {data.Status === 'CONVERTED' && data.Sale && (
              <Alert
                type="success"
                showIcon
                message={`Converted to sale ${data.Sale.InvoiceNumber}`}
                description={
                  <Button
                    type="link"
                    size="small"
                    style={{ padding: 0, height: 'auto' }}
                    onClick={() => {
                      navigate('/sales');
                      onClose();
                    }}
                  >
                    View sale <ExternalLink size={11} />
                  </Button>
                }
              />
            )}

            <Descriptions
              bordered
              size="small"
              column={isMobile ? 1 : 2}
              items={[
                {
                  key: 'status',
                  label: 'Status',
                  children: (
                    <Tag color={STATUS_COLOR[data.EffectiveStatus]}>
                      {data.EffectiveStatus}
                    </Tag>
                  ),
                },
                {
                  key: 'created',
                  label: 'Created',
                  children: formatDateTime(data.CreatedAt),
                },
                {
                  key: 'customer',
                  label: 'Customer',
                  children: data.Customer
                    ? `${data.Customer.Name} (${data.Customer.Code})`
                    : 'Walk-in',
                },
                {
                  key: 'valid-until',
                  label: 'Valid until',
                  children: data.ValidUntil
                    ? formatDate(data.ValidUntil)
                    : '—',
                },
                {
                  key: 'subtotal',
                  label: 'Subtotal',
                  children: formatMoney(data.Subtotal),
                },
                {
                  key: 'discount',
                  label: 'Discount',
                  children:
                    Number(data.DiscountAmount) > 0 ? (
                      <Typography.Text style={{ color: '#16a34a' }}>
                        − {formatMoney(data.DiscountAmount)}
                      </Typography.Text>
                    ) : (
                      '—'
                    ),
                },
                {
                  key: 'tax',
                  label: 'Tax',
                  children: formatMoney(data.TaxAmount),
                },
                {
                  key: 'total',
                  label: 'Total',
                  children: (
                    <Typography.Text strong style={{ color: '#0d9488' }}>
                      {formatMoney(data.TotalAmount)}
                    </Typography.Text>
                  ),
                },
              ]}
            />

            {data.Notes && (
              <div>
                <Typography.Text strong>Notes</Typography.Text>
                <Typography.Paragraph
                  type="secondary"
                  style={{ marginTop: 4, whiteSpace: 'pre-wrap' }}
                >
                  {data.Notes}
                </Typography.Paragraph>
              </div>
            )}

            {/* Items */}
            <div>
              <Typography.Title level={5} style={{ marginBottom: 8 }}>
                Items ({data.Items.length})
              </Typography.Title>
              <Table<QuotationItemRow>
                rowKey="Id"
                columns={itemColumns}
                dataSource={data.Items}
                pagination={false}
                size="small"
              />
            </div>

            {/* Actions */}
            {hasAnyAction && (
              <>
                <Divider style={{ margin: 0 }} />
                <Flex gap={8} wrap="wrap">
                  {canSend && (
                    <Button
                      type="primary"
                      icon={<Send size={14} />}
                      onClick={handleSend}
                      loading={sendMutation.isPending}
                    >
                      Mark as sent
                    </Button>
                  )}
                  {canAccept && (
                    <Button
                      type="primary"
                      icon={<CheckCircle2 size={14} />}
                      onClick={handleAccept}
                      loading={acceptMutation.isPending}
                    >
                      Mark accepted
                    </Button>
                  )}
                  {canConvertNow && (
                    <Button
                      type="primary"
                      icon={<ShoppingCart size={14} />}
                      onClick={() => setConvertOpen(true)}
                    >
                      Convert to sale
                    </Button>
                  )}
                  {canEditNow && (
                    <Button
                      icon={<Pencil size={14} />}
                      onClick={() => {
                        navigate(`/quotations/${data.Id}/edit`);
                        onClose();
                      }}
                    >
                      Edit
                    </Button>
                  )}
                  {canReject && (
                    <Button
                      danger
                      icon={<XCircle size={14} />}
                      onClick={() => setStatusAction('reject')}
                    >
                      Reject
                    </Button>
                  )}
                  {canCancel && (
                    <Button
                      danger
                      icon={<Ban size={14} />}
                      onClick={() => setStatusAction('cancel')}
                    >
                      Cancel
                    </Button>
                  )}
                  {canDeleteNow && (
                    <Button
                      danger
                      icon={<Trash2 size={14} />}
                      onClick={confirmDelete}
                      loading={deleteMutation.isPending}
                    >
                      Delete
                    </Button>
                  )}
                </Flex>
              </>
            )}
          </Flex>
        )}
      </Drawer>

      <ConvertQuotationModal
        open={convertOpen}
        quotation={data ?? null}
        onClose={() => setConvertOpen(false)}
      />

      <QuotationStatusModal
        open={!!statusAction}
        action={statusAction ?? 'reject'}
        quotation={data ?? null}
        onClose={() => setStatusAction(null)}
      />
    </>
  );
}