import { Link, useLocation, useNavigate } from "react-router-dom";
import { Button } from "./ui/button";
import { useAppSelector } from "@/hooks";
import { useLogoutCurrentMutation, useMeQuery } from "@/services/api";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Loader2, LogOut, Menu, X } from "lucide-react";
import React from "react";
import LanguageSwitcher from "./language-switcher";
import Logo from "./logo";
import { useTranslation } from "react-i18next";

type LayoutProps = {
  children: React.ReactNode;
};

const navLinks = [
  { to: "/finance", label: "Finance", auth: true },
  { to: "/todos", label: "Todos", auth: true },
  { to: "/sessions", label: "Sessions", auth: true },
  { to: "/users", label: "Users", admin: true },
];

export default function Layout({ children }: LayoutProps) {
  const { t } = useTranslation();
  const accessToken = useAppSelector((s) => s.auth.accessToken);
  const navigate = useNavigate();
  const location = useLocation();
  const { data: me } = useMeQuery(undefined, { skip: !accessToken });
  const [logout, { isLoading: isLoggingOut }] = useLogoutCurrentMutation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);

  const isAuthenticated = !!accessToken;
  const isAdmin = me?.roles?.includes("ADMIN");
  const visibleLinks = React.useMemo(
    () =>
      navLinks.filter((link) => {
        if (link.admin && !isAdmin) return false;
        if (link.auth && !isAuthenticated) return false;
        return true;
      }),
    [isAdmin, isAuthenticated]
  );

  const handleLogout = async () => {
    try {
      await logout().unwrap();
      toast.success(t("auth.loggedOut"));
    } catch (err) {
      // toast.error("Failed to logout");
    } finally {
      navigate("/login");
    }
  };

  React.useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 text-slate-900">
      <header className="border-b bg-white/80 backdrop-blur sticky top-0 z-40">
        <div className="container flex items-center justify-between py-4 gap-4">
          <div className="flex items-center gap-3">
            <Link
              to="/"
              className="flex items-center gap-2 font-semibold text-lg"
            >
              <Logo alt={t("app.name")} />
              <span className="hidden sm:inline">{t("app.name")}</span>
            </Link>
          </div>

          <nav className="hidden md:flex items-center gap-2 text-sm">
            {visibleLinks.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className={cn(
                  "rounded-md px-3 py-2 transition hover:bg-slate-100",
                  location.pathname === link.to &&
                    "bg-slate-900 text-white hover:bg-slate-900"
                )}
              >
                {t(`nav.${link.label.toLowerCase()}`)}
              </Link>
            ))}
          </nav>

          <div className="hidden md:flex items-center gap-3">
            <LanguageSwitcher />
            {isAuthenticated ? (
              <>
                <div className="hidden sm:flex flex-col text-right text-xs text-muted-foreground">
                  <span>{me?.email}</span>
                  {me?.roles && (
                    <span className="uppercase tracking-wide">
                      {me.roles.join(", ")}
                    </span>
                  )}
                </div>
                <Button
                  variant="outline"
                  onClick={handleLogout}
                  disabled={isLoggingOut}
                  className="flex items-center gap-2"
                >
                  {isLoggingOut ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <LogOut className="h-4 w-4" />
                  )}
                  {t("layout.logout")}
                </Button>
              </>
            ) : (
              <>
                <Button variant="ghost" onClick={() => navigate("/login")}>
                  {t("layout.login")}
                </Button>
                <Button onClick={() => navigate("/register")}>
                  {t("layout.register")}
                </Button>
              </>
            )}
          </div>

          <div className="flex items-center gap-2 md:hidden">
            <Button
              variant="outline"
              size="icon"
              onClick={() => setIsMobileMenuOpen((prev) => !prev)}
              aria-label={
                isMobileMenuOpen
                  ? t("layout.closeMenu", { defaultValue: "Close menu" })
                  : t("layout.openMenu", { defaultValue: "Open menu" })
              }
            >
              {isMobileMenuOpen ? (
                <X className="h-5 w-5" />
              ) : (
                <Menu className="h-5 w-5" />
              )}
            </Button>
          </div>
        </div>
      </header>

      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 z-[70] bg-black/40 md:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        >
          <div
            className="absolute right-0 top-0 flex h-full w-80 max-w-[85vw] flex-col bg-white shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b px-4 py-3">
              <div className="flex items-center gap-3">
                <Logo alt={t("app.name")} />
                <div className="flex flex-col">
                  <span className="font-semibold leading-tight">
                    {t("app.name")}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {t("app.tagline")}
                  </span>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsMobileMenuOpen(false)}
                aria-label={t("common.close")}
              >
                <X className="h-5 w-5" />
              </Button>
            </div>

            <div className="flex-1 overflow-y-auto px-4 py-5">
              <div className="flex flex-col gap-2">
                {visibleLinks.map((link) => (
                  <Link
                    key={link.to}
                    to={link.to}
                    className={cn(
                      "rounded-md px-3 py-2 text-base transition hover:bg-slate-100",
                      location.pathname === link.to &&
                        "bg-slate-900 text-white hover:bg-slate-900"
                    )}
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    {t(`nav.${link.label.toLowerCase()}`)}
                  </Link>
                ))}
              </div>

              <div className="my-5 border-t" />

              <div className="flex flex-col gap-4">
                <LanguageSwitcher />

                {isAuthenticated ? (
                  <div className="flex flex-col gap-3">
                    <div className="rounded-md border bg-slate-50 px-3 py-2 text-sm">
                      <div className="font-semibold">{me?.email}</div>
                      {me?.roles && (
                        <div className="text-xs uppercase tracking-wide text-muted-foreground">
                          {me.roles.join(", ")}
                        </div>
                      )}
                    </div>
                    <Button
                      variant="outline"
                      onClick={handleLogout}
                      disabled={isLoggingOut}
                      className="w-full justify-start gap-2"
                    >
                      {isLoggingOut ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <LogOut className="h-4 w-4" />
                      )}
                      {t("layout.logout")}
                    </Button>
                  </div>
                ) : (
                  <div className="flex flex-col gap-2">
                    <Button
                      variant="ghost"
                      className="w-full justify-start"
                      onClick={() => navigate("/login")}
                    >
                      {t("layout.login")}
                    </Button>
                    <Button
                      className="w-full justify-start"
                      onClick={() => navigate("/register")}
                    >
                      {t("layout.register")}
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
      <main className="container py-8">{children}</main>
    </div>
  );
}
