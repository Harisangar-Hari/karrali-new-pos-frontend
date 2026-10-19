import {
  Drawer,
  Descriptions,
  Flex,
  Grid,
  Typography,
  Divider,
  Tag,
  Empty,
} from 'antd';
import { formatDateTime } from '@/lib/format';
import type { AuditLogRow } from '@/types/audit';
import { humanizeAction } from '@/types/audit';

const { useBreakpoint } = Grid;

interface Props {
  open: boolean;
  log: AuditLogRow | null;
  /** Map of userId → display name (username or fullname). */
  userMap: Map<string, string>;
  onClose: () => void;
}

/**
 * Renders a JSON value in a pre block with stable formatting.
 * Objects/arrays are pretty-printed; primitives get a one-line view.
 */
function JsonBlock({ value }: { value: unknown }) {
  if (value === null || value === undefined) {
    return (
      <Typography.Text type="secondary" style={{ fontSize: 12 }}>
        (empty)
      </Typography.Text>
    );
  }
  return (
    <pre
      style={{
        margin: 0,
        padding: 10,
        background: '#fafafa',
        border: '1px solid #f0f0f0',
        borderRadius: 6,
        fontFamily: 'monospace',
        fontSize: 12,
        maxHeight: 320,
        overflow: 'auto',
        whiteSpace: 'pre-wrap',
        wordBreak: 'break-all',
      }}
    >
      {JSON.stringify(value, null, 2)}
    </pre>
  );
}

export function AuditLogDetailDrawer({
  open,
  log,
  userMap,
  onClose,
}: Props) {
  const screens = useBreakpoint();
  const isMobile = !screens.md;

  if (!log) return null;

  const actor = log.UserId
    ? userMap.get(log.UserId) ?? log.UserId
    : 'Anonymous';

  const hasBefore = log.Before !== null && log.Before !== undefined;
  const hasAfter = log.After !== null && log.After !== undefined;
  const hasMetadata =
    log.Metadata !== null && log.Metadata !== undefined;

  return (
    <Drawer
      title={humanizeAction(log.Action)}
      open={open}
      onClose={onClose}
      width={isMobile ? '100%' : 720}
      destroyOnClose
    >
      <Flex vertical gap={16}>
        <Descriptions
          bordered
          size="small"
          column={isMobile ? 1 : 2}
          items={[
            {
              key: 'when',
              label: 'When',
              children: formatDateTime(log.CreatedAt),
            },
            {
              key: 'actor',
              label: 'Actor',
              children: actor,
            },
            {
              key: 'action',
              label: 'Action',
              children: (
                <Tag color="blue" style={{ fontFamily: 'monospace' }}>
                  {log.Action}
                </Tag>
              ),
            },
            {
              key: 'entity',
              label: 'Entity',
              children: log.Entity ?? '—',
            },
            {
              key: 'entity-id',
              label: 'Entity ID',
              span: isMobile ? 1 : 2,
              children: log.EntityId ? (
                <Typography.Text
                  code
                  style={{ fontSize: 11, wordBreak: 'break-all' }}
                >
                  {log.EntityId}
                </Typography.Text>
              ) : (
                '—'
              ),
            },
            ...(log.Ip
              ? [
                  {
                    key: 'ip',
                    label: 'IP',
                    children: log.Ip,
                  },
                ]
              : []),
            ...(log.UserAgent
              ? [
                  {
                    key: 'ua',
                    label: 'User agent',
                    span: isMobile ? 1 : 2,
                    children: (
                      <Typography.Text
                        style={{ fontSize: 11, wordBreak: 'break-all' }}
                      >
                        {log.UserAgent}
                      </Typography.Text>
                    ),
                  },
                ]
              : []),
          ]}
        />

        {hasMetadata && (
          <div>
            <Typography.Text strong>Metadata</Typography.Text>
            <div style={{ marginTop: 6 }}>
              <JsonBlock value={log.Metadata} />
            </div>
          </div>
        )}

        {(hasBefore || hasAfter) && (
          <>
            <Divider style={{ margin: 0 }} />
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr',
                gap: 12,
              }}
            >
              {hasBefore && (
                <div>
                  <Typography.Text strong>Before</Typography.Text>
                  <div style={{ marginTop: 6 }}>
                    <JsonBlock value={log.Before} />
                  </div>
                </div>
              )}
              {hasAfter && (
                <div>
                  <Typography.Text strong>After</Typography.Text>
                  <div style={{ marginTop: 6 }}>
                    <JsonBlock value={log.After} />
                  </div>
                </div>
              )}
            </div>
          </>
        )}

        {!hasBefore && !hasAfter && !hasMetadata && (
          <Empty
            description="No change data recorded"
            image={Empty.PRESENTED_IMAGE_SIMPLE}
          />
        )}
      </Flex>
    </Drawer>
  );
}