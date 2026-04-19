# Assignment 9 - Test Plan, Test Cases and Defects

Course: CS 331 (Software Engineering Lab)  
Project: Argus (Server Monitoring System)  
Team: NightsWatch

---

## Q1(a). Test Plan [5]

### Why we are testing

We want to make sure the main things in Argus actually work for a normal user — login, adding a server, the agent posting metrics, and alerts firing correctly. Catching problems early so they don't reach the deployed app.

### What is being tested (scope)

1. Authentication — register, login, email verification, password reset.
2. Server management — add, edit, view, delete a server.
3. Metrics ingestion — agent posting metrics, latest metrics on the dashboard.
4. Alert rules and alerts — creating a rule, firing on threshold, resolving.
5. Notifications — email and SMS sent based on user preferences.
6. Frontend pages — Dashboard, Servers, Server Detail, Alerts, Settings.

Out of scope: real third-party services like the actual SMTP and Twilio gateway (we only test our side).

### Types of testing

- **Unit testing** — small Java service methods (JUnit + Mockito).
- **Integration / API testing** — controller → service → DB through `curl`/Postman.
- **System testing** — full flow from frontend to backend to DB.
- **UI testing** — manual checks on key pages.
- **Regression testing** — re-running important tests after every fix.

### Tools

| Purpose | Tool |
| --- | --- |
| Backend tests | JUnit 5 + Mockito + Spring Boot Test |
| Build / test runner | Maven (`./mvnw test`) |
| API testing | `curl`, Postman |
| Database checks | MySQL CLI |
| Frontend / manual UI | Chrome + React DevTools |
| Version control | Git / GitHub |

### Entry criteria

- Code compiles (`./mvnw compile` is green).
- MySQL `argus_db` is up.
- Backend starts cleanly.
- Required env vars (DB, JWT secret, mail config) are set.

### Exit criteria

- All planned test cases executed.
- No High severity bug is open.
- Medium / Low bugs are either fixed or have a clear plan.
- `./mvnw test` is green on `main`.

---

## Q1(b). Test Cases — Server Management module [5]

We picked Server Management because it is the most-used flow in the app. The cases below are also implemented as automated tests in `src/test/java/nightswatch/argus/service/ServerServiceTest.java`.

| ID | Scenario | Input | Expected | Actual | Status |
| --- | --- | --- | --- | --- | --- |
| TC-SM-01 | Register a new server with valid data | name = "web-1", host = "192.168.1.10", os = "Linux" | Server saved, response has generated id and `argus-...` agent key | id=10, key starts with `argus-` | Pass |
| TC-SM-02 | Validation rejects empty server name | `name=""`, `hostAddress="..."` | DTO validation rejects (`@NotBlank`) | 400 validation error | Pass |
| TC-SM-03 | Update with blank name is rejected | name = "   " | `BadRequestException("Server name cannot be empty")` | Same exception thrown | Pass |
| TC-SM-04 | Add server without auth token | Valid payload, no JWT | 401 Unauthorized | 401 Unauthorized | Pass |
| TC-SM-05 | List shows only the user's own servers | Owner has 2 servers | 2 server responses, no other users' data | 2 servers returned | Pass |
| TC-SM-06 | View own server by ID | `getServerById(5L, owner)` (3 active alerts) | Response with id=5, activeAlerts=3 | id=5, activeAlerts=3 | Pass |
| TC-SM-07 | Cannot view another user's server | `getServerById(7L, otherUser)` | "Access denied" | "Access denied" | Pass |
| TC-SM-08 | Edit own server name | name = "web-1-prod" | Entity name updated | Name updated | Pass |
| TC-SM-09 | Delete own server | `deleteServer(8L, owner)` | `repository.delete(server)` called once | Verified by Mockito | Pass |
| TC-SM-10 | Delete a non-existing server | id = 99999 | "Server not found" | "Server not found" | Pass |

---

## Q2(a). Test Execution and Evidence [5]

The cases above were run two ways:

1. **Automated** — JUnit + Mockito tests in `ServerServiceTest.java` and `TwilioSmsServiceUnavailableTest.java`, run with `./mvnw test`.
2. **Manual** — frontend pages (`Servers`, `AddServer`, `EditServer`, `ServerDetail`) and direct `curl` calls.

