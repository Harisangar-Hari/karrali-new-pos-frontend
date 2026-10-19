import { useEffect, useState } from 'react';
import {
  Alert,
  Button,
  Card,
  Col,
  Flex,
  Grid,
  Input,
  InputNumber,
  Row,
  Skeleton,
  Switch,
  Table,
  Tag,
  Typography,
  App,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { Plus, Save, Trash2 } from 'lucide-react';
import { useLoyaltyConfig } from '@/hooks/queries/useLoyalty';
import { useUpsertSetting } from '@/hooks/queries/useSettings';
import { usePermission } from '@/hooks/usePermission';
import { getErrorMessage } from '@/lib/api';
import { formatMoney } from '@/lib/format';
import type { LoyaltyTierConfig } from '@/types/loyalty';

const { useBreakpoint } = Grid;

const LABEL_STYLE: React.CSSProperties = {
  display: 'block',
  marginBottom: 4,
  fontSize: 13,
  color: 'rgba(0,0,0,0.88)',
};

interface DraftConfig {
  Enabled: boolean;
  CurrencyPerPoint: number;
  RedeemRate: number;
  MinRedeem: number;
  MaxRedeemPercent: number;
  Tiers: LoyaltyTierConfig[];
}

let tierCounter = 0;

export function LoyaltyConfigTab() {
  const { message } = App.useApp();
  const screens = useBreakpoint();
  const isMobile = !screens.md;
  const canManage = usePermission('settings.manage');

  const { data, isLoading } = useLoyaltyConfig();
  const upsert = useUpsertSetting();

  const [draft, setDraft] = useState<DraftConfig | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (data && !draft) {
      setDraft({
        Enabled: data.Enabled,
        CurrencyPerPoint: data.CurrencyPerPoint,
        RedeemRate: data.RedeemRate,
        MinRedeem: data.MinRedeem,
        MaxRedeemPercent: data.MaxRedeemPercent,
        Tiers: [...data.Tiers].sort((a, b) => a.MinLifetime - b.MinLifetime),
      });
    }
  }, [data, draft]);

  if (isLoading || !draft) {
    return <Skeleton active paragraph={{ rows: 8 }} />;
  }

  const update = (patch: Partial<DraftConfig>) => {
    setDraft((prev) => (prev ? { ...prev, ...patch } : prev));
  };

  const addTier = () => {
    tierCounter += 1;
    const highest = draft.Tiers.reduce(
      (m, t) => Math.max(m, t.MinLifetime),
      0,
    );
    setDraft((prev) =>
      prev
        ? {
            ...prev,
            Tiers: [
              ...prev.Tiers,
              { Name: `Tier ${prev.Tiers.length + 1}`, MinLifetime: highest + 1000 },
            ],
          }
        : prev,
    );
  };

  const updateTier = (index: number, patch: Partial<LoyaltyTierConfig>) => {
    setDraft((prev) =>
      prev
        ? {
            ...prev,
            Tiers: prev.Tiers.map((t, i) =>
              i === index ? { ...t, ...patch } : t,
            ),
          }
        : prev,
    );
  };

  const removeTier = (index: number) => {
    setDraft((prev) =>
      prev ? { ...prev, Tiers: prev.Tiers.filter((_, i) => i !== index) } : prev,
    );
  };

  const handleSave = async () => {
    if (!draft) return;
    setSaving(true);
    try {
      // Six independent setting writes — either all succeed or we report
      // which ones failed. The setting API is idempotent (PUT), so retry
      // is safe.
      const writes = [
        { key: 'Loyalty.Enabled', Value: draft.Enabled, Description: 'Enable the loyalty program' },
        { key: 'Loyalty.CurrencyPerPoint', Value: draft.CurrencyPerPoint, Description: 'Currency spent to earn 1 point' },
        { key: 'Loyalty.RedeemRate', Value: draft.RedeemRate, Description: 'Currency value of 1 point' },
        { key: 'Loyalty.MinRedeem', Value: draft.MinRedeem, Description: 'Minimum points per redemption' },
        { key: 'Loyalty.MaxRedeemPercent', Value: draft.MaxRedeemPercent, Description: 'Cap on loyalty discount as % of total' },
        { key: 'Loyalty.Tiers', Value: draft.Tiers, Description: 'Loyalty tiers (Name + MinLifetime)' },
      ];
      await Promise.all(
        writes.map((w) => upsert.mutateAsync({ key: w.key, input: { Value: w.Value, Description: w.Description } })),
      );
      message.success('Loyalty configuration saved');
    } catch (err) {
      message.error(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const tierColumns: ColumnsType<LoyaltyTierConfig & { _idx: number }> = [
    {
      title: 'Tier name',
      key: 'Name',
      render: (_: unknown, row) => (
        <Input
          value={row.Name}
          onChange={(e) => updateTier(row._idx, { Name: e.target.value })}
          maxLength={50}
          disabled={!canManage}
        />
      ),
    },
    {
      title: 'Min lifetime points',
      key: 'MinLifetime',
      width: 180,
      render: (_: unknown, row) => (
        <InputNumber
          value={row.MinLifetime}
          onChange={(v) =>
            updateTier(row._idx, { MinLifetime: Number(v ?? 0) })
          }
          min={0}
          precision={0}
          style={{ width: '100%' }}
          disabled={!canManage}
        />
      ),
    },
    {
      title: '',
      key: 'actions',
      width: 40,
      align: 'right',
      render: (_: unknown, row) =>
        canManage ? (
          <Button
            type="text"
            size="small"
            danger
            icon={<Trash2 size={14} />}
            disabled={draft.Tiers.length <= 1}
            onClick={() => removeTier(row._idx)}
          />
        ) : null,
    },
  ];

  return (
    <Flex vertical gap={16}>
      {!draft.Enabled && (
        <Alert
          type="warning"
          showIcon
          message="Loyalty program is disabled"
          description="POS will not earn or redeem points until you enable it."
        />
      )}

      <Card title="Program" size="small">
        <Row gutter={[12, 12]}>
          <Col xs={24} md={12}>
            <Flex align="center" gap={8}>
              <Switch
                checked={draft.Enabled}
                onChange={(v) => update({ Enabled: v })}
                disabled={!canManage}
              />
              <Typography.Text>Enable loyalty program</Typography.Text>
            </Flex>
          </Col>
          <Col xs={24} md={12}>
            <label style={LABEL_STYLE}>Currency per point earned</label>
            <InputNumber
              value={draft.CurrencyPerPoint}
              onChange={(v) => update({ CurrencyPerPoint: Number(v ?? 0) })}
              min={1}
              precision={4}
              style={{ width: '100%' }}
              addonBefore="LKR"
              disabled={!canManage}
            />
            <Typography.Text type="secondary" style={{ fontSize: 11 }}>
              Spend this much to earn 1 point.
            </Typography.Text>
          </Col>
        </Row>
      </Card>

      <Card title="Redemption" size="small">
        <Row gutter={[12, 12]}>
          <Col xs={12} md={8}>
            <label style={LABEL_STYLE}>Value of 1 point</label>
            <InputNumber
              value={draft.RedeemRate}
              onChange={(v) => update({ RedeemRate: Number(v ?? 0) })}
              min={0}
              precision={4}
              style={{ width: '100%' }}
              addonBefore="LKR"
              disabled={!canManage}
            />
          </Col>
          <Col xs={12} md={8}>
            <label style={LABEL_STYLE}>Minimum redeem</label>
            <InputNumber
              value={draft.MinRedeem}
              onChange={(v) => update({ MinRedeem: Number(v ?? 0) })}
              min={1}
              precision={0}
              style={{ width: '100%' }}
              addonAfter="pts"
              disabled={!canManage}
            />
          </Col>
          <Col xs={24} md={8}>
            <label style={LABEL_STYLE}>Max redemption cap</label>
            <InputNumber
              value={draft.MaxRedeemPercent}
              onChange={(v) => update({ MaxRedeemPercent: Number(v ?? 0) })}
              min={0}
              max={100}
              precision={2}
              style={{ width: '100%' }}
              addonAfter="% of total"
              disabled={!canManage}
            />
          </Col>
        </Row>
        <Typography.Paragraph
          type="secondary"
          style={{ fontSize: 12, marginTop: 12, marginBottom: 0 }}
        >
          Example: {draft.MinRedeem} pts ={' '}
          <strong>{formatMoney((draft.MinRedeem * draft.RedeemRate).toFixed(4))}</strong>{' '}
          discount, capped at {draft.MaxRedeemPercent}% of the sale total.
        </Typography.Paragraph>
      </Card>

      <Card
        title="Tiers"
        size="small"
        extra={
          canManage ? (
            <Button
              size="small"
              icon={<Plus size={14} />}
              onClick={addTier}
            >
              Add tier
            </Button>
          ) : null
        }
        styles={{ body: { padding: isMobile ? 8 : 0 } }}
      >
        <Table
          rowKey={(r) => r.Name + r._idx}
          dataSource={draft.Tiers.map((t, i) => ({ ...t, _idx: i }))}
          columns={tierColumns}
          pagination={false}
          size="small"
        />
        <Flex
          justify="space-between"
          align="center"
          style={{ padding: isMobile ? '8px 4px 0' : '12px 16px 0' }}
        >
          <Typography.Text type="secondary" style={{ fontSize: 11 }}>
            Tiers are based on lifetime earned points. Highest matching tier
            wins.
          </Typography.Text>
          <Flex gap={4} wrap="wrap">
            {[...draft.Tiers]
              .sort((a, b) => a.MinLifetime - b.MinLifetime)
              .map((t) => (
                <Tag key={t.Name} color="cyan" style={{ marginInlineEnd: 0 }}>
                  {t.Name} @ {t.MinLifetime}
                </Tag>
              ))}
          </Flex>
        </Flex>
      </Card>

      {canManage && (
        <Flex justify="flex-end">
          <Button
            type="primary"
            icon={<Save size={14} />}
            onClick={handleSave}
            loading={saving}
          >
            Save configuration
          </Button>
        </Flex>
      )}
      {!canManage && (
        <Alert
          type="info"
          showIcon
          message="Read-only"
          description="You need the settings.manage permission to edit the loyalty configuration."
        />
      )}
    </Flex>
  );
}