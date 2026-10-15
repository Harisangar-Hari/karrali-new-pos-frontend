import { useState } from 'react';
import {
  Button,
  Flex,
  Input,
  Popover,
  Typography,
  Tag,
  Empty,
  Spin,
} from 'antd';
import { User, Search as SearchIcon, UserX } from 'lucide-react';
import { useCustomers } from '@/hooks/queries/useCustomers';
import { usePosCartStore } from '@/stores/posCartStore';
import { formatMoney } from '@/lib/format';

export function CustomerSelector() {
  const customerId = usePosCartStore((s) => s.customerId);
  const setCustomer = usePosCartStore((s) => s.setCustomer);

  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');

  const { data, isLoading } = useCustomers({
    search: search || undefined,
    limit: 10,
    IsActive: true,
    sortBy: 'Name',
    sortOrder: 'asc',
  });

  const results = data?.data ?? [];
  const selected = customerId
    ? results.find((c) => c.Id === customerId)
    : undefined;

  const content = (
    <div style={{ width: 320 }}>
      <Input
        autoFocus
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search name, code, phone"
        prefix={<SearchIcon size={14} />}
        allowClear
        style={{ marginBottom: 8 }}
      />
      <div style={{ maxHeight: 280, overflowY: 'auto' }}>
        {isLoading ? (
          <Flex justify="center" style={{ padding: 16 }}>
            <Spin size="small" />
          </Flex>
        ) : (
          <>
            {results.length === 0 ? (
              <Empty
                description="No customers"
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                style={{ padding: '12px 0' }}
              />
            ) : (
              <Flex vertical>
                {results.map((c) => (
                  <Flex
                    key={c.Id}
                    align="center"
                    gap={8}
                    style={{
                      padding: '8px 4px',
                      cursor: 'pointer',
                      borderBottom: '1px solid #f0f0f0',
                    }}
                    onClick={() => {
                      setCustomer(c.Id);
                      setOpen(false);
                      setSearch('');
                    }}
                  >
                    <Flex vertical gap={2} style={{ flex: 1, minWidth: 0 }}>
                      <Typography.Text strong ellipsis>
                        {c.Name}
                      </Typography.Text>
                      <Typography.Text type="secondary" style={{ fontSize: 11 }}>
                        {c.Code}
                        {c.Phone ? ` · ${c.Phone}` : ''}
                      </Typography.Text>
                    </Flex>
                    {Number(c.Balance) > 0 && (
                      <Typography.Text style={{ fontSize: 11, color: '#dc2626' }}>
                        {formatMoney(c.Balance)}
                      </Typography.Text>
                    )}
                  </Flex>
                ))}
              </Flex>
            )}
          </>
        )}
      </div>
    </div>
  );

  // Walk-in state
  if (!customerId) {
    return (
      <Flex align="center" gap={8}>
        <Tag
          icon={<UserX size={12} />}
          color="default"
          style={{ marginInlineEnd: 0, padding: '4px 8px' }}
        >
          Walk-in customer
        </Tag>
        <Popover
          content={content}
          trigger="click"
          open={open}
          onOpenChange={setOpen}
          placement="bottomLeft"
        >
          <Button size="small" icon={<User size={12} />}>
            Attach customer
          </Button>
        </Popover>
      </Flex>
    );
  }

  // Named customer state
  return (
    <Flex align="center" gap={8} wrap="wrap">
      <Tag
        color="cyan"
        closable
        onClose={() => setCustomer(null)}
        icon={<User size={12} />}
        style={{ marginInlineEnd: 0, padding: '4px 8px' }}
      >
        {selected ? `${selected.Name} (${selected.Code})` : 'Customer'}
      </Tag>
      {selected && Number(selected.Balance) > 0 && (
        <Typography.Text type="secondary" style={{ fontSize: 11 }}>
          Balance: {formatMoney(selected.Balance)}
        </Typography.Text>
      )}
      <Button
        size="small"
        type="link"
        onClick={() => setOpen(true)}
        style={{ padding: 0, height: 'auto', fontSize: 12 }}
      >
        Change
      </Button>
    </Flex>
  );
}