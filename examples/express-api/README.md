# HelloJohn — Express API Example

> Example Node.js/Express API protected with HelloJohn JWT verification, scopes, and RBAC.

Demonstrates:
- **Global middleware** — non-blocking, attaches `req.auth` to every request if a valid token is present
- **`requireAuth()`** — blocks unauthenticated requests
- **`requireScope(scope)`** — blocks requests without the required OAuth2 scope
- **`requireRole(role)`** — blocks requests without the required RBAC role
- **M2M (Machine-to-Machine)** — service-to-service auth without user context

---

## Prerequisites

- Node.js 18+
- A running HelloJohn instance or a cloud tenant
- An OAuth2 client created for this API (type: `confidential`)

---

## Setup

```bash
cd sdks/examples/express-api
cp .env.example .env           # edit HELLOJOHN_DOMAIN and TENANT_SLUG
npm install
```

**.env:**
```bash
PORT=3002
HELLOJOHN_DOMAIN=http://localhost:8080   # or https://cloud.hellojohn.io
TENANT_SLUG=mi-app
# For M2M (optional)
M2M_CLIENT_ID=cli_xxx
M2M_CLIENT_SECRET=cs_yyy
```

---

## Run

```bash
node server.js
# → Listening on http://localhost:3002
```

---

## Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| `GET` | `/api/health` | Public | Returns server status + whether the caller is authenticated |
| `GET` | `/api/profile` | `requireAuth()` | Returns JWT claims (userId, tenantId, scopes, roles) |
| `GET` | `/api/admin` | `requireAuth()` + `requireRole("admin")` | Admin-only endpoint |
| `GET` | `/api/data` | `requireAuth()` + `requireScope("data:read")` | Scope-protected endpoint |
| `GET` | `/api/m2m` | M2M token | Machine-to-machine endpoint |

---

## Test with curl

```bash
# Public endpoint
curl http://localhost:3002/api/health

# Get a user token first (replace with real credentials)
TOKEN=$(curl -s -X POST http://localhost:8080/v2/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"password","tenant_id":"mi-app"}' \
  | jq -r '.access_token')

# Authenticated endpoint
curl -H "Authorization: Bearer $TOKEN" http://localhost:3002/api/profile

# Admin endpoint (requires admin role)
curl -H "Authorization: Bearer $TOKEN" http://localhost:3002/api/admin

# Scope-protected endpoint (requires data:read scope)
curl -H "Authorization: Bearer $TOKEN" http://localhost:3002/api/data
```

---

## Key Code

```javascript
import { createHelloJohnServer } from "@hellojohn/node";
import { hjMiddleware, requireAuth, requireScope, requireRole } from "@hellojohn/node/express";

const hj = createHelloJohnServer({ domain: process.env.HELLOJOHN_DOMAIN });

app.use(hjMiddleware(hj));                              // attach req.auth globally
app.get("/api/profile", requireAuth(), handler);       // block unauth
app.get("/api/admin",   requireAuth(), requireRole("admin"), handler);
app.get("/api/data",    requireAuth(), requireScope("data:read"), handler);
```

---

## M2M (Service-to-Service)

```javascript
import { createM2MClient } from "@hellojohn/node";

const m2m = createM2MClient({
  domain: process.env.HELLOJOHN_DOMAIN,
  clientId: process.env.M2M_CLIENT_ID,
  clientSecret: process.env.M2M_CLIENT_SECRET,
});

const { accessToken } = await m2m.getAccessToken();
// Use accessToken to call other services
```

---

## Error Responses

| HTTP | Code | Meaning |
|------|------|---------|
| 401 | `unauthorized` | No token or invalid token |
| 403 | `forbidden` | Valid token but missing role/scope |
| 500 | `internal_error` | HelloJohn server unreachable |

---

## Related

- [`@hellojohn/node` SDK](../../node/README.md)
- [Node.js SDK source](../../node/src/)
