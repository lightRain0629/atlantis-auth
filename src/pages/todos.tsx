import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  useCreateTodoMutation,
  useDeleteTodoMutation,
  useGetTodosQuery,
  useUpdateTodoMutation,
} from "@/services/api";
import type { TodoDto } from "@/services/types";
import {
  Loader2,
  CheckCircle,
  CircleDashed,
  Trash2,
  RefreshCw,
  Search,
  ChevronLeft,
  ChevronRight,
  Pencil,
  Plus,
} from "lucide-react";
import { toast } from "sonner";
import { useDebouncedValue } from "@/lib/use-debounce";
import { useTranslation } from "react-i18next";

type FormValues = {
  title: string;
};

export default function TodosPage() {
  const { t } = useTranslation();
  const schema = useMemo(
    () =>
      z.object({
        title: z
          .string()
          .min(
            1,
            t("todos.titleRequired", { defaultValue: "Title is required" })
          ),
      }),
    [t]
  );
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebouncedValue(search);
  const limit = 10;

  const { data, isLoading, isFetching, refetch } = useGetTodosQuery({
    page,
    limit,
    query: debouncedSearch || undefined,
  });
  const [createTodo, { isLoading: isCreating }] = useCreateTodoMutation();
  const [updateTodo, { isLoading: isUpdating, originalArgs: updateArgs }] =
    useUpdateTodoMutation();
  const [deleteTodo] = useDeleteTodoMutation();
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });
  const [optimistic, setOptimistic] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);

  const openCreate = () => {
    reset();
    setCreateOpen(true);
  };

  const closeCreate = () => {
    reset();
    setCreateOpen(false);
  };

  const onSubmit = async (values: FormValues) => {
    try {
      setOptimistic(true);
      await createTodo(values).unwrap();
      toast.success(t("todos.createSuccess"));
      closeCreate();
    } catch (err: any) {
      toast.error(err?.data?.message ?? t("todos.createError"));
    } finally {
      setOptimistic(false);
    }
  };

  const toggleComplete = async (id: string, current: boolean) => {
    try {
      await updateTodo({ id, data: { isCompleted: !current } }).unwrap();
    } catch (err: any) {
      toast.error(err?.data?.message ?? t("todos.updateError"));
    }
  };

  const removeTodo = async (id: string) => {
    try {
      await deleteTodo(id).unwrap();
      toast.info(t("todos.removeInfo"));
    } catch (err: any) {
      toast.error(err?.data?.message ?? t("todos.removeError"));
    }
  };

  const todos = data?.results ?? [];
  const hasPrev = Boolean(data?.previous);
  const hasNext = Boolean(data?.next);
  const [editing, setEditing] = useState<TodoDto | null>(null);
  const [editValue, setEditValue] = useState("");

  const openEdit = (todo: TodoDto) => {
    setEditing(todo);
    setEditValue(todo.title);
  };

  const closeEdit = () => {
    setEditing(null);
    setEditValue("");
  };

  const saveEdit = async () => {
    if (!editing) return;
    try {
      await updateTodo({ id: editing.id, data: { title: editValue } }).unwrap();
      toast.success(t("todos.updateSuccess"));
      closeEdit();
    } catch (err: any) {
      toast.error(err?.data?.message ?? t("todos.updateError"));
    }
  };

  return (
    <div className="space-y-6">
      <Card className="shadow-sm border-slate-200">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>{t("todos.heading")}</CardTitle>
            <CardDescription>{t("todos.description")}</CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="h-4 w-4 absolute left-2 top-2 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                className="pl-7 w-44"
                placeholder={t("todos.searchPlaceholder")}
                aria-label="Search todos"
              />
            </div>
            <Button size="sm" onClick={openCreate}>
              <Plus className="h-4 w-4 sm:mr-1 text-white" />
              <span className="hidden sm:inline">{t("todos.add")}</span>
            </Button>
            <Button variant="outline" size="sm" onClick={() => refetch()}>
              <RefreshCw className="h-4 w-4 sm:mr-1" />
              <span className="hidden sm:inline">{t("common.refresh")}</span>
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {(isLoading || isFetching) && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>{t("todos.loading")}</span>
            </div>
          )}
          <div className="grid gap-3">
            {todos.map((todo) => (
              <div
                key={todo.id}
                className="flex items-start justify-between rounded-lg border border-border/70 bg-white px-4 py-3 shadow-sm"
              >
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-2">
                    <button
                      className="text-primary"
                      onClick={() => toggleComplete(todo.id, todo.isCompleted)}
                      aria-label="Toggle complete"
                    >
                      {todo.isCompleted ? (
                        <CheckCircle className="h-5 w-5 text-green-600" />
                      ) : (
                        <CircleDashed className="h-5 w-5" />
                      )}
                    </button>
                    <p
                      className={
                        todo.isCompleted
                          ? "line-through text-muted-foreground"
                          : ""
                      }
                    >
                      {todo.title}
                    </p>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {t("todos.updated")}{" "}
                    {new Date(todo.updatedAt).toLocaleString()}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => openEdit(todo)}
                  >
                    <Pencil className="h-4 w-4 mr-1" />
                    {t("todos.edit")}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => toggleComplete(todo.id, todo.isCompleted)}
                  >
                    {isUpdating && updateArgs?.id === todo.id && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    {todo.isCompleted
                      ? t("todos.markOpen")
                      : t("todos.markDone")}
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => removeTodo(todo.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
            {todos.length === 0 && !isLoading && (
              <p className="text-muted-foreground text-sm">
                {t("todos.empty")}
              </p>
            )}
          </div>
          <div className="flex items-center justify-between text-sm text-muted-foreground">
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
                {t("common.prev", { defaultValue: "Prev" })}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => p + 1)}
                disabled={!hasNext || isFetching}
              >
                {t("common.next", { defaultValue: "Next" })}
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
      {createOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 px-4">
          <div className="w-full max-w-md rounded-lg border border-border bg-white shadow-xl">
            <div className="flex items-center justify-between border-b px-4 py-3">
              <div>
                <h3 className="text-lg font-semibold">{t("todos.newTitle")}</h3>
                <p className="text-sm text-muted-foreground">
                  {t("todos.newDescription")}
                </p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={closeCreate}
                disabled={isCreating || optimistic}
              >
                {t("common.cancel")}
              </Button>
            </div>
            <form
              className="space-y-3 px-4 py-4"
              onSubmit={handleSubmit(onSubmit)}
            >
              <div className="space-y-2">
                <Label htmlFor="title">{t("todos.titleLabel")}</Label>
                <Input
                  id="title"
                  placeholder={t("todos.titlePlaceholder")}
                  {...register("title")}
                  disabled={isCreating || optimistic}
                  autoFocus
                />
                {errors.title && (
                  <p className="text-sm text-red-500">{errors.title.message}</p>
                )}
              </div>
              <div className="flex justify-end gap-2 pt-1">
                <Button
                  variant="outline"
                  type="button"
                  onClick={closeCreate}
                  disabled={isCreating || optimistic}
                >
                  {t("common.close")}
                </Button>
                <Button type="submit" disabled={isCreating || optimistic}>
                  {(isCreating || optimistic) && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  {t("todos.save")}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 px-4">
          <div className="w-full max-w-md rounded-lg border border-border bg-white shadow-xl">
            <div className="flex items-center justify-between border-b px-4 py-3">
              <div>
                <h3 className="text-lg font-semibold">{t("todos.edit")}</h3>
                <p className="text-sm text-muted-foreground">
                  {t("todos.editDescription")}
                </p>
              </div>
              <Button variant="ghost" size="sm" onClick={closeEdit}>
                {t("common.cancel")}
              </Button>
            </div>
            <div className="space-y-3 px-4 py-4">
              <Label htmlFor="edit-title">{t("todos.titleLabel")}</Label>
              <Input
                id="edit-title"
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                autoFocus
              />
              <div className="flex justify-end gap-2 pt-1">
                <Button
                  variant="outline"
                  onClick={closeEdit}
                  disabled={isUpdating}
                >
                  {t("common.close")}
                </Button>
                <Button
                  onClick={saveEdit}
                  disabled={isUpdating || !editValue.trim()}
                >
                  {isUpdating && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  {t("common.save")}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
