export type UserRole = "Super Admin" | "Admin" | "Manager" | "Member";
export type UserStatus = "active" | "inactive" | "suspended";

export interface UserItem {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  department: string;
  status: UserStatus;
  avatar: string;
  createdAt: string;
}
