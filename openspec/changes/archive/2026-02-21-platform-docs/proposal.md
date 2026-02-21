## Why

Paystar (and future customers) need developer documentation to integrate with the Felesh platform. Currently, each microservice exposes its own OpenAPI spec independently, but there's no unified, curated documentation that shows developers how to use the services together. We need a single documentation site with a Getting Started Guide and a filtered API reference covering only the endpoints relevant to external integrators.

## What Changes

- Create a **merge script** (`scripts/merge-platform-specs.mjs`) that pulls OpenAPI specs from 5 running services, filters to external-facing endpoints only, prefixes paths with gateway routes, re-tags into logical sections, and outputs a unified `swagger/platform/openapi-en.yaml`
- Create a **Getting Started Guide** (`swagger/platform/intro-en.mdx`) explaining the auth flow (X-Client-ID/X-Client-Secret → onboard → impersonate → Bearer token) and step-by-step integration sequence
- Generate unified documentation via the existing `pnpm generate-docs` pipeline, producing a single `platform` project with all services in one sidebar
- English only — no Persian locale needed for this documentation

## Capabilities

### New Capabilities
- `spec-merge-pipeline`: Script to pull, filter, prefix, re-tag, and merge OpenAPI specs from 5 microservices into a single unified spec file
- `platform-getting-started`: Hand-written Getting Started Guide (intro-en.mdx) covering auth flow, integration sequence, and service overview

### Modified Capabilities
<!-- No existing specs to modify -->

## Impact

- **New files**: `scripts/merge-platform-specs.mjs`, `swagger/platform/openapi-en.yaml` (generated), `swagger/platform/intro-en.mdx`, `docs/platform/` (generated output)
- **Services covered**: keycloak-client (8002), social-gateway (8003), interaction-history (8004), RAG (8005), config-store (8007)
- **Endpoint scope**: ~74 endpoints total — onboard/impersonate (staff), enduser, org, and select generic endpoints. No internal/staff CRUD/CRM.
- **Auth model**: `X-Client-ID` + `X-Client-Secret` headers for onboard/impersonate; `Authorization: Bearer <token>` for all other endpoints
- **Gateway base URLs**: `https://api.paystar.stg.felesh.ai` (staging), `https://api.paystar.felesh.ai` (production)
