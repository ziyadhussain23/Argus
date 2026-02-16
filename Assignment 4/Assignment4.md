# Assignment 4 — Software Architecture

**Course:** CS 331 — Software Engineering Lab  
**Project:** Argus — Server Monitoring & Alert System  
**Team:** NightsWatch

---

## I. Software Architecture Style

### Chosen: Layered (N-Tier) Architecture

Argus uses a **3-tier layered architecture** — Presentation, Application, and Data tiers — where each tier only communicates with the one directly below it.

```
┌─────────────────────────────────────────────────┐
│              PRESENTATION TIER                  │
│        React 18 + Vite (SPA, port 5173)         │
│    Pages | Components | Hooks | API Client      │
└───────────────────┬─────────────────────────────┘
                    │  REST (HTTP/JSON) + WebSocket
                    ▼
┌─────────────────────────────────────────────────┐
│              APPLICATION TIER                   │
│          Spring Boot 4.0 (port 8080)            │
│  ┌───────────────────────────────────────────┐  │
│  │  Controller Layer  (REST endpoints)       │  │
│  ├───────────────────────────────────────────┤  │
│  │  Service Layer     (business logic)       │  │
│  ├───────────────────────────────────────────┤  │
│  │  Repository Layer  (data access / JPA)    │  │
│  └───────────────────────────────────────────┘  │
│  Cross-cutting: Config | Security | DTOs        │
└───────────────────┬─────────────────────────────┘
                    │  JPA / Redis protocol
                    ▼
┌─────────────────────────────────────────────────┐
│                 DATA TIER                       │
│        MySQL 8.0  +  Redis 7.0 (cache)          │
└─────────────────────────────────────────────────┘
```

A lightweight **Bash Agent** on monitored servers pushes metrics into the Application Tier via REST.

---

### I-A. Justification by Granularity [5 Marks]

Each Java package maps to exactly one architectural layer with strict unidirectional dependencies:

**Controller → Service → Repository → Entity** (no reverse calls)

| Layer | Package | Classes | Granularity |
|---|---|---|---|
| Controller | `controller` | 5 | Coarse — grouped by domain (Auth, Server, Alert, Metric, Notification) |
| Service | `service` | 16 | Fine — one service per concern (e.g., `AlertEvaluationService`, `SmsRateLimitService`) |
| Repository | `repository` | 8 | One interface per entity, Spring auto-generates implementation |
| Entity | `model` | 8 | JPA POJOs mapped 1:1 to MySQL tables |
| DTO | `dto.*` | 13 | Separates API contract from internal entities |
| Cross-cutting | `config`, `exception`, `util` | 11 | Security filters, WebSocket config, exception handlers |

**Key points:**
- Services are **fine-grained and single-responsibility** (injected via Spring DI)
- Controllers are **coarse-grained** (5 controllers for 8 entities)
- **DTO boundary** ensures entity changes don't break the API
- Frontend is **fully decoupled** — communicates only via REST + WebSocket

---

### I-B. Why Layered Architecture? [5 Marks]

**Scalability:**
- Frontend and backend are **independently deployable** (static SPA vs Spring Boot JAR)
- **JWT-based stateless auth** allows horizontal backend scaling
- **Redis** offloads rate-limiting/caching from the application tier
- Layered monolith is **right-sized** for this scale — microservices would add unnecessary overhead

**Maintainability:**
- **Separation of concerns** — swapping SMS provider only touches `SmsService` + `TwilioConfig`; controllers/repositories untouched
- **Package-per-layer** convention — any class is locatable instantly
- **DTO decoupling** — API shapes evolve independently of DB schema

**Performance:**
- **`@Async`** notification dispatch — alert evaluation doesn't block on email/SMS
- **WebSocket push** — real-time updates without HTTP polling
- **`@Scheduled` background jobs** — metric cleanup, heartbeat monitoring, retries run on separate threads

**Other:**
- **Security** — layered JWT filter chain separates auth concerns
- **Testability** — each layer testable in isolation (mock lower layers)
- **Why not Microservices?** — single DB, single deployment unit, small team; microservices would add distributed complexity for no benefit
- **Why not unstructured Monolith?** — without layers, logic leaks across boundaries and maintenance becomes unmanageable

---

## II. Application Components [10 Marks]

### Component Interaction Diagram

```
  ┌──────────────┐          ┌─────────────────────────────────────┐
  │  Bash Agent   │──POST──▶│         Spring Boot Backend          │
  │ (Linux host)  │ /ingest │                                      │
  └──────────────┘          │ Controllers → Services → Repositories│
                            │      │            │                  │
  ┌──────────────┐   REST   │      ▼            ▼                  │
  │  React SPA   │◄────────▶│  API Layer    ┌────────┐             │
  │  (Browser)   │          │      │        │ MySQL  │             │
  │              │◄──WS─────│  WebSocket    │ Redis  │             │
  └──────────────┘   push   │  Broker       └────────┘             │
                            │      │                               │
                            │  Notification Service                │
                            │     ├──▶ Twilio (SMS)                │
                            │     └──▶ SMTP (Email)                │
                            └─────────────────────────────────────┘
```

