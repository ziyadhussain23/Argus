# Assignment 4 — Software Architecture

**Course:** CS 331 (Software Engineering Lab)  
**Project:** Argus — Continuous Monitoring and Alert Automation System  
**Team:** NightsWatch

---

## Part I — Software Architecture Style [10 Marks]

### Chosen Architecture: Layered (N-Tier) Architecture

Argus follows a **Layered (N-Tier) Architecture** comprising **three distinct tiers** — a React-based **Presentation Tier**, a Spring Boot **Application Tier** (itself internally layered), and a **Data Tier** (MySQL + Redis). Each tier communicates only with the tier directly below it, enforcing strict separation of concerns.

```
┌─────────────────────────────────────────────────────────┐
│                   PRESENTATION TIER                     │
│          React 18 + Vite (SPA on port 5173)             │
│   Pages │ Components │ Contexts │ Hooks │ API Client    │
└──────────────────────┬──────────────────────────────────┘
                       │  REST API (HTTP/JSON) + WebSocket (STOMP/SockJS)
                       ▼
┌─────────────────────────────────────────────────────────┐
│                   APPLICATION TIER                      │
│              Spring Boot 4.0 (port 8080)                │
│                                                         │
│  ┌───────────────────────────────────────────────────┐  │
│  │  Controller Layer  (REST endpoints, validation)   │  │
│  ├───────────────────────────────────────────────────┤  │
│  │  Service Layer  (business logic, orchestration)   │  │
│  ├───────────────────────────────────────────────────┤  │
│  │  Repository Layer  (data access, JPA queries)     │  │
│  └───────────────────────────────────────────────────┘  │
│                                                         │
│  Cross-cutting: Config │ Security │ DTOs │ Exceptions   │
└──────────────────────┬──────────────────────────────────┘
                       │  JDBC / JPA + Redis protocol
                       ▼
┌─────────────────────────────────────────────────────────┐
│                      DATA TIER                          │
│          MySQL 8.0 (relational)  +  Redis 7.0 (cache)  │
└─────────────────────────────────────────────────────────┘
```

Additionally, a lightweight **Bash Agent** runs on monitored servers and pushes metrics into the Application Tier via REST, acting as an external data source.

---

### I-A. Justification by Granularity of Software Components [5 Marks]

The project maps cleanly to a layered architecture — each Spring Boot package corresponds to exactly one architectural layer, and no package crosses layer boundaries.

| Architectural Layer | Java Package | Granularity / Responsibility |
|---|---|---|
| **Controller Layer** | `controller` (5 classes) | Thin REST controllers that accept HTTP requests, delegate to services, and return standardized `ApiResponse<T>` wrappers. No business logic resides here. |
| **Service Layer** | `service` (12+ classes) | All business logic — alert evaluation, metric ingestion pipeline, notification dispatch, JWT handling, scheduled jobs. Uses `@Async`, `@Scheduled`, `@Transactional`. |
| **Repository Layer** | `repository` (8 interfaces) | Spring Data JPA interfaces providing CRUD and custom queries (time-range, aggregation, cleanup). Zero implementation code — Spring generates it. |
| **Entity / Model Layer** | `model` (8 entities) | JPA-annotated POJOs mapped 1:1 to MySQL tables. Defines relationships (`@ManyToOne`, `@OneToMany`), enums, and indexes. |
| **DTO Layer** | `dto.request` (6), `dto.response` (7) | Decouples the API contract from internal entities. Request DTOs carry validated input; Response DTOs shape output. |
| **Config / Cross-cutting** | `config` (6), `exception` (4), `util` (1) | Security (JWT filter chain), WebSocket (STOMP broker), Twilio SDK init, rate-limit config, global exception handler. |

**Key granularity observations:**

- **Fine-grained services** — Each domain concept has its own service (e.g., `AlertEvaluationService`, `MetricService`, `NotificationService`, `SmsService`, `PhoneVerificationService`). Services are single-responsibility and injected via Spring DI.
- **Coarse-grained controllers** — Controllers are grouped by domain (Auth, Server, Alert, Metric, Notification) rather than per-entity, keeping the API surface manageable (5 controllers for 8 entities).
- **Strict unidirectional dependency** — Controllers → Services → Repositories → Entities. No repository ever calls a controller; no entity depends on a service.
- **DTO boundary** — DTOs sit between Controller and Service layers, ensuring internal entity changes don't break the external API.
- **Presentation tier is fully decoupled** — The React SPA communicates exclusively through REST endpoints and WebSocket topics. It has its own layered structure (Pages → Components → Hooks → API Client).

