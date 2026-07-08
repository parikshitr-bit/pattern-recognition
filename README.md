# PatternIQ — Pattern Recognition Assessment

A full-stack web app for running timed **pattern-recognition assessments**. Candidates
register/log in, take an assessment of randomized questions (number sequences, shape
patterns, and matrices), and get a scored result plus detailed performance analytics.

- **Backend:** Spring Boot 4.1 (Java 21) · Spring Data JPA · PostgreSQL · JWT auth · BCrypt
- **Frontend:** React + Vite · Tailwind CSS · React Router · Recharts · Axios

---

## Table of contents
- [Features](#features)
- [Tech stack](#tech-stack)
- [Project structure](#project-structure)
- [Prerequisites](#prerequisites)
- [Setup](#setup)
  - [1. Database](#1-database)
  - [2. Backend](#2-backend)
  - [3. Frontend](#3-frontend)
- [Configuration](#configuration)
- [API reference](#api-reference)
- [Authentication](#authentication)
- [Assessment rules](#assessment-rules)
- [Running on the Cognizant corporate network](#running-on-the-cognizant-corporate-network)
- [Notes & known issues](#notes--known-issues)

---

## Features

- **Auth** — register / login with JWT-based sessions; passwords stored as BCrypt hashes.
- **Assessment engine** — each attempt draws 10 random questions from the pool; per-question
  timing and attempt counts are tracked.
- **Scoring** — 10 points per correct answer (max 100) plus accuracy percentage.
- **Results & analytics** — question-by-question breakdown, time-per-question and
  attempts charts, and accuracy-by-difficulty.
- **Dashboard** — attempt history with score, accuracy, and time per attempt (max 3 attempts).
- **Profile** — update name/email and change password.
- **Toasts** — non-blocking success/error notifications across the app.

## Tech stack

| Layer | Technologies |
|-------|--------------|
| Backend | Spring Boot 4.1.0, Java 21, Spring Web (MVC), Spring Data JPA / Hibernate, PostgreSQL driver, Lombok, DevTools |
| Auth | `jjwt` 0.12.6 (HS256 JWTs), `spring-security-crypto` (BCrypt) |
| Frontend | React 18, Vite, Tailwind CSS, React Router, Recharts, Axios |
| Database | PostgreSQL 18 |
| Build | Gradle (backend), npm/Vite (frontend) |

## Project structure

```
pattern_recognition/
├── backend/                     # Spring Boot API
│   └── src/main/java/com/assessment/backend/
│       ├── config/              # CORS, PasswordEncoder bean, password migration
│       ├── controller/          # Auth, Question, Session REST controllers
│       ├── dto/                 # Request/response payloads (auth, questions, sessions)
│       ├── exception/           # Custom exceptions + global handler
│       ├── model/               # JPA entities: Candidate, Question, AssessmentSession, Response
│       ├── repository/          # Spring Data repositories
│       ├── security/            # JwtService, JwtAuthFilter
│       └── service/             # AuthService, QuestionService, SessionService, ScoreService
│   └── src/main/resources/application.properties
├── assessment-frontend/         # React + Vite client
│   └── src/
│       ├── api/                 # axiosInstance (JWT interceptor) + endpoint wrappers
│       ├── context/             # AuthContext, ToastContext
│       ├── components/          # Navbar, modals, shared UI
│       └── pages/               # Login, Register, Dashboard, Instructions,
│                                #   Assessment, Result, Analytics, Profile, NotFound
└── database/
    ├── create_tables.sql        # Schema
    └── seed_data.sql            # Seed candidate + 40 questions
```

## Prerequisites

- **JDK 21** (the build targets Java 21)
- **PostgreSQL 18** running locally on `localhost:5432`
- **Node.js 18+** and npm

## Setup

### 1. Database

Create the database, then run the schema and seed scripts:

```bash
# create the database (one time)
psql -U postgres -c "CREATE DATABASE pattern_recognition;"

# schema + seed data (candidate + 40 questions)
psql -U postgres -d pattern_recognition -f database/create_tables.sql
psql -U postgres -d pattern_recognition -f database/seed_data.sql
```

Seeded login: **`candidate1` / `test123`**. Passwords are seeded in plain text and
automatically re-hashed to BCrypt on first backend startup (see
`config/PasswordHashMigration`).

### 2. Backend

Configure the datasource in `backend/src/main/resources/application.properties`
(see [Configuration](#configuration)), then:

```bash
cd backend
./gradlew bootRun        # Windows: gradlew.bat bootRun
```

The API starts on **http://localhost:8080**.

### 3. Frontend

```bash
cd assessment-frontend
npm install
npm run dev
```

The app starts on **http://localhost:5173** (Vite) and talks to the API at
`http://localhost:8080/api`.

## Configuration

`backend/src/main/resources/application.properties`:

```properties
spring.application.name=backend

# Datasource — match your local Postgres
spring.datasource.url=jdbc:postgresql://localhost:5432/pattern_recognition
spring.datasource.username=postgres
spring.datasource.password=<your-postgres-password>

spring.jpa.hibernate.ddl-auto=none      # schema is managed via SQL scripts, not JPA
spring.jpa.properties.hibernate.dialect=org.hibernate.dialect.PostgreSQLDialect

# JWT — override the secret in real deployments (e.g. via env var)
jwt.secret=<a-long-random-secret-at-least-32-chars>
jwt.expiration-ms=86400000               # 24h
```

Frontend API base URL (optional) via `VITE_API_BASE_URL`; defaults to
`http://localhost:8080/api`.

## API reference

All routes are under `/api`. Every route **except** `POST /auth/login` and
`POST /auth/register` requires an `Authorization: Bearer <token>` header.

| Method | Path | Description |
|--------|------|-------------|
| POST | `/auth/login` | Log in → `{ token, candidate }` |
| POST | `/auth/register` | Register → `{ token, candidate }` |
| PUT | `/candidates/{id}` | Update name/email |
| PUT | `/candidates/{id}/password` | Change password |
| GET | `/questions?candidateId={id}` | 10 questions for a new attempt |
| POST | `/sessions/start` | Start an attempt → `{ sessionId, attemptNumber }` |
| POST | `/sessions/{sessionId}/submit` | Submit answers → result |
| GET | `/sessions/{sessionId}/result` | Result for a session |
| GET | `/sessions/{sessionId}/analytics` | Analytics for a session |
| GET | `/sessions?candidateId={id}` | Attempt history |

## Authentication

- **JWT** — `security/JwtService` issues an HS256 token (subject = candidate id, 24h
  expiry) on login/register. `security/JwtAuthFilter` validates the `Bearer` token on
  every protected request and returns `401` if it's missing/invalid.
- **Passwords** — `config/PasswordConfig` provides a `BCryptPasswordEncoder`.
  `service/AuthService` hashes on register/change-password (`encode`) and verifies on
  login/change-password (`matches`). Raw passwords are never stored.
- The frontend keeps the token in `sessionStorage` and attaches it via an Axios
  interceptor (`api/axiosInstance.js`).

## Assessment rules

- 10 questions per attempt, drawn randomly from the pool (40 questions:
  ~12 easy / 16 medium / 12 hard, across number-sequence, shape-pattern, and matrix types).
- Maximum **3 attempts** per candidate.
- Scoring: **10 points per correct answer** (max 100); accuracy = correct / total.
- Correct answers are never sent to the client — grading happens server-side on submit.

## Running on the Cognizant corporate network

The corporate SSL-inspection proxy blocks **binary** downloads (`.jar` / `.zip`) and
its root CA isn't in the JDK trust store. This repo already works around it, but note:

- `backend/build.gradle` resolves dependencies from **Google's Maven Central mirror**
  (not blocked) before falling back to Maven Central.
- The **Gradle distribution** itself can't be downloaded by the wrapper. Use a locally
  installed Gradle (9.x) instead of `./gradlew`.
- Point Java at the **Windows certificate store** so TLS to Maven succeeds:

```powershell
# From backend/ , using a locally installed JDK 21 + Gradle 9.x
$env:JAVA_HOME = "C:\Program Files\OpenLogic\jdk-21.0.3.9-hotspot"
$env:GRADLE_OPTS = "-Djavax.net.ssl.trustStoreType=Windows-ROOT"
gradle bootRun          # use your local gradle, not the wrapper
```

On an unrestricted network, plain `./gradlew bootRun` works without any of the above.

## Notes & known issues

- **Schema is managed by SQL** (`ddl-auto=none`). If you change an entity, update
  `database/create_tables.sql` and apply the change to your database — Hibernate won't
  auto-migrate.
- **Passwords** — seeded/plaintext passwords are migrated to BCrypt on first startup;
  the migration is idempotent (skips values already in `$2...` format).
- `components/Navbar.jsx` imports `./LogoutModal` while the file is `Logoutmodal.jsx`.
  This works on Windows/macOS (case-insensitive filesystems) but would break a
  case-sensitive Linux/CI build — rename for consistency if you deploy there.
