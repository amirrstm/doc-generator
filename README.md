# API Documentation Generator

A modern, dynamic API documentation application that automatically generates beautiful, interactive documentation from OpenAPI/Swagger specifications. Built with Next.js 15, featuring multi-language support and a clean, responsive interface.

## Features

- **Automatic Documentation Generation**: Convert OpenAPI/Swagger YAML specs into beautiful MDX documentation
- **Multi-Project Support**: Manage documentation for multiple API projects in one place
- **Internationalization**: Full support for English and Persian (RTL) languages
- **Interactive Code Examples**: Auto-generated code snippets in cURL, JavaScript, and Python
- **Environment Management**: Multiple API environments per project with easy switching
- **Global Search**: Fast, comprehensive search across all projects and endpoints
- **Dark/Light Mode**: Built-in theme switching with system preference detection
- **Responsive Design**: Mobile-first design that works on all devices
- **Syntax Highlighting**: Beautiful code highlighting powered by Shiki

## Tech Stack

- **Framework**: [Next.js 15](https://nextjs.org/) (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS 4.0
- **UI Components**: [shadcn/ui](https://ui.shadcn.com/) + Radix UI
- **Internationalization**: [next-intl](https://next-intl-docs.vercel.app/)
- **Documentation**: MDX with next-mdx-remote
- **Code Highlighting**: Shiki
- **State Management**: Zustand + React Context
- **Data Fetching**: TanStack Query (React Query)
- **Animations**: Framer Motion
- **Package Manager**: pnpm

## Getting Started

### Prerequisites

- Node.js 20.x or higher
- pnpm (recommended) or npm

### Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/doc-generator.git
cd doc-generator
```

2. Install dependencies:
```bash
pnpm install
# or
npm install
```

3. Run the development server:
```bash
pnpm dev
# or
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser

## Usage

### Generating Documentation

#### From Local YAML Files

1. Place your OpenAPI/Swagger YAML file in the `scripts/swagger/` directory:
```bash
scripts/swagger/your-api.yaml
```

2. Generate documentation:
```bash
pnpm generate-docs
```

#### From Remote URLs

Generate documentation directly from a remote OpenAPI spec:
```bash
pnpm generate-docs -- --url=https://api.example.com/swagger.yaml
```

#### With Custom Base URL

Override the base URL for API endpoints:
```bash
pnpm generate-docs -- --baseUrl=https://custom-api.com
```

### Generated Structure

The script automatically creates:
```
docs/
  your-project/
    endpoints/        # Generated MDX files for each endpoint
    sidebar.json      # Navigation structure
    env.json          # Environment configurations
    intro.mdx         # Project introduction page
```

### Project Structure

```
Doc-Generator/
├── .gitignore                   # Git ignore rules
├── README.md                    # Project documentation
├── package.json                 # Project dependencies and scripts
├── pnpm-lock.yaml               # PNPM lockfile
├── tailwind.config.ts           # Tailwind CSS configuration
├── tsconfig.json                # TypeScript configuration
├── docs/                        # Generated documentation (auto-generated)
│   ├── [project]/
│   │   ├── endpoints/           # Generated MDX files for each API endpoint
│   │   ├── sidebar.json         # Navigation structure for docs sidebar
│   │   ├── env.json             # API environment configs
│   │   └── intro.mdx            # Project introduction page
├── messages/                    # i18n translation files
│   ├── en.json
│   └── fa.json
├── public/                      # Static assets (images, fonts, etc)
│   └── styles/                  # Custom CSS
├── scripts/                     # Build and documentation scripts
│   ├── generate-docs.mjs        # Documentation generator
│   └── swagger/                 # OpenAPI YAML files (input for doc gen)
└── src/
    ├── app/                     # Next.js App Router entrypoint
    │   ├── [locale]/            # Internationalized routes ({en, fa, ...})
    │   └── [projectSlug]/       # Project-based dynamic routing
    ├── components/              # Reusable React components
    │   ├── layout/              # Header, Sidebar, Footer UI
    │   ├── Search/              # Global search components
    │   └── ui/                  # shadcn/ui components library
    ├── configs/                 # Configuration files
    │   └── i18n/                # Internationalization config
    ├── containers/              # Page containers for endpoints/intro
    ├── contexts/                # React context providers
    ├── hooks/                   # Custom React hooks
    ├── providers/               # Context providers (e.g. ProjectProvider)
    ├── types/                   # TypeScript types/interfaces
    └── utils/                   # Utility/helper functions
```

## Configuration

### Adding a New Language

1. Add translation file in `messages/`:
```bash
messages/your-locale.json
```

2. Update routing configuration in `src/configs/i18n/routing.ts`:
```typescript
export const routing = defineRouting({
  locales: ['en', 'fa', 'your-locale'],
  defaultLocale: 'en'
});
```

### Customizing Generated Documentation

Edit `scripts/generate-docs.mjs` to customize:
- MDX template structure
- Code example languages
- Sidebar organization
- Environment configuration

### Theme Customization

Modify Tailwind configuration for custom theming:
- Colors, fonts, and spacing in `tailwind.config.ts`
- Custom CSS in `public/styles/`

## Available Scripts

| Command            | Description                                |
|--------------------|--------------------------------------------|
| `pnpm dev`         | Start development server on port 3000      |
| `pnpm build`       | Build production bundle                    |
| `pnpm start`       | Start production server                    |
| `pnpm lint`        | Run Biome linter with auto-fix             |
| `pnpm generate-docs` | Generate docs from OpenAPI specs         |

## Key Features Explained

### Multi-Project Architecture

Each API project gets its own namespace:
- URL: `/{locale}/{project-slug}/{endpoint-slug}`
- Example: `/en/baloan/get-user-profile`

### Environment Switching

Projects can define multiple environments in `env.json`:
```json
{
  "environments": [
    {
      "name": "Production",
      "url": "https://api.example.com"
    },
    {
      "name": "Staging",
      "url": "https://staging-api.example.com"
    }
  ]
}
```

### Search Functionality

Global search indexes:
- Endpoint titles and descriptions
- HTTP methods
- Categories and tags
- Request/response schemas

### Code Generation

Automatically generates executable examples:
- cURL commands
- JavaScript (fetch/axios)
- Python (requests)

## Docker Support

Build and run with Docker:

```bash
# Build image
docker build -t doc-generator .

# Run container
docker run -p 3000:3000 doc-generator
```

## Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## Development Guidelines

- Follow the existing code style (enforced by Biome)
- Write meaningful commit messages
- Update documentation for new features
- Test in both English and Persian locales
- Ensure responsive design works on mobile

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- [Next.js](https://nextjs.org/) - React framework
- [shadcn/ui](https://ui.shadcn.com/) - UI component library
- [Tailwind CSS](https://tailwindcss.com/) - Utility-first CSS
- [next-intl](https://next-intl-docs.vercel.app/) - Internationalization
- [Shiki](https://shiki.matsu.io/) - Syntax highlighting

## Support

For issues, questions, or contributions, please open an issue on GitHub.

---

Built with ❤️ using Next.js
