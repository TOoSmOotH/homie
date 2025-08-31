# Repository Guidelines

## Project Structure & Module Organization
- `backend/`: Express + TypeScript API. Key folders: `src/routes`, `src/controllers`, `src/services`, `src/models`, `src/middleware`, `src/utils`.
- `frontend/`: React (Vite + Tailwind). Key folders: `src/components`, `src/pages`, `src/contexts`, `src/services`, `src/utils`, `public/`.
- `shared/`: Reusable TypeScript types and utilities shared by frontend/backend.
- `marketplace/`: JSON service definitions and schemas.
- `docs/`, `docker/`, `scripts/`: Documentation, Dockerfiles/compose, and automation scripts.
- Monorepo managed via npm workspaces in the root `package.json`.

## Build, Test, and Development Commands
- Dev (both apps): `npm run dev` — runs backend (nodemon) and frontend (vite) together.
- Build all: `npm run build` — builds `shared`, then `backend`, then `frontend`.
- Test all: `npm test` — runs backend Jest and frontend Vitest.
- Lint: `npm run lint` — ESLint for backend and frontend.
- Workspace-specific: `npm run dev --workspace=@homie/backend`, `npm run build --workspace=@homie/frontend`.
- Docker: `npm run docker:dev` (compose dev), `npm run docker:prod` (compose prod).
- Setup helpers: `scripts/setup.sh`, start/backup/deploy scripts under `scripts/`.

## Coding Style & Naming Conventions
- Language: TypeScript across repo; 2-space indentation.
- Linting: ESLint in `backend` and `frontend` (use `lint:fix` to autofix).
- Backend files: feature + suffix (e.g., `auth.routes.ts`, `user.controller.ts`). Classes `PascalCase`, functions/vars `camelCase`, env `UPPER_SNAKE_CASE`.
- Frontend: components/pages `PascalCase.tsx` under `src/components` and `src/pages`; utility modules `camelCase.ts`.

## Testing Guidelines
- Backend: Jest tests under `backend/tests/**`. Run `npm run test --workspace=@homie/backend` or `test:coverage`.
- Frontend: Vitest + Testing Library under `frontend/tests/**` with `*.test.ts(x)`. Run `npm run test --workspace=@homie/frontend`.
- Aim for meaningful unit tests around controllers, services, hooks, and critical UI. Prefer behavior-focused tests over snapshots.

## Commit & Pull Request Guidelines
- Commits: Prefer Conventional Commits (e.g., `feat: add service dashboard`, `fix: handle auth errors`, `refactor: simplify adapter`). Keep scope small and messages imperative.
- PRs: Include a clear description, linked issues, and screenshots/GIFs for UI changes. Note API changes and update `docs/` if applicable. Ensure lint, tests, and builds pass.

## Security & Configuration Tips
- Configuration via environment variables (loaded with `dotenv` in backend and via Vite in frontend). Do not commit secrets.
- Validate and sanitize inputs in new routes; avoid logging sensitive data. Keep CORS and Helmet settings intact unless required.

## Architecture Overview
- Backend: Express API + Socket.IO, SQLite/TypeORM, structured by routes/controllers/services.
- Frontend: React + React Query, Vite build, Tailwind UI.
- Shared: Type-safe contracts in `shared/` to keep API/clients in sync.

## Extending Services
- Add a new adapter under `backend/src/services/adapters/`, register it in `ServiceAdapterFactory`, update shared types, then add UI under `frontend/src/components/services/`.
- See `docs/CREATE_SERVICE_GUIDE.md` for the step-by-step flow and examples.

## Docs & References
- Architecture: `docs/ARCHITECTURE.md`
- Marketplace framework: `docs/MARKETPLACE_FRAMEWORK.md`
- Service schema reference: `docs/SERVICE_SCHEMA_REFERENCE.md`
