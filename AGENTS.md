# AGENTS.md

## Commands

### Setup
```bash
npm install
```

### Build
```bash
npm run build
```

### Lint
```bash
npm run lint
```

### Tests
No test framework configured.

### Dev Server
```bash
npm run dev
```

## Tech Stack
- **Framework**: Next.js 15.2 (App Router)
- **Language**: TypeScript (strict mode)
- **Styling**: Tailwind CSS + PostCSS
- **UI Components**: Radix UI primitives + shadcn/ui
- **Forms**: React Hook Form + Zod validation
- **Fonts**: Geist Sans/Mono

## Architecture
- App Router structure (`app/` directory)
- Component library in `components/ui/`
- Utilities in `lib/`
- Path alias: `@/*` maps to root

## Code Style
- Use `cn()` utility from `lib/utils` for conditional class merging
- Components use `React.forwardRef` pattern
- UI components follow shadcn/ui conventions (cva variants, compound components)
- No semicolons, double quotes for strings