### Summary

| Type | Total | Pass | Fail |
| --- | --- | --- | --- |
| `ServerServiceTest` (TC-SM-01 to TC-SM-10) | 13 | 13 | 0 |
| `TwilioSmsServiceUnavailableTest` (regression for BUG-003) | 1 | 1 | 0 |
| `ArgusApplicationTests` (Spring context load) | 1 | 1 | 0 |
| **Total backend tests** | **15** | **15** | **0** |

### Evidence 1 — Maven test output

```
[INFO] Running nightswatch.argus.ArgusApplicationTests
[INFO] Tests run: 1, Failures: 0, Errors: 0, Skipped: 0
[INFO] Running nightswatch.argus.service.TwilioSmsServiceUnavailableTest
[INFO] Tests run: 1, Failures: 0, Errors: 0, Skipped: 0
[INFO] Running nightswatch.argus.service.ServerServiceTest
[INFO] Tests run: 13, Failures: 0, Errors: 0, Skipped: 0
[INFO] Results:
[INFO] Tests run: 15, Failures: 0, Errors: 0, Skipped: 0
[INFO] BUILD SUCCESS
```

Surefire reports are saved at `target/surefire-reports/` (one `.txt` and one `.xml` per test class).

### Evidence 2 — log lines from the test run

```
INFO n.argus.service.ServerService -- Registered new server: web-1 with agent key: argus-54476fb0-...
INFO n.argus.service.ServerService -- Deleted server: web-1
INFO n.argus.service.ServerService -- Regenerated agent key for server: web-1
WARN n.argus.service.TwilioSmsService -- Twilio is not available. SMS not sent to: +1******4567
```

### Evidence 3 — sample manual API call (TC-SM-01)

```
$ curl -X POST http://localhost:8080/api/v1/servers \
   -H "Authorization: Bearer <jwt>" \
   -H "Content-Type: application/json" \
   -d '{"name":"web-1","hostAddress":"192.168.1.10","operatingSystem":"Linux"}'

HTTP/1.1 200
{"id":12,"name":"web-1","hostAddress":"192.168.1.10","status":"UNKNOWN","agentKey":"argus-..."}
```

### Evidence 4 — agent script test (cross-device)

```
$ AGENT_KEY=test-key ARGUS_SERVER_URL=http://localhost:8080 bash agent/argus-agent.sh
[Sun Apr 19 20:03:24 IST 2026] Metrics sent successfully (Linux)
```

The script auto-detects the OS and uses the right collectors for Linux or macOS. Windows is covered by `argus-agent.ps1`.

### UI evidence (manual)

- `Servers` page shows the new `web-1` after TC-SM-01.
- `AddServer` page shows a validation error when name is empty (TC-SM-02).
- `ServerDetail` shows the updated name after TC-SM-08.

Screenshots are kept in the team submission folder under `evidence/`.

---

## Q2(b). Defects Identified — and Fixed [5]

While running the tests above and doing some exploratory testing, we found three defects. All three have now been fixed and a regression test was added where it makes sense.

### Bug 1

- **Bug ID:** BUG-001
- **Description:** When a server is deleted, related rows in `metrics`, `alerts` and `alert_rules` were not always removed cleanly. If the user immediately re-added a server with the same name, the dashboard could briefly show old data.
- **Steps to reproduce:**
  1. Login as a user with at least one server having metrics/alerts.
  2. Delete the server from the `Servers` page.
  3. Add a new server with the same name.
  4. Open the Dashboard.
- **Expected vs Actual:**
  - Expected: Dashboard shows no metrics/alerts for the new server.
  - Actual: Old alerts/metric values appeared for a few seconds.
- **Severity:** Medium
- **Fix applied:**
  - Added `orphanRemoval = true` to the `Server` entity's `metrics`, `alertRules` and `alerts` collections (`src/main/java/nightswatch/argus/entity/Server.java`).
  - In `ServerService.deleteServer` we now `flush()` the delete inside the transaction and broadcast a `{ deleted: true }` WebSocket event so the frontend drops cached data immediately.
- **Status:** Fixed

### Bug 2

