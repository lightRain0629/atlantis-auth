import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  useCreateTodoMutation,
  useDeleteTodoMutation,
  useGetTodosQuery,
  useUpdateTodoMutation,
  type TodoDto,
} from "@/services/api";
import { Loader2, CheckCircle, CircleDashed, Trash2, RefreshCw, Search, ChevronLeft, ChevronRight, Pencil } from "lucide-react";
import { toast } from "sonner";
import { useDebouncedValue } from "@/lib/use-debounce";

const schema = z.object({
  title: z.string().min(1, "Title is required"),
});

type FormValues = z.infer<typeof schema>;

export default function TodosPage() {
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
  const [updateTodo, { isLoading: isUpdating }] = useUpdateTodoMutation();
  const [deleteTodo] = useDeleteTodoMutation();
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema) });
  const [optimistic, setOptimistic] = useState(false);

  const onSubmit = async (values: FormValues) => {
    try {
      setOptimistic(true);
      await createTodo(values).unwrap();
      reset();
      toast.success("Todo added");
    } catch (err: any) {
      toast.error(err?.data?.message ?? "Failed to create todo");
    } finally {
      setOptimistic(false);
    }
  };

  const toggleComplete = async (id: string, current: boolean) => {
    try {
      await updateTodo({ id, data: { isCompleted: !current } }).unwrap();
    } catch (err: any) {
      toast.error(err?.data?.message ?? "Failed to update todo");
    }
  };

  const removeTodo = async (id: string) => {
    try {
      await deleteTodo(id).unwrap();
      toast.info("Todo removed");
    } catch (err: any) {
      toast.error(err?.data?.message ?? "Failed to remove todo");
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
      toast.success("Todo updated");
      closeEdit();
    } catch (err: any) {
      toast.error(err?.data?.message ?? "Failed to update todo");
    }
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[1.1fr,1fr]">
      <Card className="shadow-sm border-slate-200">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Todos</CardTitle>
            <CardDescription>Your personal tasks</CardDescription>
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
                placeholder="Search title"
                aria-label="Search todos"
              />
            </div>
            <Button variant="outline" size="sm" onClick={() => refetch()}>
              <RefreshCw className="h-4 w-4 mr-1" />
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {(isLoading || isFetching) && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Loading todos...</span>
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
                    <p className={todo.isCompleted ? "line-through text-muted-foreground" : ""}>{todo.title}</p>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Updated {new Date(todo.updatedAt).toLocaleString()}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" onClick={() => openEdit(todo)}>
                    <Pencil className="h-4 w-4 mr-1" />
                    Edit
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => toggleComplete(todo.id, todo.isCompleted)}>
                    Mark {todo.isCompleted ? "open" : "done"}
                  </Button>
                  <Button variant="destructive" size="sm" onClick={() => removeTodo(todo.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
            {todos.length === 0 && !isLoading && (
              <p className="text-muted-foreground text-sm">No todos yet. Add your first task.</p>
            )}
          </div>
          <div className="flex items-center justify-between text-sm text-muted-foreground">
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
      <Card className="shadow-sm border-slate-200">
        <CardHeader>
          <CardTitle>Add a todo</CardTitle>
          <CardDescription>Create a new item bound to your account.</CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-3" onSubmit={handleSubmit(onSubmit)}>
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input id="title" placeholder="Finish auth UI" {...register("title")} />
              {errors.title && <p className="text-sm text-red-500">{errors.title.message}</p>}
            </div>
            <Button className="w-full" type="submit" disabled={isCreating || optimistic}>
              {(isCreating || optimistic) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save todo
            </Button>
          </form>
        </CardContent>
      </Card>
      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 px-4">
          <div className="w-full max-w-md rounded-lg border border-border bg-white shadow-xl">
            <div className="flex items-center justify-between border-b px-4 py-3">
              <div>
                <h3 className="text-lg font-semibold">Edit todo</h3>
                <p className="text-sm text-muted-foreground">Update the title and save changes.</p>
              </div>
              <Button variant="ghost" size="sm" onClick={closeEdit}>
                Cancel
              </Button>
            </div>
            <div className="space-y-3 px-4 py-4">
              <Label htmlFor="edit-title">Title</Label>
              <Input
                id="edit-title"
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                autoFocus
              />
              <div className="flex justify-end gap-2 pt-1">
                <Button variant="outline" onClick={closeEdit} disabled={isUpdating}>
                  Close
                </Button>
                <Button onClick={saveEdit} disabled={isUpdating || !editValue.trim()}>
                  {isUpdating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Save
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
