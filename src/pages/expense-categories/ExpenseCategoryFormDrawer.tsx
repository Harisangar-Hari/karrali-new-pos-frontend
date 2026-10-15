import { useEffect } from 'react';
import { Drawer, Input, Switch, Button, Flex, Grid, App } from 'antd';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  useCreateExpenseCategory,
  useUpdateExpenseCategory,
} from '@/hooks/queries/useExpenseCategories';
import { getErrorMessage } from '@/lib/api';
import type { ExpenseCategoryRow } from '@/types/expenseCategory';

const { useBreakpoint } = Grid;

const schema = z.object({
  Name: z.string().min(1, 'Required').max(100),
  IsActive: z.boolean(),
});

type Form = z.infer<typeof schema>;

interface Props {
  open: boolean;
  category?: ExpenseCategoryRow | null;
  onClose: () => void;
}

const LABEL_STYLE: React.CSSProperties = {
  display: 'block',
  marginBottom: 4,
  fontSize: 13,
  color: 'rgba(0,0,0,0.88)',
};
const ERR_STYLE: React.CSSProperties = {
  color: '#ff4d4f',
  fontSize: 12,
  marginTop: 4,
  minHeight: 16,
};

function buildDefaults(c?: ExpenseCategoryRow | null): Form {
  if (!c) {
    return { Name: '', IsActive: true };
  }
  return {
    Name: c.Name,
    IsActive: c.IsActive,
  };
}

export function ExpenseCategoryFormDrawer({
  open,
  category,
  onClose,
}: Props) {
  const { message } = App.useApp();
  const screens = useBreakpoint();
  const isMobile = !screens.md;
  const isEdit = !!category;

  const createMutation = useCreateExpenseCategory();
  const updateMutation = useUpdateExpenseCategory(category?.Id ?? '');

  const {
    control,
    handleSubmit,
    reset,
    formState: { isSubmitting },
  } = useForm<Form>({
    resolver: zodResolver(schema),
    defaultValues: buildDefaults(category),
    mode: 'onTouched',
  });

  useEffect(() => {
    if (open) reset(buildDefaults(category));
  }, [open, category, reset]);

  const submitting =
    isSubmitting || createMutation.isPending || updateMutation.isPending;

  const onSubmit = async (values: Form) => {
    const payload = {
      Name: values.Name,
      IsActive: values.IsActive,
    };
    try {
      if (isEdit && category) {
        await updateMutation.mutateAsync(payload);
        message.success('Category updated');
      } else {
        await createMutation.mutateAsync(payload);
        message.success('Category created');
      }
      onClose();
    } catch (err) {
      message.error(getErrorMessage(err));
    }
  };

  return (
    <Drawer
      title={isEdit ? 'Edit expense category' : 'New expense category'}
      open={open}
      onClose={submitting ? undefined : onClose}
      width={isMobile ? '100%' : 400}
      destroyOnClose
      maskClosable={!submitting}
      extra={
        <Flex gap={8}>
          <Button onClick={onClose} disabled={submitting}>
            Cancel
          </Button>
          <Button
            type="primary"
            loading={submitting}
            onClick={handleSubmit(onSubmit)}
          >
            {isEdit ? 'Save changes' : 'Create category'}
          </Button>
        </Flex>
      }
    >
      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        <div style={{ marginBottom: 12 }}>
          <label style={LABEL_STYLE}>Name *</label>
          <Controller
            name="Name"
            control={control}
            render={({ field, fieldState }) => (
              <>
                <Input
                  {...field}
                  placeholder="e.g. Rent"
                  status={fieldState.error ? 'error' : undefined}
                  autoFocus
                />
                <div style={ERR_STYLE}>{fieldState.error?.message ?? ''}</div>
              </>
            )}
          />
        </div>

        <div style={{ marginBottom: 12 }}>
          <label style={LABEL_STYLE}>Active</label>
          <Controller
            name="IsActive"
            control={control}
            render={({ field }) => (
              <Switch checked={field.value} onChange={field.onChange} />
            )}
          />
        </div>
      </form>
    </Drawer>
  );
}