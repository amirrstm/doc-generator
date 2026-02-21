## 1. Merge Script Setup

- [x] 1.1 Create `scripts/merge-platform-specs.mjs` with base structure: argument parsing, service config array, main function
- [x] 1.2 Add `"merge-specs"` script to `package.json` pointing to `scripts/merge-platform-specs.mjs`

## 2. Service Fetching

- [x] 2.1 Implement fetch logic for FastAPI services (keycloak-client:8002 `/docs/openapi.json`, social-gateway:8003, interaction-history:8004, RAG:8005 at `/openapi.json`)
- [x] 2.2 Implement fetch logic for Django service (config-store:8007 at `/schema/`, YAML format — parse with js-yaml)
- [x] 2.3 Add error handling: log warning and skip unavailable services

## 3. Endpoint Filtering

- [x] 3.1 Implement endpoint filter for keycloak-client: include only `POST /api/v1/staff/realms/onboard`, `POST /api/v1/staff/realms/{slug}/impersonate`, all `/api/v1/enduser/*`, all `/api/v1/org/*`
- [x] 3.2 Implement endpoint filter for config-store: include all `/api/v1/org/*`, `GET /api/v1/generic/app-config/`, `GET /api/v1/generic/widget-config/`; deduplicate trailing-slash variants
- [x] 3.3 Implement endpoint filter for RAG: include ingest, search, domains, tasks, delete; exclude health and internal
- [x] 3.4 Implement endpoint filter for social-gateway: include oauth/connect, accounts, user-info, posts; exclude webhooks, agentic/callback, oauth/callback, root, health
- [x] 3.5 Implement endpoint filter for interaction-history: include all enduser and org endpoints; exclude staff, root, health

## 4. Path Prefixing & Re-tagging

- [x] 4.1 Implement path prefix mapping: `/auth`, `/config`, `/rag`, `/social`, `/interaction` per service
- [x] 4.2 Implement tag replacement: set tags to `Onboarding`, `User Management`, `Config Store`, `RAG`, `Social - Instagram`, `Interaction History` based on service and path

## 5. Schema Merging & Output

- [x] 5.1 Implement component schema merging with service-name prefixes (`Auth_`, `Config_`, `RAG_`, `Social_`, `Interaction_`) and update all `$ref` pointers
- [x] 5.2 Implement OpenAPI 3.1 → 3.0.3 downgrade: convert `anyOf` nullable patterns to `nullable: true`
- [x] 5.3 Set servers array (staging + production gateway URLs) and spec metadata (title, version, description)
- [x] 5.4 Write merged spec to `swagger/platform/openapi-en.yaml` as valid YAML

## 6. Getting Started Guide

- [x] 6.1 Write `swagger/platform/intro-en.mdx` with platform overview section listing all 5 services
- [x] 6.2 Write authentication flow section with step-by-step instructions and cURL examples for onboard and impersonate using `X-Client-ID` / `X-Client-Secret` headers
- [x] 6.3 Write integration sequence walkthrough (onboard → token → config → RAG → social → history) with brief descriptions per step
- [x] 6.4 Write base URL / environment section and common headers reference table

## 7. Generate & Verify

- [x] 7.1 Run `pnpm merge-specs` to generate the unified OpenAPI YAML
- [x] 7.2 Run `pnpm generate-docs` to generate MDX documentation from the merged spec
- [x] 7.3 Run `pnpm dev` and verify the documentation renders at `/en/platform/` with correct sidebar sections, endpoint pages, and Getting Started Guide
