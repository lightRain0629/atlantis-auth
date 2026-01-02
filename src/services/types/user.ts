export type UserDto = {
  id: string;
  email: string;
  roles: string[];
  provider?: string | null;
  isVerified?: boolean;
  updatedAt?: string;
};
