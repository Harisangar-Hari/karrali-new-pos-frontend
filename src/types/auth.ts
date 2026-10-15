/**
 * Mirrors the response shape of GET /api/auth/me and the `user` object
 * returned by POST /api/auth/login. The backend serialises PascalCase
 * (Prisma column names propagate through), so do NOT camelCase these.
 */
export interface AuthUser {
  Id: string;
  Username: string;
  FullName: string | null;
  Email: string | null;
  Roles: string[];
  Permissions: string[];
  LastLogin: string | null; // ISO 8601 timestamptz
}

export interface LoginRequest {
  username: string;
  password: string;
}

/**
 * POST /api/auth/login sets HttpOnly cookies and returns at minimum the
 * authenticated user. Tokens must never be relied upon from the body —
 * the session lives in HttpOnly cookies.
 */
export interface LoginResponse {
  user: AuthUser;
}