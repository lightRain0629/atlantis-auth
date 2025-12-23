export type SessionInfo = {
  sessionId: string;
  device: string | null;
  userAgent: string | null;
  ip?: string | null;
  deviceId?: string | null;
  createdAt: string;
  exp: string;
  isCurrent: boolean;
};
