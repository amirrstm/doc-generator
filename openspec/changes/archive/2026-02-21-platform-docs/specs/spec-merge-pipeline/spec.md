## ADDED Requirements

### Requirement: Fetch OpenAPI specs from running services
The merge script SHALL fetch OpenAPI specifications from 5 microservices running on localhost:
- keycloak-client at port 8002 (`/docs/openapi.json`)
- social-gateway at port 8003 (`/openapi.json`)
- interaction-history at port 8004 (`/openapi.json`)
- RAG at port 8005 (`/openapi.json`)
- config-store at port 8007 (`/schema/`, returns YAML)

#### Scenario: All services available
- **WHEN** the merge script runs and all 5 services are accessible
- **THEN** the script fetches and parses the OpenAPI spec from each service

#### Scenario: A service is unavailable
- **WHEN** a service is not reachable during merge
- **THEN** the script logs a warning with the service name and port, skips that service, and continues with the remaining services

### Requirement: Filter endpoints to external-facing only
The merge script SHALL include only endpoints relevant to external integrators and exclude all internal, health, and administrative endpoints.

Included endpoints per service:
- **keycloak-client**: `POST /api/v1/staff/realms/onboard`, `POST /api/v1/staff/realms/{slug}/impersonate`, all `/api/v1/enduser/*`, all `/api/v1/org/*`
- **config-store**: all `/api/v1/org/*`, `GET /api/v1/generic/app-config/`, `GET /api/v1/generic/widget-config/`
- **RAG**: `POST /api/v1/ingest/files`, `POST /api/v1/ingest/records`, `POST /api/v1/search`, `GET /api/v1/domains`, `GET /api/v1/domains/{domain}/schema`, `GET /api/v1/tasks/{task_id}`, `DELETE /api/v1/{domain}/{value}`
- **social-gateway**: `GET /api/v1/platform/instagram/oauth/connect`, all `/api/v1/platform/instagram/accounts*`, `GET /api/v1/platform/instagram/user-info`, `GET /api/v1/platform/instagram/posts`, `POST /api/v1/platform/instagram/posts`
- **interaction-history**: all `/api/v1/enduser/*`, all `/api/v1/org/*`

#### Scenario: Staff endpoints filtered except whitelist
- **WHEN** the keycloak-client spec is processed
- **THEN** only `POST /api/v1/staff/realms/onboard` and `POST /api/v1/staff/realms/{slug}/impersonate` are included from staff paths, and all other staff endpoints are excluded

#### Scenario: Internal and health endpoints excluded
- **WHEN** any service spec is processed
- **THEN** all paths containing `/internal/`, `/health`, or root paths (`/`) are excluded

#### Scenario: Config-store duplicate paths normalized
- **WHEN** config-store spec contains both `/path/` and `/path` variants
- **THEN** the script deduplicates by keeping only the trailing-slash variant

### Requirement: Prefix paths with gateway routes
The merge script SHALL prefix all endpoint paths with the corresponding gateway route prefix.

| Service | Prefix |
|---------|--------|
| keycloak-client | `/auth` |
| config-store | `/config` |
| RAG | `/rag` |
| social-gateway | `/social` |
| interaction-history | `/interaction` |

#### Scenario: Path prefixing
- **WHEN** an endpoint `/api/v1/org/tenants/` from config-store is processed
- **THEN** the output path is `/config/api/v1/org/tenants/`

### Requirement: Re-tag endpoints into logical sidebar sections
The merge script SHALL replace all original tags with service-oriented section names:

| Tag | Applies to |
|-----|------------|
| `Onboarding` | onboard, impersonate endpoints |
| `User Management` | keycloak-client org/*, enduser/* |
| `Config Store` | all config-store endpoints |
| `RAG` | all RAG endpoints |
| `Social - Instagram` | all social-gateway endpoints |
| `Interaction History` | all interaction-history endpoints |

#### Scenario: Endpoint re-tagged
- **WHEN** the endpoint `POST /api/v1/ingest/files` from RAG is processed
- **THEN** its tags array is set to `["RAG"]`

#### Scenario: Onboarding endpoints tagged separately
- **WHEN** the endpoints `onboard` and `impersonate` from keycloak-client are processed
- **THEN** their tags array is set to `["Onboarding"]`, not `["User Management"]`

### Requirement: Merge component schemas with service prefixes
The merge script SHALL merge all `components.schemas` from each service into a single components section, prefixing schema names with the service identifier to avoid collisions.

#### Scenario: Schema name prefixing
- **WHEN** keycloak-client has a schema named `UserResponse` and interaction-history also has `UserResponse`
- **THEN** the merged spec contains `Auth_UserResponse` and `Interaction_UserResponse`, and all `$ref` pointers are updated accordingly

### Requirement: Set gateway server URLs
The merged spec SHALL define two server entries:
- Staging: `https://api.paystar.stg.felesh.ai` with description "Staging"
- Production: `https://api.paystar.felesh.ai` with description "Production"

#### Scenario: Servers in output
- **WHEN** the merged spec is generated
- **THEN** the `servers` array contains exactly the staging and production URLs

### Requirement: Output OpenAPI 3.0.3 YAML
The merge script SHALL output the merged specification as a valid OpenAPI 3.0.3 YAML file at `swagger/platform/openapi-en.yaml`.

#### Scenario: OpenAPI version downgrade
- **WHEN** a FastAPI service provides an OpenAPI 3.1.0 spec with `anyOf: [{type: "string"}, {type: "null"}]`
- **THEN** the merged output converts this to `type: "string", nullable: true` in OpenAPI 3.0.3 format

#### Scenario: Output file location
- **WHEN** the merge script completes successfully
- **THEN** the file `swagger/platform/openapi-en.yaml` exists and is valid YAML

### Requirement: Script executable via npm/pnpm
The merge script SHALL be runnable via `pnpm merge-specs` (added to package.json scripts).

#### Scenario: Run merge script
- **WHEN** a developer runs `pnpm merge-specs`
- **THEN** the script executes `scripts/merge-platform-specs.mjs` and outputs the merged YAML
