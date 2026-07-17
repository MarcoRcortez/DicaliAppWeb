# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project overview

A job portal ("DICALI") with a Spring Boot + MongoDB backend and a React (Vite) frontend. It is a
talent/company platform: role-based accounts (candidate / recruiter / admin) with real JWT auth,
structured candidate CVs and company vacancies, a **weighted candidate↔vacancy matching engine**, and
an optional **local-LLM (Ollama) natural-language explanation** of each match score. Candidates can also
export their CV to PDF client-side.

**History:** this repo started from an upstream job-board template and once carried a parallel *dead*
codebase (simple `CandidateModel`/`CompanyModel`/`JobPostModel`, `MatchingService`, orphaned pages like
`CreatePost.jsx`) plus a second Express backend (`backend/server.js`). All of that has been **removed** —
**Spring Boot is the single backend** and every routed page maps to the live endpoints below. If old
notes/history mention `/api/candidates|companies|jobPosts`, `MatchingService`, or those pages, they're
stale.

## Common commands

### Backend (from `backend/`)
```bash
mvn spring-boot:run         # run the API on http://localhost:8080
mvn test                    # run backend tests
mvn package                 # build the jar
```
Requires MongoDB running locally at `mongodb://localhost:27017/job_portal_db` (configured in
`backend/src/main/resources/application.properties`). Java 17, Spring Boot 3.2.3.

**Optional — Ollama (local LLM)** for AI match explanations. Without it the app still works; explanations
fall back to a deterministic Spanish summary. To enable real LLM output:
```bash
ollama pull gemma3:1b
ollama serve                # listens on http://localhost:11434
```
Configured via `ollama.*` in `application.properties` (`ollama.enabled=false` disables it entirely).

### Frontend (from `frontend/`)
```bash
npm install
npm run dev                 # Vite dev server on http://localhost:5173
npm run build               # production build
npm run lint                # ESLint
```

There is no frontend test runner configured.

## Architecture

Backend Java package root: `com.mahmudalam.jobportal.spring_boot_job_portal_app`.

### Backend — the LIVE system

- **Auth (`security/` + `service/AuthService` + `controller/AuthController`)** — real JWT auth.
  `AuthController` (`/api/auth/...`) does `register`/`login` (bcrypt passwords, roles
  `CANDIDATE`/`RECRUITER`/`ADMIN`), returns a JWT (`{token, role, userId, email}`), plus a
  security-question password-reset flow. `JwtAuthFilter` validates the bearer token on every request;
  `SecurityConfig` sets what's public vs. authenticated:
  - Public: `/api/auth/**`, `GET /api/vacancies/public/**`, swagger.
  - Authenticated: `/api/candidate-profiles/**`, `/api/company-profiles/**`, `/api/vacancies/**`
    (non-public), `/api/matches/**`.
  - `ROLE_ADMIN` only: `/api/admin/**`.
- **`model/` (live documents)**:
  - `CandidateProfileModel` (`candidate_profiles`) — structured CV: `workExperience`
    (title/company/start/end/current), `educations`, `technicalSkills` (`SkillTag`: name + level
    `BASICO|INTERMEDIO|AVANZADO|EXPERTO`), `softSkills`, `languages` (`LanguageEntry`: name + level
    `A1..C2|Nativo`), `certifications` (`CertificationEntry`: name/institution/year), `expectedSalary`,
    `workType`, `availability`, `profileComplete`, etc.
  - `VacancyModel` (`vacancies`) — `jobTitle`, `department`, `description` (UI-capped at 20 words),
    `requiredTechnicalSkills` (`SkillTag`), `desiredSoftSkills`, `requiredLanguages` (`LanguageEntry`),
    `desiredCertifications`, `experienceLevel` (coarse label) **and** `minExperienceYears` (numeric,
    nullable — used for scoring), `salaryRange`, `workAvailability`, `status` (`Abierta`/`Cerrada`),
    `recruiterId`.
  - `MatchModel` (`matches`) — persisted match: `candidateId`, `vacancyId`, `recruiterId`, `score`,
    `status` (`PENDING`/`MATCHED`/`REJECTED`), `candidateNotified`, a snapshot of vacancy fields, and
    `explanation`/`explanationGeneratedAt` (LLM explanation cache).
  - `MatchBreakdown` — a `record` (NOT a Mongo document), built on demand to feed the explanation prompt
    with per-criterion sub-scores and matched/missing skill/language lists.
  - `UserModel` (`users`), `CompanyProfileModel` (`company_profiles`).