- **Bug ID:** BUG-002
- **Description:** On the Login page, the error toast sometimes showed up empty and stayed on screen too long when the backend returned an empty error body.
- **Steps to reproduce:**
  1. Open the Login page.
  2. Enter an unregistered email and any password.
  3. Click Login.
- **Expected vs Actual:**
  - Expected: Clear toast like "Invalid email or password".
  - Actual: Sometimes empty toast / lingered too long.
- **Severity:** Low
- **Fix applied:** In `Argus_Frontend/src/pages/Login.tsx`, we now use the server-side message when present and fall back to a default `"Invalid email/username or password."` if it's empty. Toast `duration` is capped at 4000 ms.
- **Status:** Fixed

### Bug 3

- **Bug ID:** BUG-003
- **Description:** When a user enabled SMS alerts but no SMS provider was configured, the SMS silently failed. The `notifications` row got marked as `SENT` and the user thought SMS was being delivered, but nothing actually went out.
- **Steps to reproduce:**
  1. Disable / leave Twilio config empty.
  2. Login, go to Settings, enable SMS, save a phone number.
  3. Trigger an alert (lower a threshold and let the agent post metrics).
- **Expected vs Actual:**
  - Expected: User sees a clear "SMS could not be sent" indication.
  - Actual: Email went out, SMS quietly failed in logs only.
- **Severity:** High
- **Fix applied:** `TwilioSmsService.sendSms` now throws `SmsDeliveryException("...not configured...", "SERVICE_UNAVAILABLE", ...)` when the provider is unavailable, after still saving the failed `SmsLog`. `NotificationService.sendSms` already catches this and marks the corresponding `Notification` row as `FAILED` with the reason. Added a regression test: `TwilioSmsServiceUnavailableTest`.
- **Status:** Fixed

### Defect summary

| Severity | Count | Status |
| --- | --- | --- |
| High | 1 | Fixed |
| Medium | 1 | Fixed |
| Low | 1 | Fixed |

---

## Extra issues found during the security/portability review

While doing exploratory testing we also looked at a few other places. The smaller issues found and fixed:

| ID | Area | Issue | Fix |
| --- | --- | --- | --- |
| EX-01 | `MetricIngestionController.ingestMetrics` | The catch block returned `e.getMessage()` directly, which could leak internal exception text (entity names, SQL hints) to anyone who can hit the endpoint. | Now logs the real reason server-side and returns a generic `"Failed to ingest metrics"` (or `"Invalid agent key"` with HTTP 401 for that specific case). |
| EX-02 | `agent/argus-agent.sh` | Linux-only; would silently produce malformed JSON if a tool was missing (e.g. `mpstat`, `ip`), and counted one extra process because of the `ps` header line. | Rewrote the script to detect the OS (`Linux` / `Darwin`), use the right collectors per OS, default missing values to `0` (so JSON is always valid), fix the off-by-one process count, and exit non-zero on send failure so cron jobs notice. |
| EX-03 | `agent/argus-agent.ps1` | Already covers Windows — verified that the metric payload structure matches the backend (`MetricPayload`). | No code change needed; documented in the test plan. |

### Cross-device check for the agent

| OS | Script | Result |
| --- | --- | --- |
| Linux (Ubuntu 22.04) | `argus-agent.sh` | Works. Verified with `bash -n` (syntax OK) and a live run that built valid JSON and sent it (or reported a clean error when backend was down). |
| macOS (Darwin) | `argus-agent.sh` | Same script, automatically takes the macOS branch. Uses `sysctl`, `vm_stat`, `route`, `netstat` — verified by code review (no Linux-only commands run). |
| Windows | `argus-agent.ps1` | Covered separately by the existing PowerShell agent. Payload schema matches backend. |

---

## Short conclusion

A simple, focused test plan was prepared. Ten test cases for Server Management were written and implemented as 13 automated JUnit + Mockito tests, plus 1 regression test for the SMS fix. Full backend suite: **15 tests, 0 failures, 0 errors**. Three documented defects (1 High, 1 Medium, 1 Low) were fixed, and a couple of extra issues caught during the same review (info-leak in metric ingestion, non-portable agent script) were also addressed.
