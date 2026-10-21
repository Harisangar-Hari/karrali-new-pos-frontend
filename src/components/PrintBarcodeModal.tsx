import { useEffect, useState } from 'react';
import { Modal, InputNumber, Flex, Typography } from 'antd';
import { BarcodePreview } from './BarcodePreview';

export interface PrintBarcodeTarget {
  productName: string;
  barcode: string;
  price?: number | string;
}

interface Props {
  open: boolean;
  target: PrintBarcodeTarget | null;
  /** Number of products being printed (bulk mode when > 1). */
  totalProducts?: number;
  onConfirm: (copies: number) => void;
  onCancel: () => void;
}

const LABEL_STYLE: React.CSSProperties = {
  display: 'block',
  marginBottom: 4,
  fontSize: 13,
  color: 'rgba(0,0,0,0.88)',
};

/**
 * Asks the operator how many labels to print, then hands the count to
 * the caller. Single-product mode shows a barcode preview; bulk mode
 * shows a summary because there's no single barcode to preview.
 */
export function PrintBarcodeModal({
  open,
  target,
  totalProducts = 1,
  onConfirm,
  onCancel,
}: Props) {
  const [copies, setCopies] = useState(1);

  useEffect(() => {
    if (open) setCopies(1);
  }, [open]);

  const isBulk = totalProducts > 1;
  const totalLabels = Math.max(1, copies) * Math.max(1, totalProducts);

  const handleOk = () => {
    if (!target) return;
    onConfirm(Math.max(1, copies));
  };

  return (
    <Modal
      title={isBulk ? 'Print barcode labels' : 'Print barcode label'}
      open={open}
      onCancel={onCancel}
      onOk={handleOk}
      okText={`Print ${totalLabels} label${totalLabels === 1 ? '' : 's'}`}
      width={420}
      destroyOnClose
      maskClosable
      okButtonProps={{ disabled: !target }}
    >
      {target && (
        <Flex vertical gap={16}>
          {isBulk ? (
            <Typography.Text style={{ fontSize: 13 }}>
              <strong>{totalProducts}</strong> selected products — the same
              number of copies will print for each.
            </Typography.Text>
          ) : (
            <>
              <Typography.Text style={{ fontSize: 13 }}>
                {target.productName}
              </Typography.Text>
              <BarcodePreview value={target.barcode} />
            </>
          )}

          <div>
            <label style={LABEL_STYLE}>
              {isBulk ? 'Copies per product' : 'Number of labels'}
            </label>
            <InputNumber
              value={copies}
              onChange={(v) => setCopies(Math.max(1, Number(v ?? 1)))}
              min={1}
              max={100}
              precision={0}
              style={{ width: '100%' }}
              autoFocus
              onPressEnter={handleOk}
            />
            <Typography.Text
              type="secondary"
              style={{ fontSize: 11, display: 'block', marginTop: 4 }}
            >
              Each label prints on its own sticker.
            </Typography.Text>
          </div>
        </Flex>
      )}
    </Modal>
  );
}