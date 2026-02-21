## Context

The Doc-Generator project has an existing pipeline: OpenAPI YAML → `generate-docs.mjs` → MDX files → Next.js rendered documentation. Currently it processes one project at a time from local YAML files in `swagger/<project>/`. The Felesh platform has 5 microservices (keycloak-client, config-store, RAG, social-gateway, interaction-history), each with its own OpenAPI spec exposed at runtime. We need to merge these into a single unified spec and generate one documentation project.

The gateway (Traefik) at `api.paystar.stg.felesh.ai` routes via path prefixes: `/auth/*`, `/config/*`, `/rag/*`, `/social/*`, `/interaction/*`. All endpoints except onboard/impersonate require a Bearer token obtained via the impersonate flow.

## Goals / Non-Goals

**Goals:**
- Create a merge script that produces a single `swagger/platform/openapi-en.yaml` from 5 running services
- Filter endpoints to only those relevant to external integrators (enduser, org, select generic, and 2 staff endpoints)
- Prefix all paths with gateway routes so code examples use the real gateway URLs
- Re-tag endpoints into logical sidebar sections for the unified documentation
- Write a Getting Started Guide explaining the auth flow and integration sequence
- Generate documentation via the existing `pnpm generate-docs` pipeline

**Non-Goals:**
- Persian/multilingual support (English only for now)
- CRM service documentation
- Modifying the core `generate-docs.mjs` script (use it as-is)
- Multi-page guide support (single intro.mdx is sufficient)
- Automated CI/CD for doc generation (manual run for now)

## Decisions

### 1. Merge script as a separate file (`scripts/merge-platform-specs.mjs`)

**Decision**: Create a new standalone script rather than modifying `generate-docs.mjs`.

**Rationale**: The merge script has different concerns (HTTP fetching, filtering, path rewriting, schema merging) that don't belong in the generation pipeline. Keeping them separate means `generate-docs.mjs` stays generic and the merge script is platform-specific.

**Alternative considered**: Modifying `generate-docs.mjs` to accept multiple URLs and merge internally. Rejected because it couples platform-specific logic (endpoint filtering, gateway prefixes) into a generic tool.

### 2. Pull specs from running services via HTTP

**Decision**: Fetch OpenAPI JSON/YAML from localhost endpoints at merge time.

- FastAPI services (keycloak-client:8002, social-gateway:8003, interaction-history:8004, RAG:8005): `GET /openapi.json` or `/docs/openapi.json`
- Django services (config-store:8007): `GET /schema/` (returns YAML)

**Rationale**: Services already expose their specs. Pulling at merge time ensures the documentation matches the actual running API. No need to maintain separate YAML files.

**Alternative considered**: Copying spec files from service source repos. Rejected because it creates a maintenance burden and risks drift.

### 3. Endpoint filtering strategy

**Decision**: Whitelist-based filtering using path patterns:

```
keycloak-client:
  INCLUDE: /api/v1/staff/realms/onboard, /api/v1/staff/realms/{slug}/impersonate
  INCLUDE: /api/v1/enduser/*, /api/v1/org/*
  EXCLUDE: everything else (auth/*, internal/*, staff/* except above, root)

config-store:
  INCLUDE: /api/v1/org/*, /api/v1/generic/app-config/, /api/v1/generic/widget-config/
  EXCLUDE: health, ready, landing

rag:
  INCLUDE: /api/v1/ingest/*, /api/v1/search, /api/v1/domains, /api/v1/domains/*/schema, /api/v1/tasks/*, /api/v1/{domain}/{value}
  EXCLUDE: /api/v1/health/*, /api/v1/internal/*

social-gateway:
  INCLUDE: /api/v1/platform/instagram/oauth/connect, /api/v1/platform/instagram/accounts*, /api/v1/platform/instagram/user-info, /api/v1/platform/instagram/posts
  EXCLUDE: webhooks, agentic/callback, oauth/callback, root, health

interaction-history:
  INCLUDE: /api/v1/enduser/*, /api/v1/org/*
  EXCLUDE: /api/v1/staff/*, root, health
```

**Rationale**: Explicit whitelist prevents accidental exposure of internal endpoints. Pattern-based matching keeps the config readable.

### 4. Path prefixing matches gateway routes

**Decision**: Prefix all paths with the corresponding gateway path prefix:

| Service | Prefix |
|---------|--------|
| keycloak-client | `/auth` |
| config-store | `/config` |
| RAG | `/rag` |
| social-gateway | `/social` |
| interaction-history | `/interaction` |

Example: `/api/v1/org/tenants` → `/config/api/v1/org/tenants`

### 5. Tag/section naming for sidebar

**Decision**: Re-tag all endpoints with service-oriented section names:

| Tag | Endpoints |
|-----|-----------|
| `Onboarding` | onboard, impersonate |
| `User Management` | org users, roles, org/me, enduser/me |
| `Config Store` | tenants, app-configs, widget-configs, files, generic configs |
| `RAG` | ingest, search, domains, tasks, delete |
| `Social - Instagram` | oauth, accounts, user-info, posts |
| `Interaction History` | enduser + org interactions, messages, statistics, archive |

### 6. OpenAPI version: 3.0.3

**Decision**: Output the merged spec as OpenAPI 3.0.3.

**Rationale**: Django services use 3.0.3, FastAPI uses 3.1.0. Downgrading to 3.0.3 ensures compatibility. The main difference is `anyOf` for nullable types in 3.1.0, which can be converted to `nullable: true` in 3.0.3.

### 7. Schema deduplication with service prefixes

**Decision**: When merging component schemas from different services, prefix schema names with the service name to avoid collisions: `Auth_UserResponse`, `Config_TenantResponse`, `RAG_SearchResult`, etc.

Update all `$ref` pointers accordingly.

### 8. English-only generation

**Decision**: The merge script outputs only `openapi-en.yaml`. The `generate-docs` script will process it for the `en` locale only. Since we place only `openapi-en.yaml` in `swagger/platform/`, the generator naturally skips `fa`.

## Risks / Trade-offs

- **[Services must be running]** → The merge script requires all 5 services to be running locally. Mitigation: script logs clear errors per service and can skip unavailable ones with warnings. The generated YAML can be committed so docs can be regenerated without running services.
- **[OpenAPI 3.1 → 3.0 downgrade]** → Some schema features may not convert cleanly. Mitigation: handle `anyOf` nullable pattern explicitly; log warnings for unsupported constructs.
- **[Config-store duplicate paths]** → Django DRF generates both `/path/` and `/path` variants. Mitigation: deduplicate by normalizing trailing slashes (prefer with trailing slash to match Django convention, or without to match FastAPI).
- **[Large sidebar]** → ~74 endpoints in one sidebar. Mitigation: logical section grouping keeps it navigable. The existing UI handles 30+ endpoints well.
- **[Single intro page]** → Getting Started Guide is one page. Mitigation: use clear heading structure with anchor links. Can extend to multi-page later if needed.
