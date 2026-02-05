# AGENTS.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Project Overview

**chewy** is a CLI tool that exports resume JSON files into multiple formats (HTML, PDF, JSON, CSV, YAML, TXT). It uses TypeScript with React/Ink for the interactive CLI interface and Handlebars for HTML template rendering.

## Development Commands

Build the project (required before running):
```bash
pnpm build
```

Run tests:
```bash
pnpm test
```

Run a specific test file:
```bash
pnpm test tests/resume.test.ts
```

Run the CLI locally (after building):
```bash
./bin/chewy --input ./resume.json
```

## Architecture

### Entry Points
- `bin/chewy`: Node.js wrapper script that checks for built output and invokes `dist/cli.js`
- `src/cli.tsx`: Main CLI application using Ink (React for CLI). Exports `runCli()` which is called by the bin wrapper

### Core Modules
- `src/resume/schema.ts`: Zod schema for resume validation (ResumeSchema)
- `src/resume/exporters.ts`: Functions to export resume data to JSON, YAML, CSV, and plain text formats
- `src/resume/renderHtml.ts`: Handlebars-based HTML rendering with support for role-targeted summaries and skill ordering
- `src/resume/exportPdf.ts`: PDF generation by spawning Chrome/Chromium in headless mode
- `templates/resume.hbs`: Default Handlebars template for HTML/PDF output

### Resume Data Structure
The resume JSON schema includes:
- `name`, `title`, `contact` (email, phone, location, linkedin, github)
- `summaries`: Object with named summary variants (e.g., "default", "backend", "staffplus")
- `experience`: Array of job entries with company, role, dates, location, and highlights
- `skills`: Object mapping skill categories to arrays of skills
- `role_targets`: Optional object for role-specific rendering (keywords, emphasis with summary key and skills_order)

### CLI Options
- `--input`, `-i`: Path to resume JSON (defaults to `./resume.json`)
- `--out-dir`, `-o`: Output directory (default: `./out`)
- `--format`, `-f`: Comma-separated list or "all" (default: all formats)
- `--summary`: Summary key to use from the `summaries` object (default: "default")
- `--role`: Role key for targeted rendering using `role_targets` (default: "staffplus")
- `--template`: Path to custom Handlebars template (default: `templates/resume.hbs`)

### Build System
- **tsup**: Bundles TypeScript to ESM format in `dist/`
- **tsconfig.json**: Configured for NodeNext module resolution with React JSX
- Test files use `.spec.ts` suffix

### Known Issues
See `.ai/known_issues.md` for tracked bugs and improvements, including:
- `sanitizeBaseName` regex issues on Node 24
- HTML rendering conditionals for text-only formats
- Template path resolution in bundled scenarios

## Testing Strategy
- Tests use Vitest with fixtures in `tests/fixtures/`
- Integration tests spawn the bin scripts with `spawnSync`
- Unit tests validate schema parsing, exporters, and HTML rendering
- All text output must be ASCII-only (no smart quotes, em-dashes, or Unicode characters)

## Package Manager
This project uses **pnpm** (specified in `package.json` as `"packageManager": "pnpm@10.24.0"`). Always use `pnpm` commands, not `npm`.
