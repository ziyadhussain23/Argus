# Software Requirements Specification — Argus

**Project:** Argus — Continuous Monitoring & Alert Automation System
**Version:** 1.0
**Stack:** Spring Boot 4.0.1 (Java 21) · React 18 + TypeScript · MySQL 8 · Redis 7 · WebSocket (STOMP)

---

## 1. Project Overview

Argus is a real-time observability platform that monitors the health, performance, and availability of distributed servers and applications. Lightweight **agents** (Bash/PowerShell) deployed on client machines push system metrics to a central **Spring Boot server**, which persists historical data in **MySQL**, caches live state in **Redis**, evaluates user-defined alert rules, and pushes updates to a **React dashboard** over **WebSocket**. Breached thresholds trigger multi-channel notifications (Email/SMS/Webhook).

---

## 2. Scope

| In Scope | Out of Scope |
|----------|--------------|
| Server/host metric collection (CPU, Memory, Disk, Network) | APM / distributed tracing (Jaeger-style) |
| Threshold-based alert engine | Auto-remediation / self-healing |
| Email + SMS (Twilio) + Webhook notifications | Mobile native apps |
| Web dashboard with live charts | Custom query language (PromQL) |
| Role-based access (Admin / User) | Multi-region clustering |

---

## 3. Functional Requirements

### 3.1 Authentication & User Management
- **FR-1.1** Users shall register with email + password; email verification is required before login.
- **FR-1.2** The system shall issue **JWT** tokens on login and enforce **role-based access** (`ADMIN`, `USER`).
- **FR-1.3** Users shall reset passwords via a tokenized email link (`/forgot-password`, `/reset-password`).

### 3.2 Server Registration & Agent Ingestion
- **FR-2.1** Admins shall register servers individually or in bulk via CSV import.
- **FR-2.2** Each registered server shall be issued a unique **agent token** used to authenticate metric pushes.
- **FR-2.3** The system shall expose `POST /api/v1/metrics/ingest` to accept agent payloads (CPU %, memory %, disk %, network I/O, timestamp).
- **FR-2.4** The system shall provide agent installers for **Linux, Debian, RHEL, macOS, and Windows**.

### 3.3 Real-Time Metrics & Dashboard
- **FR-3.1** The dashboard shall display live metrics for all servers via **WebSocket (STOMP/SockJS)** with no manual refresh.
- **FR-3.2** A per-server detail view shall render time-series charts (Recharts) for the last 1h / 24h / 7d.
- **FR-3.3** A global **Status** page shall summarize system-wide uptime and active incidents.

### 3.4 Heartbeat & Uptime Detection
- **FR-4.1** The server shall mark a host as `OFFLINE` if no metrics are received within a configurable heartbeat interval (default 60s).
- **FR-4.2** Offline transitions shall automatically generate an alert event.

### 3.5 Alert Rule Engine
- **FR-5.1** Users shall create custom rules with: metric, operator (`>`, `<`, `>=`, `<=`, `==`), threshold, duration window, and severity (`INFO`, `WARNING`, `CRITICAL`).
- **FR-5.2** Rules shall be evaluated on every ingestion event in **< 5 seconds** end-to-end.
- **FR-5.3** Triggered alerts shall be persisted with acknowledge / resolve states.

### 3.6 Notifications
- **FR-6.1** The system shall deliver alerts via **Email (SMTP)** with retry logic on transient failure.
- **FR-6.2** The system shall support **SMS via Twilio** with graceful degradation when the service is unavailable.
- **FR-6.3** The system shall support outbound **webhooks** (Slack/Discord-compatible JSON).

### 3.7 History, Reporting & Export
- **FR-7.1** Users shall browse historical metrics & alerts with filters by server, severity, and date range.
- **FR-7.2** Users shall schedule recurring reports delivered by email.
- **FR-7.3** Data shall be exportable to **CSV / PDF**.

---

## 4. Non-Functional Requirements

| ID | Category | Requirement |
|----|----------|-------------|
| NFR-1 | **Latency** | Alert generation latency (ingestion → notification dispatch) ≤ 5 seconds. |
| NFR-2 | **Scalability** | Ingest metrics from ≥ 20 concurrent agents at 10s resolution without loss. |
| NFR-3 | **Availability** | Monitoring server uptime ≥ 99.5% (independent of monitored hosts). |
| NFR-4 | **Persistence** | Raw metrics retained ≥ 24h; aggregated metrics ≥ 30 days in MySQL. |
| NFR-5 | **Performance** | Dashboard initial load < 2s; live updates pushed within 1s of ingestion via Redis pub/sub. |
| NFR-6 | **Security** | JWT-secured REST API; passwords hashed (BCrypt); secrets via env vars (no plaintext in `application.properties`). |
| NFR-7 | **Portability** | Server runs in any JDK 21 environment; Docker image provided; deployable on Render. |
| NFR-8 | **Usability** | Responsive UI (Tailwind + shadcn/ui), light/dark theme, keyboard-accessible command palette. |
| NFR-9 | **Testability** | JUnit 5 + Mockito coverage on the service layer. |

---

## 5. System Constraints

- **Backend:** Spring Boot 4.0.1, Java 21, Maven build (`./mvnw`).
- **Database:** MySQL 8.0 for persistence; Redis 7.0 for live state & pub/sub.
- **Frontend:** React 18.3 + TypeScript 5.8, built with Vite; consumes REST + STOMP WebSocket.
- **Agents:** POSIX shell (Linux/macOS) and PowerShell (Windows); push-only over HTTPS.
- **Deployment:** Containerized; environment-driven configuration.

---

## 6. External Interfaces

| Interface | Protocol | Purpose |
|-----------|----------|---------|
| `/api/v1/auth/*` | REST/JSON | Register, login, password reset, email verification |
| `/api/v1/servers/*` | REST/JSON | CRUD for monitored servers |
| `/api/v1/metrics/ingest` | REST/JSON | Agent → server metric push |
| `/api/v1/alerts/*`, `/api/v1/rules/*` | REST/JSON | Alert history & rule management |
| `/ws` (STOMP) | WebSocket | Live metric & alert streaming to dashboard |
| SMTP | TCP/587 | Outbound email notifications |
| Twilio REST | HTTPS | Outbound SMS notifications |

---

## 7. Assumptions & Dependencies

- Monitored hosts have outbound HTTPS access to the Argus server.
- Valid SMTP and (optional) Twilio credentials are provisioned via environment variables.
- Time on agents and server is synchronized (NTP) for accurate windowed rule evaluation.
