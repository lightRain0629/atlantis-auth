export type TokensResponse = {
  accessToken: string;
  refreshToken: string;
};

export type JwtPayload = {
  id: string;
  email: string;
  roles: string[];
  agent: string;
  deviceId?: string | null;
};
