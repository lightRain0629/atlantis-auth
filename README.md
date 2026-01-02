# Atlantis

React + Vite (TS) client for the NestJS auth/todo backend. Uses Redux Toolkit + RTK Query, Tailwind (shadcn-style components), and React Router.

## Quick start

```bash
cd /atlantis
yarn install
yarn dev   # http://localhost:5173
```

Backend is expected at `http://localhost:3000/api` with refresh token cookies enabled.

## Features

- Auth flows: register/login (deviceId derived from browser fingerprint and sent via header), email verify + resend OTP, forgot/reset password, social OAuth buttons (Google/Yandex redirect to backend), token refresh via RTK Query baseQuery.
- Session management: list sessions, logout current/other/all devices.
- Todos: CRUD for the authenticated user, soft delete, complete toggle.
- Users (ADMIN): list all users, promote/demote admin, delete users.
- Guards/navigation: protected routes + admin gate, top navigation, toast feedback via `sonner`.

## Scripts

- `yarn dev` – start Vite dev server.
- `yarn build` – type-check and build for production.
- `yarn preview` – preview production build.

## Notes

- Access tokens live in Redux/localStorage for header injection; refresh tokens stay in HttpOnly cookies on the backend.
- If you keep a refresh cookie but clear localStorage, the first protected request will get 401, trigger refresh, and retry automatically.
- OAuth callbacks now have a frontend bridge at `/oauth/:provider` (google|yandex): it exchanges the `token` query param with the backend success endpoint and stores tokens. Update backend redirects to point to `http://localhost:5173/oauth/google?token=...` (or yandex) so the SPA can finish login.
# atlantis-auth