- **`controller/` (live)**: `CandidateProfileController` (`/api/candidate-profiles`),
  `CompanyProfileController` (`/api/company-profiles`), `VacancyController` (`/api/vacancies` — creating
  a vacancy or saving a candidate profile triggers matching automatically), `MatchController`
  (`/api/matches` — recommendations, confirmed matches, accept/reject, recruiter score aggregation, and
  `GET /{matchId}/explanation`), `AdminController` (`/api/admin` — stats + CRUD over users/vacancies/
  profiles/companies). Controllers persist the **full `@RequestBody` model** via `.save()`, so adding a
  new model field needs **no controller change**.
- **`service/` (live)**:
  - `MatchingEngine` — the real matching engine. Weighted score over 6 criteria, weights **configurable**
    via `matching.weights.*` in `application.properties` (defaults: technical 0.55, soft 0.20,
    experience 0.10, salary 0.05, workType 0.05, language 0.05; a startup `@PostConstruct` logs a WARN if
    they don't sum to ~1.0). Technical/soft/language use name + level comparison; experience uses actual
    years computed from `workExperience` dates with partial credit against `minExperienceYears`.
    `calculateBreakdown(candidate, vacancy)` returns a `MatchBreakdown`; `calculateScore` delegates to it.
  - `OllamaService` — client for a local Ollama instance (`config/OllamaProperties`+`OllamaConfig` define
    the `RestTemplate` bean and `ollama.*` config). **Never throws**: any failure (Ollama down, timeout,
    bad JSON) returns `Optional.empty()` so matching keeps working without the LLM.
  - `MatchExplanationService` — builds the explanation for a match **on demand** (not during bulk
    matching, to avoid adding LLM latency to the O(n·m) recalculation loop), caches it on the `MatchModel`
    (regenerated if the match was recalculated after the last explanation), and returns a deterministic
    fallback string when Ollama is unavailable.
- **`repository/`** — Spring Data `MongoRepository` interfaces (`UserRepository`,
  `CandidateProfileRepository`, `CompanyProfileRepository`, `VacancyRepository`, `MatchRepository`). This
  is the only repository layer.

### Frontend (`frontend/src/`)

- **Auth is real**: `components/ProtectedRoute.jsx` gates routes on `useAuthStore()` (`token` + `role`),
  redirecting to `/` if missing or role-mismatched. (There is no `localStorage.adminToken` flag anymore.)
- **Routes (`App.jsx`)** — only live-flow pages are routed:
  - `/` `Home`, `/login/:roleParam` `Login`.
  - Candidate (role `CANDIDATE`): `/candidate` `CandidateDashboard`, `/candidate/empleos` `Empleos.jsx`
    (browse vacancies + see compatibility % + "¿Por qué este match?" explanation), `/candidate/curriculum`
    `MiCurriculum.jsx` (structured CV editor + PDF export).
  - Company (role `RECRUITER`): `/company` `CompanyDashboard`, `/company/postulantes` `Postulantes.jsx`
    (ranked candidates + explanation), `/company/mi-empresa` `MiEmpresa`, `/company/reclutar`
    `Reclutar.jsx` (create/edit vacancy: skills, languages, certifications, min-years).
  - `/admin` `AdminPanel` (role `ADMIN`), `*` `NotFound`.
  - Live `components/`: only `Navbar` and `ProtectedRoute` (plus page-local UI).
- `api/api.js` — single source of truth for API calls (axios instance that injects the JWT). Functions
  cover `/auth`, `/candidate-profiles`, `/company-profiles`, `/vacancies`, `/matches`, `/admin`.
- Candidates fill their CV via **structured forms** in `MiCurriculum.jsx` (deliberate: no free-text CV
  parsing). The CV PDF is generated client-side with `jsPDF`.
- Styling is Tailwind v4 via `@tailwindcss/vite` (see `vite.config.js`), not the v3 PostCSS pipeline.
