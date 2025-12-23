import { useState } from "react";
import {
  useDeleteUserMutation,
  useGetUsersQuery,
  useMeQuery,
  useUpdateUserMutation,
} from "@/services/api";
import type { UserDto } from "@/services/types";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import {
  Loader2,
  Shield,
  Trash2,
  UserPlus2,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
} from "lucide-react";
import { useDebouncedValue } from "@/lib/use-debounce";
import { useAppSelector } from "@/hooks";
import { useTranslation } from "react-i18next";

export default function UsersPage() {
  const { t } = useTranslation();
  const accessToken = useAppSelector((s) => s.auth.accessToken);

  const { data: me } = useMeQuery(undefined, { skip: !accessToken });
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebouncedValue(search);
  const limit = 10;

  const { data, isLoading, isFetching, refetch } = useGetUsersQuery({
    page,
    limit,
    query: debouncedSearch || undefined,
  });
  const [updateUser, { isLoading: saving }] = useUpdateUserMutation();
  const [deleteUser, { isLoading: deleting }] = useDeleteUserMutation();

  const users = data?.results ?? [];
  const hasPrev = Boolean(data?.previous);
  const hasNext = Boolean(data?.next);

  const toggleAdmin = async (user: UserDto) => {
    const isAdmin = user.roles.includes("ADMIN");
    const roles = isAdmin ? ["USER"] : ["ADMIN", "USER"];
    try {
      await updateUser({ id: user.id, email: user.email, roles }).unwrap();
      toast.success(t("users.updated", { email: user.email }));
      refetch();
    } catch (err: any) {
      toast.error(err?.data?.message ?? t("users.updateError"));
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteUser(id).unwrap();
      toast.success(t("users.removed"));
      refetch();
    } catch (err: any) {
      toast.error(err?.data?.message ?? t("users.removeError"));
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">{t("users.title")}</h1>
          <p className="text-sm text-muted-foreground">
            {t("users.description")}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Input
            placeholder={t("users.searchPlaceholder")}
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="max-w-xs"
          />
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            <RefreshCw className="h-4 w-4 mr-1" />
            {t("common.refresh")}
          </Button>
        </div>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>{t("users.title")}</CardTitle>
          <CardDescription>{t("users.description")}</CardDescription>
        </CardHeader>
        <CardContent className="divide-y">
          {isLoading && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>{t("users.loading")}</span>
            </div>
          )}
          {users.length === 0 && !isLoading && (
            <p className="text-sm text-muted-foreground">
              {t("users.empty")}
            </p>
          )}
          {users.map((user) => {
            const isAdmin = user.roles.includes("ADMIN");
            const isSelf = user.id === me?.id;
            return (
              <div
                key={user.id}
                className="flex flex-wrap items-center justify-between gap-3 py-4"
              >
                <div>
                  <p className="font-medium">{user.email}</p>
                  <p className="text-xs text-muted-foreground">
                    {t("users.roles")}: {user.roles.join(", ")} ·{" "}
                    {t("users.updatedAt")}:{" "}
                    {user.updatedAt
                      ? new Date(user.updatedAt).toLocaleString()
                      : "—"}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant={isAdmin ? "outline" : "default"}
                    onClick={() => toggleAdmin(user)}
                    disabled={saving || isSelf}
                  >
                    {isAdmin ? (
                      <>
                        <Shield className="h-4 w-4 mr-2" />
                        {t("users.removeAdmin")}
                      </>
                    ) : (
                      <>
                        <UserPlus2 className="h-4 w-4 mr-2" />
                        {t("users.makeAdmin")}
                      </>
                    )}
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={() => handleDelete(user.id)}
                    disabled={deleting || isSelf}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    {t("users.remove")}
                  </Button>
                </div>
              </div>
            );
          })}
          <div className="flex items-center justify-between pt-4 text-sm text-muted-foreground">
            <div>
              {t("common.pageOf", {
                current: data?.current_page ?? 1,
                total: data?.total_pages ?? 1,
              })}{" "}
              · {t("common.total", { count: data?.count ?? 0 })}
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={!hasPrev || isFetching}
              >
                <ChevronLeft className="h-4 w-4 mr-1" />
                {t("common.prev")}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => p + 1)}
                disabled={!hasNext || isFetching}
              >
                {t("common.next")}
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
