import { useState } from 'react';
import { Modal, Button, Flex, Typography, App, Card } from 'antd';
import { Printer, Download, CheckCircle2 } from 'lucide-react';
import { formatMoney } from '@/lib/format';
import { printReceipt } from '@/utils/printReceipt';
import { downloadReceiptPdf } from '@/utils/downloadReceiptPdf';
import { saleToReceiptData } from '@/utils/saleToReceiptData';
import type { SaleDetail } from '@/types/sale';

interface Props {
  open: boolean;
  sale: SaleDetail | null;
  cashTendered?: number;
  changeDue?: number;
  onClose: () => void;
  onNewSale: () => void;
}

export function ReceiptModal({
  open,
  sale,
  cashTendered,
  changeDue,
  onClose,
  onNewSale,
}: Props) {
  const { message } = App.useApp();
  const [downloadingPdf, setDownloadingPdf] = useState(false);

  if (!sale) return null;

  const buildData = () => ({
    ...saleToReceiptData(sale),
    cashTendered,
    changeDue,
  });

  const handlePrint = () => {
    printReceipt(buildData());
  };

  const handleDownloadPdf = async () => {
    setDownloadingPdf(true);
    try {
      await downloadReceiptPdf(
        buildData(),
        `invoice-${sale.InvoiceNumber}.pdf`,
      );
    } catch {
      message.error(
        'PDF download failed — use Print and choose "Save as PDF".',
      );
    } finally {
      setDownloadingPdf(false);
    }
  };

  return (
    <Modal
      open={open}
      onCancel={onClose}
      destroyOnClose
      width={460}
      footer={null}
      title={null}
      closable
    >
      <Flex vertical gap={20} align="center" style={{ padding: '16px 0' }}>
        {/* Success indicator */}
        <CheckCircle2 size={56} color="#16a34a" strokeWidth={1.5} />
        <Flex vertical gap={4} align="center">
          <Typography.Title level={3} style={{ margin: 0 }}>
            Sale complete
          </Typography.Title>
          <Typography.Text type="secondary">
            Invoice {sale.InvoiceNumber}
          </Typography.Text>
        </Flex>

        {/* Summary card */}
        <Card
          size="small"
          style={{ width: '100%' }}
          styles={{ body: { padding: 16 } }}
        >
          <Flex vertical gap={8}>
            <Flex justify="space-between">
              <Typography.Text type="secondary">Total</Typography.Text>
              <Typography.Text strong style={{ fontSize: 18 }}>
                {formatMoney(sale.TotalAmount)}
              </Typography.Text>
            </Flex>
            {Number(sale.CashAmount) > 0 && (
              <Flex justify="space-between">
                <Typography.Text type="secondary">Cash</Typography.Text>
                <Typography.Text>
                  {formatMoney(sale.CashAmount)}
                </Typography.Text>
              </Flex>
            )}
            {Number(sale.CardAmount) > 0 && (
              <Flex justify="space-between">
                <Typography.Text type="secondary">Card</Typography.Text>
                <Typography.Text>
                  {formatMoney(sale.CardAmount)}
                </Typography.Text>
              </Flex>
            )}
            {Number(sale.CreditAmount) > 0 && (
              <Flex justify="space-between">
                <Typography.Text type="secondary">Credit owed</Typography.Text>
                <Typography.Text style={{ color: '#dc2626' }}>
                  {formatMoney(sale.CreditAmount)}
                </Typography.Text>
              </Flex>
            )}
            {Number(sale.ChequeAmount) > 0 && (
              <Flex justify="space-between">
                <Typography.Text type="secondary">Cheque</Typography.Text>
                <Typography.Text>
                  {formatMoney(sale.ChequeAmount)}
                </Typography.Text>
              </Flex>
            )}
            {sale.Customer && (
              <Flex justify="space-between">
                <Typography.Text type="secondary">Customer</Typography.Text>
                <Typography.Text>{sale.Customer.Name}</Typography.Text>
              </Flex>
            )}
          </Flex>
        </Card>

        {/* Actions */}
        <Flex gap={8} style={{ width: '100%' }}>
          <Button
            icon={<Printer size={14} />}
            onClick={handlePrint}
            style={{ flex: 1 }}
          >
            Print
          </Button>
          <Button
            icon={<Download size={14} />}
            onClick={handleDownloadPdf}
            loading={downloadingPdf}
            style={{ flex: 1 }}
          >
            PDF
          </Button>
          <Button
            type="primary"
            onClick={onNewSale}
            style={{ flex: 1 }}
          >
            New sale
          </Button>
        </Flex>
      </Flex>
    </Modal>
  );
}