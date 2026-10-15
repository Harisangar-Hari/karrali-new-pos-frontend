import { Modal, Button, Flex, Typography, Divider } from 'antd';
import { Printer } from 'lucide-react';
import { formatMoney, formatDateTime } from '@/lib/format';
import type { SaleDetail } from '@/types/sale';

interface Props {
  open: boolean;
  sale: SaleDetail | null;
  onClose: () => void;
  onNewSale: () => void;
}

export function ReceiptModal({ open, sale, onClose, onNewSale }: Props) {
  if (!sale) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <Modal
      open={open}
      onCancel={onClose}
      destroyOnClose
      width={420}
      title="Sale complete"
      footer={
        <Flex justify="space-between">
          <Button onClick={onClose}>Close</Button>
          <Flex gap={8}>
            <Button icon={<Printer size={14} />} onClick={handlePrint}>
              Print
            </Button>
            <Button type="primary" onClick={onNewSale}>
              New sale
            </Button>
          </Flex>
        </Flex>
      }
    >
      <div className="receipt-printable" style={{ padding: 4 }}>
        <Flex vertical gap={4} align="center" style={{ marginBottom: 12 }}>
          <Typography.Title level={4} style={{ margin: 0 }}>
            Karrali POS
          </Typography.Title>
          <Typography.Text type="secondary" style={{ fontSize: 11 }}>
            {sale.Terminal.Name} ({sale.Terminal.Code})
          </Typography.Text>
        </Flex>

        <Divider style={{ margin: '8px 0' }} />

        <Flex justify="space-between">
          <Typography.Text style={{ fontSize: 12 }}>Invoice</Typography.Text>
          <Typography.Text strong style={{ fontSize: 12 }}>
            {sale.InvoiceNumber}
          </Typography.Text>
        </Flex>
        <Flex justify="space-between">
          <Typography.Text style={{ fontSize: 12 }}>Date</Typography.Text>
          <Typography.Text style={{ fontSize: 12 }}>
            {formatDateTime(sale.CreatedAt)}
          </Typography.Text>
        </Flex>
        <Flex justify="space-between">
          <Typography.Text style={{ fontSize: 12 }}>Cashier</Typography.Text>
          <Typography.Text style={{ fontSize: 12 }}>
            {sale.Cashier.FullName ?? sale.Cashier.Username}
          </Typography.Text>
        </Flex>
        {sale.Customer && (
          <Flex justify="space-between">
            <Typography.Text style={{ fontSize: 12 }}>Customer</Typography.Text>
            <Typography.Text style={{ fontSize: 12 }}>
              {sale.Customer.Name}
            </Typography.Text>
          </Flex>
        )}

        <Divider style={{ margin: '8px 0' }} />

        <Flex vertical gap={6}>
          {sale.Items.map((item) => (
            <div key={item.Id}>
              <Flex justify="space-between">
                <Typography.Text style={{ fontSize: 12 }} strong>
                  {item.Product.Name}
                </Typography.Text>
                <Typography.Text style={{ fontSize: 12 }} strong>
                  {formatMoney(item.LineTotal)}
                </Typography.Text>
              </Flex>
              <Typography.Text type="secondary" style={{ fontSize: 11 }}>
                {item.Qty} × {formatMoney(item.UnitPrice)}
                {Number(item.Discount) > 0 ? ` − ${item.Discount}%` : ''}
              </Typography.Text>
            </div>
          ))}
        </Flex>

        <Divider style={{ margin: '8px 0' }} />

        <Flex justify="space-between">
          <Typography.Text style={{ fontSize: 12 }}>Subtotal</Typography.Text>
          <Typography.Text style={{ fontSize: 12 }}>
            {formatMoney(sale.Subtotal)}
          </Typography.Text>
        </Flex>
        {Number(sale.DiscountAmount) > 0 && (
          <Flex justify="space-between">
            <Typography.Text style={{ fontSize: 12 }}>Discount</Typography.Text>
            <Typography.Text style={{ fontSize: 12 }}>
              − {formatMoney(sale.DiscountAmount)}
            </Typography.Text>
          </Flex>
        )}
        {Number(sale.TaxAmount) > 0 && (
          <Flex justify="space-between">
            <Typography.Text style={{ fontSize: 12 }}>Tax</Typography.Text>
            <Typography.Text style={{ fontSize: 12 }}>
              {formatMoney(sale.TaxAmount)}
            </Typography.Text>
          </Flex>
        )}
        <Divider style={{ margin: '8px 0' }} />
        <Flex justify="space-between">
          <Typography.Text strong>Total</Typography.Text>
          <Typography.Text strong>{formatMoney(sale.TotalAmount)}</Typography.Text>
        </Flex>
        <Flex justify="space-between">
          <Typography.Text style={{ fontSize: 12 }}>Paid (cash)</Typography.Text>
          <Typography.Text style={{ fontSize: 12 }}>
            {formatMoney(sale.CashAmount)}
          </Typography.Text>
        </Flex>

        {sale.Notes && (
          <>
            <Divider style={{ margin: '8px 0' }} />
            <Typography.Text type="secondary" style={{ fontSize: 11 }}>
              {sale.Notes}
            </Typography.Text>
          </>
        )}

        <Divider style={{ margin: '12px 0' }} />
        <Flex justify="center">
          <Typography.Text type="secondary" style={{ fontSize: 11 }}>
            Thank you
          </Typography.Text>
        </Flex>
      </div>
    </Modal>
  );
}