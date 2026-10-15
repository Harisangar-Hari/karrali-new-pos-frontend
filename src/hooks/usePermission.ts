import { useAuthStore } from '@/stores/authStore';

/**
 * Returns true if the current user has the given permission code.
 * `*` acts as a wildcard (ADMIN role in seed). Frontend checks are for
 * UX only — the backend is always authoritative.
 */
export function usePermission(code: string): boolean {
  const user = useAuthStore((s) => s.user);
  if (!user) return false;
  if (user.Permissions.includes('*')) return true;
  return user.Permissions.includes(code);
}

export function useAnyPermission(...codes: string[]): boolean {
  const user = useAuthStore((s) => s.user);
  if (!user) return false;
  if (user.Permissions.includes('*')) return true;
  return codes.some((c) => user.Permissions.includes(c));
}

export function useAllPermissions(...codes: string[]): boolean {
  const user = useAuthStore((s) => s.user);
  if (!user) return false;
  if (user.Permissions.includes('*')) return true;
  return codes.every((c) => user.Permissions.includes(c));
}

export function useRole(role: string): boolean {
  const user = useAuthStore((s) => s.user);
  return !!user && user.Roles.includes(role);
}