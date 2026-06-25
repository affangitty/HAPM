# HAPM Web (Angular 19)

Frontend for the Hospital Appointment & Patient Management System.

## Stack

- Angular 19 (standalone components)
- Tailwind CSS 3
- JWT authentication against `HAPM.API`
- Stitch layouts + Figma design tokens

## Prerequisites

- Node.js 20+
- HAPM API running at `http://localhost:5168`

## Development

```bash
cd frontend/hapm-web
npm install
npm start
```

Open [http://localhost:4200](http://localhost:4200). API calls are proxied to port 5168 via `proxy.conf.json`.

## Demo login

| Role | Email | Password |
|------|-------|----------|
| Admin | `admin@hapm.local` | `Admin@12345` |
| Doctor | `dr.sharma@hapm.local` | `Doctor@12345` |
| Patient | `patient@hapm.local` | `Patient@12345` |
| Receptionist | `reception@hapm.local` | `Reception@12345` |

## Project structure

```
src/app/
  core/           Auth, API client, guards, interceptors
  layout/         Auth layout, app shell (sidebar + top nav)
  shared/         UI library, forms, data-table, utilities
  features/       Feature modules (auth wired; others are placeholders)
```

## Build

```bash
npm run build
```

Output: `dist/hapm-web/`

## Architecture

See [docs/Frontend_Architecture.md](../../docs/Frontend_Architecture.md).
