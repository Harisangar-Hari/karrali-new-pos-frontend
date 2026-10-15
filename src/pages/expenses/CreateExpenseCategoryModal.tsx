import { useEffect, useState } from 'react';
import { Modal, Input, Flex, Typography, App } from 'antd';
import { useCreateExpenseCategory } from '@/hooks/queries/useExpenseCategories';
import { getErrorMessage } from '@/lib/api';

interface Props {
  open: boolean;
  onClose: () => void;
  onCreated: (category: { Id: string; Name: string }) => void;
}

const LABEL_STYLE: React.CSSProperties = {
  display: 'block',
  marginBottom: 4,
  fontSize: 13,
  color: 'rgba(0,0,0,0.88)',
};

export function CreateExpenseCategoryModal({
  open,
  onClose,
  onCreated,
}: Props) {
  const { message } = App.useApp();
  const createMutation = useCreateExpenseCategory();

  const [name, setName] = useState('');
  const [nameError, setNameError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setName('');
      setNameError(null);
    }
  }, [open]);

  const submitting = createMutation.isPending;

  const handleOk = async () => {
    setNameError(null);
    const trimmed = name.trim();
    if (!trimmed) {
      setNameError('Name is required');
      return;
    }
    if (trimmed.length > 100) {
      setNameError('At most 100 characters');
      return;
    }

    try {
      const created = await createMutation.mutateAsync({
        Name: trimmed,
        IsActive: true,
      });
      message.success(`Category "${created.Name}" created`);
      onCreated({ Id: created.Id, Name: created.Name });
      onClose();
    } catch (err) {
      message.error(getErrorMessage(err));
    }
  };

  return (
    <Modal
      title="New expense category"
      open={open}
      onCancel={submitting ? undefined : onClose}
      onOk={handleOk}
      okText="Create category"
      confirmLoading={submitting}
      destroyOnClose
      maskClosable={!submitting}
      width={400}
    >
      <Flex vertical gap={8}>
        <label style={LABEL_STYLE}>Name *</label>
        <Input
          autoFocus
          value={name}
          onChange={(e) => {
            setName(e.target.value);
            if (nameError) setNameError(null);
          }}
          maxLength={100}
          placeholder="e.g. Fuel & Transport"
          status={nameError ? 'error' : undefined}
          disabled={submitting}
          onPressEnter={handleOk}
        />
        {nameError && (
          <Typography.Text
            type="danger"
            style={{ fontSize: 12, display: 'block' }}
          >
            {nameError}
          </Typography.Text>
        )}
      </Flex>
    </Modal>
  );
}