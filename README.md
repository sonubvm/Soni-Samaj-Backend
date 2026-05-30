# Soni Samaj Uttarbhartiya Trust Surat Backend API

See root [README](../README.md) for full setup.

```bash
npm install
cp .env.example .env
npm run dev
```

## Roles & permissions

| Role | Default permissions |
|------|---------------------|
| `superadmin` / `admin` | Full access + user management (`users:manage`) |
| `manager` | `families:view`, `families:edit`, `dashboard:view` |
| `assistant` | `families:view`, `dashboard:view` only |

Extra permissions can be granted per user (e.g. `families:delete` for a manager).

**Permission keys:** `families:view`, `families:edit`, `families:delete`, `users:manage`, `dashboard:view`

Default seed admin: `ADMIN_EMAIL` / `ADMIN_PASSWORD` in `.env` (role: `superadmin`).

Family deletes are **soft deletes** with `deletedAt` and `deletedBy` (admin audit at `GET /api/families/deleted`).
"# Soni-Samaj-Backend" 
