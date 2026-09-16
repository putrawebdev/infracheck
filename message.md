# Recommended Git Commit Messages for InfraCheck

Below are several commit message recommendations formatted according to the **Conventional Commits** specification. Choose the one that best fits your workflow.

---

## Option 1: Comprehensive & Detailed (Recommended)

Use this option if you are committing all current changes together in a single commit. It clearly documents the repository restructuring, backend security hardening, frontend SPA implementation, Nix environment setup, and master documentation.

```text
feat: restructure project into monorepo with React frontend, Laravel backend, and Nix flakes

- Structure:
  * Reorganize repository into `infracheck-be/` (API) and `infracheck-fe/` (SPA).
  * Configure monorepo-level `.gitignore` for dependencies, build artifacts, and secrets.

- Backend (infracheck-be):
  * Upgrade architecture to Laravel 12 with PHP 8.3+.
  * Add Sanctum authentication, Role-Based Access Control (RBAC), and route middleware.
  * Implement Category management, status workflow (`new` -> `processing` -> `done`), and soft deletes with audit logs.
  * Add anti-brute force and anti-spam rate limiting (`throttle`).
  * Implement DomPDF audit report generator with secure path evaluation.
  * Add database performance composite indexes on reports and categories.

- Frontend (infracheck-fe):
  * Build React 19 + TypeScript/Vite web application with Material You design system.
  * Integrate Leaflet interactive mapping with custom urgency-coded pin markers.
  * Implement citizen reporting pipeline, live tracking via Tracking ID, and community verification.
  * Add client-side WebP image compression to optimize mobile submissions.
  * Build administrative back-office dashboard, admin map view, and category management.

- DevOps & Environment:
  * Add Nix Flakes (`flake.nix`) and direnv configs for reproducible development environments.
  * Automate local PostgreSQL 16 cluster provisioning in backend shell hook.

- Documentation:
  * Add master README.MD covering architecture, features, setup, and REST API reference.
  * Add security blueprint (secure.MD), optimization plan (optimize.md), NixOS guide (step-by-step.md), and geolocation analysis (Reasoning.md).
```

### Quick Command to Commit:

```bash
git add .
git commit -F - << 'EOF'
feat: restructure project into monorepo with React frontend, Laravel backend, and Nix flakes

- Structure:
  * Reorganize repository into `infracheck-be/` and `infracheck-fe/`.
  * Update root `.gitignore` to support monorepo subprojects, Nix, and local PostgreSQL.

- Backend (infracheck-be):
  * Add Sanctum auth, RBAC middleware, and Category/Report lifecycle management.
  * Add rate-limiting protection against brute force and spam.
  * Implement DomPDF audit generation and database performance indexes.

- Frontend (infracheck-fe):
  * Implement React 19 + Vite + Tailwind CSS (Material You) application.
  * Add interactive Leaflet map, tracking portal, and client-side image compression.
  * Add administrative dashboard, map triage view, and settings management.

- DevOps & Documentation:
  * Add Nix flakes for backend (PHP/Composer/PostgreSQL) and frontend (Node.js).
  * Add master README.MD, security hardening blueprint, and optimization roadmap.
EOF
```

---

## Option 2: Concise & Standard

Use this option if you prefer a shorter commit message following the 50/72 character standard:

```text
feat: initialize monorepo with React frontend, Laravel API, and Nix environment

Restructure the project into `infracheck-be` and `infracheck-fe` subprojects.
Implement React 19 GIS frontend, Laravel 12 REST API with RBAC, DomPDF
audit reports, database indexes, Nix flakes, and master documentation.
```

### Quick Command to Commit:

```bash
git add .
git commit -m "feat: initialize monorepo with React frontend, Laravel API, and Nix environment" \
           -m "Restructure the project into infracheck-be and infracheck-fe subprojects. Implement React 19 GIS frontend, Laravel 12 REST API with RBAC, DomPDF audit reports, database indexes, Nix flakes, and master documentation."
```

---

## Option 3: Multi-Step Commits (If Splitting Changes)

If you prefer to split the work into smaller, logical git commits:

1. **Commit 1 (Restructure & Configuration)**:
   ```bash
   git add .gitignore flake.nix infracheck-be/flake.* infracheck-fe/flake.* infracheck-be/.envrc infracheck-fe/.envrc
   git commit -m "chore: setup monorepo structure, .gitignore, and Nix flakes"
   ```

2. **Commit 2 (Backend Enhancements)**:
   ```bash
   git add infracheck-be/
   git commit -m "feat(backend): implement RBAC, category CRUD, rate limiting, and PDF audit generation"
   ```

3. **Commit 3 (Frontend Web Application)**:
   ```bash
   git add infracheck-fe/
   git commit -m "feat(frontend): build React 19 GIS reporting platform and admin dashboard"
   ```

4. **Commit 4 (Documentation)**:
   ```bash
   git add README.MD Reasoning.md optimize.md secure.MD step-by-step.md todo.MD message.md
   git commit -m "docs: add master documentation, security blueprint, and optimization guides"
   ```