---

### I-B. Justification — Why Layered Architecture Is the Best Choice [5 Marks]

#### 1. Scalability

- **Independent tier deployment** — Frontend (Vite static build) and Backend (Spring Boot JAR) are separately deployable. The frontend can be served via a CDN while the backend scales vertically or behind a load balancer.
- **Redis caching layer** — Rate limiting and caching are offloaded to Redis, preventing the application tier from becoming a bottleneck under high metric ingestion rates.
- **Stateless backend** — JWT-based authentication means no server-side sessions, allowing horizontal scaling of the application tier without sticky sessions.
- **Sufficient for project scope** — Argus monitors tens of servers, not thousands. A layered monolith avoids the operational overhead of microservices (service discovery, distributed tracing, inter-service communication) that would be premature for this scale.

#### 2. Maintainability

- **Clear separation of concerns** — Changing the SMS provider (e.g., from Twilio to another) only affects `SmsService` and `TwilioConfig` in the service/config layers. Controllers and repositories remain untouched.
- **DTO decoupling** — API response shapes can evolve independently of database schema changes. Adding a column to the `Server` entity doesn't require a frontend update if the response DTO stays stable.
- **Package-per-layer convention** — New developers can locate any class in seconds: need a business rule? → `service/`. Need a database query? → `repository/`. Need an endpoint? → `controller/`.
- **~50 backend classes across 8 packages** — The codebase is large enough to benefit from layering but small enough that a monolithic deployment remains manageable.

#### 3. Performance

- **Asynchronous processing** — `@Async` annotation on notification dispatch means alert evaluation doesn't block on email/SMS delivery.
- **WebSocket push** — Real-time dashboard updates use STOMP/SockJS push instead of HTTP polling, significantly reducing latency and server load.
- **Scheduled background jobs** — Metric cleanup (30-day retention), server heartbeat monitoring (every 30s), and notification retries run on separate threads via `@Scheduled`, keeping the request-handling threads free.
- **Indexed database queries** — Metrics table is indexed on `(server, timestamp)` and `(type, timestamp)` for fast time-range queries.

#### 4. Other Considerations

- **Security** — The layered filter chain (`JwtAuthenticationFilter` → `SecurityConfig`) cleanly separates authentication concerns. Public endpoints (agent ingestion, webhooks) and protected endpoints (dashboard APIs) are configured declaratively.
- **Testability** — Each layer can be tested in isolation: unit tests for services (mock repositories), integration tests for controllers (mock services), repository tests against an embedded database.
- **Team expertise** — Spring Boot's convention-over-configuration naturally enforces layered architecture. The team leverages well-documented patterns without custom framework overhead.
- **Why not Microservices?** — The project has a single deployment unit, a single database, and a small team. Microservices would introduce network latency between services, complex deployment orchestration, and distributed transaction challenges — all unnecessary at this scale.
- **Why not pure Monolithic (no layers)?** — Without layered separation, business logic would leak into controllers, database queries would be scattered everywhere, and the codebase would become unmaintainable as features (SMS, alerts, metrics) grow.

---

## Part II — Application Components [10 Marks]

### Component Interaction Diagram

```
  ┌──────────────┐         ┌──────────────────────────────────────────┐
  │  Bash Agent   │──POST──▶│            Spring Boot Backend           │
  │ (Linux host)  │  /ingest│                                          │
  └──────────────┘         │  Controllers ──▶ Services ──▶ Repositories│
                           │       │              │                    │
  ┌──────────────┐  REST   │       ▼              │                    │
  │ React SPA    │◀───────▶│  API Endpoints       │                    │
  │ (Browser)    │         │       │              ▼                    │
  │              │◀──WS────│  WebSocket      ┌─────────┐              │
  └──────────────┘  push   │  Broker         │ MySQL   │              │
                           │       │         │ Redis   │              │
                           │       ▼         └─────────┘              │
                           │  Notification                             │
                           │  Service ──▶ Twilio (SMS)                 │
                           │           ──▶ SMTP (Email)                │
                           └──────────────────────────────────────────┘
```

---

### A. Backend Components (Spring Boot — Java 21)

#### Controllers (API Layer)

| Component | Endpoints | Responsibility |
|---|---|---|
| `AuthController` | `/api/v1/auth/**` | Register, login, email verification, password reset |
| `ServerController` | `/api/v1/servers/**` | Server CRUD, agent key regeneration, metric queries |
| `MetricIngestionController` | `/api/v1/metrics/**` | Agent metric ingestion (public), metric queries (auth) |
| `AlertController` | `/api/v1/alerts/**` | Alert rule CRUD, alert listing, acknowledge/resolve |
| `NotificationController` | `/api/v1/notifications/**` | Notification preferences, phone verification, SMS stats |
| `SmsWebhookController` | `/api/v1/webhooks/sms/**` | Twilio delivery status callbacks, inbound SMS |