---

### A. Backend Components

**Controllers (6):**
- `AuthController` — register, login, email verification, password reset
- `ServerController` — server CRUD, agent key management
- `MetricIngestionController` — metric ingestion + queries
- `AlertController` — alert rules, alert listing, acknowledge/resolve
- `NotificationController` — notification preferences, phone verification
- `SmsWebhookController` — Twilio delivery callbacks

**Services (16):**
- `UserService`, `JwtService` — auth & token management
- `ServerService`, `ServerHeartbeatService` — server CRUD & heartbeat monitoring
- `MetricService` — metric ingestion & cleanup
- `AlertRuleService`, `AlertEvaluationService` — alert rules & threshold engine
- `NotificationService`, `NotificationPreferenceService` — async dispatch & preferences
- `EmailService` — SMTP email sending
- `SmsService`, `TwilioSmsService`, `SmsTemplateService` — SMS delivery
- `SmsRateLimitService`, `SmsDeliveryTrackingService` — rate limiting & tracking
- `PhoneVerificationService` — OTP verification

**Repositories (8):** `UserRepository`, `ServerRepository`, `MetricRepository`, `AlertRepository`, `AlertRuleRepository`, `NotificationRepository`, `SmsLogRepository`, `UserNotificationPreferenceRepository`

**Entities (8):** `User`, `Server`, `Metric`, `AlertRule`, `Alert`, `Notification`, `SmsLog`, `UserNotificationPreference`

**DTOs (13):**
- Request: `LoginRequest`, `RegisterRequest`, `ServerRequest`, `MetricPayload`, `AlertRuleRequest`, `NotificationPreferenceRequest`, `PhoneUpdateRequest`
- Response: `ApiResponse<T>`, `AuthResponse`, `ServerResponse`, `MetricResponse`, `AlertResponse`, `NotificationPreferenceResponse`, `SmsLogResponse`

**Config & Cross-cutting (11):** `SecurityConfig`, `JwtAuthenticationFilter`, `WebSocketConfig`, `SchedulingConfig`, `TwilioConfig`, `SmsRateLimitConfig`, `GlobalExceptionHandler`, `BadRequestException`, `SmsDeliveryException`, `RateLimitExceededException`, `PhoneNumberValidator`

---

### B. Frontend Components

**Pages (20):** `Index`, `Login`, `Register`, `VerifyEmail`, `EmailVerificationSent`, `Dashboard`, `Servers`, `AddServer`, `ServerDetail`, `Alerts`, `AlertRules`, `Settings`, `History`, `About`, `Documentation`, `FAQ`, `HelpSupport`, `Privacy`, `Cookies`, `NotFound`

**Custom Components (7):** `AlertCard`, `AnimatedBackground`, `MetricCard`, `NavLink`, `ServerCard`, `StatusBadge`, `ThemeToggle`

**Layout (2):** `MainLayout`, `Sidebar`

**State Management (2 Contexts):** `AuthContext` (JWT auth state), `ThemeContext` (dark/light mode)

**Hooks (3):** `use-realtime` (WebSocket subscriptions), `use-toast` (notifications), `use-mobile` (responsive detection)

**API Client (`api.ts`):** Centralized HTTP client with JWT injection + TypeScript interfaces

**UI Library:** 40+ shadcn/ui components (Button, Card, Dialog, Table, Form, Badge, etc.)

---

### C. Agent Component

- `argus-agent.sh` — collects 12 system metrics (CPU, memory, disk, network, load, uptime) and POSTs to backend
- `argus-agent-loop.sh` — runs agent on a configurable interval
- `argus-agent-test.sh` — test/debug version

---

### D. External Integrations

| Service | Purpose |
|---|---|
| MySQL 8.0 | Primary database (8 tables) |
| Redis 7.0 | Rate limiting & caching |
| Twilio | SMS alert notifications |
| SMTP (Gmail) | Email notifications & verification |
| WebSocket (STOMP/SockJS) | Real-time dashboard updates |

---

### Component Summary

| Category | Count |
|---|---|
| Backend (Controllers + Services + Repos + Entities + DTOs + Config) | 62 |
| Frontend (Pages + Components + Layout + Contexts + Hooks) | 34 + 40+ UI lib |
| Agent Scripts | 3 |
| External Integrations | 5 |
| **Total** | **~145** |
