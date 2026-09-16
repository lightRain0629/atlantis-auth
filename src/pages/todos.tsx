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
import { Modal, ModalFooter } from "@/components/ui/modal";
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
            t("todos.titleRequired", { defaultValue: "Title is required" }),
          ),
      }),
    [t],
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
        <CardHeader className="gap-3 sm:flex-row sm:items-center sm:justify-between sm:space-y-0">
          <div>
            <CardTitle>{t("todos.heading")}</CardTitle>
            <CardDescription>{t("todos.description")}</CardDescription>
          </div>
          {/* The search field owns the row on a phone; the actions sit beside it. */}
          <div className="flex items-center gap-2">
            <div className="relative flex-1 sm:w-44 sm:flex-none">
              <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                className="pl-8"
                type="search"
                inputMode="search"
                placeholder={t("todos.searchPlaceholder")}
                aria-label={t("todos.searchPlaceholder")}
              />
            </div>
            <Button
              size="sm"
              className="flex-shrink-0 text-white"
              onClick={openCreate}
            >
              <Plus className="h-4 w-4 text-white sm:mr-1" />
              <span className="hidden sm:inline text-white">
                {t("todos.add")}
              </span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="flex-shrink-0"
              onClick={() => refetch()}
            >
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
                className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 rounded-lg border border-border/70 bg-white px-4 py-3 shadow-sm"
              >
                <div className="flex flex-col gap-1 min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      className="-m-2 flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full text-primary transition-colors hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      onClick={() => toggleComplete(todo.id, todo.isCompleted)}
                      aria-label={t("todos.toggleComplete", {
                        defaultValue: "Toggle complete",
                      })}
                    >
                      {todo.isCompleted ? (
                        <CheckCircle className="h-5 w-5 text-green-600" />
                      ) : (
                        <CircleDashed className="h-5 w-5" />
                      )}
                    </button>
                    <p
                      className={`break-words ${
                        todo.isCompleted
                          ? "line-through text-muted-foreground"
                          : ""
                      }`}
                    >
                      {todo.title}
                    </p>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {t("todos.updated")}{" "}
                    {new Date(todo.updatedAt).toLocaleString()}
                  </p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-11 w-11 flex-shrink-0 p-0 sm:h-9 sm:w-9"
                    onClick={() => openEdit(todo)}
                    aria-label={t("todos.edit")}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-11 w-11 flex-shrink-0 p-0 sm:h-9 sm:w-9"
                    onClick={() => toggleComplete(todo.id, todo.isCompleted)}
                    aria-label={t("todos.toggleComplete", {
                      defaultValue: "Toggle complete",
                    })}
                  >
                    {isUpdating && updateArgs?.id === todo.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : todo.isCompleted ? (
                      <CircleDashed className="h-4 w-4" />
                    ) : (
                      <CheckCircle className="h-4 w-4" />
                    )}
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    className="h-11 w-11 flex-shrink-0 p-0 sm:h-9 sm:w-9"
                    onClick={() => removeTodo(todo.id)}
                    aria-label={t("common.delete")}
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
          <div className="flex flex-col gap-3 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
            <div>
              {t("common.pageOf", {
                current: data?.current_page ?? 1,
                total: data?.total_pages ?? 1,
              })}{" "}
              · {t("common.total", { count: data?.count ?? 0 })}
            </div>
            <div className="flex items-center gap-2 [&>button]:flex-1 sm:[&>button]:flex-none">
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
        <Modal
          title={t("todos.newTitle")}
          description={t("todos.newDescription")}
          onClose={closeCreate}
        >
          <form
            className="space-y-3"
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
            <ModalFooter>
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
            </ModalFooter>
          </form>
        </Modal>
      )}
      {editing && (
        <Modal
          title={t("todos.edit")}
          description={t("todos.editDescription")}
          onClose={closeEdit}
        >
          <div className="space-y-3">
            <Label htmlFor="edit-title">{t("todos.titleLabel")}</Label>
            <Input
              id="edit-title"
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              autoFocus
            />
            <ModalFooter>
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
            </ModalFooter>
          </div>
        </Modal>
      )}
    </div>
  );
}
