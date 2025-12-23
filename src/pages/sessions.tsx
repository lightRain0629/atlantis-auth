import {
  useListSessionsQuery,
  useLogoutAllMutation,
  useLogoutCurrentMutation,
  useLogoutOthersMutation,
} from "@/services/api";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, Power, ShieldOff, RefreshCw } from "lucide-react";
import { toast } from "sonner";

export default function SessionsPage() {
  const { data, isLoading, refetch } = useListSessionsQuery();
  const [logoutOthers, { isLoading: loggingOutOthers }] =
    useLogoutOthersMutation();
  const [logoutAll, { isLoading: loggingOutAll }] = useLogoutAllMutation();
  const [logoutCurrent, { isLoading: loggingOutCurrent }] =
    useLogoutCurrentMutation();

  const revokeOthers = async () => {
    try {
      const res = await logoutOthers().unwrap();
      toast.success(`Revoked ${res.revoked} other sessions`);
      refetch();
    } catch (err: any) {
      toast.error(err?.data?.message ?? "Failed to revoke sessions");
    }
  };

  const revokeAll = async () => {
    try {
      const res = await logoutAll().unwrap();
      toast.success(`Revoked ${res.revoked} sessions`);
    } catch (err: any) {
      toast.error(err?.data?.message ?? "Failed to revoke all sessions");
    }
  };

  const revokeCurrent = async () => {
    try {
      await logoutCurrent().unwrap();
    } catch (err: any) {
      toast.error(err?.data?.message);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="text-2xl font-semibold">Active sessions</h1>
        <Button variant="outline" size="sm" onClick={() => refetch()}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={revokeOthers}
            disabled={loggingOutOthers}
          >
            {loggingOutOthers && (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            )}
            Logout other devices
          </Button>
          <Button
            variant="destructive"
            onClick={revokeAll}
            disabled={loggingOutAll}
          >
            {loggingOutAll && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Logout all
          </Button>
          <Button
            variant="outline"
            onClick={revokeCurrent}
            disabled={loggingOutCurrent}
          >
            {loggingOutCurrent && (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            )}
            <Power className="h-4 w-4 mr-1" />
            Logout current
          </Button>
        </div>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Sessions list</CardTitle>
          <CardDescription>
            Includes device, user-agent, IP, and expiry.
          </CardDescription>
        </CardHeader>
        <CardContent className="divide-y">
          {isLoading && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Loading sessions...</span>
            </div>
          )}
          {data?.sessions?.length === 0 && (
            <p className="text-sm text-muted-foreground">No sessions found.</p>
          )}
          {data?.sessions?.map((session) => (
            <div
              key={session.sessionId}
              className="flex flex-wrap items-start justify-between gap-2 py-3"
            >
              <div className="space-y-1">
                <p className="font-medium">
                  {session.device ?? "Unknown device"}{" "}
                  {session.isCurrent && (
                    <span className="text-xs text-green-600 border border-green-200 bg-green-50 px-2 py-1 rounded-full">
                      current
                    </span>
                  )}
                </p>
                <p className="text-xs text-muted-foreground">
                  {session.userAgent}
                </p>
                <p className="text-xs text-muted-foreground">
                  IP: {session.ip ?? "—"} · DeviceId: {session.deviceId ?? "—"}
                </p>
              </div>
              <div className="text-right text-xs text-muted-foreground">
                <p>Created: {new Date(session.createdAt).toLocaleString()}</p>
                <p>Expires: {new Date(session.exp).toLocaleString()}</p>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
      <Card className="border-amber-200 bg-amber-50">
        <CardHeader className="flex flex-row items-center gap-3">
          <ShieldOff className="h-5 w-5 text-amber-600" />
          <div>
            <CardTitle>Tip</CardTitle>
            <CardDescription>
              Refresh tokens are stored in HttpOnly cookies. Access tokens stay
              in Redux and localStorage for routing.
            </CardDescription>
          </div>
        </CardHeader>
      </Card>
    </div>
  );
}
