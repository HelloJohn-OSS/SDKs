# HelloJohn — React SPA Example

> Example React Single-Page Application with full HelloJohn authentication flow.

Built with **Vite + React 19 + React Router 7**. Demonstrates:
- **OAuth2 PKCE flow** — `loginWithRedirect()` + `handleRedirectCallback()`
- **Credential login** — direct email/password via `loginWithPassword()`
- **`useAuth()` hook** — reactive auth state with `isAuthenticated`, `isLoading`, `user`
- **`<UserButton />`** — pre-built user avatar/dropdown component
- **Protected routes** — redirect to `/login` when unauthenticated
- **Registration** — `register()` + auto-login

Port: `5173` (Vite default)

---

## Prerequisites

- Node.js 18+
- A running HelloJohn instance or a cloud tenant
- An OAuth2 **public** client (no secret required for SPAs)
- Redirect URI `http://localhost:5173/callback` added to the client whitelist

---

## Setup

```bash
cd sdks/examples/react-spa
cp .env.example .env.local     # edit the values below
npm install
```

**.env.local:**
```bash
VITE_HELLOJOHN_DOMAIN=http://localhost:8080
VITE_HELLOJOHN_CLIENT_ID=cli_xxx
VITE_HELLOJOHN_TENANT_SLUG=mi-app
```

---

## Run

```bash
npm run dev
# → http://localhost:5173
```

---

## Pages / Routes

| Route | Auth | Description |
|-------|------|-------------|
| `/` | Public | Dashboard — shows user info if logged in, Sign In links if not |
| `/login` | Redirect if authed | Login with email/password + Google OAuth button |
| `/register` | Redirect if authed | Registration form with auto-login |
| `/callback` | — | OAuth2 PKCE callback handler |
| `/profile` | Protected | User profile from `useAuth()` |

---

## Key Code

**Provider setup:**
```tsx
// main.tsx
import { AuthProvider } from "@hellojohn/react";

createRoot(document.getElementById("root")).render(
  <AuthProvider
    domain={import.meta.env.VITE_HELLOJOHN_DOMAIN}
    clientId={import.meta.env.VITE_HELLOJOHN_CLIENT_ID}
    tenantSlug={import.meta.env.VITE_HELLOJOHN_TENANT_SLUG}
  >
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </AuthProvider>
);
```

**Using the hook:**
```tsx
// Any component
import { useAuth, UserButton } from "@hellojohn/react";

function Navbar() {
  const { isAuthenticated, isLoading } = useAuth();
  
  if (isLoading) return <span>Loading...</span>;
  return isAuthenticated ? <UserButton /> : <a href="/login">Sign In</a>;
}
```

**Protected route:**
```tsx
import { useAuth } from "@hellojohn/react";
import { Navigate } from "react-router-dom";

function ProtectedPage() {
  const { isAuthenticated, isLoading } = useAuth();
  if (isLoading) return null;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return <div>Secret content</div>;
}
```

**OAuth2 PKCE login:**
```tsx
import { useAuth } from "@hellojohn/react";

function LoginPage() {
  const { loginWithRedirect } = useAuth();
  return (
    <button onClick={() => loginWithRedirect({ provider: "google" })}>
      Sign in with Google
    </button>
  );
}
```

---

## Build

```bash
npm run build   # outputs to dist/
npm run preview # preview production build
```

---

## Related

- [`@hellojohn/react` SDK](../../react/README.md)
- [`@hellojohn/js` SDK](../../js/README.md) (browser SDK used internally)
- [Next.js example](../nextjs-app/README.md) for SSR auth
