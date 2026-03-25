# Deployment

This folder contains deployment-oriented assets for packaging and publishing HAProxy Editor outside the local Aspire development workflow.

## What is in this folder

```text
Haproxy.Editor.Deployment/
└─ build/
   ├─ build.ps1
   ├─ docker-compose.yml
   ├─ config/
   │  └─ front/
   └─ dockerfiles/
      ├─ api.dockerfile
      └─ front.dockerfile
```

## Purpose

The `Deployment` folder is used for container-centric delivery tasks such as:

- building the frontend image,
- building the API image,
- composing those images together,
- and publishing tagged images to a registry.

## Build assets

### `build/docker-compose.yml`

Defines the build targets for:

- `front`
- `api`

The compose file builds both images from the repository root and injects the parameters needed to build the API image from the .NET solution.

### `build/dockerfiles/`

Contains Dockerfiles for:

- the frontend container
- the API container

### `build/config/front/`

Contains frontend web-server assets such as:

- entrypoint script
- nginx configuration
- mime type configuration

## Publish script

`build/build.ps1` is a convenience script for local image build and push.

Current behavior:

- sets `DOCKER_TAG` from the current date,
- runs `podman compose build`,
- pushes both `api` and `front` images.

## Relationship with AppHost

`Haproxy.Editor.AppHost` is the recommended local development entry point.

This `Deployment` folder is complementary:

- **AppHost** is for orchestrated local development
- **Deployment** is for container build/publish workflows

## Notes

- The compose file expects environment-specific values such as `DOCKER_TAG` and registry credentials.
- The API image build uses solution/project path arguments rather than hard-coding everything in the Dockerfile.
- If you change frontend runtime delivery behavior, review the nginx files under `build/config/front/`.
