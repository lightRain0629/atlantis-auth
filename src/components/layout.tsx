import { Link, useLocation, useNavigate } from "react-router-dom";
import { Button } from "./ui/button";
import { useAppSelector } from "@/hooks";
import { useLogoutCurrentMutation, useMeQuery } from "@/services/api";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Loader2, LogOut } from "lucide-react";
import React from "react";

type LayoutProps = {
  children: React.ReactNode;
};

const navLinks = [
  { to: "/todos", label: "Todos", auth: true },
  { to: "/sessions", label: "Sessions", auth: true },
  { to: "/users", label: "Users", admin: true },
];

export default function Layout({ children }: LayoutProps) {
  const accessToken = useAppSelector((s) => s.auth.accessToken);
  const navigate = useNavigate();
  const location = useLocation();
  const { data: me } = useMeQuery(undefined, { skip: !accessToken });
  const [logout, { isLoading: isLoggingOut }] = useLogoutCurrentMutation();

  const isAuthenticated = !!accessToken;
  const isAdmin = me?.roles?.includes("ADMIN");

  const handleLogout = async () => {
    try {
      await logout().unwrap();
      toast.success("Logged out");
    } catch (err) {
      // toast.error("Failed to logout");
    } finally {
      navigate("/login");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 text-slate-900">
      <header className="border-b bg-white/80 backdrop-blur">
        <div className="container flex items-center justify-between py-4 gap-4">
          <Link to="/" className="flex items-center gap-2 font-semibold text-lg">
            <span className="h-10 w-10 rounded-lg bg-primary text-primary-foreground grid place-items-center font-bold">
              A
            </span>
            <span>Atlantis Auth</span>
          </Link>
          <nav className="flex items-center gap-2 text-sm">
            {navLinks.map((link) => {
              if (link.admin && !isAdmin) return null;
              if (link.auth && !isAuthenticated) return null;
              return (
                <Link
                  key={link.to}
                  to={link.to}
                  className={cn(
                    "rounded-md px-3 py-2 transition hover:bg-slate-100",
                    location.pathname === link.to && "bg-slate-900 text-white hover:bg-slate-900",
                  )}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>
          <div className="flex items-center gap-3">
            {isAuthenticated ? (
              <>
                <div className="hidden sm:flex flex-col text-right text-xs text-muted-foreground">
                  <span>{me?.email}</span>
                  {me?.roles && <span className="uppercase tracking-wide">{me.roles.join(", ")}</span>}
                </div>
                <Button
                  variant="outline"
                  onClick={handleLogout}
                  disabled={isLoggingOut}
                  className="flex items-center gap-2"
                >
                  {isLoggingOut ? <Loader2 className="h-4 w-4 animate-spin" /> : <LogOut className="h-4 w-4" />}
                  Logout
                </Button>
              </>
            ) : (
              <>
                <Button variant="ghost" onClick={() => navigate("/login")}>
                  Login
                </Button>
                <Button onClick={() => navigate("/register")}>Register</Button>
              </>
            )}
          </div>
        </div>
      </header>
      <main className="container py-8">{children}</main>
    </div>
  );
}
