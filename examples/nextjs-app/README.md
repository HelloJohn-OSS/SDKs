# HelloJohn — Next.js App Example

> Example Next.js 16 application with SSR authentication using HelloJohn.

Demonstrates:
- **Server-side auth** — validate JWT in Server Components and API Routes using `@hellojohn/node`
- **Client-side auth** — `useAuth()`, `<UserButton />`, protected pages using `@hellojohn/react`
- **Middleware** — redirect unauthenticated users server-side
- **Session passing** — access token forwarded from server to client components

Port: `3003`

---

## Prerequisites

- Node.js 18+
- A running HelloJohn instance or a cloud tenant
- An OAuth2 public client for the Next.js frontend

---

## Setup

```bash
cd sdks/examples/nextjs-app
cp .env.example .env.local     # edit the values below
npm install
```

**.env.local:**
```bash
NEXT_PUBLIC_HELLOJOHN_DOMAIN=http://localhost:8080
NEXT_PUBLIC_HELLOJOHN_CLIENT_ID=cli_xxx
NEXT_PUBLIC_HELLOJOHN_TENANT_SLUG=mi-app
# Server-side only (for API routes)
HELLOJOHN_DOMAIN=http://localhost:8080
```

---

## Run

```bash
npm run dev
# → http://localhost:3003
```

---

## Pages

| Path | Auth | Description |
|------|------|-------------|
| `/` | Public | Landing page with Sign In button |
| `/dashboard` | Protected (client-side) | User dashboard, shows profile from `useAuth()` |
| `/profile` | Protected (server-side) | SSR page that reads JWT in Server Component |
| `/api/me` | API Route, `requireAuth()` | Returns current user claims as JSON |

---

## Architecture

```
app/
├── layout.tsx          ← <AuthProvider> wraps the whole app (client component)
├── page.tsx            ← Public landing, <SignIn /> button
├── dashboard/
│   └── page.tsx        ← useAuth() hook, redirects if not logged in
├── profile/
│   └── page.tsx        ← Server Component, verifies JWT with @hellojohn/node
└── api/
    └── me/route.ts     ← API Route with requireAuth() middleware
lib/
└── auth.ts             ← Shared server-side HelloJohn client
```

---

## Key Code

**Client component (AuthProvider):**
```tsx
// app/layout.tsx
import { AuthProvider } from "@hellojohn/react";

export default function RootLayout({ children }) {
  return (
    <AuthProvider
      domain={process.env.NEXT_PUBLIC_HELLOJOHN_DOMAIN}
      clientId={process.env.NEXT_PUBLIC_HELLOJOHN_CLIENT_ID}
      tenantSlug={process.env.NEXT_PUBLIC_HELLOJOHN_TENANT_SLUG}
    >
      {children}
    </AuthProvider>
  );
}
```

**Server Component (SSR auth):**
```tsx
// app/profile/page.tsx
import { createHelloJohnServer } from "@hellojohn/node";
import { cookies } from "next/headers";

export default async function ProfilePage() {
  const hj = createHelloJohnServer({ domain: process.env.HELLOJOHN_DOMAIN });
  const token = cookies().get("hj_access_token")?.value;
  const claims = await hj.verifyToken(token);
  
  return <pre>{JSON.stringify(claims, null, 2)}</pre>;
}
```

**API Route:**
```ts
// app/api/me/route.ts
import { requireAuth } from "@hellojohn/node/next";

export const GET = requireAuth(async (req) => {
  return Response.json({ userId: req.auth.userId, roles: req.auth.roles });
});
```

---

## Related

- [`@hellojohn/react` SDK](../../react/README.md)
- [`@hellojohn/node` SDK](../../node/README.md)
- [React SPA example](../react-spa/README.md)
