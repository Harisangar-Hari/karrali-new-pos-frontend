import { useMemo } from 'react';
import type { MenuProps } from 'antd';
import { NAV_TREE, type NavNode } from '@/config/nav';
import { useAuthStore } from '@/stores/authStore';

type MenuItem = Required<MenuProps>['items'][number];

function hasPermission(userPerms: string[], required?: string[]): boolean {
  if (!required || required.length === 0) return true;
  if (userPerms.includes('*')) return true;
  return required.some((code) => userPerms.includes(code));
}

function filterTree(nodes: NavNode[], userPerms: string[]): NavNode[] {
  const result: NavNode[] = [];
  for (const node of nodes) {
    if (node.group) {
      const children = filterTree(node.children ?? [], userPerms);
      if (children.length > 0) result.push({ ...node, children });
      continue;
    }
    if (hasPermission(userPerms, node.permissions)) result.push(node);
  }
  return result;
}

function toMenuItems(nodes: NavNode[]): MenuItem[] {
  return nodes.map((node) => {
    if (node.group) {
      return {
        key: node.key,
        type: 'group' as const,
        label: node.label,
        children: toMenuItems(node.children ?? []),
      };
    }
    return {
      key: node.key,
      label: node.label,
      icon: node.icon,
      children: node.children ? toMenuItems(node.children) : undefined,
    };
  });
}

/**
 * Returns AntD-compatible menu items, filtered by the current user's
 * permissions. Empty groups are dropped. Memoized on user identity so
 * this doesn't rebuild on every render.
 */
export function useNavItems(): MenuItem[] {
  const user = useAuthStore((s) => s.user);
  const userId = user?.Id ?? null;
  const perms = user?.Permissions ?? [];

  return useMemo(() => {
    const filtered = filterTree(NAV_TREE, perms);
    return toMenuItems(filtered);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, perms]);
}