#### Services (Business Logic Layer)

| Component | Key Responsibility |
|---|---|
| `UserService` | Registration, login, email verification, password reset |
| `JwtService` | JWT token generation, validation, extraction |
| `ServerService` | Server CRUD, agent key generation, heartbeat tracking, status updates |
| `MetricService` | Metric ingestion pipeline, scheduled cleanup (30-day retention) |
| `AlertRuleService` | Alert rule CRUD |
| `AlertEvaluationService` | Core alert engine — threshold evaluation, duration checks, cooldowns, auto-resolve |
| `NotificationService` | Async email + SMS dispatch, retry of failed notifications |
| `EmailService` | Email sending via SMTP (JavaMailSender) |
| `SmsService` | SMS sending interface |
| `TwilioSmsService` | Twilio SDK integration for SMS delivery |
| `SmsTemplateService` | SMS message template construction |
| `SmsRateLimitService` | Per-user hourly/daily SMS rate limiting |
| `SmsDeliveryTrackingService` | Background job for SMS delivery status tracking |
| `PhoneVerificationService` | OTP generation, sending, and verification |
| `NotificationPreferenceService` | User notification preferences CRUD |
| `ServerHeartbeatService` | Scheduled (30s) — marks servers OFFLINE if no heartbeat for 120s |

#### Repositories (Data Access Layer)

| Component | Entity | Key Queries |
|---|---|---|
| `UserRepository` | User | Find by username, email, verification token |
| `ServerRepository` | Server | Find by owner, agent key; count by status |
| `MetricRepository` | Metric | Time-range queries, averages, cleanup older than N days |
| `AlertRepository` | Alert | Active alerts, recent alerts by rule |
| `AlertRuleRepository` | AlertRule | Find by server + metric type |
| `NotificationRepository` | Notification | Pending notifications for retry |
| `SmsLogRepository` | SmsLog | Find by Twilio message SID |
| `UserNotificationPreferenceRepository` | UserNotificationPreference | Find by user |

#### Entities (Data Model Layer)

| Entity | Table | Key Fields |
|---|---|---|
| `User` | `users` | username, email, phone, passwordHash, role (ADMIN/USER), emailVerified |
| `Server` | `servers` | name, hostAddress, agentKey, status (ONLINE/OFFLINE/WARNING/CRITICAL), owner |
| `Metric` | `metrics` | metricType (13 types), value, unit, timestamp |
| `AlertRule` | `alert_rules` | name, metricType, conditionOperator, thresholdValue, severity, cooldown |
| `Alert` | `alerts` | title, message, severity, status (ACTIVE/ACKNOWLEDGED/RESOLVED), metricValue |
| `Notification` | `notifications` | channel (EMAIL/SMS/SLACK/WEBHOOK), status (PENDING/SENT/FAILED), retryCount |
| `SmsLog` | `sms_logs` | twilioMessageSid, phone, deliveryStatus, price |
| `UserNotificationPreference` | `user_notification_preferences` | emailEnabled, smsEnabled, smsForCriticalOnly, quietHours |

#### DTOs (Data Transfer Objects)

- **Request DTOs (6):** `LoginRequest`, `RegisterRequest`, `ServerRequest`, `MetricPayload`, `AlertRuleRequest`, `NotificationPreferenceRequest`, `PhoneUpdateRequest`
- **Response DTOs (7):** `ApiResponse<T>`, `AuthResponse`, `ServerResponse`, `MetricResponse`, `AlertResponse`, `NotificationPreferenceResponse`, `SmsLogResponse`

#### Config & Cross-cutting (11 classes)

- **Configuration:** `SecurityConfig`, `JwtAuthenticationFilter`, `WebSocketConfig`, `SchedulingConfig`, `TwilioConfig`, `SmsRateLimitConfig`
- **Exception Handling:** `GlobalExceptionHandler`, `BadRequestException`, `SmsDeliveryException`, `RateLimitExceededException`
- **Utility:** `PhoneNumberValidator`

---

### B. Frontend Components (React 18 + TypeScript + Vite)

#### Pages (20)

