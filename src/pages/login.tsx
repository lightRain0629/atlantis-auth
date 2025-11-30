import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useLoginMutation, useMeQuery } from "@/services/api";
import { toast } from "sonner";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Loader2 } from "lucide-react";

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

type FormValues = z.infer<typeof schema>;

export default function LoginPage() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const { data: me } = useMeQuery();
  const [login, { isLoading }] = useLoginMutation();
  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
  } = useForm<FormValues>({ resolver: zodResolver(schema) });
  useEffect(() => {
    const emailParam = params.get("email");
    if (emailParam) setValue("email", emailParam);
  }, [params, setValue]);

  useEffect(() => {
    if (me) {
      navigate("/todos", { replace: true });
    }
  }, [me, navigate]);

  const onSubmit = async (values: FormValues) => {
    try {
      await login(values).unwrap();
      toast.success("Welcome back!");
      navigate("/todos");
    } catch (err: any) {
      const message = err?.data?.message ?? "Failed to login";
      toast.error(message);
    }
  };

  const startProvider = (provider: "google" | "yandex") => {
    window.location.href = `http://localhost:3000/api/auth/${provider}`;
  };

  return (
    <div className="max-w-xl mx-auto">
      <Card className="shadow-md border-slate-200">
        <CardHeader>
          <CardTitle className="text-2xl">Login</CardTitle>
          <CardDescription>
            Authenticate to manage todos and sessions. Device ID is generated automatically per browser.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" placeholder="you@example.com" {...register("email")} />
              {errors.email && <p className="text-sm text-red-500">{errors.email.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input id="password" type="password" placeholder="••••••" {...register("password")} />
              {errors.password && <p className="text-sm text-red-500">{errors.password.message}</p>}
            </div>

            <Button className="w-full" type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Login
            </Button>
          </form>

          <div className="grid grid-cols-2 gap-2">
            <Button variant="outline" onClick={() => startProvider("google")}>
              Login with Google
            </Button>
            <Button variant="outline" onClick={() => startProvider("yandex")}>
              Login with Yandex
            </Button>
          </div>

          <div className="flex flex-wrap gap-2 text-sm text-muted-foreground">
            <Button variant="ghost" className="px-0 text-primary" onClick={() => navigate("/register")}>
              Create account
            </Button>
            <span>·</span>
            <Button variant="ghost" className="px-0 text-primary" onClick={() => navigate("/forgot-password")}>
              Forgot password?
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
