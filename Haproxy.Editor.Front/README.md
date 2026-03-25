# Frontend

This folder contains the frontend application for HAProxy Editor.

The frontend provides the user interface for browsing, validating, and editing HAProxy resources such as:

- globals and defaults
- frontends
- backends
- ACLs
- routing rules
- dashboard summaries

## Stack

- React
- TypeScript
- Vite
- Redux Toolkit
- Inversify
- MUI / MUI X
- Vitest

## Project structure

```text
Haproxy.Editor.Front/
├─ src/
│  ├─ core/      # APIs, DI, services
│  ├─ store/     # Redux store, modules, async helpers
│  ├─ types/     # Shared frontend-only types
│  └─ view/      # Pages, components, theme, UI logic
├─ public/       # Static assets and runtime config
├─ scripts/      # Utility scripts such as API refresh
├─ tests/        # Frontend tests
└─ package.json
```

## How the frontend works

### Routing

Routing is assembled from the frontend view configuration and React Router.

### State management

State is organized by module, mainly under:

- `auth`
- `config`
- `dashboard`

Async behavior is implemented through shared thunk helpers rather than raw `createAsyncThunk` usage scattered across the codebase.

### Dependency injection

API-facing services are resolved through the Inversify container.

Bindings are assembled under `src/core/di`.

### Runtime configuration

Runtime frontend settings are read from:

```text
window["haproxy-editor"]
```

This is used for values such as API endpoints.

## Commands

From this folder:

### Install dependencies

```powershell
pnpm install
```

### Development / build

```powershell
pnpm build
pnpm lint
pnpm test -- --run
```

### Run one test file

```powershell
pnpm test -- --run tests/units/config.reducer.test.ts
```

### Refresh generated API client

```powershell
pnpm refresh:api
```

Before refreshing the generated API client, rebuild or restart the backend so the Swagger document reflects the current API surface.

## Important notes

### Generated files

Do **not** hand-edit:

- `src/core/apis/generated/*`

### API proxy behavior

The Vite dev setup proxies `/api` to the local backend and strips the `/api` prefix.

### UI organization

Most UI code lives under `src/view`, including:

- management panels
- dashboard components
- summary visualizations
- shared editors and toolbars

## Testing

Frontend tests are written with Vitest.

Typical commands:

```powershell
pnpm test -- --run
pnpm build
pnpm lint
```
