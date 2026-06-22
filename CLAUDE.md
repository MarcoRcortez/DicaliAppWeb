# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project overview

A job portal ("DICALI") with a Spring Boot + MongoDB backend and a React (Vite) frontend. Originally a
simple job board (see [README.md](README.md) for the original design — its "API Endpoints" section is
now historical, not authoritative), it has been reworked into a talent/company platform: candidate and
company registration, NIT-based company verification/audit, candidate↔job matching, and PDF résumé
generation.

There used to be a second, competing backend (`backend/server.js`, a standalone Express + Mongoose
script also bound to port 8080) left over from an earlier iteration. It has been removed — **Spring Boot
is the single backend**. If you see references to it in old notes/history, they're stale.

## Common commands

### Backend (from `backend/`)
```bash
mvn spring-boot:run         # run the API on http://localhost:8080
mvn test                    # run backend tests
mvn package                 # build the jar
```
Requires MongoDB running locally at `mongodb://localhost:27017/job_portal_db` (configured in
`backend/src/main/resources/application.properties`).

### Frontend (from `frontend/`)
```bash
npm install
npm run dev                 # Vite dev server on http://localhost:5173
npm run build                # production build
npm run lint                 # ESLint
```

There is no frontend test runner configured.

## Architecture

### Backend (`backend/src/main/java/.../spring_boot_job_portal_app/`)
- `controller/` — `@RestController` classes, one per resource:
  - `CandidateController` (`/api/candidates/...`) — register, list, lookup by email, and
    `/match/{jobId}` (candidate↔job compatibility, see `MatchingService`).
  - `CompanyController` (`/api/companies/...`) — register, list, `/pending` (audit queue),
    `/verify/{id}`, `/verify-nit` (plain-text NIT lookup used by `CreatePost.jsx` before letting a
    company publish), plus an admin `/save` upsert and `/delete/{id}`.
  - `JobPostController` (`/api/jobPosts/...`) — `/all`, `/register` (simple posting from `PostJob.jsx`),
    `/add` (NIT-audited posting from `CreatePost.jsx`), `/save` (admin upsert), `DELETE /{id}`.
- `model/` — MongoDB documents: `CandidateModel` (`Candidates` collection, fields `fullName`/`email`/
  `education`/`experienceYears`/`skills`/`whatsapp`), `CompanyModel` (`companies`, with `status`/
  `verified` for the audit workflow), `JobPostModel` (`JobPosts`) and `CandidateMatchDTO`
  (candidate + match score).
  - `JobPostModel` deliberately carries **two parallel sets of fields** because the frontend has two
    different job-posting flows that were never unified: `title`/`companyName`/`city`/`salary`/
    `description` (simple flow: `PostJob.jsx`, displayed by `Feed.jsx`/`JobBoard.jsx`/`AdminJobs.jsx`)
    and `profile`/`desc`/`exp`/`techs`/`whatsappLink`/`nit` (audited flow: `CreatePost.jsx`, consumed by
    `MatchingService`). `category` is shared by both. When touching job posts, check which flow the page
    you're editing belongs to rather than assuming one field set.
- `repository/` — Spring Data `MongoRepository` interfaces: `CandidateRepository`, `CompanyRepository`
  (`findByNit`), `JobRepository`. This is the only repository layer — don't recreate a parallel one.
- `service/` — `MatchingService` (candidate↔job score: 50% on meeting min experience, 50% on skill/tech
  overlap, wired into `CandidateController#match`) and `PdfGeneratorService` (builds a one-page CV PDF
  via iText 7; not currently called from a controller — `CandidateProfile.jsx` instead generates the PDF
  client-side with `jsPDF`/`html2canvas`).

### Frontend (`frontend/src/`)
- `api/api.js` — small `axios` helper module mirroring the real backend endpoints above. Most pages
  currently call `axios` directly with hardcoded `http://localhost:8080/...` URLs instead of going
  through it; prefer routing new code through `api.js` where practical.
- `App.jsx` — route table. Some pages are intentional UI alternates of each other and only one of each
  pair is routed: `Feed.jsx` duplicates `JobBoard.jsx` (job listing), `UserProfile.jsx` duplicates
  `CandidateProfile.jsx` (candidate profile lookup + PDF download). `JobBoard`/`CandidateProfile` are the
  ones wired into `App.jsx`; the other two are kept as alternates, not bugs.
- `components/ProtectedRoute.jsx` gates the `/admin*` routes on `localStorage.getItem("adminToken") ===
  "true"`. There is no real authentication yet — nothing in `Login.jsx` actually sets that flag, so the
  admin routes are effectively only reachable by setting it manually (e.g. via devtools) until real login
  is implemented.
- Styling is Tailwind v4 via `@tailwindcss/vite` (see `vite.config.js`), not the v3 PostCSS pipeline.
