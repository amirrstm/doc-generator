# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Next.js-based API documentation application that dynamically generates documentation from OpenAPI/Swagger specifications. The app supports multiple API projects (Interaction, etc) with internationalization (English/Persian) and provides a clean, responsive interface for viewing API documentation.

## Development Commands

### Essential Commands

- `pnpm dev` - Start development server
- `pnpm build` - Build production bundle
- `pnpm start` - Start production server
- `pnpm lint` - Run ESLint with auto-fix
- `pnpm generate-docs` - Generate documentation from OpenAPI specs

### Documentation Generation

The `generate-docs` script processes YAML files from `scripts/swagger/` and generates MDX documentation in the `docs/` directory. Each project gets its own folder with generated endpoint documentation, sidebar configuration, and environment settings. The script supports:

- Local YAML files: `pnpm generate-docs`
- Remote URLs: `pnpm generate-docs -- --url=https://api.example.com/swagger.yaml`
- Custom base URLs: `pnpm generate-docs -- --baseUrl=https://custom-api.com`

## Architecture

### Core Structure

- **Next.js App Router**: Uses the new app directory structure with internationalized dynamic routes `[locale]/[projectSlug]/[endpointSlug]`
- **Multi-project Support**: Each API project has its own documentation under `docs/[projectSlug]/`
- **Internationalization**: Support for English and Persian locales using next-intl
- **Dynamic Routing**: Locale-aware routing with project and endpoint slugs
- **Context-based State**: Project context manages current project, sidebar data, and environment selection

### Key Architectural Patterns

1. **Internationalization**: Built with next-intl, supports English (`en`) and Persian (`fa`) locales
2. **Generated Documentation**: MDX files are automatically generated from OpenAPI specs using a custom build script
3. **Environment Management**: Each project can have multiple environments defined in `env.json`
4. **Search Functionality**: Global search across all projects with search context and dialog interface
5. **Component-based**: Modular UI components in `src/components/` with shadcn/ui base components

### Data Flow

1. Project slug and locale from URL determine active project and language
2. `ProjectProvider` loads sidebar data, project configuration, and environments
3. Generated MDX files render endpoint documentation with interactive examples
4. Search functionality indexes all endpoints across projects for global search

### Key Components

- **Layout Components**: `src/components/layout/` - Header with search/theme, Sidebar with project navigation
- **Generated Content**: MDX files in `docs/[project]/endpoints/` - Auto-generated endpoint documentation
- **Search System**: `src/components/Search/` - Global search dialog with results
- **Endpoint Container**: `src/containers/Endpoint.tsx` - Main component for rendering API endpoint documentation

### State Management

- **Project Context**: Project-specific state (current project, sidebar data, selected environment)
- **Search Context**: Global search state and functionality
- **React Query**: API state management (if needed for future API calls)
- **URL State**: Locale, project, and endpoint selection via Next.js routing

### Styling & UI

- **Tailwind CSS**: Primary styling framework with custom configuration
- **Shadcn/ui Components**: Pre-built accessible components (dialog, select, button, etc.)
- **Custom Fonts**: IRANYekan font family for Persian text support
- **Theme System**: Next-themes integration for dark/light mode

### Documentation System

- **OpenAPI Processing**: `scripts/generate-docs.mjs` converts YAML specs to MDX files
- **Code Generation**: Automatically generates cURL, JavaScript, and Python examples
- **Interactive Examples**: Dynamic code blocks with syntax highlighting using Shiki
- **Environment Support**: Multiple API environments per project with URL switching

## Development Workflow

### Adding New API Projects

1. Place OpenAPI YAML file in `scripts/swagger/` (e.g., `new-project.yaml`)
2. Run `npm run generate-docs` to create documentation structure
3. Documentation appears automatically under `/[locale]/new-project` routes
4. Generated files include endpoints/, sidebar.json, env.json, and intro.mdx

### Working with Internationalization

- Messages are stored in `messages/en.json` and `messages/fa.json`
- Routing configuration is in `src/configs/i18n/routing.ts`
- Default locale is English with Persian as secondary
- Locale detection is disabled, uses URL prefix strategy

### Customizing Documentation

- Modify `scripts/generate-docs.mjs` to change generated MDX structure
- Update `src/containers/Endpoint.tsx` to modify documentation rendering
- Adjust sidebar generation logic in the documentation script
- Environment configurations are auto-generated from OpenAPI servers array

### Search Implementation

- Search index is built server-side from sidebar data and MDX content
- Search context provides global search functionality
- Search dialog component handles user interactions
- Search results include title, method, description, and category matching

## Project Structure Notes

- Generated documentation lives in `docs/` and should not be manually edited
- Source code follows standard Next.js app directory structure with internationalization
- UI components use shadcn/ui patterns with Tailwind CSS
- All generated MDX files import and use the Endpoint component for consistent rendering
