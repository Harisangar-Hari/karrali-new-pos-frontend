import { useEffect, useMemo } from 'react';
import {
  Drawer,
  Input,
  Switch,
  Button,
  Flex,
  Grid,
  TreeSelect,
  App,
} from 'antd';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  useCreateCategory,
  useUpdateCategory,
} from '@/hooks/queries/useCategories';
import { useCategoriesLookup } from '@/hooks/queries/useLookups';
import { getErrorMessage } from '@/lib/api';
import type { CategoryRow } from '@/types/category';

const { useBreakpoint } = Grid;

const schema = z.object({
  Name: z.string().min(1, 'Required').max(100),
  Description: z.string().max(500).optional().or(z.literal('')),
  ParentId: z.string().uuid().nullable().optional().or(z.literal('')),
  IsActive: z.boolean(),
});

type Form = z.infer<typeof schema>;

interface Props {
  open: boolean;
  category?: CategoryRow | null;
  onClose: () => void;
}

interface TreeNode {
  title: string;
  value: string;
  children?: TreeNode[];
}

/**
 * Build a nested TreeSelect structure from a flat lookup list.
 * `excludeIds` prunes subtrees we can't select (self + descendants).
 */
function buildTree(
  flat: { Id: string; Name: string; ParentId?: string | null }[],
  excludeIds: Set<string>,
): TreeNode[] {
  const childrenOf = new Map<string | null, typeof flat>();
  for (const c of flat) {
    const key = c.ParentId ?? null;
    const bucket = childrenOf.get(key) ?? [];
    bucket.push(c);
    childrenOf.set(key, bucket);
  }

  const build = (parentId: string | null): TreeNode[] => {
    const kids = childrenOf.get(parentId) ?? [];
    return kids
      .filter((c) => !excludeIds.has(c.Id))
      .map((c) => ({
        title: c.Name,
        value: c.Id,
        children: build(c.Id),
      }));
  };

  return build(null);
}

function findDescendants(
  flat: { Id: string; ParentId?: string | null }[],
  rootId: string,
): Set<string> {
  const childrenOf = new Map<string, string[]>();
  for (const c of flat) {
    if (c.ParentId) {
      const arr = childrenOf.get(c.ParentId) ?? [];
      arr.push(c.Id);
      childrenOf.set(c.ParentId, arr);
    }
  }
  const out = new Set<string>();
  const stack = [rootId];
  while (stack.length) {
    const cur = stack.pop()!;
    for (const child of childrenOf.get(cur) ?? []) {
      if (!out.has(child)) {
        out.add(child);
        stack.push(child);
      }
    }
  }
  return out;
}

function buildDefaults(category?: CategoryRow | null): Form {
  if (!category) {
    return { Name: '', Description: '', ParentId: '', IsActive: true };
  }
  return {
    Name: category.Name,
    Description: category.Description ?? '',
    ParentId: category.ParentId ?? '',
    IsActive: category.IsActive,
  };
}

export function CategoryFormDrawer({ open, category, onClose }: Props) {
  const { message } = App.useApp();
  const screens = useBreakpoint();
  const isMobile = !screens.md;
  const isEdit = !!category;

  const { data: allCategories = [] } = useCategoriesLookup();
  const createMutation = useCreateCategory();
  const updateMutation = useUpdateCategory(category?.Id ?? '');

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

  // Prune self + descendants from parent options when editing.
  const treeData = useMemo(() => {
    const exclude = new Set<string>();
    if (category) {
      exclude.add(category.Id);
      for (const id of findDescendants(allCategories, category.Id)) {
        exclude.add(id);
      }
    }
    return buildTree(allCategories, exclude);
  }, [allCategories, category]);

  const onSubmit = async (values: Form) => {
    const payload = {
      Name: values.Name,
      Description: values.Description || undefined,
      ParentId: values.ParentId || null,
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
      title={isEdit ? 'Edit category' : 'New category'}
      open={open}
      onClose={submitting ? undefined : onClose}
      width={isMobile ? '100%' : 460}
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
        <Field label="Name *">
          <Controller
            name="Name"
            control={control}
            render={({ field, fieldState }) => (
              <>
                <Input
                  {...field}
                  placeholder="e.g. Beverages"
                  status={fieldState.error ? 'error' : undefined}
                  autoFocus
                />
                <div style={ERR_STYLE}>{fieldState.error?.message ?? ''}</div>
              </>
            )}
          />
        </Field>

        <Field label="Description">
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
        </Field>

        <Field label="Parent category">
          <Controller
            name="ParentId"
            control={control}
            render={({ field, fieldState }) => (
              <>
                <TreeSelect
                  value={field.value || undefined}
                  onChange={(v) => field.onChange(v ?? '')}
                  treeData={treeData}
                  treeDefaultExpandAll
                  placeholder="Root (no parent)"
                  allowClear
                  showSearch
                  treeNodeFilterProp="title"
                  style={{ width: '100%' }}
                  status={fieldState.error ? 'error' : undefined}
                />
                <div style={ERR_STYLE}>{fieldState.error?.message ?? ''}</div>
              </>
            )}
          />
        </Field>

        <Field label="Active">
          <Controller
            name="IsActive"
            control={control}
            render={({ field }) => (
              <Switch checked={field.value} onChange={field.onChange} />
            )}
          />
        </Field>
      </form>
    </Drawer>
  );
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

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div style={{ marginBottom: 12 }}>
      <label style={LABEL_STYLE}>{label}</label>
      {children}
    </div>
  );
}