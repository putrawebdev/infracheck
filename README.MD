# InfraCheck

InfraCheck is a modern, real-time crowdsourcing platform designed for reporting, tracking, and auditing public infrastructure conditions. The system bridges citizens and public works departments (Dinas Pekerjaan Umum) by providing a transparent, geolocated reporting pipeline, anti-abuse community verification, and automated audit document generation.

---

## Table of Contents

- [Overview](#overview)
- [Key Features](#key-features)
  - [Citizen and Public Portal](#citizen-and-public-portal)
  - [Administrative and Field Office Dashboard](#administrative-and-field-office-dashboard)
- [Architecture and Tech Stack](#architecture-and-tech-stack)
  - [Frontend Architecture](#frontend-architecture)
  - [Backend Architecture](#backend-architecture)
  - [Infrastructure and Reproducible Tooling](#infrastructure-and-reproducible-tooling)
- [Project Directory Structure](#project-directory-structure)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Backend Setup (infracheck-be)](#backend-setup-infracheck-be)
  - [Frontend Setup (infracheck-fe)](#frontend-setup-infracheck-fe)
- [Default User Accounts](#default-user-accounts)
- [API Reference Summary](#api-reference-summary)
- [Security, Privacy, and Performance Hardening](#security-privacy-and-performance-hardening)
- [License](#license)

---

## Overview

Public infrastructure maintenance often suffers from communication gaps, lack of transparent tracking, and delayed validation. InfraCheck addresses these challenges through:

1. Rapid, frictionless field reporting for citizens without requiring complex registration barriers.
2. Real-time geospatial mapping that visualizes damage distribution and urgency levels.
3. Community-driven confirmation ("Saya juga merasakan ini") to measure impact and prevent false alarms.
4. Administrative workflows for inspection, status updates, category control, and official PDF audit generation.

---

## Key Features

### Citizen and Public Portal

- Interactive Geospatial Map: Real-time map powered by Leaflet displaying categorized infrastructure damage markers color-coded by urgency:
  - Red: High urgency (dangerous, major road hazards, collapsed structures)
  - Orange: Medium urgency (moderate disruption)
  - Yellow: Low urgency (minor maintenance)
  - Green: Resolved / Handled
- Geolocation with Fallback: Browser-assisted geolocation detection with accuracy indicators and manual pin-dragging capabilities on the map.
- Anonymous and Semi-Anonymous Submission: Quick report submission generating a human-readable unique Tracking ID (e.g., `IC-2026-KUKHR`).
- Client-Side Image Compression: Images taken via smartphone cameras are compressed to WebP directly in the browser before upload, ensuring high speed over 3G/4G networks.
- Multi-Angle Photographic Evidence: Citizens can contribute supplementary photos to an existing report.
- Community Verification: Citizens can confirm existing issues to highlight high-priority problems, protected by rate limiting and token checks.
- Public Tracking: Real-time report status lookup via Tracking ID without needing to log in.
- Official PDF Audit Report: Instant generation and download of complete audit summaries with photos, metadata, and timestamps.

### Administrative and Field Office Dashboard

- Role-Based Access Control (RBAC): Authenticated access powered by Laravel Sanctum for Super Administrators and municipal operators.
- Analytics and Metrics Dashboard: Summaries of incoming reports, resolution ratios, urgency distribution, and category breakdowns.
- Administrative Map View: Full-screen interactive map filtered by category, urgency, and handling state for rapid spatial triage.
- Report Lifecycle Workflow: State machine transitions (`new` -> `processing` -> `done`), complete with soft deletion safeguards and audit logs.
- Category Management: Dynamic CRUD interface for managing infrastructure categories and guidelines.
- Profile and Password Management: Secure credential rotation for administrative accounts.

---

## Architecture and Tech Stack

```
+-------------------------------------------------------------------------+
|                                INFRACHECK                               |
+------------------------------------+------------------------------------+
| Sisi Klien (Frontend)              | Sisi Server (Backend)              |
| - React 19 + TypeScript / JSX      | - Laravel 12 (PHP 8.3+)            |
| - Vite Build System                | - PostgreSQL 16 / SQLite           |
| - Tailwind CSS (Material You Theme)| - Laravel Sanctum (RBAC)           |
| - Leaflet & React-Leaflet          | - Barryvdh DomPDF Audit Engine     |
| - Framer Motion Transitions        | - Nix Flakes + Direnv Environment  |
+------------------------------------+------------------------------------+
```

### Frontend Architecture
- Framework: React 19 with Vite
- Styling: Tailwind CSS configured with dynamic Material You design guidelines and clean elevated cards
- Mapping and GIS: Leaflet, React-Leaflet, and custom SVG pin markers
- Animation: Framer Motion
- Icons: Material Icons and Lucide React
- Routing: React Router DOM v7

### Backend Architecture
- Framework: Laravel 12 (PHP 8.3+)
- Database: PostgreSQL 16 (production/dev via Nix) or SQLite (lightweight testing)
- Authentication: Laravel Sanctum with custom role authorization middleware (`role:admin,superadmin`)
- PDF Generation: Barryvdh Laravel DomPDF
- Rate Limiting: Laravel Cache Throttle limiting brute-force login and spam submissions

### Infrastructure and Reproducible Tooling
- Nix Flakes: Independent `flake.nix` configurations for backend and frontend environments, ensuring zero dependency drift across Linux/macOS installations.
- Direnv: Automatic environment variable loading and Nix shell activation upon entering project subdirectories.

---

## Project Directory Structure

```text
Infracheck/
├── .gitignore               # Root gitignore configured for monorepo subprojects
├── README.MD                # Master project documentation
├── Reasoning.md             # Technical explanation of geolocation behavior
├── optimize.md              # Optimization roadmap and performance audit
├── secure.MD                # Security hardening blueprint and OWASP audit
├── step-by-step.md          # Step-by-step setup guide for NixOS environments
├── todo.MD                  # Development task checklist and status tracker
│
├── infracheck-be/           # Laravel 12 Backend API
│   ├── app/
│   │   ├── Http/Controllers/ # AuthController, ReportController, CategoryController
│   │   ├── Models/          # Eloquent models (User, Report, ReportPhoto, etc.)
│   │   └── Providers/       # AppServiceProvider and authorization gates
│   ├── config/              # App, database, sanctum, and logging configuration
│   ├── database/
│   │   ├── migrations/      # Table definitions, composite indexes, soft deletes
│   │   └── seeders/         # Default administrator credentials
│   ├── routes/
│   │   └── api.php          # Rate-limited REST API route definitions
│   ├── storage/             # Log files, cache, and uploaded citizen photos
│   ├── flake.nix            # Nix development shell (PHP 8.3, Composer, Postgres 16)
│   └── composer.json        # PHP dependencies
│
└── infracheck-fe/           # React 19 Frontend Web Application
    ├── src/
    │   ├── api/             # Axios API client and centralized endpoints
    │   ├── components/      # UI components (Navbar, Modal, BottomSheet, Badges)
    │   ├── context/         # LocationContext and AuthContext
    │   ├── pages/
    │   │   ├── admin/       # DashboardPage, MapAdminPage, ReportDetailPage, etc.
    │   │   └── public/      # MapPage, NewReportPage, TrackReportPage, AboutPage
    │   ├── utils/           # Image compression, date formatters, marker helpers
    │   ├── App.tsx          # Master routing and layout assembly
    │   └── main.tsx         # Application entry point
    ├── flake.nix            # Nix development shell (Node.js 22, npm)
    ├── package.json         # JavaScript/TypeScript dependencies
    └── vite.config.ts       # Vite build setup with manual chunk splitting
```

---

## Getting Started

### Prerequisites

You can run InfraCheck using either standard development tools or Nix:

- Standard Installation:
  - PHP >= 8.3 with extensions (`pdo`, `pdo_pgsql` or `pdo_sqlite`, `mbstring`, `gd`, `zip`, `xml`, `curl`)
  - Composer 2.x
  - Node.js >= 20.x and npm
  - PostgreSQL 16 (or SQLite)
- Nix Installation (Recommended):
  - Nix with Flakes enabled (`experimental-features = nix-command flakes`)
  - Direnv (optional, for automatic shell activation)

---

### Backend Setup (infracheck-be)

1. Navigate to the backend directory:
   ```bash
   cd infracheck-be
   ```

2. Activate the development environment:
   ```bash
   # Using Nix:
   nix develop

   # Or with direnv:
   direnv allow
   ```

3. Install PHP dependencies:
   ```bash
   composer install
   ```

4. Set up environment configuration:
   ```bash
   cp .env.example .env
   php artisan key:generate
   ```

5. Configure database connection in `.env`:
   - For PostgreSQL:
     ```env
     DB_CONNECTION=pgsql
     DB_HOST=127.0.0.1
     DB_PORT=5432
     DB_DATABASE=infracheck
     DB_USERNAME=postgres
     DB_PASSWORD=secret
     ```
   - For SQLite:
     ```env
     DB_CONNECTION=sqlite
     # Leave DB_DATABASE empty or point to database/database.sqlite
     ```

6. Run migrations and seed administrative accounts:
   ```bash
   php artisan migrate
   php artisan db:seed
   ```

7. Create symbolic link for uploaded photo storage:
   ```bash
   php artisan storage:link
   ```

8. Start the Laravel development server:
   ```bash
   php artisan serve --host=0.0.0.0 --port=8000
   ```
   The backend API will be available at `http://127.0.0.1:8000/api`.

---

### Frontend Setup (infracheck-fe)

1. Open a new terminal and navigate to the frontend directory:
   ```bash
   cd infracheck-fe
   ```

2. Activate the Nix development environment (if using Nix):
   ```bash
   nix develop
   ```

3. Install Node.js dependencies:
   ```bash
   npm install
   ```

4. Configure environment variables:
   Create a `.env` file in `infracheck-fe/` if not present:
   ```env
   VITE_API_BASE_URL=http://127.0.0.1:8000/api
   ```

5. Launch the frontend development server:
   ```bash
   npm run dev
   ```
   The web application will be accessible at `http://localhost:3000`.

---

## Default User Accounts

When `php artisan db:seed` is executed, the following administrator accounts are initialized:

| Role | Email | Password | Access Level |
|---|---|---|---|
| Super Administrator | `admin@infracheck.id` | `admin123` | Full access (Reports, Categories, Settings, Deletions) |
| Dinas PU Operator (Demo) | `admin@example.com` | `password` | Operational access (Report inspections and status changes) |

Login page route: `/admin/login`

---

## API Reference Summary

All API endpoints are prefixed with `/api`.

### Public Citizen Endpoints

| Method | Endpoint | Description | Rate Limit |
|---|---|---|---|
| POST | `/reports` | Submit a new infrastructure damage report | 10 req / 10 min |
| GET | `/reports` | Retrieve all public reports for map visualization | 120 req / min |
| GET | `/reports/track/{trackingId}` | Track a report using its unique Tracking ID | 120 req / min |
| POST | `/reports/{id}/confirm` | Submit community confirmation ("Saya juga merasakan ini") | 15 req / min |
| POST | `/reports/{id}/photos` | Upload additional photographic evidence to a report | 15 req / min |
| GET | `/categories` | List active infrastructure categories | 120 req / min |
| GET | `/reports/{id}/pdf` | Download official audit report in PDF format | 120 req / min |

### Back-Office and Administrative Endpoints

| Method | Endpoint | Description | Authorization |
|---|---|---|---|
| POST | `/auth/login` | Administrator authentication | 5 attempts / min |
| GET | `/auth/me` | Fetch authenticated administrator profile | Sanctum Token |
| POST | `/auth/logout` | Revoke current administrator token | Sanctum Token |
| GET | `/admin/profile` | Retrieve admin settings profile | Sanctum + RBAC |
| PUT | `/admin/profile` | Update admin profile details | Sanctum + RBAC |
| PUT | `/admin/password` | Update admin password | Sanctum + RBAC |
| POST | `/categories` | Create new infrastructure category | Sanctum + RBAC |
| PUT | `/categories/{id}` | Update existing category | Sanctum + RBAC |
| DELETE | `/categories/{id}` | Delete category | Sanctum + RBAC |
| PATCH | `/reports/{id}/status` | Update report status (`new`, `processing`, `done`)| Sanctum + RBAC |
| DELETE | `/reports/{id}` | Soft delete report with audit logging | Sanctum + RBAC |

---

## Security, Privacy, and Performance Hardening

InfraCheck follows security best practices aligned with OWASP API Security and Indonesian Privacy Regulations (UU PDP No. 27/2022):

1. Anti-Brute-Force Login: The `/api/auth/login` endpoint is throttled to 5 attempts per minute per IP to prevent credential guessing.
2. Anti-Spam Confirmation Engine: Report confirmations and submissions require distinct user tokens and are rate-limited per IP.
3. Privacy Preservation: Uploaded photos undergo EXIF metadata stripping to prevent disclosure of personal home GPS coordinates.
4. Client-Side Image Compression: Reduces photo payload by up to 80% before network transmission, saving citizen data usage and server storage.
5. Database Indexes: B-Tree and composite indexes on `status`, `urgency`, `category`, and geographic coordinates to maintain sub-30ms query response times.
6. Audit Trails & Soft Deletes: Destructive actions on reports are recorded in an audit log and preserved through soft deletion.

---

## License

This project is licensed under the MIT License. Feel free to use, modify, and distribute it for public service and community infrastructure initiatives.