| Page | Route | Description |
|---|---|---|
| `Index` | `/` | Landing page with animated background |
| `Login` | `/login` | User authentication form |
| `Register` | `/register` | User registration form |
| `VerifyEmail` | `/verify-email` | Email verification handler |
| `EmailVerificationSent` | `/email-verification-sent` | Post-registration notice |
| `Dashboard` | `/dashboard` | Real-time monitoring dashboard |
| `Servers` | `/servers` | Server list with status cards |
| `AddServer` | `/servers/add` | New server registration form |
| `ServerDetail` | `/servers/:id` | Individual server metrics & charts |
| `Alerts` | `/alerts` | Active alerts list |
| `AlertRules` | `/alert-rules` | Alert rule management |
| `Settings` | `/settings` | User preferences & phone management |
| `History` | `/history` | Historical metric data |
| `About` | `/about` | About the project |
| `Documentation` | `/docs` | User documentation |
| `FAQ` | `/faq` | Frequently asked questions |
| `HelpSupport` | `/help` | Help & support page |
| `Privacy` | `/privacy` | Privacy policy |
| `Cookies` | `/cookies` | Cookie policy |
| `NotFound` | `*` | 404 error page |

#### Custom Components (7)

- `AlertCard` — Displays individual alert with severity, message, and actions
- `AnimatedBackground` — Visual animated background for the landing page
- `MetricCard` — Metric visualization card (CPU, memory, disk, network)
- `NavLink` — Navigation link with active state styling
- `ServerCard` — Server summary card with status badge
- `StatusBadge` — Color-coded status indicator (ONLINE / OFFLINE / WARNING / CRITICAL)
- `ThemeToggle` — Light/dark theme toggle button

#### Layout Components (2)

- `MainLayout` — Application shell with sidebar + main content area
- `Sidebar` — Navigation sidebar with route links

#### Contexts (2)

- `AuthContext` — Global authentication state: user object, JWT token (localStorage), login/logout functions
- `ThemeContext` — Theme state management (light/dark mode toggle)

#### Hooks (3)

- `use-realtime` — STOMP/SockJS WebSocket connection; subscribes to `/topic/metrics/{serverId}`, `/topic/alerts/{serverId}`, `/user/queue/alerts` for real-time updates
- `use-toast` — Toast notification management
- `use-mobile` — Responsive viewport detection

#### API Client Layer (`src/lib/api.ts`)

- Centralized HTTP client with auto JWT header injection
- TypeScript interfaces for all data types (`Server`, `Metric`, `Alert`, `AlertRule`, `User`)
- API modules: `authApi`, `serverApi`, `alertApi`, `metricsApi`
- Configurable base URL (stored in localStorage)

#### UI Library — 40+ shadcn/ui components

Includes: `Button`, `Card`, `Dialog`, `Table`, `Form`, `Input`, `Select`, `Badge`, `Toast`, `Dropdown`, `Tabs`, `Sheet`, `Sidebar`, `Skeleton`, `Progress`, `Chart`, and more.

---

### C. Agent Component (Bash)

| Script | Purpose |
|---|---|
| `argus-agent.sh` | Main agent — collects 12 system metrics (CPU, memory, disk, network I/O, load average, uptime, process count) using Linux tools (`top`, `free`, `df`, `ip`, `ps`) and POSTs JSON to `/api/v1/metrics/ingest` |
| `argus-agent-loop.sh` | Continuous loop version — runs the agent on a configurable interval |
| `argus-agent-test.sh` | Test version for development/debugging |

---

### D. External Service Integrations

| Service | Purpose | Protocol / Library |
|---|---|---|
| **MySQL 8.0** | Primary relational database (8 tables) | Spring Data JPA + Hibernate |
| **Redis 7.0** | Rate limiting, caching | Spring Data Redis |
| **Twilio** | SMS alert notifications | Twilio SDK 10.1.0 |
| **SMTP (Gmail)** | Email notifications + verification emails | Spring Mail (JavaMailSender) |
| **WebSocket** | Real-time dashboard updates | STOMP over SockJS |

---

### Summary — Component Count

| Layer | Count |
|---|---|
| Backend Controllers | 6 |
| Backend Services | 16 |
| Backend Repositories | 8 |
| Backend Entities | 8 |
| Backend DTOs | 13 (6 request + 7 response) |
| Backend Config / Cross-cutting | 11 |
| Frontend Pages | 20 |
| Frontend Custom Components | 7 |
| Frontend Layout Components | 2 |
| Frontend Contexts | 2 |
| Frontend Hooks | 3 |
| Frontend UI Library Components | 40+ |
| Agent Scripts | 3 |
| External Integrations | 5 |
| **Total** | **~145 components** |
