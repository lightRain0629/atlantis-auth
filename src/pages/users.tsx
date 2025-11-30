import { useState } from "react";
import {
  useDeleteUserMutation,
  useGetUsersQuery,
  useMeQuery,
  useUpdateUserMutation,
  type UserDto,
} from "@/services/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Loader2, Shield, Trash2, UserPlus2, ChevronLeft, ChevronRight, RefreshCw } from "lucide-react";
import { useDebouncedValue } from "@/lib/use-debounce";

export default function UsersPage() {
  const { data: me } = useMeQuery();
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
      toast.success(`Updated roles for ${user.email}`);
      refetch();
    } catch (err: any) {
      toast.error(err?.data?.message ?? "Failed to update roles");
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteUser(id).unwrap();
      toast.success("User removed");
      refetch();
    } catch (err: any) {
      toast.error(err?.data?.message ?? "Failed to delete user");
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Users</h1>
          <p className="text-sm text-muted-foreground">Admins can view and manage all users.</p>
        </div>
        <div className="flex items-center gap-2">
          <Input
            placeholder="Search by email"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="max-w-xs"
          />
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            <RefreshCw className="h-4 w-4 mr-1" />
            Refresh
          </Button>
        </div>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>User list</CardTitle>
          <CardDescription>Promote/demote admin role or delete users.</CardDescription>
        </CardHeader>
        <CardContent className="divide-y">
          {isLoading && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Loading users...</span>
            </div>
          )}
          {users.length === 0 && !isLoading && (
            <p className="text-sm text-muted-foreground">No users match your search.</p>
          )}
          {users.map((user) => {
            const isAdmin = user.roles.includes("ADMIN");
            const isSelf = user.id === me?.id;
            return (
              <div key={user.id} className="flex flex-wrap items-center justify-between gap-3 py-4">
                <div>
                  <p className="font-medium">{user.email}</p>
                  <p className="text-xs text-muted-foreground">
                    Roles: {user.roles.join(", ")} · Updated:{" "}
                    {user.updatedAt ? new Date(user.updatedAt).toLocaleString() : "—"}
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
                        Remove admin
                      </>
                    ) : (
                      <>
                        <UserPlus2 className="h-4 w-4 mr-2" />
                        Make admin
                      </>
                    )}
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={() => handleDelete(user.id)}
                    disabled={deleting || isSelf}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                  </Button>
                </div>
              </div>
            );
          })}
          <div className="flex items-center justify-between pt-4 text-sm text-muted-foreground">
            <div>
              Page {data?.current_page ?? 1} of {data?.total_pages ?? 1} · {data?.count ?? 0} total
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={!hasPrev || isFetching}
              >
                <ChevronLeft className="h-4 w-4 mr-1" />
                Prev
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => p + 1)}
                disabled={!hasNext || isFetching}
              >
                Next
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
