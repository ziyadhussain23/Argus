# Software Requirements Specification — Argus

**Project:** Argus — Continuous Monitoring & Alert Automation System
**Document Type:** Pre-implementation SRS
**Version:** 1.0

---

## 1. Project Overview

Argus is a real-time monitoring platform that tracks the health, performance, and availability of distributed servers. Lightweight agents installed on client machines will collect system metrics (CPU, memory, disk, network) and push them to a central server. The server will store the data, evaluate it against user-defined alert rules, and notify stakeholders through email when thresholds are breached. A web dashboard will visualize live and historical metrics.

---

## 2. Scope

| In Scope | Out of Scope |
|----------|--------------|
| Host-level metric collection (CPU, Memory, Disk, Network) | Application-level tracing (APM) |
| Threshold-based alerting | Auto-remediation |
| Email notifications | Mobile applications |
| Web dashboard with live charts | Multi-region clustering |
| User authentication and roles | Custom query language |

---

## 3. Functional Requirements

### 3.1 User Management
- **FR-1.1** The system shall allow users to register with email and password.
- **FR-1.2** The system shall authenticate users and issue a session token on login.
- **FR-1.3** The system shall support two roles: `ADMIN` and `USER`.

### 3.2 Server Registration
- **FR-2.1** Admins shall register servers to be monitored.
- **FR-2.2** Each registered server shall be issued a unique token used by its agent.
- **FR-2.3** Admins shall view, update, and remove registered servers.

### 3.3 Metric Ingestion
- **FR-3.1** The system shall expose a REST endpoint to receive metric payloads from agents.
- **FR-3.2** Each payload shall include: server identifier, CPU %, memory %, disk %, network I/O, and timestamp.
- **FR-3.3** Incoming metrics shall be authenticated using the agent token.

### 3.4 Real-Time Dashboard
- **FR-4.1** The dashboard shall display live metrics for all registered servers.
- **FR-4.2** Live updates shall be pushed to the browser without manual refresh (WebSocket).
- **FR-4.3** A per-server view shall display time-series charts for recent history.

### 3.5 Heartbeat / Uptime
- **FR-5.1** A server shall be marked `OFFLINE` if no metrics are received within a configurable interval (default 60s).
- **FR-5.2** An offline transition shall generate an alert.

### 3.6 Alert Rule Engine
- **FR-6.1** Users shall define rules consisting of: metric, comparison operator, threshold, and severity (`INFO`, `WARNING`, `CRITICAL`).
- **FR-6.2** Rules shall be evaluated on each ingested metric.
- **FR-6.3** Triggered alerts shall be persisted and viewable in an alert history.

### 3.7 Notifications
- **FR-7.1** The system shall send email notifications when an alert is triggered.
- **FR-7.2** Failed email deliveries shall be retried.

### 3.8 History
- **FR-8.1** Users shall view historical metrics and past alerts, filterable by server and date range.

---

## 4. Non-Functional Requirements

| ID | Category | Requirement |
|----|----------|-------------|
| NFR-1 | Latency | Time from threshold breach to alert dispatch ≤ 5 seconds. |
| NFR-2 | Scalability | Support metrics from at least 20 concurrent agents without data loss. |
| NFR-3 | Availability | The monitoring server shall remain available even if monitored hosts crash. |
| NFR-4 | Persistence | Metric data shall be retained for at least 24 hours for trend analysis. |
| NFR-5 | Security | Passwords shall be hashed; API access shall require authentication. |
| NFR-6 | Usability | The dashboard shall be responsive and usable on standard desktop browsers. |
| NFR-7 | Reliability | The system shall recover gracefully from temporary database or network failures. |

---

## 5. System Constraints

- **Backend:** Java + Spring Boot.
- **Frontend:** React (single-page web application).
- **Database:** Relational database for persistent storage.
- **Cache / Real-time:** In-memory store for live state.
- **Agents:** Lightweight scripts compatible with Linux, macOS, and Windows hosts.
- **Communication:** HTTPS for agent → server; WebSocket for server → dashboard.

---

## 6. Assumptions

- Monitored hosts have outbound network access to the Argus server.
- Valid SMTP credentials are available for sending email notifications.
- Agent and server clocks are reasonably synchronized.
