import { useEffect, useRef, useState } from 'react';
import { Empty, Flex, Typography } from 'antd';
import { renderBarcodeToSvg } from '@/utils/barcode';

interface Props {
  value: string;
  height?: number;
}

/**
 * Live barcode preview. Re-renders on every keystroke so the cashier
 * sees exactly what will print.
 *
 * The rendering logic lives in barcode.ts so the print path can reuse
 * the same format detection and CODE128 fallback.
 */
export function BarcodePreview({ value, height = 60 }: Props) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [valid, setValid] = useState(true);

  useEffect(() => {
    if (!svgRef.current) return;
    if (!value.trim()) {
      setValid(true);
      return;
    }
    const ok = renderBarcodeToSvg(svgRef.current, value, height);
    setValid(ok);
  }, [value, height]);

  if (!value.trim()) {
    return (
      <Flex
        vertical
        gap={4}
        align="center"
        style={{
          padding: 12,
          border: '1px dashed #d9d9d9',
          borderRadius: 6,
          background: '#fafafa',
        }}
      >
        <Empty
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          description={
            <Typography.Text type="secondary" style={{ fontSize: 11 }}>
              No barcode set
            </Typography.Text>
          }
          style={{ margin: 0 }}
        />
      </Flex>
    );
  }

  return (
    <Flex
      vertical
      gap={4}
      align="center"
      style={{
        padding: 8,
        border: valid ? '1px dashed #d9d9d9' : '1px solid #ffa39e',
        borderRadius: 6,
        background: '#fff',
        minHeight: height + 40,
        justifyContent: 'center',
      }}
    >
      <svg
        ref={svgRef}
        style={{
          maxWidth: '100%',
          display: valid ? 'block' : 'none',
        }}
      />
      {!valid && (
        <Typography.Text
          type="danger"
          style={{ fontSize: 11, textAlign: 'center' }}
        >
          Invalid barcode — check the length and characters
        </Typography.Text>
      )}
    </Flex>
  );
}