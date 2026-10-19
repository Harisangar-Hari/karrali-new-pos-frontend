import { Modal, Typography, Flex } from 'antd';
import type { SettingRow } from '@/types/setting';

interface Props {
  open: boolean;
  setting: SettingRow | null;
  onClose: () => void;
}

export function SettingValueModal({ open, setting, onClose }: Props) {
  return (
    <Modal
      title={setting ? `Value — ${setting.Key}` : 'Value'}
      open={open}
      onCancel={onClose}
      footer={null}
      width={560}
      destroyOnClose
    >
      {setting && (
        <Flex vertical gap={8}>
          {setting.Description && (
            <Typography.Text type="secondary" style={{ fontSize: 12 }}>
              {setting.Description}
            </Typography.Text>
          )}
          <pre
            style={{
              margin: 0,
              padding: 12,
              background: '#fafafa',
              border: '1px solid #f0f0f0',
              borderRadius: 6,
              fontFamily: 'monospace',
              fontSize: 12,
              maxHeight: 400,
              overflow: 'auto',
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-all',
            }}
          >
            {JSON.stringify(setting.Value, null, 2)}
          </pre>
        </Flex>
      )}
    </Modal>
  );
}