import { useEffect } from 'react';
import {
  Drawer,
  Input,
  Switch,
  Button,
  Flex,
  Grid,
  App,
} from 'antd';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useCreateBrand, useUpdateBrand } from '@/hooks/queries/useBrands';
import { getErrorMessage } from '@/lib/api';
import type { BrandRow } from '@/types/brand';

const { useBreakpoint } = Grid;

const schema = z.object({
  Name: z.string().min(1, 'Required').max(100),
  Description: z.string().max(500).optional().or(z.literal('')),
  IsActive: z.boolean(),
});

type Form = z.infer<typeof schema>;

interface Props {
  open: boolean;
  brand?: BrandRow | null;
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

function buildDefaults(brand?: BrandRow | null): Form {
  if (!brand) {
    return { Name: '', Description: '', IsActive: true };
  }
  return {
    Name: brand.Name,
    Description: brand.Description ?? '',
    IsActive: brand.IsActive,
  };
}

export function BrandFormDrawer({ open, brand, onClose }: Props) {
  const { message } = App.useApp();
  const screens = useBreakpoint();
  const isMobile = !screens.md;
  const isEdit = !!brand;

  const createMutation = useCreateBrand();
  const updateMutation = useUpdateBrand(brand?.Id ?? '');

  const {
    control,
    handleSubmit,
    reset,
    formState: { isSubmitting },
  } = useForm<Form>({
    resolver: zodResolver(schema),
    defaultValues: buildDefaults(brand),
    mode: 'onTouched',
  });

  useEffect(() => {
    if (open) reset(buildDefaults(brand));
  }, [open, brand, reset]);

  const submitting =
    isSubmitting || createMutation.isPending || updateMutation.isPending;

  const onSubmit = async (values: Form) => {
    const payload = {
      Name: values.Name,
      Description: values.Description || undefined,
      IsActive: values.IsActive,
    };
    try {
      if (isEdit && brand) {
        await updateMutation.mutateAsync(payload);
        message.success('Brand updated');
      } else {
        await createMutation.mutateAsync(payload);
        message.success('Brand created');
      }
      onClose();
    } catch (err) {
      message.error(getErrorMessage(err));
    }
  };

  return (
    <Drawer
      title={isEdit ? 'Edit brand' : 'New brand'}
      open={open}
      onClose={submitting ? undefined : onClose}
      width={isMobile ? '100%' : 420}
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
            {isEdit ? 'Save changes' : 'Create brand'}
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
                  placeholder="e.g. Coca-Cola"
                  status={fieldState.error ? 'error' : undefined}
                  autoFocus
                />
                <div style={ERR_STYLE}>{fieldState.error?.message ?? ''}</div>
              </>
            )}
          />
        </div>

        <div style={{ marginBottom: 12 }}>
          <label style={LABEL_STYLE}>Description</label>
          <Controller
            name="Description"
            control={control}
            render={({ field }) => (
              <Input.TextArea
                {...field}
                value={field.value ?? ''}
                rows={3}
                maxLength={500}
                showCount
                placeholder="Optional"
              />
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