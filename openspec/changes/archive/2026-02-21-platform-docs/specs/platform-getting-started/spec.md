## ADDED Requirements

### Requirement: Getting Started Guide intro page
The file `swagger/platform/intro-en.mdx` SHALL serve as the Getting Started Guide, rendered at `/en/platform/` as the intro page for the unified platform documentation.

#### Scenario: Intro page renders
- **WHEN** a developer visits `/en/platform/`
- **THEN** they see the Getting Started Guide content

### Requirement: Platform overview section
The Getting Started Guide SHALL include a platform overview explaining what the Felesh platform provides and listing the 5 services available to integrators: Authentication & User Management, Config Store, RAG, Social Gateway, and Interaction History.

#### Scenario: Developer reads overview
- **WHEN** a developer opens the Getting Started Guide
- **THEN** they see a brief description of each service and its purpose

### Requirement: Authentication flow documentation
The Getting Started Guide SHALL document the authentication flow:
1. Paystar receives `client_id` and `client_secret` from Felesh
2. Call `POST /auth/api/v1/staff/realms/onboard` with `X-Client-ID` and `X-Client-Secret` headers to create a realm
3. Call `POST /auth/api/v1/staff/realms/{slug}/impersonate` with `X-Client-ID` and `X-Client-Secret` headers to get an access token for a user
4. Use the access token as `Authorization: Bearer <token>` header for all subsequent API calls

#### Scenario: Auth flow explained with code example
- **WHEN** a developer reads the authentication section
- **THEN** they see a step-by-step flow with a cURL example for onboarding and impersonation, including the `X-Client-ID` and `X-Client-Secret` headers

### Requirement: Integration sequence walkthrough
The Getting Started Guide SHALL walk through the recommended integration order:
1. **Onboard** — Create a realm for the customer
2. **Get Token** — Impersonate a user to get access
3. **Configure** — Create tenants and app configs via Config Store
4. **Ingest Data** — Upload files or records to RAG
5. **Search** — Query the RAG service
6. **Social** — Connect Instagram accounts
7. **History** — Access interaction history

#### Scenario: Step-by-step integration
- **WHEN** a developer reads the integration sequence
- **THEN** each step includes a brief description and a link/reference to the relevant API endpoints in the sidebar

### Requirement: Base URL and environment information
The Getting Started Guide SHALL document the base URLs for staging and production environments and explain the environment switcher in the documentation UI.

#### Scenario: Environment URLs documented
- **WHEN** a developer reads the environment section
- **THEN** they see `https://api.paystar.stg.felesh.ai` (Staging) and `https://api.paystar.felesh.ai` (Production)

### Requirement: Common headers reference
The Getting Started Guide SHALL include a quick reference table of common headers:
- `X-Client-ID` — Client identifier (onboard/impersonate only)
- `X-Client-Secret` — Client secret (onboard/impersonate only)
- `Authorization: Bearer <token>` — Access token (all other endpoints)
- `X-Auth-User` — Automatically injected by gateway after token validation

#### Scenario: Headers reference table
- **WHEN** a developer reads the headers section
- **THEN** they see a table with header names, descriptions, and which endpoints require each header
