import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ShieldCheck, ListChecks, Users } from "lucide-react";

export default function HomePage() {
  const features = [
    {
      icon: ShieldCheck,
      title: "Auth flows",
      description: "Login, register, email verification, social OAuth, password reset, sessions management.",
    },
    {
      icon: ListChecks,
      title: "Todos",
      description: "Personal todo list with create, update, complete, and soft delete.",
    },
    {
      icon: Users,
      title: "Admin tools",
      description: "Admins can browse, update roles, or remove users.",
    },
  ];

  return (
    <div className="grid gap-10 lg:grid-cols-[2fr,1fr]">
      <div className="space-y-8">
        <div className="space-y-4">
          <p className="rounded-full bg-slate-900 text-white inline-flex px-4 py-1 text-xs uppercase tracking-wide">
            Backend-ready React client
          </p>
          <h1 className="text-4xl sm:text-5xl font-semibold leading-tight">
            Auth, sessions, todos, and admin users—wired to your NestJS API.
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl">
            Shadcn-styled UI with Redux Toolkit + RTK Query, aware of refresh tokens, devices, and roles.
          </p>
          <div className="flex flex-wrap gap-3">
            <Button asChild size="lg">
              <Link to="/login">Login</Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link to="/register">Create account</Link>
            </Button>
            <Button asChild variant="ghost" size="lg">
              <a href="http://localhost:3000/api/docs" target="_blank" rel="noreferrer">
                Backend docs
              </a>
            </Button>
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          {features.map((item) => (
            <Card key={item.title} className="border-border/70">
              <CardHeader className="flex flex-row items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-slate-900 text-white grid place-items-center">
                  <item.icon className="h-5 w-5" />
                </div>
                <div>
                  <CardTitle className="text-lg">{item.title}</CardTitle>
                  <CardDescription>{item.description}</CardDescription>
                </div>
              </CardHeader>
            </Card>
          ))}
        </div>
      </div>
      <Card className="self-start border-slate-200 shadow-md">
        <CardHeader>
          <CardTitle>Quick links</CardTitle>
          <CardDescription>Start with auth, then manage sessions and todos.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <Link className="block rounded-md border px-4 py-3 hover:bg-slate-50" to="/register">
            Register & verify email
          </Link>
          <Link className="block rounded-md border px-4 py-3 hover:bg-slate-50" to="/login">
            Login with device binding
          </Link>
          <Link className="block rounded-md border px-4 py-3 hover:bg-slate-50" to="/todos">
            Manage todos
          </Link>
          <Link className="block rounded-md border px-4 py-3 hover:bg-slate-50" to="/sessions">
            Inspect sessions & revoke tokens
          </Link>
          <Link className="block rounded-md border px-4 py-3 hover:bg-slate-50" to="/users">
            Admin users
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
