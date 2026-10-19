import type { PaginationParams } from './common';

export interface UserRoleRef {
  Id: string;
  Name: string;
  IsSystem: boolean;
}

export interface UserRoleJoin {
  Id: string;
  UserId: string;
  RoleId: string;
  Role: UserRoleRef;
}

export interface UserRow {
  Id: string;
  Username: string;
  FullName: string | null;
  Email: string | null;
  IsActive: boolean;
  LastLogin: string | null;
  SessionVersion: number;
  CreatedAt: string;
  UpdatedAt: string;
  DeletedAt: string | null;
  UserRoles: UserRoleJoin[];
}

export interface RoleOption {
  Id: string;
  Name: string;
  Description: string | null;
  IsSystem: boolean;
}

export interface CreateUserInput {
  Username: string;
  Password: string;
  FullName?: string;
  Email?: string;
  IsActive?: boolean;
  RoleIds: string[];
}

export interface UpdateUserInput {
  FullName?: string;
  Email?: string;
  IsActive?: boolean;
}

export interface AssignRolesInput {
  RoleIds: string[];
}

export interface ChangePasswordInput {
  OldPassword: string;
  NewPassword: string;
}

export interface ResetPasswordInput {
  NewPassword: string;
}

export interface QueryUserParams extends PaginationParams {
  IsActive?: boolean;
  RoleId?: string;
  includeDeleted?: boolean;
}

export type UserSortField = 'Username' | 'FullName' | 'CreatedAt' | 'LastLogin';