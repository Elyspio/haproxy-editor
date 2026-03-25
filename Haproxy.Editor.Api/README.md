# API

This folder contains the backend side of HAProxy Editor.

The backend is built on ASP.NET Core and is responsible for:

- exposing authenticated endpoints,
- reading and writing HAProxy configuration through the Data Plane API,
- validating configuration changes,
- and producing dashboard-oriented snapshots for the frontend.

## Project layout

```text
Haproxy.Editor.Api/
├─ Haproxy.Editor.Abstractions/      # Shared contracts and snapshot models
├─ Haproxy.Editor.Adapters.Docker/   # Docker-oriented adapters
├─ Haproxy.Editor.Adapters.Haproxy/  # HAProxy Data Plane integration
├─ Haproxy.Editor.Core/              # Business logic
├─ Haproxy.Editor.Core.Tests/        # Core/backend tests
├─ Haproxy.Editor.WebApi/            # ASP.NET Core host
├─ Haproxy.Editor.WebApi.Tests/      # API-level tests
└─ nuget.config
```

## Architecture

### `Haproxy.Editor.Abstractions`

Defines the shared types used between layers, especially:

- configuration models,
- resource snapshots,
- and other cross-layer contracts.

### `Haproxy.Editor.Core`

Contains the main business logic.

The central orchestration point is `HaproxyService`, which translates HAProxy resources into application-friendly snapshot models and applies configuration mutations using transaction-based flows.

### `Haproxy.Editor.Adapters.Haproxy`

Contains the integration with the HAProxy Data Plane API.

This layer should remain the place where low-level HAProxy API concerns are handled.

### `Haproxy.Editor.WebApi`

Hosts the HTTP API.

Responsibilities include:

- authentication and authorization,
- Swagger / OpenAPI,
- CORS,
- endpoint mapping,
- module registration and host composition.

## Endpoint surface

The Web API exposes authenticated `/haproxy` endpoints for:

- config read,
- config write,
- config validation,
- dashboard snapshot read.

## Config workflow

Backend writes follow a transaction pattern against HAProxy:

- **validate**: create transaction, apply changes, discard transaction
- **save**: create transaction, apply changes, commit transaction

This behavior is important for keeping edits safe and predictable.

## Configuration

Key runtime configuration lives in:

`Haproxy.Editor.WebApi/appsettings.json`

Important sections include:

- `App:DataPlaneApi`
- `Oidc`
- `OpenTelemetry`

Use environment-specific overrides for real deployments rather than relying only on committed defaults.

## Commands

From the repository root:

### Build

```powershell
dotnet build .\Haproxy.Editor.slnx
```

### Run tests

```powershell
dotnet test .\Haproxy.Editor.slnx
```

### Run one backend test

```powershell
dotnet test .\Haproxy.Editor.Api\Haproxy.Editor.Core.Tests\Haproxy.Editor.Core.Tests.csproj --filter "FullyQualifiedName~HaproxyServiceTests.SaveConfig_commits_transaction_after_resource_creation"
```

## Conventions

- Prefer extending the existing module structure rather than wiring services ad hoc.
- Treat abstractions as the shared contract between backend and frontend.
- Keep transaction-based write behavior consistent across new save/validate flows.
- Do not hand-edit generated HAProxy client code.
