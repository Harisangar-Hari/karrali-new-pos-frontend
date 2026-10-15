import { Card, Flex, Typography } from 'antd';

interface Props {
  label: string;
  value: string;
  hint?: string;
  valueColor?: string;
  strong?: boolean;
}

export function KpiCard({ label, value, hint, valueColor, strong }: Props) {
  return (
    <Card size="small" styles={{ body: { padding: '10px 12px' } }}>
      <Flex vertical gap={2}>
        <Typography.Text
          type="secondary"
          style={{ fontSize: 11 }}
          ellipsis
        >
          {label}
        </Typography.Text>
        <Typography.Text
          strong={strong}
          style={{
            fontSize: strong ? 16 : 14,
            color: valueColor,
            whiteSpace: 'nowrap',
          }}
        >
          {value}
        </Typography.Text>
        {hint && (
          <Typography.Text type="secondary" style={{ fontSize: 10 }}>
            {hint}
          </Typography.Text>
        )}
      </Flex>
    </Card>
  );
}